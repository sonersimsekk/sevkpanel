import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { APP_NAME } from "@/lib/constants";

const inter = Inter({ subsets: ["latin", "latin-ext"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: `${APP_NAME} — Sevkiyat Yönetim Paneli`,
  description: "Sevkiyat taleplerini telefon trafiği olmadan toplayın, fiyat verin, araç ve ekip planlayın.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={inter.variable}>
      <body className="min-h-dvh bg-slate-50 font-sans text-slate-900 antialiased">{children}</body>
    </html>
  );
}
