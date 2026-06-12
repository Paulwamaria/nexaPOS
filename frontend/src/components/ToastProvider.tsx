// src/components/ToastProvider.tsx
"use client";

import { createContext, useContext, useState, useRef } from "react";
import { CheckCircle, AlertCircle, X } from "lucide-react";

type ToastTone = "success" | "error" | "info";

type Toast = {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
};

type ToastContextValue = {
  showToast: (toast: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(0);

  function showToast(toast: Omit<Toast, "id">) {
    const id = `${Date.now()}-${++toastIdRef.current}`;

    setToasts((current) => [...current, { ...toast, id }]);

    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3500);
  }

  function removeToast(id: number) {
    setToasts((current) => current.filter((item) => item.id !== id));
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      <div className="fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((toast) => {
          const Icon = toast.tone === "success" ? CheckCircle : AlertCircle;

          return (
            <div
              key={toast.id}
              className={`rounded-2xl border p-4 shadow-2xl backdrop-blur ${
                toast.tone === "success"
                  ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-100"
                  : toast.tone === "error"
                    ? "border-red-500/30 bg-red-500/15 text-red-100"
                    : "border-white/10 bg-slate-900/95 text-white"
              }`}
            >
              <div className="flex gap-3">
                <Icon size={20} className="mt-0.5 shrink-0" />

                <div className="flex-1">
                  <p className="font-semibold">{toast.title}</p>
                  {toast.description && (
                    <p className="mt-1 text-sm opacity-80">
                      {toast.description}
                    </p>
                  )}
                </div>

                <button onClick={() => removeToast(toast.id)}>
                  <X size={16} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
