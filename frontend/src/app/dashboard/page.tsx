"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Boxes, LogOut, Receipt, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { logout } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { AlertMessage } from "@/components/AlertMessage";
import { unwrapList } from "@/lib/pagination";
type User = {
  id: number;
  email: string;
  full_name: string;
  role: string;
};
type SaleReturn = {
  id: number;
  sale_number: string;
  total_refund_amount: string;
  refund_risk_level: string;
  manager_reviewed: boolean;
};

type DashboardReport = {
  date: string;
  total_sales: string;
  total_expenses: string;
  gross_profit: string;
  net_profit_estimate: string;
  sales_count: number;
  low_stock_count: number;
};

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [report, setReport] = useState<DashboardReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [riskyReturns, setRiskyReturns] = useState<SaleReturn[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [meRes, reportRes, returnsRes] = await Promise.all([
          api.get("/auth/me/"),
          api.get("/reports/dashboard/"),
          api.get("/sales/returns/"),
        ]);

        setUser(meRes.data);
        setReport(reportRes.data);

        setRiskyReturns(
          unwrapList(returnsRes.data).filter(
            (item: SaleReturn) =>
              !item.manager_reviewed &&
              ["MEDIUM", "HIGH"].includes(item.refund_risk_level),
          ),
        );
      } catch {
        logout();
        router.push("/login");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading dashboard...
      </main>
    );
  }

  return (
    <AppShell user={user}>
      <main className="min-h-screen bg-slate-950 text-white p-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <PageHeader
              title="Dashboard"
              description={`Welcome back, ${user?.full_name} · ${user?.role}`}
            />
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            title="Today's Sales"
            value={`KES ${report?.total_sales ?? "0.00"}`}
            subtitle={`${report?.sales_count ?? 0} sales`}
            icon={<Receipt />}
          />

          <DashboardCard
            title="Gross Profit"
            value={`KES ${report?.gross_profit ?? "0.00"}`}
            subtitle="Before expenses"
            icon={<BarChart3 />}
          />

          <DashboardCard
            title="Expenses"
            value={`KES ${report?.total_expenses ?? "0.00"}`}
            subtitle="Today"
            icon={<Wallet />}
          />

          <DashboardCard
            title="Low Stock"
            value={`${report?.low_stock_count ?? 0}`}
            subtitle="Items need attention"
            icon={<Boxes />}
          />
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Quick Actions</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-5">
            <QuickAction label="Open POS" href="/pos" />
            <QuickAction label="Inventory" href="/inventory" />
            <QuickAction label="Sales" href="/sales" />
            <QuickAction label="Reports" href="/reports" />
            <QuickAction label="Return Reviews" href="/return-reviews" />
          </div>
        </section>
        {riskyReturns.length > 0 && (
          <section className="mt-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
            <h2 className="text-xl font-semibold text-yellow-200">
              Returns Need Review
            </h2>

            <p className="mt-1 text-sm text-yellow-100/80">
              {riskyReturns.length} medium/high-risk return(s) have not been
              reviewed.
            </p>

            <button
              onClick={() => router.push("/return-reviews")}
              className="mt-4 rounded-lg bg-yellow-300 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-yellow-200"
            >
              Review Returns
            </button>
          </section>
        )}
      </main>
    </AppShell>
  );
}

function DashboardCard({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <div className="text-emerald-400">{icon}</div>
      </div>

      <p className="mt-4 text-2xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
    </div>
  );
}

function QuickAction({ label, href }: { label: string; href: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(href)}
      className="rounded-xl border border-white/10 bg-slate-900 px-4 py-4 text-left hover:border-emerald-400"
    >
      {label}
    </button>
  );
}
