"use client";

import Link from "next/link";
import { login, register } from "@/app/actions/auth";
import { CITIES } from "@/lib/constants";
import { useKeepForm } from "./client";
import { Alert } from "./ui";

export function LoginForm({ isCompany }: { isCompany: boolean }) {
  const { state, pending, onSubmit } = useKeepForm(login);
  return (
    <form method="post" onSubmit={onSubmit} className="space-y-4">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <div>
        <label className="label" htmlFor="email">E-posta</label>
        <input id="email" name="email" type="email" autoComplete="email" required className="input" placeholder="ornek@mail.com" />
      </div>
      <div>
        <label className="label" htmlFor="password">Şifre</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" placeholder="••••••" />
      </div>
      <button disabled={pending} className="btn btn-primary w-full py-3">
        {pending ? "Giriş yapılıyor…" : "Giriş yap"}
      </button>
      <p className="text-center text-sm text-slate-500">
        Hesabınız yok mu?{" "}
        <Link href={`/kayit?tip=${isCompany ? "firma" : "musteri"}`} className="font-semibold text-blue-600 hover:underline">
          Ücretsiz kayıt olun
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm({ isCompany }: { isCompany: boolean }) {
  const { state, pending, onSubmit } = useKeepForm(register);
  return (
    <form method="post" onSubmit={onSubmit} className="space-y-4">
      <input type="hidden" name="role" value={isCompany ? "COMPANY" : "CUSTOMER"} />
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      {isCompany && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="companyName">Firma adı *</label>
            <input id="companyName" name="companyName" required className="input" placeholder="Örn. Yıldız Lojistik" />
          </div>
          <div>
            <label className="label" htmlFor="city">Hizmet verdiğiniz il</label>
            <select id="city" name="city" className="input" defaultValue="">
              <option value="">Seçiniz</option>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      )}
      <div>
        <label className="label" htmlFor="name">{isCompany ? "Yetkili adı soyadı *" : "Adınız soyadınız *"}</label>
        <input id="name" name="name" required autoComplete="name" className="input" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="email">E-posta *</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="input" />
        </div>
        <div>
          <label className="label" htmlFor="phone">Telefon *</label>
          <input id="phone" name="phone" type="tel" required autoComplete="tel" className="input" placeholder="05xx xxx xx xx" />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="password">Şifre * <span className="font-normal text-slate-400">(en az 6 karakter)</span></label>
        <input id="password" name="password" type="password" required minLength={6} autoComplete="new-password" className="input" />
      </div>
      <button disabled={pending} className="btn btn-primary w-full py-3">
        {pending ? "Hesap oluşturuluyor…" : isCompany ? "Firma hesabı oluştur" : "Hesap oluştur"}
      </button>
      <p className="text-center text-sm text-slate-500">
        Zaten hesabınız var mı?{" "}
        <Link href={`/giris${isCompany ? "?tip=firma" : ""}`} className="font-semibold text-blue-600 hover:underline">
          Giriş yapın
        </Link>
      </p>
    </form>
  );
}
