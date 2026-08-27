import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { maintenanceSchema } from "@/lib/validations";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const parsed = maintenanceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { dateReported, issueDescription, sentTo, dateReturned, outcome, performedBy } =
      parsed.data;

    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
    });

    if (!asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create log
      const log = await tx.maintenanceLog.create({
        data: {
          assetId: params.id,
          dateReported,
          issueDescription,
          sentTo,
          dateReturned,
          outcome,
          performedBy,
        },
      });

      // Update asset status based on maintenance outcome
      let newAssetStatus = asset.status;
      if (outcome === "PENDING") {
        newAssetStatus = "UNDER_REPAIR";
      } else if (outcome === "REPAIRED") {
        newAssetStatus = asset.employeeId ? "IN_USE" : "IN_STOCK";
      } else if (outcome === "UNREPAIRABLE") {
        newAssetStatus = "SCRAPPED";
      }

      const updatedAsset = await tx.asset.update({
        where: { id: params.id },
        data: { status: newAssetStatus },
      });

      return { log, asset: updatedAsset };
    });

    return NextResponse.json({
      success: true,
      maintenanceLog: result.log,
      asset: result.asset,
    });
  } catch (error) {
    console.error("Create maintenance log error:", error);
    return NextResponse.json(
      { error: "Failed to record maintenance log" },
      { status: 500 }
    );
  }
}
