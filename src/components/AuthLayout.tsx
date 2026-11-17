import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { BuildingIcon, TruckIcon, UserIcon } from "./Icons";

export default function AuthLayout({
  isCompany,
  mode,
  title,
  subtitle,
  children,
}: {
  isCompany: boolean;
  mode: "giris" | "kayit";
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const tab = (company: boolean) =>
    `flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
      isCompany === company ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"
    }`;
  return (
    <div className="flex min-h-dvh flex-col bg-gradient-to-br from-blue-50 via-slate-50 to-white">
      <header className="mx-auto flex w-full max-w-6xl items-center px-4 py-5 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white">
            <TruckIcon className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-12 pt-4 sm:items-center">
        <div className="w-full max-w-md">
          <div className="mb-5 flex rounded-xl bg-slate-200/70 p-1">
            <Link href={`/${mode}`} className={tab(false)}>
              <UserIcon className="h-4 w-4" /> Müşteri
            </Link>
            <Link href={`/${mode}?tip=firma`} className={tab(true)}>
              <BuildingIcon className="h-4 w-4" /> Lojistik Firması
            </Link>
          </div>
          <div className="card p-6 sm:p-8">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="mb-6 mt-1 text-sm text-slate-500">{subtitle}</p>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
