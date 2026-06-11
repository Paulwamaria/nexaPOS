// src/components/PageHeader.tsx
export function PageHeader({
  eyebrow = "NexaPOS",
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      <p className="text-sm font-medium text-emerald-400">{eyebrow}</p>
      <h1 className="mt-2 text-3xl font-bold text-white">{title}</h1>
      {description && <p className="mt-1 text-slate-400">{description}</p>}
    </div>
  );
}
