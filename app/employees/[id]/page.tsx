"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { EmployeeWithRelations, AssetWithRelations } from "@/lib/types";
import { LocationBadge, EmployeeStatusBadge, CategoryBadge, StatusBadge } from "@/components/ui/Badge";
import { EmployeeFormModal } from "@/components/employees/EmployeeFormModal";
import { OffboardModal } from "@/components/employees/OffboardModal";
import { ReturnAssetModal } from "@/components/assets/ReturnAssetModal";
import { DisposeModal } from "@/components/assets/DisposeModal";
import { useToast } from "@/components/ui/ToastContext";
import {
  ArrowLeft,
  Edit2,
  UserMinus,
  User,
  Laptop,
  Mail,
  Building2,
  Calendar,
  History,
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  HardDrive,
} from "lucide-react";
import { format } from "date-fns";

export default function EmployeeDetailPage() {
  const params = useParams();
  const { success, error } = useToast();

  const [employee, setEmployee] = useState<EmployeeWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isOffboardModalOpen, setIsOffboardModalOpen] = useState(false);
  const [assetToReturn, setAssetToReturn] = useState<AssetWithRelations | null>(null);
  const [assetToDispose, setAssetToDispose] = useState<AssetWithRelations | null>(null);

  const fetchEmployeeDetails = async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${params.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load employee");
      setEmployee(data);
    } catch (err: any) {
      error("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeDetails();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
        <p className="text-sm">Loading staff profile & asset ledger...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-8 text-center glass-panel rounded-2xl border border-slate-800">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Employee Not Found</h2>
        <Link
          href="/employees"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Directory
        </Link>
      </div>
    );
  }

  const assignedAssets = employee.assets || [];
  const isOffboardedWithAssets =
    employee.status === "OFFBOARDED" && assignedAssets.length > 0;

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/employees"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Staff Directory
        </Link>

        {/* Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Edit2 className="w-4 h-4 text-emerald-400" /> Edit Profile
          </button>

          {employee.status === "ACTIVE" ? (
            <button
              onClick={() => setIsOffboardModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all"
            >
              <UserMinus className="w-4 h-4" /> Offboard Staff & Settle Hardware
            </button>
          ) : isOffboardedWithAssets ? (
            <button
              onClick={() => setIsOffboardModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all"
            >
              <ShieldAlert className="w-4 h-4" /> Settle Unreturned Hardware
            </button>
          ) : null}
        </div>
      </div>

      {/* Offboarded Alert Callout */}
      {isOffboardedWithAssets && (
        <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5 animate-pulse" />
          <div className="flex-1">
            <h4 className="font-bold text-rose-100 text-sm">
              Urgent Clearance: Offboarded Employee Holds {assignedAssets.length} Unreturned Asset(s)
            </h4>
            <p className="mt-0.5">
              This staff member left the company but hardware assets remain in their custody. Return items to stock or mark them as lost.
            </p>
          </div>
          <button
            onClick={() => setIsOffboardModalOpen(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shrink-0"
          >
            Clear Hardware Now
          </button>
        </div>
      )}

      {/* Main Profile Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-blue-500/20">
              {employee.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-black text-white">{employee.name}</h1>
                <EmployeeStatusBadge status={employee.status} />
                <LocationBadge location={employee.officeLocation} />
              </div>
              <p className="text-sm font-medium text-slate-300">
                {employee.department} • <code className="text-emerald-400">{employee.email}</code>
              </p>
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Start Date</span>
            <span className="text-slate-100 font-medium">
              {format(new Date(employee.startDate), "MMMM dd, yyyy")}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Exit / End Date</span>
            <span className="text-slate-100 font-medium">
              {employee.endDate ? format(new Date(employee.endDate), "MMMM dd, yyyy") : "Active Tenure"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Office Hub</span>
            <span className="text-slate-100 font-medium">
              {employee.officeLocation === "HYD" ? "Hyderabad (HYD)" : "Mumbai (MUM)"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Current Active Assets</span>
            <span className="text-emerald-400 font-bold text-sm">
              {assignedAssets.length} Assigned Item{assignedAssets.length !== 1 ? "s" : ""}
            </span>
          </div>

          {employee.notes && (
            <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 col-span-2 sm:col-span-4">
              <span className="text-slate-400 font-semibold block mb-1">Notes & Details</span>
              <p className="text-slate-200 whitespace-pre-line">{employee.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Currently Held Hardware Assets */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-base font-bold text-white mb-4 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-blue-400" />
            Currently Assigned Hardware Equipment ({assignedAssets.length})
          </span>
        </h2>

        {assignedAssets.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-850/40 border border-slate-800 text-center text-xs text-slate-400">
            <HardDrive className="w-8 h-8 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">No hardware equipment currently issued.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignedAssets.map((asset) => (
              <div
                key={asset.id}
                className="p-4 rounded-xl bg-slate-850 border border-slate-700/80 hover:border-blue-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                      {asset.assetTag}
                    </span>
                    <CategoryBadge category={asset.category} size="sm" />
                  </div>

                  <Link
                    href={`/assets/${asset.id}`}
                    className="text-sm font-bold text-white hover:text-emerald-300 block"
                  >
                    {asset.name}
                  </Link>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {asset.brand} {asset.model}
                    {asset.serialNumber && ` • S/N: ${asset.serialNumber}`}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800">
                  <LocationBadge location={asset.officeLocation} size="sm" />
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setAssetToReturn(asset);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Return
                    </button>
                    <button
                      onClick={() => {
                        setAssetToDispose(asset);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-rose-300 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      Mark Lost
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lifetime Assignment History Ledger */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          Lifetime Equipment Custody Ledger
        </h2>

        <div className="space-y-3">
          {employee.assignments && employee.assignments.length > 0 ? (
            employee.assignments.map((asg) => (
              <div
                key={asg.id}
                className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/assets/${asg.assetId}`}
                      className="font-mono text-xs font-bold text-white hover:text-emerald-400"
                    >
                      {asg.asset?.assetTag || "Asset"}
                    </Link>
                    <span className="text-xs font-semibold text-slate-200">
                      {asg.asset?.name}
                    </span>
                    {asg.asset?.category && (
                      <CategoryBadge category={asg.asset.category} size="sm" />
                    )}
                  </div>
                  {asg.notes && (
                    <p className="text-xs text-slate-400 mt-1">{asg.notes}</p>
                  )}
                </div>

                <div className="text-right text-xs">
                  <div className="font-mono font-semibold text-slate-300">
                    {format(new Date(asg.assignedDate), "MMM dd, yyyy")} →{" "}
                    {asg.returnedDate ? (
                      format(new Date(asg.returnedDate), "MMM dd, yyyy")
                    ) : (
                      <span className="text-emerald-400 font-bold">CURRENTLY HELD</span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic">No equipment assignment history recorded.</p>
          )}
        </div>
      </div>

      {/* Modals */}
      <EmployeeFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        employeeToEdit={employee}
        onSuccess={fetchEmployeeDetails}
      />
      <OffboardModal
        isOpen={isOffboardModalOpen}
        onClose={() => setIsOffboardModalOpen(false)}
        employee={employee}
        onSuccess={fetchEmployeeDetails}
      />
      <ReturnAssetModal
        isOpen={!!assetToReturn}
        onClose={() => setAssetToReturn(null)}
        asset={assetToReturn}
        onSuccess={fetchEmployeeDetails}
      />
      <DisposeModal
        isOpen={!!assetToDispose}
        onClose={() => setAssetToDispose(null)}
        asset={assetToDispose}
        onSuccess={fetchEmployeeDetails}
      />
    </div>
  );
}
