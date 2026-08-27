"use client";

import React, { useEffect, useState, useContext } from "react";
import Link from "next/link";
import { EmployeeWithRelations } from "@/lib/types";
import { LocationFilterContext } from "@/components/layout/AppShell";
import { LocationBadge, EmployeeStatusBadge } from "@/components/ui/Badge";
import { EmployeeFormModal } from "@/components/employees/EmployeeFormModal";
import { OffboardModal } from "@/components/employees/OffboardModal";
import { useToast } from "@/components/ui/ToastContext";
import {
  Users,
  Search,
  UserPlus,
  UserMinus,
  Edit2,
  Eye,
  Laptop,
  Building2,
  Mail,
  Calendar,
  AlertTriangle,
  RefreshCw,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";

export default function EmployeesPage() {
  const { location: globalLocation } = useContext(LocationFilterContext);
  const { error } = useToast();

  const [employees, setEmployees] = useState<EmployeeWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [department, setDepartment] = useState("ALL");

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState<EmployeeWithRelations | null>(null);

  const [isOffboardModalOpen, setIsOffboardModalOpen] = useState(false);
  const [employeeToOffboard, setEmployeeToOffboard] = useState<EmployeeWithRelations | null>(null);

  useEffect(() => {
    if (globalLocation !== "ALL") {
      setLocation(globalLocation);
    }
  }, [globalLocation]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (location !== "ALL") params.append("location", location);
      if (status !== "ALL") params.append("status", status);
      if (department !== "ALL") params.append("department", department);

      const res = await fetch(`/api/employees?${params.toString()}`);
      const data = await res.json();
      if (data.employees) {
        setEmployees(data.employees);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
      error("Failed to load employee directory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [search, location, status, department]);

  return (
    <div className="space-y-6">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            Employee Directory & Custody
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage personnel, track issued hardware equipment, and execute clearance offboarding.
          </p>
        </div>

        <button
          onClick={() => {
            setEmployeeToEdit(null);
            setIsFormModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" /> Onboard Staff
        </button>
      </div>

      {/* Filter Controls Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name, email, role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Location */}
          <div>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Office Hubs</option>
              <option value="HYD">Hyderabad (HYD)</option>
              <option value="MUM">Mumbai (MUM)</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Employee Statuses</option>
              <option value="ACTIVE">Active Staff</option>
              <option value="OFFBOARDED">Offboarded</option>
            </select>
          </div>

          {/* Department */}
          <div>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Design">Design & UX</option>
              <option value="DevOps">DevOps & Cloud</option>
              <option value="QA">Quality Assurance</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="Finance">Finance</option>
              <option value="Human Resources">Human Resources</option>
              <option value="Customer Success">Customer Success</option>
            </select>
          </div>
        </div>
      </div>

      {/* Employees Grid / Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-850 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Employee</th>
                <th className="py-3 px-4 font-semibold">Department</th>
                <th className="py-3 px-4 font-semibold">Office Hub</th>
                <th className="py-3 px-4 font-semibold">Status</th>
                <th className="py-3 px-4 font-semibold">Assigned Hardware Items</th>
                <th className="py-3 px-4 font-semibold">Start Date</th>
                <th className="py-3 px-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400 mb-2" />
                    Loading staff directory...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <p className="font-semibold text-slate-300 text-sm">No employees match your search</p>
                  </td>
                </tr>
              ) : (
                employees.map((emp) => {
                  const assignedAssets = emp.assets || [];
                  const isOffboardedWithAssets =
                    emp.status === "OFFBOARDED" && assignedAssets.length > 0;

                  return (
                    <tr
                      key={emp.id}
                      className={`hover:bg-slate-800/40 transition-colors ${
                        isOffboardedWithAssets ? "bg-rose-950/20" : ""
                      }`}
                    >
                      {/* Name & Email */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-slate-200">
                            {emp.name.charAt(0)}
                          </div>
                          <div>
                            <Link
                              href={`/employees/${emp.id}`}
                              className="font-bold text-white hover:text-emerald-400 transition-colors block"
                            >
                              {emp.name}
                            </Link>
                            <p className="text-[11px] text-slate-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td className="py-3 px-4 font-medium text-slate-200">
                        {emp.department}
                      </td>

                      {/* Location */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <LocationBadge location={emp.officeLocation} size="sm" />
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <EmployeeStatusBadge status={emp.status} size="sm" />
                      </td>

                      {/* Assigned Assets */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {assignedAssets.length > 0 ? (
                            <>
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                  isOffboardedWithAssets
                                    ? "bg-rose-500/30 text-rose-300 border border-rose-500/40"
                                    : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                                }`}
                              >
                                {assignedAssets.length} item{assignedAssets.length > 1 ? "s" : ""}
                              </span>
                              {assignedAssets.slice(0, 2).map((a) => (
                                <Link
                                  key={a.id}
                                  href={`/assets/${a.id}`}
                                  className="text-[11px] font-mono bg-slate-800 hover:bg-slate-700 px-2 py-0.5 rounded text-slate-300 border border-slate-700"
                                >
                                  {a.assetTag}
                                </Link>
                              ))}
                              {assignedAssets.length > 2 && (
                                <span className="text-[10px] text-slate-500">
                                  +{assignedAssets.length - 2} more
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-slate-500 italic text-[11px]">No active assets</span>
                          )}
                        </div>
                      </td>

                      {/* Start Date */}
                      <td className="py-3 px-4 whitespace-nowrap text-slate-400 text-[11px]">
                        {format(new Date(emp.startDate), "MMM dd, yyyy")}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/employees/${emp.id}`}
                            title="View Employee Profile"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => {
                              setEmployeeToEdit(emp);
                              setIsFormModalOpen(true);
                            }}
                            title="Edit Employee"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          {emp.status === "ACTIVE" ? (
                            <button
                              onClick={() => {
                                setEmployeeToOffboard(emp);
                                setIsOffboardModalOpen(true);
                              }}
                              title="Offboard Employee & Clear Assets"
                              className="p-1.5 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
                            >
                              <UserMinus className="w-4 h-4" />
                            </button>
                          ) : isOffboardedWithAssets ? (
                            <button
                              onClick={() => {
                                setEmployeeToOffboard(emp);
                                setIsOffboardModalOpen(true);
                              }}
                              title="Resolve Unreturned Hardware"
                              className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-bold"
                            >
                              Resolve Assets
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <EmployeeFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        employeeToEdit={employeeToEdit}
        onSuccess={fetchEmployees}
      />
      <OffboardModal
        isOpen={isOffboardModalOpen}
        onClose={() => setIsOffboardModalOpen(false)}
        employee={employeeToOffboard}
        onSuccess={fetchEmployees}
      />
    </div>
  );
}
