# Migratsiya drift va db push

## Muammo
`npx prisma migrate dev` "Drift detected" xabarini beradi: bazadagi jadval/ustunlar loyihadagi migratsiya tarixiga to‘g‘ri kelmaydi (bazada qo‘shimcha jadvallar/ustunlar bor).

## Ma’lumotni saqlab, faqat `district` qo‘shish
Migratsiya ishlatmasdan, hozirgi schema ni bazaga sinxronlash:

```bash
npx prisma db push
```

Bu `AbaCenter.district` ustunini qo‘shadi, mavjud ma’lumotni o‘chirmaydi.

## Keyinchalik migratsiya tarixini tuzatish (ixtiyoriy)
Agar kelajakda `migrate` ni ishlatmoqchi bo‘lsangiz, ikkita yo‘l:

1. **Yangi muhit (ma’lumot kerak emas):**  
   `npx prisma migrate reset` — baza to‘liq qayta yaratiladi, barcha ma’lumot o‘chadi.

2. **Ma’lumotni saqlash:**  
   Hozirgi baza holatini "baseline" qilib, keyingi o‘zgarishlarni yangi migratsiyalar bilan qilish kerak (qo‘lda migratsiya fayllarini yozish yoki Prisma hujjatlariga qarab baseline qilish).

Hozircha `db push` ishlatish kifoya — ilova va `district` ishlashi uchun.
