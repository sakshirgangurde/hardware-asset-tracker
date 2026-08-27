"use client";

import React, { useEffect, useState, useContext } from "react";
import { LocationFilterContext } from "@/components/layout/AppShell";
import { exportAssetsToCsv, exportAssignmentsToCsv, triggerCsvDownload } from "@/lib/csv";
import Papa from "papaparse";
import { useToast } from "@/components/ui/ToastContext";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  History,
  Wrench,
  Trash2,
  HardDrive,
  Filter,
  CheckCircle2,
  RefreshCw,
  Building2,
} from "lucide-react";
import { format } from "date-fns";

type ReportType =
  | "all_assets"
  | "expiring_warranties"
  | "assignment_ledger"
  | "maintenance_history"
  | "disposal_audit";

export default function ReportsPage() {
  const { location: globalLocation } = useContext(LocationFilterContext);
  const { success, error } = useToast();

  const [activeReport, setActiveReport] = useState<ReportType>("all_assets");
  const [reportData, setReportData] = useState<any[]>([]);
  const [warrantyDays, setWarrantyDays] = useState("90");
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `/api/reports?type=${activeReport}&location=${globalLocation}`;
      if (activeReport === "expiring_warranties") {
        url += `&days=${warrantyDays}`;
      }

      const res = await fetch(url);
      const json = await res.json();

      if (json.data) {
        setReportData(json.data);
      }
    } catch (err) {
      console.error("Failed to load report:", err);
      error("Failed to generate report dataset");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport, globalLocation, warrantyDays]);

  const handleExportCsv = () => {
    if (reportData.length === 0) {
      error("Export Empty", "No records found in this report to export.");
      return;
    }

    try {
      let csvString = "";
      const timestamp = format(new Date(), "yyyyMMdd_HHmm");
      let filename = `report_${activeReport}_${timestamp}.csv`;

      if (activeReport === "all_assets" || activeReport === "expiring_warranties") {
        csvString = exportAssetsToCsv(reportData);
      } else if (activeReport === "assignment_ledger") {
        csvString = exportAssignmentsToCsv(reportData);
      } else if (activeReport === "maintenance_history") {
        const formatted = reportData.map((item) => ({
          asset_tag: item.asset?.assetTag || "",
          asset_name: item.asset?.name || "",
          office_location: item.asset?.officeLocation || "",
          issue_description: item.issueDescription,
          service_vendor: item.sentTo,
          date_reported: format(new Date(item.dateReported), "yyyy-MM-dd"),
          date_returned: item.dateReturned ? format(new Date(item.dateReturned), "yyyy-MM-dd") : "PENDING",
          outcome: item.outcome,
          performed_by: item.performedBy,
        }));
        csvString = Papa.unparse(formatted, { quotes: true, header: true });
      } else if (activeReport === "disposal_audit") {
        const formatted = reportData.map((item) => ({
          asset_tag: item.asset?.assetTag || "",
          asset_name: item.asset?.name || "",
          office_location: item.asset?.officeLocation || "",
          disposal_date: format(new Date(item.disposalDate), "yyyy-MM-dd"),
          disposal_reason: item.disposalReason,
          notes: item.notes || "",
        }));
        csvString = Papa.unparse(formatted, { quotes: true, header: true });
      }

      triggerCsvDownload(csvString, filename);
      success("Export Complete", `Downloaded ${reportData.length} records to ${filename}`);
    } catch (err: any) {
      error("Export Failed", err.message);
    }
  };

  const reportTabs = [
    {
      id: "all_assets" as ReportType,
      label: "Full Asset Inventory",
      icon: HardDrive,
      desc: "Complete master catalog of all hardware devices with resolved custodians.",
    },
    {
      id: "expiring_warranties" as ReportType,
      label: "Expiring Warranties Radar",
      icon: Calendar,
      desc: "Hardware approaching manufacturer service and warranty end dates.",
    },
    {
      id: "assignment_ledger" as ReportType,
      label: "Assignment History Ledger",
      icon: History,
      desc: "Audit trail of every staff handover, issuance, and return.",
    },
    {
      id: "maintenance_history" as ReportType,
      label: "Maintenance & Repairs",
      icon: Wrench,
      desc: "Historical breakdown of technician visits, issues, and repair outcomes.",
    },
    {
      id: "disposal_audit" as ReportType,
      label: "Decommissioned Audit Log",
      icon: Trash2,
      desc: "Permanently retained scrap, e-waste, and loss records.",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Export Trigger */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Reports & Export Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Generate CSV datasets, audit compliance logs, and export assignment history.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={loading || reportData.length === 0}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all self-start sm:self-auto"
        >
          <Download className="w-4 h-4" /> Download CSV Export ({reportData.length})
        </button>
      </div>

      {/* Report Selection Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeReport === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveReport(tab.id)}
              className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                isActive
                  ? "bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-950/30 ring-1 ring-emerald-500/30"
                  : "glass-panel border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${
                    isActive
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-slate-800 text-slate-400"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-xs sm:text-sm text-white mb-1">
                  {tab.label}
                </h3>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {tab.desc}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Sub-Filters Bar (for Warranties or Location) */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-300">
            Selected: <strong className="text-emerald-400">{reportTabs.find((t) => t.id === activeReport)?.label}</strong>
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">
            Records Found: <strong className="text-white">{reportData.length}</strong>
          </span>
        </div>

        {activeReport === "expiring_warranties" && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Warranty Expiration Window:</span>
            <select
              value={warrantyDays}
              onChange={(e) => setWarrantyDays(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200"
            >
              <option value="30">Within 30 Days (Critical)</option>
              <option value="60">Within 60 Days (Warning)</option>
              <option value="90">Within 90 Days (Upcoming)</option>
              <option value="180">Within 6 Months</option>
              <option value="365">Within 1 Year</option>
            </select>
          </div>
        )}
      </div>

      {/* Interactive Data Preview Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-left text-xs text-slate-300">
            {/* Headers based on report type */}
            <thead className="bg-slate-850 sticky top-0 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 z-10">
              {activeReport === "all_assets" || activeReport === "expiring_warranties" ? (
                <tr>
                  <th className="py-3 px-4 font-semibold">Asset Tag</th>
                  <th className="py-3 px-4 font-semibold">Hardware Name</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold">Assigned Employee</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Purchase Date</th>
                  <th className="py-3 px-4 font-semibold">Warranty Expiry</th>
                </tr>
              ) : activeReport === "assignment_ledger" ? (
                <tr>
                  <th className="py-3 px-4 font-semibold">Asset Tag</th>
                  <th className="py-3 px-4 font-semibold">Hardware Item</th>
                  <th className="py-3 px-4 font-semibold">Employee Custodian</th>
                  <th className="py-3 px-4 font-semibold">Department</th>
                  <th className="py-3 px-4 font-semibold">Assigned Date</th>
                  <th className="py-3 px-4 font-semibold">Returned Date</th>
                  <th className="py-3 px-4 font-semibold">Handover Notes</th>
                </tr>
              ) : activeReport === "maintenance_history" ? (
                <tr>
                  <th className="py-3 px-4 font-semibold">Asset Tag</th>
                  <th className="py-3 px-4 font-semibold">Hardware Device</th>
                  <th className="py-3 px-4 font-semibold">Issue Details</th>
                  <th className="py-3 px-4 font-semibold">Service Vendor</th>
                  <th className="py-3 px-4 font-semibold">Date Reported</th>
                  <th className="py-3 px-4 font-semibold">Outcome</th>
                  <th className="py-3 px-4 font-semibold">Logged By</th>
                </tr>
              ) : (
                <tr>
                  <th className="py-3 px-4 font-semibold">Asset Tag</th>
                  <th className="py-3 px-4 font-semibold">Hardware Device</th>
                  <th className="py-3 px-4 font-semibold">Disposal Date</th>
                  <th className="py-3 px-4 font-semibold">Reason</th>
                  <th className="py-3 px-4 font-semibold">Location</th>
                  <th className="py-3 px-4 font-semibold">Audit Documentation Notes</th>
                </tr>
              )}
            </thead>

            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    Generating report preview...
                  </td>
                </tr>
              ) : reportData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-300 text-sm">No data matching this report criteria</p>
                  </td>
                </tr>
              ) : activeReport === "all_assets" || activeReport === "expiring_warranties" ? (
                reportData.map((asset) => (
                  <tr key={asset.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {asset.assetTag}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{asset.name}</td>
                    <td className="py-3 px-4">{asset.category}</td>
                    <td className="py-3 px-4">{asset.status}</td>
                    <td className="py-3 px-4 text-blue-300">
                      {asset.employee?.name || <span className="text-slate-500 italic">In Stock</span>}
                    </td>
                    <td className="py-3 px-4">{asset.officeLocation}</td>
                    <td className="py-3 px-4">
                      {asset.purchaseDate ? format(new Date(asset.purchaseDate), "yyyy-MM-dd") : "--"}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {asset.warrantyExpiry ? format(new Date(asset.warrantyExpiry), "yyyy-MM-dd") : "--"}
                    </td>
                  </tr>
                ))
              ) : activeReport === "assignment_ledger" ? (
                reportData.map((asg) => (
                  <tr key={asg.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {asg.asset?.assetTag}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{asg.asset?.name}</td>
                    <td className="py-3 px-4 font-bold text-blue-300">{asg.employee?.name}</td>
                    <td className="py-3 px-4">{asg.employee?.department}</td>
                    <td className="py-3 px-4">
                      {format(new Date(asg.assignedDate), "yyyy-MM-dd")}
                    </td>
                    <td className="py-3 px-4">
                      {asg.returnedDate ? (
                        format(new Date(asg.returnedDate), "yyyy-MM-dd")
                      ) : (
                        <span className="text-emerald-400 font-bold">CURRENTLY HELD</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{asg.notes || "--"}</td>
                  </tr>
                ))
              ) : activeReport === "maintenance_history" ? (
                reportData.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {m.asset?.assetTag}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{m.asset?.name}</td>
                    <td className="py-3 px-4 text-slate-300">{m.issueDescription}</td>
                    <td className="py-3 px-4 font-medium text-slate-200">{m.sentTo}</td>
                    <td className="py-3 px-4">{format(new Date(m.dateReported), "yyyy-MM-dd")}</td>
                    <td className="py-3 px-4">{m.outcome}</td>
                    <td className="py-3 px-4 text-slate-400">{m.performedBy}</td>
                  </tr>
                ))
              ) : (
                reportData.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-rose-400">
                      {d.asset?.assetTag}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-200">{d.asset?.name}</td>
                    <td className="py-3 px-4">{format(new Date(d.disposalDate), "yyyy-MM-dd")}</td>
                    <td className="py-3 px-4 font-semibold text-rose-300">{d.disposalReason}</td>
                    <td className="py-3 px-4">{d.asset?.officeLocation}</td>
                    <td className="py-3 px-4 text-slate-300">{d.notes || "--"}</td>
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
