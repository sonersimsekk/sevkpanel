"use client";

import { useActionState } from "react";
import { addStaff, addVehicle } from "@/app/actions/dispatch";
import { STAFF_ROLES, VEHICLE_TYPES } from "@/lib/constants";
import { SubmitButton } from "./client";
import { Alert } from "./ui";
import { PlusIcon } from "./Icons";

export function AddVehicleForm() {
  const [state, action] = useActionState(addVehicle, undefined);
  return (
    <form action={action} className="space-y-3">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      {state?.ok && <Alert tone="success">{state.ok}</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="plate">Plaka *</label>
          <input id="plate" name="plate" required className="input uppercase" placeholder="34 ABC 123" />
        </div>
        <div>
          <label className="label" htmlFor="type">Araç tipi *</label>
          <select id="type" name="type" required className="input" defaultValue="">
            <option value="" disabled>
              Seçin
            </option>
            {VEHICLE_TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="capacity">Kapasite</label>
          <input id="capacity" name="capacity" className="input" placeholder="Örn. 40 m³ / 10 ton" />
        </div>
        <div>
          <label className="label" htmlFor="vnote">Not</label>
          <input id="vnote" name="note" className="input" placeholder="İsteğe bağlı" />
        </div>
      </div>
      <SubmitButton className="btn btn-primary w-full" pendingText="Ekleniyor…">
        <PlusIcon className="h-4 w-4" /> Araç ekle
      </SubmitButton>
    </form>
  );
}

export function AddStaffForm() {
  const [state, action] = useActionState(addStaff, undefined);
  return (
    <form action={action} className="space-y-3">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      {state?.ok && <Alert tone="success">{state.ok}</Alert>}
      <div>
        <label className="label" htmlFor="sname">Ad soyad *</label>
        <input id="sname" name="name" required className="input" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="role">Görev *</label>
          <select id="role" name="role" required className="input" defaultValue="">
            <option value="" disabled>
              Seçin
            </option>
            {STAFF_ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="sphone">Telefon</label>
          <input id="sphone" name="phone" type="tel" className="input" placeholder="05xx…" />
        </div>
      </div>
      <SubmitButton className="btn btn-primary w-full" pendingText="Ekleniyor…">
        <PlusIcon className="h-4 w-4" /> Personel ekle
      </SubmitButton>
    </form>
  );
}
