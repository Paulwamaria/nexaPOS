// src/components/AppShell.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  Receipt,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
} from "lucide-react";
import { logout } from "@/lib/auth";

type User = {
  full_name: string;
  email: string;
  role: string;
};

const navItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "SUPERADMIN"],
  },
  {
    label: "POS",
    href: "/pos",
    icon: ShoppingCart,
    roles: ["CASHIER", "ADMIN", "SUPERADMIN"],
  },
  {
    label: "Inventory",
    href: "/inventory",
    icon: Boxes,
    roles: ["STORE_KEEPER", "ADMIN", "SUPERADMIN"],
  },
  {
    label: "Procurement",
    href: "/procurement",
    icon: PackagePlus,
    roles: ["STORE_KEEPER", "ADMIN", "SUPERADMIN"],
  },
  {
    label: "Sales",
    href: "/sales",
    icon: Receipt,
    roles: ["CASHIER", "ADMIN", "SUPERADMIN"],
  },
  {
    label: "Returns",
    href: "/returns",
    icon: RotateCcw,
    roles: ["CASHIER", "ADMIN", "SUPERADMIN"],
  },
  {
    label: "Reports",
    href: "/reports",
    icon: BarChart3,
    roles: ["ADMIN", "SUPERADMIN"],
  },
  {
    label: "Audit Logs",
    href: "/audit-logs",
    icon: ShieldCheck,
    roles: ["ADMIN", "SUPERADMIN"],
  },
];

export function AppShell({
  user,
  children,
}: {
  user: User | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const visibleItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false,
  );

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white lg:flex">
      <aside className="hidden w-72 border-r border-white/10 bg-slate-950/95 p-5 lg:block">
        <div className="mb-8">
          <p className="text-sm font-medium text-emerald-400">NexaPOS</p>
          <h1 className="mt-2 text-2xl font-bold">Control Center</h1>
        </div>

        <nav className="space-y-2">
          {visibleItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                  active
                    ? "bg-emerald-500 text-slate-950"
                    : "text-slate-300 hover:bg-white/10"
                }`}
              >
                <Icon size={18} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="absolute bottom-5 left-5 w-62">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="font-medium">{user?.full_name}</p>
            <p className="mt-1 text-xs text-slate-400">{user?.email}</p>
            <p className="mt-2 text-xs text-emerald-400">{user?.role}</p>

            <button
              onClick={handleLogout}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/10"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        </div>
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-white/10 bg-slate-950 p-4 lg:hidden">
          <div>
            <p className="text-sm text-emerald-400">NexaPOS</p>
            <p className="font-semibold">{user?.role}</p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg border border-white/10 px-3 py-2 text-sm"
          >
            Logout
          </button>
        </header>

        {children}
      </div>
    </div>
  );
}
