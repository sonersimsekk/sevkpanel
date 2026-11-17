const TZ = "Europe/Istanbul";

export function fmtDate(d: Date | string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "long", year: "numeric", timeZone: TZ }).format(new Date(d));
}

export function fmtDateShort(d: Date | string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", weekday: "short", timeZone: TZ }).format(new Date(d));
}

export function fmtDateTime(d: Date | string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(d));
}

export function fmtDayMon(d: Date | string) {
  return new Intl.DateTimeFormat("tr-TR", { day: "numeric", month: "short", timeZone: TZ }).format(new Date(d));
}

export function fmtTime(d: Date | string) {
  return new Intl.DateTimeFormat("tr-TR", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(d));
}

export function fmtMoney(n: number) {
  return new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 }).format(n);
}

/** İstanbul saatine göre YYYY-MM-DD */
export function dayKey(d: Date | string) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date(d));
}

export function timeKey(d: Date | string) {
  return new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ }).format(new Date(d));
}

export function relTime(d: Date | string) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000;
  if (diff < 60) return "az önce";
  if (diff < 3600) return `${Math.floor(diff / 60)} dk önce`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} saat önce`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)} gün önce`;
  return fmtDate(d);
}

/** "YYYY-MM-DD" + "HH:MM" (İstanbul saati, UTC+3) -> Date */
export function parseLocal(date: string, time = "12:00") {
  return new Date(`${date}T${time}:00+03:00`);
}

type SummaryInput = {
  cargoType: string;
  cargoWeight: number | null;
  palletCount: number | null;
};

export function fmtWeight(kg: number) {
  return kg >= 1000 ? `${(kg / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} ton` : `${kg} kg`;
}

/** Liste satırları için kısa yük özeti: "Paletli yük · 1,8 ton · 4 palet" */
export function jobSummary(r: SummaryInput) {
  return [r.cargoType, r.cargoWeight && fmtWeight(r.cargoWeight), r.palletCount && `${r.palletCount} palet`].filter(Boolean).join(" · ");
}

export function whatsappLink(phone: string) {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = "9" + digits;
  else if (digits.length === 10 && digits.startsWith("5")) digits = "90" + digits;
  return `https://wa.me/${digits}`;
}
