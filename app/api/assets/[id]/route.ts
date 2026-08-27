import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assetSchema } from "@/lib/validations";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: {
        employee: true,
        assignments: {
          include: {
            employee: {
              select: {
                id: true,
                name: true,
                email: true,
                department: true,
                officeLocation: true,
              },
            },
          },
          orderBy: { assignedDate: "desc" },
        },
        maintenance: {
          orderBy: { dateReported: "desc" },
        },
        disposals: {
          orderBy: { disposalDate: "desc" },
        },
      },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    return NextResponse.json(asset);
  } catch (error) {
    console.error("Get asset detail error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve asset details" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsed = assetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const currentAsset = await prisma.asset.findUnique({
      where: { id: params.id },
    });

    if (!currentAsset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const data = parsed.data;

    // Check unique tag uniqueness if changed
    if (data.assetTag !== currentAsset.assetTag) {
      const existingTag = await prisma.asset.findUnique({
        where: { assetTag: data.assetTag },
      });
      if (existingTag) {
        return NextResponse.json(
          { error: `Asset tag "${data.assetTag}" is already used.` },
          { status: 400 }
        );
      }
    }

    // Check unique serial if changed
    if (data.serialNumber && data.serialNumber !== currentAsset.serialNumber) {
      const existingSerial = await prisma.asset.findUnique({
        where: { serialNumber: data.serialNumber },
      });
      if (existingSerial) {
        return NextResponse.json(
          { error: `Serial number "${data.serialNumber}" is already in use.` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.$transaction(async (tx) => {
      // If assignment employee changed
      const oldEmpId = currentAsset.employeeId;
      const newEmpId = data.employeeId;

      if (oldEmpId !== newEmpId) {
        // Close old open assignment if exists
        if (oldEmpId) {
          await tx.assignmentHistory.updateMany({
            where: {
              assetId: params.id,
              employeeId: oldEmpId,
              returnedDate: null,
            },
            data: {
              returnedDate: new Date(),
              notes: "Automatic closure due to asset reassignment/edit.",
            },
          });
        }

        // If new employee assigned and status is IN_USE, open new assignment
        if (newEmpId && data.status === "IN_USE") {
          await tx.assignmentHistory.create({
            data: {
              assetId: params.id,
              employeeId: newEmpId,
              assignedDate: new Date(),
              notes: "Assigned via asset edit update.",
            },
          });
        }
      }

      const assetRecord = await tx.asset.update({
        where: { id: params.id },
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

      return assetRecord;
    });

    return NextResponse.json({ success: true, asset: updated });
  } catch (error) {
    console.error("Update asset error:", error);
    return NextResponse.json(
      { error: "Failed to update asset" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    await prisma.asset.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true, message: "Asset deleted successfully" });
  } catch (error) {
    console.error("Delete asset error:", error);
    return NextResponse.json(
      { error: "Failed to delete asset" },
      { status: 500 }
    );
  }
}
