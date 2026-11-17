export const APP_NAME = "SevkPanel";

export type Status = "PENDING" | "QUOTED" | "ACCEPTED" | "REJECTED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";

export const STATUS: Record<Status, { label: string; badge: string; dot: string }> = {
  PENDING: { label: "Teklif Bekliyor", badge: "bg-amber-50 text-amber-800 ring-amber-200", dot: "bg-amber-500" },
  QUOTED: { label: "Teklif Verildi", badge: "bg-blue-50 text-blue-800 ring-blue-200", dot: "bg-blue-500" },
  ACCEPTED: { label: "Onaylandı", badge: "bg-emerald-50 text-emerald-800 ring-emerald-200", dot: "bg-emerald-500" },
  REJECTED: { label: "Teklif Reddedildi", badge: "bg-rose-50 text-rose-800 ring-rose-200", dot: "bg-rose-500" },
  IN_PROGRESS: { label: "Yolda", badge: "bg-violet-50 text-violet-800 ring-violet-200", dot: "bg-violet-500" },
  COMPLETED: { label: "Teslim Edildi", badge: "bg-slate-100 text-slate-700 ring-slate-200", dot: "bg-slate-500" },
  CANCELLED: { label: "İptal Edildi", badge: "bg-slate-50 text-slate-500 ring-slate-200", dot: "bg-slate-300" },
};

export const STATUS_ORDER: Status[] = ["PENDING", "QUOTED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "REJECTED", "CANCELLED"];

export const CARGO_TYPES = [
  "Paletli yük",
  "Koli / parça eşya",
  "Makine / ekipman",
  "İnşaat malzemesi",
  "Gıda (kuru)",
  "Soğuk zincir",
  "Ticari mobilya",
  "Tekstil",
  "Diğer",
];

export const VEHICLE_TYPES = ["Panelvan", "Kamyonet", "Kamyon", "Kırkayak", "TIR", "Frigorifik"];

export const STAFF_ROLES = ["Şoför", "Yükleme personeli", "Operasyon sorumlusu"];

/** Planlamada (araç/ekip meşgul sayılan) aktif sevkiyat durumları */
export const DISPATCH_STATUSES = ["ACCEPTED", "IN_PROGRESS", "COMPLETED"];

export const CITIES = [
  "Adana", "Adıyaman", "Afyonkarahisar", "Ağrı", "Aksaray", "Amasya", "Ankara", "Antalya", "Ardahan", "Artvin",
  "Aydın", "Balıkesir", "Bartın", "Batman", "Bayburt", "Bilecik", "Bingöl", "Bitlis", "Bolu", "Burdur", "Bursa",
  "Çanakkale", "Çankırı", "Çorum", "Denizli", "Diyarbakır", "Düzce", "Edirne", "Elazığ", "Erzincan", "Erzurum",
  "Eskişehir", "Gaziantep", "Giresun", "Gümüşhane", "Hakkari", "Hatay", "Iğdır", "Isparta", "İstanbul", "İzmir",
  "Kahramanmaraş", "Karabük", "Karaman", "Kars", "Kastamonu", "Kayseri", "Kilis", "Kırıkkale", "Kırklareli",
  "Kırşehir", "Kocaeli", "Konya", "Kütahya", "Malatya", "Manisa", "Mardin", "Mersin", "Muğla", "Muş", "Nevşehir",
  "Niğde", "Ordu", "Osmaniye", "Rize", "Sakarya", "Samsun", "Şanlıurfa", "Siirt", "Sinop", "Şırnak", "Sivas",
  "Tekirdağ", "Tokat", "Trabzon", "Tunceli", "Uşak", "Van", "Yalova", "Yozgat", "Zonguldak",
];
