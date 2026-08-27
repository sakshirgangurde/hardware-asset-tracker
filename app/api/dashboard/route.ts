import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
    const in90Days = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

    const [
      totalAssets,
      inUseAssets,
      inStockAssets,
      underRepairAssets,
      scrappedAssets,
      lostAssets,
      activeEmployees,
      warranties30,
      warranties60,
      warranties90,
      offboardedWithAssetsRaw,
      categoryGroups,
      locationGroups,
      recentAssignments,
      recentMaintenance,
      recentDisposals,
    ] = await Promise.all([
      // Status counts
      prisma.asset.count(),
      prisma.asset.count({ where: { status: "IN_USE" } }),
      prisma.asset.count({ where: { status: "IN_STOCK" } }),
      prisma.asset.count({ where: { status: "UNDER_REPAIR" } }),
      prisma.asset.count({ where: { status: "SCRAPPED" } }),
      prisma.asset.count({ where: { status: "LOST" } }),

      // Active employees
      prisma.employee.count({ where: { status: "ACTIVE" } }),

      // Warranty expirations (only for non-scrapped/non-lost assets)
      prisma.asset.count({
        where: {
          status: { notIn: ["SCRAPPED", "LOST"] },
          warrantyExpiry: { gte: now, lte: in30Days },
        },
      }),
      prisma.asset.count({
        where: {
          status: { notIn: ["SCRAPPED", "LOST"] },
          warrantyExpiry: { gte: now, lte: in60Days },
        },
      }),
      prisma.asset.count({
        where: {
          status: { notIn: ["SCRAPPED", "LOST"] },
          warrantyExpiry: { gte: now, lte: in90Days },
        },
      }),

      // Offboarded employees who still have assets assigned
      prisma.employee.findMany({
        where: {
          status: "OFFBOARDED",
          assets: { some: { status: { notIn: ["SCRAPPED", "LOST"] } } },
        },
        include: {
          assets: {
            where: { status: { notIn: ["SCRAPPED", "LOST"] } },
            select: {
              id: true,
              assetTag: true,
              name: true,
              category: true,
            },
          },
        },
      }),

      // Category breakdown
      prisma.asset.groupBy({
        by: ["category"],
        _count: { id: true },
      }),

      // Location breakdown
      prisma.asset.groupBy({
        by: ["officeLocation", "status"],
        _count: { id: true },
      }),

      // Recent Assignments
      prisma.assignmentHistory.findMany({
        take: 5,
        orderBy: { assignedDate: "desc" },
        include: {
          asset: { select: { assetTag: true, name: true } },
          employee: { select: { name: true } },
        },
      }),

      // Recent Maintenance
      prisma.maintenanceLog.findMany({
        take: 5,
        orderBy: { dateReported: "desc" },
        include: {
          asset: { select: { assetTag: true, name: true } },
        },
      }),

      // Recent Disposals
      prisma.disposalRecord.findMany({
        take: 5,
        orderBy: { disposalDate: "desc" },
        include: {
          asset: { select: { assetTag: true, name: true } },
        },
      }),
    ]);

    // Format offboarded with unreturned assets
    const formattedOffboarded = offboardedWithAssetsRaw.map((emp) => ({
      employeeId: emp.id,
      employeeName: emp.name,
      employeeEmail: emp.email,
      officeLocation: emp.officeLocation,
      unreturnedCount: emp.assets.length,
      assets: emp.assets,
    }));

    // Format location breakdown
    const locationsMap: Record<string, { location: string; total: number; inUse: number; inStock: number }> = {
      HYD: { location: "HYD", total: 0, inUse: 0, inStock: 0 },
      MUM: { location: "MUM", total: 0, inUse: 0, inStock: 0 },
    };

    locationGroups.forEach((item) => {
      const loc = item.officeLocation;
      if (locationsMap[loc]) {
        locationsMap[loc].total += item._count.id;
        if (item.status === "IN_USE") locationsMap[loc].inUse += item._count.id;
        if (item.status === "IN_STOCK") locationsMap[loc].inStock += item._count.id;
      }
    });

    // Format activities
    const recentActivities: Array<{
      id: string;
      type: "assignment" | "return" | "maintenance" | "disposal";
      timestamp: Date;
      description: string;
      assetTag: string;
      assetName: string;
      employeeName?: string;
    }> = [];

    recentAssignments.forEach((item) => {
      if (item.returnedDate) {
        recentActivities.push({
          id: `ret-${item.id}`,
          type: "return",
          timestamp: item.returnedDate,
          description: `Asset returned from ${item.employee?.name || "Employee"}`,
          assetTag: item.asset?.assetTag || "",
          assetName: item.asset?.name || "",
          employeeName: item.employee?.name,
        });
      }
      recentActivities.push({
        id: `asg-${item.id}`,
        type: "assignment",
        timestamp: item.assignedDate,
        description: `Assigned to ${item.employee?.name || "Employee"}`,
        assetTag: item.asset?.assetTag || "",
        assetName: item.asset?.name || "",
        employeeName: item.employee?.name,
      });
    });

    recentMaintenance.forEach((item) => {
      recentActivities.push({
        id: `maint-${item.id}`,
        type: "maintenance",
        timestamp: item.dateReported,
        description: `Maintenance logged: ${item.issueDescription.substring(0, 45)}...`,
        assetTag: item.asset?.assetTag || "",
        assetName: item.asset?.name || "",
      });
    });

    recentDisposals.forEach((item) => {
      recentActivities.push({
        id: `disp-${item.id}`,
        type: "disposal",
        timestamp: item.disposalDate,
        description: `Asset disposed (${item.disposalReason.replace(/_/g, " ")})`,
        assetTag: item.asset?.assetTag || "",
        assetName: item.asset?.name || "",
      });
    });

    recentActivities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      totalAssets,
      inUse: inUseAssets,
      inStock: inStockAssets,
      underRepair: underRepairAssets,
      scrapped: scrappedAssets,
      lost: lostAssets,
      activeEmployees,
      warrantiesExpiring30Days: warranties30,
      warrantiesExpiring60Days: warranties60,
      warrantiesExpiring90Days: warranties90,
      offboardedWithUnreturnedAssets: formattedOffboarded,
      categoryBreakdown: categoryGroups.map((g) => ({
        category: g.category,
        count: g._count.id,
      })),
      locationBreakdown: Object.values(locationsMap),
      recentActivity: recentActivities.slice(0, 8),
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard metrics" },
      { status: 500 }
    );
  }
}
