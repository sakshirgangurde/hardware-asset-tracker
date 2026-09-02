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

    // Fetch existing tags to know which exist
    const existingAssets = await prisma.asset.findMany({
      select: { id: true, assetTag: true },
    });
    const existingTagMap = new Map(
      existingAssets.map((a) => [a.assetTag.toUpperCase().trim(), a.id])
    );

    // Fetch all employees for auto-linking
    const allEmployees = await prisma.employee.findMany({
      select: { id: true, name: true, email: true },
    });
    const employeeEmailMap = new Map(allEmployees.map((e) => [e.email.toLowerCase(), e.id]));
    const employeeNameMap = new Map(allEmployees.map((e) => [e.name.toLowerCase().trim(), e.id]));

    let createdCount = 0;
    let updatedCount = 0;
    const errors: { row: number; tag: string; error: string }[] = [];

    // Process in batches of 15 for fast parallel execution compatible with Neon pooler
    const BATCH_SIZE = 15;
    for (let i = 0; i < items.length; i += BATCH_SIZE) {
      const chunk = items.slice(i, i + BATCH_SIZE);
      await Promise.all(
        chunk.map(async (item: any, chunkIdx: number) => {
          const rowNumber = item.rowNumber || i + chunkIdx + 1;
          const tag = (item.assetTag || "").trim();

          if (!tag) {
            errors.push({ row: rowNumber, tag: "N/A", error: "Missing asset tag" });
            return;
          }

          let employeeId: string | null = null;

          // 1. Match by email if provided
          if (item.employeeEmail) {
            employeeId = employeeEmailMap.get(item.employeeEmail.toLowerCase()) || null;
          }

          // 2. Match by currentUser name
          if (!employeeId && item.currentUser) {
            const cleanName = item.currentUser.split("\n")[0].replace(/\(.*?\)/g, "").trim().toLowerCase();
            if (cleanName.length > 2 && employeeNameMap.has(cleanName)) {
              employeeId = employeeNameMap.get(cleanName) || null;
            }
          }

          const assetData = {
            assetTag: tag,
            name: item.name?.trim() || `${item.brand || "Hardware"} ${item.model || item.category || "Asset"}`,
            category: item.category || "Laptop",
            brand: item.brand?.trim() || "Lenovo",
            model: item.model?.trim() || "Hardware Asset",
            serialNumber: item.serialNumber?.trim() || null,
            status: item.status || "IN_STOCK",
            employeeId,
            officeLocation: item.officeLocation || "MUM",
            purchaseDate: item.purchaseDate ? new Date(item.purchaseDate) : null,
            vendor: item.vendor?.trim() || item.invoiceLink?.trim() || null,
            warrantyExpiry: item.warrantyExpiry ? new Date(item.warrantyExpiry) : null,
            accessories: item.accessories?.trim() || item.charger?.trim() || null,
            notes: item.notes?.trim() || item.finalSummary?.trim() || null,

            // Custom Excel Columns
            sesaId: item.sesaId?.trim() || null,
            processor: item.processor?.trim() || null,
            ram: item.ram?.trim() || null,
            storage: item.storage?.trim() || null,
            configuration: item.configuration?.trim() || null,
            inspectionDone: item.inspectionDone?.trim() || null,
            invoiceLink: item.invoiceLink?.trim() || null,
            warrantyStartDate: item.warrantyStartDate ? new Date(item.warrantyStartDate) : null,
            warrantyEndDate: item.warrantyEndDate ? new Date(item.warrantyEndDate) : null,
            extendWarrantyDate: item.extendWarrantyDate ? new Date(item.extendWarrantyDate) : null,
            extendUpto: item.extendUpto?.trim() || null,
            serviceHistory: item.serviceHistory?.trim() || null,
            finalSummary: item.finalSummary?.trim() || null,
            auditDate: item.auditDate?.trim() || null,
            antivirus: item.antivirus?.trim() || null,
            charger: item.charger?.trim() || null,
            currentUser: item.currentUser?.trim() || null,
            lastUser: item.lastUser?.trim() || null,
            stateDetail: item.stateDetail?.trim() || item.status,
          };

          try {
            const existingId = existingTagMap.get(tag.toUpperCase());

            if (existingId) {
              await prisma.asset.update({
                where: { id: existingId },
                data: assetData,
              });
              updatedCount++;
            } else {
              const newAsset = await prisma.asset.create({
                data: assetData,
              });
              existingTagMap.set(tag.toUpperCase(), newAsset.id);

              if (item.status === "IN_USE" && employeeId) {
                await prisma.assignmentHistory.create({
                  data: {
                    assetId: newAsset.id,
                    employeeId,
                    assignedDate: item.purchaseDate ? new Date(item.purchaseDate) : new Date(),
                    notes: "Initial import assignment from Excel register.",
                  },
                });
              }
              createdCount++;
            }
          } catch (err: any) {
            errors.push({ row: rowNumber, tag, error: err.message || "Failed to save row" });
          }
        })
      );
    }

    return NextResponse.json({
      success: true,
      importedCount: createdCount + updatedCount,
      createdCount,
      updatedCount,
      errorsCount: errors.length,
      errors,
    });
  } catch (error: any) {
    console.error("CSV import error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to process CSV import" },
      { status: 500 }
    );
  }
}

