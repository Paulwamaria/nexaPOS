// src/app/low-stock/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { AlertMessage } from "@/components/AlertMessage";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { unwrapList } from "@/lib/pagination";

type Product = {
  id: number;
  name: string;
  sku: string;
};

type LowStockItem = {
  id: number;
  branch: string;
  product: Product;
  quantity: string;
  reorder_level: number;
};

export default function LowStockPage() {
  const router = useRouter();
  const { user, loadingUser } = useCurrentUser();

  const [items, setItems] = useState<LowStockItem[]>([]);
  const [message, setMessage] = useState("");

  async function loadLowStock() {
    try {
      const res = await api.get("/inventory/low-stock/");
      const itemsData = unwrapList(res.data);
      setItems(itemsData);
    } catch {
      setMessage("Failed to load low stock items.");
    }
  }

  useEffect(() => {
    if (!loadingUser) {
      loadLowStock();
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
          title="Low Stock"
          description="Products that have reached or fallen below their reorder level."
        />

        <AlertMessage message={message} tone="error" />

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr className="border-b border-white/10">
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">SKU</th>
                  <th className="py-3 pr-4">Branch</th>
                  <th className="py-3 pr-4">Quantity</th>
                  <th className="py-3 pr-4">Reorder Level</th>
                  <th className="py-3 pr-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b border-white/5">
                    <td className="py-3 pr-4 font-medium">
                      {item.product.name}
                    </td>
                    <td className="py-3 pr-4 text-slate-400">
                      {item.product.sku}
                    </td>
                    <td className="py-3 pr-4 text-slate-400">{item.branch}</td>
                    <td className="py-3 pr-4 font-semibold text-red-300">
                      {item.quantity}
                    </td>
                    <td className="py-3 pr-4 text-slate-400">
                      {item.reorder_level}
                    </td>
                    <td className="py-3 pr-4">
                      <button
                        onClick={() => router.push("/procurement")}
                        className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-400"
                      >
                        Create PO
                      </button>
                    </td>
                  </tr>
                ))}

                {items.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-slate-400">
                      No low stock items. Inventory looks healthy.
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
