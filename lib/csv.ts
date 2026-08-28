import Papa from "papaparse";
import { AssetWithRelations, AssignmentHistoryWithRelations } from "./types";
import { format } from "date-fns";

/**
 * Robust flexible date parser that parses dates from Excel sheets,
 * including formats like "1 December 18", "7-Jul-23", "9/10/2012", "28.11.2021",
 * "Expires 08 JUL 2024", "16/Sep/03", etc.
 */
export function parseFlexibleDate(val: string | null | undefined): Date | null {
  if (!val) return null;
  let str = String(val).trim();
  if (!str || str.toUpperCase() === "NA" || str.toUpperCase() === "NONE" || str === "-" || str === "?") {
    return null;
  }

  // If contains words like "Expires 08 JUL 2024", strip "Expires" or "Out Of Warrenty"
  if (/out of warrenty|out of warranty/i.test(str)) {
    return null;
  }
  str = str.replace(/Expires\s+/i, "").trim();

  // Remove ordinal suffixes e.g., 7th, 1st, 2nd, 3rd
  str = str.replace(/(\d+)(st|nd|rd|th)/i, "$1");

  // Replace dots with slashes or dashes
  if (/^\d{1,2}\.\d{1,2}\.\d{2,4}$/.test(str)) {
    const parts = str.split(".");
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += year < 50 ? 2000 : 1900;
    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) return d;
  }

  // Try standard Date.parse
  const directParsed = new Date(str);
  if (!isNaN(directParsed.getTime()) && directParsed.getFullYear() > 1990 && directParsed.getFullYear() < 2100) {
    return directParsed;
  }

  // Month mapping
  const monthMap: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  // Pattern: "1 December 18" or "20-Mar-19" or "16/Sep/03" or "7-Jul-23" or "20-10-2023"
  const cleanTokens = str.replace(/[,\/\-\s]+/g, " ").trim().split(" ");
  if (cleanTokens.length === 3) {
    let day = 0;
    let month = -1;
    let year = 0;

    // Check if token 0 or 1 is month name
    const t0Month = monthMap[cleanTokens[0].toLowerCase()];
    const t1Month = monthMap[cleanTokens[1].toLowerCase()];

    if (t1Month !== undefined) {
      day = parseInt(cleanTokens[0], 10);
      month = t1Month;
      year = parseInt(cleanTokens[2], 10);
    } else if (t0Month !== undefined) {
      month = t0Month;
      day = parseInt(cleanTokens[1], 10);
      year = parseInt(cleanTokens[2], 10);
    } else {
      // Numbers only e.g. 20 10 2023 or 9 10 2012 or 3 30 2013
      const n0 = parseInt(cleanTokens[0], 10);
      const n1 = parseInt(cleanTokens[1], 10);
      const n2 = parseInt(cleanTokens[2], 10);

      if (n2 > 1900 || (n2 < 100 && (n0 > 12 || n1 > 12))) {
        if (n0 > 12) {
          day = n0;
          month = n1 - 1;
        } else if (n1 > 12) {
          month = n0 - 1;
          day = n1;
        } else {
          day = n0;
          month = n1 - 1;
        }
        year = n2;
      }
    }

    if (year > 0 && year < 100) {
      year += year < 50 ? 2000 : 1900;
    }

    if (day > 0 && day <= 31 && month >= 0 && month <= 11 && year > 1990) {
      const result = new Date(year, month, day);
      if (!isNaN(result.getTime())) return result;
    }
  }

  return null;
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
    purchaseDate?: Date | null;
    vendor?: string | null;
    warrantyExpiry?: Date | null;
    warrantyStartDate?: Date | null;
    warrantyEndDate?: Date | null;
    extendWarrantyDate?: Date | null;
    extendUpto?: string | null;
    accessories?: string | null;
    notes?: string | null;
    employeeEmail?: string | null;
    currentUser?: string | null;
    lastUser?: string | null;
    sesaId?: string | null;
    processor?: string | null;
    ram?: string | null;
    storage?: string | null;
    configuration?: string | null;
    inspectionDone?: string | null;
    invoiceLink?: string | null;
    serviceHistory?: string | null;
    finalSummary?: string | null;
    auditDate?: string | null;
    antivirus?: string | null;
    charger?: string | null;
    stateDetail?: string | null;
  };
}

