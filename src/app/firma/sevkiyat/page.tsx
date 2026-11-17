import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { DISPATCH_STATUSES } from "@/lib/constants";
import { dayKey, fmtDate, fmtMoney, fmtTime, jobSummary } from "@/lib/format";
import { dayRange } from "@/lib/dispatch";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import {
  AlertIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MapPinIcon,
  PackageIcon,
  RouteIcon,
  TruckIcon,
  UsersIcon,
} from "@/components/Icons";

export const metadata = { title: "Planlama" };

const WEEKDAY = new Intl.DateTimeFormat("tr-TR", { weekday: "long", timeZone: "Europe/Istanbul" });
const SHORT_WEEKDAY = new Intl.DateTimeFormat("tr-TR", { weekday: "short", timeZone: "Europe/Istanbul" });

function shiftDay(day: string, n: number) {
  return dayKey(new Date(new Date(`${day}T12:00:00+03:00`).getTime() + n * 86400000));
}

export default async function DispatchPage({ searchParams }: { searchParams: Promise<{ gun?: string }> }) {
  const { company } = await requireCompany();
  const today = dayKey(new Date());
  const raw = (await searchParams).gun;
  const day = raw && /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : today;
  const { start, end } = dayRange(day);

  const [jobs, vehicles, staff] = await Promise.all([
    db.shipment.findMany({
      where: { companyId: company.id, status: { in: DISPATCH_STATUSES }, scheduledAt: { gte: start, lt: end } },
      orderBy: { scheduledAt: "asc" },
      include: {
        customer: { select: { name: true } },
        vehicles: { select: { id: true, plate: true, type: true } },
        staff: { select: { id: true, name: true, role: true } },
      },
    }),
    db.vehicle.findMany({ where: { companyId: company.id, active: true }, orderBy: { plate: "asc" } }),
    db.staff.findMany({ where: { companyId: company.id, active: true }, orderBy: [{ role: "asc" }, { name: "asc" }] }),
  ]);

  // Kaynak -> o günkü işler
  const vJobs = new Map<string, typeof jobs>();
  const sJobs = new Map<string, typeof jobs>();
  for (const j of jobs) {
    for (const v of j.vehicles) vJobs.set(v.id, [...(vJobs.get(v.id) ?? []), j]);
    for (const s of j.staff) sJobs.set(s.id, [...(sJobs.get(s.id) ?? []), j]);
  }
  const unassigned = jobs.filter((j) => j.status !== "COMPLETED" && j.vehicles.length === 0);
  const busyVehicles = vehicles.filter((v) => vJobs.has(v.id)).length;
  const busyStaff = staff.filter((s) => sJobs.has(s.id)).length;
  const multi = (ids: { id: string }[], map: Map<string, unknown[]>) => ids.filter((x) => (map.get(x.id)?.length ?? 0) > 1);

  // 7 günlük şerit: seçili gün önümüzdeki 7 gün içindeyse bugünden, değilse seçili günü ortalayarak
  const inWeek = day >= today && day <= shiftDay(today, 6);
  const stripStart = inWeek ? today : shiftDay(day, -3);
  const stripRange = { start: dayRange(stripStart).start, end: dayRange(shiftDay(stripStart, 6)).end };
  const stripJobs = await db.shipment.findMany({
    where: { companyId: company.id, status: { in: DISPATCH_STATUSES }, scheduledAt: { gte: stripRange.start, lt: stripRange.end } },
    select: { scheduledAt: true },
  });
  const strip = Array.from({ length: 7 }, (_, i) => {
    const key = shiftDay(stripStart, i);
    return {
      key,
      weekday: SHORT_WEEKDAY.format(dayRange(key).start),
      count: stripJobs.filter((j) => dayKey(j.scheduledAt!) === key).length,
    };
  });

  const dayLabel = day === today ? "Bugün" : day === shiftDay(today, 1) ? "Yarın" : day === shiftDay(today, -1) ? "Dün" : WEEKDAY.format(start);

  return (
    <>
      <PageHeader title="Planlama" subtitle="Günlük sevkiyatlar, araç ve ekip dağılımı" />

      {/* Gün seçici: 7 günlük şerit */}
      <div className="card mb-5 p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between gap-2 px-1">
          <p className="text-sm">
            <span className="font-semibold text-blue-600">{dayLabel}</span>
            <span className="text-slate-500"> · {fmtDate(start)}</span>
          </p>
          {day !== today && (
            <Link href="/firma/sevkiyat" className="text-xs font-semibold text-blue-600 hover:underline">
              Bugüne dön
            </Link>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href={`/firma/sevkiyat?gun=${shiftDay(day, -1)}`}
            className="grid h-9 w-7 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 sm:w-9"
            aria-label="Önceki gün"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </Link>
          <div className="grid flex-1 grid-cols-7 gap-1 sm:gap-2">
            {strip.map((d) => {
              const sel = d.key === day;
              return (
                <Link
                  key={d.key}
                  href={d.key === today ? "/firma/sevkiyat" : `/firma/sevkiyat?gun=${d.key}`}
                  className={`rounded-xl border py-1.5 text-center transition sm:py-2 ${
                    sel ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <p className={`text-[10px] font-medium uppercase sm:text-xs ${sel ? "text-blue-100" : d.key === today ? "text-blue-600" : "text-slate-500"}`}>
                    {d.weekday}
                  </p>
                  <p className="text-base font-bold leading-tight sm:text-xl">{Number(d.key.slice(8))}</p>
                  <p className={`text-[10px] font-semibold sm:text-xs ${sel ? "text-white" : d.count ? "text-blue-600" : "text-slate-300"}`}>
                    {d.count ? `${d.count} iş` : "—"}
                  </p>
                </Link>
              );
            })}
          </div>
          <Link
            href={`/firma/sevkiyat?gun=${shiftDay(day, 1)}`}
            className="grid h-9 w-7 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 sm:w-9"
            aria-label="Sonraki gün"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Özet */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="İş" value={jobs.length} icon={<PackageIcon />} color="bg-blue-50 text-blue-600" />
        <Stat label="Araç kullanımda" value={`${busyVehicles}/${vehicles.length}`} icon={<TruckIcon />} color="bg-emerald-50 text-emerald-600" />
        <Stat label="Personel görevde" value={`${busyStaff}/${staff.length}`} icon={<UsersIcon />} color="bg-violet-50 text-violet-600" />
        <Stat
          label="Araç atanmamış"
          value={unassigned.length}
          icon={<AlertIcon />}
          color={unassigned.length ? "bg-amber-50 text-amber-600" : "bg-slate-100 text-slate-400"}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* İşler */}
        <section className="min-w-0 space-y-3 lg:col-span-2">
          {jobs.length === 0 ? (
            <EmptyState
              icon={<RouteIcon className="h-7 w-7" />}
              title="Bu gün için planlı sevkiyat yok"
              text="Onaylanan işler planlanan tarihlerine göre burada listelenir."
            />
          ) : (
            jobs.map((j) => {
              const vMulti = multi(j.vehicles, vJobs);
              const sMulti = multi(j.staff, sJobs);
              const noVehicle = j.vehicles.length === 0 && j.status !== "COMPLETED";
              return (
                <article key={j.id} className={`card overflow-hidden ${noVehicle ? "border-amber-300" : ""}`}>
                  <Link href={`/firma/talep/${j.id}`} className="flex items-start gap-4 p-4 hover:bg-slate-50 sm:p-5">
                    <div className="w-14 shrink-0 rounded-xl bg-slate-900 py-2 text-center text-white">
                      <p className="text-base font-bold">{fmtTime(j.scheduledAt!)}</p>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{j.customer.name}</span>
                        <span className="text-xs text-slate-400">#{j.id}</span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-sm text-slate-600">
                        <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {j.fromDistrict}, {j.fromCity} → {j.toDistrict}, {j.toCity}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {jobSummary(j)}
                        {j.vehicleType ? ` · İstenen: ${j.vehicleType}` : ""}
                      </p>
                    </div>
                    <div className="hidden shrink-0 flex-col items-end gap-1 sm:flex">
                      <StatusBadge status={j.status} />
                      {j.quotePrice != null && <span className="text-sm font-semibold">{fmtMoney(j.quotePrice)}</span>}
                    </div>
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
                    {j.vehicles.map((v) => (
                      <Chip key={v.id} warn={vMulti.includes(v)} icon={<TruckIcon className="h-3.5 w-3.5" />}>
                        {v.plate}
                      </Chip>
                    ))}
                    {j.staff.map((s) => (
                      <Chip key={s.id} warn={sMulti.includes(s)} icon={<UsersIcon className="h-3.5 w-3.5" />}>
                        {s.name.split(" ")[0]} <span className="text-slate-400">· {s.role}</span>
                      </Chip>
                    ))}
                    {noVehicle && (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                        <AlertIcon className="h-4 w-4" /> Araç atanmadı
                      </span>
                    )}
                    {j.status !== "COMPLETED" && (
                      <Link href={`/firma/talep/${j.id}#sevkiyat`} className="ml-auto text-xs font-semibold text-blue-600 hover:underline">
                        {j.vehicles.length + j.staff.length ? "Düzenle" : "Ata"}
                      </Link>
                    )}
                  </div>
                  {(vMulti.length > 0 || sMulti.length > 0) && (
                    <p className="border-t border-amber-100 bg-amber-50 px-4 py-2 text-xs text-amber-800 sm:px-5">
                      Turuncu işaretli araç/personel bu gün başka bir işe de atanmış. Saatlerin çakışmadığından emin olun.
                    </p>
                  )}
                </article>
              );
            })
          )}
        </section>

        {/* Kaynak durumu */}
        <aside className="min-w-0 space-y-5">
          <Resource
            title="Araç durumu"
            icon={<TruckIcon className="h-5 w-5 text-slate-400" />}
            empty="Aktif araç yok."
            rows={vehicles.map((v) => ({ id: v.id, name: v.plate, sub: v.type, jobs: vJobs.get(v.id) ?? [] }))}
          />
          <Resource
            title="Ekip durumu"
            icon={<UsersIcon className="h-5 w-5 text-slate-400" />}
            empty="Aktif personel yok."
            rows={staff.map((s) => ({ id: s.id, name: s.name, sub: s.role, jobs: sJobs.get(s.id) ?? [] }))}
          />
        </aside>
      </div>
    </>
  );
}

