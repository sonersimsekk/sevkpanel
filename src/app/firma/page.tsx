import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { dayKey, fmtDayMon, fmtMoney, fmtTime } from "@/lib/format";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import RequestRow, { rowInclude } from "@/components/RequestRow";
import { AlertIcon, ArrowRightIcon, CalendarIcon, CheckIcon, ClockIcon, InboxIcon, RouteIcon, WalletIcon } from "@/components/Icons";

export const metadata = { title: "Firma paneli" };

export default async function CompanyDashboard() {
  const { company } = await requireCompany();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const today = new Date(`${dayKey(now)}T00:00:00+03:00`);

  const tomorrow = new Date(today.getTime() + 86400000);
  const [todayJobs, pending, quoted, upcomingCount, monthDone, newRequests, upcoming] = await Promise.all([
    db.shipment.findMany({
      where: { companyId: company.id, status: { in: ["ACCEPTED", "IN_PROGRESS"] }, scheduledAt: { gte: today, lt: tomorrow } },
      select: { id: true, _count: { select: { vehicles: true } } },
    }),
    db.shipment.count({ where: { companyId: company.id, status: "PENDING" } }),
    db.shipment.count({ where: { companyId: company.id, status: "QUOTED" } }),
    db.shipment.count({ where: { companyId: company.id, status: { in: ["ACCEPTED", "IN_PROGRESS"] } } }),
    db.shipment.aggregate({
      where: { companyId: company.id, status: "COMPLETED", scheduledAt: { gte: monthStart } },
      _sum: { quotePrice: true },
      _count: true,
    }),
    db.shipment.findMany({
      where: { companyId: company.id, status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: rowInclude,
    }),
    db.shipment.findMany({
      where: { companyId: company.id, status: { in: ["ACCEPTED", "IN_PROGRESS"] }, scheduledAt: { gte: today } },
      orderBy: { scheduledAt: "asc" },
      take: 5,
      include: { customer: { select: { name: true } } },
    }),
  ]);

  const unassignedToday = todayJobs.filter((j) => j._count.vehicles === 0).length;

  const stats = [
    { label: "Yeni talep", value: pending, hint: "Fiyat bekliyor", icon: <InboxIcon />, color: "bg-amber-50 text-amber-600", href: "/firma/talepler?durum=PENDING" },
    { label: "Teklif verildi", value: quoted, hint: "Müşteri yanıtı bekleniyor", icon: <ClockIcon />, color: "bg-blue-50 text-blue-600", href: "/firma/talepler?durum=QUOTED" },
    { label: "Planlanan iş", value: upcomingCount, hint: "Onaylanmış sevkiyatlar", icon: <CalendarIcon />, color: "bg-emerald-50 text-emerald-600", href: "/firma/sevkiyat" },
    {
      label: "Bu ay ciro",
      value: fmtMoney(monthDone._sum.quotePrice ?? 0),
      hint: `${monthDone._count} sevkiyat teslim edildi`,
      icon: <WalletIcon />,
      color: "bg-violet-50 text-violet-600",
      href: "/firma/talepler?durum=COMPLETED",
    },
  ];

  return (
    <>
      <PageHeader title={company.name} subtitle="Bugünün özeti ve bekleyen işleriniz" />

      {todayJobs.length > 0 && (
        <Link
          href="/firma/sevkiyat"
          className={`mb-5 flex items-center gap-3 rounded-2xl border p-4 transition hover:shadow-md ${
            unassignedToday ? "border-amber-300 bg-amber-50" : "border-emerald-200 bg-emerald-50"
          }`}
        >
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
              unassignedToday ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
            }`}
          >
            {unassignedToday ? <AlertIcon /> : <RouteIcon />}
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-semibold text-slate-900">Bugün {todayJobs.length} sevkiyat var</p>
            <p className={unassignedToday ? "text-amber-800" : "text-emerald-800"}>
              {unassignedToday ? `${unassignedToday} işe henüz araç atanmadı.` : "Tüm işlere araç atandı."}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-sm font-semibold text-slate-700">
            Plan <ArrowRightIcon className="h-4 w-4" />
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="card p-4 transition hover:border-blue-300 hover:shadow-md sm:p-5">
            <span className={`grid h-10 w-10 place-items-center rounded-xl ${s.color}`}>{s.icon}</span>
            <p className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{s.value}</p>
            <p className="text-sm font-medium text-slate-700">{s.label}</p>
            <p className="mt-0.5 hidden text-xs text-slate-500 sm:block">{s.hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <section className="card overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold">Fiyat bekleyen talepler</h2>
            <Link href="/firma/talepler" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
              Tümü <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          {newRequests.length === 0 ? (
            <div className="p-5">
              <EmptyState icon={<CheckIcon className="h-7 w-7" />} title="Hepsi tamam!" text="Fiyat bekleyen yeni talep yok." />
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {newRequests.map((r) => (
                <RequestRow key={r.id} r={r} />
              ))}
            </div>
          )}
        </section>

        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <h2 className="font-semibold">Yaklaşan sevkiyatlar</h2>
            <Link href="/firma/sevkiyat" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline">
              Plan <ArrowRightIcon className="h-4 w-4" />
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">Planlanmış sevkiyat yok.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {upcoming.map((r) => (
                <li key={r.id}>
                  <Link href={`/firma/talep/${r.id}`} className="flex items-center gap-3 px-5 py-3.5 hover:bg-slate-50">
                    <div className="w-14 shrink-0 rounded-xl bg-slate-100 py-1.5 text-center">
                      <p className="text-[11px] font-medium uppercase text-slate-500">{fmtDayMon(r.scheduledAt!)}</p>
                      <p className="text-xs font-bold text-slate-800">{fmtTime(r.scheduledAt!)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{r.customer.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {r.fromDistrict} → {r.toDistrict}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
