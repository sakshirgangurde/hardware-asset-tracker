"use client";

import React, { useEffect, useState, useContext } from "react";
import Link from "next/link";
import { MaintenanceLogItem } from "@/lib/types";
import { LocationFilterContext } from "@/components/layout/AppShell";
import { OutcomeBadge, LocationBadge, CategoryBadge } from "@/components/ui/Badge";
import { MaintenanceModal } from "@/components/assets/MaintenanceModal";
import { useToast } from "@/components/ui/ToastContext";
import {
  Wrench,
  Search,
  CheckCircle2,
  Clock,
  AlertOctagon,
  RefreshCw,
  HardDrive,
  ExternalLink,
} from "lucide-react";
import { format } from "date-fns";

export default function MaintenancePage() {
  const { location: globalLocation } = useContext(LocationFilterContext);
  const { error } = useToast();

  const [logs, setLogs] = useState<MaintenanceLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("ALL");

  const fetchMaintenanceData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports?type=maintenance_history&location=${globalLocation}`);
      const json = await res.json();
      if (json.data) {
        setLogs(json.data);
      }
    } catch (err) {
      console.error("Failed to load maintenance logs:", err);
      error("Failed to load maintenance logs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceData();
  }, [globalLocation]);

  const filteredLogs = logs.filter((log) => {
    const matchesOutcome =
      outcomeFilter === "ALL" || log.outcome === outcomeFilter;
    const matchesSearch =
      !search ||
      log.asset?.assetTag.toLowerCase().includes(search.toLowerCase()) ||
      log.asset?.name.toLowerCase().includes(search.toLowerCase()) ||
      log.issueDescription.toLowerCase().includes(search.toLowerCase()) ||
      log.sentTo.toLowerCase().includes(search.toLowerCase());

    return matchesOutcome && matchesSearch;
  });

  const pendingCount = logs.filter((l) => l.outcome === "PENDING").length;
  const repairedCount = logs.filter((l) => l.outcome === "REPAIRED").length;
  const unrepairableCount = logs.filter((l) => l.outcome === "UNREPAIRABLE").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Maintenance & Service Tracker
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Monitor open diagnostic tickets, vendor repairs, warranty service, and return verifications.
          </p>
        </div>

        <button
          onClick={fetchMaintenanceData}
          className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 border border-slate-700 text-slate-400 hover:text-slate-200 self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-emerald-400" : ""}`} />
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 bg-amber-950/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              Currently Under Repair
            </span>
            <div className="text-3xl font-black text-amber-200 mt-1">{pendingCount}</div>
            <p className="text-xs text-amber-300/80 mt-0.5">Active with service centers</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-emerald-500/20 bg-emerald-950/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Successfully Repaired
            </span>
            <div className="text-3xl font-black text-emerald-200 mt-1">{repairedCount}</div>
            <p className="text-xs text-emerald-300/80 mt-0.5">Restored to service</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-rose-500/20 bg-rose-950/10 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
              Unrepairable / Scrapped
            </span>
            <div className="text-3xl font-black text-rose-200 mt-1">{unrepairableCount}</div>
            <p className="text-xs text-rose-300/80 mt-0.5">Decommissioned items</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
            <AlertOctagon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by tag, model, vendor, issue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="sm:w-60">
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="ALL">All Outcomes</option>
            <option value="PENDING">In Progress (Pending)</option>
            <option value="REPAIRED">Repaired</option>
            <option value="UNREPAIRABLE">Unrepairable</option>
          </select>
        </div>
      </div>

      {/* Maintenance Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Asset Tag & Device</th>
                <th className="py-3 px-4 font-semibold">Issue Description</th>
                <th className="py-3 px-4 font-semibold">Service Vendor</th>
                <th className="py-3 px-4 font-semibold">Reported Date</th>
                <th className="py-3 px-4 font-semibold">Returned Date</th>
                <th className="py-3 px-4 font-semibold">Status / Outcome</th>
                <th className="py-3 px-4 font-semibold">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                    Loading maintenance records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Wrench className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-300 text-sm">No maintenance records found</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/assets/${log.assetId}`}
                          className="font-mono font-bold text-white hover:text-emerald-400"
                        >
                          {log.asset?.assetTag}
                        </Link>
                        <span className="text-slate-300 font-medium">{log.asset?.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 max-w-xs text-slate-200">
                      {log.issueDescription}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-300">
                      {log.sentTo}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {format(new Date(log.dateReported), "MMM dd, yyyy")}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {log.dateReturned ? (
                        format(new Date(log.dateReturned), "MMM dd, yyyy")
                      ) : (
                        <span className="text-amber-400 font-medium">In Service</span>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <OutcomeBadge outcome={log.outcome} size="sm" />
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                      {log.performedBy}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
