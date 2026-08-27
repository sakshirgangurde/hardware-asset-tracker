import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { returnAssetSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json().catch(() => ({}));
    const parsed = returnAssetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { notes, newLocation } = parsed.data;

    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: { employee: true },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const previousEmployeeName = asset.employee?.name || "Employee";

    const updatedAsset = await prisma.$transaction(async (tx) => {
      // Close any open assignments for this asset
      await tx.assignmentHistory.updateMany({
        where: {
          assetId: params.id,
          returnedDate: null,
        },
        data: {
          returnedDate: new Date(),
          notes: notes
            ? `Returned by ${previousEmployeeName}: ${notes}`
            : `Returned by ${previousEmployeeName} into stock inventory.`,
        },
      });

      return await tx.asset.update({
        where: { id: params.id },
        data: {
          status: "IN_STOCK",
          employeeId: null,
          officeLocation: newLocation || asset.officeLocation,
        },
        include: {
          employee: true,
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: `Asset returned to stock inventory.`,
      asset: updatedAsset,
    });
  } catch (error) {
    console.error("Return asset error:", error);
    return NextResponse.json(
      { error: "Failed to return asset" },
      { status: 500 }
    );
  }
}
