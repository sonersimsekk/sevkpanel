"use client";

import { startTransition, useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import type { FormState } from "@/app/actions/auth";
import { SendIcon, XIcon } from "./Icons";

/** Sayfayı belirli aralıklarla ve sekmeye dönüldüğünde tazeler (yeni talepler/mesajlar için). */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), seconds * 1000);
    const onFocus = () => router.refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", onFocus);
    };
  }, [router, seconds]);
  return null;
}

export function SubmitButton({
  children,
  className = "btn btn-primary",
  pendingText = "Kaydediliyor…",
  confirmText,
}: {
  children: React.ReactNode;
  className?: string;
  pendingText?: string;
  confirmText?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(e) => {
        if (confirmText && !window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {pending ? pendingText : children}
    </button>
  );
}

/** İptal butonu: tıklayınca sebep alanı açılır. */
export function CancelForm({
  action,
  label = "Talebi iptal et",
}: {
  action: (fd: FormData) => Promise<void>;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn btn-danger w-full">
        <XIcon className="h-4 w-4" /> {label}
      </button>
    );
  return (
    <form action={action} className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/50 p-3">
      <label className="label">İptal sebebi (isteğe bağlı)</label>
      <textarea name="reason" rows={2} className="input" placeholder="Örn. tarih değişti" />
      <div className="flex gap-2">
        <button type="button" onClick={() => setOpen(false)} className="btn btn-secondary flex-1">
          Vazgeç
        </button>
        <SubmitButton className="btn flex-1 bg-rose-600 text-white hover:bg-rose-700" pendingText="İptal ediliyor…">
          İptal et
        </SubmitButton>
      </div>
    </form>
  );
}

export function MessageForm({ action }: { action: (prev: FormState, fd: FormData) => Promise<FormState> }) {
  const [state, formAction] = useActionState(action, undefined);
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form ref={ref} action={formAction} className="flex items-end gap-2">
      <textarea
        name="body"
        rows={1}
        required
        placeholder="Mesaj yazın…"
        className="input max-h-40 min-h-[44px] resize-none"
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            ref.current?.requestSubmit();
          }
        }}
      />
      <SubmitButton className="btn btn-primary h-11 shrink-0 px-3.5" pendingText="…">
        <SendIcon className="h-4 w-4" />
        <span className="sr-only">Gönder</span>
      </SubmitButton>
      {state?.error && <p className="text-sm text-rose-600">{state.error}</p>}
    </form>
  );
}

/** Formu sıfırlamadan (hata durumunda girilenler kaybolmasın) sunucu aksiyonu çalıştırır. */
export function useKeepForm(action: (prev: FormState, fd: FormData) => Promise<FormState>) {
  const [state, dispatch, pending] = useActionState(action, undefined);
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    startTransition(() => dispatch(fd));
  };
  return { state, pending, onSubmit };
}
