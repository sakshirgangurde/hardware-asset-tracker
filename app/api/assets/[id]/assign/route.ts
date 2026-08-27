import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignAssetSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsed = assignAssetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { employeeId, notes } = parsed.data;

    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    if (asset.status === "SCRAPPED" || asset.status === "LOST") {
      return NextResponse.json(
        { error: `Cannot assign an asset with status ${asset.status}` },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Target employee not found" },
        { status: 404 }
      );
    }

    if (employee.status === "OFFBOARDED") {
      return NextResponse.json(
        { error: "Cannot assign hardware to an offboarded employee" },
        { status: 400 }
      );
    }

    // Execute atomic assignment transaction:
    // 1. Close any existing open assignment for this asset
    // 2. Open new assignment record
    // 3. Update asset status to IN_USE, employeeId to target employee, and match office location if applicable
    const result = await prisma.$transaction(async (tx) => {
      await tx.assignmentHistory.updateMany({
        where: {
          assetId: params.id,
          returnedDate: null,
        },
        data: {
          returnedDate: new Date(),
          notes: "Closed due to reassignment to " + employee.name,
        },
      });

      const assignment = await tx.assignmentHistory.create({
        data: {
          assetId: params.id,
          employeeId: employee.id,
          assignedDate: new Date(),
          notes: notes || `Assigned to ${employee.name} (${employee.department})`,
        },
      });

      const updatedAsset = await tx.asset.update({
        where: { id: params.id },
        data: {
          status: "IN_USE",
          employeeId: employee.id,
          officeLocation: employee.officeLocation, // sync location to employee office
        },
        include: {
          employee: true,
        },
      });

      return { updatedAsset, assignment };
    });

    return NextResponse.json({
      success: true,
      asset: result.updatedAsset,
      assignment: result.assignment,
    });
  } catch (error) {
    console.error("Assign asset error:", error);
    return NextResponse.json(
      { error: "Failed to assign asset" },
      { status: 500 }
    );
  }
}
