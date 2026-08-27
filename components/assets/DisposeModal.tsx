"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { AssetWithRelations } from "@/lib/types";
import { DISPOSAL_REASONS } from "@/lib/validations";
import { useToast } from "../ui/ToastContext";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface DisposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetWithRelations | null;
  onSuccess: () => void;
}

export function DisposeModal({
  isOpen,
  onClose,
  asset,
  onSuccess,
}: DisposeModalProps) {
  const { success, error } = useToast();
  const [disposalReason, setDisposalReason] = useState<string>("DAMAGED_BEYOND_REPAIR");
  const [disposalDate, setDisposalDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  if (!asset) return null;

  const handleDispose = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}/dispose`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disposalReason,
          disposalDate: new Date(disposalDate),
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to dispose asset");
      }

      success("Disposal Audited", `Asset ${asset.assetTag} archived with disposal record.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      error("Disposal Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Dispose / Scrap Asset: ${asset.assetTag}`}
      subtitle={`Decommission "${asset.name}". Scrapped assets are permanently retained for auditing.`}
      maxWidth="md"
    >
      <form onSubmit={handleDispose} className="space-y-4">
        <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-200 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-rose-100">Permanent Status Change</p>
            <p className="mt-0.5 opacity-90">
              This action will mark the asset as Scrapped or Lost, release any active employee assignment, and create an immutable audit record.
            </p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Disposal Reason <span className="text-rose-400">*</span>
          </label>
          <select
            value={disposalReason}
            onChange={(e) => setDisposalReason(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
          >
            {DISPOSAL_REASONS.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Disposal Date <span className="text-rose-400">*</span>
          </label>
          <input
            type="date"
            value={disposalDate}
            onChange={(e) => setDisposalDate(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Audit Documentation & Certificate Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. E-waste certificate #9921 issued, drive degaussed to NIST 800-88 standard."
            className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
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
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            Confirm Disposal
          </button>
        </div>
      </form>
    </Modal>
  );
}
