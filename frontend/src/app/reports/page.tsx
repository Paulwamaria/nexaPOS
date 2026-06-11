// src/app/reports/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { AlertMessage } from "@/components/AlertMessage";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/lib/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Row = Record<string, string | number | null>;

export default function ReportsPage() {
  const { user, loadingUser } = useCurrentUser();
  const [topProducts, setTopProducts] = useState<Row[]>([]);
  const [salesByBranch, setSalesByBranch] = useState<Row[]>([]);
  const [profitByBranch, setProfitByBranch] = useState<Row[]>([]);
  const [cashierPerformance, setCashierPerformance] = useState<Row[]>([]);
  const [procurementSummary, setProcurementSummary] = useState<Row[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadReports() {
      try {
        const [top, sales, profit, cashier, procurement] = await Promise.all([
          api.get("/reports/top-selling-products/"),
          api.get("/reports/sales-by-branch/"),
          api.get("/reports/profit-by-branch/"),
          api.get("/reports/cashier-performance/"),
          api.get("/reports/procurement-summary/"),
        ]);

        setTopProducts(top.data);
        setSalesByBranch(sales.data);
        setProfitByBranch(profit.data);
        setCashierPerformance(cashier.data);
        setProcurementSummary(procurement.data);
      } catch {
        setMessage("Failed to load reports.");
      }
    }

    if (!loadingUser) loadReports();
  }, [loadingUser]);

  if (loadingUser) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading...
      </main>
    );
  }

  return (
    <AppShell user={user}>
      <div className="p-4 sm:p-6">
        <PageHeader
          title="Reports"
          description="Track sales, profit, cashier performance, and procurement."
        />

        <AlertMessage message={message} tone="error" />
        <div className="grid gap-6 xl:grid-cols-2">
          <ReportSection
            title="Top Selling Products"
            data={topProducts}
            xKey="product__name"
            yKey="total_quantity"
          />

          <ReportSection
            title="Sales by Branch"
            data={salesByBranch}
            xKey="branch__name"
            yKey="total_sales"
          />

          <ReportSection
            title="Profit by Branch"
            data={profitByBranch}
            xKey="sale__branch__name"
            yKey="gross_profit"
          />

          <ReportSection
            title="Cashier Performance"
            data={cashierPerformance}
            xKey="cashier__full_name"
            yKey="total_sales"
          />

          <ReportSection
            title="Procurement Summary"
            data={procurementSummary}
            xKey="supplier__name"
            yKey="total_amount"
          />
        </div>
      </div>
    </AppShell>
  );
}

function formatLabel(value: string) {
  return value.replaceAll("__", " ").replaceAll("_", " ");
}
function ReportSection({
  title,
  data,
  xKey,
  yKey,
}: {
  title: string;
  data: Row[];
  xKey: string;
  yKey: string;
}) {
  const columns = data.length > 0 ? Object.keys(data[0]) : [];

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <h2 className="text-xl font-semibold text-white">{title}</h2>

      {data.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No data available yet.</p>
      ) : (
        <>
          <div className="mt-4 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis
                  dataKey={xKey}
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "#020617",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey={yKey} fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-6 overflow-x-auto border-t border-white/10 pt-4">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr className="border-b border-white/10">
                  {columns.map((column) => (
                    <th key={column} className="py-3 pr-4">
                      {formatLabel(column)}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {data.map((row, index) => (
                  <tr key={index} className="border-b border-white/5">
                    {columns.map((column) => (
                      <td key={column} className="py-3 pr-4 text-slate-300">
                        {String(row[column] ?? "-")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
