"use client";

import React, { useEffect, useState, useContext } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AssetWithRelations } from "@/lib/types";
import { LocationFilterContext } from "@/components/layout/AppShell";
import { StatusBadge, LocationBadge, CategoryBadge } from "@/components/ui/Badge";
import { AssetFormModal } from "@/components/assets/AssetFormModal";
import { AssignAssetModal } from "@/components/assets/AssignAssetModal";
import { ReturnAssetModal } from "@/components/assets/ReturnAssetModal";
import { MaintenanceModal } from "@/components/assets/MaintenanceModal";
import { DisposeModal } from "@/components/assets/DisposeModal";
import { CsvImportModal } from "@/components/assets/CsvImportModal";
import { exportAssetsToCsv, triggerCsvDownload } from "@/lib/csv";
import { useToast } from "@/components/ui/ToastContext";
import {
  Search,
  Plus,
  FileSpreadsheet,
  Download,
  Filter,
  Eye,
  Edit2,
  UserCheck,
  RotateCcw,
  Wrench,
  Trash2,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  HardDrive,
  Copy,
  ExternalLink,
} from "lucide-react";
import { format, isPast, differenceInDays } from "date-fns";

export default function AssetsPage() {
  const searchParams = useSearchParams();
  const { location: globalLocation } = useContext(LocationFilterContext);
  const { success, error } = useToast();

  const [assets, setAssets] = useState<AssetWithRelations[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "ALL");
  const [status, setStatus] = useState(searchParams.get("status") || "ALL");
  const [location, setLocation] = useState(searchParams.get("location") || "ALL");
  const [warranty, setWarranty] = useState(searchParams.get("warranty") || "ALL");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [assetToEdit, setAssetToEdit] = useState<AssetWithRelations | null>(null);

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assetToAssign, setAssetToAssign] = useState<AssetWithRelations | null>(null);

  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [assetToReturn, setAssetToReturn] = useState<AssetWithRelations | null>(null);

  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [assetToRepair, setAssetToRepair] = useState<AssetWithRelations | null>(null);

  const [isDisposeModalOpen, setIsDisposeModalOpen] = useState(false);
  const [assetToDispose, setAssetToDispose] = useState<AssetWithRelations | null>(null);

  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Sync with global location header if changed
  useEffect(() => {
    if (globalLocation !== "ALL") {
      setLocation(globalLocation);
    }
  }, [globalLocation]);

  const fetchAssets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category !== "ALL") params.append("category", category);
      if (status !== "ALL") params.append("status", status);
      if (location !== "ALL") params.append("location", location);
      if (warranty !== "ALL") params.append("warranty", warranty);
      params.append("page", page.toString());
      params.append("limit", limit.toString());

      const res = await fetch(`/api/assets?${params.toString()}`);
      const data = await res.json();

      if (data.assets) {
        setAssets(data.assets);
        setTotalCount(data.pagination.total);
      }
    } catch (err) {
      console.error("Failed to fetch assets:", err);
      error("Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, [search, category, status, location, warranty, page, limit]);

  const handleExportCsv = async () => {
    try {
      // Fetch all matching assets for export
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category !== "ALL") params.append("category", category);
      if (status !== "ALL") params.append("status", status);
      if (location !== "ALL") params.append("location", location);
      if (warranty !== "ALL") params.append("warranty", warranty);
      params.append("all", "true");

      const res = await fetch(`/api/assets?${params.toString()}`);
      const data = await res.json();

      if (data.assets && data.assets.length > 0) {
        const csvString = exportAssetsToCsv(data.assets);
        const fileName = `hardware_assets_export_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
        triggerCsvDownload(csvString, fileName);
        success("CSV Exported", `Exported ${data.assets.length} assets.`);
      } else {
        error("Export Empty", "No assets match the current filter criteria.");
      }
    } catch (err) {
      error("Export Error", "Failed to generate CSV export");
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    success("Copied", `${label} copied to clipboard.`);
  };

  const getWarrantyBadge = (expiryDate: string | Date) => {
    const d = new Date(expiryDate);
    const now = new Date();
    if (isPast(d)) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400">
          <AlertTriangle className="w-3 h-3" /> Expired ({format(d, "MMM dd, yyyy")})
        </span>
      );
    }
    const daysLeft = differenceInDays(d, now);
    if (daysLeft <= 30) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-500/30">
          ⚠️ {daysLeft}d left ({format(d, "MMM dd, yyyy")})
        </span>
      );
    }
    if (daysLeft <= 90) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-300 bg-amber-950/30 px-2 py-0.5 rounded border border-amber-500/30">
          ⏳ {daysLeft}d left ({format(d, "MMM dd, yyyy")})
        </span>
      );
    }
    return (
      <span className="text-[11px] text-slate-400">
        {format(d, "MMM dd, yyyy")}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Hardware Asset Inventory
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Browse, allocate, repair, and audit enterprise hardware items across Hyderabad & Mumbai.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => {
              setAssetToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Asset
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Import CSV
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs sm:text-sm font-semibold flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4 text-blue-400" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Controls Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search tag, model, serial, employee..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Categories</option>
              <option value="Laptop">Laptops</option>
              <option value="Desktop">Desktops</option>
              <option value="Monitor">Monitors</option>
              <option value="Peripheral">Peripherals</option>
              <option value="Networking">Networking</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="IN_USE">In Use</option>
              <option value="UNDER_REPAIR">Under Repair</option>
              <option value="LOST">Lost / Stolen</option>
              <option value="SCRAPPED">Scrapped</option>
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <select
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Offices</option>
              <option value="HYD">Hyderabad (HYD)</option>
              <option value="MUM">Mumbai (MUM)</option>
            </select>
          </div>

          {/* Warranty Filter */}
          <div>
            <select
              value={warranty}
              onChange={(e) => {
                setWarranty(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Warranties</option>
              <option value="30">Expiring in ≤ 30 Days</option>
              <option value="60">Expiring in ≤ 60 Days</option>
              <option value="90">Expiring in ≤ 90 Days</option>
              <option value="expired">Expired Warranties</option>
            </select>
          </div>
        </div>

        {/* Results Counter & Reset */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          <span>
            Showing <strong>{assets.length}</strong> of <strong>{totalCount}</strong> matching assets
          </span>
          {(search || category !== "ALL" || status !== "ALL" || location !== "ALL" || warranty !== "ALL") && (
            <button
              onClick={() => {
                setSearch("");
                setCategory("ALL");
                setStatus("ALL");
                setLocation("ALL");
                setWarranty("ALL");
                setPage(1);
              }}
              className="text-emerald-400 hover:text-emerald-300 font-medium underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Assets Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Asset Tag</th>
                <th className="py-3 px-4 font-semibold">Hardware Specs</th>
                <th className="py-3 px-4 font-semibold">Category</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Assigned Employee</th>
                <th className="py-3 px-4 font-semibold">Location</th>
                <th className="py-3 px-4 font-semibold">Warranty Expiry</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    Loading hardware assets...
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <HardDrive className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-300 text-sm">No hardware assets found</p>
                    <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or register a new asset.</p>
                  </td>
                </tr>
              ) : (
                assets.map((asset) => (
                  <tr
                    key={asset.id}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    {/* Tag */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/assets/${asset.id}`}
                          className="font-mono font-bold text-white hover:text-emerald-400 transition-colors"
                        >
                          {asset.assetTag}
                        </Link>
                        <button
                          onClick={() => copyToClipboard(asset.assetTag, "Asset Tag")}
                          title="Copy tag"
                          className="opacity-0 group-hover:opacity-100 p-1 hover:text-white transition-opacity"
                        >
                          <Copy className="w-3 h-3 text-slate-400" />
                        </button>
                      </div>
                    </td>

                    {/* Hardware Name & Specs */}
                    <td className="py-3 px-4">
                      <div>
                        <Link
                          href={`/assets/${asset.id}`}
                          className="font-semibold text-slate-100 hover:text-emerald-300 block"
                        >
                          {asset.name}
                        </Link>
                        <p className="text-[11px] text-slate-400">
                          {asset.brand} {asset.model}
                          {asset.serialNumber && ` • S/N: ${asset.serialNumber}`}
                        </p>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <CategoryBadge category={asset.category} size="sm" />
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <StatusBadge status={asset.status} size="sm" />
                    </td>

                    {/* Assigned Employee (RESOLVED TO NAME INSTEAD OF RAW UUID) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {asset.employee ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-semibold text-blue-300">
                          <span>{asset.employee.name}</span>
                          <span className="text-[10px] text-slate-400">({asset.employee.department})</span>
                        </span>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">Unassigned (In Inventory)</span>
                      )}
                    </td>

                    {/* Location */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <LocationBadge location={asset.officeLocation} size="sm" />
                    </td>

                    {/* Warranty */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {getWarrantyBadge(asset.warrantyExpiry)}
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/assets/${asset.id}`}
                          title="View Details"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {/* Quick Assign / Return Button */}
                        {asset.status === "IN_STOCK" ? (
                          <button
                            onClick={() => {
                              setAssetToAssign(asset);
                              setIsAssignModalOpen(true);
                            }}
                            title="Assign to Employee"
                            className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-950/40 transition-colors"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        ) : asset.status === "IN_USE" ? (
                          <button
                            onClick={() => {
                              setAssetToReturn(asset);
                              setIsReturnModalOpen(true);
                            }}
                            title="Return to Stock"
                            className="p-1.5 rounded-lg text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        ) : null}

                        {/* Log Repair */}
                        {asset.status !== "SCRAPPED" && asset.status !== "LOST" && (
                          <button
                            onClick={() => {
                              setAssetToRepair(asset);
                              setIsMaintenanceModalOpen(true);
                            }}
                            title="Log Repair / Maintenance"
                            className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-amber-950/40 transition-colors"
                          >
                            <Wrench className="w-4 h-4" />
                          </button>
                        )}

                        {/* Edit */}
                        <button
                          onClick={() => {
                            setAssetToEdit(asset);
                            setIsFormModalOpen(true);
                          }}
                          title="Edit Asset"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Scrap / Dispose */}
                        {asset.status !== "SCRAPPED" && asset.status !== "LOST" && (
                          <button
                            onClick={() => {
                              setAssetToDispose(asset);
                              setIsDisposeModalOpen(true);
                            }}
                            title="Dispose / Scrap Asset"
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 bg-slate-900/50">
          <div>
            Page <strong>{page}</strong> of <strong>{Math.max(1, Math.ceil(totalCount / limit))}</strong>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= Math.ceil(totalCount / limit)}
              className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AssetFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        assetToEdit={assetToEdit}
        onSuccess={fetchAssets}
      />
      <AssignAssetModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        asset={assetToAssign}
        onSuccess={fetchAssets}
      />
      <ReturnAssetModal
        isOpen={isReturnModalOpen}
        onClose={() => setIsReturnModalOpen(false)}
        asset={assetToReturn}
        onSuccess={fetchAssets}
      />
      <MaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        asset={assetToRepair}
        onSuccess={fetchAssets}
      />
      <DisposeModal
        isOpen={isDisposeModalOpen}
        onClose={() => setIsDisposeModalOpen(false)}
        asset={assetToDispose}
        onSuccess={fetchAssets}
      />
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchAssets}
      />
    </div>
  );
}
