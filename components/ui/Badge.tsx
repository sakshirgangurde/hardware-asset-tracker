import React from "react";
import { AssetStatus, OfficeLocation, EmployeeStatus, MaintenanceOutcome } from "@/lib/types";

interface BadgeProps {
  children?: React.ReactNode;
  variant?: "default" | "status" | "location" | "category" | "outcome" | "employeeStatus";
  value?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({ status, size = "md" }: { status: AssetStatus | string; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs font-medium" : "px-2.5 py-1 text-xs font-semibold";
  const stUpper = (status || "").toUpperCase();

  if (stUpper.includes("IN_USE") || stUpper === "IN USE") {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
        In Use
      </span>
    );
  }

  if (stUpper.includes("USABLE-SESA")) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        Usable (SESA)
      </span>
    );
  }

  if (stUpper.includes("USABLE-NONSESA") || stUpper.includes("USABLE - NONSESA")) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 text-teal-300 border border-teal-500/30 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-teal-400"></span>
        Usable (Non-SESA)
      </span>
    );
  }

  if (stUpper.includes("IN_STOCK") || stUpper === "USABLE" || stUpper.includes("STOCK") || stUpper.includes("OFFICE")) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        In Stock
      </span>
    );
  }

  if (stUpper.includes("UNDER_REPAIR") || stUpper.includes("REPAIR")) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
        Under Repair
      </span>
    );
  }

  if (stUpper.includes("LOST")) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
        Lost
      </span>
    );
  }

  if (stUpper.includes("SCRAP") || stUpper.includes("UNUSABLE")) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-600/40 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
        {stUpper.includes("UNUSABLE") ? "Unusable" : "Scrapped"}
      </span>
    );
  }

  if (stUpper.includes("RETURN")) {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
        Returned
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-gray-700/50 text-gray-300 border border-gray-600 ${sizeClasses}`}>
      {status}
    </span>
  );
}

export function LocationBadge({ location, size = "md" }: { location: OfficeLocation | string; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-0.5 text-xs font-semibold";
  const locUpper = (location || "").toUpperCase();

  if (locUpper.includes("HYD") || locUpper.includes("HYDERABAD")) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 ${sizeClasses}`}>
        📍 Hyderabad
      </span>
    );
  }
  if (locUpper.includes("MUM") || locUpper.includes("MUMBAI")) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 ${sizeClasses}`}>
        📍 Mumbai
      </span>
    );
  }
  return <span className={`inline-flex items-center rounded-md bg-slate-800 text-slate-300 ${sizeClasses}`}>{location}</span>;
}

export function CategoryBadge({ category, size = "md" }: { category: string; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-0.5 text-xs font-medium";

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "laptop":
        return "bg-indigo-500/15 text-indigo-300 border-indigo-500/30";
      case "desktop":
        return "bg-violet-500/15 text-violet-300 border-violet-500/30";
      case "monitor":
        return "bg-teal-500/15 text-teal-300 border-teal-500/30";
      case "support device":
      case "support":
        return "bg-amber-500/15 text-amber-300 border-amber-500/30";
      case "tv":
        return "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/30";
      case "peripheral":
        return "bg-sky-500/15 text-sky-300 border-sky-500/30";
      case "networking":
        return "bg-orange-500/15 text-orange-300 border-orange-500/30";
      default:
        return "bg-slate-700/50 text-slate-300 border-slate-600/30";
    }
  };

  return (
    <span className={`inline-flex items-center rounded-md border ${getCategoryColor(category)} ${sizeClasses}`}>
      {category}
    </span>
  );
}

export function EmployeeStatusBadge({ status, size = "md" }: { status: EmployeeStatus | string; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-semibold";

  if (status === "ACTIVE") {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
        Active
      </span>
    );
  }
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
      Offboarded
    </span>
  );
}

export function OutcomeBadge({ outcome, size = "md" }: { outcome: MaintenanceOutcome | string; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-0.5 text-xs font-medium";

  switch (outcome) {
    case "REPAIRED":
      return (
        <span className={`inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 ${sizeClasses}`}>
          ✓ Repaired
        </span>
      );
    case "UNREPAIRABLE":
      return (
        <span className={`inline-flex items-center rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 ${sizeClasses}`}>
          ✕ Unrepairable
        </span>
      );
    case "PENDING":
    default:
      return (
        <span className={`inline-flex items-center rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 ${sizeClasses}`}>
          ⏳ In Progress / Pending
        </span>
      );
  }
}
