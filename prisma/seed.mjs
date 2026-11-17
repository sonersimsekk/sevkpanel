// Demo verileri: `npm run db:seed`
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const days = (n, hour = 9) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(hour, 0, 0, 0);
  return d;
};

async function main() {
  await prisma.vehicle.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.message.deleteMany();
  await prisma.shipment.deleteMany();
  await prisma.company.deleteMany();
  await prisma.user.deleteMany();
  // Sevkiyat numaraları her sıfırlamada 1'den başlasın
  await prisma.$executeRawUnsafe("DELETE FROM sqlite_sequence WHERE name = 'Shipment'");

  const passwordHash = await bcrypt.hash("demo1234", 10);

  const owner = await prisma.user.create({
    data: {
      name: "Ahmet Yıldız",
      email: "firma@demo.com",
      phone: "0532 000 00 01",
      passwordHash,
      role: "COMPANY",
      company: { create: { name: "Yıldız Lojistik", city: "İstanbul", description: "Yurt içi parsiyel ve komple yük sevkiyatı" } },
    },
    include: { company: true },
  });

  await prisma.user.create({
    data: {
      name: "Mehmet Kaya",
      email: "firma2@demo.com",
      phone: "0533 000 00 02",
      passwordHash,
      role: "COMPANY",
      company: { create: { name: "Anadolu Lojistik", city: "Ankara" } },
    },
  });

  const ayse = await prisma.user.create({
    data: { name: "Ayşe Demir", email: "musteri@demo.com", phone: "0544 000 00 03", passwordHash, role: "CUSTOMER" },
  });
  const can = await prisma.user.create({
    data: { name: "Can Öztürk", email: "musteri2@demo.com", phone: "0555 000 00 04", passwordHash, role: "CUSTOMER" },
  });

  const companyId = owner.company.id;

  // Filo ve ekip
  const vehicleData = [
    { plate: "34 YLD 101", type: "Kamyon", capacity: "10 ton" },
    { plate: "34 YLD 202", type: "Kamyonet", capacity: "3,5 ton" },
    { plate: "34 YLD 303", type: "Panelvan", capacity: "1,5 ton" },
    { plate: "34 YLD 404", type: "TIR", capacity: "24 ton" },
    { plate: "34 YLD 505", type: "Frigorifik", capacity: "8 ton", note: "-20 °C'ye kadar" },
  ];
  const v = [];
  for (const d of vehicleData) v.push(await prisma.vehicle.create({ data: { ...d, companyId } }));

  const staffData = [
    { name: "Hasan Çelik", phone: "0532 111 11 11", role: "Şoför" },
    { name: "Murat Aydın", phone: "0532 222 22 22", role: "Şoför" },
    { name: "Ali Koç", phone: "0532 333 33 33", role: "Yükleme personeli" },
    { name: "Okan Şahin", phone: "0532 444 44 44", role: "Yükleme personeli" },
    { name: "Emre Kılıç", phone: "0532 555 55 55", role: "Operasyon sorumlusu" },
  ];
  const s = [];
  for (const d of staffData) s.push(await prisma.staff.create({ data: { ...d, companyId } }));

  // 1 — Fiyat bekliyor
  const r1 = await prisma.shipment.create({
    data: {
      companyId,
      customerId: ayse.id,
      cargoType: "Paletli yük",
      cargoWeight: 2400,
      palletCount: 6,
      vehicleType: "Kamyon",
      fromCity: "İstanbul",
      fromDistrict: "Tuzla",
      fromAddress: "Tuzla Deri OSB, 4. Cad. No:12",
      toCity: "Tekirdağ",
      toDistrict: "Çorlu",
      toAddress: "Çorlu OSB, Demir Tekstil deposu",
      loadDate: days(3),
      loadingHelp: true,
      forklift: true,
      items: "6 palet streçli kumaş topu. Teslim noktası 08:00-17:00 arası açık.",
      contactPhone: "0544 000 00 03",
    },
  });
  await prisma.message.create({
    data: { requestId: r1.id, senderId: ayse.id, body: "Merhaba, aynı gün teslim mümkün mü?" },
  });

  // 2 — Fiyat bekliyor
  await prisma.shipment.create({
    data: {
      companyId,
      customerId: can.id,
      cargoType: "Makine / ekipman",
      cargoWeight: 5200,
      palletCount: 2,
      cargoVolume: 18,
      vehicleType: "Kamyon",
      fromCity: "Kocaeli",
      fromDistrict: "Dilovası",
      fromAddress: "Makine OSB 2. Sok. No:5",
      toCity: "Bursa",
      toDistrict: "Nilüfer",
      toAddress: "Nilüfer OSB, fabrika girişi",
      loadDate: days(4),
      flexibleDate: true,
      insurance: true,
      forklift: true,
      items: "CNC tezgahı (yaklaşık 4,5 ton) ve 2 palet yedek parça.",
      contactPhone: "0555 000 00 04",
    },
  });

  // 3 — Teklif verildi
  await prisma.shipment.create({
    data: {
      companyId,
      customerId: ayse.id,
      cargoType: "Koli / parça eşya",
      cargoWeight: 600,
      vehicleType: "Panelvan",
      fromCity: "İstanbul",
      fromDistrict: "Esenyurt",
      fromAddress: "Depo A, kapı 4",
      toCity: "İstanbul",
      toDistrict: "Kadıköy",
      toAddress: "Bahariye Cad. No:40 (mağaza)",
      loadDate: days(2),
      loadingHelp: true,
      items: "40 koli hazır giyim.",
      contactPhone: "0544 000 00 03",
      status: "QUOTED",
      quotePrice: 3500,
      quoteNote: "Panelvan, 1 şoför + 1 yükleme personeli. KDV dahil.",
      quotedAt: days(-1),
    },
  });

  // 4 — Bugün, araç atanmış
  await prisma.shipment.create({
    data: {
      companyId,
      customerId: can.id,
      cargoType: "Paletli yük",
      cargoWeight: 1800,
      palletCount: 4,
      vehicleType: "Kamyonet",
      fromCity: "İstanbul",
      fromDistrict: "Tuzla",
      fromAddress: "Organize Sanayi Bölgesi 3. Cad. No:14",
      toCity: "Kocaeli",
      toDistrict: "Gebze",
      toAddress: "Plastikçiler OSB, depo 7",
      loadDate: days(0, 10),
      loadingHelp: true,
      forklift: true,
      items: "Ambalajlı plastik ürünler.",
      contactPhone: "0555 000 00 04",
      status: "ACCEPTED",
      quotePrice: 6000,
      quotedAt: days(-3),
      scheduledAt: days(0, 10),
      vehicles: { connect: [{ id: v[1].id }] },
      staff: { connect: [{ id: s[1].id }] },
    },
  });

  // 5 — Bugün, araç atanmamış
  await prisma.shipment.create({
    data: {
      companyId,
      customerId: ayse.id,
      cargoType: "Gıda (kuru)",
      cargoWeight: 3000,
      palletCount: 8,
      vehicleType: "Kamyon",
      fromCity: "İstanbul",
      fromDistrict: "Bayrampaşa",
      fromAddress: "Gıda Toptancılar Sitesi, B blok",
      toCity: "Kocaeli",
      toDistrict: "İzmit",
      toAddress: "Merkez depo, Sanayi Mah.",
      loadDate: days(0, 14),
      contactPhone: "0544 000 00 03",
      status: "ACCEPTED",
      quotePrice: 9000,
      quotedAt: days(-5),
      scheduledAt: days(0, 14),
    },
  });

  // 6 — 2 gün sonra, TIR
  await prisma.shipment.create({
    data: {
      companyId,
      customerId: can.id,
      cargoType: "Tekstil",
      cargoWeight: 12000,
      palletCount: 20,
      vehicleType: "TIR",
      fromCity: "Bursa",
      fromDistrict: "Osmangazi",
      fromAddress: "Demirtaş OSB, Öztürk Tekstil",
      toCity: "İzmir",
      toDistrict: "Torbalı",
      toAddress: "Torbalı lojistik merkezi, rampa 3",
      loadDate: days(2),
      insurance: true,
      forklift: true,
      contactPhone: "0555 000 00 04",
      status: "ACCEPTED",
      quotePrice: 18000,
      quoteNote: "Komple TIR, sigortalı.",
      quotedAt: days(-4),
      scheduledAt: days(2),
      vehicles: { connect: [{ id: v[3].id }] },
      staff: { connect: [{ id: s[0].id }, { id: s[2].id }] },
    },
  });

  // 7 — Teslim edildi
  await prisma.shipment.create({
    data: {
      companyId,
      customerId: ayse.id,
      cargoType: "Ticari mobilya",
      cargoWeight: 1200,
      vehicleType: "Kamyonet",
      fromCity: "İstanbul",
      fromDistrict: "Ümraniye",
      fromAddress: "Mobilya Sanayi Sitesi No:8",
      toCity: "İstanbul",
      toDistrict: "Ataşehir",
      toAddress: "Plaza ofis, 12. kat",
      loadDate: days(-6),
      loadingHelp: true,
      contactPhone: "0544 000 00 03",
      status: "COMPLETED",
      quotePrice: 4500,
      quotedAt: days(-10),
      scheduledAt: days(-6),
    },
  });

  console.log("Demo verileri yüklendi.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
