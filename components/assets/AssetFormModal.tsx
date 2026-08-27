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
      officeLocation: "HYD",
      purchaseDate: new Date(),
      warrantyExpiry: new Date(new Date().setFullYear(new Date().getFullYear() + 3)),
      vendor: "",
      accessories: "",
      notes: "",
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
          purchaseDate: new Date(assetToEdit.purchaseDate),
          warrantyExpiry: new Date(assetToEdit.warrantyExpiry),
          vendor: assetToEdit.vendor || "",
          accessories: assetToEdit.accessories || "",
          notes: assetToEdit.notes || "",
        });
      } else {
        const randomNum = Math.floor(100 + Math.random() * 900);
        const prefix = selectedCategory ? selectedCategory.substring(0, 3).toUpperCase() : "AST";
        reset({
          assetTag: `AST-${prefix}-${randomNum}`,
          name: "",
          category: "Laptop",
          brand: "",
          model: "",
          serialNumber: "",
          status: "IN_STOCK",
          employeeId: "",
          officeLocation: "HYD",
          purchaseDate: new Date(),
          warrantyExpiry: new Date(Date.now() + 365 * 3 * 24 * 60 * 60 * 1000),
          vendor: "",
          accessories: "",
          notes: "",
        });
      }
    }
  }, [isOpen, assetToEdit, reset, selectedCategory]);

  const generateTag = () => {
    const prefix = selectedCategory ? selectedCategory.substring(0, 3).toUpperCase() : "AST";
    const num = Math.floor(100 + Math.random() * 900);
    setValue("assetTag", `AST-${prefix}-${num}`);
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
      title={assetToEdit ? `Edit Asset: ${assetToEdit.assetTag}` : "Register New Hardware Asset"}
      subtitle="Fill in asset specifications, office location, assignment, and warranty terms."
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Row 1: Tag + Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Asset Tag <span className="text-emerald-400">*</span>
              </label>
              {!assetToEdit && (
                <button
                  type="button"
                  onClick={generateTag}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium"
                >
                  <Sparkles className="w-3 h-3" /> Auto Tag
                </button>
              )}
            </div>
            <input
              type="text"
              {...register("assetTag")}
              placeholder="e.g. AST-LAP-042"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
            {errors.assetTag && (
              <p className="text-xs text-rose-400 mt-1">{errors.assetTag.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Asset Display Name <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="e.g. MacBook Pro 16 M3 Max"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
            {errors.name && (
              <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>
            )}
          </div>
        </div>

        {/* Row 2: Category, Brand, Model */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            {errors.category && (
              <p className="text-xs text-rose-400 mt-1">{errors.category.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Brand / Manufacturer <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              {...register("brand")}
              placeholder="e.g. Apple, Dell, Cisco"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
            {errors.brand && (
              <p className="text-xs text-rose-400 mt-1">{errors.brand.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Model Specs <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              {...register("model")}
              placeholder="e.g. 16-inch 36GB RAM 1TB"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
            {errors.model && (
              <p className="text-xs text-rose-400 mt-1">{errors.model.message}</p>
            )}
          </div>
        </div>

        {/* Row 3: Serial Number, Status, Office Location */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Serial Number (Unique)
            </label>
            <input
              type="text"
              {...register("serialNumber")}
              placeholder="e.g. C02G4589MD6R"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
            {errors.serialNumber && (
              <p className="text-xs text-rose-400 mt-1">{errors.serialNumber.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Status <span className="text-emerald-400">*</span>
            </label>
            <select
              {...register("status")}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            >
              {ASSET_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st.replace(/_/g, " ")}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="text-xs text-rose-400 mt-1">{errors.status.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Office Location <span className="text-emerald-400">*</span>
            </label>
            <select
              {...register("officeLocation")}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            >
              {OFFICE_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === "HYD" ? "Hyderabad (HYD)" : "Mumbai (MUM)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Conditional Employee Assignment Selector */}
        {selectedStatus === "IN_USE" && (
          <div className="p-4 rounded-xl bg-blue-950/30 border border-blue-500/30">
            <label className="block text-xs font-semibold text-blue-300 mb-1.5">
              Assigned Employee <span className="text-rose-400">*</span> (Required when IN_USE)
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
            {errors.employeeId && (
              <p className="text-xs text-rose-400 mt-1">{errors.employeeId.message}</p>
            )}
          </div>
        )}

        {/* Row 4: Purchase Date, Vendor, Warranty Expiry */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Purchase Date <span className="text-emerald-400">*</span>
            </label>
            <input
              type="date"
              defaultValue={format(new Date(), "yyyy-MM-dd")}
              {...register("purchaseDate")}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
            {errors.purchaseDate && (
              <p className="text-xs text-rose-400 mt-1">{errors.purchaseDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Vendor / Supplier
            </label>
            <input
              type="text"
              {...register("vendor")}
              placeholder="e.g. Dell Direct, Apple Corp"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Warranty Expiry <span className="text-emerald-400">*</span>
            </label>
            <input
              type="date"
              defaultValue={format(
                new Date(Date.now() + 365 * 3 * 24 * 60 * 60 * 1000),
                "yyyy-MM-dd"
              )}
              {...register("warrantyExpiry")}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
            {errors.warrantyExpiry && (
              <p className="text-xs text-rose-400 mt-1">{errors.warrantyExpiry.message}</p>
            )}
          </div>
        </div>

        {/* Row 5: Accessories & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Bundled Accessories
            </label>
            <input
              type="text"
              {...register("accessories")}
              placeholder="e.g. 140W Charger, Dongle, Mouse"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Internal Notes / Location Details
            </label>
            <input
              type="text"
              {...register("notes")}
              placeholder="e.g. Desk HYD-302, Server Rack A"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
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
