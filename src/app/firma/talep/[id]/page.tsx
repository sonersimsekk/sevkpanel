import { notFound } from "next/navigation";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { dayKey, fmtDate, fmtDateTime, fmtMoney, fmtTime, timeKey, whatsappLink } from "@/lib/format";
import { companySchedule, companySetStatus, saveInternalNote, sendMessage } from "@/app/actions/requests";
import { Alert, PageHeader, StatusBadge } from "@/components/ui";
import { MessageThread, RequestDetails, Timeline } from "@/components/request";
import { CancelForm, SubmitButton } from "@/components/client";
import QuoteForm from "@/components/QuoteForm";
import AssignCard from "@/components/AssignCard";
import { busyOnDay } from "@/lib/dispatch";
import { CalendarIcon, CheckIcon, ClockIcon, MessageIcon, PhoneIcon, TruckIcon, UserIcon } from "@/components/Icons";

export const metadata = { title: "Talep detayı" };

export default async function CompanyRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { session, company } = await requireCompany();
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const req = await db.shipment.findFirst({
    where: { id, companyId: company.id },
    include: {
      customer: { select: { name: true, email: true, phone: true, createdAt: true, _count: { select: { requests: true } } } },
      messages: { orderBy: { createdAt: "asc" }, include: { sender: { select: { name: true, role: true } } } },
      vehicles: { select: { id: true } },
      staff: { select: { id: true } },
    },
  });
  if (!req) notFound();

  const s = req.status;
  const sched = req.scheduledAt ?? req.loadDate;
  const showAssign = ["ACCEPTED", "IN_PROGRESS", "COMPLETED"].includes(s);
  const [vehicles, staff, busy] = showAssign
    ? await Promise.all([
        db.vehicle.findMany({ where: { companyId: company.id }, orderBy: { plate: "asc" } }),
        db.staff.findMany({ where: { companyId: company.id }, orderBy: [{ role: "asc" }, { name: "asc" }] }),
        busyOnDay(company.id, dayKey(sched), req.id),
      ])
    : [[], [], null];

  return (
    <>
      <PageHeader
        back="/firma/talepler"
        title={
          <span className="flex flex-wrap items-center gap-3">
            Talep #{req.id} <StatusBadge status={s} />
          </span>
        }
        subtitle={`${req.customer.name} · ${fmtDateTime(req.createdAt)} tarihinde geldi`}
      />

      <div className="card mb-5 p-5 sm:p-6">
        <Timeline status={s} />
        {s === "CANCELLED" && <Alert tone="warning">Bu talep iptal edildi.{req.cancelReason ? ` (${req.cancelReason})` : ""}</Alert>}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {/* Sağ panel mobilde üstte görünsün diye önce aksiyonlar */}
        <aside className="space-y-5 lg:order-2">
          <div className="card overflow-hidden">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold">
                {s === "PENDING" && "Fiyat teklifi ver"}
                {s === "QUOTED" && "Teklif gönderildi"}
                {s === "REJECTED" && "Teklif reddedildi"}
                {s === "ACCEPTED" && "Sevkiyat planı"}
                {s === "IN_PROGRESS" && "Sevkiyat yolda"}
                {s === "COMPLETED" && "Teslim edildi"}
                {s === "CANCELLED" && "İptal edildi"}
              </h2>
            </div>
            <div className="space-y-4 p-5">
              {s === "PENDING" && <QuoteForm requestId={req.id} />}

              {s === "QUOTED" && (
                <>
                  <div className="flex items-start gap-3 rounded-xl bg-blue-50 p-3 text-sm text-blue-800">
                    <ClockIcon className="mt-0.5 h-5 w-5 shrink-0" />
                    <p>
                      <b>{fmtMoney(req.quotePrice ?? 0)}</b> teklifiniz müşteriye iletildi, yanıtı bekleniyor.
                    </p>
                  </div>
                  <form action={companySetStatus.bind(null, req.id, "ACCEPTED")}>
                    <SubmitButton className="btn btn-success w-full" pendingText="…" confirmText="Müşteri teklifi onayladı olarak işaretlensin mi?">
                      <CheckIcon className="h-4 w-4" /> Müşteri telefonla onayladı
                    </SubmitButton>
                  </form>
                  <details className="group rounded-xl border border-slate-200">
                    <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-slate-700">Teklifi güncelle</summary>
                    <div className="border-t border-slate-100 p-4">
                      <QuoteForm requestId={req.id} defaultPrice={req.quotePrice} defaultNote={req.quoteNote} isUpdate />
                    </div>
                  </details>
                </>
              )}

              {s === "REJECTED" && (
                <>
                  <p className="text-sm text-slate-600">
                    Müşteri <b>{fmtMoney(req.quotePrice ?? 0)}</b> teklifinizi reddetti. İsterseniz yeni bir teklif gönderebilirsiniz.
                  </p>
                  <QuoteForm requestId={req.id} defaultPrice={req.quotePrice} defaultNote={req.quoteNote} isUpdate />
                </>
              )}

              {(s === "ACCEPTED" || s === "IN_PROGRESS") && (
                <>
                  <div className="flex items-center justify-between rounded-xl bg-emerald-50 p-3">
                    <span className="text-sm text-emerald-800">Anlaşılan fiyat</span>
                    <span className="text-lg font-bold text-emerald-900">{fmtMoney(req.quotePrice ?? 0)}</span>
                  </div>
                  <form action={companySchedule.bind(null, req.id)} className="space-y-2">
                    <label className="label">Yükleme tarihi ve saati</label>
                    <div className="grid grid-cols-[1fr_auto] gap-2">
                      <input type="date" name="date" defaultValue={dayKey(sched)} className="input" required />
                      <input type="time" name="time" defaultValue={timeKey(sched)} className="input w-28" />
                    </div>
                    <SubmitButton className="btn btn-secondary w-full">
                      <CalendarIcon className="h-4 w-4" /> Tarihi kaydet
                    </SubmitButton>
                  </form>
                  {s === "ACCEPTED" ? (
                    <form action={companySetStatus.bind(null, req.id, "IN_PROGRESS")}>
                      <SubmitButton className="btn btn-primary w-full" pendingText="…">
                        <TruckIcon className="h-4 w-4" /> Yola çıktı
                      </SubmitButton>
                    </form>
                  ) : (
                    <form action={companySetStatus.bind(null, req.id, "COMPLETED")}>
                      <SubmitButton className="btn btn-success w-full" pendingText="…" confirmText="Sevkiyat teslim edildi olarak işaretlensin mi?">
                        <CheckIcon className="h-4 w-4" /> Teslim edildi
                      </SubmitButton>
                    </form>
                  )}
                </>
              )}

              {s === "COMPLETED" && (
                <div className="space-y-1 text-sm text-slate-600">
                  <p>
                    <b>{fmtDate(sched)}</b> tarihinde teslim edildi.
                  </p>
                  {req.quotePrice != null && (
                    <p>
                      Tutar: <b className="text-slate-900">{fmtMoney(req.quotePrice)}</b>
                    </p>
                  )}
                </div>
              )}

              {s === "CANCELLED" && <p className="text-sm text-slate-600">{req.cancelReason || "Bu talep iptal edildi."}</p>}

              {["PENDING", "QUOTED", "ACCEPTED", "REJECTED", "IN_PROGRESS"].includes(s) && (
                <div className="border-t border-slate-100 pt-4">
                  <CancelForm action={companySetStatus.bind(null, req.id, "CANCELLED")} label={s === "PENDING" ? "Talebi reddet" : "İşi iptal et"} />
                </div>
              )}
            </div>
          </div>

          {/* Müşteri kartı */}
          <div className="card p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-600">
                <UserIcon />
              </span>
              <div className="min-w-0">
                <p className="truncate font-semibold">{req.customer.name}</p>
                <p className="truncate text-sm text-slate-500">{req.customer.email}</p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500">
              Toplam {req.customer._count.requests} talep · {fmtDate(req.customer.createdAt)} tarihinden beri üye
            </p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <a href={`tel:${req.contactPhone}`} className="btn btn-secondary">
                <PhoneIcon className="h-4 w-4" /> Ara
              </a>
              <a href={whatsappLink(req.contactPhone)} target="_blank" rel="noreferrer" className="btn border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                <MessageIcon className="h-4 w-4" /> WhatsApp
              </a>
            </div>
            <p className="mt-2 text-center text-sm font-medium text-slate-700">{req.contactPhone}</p>
          </div>

          {/* Firma içi not */}
          <form action={saveInternalNote.bind(null, req.id)} className="card space-y-3 p-5">
            <div>
              <h2 className="font-semibold">Firma içi not</h2>
              <p className="text-xs text-slate-500">Sadece siz görürsünüz (ekip, araç, ekstra masraf vb.)</p>
            </div>
            <textarea name="note" rows={3} defaultValue={req.internalNote ?? ""} className="input" placeholder="Örn. 08:00 depodan çıkış. Otoyol ücreti fiyata dahil." />
            <SubmitButton className="btn btn-secondary w-full">Notu kaydet</SubmitButton>
          </form>
        </aside>

        <div className="space-y-5 lg:order-1 lg:col-span-2">
          <div className="card p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-semibold">Sevkiyat detayları</h2>
              {req.scheduledAt && ["ACCEPTED", "IN_PROGRESS"].includes(s) && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                  <CalendarIcon className="h-3.5 w-3.5" /> {fmtDate(req.scheduledAt)} · {fmtTime(req.scheduledAt)}
                </span>
              )}
            </div>
            <RequestDetails req={req} />
          </div>
          {showAssign && busy && (
            <AssignCard
              requestId={req.id}
              vehicles={vehicles}
              staff={staff}
              assignedVehicleIds={req.vehicles.map((v) => v.id)}
              assignedStaffIds={req.staff.map((x) => x.id)}
              busyVehicles={busy.vehicles}
              busyStaff={busy.staff}
              wantedVehicleType={req.vehicleType}
              readOnly={s === "COMPLETED"}
            />
          )}
          <MessageThread
            messages={req.messages}
            currentUserId={session.userId}
            action={sendMessage.bind(null, req.id)}
            disabled={s === "CANCELLED"}
          />
        </div>
      </div>
    </>
  );
}
