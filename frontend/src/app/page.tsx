import Link from "next/link";
import {
  BarChart3,
  Boxes,
  ClipboardCheck,
  CreditCard,
  FileText,
  Receipt,
  RotateCcw,
  ShieldCheck,
  Truck,
  Wallet,
} from "lucide-react";

const features = [
  {
    title: "Fast POS Checkout",
    description:
      "Sell products quickly with barcode/SKU support, customer selection, receipts, and sales history.",
    icon: Receipt,
  },
  {
    title: "Inventory Control",
    description:
      "Create products, manage stock, edit prices, deactivate items, and monitor low-stock alerts.",
    icon: Boxes,
  },
  {
    title: "Procurement",
    description:
      "Manage suppliers, create purchase orders, receive goods, and keep branch stock accurate.",
    icon: Truck,
  },
  {
    title: "Expense Tracking",
    description:
      "Record daily operating costs so profit estimates reflect the real business picture.",
    icon: Wallet,
  },
  {
    title: "Shift Reconciliation",
    description:
      "Open and close cashier shifts with expected cash, actual cash, and variance tracking.",
    icon: ClipboardCheck,
  },
  {
    title: "Return Risk Review",
    description:
      "Serve customers quickly while flagging suspicious returns for manager review.",
    icon: RotateCcw,
  },
  {
    title: "Business Dashboard",
    description:
      "See sales, gross profit, expenses, net profit, attention alerts, and recent activity.",
    icon: BarChart3,
  },
  {
    title: "Audit Logs",
    description:
      "Track critical actions across users, inventory, procurement, returns, and sales.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div>
          <p className="text-xl font-bold tracking-tight">NexaPOS</p>
          <p className="text-xs text-slate-400">
            Business control for growing shops
          </p>
        </div>

        <Link
          href="/login"
          className="rounded-full border border-white/10 px-5 py-2 text-sm font-medium hover:bg-white/10"
        >
          Login
        </Link>
      </nav>

      <section className="mx-auto grid max-w-7xl gap-10 px-6 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div>
          <div className="mb-5 inline-flex rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-200">
            Built for real shop operations — not just checkout.
          </div>

          <h1 className="max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
            A modern POS and business control system for growing shops.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Run sales, inventory, procurement, expenses, shifts, returns,
            reports, and audit controls from one clean dashboard.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-full bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
            >
              Open Demo
            </Link>

            <a
              href="#features"
              className="rounded-full border border-white/10 px-6 py-3 font-semibold hover:bg-white/10"
            >
              View Features
            </a>
          </div>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl">
          <div className="rounded-2xl bg-slate-900 p-5">
            <div className="flex items-center justify-between">
              <p className="font-semibold">Today’s Snapshot</p>
              <CreditCard className="text-emerald-300" />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Metric label="Sales Today" value="KES 124,500" tone="emerald" />
              <Metric label="Gross Profit" value="KES 41,200" tone="sky" />
              <Metric label="Expenses" value="KES 9,300" tone="amber" />
              <Metric label="Net Profit" value="KES 31,900" tone="violet" />
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold">Attention Center</p>
              <div className="mt-3 space-y-2 text-sm text-slate-300">
                <AlertText text="4 critical low-stock items" />
                <AlertText text="2 returns awaiting review" />
                <AlertText text="1 open cashier shift" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-6 py-16">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold text-emerald-300">Features</p>
          <h2 className="mt-3 text-3xl font-bold md:text-5xl">
            Everything a shop owner needs to stay in control.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 transition hover:bg-white/10"
              >
                <div className="mb-4 inline-flex rounded-xl bg-emerald-500/10 p-3 text-emerald-300">
                  <Icon size={22} />
                </div>

                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-8 md:p-12">
          <h2 className="text-3xl font-bold md:text-5xl">
            Ready to run a smarter shop?
          </h2>
          <p className="mt-4 max-w-2xl text-slate-300">
            Test NexaPOS with demo data, explore the workflows, and see how it
            handles a full business day.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex rounded-full bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400"
          >
            Launch NexaPOS
          </Link>
        </div>
      </section>
    </main>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "sky" | "amber" | "violet";
}) {
  const tones = {
    emerald: "border-emerald-500/20 bg-emerald-500/10 text-emerald-200",
    sky: "border-sky-500/20 bg-sky-500/10 text-sky-200",
    amber: "border-amber-500/20 bg-amber-500/10 text-amber-200",
    violet: "border-violet-500/20 bg-violet-500/10 text-violet-200",
  };

  return (
    <div className={`rounded-xl border p-4 ${tones[tone]}`}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}

function AlertText({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-emerald-400" />
      <span>{text}</span>
    </div>
  );
}