function Stat({ label, value, icon, color }: { label: string; value: React.ReactNode; icon: React.ReactNode; color: string }) {
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${color}`}>{icon}</span>
      <div className="min-w-0">
        <p className="text-xl font-bold leading-tight">{value}</p>
        <p className="truncate text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}

function Chip({ children, icon, warn }: { children: React.ReactNode; icon: React.ReactNode; warn?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
        warn ? "bg-amber-50 text-amber-800 ring-amber-300" : "bg-white text-slate-700 ring-slate-200"
      }`}
    >
      {icon}
      {children}
    </span>
  );
}

function Resource({
  title,
  icon,
  empty,
  rows,
}: {
  title: string;
  icon: React.ReactNode;
  empty: string;
  rows: { id: string; name: string; sub: string; jobs: { id: number; scheduledAt: Date | null }[] }[];
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center gap-2 font-semibold">
          {icon} {title}
        </h2>
        <Link href="/firma/sevkiyat/filo" className="text-xs font-medium text-blue-600 hover:underline">
          Yönet
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="p-5 text-sm text-slate-500">{empty}</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 px-5 py-3">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${r.jobs.length ? (r.jobs.length > 1 ? "bg-amber-500" : "bg-emerald-500") : "bg-slate-300"}`} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{r.name}</p>
                <p className="truncate text-xs text-slate-500">{r.sub}</p>
              </div>
              {r.jobs.length ? (
                <div className="flex flex-wrap justify-end gap-1">
                  {r.jobs.map((j) => (
                    <Link
                      key={j.id}
                      href={`/firma/talep/${j.id}`}
                      className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      #{j.id} {fmtTime(j.scheduledAt!)}
                    </Link>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-400">Boşta</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
