// src/app/audit-logs/page.tsx
"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { PageHeader } from "@/components/PageHeader";
import { AlertMessage } from "@/components/AlertMessage";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { api } from "@/lib/api";

type AuditLog = {
  id: number;
  user: { email: string; full_name: string } | null;
  branch: { name: string } | null;
  action: string;
  entity_type: string;
  entity_id: string;
  description: string;
  created_at: string;
};

export default function AuditLogsPage() {
  const { user, loadingUser } = useCurrentUser();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await api.get("/audit-logs/");
        setLogs(res.data);
      } catch {
        setMessage("Failed to load audit logs.");
      }
    }

    if (!loadingUser) loadLogs();
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
          title="Audit Logs"
          description="Review critical actions across sales, inventory, procurement, and users."
        />

        <AlertMessage message={message} tone="error" />

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-slate-400">
                <tr className="border-b border-white/10">
                  <th className="py-3">Action</th>
                  <th className="py-3">User</th>
                  <th className="py-3">Branch</th>
                  <th className="py-3">Entity</th>
                  <th className="py-3">Description</th>
                  <th className="py-3">Date</th>
                </tr>
              </thead>

              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5">
                    <td className="py-3 font-medium text-emerald-300">
                      {log.action}
                    </td>
                    <td className="py-3 text-slate-400">
                      {log.user?.full_name ?? log.user?.email ?? "-"}
                    </td>
                    <td className="py-3 text-slate-400">
                      {log.branch?.name ?? "-"}
                    </td>
                    <td className="py-3 text-slate-400">
                      {log.entity_type} #{log.entity_id}
                    </td>
                    <td className="py-3 text-slate-300">
                      {log.description || "-"}
                    </td>
                    <td className="py-3 text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}

                {logs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-slate-400">
                      No audit logs yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
