// src/app/returns/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PageHeader } from "@/components/PageHeader";
import { AlertMessage } from "@/components/AlertMessage";
import { EmptyState } from "@/components/EmptyState";

type Sale = {
  id: number;
  sale_number: string;
  total_amount: string;
  created_at: string;
};

type SaleDetail = Sale & {
  sale_type: string;
  cashier: string;
  items: {
    id: number;
    product: string;
    quantity: string;
    unit_price: string;
    total: string;
  }[];
};

export default function ReturnsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [selectedSaleId, setSelectedSaleId] = useState("");
  const [saleDetail, setSaleDetail] = useState<SaleDetail | null>(null);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [restock, setRestock] = useState(true);
  const [message, setMessage] = useState("");

  async function loadSales() {
    const res = await api.get("/sales/");
    setSales(res.data);
  }

  useEffect(() => {
    loadSales();
  }, []);

  async function loadSaleDetail(id: string) {
    setSelectedSaleId(id);
    setSelectedItemId("");
    setSaleDetail(null);

    if (!id) return;

    const res = await api.get(`/sales/${id}/`);
    setSaleDetail(res.data);
  }

  const selectedItem = useMemo(() => {
    return saleDetail?.items.find((item) => String(item.id) === selectedItemId);
  }, [saleDetail, selectedItemId]);

  const refundAmount = useMemo(() => {
    if (!selectedItem) return 0;
    return Number(selectedItem.unit_price) * Number(quantity || 0);
  }, [selectedItem, quantity]);

  async function submitReturn(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    try {
      const res = await api.post("/sales/returns/create/", {
        sale_id: Number(selectedSaleId),
        reason,
        items: [
          {
            sale_item_id: Number(selectedItemId),
            quantity,
            restock,
          },
        ],
      });

      setMessage(
        `Return processed. Refund: KES ${res.data.total_refund_amount}`,
      );
      setSelectedSaleId("");
      setSaleDetail(null);
      setSelectedItemId("");
      setQuantity("1");
      setReason("");
      setRestock(true);
      await loadSales();
    } catch (error: any) {
      setMessage(error?.response?.data?.detail || "Return failed.");
    }
  }

  const { user, loadingUser } = useCurrentUser();

  if (loadingUser) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }
  return (
    <AppShell user={user}>
      <main className="min-h-screen bg-slate-950 text-white p-6">
        <div className="mb-8">
          <PageHeader
            title="Returns"
            description="Manage customer returns and restock inventory."
          />
        </div>

        {message && <AlertMessage message={message} />}

        <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Recent Sales</h2>

            <div className="mt-4 space-y-3">
              {sales.length === 0 ? (
                <EmptyState
                  title="No sales found"
                  description="Completed sales will appear here after checkout."
                />
              ) : (
                sales.map((sale) => (
                  <button
                    key={sale.id}
                    onClick={() => loadSaleDetail(String(sale.id))}
                    className={`w-full rounded-xl border p-4 text-left ${
                      selectedSaleId === String(sale.id)
                        ? "border-emerald-400 bg-emerald-500/10"
                        : "border-white/10 bg-slate-900 hover:border-emerald-400"
                    }`}
                  >
                    <p className="font-semibold">{sale.sale_number}</p>
                    <p className="text-sm text-slate-400">
                      KES {sale.total_amount} ·{" "}
                      {new Date(sale.created_at).toLocaleString()}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          <form
            onSubmit={submitReturn}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <h2 className="text-xl font-semibold">Process Return</h2>

            {!saleDetail ? (
              <p className="mt-4 text-sm text-slate-400">
                Select a sale to begin.
              </p>
            ) : (
              <>
                <div className="mt-4 rounded-xl bg-slate-900 p-4 text-sm">
                  <p>
                    <strong>Receipt:</strong> {saleDetail.sale_number}
                  </p>
                  <p className="text-slate-400">
                    Cashier: {saleDetail.cashier}
                  </p>
                </div>

                <label className="mt-4 block text-sm text-slate-300">
                  Item
                </label>
                <select
                  required
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                >
                  <option value="">Select item</option>
                  {saleDetail.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.product} — sold {item.quantity}
                    </option>
                  ))}
                </select>

                <label className="mt-4 block text-sm text-slate-300">
                  Quantity
                </label>
                <input
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                />

                <label className="mt-4 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={restock}
                    onChange={(e) => setRestock(e.target.checked)}
                  />
                  Restock item
                </label>

                <label className="mt-4 block text-sm text-slate-300">
                  Reason
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                  placeholder="Reason for return"
                />

                <div className="mt-4 rounded-xl bg-slate-900 p-4">
                  <p className="text-sm text-slate-400">Estimated Refund</p>
                  <p className="mt-1 text-2xl font-bold text-emerald-400">
                    KES {refundAmount.toFixed(2)}
                  </p>
                </div>

                <button
                  disabled={!selectedItemId}
                  className="mt-5 w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  Process Return
                </button>
              </>
            )}
          </form>
        </section>
      </main>
    </AppShell>
  );
}
