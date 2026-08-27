import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "all_assets";
    const location = searchParams.get("location") || "ALL";

    const locFilter = location !== "ALL" ? { officeLocation: location } : {};

    if (type === "all_assets") {
      const assets = await prisma.asset.findMany({
        where: { ...locFilter },
        include: {
          employee: {
            select: { name: true, email: true, department: true },
          },
        },
        orderBy: { assetTag: "asc" },
      });
      return NextResponse.json({ reportType: type, data: assets });
    }

    if (type === "expiring_warranties") {
      const days = parseInt(searchParams.get("days") || "90", 10);
      const now = new Date();
      const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

      const assets = await prisma.asset.findMany({
        where: {
          ...locFilter,
          status: { notIn: ["SCRAPPED", "LOST"] },
          warrantyExpiry: { gte: now, lte: targetDate },
        },
        include: {
          employee: {
            select: { name: true, email: true, department: true },
          },
        },
        orderBy: { warrantyExpiry: "asc" },
      });
      return NextResponse.json({ reportType: type, days, data: assets });
    }

    if (type === "assignment_ledger") {
      const assignments = await prisma.assignmentHistory.findMany({
        include: {
          asset: {
            select: {
              assetTag: true,
              name: true,
              category: true,
              brand: true,
              model: true,
              officeLocation: true,
            },
          },
          employee: {
            select: {
              name: true,
              email: true,
              department: true,
              officeLocation: true,
            },
          },
        },
        orderBy: { assignedDate: "desc" },
      });

      const filtered =
        location !== "ALL"
          ? assignments.filter((a) => a.asset?.officeLocation === location)
          : assignments;

      return NextResponse.json({ reportType: type, data: filtered });
    }

    if (type === "maintenance_history") {
      const logs = await prisma.maintenanceLog.findMany({
        include: {
          asset: {
            select: {
              assetTag: true,
              name: true,
              category: true,
              brand: true,
              model: true,
              officeLocation: true,
            },
          },
        },
        orderBy: { dateReported: "desc" },
      });

      const filtered =
        location !== "ALL"
          ? logs.filter((l) => l.asset?.officeLocation === location)
          : logs;

      return NextResponse.json({ reportType: type, data: filtered });
    }

    if (type === "disposal_audit") {
      const disposals = await prisma.disposalRecord.findMany({
        include: {
          asset: {
            select: {
              assetTag: true,
              name: true,
              category: true,
              brand: true,
              model: true,
              officeLocation: true,
              purchaseDate: true,
            },
          },
        },
        orderBy: { disposalDate: "desc" },
      });

      const filtered =
        location !== "ALL"
          ? disposals.filter((d) => d.asset?.officeLocation === location)
          : disposals;

      return NextResponse.json({ reportType: type, data: filtered });
    }

    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  } catch (error) {
    console.error("Generate report error:", error);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}
