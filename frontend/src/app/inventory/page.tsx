// src/app/inventory/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, PackageSearch, PlusCircle, RefreshCw } from "lucide-react";
import { api } from "@/lib/api";
import { AppShell } from "@/components/AppShell";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { unwrapList } from "@/lib/pagination";
import { useToast } from "@/components/ToastProvider";

type Product = {
  id: number;
  name: string;
  sku: string;
  category?: string;
  category_id?: number;
  cost_price: string;
  retail_price: string;
  wholesale_price: string;
  wholesale_min_quantity?: number;
  is_active?: boolean;
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
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);

  const [productName, setProductName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [retailPrice, setRetailPrice] = useState("");
  const [wholesalePrice, setWholesalePrice] = useState("");
  const [openingStock, setOpeningStock] = useState("0");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState("");
  const [editSku, setEditSku] = useState("");
  const [editCategoryId, setEditCategoryId] = useState("");
  const [editCostPrice, setEditCostPrice] = useState("");
  const [editRetailPrice, setEditRetailPrice] = useState("");
  const [editWholesalePrice, setEditWholesalePrice] = useState("");
  const [editWholesaleMinQuantity, setEditWholesaleMinQuantity] =
    useState("10");
  const [editIsActive, setEditIsActive] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<
    "ALL" | "ACTIVE" | "INACTIVE"
  >("ALL");
  const { showToast } = useToast();

  const branchId = 2;

  const filteredStocks = useMemo(() => {
    const q = productSearch.toLowerCase();

    return stocks.filter((stock) => {
      const matchesSearch =
        stock.product.name.toLowerCase().includes(q) ||
        stock.product.sku.toLowerCase().includes(q) ||
        stock.branch.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && stock.product.is_active !== false) ||
        (statusFilter === "INACTIVE" && stock.product.is_active === false);

      return matchesSearch && matchesStatus;
    });
  }, [stocks, productSearch, statusFilter]);

  async function loadInventory() {
    setLoading(true);

    try {
      const [stocksRes, productsRes, categoriesRes] = await Promise.all([
        api.get("/inventory/stocks/"),
        api.get("/inventory/products/"),
        api.get("/inventory/categories/"),
      ]);

      setStocks(unwrapList(stocksRes.data));
      setProducts(unwrapList(productsRes.data));
      setCategories(unwrapList(categoriesRes.data));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadInventory(1);
  }, []);

  const lowStockCount = useMemo(() => {
    return stocks.filter(
      (stock) => Number(stock.quantity) <= Number(stock.reorder_level),
    ).length;
  }, [stocks]);

  function openEditProduct(product: Product) {
    setEditingProduct(product);
    setEditName(product.name);
    setEditSku(product.sku);
    setEditCategoryId(String(product.category_id || ""));
    setEditCostPrice(product.cost_price);
    setEditRetailPrice(product.retail_price);
    setEditWholesalePrice(product.wholesale_price);
    setEditWholesaleMinQuantity(String(product.wholesale_min_quantity || 10));
    setEditIsActive(product.is_active ?? true);
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();

    if (!newCategoryName.trim()) return;

    setCreatingCategory(true);

    try {
      const res = await api.post("/inventory/categories/", {
        name: newCategoryName,
      });

      showToast({
        tone: "success",
        title: "New Category Created",
        description: `${newCategoryName} was created successfully.`,
      });

      setNewCategoryName("");

      await loadInventory();

      setCategoryId(String(res.data.id));
    } catch (error: any) {
      showToast({
        tone: "error",
        title: "Create New Category failed",
        description:
          error?.response?.data?.detail ||
          "Failed to create category, please try again.",
      });
    } finally {
      setCreatingCategory(false);
    }
  }

  async function updateProduct(e: React.FormEvent) {
    e.preventDefault();

    if (!editingProduct) return;

    try {
      await api.patch(`/inventory/products/${editingProduct.id}/`, {
        category_id: Number(editCategoryId),
        name: editName,
        sku: editSku,
        cost_price: editCostPrice,
        retail_price: editRetailPrice,
        wholesale_price: editWholesalePrice,
        wholesale_min_quantity: Number(editWholesaleMinQuantity),
        is_active: editIsActive,
      });

      setEditingProduct(null);
      showToast({
        tone: "success",
        title: "Product updated",
        description: `${editName} was updated successfully.`,
      });

      loadInventory();
    } catch (error: any) {
      showToast({
        tone: "error",
        title: "Update failed",
        description: error?.response?.data?.detail || "Please try again.",
      });
    }
  }
  async function createProduct(e: React.FormEvent) {
    e.preventDefault();

    try {
      const productRes = await api.post("/inventory/products/", {
        category_id: Number(categoryId),
        name: productName,
        sku,
        cost_price: costPrice,
        retail_price: retailPrice,
        wholesale_price: wholesalePrice,
        wholesale_min_quantity: 10,
        is_active: true,
      });

      const newProductId = productRes.data.id;

      if (Number(openingStock) > 0) {
        await api.post("/inventory/adjust-stock/", {
          branch_id: branchId,
          product_id: newProductId,
          quantity: openingStock,
          adjustment_type: "ADJUSTMENT_IN",
          notes: "Opening stock",
        });
      }
      showToast({
        tone: "success",
        title: "Product created",
        description: `${productName} was created successfully.`,
      });
      setProductName("");
      setSku("");
      setCategoryId("");
      setCostPrice("");
      setRetailPrice("");
      setWholesalePrice("");
      setOpeningStock("0");

      await loadInventory();
    } catch (error: any) {
      showToast({
        tone: "error",
        title: "Create Produce Failed!",
        description:
          error?.response?.data?.detail ||
          "Failed to create product, please try again.",
      });
    }
  }

  async function adjustStock(e: React.FormEvent) {
    e.preventDefault();

    try {
      await api.post("/inventory/adjust-stock/", {
        branch_id: branchId,
        product_id: Number(selectedProductId),
        quantity,
        adjustment_type: adjustmentType,
        notes,
      });
      showToast({
        tone: "success",
        title: "Stock Adjusted",
        description: `Stock was adjusted successfully.`,
      });
      setSelectedProductId("");
      setQuantity("1");
      setNotes("");
      await loadInventory();
    } catch (error: any) {
      showToast({
        tone: "error",
        title: "Stock adjustment failed",
        description:
          error?.response?.data?.detail ||
          "Stock adjustment failed, please try again.",
      });
    }
  }

  async function loadInventory(pageNumber = page) {
    setLoading(true);

    try {
      const [stocksRes, productsRes, categoriesRes] = await Promise.all([
        api.get(`/inventory/stocks/?include_inactive=true&page=${pageNumber}`),
        api.get("/inventory/products/"),
        api.get("/inventory/categories/"),
      ]);

      setStocks(unwrapList(stocksRes.data));
      setProducts(unwrapList(productsRes.data));
      setCategories(unwrapList(categoriesRes.data));

      setCount(
        Array.isArray(stocksRes.data)
          ? stocksRes.data.length
          : stocksRes.data.count,
      );
      setPage(pageNumber);
    } finally {
      setLoading(false);
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
            <div className="mt-4 flex flex-wrap gap-2">
              {["ALL", "ACTIVE", "INACTIVE"].map((status) => (
                <button
                  key={status}
                  onClick={() =>
                    setStatusFilter(status as "ALL" | "ACTIVE" | "INACTIVE")
                  }
                  className={`rounded-lg px-4 py-2 text-sm ${
                    statusFilter === status
                      ? "bg-emerald-500 text-slate-950"
                      : "border border-white/10 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            <input
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search product, SKU, or branch..."
              className="mt-4 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400"
            />

            {loading ? (
              <p className="mt-4 text-slate-400">Loading inventory...</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                {filteredStocks.length === 0 ? (
                  <EmptyState
                    title="No matching stocks found"
                    description="Stock records will appear here after being added."
                  />
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead className="text-slate-400">
                      <tr className="border-b border-white/10">
                        <th className="py-3">Product</th>
                        <th className="py-3">SKU</th>
                        <th className="py-3">Branch</th>
                        <th className="py-3">Qty</th>
                        <th className="py-3">Reorder</th>
                        <th className="py-3">Action</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filteredStocks.map((stock) => (
                        <tr key={stock.id} className="border-b border-white/5">
                          <td className="py-3 font-medium">
                            {stock.product.name}
                            <span
                              className={`ml-2 rounded-full px-2 py-1 text-xs font-semibold ${
                                stock.product.is_active === false
                                  ? "bg-red-500/20 text-red-200"
                                  : "bg-emerald-500/20 text-emerald-200"
                              }`}
                            >
                              {stock.product.is_active === false
                                ? "INACTIVE"
                                : "ACTIVE"}
                            </span>
                          </td>
                          <td className="py-3 text-slate-400">
                            {stock.product.sku}
                          </td>
                          <td className="py-3 text-slate-400">
                            {stock.branch}
                          </td>
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
                          <td className="py-3">
                            <button
                              onClick={() => openEditProduct(stock.product)}
                              className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/10"
                            >
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                <div className="mt-4 flex items-center justify-between">
                  <button
                    disabled={page === 1}
                    onClick={() => loadInventory(page - 1)}
                    className="rounded-lg border border-white/10 px-4 py-2 text-sm disabled:opacity-50"
                  >
                    Previous
                  </button>

                  <span className="text-sm text-slate-400">
                    Page {page} · {count} stock records
                  </span>

                  <button
                    disabled={page * 20 >= count}
                    onClick={() => loadInventory(page + 1)}
                    className="rounded-lg border border-white/10 px-4 py-2 text-sm disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* create category form */}
            <form
              onSubmit={createCategory}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <h2 className="text-xl font-semibold">Create Category</h2>
              <p className="mt-1 text-sm text-slate-400">
                Add a new product category for organizing your catalog.
              </p>

              <input
                required
                className="mt-4 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                placeholder="Category name e.g. Beverages"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />

              <button
                disabled={creatingCategory}
                className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
              >
                {creatingCategory ? "Creating..." : "Create Category"}
              </button>
            </form>
            {/* create product form */}
            <form
              onSubmit={createProduct}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <h2 className="text-xl font-semibold">Create Product</h2>

              <input
                required
                className="mt-4 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                placeholder="Product name"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
              />

              <input
                required
                className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                placeholder="SKU / Barcode"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
              />

              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              <input
                required
                className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                placeholder="Cost price"
                value={costPrice}
                onChange={(e) => setCostPrice(e.target.value)}
              />

              <input
                required
                className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                placeholder="Retail price"
                value={retailPrice}
                onChange={(e) => setRetailPrice(e.target.value)}
              />

              <input
                required
                className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                placeholder="Wholesale price"
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(e.target.value)}
              />

              <input
                className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                placeholder="Opening stock"
                value={openingStock}
                onChange={(e) => setOpeningStock(e.target.value)}
              />

              <button className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">
                Create Product
              </button>
            </form>
            {/* Adjust Stock form */}

            <form
              onSubmit={adjustStock}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex items-center gap-2">
                <PlusCircle className="text-emerald-400" />
                <h2 className="text-xl font-semibold">Adjust Stock</h2>
              </div>

              <label className="mt-5 block text-sm text-slate-300">
                Product
              </label>
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
          </div>

          {editingProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
              <form
                onSubmit={updateProduct}
                className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-950 p-6 text-white shadow-2xl"
              >
                <h2 className="text-2xl font-bold">Edit Product</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Update product details and pricing.
                </p>

                <input
                  required
                  className="mt-5 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Product name"
                />

                <input
                  required
                  className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                  value={editSku}
                  onChange={(e) => setEditSku(e.target.value)}
                  placeholder="SKU"
                />

                <select
                  required
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>

                <div className="mt-5 border-t border-white/10 pt-5">
                  <h3 className="text-sm font-semibold text-emerald-400">
                    Pricing
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">
                    Set how much the product costs and how much customers pay.
                  </p>

                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-sm text-slate-300">
                        Cost Price (KES)
                      </label>
                      <input
                        required
                        value={editCostPrice}
                        onChange={(e) => setEditCostPrice(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        What the business buys this product for.
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-slate-300">
                        Retail Price (KES)
                      </label>
                      <input
                        required
                        value={editRetailPrice}
                        onChange={(e) => setEditRetailPrice(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Normal selling price for walk-in customers.
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-slate-300">
                        Wholesale Price (KES)
                      </label>
                      <input
                        required
                        value={editWholesalePrice}
                        onChange={(e) => setEditWholesalePrice(e.target.value)}
                        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Discounted selling price for bulk buyers.
                      </p>
                    </div>

                    <div>
                      <label className="text-sm text-slate-300">
                        Wholesale Minimum Quantity
                      </label>
                      <input
                        value={editWholesaleMinQuantity}
                        onChange={(e) =>
                          setEditWholesaleMinQuantity(e.target.value)
                        }
                        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
                      />
                      <p className="mt-1 text-xs text-slate-500">
                        Quantity needed before wholesale price applies.
                      </p>
                    </div>
                  </div>
                </div>

                <label className="mt-4 flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                  />
                  Active product
                </label>

                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingProduct(null)}
                    className="flex-1 rounded-lg border border-white/10 px-4 py-3 hover:bg-white/10"
                  >
                    Cancel
                  </button>

                  <button className="flex-1 rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}
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
