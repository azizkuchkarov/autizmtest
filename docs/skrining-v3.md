# Skrining testi v3 — mutaxassislar uchun hujjat

Ushbu hujjat ilovadagi autizm skrining testining (v3) tuzilishi, manbalari, ball hisoblash qoidalari va ilmiy tekshiruv rejasini tushuntiradi. Maqsad — bolalar psixiatri, nevrolog, psixolog va logopedlar savollarni ko'rib chiqib, tasdiqlashi va tekshiruvda qatnashishi.

> **Muhim:** bu test tashxis qo'ymaydi. U ota-onaga bolani mutaxassisga qachon ko'rsatish kerakligini aniqlashda yordam beradigan skrining vositasi. Quyidagi chegaralar **dastlabki** — ilmiy tekshiruvdan so'ng aniqlashtiriladi.

## 1. Manbalar

Savollar boshqa testlardan ko'chirilmagan — ular quyidagi ochiq ilmiy manbalar asosida shu loyiha uchun o'z so'zlarimiz bilan yozilgan:

| Manba | Nima olingan |
|---|---|
| DSM-5 (APA, 2013) autizm spektri buzilishi mezonlari | Tuzilma: A — ijtimoiy muloqot (o'zaro munosabat, og'zaki bo'lmagan muloqot, munosabatlar/o'yin), B — cheklangan va takroriy xatti-harakatlar (takroriy harakatlar, o'zgarmaslikka intilish, cheklangan qiziqishlar, sezgi reaksiyalari). Mezon matni ishlatilmagan. |
| CDC "Learn the Signs. Act Early." rivojlanish bosqichlari (Zubler va hammualliflar, *Pediatrics*, 2022) — AQSh davlat mulki | Yoshga mos ko'nikmalar: ishora qilish, ismga javob, birinchi so'zlar, ikki so'zli ibora, "go'yoki" o'yin, taqlid. |
| AAP klinik hisoboti (Hyman va hammualliflar, *Pediatrics*, 2020); AAN amaliy parametri (Filipek va hammualliflar, 2000) | Xavf belgilari: har qanday yoshda regress, 16 oyda so'z yo'qligi, 24 oyda ikki so'zli iboraning yo'qligi; 18 va 24 oyda skrining tavsiyasi. |
| Erta aniqlash bo'yicha sharhlar (Zwaigenbaum va hammualliflar, *Pediatrics*, 2015) | Erta yoshda eng ma'lumotli belgilar: birgalikdagi diqqat, ismga javob, ijtimoiy tabassum, imo-ishoralar, taqlid. |
| Xalqaro skrining amaliyoti (usullar) | Muhim savollarni alohida hisoblash, shubhali javobda aniqlashtiruvchi savol berish, "bilmayman" javobi. Usullar mualliflik huquqi bilan himoyalanmaydi; boshqa testlarning savollari ishlatilmagan. |

## 2. Tuzilma

- **Yosh guruhlari** (bolaning aniq yoshi tug'ilgan yil va oydan hisoblanadi):
  - 16–30 oy — 28–29 savol;
  - 31–59 oy (2,5–5 yosh) — 34 savol;
  - 60 oy va undan katta (5–10 yosh) — 33 savol.
  - 16 oydan kichik bolalarga skrining berilmaydi — ota-onaga kuzatish uchun xavf belgilari ko'rsatiladi.
- **Bo'limlar:** Ijtimoiy aloqa va emotsiyalar · Birgalikdagi diqqat va imo-ishoralar · Nutq va muloqot · O'yin va taqlid (A — ijtimoiy muloqot) · Takroriy harakatlar va qiziqishlar · O'zgarishlarga moslashish · Sezgi reaksiyalari (B — takroriy xatti-harakatlar) · Rivojlanish tarixi (regress).
- **Javoblar** (oxirgi 1 oy bo'yicha): Hech qachon · Ba'zan · Ko'pincha · Deyarli doim · *Bilmayman / kuzatmaganman*.
- **Savol turlari:** *ko'nikma* (ko'p bo'lsa yaxshi) va *belgi* (ko'p bo'lsa e'tibor kerak).

## 3. Ball hisoblash (dastlabki)

1. Har savol uchun xavf 0–1: ko'nikmada "Deyarli doim" → 0, "Ko'pincha" → 0,17, "Ba'zan" → 0,67, "Hech qachon" → 1; belgida — teskarisi. "Bilmayman" hisobga olinmaydi.
2. **Aniqlashtiruvchi savollar:** muhim ko'nikma bo'yicha "Hech qachon/Ba'zan" deyilsa, 2 ta aniq vaziyat so'raladi; birortasiga "Ha" deyilsa, ko'nikma bor deb olinadi (xavf 0,17). Bu noto'g'ri xavotirni kamaytiradi.
3. **Bo'lim balli** = savollar xavfining o'rtachasi × 100. **Soha ballari:** ijtimoiy muloqot (A) va takroriy xatti-harakatlar (B).
4. **Umumiy xom ball** = A × w + B × (1 − w), bunda w: 16–30 oy — 0,75; 2,5–5 yosh — 0,65; 5–10 yosh — 0,60 (kichik yoshda A belgilari ishonchliroq).
5. **Daraja:**
   - *Yuqori* — xom ball ≥ 45 yoki ≥ 3 muhim savolda qiyinchilik;
   - *O'rta* — xom ball ≥ 25, yoki ≥ 2 muhim savolda qiyinchilik, yoki regress;
   - *Past* — qolgan holatlar.
   - Agar A soha balli < 20 bo'lsa (ijtimoiy muloqot saqlangan) va muhim savollarda qiyinchilik < 2 — daraja "o'rta"dan oshmaydi (DSM-5 bo'yicha ikkala soha ham ta'sirlangan bo'lishi kerak).
6. **Regress** natijadan qat'i nazar "mutaxassisga albatta murojaat qiling" ogohlantirishini chiqaradi.
7. **"Belgilar ko'rsatkichi" (0–100)** — xom ball chegaralari 30 va 60 ga to'g'ri keladigan qilib o'zgartirilgan shkala (ilovadagi grafiklar uchun). Bu autizm ehtimoli foizi **emas**.
8. "Bilmayman" javoblari 30% dan ko'p bo'lsa — natija to'liq emas deb ogohlantiriladi.

Kod: `src/lib/screening-v3/score.ts` (`THRESHOLDS`, `DOMAIN_WEIGHTS`).

## 4. Oylik ko'nikmalar testi

Skrining yaxshilanishni o'lchash uchun mo'ljallanmagan, shuning uchun u 6 oyda bir marta topshiriladi. Mashg'ulotlar natijasini o'lchash uchun alohida **ko'nikmalar testi** bor (20 savol, ~5 daqiqa, har 4 haftada). Bo'limlari "Bugungi 5 daqiqa" mashqlari bilan bir xil: diqqat, taqlid, navbat bilan o'ynash, so'rash, o'yin, tushunish, mustaqillik, tinchlanish. Har bo'lim 0–100 (yuqori — yaxshi); ilova "oldin → keyin" o'zgarishni shu davrda bajarilgan mashqlar soni bilan birga ko'rsatadi. Savollar ota-ona orqali olib boriladigan erta aralashuv dasturlarining (WHO CST, JASPER, ESDM) maqsad ko'nikmalari asosida yozilgan.

## 5. Ilmiy tekshiruv rejasi

1. **Mazmun tekshiruvi (2–4 hafta).** 3–5 mutaxassis har bir savolni 4 balli shkalada baholaydi (aniqlik, muhimlik, yoshga mosligi). Mazmun indeksi (I-CVI) < 0,78 bo'lgan savollar qayta yoziladi yoki olib tashlanadi.
2. **Kognitiv intervyu (1–2 hafta).** 10–20 ota-ona (shahar va qishloq, turli ta'lim darajasi) savollarni o'z so'zlari bilan tushuntirib beradi; tushunarsiz so'zlar o'zgartiriladi. Rus tilidagi versiya ham alohida tekshiriladi.
3. **Diagnostik aniqlik (2–4 oy).** 150–300 bola: ABA markazlari va klinikalardagi tashxis qo'yilgan bolalar hamda bog'chalardagi bolalar. Har bola uchun mutaxassisning mustaqil klinik xulosasi (DSM-5 bo'yicha) olinadi. Hisoblanadi: sezgirlik, o'ziga xoslik, ROC egri chizig'i (AUC); har yosh guruhi uchun chegaralar Youden indeksi bo'yicha tanlanadi (skrining uchun sezgirlik ≥ 0,85 maqsad).
4. **Ishonchlilik.** 30–50 ota-ona testni 2 hafta oralig'ida qayta topshiradi (ICC); ichki muvofiqlik (Cronbach α, har bo'lim uchun).
5. **Doimiy yangilash.** Ota-onaning roziligi bilan anonim natijalar to'planadi; chegaralar yiliga kamida bir marta qayta ko'rib chiqiladi.

## 6. Ilova A. Skrining savollari

### 🤝 Ijtimoiy aloqa va emotsiyalar

| Kod | Savol | Turi | Yosh | Muhim |
|---|---|---|---|---|
| SOC_EYE | Siz bolangiz bilan gaplashganingizda yoki o'ynaganingizda u yuzingizga qaraydimi? *(aniqlashtiruvchi savollar bor)* | Ko'nikma | 16–30 oy, 2,5–5 yosh, 5–10 yosh | 16–30 oy, 2,5–5 yosh, 5–10 yosh |
| SOC_SMILE | Siz unga qarab jilmaysangiz, bolangiz ham sizga qarab jilmayadimi? | Ko'nikma | 16–30 oy, 2,5–5 yosh, 5–10 yosh | 16–30 oy |
| SOC_SHARE_JOY | Bolangiz biror narsadan xursand bo'lsa, xursandchiligini siz bilan bo'lishishga harakat qiladimi? | Ko'nikma | 16–30 oy, 2,5–5 yosh, 5–10 yosh | 2,5–5 yosh |
| SOC_EMPATHY | Siz yoki boshqa yaqin odam xafa bo'lsa yoki yig'lasa, bolangiz buni sezib, qandaydir javob qaytaradimi? | Ko'nikma | 16–30 oy, 2,5–5 yosh, 5–10 yosh | 5–10 yosh |
| SOC_GREET | Bolangiz tanish odamlar bilan salomlashganda yoki xayrlashganda qo'l silkitadimi yoki boshqa yo'l bilan javob beradimi? | Ko'nikma | 16–30 oy, 2,5–5 yosh |  |
| SOC_PEERS | Bolangiz boshqa bolalar bilan o'ynashga qiziqadimi va ularga o'zi yaqinlashadimi? | Ko'nikma | 2,5–5 yosh, 5–10 yosh |  |
| SOC_FRIEND | Bolangizning o'z yoshidagi do'sti bormi va u bilan birga o'ynashni yoqtiradimi? | Ko'nikma | 5–10 yosh |  |
| SOC_UNDERSTAND | Bolangiz suhbatdoshining holatini (zerikkani, xafa bo'lgani yoki hazillashayotganini) tushunadimi? | Ko'nikma | 5–10 yosh |  |

### 👉 Birgalikdagi diqqat va imo-ishoralar

| Kod | Savol | Turi | Yosh | Muhim |
|---|---|---|---|---|
| JA_POINT | Bolangiz biror narsani ko'rsatish yoki so'rash uchun barmog'i bilan ishora qiladimi? *(aniqlashtiruvchi savollar bor)* | Ko'nikma | 16–30 oy, 2,5–5 yosh | 16–30 oy, 2,5–5 yosh |
| JA_FOLLOW | Xonaning narigi tomonidagi narsani barmog'ingiz bilan ko'rsatsangiz, bolangiz o'sha tomonga qaraydimi? *(aniqlashtiruvchi savollar bor)* | Ko'nikma | 16–30 oy, 2,5–5 yosh | 16–30 oy, 2,5–5 yosh |
| JA_SHOW | Bolangiz qiziq narsa topsa, uni sizga ko'rsatish uchun olib keladimi yoki ko'tarib ko'rsatadimi (yordam so'rash uchun emas, shunchaki ko'rsatish uchun)? | Ko'nikma | 16–30 oy, 2,5–5 yosh, 5–10 yosh | 16–30 oy, 2,5–5 yosh, 5–10 yosh |
| JA_HAND_LEAD | Bolangiz biror narsani xohlaganda, hech narsa demay va yuzingizga qaramay, qo'lingizdan tortib o'sha narsaga olib boradimi? | Belgi | 16–30 oy, 2,5–5 yosh |  |
| JA_NOD | Bolangiz «ha» yoki «yo'q»ni boshini irg'atib yoki chayqab bildiradimi? | Ko'nikma | 16–30 oy, 2,5–5 yosh, 5–10 yosh (18 oydan) |  |
| JA_GESTURES | Gaplashayotganda bolangiz yuz ifodasi va imo-ishoralardan (qo'l harakati, bosh irg'atish) foydalanadimi? | Ko'nikma | 5–10 yosh |  |

### 💬 Nutq va muloqot

| Kod | Savol | Turi | Yosh | Muhim |
|---|---|---|---|---|
| COM_NAME | Bolangizni (u sizni ko'rmay turganda) ismi bilan chaqirsangiz, u qayrilib qaraydimi yoki javob beradimi? *(aniqlashtiruvchi savollar bor)* | Ko'nikma | 16–30 oy, 2,5–5 yosh, 5–10 yosh | 16–30 oy, 2,5–5 yosh, 5–10 yosh |
| COM_FOLLOW_CMD | Bolangiz oddiy ko'rsatmalarni qo'l bilan ko'rsatmasangiz ham tushunib bajaradimi? | Ko'nikma | 16–30 oy |  |
| COM_WORDS | Bolangiz bir nechta so'zni (masalan, «ona», «ber», «suv») ma'nosini tushunib ishlatadimi? | Ko'nikma | 16–30 oy (16 oydan) | 16–30 oy |
| COM_PHRASES | Bolangiz ikki so'zli iboralarni o'zi tuzib aytadimi (eshitganini takrorlash emas)? | Ko'nikma | 16–30 oy (24 oydan) | 16–30 oy |
| COM_TELL | Bolangiz o'zi ko'rgan yoki qilgan narsasi haqida sizga gapirib (yoki ko'rsatib) beradimi? | Ko'nikma | 2,5–5 yosh, 5–10 yosh |  |
| COM_QUESTIONS | Bolangiz «Nima?», «Qayerda?», «Kim?» kabi savollarga mos javob beradimi? | Ko'nikma | 2,5–5 yosh, 5–10 yosh |  |
| COM_ECHO | Bolangiz eshitgan so'z, ibora yoki multfilmdagi gaplarni o'rinsiz, ma'nosiz takrorlaydimi? | Belgi | 2,5–5 yosh, 5–10 yosh |  |
| COM_CONVERSATION | Bolangiz suhbatni navbatma-navbat davom ettira oladimi (siz gapirasiz — u javob beradi, u gapiradi — siz javob berasiz)? | Ko'nikma | 5–10 yosh | 5–10 yosh |
| COM_ONE_TOPIC | Bolangiz faqat o'zini qiziqtirgan mavzuda gapirib, suhbatdoshining qiziqishiga e'tibor bermaydimi? | Belgi | 5–10 yosh |  |
| COM_PROSODY | Bolangizning gapirish ohangi g'ayrioddiymi (juda bir xil, «robotga o'xshash» yoki kattalardek rasmiy)? | Belgi | 5–10 yosh |  |

### 🧸 O'yin va taqlid

| Kod | Savol | Turi | Yosh | Muhim |
|---|---|---|---|---|
| PLAY_IMITATE | Bolangiz sizning harakatlaringizni taqlid qiladimi? *(aniqlashtiruvchi savollar bor)* | Ko'nikma | 16–30 oy, 2,5–5 yosh | 16–30 oy, 2,5–5 yosh |
| PLAY_PRETEND | Bolangiz «go'yoki» o'ynaydimi? | Ko'nikma | 16–30 oy, 2,5–5 yosh (18 oydan) | 2,5–5 yosh |
| PLAY_SOCIAL_GAMES | Bolangiz siz bilan «ku-ku» yoki quvlashmachoq kabi o'yinlarni yoqtiradimi va yana o'ynashni so'raydimi? | Ko'nikma | 16–30 oy, 2,5–5 yosh |  |
| PLAY_TURNS | Bolangiz boshqa bola yoki kattalar bilan navbatma-navbat o'ynay oladimi? | Ko'nikma | 2,5–5 yosh, 5–10 yosh | 5–10 yosh |
| PLAY_ROLES | Bolangiz rolli o'yinlar (do'kon, shifokor, oshpaz va h.k.) o'ynaydimi va o'yinga yangi g'oyalar qo'shadimi? | Ko'nikma | 2,5–5 yosh, 5–10 yosh |  |
| PLAY_RULES | Bolangiz qoidali o'yinlarda (berkinmachoq, quvlashmachoq, stol o'yinlari) qoidaga amal qilib qatnasha oladimi? | Ko'nikma | 5–10 yosh |  |

### 🔁 Takroriy harakatlar va qiziqishlar

| Kod | Savol | Turi | Yosh | Muhim |
|---|---|---|---|---|
| RRB_MOTOR | Bolangiz qo'llarini silkitish, barmoqlarini ko'z oldida qimirlatish, aylanish yoki tebranish kabi bir xil harakatlarni takrorlaydimi? | Belgi | 16–30 oy, 2,5–5 yosh, 5–10 yosh |  |
| RRB_OBJECTS | Bolangiz o'yinchoqlar bilan g'ayrioddiy usulda o'ynaydimi? | Belgi | 16–30 oy, 2,5–5 yosh |  |
| RRB_INTEREST | Bolangiz bitta mavzu yoki narsaga (raqamlar, harflar, poyezdlar, xaritalar va h.k.) shunchalik qiziqadiki, boshqa narsalarga deyarli e'tibor bermaydimi? | Belgi | 2,5–5 yosh, 5–10 yosh |  |
| RRB_ATTACH | Bolangiz g'ayrioddiy narsalarga (ip, kalit, tayoqcha, qopqoq) qattiq bog'lanib, ularni doim qo'lida olib yuradimi? | Belgi | 16–30 oy, 2,5–5 yosh, 5–10 yosh |  |

### 🧩 O'zgarishlarga moslashish

| Kod | Savol | Turi | Yosh | Muhim |
|---|---|---|---|---|
| SAME_ROUTINE | Kundalik tartib biroz o'zgarsa (boshqa yo'ldan yurish, mebel joyi o'zgarishi), bolangiz qattiq bezovta bo'ladimi? | Belgi | 16–30 oy, 2,5–5 yosh, 5–10 yosh |  |
| SAME_TRANSITION | Bolangiz bir mashg'ulotdan boshqasiga o'tishda (masalan, o'yindan ovqatga) juda qiynaladimi? | Belgi | 16–30 oy, 2,5–5 yosh, 5–10 yosh |  |
| SAME_ORDER | Bolangiz ishlar faqat ma'lum tartibda bajarilishini talab qiladimi va tartib buzilsa uzoq vaqt tinchlanmaydimi? | Belgi | 2,5–5 yosh, 5–10 yosh |  |
| SAME_FOOD | Bolangiz faqat bir xil ovqat yoki kiyimni tanlab, yangisini qat'iy rad etadimi? | Belgi | 16–30 oy, 2,5–5 yosh, 5–10 yosh |  |

### 👂 Sezgi reaksiyalari

| Kod | Savol | Turi | Yosh | Muhim |
|---|---|---|---|---|
| SENS_SOUND | Bolangiz kundalik ovozlardan (changyutgich, fen, bolalar shovqini) quloqlarini berkitadimi yoki qattiq bezovta bo'ladimi? | Belgi | 16–30 oy, 2,5–5 yosh, 5–10 yosh |  |
| SENS_PAIN | Bolangiz og'riq, sovuq yoki issiqni odatdagidan ancha kam sezadigandek tuyuladimi? | Belgi | 16–30 oy, 2,5–5 yosh, 5–10 yosh |  |
| SENS_EXPLORE | Bolangiz narsalarni g'ayrioddiy darajada hidlaydimi, yalaydimi yoki uzoq vaqt silab-ushlab ko'radimi? | Belgi | 16–30 oy, 2,5–5 yosh, 5–10 yosh |  |
| SENS_VISUAL | Bolangiz aylanayotgan narsalarni, o'chib-yonayotgan chiroqni yoki narsalarning chetini ko'z qiri bilan uzoq tomosha qiladimi? | Belgi | 16–30 oy, 2,5–5 yosh, 5–10 yosh |  |
| SENS_CARE | Bolangiz soch oldirish, tirnoq olish, yuvinish yoki ayrim kiyimlarni kiyishga juda qattiq qarshilik qiladimi? | Belgi | 16–30 oy, 2,5–5 yosh, 5–10 yosh |  |

### 📅 Rivojlanish tarixi

| Kod | Savol | Turi | Yosh | Muhim |
|---|---|---|---|---|
| HIST_REGRESSION | Bolangiz avval bilgan so'zlarini yoki ko'nikmalarini (qarash, qo'l silkitish, o'ynash) keyinchalik yo'qotganmi? | Ha/Yo'q | 16–30 oy, 2,5–5 yosh, 5–10 yosh | Regress → mutaxassisga |

## Ilova B. Oylik ko'nikmalar testi savollari

**👀 Diqqat**

- Siz bilan o'ynaganda bolangiz bitta o'yinga kamida 2–3 daqiqa e'tibor qarata oladimi?
- Siz ko'rsatgan narsaga yoki kitobdagi rasmga siz bilan birga qaraydimi?
- Ismini aytganingizda qilayotgan ishini to'xtatib, sizga qaraydimi?

**🪞 Taqlid**

- Oddiy harakatlarni (qarsak, qo'l silkitish, bosh irg'atish) ko'rsatganingizda takrorlaydimi?
- Siz aytgan tovush yoki so'zni takrorlashga harakat qiladimi?
- O'yinchoq bilan qilgan harakatingizni (mashinani yurgizish, qo'g'irchoqni ovqatlantirish) takrorlaydimi?

**🔄 Navbat bilan o'ynash**

- Navbat bilan o'ynaladigan o'yinlarda (koptok oshirish, kubik terish) navbatini kuta oladimi?
- Siz bilan ketma-ket 3–4 marta navbatma-navbat o'ynay oladimi?

**🙋 So'rash va muloqot**

- Biror narsani xohlasa, uni so'z, imo-ishora yoki kartochka bilan so'raydimi?
- Yordam kerak bo'lsa (qopqoqni ochish, o'yinchoqni olib berish), yordam so'raydimi?
- «Yana» yoki «tugadi»ni so'z yoki imo-ishora bilan o'rinli bildiradimi?

**🧸 O'yin**

- O'yinchoqlar bilan maqsadiga mos o'ynaydimi (mashinani yurgizadi, kubikdan uy quradi)?
- Siz bilan birga o'ynashga qiziqadimi va o'yinni o'zi boshlaydimi?
- «Go'yoki» o'yinlar o'ynaydimi (qo'g'irchoqni ovqatlantirish, «do'kon» o'yini)? *(2,5–5 yosh, 5–10 yosh)*

**👂 Tushunish**

- Tanish narsalarning nomini aytsangiz (to'p, mushuk, suv), ularni ko'rsata oladimi?
- Kundalik tovushlarni (kuchuk, mashina, telefon) tanib, nima ekanini ko'rsatadi yoki aytadimi?
- Ikki qismli ko'rsatmani bajaradimi (masalan, «Koptokni olib, menga ber»)?

**🪥 Mustaqillik**

- Kundalik ishlarda (qo'l yuvish, kiyinish, ovqatlanish) o'zi bajarishga harakat qiladimi?
- Oddiy topshiriqlarni bajaradimi (masalan, «O'yinchoqlarni yig'», «Tuflingni olib kel»)?

**🌿 Tinchlanish**

- Xafa bo'lsa yoki jahli chiqsa, sizning yordamingiz bilan 5–10 daqiqada tinchlanadimi?
- Kun tartibi o'zgarganda yoki «yo'q» deyilganda tez tinchlanadimi?

