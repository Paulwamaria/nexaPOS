// src/app/return-reviews/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/lib/api";
import { unwrapList } from "@/lib/pagination";
import { PaginationControls } from "@/components/PaginationControls";
import { useToast } from "@/components/ToastProvider";

type SaleReturn = {
  id: number;
  sale_number: string;
  reason: string;
  total_refund_amount: string;
  returned_by: string;
  receipt_verified: boolean;
  refund_risk_level: string;
  risk_notes: string;
  manager_reviewed: boolean;
  manager_reviewed_by: string | null;
  manager_reviewed_at: string | null;
  created_at: string;
};

export default function ReturnReviewsPage() {
  const { user, loadingUser } = useCurrentUser();

  const [returns, setReturns] = useState<SaleReturn[]>([]);
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const { showToast } = useToast();

  async function loadReturns(pageNumber = page) {
    try {
      const res = await api.get(`/sales/returns/?page=${pageNumber}`);

      setReturns(unwrapList(res.data));

      setCount(Array.isArray(res.data) ? res.data.length : res.data.count);

      setPage(pageNumber);
    } catch (err: any) {
      showToast({
        tone: "error",
        title: "Loading returns failed",
        description: err?.response?.data?.detail || "Please try again.",
      });
    }
  }

  useEffect(() => {
    if (!loadingUser) {
      loadReturns(1);
    }
  }, [loadingUser]);

  async function markReviewed(id: number) {
    try {
      await api.post(`/sales/returns/${id}/review/`);
      showToast({
        tone: "success",
        title: "Review Successful",
        description: "Return marked as reviewed.",
      });
      await loadReturns();
    } catch {
      showToast({
        tone: "error",
        title: "Review failed",
        description:
          err?.response?.data?.detail ||
          "Failed to review return, please try again.",
      });
    }
  }

  if (loadingUser) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }

  return (
    <AppShell user={user}>
      <div className="p-4 sm:p-6">
        <PageHeader
          title="Return Reviews"
          description="Review suspicious or high-risk customer returns."
        />

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr className="border-b border-white/10">
                  <th className="py-3">Receipt</th>
                  <th className="py-3">Cashier</th>
                  <th className="py-3">Refund</th>
                  <th className="py-3">Risk</th>
                  <th className="py-3">Receipt</th>
                  <th className="py-3">Notes</th>
                  <th className="py-3">Reviewed</th>
                  <th className="py-3">Action</th>
                </tr>
              </thead>

              <tbody>
                {returns.map((item) => (
                  <tr key={item.id} className="border-b border-white/5">
                    <td className="py-3 font-medium">{item.sale_number}</td>
                    <td className="py-3 text-slate-400">{item.returned_by}</td>
                    <td className="py-3 font-semibold">
                      KES {item.total_refund_amount}
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          item.refund_risk_level === "HIGH"
                            ? "bg-red-500/20 text-red-200"
                            : item.refund_risk_level === "MEDIUM"
                              ? "bg-yellow-500/20 text-yellow-200"
                              : "bg-emerald-500/20 text-emerald-200"
                        }`}
                      >
                        {item.refund_risk_level}
                      </span>
                    </td>
                    <td className="py-3 text-slate-400">
                      {item.receipt_verified ? "Verified" : "Not verified"}
                    </td>
                    <td className="max-w-xs py-3 text-slate-400">
                      {item.risk_notes || item.reason || "-"}
                    </td>
                    <td className="py-3 text-slate-400">
                      {item.manager_reviewed ? "Yes" : "No"}
                    </td>
                    <td className="py-3">
                      {!item.manager_reviewed ? (
                        <button
                          onClick={() => markReviewed(item.id)}
                          className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950"
                        >
                          Mark Reviewed
                        </button>
                      ) : (
                        <span className="text-slate-500">
                          {item.manager_reviewed_by || "Reviewed"}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {returns.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-6 text-slate-400">
                      No returns found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <PaginationControls
              page={page}
              count={count}
              label="returns"
              onPageChange={loadReturns}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
