import Link from "next/link";
import { STATUS, type Status } from "@/lib/constants";
import { ChevronLeftIcon } from "./Icons";

export function StatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const s = STATUS[status as Status] ?? STATUS.PENDING;
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${s.badge} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function PageHeader({
  title,
  subtitle,
  back,
  action,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  back?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        {back && (
          <Link href={back} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800">
            <ChevronLeftIcon className="h-4 w-4" /> Geri
          </Link>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({ icon, title, text, action }: { icon: React.ReactNode; title: string; text?: string; action?: React.ReactNode }) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-blue-50 text-blue-600">{icon}</div>
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Alert({ tone = "info", children }: { tone?: "info" | "success" | "error" | "warning"; children: React.ReactNode }) {
  const tones = {
    info: "bg-blue-50 text-blue-800 border-blue-200",
    success: "bg-emerald-50 text-emerald-800 border-emerald-200",
    error: "bg-rose-50 text-rose-800 border-rose-200",
    warning: "bg-amber-50 text-amber-900 border-amber-200",
  };
  return <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>{children}</div>;
}
