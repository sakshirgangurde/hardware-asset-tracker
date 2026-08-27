"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { ToastProvider } from "../ui/ToastContext";

export const LocationFilterContext = React.createContext<{
  location: string;
  setLocation: (loc: string) => void;
}>({
  location: "ALL",
  setLocation: () => {},
});

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<string>("ALL");
  const pathname = usePathname();

  const isLoginPage = pathname === "/login";

  return (
    <ToastProvider>
      <LocationFilterContext.Provider
        value={{ location: selectedLocation, setLocation: setSelectedLocation }}
      >
        {isLoginPage ? (
          <main className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            {children}
          </main>
        ) : (
          <div className="min-h-screen bg-slate-950 text-slate-100 flex">
            {/* Sidebar Navigation */}
            <Sidebar
              isOpen={sidebarOpen}
              onClose={() => setSidebarOpen(false)}
            />

            {/* Mobile backdrop */}
            {sidebarOpen && (
              <div
                className="fixed inset-0 bg-slate-950/80 z-30 lg:hidden backdrop-blur-sm"
                onClick={() => setSidebarOpen(false)}
              />
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
              <Header
                onMenuClick={() => setSidebarOpen(true)}
                selectedLocation={selectedLocation}
                onLocationChange={setSelectedLocation}
              />
              <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
                {children}
              </main>
            </div>
          </div>
        )}
      </LocationFilterContext.Provider>
    </ToastProvider>
  );
}
