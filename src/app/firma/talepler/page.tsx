import Link from "next/link";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { STATUS, STATUS_ORDER, type Status } from "@/lib/constants";
import { EmptyState, PageHeader } from "@/components/ui";
import RequestRow, { rowInclude } from "@/components/RequestRow";
import { InboxIcon, SearchIcon } from "@/components/Icons";

export const metadata = { title: "Talepler" };

export default async function RequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ durum?: string; q?: string }>;
}) {
  const { company } = await requireCompany();
  const sp = await searchParams;
  const durum = STATUS_ORDER.includes(sp.durum as Status) ? (sp.durum as Status) : undefined;
  const q = (sp.q ?? "").trim();

  const [groups, all] = await Promise.all([
    db.shipment.groupBy({ by: ["status"], where: { companyId: company.id }, _count: true }),
    db.shipment.findMany({
      where: { companyId: company.id, ...(durum ? { status: durum } : {}) },
      orderBy: [{ createdAt: "desc" }],
      include: { ...rowInclude, customer: { select: { name: true, phone: true } } },
    }),
  ]);

  const counts = Object.fromEntries(groups.map((g) => [g.status, g._count])) as Record<string, number>;
  const total = groups.reduce((a, g) => a + g._count, 0);

  const needle = q.toLocaleLowerCase("tr");
  const list = needle
    ? all.filter((r) =>
        [String(r.id), r.customer.name, r.customer.phone ?? "", r.contactPhone, r.cargoType, r.fromDistrict, r.toDistrict, r.fromCity, r.toCity]
          .join(" ")
          .toLocaleLowerCase("tr")
          .includes(needle),
      )
    : all;

  const tabs: { key?: Status; label: string; count: number }[] = [
    { label: "Tümü", count: total },
    ...STATUS_ORDER.map((s) => ({ key: s, label: STATUS[s].label, count: counts[s] ?? 0 })),
  ];

  const href = (key?: string) => {
    const p = new URLSearchParams();
    if (key) p.set("durum", key);
    if (q) p.set("q", q);
    const s = p.toString();
    return `/firma/talepler${s ? `?${s}` : ""}`;
  };

  return (
    <>
      <PageHeader title="Talepler" subtitle="Müşterilerden gelen tüm sevkiyat talepleri" />

      <form className="relative mb-4" action="/firma/talepler">
        {durum && <input type="hidden" name="durum" value={durum} />}
        <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input name="q" defaultValue={q} placeholder="Müşteri, telefon, yük cinsi, ilçe veya talep no ile ara" className="input pl-10" />
      </form>

      <div className="-mx-4 mb-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="flex w-max gap-2">
          {tabs.map((t) => {
            const active = t.key === durum;
            return (
              <Link
                key={t.label}
                href={href(t.key)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  active ? "bg-slate-900 text-white" : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50"
                }`}
              >
                {t.label}
                <span className={`rounded-full px-1.5 text-xs ${active ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}>{t.count}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState
          icon={<InboxIcon className="h-7 w-7" />}
          title={q ? "Sonuç bulunamadı" : "Bu durumda talep yok"}
          text={q ? `"${q}" için eşleşen talep yok.` : "Yeni talepler geldiğinde burada görünecek."}
        />
      ) : (
        <div className="card divide-y divide-slate-100 overflow-hidden">
          {list.map((r) => (
            <RequestRow key={r.id} r={r} />
          ))}
        </div>
      )}
    </>
  );
}
