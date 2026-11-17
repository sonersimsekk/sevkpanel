"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { STAFF_ROLES, VEHICLE_TYPES } from "@/lib/constants";
import type { FormState } from "./auth";

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();

async function myCompany() {
  const s = await getSession();
  if (!s || s.role !== "COMPANY") throw new Error("Yetkisiz işlem");
  const company = await db.company.findUnique({ where: { ownerId: s.userId } });
  if (!company) throw new Error("Firma bulunamadı");
  return company;
}

function refresh() {
  revalidatePath("/firma", "layout");
  revalidatePath("/musteri", "layout");
}

/* ---------------- Araçlar ---------------- */

export async function addVehicle(_prev: FormState, fd: FormData): Promise<FormState> {
  const company = await myCompany();
  const plate = str(fd, "plate").toLocaleUpperCase("tr").replace(/\s+/g, " ");
  const type = str(fd, "type");
  if (!plate) return { error: "Plaka zorunludur." };
  if (!VEHICLE_TYPES.includes(type)) return { error: "Araç tipini seçin." };
  const exists = await db.vehicle.findFirst({ where: { companyId: company.id, plate } });
  if (exists) return { error: "Bu plaka zaten kayıtlı." };
  await db.vehicle.create({
    data: { companyId: company.id, plate, type, capacity: str(fd, "capacity") || null, note: str(fd, "note") || null },
  });
  refresh();
  return { ok: `${plate} eklendi.` };
}

export async function toggleVehicle(id: string) {
  const company = await myCompany();
  const v = await db.vehicle.findFirst({ where: { id, companyId: company.id } });
  if (!v) return;
  await db.vehicle.update({ where: { id }, data: { active: !v.active } });
  refresh();
}

export async function deleteVehicle(id: string) {
  const company = await myCompany();
  await db.vehicle.deleteMany({ where: { id, companyId: company.id } });
  refresh();
}

/* ---------------- Personel ---------------- */

export async function addStaff(_prev: FormState, fd: FormData): Promise<FormState> {
  const company = await myCompany();
  const name = str(fd, "name");
  const role = str(fd, "role");
  if (!name) return { error: "Ad soyad zorunludur." };
  if (!STAFF_ROLES.includes(role)) return { error: "Görevi seçin." };
  await db.staff.create({ data: { companyId: company.id, name, role, phone: str(fd, "phone") || null } });
  refresh();
  return { ok: `${name} eklendi.` };
}

export async function toggleStaff(id: string) {
  const company = await myCompany();
  const s = await db.staff.findFirst({ where: { id, companyId: company.id } });
  if (!s) return;
  await db.staff.update({ where: { id }, data: { active: !s.active } });
  refresh();
}

export async function deleteStaff(id: string) {
  const company = await myCompany();
  await db.staff.deleteMany({ where: { id, companyId: company.id } });
  refresh();
}

/* ---------------- Atama ---------------- */

export async function assignResources(requestId: number, fd: FormData) {
  const company = await myCompany();
  const req = await db.shipment.findFirst({ where: { id: requestId, companyId: company.id } });
  if (!req) throw new Error("Talep bulunamadı");

  const vehicleIds = fd.getAll("vehicle").map(String);
  const staffIds = fd.getAll("staff").map(String);
  // Yalnızca bu firmaya ait kayıtlar atanabilir
  const [vehicles, staff] = await Promise.all([
    db.vehicle.findMany({ where: { id: { in: vehicleIds }, companyId: company.id }, select: { id: true } }),
    db.staff.findMany({ where: { id: { in: staffIds }, companyId: company.id }, select: { id: true } }),
  ]);

  await db.shipment.update({
    where: { id: requestId },
    data: { vehicles: { set: vehicles }, staff: { set: staff } },
  });
  refresh();
}
