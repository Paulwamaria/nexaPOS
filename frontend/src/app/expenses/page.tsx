// src/app/expenses/page.tsx
"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { PaginationControls } from "@/components/PaginationControls";
import { useToast } from "@/components/ToastProvider";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/lib/api";
import { unwrapList } from "@/lib/pagination";

type ExpenseCategory = {
  id: number;
  name: string;
};

type Expense = {
  id: number;
  branch: string;
  category: string;
  amount: string;
  description: string;
  expense_date: string;
  created_at: string;
};

export default function ExpensesPage() {
  const { user, loadingUser } = useCurrentUser();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  const [categoryName, setCategoryName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [branchId, setBranchId] = useState("1");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(
    new Date().toISOString().slice(0, 10),
  );

  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);

  async function loadCategories() {
    const res = await api.get("/expenses/categories/");
    setCategories(unwrapList(res.data));
  }

  async function loadExpenses(pageNumber = page) {
    const res = await api.get(`/expenses/?page=${pageNumber}`);
    const data = unwrapList<Expense>(res.data);

    setExpenses(data);
    setCount(Array.isArray(res.data) ? data.length : res.data.count);
    setPage(pageNumber);
  }

  async function loadData() {
    try {
      await Promise.all([loadCategories(), loadExpenses(1)]);
    } catch (error: any) {
      showToast({
        tone: "error",
        title: "Loading expenses failed",
        description: error?.response?.data?.detail || "Please try again.",
      });
    }
  }

  useEffect(() => {
    if (!loadingUser) loadData();
  }, [loadingUser]);

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();

    try {
      const res = await api.post("/expenses/categories/", {
        name: categoryName,
      });

      showToast({
        tone: "success",
        title: "Category created",
        description: `${categoryName} is now available.`,
      });

      setCategoryName("");
      await loadCategories();
      setCategoryId(String(res.data.id));
    } catch (error: any) {
      showToast({
        tone: "error",
        title: "Category creation failed",
        description: error?.response?.data?.detail || "Please try again.",
      });
    }
  }

  async function createExpense(e: React.FormEvent) {
    e.preventDefault();

    try {
      await api.post("/expenses/", {
        branch: Number(branchId),
        category: Number(categoryId),
        amount,
        description,
        expense_date: expenseDate,
      });

      showToast({
        tone: "success",
        title: "Expense recorded",
        description: `KES ${amount} has been added to today's expenses.`,
      });

      setAmount("");
      setDescription("");
      setExpenseDate(new Date().toISOString().slice(0, 10));
      await loadExpenses(page);
    } catch (error: any) {
      showToast({
        tone: "error",
        title: "Expense creation failed",
        description:
          JSON.stringify(error?.response?.data) || "Please try again.",
      });
    }
  }

  if (loadingUser) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        Loading...
      </main>
    );
  }

  return (
    <AppShell user={user}>
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <PageHeader
          title="Expenses"
          description="Record business expenses and track operating costs."
        />

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <div className="space-y-6">
            <form
              onSubmit={createCategory}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <h2 className="text-xl font-semibold">Create Category</h2>

              <input
                required
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="e.g. Rent, Transport, Utilities"
                className="mt-4 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
              />

              <button className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">
                Create Category
              </button>
            </form>

            <form
              onSubmit={createExpense}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <h2 className="flex items-center gap-2 text-xl font-semibold">
                <Wallet size={20} />
                Add Expense
              </h2>

              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="mt-4 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
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
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                placeholder="Branch ID"
                className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
              />

              <input
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Amount e.g. 2500"
                className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
              />

              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="mt-3 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
              />

              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description"
                className="mt-3 min-h-24 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3"
              />

              <button className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">
                Save Expense
              </button>
            </form>
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="text-xl font-semibold">Expense History</h2>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-slate-400">
                  <tr className="border-b border-white/10">
                    <th className="py-3 pr-4">Date</th>
                    <th className="py-3 pr-4">Category</th>
                    <th className="py-3 pr-4">Branch</th>
                    <th className="py-3 pr-4">Amount</th>
                    <th className="py-3 pr-4">Description</th>
                  </tr>
                </thead>

                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-white/5">
                      <td className="py-3 pr-4 text-slate-400">
                        {expense.expense_date}
                      </td>
                      <td className="py-3 pr-4">{expense.category}</td>
                      <td className="py-3 pr-4 text-slate-400">
                        {expense.branch}
                      </td>
                      <td className="py-3 pr-4 font-semibold text-amber-300">
                        KES {expense.amount}
                      </td>
                      <td className="py-3 pr-4 text-slate-400">
                        {expense.description || "-"}
                      </td>
                    </tr>
                  ))}

                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-slate-400">
                        No expenses recorded yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <PaginationControls
              page={page}
              count={count}
              label="expenses"
              onPageChange={loadExpenses}
            />
          </section>
        </div>
      </main>
    </AppShell>
  );
}
