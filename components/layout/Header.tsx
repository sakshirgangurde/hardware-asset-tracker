"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Menu,
  LogOut,
  User,
  Building2,
  Search,
  Bell,
  Sparkles,
} from "lucide-react";
import { useToast } from "../ui/ToastContext";

interface HeaderProps {
  onMenuClick: () => void;
  selectedLocation: string;
  onLocationChange: (loc: string) => void;
}

export function Header({
  onMenuClick,
  selectedLocation,
  onLocationChange,
}: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { success, error } = useToast();
  const [adminUser, setAdminUser] = useState<{ name: string; email: string } | null>(null);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Don't show header on login page
  if (pathname === "/login") return null;

  useEffect(() => {
    fetch("/api/auth/me", { method: "GET" })
      .then((res) => {
        if (res.ok) return res.json();
        return { authenticated: false };
      })
      .then((data) => {
        if (data.authenticated && data.user) {
          setAdminUser(data.user);
        } else {
          setAdminUser({ name: "IT Administrator", email: "admin@hardwaretracker.com" });
        }
      })
      .catch(() => {
        setAdminUser({ name: "IT Administrator", email: "admin@hardwaretracker.com" });
      });
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      success("Logged out successfully");
      router.push("/login");
      router.refresh();
    } catch (err) {
      error("Failed to log out");
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/assets?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left section: Hamburger (mobile) + Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-lg">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs sm:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search tags, assets, employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs sm:text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all"
          />
        </form>
      </div>

      {/* Right section: Office Location Selector + User Menu */}
      <div className="flex items-center gap-3">
        {/* Office Location Filter Pill */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-850 border border-slate-700/60 rounded-xl p-1 text-xs">
          <span className="text-slate-400 px-2 font-medium flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-slate-400" /> Office:
          </span>
          {(["ALL", "HYD", "MUM"] as const).map((loc) => (
            <button
              key={loc}
              onClick={() => onLocationChange(loc)}
              className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                selectedLocation === loc
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
              }`}
            >
              {loc === "ALL" ? "All Locations" : loc}
            </button>
          ))}
        </div>

        {/* User Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-all"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-slate-200 leading-tight">
                {adminUser?.name || "Admin"}
              </p>
              <p className="text-[10px] text-emerald-400 font-medium">IT Admin</p>
            </div>
          </button>

          {/* Dropdown Menu */}
          {showUserDropdown && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserDropdown(false)}
              />
              <div className="absolute right-0 mt-2 w-56 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-xs font-bold text-white">{adminUser?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{adminUser?.email}</p>
                </div>
                <div className="px-3 py-1.5 text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> Full Access Administrator
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full mt-1 flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-rose-300 hover:bg-rose-950/40 hover:text-rose-200 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
