"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { parseLocal, dayKey } from "@/lib/format";
import { CARGO_TYPES, VEHICLE_TYPES, type Status } from "@/lib/constants";
import type { FormState } from "./auth";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const bool = (fd: FormData, key: string) => fd.get(key) === "on";

/** Pozitif sayı ya da null ("1.250,5" gibi Türkçe yazımı da kabul eder) */
function positive(fd: FormData, key: string, integer = false) {
  const raw = str(fd, key).replace(/\./g, "").replace(",", ".");
  const n = integer ? Math.round(Number(raw)) : Number(raw);
  return raw && Number.isFinite(n) && n > 0 ? n : null;
}

function refresh() {
  revalidatePath("/firma", "layout");
  revalidatePath("/musteri", "layout");
}

async function customerRequest(id: number) {
  const s = await getSession();
  if (!s || s.role !== "CUSTOMER") throw new Error("Yetkisiz işlem");
  const req = await db.shipment.findFirst({ where: { id, customerId: s.userId } });
  if (!req) throw new Error("Talep bulunamadı");
  return { session: s, req };
}

async function companyRequest(id: number) {
  const s = await getSession();
  if (!s || s.role !== "COMPANY") throw new Error("Yetkisiz işlem");
  const company = await db.company.findUnique({ where: { ownerId: s.userId } });
  if (!company) throw new Error("Firma bulunamadı");
  const req = await db.shipment.findFirst({ where: { id, companyId: company.id } });
  if (!req) throw new Error("Talep bulunamadı");
  return { session: s, company, req };
}

/* ---------------- Müşteri ---------------- */

export async function createRequest(_prev: FormState, fd: FormData): Promise<FormState> {
  const s = await getSession();
  if (!s || s.role !== "CUSTOMER") return { error: "Talep oluşturmak için müşteri olarak giriş yapın." };

  if (!CARGO_TYPES.includes(str(fd, "cargoType"))) return { error: "Lütfen yük cinsini seçin." };

  const required = [
    "companyId",
    "fromCity",
    "fromDistrict",
    "fromAddress",
    "toCity",
    "toDistrict",
    "toAddress",
    "loadDate",
    "contactPhone",
  ];
  for (const k of required) if (!str(fd, k)) return { error: "Lütfen zorunlu alanların hepsini doldurun." };

  const company = await db.company.findUnique({ where: { id: str(fd, "companyId") } });
  if (!company) return { error: "Seçilen firma bulunamadı." };

  const date = str(fd, "loadDate");
  if (date < dayKey(new Date())) return { error: "Yükleme tarihi geçmiş bir gün olamaz." };

  const req = await db.shipment.create({
    data: {
      customerId: s.userId,
      companyId: company.id,
      cargoType: str(fd, "cargoType"),
      cargoWeight: positive(fd, "cargoWeight", true),
      palletCount: positive(fd, "palletCount", true),
      cargoVolume: positive(fd, "cargoVolume"),
      vehicleType: VEHICLE_TYPES.includes(str(fd, "vehicleType")) ? str(fd, "vehicleType") : null,
      fromCity: str(fd, "fromCity"),
      fromDistrict: str(fd, "fromDistrict"),
      fromAddress: str(fd, "fromAddress"),
      toCity: str(fd, "toCity"),
      toDistrict: str(fd, "toDistrict"),
      toAddress: str(fd, "toAddress"),
      loadDate: parseLocal(date),
      flexibleDate: bool(fd, "flexibleDate"),
      loadingHelp: bool(fd, "loadingHelp"),
      forklift: bool(fd, "forklift"),
      packing: bool(fd, "packing"),
      insurance: bool(fd, "insurance"),
      items: str(fd, "items") || null,
      contactPhone: str(fd, "contactPhone"),
    },
  });
  refresh();
  redirect(`/musteri/talep/${req.id}?yeni=1`);
}

export async function customerRespond(id: number, decision: "accept" | "reject") {
  const { req } = await customerRequest(id);
  if (req.status !== "QUOTED") return;
  await db.shipment.update({
    where: { id },
    data:
      decision === "accept"
        ? { status: "ACCEPTED", scheduledAt: req.scheduledAt ?? req.loadDate }
        : { status: "REJECTED" },
  });
  refresh();
}

export async function customerCancel(id: number, fd: FormData) {
  const { req } = await customerRequest(id);
  if (!["PENDING", "QUOTED", "ACCEPTED", "REJECTED"].includes(req.status)) return;
  const reason = str(fd, "reason");
  await db.shipment.update({
    where: { id },
    data: { status: "CANCELLED", cancelReason: "Müşteri iptal etti" + (reason ? `: ${reason}` : "") },
  });
  refresh();
}

/* ---------------- Ortak ---------------- */

export async function sendMessage(id: number, _prev: FormState, fd: FormData): Promise<FormState> {
  const s = await getSession();
  if (!s) return { error: "Oturum süresi doldu." };
  const body = str(fd, "body");
  if (!body) return { error: "Mesaj boş olamaz." };
  if (s.role === "CUSTOMER") await customerRequest(id);
  else await companyRequest(id);
  await db.message.create({ data: { requestId: id, senderId: s.userId, body: body.slice(0, 2000) } });
  refresh();
  return { ok: "Gönderildi" };
}

/* ---------------- Firma ---------------- */

export async function sendQuote(id: number, _prev: FormState, fd: FormData): Promise<FormState> {
  const { req } = await companyRequest(id);
  if (!["PENDING", "QUOTED", "REJECTED"].includes(req.status)) return { error: "Bu talep için artık teklif verilemez." };
  const price = Number(str(fd, "price").replace(/\./g, "").replace(",", "."));
  if (!Number.isFinite(price) || price <= 0) return { error: "Geçerli bir fiyat girin." };
  await db.shipment.update({
    where: { id },
    data: { status: "QUOTED", quotePrice: price, quoteNote: str(fd, "note") || null, quotedAt: new Date() },
  });
  refresh();
  return { ok: "Teklif müşteriye gönderildi." };
}

const TRANSITIONS: Partial<Record<Status, Status[]>> = {
  ACCEPTED: ["QUOTED"],
  IN_PROGRESS: ["ACCEPTED"],
  COMPLETED: ["IN_PROGRESS", "ACCEPTED"],
  CANCELLED: ["PENDING", "QUOTED", "ACCEPTED", "REJECTED", "IN_PROGRESS"],
};

export async function companySetStatus(id: number, status: Status, fd: FormData) {
  const { req } = await companyRequest(id);
  if (!TRANSITIONS[status]?.includes(req.status as Status)) return;
  const reason = str(fd, "reason");
  await db.shipment.update({
    where: { id },
    data: {
      status,
      ...(status === "ACCEPTED" ? { scheduledAt: req.scheduledAt ?? req.loadDate } : {}),
      ...(status === "CANCELLED" ? { cancelReason: "Firma iptal etti" + (reason ? `: ${reason}` : "") } : {}),
    },
  });
  refresh();
}

export async function companySchedule(id: number, fd: FormData) {
  await companyRequest(id);
  const date = str(fd, "date");
  if (!date) return;
  await db.shipment.update({ where: { id }, data: { scheduledAt: parseLocal(date, str(fd, "time") || "09:00") } });
  refresh();
}

export async function saveInternalNote(id: number, fd: FormData) {
  await companyRequest(id);
  await db.shipment.update({ where: { id }, data: { internalNote: str(fd, "note") || null } });
  refresh();
}
