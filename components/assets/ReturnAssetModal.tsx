"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { AssetWithRelations } from "@/lib/types";
import { useToast } from "../ui/ToastContext";
import { RotateCcw, Loader2 } from "lucide-react";

interface ReturnAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetWithRelations | null;
  onSuccess: () => void;
}

export function ReturnAssetModal({
  isOpen,
  onClose,
  asset,
  onSuccess,
}: ReturnAssetModalProps) {
  const { success, error } = useToast();
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState<"HYD" | "MUM">((asset?.officeLocation as "HYD" | "MUM") || "HYD");
  const [loading, setLoading] = useState(false);

  if (!asset) return null;

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          newLocation: location,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to return asset");
      }

      success("Asset Returned", `Asset ${asset.assetTag} is now in stock inventory.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      error("Return Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Return Asset: ${asset.assetTag}`}
      subtitle={`Return "${asset.name}" back into active stock inventory.`}
      maxWidth="md"
    >
      <form onSubmit={handleReturn} className="space-y-4">
        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <p className="text-slate-400">Currently Assigned To:</p>
          <p className="text-sm font-bold text-white mt-0.5">
            {asset.employee?.name || "Assigned Employee"}
          </p>
          <p className="text-slate-400 text-[11px]">{asset.employee?.department} • {asset.employee?.email}</p>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Storage Office Location <span className="text-emerald-400">*</span>
          </label>
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value as "HYD" | "MUM")}
            className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          >
            <option value="HYD">Hyderabad (HYD) IT Inventory Locker</option>
            <option value="MUM">Mumbai (MUM) IT Storage Room</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Return Inspection & Condition Notes
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Returned with original charger. No physical damage observed."
            className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            Return to Inventory
          </button>
        </div>
      </form>
    </Modal>
  );
}
