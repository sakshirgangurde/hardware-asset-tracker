import Papa from "papaparse";
import { AssetWithRelations, AssignmentHistoryWithRelations } from "./types";
import { format } from "date-fns";

export interface AssetCsvRow {
  asset_tag: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  serial_number: string;
  status: string;
  employee_email?: string;
  employee_name?: string;
  office_location: string;
  purchase_date: string;
  vendor: string;
  warranty_expiry: string;
  accessories: string;
  notes: string;
}

export function exportAssetsToCsv(assets: AssetWithRelations[]): string {
  const data: AssetCsvRow[] = assets.map((asset) => ({
    asset_tag: asset.assetTag,
    name: asset.name,
    category: asset.category,
    brand: asset.brand,
    model: asset.model,
    serial_number: asset.serialNumber || "",
    status: asset.status,
    employee_email: asset.employee?.email || "",
    employee_name: asset.employee?.name || "",
    office_location: asset.officeLocation,
    purchase_date: asset.purchaseDate ? format(new Date(asset.purchaseDate), "yyyy-MM-dd") : "",
    vendor: asset.vendor || "",
    warranty_expiry: asset.warrantyExpiry ? format(new Date(asset.warrantyExpiry), "yyyy-MM-dd") : "",
    accessories: asset.accessories || "",
    notes: asset.notes || "",
  }));

  return Papa.unparse(data, {
    quotes: true,
    header: true,
  });
}

export function exportAssignmentsToCsv(assignments: AssignmentHistoryWithRelations[]): string {
  const data = assignments.map((history) => ({
    asset_tag: history.asset?.assetTag || "",
    asset_name: history.asset?.name || "",
    category: history.asset?.category || "",
    brand_model: `${history.asset?.brand || ""} ${history.asset?.model || ""}`.trim(),
    employee_name: history.employee?.name || "",
    employee_email: history.employee?.email || "",
    department: history.employee?.department || "",
    assigned_date: history.assignedDate ? format(new Date(history.assignedDate), "yyyy-MM-dd") : "",
    returned_date: history.returnedDate ? format(new Date(history.returnedDate), "yyyy-MM-dd") : "CURRENTLY HELD",
    notes: history.notes || "",
  }));

  return Papa.unparse(data, {
    quotes: true,
    header: true,
  });
}

export function triggerCsvDownload(csvString: string, filename: string) {
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface CsvParsedRow {
  rowNumber: number;
  raw: Record<string, string>;
  isValid: boolean;
  errors: string[];
  data?: {
    assetTag: string;
    name: string;
    category: string;
    brand: string;
    model: string;
    serialNumber?: string | null;
    status: string;
    officeLocation: string;
    purchaseDate: Date;
    vendor?: string | null;
    warrantyExpiry: Date;
    accessories?: string | null;
    notes?: string | null;
    employeeEmail?: string | null;
  };
}

export function parseAndValidateAssetCsv(
  fileContent: string,
  existingTags: Set<string>,
  activeEmployeesMap: Map<string, string> // email -> employeeId
): { rows: CsvParsedRow[]; totalValid: number; totalInvalid: number } {
  const parsed = Papa.parse<Record<string, string>>(fileContent, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (header) => header.trim().toLowerCase().replace(/\s+/g, "_"),
  });

  const rows: CsvParsedRow[] = [];
  const seenTagsInFile = new Set<string>();

  parsed.data.forEach((raw, idx) => {
    const rowNumber = idx + 2; // header is row 1
    const errors: string[] = [];

    const assetTag = (raw.asset_tag || raw.tag || "").trim();
    const name = (raw.name || raw.asset_name || "").trim();
    const category = (raw.category || "").trim();
    const brand = (raw.brand || "").trim();
    const model = (raw.model || "").trim();
    const serialNumber = (raw.serial_number || raw.serial || "").trim() || null;
    const status = (raw.status || "IN_STOCK").trim().toUpperCase();
    const officeLocation = (raw.office_location || raw.location || "HYD").trim().toUpperCase();
    const purchaseDateStr = (raw.purchase_date || "").trim();
    const warrantyExpiryStr = (raw.warranty_expiry || "").trim();
    const vendor = (raw.vendor || "").trim() || null;
    const accessories = (raw.accessories || "").trim() || null;
    const notes = (raw.notes || "").trim() || null;
    const employeeEmail = (raw.employee_email || raw.assigned_to_email || "").trim().toLowerCase() || null;

    if (!assetTag) {
      errors.push("Asset Tag is required");
    } else if (existingTags.has(assetTag.toUpperCase())) {
      errors.push(`Asset Tag "${assetTag}" already exists in database`);
    } else if (seenTagsInFile.has(assetTag.toUpperCase())) {
      errors.push(`Duplicate Asset Tag "${assetTag}" found within CSV file`);
    } else {
      seenTagsInFile.add(assetTag.toUpperCase());
    }

    if (!name) errors.push("Name is required");
    if (!brand) errors.push("Brand is required");
    if (!model) errors.push("Model is required");

    const validCategories = ["Laptop", "Desktop", "Monitor", "Peripheral", "Networking", "Other"];
    const matchedCategory = validCategories.find(c => c.toLowerCase() === category.toLowerCase());
    if (!matchedCategory) {
      errors.push(`Category must be one of: ${validCategories.join(", ")}`);
    }

    const validStatuses = ["IN_STOCK", "IN_USE", "UNDER_REPAIR", "LOST", "SCRAPPED"];
    if (!validStatuses.includes(status)) {
      errors.push(`Status must be one of: ${validStatuses.join(", ")}`);
    }

    if (officeLocation !== "HYD" && officeLocation !== "MUM") {
      errors.push("Office Location must be HYD or MUM");
    }

    let purchaseDate: Date = new Date();
    if (!purchaseDateStr) {
      errors.push("Purchase date is required (YYYY-MM-DD)");
    } else {
      purchaseDate = new Date(purchaseDateStr);
      if (isNaN(purchaseDate.getTime())) {
        errors.push("Invalid purchase date format");
      }
    }

    let warrantyExpiry: Date = new Date();
    if (!warrantyExpiryStr) {
      errors.push("Warranty expiry date is required (YYYY-MM-DD)");
    } else {
      warrantyExpiry = new Date(warrantyExpiryStr);
      if (isNaN(warrantyExpiry.getTime())) {
        errors.push("Invalid warranty expiry format");
      } else if (purchaseDate && !isNaN(purchaseDate.getTime()) && warrantyExpiry < purchaseDate) {
        errors.push("Warranty expiry cannot be earlier than purchase date");
      }
    }

    if (status === "IN_USE") {
      if (!employeeEmail) {
        errors.push("Employee email is required when status is IN_USE");
      } else if (!activeEmployeesMap.has(employeeEmail)) {
        errors.push(`No active employee found with email "${employeeEmail}"`);
      }
    }

    if (errors.length > 0) {
      rows.push({
        rowNumber,
        raw,
        isValid: false,
        errors,
      });
    } else {
      rows.push({
        rowNumber,
        raw,
        isValid: true,
        errors: [],
        data: {
          assetTag,
          name,
          category: matchedCategory!,
          brand,
          model,
          serialNumber,
          status,
          officeLocation,
          purchaseDate,
          vendor,
          warrantyExpiry,
          accessories,
          notes,
          employeeEmail,
        },
      });
    }
  });

  const totalValid = rows.filter((r) => r.isValid).length;
  const totalInvalid = rows.filter((r) => !r.isValid).length;

  return { rows, totalValid, totalInvalid };
}
