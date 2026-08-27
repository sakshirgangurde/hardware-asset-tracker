"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { EmployeeWithRelations } from "@/lib/types";
import { useToast } from "../ui/ToastContext";
import { UserMinus, AlertTriangle, CheckCircle2, RotateCcw, HelpCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface OffboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeeWithRelations | null;
  onSuccess: () => void;
}

interface AssetResolution {
  assetId: string;
  assetTag: string;
  name: string;
  category: string;
  action: "RETURN_TO_STOCK" | "MARK_LOST";
  location: "HYD" | "MUM";
  notes: string;
}

export function OffboardModal({
  isOpen,
  onClose,
  employee,
  onSuccess,
}: OffboardModalProps) {
  const { success, error } = useToast();
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [exitNotes, setExitNotes] = useState("");
  const [resolutions, setResolutions] = useState<AssetResolution[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && employee) {
      setEndDate(format(new Date(), "yyyy-MM-dd"));
      setExitNotes("");
      const initialResolutions: AssetResolution[] = (employee.assets || []).map((asset) => ({
        assetId: asset.id,
        assetTag: asset.assetTag,
        name: asset.name,
        category: asset.category,
        action: "RETURN_TO_STOCK",
        location: (asset.officeLocation as "HYD" | "MUM") || "HYD",
        notes: "",
      }));
      setResolutions(initialResolutions);
    }
  }, [isOpen, employee]);

  if (!employee) return null;

  const updateResolution = (
    assetId: string,
    field: "action" | "location" | "notes",
    val: any
  ) => {
    setResolutions((prev) =>
      prev.map((item) => (item.assetId === assetId ? { ...item, [field]: val } : item))
    );
  };

  const handleOffboard = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${employee.id}/offboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endDate: new Date(endDate),
          notes: exitNotes,
          assetActions: resolutions.map((r) => ({
            assetId: r.assetId,
            action: r.action,
            notes: r.notes,
            location: r.location,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to offboard employee");
      }

      success(
        "Offboarding Complete",
        `${employee.name} offboarded and ${resolutions.length} hardware assets resolved.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      error("Offboarding Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Offboard Employee: ${employee.name}`}
      subtitle={`Department: ${employee.department} • ${employee.officeLocation} Hub`}
      maxWidth="3xl"
    >
      <form onSubmit={handleOffboard} className="space-y-5">
        {/* Warning Banner */}
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-100">
              Hardware Clearance & Asset Resolution Required
            </p>
            <p className="mt-0.5 opacity-90">
              This employee currently holds <strong>{resolutions.length} hardware assets</strong>. Please specify the clearance action for each item below before completing offboarding.
            </p>
          </div>
        </div>

        {/* Date and Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Official Exit / End Date <span className="text-rose-400">*</span>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Offboarding Reason / Notes
            </label>
            <input
              type="text"
              value={exitNotes}
              onChange={(e) => setExitNotes(e.target.value)}
              placeholder="e.g. Resignation, Project completion"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Asset Resolutions List */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center justify-between">
            <span>Hardware Clearance List ({resolutions.length} Items)</span>
            <span className="text-[11px] font-normal text-slate-400">Specify return or mark lost</span>
          </h4>

          {resolutions.length === 0 ? (
            <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700 text-center text-xs text-slate-400">
              ✓ No hardware assets currently assigned. Ready for immediate offboarding.
            </div>
          ) : (
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {resolutions.map((item) => (
                <div
                  key={item.assetId}
                  className={`p-4 rounded-xl border transition-all ${
                    item.action === "RETURN_TO_STOCK"
                      ? "bg-slate-850 border-emerald-500/30"
                      : "bg-rose-950/20 border-rose-500/40"
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          {item.assetTag}
                        </span>
                        <span className="text-sm font-semibold text-slate-100">{item.name}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Category: {item.category}</p>
                    </div>

                    {/* Action Selector */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateResolution(item.assetId, "action", "RETURN_TO_STOCK")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          item.action === "RETURN_TO_STOCK"
                            ? "bg-emerald-600 text-white shadow-sm"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Return to Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => updateResolution(item.assetId, "action", "MARK_LOST")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          item.action === "MARK_LOST"
                            ? "bg-rose-600 text-white shadow-sm"
                            : "bg-slate-800 text-slate-400 hover:text-white"
                        }`}
                      >
                        <HelpCircle className="w-3.5 h-3.5" /> Mark Lost
                      </button>
                    </div>
                  </div>

                  {/* Options per resolution */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800/80 text-xs">
                    {item.action === "RETURN_TO_STOCK" ? (
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">
                          Deposit to Storage Locker:
                        </label>
                        <select
                          value={item.location}
                          onChange={(e) => updateResolution(item.assetId, "location", e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200"
                        >
                          <option value="HYD">Hyderabad (HYD) IT Locker</option>
                          <option value="MUM">Mumbai (MUM) IT Storage</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <span className="inline-block text-[11px] font-semibold text-rose-300">
                          ⚠️ Asset will be permanently audited as LOST.
                        </span>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Condition Notes:
                      </label>
                      <input
                        type="text"
                        value={item.notes}
                        onChange={(e) => updateResolution(item.assetId, "notes", e.target.value)}
                        placeholder="e.g. Inspected, working normal"
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-xs text-slate-200 placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserMinus className="w-4 h-4" />
            )}
            Complete Offboarding & Settle Assets
          </button>
        </div>
      </form>
    </Modal>
  );
}
