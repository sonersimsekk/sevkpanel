import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { fmtDate, fmtMoney, jobSummary, relTime } from "@/lib/format";
import { StatusBadge } from "./ui";
import { CalendarIcon, ChevronRightIcon, MessageIcon } from "./Icons";

export type RowRequest = Prisma.ShipmentGetPayload<{
  include: { customer: { select: { name: true } }; _count: { select: { messages: true } } };
}>;

export const rowInclude = {
  customer: { select: { name: true } },
  _count: { select: { messages: true } },
} as const;

export default function RequestRow({ r }: { r: RowRequest }) {
  return (
    <Link
      href={`/firma/talep/${r.id}`}
      className="group flex items-center gap-4 px-4 py-4 transition hover:bg-slate-50 sm:px-5"
    >
      <div className="hidden h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-100 text-sm font-bold text-slate-600 sm:grid">
        {r.customer.name
          .split(" ")
          .map((w) => w[0])
          .slice(0, 2)
          .join("")}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-semibold text-slate-900">{r.customer.name}</span>
          <span className="text-xs text-slate-400">#{r.id} · {relTime(r.createdAt)}</span>
        </div>
        <p className="mt-0.5 truncate text-sm text-slate-600">
          {jobSummary(r)} · {r.fromDistrict}
          {r.fromCity !== r.toCity ? `, ${r.fromCity}` : ""} → {r.toDistrict}
          {r.fromCity !== r.toCity ? `, ${r.toCity}` : ""}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <CalendarIcon className="h-3.5 w-3.5" /> {fmtDate(r.scheduledAt ?? r.loadDate)}
            {r.flexibleDate && !r.scheduledAt ? " (esnek)" : ""}
          </span>
          {r._count.messages > 0 && (
            <span className="inline-flex items-center gap-1">
              <MessageIcon className="h-3.5 w-3.5" /> {r._count.messages}
            </span>
          )}
          <StatusBadge status={r.status} className="sm:hidden" />
        </div>
      </div>
      <div className="hidden shrink-0 flex-col items-end gap-1.5 sm:flex">
        <StatusBadge status={r.status} />
        {r.quotePrice != null && <span className="text-sm font-semibold text-slate-900">{fmtMoney(r.quotePrice)}</span>}
      </div>
      <ChevronRightIcon className="h-5 w-5 shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
    </Link>
  );
}
