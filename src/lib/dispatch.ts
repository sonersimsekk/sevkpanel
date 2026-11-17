import { db } from "./db";
import { DISPATCH_STATUSES } from "./constants";
import { parseLocal } from "./format";

/** İstanbul saatine göre verilen günün [başlangıç, bitiş) aralığı */
export function dayRange(day: string) {
  const start = parseLocal(day, "00:00");
  return { start, end: new Date(start.getTime() + 86400000) };
}

export type Busy = { id: number; time: Date };

/** O gün planlı işlerde kullanılan araç/personel -> iş listesi */
export async function busyOnDay(companyId: string, day: string, excludeRequestId?: number) {
  const { start, end } = dayRange(day);
  const jobs = await db.shipment.findMany({
    where: {
      companyId,
      status: { in: DISPATCH_STATUSES },
      scheduledAt: { gte: start, lt: end },
      ...(excludeRequestId ? { id: { not: excludeRequestId } } : {}),
    },
    select: { id: true, scheduledAt: true, vehicles: { select: { id: true } }, staff: { select: { id: true } } },
  });
  const vehicles = new Map<string, Busy[]>();
  const staff = new Map<string, Busy[]>();
  for (const j of jobs) {
    const b = { id: j.id, time: j.scheduledAt! };
    for (const v of j.vehicles) vehicles.set(v.id, [...(vehicles.get(v.id) ?? []), b]);
    for (const s of j.staff) staff.set(s.id, [...(staff.get(s.id) ?? []), b]);
  }
  return { vehicles, staff };
}
