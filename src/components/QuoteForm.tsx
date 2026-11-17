"use client";

import { sendQuote } from "@/app/actions/requests";
import { useKeepForm } from "./client";
import { Alert } from "./ui";

export default function QuoteForm({
  requestId,
  defaultPrice,
  defaultNote,
  isUpdate,
}: {
  requestId: number;
  defaultPrice?: number | null;
  defaultNote?: string | null;
  isUpdate?: boolean;
}) {
  const { state, pending, onSubmit } = useKeepForm(sendQuote.bind(null, requestId));
  return (
    <form method="post" onSubmit={onSubmit} className="space-y-3">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      {state?.ok && <Alert tone="success">{state.ok}</Alert>}
      <div>
        <label className="label" htmlFor="price">Fiyat (₺) *</label>
        <div className="relative">
          <input
            id="price"
            name="price"
            inputMode="decimal"
            required
            defaultValue={defaultPrice ?? ""}
            placeholder="Örn. 12500"
            className="input pr-10 text-lg font-semibold"
          />
          <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-semibold text-slate-400">₺</span>
        </div>
      </div>
      <div>
        <label className="label" htmlFor="note">Müşteriye not</label>
        <textarea
          id="note"
          name="note"
          rows={3}
          defaultValue={defaultNote ?? ""}
          className="input"
          placeholder="Örn. 10 tonluk kamyon, yükleme dahil. Otoyol ücreti ve KDV dahil."
        />
      </div>
      <button disabled={pending} className="btn btn-primary w-full">
        {pending ? "Gönderiliyor…" : isUpdate ? "Teklifi güncelle" : "Teklifi gönder"}
      </button>
    </form>
  );
}
