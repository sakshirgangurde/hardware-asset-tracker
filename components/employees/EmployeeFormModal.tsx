"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Modal } from "../ui/Modal";
import { employeeSchema, EmployeeFormValues, OFFICE_LOCATIONS, EMPLOYEE_STATUSES } from "@/lib/validations";
import { EmployeeWithRelations } from "@/lib/types";
import { useToast } from "../ui/ToastContext";
import { format } from "date-fns";
import { UserPlus, Loader2 } from "lucide-react";

interface EmployeeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeToEdit?: EmployeeWithRelations | null;
  onSuccess: () => void;
}

export function EmployeeFormModal({
  isOpen,
  onClose,
  employeeToEdit,
  onSuccess,
}: EmployeeFormModalProps) {
  const { success, error } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeFormValues>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      name: "",
      email: "",
      department: "Engineering",
      officeLocation: "HYD",
      status: "ACTIVE",
      startDate: new Date(),
      notes: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (employeeToEdit) {
        reset({
          name: employeeToEdit.name,
          email: employeeToEdit.email,
          department: employeeToEdit.department,
          officeLocation: employeeToEdit.officeLocation,
          status: employeeToEdit.status,
          startDate: new Date(employeeToEdit.startDate),
          endDate: employeeToEdit.endDate ? new Date(employeeToEdit.endDate) : null,
          notes: employeeToEdit.notes || "",
        });
      } else {
        reset({
          name: "",
          email: "",
          department: "Engineering",
          officeLocation: "HYD",
          status: "ACTIVE",
          startDate: new Date(),
          endDate: null,
          notes: "",
        });
      }
    }
  }, [isOpen, employeeToEdit, reset]);

  const onSubmit = async (data: EmployeeFormValues) => {
    setIsSubmitting(true);
    try {
      const url = employeeToEdit
        ? `/api/employees/${employeeToEdit.id}`
        : "/api/employees";
      const method = employeeToEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save employee");
      }

      success(
        employeeToEdit ? "Employee Updated" : "Employee Onboarded",
        `${data.name} profile successfully saved.`
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
      title={employeeToEdit ? `Edit Employee: ${employeeToEdit.name}` : "Onboard New Employee"}
      subtitle="Register employee profile to enable hardware provisioning and assignment tracking."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Full Name <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="e.g. Aarav Sharma"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.name && (
              <p className="text-xs text-rose-400 mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Company Email <span className="text-emerald-400">*</span>
            </label>
            <input
              type="email"
              {...register("email")}
              placeholder="e.g. aarav.sharma@company.com"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.email && (
              <p className="text-xs text-rose-400 mt-1">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Department <span className="text-emerald-400">*</span>
            </label>
            <input
              type="text"
              {...register("department")}
              placeholder="e.g. Engineering, Design, Product"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            {errors.department && (
              <p className="text-xs text-rose-400 mt-1">{errors.department.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Primary Office Hub <span className="text-emerald-400">*</span>
            </label>
            <select
              {...register("officeLocation")}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {OFFICE_LOCATIONS.map((loc) => (
                <option key={loc} value={loc}>
                  {loc === "HYD" ? "Hyderabad (HYD)" : "Mumbai (MUM)"}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              defaultValue={format(new Date(), "yyyy-MM-dd")}
              {...register("startDate")}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Status
            </label>
            <select
              {...register("status")}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {EMPLOYEE_STATUSES.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Role & Onboarding Notes
          </label>
          <textarea
            rows={2}
            {...register("notes")}
            placeholder="e.g. Principal DevOps Lead, Tech Lead for Pod 2."
            className="w-full px-3.5 py-2 rounded-xl bg-slate-800 border border-slate-700 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
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
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UserPlus className="w-4 h-4" />
            )}
            {employeeToEdit ? "Save Changes" : "Onboard Employee"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