/**
 * Parse and validate asset CSV supporting both the user's Excel sheet column structure
 * and standard exported CSV formats.
 */
export function parseAndValidateAssetCsv(
  fileContent: string,
  existingTags: Set<string>,
  activeEmployeesMap: Map<string, string> = new Map()
): { rows: CsvParsedRow[]; totalValid: number; totalInvalid: number } {
  const parsed = Papa.parse<Record<string, string>>(fileContent, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim(),
  });

  const rows: CsvParsedRow[] = [];
  const seenTagsInFile = new Set<string>();

  parsed.data.forEach((raw, idx) => {
    const rowNumber = idx + 2; // header is row 1
    const errors: string[] = [];

    // Helper to find column regardless of casing or extra spaces
    const getVal = (keys: string[]): string => {
      for (const k of keys) {
        if (raw[k] !== undefined && raw[k] !== null && String(raw[k]).trim() !== "") {
          return String(raw[k]).trim();
        }
        // Try case-insensitive matching
        const foundKey = Object.keys(raw).find(
          (rk) => rk.trim().toLowerCase() === k.trim().toLowerCase()
        );
        if (foundKey && raw[foundKey] !== undefined && raw[foundKey] !== null && String(raw[foundKey]).trim() !== "") {
          return String(raw[foundKey]).trim();
        }
      }
      return "";
    };

    // Extract fields from raw row
    let rawTag = getVal(["Asset ID", "asset_tag", "tag", "Asset Tag", "asset tag"]);
    // Sanitize <TODO> or empty tags
    if (rawTag === "<TODO>" || rawTag.toLowerCase().includes("todo")) {
      rawTag = `WB-TODO-${String(rowNumber).padStart(2, "0")}`;
    }
    if (!rawTag) {
      rawTag = `WB-${String(rowNumber).padStart(2, "0")}`;
    }

    const currentUser = getVal(["Current User", "current_user", "Assigned User", "employee_name", "User"]);
    const lastUser = getVal(["Last User", "last_user", "Past Users"]);
    const serialNumber = getVal(["Serial Number/ Service Tag", "serial_number", "serial", "Serial Number", "Service Tag"]) || null;
    const invoiceLink = getVal(["Invoice link", "invoice_link", "Invoice", "vendor"]);
    const sesaId = getVal(["SESA ID", "sesa_id", "SESA", "sesa"]);
    const rawState = getVal(["STATE", "state", "status", "Status", "State"]);
    const rawLocation = getVal(["Location", "office_location", "location", "Office Location"]);
    const rawType = getVal(["Type", "category", "type", "Category", "Asset Type"]);
    const processor = getVal(["Processor", "processor", "CPU", "Processor "]);
    const ram = getVal(["RAM", "ram", "Memory"]);
    const storage = getVal(["SSD/HDD", "storage", "SSD", "HDD", "Hard Disk"]);
    const configuration = getVal(["Configuration of Laptop", "configuration", "specs", "Configuration"]);
    const inspectionDone = getVal(["Inspection Done?", "inspection_done", "Inspection", "Inspection Done"]);
    const rawBrand = getVal(["Lenovo", "brand", "Brand", "Manufacturer", "Make"]);
    const modelNum = getVal(["Model#", "model", "Model", "Model Name"]);
    const rawPurchaseDate = getVal(["Date of purchase", "purchase_date", "Purchase Date"]);
    const rawWarrantyStart = getVal(["Warrenty Start date ", "warranty_start_date", "Warranty Start Date", "Warranty Start"]);
    const rawWarrantyEnd = getVal(["Warrenty End Date", "warranty_end_date", "warranty_expiry", "Warranty Expiry", "Warranty End Date"]);
    const rawWarrantyExtend = getVal(["Extend Date of warrenty", "extend_date_of_warrenty", "Extended Warranty", "Extend Warranty Date"]);
    const extendUpto = getVal(["Extend Upto", "extend_upto"]);
    const serviceHistory = getVal(["Service History", "service_history", "Repairs"]);
    const finalSummary = getVal(["Final Summary", "final_summary", "Summary", "Condition"]);
    const auditDate = getVal(["Audit Date ", "audit_date", "Audit Date", "Audit"]);
    const antivirus = getVal(["Antivirous ", "antivirus", "Antivirus", "Antivirous"]);
    const charger = getVal(["Charger", "charger"]);
    const rawAccessories = getVal(["accessories", "Accessories"]);
    const rawNotes = getVal(["notes", "Notes"]);

    // Determine normalized status
    let status = "IN_STOCK";
    const stateUpper = (rawState || "").toUpperCase();
    if (stateUpper.includes("IN USE") || stateUpper.includes("IN_USE")) {
      status = "IN_USE";
    } else if (stateUpper.includes("REPAIR") || stateUpper.includes("UNDER REPAIR")) {
      status = "UNDER_REPAIR";
    } else if (stateUpper.includes("LOST")) {
      status = "LOST";
    } else if (stateUpper.includes("SCRAP") || stateUpper.includes("UNUSABLE")) {
      status = "SCRAPPED";
    } else if (stateUpper.includes("RETURN")) {
      status = "RETURNED";
    } else if (currentUser && currentUser !== "In Stock" && currentUser !== "IN Stock (MUM)" && currentUser !== "In Stock HYD" && currentUser !== "In Office" && currentUser !== "NONE" && currentUser !== "-" && currentUser !== "Returned to Lenovo" && !currentUser.toLowerCase().includes("stock")) {
      status = "IN_USE";
    }

    // Determine Location
    let officeLocation = "MUM";
    if (rawLocation.toLowerCase().includes("hyd") || rawLocation.toLowerCase().includes("hyderabad")) {
      officeLocation = "HYD";
    } else {
      officeLocation = "MUM";
    }

    // Determine Category
    let category = "Laptop";
    const typeUpper = (rawType || "").toUpperCase();
    if (typeUpper.includes("MONITOR") || rawTag.startsWith("WBM-")) {
      category = "Monitor";
    } else if (typeUpper.includes("SUPPORT DEVICE") || typeUpper.includes("SUPPORT") || rawTag.startsWith("WBSD-")) {
      category = "Support Device";
    } else if (typeUpper.includes("TV")) {
      category = "TV";
    } else if (typeUpper.includes("DESKTOP")) {
      category = "Desktop";
    } else if (typeUpper.includes("PERIPHERAL")) {
      category = "Peripheral";
    } else if (typeUpper.includes("NETWORKING")) {
      category = "Networking";
    }

    // Determine Brand & Model
    let brand = rawBrand || "Lenovo";
    if (category === "Laptop" && !rawBrand) {
      if (rawTag.includes("Apple") || configuration.toLowerCase().includes("apple") || configuration.toLowerCase().includes("macbook")) {
        brand = "Apple";
      } else if (modelNum.toLowerCase().includes("vostro") || modelNum.toLowerCase().includes("latitude") || modelNum.toLowerCase().includes("xps") || modelNum.toLowerCase().includes("g3")) {
        brand = "Dell";
      } else {
        brand = "Lenovo";
      }
    } else if (category === "Monitor" && !rawBrand) {
      brand = "Dell";
    } else if (category === "Support Device" && !rawBrand) {
      brand = "Logitech";
    }

    let model = modelNum || configuration.slice(0, 40) || `${brand} ${category}`;

    // Name
    const name = `${brand} ${modelNum || (category === "Laptop" ? (processor ? `${processor} Laptop` : "Business Laptop") : category)}`.trim();

    // Parse Dates
    const purchaseDate = parseFlexibleDate(rawPurchaseDate) || parseFlexibleDate(rawWarrantyStart) || new Date();
    const warrantyStartDate = parseFlexibleDate(rawWarrantyStart);
    const warrantyEndDate = parseFlexibleDate(rawWarrantyEnd) || parseFlexibleDate(rawWarrantyExtend);
    const extendWarrantyDate = parseFlexibleDate(rawWarrantyExtend);
    const warrantyExpiry = warrantyEndDate || extendWarrantyDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

    // Tag collision validation
    if (seenTagsInFile.has(rawTag.toUpperCase())) {
      errors.push(`Duplicate Asset Tag "${rawTag}" found within CSV`);
    } else {
      seenTagsInFile.add(rawTag.toUpperCase());
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
          assetTag: rawTag,
          name,
          category,
          brand,
          model,
          serialNumber,
          status,
          officeLocation,
          purchaseDate,
          vendor: invoiceLink || "Corporate Vendor",
          warrantyExpiry,
          warrantyStartDate,
          warrantyEndDate,
          extendWarrantyDate,
          extendUpto: extendUpto || null,
          accessories: rawAccessories || charger || null,
          notes: rawNotes || finalSummary || configuration || null,
          currentUser: currentUser || null,
          lastUser: lastUser || null,
          sesaId: sesaId || null,
          processor: processor || null,
          ram: ram || null,
          storage: storage || null,
          configuration: configuration || null,
          inspectionDone: inspectionDone || null,
          invoiceLink: invoiceLink || null,
          serviceHistory: serviceHistory || null,
          finalSummary: finalSummary || null,
          auditDate: auditDate || null,
          antivirus: antivirus || null,
          charger: charger || null,
          stateDetail: rawState || status,
        },
      });
    }
  });

  const totalValid = rows.filter((r) => r.isValid).length;
  const totalInvalid = rows.filter((r) => !r.isValid).length;

  return { rows, totalValid, totalInvalid };
}

