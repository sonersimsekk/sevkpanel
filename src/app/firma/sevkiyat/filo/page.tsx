import { requireCompany } from "@/lib/auth";
import { db } from "@/lib/db";
import { deleteStaff, deleteVehicle, toggleStaff, toggleVehicle } from "@/app/actions/dispatch";
import { PageHeader } from "@/components/ui";
import { SubmitButton } from "@/components/client";
import { AddStaffForm, AddVehicleForm } from "@/components/DispatchForms";
import { PhoneIcon, TrashIcon, TruckIcon, UsersIcon } from "@/components/Icons";

export const metadata = { title: "Filo" };

const upcoming = { where: { status: { in: ["ACCEPTED", "IN_PROGRESS"] } } };

export default async function FleetPage() {
  const { company } = await requireCompany();
  const [vehicles, staff] = await Promise.all([
    db.vehicle.findMany({
      where: { companyId: company.id },
      orderBy: [{ active: "desc" }, { plate: "asc" }],
      include: { _count: { select: { requests: upcoming } } },
    }),
    db.staff.findMany({
      where: { companyId: company.id },
      orderBy: [{ active: "desc" }, { role: "asc" }, { name: "asc" }],
      include: { _count: { select: { requests: upcoming } } },
    }),
  ]);

  return (
    <>
      <PageHeader title="Filo" subtitle="Sevkiyatlara atayacağınız araçlar ve personel" />

      <div className="grid gap-5 lg:grid-cols-2">
        {/* Araçlar */}
        <section className="min-w-0 space-y-4">
          <div className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <TruckIcon className="h-5 w-5 text-slate-400" /> Yeni araç
            </h2>
            <AddVehicleForm />
          </div>
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold">Araçlar</h2>
              <span className="text-sm text-slate-500">{vehicles.filter((v) => v.active).length} aktif</span>
            </div>
            {vehicles.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">Henüz araç eklenmedi.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {vehicles.map((v) => (
                  <li key={v.id} className={`flex items-center gap-3 px-5 py-3.5 ${v.active ? "" : "bg-slate-50 opacity-60"}`}>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-600">
                      <TruckIcon />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold tracking-wide">{v.plate}</p>
                      <p className="truncate text-xs text-slate-500">
                        {v.type}
                        {v.capacity ? ` · ${v.capacity}` : ""}
                        {v.note ? ` · ${v.note}` : ""}
                      </p>
                      <p className="text-xs text-slate-400">
                        {v.active ? `${v._count.requests} planlı iş` : "Pasif (atanamaz)"}
                      </p>
                    </div>
                    <RowActions
                      active={v.active}
                      toggle={toggleVehicle.bind(null, v.id)}
                      remove={deleteVehicle.bind(null, v.id)}
                      confirmText={`${v.plate} silinsin mi? Geçmiş işlerdeki atamalar da kaldırılır.`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* Personel */}
        <section className="min-w-0 space-y-4">
          <div className="card p-5">
            <h2 className="mb-4 flex items-center gap-2 font-semibold">
              <UsersIcon className="h-5 w-5 text-slate-400" /> Yeni personel
            </h2>
            <AddStaffForm />
          </div>
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h2 className="font-semibold">Ekip</h2>
              <span className="text-sm text-slate-500">{staff.filter((s) => s.active).length} aktif</span>
            </div>
            {staff.length === 0 ? (
              <p className="p-5 text-sm text-slate-500">Henüz personel eklenmedi.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {staff.map((s) => (
                  <li key={s.id} className={`flex items-center gap-3 px-5 py-3.5 ${s.active ? "" : "bg-slate-50 opacity-60"}`}>
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-100 text-sm font-semibold text-slate-600">
                      {s.name
                        .split(" ")
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join("")}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{s.name}</p>
                      <p className="truncate text-xs text-slate-500">
                        {s.role}
                        {s.phone && (
                          <>
                            {" · "}
                            <a href={`tel:${s.phone}`} className="inline-flex items-center gap-0.5 hover:text-blue-600">
                              <PhoneIcon className="h-3 w-3" /> {s.phone}
                            </a>
                          </>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">{s.active ? `${s._count.requests} planlı iş` : "Pasif (atanamaz)"}</p>
                    </div>
                    <RowActions
                      active={s.active}
                      toggle={toggleStaff.bind(null, s.id)}
                      remove={deleteStaff.bind(null, s.id)}
                      confirmText={`${s.name} silinsin mi? Geçmiş işlerdeki atamalar da kaldırılır.`}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </>
  );
}

function RowActions({
  active,
  toggle,
  remove,
  confirmText,
}: {
  active: boolean;
  toggle: () => Promise<void>;
  remove: () => Promise<void>;
  confirmText: string;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <form action={toggle}>
        <SubmitButton className="btn btn-ghost px-2.5 py-1.5 text-xs" pendingText="…">
          {active ? "Pasife al" : "Aktif et"}
        </SubmitButton>
      </form>
      <form action={remove}>
        <SubmitButton className="btn btn-ghost px-2 py-1.5 text-rose-600 hover:bg-rose-50" pendingText="…" confirmText={confirmText}>
          <TrashIcon className="h-4 w-4" />
          <span className="sr-only">Sil</span>
        </SubmitButton>
      </form>
    </div>
  );
}
