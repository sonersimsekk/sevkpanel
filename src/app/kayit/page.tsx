import { redirect } from "next/navigation";
import { getSession, homeFor } from "@/lib/auth";
import AuthLayout from "@/components/AuthLayout";
import { RegisterForm } from "@/components/AuthForms";

export const metadata = { title: "Kayıt ol" };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ tip?: string }> }) {
  const session = await getSession();
  if (session) redirect(homeFor(session.role));
  const isCompany = (await searchParams).tip === "firma";

  return (
    <AuthLayout
      isCompany={isCompany}
      mode="kayit"
      title={isCompany ? "Firmanızı kaydedin" : "Hesap oluşturun"}
      subtitle={
        isCompany
          ? "Müşterileriniz talebini panelden göndersin, telefon trafiğinden kurtulun."
          : "Birkaç dakikada sevkiyat talebinizi iletin, fiyatı panelden görün."
      }
    >
      <RegisterForm isCompany={isCompany} />
    </AuthLayout>
  );
}
