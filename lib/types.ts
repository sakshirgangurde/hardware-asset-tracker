export type AssetCategory =
  | "Laptop"
  | "Desktop"
  | "Monitor"
  | "Support Device"
  | "TV"
  | "Peripheral"
  | "Networking"
  | "Other"
  | string;

export type AssetStatus =
  | "IN_STOCK"
  | "IN_USE"
  | "UNDER_REPAIR"
  | "LOST"
  | "SCRAPPED"
  | "RETURNED"
  | string;

export type OfficeLocation = "HYD" | "MUM" | "Mumbai" | "Hyderabad" | string;

export type EmployeeStatus = "ACTIVE" | "OFFBOARDED" | string;

export type MaintenanceOutcome = "REPAIRED" | "UNREPAIRABLE" | "PENDING" | string;

export type DisposalReason =
  | "DAMAGED_BEYOND_REPAIR"
  | "OBSOLETE"
  | "LOST"
  | "STOLEN"
  | "OTHER"
  | string;

export interface AssetWithRelations {
  id: string;
  assetTag: string;
  name: string;
  category: AssetCategory;
  brand: string;
  model: string;
  serialNumber: string | null;
  status: AssetStatus;
  employeeId: string | null;
  employee?: {
    id: string;
    name: string;
    email: string;
    department: string;
    officeLocation: OfficeLocation;
    status: EmployeeStatus;
  } | null;
  officeLocation: OfficeLocation;
  purchaseDate: string | Date | null;
  vendor: string | null;
  warrantyExpiry: string | Date | null;
  accessories: string | null;
  notes: string | null;

  // Custom Excel Columns
  sesaId?: string | null;
  processor?: string | null;
  ram?: string | null;
  storage?: string | null;
  configuration?: string | null;
  inspectionDone?: string | null;
  invoiceLink?: string | null;
  warrantyStartDate?: string | Date | null;
  warrantyEndDate?: string | Date | null;
  extendWarrantyDate?: string | Date | null;
  extendUpto?: string | null;
  serviceHistory?: string | null;
  finalSummary?: string | null;
  auditDate?: string | null;
  antivirus?: string | null;
  charger?: string | null;
  currentUser?: string | null;
  lastUser?: string | null;
  stateDetail?: string | null;

  createdAt: string | Date;
  updatedAt: string | Date;
  assignments?: AssignmentHistoryWithRelations[];
  maintenance?: MaintenanceLogItem[];
  disposals?: DisposalRecordItem[];
}

export interface EmployeeWithRelations {
  id: string;
  name: string;
  email: string;
  department: string;
  officeLocation: OfficeLocation;
  status: EmployeeStatus;
  startDate: string | Date;
  endDate: string | Date | null;
  notes: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  assets?: AssetWithRelations[];
  assignments?: AssignmentHistoryWithRelations[];
  _count?: {
    assets: number;
    assignments: number;
  };
}

export interface AssignmentHistoryWithRelations {
  id: string;
  assetId: string;
  employeeId: string;
  assignedDate: string | Date;
  returnedDate: string | Date | null;
  notes: string | null;
  createdAt: string | Date;
  asset?: {
    id: string;
    assetTag: string;
    name: string;
    category: string;
    brand: string;
    model: string;
  };
  employee?: {
    id: string;
    name: string;
    email: string;
    department: string;
    officeLocation?: string;
  };
}

export interface MaintenanceLogItem {
  id: string;
  assetId: string;
  dateReported: string | Date;
  issueDescription: string;
  sentTo: string;
  dateReturned: string | Date | null;
  outcome: MaintenanceOutcome;
  performedBy: string;
  createdAt: string | Date;
  asset?: {
    id: string;
    assetTag: string;
    name: string;
    brand: string;
    model: string;
  };
}

export interface DisposalRecordItem {
  id: string;
  assetId: string;
  disposalDate: string | Date;
  disposalReason: DisposalReason;
  notes: string | null;
  createdAt: string | Date;
  asset?: {
    id: string;
    assetTag: string;
    name: string;
    brand: string;
    model: string;
  };
}

export interface DashboardKPIs {
  totalAssets: number;
  inUse: number;
  inStock: number;
  underRepair: number;
  scrapped: number;
  lost: number;
  activeEmployees: number;
  warrantiesExpiring30Days: number;
  warrantiesExpiring60Days: number;
  warrantiesExpiring90Days: number;
  offboardedWithUnreturnedAssets: {
    employeeId: string;
    employeeName: string;
    employeeEmail: string;
    officeLocation: OfficeLocation;
    unreturnedCount: number;
    assets: {
      id: string;
      assetTag: string;
      name: string;
      category: string;
    }[];
  }[];
  categoryBreakdown: {
    category: string;
    count: number;
  }[];
  locationBreakdown: {
    location: OfficeLocation;
    total: number;
    inUse: number;
    inStock: number;
  }[];
  recentActivity: {
    id: string;
    type: "assignment" | "return" | "maintenance" | "disposal";
    timestamp: string | Date;
    description: string;
    assetTag: string;
    assetName: string;
    employeeName?: string;
  }[];
}
