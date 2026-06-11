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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loadingReports, setLoadingReports] = useState(false);

  async function downloadCSV(endpoint: string, filename: string) {
    try {
      const response = await api.get(endpoint, {
        responseType: "blob",
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      setMessage("Failed to download CSV export.");
    }
  }

  async function loadReports() {
    try {
      const params = new URLSearchParams();
      setLoadingReports(true);

      if (startDate) {
        params.append("start_date", startDate);
      }

      if (endDate) {
        params.append("end_date", endDate);
      }

      const query = params.toString() ? `?${params.toString()}` : "";

      const [top, sales, profit, cashier, procurement] = await Promise.all([
        api.get(`/reports/top-selling-products/${query}`),
        api.get(`/reports/sales-by-branch/${query}`),
        api.get(`/reports/profit-by-branch/${query}`),
        api.get(`/reports/cashier-performance/${query}`),
        api.get(`/reports/procurement-summary/${query}`),
      ]);

      setTopProducts(top.data);
      setSalesByBranch(sales.data);
      setProfitByBranch(profit.data);
      setCashierPerformance(cashier.data);
      setProcurementSummary(procurement.data);

      setMessage("");
      setLoadingReports(false);
    } catch {
      setMessage("Failed to load reports.");
    }
  }

  useEffect(() => {
    if (!loadingUser) {
      loadReports();
    }
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

        {/* Export CSVs for sales, inventory, procurement, and audit logs to analyze data in spreadsheets or accounting software. Use date filters to view specific time periods and identify trends. */}
        <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">CSV Exports</h2>
              <p className="text-sm text-slate-400">
                Download operational data for accounting and management review.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() =>
                  downloadCSV("/reports/exports/sales.csv", "sales_export.csv")
                }
                className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              >
                Sales CSV
              </button>

              <button
                onClick={() =>
                  downloadCSV(
                    "/reports/exports/inventory.csv",
                    "inventory_export.csv",
                  )
                }
                className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              >
                Inventory CSV
              </button>

              <button
                onClick={() =>
                  downloadCSV(
                    "/reports/exports/procurement.csv",
                    "procurement_export.csv",
                  )
                }
                className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              >
                Procurement CSV
              </button>

              <button
                onClick={() =>
                  downloadCSV(
                    "/reports/exports/audit-logs.csv",
                    "audit_logs_export.csv",
                  )
                }
                className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
              >
                Audit Logs CSV
              </button>
            </div>
          </div>
        </section>
        {/* filter reports by date range and export CSVs for deeper analysis. */}
        <section className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
            <div>
              <label className="text-sm text-slate-400">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white"
              />
            </div>

            <div>
              <label className="text-sm text-slate-400">End date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white"
              />
            </div>

            <button
              onClick={loadReports}
              disabled={loadingReports}
              className="self-end rounded-lg bg-emerald-500 px-5 py-3 font-semibold text-slate-950 disabled:opacity-50"
            >
              {loadingReports ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </section>
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
