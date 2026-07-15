# VDS serverda loyihani ishga tushirish (100% ishlashi uchun)

Quyidagi qadamlarni VDS serverda ketma-ket bajarishingiz kerak. Server **Ubuntu 22.04** (yoki 20.04) deb faraz qilinadi.

---

## 1. Serverga ulanish

```bash
ssh root@SIZNING_SERVER_IP
# yoki
ssh sizning_foydalanuvchi@SIZNING_SERVER_IP
```

---

## 2. Tizimni yangilash va kerakli dasturlarni o‘rnatish

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential
```

---

## 3. Node.js (LTS) o‘rnatish

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

---

## 4. PostgreSQL o‘rnatish va bazani yaratish

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

PostgreSQL da foydalanuvchi va bazani yarating:

```bash
sudo -u postgres psql
```

PostgreSQL ichida (bitta qatorda yozmaslik, har bir qatordan keyin Enter):

```sql
CREATE USER postgres WITH PASSWORD 'KuchkarovAzizShuxratovich';
CREATE DATABASE autizmtest OWNER postgres;
\q
```

Parolni o‘zingiz qattiq qiling va keyin `.env` da ishlatasiz.

---

## 5. Loyihani GitHub dan klonlash

```bash
cd /var/www
sudo mkdir -p /var/www
sudo chown $USER:$USER /var/www
cd /var/www
git clone https://github.com/SIZNING_GITHUB_USERNAME/autizmtest.git
cd autizmtest
```

`SIZNING_GITHUB_USERNAME` va repo nomini o‘zingizniki bilan almashtiring. Agar repo private bo‘lsa, GitHub token yoki SSH kalit ishlatishingiz kerak.

---

## 6. Environment fayl (.env) yaratish

```bash
nano .env
```

Quyidagini yozing (qiymatlarni o‘zingiznikiga almashtiring):

```env
DATABASE_URL="postgresql://autizm_user:SIZNING_PAROL@localhost:5432/autizmtest?schema=public"
OPENAI_API_KEY=sk-proj-...

ESKIZ_EMAIL=your@email.com
ESKIZ_PASSWORD=eskiz_parol
```

Saqlash: `Ctrl+O`, Enter, `Ctrl+X`.

**SMS (ro'yxatdan o'tish kodi) ishlashi uchun:** `ESKIZ_EMAIL` va `ESKIZ_PASSWORD` majburiy — bu Eskiz.uz (notify.eskiz.uz) akkauntining email va paroli. Akkauntni [my.eskiz.uz](https://my.eskiz.uz) da ro'yxatdan o'tkazing va faollashtiring; test rejimida ixtiyoriy matn yuborish cheklangan bo‘lishi mumkin.

---

## 7. Dependency va Prisma

```bash
npm install
npx prisma generate
npx prisma migrate deploy
```

Agar seed (dastlabki ma’lumot) bo‘lsa:

```bash
npx prisma db seed
```

---

## 8. Upload papkalari (ABA markazlar rasmlari uchun)

**Admin panelda rasm yuklaganda xato bo‘lmasligi uchun** loyiha papkasida quyidagilarni bajaring (PM2 ni qaysi user ishga tushirsangiz, shu user papkaga yozishi kerak):

```bash
cd /var/www/autizmtest
mkdir -p public/uploads/aba
chmod -R 755 public/uploads
# PM2 ni siz (root emas, odatda) ishga tushirsangiz:
chown -R $USER:$USER public/uploads
# Agar PM2 ni root ishga tushirsangiz:
# chown -R root:root public/uploads
```

Rasm yuklashda "Rasm papkasiga yozish ruxsati yo'q" xabari chiqsa, `chown -R` va `chmod -R 755 public/uploads` ni qayta bajarib, `pm2 restart autizmtest` qiling.

---

## 9. Build va ishga tushirish (tekshirish)

Avval build qilib, `npm start` bilan tekshirish:

```bash
npm run build
npm start
```

Brauzerda `http://SERVER_IP:3000` ochib ko‘ring. To‘g‘ri ishlasa, `Ctrl+C` bilan to‘xtating va keyingi qadamga o‘ting.

---

## 10. PM2 bilan doimiy ishlatish (production)

