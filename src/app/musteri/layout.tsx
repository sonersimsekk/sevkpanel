import AppShell from "@/components/AppShell";
import { AutoRefresh } from "@/components/client";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function CustomerLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole("CUSTOMER");
  const quoted = await db.shipment.count({ where: { customerId: session.userId, status: "QUOTED" } });
  return (
    <AppShell role="CUSTOMER" userName={session.name} subtitle="Müşteri" pendingCount={quoted}>
      <AutoRefresh seconds={45} />
      {children}
    </AppShell>
  );
}
