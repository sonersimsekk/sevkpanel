import type { Shipment, Message, User } from "@prisma/client";
import { fmtDate, fmtDateTime, fmtWeight } from "@/lib/format";
import { CheckIcon, MapPinIcon, MessageIcon } from "./Icons";
import { MessageForm } from "./client";
import type { FormState } from "@/app/actions/auth";

export function RouteCard({ req }: { req: Shipment }) {
  return (
    <div className="relative grid gap-4 sm:grid-cols-2">
      {[
        { t: "Yükleme", c: req.fromCity, d: req.fromDistrict, a: req.fromAddress, color: "text-blue-600 bg-blue-50" },
        { t: "Teslim", c: req.toCity, d: req.toDistrict, a: req.toAddress, color: "text-emerald-600 bg-emerald-50" },
      ].map((x) => (
        <div key={x.t} className="rounded-xl border border-slate-200 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className={`grid h-7 w-7 place-items-center rounded-lg ${x.color}`}>
              <MapPinIcon className="h-4 w-4" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{x.t}</span>
          </div>
          <p className="font-semibold text-slate-900">
            {x.d}, {x.c}
          </p>
          <p className="mt-0.5 text-sm text-slate-600">{x.a}</p>
        </div>
      ))}
    </div>
  );
}

export function RequestDetails({ req }: { req: Shipment }) {
  const extras = [
    req.loadingHelp && "Yükleme / indirme hizmeti",
    req.forklift && "Yükleme noktasında forklift / rampa var",
    req.packing && "Ambalaj / streç",
    req.insurance && "Sigortalı sevkiyat",
  ].filter(Boolean) as string[];

  return (
    <div className="space-y-5">
      <RouteCard req={req} />
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Info label="Yük cinsi" value={req.cargoType} />
        <Info label="Ağırlık" value={req.cargoWeight ? fmtWeight(req.cargoWeight) : "—"} />
        <Info
          label="Palet / hacim"
          value={
            [req.palletCount && `${req.palletCount} palet`, req.cargoVolume && `${req.cargoVolume.toLocaleString("tr-TR")} m³`]
              .filter(Boolean)
              .join(" · ") || "—"
          }
        />
        <Info label="İstenen araç" value={req.vehicleType || "Fark etmez"} />
        <Info label="Yükleme tarihi" value={fmtDate(req.loadDate)} hint={req.flexibleDate ? "Tarih esnek" : undefined} />
        <Info label="İletişim" value={req.contactPhone} />
      </dl>
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Ek hizmetler</p>
        {extras.length ? (
          <div className="flex flex-wrap gap-2">
            {extras.map((e) => (
              <span key={e} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                <CheckIcon className="h-3.5 w-3.5 text-emerald-600" /> {e}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500">Ek hizmet istenmedi.</p>
        )}
      </div>
      {req.items && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Yük açıklaması / notlar</p>
          <p className="whitespace-pre-line rounded-xl bg-slate-50 p-4 text-sm text-slate-700">{req.items}</p>
        </div>
      )}
    </div>
  );
}

function Info({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd>
      {hint && <dd className="text-xs text-amber-700">{hint}</dd>}
    </div>
  );
}

const STEPS = [
  { key: "PENDING", label: "Talep alındı" },
  { key: "QUOTED", label: "Teklif verildi" },
  { key: "ACCEPTED", label: "Onaylandı" },
  { key: "IN_PROGRESS", label: "Yolda" },
  { key: "COMPLETED", label: "Teslim edildi" },
];

export function Timeline({ status }: { status: string }) {
  if (status === "CANCELLED") return null;
  const idx = status === "REJECTED" ? 1 : STEPS.findIndex((s) => s.key === status);
  return (
    <ol className="flex items-start">
      {STEPS.map((s, i) => {
        const rejected = status === "REJECTED" && i === 1;
        const done = i <= idx && !rejected;
        const current = i === idx + 1 && status !== "REJECTED";
        return (
          <li key={s.key} className="relative flex flex-1 flex-col items-center text-center">
            {i > 0 && (
              <span className={`absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2 ${i <= idx ? "bg-blue-600" : "bg-slate-200"}`} />
            )}
            <span
              className={`relative z-10 grid h-7 w-7 place-items-center rounded-full text-xs font-bold ring-4 ring-white ${
                rejected
                  ? "bg-rose-500 text-white"
                  : done
                    ? "bg-blue-600 text-white"
                    : current
                      ? "bg-white text-blue-600 ring-blue-100 outline-2 outline-blue-600"
                      : "bg-slate-200 text-slate-500"
              }`}
            >
              {done ? <CheckIcon className="h-4 w-4" /> : i + 1}
            </span>
            <span
              className={`mt-2 text-[11px] font-medium leading-tight sm:text-xs ${
                rejected ? "text-rose-600" : done || current ? "text-slate-900" : "text-slate-400"
              }`}
            >
              {rejected ? "Teklif reddedildi" : s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

export function MessageThread({
  messages,
  currentUserId,
  action,
  disabled,
}: {
  messages: (Message & { sender: Pick<User, "name" | "role"> })[];
  currentUserId: string;
  action: (prev: FormState, fd: FormData) => Promise<FormState>;
  disabled?: boolean;
}) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <MessageIcon className="h-5 w-5 text-slate-400" />
        <h2 className="font-semibold">Mesajlar</h2>
        <span className="text-sm text-slate-400">({messages.length})</span>
      </div>
      <div className="max-h-[420px] space-y-3 overflow-y-auto bg-slate-50/60 px-4 py-4 sm:px-5">
        {messages.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">Henüz mesaj yok. Sorularınızı buradan iletebilirsiniz.</p>
        )}
        {messages.map((m) => {
          const mine = m.senderId === currentUserId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  mine ? "rounded-br-md bg-blue-600 text-white" : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                }`}
              >
                {!mine && (
                  <p className="mb-0.5 text-xs font-semibold text-blue-700">
                    {m.sender.name} {m.sender.role === "COMPANY" ? "· Firma" : ""}
                  </p>
                )}
                <p className="whitespace-pre-line break-words">{m.body}</p>
                <p className={`mt-1 text-right text-[10px] ${mine ? "text-blue-100" : "text-slate-400"}`}>{fmtDateTime(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
      </div>
      {!disabled && (
        <div className="border-t border-slate-100 p-3 sm:p-4">
          <MessageForm action={action} />
        </div>
      )}
    </div>
  );
}
