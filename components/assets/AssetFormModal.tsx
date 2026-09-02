"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../ui/Modal";
import { assetSchema, AssetFormValues, CATEGORIES, ASSET_STATUSES, OFFICE_LOCATIONS } from "@/lib/validations";
import { AssetWithRelations } from "@/lib/types";
import { useToast } from "../ui/ToastContext";
import { format } from "date-fns";
import { Loader2, Plus, Sparkles } from "lucide-react";

interface AssetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetToEdit?: AssetWithRelations | null;
  onSuccess: () => void;
}

export function AssetFormModal({
  isOpen,
  onClose,
  assetToEdit,
  onSuccess,
}: AssetFormModalProps) {
  const { success, error } = useToast();
  const [employees, setEmployees] = useState<Array<{ id: string; name: string; department: string; officeLocation: string }>>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    defaultValues: {
      assetTag: "",
      name: "",
      category: "Laptop",
      brand: "",
      model: "",
      serialNumber: "",
      status: "IN_STOCK",
      employeeId: "",
      officeLocation: "MUM",
      purchaseDate: new Date(),
      warrantyExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 3)),
      vendor: "",
      accessories: "",
      notes: "",
      sesaId: "",
      processor: "",
      ram: "",
      storage: "",
      configuration: "",
      inspectionDone: "NO",
      invoiceLink: "",
      antivirus: "",
      charger: "",
      currentUser: "",
      lastUser: "",
      stateDetail: "",
    },
  });

  const selectedStatus = watch("status");
  const selectedCategory = watch("category");

  // Fetch active employees for assignment dropdown
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
    }
  }, [isOpen]);

  // Sync form values on open/edit
  useEffect(() => {
    if (isOpen) {
      if (assetToEdit) {
        reset({
          assetTag: assetToEdit.assetTag,
          name: assetToEdit.name,
          category: assetToEdit.category,
          brand: assetToEdit.brand,
          model: assetToEdit.model,
          serialNumber: assetToEdit.serialNumber || "",
          status: assetToEdit.status,
          employeeId: assetToEdit.employeeId || "",
          officeLocation: assetToEdit.officeLocation,
          purchaseDate: assetToEdit.purchaseDate ? new Date(assetToEdit.purchaseDate) : null,
          warrantyExpiry: assetToEdit.warrantyExpiry ? new Date(assetToEdit.warrantyExpiry) : null,
          vendor: assetToEdit.vendor || "",
          accessories: assetToEdit.accessories || "",
          notes: assetToEdit.notes || "",
          sesaId: assetToEdit.sesaId || "",
          processor: assetToEdit.processor || "",
          ram: assetToEdit.ram || "",
          storage: assetToEdit.storage || "",
          configuration: assetToEdit.configuration || "",
          inspectionDone: assetToEdit.inspectionDone || "NO",
          invoiceLink: assetToEdit.invoiceLink || "",
          antivirus: assetToEdit.antivirus || "",
          charger: assetToEdit.charger || "",
          currentUser: assetToEdit.currentUser || "",
          lastUser: assetToEdit.lastUser || "",
          stateDetail: assetToEdit.stateDetail || "",
        });
      } else {
        const randomNum = Math.floor(100 + Math.random() * 900);
        const prefix = selectedCategory === "Monitor" ? "WBM" : selectedCategory === "Support Device" ? "WBSD" : "WB";
        reset({
          assetTag: `${prefix}-${randomNum}`,
          name: "",
          category: "Laptop",
          brand: "Lenovo",
          model: "",
          serialNumber: "",
          status: "IN_STOCK",
          employeeId: "",
          officeLocation: "MUM",
          purchaseDate: new Date(),
          warrantyExpiry: new Date(Date.now() + 365 * 3 * 24 * 60 * 60 * 1000),
          vendor: "",
          accessories: "",
          notes: "",
          sesaId: "",
          processor: "",
          ram: "",
          storage: "",
          configuration: "",
          inspectionDone: "NO",
          invoiceLink: "",
          antivirus: "",
          charger: "",
          currentUser: "",
          lastUser: "",
          stateDetail: "Usable",
        });
      }
    }
  }, [isOpen, assetToEdit, reset]);

  const generateTag = () => {
    const prefix = selectedCategory === "Monitor" ? "WBM" : selectedCategory === "Support Device" ? "WBSD" : "WB";
    const num = Math.floor(100 + Math.random() * 900);
    setValue("assetTag", `${prefix}-${num}`);
  };

  const onSubmit = async (data: AssetFormValues) => {
    setIsSubmitting(true);
    try {
      const url = assetToEdit ? `/api/assets/${assetToEdit.id}` : "/api/assets";
      const method = assetToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to save asset");
      }

      success(
        assetToEdit ? "Asset updated" : "Asset created",
        `Asset ${data.assetTag} successfully saved.`
      );
      onSuccess();
      onClose();
    } catch (err: any) {
      error("Save Error", err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={assetToEdit ? `Edit Asset: ${assetToEdit.assetTag}` : "Register Hardware Asset"}
      subtitle="Fill in hardware specifications, location, warranty, and custodian allocation."
      maxWidth="4xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-h-[80vh] overflow-y-auto pr-1">
        {/* Row 1: Tag + SESA ID + Category */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Asset ID <span className="text-emerald-400">*</span>
              </label>
              {!assetToEdit && (
                <button
                  type="button"
                  onClick={generateTag}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                >
                  <Sparkles className="w-3 h-3" /> Auto
                </button>
              )}
            </div>
            <input
              type="text"
              {...register("assetTag")}
              placeholder="e.g. WB-248"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
            {errors.assetTag && (
              <p className="text-xs text-rose-400 mt-1">{errors.assetTag.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              SESA ID (Optional)
            </label>
            <input
              type="text"
              {...register("sesaId")}
              placeholder="e.g. SESA843540"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Category <span className="text-emerald-400">*</span>
            </label>
            <select
              {...register("category")}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Row 2: Brand, Model, Display Name */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Brand / Manufacturer <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              {...register("brand")}
              placeholder="e.g. Lenovo, Dell, Apple"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
            {errors.brand && (
              <p className="text-xs text-rose-400 mt-1">{errors.brand.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Model# <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              {...register("model")}
              placeholder="e.g. ThinkPad E16 Gen 2"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
            {errors.model && (
              <p className="text-xs text-rose-400 mt-1">{errors.model.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Display Name <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="e.g. Lenovo ThinkPad E16"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
            {errors.name && (
              <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>
            )}
          </div>
        </div>

        {/* Row 3: Processor, RAM, SSD/HDD */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Processor (CPU)
            </label>
            <input
              type="text"
              {...register("processor")}
              placeholder="e.g. Intel Ultra 7 (155U), i7 11th Gen"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              RAM
            </label>
            <input
              type="text"
              {...register("ram")}
              placeholder="e.g. 16 GB, 32 GB, 40 GB"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Storage (SSD / HDD)
            </label>
            <input
              type="text"
              {...register("storage")}
              placeholder="e.g. 1 TB SSD, 512 GB SSD"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Row 4: Serial Number, Status, Location */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Serial / Service Tag
            </label>
            <input
              type="text"
              {...register("serialNumber")}
              placeholder="e.g. PF5E9ALA"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Status <span className="text-emerald-400">*</span>
            </label>
            <select
              {...register("status")}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            >
              <option value="IN_STOCK">In Stock (Usable)</option>
              <option value="IN_USE">In Use</option>
              <option value="UNDER_REPAIR">Under Repair</option>
              <option value="LOST">Lost</option>
              <option value="SCRAPPED">Scrapped / Unusable</option>
              <option value="RETURNED">Returned</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Office Location <span className="text-emerald-400">*</span>
            </label>
            <select
              {...register("officeLocation")}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            >
              <option value="MUM">Mumbai (MUM)</option>
              <option value="HYD">Hyderabad (HYD)</option>
            </select>
          </div>
        </div>

        {/* Conditional Employee Assignment */}
        {selectedStatus === "IN_USE" && (
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30">
            <label className="block text-xs font-semibold text-blue-300 mb-1.5">
              Assigned Employee Custodian
            </label>
            <select
              {...register("employeeId")}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-blue-500/50 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select Active Employee --</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.department} • {emp.officeLocation})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Row 5: Antivirus, Charger, Inspection Done */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Antivirus
            </label>
            <input
              type="text"
              {...register("antivirus")}
              placeholder="e.g. Yes, Installed, Expired, NA"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Charger Info
            </label>
            <input
              type="text"
              {...register("charger")}
              placeholder="e.g. Yes, 2 charger with same tag"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Inspection Done?
            </label>
            <select
              {...register("inspectionDone")}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            >
              <option value="Yes">Yes</option>
              <option value="NO">NO</option>
            </select>
          </div>
        </div>

        {/* Row 6: Current User & Past Users */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Current Custodian / User Name
            </label>
            <input
              type="text"
              {...register("currentUser")}
              placeholder="e.g. Anirudha Choudhari or In Office"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Past / Historical Users
            </label>
            <input
              type="text"
              {...register("lastUser")}
              placeholder="e.g. Sanket Gurav, Shubham Yadav"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Row 7: Configuration & Condition Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Configuration Details
            </label>
            <textarea
              {...register("configuration")}
              rows={3}
              placeholder="e.g. i7;8th Gen;16GB RAM;64 Bit OS;1TB SSD;:14 FHD Display"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Final Summary / Condition Notes
            </label>
            <textarea
              {...register("finalSummary")}
              rows={3}
              placeholder="e.g. Laptop is in good condition, SSD swapped, etc."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Asset...
              </>
            ) : assetToEdit ? (
              "Update Asset"
            ) : (
              <>
                <Plus className="w-4 h-4" /> Register Asset
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
