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
  User,
  History,
  HardDrive,
  Copy,
  AlertTriangle,
  RefreshCw,
  Cpu,
  Zap,
  CheckCircle2,
  FileText,
  ExternalLink,
  Shield,
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

      {/* Main Asset Header Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="font-mono text-sm font-black bg-slate-800 px-3 py-1 rounded-lg border border-slate-700 text-emerald-400">
                {asset.assetTag}
              </span>
              {asset.sesaId && (
                <span className="font-mono text-xs font-bold bg-indigo-950/80 px-2.5 py-1 rounded-lg border border-indigo-500/40 text-indigo-300">
                  {asset.sesaId}
                </span>
              )}
              <CategoryBadge category={asset.category} />
              <LocationBadge location={asset.officeLocation} />
              <StatusBadge status={asset.stateDetail || asset.status} />
            </div>
            <h1 className="text-2xl font-black text-white">{asset.brand} {asset.model}</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {asset.name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => copyToClipboard(asset.assetTag, "Asset Tag")}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-slate-400" /> Copy ID
            </button>
          </div>
        </div>

        {/* Technical Specs & Hardware Configuration */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Processor (CPU)</span>
            <span className="text-slate-100 font-bold text-sm">
              {asset.processor || <span className="text-slate-500 italic">Not specified</span>}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">RAM Memory</span>
            <span className="text-slate-100 font-bold text-sm">
              {asset.ram || <span className="text-slate-500 italic">Not specified</span>}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Storage (SSD / HDD)</span>
            <span className="text-slate-100 font-bold text-sm">
              {asset.storage || <span className="text-slate-500 italic">Not specified</span>}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Serial / Service Tag</span>
            <span className="text-slate-100 font-mono font-bold text-xs truncate block" title={asset.serialNumber || ""}>
              {asset.serialNumber || <span className="text-slate-500 italic">None</span>}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Inspection Status</span>
            <span className="text-slate-100 font-medium">
              {asset.inspectionDone ? (
                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {asset.inspectionDone}
                </span>
              ) : (
                <span className="text-slate-500 italic">NO</span>
              )}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Antivirus Status</span>
            <span className="text-slate-100 font-medium">
              {asset.antivirus || <span className="text-slate-500 italic">Not recorded</span>}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Charger & Accessories</span>
            <span className="text-slate-100 font-medium">
              {asset.charger || asset.accessories || <span className="text-slate-500 italic">Standard</span>}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Invoice / Vendor Link</span>
            <span className="text-slate-100 font-medium">
              {asset.invoiceLink || asset.vendor || <span className="text-slate-500 italic">Internal</span>}
            </span>
          </div>

          {/* Full Configuration block */}
          {asset.configuration && (
            <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 sm:col-span-4">
              <span className="text-slate-400 font-semibold block mb-1">Detailed Technical Configuration</span>
              <pre className="text-slate-200 text-xs font-mono whitespace-pre-wrap bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                {asset.configuration}
              </pre>
            </div>
          )}

          {/* Condition / Final Summary block */}
          {asset.finalSummary && (
            <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800 sm:col-span-4">
              <span className="text-slate-400 font-semibold block mb-1">Inspection & Condition Summary</span>
              <p className="text-slate-200">{asset.finalSummary}</p>
            </div>
          )}
        </div>
      </div>

      {/* Warranty & Lifecycle Schedule Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-400" />
          Warranty & Service Timeline
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Purchase Date</span>
            <span className="text-slate-100 font-medium">
              {asset.purchaseDate ? format(new Date(asset.purchaseDate), "MMMM dd, yyyy") : "--"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Warranty Start Date</span>
            <span className="text-slate-100 font-medium">
              {asset.warrantyStartDate ? format(new Date(asset.warrantyStartDate), "MMMM dd, yyyy") : "--"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Warranty Expiry Date</span>
            <span className="text-slate-100 font-medium">
              {asset.warrantyEndDate || asset.warrantyExpiry ? format(new Date((asset.warrantyEndDate || asset.warrantyExpiry)!), "MMMM dd, yyyy") : "--"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-850/60 border border-slate-800">
            <span className="text-slate-400 font-semibold block mb-1">Extended Warranty / Extend Upto</span>
            <span className="text-slate-100 font-medium">
              {asset.extendWarrantyDate ? format(new Date(asset.extendWarrantyDate), "MMMM dd, yyyy") : (asset.extendUpto || "--")}
            </span>
          </div>
        </div>
      </div>

      {/* Custody, Users & Allocation Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-blue-400" />
          Current Custodian & Past Users Ledger
        </h2>

        {/* Current User */}
        {asset.employee ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-blue-950/20 border border-blue-500/30 mb-4">
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

            <button
              onClick={() => setIsReturnModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Return Asset
            </button>
          </div>
        ) : asset.currentUser && asset.currentUser !== "In Stock" && asset.currentUser !== "NONE" && asset.currentUser !== "-" ? (
          <div className="p-4 rounded-xl bg-slate-850 border border-slate-700 text-xs mb-4">
            <span className="text-slate-400 block mb-1">Current User (from Register):</span>
            <span className="font-bold text-white text-sm">{asset.currentUser}</span>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-slate-850/50 border border-slate-800 text-xs text-slate-400 mb-4">
            Asset is in inventory stock. Location: {asset.officeLocation} Office.
          </div>
        )}

        {/* Past Users List from CSV */}
        {asset.lastUser && !["NA", "NONE", "-", "?", ""].includes(asset.lastUser.trim().toUpperCase()) && (
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-2">
            <span className="text-slate-400 font-semibold block flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-emerald-400" /> Historical Users / Custodians:
            </span>
            <div className="flex flex-wrap gap-2">
              {asset.lastUser
                .split(/[\n,;]+/)
                .map((u) => u.trim())
                .filter((u) => u.length > 0 && !["NA", "NONE", "-", "?"].includes(u.toUpperCase()))
                .map((u, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium inline-flex items-center gap-1.5"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    {u}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Two Column Section: Service History & Maintenance Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service / Repair History Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-amber-400" />
            Hardware Service History
          </h2>

          {asset.serviceHistory ? (
            <div className="p-3.5 rounded-xl bg-slate-850/80 border border-slate-700 text-xs text-slate-200 whitespace-pre-wrap">
              {asset.serviceHistory}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No previous service logs recorded.</p>
          )}
        </div>

        {/* System Maintenance Logs */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" />
              Maintenance Ticket Logs
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
                      Vendor: {m.sentTo}
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
