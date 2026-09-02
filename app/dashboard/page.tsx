"use client";

import React, { useEffect, useState, useContext } from "react";
import Link from "next/link";
import { DashboardKPIs } from "@/lib/types";
import { LocationFilterContext } from "@/components/layout/AppShell";
import { AssetFormModal } from "@/components/assets/AssetFormModal";
import { CsvImportModal } from "@/components/assets/CsvImportModal";
import { EmployeeFormModal } from "@/components/employees/EmployeeFormModal";
import {
  Laptop,
  CheckCircle2,
  Package,
  Wrench,
  Trash2,
  Users,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  Plus,
  FileSpreadsheet,
  UserPlus,
  RefreshCw,
  Building2,
  ShieldAlert,
  ChevronRight,
  Activity,
} from "lucide-react";
import { format } from "date-fns";

export default function DashboardPage() {
  const { location } = useContext(LocationFilterContext);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      setKpis(data);
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Asset Operations Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time hardware inventory, assignment ledger, warranty health, and clearance audit.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={() => setIsAssetModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Add Asset
          </button>
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Import CSV
          </button>
          {/* Hidden for current view:
          <button
            onClick={() => setIsEmployeeModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <UserPlus className="w-4 h-4 text-blue-400" /> Onboard Staff
          </button>
          */}
          <button
            onClick={fetchDashboardData}
            title="Refresh metrics"
            className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* OFFBOARDED WITH UNRETURNED ASSETS ALERT (High Priority Callout) */}
      {kpis?.offboardedWithUnreturnedAssets && kpis.offboardedWithUnreturnedAssets.length > 0 && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/80 to-amber-950/40 border border-rose-500/50 shadow-xl shadow-rose-950/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-rose-100 flex items-center gap-2">
                  Action Required: Offboarded Employees with Unreturned Hardware
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 text-xs font-black">
                    {kpis.offboardedWithUnreturnedAssets.length} Staff Affected
                  </span>
                </h3>
                <p className="text-xs text-rose-200/90 mt-1 max-w-2xl">
                  The following offboarded personnel still have hardware assigned to their records. View their assets to initiate recovery or mark as lost.
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {kpis.offboardedWithUnreturnedAssets.map((off) => (
                    <Link
                      key={off.employeeId}
                      href={`/assets?search=${encodeURIComponent(off.employeeName)}`}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800/80 border border-rose-400/40 text-xs font-semibold text-white transition-all"
                    >
                      <span>{off.employeeName}</span>
                      <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 font-mono text-[11px]">
                        {off.unreturnedCount} unreturned
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-rose-300" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Assets */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Assets</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {kpis?.totalAssets ?? "--"}
            </div>
            <Link
              href="/assets"
              className="text-[11px] text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-0.5 mt-1"
            >
              View Inventory <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* In Use */}
        <div className="glass-panel p-4 rounded-2xl border border-blue-500/20 bg-blue-950/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-blue-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Use</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
              <Laptop className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-100">
              {kpis?.inUse ?? "--"}
            </div>
            <p className="text-[11px] text-blue-300/80 font-medium mt-1">
              Active staff allocations
            </p>
          </div>
        </div>

        {/* In Stock */}
        <div className="glass-panel p-4 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Stock</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-100">
              {kpis?.inStock ?? "--"}
            </div>
            <p className="text-[11px] text-emerald-300/80 font-medium mt-1">
              Ready for deployment
            </p>
          </div>
        </div>

        {/* Under Repair */}
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/20 bg-amber-950/10 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-300 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Under Repair</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-amber-100">
              {kpis?.underRepair ?? "--"}
            </div>
            <Link
              href="/assets?status=UNDER_REPAIR"
              className="text-[11px] text-amber-400 hover:text-amber-300 font-medium flex items-center gap-0.5 mt-1"
            >
              Track Repairs <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Scrapped / Lost */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Scrapped / Lost</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-rose-400">
              <Trash2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-200">
              {(kpis?.scrapped ?? 0) + (kpis?.lost ?? 0)}
            </div>
            <p className="text-[11px] text-slate-400 font-medium mt-1">
              {kpis?.scrapped ?? 0} Scrapped • {kpis?.lost ?? 0} Lost
            </p>
          </div>
        </div>

        {/* Active Staff */}
        <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Staff</span>
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-emerald-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-white">
              {kpis?.activeEmployees ?? "--"}
            </div>
            <Link
              href="/assets?status=IN_USE"
              className="text-[11px] text-blue-400 hover:text-blue-300 font-medium flex items-center gap-0.5 mt-1"
            >
              Assigned Assets <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Second Row: Warranty Countdown Matrix + Location Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Warranty Expiry Matrix */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                Warranty Expiration Radar
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Proactive monitoring of hardware service contract expirations.
              </p>
            </div>
            <Link
              href="/assets?warranty=90"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
            >
              View Warranties <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {/* 30 Days */}
            <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/30 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs font-semibold text-rose-300 mb-2">
                <span>Expiring ≤ 30 Days</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                  Critical
                </span>
              </div>
              <div className="text-3xl font-black text-rose-200">
                {kpis?.warrantiesExpiring30Days ?? 0}
              </div>
              <Link
                href="/assets?warranty=30"
                className="text-[11px] text-rose-300/90 hover:underline mt-2 font-medium"
              >
                View 30-day assets →
              </Link>
            </div>

            {/* 60 Days */}
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs font-semibold text-amber-300 mb-2">
                <span>Expiring ≤ 60 Days</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                  Warning
                </span>
              </div>
              <div className="text-3xl font-black text-amber-200">
                {kpis?.warrantiesExpiring60Days ?? 0}
              </div>
              <Link
                href="/assets?warranty=60"
                className="text-[11px] text-amber-300/90 hover:underline mt-2 font-medium"
              >
                View 60-day assets →
              </Link>
            </div>

            {/* 90 Days */}
            <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30 flex flex-col justify-between">
              <div className="flex justify-between items-center text-xs font-semibold text-blue-300 mb-2">
                <span>Expiring ≤ 90 Days</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                  Upcoming
                </span>
              </div>
              <div className="text-3xl font-black text-blue-200">
                {kpis?.warrantiesExpiring90Days ?? 0}
              </div>
              <Link
                href="/assets?warranty=90"
                className="text-[11px] text-blue-300/90 hover:underline mt-2 font-medium"
              >
                View 90-day assets →
              </Link>
            </div>
          </div>
        </div>

        {/* Office Hub Distribution (HYD vs MUM) */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-400" />
              Office Hub Distribution
            </h2>
          </div>

          <div className="space-y-4">
            {[...(kpis?.locationBreakdown ?? [])].sort((a, b) => (a.location === "MUM" ? -1 : b.location === "MUM" ? 1 : 0)).map((loc) => (
              <div
                key={loc.location}
                className="p-3.5 rounded-xl bg-slate-850 border border-slate-700/60"
              >
                <div className="flex items-center justify-between font-semibold text-sm text-white mb-2">
                  <span>{loc.location === "HYD" ? "Hyderabad (HYD)" : "Mumbai (MUM)"}</span>
                  <span className="text-emerald-400">{loc.total} Assets</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden flex">
                  <div
                    style={{
                      width: `${loc.total > 0 ? (loc.inUse / loc.total) * 100 : 0}%`,
                    }}
                    className="bg-blue-500 h-full"
                    title={`In Use: ${loc.inUse}`}
                  />
                  <div
                    style={{
                      width: `${loc.total > 0 ? (loc.inStock / loc.total) * 100 : 0}%`,
                    }}
                    className="bg-emerald-500 h-full"
                    title={`In Stock: ${loc.inStock}`}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400 mt-2">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500" /> In Use: {loc.inUse}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> In Stock: {loc.inStock}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Third Row: Category Breakdown + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800">
          <h2 className="text-base font-bold text-white mb-1">Assets by Category</h2>
          <p className="text-xs text-slate-400 mb-4">Inventory density across hardware classes</p>

          <div className="space-y-3">
            {kpis?.categoryBreakdown.map((cat) => {
              const percentage =
                kpis.totalAssets > 0
                  ? Math.round((cat.count / kpis.totalAssets) * 100)
                  : 0;

              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-300">{cat.category}</span>
                    <span className="text-slate-400 font-mono">
                      {cat.count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Operations Activity Log */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Recent Asset Lifecycle Events
            </h2>
            <Link
              href="/assets"
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold"
            >
              View All Assets →
            </Link>
          </div>

          <div className="space-y-3">
            {kpis?.recentActivity && kpis.recentActivity.length > 0 ? (
              kpis.recentActivity.map((act) => (
                <div
                  key={act.id}
                  className="flex items-start justify-between gap-3 p-3 rounded-xl bg-slate-850/60 border border-slate-800 hover:border-slate-700 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      {act.type === "assignment" && (
                        <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold text-xs">
                          ASG
                        </div>
                      )}
                      {act.type === "return" && (
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                          RET
                        </div>
                      )}
                      {act.type === "maintenance" && (
                        <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                          SVC
                        </div>
                      )}
                      {act.type === "disposal" && (
                        <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xs">
                          DSP
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">
                          {act.assetTag}
                        </span>
                        <span className="text-xs text-slate-300">{act.assetName}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{act.description}</p>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 whitespace-nowrap">
                    {format(new Date(act.timestamp), "MMM dd, yyyy")}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                No recent activity recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AssetFormModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
      <CsvImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
      <EmployeeFormModal
        isOpen={isEmployeeModalOpen}
        onClose={() => setIsEmployeeModalOpen(false)}
        onSuccess={fetchDashboardData}
      />
    </div>
  );
}
