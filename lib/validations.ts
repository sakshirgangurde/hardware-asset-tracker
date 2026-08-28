import { z } from "zod";

export const CATEGORIES = [
  "Laptop",
  "Desktop",
  "Monitor",
  "Support Device",
  "TV",
  "Peripheral",
  "Networking",
  "Other",
] as const;

export const ASSET_STATUSES = [
  "IN_STOCK",
  "IN_USE",
  "UNDER_REPAIR",
  "LOST",
  "SCRAPPED",
  "RETURNED",
] as const;

export const OFFICE_LOCATIONS = ["HYD", "MUM", "Mumbai", "Hyderabad"] as const;

export const EMPLOYEE_STATUSES = ["ACTIVE", "OFFBOARDED"] as const;

export const MAINTENANCE_OUTCOMES = [
  "REPAIRED",
  "UNREPAIRABLE",
  "PENDING",
] as const;

export const DISPOSAL_REASONS = [
  "DAMAGED_BEYOND_REPAIR",
  "OBSOLETE",
  "LOST",
  "STOLEN",
  "OTHER",
] as const;

// Asset creation/update schema
export const assetSchema = z.object({
  assetTag: z
    .string()
    .min(1, "Asset tag is required")
    .max(100, "Asset tag is too long")
    .trim(),
  name: z
    .string()
    .min(1, "Asset name is required")
    .max(200, "Asset name is too long")
    .trim(),
  category: z.string().min(1, "Category is required"),
  brand: z.string().min(1, "Brand is required").trim(),
  model: z.string().min(1, "Model is required").trim(),
  serialNumber: z
    .string()
    .trim()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  status: z.string().default("IN_STOCK"),
  employeeId: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val : null)),
  officeLocation: z.string().default("MUM"),
  purchaseDate: z
    .union([z.coerce.date(), z.string(), z.null()])
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    }),
  vendor: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  warrantyExpiry: z
    .union([z.coerce.date(), z.string(), z.null()])
    .optional()
    .nullable()
    .transform((val) => {
      if (!val) return null;
      const d = new Date(val);
      return isNaN(d.getTime()) ? null : d;
    }),
  accessories: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  notes: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),

  // Custom Excel Columns
  sesaId: z.string().optional().nullable().transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  processor: z.string().optional().nullable().transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  ram: z.string().optional().nullable().transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  storage: z.string().optional().nullable().transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  configuration: z.string().optional().nullable().transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  inspectionDone: z.string().optional().nullable().transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  invoiceLink: z.string().optional().nullable().transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  warrantyStartDate: z.union([z.coerce.date(), z.string(), z.null()]).optional().nullable().transform((val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }),
  warrantyEndDate: z.union([z.coerce.date(), z.string(), z.null()]).optional().nullable().transform((val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }),
  extendWarrantyDate: z.union([z.coerce.date(), z.string(), z.null()]).optional().nullable().transform((val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  }),
  extendUpto: z.string().optional().nullable().transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  serviceHistory: z.string().optional().nullable().transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  finalSummary: z.string().optional().nullable().transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  auditDate: z.string().optional().nullable().transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  antivirus: z.string().optional().nullable().transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  charger: z.string().optional().nullable().transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  currentUser: z.string().optional().nullable().transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  lastUser: z.string().optional().nullable().transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
  stateDetail: z.string().optional().nullable().transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
});

export type AssetFormValues = z.infer<typeof assetSchema>;

// Quick Assignment schema
export const assignAssetSchema = z.object({
  employeeId: z.string().min(1, "Please select an employee"),
  notes: z.string().optional().nullable(),
});

// Quick Return schema
export const returnAssetSchema = z.object({
  notes: z.string().optional().nullable(),
  newLocation: z.string().optional(),
});

// Maintenance Log schema
export const maintenanceSchema = z.object({
  dateReported: z.coerce.date().default(() => new Date()),
  issueDescription: z
    .string()
    .min(3, "Issue description must be at least 3 characters"),
  sentTo: z.string().min(2, "Service vendor / technician name is required"),
  dateReturned: z.coerce.date().optional().nullable(),
  outcome: z.string().default("PENDING"),
  performedBy: z.string().min(2, "Logged by is required"),
});

export type MaintenanceFormValues = z.infer<typeof maintenanceSchema>;

// Disposal schema
export const disposalSchema = z.object({
  disposalDate: z.coerce.date().default(() => new Date()),
  disposalReason: z.string().default("DAMAGED_BEYOND_REPAIR"),
  notes: z.string().optional().nullable(),
});

export type DisposalFormValues = z.infer<typeof disposalSchema>;

// Employee schema
export const employeeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").trim(),
  email: z.string().email("Invalid email address").toLowerCase().trim(),
  department: z.string().min(1, "Department is required").trim(),
  officeLocation: z.string().default("MUM"),
  status: z.string().default("ACTIVE"),
  startDate: z.coerce.date().default(() => new Date()),
  endDate: z.coerce.date().optional().nullable(),
  notes: z
    .string()
    .optional()
    .nullable()
    .transform((val) => (val && val.trim().length > 0 ? val.trim() : null)),
});

export type EmployeeFormValues = z.infer<typeof employeeSchema>;

// Offboard Employee schema
export const offboardEmployeeSchema = z.object({
  endDate: z.coerce.date().default(() => new Date()),
  notes: z.string().optional().nullable(),
  assetActions: z
    .array(
      z.object({
        assetId: z.string(),
        action: z.enum(["RETURN_TO_STOCK", "MARK_LOST"]),
        notes: z.string().optional().nullable(),
        location: z.string().optional(),
      })
    )
    .optional(),
});

export type OffboardFormValues = z.infer<typeof offboardEmployeeSchema>;

// Login Schema
export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address").trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
