"use client";

import React, { useState, useRef } from "react";
import { Modal } from "../ui/Modal";
import { parseAndValidateAssetCsv, CsvParsedRow, triggerCsvDownload } from "@/lib/csv";
import { useToast } from "../ui/ToastContext";
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Loader2,
  Layers,
} from "lucide-react";

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CsvImportModal({
  isOpen,
  onClose,
  onSuccess,
}: CsvImportModalProps) {
  const { success, error } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState<string>("");
  const [parsedRows, setParsedRows] = useState<CsvParsedRow[]>([]);
  const [totalValid, setTotalValid] = useState(0);
  const [totalInvalid, setTotalInvalid] = useState(0);
  const [isParsing, setIsParsing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleDownloadSample = () => {
    const sampleContent = `asset_tag,name,category,brand,model,serial_number,status,employee_email,office_location,purchase_date,vendor,warranty_expiry,accessories,notes
AST-LAP-901,ThinkPad X1 Carbon Gen 12,Laptop,Lenovo,ThinkPad X1 32GB,PF9928310,IN_STOCK,,HYD,2024-01-15,Lenovo Direct,2027-01-15,65W GaN Charger,Buffer stock
AST-MON-902,Dell UltraSharp 32 4K,Monitor,Dell,U3223QE,CN99102488,IN_STOCK,,MUM,2024-03-01,Dell Direct,2027-03-01,Stand and TB4 Cable,Design department spare
AST-LAP-903,MacBook Air 15 M3,Laptop,Apple,MBA 15 16GB 512GB,C02KK99102,IN_USE,aarav.sharma@company.com,HYD,2024-02-10,Apple Corp,2027-02-10,35W Adapter,Engineering loaner`;

    triggerCsvDownload(sampleContent, "hardware_assets_sample_template.csv");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsParsing(true);

    try {
      // 1. Fetch existing tags and active employees to validate against
      const [assetsRes, empRes] = await Promise.all([
        fetch("/api/assets?all=true").then((r) => r.json()),
        fetch("/api/employees?status=ACTIVE").then((r) => r.json()),
      ]);

      const existingTags = new Set<string>(
        (assetsRes.assets || []).map((a: any) => (a.assetTag || "").toUpperCase())
      );

      const activeEmployeesMap = new Map<string, string>(
        (empRes.employees || []).map((emp: any) => [emp.email.toLowerCase(), emp.id])
      );

      // 2. Read and parse file
      const text = await file.text();
      const result = parseAndValidateAssetCsv(text, existingTags, activeEmployeesMap);

      setParsedRows(result.rows);
      setTotalValid(result.totalValid);
      setTotalInvalid(result.totalInvalid);
    } catch (err: any) {
      error("Parse Error", err.message || "Failed to parse CSV file");
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    const validItems = parsedRows.filter((r) => r.isValid).map((r) => r.data);
    if (validItems.length === 0) {
      error("No valid rows", "Please fix the validation errors before importing.");
      return;
    }

    setIsImporting(true);
    try {
      const res = await fetch("/api/assets/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: validItems }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Import failed");
      }

      success(
        "Import Complete",
        `Successfully registered ${json.importedCount} new hardware assets.`
      );
      onSuccess();
      handleReset();
      onClose();
    } catch (err: any) {
      error("Import Error", err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setFileName("");
    setParsedRows([]);
    setTotalValid(0);
    setTotalInvalid(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        handleReset();
        onClose();
      }}
      title="Bulk Import Assets via CSV"
      subtitle="Upload a CSV file to validate and batch-register hardware assets."
      maxWidth="4xl"
    >
      <div className="space-y-5">
        {/* Sample Template & Upload Area */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-800/60 border border-slate-700/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Need the CSV Template?</p>
              <p className="text-xs text-slate-400">Download formatted template with columns & sample data</p>
            </div>
          </div>
          <button
            onClick={handleDownloadSample}
            type="button"
            className="px-3.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-xs font-semibold text-slate-200 flex items-center justify-center gap-2 transition-colors shrink-0"
          >
            <Download className="w-4 h-4" /> Download Sample CSV
          </button>
        </div>

        {/* File Dropzone */}
        {parsedRows.length === 0 ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-slate-900/50 hover:bg-slate-850"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".csv"
              className="hidden"
            />
            <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <p className="text-sm font-semibold text-slate-200">
              Click to select a CSV file
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Supports .csv files with standard columns
            </p>
            {isParsing && (
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-emerald-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating CSV rows...
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Status counters bar */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/80 border border-slate-700">
              <div className="flex items-center gap-4 text-xs font-medium">
                <span className="text-slate-300">File: <strong className="text-white">{fileName}</strong></span>
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" /> {totalValid} Valid Rows
                </span>
                {totalInvalid > 0 && (
                  <span className="flex items-center gap-1.5 text-rose-400">
                    <AlertCircle className="w-4 h-4" /> {totalInvalid} Errors
                  </span>
                )}
              </div>
              <button
                onClick={handleReset}
                className="text-xs text-slate-400 hover:text-white underline"
              >
                Change File
              </button>
            </div>

            {/* Preview Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-850 sticky top-0 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Tag</th>
                    <th className="py-2 px-3">Name</th>
                    <th className="py-2 px-3">Category</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Assignee</th>
                    <th className="py-2 px-3">Location</th>
                    <th className="py-2 px-3">Validation Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {parsedRows.map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={row.isValid ? "hover:bg-slate-800/40" : "bg-rose-950/20 hover:bg-rose-950/30"}
                    >
                      <td className="py-2 px-3 font-semibold">
                        {row.isValid ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> OK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-400">
                            <AlertCircle className="w-3.5 h-3.5" /> Invalid
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-white">
                        {row.raw.asset_tag || row.raw.tag || "N/A"}
                      </td>
                      <td className="py-2 px-3 text-slate-200">{row.raw.name || row.raw.asset_name}</td>
                      <td className="py-2 px-3">{row.raw.category}</td>
                      <td className="py-2 px-3">{row.raw.status || "IN_STOCK"}</td>
                      <td className="py-2 px-3 text-slate-400 truncate max-w-[120px]">
                        {row.raw.employee_email || "-"}
                      </td>
                      <td className="py-2 px-3">{row.raw.office_location || "HYD"}</td>
                      <td className="py-2 px-3">
                        {row.isValid ? (
                          <span className="text-emerald-400/80">Ready to insert</span>
                        ) : (
                          <div className="space-y-0.5">
                            {row.errors.map((err, i) => (
                              <p key={i} className="text-rose-400 text-[11px]">
                                • {err}
                              </p>
                            ))}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isImporting || totalValid === 0}
            onClick={handleImport}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing {totalValid} Assets...
              </>
            ) : (
              <>
                <Layers className="w-4 h-4" />
                Import {totalValid} Valid Assets
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
