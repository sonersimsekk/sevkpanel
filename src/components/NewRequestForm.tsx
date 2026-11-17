"use client";

import { createRequest } from "@/app/actions/requests";
import { CARGO_TYPES, CITIES, VEHICLE_TYPES } from "@/lib/constants";
import { useKeepForm } from "./client";
import { Alert } from "./ui";
import { BuildingIcon, CalendarIcon, CheckIcon, MapPinIcon, PackageIcon, PhoneIcon } from "./Icons";

type Company = { id: string; name: string; city: string | null };

export default function NewRequestForm({
  companies,
  defaultPhone,
  minDate,
}: {
  companies: Company[];
  defaultPhone: string;
  minDate: string;
}) {
  const { state, pending, onSubmit } = useKeepForm(createRequest);

  return (
    <form method="post" onSubmit={onSubmit} className="space-y-5">
      {state?.error && <Alert tone="error">{state.error}</Alert>}

      <Section icon={<PackageIcon />} title="Yük bilgileri">
        {companies.length > 1 ? (
          <div>
            <label className="label" htmlFor="companyId">Lojistik firması *</label>
            <select id="companyId" name="companyId" required className="input" defaultValue="">
              <option value="" disabled>
                Firma seçin
              </option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.city ? ` (${c.city})` : ""}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <>
            <input type="hidden" name="companyId" value={companies[0]?.id ?? ""} />
            <p className="flex items-center gap-2 text-sm text-slate-600">
              <BuildingIcon className="h-4 w-4" /> Talebiniz <b>{companies[0]?.name}</b> firmasına iletilecek.
            </p>
          </>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="cargoType">Yük cinsi *</label>
            <select id="cargoType" name="cargoType" required className="input" defaultValue="">
              <option value="" disabled>
                Seçin
              </option>
              {CARGO_TYPES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="vehicleType">İstenen araç tipi</label>
            <select id="vehicleType" name="vehicleType" className="input" defaultValue="">
              <option value="">Fark etmez / firma önersin</option>
              {VEHICLE_TYPES.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label" htmlFor="cargoWeight">Ağırlık (kg)</label>
            <input id="cargoWeight" name="cargoWeight" inputMode="numeric" className="input" placeholder="1500" />
          </div>
          <div>
            <label className="label" htmlFor="palletCount">Palet</label>
            <input id="palletCount" name="palletCount" type="number" min={0} className="input" placeholder="0" />
          </div>
          <div>
            <label className="label" htmlFor="cargoVolume">Hacim (m³)</label>
            <input id="cargoVolume" name="cargoVolume" inputMode="decimal" className="input" placeholder="12" />
          </div>
        </div>
        <p className="text-xs text-slate-500">Ağırlık ve hacim yaklaşık olabilir; ne kadar doğru girerseniz araç seçimi o kadar isabetli olur.</p>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <AddressSection prefix="from" title="Yükleme noktası" color="text-blue-600 bg-blue-50" />
        <AddressSection prefix="to" title="Teslim noktası" color="text-emerald-600 bg-emerald-50" />
      </div>

      <Section icon={<CalendarIcon />} title="Tarih ve ek hizmetler">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="loadDate">Yükleme tarihi *</label>
            <input id="loadDate" name="loadDate" type="date" min={minDate} required className="input" />
          </div>
          <div className="flex items-end">
            <Check name="flexibleDate" label="Tarihim esnek" hint="Birkaç gün oynayabilir" />
          </div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Check name="loadingHelp" label="Yükleme / indirme" hint="Firma personeli yüklesin, indirsin" />
          <Check name="forklift" label="Forklift / rampa var" hint="Yükleme noktasında mevcut" />
          <Check name="packing" label="Ambalaj / streç" hint="Yük firma tarafından ambalajlansın" />
          <Check name="insurance" label="Sigortalı sevkiyat" hint="Yük sigortalansın" />
        </div>
        <div>
          <label className="label" htmlFor="items">Yük açıklaması ve notlar</label>
          <textarea
            id="items"
            name="items"
            rows={4}
            className="input"
            placeholder="Örn. 4 palet ambalajlı ürün, istiflenebilir. Teslim noktası 08:00-17:00 arası açık. İrsaliye hazır."
          />
        </div>
      </Section>

      <Section icon={<PhoneIcon />} title="İletişim">
        <div className="max-w-sm">
          <label className="label" htmlFor="contactPhone">Telefon numaranız *</label>
          <input id="contactPhone" name="contactPhone" type="tel" required defaultValue={defaultPhone} className="input" />
          <p className="mt-1 text-xs text-slate-500">Firma gerekirse bu numaradan size ulaşır.</p>
        </div>
      </Section>

      <div className="sticky bottom-20 z-10 lg:bottom-4">
        <button disabled={pending} className="btn btn-primary w-full py-3.5 text-base shadow-lg shadow-blue-600/20">
          {pending ? "Gönderiliyor…" : "Sevkiyat talebini gönder"}
        </button>
      </div>
    </form>
  );
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-semibold">
        <span className="text-slate-400">{icon}</span>
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function AddressSection({ prefix, title, color }: { prefix: "from" | "to"; title: string; color: string }) {
  return (
    <section className="card p-5 sm:p-6">
      <h2 className="mb-4 flex items-center gap-2 font-semibold">
        <span className={`grid h-7 w-7 place-items-center rounded-lg ${color}`}>
          <MapPinIcon className="h-4 w-4" />
        </span>
        {title}
      </h2>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor={`${prefix}City`}>İl *</label>
            <select id={`${prefix}City`} name={`${prefix}City`} required className="input" defaultValue="İstanbul">
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor={`${prefix}District`}>İlçe *</label>
            <input id={`${prefix}District`} name={`${prefix}District`} required className="input" placeholder="Örn. Tuzla" />
          </div>
        </div>
        <div>
          <label className="label" htmlFor={`${prefix}Address`}>Açık adres *</label>
          <textarea
            id={`${prefix}Address`}
            name={`${prefix}Address`}
            rows={2}
            required
            className="input"
            placeholder="Firma / depo adı, OSB, sokak, kapı no"
          />
        </div>
      </div>
    </section>
  );
}

function Check({ name, label, hint }: { name: string; label: string; hint?: string }) {
  return (
    <label className="group flex w-full cursor-pointer items-start gap-3 rounded-xl border border-slate-300 bg-white p-3 transition has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
      <input type="checkbox" name={name} className="peer sr-only" />
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border border-slate-300 bg-white text-transparent transition peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:text-white">
        <CheckIcon className="h-3.5 w-3.5" />
      </span>
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {hint && <span className="block text-xs text-slate-500">{hint}</span>}
      </span>
    </label>
  );
}
