import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "No items provided for import" },
        { status: 400 }
      );
    }

    // Fetch existing tags to prevent collisions
    const existingAssets = await prisma.asset.findMany({
      select: { assetTag: true },
    });
    const existingTags = new Set(existingAssets.map((a) => a.assetTag.toUpperCase()));

    // Fetch all active employees to resolve employeeEmail -> employeeId
    const activeEmployees = await prisma.employee.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, email: true },
    });
    const employeeMap = new Map(
      activeEmployees.map((e) => [e.email.toLowerCase(), e.id])
    );

    const validToInsert: any[] = [];
    const errors: { row: number; tag: string; error: string }[] = [];

    items.forEach((item: any, idx: number) => {
      const rowNumber = item.rowNumber || idx + 1;
      const tag = (item.assetTag || "").trim().toUpperCase();

      if (!tag) {
        errors.push({ row: rowNumber, tag: "N/A", error: "Missing asset tag" });
        return;
      }

      if (existingTags.has(tag)) {
        errors.push({ row: rowNumber, tag, error: `Asset tag ${tag} already exists` });
        return;
      }

      let employeeId: string | null = null;
      if (item.status === "IN_USE" && item.employeeEmail) {
        employeeId = employeeMap.get(item.employeeEmail.toLowerCase()) || null;
        if (!employeeId) {
          errors.push({
            row: rowNumber,
            tag,
            error: `Active employee with email "${item.employeeEmail}" not found`,
          });
          return;
        }
      }

      validToInsert.push({
        assetTag: item.assetTag.trim(),
        name: item.name.trim(),
        category: item.category,
        brand: item.brand.trim(),
        model: item.model.trim(),
        serialNumber: item.serialNumber?.trim() || null,
        status: item.status || "IN_STOCK",
        employeeId,
        officeLocation: item.officeLocation || "HYD",
        purchaseDate: new Date(item.purchaseDate),
        vendor: item.vendor?.trim() || null,
        warrantyExpiry: new Date(item.warrantyExpiry),
        accessories: item.accessories?.trim() || null,
        notes: item.notes?.trim() || null,
      });

      // Avoid duplicates within the batch
      existingTags.add(tag);
    });

    if (validToInsert.length === 0) {
      return NextResponse.json(
        { error: "No valid rows to import", errors },
        { status: 400 }
      );
    }

    // Insert within transaction
    const createdCount = await prisma.$transaction(async (tx) => {
      let count = 0;
      for (const item of validToInsert) {
        const asset = await tx.asset.create({
          data: item,
        });

        if (item.status === "IN_USE" && item.employeeId) {
          await tx.assignmentHistory.create({
            data: {
              assetId: asset.id,
              employeeId: item.employeeId,
              assignedDate: new Date(),
              notes: "Imported via CSV batch.",
            },
          });
        }
        count++;
      }
      return count;
    });

    return NextResponse.json({
      success: true,
      importedCount: createdCount,
      errorsCount: errors.length,
      errors,
    });
  } catch (error) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { error: "Failed to process CSV import" },
      { status: 500 }
    );
  }
}
