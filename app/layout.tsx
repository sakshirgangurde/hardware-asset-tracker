import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Hardware Asset Tracker | Enterprise IT Asset Management",
  description:
    "Enterprise-grade Hardware Asset Tracking system for managing IT hardware inventory, assignments, warranties, maintenance logs, and lifecycle auditing across Hyderabad and Mumbai offices.",
  keywords: [
    "Hardware Asset Tracker",
    "IT Asset Management",
    "Enterprise Inventory",
    "Asset Lifecycle",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="bg-slate-950 text-slate-100 antialiased selection:bg-emerald-500/30 selection:text-emerald-200">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
