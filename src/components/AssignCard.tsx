import Link from "next/link";
import type { Staff, Vehicle } from "@prisma/client";
import { assignResources } from "@/app/actions/dispatch";
import { fmtTime } from "@/lib/format";
import type { Busy } from "@/lib/dispatch";
import { SubmitButton } from "./client";
import { AlertIcon, CheckIcon, RouteIcon, TruckIcon, UsersIcon } from "./Icons";

export default function AssignCard({
  requestId,
  vehicles,
  staff,
  assignedVehicleIds,
  assignedStaffIds,
  busyVehicles,
  busyStaff,
  wantedVehicleType,
  readOnly,
}: {
  requestId: number;
  vehicles: Vehicle[];
  staff: Staff[];
  assignedVehicleIds: string[];
  assignedStaffIds: string[];
  busyVehicles: Map<string, Busy[]>;
  busyStaff: Map<string, Busy[]>;
  wantedVehicleType?: string | null;
  readOnly?: boolean;
}) {
  const av = new Set(assignedVehicleIds);
  const as = new Set(assignedStaffIds);
  // Pasif ama zaten atanmış olanlar da listede kalsın
  const vList = vehicles.filter((v) => v.active || av.has(v.id));
  const sList = staff.filter((s) => s.active || as.has(s.id));

  const busyText = (b?: Busy[]) => (b?.length ? `Aynı gün: ${b.map((x) => `#${x.id} ${fmtTime(x.time)}`).join(", ")}` : null);

  if (readOnly) {
    const v = vehicles.filter((x) => av.has(x.id));
    const s = staff.filter((x) => as.has(x.id));
    return (
      <div className="card p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <RouteIcon className="h-5 w-5 text-slate-400" /> Araç ve ekip
        </h2>
        {v.length + s.length === 0 ? (
          <p className="text-sm text-slate-500">Araç / ekip atanmamıştı.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {v.map((x) => (
              <span key={x.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                <TruckIcon className="h-4 w-4 text-slate-400" /> {x.plate} · {x.type}
              </span>
            ))}
            {s.map((x) => (
              <span key={x.id} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700">
                <UsersIcon className="h-4 w-4 text-slate-400" /> {x.name} · {x.role}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <form id="sevkiyat" action={assignResources.bind(null, requestId)} className="card scroll-mt-20 overflow-hidden">
      <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-5 py-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <RouteIcon className="h-5 w-5 text-slate-400" /> Araç ve ekip ataması
        </h2>
        <Link href="/firma/sevkiyat/filo" className="text-xs font-medium text-blue-600 hover:underline">
          Filoyu yönet
        </Link>
      </div>
      <div className="grid gap-x-6 gap-y-5 p-5 md:grid-cols-2">
        <fieldset className="min-w-0">
          <legend className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <TruckIcon className="h-4 w-4" /> Araçlar
            {wantedVehicleType && <span className="font-normal normal-case tracking-normal text-slate-400">(istenen: {wantedVehicleType})</span>}
          </legend>
          {vList.length === 0 ? (
            <p className="text-sm text-slate-500">
              Kayıtlı araç yok.{" "}
              <Link href="/firma/sevkiyat/filo" className="font-medium text-blue-600 hover:underline">
                Araç ekleyin
              </Link>
            </p>
          ) : (
            <div className="space-y-2">
              {vList.map((v) => (
                <Option
                  key={v.id}
                  name="vehicle"
                  value={v.id}
                  checked={av.has(v.id)}
                  title={v.plate}
                  sub={`${v.type}${v.capacity ? ` · ${v.capacity}` : ""}${v.active ? "" : " · pasif"}`}
                  match={!!wantedVehicleType && v.type === wantedVehicleType}
                  warn={busyText(busyVehicles.get(v.id))}
                />
              ))}
            </div>
          )}
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <UsersIcon className="h-4 w-4" /> Ekip
          </legend>
          {sList.length === 0 ? (
            <p className="text-sm text-slate-500">
              Kayıtlı personel yok.{" "}
              <Link href="/firma/sevkiyat/filo" className="font-medium text-blue-600 hover:underline">
                Personel ekleyin
              </Link>
            </p>
          ) : (
            <div className="space-y-2">
              {sList.map((s) => (
                <Option
                  key={s.id}
                  name="staff"
                  value={s.id}
                  checked={as.has(s.id)}
                  title={s.name}
                  sub={`${s.role}${s.active ? "" : " · pasif"}`}
                  warn={busyText(busyStaff.get(s.id))}
                />
              ))}
            </div>
          )}
        </fieldset>
      </div>
      {(vList.length > 0 || sList.length > 0) && (
        <div className="flex flex-col-reverse items-stretch gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
          {vList.some((x) => busyVehicles.has(x.id)) || sList.some((x) => busyStaff.has(x.id)) ? (
            <p className="text-xs text-slate-500">Turuncu uyarı: aynı gün başka bir sevkiyata da atanmış.</p>
          ) : (
            <span />
          )}
          <SubmitButton className="btn btn-primary w-full sm:w-auto">Atamayı kaydet</SubmitButton>
        </div>
      )}
    </form>
  );
}

function Option({
  name,
  value,
  checked,
  title,
  sub,
  warn,
  match,
}: {
  name: string;
  value: string;
  checked: boolean;
  title: string;
  sub: string;
  warn: string | null;
  match?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 transition has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50/60">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="peer sr-only" />
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border border-slate-300 bg-white text-transparent peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white">
        <CheckIcon className="h-3.5 w-3.5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5 text-sm font-semibold text-slate-800">
          {title}
          {match && <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">uygun tip</span>}
        </span>
        <span className="block text-xs text-slate-500">{sub}</span>
        {warn && (
          <span className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-700">
            <AlertIcon className="h-3.5 w-3.5 shrink-0" /> {warn}
          </span>
        )}
      </span>
    </label>
  );
}