```bash
sudo npm install -g pm2
pm2 start npm --name "autizmtest" -- start
pm2 save
pm2 startup
```

`pm2 startup` chiqargan buyruqni (sudo ...) nusxalab, qayta ishga tushiring. Shundan keyin server qayta yuklansa ham ilova avtomatik ishga tushadi.

Foydali buyruqlar:

```bash
pm2 status
pm2 logs autizmtest
pm2 restart autizmtest
pm2 stop autizmtest
```

---

## 11. Nginx (ixtiyoriy, lekin tavsiya etiladi)

80/443 portda Nginx orqali Next.js ga yo‘naltirish va SSL (HTTPS):

```bash
sudo apt install -y nginx certbot python3-certbot-nginx
sudo nano /etc/nginx/sites-available/autizmtest
```

Quyidagini kiriting (DOMAIN va SERVER_IP ni almashtiring). **Rasmlar 404 bo‘lmasligi uchun** `location /uploads/` bloki muhim — Nginx fayllarni to‘g‘ridan-to‘g‘ri `public/uploads` dan beradi:

```nginx
server {
    listen 80;
    server_name DOMAIN_OR_IP;
    client_max_body_size 10M;

    # ABA markazlar rasmlari — 404 bo‘lmasligi uchun (loyiha yo‘li: /var/www/autizmtest)
    location /uploads/ {
        alias /var/www/autizmtest/public/uploads/;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
```

`client_max_body_size 10M` — rasm yuklash uchun (kerak bo‘lsa 20M qiling). Loyiha boshqa papkada bo‘lsa, `alias` dagi yo‘lni o‘shanga o‘zgartiring (masalan `/var/www/autizmtest`).

So‘ng:

```bash
sudo ln -s /etc/nginx/sites-available/autizmtest /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Domain bo‘lsa, SSL:

```bash
sudo certbot --nginx -d sizning-domen.uz
```

---

## 12. Admin panel va ABA markazlar

1. Brauzerda: `https://SIZNING_DOMAIN/admin` (yoki `/admin`).
2. Admin hisob yaratish odatda seed orqali yoki alohida script orqali bo‘ladi. Agar yo‘q bo‘lsa, bitta admin yaratish uchun Prisma Studio yoki SQL ishlatishingiz mumkin.
3. Admin panelda **ABA markazlar** bo‘limiga kiring, viloyat/ tuman tanlang, markaz qo‘shing va **rasm yuklang**. Rasm `public/uploads/aba/` ga saqlanadi va saytda ko‘rinadi.

---

## 13. Tezkor xulosa (barcha buyruqlar ketma-ket)

Serverda yangi Ubuntu bo‘lsa, quyidagini ketma-ket bajarishingiz mumkin (qiymatlarni o‘zingiznikiga o‘zgartiring):

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential postgresql postgresql-contrib nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

sudo -u postgres createuser -P autizm_user
sudo -u postgres createdb -O autizm_user autizmtest

cd /var/www
git clone https://github.com/SIZNING_USER/autizmtest.git
cd autizmtest

nano .env
# .env ni to'ldiring va saqlang

npm install
npx prisma generate
npx prisma migrate deploy
mkdir -p public/uploads/aba
chmod -R 755 public/uploads

npm run build
sudo npm install -g pm2
pm2 start npm --name "autizmtest" -- start
pm2 save
pm2 startup
# Chiqgan sudo ... buyruqni bajarish
```

Nginx sozlang (11-qadamdagidek), keyin domen yoki IP orqali kirib Admin panelda ABA markazlarni kiritib, rasm yuklang.

---

## Muammo bo‘lsa

- **Rasm yuklanmayapti:** `public/uploads/aba` mavjudligi va `chmod 755`, loyiha foydalanuvchisiga `chown` qilinganligini tekshiring; Nginx da `client_max_body_size 10M` (yoki kattaroq) qo‘yilganligini tekshiring.
- **DB xato:** `.env` dagi `DATABASE_URL` va PostgreSQL da yaratilgan user/database nomi va parol mosligini tekshiring.
- **Port band:** Boshqa dastur 3000 band qilmasin; `pm2 list` va `pm2 logs autizmtest` orqali xatolarni ko‘ring.
