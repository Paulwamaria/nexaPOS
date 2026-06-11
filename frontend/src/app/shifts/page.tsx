// src/app/shifts/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { AlertMessage } from "@/components/AlertMessage";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/lib/api";

type CashShift = {
  id: number;
  branch: string;
  cashier: string;
  opening_cash: string;
  closing_cash: string | null;
  expected_cash: string | null;
  difference: string | null;
  status: string;
  opened_at: string;
  closed_at: string | null;
};

export default function ShiftsPage() {
  const { user, loadingUser } = useCurrentUser();

  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [message, setMessage] = useState("");

  async function loadShifts() {
    try {
      const res = await api.get("/sales/shifts/");
      setShifts(res.data);
    } catch {
      setMessage("Failed to load shifts.");
    }
  }

  useEffect(() => {
    if (!loadingUser) {
      loadShifts();
    }
  }, [loadingUser]);

  if (loadingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading...
      </main>
    );
  }

  return (
    <AppShell user={user}>
      <div className="p-4 sm:p-6">
        <PageHeader
          title="Shift History"
          description="Review cashier shift openings, closings, and cash differences."
        />

        <AlertMessage message={message} tone="error" />

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr className="border-b border-white/10">
                  <th className="py-3 pr-4">Branch</th>
                  <th className="py-3 pr-4">Cashier</th>
                  <th className="py-3 pr-4">Opening</th>
                  <th className="py-3 pr-4">Closing</th>
                  <th className="py-3 pr-4">Expected</th>
                  <th className="py-3 pr-4">Difference</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Opened</th>
                  <th className="py-3 pr-4">Closed</th>
                </tr>
              </thead>

              <tbody>
                {shifts.map((shift) => (
                  <tr key={shift.id} className="border-b border-white/5">
                    <td className="py-3 pr-4 font-medium">{shift.branch}</td>
                    <td className="py-3 pr-4 text-slate-400">
                      {shift.cashier}
                    </td>
                    <td className="py-3 pr-4">KES {shift.opening_cash}</td>
                    <td className="py-3 pr-4">
                      {shift.closing_cash ? `KES ${shift.closing_cash}` : "-"}
                    </td>
                    <td className="py-3 pr-4">
                      {shift.expected_cash ? `KES ${shift.expected_cash}` : "-"}
                    </td>
                    <td
                      className={`py-3 pr-4 font-semibold ${
                        Number(shift.difference || 0) === 0
                          ? "text-emerald-300"
                          : "text-red-300"
                      }`}
                    >
                      {shift.difference ? `KES ${shift.difference}` : "-"}
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          shift.status === "OPEN"
                            ? "bg-emerald-500/20 text-emerald-200"
                            : "bg-slate-500/20 text-slate-300"
                        }`}
                      >
                        {shift.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-400">
                      {new Date(shift.opened_at).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4 text-slate-400">
                      {shift.closed_at
                        ? new Date(shift.closed_at).toLocaleString()
                        : "-"}
                    </td>
                  </tr>
                ))}

                {shifts.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-6 text-slate-400">
                      No shifts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
