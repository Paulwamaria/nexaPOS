// src/app/procurement/page.tsx
"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { unwrapList } from "@/lib/pagination";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { useToast } from "@/components/ToastProvider";
import { PaginationControls } from "@/components/PaginationControls";
import { AxiosError } from "axios";
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

  const [poToReceive, setPoToReceive] = useState<PurchaseOrder | null>(null);
  const [receivingPO, setReceivingPO] = useState(false);
  const { showToast } = useToast();
  const [poPage, setPoPage] = useState(1);
  const [poCount, setPoCount] = useState(0);

  async function loadData(pageNumber = poPage) {
    try {
      const suppliersRes = await api.get("/procurement/suppliers/");
      setSuppliers(unwrapList(suppliersRes.data));
    } catch (err: any) {
      showToast({
        tone: "error",
        title: "Loading suppliers failed",
        description: err?.response?.data?.detail || "Please try again.",
      });
    }

    try {
      const productsRes = await api.get("/inventory/products/");
      setProducts(unwrapList(productsRes.data));
    } catch (err: any) {
      showToast({
        tone: "error",
        title: "Loading products failed",
        description: err?.response?.data?.detail || "Please try again.",
      });
    }

    try {
      const poRes = await api.get(
        `/procurement/purchase-orders/?page=${pageNumber}`,
      );

      setPurchaseOrders(unwrapList(poRes.data));

      setPoCount(
        Array.isArray(poRes.data) ? poRes.data.length : poRes.data.count,
      );

      setPoPage(pageNumber);
    } catch (err: any) {
      showToast({
        tone: "error",
        title: "Loading purchase orders failed",
        description: err?.response?.data?.detail || "Please try again.",
      });
    }
  }
  useEffect(() => {
    loadData();
  }, []);

  async function createSupplier(e: React.FormEvent) {
    e.preventDefault();

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
      showToast({
        tone: "success",
        title: "Supplier created",
        description: `New supplier was created successfully.`,
      });
      await loadData();
    } catch {
      showToast({
        tone: "error",
        title: "Create Supplier Failed",
        description:
          error?.response?.data?.detail ||
          "Failed to create new supplier, please try again.",
      });
    }
  }

  async function createPurchaseOrder(e: React.FormEvent) {
    e.preventDefault();

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
      showToast({
        tone: "success",
        title: "Purchase Order Created",
        description: `New purchase order was created successfully.`,
      });
      await loadData();
    } catch (error: any) {
      showToast({
        tone: "error",
        title: "Purchase order failed",
        description:
          error?.response?.data?.detail ||
          "Failed to create purchase order, please try again.",
      });
    }
  }

  async function receivePurchaseOrder(id: number) {
    setReceivingPO(true);

    try {
      await api.post(`/procurement/purchase-orders/${id}/receive/`);
      showToast({
        tone: "success",
        title: "Purchase Order",
        description: `Purchase order received successfully.`,
      });
      setPoToReceive(null);
      await loadData();
    } catch (error: any) {
      showToast({
        tone: "error",
        title: "Purchase order failed",
        description:
          error?.response?.data?.detail ||
          "Failed to recieve purchase order, please try again.",
      });
    } finally {
      setReceivingPO(false);
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
                            onClick={() => setPoToReceive(po)}
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
            <PaginationControls
              page={poPage}
              count={poCount}
              label="purchase orders"
              onPageChange={loadData}
            />
          </div>
        </section>
        <ConfirmDialog
          open={!!poToReceive}
          title="Receive Purchase Order?"
          description={`This will mark ${poToReceive?.order_number} as received and increase branch stock. This action affects inventory records.`}
          confirmLabel="Receive Goods"
          loading={receivingPO}
          onCancel={() => setPoToReceive(null)}
          onConfirm={() => {
            if (poToReceive) {
              receivePurchaseOrder(poToReceive.id);
            }
          }}
        />
      </main>
    </AppShell>
  );
}
