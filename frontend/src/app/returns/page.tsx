// src/app/returns/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { unwrapList } from "@/lib/pagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { PaginationControls } from "@/components/PaginationControls";

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
  const [receiptVerified, setReceiptVerified] = useState(true);
  const [confirmReturn, setConfirmReturn] = useState(false);
  const [processingReturn, setProcessingReturn] = useState(false);
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  async function loadSales(pageNumber = page) {
    try {
      const res = await api.get(`/sales/?page=${pageNumber}`);

      setSales(unwrapList(res.data));

      setCount(Array.isArray(res.data) ? res.data.length : res.data.count);

      setPage(pageNumber);
    } catch (err: any) {
      showToast({
        tone: "error",
        title: "Loading sales failed",
        description: err?.response?.data?.detail || "Please try again.",
      });
    }
  }
  async function loadSaleDetail(id: string) {
    setSelectedSaleId(id);
    setSelectedItemId("");
    setSaleDetail(null);

    if (!id) return;

    try {
      const res = await api.get(`/sales/${id}/`);
      showToast({
        tone: "success",
        title: "Sale Detail Loaded",
        description: `Sale detail was loaded successfully.`,
      });
      setSaleDetail(res.data);
    } catch (error: any) {
      showToast({
        tone: "error",
        title: "Sale Details Failed",
        description:
          error?.response?.data?.detail ||
          "Failed to load sale details, please try again.",
      });
    }
  }

  const selectedItem = useMemo(() => {
    return saleDetail?.items.find((item) => String(item.id) === selectedItemId);
  }, [saleDetail, selectedItemId]);

  const refundAmount = useMemo(() => {
    if (!selectedItem) return 0;
    return Number(selectedItem.unit_price) * Number(quantity || 0);
  }, [selectedItem, quantity]);

  async function submitReturn() {
    setProcessingReturn(true);

    try {
      const res = await api.post("/sales/returns/create/", {
        sale_id: Number(selectedSaleId),
        reason,
        receipt_verified: receiptVerified,
        items: [
          {
            sale_item_id: Number(selectedItemId),
            quantity,
            restock,
          },
        ],
      });
      showToast({
        tone: "success",
        title: "Return Processed",
        description: `Return processed. Refund: KES ${res.data.total_refund_amount}. Risk: ${res.data.refund_risk_level}`,
      });

      setConfirmReturn(false);
      setSelectedSaleId("");
      setSaleDetail(null);
      setSelectedItemId("");
      setQuantity("1");
      setReason("");
      setRestock(true);
      setReceiptVerified(true);
      await loadSales();
    } catch (error: any) {
      showToast({
        tone: "error",
        title: "Return process failed",
        description:
          error?.response?.data?.detail || "Return failed, please try again.",
      });
    } finally {
      setProcessingReturn(false);
    }
  }

  useEffect(() => {
    loadSales(1);
  }, []);
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
              <PaginationControls
                page={page}
                count={count}
                label="sales"
                onPageChange={loadSales}
              />
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setConfirmReturn(true);
            }}
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
                <label className="mt-4 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={receiptVerified}
                    onChange={(e) => setReceiptVerified(e.target.checked)}
                  />
                  Receipt verified
                </label>

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
        <ConfirmDialog
          open={confirmReturn}
          title="Process Customer Return?"
          description={`This will refund approximately KES ${refundAmount.toFixed(
            2,
          )}. The customer can leave immediately, but NexaPOS will score this return for manager review.`}
          confirmLabel="Process Return"
          tone="danger"
          loading={processingReturn}
          onCancel={() => setConfirmReturn(false)}
          onConfirm={submitReturn}
        />
      </main>
    </AppShell>
  );
}
