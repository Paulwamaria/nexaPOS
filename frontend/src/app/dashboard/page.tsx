"use client";

import { api } from "@/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Receipt, Wallet, RotateCcw } from "lucide-react";
import { logout } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { unwrapList } from "@/lib/pagination";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";

type Activity = {
  type: "SHIFT" | "PROCUREMENT" | "RETURN" | "INVENTORY" | "AUDIT";
  message: string;
  created_at: string;
};

type DashboardSummary = {
  sales_today: string;
  transactions_today: number;
  returns_today: string;
  average_basket: string;
};
type AttentionData = {
  critical_low_stock: number;
  pending_returns: number;
  open_shifts: number;
  pending_purchase_orders: number;
};
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
  const [attention, setAttention] = useState<AttentionData | null>(null);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const { showToast } = useToast();

  async function loadSummary() {
    try {
      const res = await api.get("/reports/dashboard/summary/");

      setSummary(res.data);
    } catch (error: any) {
      showToast({
        tone: "error",
        title: "Dashboard summary failed",
        description:
          error?.response?.data?.detail || "Unable to load today's snapshot.",
      });
    }
  }

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
      } catch (error: any) {
        console.error(
          "Dashboard base load failed:",
          error?.response?.data || error,
        );

        if (error?.response?.status === 401) {
          logout();
          router.push("/login");
          return;
        }

        showToast({
          tone: "error",
          title: "Dashboard load failed",
          description:
            error?.response?.data?.detail ||
            "Some dashboard data could not load.",
        });
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [router]);

  async function loadAttention() {
    try {
      const res = await api.get("/reports/dashboard/attention/");
      setAttention(res.data);
    } catch (error: any) {
      showToast({
        tone: "error",
        title: "Dashboard attention failed",
        description:
          error?.response?.data?.detail || "Unable to load attention metrics.",
      });
    }
  }

  async function loadActivity() {
    try {
      const res = await api.get("/reports/dashboard/activity/");
      setActivities(res.data);
    } catch (error: any) {
      showToast({
        tone: "error",
        title: "Activity feed failed",
        description:
          error?.response?.data?.detail || "Unable to load recent activity.",
      });
    }
  }

  useEffect(() => {
    if (!loading) {
      loadSummary();
      loadAttention();
      loadActivity();
    }
  }, [loading]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        Loading dashboard...
      </main>
    );
  }

  return (
    <AppShell user={user}>
      <main className="min-h-screen bg-slate-950 p-6 text-white">
        <div className="mb-8">
          <PageHeader
            title="Dashboard"
            description={`Welcome back, ${user?.full_name} · ${user?.role}`}
          />
        </div>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <DashboardCard
            title="Today's Sales"
            value={`KES ${report?.total_sales ?? "0.00"}`}
            subtitle={`${report?.sales_count ?? 0} sales`}
            icon={<Receipt />}
            accent="emerald"
          />

          <DashboardCard
            title="Gross Profit"
            value={`KES ${report?.gross_profit ?? "0.00"}`}
            subtitle="Before expenses"
            icon={<BarChart3 />}
            accent="sky"
          />

          <DashboardCard
            title="Returns Today"
            value={`KES ${summary?.returns_today ?? "0.00"}`}
            subtitle="Refunds processed today"
            icon={<RotateCcw />}
            accent="orange"
          />

          <DashboardCard
            title="Expenses"
            value={`KES ${report?.total_expenses ?? "0.00"}`}
            subtitle="Today"
            icon={<Wallet />}
            accent="amber"
          />
        </section>

        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-400">
                Business alerts
              </p>
              <h2 className="mt-1 text-xl font-semibold">Attention Center</h2>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <AttentionCard
              href="/low-stock"
              title="Critical Low Stock"
              value={attention?.critical_low_stock ?? 0}
              subtitle="Needs replenishment"
              accent="red"
            />

            <AttentionCard
              href="/return-reviews"
              title="Returns Awaiting Review"
              value={attention?.pending_returns ?? 0}
              subtitle="Medium & high-risk returns"
              accent="orange"
            />

            <AttentionCard
              href="/shifts"
              title="Open Shifts"
              value={attention?.open_shifts ?? 0}
              subtitle="Active cashier sessions"
              accent="emerald"
            />

            <AttentionCard
              href="/procurement"
              title="Purchase Orders Pending"
              value={attention?.pending_purchase_orders ?? 0}
              subtitle="Awaiting receipt"
              accent="sky"
            />
          </div>
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
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-xl font-semibold">Recent Activity</h2>

          <div className="mt-4 space-y-3">
            {activities.map((activity, index) => (
              <ActivityItem
                key={`${activity.type}-${activity.created_at}-${index}`}
                activity={activity}
              />
            ))}

            {activities.length === 0 && (
              <p className="text-sm text-slate-400">No recent activity yet.</p>
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}

function DashboardCard({
  title,
  value,
  subtitle,
  icon,
  accent = "slate",
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  accent?: "emerald" | "sky" | "amber" | "red" | "orange" | "slate";
}) {
  const accents = {
    emerald: {
      card: "border-emerald-500/20 bg-emerald-500/10",
      icon: "bg-emerald-500/20 text-emerald-300",
      text: "text-emerald-200",
    },
    sky: {
      card: "border-sky-500/20 bg-sky-500/10",
      icon: "bg-sky-500/20 text-sky-300",
      text: "text-sky-200",
    },
    amber: {
      card: "border-amber-500/20 bg-amber-500/10",
      icon: "bg-amber-500/20 text-amber-300",
      text: "text-amber-200",
    },
    red: {
      card: "border-red-500/20 bg-red-500/10",
      icon: "bg-red-500/20 text-red-300",
      text: "text-red-200",
    },
    orange: {
      card: "border-orange-500/20 bg-orange-500/10",
      icon: "bg-orange-500/20 text-orange-300",
      text: "text-orange-200",
    },
    slate: {
      card: "border-white/10 bg-white/5",
      icon: "bg-white/10 text-slate-300",
      text: "text-slate-300",
    },
  };

  const theme = accents[accent];

  return (
    <div className={`rounded-2xl border p-5 ${theme.card}`}>
      <div className="flex items-center justify-between">
        <p className={`text-sm ${theme.text}`}>{title}</p>
        <div className={`rounded-xl p-2 ${theme.icon}`}>{icon}</div>
      </div>

      <p className="mt-4 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}

function AttentionCard({
  href,
  title,
  value,
  subtitle,
  accent,
}: {
  href: string;
  title: string;
  value: number;
  subtitle: string;
  accent: "red" | "orange" | "emerald" | "sky";
}) {
  const accents = {
    red: "border-red-500/20 bg-red-500/10 text-red-200",
    orange: "border-orange-500/20 bg-orange-500/10 text-orange-200",
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    sky: "border-sky-500/20 bg-sky-500/10 text-sky-200",
  };

  return (
    <Link
      href={href}
      className={`rounded-2xl border p-5 transition hover:scale-[1.02] ${accents[accent]}`}
    >
      <p className="text-sm">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
      <p className="mt-2 text-xs opacity-80">{subtitle}</p>
    </Link>
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

function ActivityItem({ activity }: { activity: Activity }) {
  const styles = {
    SHIFT: "bg-emerald-500/20 text-emerald-300",
    PROCUREMENT: "bg-sky-500/20 text-sky-300",
    RETURN: "bg-orange-500/20 text-orange-300",
    INVENTORY: "bg-violet-500/20 text-violet-300",
    AUDIT: "bg-slate-500/20 text-slate-300",
  };

  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-900/60 p-4">
      <div
        className={`rounded-full px-3 py-1 text-xs font-semibold ${styles[activity.type]}`}
      >
        {activity.type}
      </div>

      <div>
        <p className="text-sm font-medium text-white">{activity.message}</p>
        <p className="mt-1 text-xs text-slate-400">
          {new Date(activity.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
