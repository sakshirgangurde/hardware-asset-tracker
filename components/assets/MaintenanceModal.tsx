"use client";

import React, { useState } from "react";
import { Modal } from "../ui/Modal";
import { AssetWithRelations } from "@/lib/types";
import { useToast } from "../ui/ToastContext";
import { Wrench, Loader2 } from "lucide-react";
import { format } from "date-fns";

interface MaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetWithRelations | null;
  onSuccess: () => void;
}

export function MaintenanceModal({
  isOpen,
  onClose,
  asset,
  onSuccess,
}: MaintenanceModalProps) {
  const { success, error } = useToast();
  const [issueDescription, setIssueDescription] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [performedBy, setPerformedBy] = useState("IT Support Team");
  const [outcome, setOutcome] = useState<"PENDING" | "REPAIRED" | "UNREPAIRABLE">("PENDING");
  const [dateReported, setDateReported] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);

  if (!asset) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDescription.trim() || !sentTo.trim()) {
      error("Missing fields", "Issue description and service vendor are required.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}/maintenance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          issueDescription,
          sentTo,
          performedBy,
          outcome,
          dateReported: new Date(dateReported),
          dateReturned: outcome !== "PENDING" ? new Date() : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to log maintenance");
      }

      success("Maintenance Ticket Saved", `Service record updated for ${asset.assetTag}.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      error("Maintenance Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Maintenance Log: ${asset.assetTag}`}
      subtitle={`Log repair service, diagnostics, or parts replacement for "${asset.name}".`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Issue Description <span className="text-rose-400">*</span>
          </label>
          <textarea
            rows={3}
            value={issueDescription}
            onChange={(e) => setIssueDescription(e.target.value)}
            placeholder="e.g. Battery not holding charge, screen flickering on tilt."
            className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Service Center / Technician <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={sentTo}
              onChange={(e) => setSentTo(e.target.value)}
              placeholder="e.g. Dell Authorized Care Hyd"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Logged By
            </label>
            <input
              type="text"
              value={performedBy}
              onChange={(e) => setPerformedBy(e.target.value)}
              placeholder="e.g. Internal IT Support"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Date Reported
            </label>
            <input
              type="date"
              value={dateReported}
              onChange={(e) => setDateReported(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Current Outcome / Status
            </label>
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
            >
              <option value="PENDING">In Progress (Sets status to UNDER_REPAIR)</option>
              <option value="REPAIRED">Repaired (Restores to IN_STOCK or IN_USE)</option>
              <option value="UNREPAIRABLE">Unrepairable (Marks as SCRAPPED)</option>
            </select>
          </div>
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
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
            Save Maintenance Record
          </button>
        </div>
      </form>
    </Modal>
  );
}
