# Autizm — mobil ilova

Expo (React Native) ilovasi: skrining testi, autizm haqida video darslar, uyda mashqlar va ABA markazlari.
Backend sifatida asosiy Next.js loyihasining API'si ishlatiladi (`../src/app/api`).

## Ishga tushirish

```bash
cd mobile
npm install
npx expo start --ios   # yoki --android
```

Backend manzili sukut bo'yicha `https://autizmtest.uz`. Lokal backend bilan ishlash uchun `mobile/.env` yarating:

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Tuzilishi

- `src/app/(tabs)` — Bosh sahifa, Test, Darslar, Mashqlar, Profil tablari
- `src/app/screening` — test: ma'lumot kiritish (`setup`) va savollar (`run`)
- `src/app/result/[id]` — natija va tavsiya qilingan mashqlar
- `src/app/video/[id]` — video pleer
- `src/shared` — saytdan ko'chirilgan savollar va ball hisoblash (`src/data`, `src/lib/screening-v2-*`). Saytda savollar o'zgarsa, shu yerga ham ko'chiring.
- `src/lib/api.ts` — backend so'rovlari
- `src/lib/history.ts` — test natijalari qurilmada saqlanadi

## Backend API

- `GET /api/content?kind=lesson|exercise&locale=uz|ru` — kategoriyalar va videolar
- `GET /api/content/videos/:id?locale=` — bitta video
- `/api/admin/content` — kategoriya va videolarni boshqarish (admin sessiyasi kerak)

Test natijasi qurilmada hisoblanadi; server akkaunt tarixi va ABA markaziga yozilish uchun kerak.

## App Store'ga yuklash (EAS)

Build bulutda yig'iladi — Xcode shart emas. Production build `https://autizmtest.uz` ga ulanadi (`eas.json`).

```bash
npm install -g eas-cli
eas login                                  # expo.dev akkaunti
eas init                                   # loyihani expo.dev ga bog'laydi (app.json ga projectId yoziladi)
eas build --platform ios --profile production   # Apple ID bilan kirish so'raladi, sertifikatlarni EAS o'zi yaratadi
eas submit --platform ios --latest         # App Store Connect → TestFlight ga yuklaydi
```

Build raqami avtomatik oshadi; yangi versiya chiqarishda `app.json` dagi `version` ni oshiring.

Yuborishdan oldin:
- Backend (`autizmtest.uz`) ga yangi kod va migratsiyalar deploy qilingan bo'lishi kerak (`/api/mobile/*`, `/api/content`).
- Videolar internetdan ochiladigan manzilda bo'lishi kerak (Bunny Stream) — `/api/media/local/...` faqat lokal test uchun.
- Serverda `REVIEW_PHONE` va `REVIEW_OTP_CODE` ni o'rnating va App Store Connect → App Review Information ga shu raqam va kodni yozing (Apple tekshiruvchisi O'zbekiston SMS ni ololmaydi).
- App Store Connect'da Privacy Policy URL, skrinshotlar (6.9" iPhone), tavsif, yosh reytingi va "App Privacy" (telefon raqami, sog'liq ma'lumotlari) to'ldiriladi.
