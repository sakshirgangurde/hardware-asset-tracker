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
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs font-semibold";

  switch (status) {
    case "IN_STOCK":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          In Stock
        </span>
      );
    case "IN_USE":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
          In Use
        </span>
      );
    case "UNDER_REPAIR":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
          Under Repair
        </span>
      );
    case "LOST":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
          Lost / Stolen
        </span>
      );
    case "SCRAPPED":
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-slate-500/20 text-slate-400 border border-slate-600/40 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
          Scrapped
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1.5 rounded-full bg-gray-700/50 text-gray-300 border border-gray-600 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
}

export function LocationBadge({ location, size = "md" }: { location: OfficeLocation | string; size?: "sm" | "md" }) {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-0.5 text-xs font-semibold";

  if (location === "HYD") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30 ${sizeClasses}`}>
        📍 HYD (Hyderabad)
      </span>
    );
  }
  if (location === "MUM") {
    return (
      <span className={`inline-flex items-center gap-1 rounded-md bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 ${sizeClasses}`}>
        📍 MUM (Mumbai)
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
