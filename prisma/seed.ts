import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { parseAndValidateAssetCsv } from "../lib/csv";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Hardware Asset Tracker database seed from CSV...");

  // Clean existing tables in correct relation order
  await prisma.disposalRecord.deleteMany();
  await prisma.maintenanceLog.deleteMany();
  await prisma.assignmentHistory.deleteMany();
  await prisma.asset.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.adminUser.deleteMany();

  console.log("🧹 Cleaned existing database tables");

  // 1. Create Default Admin User
  const passwordHash = await bcrypt.hash("adminpassword123", 10);
  const admin = await prisma.adminUser.create({
    data: {
      email: "admin@hardwaretracker.com",
      passwordHash,
      name: "Global IT Administrator",
    },
  });
  console.log(`👤 Created Admin: ${admin.email} / adminpassword123`);

  // 2. Read and parse CSV file
  const csvPath = path.join(__dirname, "raw_assets.csv");
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found at ${csvPath}`);
  }

  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const parsed = parseAndValidateAssetCsv(csvContent, new Set());

  console.log(`📄 Parsed ${parsed.rows.length} total rows from CSV (${parsed.totalValid} valid)`);

  // 3. Extract unique named current users to auto-create Employee records
  const employeeMap = new Map<string, string>(); // name.toLowerCase() -> employeeId

  // Names that represent locations/stock, not actual employees
  const nonPersonKeywords = [
    "in stock", "in office", "none", "-", "?", "returned", "scrapped",
    "storage", "smart techies", "sesa admin", "server machine", "innovation lab",
    "main foyer", "cabin", "fresher desk", "prolit", "proleit", "set /302", "310", "302", "304",
    "meeting room", "reserved", "temp", "ubantu"
  ];

  const isRealPersonName = (name: string): boolean => {
    if (!name || name.trim().length < 3) return false;
    const lower = name.trim().toLowerCase();
    for (const kw of nonPersonKeywords) {
      if (lower.startsWith(kw) || lower.includes("stock") || lower.includes("foyer") || lower.includes("meeting room") || lower.includes("server")) {
        return false;
      }
    }
    return true;
  };

  const cleanPersonName = (rawName: string): string => {
    return rawName
      .replace(/\(tentative\)/gi, "")
      .replace(/\(sales\)/gi, "")
      .replace(/\(sales team\)/gi, "")
      .replace(/\(hiring\)/gi, "")
      .replace(/\(dh\)/gi, "")
      .replace(/\(tester\)/gi, "")
      .replace(/\(arc eng\)/gi, "")
      .replace(/\(business devloper\)/gi, "")
      .replace(/\(marketing\)/gi, "")
      .replace(/\(senior manager\s*\)/gi, "")
      .replace(/\(hr\)/gi, "")
      .replace(/\(er\)/gi, "")
      .replace(/\(digital marketing\)/gi, "")
      .replace(/\(testing purpose\)/gi, "")
      .replace(/\(ubantu\)/gi, "")
      .replace(/\(edge team\)/gi, "")
      .replace(/\(temp\)/gi, "")
      .replace(/\/\s*302/gi, "")
      .replace(/-\s*302/gi, "")
      .trim();
  };

  // Collect distinct employee names
  for (const row of parsed.rows) {
    if (!row.data?.currentUser) continue;
    const rawUser = row.data.currentUser.trim();

    // Might be multiline or have department tags
    const firstLine = rawUser.split("\n")[0].trim();
    if (isRealPersonName(firstLine)) {
      const cleanName = cleanPersonName(firstLine);
      if (cleanName.length > 2 && !employeeMap.has(cleanName.toLowerCase())) {
        const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.|\.$/g, "");
        const email = `${slug}@company.com`;

        let department = "General Operations";
        if (/marketing/i.test(rawUser)) department = "Marketing";
        else if (/sales/i.test(rawUser)) department = "Sales";
        else if (/hiring|hr/i.test(rawUser)) department = "Human Resources";
        else if (/tester|qa/i.test(rawUser)) department = "Quality Assurance";
        else if (/dev|eng|arc/i.test(rawUser)) department = "Engineering";

        const location = row.data.officeLocation === "HYD" ? "HYD" : "MUM";

        const emp = await prisma.employee.create({
          data: {
            name: cleanName,
            email,
            department,
            officeLocation: location,
            status: "ACTIVE",
            startDate: row.data.purchaseDate || new Date("2023-01-01"),
            notes: `Auto-imported custodian for hardware assets`,
          },
        });

        employeeMap.set(cleanName.toLowerCase(), emp.id);
        console.log(`👤 Created Employee: ${cleanName} (${email}) - ${location}`);
      }
    }
  }

  // 4. Insert all assets from CSV
  let insertedCount = 0;
  const seenInsertedTags = new Set<string>();

  for (const row of parsed.rows) {
    if (!row.data) continue;

    const data = row.data;
    let employeeId: string | null = null;

    let tagToUse = data.assetTag;
    if (seenInsertedTags.has(tagToUse.toUpperCase())) {
      tagToUse = `${data.assetTag}-${insertedCount + 1}`;
    }
    seenInsertedTags.add(tagToUse.toUpperCase());

    if (data.currentUser) {
      const cleanName = cleanPersonName(data.currentUser.split("\n")[0].trim());
      if (employeeMap.has(cleanName.toLowerCase())) {
        employeeId = employeeMap.get(cleanName.toLowerCase()) || null;
      }
    }

    const asset = await prisma.asset.create({
      data: {
        assetTag: tagToUse,
        name: data.name,
        category: data.category,
        brand: data.brand,
        model: data.model,
        serialNumber: data.serialNumber || null,
        status: data.status,
        employeeId,
        officeLocation: data.officeLocation,
        purchaseDate: data.purchaseDate || null,
        vendor: data.vendor || null,
        warrantyExpiry: data.warrantyExpiry || null,
        accessories: data.accessories || null,
        notes: data.notes || null,

        // Custom Excel Columns
        sesaId: data.sesaId || null,
        processor: data.processor || null,
        ram: data.ram || null,
        storage: data.storage || null,
        configuration: data.configuration || null,
        inspectionDone: data.inspectionDone || null,
        invoiceLink: data.invoiceLink || null,
        warrantyStartDate: data.warrantyStartDate || null,
        warrantyEndDate: data.warrantyEndDate || null,
        extendWarrantyDate: data.extendWarrantyDate || null,
        extendUpto: data.extendUpto || null,
        serviceHistory: data.serviceHistory || null,
        finalSummary: data.finalSummary || null,
        auditDate: data.auditDate || null,
        antivirus: data.antivirus || null,
        charger: data.charger || null,
        currentUser: data.currentUser || null,
        lastUser: data.lastUser || null,
        stateDetail: data.stateDetail || null,
      },
    });

    // Create active assignment history record if assigned to an employee
    if (employeeId && data.status === "IN_USE") {
      await prisma.assignmentHistory.create({
        data: {
          assetId: asset.id,
          employeeId,
          assignedDate: data.purchaseDate || new Date(),
          notes: `Imported from Excel inventory. Current status: ${data.stateDetail || "In Use"}`,
        },
      });
    }

    // If service history exists, create a maintenance record
    if (data.serviceHistory && data.serviceHistory.trim().length > 5) {
      await prisma.maintenanceLog.create({
        data: {
          assetId: asset.id,
          dateReported: data.purchaseDate || new Date(),
          issueDescription: data.serviceHistory,
          sentTo: "Authorized Service Center",
          outcome: data.status === "UNDER_REPAIR" ? "PENDING" : "REPAIRED",
          performedBy: "Hardware IT Ops",
        },
      });
    }

    // If scrapped or lost, create disposal record
    if (data.status === "SCRAPPED" || data.status === "LOST") {
      await prisma.disposalRecord.create({
        data: {
          assetId: asset.id,
          disposalDate: data.warrantyEndDate || new Date(),
          disposalReason: data.status === "LOST" ? "LOST" : "OBSOLETE",
          notes: data.finalSummary || data.serviceHistory || `Marked as ${data.status} in master register`,
        },
      });
    }

    insertedCount++;
  }

  console.log(`✅ Successfully seeded ${insertedCount} hardware assets into the database!`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
