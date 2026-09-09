"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Laptop,
  Users,
  Wrench,
  FileBarChart,
  ShieldCheck,
  Building2,
  HardDrive,
} from "lucide-react";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  // Don't render sidebar on login page
  if (pathname === "/login") return null;

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      match: pathname === "/dashboard" || pathname === "/",
    },
    {
      name: "Hardware Assets",
      href: "/assets",
      icon: Laptop,
      match: pathname.startsWith("/assets"),
    },
    /* Hidden for current view (routes and code kept intact for later use):
    {
      name: "Employees",
      href: "/employees",
      icon: Users,
      match: pathname.startsWith("/employees"),
    },
    {
      name: "Maintenance",
      href: "/maintenance",
      icon: Wrench,
      match: pathname.startsWith("/maintenance"),
    },
    {
      name: "Reports & Audit",
      href: "/reports",
      icon: FileBarChart,
      match: pathname.startsWith("/reports"),
    },
    */
  ];

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      {/* Brand Logo Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800/80 gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
          <HardDrive className="w-5 h-5 text-slate-950 stroke-[2.5]" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
            Asset<span className="text-emerald-400">Tracker</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Enterprise Hardware</p>
        </div>
      </div>

      {/* Office Hub Indicator */}
      <div className="px-4 py-3 mx-3 mt-4 rounded-xl bg-slate-850 border border-slate-700/50">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
          <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-400 flex items-center gap-1">
            <Building2 className="w-3 h-3 text-emerald-400" /> Active Offices
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
            Live
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-center text-xs font-semibold">
          <div className="bg-slate-800/70 border border-slate-700/40 rounded-lg py-1 px-2 text-slate-200">
            MUM Hub
          </div>
          <div className="bg-slate-800/70 border border-slate-700/40 rounded-lg py-1 px-2 text-slate-200">
            HYD Hub
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 px-3 pb-1">
          Menu
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.match;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm font-semibold"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-800/60"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive ? "text-emerald-400" : "text-slate-400 group-hover:text-slate-200"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Security & System Info Footer */}
      {/* <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-800/50 border border-slate-700/40 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <div className="truncate">
          </div>
        </div>
      </div> */}
    </aside>
  );
}
