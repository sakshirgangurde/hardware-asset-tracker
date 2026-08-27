import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { employeeSchema } from "@/lib/validations";
import { MOCK_EMPLOYEES } from "@/lib/mockData";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const location = searchParams.get("location") || "";
    const status = searchParams.get("status") || "";
    const department = searchParams.get("department") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
        { department: { contains: search } },
      ];
    }

    if (location && location !== "ALL") {
      where.officeLocation = location;
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (department && department !== "ALL") {
      where.department = department;
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        assets: {
          where: { status: { notIn: ["SCRAPPED", "LOST"] } },
          select: {
            id: true,
            assetTag: true,
            name: true,
            category: true,
            brand: true,
            model: true,
            status: true,
          },
        },
        _count: {
          select: {
            assets: true,
            assignments: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ employees });
  } catch (error) {
    console.error("Fetch employees error, using fallback dataset:", error);
    const mapped = MOCK_EMPLOYEES.map((e) => ({
      ...e,
      assets: [],
    }));
    return NextResponse.json({ employees: mapped });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = employeeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check unique email
    const existing = await prisma.employee.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: `Employee with email "${data.email}" already exists.` },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        email: data.email,
        department: data.department,
        officeLocation: data.officeLocation,
        status: data.status,
        startDate: data.startDate,
        endDate: data.endDate,
        notes: data.notes,
      },
    });

    return NextResponse.json({ success: true, employee }, { status: 201 });
  } catch (error) {
    console.error("Create employee error:", error);
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
