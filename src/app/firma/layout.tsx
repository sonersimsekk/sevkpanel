import AppShell from "@/components/AppShell";
import { AutoRefresh } from "@/components/client";
import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function CompanyLayout({ children }: { children: React.ReactNode }) {
  const { session, company } = await requireCompany();
  const pending = await db.shipment.count({ where: { companyId: company.id, status: "PENDING" } });
  return (
    <AppShell role="COMPANY" userName={session.name} subtitle={company.name} pendingCount={pending}>
      <AutoRefresh seconds={30} />
      {children}
    </AppShell>
  );
}
