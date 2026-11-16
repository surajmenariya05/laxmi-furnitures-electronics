"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaTimes } from "react-icons/fa";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface ToastContextType {
  showToast: (toast: Omit<ToastItem, "id">) => string;
  hideToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const hideToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, "id">) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newToast: ToastItem = {
        ...toast,
        id,
        duration: toast.duration ?? 5000,
      };

      setToasts((prev) => [...prev, newToast]);

      if (newToast.duration && newToast.duration > 0) {
        setTimeout(() => {
          hideToast(id);
        }, newToast.duration);
      }

      return id;
    },
    [hideToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}

      {/* Floating Toast Notification Container (Top-Right) */}
      <div
        className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
        aria-live="polite"
      >
        {toasts.map((toast) => {
          const isSuccess = toast.type === "success";
          const isError = toast.type === "error";
          const isWarning = toast.type === "warning";
          const isInfo = toast.type === "info";

          const borderColor = isSuccess
            ? "border-emerald-300 bg-white"
            : isError
            ? "border-rose-300 bg-white"
            : isWarning
            ? "border-amber-300 bg-white"
            : "border-blue-300 bg-white";

          const iconColor = isSuccess
            ? "text-emerald-600 bg-emerald-100"
            : isError
            ? "text-rose-600 bg-rose-100"
            : isWarning
            ? "text-amber-600 bg-amber-100"
            : "text-blue-600 bg-blue-100";

          const shadowColor = isSuccess
            ? "shadow-[0_10px_25px_-5px_rgba(16,185,129,0.25)]"
            : isError
            ? "shadow-[0_10px_25px_-5px_rgba(244,63,94,0.25)]"
            : "shadow-[0_10px_25px_-5px_rgba(59,130,246,0.25)]";

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border ${borderColor} ${shadowColor} transition-all duration-300 animate-in fade-in slide-in-from-top-3`}
            >
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${iconColor}`}
              >
                {isSuccess && <FaCheckCircle className="w-4 h-4" />}
                {isError && <FaExclamationCircle className="w-4 h-4" />}
                {isWarning && <FaExclamationCircle className="w-4 h-4" />}
                {isInfo && <FaInfoCircle className="w-4 h-4" />}
              </div>

              <div className="flex-1 min-w-0 pr-1">
                <div className="text-xs font-black text-slate-900 leading-tight">
                  {toast.title}
                </div>
                {toast.message && (
                  <p className="text-[11px] text-slate-600 mt-0.5 leading-snug font-medium break-words">
                    {toast.message}
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => hideToast(toast.id)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition shrink-0"
                title="Dismiss"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
