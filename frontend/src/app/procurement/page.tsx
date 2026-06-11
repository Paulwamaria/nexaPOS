// src/app/procurement/page.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PageHeader } from "@/components/PageHeader";
import { AlertMessage } from "@/components/AlertMessage";
import { EmptyState } from "@/components/EmptyState";
import { unwrapList } from "@/lib/pagination";
type Supplier = {
  id: number;
  name: string;
  phone: string;
  email: string;
};

type Product = {
  id: number;
  name: string;
  sku: string;
};

type PurchaseOrder = {
  id: number;
  order_number: string;
  supplier: string;
  branch: string;
  status: string;
  total_amount: string;
};

export default function ProcurementPage() {
  const branchId = 2;

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);

  const [supplierName, setSupplierName] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");

  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [costPrice, setCostPrice] = useState("0");

  const [message, setMessage] = useState("");

  async function loadData() {
    try {
      const suppliersRes = await api.get("/procurement/suppliers/");
      console.log("Suppliers OK");
      setSuppliers(unwrapList(suppliersRes.data));
    } catch (err) {
      console.error("Suppliers failed", err);
    }

    try {
      const productsRes = await api.get("/inventory/products/");
      console.log("Products OK");
      setProducts(unwrapList(productsRes.data));
    } catch (err) {
      console.error("Products failed", err);
    }

    try {
      const poRes = await api.get("/procurement/purchase-orders/");
      console.log("POs OK");
      setPurchaseOrders(unwrapList(poRes.data));
    } catch (err) {
      console.error("POs failed", err);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function createSupplier(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("/procurement/suppliers/", {
        name: supplierName,
        phone: supplierPhone,
        email: supplierEmail,
        address: "",
        contact_person: "",
        is_active: true,
      });

      setSupplierName("");
      setSupplierPhone("");
      setSupplierEmail("");
      setMessage("Supplier created successfully.");
      await loadData();
    } catch {
      setMessage("Failed to create supplier.");
    }
  }

  async function createPurchaseOrder(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("/procurement/purchase-orders/", {
        supplier_id: Number(selectedSupplierId),
        branch_id: branchId,
        items: [
          {
            product_id: Number(selectedProductId),
            quantity_ordered: quantity,
            cost_price: costPrice,
          },
        ],
      });

      setSelectedSupplierId("");
      setSelectedProductId("");
      setQuantity("1");
      setCostPrice("0");
      setMessage("Purchase order created successfully.");
      await loadData();
    } catch (error: any) {
      setMessage(
        error?.response?.data?.detail || "Failed to create purchase order.",
      );
    }
  }

  async function receivePurchaseOrder(id: number) {
    setMessage("");

    try {
      await api.post(`/procurement/purchase-orders/${id}/receive/`);
      setMessage("Purchase order received successfully.");
      await loadData();
    } catch (error: any) {
      setMessage(
        error?.response?.data?.detail || "Failed to receive purchase order.",
      );
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
            title="Procurement"
            description="Manage suppliers, purchase orders, and goods receiving."
          />
        </div>

        {message && <AlertMessage message={message} />}

        <section className="grid gap-6 xl:grid-cols-2">
          <form
            onSubmit={createSupplier}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <h2 className="text-xl font-semibold">Create Supplier</h2>

            <input
              required
              className="mt-4 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
              placeholder="Supplier name"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
            />

            <input
              className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
              placeholder="Phone"
              value={supplierPhone}
              onChange={(e) => setSupplierPhone(e.target.value)}
            />

            <input
              className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
              placeholder="Email"
              value={supplierEmail}
              onChange={(e) => setSupplierEmail(e.target.value)}
            />

            <button className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">
              Save Supplier
            </button>
          </form>

          <form
            onSubmit={createPurchaseOrder}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <h2 className="text-xl font-semibold">Create Purchase Order</h2>

            <select
              required
              className="mt-4 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
            >
              <option value="">Select supplier</option>
              {suppliers.map((supplier) => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </option>
              ))}
            </select>

            <select
              required
              className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
            >
              <option value="">Select product</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} — {product.sku}
                </option>
              ))}
            </select>

            <input
              required
              className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
              placeholder="Quantity ordered"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />

            <input
              required
              className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
              placeholder="Cost price"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
            />

            <button className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">
              Create Purchase Order
            </button>
          </form>
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-xl font-semibold">Purchase Orders</h2>

          <div className="mt-4 overflow-x-auto">
            {purchaseOrders.length === 0 ? (
              <EmptyState
                title="No purchase orders"
                description="Create your first purchase order to get started."
              />
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr className="border-b border-white/10">
                    <th className="py-3">Order</th>
                    <th className="py-3">Supplier</th>
                    <th className="py-3">Branch</th>
                    <th className="py-3">Status</th>
                    <th className="py-3">Total</th>
                    <th className="py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {purchaseOrders.map((po) => (
                    <tr key={po.id} className="border-b border-white/5">
                      <td className="py-3 font-medium">{po.order_number}</td>
                      <td className="py-3 text-slate-400">{po.supplier}</td>
                      <td className="py-3 text-slate-400">{po.branch}</td>
                      <td className="py-3">{po.status}</td>
                      <td className="py-3">KES {po.total_amount}</td>
                      <td className="py-3">
                        {po.status !== "RECEIVED" ? (
                          <button
                            onClick={() => receivePurchaseOrder(po.id)}
                            className="rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-slate-950"
                          >
                            Receive
                          </button>
                        ) : (
                          <span className="text-slate-500">Received</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
