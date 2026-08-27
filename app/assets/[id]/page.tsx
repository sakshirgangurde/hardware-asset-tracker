"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AssetWithRelations } from "@/lib/types";
import { StatusBadge, LocationBadge, CategoryBadge, OutcomeBadge } from "@/components/ui/Badge";
import { AssetFormModal } from "@/components/assets/AssetFormModal";
import { AssignAssetModal } from "@/components/assets/AssignAssetModal";
import { ReturnAssetModal } from "@/components/assets/ReturnAssetModal";
import { MaintenanceModal } from "@/components/assets/MaintenanceModal";
import { DisposeModal } from "@/components/assets/DisposeModal";
import { useToast } from "@/components/ui/ToastContext";
import {
  ArrowLeft,
  Edit2,
  UserCheck,
  RotateCcw,
  Wrench,
  Trash2,
  Calendar,
  ShieldCheck,
  Building2,
  User,
  History,
  Tag,
  Clock,
  HardDrive,
  Copy,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import { format, differenceInDays, isPast } from "date-fns";

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { success, error } = useToast();

  const [asset, setAsset] = useState<AssetWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isDisposeModalOpen, setIsDisposeModalOpen] = useState(false);

  const fetchAssetDetails = async () => {
    if (!params.id) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${params.id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load asset");
      setAsset(data);
    } catch (err: any) {
      error("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssetDetails();
  }, [params.id]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    success("Copied", `${label} copied to clipboard.`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mb-3" />
        <p className="text-sm">Loading hardware asset profile...</p>
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="p-8 text-center glass-panel rounded-2xl border border-slate-800">
        <AlertTriangle className="w-10 h-10 text-rose-400 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-white">Asset Not Found</h2>
        <p className="text-xs text-slate-400 mt-1">The requested hardware asset does not exist.</p>
        <Link
          href="/assets"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Assets
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Back Navigation & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/assets"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Assets Directory
        </Link>

        {/* Action Toolbar */}
        <div className="flex items-center flex-wrap gap-2">
          {asset.status === "IN_STOCK" && (
            <button
              onClick={() => setIsAssignModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-600/20 transition-all"
            >
              <UserCheck className="w-4 h-4" /> Assign to Staff
            </button>
          )}

          {asset.status === "IN_USE" && (
            <button
              onClick={() => setIsReturnModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Return to Stock
            </button>
          )}

          {asset.status !== "SCRAPPED" && asset.status !== "LOST" && (
            <button
              onClick={() => setIsMaintenanceModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Wrench className="w-4 h-4" /> Log Repair
            </button>
          )}

          <button
            onClick={() => setIsFormModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Edit2 className="w-4 h-4 text-emerald-400" /> Edit Asset
          </button>

          {asset.status !== "SCRAPPED" && asset.status !== "LOST" && (
            <button
              onClick={() => setIsDisposeModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950/40 text-rose-300 border border-slate-700 hover:border-rose-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Trash2 className="w-4 h-4" /> Scrap / Dispose
            </button>
          )}
        </div>
      </div>

      {/* Disposal Audit Banner (If Scrapped or Lost) */}
      {asset.disposals && asset.disposals.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-500/50 text-rose-200 text-xs flex items-start gap-3">
          <Trash2 className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-rose-100 text-sm">
              Asset Lifecycle Decommissioned / Audited
            </h4>
            <p className="mt-0.5">
              Reason: <strong>{asset.disposals[0].disposalReason.replace(/_/g, " ")}</strong> • Date:{" "}
              {format(new Date(asset.disposals[0].disposalDate), "MMMM dd, yyyy")}
            </p>
            {asset.disposals[0].notes && (
              <p className="mt-1 text-slate-300">Audit Notes: {asset.disposals[0].notes}</p>
            )}
          </div>
        </div>
      )}

      {/* Main Asset Header Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-sm font-black bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 text-emerald-400">
                {asset.assetTag}
              </span>
              <CategoryBadge category={asset.category} />
              <LocationBadge location={asset.officeLocation} />
              <StatusBadge status={asset.status} />
            </div>
            <h1 className="text-2xl font-black text-white">{asset.name}</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {asset.brand} • {asset.model}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => copyToClipboard(asset.assetTag, "Asset Tag")}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy Tag
            </button>
          </div>
        </div>

        {/* Technical Specs & Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Serial Number</span>
            <span className="text-slate-100 font-mono font-bold text-sm">
              {asset.serialNumber || <span className="text-slate-500 italic">None</span>}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Purchase Date</span>
            <span className="text-slate-100 font-medium">
              {asset.purchaseDate ? format(new Date(asset.purchaseDate), "MMMM dd, yyyy") : "--"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Warranty Term</span>
            <span className="text-slate-100 font-medium">
              {asset.warrantyExpiry ? format(new Date(asset.warrantyExpiry), "MMMM dd, yyyy") : "--"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Vendor / Reseller</span>
            <span className="text-slate-100 font-medium">
              {asset.vendor || <span className="text-slate-500 italic">Not recorded</span>}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 sm:col-span-2">
            <span className="text-slate-400 font-semibold block mb-1">Included Accessories</span>
            <span className="text-slate-200">
              {asset.accessories || <span className="text-slate-500 italic">No accessories listed</span>}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 sm:col-span-2">
            <span className="text-slate-400 font-semibold block mb-1">Internal Location / Notes</span>
            <span className="text-slate-200">
              {asset.notes || <span className="text-slate-500 italic">No internal notes</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Current Assignment Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400" />
          Active Hardware Custody & Allocation
        </h2>

        {asset.employee ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-950/20 border border-blue-500/30">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-base">
                {asset.employee.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{asset.employee.name}</h3>
                  <LocationBadge location={asset.employee.officeLocation} size="sm" />
                </div>
                <p className="text-xs text-slate-300">
                  {asset.employee.department} • <code className="text-blue-300">{asset.employee.email}</code>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsReturnModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Return Asset
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 rounded-xl bg-slate-850/50 border border-slate-800 text-center text-xs text-slate-400">
            <HardDrive className="w-6 h-6 mx-auto text-slate-600 mb-2" />
            <p className="font-semibold text-slate-300">Asset is currently in inventory stock</p>
            <p className="text-slate-500 mt-0.5">Location: {asset.officeLocation} Office Locker</p>
            {asset.status === "IN_STOCK" && (
              <button
                onClick={() => setIsAssignModalOpen(true)}
                className="mt-3 px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold inline-flex items-center gap-1.5"
              >
                <UserCheck className="w-3.5 h-3.5" /> Assign to Employee
              </button>
            )}
          </div>
        )}
      </div>

      {/* Two Column Section: Assignment History Timeline & Maintenance Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment History Timeline */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" />
            Assignment History Ledger
          </h2>

          <div className="space-y-4">
            {asset.assignments && asset.assignments.length > 0 ? (
              asset.assignments.map((asg, idx) => (
                <div
                  key={asg.id}
                  className="relative pl-6 pb-4 border-l-2 border-slate-800 last:border-l-0 last:pb-0"
                >
                  <div
                    className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-slate-900 ${
                      asg.returnedDate ? "bg-slate-600" : "bg-emerald-500"
                    }`}
                  />
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-white">
                        {asg.employee?.name || "Employee"}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {format(new Date(asg.assignedDate), "MMM dd, yyyy")} →{" "}
                        {asg.returnedDate ? format(new Date(asg.returnedDate), "MMM dd, yyyy") : "PRESENT"}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {asg.employee?.department} ({asg.employee?.officeLocation})
                    </p>
                    {asg.notes && (
                      <p className="text-xs text-slate-300 mt-1 bg-slate-850 p-2 rounded-lg border border-slate-800">
                        {asg.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No previous assignment records.</p>
            )}
          </div>
        </div>

        {/* Maintenance Logs */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              Maintenance & Repair Records
            </h2>
            <button
              onClick={() => setIsMaintenanceModalOpen(true)}
              className="text-xs text-amber-400 hover:text-amber-300 font-semibold"
            >
              + Log Repair
            </button>
          </div>

          <div className="space-y-3">
            {asset.maintenance && asset.maintenance.length > 0 ? (
              asset.maintenance.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">
                      Service Vendor: {m.sentTo}
                    </span>
                    <OutcomeBadge outcome={m.outcome} size="sm" />
                  </div>
                  <p className="text-xs text-slate-300">{m.issueDescription}</p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Logged by: {m.performedBy}</span>
                    <span>{format(new Date(m.dateReported), "MMM dd, yyyy")}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No maintenance tickets reported.</p>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AssetFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        assetToEdit={asset}
        onSuccess={fetchAssetDetails}
      />
      <AssignAssetModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        asset={asset}
        onSuccess={fetchAssetDetails}
      />
      <ReturnAssetModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        asset={asset}
        onSuccess={fetchAssetDetails}
      />
      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        asset={asset}
        onSuccess={fetchAssetDetails}
      />
      <DisposeModal
        isOpen={isDisposeModalOpen}
        onClose={() => setIsDisposeModalOpen(false)}
        asset={asset}
        onSuccess={fetchAssetDetails}
      />
    </div>
  );
}
