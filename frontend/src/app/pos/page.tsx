// src/app/pos/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

type Product = {
  id: number;
  name: string;
  sku: string;
  retail_price: string;
  wholesale_price: string;
};

type CashShift = {
  id: number;
  branch: string;
  cashier: string;
  opening_cash: string;
  status: string;
};

type CartItem = {
  product: Product;
  quantity: number;
};

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [branchId] = useState(2);
  const [saleType, setSaleType] = useState<"RETAIL" | "WHOLESALE">("RETAIL");
  const [cashAmount, setCashAmount] = useState("");
  const [message, setMessage] = useState("");
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [openingCash, setOpeningCash] = useState("1000.00");

  useEffect(() => {
    async function loadPOS() {
      const productsRes = await api.get("/inventory/products/");
      setProducts(productsRes.data);

      try {
        const shiftRes = await api.get("/sales/shifts/current/");
        setCurrentShift(shiftRes.data);
      } catch {
        setCurrentShift(null);
      }
    }

    loadPOS();
  }, []);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => {
      const price =
        saleType === "WHOLESALE"
          ? Number(item.product.wholesale_price)
          : Number(item.product.retail_price);

      return sum + price * item.quantity;
    }, 0);
  }, [cart, saleType]);

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id);

      if (existing) {
        return current.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }

      return [...current, { product, quantity: 1 }];
    });
  }

  function removeFromCart(productId: number) {
    setCart((current) =>
      current.filter((item) => item.product.id !== productId),
    );
  }

  async function checkout() {
    setMessage("");

    try {
      const response = await api.post("/sales/checkout/", {
        branch_id: branchId,
        sale_type: saleType,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: String(item.quantity),
        })),
        payments: [
          {
            payment_method: "CASH",
            amount: cashAmount || String(total),
          },
        ],
      });

      setMessage(`Sale complete: ${response.data.sale_number}`);
      setCart([]);
      setCashAmount("");
    } catch (error: any) {
      setMessage(error?.response?.data?.detail || "Checkout failed.");
    }
  }

  async function openShift() {
    setMessage("");

    try {
      const res = await api.post("/sales/shifts/open/", {
        branch: branchId,
        opening_cash: openingCash,
      });

      setCurrentShift(res.data);
      setMessage("Shift opened successfully.");
    } catch (error: any) {
      setMessage(error?.response?.data?.detail || "Failed to open shift.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mb-6">
        <p className="text-emerald-400 text-sm font-medium">NexaPOS</p>
        <h1 className="text-3xl font-bold mt-2">POS Terminal</h1>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-white/10 bg-white/5 p-4">
          {message}
        </div>
      )}

      {!currentShift && (
        <section className="mb-6 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
          <h2 className="text-xl font-semibold text-yellow-200">
            Open Cash Shift Required
          </h2>
          <p className="mt-2 text-sm text-yellow-100/80">
            You must open a cash shift before processing sales.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400"
              value={openingCash}
              onChange={(e) => setOpeningCash(e.target.value)}
              placeholder="Opening cash"
            />

            <button
              onClick={openShift}
              className="rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Open Shift
            </button>
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Products</h2>

            <select
              value={saleType}
              onChange={(e) =>
                setSaleType(e.target.value as "RETAIL" | "WHOLESALE")
              }
              className="rounded-lg bg-slate-900 border border-white/10 px-3 py-2"
            >
              <option value="RETAIL">Retail</option>
              <option value="WHOLESALE">Wholesale</option>
            </select>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="rounded-xl border border-white/10 bg-slate-900 p-4 text-left hover:border-emerald-400"
              >
                <p className="font-semibold">{product.name}</p>
                <p className="text-sm text-slate-400">{product.sku}</p>
                <p className="mt-3 text-emerald-400">
                  KES{" "}
                  {saleType === "WHOLESALE"
                    ? product.wholesale_price
                    : product.retail_price}
                </p>
              </button>
            ))}
          </div>
        </section>

        <aside className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">Cart</h2>

          <div className="mt-4 space-y-3">
            disabled={cart.length === 0 || !currentShift}
            {cart.length === 0 && (
              <p className="text-sm text-slate-400">No items added yet.</p>
            )}
            {cart.map((item) => (
              <div
                key={item.product.id}
                className="flex items-center justify-between rounded-xl bg-slate-900 p-3"
              >
                <div>
                  <p className="font-medium">{item.product.name}</p>
                  <p className="text-sm text-slate-400">Qty: {item.quantity}</p>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="text-sm text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span>KES {total.toFixed(2)}</span>
            </div>

            <input
              className="mt-4 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400"
              placeholder="Cash received"
              value={cashAmount}
              onChange={(e) => setCashAmount(e.target.value)}
            />

            <button
              onClick={checkout}
              disabled={cart.length === 0}
              className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
            >
              {currentShift ? "Complete Sale" : "Open Shift First"}
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}
