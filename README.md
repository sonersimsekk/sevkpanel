# SevkPanel — Sevkiyat Yönetim Paneli

Müşteriler yük sevkiyatı talebini panelden gönderir; lojistik firması fiyat verir, araç ve şoför atar, sevkiyatı teslim edilene kadar takip eder.
Telefon, tablet ve bilgisayarda çalışır (responsive).

## Kurulum (ilk sefer)

```bash
npm install
```

`.env.example` dosyasını `.env` adıyla kopyalayın ve `AUTH_SECRET` değerini değiştirin. Ardından veritabanını oluşturup demo verileri yükleyin:

```bash
npm run setup
```

## Çalıştırma

```bash
npm run dev
```

Tarayıcıda: http://localhost:3000

Telefondan denemek için bilgisayarla aynı Wi‑Fi'de olun ve `http://<bilgisayarın-IP-adresi>:3000` adresini açın.

## Demo hesaplar (şifre hepsinde: `demo1234`)

| Rol | E-posta |
| --- | --- |
| Lojistik firması (Yıldız Lojistik) | firma@demo.com |
| Lojistik firması (Anadolu Lojistik) | firma2@demo.com |
| Müşteri | musteri@demo.com |
| Müşteri | musteri2@demo.com |

Demo verileri sıfırlamak için: `npm run db:seed`

## Akış

1. **Müşteri** "Yeni Sevkiyat" ile yük cinsi, ağırlık, palet, hacim, istenen araç tipi, yükleme ve teslim noktası, yükleme tarihi ve ek hizmetleri (yükleme/indirme, forklift/rampa, ambalaj, sigorta) girer.
2. Talep **firmanın paneline** düşer (panel 30 sn'de bir kendini yeniler).
3. Firma fiyat teklifi + not gönderir; müşteri **kabul eder / reddeder** (firma "müşteri telefonla onayladı" da diyebilir).
4. Firma onaylanan sevkiyata **araç ve ekip atar**, yükleme saatini belirler → "Yola çıktı" → "Teslim edildi".
5. Her talepte müşteri ile firma arasında **mesajlaşma** var. Firma ayrıca sadece kendisinin gördüğü iç not tutabilir.

Durumlar: Teklif Bekliyor → Teklif Verildi → Onaylandı → Yolda → Teslim Edildi (ya da Teklif Reddedildi / İptal Edildi).

## Firma paneli menüsü

- **Özet:** Bugünkü sevkiyatlar (araç atanmamış uyarısı), fiyat bekleyen talepler, yaklaşan sevkiyatlar, aylık ciro.
- **Talepler:** Tüm talepler; duruma göre filtre, müşteri / telefon / yük cinsi / ilçe ile arama.
- **Planlama:** 7 günlük şerit, seçilen günün sevkiyatları, atanan araç/ekip, çakışma uyarıları ve her aracın/personelin o günkü durumu.
- **Filo:** Araç (plaka, tip, kapasite) ve personel (şoför, yükleme personeli, operasyon sorumlusu) yönetimi.

## Teknolojiler

- **Next.js 15** (App Router, Server Actions) + **React 19** + TypeScript
- **Tailwind CSS 4** (arayüz)
- **Prisma 6** + **SQLite** (veritabanı dosyası: `prisma/dev.db`)
- **jose** (oturum çerezi, JWT) + **bcryptjs** (şifre hash)

## Klasör yapısı

```
prisma/schema.prisma      Veritabanı şeması (User, Company, Shipment, Message, Vehicle, Staff)
prisma/seed.mjs           Demo veriler
src/app/                  Sayfalar
  giris/, kayit/          Giriş ve kayıt (Müşteri / Firma sekmeli)
  musteri/                Müşteri paneli (sevkiyatlarım, yeni sevkiyat, talep detayı)
  firma/                  Firma paneli (özet, talepler, talep detayı, planlama, filo)
  actions/                Sunucu işlemleri (giriş, talep, teklif, durum, mesaj, filo, atama)
src/components/           Ortak arayüz bileşenleri
src/lib/                  Veritabanı, oturum, sabitler (iller, yük cinsleri, araç tipleri), biçimlendirme
```

## Yayına alma notları

- `.env` içindeki `AUTH_SECRET` değerini gizli tutun (kurulumda rastgele üretildi).
- Canlıda birden çok kullanıcı için SQLite yerine PostgreSQL önerilir: `schema.prisma` içinde `provider = "postgresql"` yapıp `DATABASE_URL`'i değiştirmeniz yeterli.
- Uygulama adı, yük cinsleri, araç tipleri ve personel görevleri `src/lib/constants.ts` içinden değiştirilebilir.
