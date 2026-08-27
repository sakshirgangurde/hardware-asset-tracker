"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { AssetWithRelations } from "@/lib/types";
import { useToast } from "../ui/ToastContext";
import { UserCheck, Loader2 } from "lucide-react";

interface AssignAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: AssetWithRelations | null;
  onSuccess: () => void;
}

export function AssignAssetModal({
  isOpen,
  onClose,
  asset,
  onSuccess,
}: AssignAssetModalProps) {
  const { success, error } = useToast();
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; department: string; officeLocation: string }>>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/employees?status=ACTIVE")
        .then((res) => res.json())
        .then((data) => {
          if (data.employees) {
            setEmployees(data.employees);
          }
        })
        .catch(console.error);
      setSelectedEmployeeId("");
      setNotes("");
    }
  }, [isOpen]);

  if (!asset) return null;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployeeId) {
      error("Selection required", "Please select an employee to assign this asset.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}/assign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          employeeId: selectedEmployeeId,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assign asset");
      }

      success("Asset Assigned", `Asset ${asset.assetTag} assigned to employee.`);
      onSuccess();
      onClose();
    } catch (err: any) {
      error("Assignment Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Asset: ${asset.assetTag}`}
      subtitle={`Assign "${asset.name}" to an active team member.`}
      maxWidth="md"
    >
      <form onSubmit={handleAssign} className="space-y-4">
        {/* Asset summary badge */}
        <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <div className="flex justify-between items-center mb-1">
            <span className="font-semibold text-white">{asset.brand} {asset.model}</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
              {asset.officeLocation} Office
            </span>
          </div>
          {asset.serialNumber && (
            <p className="text-slate-400">S/N: {asset.serialNumber}</p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Select Employee <span className="text-emerald-400">*</span>
          </label>
          <select
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            required
          >
            <option value="">-- Choose Employee --</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} ({emp.department} • {emp.officeLocation})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Assignment Notes / Handover Details
          </label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Handed over at Hyderabad IT Desk with laptop bag."
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
            disabled={loading || !selectedEmployeeId}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
            Confirm Assignment
          </button>
        </div>
      </form>
    </Modal>
  );
}
