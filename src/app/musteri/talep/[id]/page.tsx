import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { fmtDate, fmtDateTime, fmtMoney, fmtTime } from "@/lib/format";
import { customerCancel, customerRespond, sendMessage } from "@/app/actions/requests";
import { Alert, PageHeader, StatusBadge } from "@/components/ui";
import { MessageThread, RequestDetails, Timeline } from "@/components/request";
import { CancelForm, SubmitButton } from "@/components/client";
import { BuildingIcon, CalendarIcon, CheckIcon, ClockIcon, PhoneIcon, TruckIcon, XIcon } from "@/components/Icons";

export const metadata = { title: "Talep detayı" };

export default async function CustomerRequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ yeni?: string }>;
}) {
  const session = await requireRole("CUSTOMER");
  const id = Number((await params).id);
  const isNew = (await searchParams).yeni === "1";
  if (!Number.isInteger(id)) notFound();

  const req = await db.shipment.findFirst({
    where: { id, customerId: session.userId },
    include: {
      company: { include: { owner: { select: { phone: true } } } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { name: true, role: true } } } },
      vehicles: { select: { id: true, plate: true, type: true } },
      staff: { select: { id: true, name: true, role: true, phone: true } },
    },
  });
  if (!req) notFound();

  const canCancel = ["PENDING", "QUOTED", "ACCEPTED", "REJECTED"].includes(req.status);

  return (
    <>
      <PageHeader
        back="/musteri"
        title={
          <span className="flex flex-wrap items-center gap-3">
            Talep #{req.id} <StatusBadge status={req.status} />
          </span>
        }
        subtitle={`${fmtDateTime(req.createdAt)} tarihinde oluşturuldu`}
      />

      {isNew && req.status === "PENDING" && (
        <div className="mb-5">
          <Alert tone="success">
            <b>Talebiniz iletildi!</b> {req.company.name} talebinizi inceleyip fiyat teklifini buraya gönderecek. Teklif geldiğinde bu
            sayfada göreceksiniz.
          </Alert>
        </div>
      )}

      <div className="card mb-5 p-5 sm:p-6">
        <Timeline status={req.status} />
        {req.status === "CANCELLED" && (
          <Alert tone="warning">
            Bu talep iptal edildi.{req.cancelReason ? ` (${req.cancelReason})` : ""}
          </Alert>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="card p-5 sm:p-6">
            <h2 className="mb-4 font-semibold">Sevkiyat detayları</h2>
            <RequestDetails req={req} />
          </div>
          <MessageThread
            messages={req.messages}
            currentUserId={session.userId}
            action={sendMessage.bind(null, req.id)}
            disabled={req.status === "CANCELLED"}
          />
        </div>

        <aside className="space-y-5">
          {/* Teklif kartı */}
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold">Fiyat teklifi</h2>
            </div>
            <div className="p-5">
              {req.quotePrice == null ? (
                <div className="flex items-start gap-3 text-sm text-slate-600">
                  <ClockIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                  <p>Firma talebinizi inceliyor. Teklif geldiğinde burada görünecek.</p>
                </div>
              ) : (
                <>
                  <p className="text-3xl font-extrabold tracking-tight text-slate-900">{fmtMoney(req.quotePrice)}</p>
                  {req.quotedAt && <p className="mt-1 text-xs text-slate-500">{fmtDateTime(req.quotedAt)} tarihinde verildi</p>}
                  {req.quoteNote && <p className="mt-3 whitespace-pre-line rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{req.quoteNote}</p>}

                  {req.status === "QUOTED" && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <form action={customerRespond.bind(null, req.id, "reject")}>
                        <SubmitButton className="btn btn-secondary w-full" pendingText="…" confirmText="Teklifi reddetmek istediğinize emin misiniz?">
                          <XIcon className="h-4 w-4" /> Reddet
                        </SubmitButton>
                      </form>
                      <form action={customerRespond.bind(null, req.id, "accept")}>
                        <SubmitButton className="btn btn-success w-full" pendingText="…">
                          <CheckIcon className="h-4 w-4" /> Kabul et
                        </SubmitButton>
                      </form>
                    </div>
                  )}
                  {req.status === "REJECTED" && (
                    <p className="mt-3 text-sm text-rose-600">Bu teklifi reddettiniz. Firma yeni bir teklif gönderebilir.</p>
                  )}
                </>
              )}
            </div>
          </div>

          {req.scheduledAt && ["ACCEPTED", "IN_PROGRESS", "COMPLETED"].includes(req.status) && (
            <div className="card flex items-start gap-3 p-5">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <CalendarIcon />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Planlanan yükleme</p>
                <p className="font-semibold">
                  {fmtDate(req.scheduledAt)} · {fmtTime(req.scheduledAt)}
                </p>
              </div>
            </div>
          )}

          {["ACCEPTED", "IN_PROGRESS"].includes(req.status) && req.vehicles.length + req.staff.length > 0 && (
            <div className="card p-5">
              <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <TruckIcon className="h-4 w-4" /> Sevkiyat bilgisi
              </p>
              <ul className="space-y-2.5">
                {req.vehicles.map((v) => (
                  <li key={v.id} className="flex items-center gap-3">
                    <span className="rounded-md border-2 border-slate-800 bg-white px-2 py-0.5 font-mono text-sm font-bold tracking-wider">{v.plate}</span>
                    <span className="text-sm text-slate-500">{v.type}</span>
                  </li>
                ))}
                {req.staff.map((s) => (
                  <li key={s.id} className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      <span className="font-medium text-slate-800">{s.name}</span>
                      <span className="text-slate-500"> · {s.role}</span>
                    </span>
                    {s.role === "Şoför" && s.phone && (
                      <a href={`tel:${s.phone}`} className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                        <PhoneIcon className="h-3.5 w-3.5" /> Ara
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="card p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
                <BuildingIcon />
              </span>
              <div>
                <p className="font-semibold">{req.company.name}</p>
                {req.company.city && <p className="text-sm text-slate-500">{req.company.city}</p>}
              </div>
            </div>
            {req.company.owner.phone && ["ACCEPTED", "IN_PROGRESS"].includes(req.status) && (
              <a href={`tel:${req.company.owner.phone}`} className="btn btn-secondary mt-4 w-full">
                Firmayı ara · {req.company.owner.phone}
              </a>
            )}
          </div>

          {canCancel && <CancelForm action={customerCancel.bind(null, req.id)} />}
        </aside>
      </div>
    </>
  );
}
