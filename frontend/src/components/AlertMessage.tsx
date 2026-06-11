// src/components/AlertMessage.tsx
export function AlertMessage({
  message,
  tone = "default",
}: {
  message: string;
  tone?: "default" | "success" | "error";
}) {
  if (!message) return null;

  const styles = {
    default: "border-white/10 bg-white/5 text-slate-200",
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-200",
    error: "border-red-500/30 bg-red-500/10 text-red-200",
  };

  return (
    <div className={`mb-4 rounded-xl border p-4 text-sm ${styles[tone]}`}>
      {message}
    </div>
  );
}
