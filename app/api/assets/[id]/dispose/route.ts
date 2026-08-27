import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { disposalSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsed = disposalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { disposalDate, disposalReason, notes } = parsed.data;

    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const newStatus =
      disposalReason === "LOST" || disposalReason === "STOLEN"
        ? "LOST"
        : "SCRAPPED";

    const result = await prisma.$transaction(async (tx) => {
      // Close open assignments if any
      await tx.assignmentHistory.updateMany({
        where: {
          assetId: params.id,
          returnedDate: null,
        },
        data: {
          returnedDate: disposalDate,
          notes: `Closed due to asset disposal/loss (${disposalReason}): ${notes || "No notes"}`,
        },
      });

      // Record disposal
      const disposal = await tx.disposalRecord.create({
        data: {
          assetId: params.id,
          disposalDate,
          disposalReason,
          notes,
        },
      });

      // Update asset status
      const updatedAsset = await tx.asset.update({
        where: { id: params.id },
        data: {
          status: newStatus,
          employeeId: null,
        },
        include: {
          employee: true,
          disposals: true,
        },
      });

      return { disposal, asset: updatedAsset };
    });

    return NextResponse.json({
      success: true,
      message: `Asset marked as ${newStatus} with audit disposal record.`,
      disposal: result.disposal,
      asset: result.asset,
    });
  } catch (error) {
    console.error("Dispose asset error:", error);
    return NextResponse.json(
      { error: "Failed to process asset disposal" },
      { status: 500 }
    );
  }
}
