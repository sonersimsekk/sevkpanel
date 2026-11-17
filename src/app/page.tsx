import Link from "next/link";
import { getSession, homeFor } from "@/lib/auth";
import { APP_NAME } from "@/lib/constants";
import {
  ArrowRightIcon,
  BuildingIcon,
  CalendarIcon,
  CheckIcon,
  MessageIcon,
  PackageIcon,
  PhoneIcon,
  TruckIcon,
  UserIcon,
  WalletIcon,
} from "@/components/Icons";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white">
              <TruckIcon className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
          </Link>
          {session ? (
            <Link href={homeFor(session.role)} className="btn btn-primary">
              Panele git <ArrowRightIcon className="h-4 w-4" />
            </Link>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link href="/giris?tip=firma" className="btn btn-ghost hidden sm:inline-flex">
                Firma girişi
              </Link>
              <Link href="/giris" className="btn btn-secondary">
                Giriş yap
              </Link>
            </div>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/80 to-white">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 sm:pt-20 lg:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
              <PhoneIcon className="h-3.5 w-3.5" /> Telefon trafiğine son
            </span>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Sevkiyatlarınız artık <span className="text-blue-600">tek panelde</span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-slate-600">
              Müşteriler yük ve güzergah bilgilerini birkaç dakikada girer, talep panelinize düşer. Siz de fiyat verir, araç ve
              şoför atar, sevkiyatı teslim edilene kadar tek yerden takip edersiniz.
            </p>
          </div>

          <div className="mx-auto mt-12 grid max-w-4xl gap-5 md:grid-cols-2">
            <div className="card flex flex-col p-6 sm:p-8">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <UserIcon className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-xl font-bold">Yük mü göndereceksiniz?</h2>
              <p className="mt-1 flex-1 text-sm text-slate-600">
                Arayıp tek tek anlatmaya gerek yok. Sevkiyat talebinizi gönderin, fiyat teklifi panelinize gelsin.
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link href="/kayit" className="btn btn-success flex-1">
                  Talep oluştur
                </Link>
                <Link href="/giris" className="btn btn-secondary flex-1">
                  Müşteri girişi
                </Link>
              </div>
            </div>
            <div className="card flex flex-col p-6 sm:p-8">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600">
                <BuildingIcon className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-xl font-bold">Lojistik firması mısınız?</h2>
              <p className="mt-1 flex-1 text-sm text-slate-600">
                Talepleri, teklifleri, araç ve ekip planlamasını tek ekrandan yönetin.
              </p>
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">
                <Link href="/kayit?tip=firma" className="btn btn-primary flex-1">
                  Firma kaydı
                </Link>
                <Link href="/giris?tip=firma" className="btn btn-secondary flex-1">
                  Firma girişi
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nasıl çalışır */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Nasıl çalışır?</h2>
        <div className="mt-10 grid gap-6 md:grid-cols-4">
          {[
            { icon: <PackageIcon />, t: "Talep gönderilir", d: "Müşteri yük cinsi, ağırlık, yükleme ve teslim noktası bilgilerini girer." },
            { icon: <WalletIcon />, t: "Fiyat verilir", d: "Firma talebi panelde görür ve teklifini iletir." },
            { icon: <CheckIcon />, t: "Onaylanır", d: "Müşteri teklifi tek tıkla kabul eder ya da reddeder." },
            { icon: <CalendarIcon />, t: "Yola çıkar", d: "Araç ve şoför atanır, sevkiyat teslim edilene kadar takip edilir." },
          ].map((s, i) => (
            <div key={s.t} className="rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white">{s.icon}</span>
                <span className="text-sm font-semibold text-slate-400">Adım {i + 1}</span>
              </div>
              <h3 className="mt-4 font-semibold">{s.t}</h3>
              <p className="mt-1 text-sm text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 flex items-center justify-center gap-2 text-sm text-slate-500">
          <MessageIcon className="h-4 w-4" /> Her talepte müşteri ile firma arasında mesajlaşma da var.
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8 text-center text-sm text-slate-400">
        © {new Date().getFullYear()} {APP_NAME}
      </footer>
    </div>
  );
}
