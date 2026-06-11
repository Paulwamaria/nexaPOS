// src/app/pos/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PageHeader } from "@/components/PageHeader";
import { AlertMessage } from "@/components/AlertMessage";
import { EmptyState } from "@/components/EmptyState";
type Product = {
  id: number;
  name: string;
  sku: string;
  retail_price: string;
  wholesale_price: string;
};

type StockItem = {
  id: number;
  branch: string;
  product: Product;
  quantity: string;
  reorder_level: number;
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

type SaleReceipt = {
  id: number;
  sale_number: string;
  sale_type: string;
  subtotal: string;
  total_amount: string;
  created_at: string;
  items: {
    id: number;
    product: string;
    quantity: string;
    unit_price: string;
    total: string;
  }[];
  payments?: {
    id: number;
    payment_method: string;
    amount: string;
    reference: string;
  }[];
};
type Customer = {
  id: number;
  name: string;
  phone: string;
  customer_type: string;
};

function printReceipt() {
  window.print();
}

function updateQuantity(productId: number, delta: number) {
  setCart((current) =>
    current
      .map((item) =>
        item.product.id === productId
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item,
      )
      .filter((item) => item.quantity > 0),
  );
}

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [branchId] = useState(2);
  const [saleType, setSaleType] = useState<"RETAIL" | "WHOLESALE">("RETAIL");
  const [cashAmount, setCashAmount] = useState("");
  const [message, setMessage] = useState("");
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [openingCash, setOpeningCash] = useState("1000.00");
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [barcode, setBarcode] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [closingShift, setClosingShift] = useState(false);
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");

  async function loadPOS() {
    const stocksRes = await api.get(`/inventory/stocks/?branch_id=${branchId}`);
    setStockItems(stocksRes.data);

    try {
      const shiftRes = await api.get(
        `/sales/shifts/current/?branch_id=${branchId}`,
      );
      setCurrentShift(shiftRes.data);
    } catch {
      setCurrentShift(null);
    }

    try {
      const customersRes = await api.get("/sales/customers/");
      setCustomers(customersRes.data);
    } catch {
      setCustomers([]);
    }
  }

  useEffect(() => {
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

  const filteredStockItems = useMemo(() => {
    return stockItems.filter((stock) => {
      const search = productSearch.toLowerCase();
      const product = stock.product;

      return (
        product.name.toLowerCase().includes(search) ||
        product.sku.toLowerCase().includes(search)
      );
    });
  }, [stockItems, productSearch]);

  function handleBarcodeScan(value: string) {
    setBarcode(value);
    const stock = stockItems.find((item) => {
      const product = item.product;

      return (
        product.sku.toLowerCase() === value.toLowerCase() ||
        product.name.toLowerCase() === value.toLowerCase()
      );
    });

    if (!stock) return;

    addToCart(stock.product);
    setBarcode("");
    setMessage(`Added ${stock.product.name} to cart.`);
  }

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
    if (checkingOut) return;

    setCheckingOut(true);
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
            customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
          },
        ],
      });

      const receiptRes = await api.get(`/sales/${response.data.id}/`);

      setReceipt(receiptRes.data);
      setMessage(`Sale complete: ${response.data.sale_number}`);
      setCart([]);
      setCashAmount("");
      await loadPOS();
    } catch (error: any) {
      console.error("Checkout error:", error?.response?.data || error);

      const detail =
        error?.response?.data?.detail ||
        JSON.stringify(error?.response?.data) ||
        "Checkout failed.";

      setMessage(detail);
    } finally {
      setCheckingOut(false);
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

  async function closeShift() {
    if (!currentShift) return;

    setClosingShift(true);
    setMessage("");

    try {
      const res = await api.post(`/sales/shifts/${currentShift.id}/close/`, {
        closing_cash: closingCash,
      });

      setMessage(
        `Shift closed. Expected: KES ${res.data.expected_cash}, Difference: KES ${res.data.difference}`,
      );

      setCurrentShift(null);
      setClosingCash("");
    } catch (error: any) {
      setMessage(error?.response?.data?.detail || "Failed to close shift.");
    } finally {
      setClosingShift(false);
    }
  }
  const { user, loadingUser } = useCurrentUser();
  const change = Number(cashAmount || 0) - total;

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
        <PageHeader
          title="POS Terminal"
          description="Manage branch sales and transactions."
        />

        {message && <AlertMessage message={message} />}

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
        {currentShift && (
          <section className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-emerald-200">
                  Active Cash Shift
                </h2>
                <p className="mt-1 text-sm text-emerald-100/80">
                  {currentShift.branch} · Opening Cash: KES{" "}
                  {currentShift.opening_cash}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  placeholder="Closing cash"
                  className="rounded-lg border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400"
                />

                <button
                  onClick={closeShift}
                  disabled={!closingCash || closingShift}
                  className="rounded-lg bg-red-400 px-5 py-3 font-semibold text-slate-950 hover:bg-red-300 disabled:opacity-50"
                >
                  {closingShift ? "Closing..." : "Close Shift"}
                </button>
              </div>
            </div>
          </section>
        )}
        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <input
              autoFocus
              value={barcode}
              onChange={(e) => handleBarcodeScan(e.target.value)}
              className="mb-3 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400"
              placeholder="Scan barcode or enter SKU..."
            />
            <input
              className="mb-4 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400"
              placeholder="Search product by name or SKU..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">Products</h2>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="rounded-lg bg-slate-900 border border-white/10 px-3 py-2"
              >
                <option value="">Walk-in Customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} — {customer.phone}
                  </option>
                ))}
              </select>

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
              {filteredStockItems.map((stock) => {
                const product = stock.product;

                return (
                  <button
                    key={stock.id}
                    onClick={() => addToCart(product)}
                    disabled={Number(stock.quantity) <= 0}
                    className="rounded-xl border border-white/10 bg-slate-900 p-4 text-left hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <p className="font-semibold">{product.name}</p>
                    <p className="text-sm text-slate-400">{product.sku}</p>

                    <p className="mt-3 text-emerald-400">
                      KES{" "}
                      {saleType === "WHOLESALE"
                        ? product.wholesale_price
                        : product.retail_price}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      In stock: {stock.quantity}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <aside className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Cart</h2>

            <div className="mt-4 space-y-3">
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

                    <div className="mt-2 flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="rounded bg-white/10 px-2 py-1"
                      >
                        -
                      </button>

                      <span className="text-sm">{item.quantity}</span>

                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="rounded bg-white/10 px-2 py-1"
                      >
                        +
                      </button>
                    </div>
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
              <div className="mt-2 flex justify-between text-sm text-slate-400">
                <span>Change</span>
                <span>KES {change > 0 ? change.toFixed(2) : "0.00"}</span>
              </div>

              <input
                className="mt-4 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400"
                placeholder="Cash received"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
              />

              <button
                onClick={checkout}
                disabled={
                  checkingOut ||
                  cart.length === 0 ||
                  !currentShift ||
                  Number(cashAmount || 0) < total
                }
                className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {checkingOut ? "Processing..." : "Complete Sale"}
              </button>
            </div>
          </aside>
        </div>
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
