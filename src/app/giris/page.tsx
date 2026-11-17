import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";
import AuthLayout from "@/components/AuthLayout";
import { LoginForm } from "@/components/AuthForms";

export const metadata = { title: "Giriş yap" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ tip?: string }> }) {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));
  const isCompany = (await searchParams).tip === "firma";

  return (
    <AuthLayout
      isCompany={isCompany}
      mode="giris"
      title={isCompany ? "Firma girişi" : "Müşteri girişi"}
      subtitle={isCompany ? "Gelen talepleri görüntüleyin ve fiyat verin." : "Sevkiyat talebi oluşturun ve tekliflerinizi takip edin."}
    >
      <LoginForm isCompany={isCompany} />
      <div className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-3 text-xs text-slate-600">
        <p className="font-semibold text-slate-700">Demo hesap</p>
        <p className="mt-1">
          {isCompany ? "firma@demo.com" : "musteri@demo.com"} · şifre: <span className="font-mono">demo1234</span>
        </p>
      </div>
    </AuthLayout>
  );
}
