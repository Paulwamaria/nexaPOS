// src/app/dashboard/page.tsx
"use client";

import { logout } from "@/lib/auth";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-emerald-400 text-sm font-medium">NexaPOS</p>
          <h1 className="text-3xl font-bold mt-2">Dashboard</h1>
        </div>

        <button
          onClick={handleLogout}
          className="rounded-lg border border-white/10 px-4 py-2 text-sm hover:bg-white/10"
        >
          Logout
        </button>
      </div>
    </main>
  );
}
