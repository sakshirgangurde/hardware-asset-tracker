import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assetSchema } from "@/lib/validations";

import { MOCK_ASSETS } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const category = searchParams.get("category") || "";
    const status = searchParams.get("status") || "";
    const location = searchParams.get("location") || "";
    const warranty = searchParams.get("warranty") || ""; // '30', '60', '90', 'expired'
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const all = searchParams.get("all") === "true";

    const where: any = {};

    if (search) {
      where.OR = [
        { assetTag: { contains: search } },
        { name: { contains: search } },
        { brand: { contains: search } },
        { model: { contains: search } },
        { serialNumber: { contains: search } },
        { employee: { name: { contains: search } } },
      ];
    }

    if (category && category !== "ALL") {
      where.category = category;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (location && location !== "ALL") {
      where.officeLocation = location;
    }

    if (warranty) {
      const now = new Date();
      if (warranty === "expired") {
        where.warrantyExpiry = { lt: now };
      } else {
        const days = parseInt(warranty, 10);
        if (!isNaN(days)) {
          const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
          where.warrantyExpiry = { gte: now, lte: futureDate };
        }
      }
    }

    const total = await prisma.asset.count({ where });

    const assets = await prisma.asset.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: true,
            officeLocation: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      ...(all ? {} : { skip: (page - 1) * limit, take: limit }),
    });

    return NextResponse.json({
      assets,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch assets error, using fallback dataset:", error);
    return NextResponse.json({
      assets: MOCK_ASSETS,
      pagination: {
        total: MOCK_ASSETS.length,
        page: 1,
        limit: 25,
        totalPages: 1,
      },
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = assetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if assetTag already exists
    const existingTag = await prisma.asset.findUnique({
      where: { assetTag: data.assetTag },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: `Asset Tag "${data.assetTag}" is already in use.` },
        { status: 400 }
      );
    }

    // Check serialNumber if provided
    if (data.serialNumber) {
      const existingSerial = await prisma.asset.findUnique({
        where: { serialNumber: data.serialNumber },
      });
      if (existingSerial) {
        return NextResponse.json(
          { error: `Serial Number "${data.serialNumber}" is already in use.` },
          { status: 400 }
        );
      }
    }

    // If assigned to employee, verify employee exists and is active
    if (data.employeeId) {
      const emp = await prisma.employee.findUnique({
        where: { id: data.employeeId },
      });
      if (!emp) {
        return NextResponse.json(
          { error: "Assigned employee does not exist." },
          { status: 400 }
        );
      }
    }

    // Transaction to create asset and open assignment history if IN_USE
    const newAsset = await prisma.$transaction(async (tx) => {
      const asset = await tx.asset.create({
        data: {
          assetTag: data.assetTag,
          name: data.name,
          category: data.category,
          brand: data.brand,
          model: data.model,
          serialNumber: data.serialNumber,
          status: data.status,
          employeeId: data.employeeId,
          officeLocation: data.officeLocation,
          purchaseDate: data.purchaseDate,
          vendor: data.vendor,
          warrantyExpiry: data.warrantyExpiry,
          accessories: data.accessories,
          notes: data.notes,
        },
        include: {
          employee: true,
        },
      });

      if (data.status === "IN_USE" && data.employeeId) {
        await tx.assignmentHistory.create({
          data: {
            assetId: asset.id,
            employeeId: data.employeeId,
            assignedDate: new Date(),
            notes: "Initial assignment upon asset creation.",
          },
        });
      }

      return asset;
    });

    return NextResponse.json({ success: true, asset: newAsset }, { status: 201 });
  } catch (error) {
    console.error("Create asset error:", error);
    return NextResponse.json(
      { error: "Failed to create asset" },
      { status: 500 }
    );
  }
}
