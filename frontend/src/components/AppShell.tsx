"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Boxes,
  LayoutDashboard,
  LogOut,
  Menu,
  PackagePlus,
  Receipt,
  RotateCcw,
  ShieldCheck,
  ShoppingCart,
  X,
  AlertTriangle,
  Clock,
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
    label: "Shifts",
    href: "/shifts",
    icon: Clock,
    roles: ["CASHIER", "ADMIN", "SUPERADMIN"],
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
    label: "Return Reviews",
    href: "/return-reviews",
    icon: AlertTriangle,
    roles: ["ADMIN", "SUPERADMIN"],
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
  const [mobileOpen, setMobileOpen] = useState(false);

  const visibleItems = navItems.filter((item) =>
    user ? item.roles.includes(user.role) : false,
  );

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white lg:flex">
      <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-slate-950 p-5 lg:flex lg:flex-col">
        <SidebarContent
          user={user}
          pathname={pathname}
          visibleItems={visibleItems}
          onLogout={handleLogout}
        />
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/10 bg-slate-950/90 p-4 backdrop-blur lg:hidden">
          <div>
            <p className="text-sm font-medium text-emerald-400">NexaPOS</p>
            <p className="text-xs text-slate-400">{user?.role}</p>
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-xl border border-white/10 p-2 hover:bg-white/10"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1">{children}</main>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-black/70"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
          />

          <aside className="relative h-full w-80 max-w-[85vw] border-r border-white/10 bg-slate-950 p-5 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-emerald-400">NexaPOS</p>
                <h2 className="text-xl font-bold">Menu</h2>
              </div>

              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-xl border border-white/10 p-2 hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <SidebarContent
              user={user}
              pathname={pathname}
              visibleItems={visibleItems}
              onLogout={handleLogout}
              onNavigate={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </div>
  );
}

function SidebarContent({
  user,
  pathname,
  visibleItems,
  onLogout,
  onNavigate,
}: {
  user: User | null;
  pathname: string;
  visibleItems: typeof navItems;
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-8 hidden lg:block">
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
              onClick={onNavigate}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                active
                  ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="font-medium">{user?.full_name}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{user?.email}</p>
          <p className="mt-2 text-xs font-medium text-emerald-400">
            {user?.role}
          </p>

          <button
            onClick={onLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm hover:bg-white/10"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
