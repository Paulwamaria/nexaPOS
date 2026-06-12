// src/components/PaginationControls.tsx
export function PaginationControls({
  page,
  count,
  pageSize = 20,
  label = "records",
  onPageChange,
}: {
  page: number;
  count: number;
  pageSize?: number;
  label?: string;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-4 flex items-center justify-between">
      <button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="rounded-lg border border-white/10 px-4 py-2 text-sm disabled:opacity-50"
      >
        Previous
      </button>

      <span className="text-sm text-slate-400">
        Page {page} · {count} {label}
      </span>

      <button
        disabled={page * pageSize >= count}
        onClick={() => onPageChange(page + 1)}
        className="rounded-lg border border-white/10 px-4 py-2 text-sm disabled:opacity-50"
      >
        Next
      </button>
    </div>
  );
}
