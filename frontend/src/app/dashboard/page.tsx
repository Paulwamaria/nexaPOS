"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Boxes, LogOut, Receipt, Wallet } from "lucide-react";
import { api } from "@/lib/api";
import { logout } from "@/lib/auth";

type User = {
  id: number;
  email: string;
  full_name: string;
  role: string;
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

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [meRes, reportRes] = await Promise.all([
          api.get("/auth/me/"),
          api.get("/reports/dashboard/"),
        ]);

        setUser(meRes.data);
        setReport(reportRes.data);
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
    <main className="min-h-screen bg-slate-950 text-white p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-emerald-400 text-sm font-medium">NexaPOS</p>
          <h1 className="text-3xl font-bold mt-2">Dashboard</h1>
          <p className="text-slate-400 mt-1">
            Welcome back, {user?.full_name} · {user?.role}
          </p>
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

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <QuickAction label="Open POS" href="/pos" />
          <QuickAction label="Inventory" href="/inventory" />
          <QuickAction label="Sales" href="/sales" />
          <QuickAction label="Reports" href="/reports" />
        </div>
      </section>
    </main>
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