/**
 * Export assets to enriched CSV matching all Excel fields
 */
export function exportAssetsToCsv(assets: AssetWithRelations[]): string {
  const data = assets.map((asset, idx) => ({
    "SR": idx + 1,
    "Asset ID": asset.assetTag,
    "Current User": asset.currentUser || asset.employee?.name || (asset.status === "IN_STOCK" ? `In Stock (${asset.officeLocation})` : ""),
    "Last User": asset.lastUser || "",
    "Serial Number/ Service Tag": asset.serialNumber || "",
    "Invoice link": asset.invoiceLink || asset.vendor || "",
    "SESA ID": asset.sesaId || "",
    "STATE": asset.stateDetail || asset.status,
    "Location": asset.officeLocation === "HYD" ? "Hyderabad" : "Mumbai",
    "Type": asset.category,
    "Processor": asset.processor || "",
    "RAM": asset.ram || "",
    "SSD/HDD": asset.storage || "",
    "Configuration of Laptop": asset.configuration || "",
    "Inspection Done?": asset.inspectionDone || "",
    "Brand": asset.brand,
    "Model#": asset.model,
    "Date of purchase": asset.purchaseDate ? format(new Date(asset.purchaseDate), "yyyy-MM-dd") : "",
    "Warrenty Start date": asset.warrantyStartDate ? format(new Date(asset.warrantyStartDate), "yyyy-MM-dd") : "",
    "Warrenty End Date": asset.warrantyEndDate || asset.warrantyExpiry ? format(new Date((asset.warrantyEndDate || asset.warrantyExpiry)!), "yyyy-MM-dd") : "",
    "Extend Date of warrenty": asset.extendWarrantyDate ? format(new Date(asset.extendWarrantyDate), "yyyy-MM-dd") : "",
    "Extend Upto": asset.extendUpto || "",
    "Service History": asset.serviceHistory || "",
    "Final Summary": asset.finalSummary || "",
    "Audit Date": asset.auditDate || "",
    "Antivirus": asset.antivirus || "",
    "Charger": asset.charger || asset.accessories || "",
  }));

  return Papa.unparse(data, {
    quotes: true,
    header: true,
  });
}

export function exportAssignmentsToCsv(assignments: AssignmentHistoryWithRelations[]): string {
  const data = assignments.map((history) => ({
    "Asset ID": history.asset?.assetTag || "",
    "Hardware Item": history.asset?.name || "",
    "Category": history.asset?.category || "",
    "Brand & Model": `${history.asset?.brand || ""} ${history.asset?.model || ""}`.trim(),
    "Employee Custodian": history.employee?.name || "",
    "Email": history.employee?.email || "",
    "Department": history.employee?.department || "",
    "Assigned Date": history.assignedDate ? format(new Date(history.assignedDate), "yyyy-MM-dd") : "",
    "Returned Date": history.returnedDate ? format(new Date(history.returnedDate), "yyyy-MM-dd") : "CURRENTLY HELD",
    "Handover Notes": history.notes || "",
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
