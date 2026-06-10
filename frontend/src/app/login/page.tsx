// src/app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { logout, saveTokens } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("admin@nexapos.com");
  const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await api.post("/auth/login/", {
        email,
        password,
      });

      const { access, refresh } = response.data;

      if (!access || !refresh) {
        throw new Error("Missing tokens");
      }

      saveTokens(access, refresh);

      const me = await api.get("/auth/me/");
      const role = me.data.role;

      if (role === "CASHIER") {
        router.push("/pos");
        return;
      }

      if (role === "STORE_KEEPER") {
        router.push("/inventory");
        return;
      }

      router.push("/dashboard");
    } catch (error: any) {
      console.error("Login error:", error);

      if (error?.response?.status === 401) {
        setError("Invalid email or password.");
        return;
      }

      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-4">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 shadow-2xl"
      >
        <div className="mb-8">
          <p className="text-sm text-emerald-400 font-medium">NexaPOS</p>
          <h1 className="mt-2 text-3xl font-bold">Welcome back</h1>
          <p className="mt-2 text-sm text-slate-400">
            Sign in to manage sales, inventory, branches, and reports.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <label className="block text-sm mb-2">Email</label>
        <input
          className="mb-4 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          type="email"
        />

        <label className="block text-sm mb-2">Password</label>
        <input
          className="mb-6 w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 outline-none focus:border-emerald-400"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
        />

        <button
          disabled={loading}
          className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
