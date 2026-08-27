"useclient";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toast: (title: string, message?: string, type?: ToastType) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addToast = (title: string, message?: string, type: ToastType = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  };

  return (
    <ToastContext.Provider
      value={{
        toast: addToast,
        success: (t, m) => addToast(t, m, "success"),
        error: (t, m) => addToast(t, m, "error"),
        warning: (t, m) => addToast(t, m, "warning"),
        info: (t, m) => addToast(t, m, "info"),
      }}
    >
      {children}
      {/* Toast Render Container */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-md w-full px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl transition-all duration-300 transform translate-y-0 ${
              t.type === "success"
                ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-100"
                : t.type === "error"
                ? "bg-rose-950/90 border-rose-500/50 text-rose-100"
                : t.type === "warning"
                ? "bg-amber-950/90 border-amber-500/50 text-amber-100"
                : "bg-slate-900/90 border-slate-700 text-slate-100"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {t.type === "error" && <AlertCircle className="w-5 h-5 text-rose-400" />}
              {t.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {t.type === "info" && <Info className="w-5 h-5 text-blue-400" />}
            </div>
            <div className="flex-1 text-sm">
              <h4 className="font-semibold text-white">{t.title}</h4>
              {t.message && <p className="mt-0.5 text-xs opacity-90">{t.message}</p>}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
