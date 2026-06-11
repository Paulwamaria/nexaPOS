// src/app/inventory/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, PackageSearch, PlusCircle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PageHeader } from "@/components/PageHeader";
import { AlertMessage } from "@/components/AlertMessage";
import { EmptyState } from "@/components/EmptyState";
import { unwrapList } from "@/lib/pagination";

type Product = {
  id: number;
  name: string;
  sku: string;
  retail_price: string;
  wholesale_price: string;
};

type Stock = {
  id: number;
  branch: string;
  product: Product;
  quantity: string;
  reorder_level: number;
  updated_at: string;
};

export default function InventoryPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [adjustmentType, setAdjustmentType] = useState<
    "ADJUSTMENT_IN" | "ADJUSTMENT_OUT"
  >("ADJUSTMENT_IN");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const branchId = 2;

  async function loadInventory() {
    setLoading(true);

    try {
      const [stocksRes, productsRes] = await Promise.all([
        api.get("/inventory/stocks/"),
        api.get("/inventory/products/"),
      ]);

      setStocks(unwrapList(stocksRes.data));
      setProducts(unwrapList(productsRes.data));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory();
  }, []);

  const lowStockCount = useMemo(() => {
    return stocks.filter(
      (stock) => Number(stock.quantity) <= Number(stock.reorder_level),
    ).length;
  }, [stocks]);

  async function adjustStock(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("/inventory/adjust-stock/", {
        branch_id: branchId,
        product_id: Number(selectedProductId),
        quantity,
        adjustment_type: adjustmentType,
        notes,
      });

      setMessage("Stock adjusted successfully.");
      setSelectedProductId("");
      setQuantity("1");
      setNotes("");
      await loadInventory();
    } catch (error: any) {
      setMessage(error?.response?.data?.detail || "Stock adjustment failed.");
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
            title="Inventory"
            description="Manage branch stock levels and inventory adjustments."
          />
        </div>

        {message && <AlertMessage message={message} />}

        <section className="grid gap-4 md:grid-cols-3">
          <InventoryCard
            title="Products"
            value={products.length}
            subtitle="Active products"
            icon={<PackageSearch />}
          />
          <InventoryCard
            title="Stock Records"
            value={stocks.length}
            subtitle="Branch stock entries"
            icon={<Boxes />}
          />
          <InventoryCard
            title="Low Stock"
            value={lowStockCount}
            subtitle="Need attention"
            icon={<RefreshCw />}
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Stock Levels</h2>

            {loading ? (
              <p className="mt-4 text-slate-400">Loading inventory...</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="text-slate-400">
                    <tr className="border-b border-white/10">
                      <th className="py-3">Product</th>
                      <th className="py-3">SKU</th>
                      <th className="py-3">Branch</th>
                      <th className="py-3">Qty</th>
                      <th className="py-3">Reorder</th>
                    </tr>
                  </thead>

                  <tbody>
                    {stocks.map((stock) => (
                      <tr key={stock.id} className="border-b border-white/5">
                        <td className="py-3 font-medium">
                          {stock.product.name}
                        </td>
                        <td className="py-3 text-slate-400">
                          {stock.product.sku}
                        </td>
                        <td className="py-3 text-slate-400">{stock.branch}</td>
                        <td
                          className={`py-3 font-semibold ${
                            Number(stock.quantity) <= stock.reorder_level
                              ? "text-red-300"
                              : "text-emerald-300"
                          }`}
                        >
                          {stock.quantity}
                        </td>
                        <td className="py-3 text-slate-400">
                          {stock.reorder_level}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <form
            onSubmit={adjustStock}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <div className="flex items-center gap-2">
              <PlusCircle className="text-emerald-400" />
              <h2 className="text-xl font-semibold">Adjust Stock</h2>
            </div>

            <label className="mt-5 block text-sm text-slate-300">Product</label>
            <select
              required
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} — {product.sku}
                </option>
              ))}
            </select>

            <label className="mt-4 block text-sm text-slate-300">
              Adjustment Type
            </label>
            <select
              value={adjustmentType}
              onChange={(e) =>
                setAdjustmentType(
                  e.target.value as "ADJUSTMENT_IN" | "ADJUSTMENT_OUT",
                )
              }
              className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
            >
              <option value="ADJUSTMENT_IN">Adjustment In</option>
              <option value="ADJUSTMENT_OUT">Adjustment Out</option>
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

            <label className="mt-4 block text-sm text-slate-300">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-2 min-h-24 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
              placeholder="Reason for adjustment"
            />

            <button className="mt-5 w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">
              Save Adjustment
            </button>
          </form>
        </section>
      </main>
    </AppShell>
  );
}

function InventoryCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <div className="text-emerald-400">{icon}</div>
      </div>
      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}
