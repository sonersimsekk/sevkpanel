"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import { APP_NAME } from "@/lib/constants";
import { HomeIcon, ListIcon, LogOutIcon, PlusIcon, RouteIcon, TruckIcon } from "./Icons";

type NavItem = { href: string; label: string; icon: React.ReactNode; match: (p: string) => boolean; badge?: number };

export default function AppShell({
  role,
  userName,
  subtitle,
  pendingCount = 0,
  children,
}: {
  role: "CUSTOMER" | "COMPANY";
  userName: string;
  subtitle?: string;
  pendingCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const items: NavItem[] =
    role === "COMPANY"
      ? [
          { href: "/firma", label: "Özet", icon: <HomeIcon />, match: (p) => p === "/firma" },
          {
            href: "/firma/talepler",
            label: "Talepler",
            icon: <ListIcon />,
            match: (p) => p.startsWith("/firma/talep"),
            badge: pendingCount,
          },
          { href: "/firma/sevkiyat", label: "Planlama", icon: <RouteIcon />, match: (p) => p === "/firma/sevkiyat" },
          { href: "/firma/sevkiyat/filo", label: "Filo", icon: <TruckIcon />, match: (p) => p.startsWith("/firma/sevkiyat/filo") },
        ]
      : [
          {
            href: "/musteri",
            label: "Sevkiyatlarım",
            icon: <ListIcon />,
            match: (p) => p === "/musteri" || p.startsWith("/musteri/talep"),
            badge: pendingCount,
          },
          { href: "/musteri/yeni", label: "Yeni Sevkiyat", icon: <PlusIcon />, match: (p) => p.startsWith("/musteri/yeni") },
        ];

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-dvh">
      {/* Masaüstü yan menü */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <Link href="/" className="flex h-16 items-center gap-2.5 border-b border-slate-100 px-6">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-600 text-white">
            <TruckIcon className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        </Link>
        <nav className="flex-1 space-y-1 p-4">
          <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {role === "COMPANY" ? "Firma Paneli" : "Müşteri Paneli"}
          </p>
          {items.map((it) => {
            const active = it.match(pathname);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {it.icon}
                <span className="flex-1">{it.label}</span>
                {!!it.badge && (
                  <span className="rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">{it.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center gap-3 rounded-xl p-2">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{userName}</p>
              {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
            </div>
            <form action={logout}>
              <button className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Çıkış yap">
                <LogOutIcon />
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Mobil üst bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur lg:hidden">
        <Link href="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-blue-600 text-white">
            <TruckIcon className="h-4 w-4" />
          </span>
          <span className="font-bold tracking-tight">{APP_NAME}</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="max-w-[9rem] truncate text-sm text-slate-500">{subtitle || userName}</span>
          <form action={logout}>
            <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" title="Çıkış yap" aria-label="Çıkış yap">
              <LogOutIcon />
            </button>
          </form>
        </div>
      </header>

      <main className="px-4 pb-28 pt-6 sm:px-6 lg:ml-64 lg:px-10 lg:pb-12 lg:pt-10">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      {/* Mobil alt menü */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
        <div className="mx-auto flex max-w-md">
          {items.map((it) => {
            const active = it.match(pathname);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium ${
                  active ? "text-blue-600" : "text-slate-500"
                }`}
              >
                {it.icon}
                {it.label}
                {!!it.badge && (
                  <span className="absolute left-1/2 top-1.5 ml-2 min-w-5 rounded-full bg-blue-600 px-1.5 text-[10px] font-bold leading-5 text-white">
                    {it.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
