// src/app/sales/page.tsx
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
  branch: string;
  cashier: string;
  customer: string | null;
  sale_type: string;
  total_amount: string;
  created_at: string;
};

type SaleReceipt = Sale & {
  subtotal: string;
  items: {
    id: number;
    product: string;
    quantity: string;
    unit_price: string;
    total: string;
  }[];
  payments: {
    id: number;
    payment_method: string;
    amount: string;
    reference: string;
  }[];
};

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadSales() {
    setLoading(true);

    try {
      const res = await api.get("/sales/");
      setSales(res.data);
    } catch {
      setMessage("Failed to load sales.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSales();
  }, []);

  const filteredSales = useMemo(() => {
    return sales.filter((sale) =>
      sale.sale_number.toLowerCase().includes(query.toLowerCase()),
    );
  }, [sales, query]);

  async function viewReceipt(id: number) {
    setMessage("");

    try {
      const res = await api.get(`/sales/${id}/`);
      setReceipt(res.data);
    } catch {
      setMessage("Failed to load receipt.");
    }
  }

  function printReceipt() {
    window.print();
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
            title="Sales"
            description="View complete sales history, search receipts, and print sales receipts."
          />
        </div>

        {message && <AlertMessage message={message} />}

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-semibold">Sales</h2>

            <input
              className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400 md:max-w-sm"
              placeholder="Search receipt number..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {loading ? (
            <p className="text-slate-400">Loading sales...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr className="border-b border-white/10">
                    <th className="py-3">Receipt</th>
                    <th className="py-3">Type</th>
                    <th className="py-3">Branch</th>
                    <th className="py-3">Cashier</th>
                    <th className="py-3">Total</th>
                    <th className="py-3">Date</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredSales.map((sale) => (
                    <tr key={sale.id} className="border-b border-white/5">
                      <td className="py-3 font-medium">{sale.sale_number}</td>
                      <td className="py-3 text-slate-400">{sale.sale_type}</td>
                      <td className="py-3 text-slate-400">{sale.branch}</td>
                      <td className="py-3 text-slate-400">{sale.cashier}</td>
                      <td className="py-3 font-semibold">
                        KES {sale.total_amount}
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(sale.created_at).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <button
                          onClick={() => viewReceipt(sale.id)}
                          className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950"
                        >
                          Receipt
                        </button>
                      </td>
                    </tr>
                  ))}

                  {filteredSales.length === 0 ? (
                    <EmptyState
                      title="No sales found"
                      description="Completed sales will appear here after checkout."
                    />
                  ) : (
                    <tr>
                      <td className="py-6 text-slate-400" colSpan={7}>
                        No sales found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {receipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 print:static print:bg-white print:p-0">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 text-slate-950 shadow-2xl print:shadow-none print:rounded-none">
              <div id="receipt-print-area">
                <div className="text-center">
                  <h2 className="text-2xl font-bold">NexaPOS</h2>
                  <p className="text-sm text-slate-500">Sales Receipt</p>
                </div>

                <div className="mt-5 border-y border-slate-200 py-3 text-sm">
                  <p>
                    <strong>Receipt:</strong> {receipt.sale_number}
                  </p>
                  <p>
                    <strong>Date:</strong>{" "}
                    {new Date(receipt.created_at).toLocaleString()}
                  </p>
                  <p>
                    <strong>Sale Type:</strong> {receipt.sale_type}
                  </p>
                  <p>
                    <strong>Cashier:</strong> {receipt.cashier}
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {receipt.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <div>
                        <p className="font-medium">{item.product}</p>
                        <p className="text-slate-500">
                          {item.quantity} × KES {item.unit_price}
                        </p>
                      </div>
                      <p className="font-semibold">KES {item.total}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-5 border-t border-slate-200 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>KES {receipt.total_amount}</span>
                  </div>

                  {receipt.payments?.map((payment) => (
                    <div
                      key={payment.id}
                      className="mt-2 flex justify-between text-sm text-slate-600"
                    >
                      <span>{payment.payment_method}</span>
                      <span>KES {payment.amount}</span>
                    </div>
                  ))}
                </div>

                <p className="mt-6 text-center text-sm text-slate-500">
                  Thank you for shopping with us.
                </p>
              </div>

              <div className="mt-6 flex gap-3 print:hidden">
                <button
                  onClick={printReceipt}
                  className="flex-1 rounded-lg bg-slate-950 px-4 py-3 font-semibold text-white"
                >
                  Print
                </button>

                <button
                  onClick={() => setReceipt(null)}
                  className="flex-1 rounded-lg border border-slate-300 px-4 py-3 font-semibold"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </AppShell>
  );
}
