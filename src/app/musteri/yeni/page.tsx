import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { dayKey } from "@/lib/format";
import { EmptyState, PageHeader } from "@/components/ui";
import NewRequestForm from "@/components/NewRequestForm";
import { BuildingIcon } from "@/components/Icons";

export const metadata = { title: "Yeni sevkiyat talebi" };

export default async function NewRequestPage() {
  const session = await requireRole("CUSTOMER");
  const [user, companies] = await Promise.all([
    db.user.findUnique({ where: { id: session.userId }, select: { phone: true } }),
    db.company.findMany({ select: { id: true, name: true, city: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        back="/musteri"
        title="Yeni sevkiyat talebi"
        subtitle="Yük ve güzergah bilgilerini ne kadar eksiksiz girerseniz, firma o kadar doğru fiyat verir."
      />
      {companies.length === 0 ? (
        <EmptyState
          icon={<BuildingIcon className="h-7 w-7" />}
          title="Henüz kayıtlı lojistik firması yok"
          text="Bir firma kaydolduğunda talep gönderebilirsiniz."
        />
      ) : (
        <NewRequestForm companies={companies} defaultPhone={user?.phone ?? ""} minDate={dayKey(new Date())} />
      )}
    </div>
  );
}
