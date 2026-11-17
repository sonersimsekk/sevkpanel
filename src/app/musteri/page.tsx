import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, fmtMoney, jobSummary, relTime } from "@/lib/format";
import { EmptyState, PageHeader, StatusBadge } from "@/components/ui";
import { ArrowRightIcon, CalendarIcon, ChevronRightIcon, MessageIcon, PackageIcon, PlusIcon, TruckIcon } from "@/components/Icons";

export const metadata = { title: "Sevkiyatlarım" };

export default async function CustomerHome() {
  const session = await requireRole("CUSTOMER");
  const requests = await db.shipment.findMany({
    where: { customerId: session.userId },
    orderBy: { createdAt: "desc" },
    include: { company: { select: { name: true } }, _count: { select: { messages: true } } },
  });

  const quoted = requests.filter((r) => r.status === "QUOTED");
  const active = requests.filter((r) => !["CANCELLED", "COMPLETED", "REJECTED"].includes(r.status));
  const past = requests.filter((r) => ["CANCELLED", "COMPLETED", "REJECTED"].includes(r.status));

  return (
    <>
      <PageHeader
        title={`Merhaba, ${session.name.split(" ")[0]} 👋`}
        subtitle="Sevkiyat taleplerinizi ve gelen teklifleri buradan takip edin."
        action={
          <Link href="/musteri/yeni" className="btn btn-primary">
            <PlusIcon className="h-4 w-4" /> Yeni sevkiyat
          </Link>
        }
      />

      {quoted.length > 0 && (
        <div className="mb-6 space-y-3">
          {quoted.map((r) => (
            <Link
              key={r.id}
              href={`/musteri/talep/${r.id}`}
              className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-5 text-white shadow-lg shadow-blue-600/20 transition hover:from-blue-700"
            >
              <span className="hidden h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/15 sm:grid">
                <TruckIcon className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm text-blue-100">{r.company.name} teklif gönderdi</p>
                <p className="text-xl font-bold">{fmtMoney(r.quotePrice ?? 0)}</p>
                <p className="truncate text-sm text-blue-100">
                  {r.fromDistrict} → {r.toDistrict} · {fmtDate(r.loadDate)}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-1 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-blue-700">
                İncele <ArrowRightIcon className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      )}

      {requests.length === 0 ? (
        <EmptyState
          icon={<PackageIcon className="h-7 w-7" />}
          title="Henüz bir talebiniz yok"
          text="Yük ve güzergah bilgilerini girin, lojistik firması size panelden fiyat versin."
          action={
            <Link href="/musteri/yeni" className="btn btn-primary">
              <PlusIcon className="h-4 w-4" /> İlk sevkiyatımı oluştur
            </Link>
          }
        />
      ) : (
        <div className="space-y-8">
          <Section title="Aktif talepler" items={active} empty="Aktif talebiniz yok." />
          {past.length > 0 && <Section title="Geçmiş" items={past} />}
        </div>
      )}
    </>
  );
}

type Item = Prisma.ShipmentGetPayload<{
  include: { company: { select: { name: true } }; _count: { select: { messages: true } } };
}>;

function Section({ title, items, empty }: { title: string; items: Item[]; empty?: string }) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h2>
      {items.length === 0 ? (
        <p className="card p-5 text-sm text-slate-500">{empty}</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {items.map((r) => (
            <Link key={r.id} href={`/musteri/talep/${r.id}`} className="card group min-w-0 p-5 transition hover:border-blue-300 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs text-slate-400">
                    #{r.id} · {r.company.name} · {relTime(r.createdAt)}
                  </p>
                  <p className="mt-1 truncate font-semibold text-slate-900">
                    {r.fromDistrict}, {r.fromCity} → {r.toDistrict}, {r.toCity}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <TruckIcon className="h-4 w-4" /> {jobSummary(r)}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarIcon className="h-4 w-4" /> {fmtDate(r.scheduledAt ?? r.loadDate)}
                </span>
                {r._count.messages > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <MessageIcon className="h-4 w-4" /> {r._count.messages}
                  </span>
                )}
                <span className="ml-auto flex items-center gap-2">
                  {r.quotePrice != null && <span className="font-semibold text-slate-900">{fmtMoney(r.quotePrice)}</span>}
                  <ChevronRightIcon className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-blue-500" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
