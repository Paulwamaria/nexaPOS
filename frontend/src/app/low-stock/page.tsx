// src/app/low-stock/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { unwrapList } from "@/lib/pagination";
import { PaginationControls } from "@/components/PaginationControls";
import { useToast } from "@/components/ToastProvider";

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
function getStockUrgency(quantity: string, reorderLevel: number) {
  const qty = Number(quantity);

  if (qty <= 0) {
    return {
      label: "Critical",
      className: "bg-red-500/20 text-red-200",
      rank: 1,
    };
  }

  if (qty <= reorderLevel / 2) {
    return {
      label: "Very Low",
      className: "bg-orange-500/20 text-orange-200",
      rank: 2,
    };
  }

  return {
    label: "Low",
    className: "bg-yellow-500/20 text-yellow-200",
    rank: 3,
  };
}

export default function LowStockPage() {
  const router = useRouter();
  const { user, loadingUser } = useCurrentUser();

  const [items, setItems] = useState<LowStockItem[]>([]);
  const { showToast } = useToast();
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  async function loadLowStock(pageNumber = page) {
    try {
      const res = await api.get(`/inventory/low-stock/?page=${pageNumber}`);

      const itemsData = unwrapList(res.data);

      const sortedItems = [...itemsData].sort((a, b) => {
        const urgencyA = getStockUrgency(a.quantity, a.reorder_level).rank;
        const urgencyB = getStockUrgency(b.quantity, b.reorder_level).rank;

        return urgencyA - urgencyB;
      });

      setItems(sortedItems);

      setCount(Array.isArray(res.data) ? itemsData.length : res.data.count);

      setPage(pageNumber);
    } catch (error: any) {
      showToast({
        tone: "error",
        title: "Loading low stock failed",
        description:
          error?.response?.data?.detail || "Failed to load low stock items.",
      });
    }
  }

  useEffect(() => {
    if (!loadingUser) {
      loadLowStock(1);
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

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr className="border-b border-white/10">
                  <th className="py-3 pr-4">Product</th>
                  <th className="py-3 pr-4">SKU</th>
                  <th className="py-3 pr-4">Branch</th>
                  <th className="py-3 pr-4">Quantity</th>
                  <th className="py-3 pr-4">Urgency</th>
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
                    <td className="py-3 pr-4">
                      {(() => {
                        const urgency = getStockUrgency(
                          item.quantity,
                          item.reorder_level,
                        );

                        return (
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${urgency.className}`}
                          >
                            {urgency.label}
                          </span>
                        );
                      })()}
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
                    <td colSpan={7} className="py-6 text-slate-400">
                      No low stock items. Inventory looks healthy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
            <PaginationControls
              page={page}
              count={count}
              label="low stock items"
              onPageChange={loadLowStock}
            />
          </div>
        </section>
      </div>
    </AppShell>
  );
}
