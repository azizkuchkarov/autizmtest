# Serverga deploy (Ubuntu / VDS)

## Rasm upload (ABA markazlar) — rasmlar ochilmasa

Rasmlar `public/uploads/aba/` da saqlanadi. Serverda quyidagilarni tekshiring.

### 1. Papka va ruxsatlar

Loyiha papkasida (masalan `/var/www/autizmtest`):

```bash
# Papka mavjudligi
ls -la public/uploads/aba/

# Agar papka yo'q bo'lsa
mkdir -p public/uploads/aba

# Node/PM2 qaysi userda ishlayotgan bo'lsa, shu userga ruxsat bering (masalan www-data yoki node)
sudo chown -R www-data:www-data public/uploads
sudo chmod -R 755 public/uploads
```

(PM2 da `www-data` o‘rniga o‘zingiz ishlatadigan userni yozing: `whoami` yoki `pm2 show 0` dan qarang.)

### 2. Ishchi papka (cwd)

Upload `process.cwd()/public/uploads/aba` ga yozadi. PM2 yoki systemd ishlatilsa, **ishchi papka loyiha root bo‘lishi kerak**:

**PM2 (ecosystem.config.cjs yoki start qilganda):**

```bash
cd /var/www/autizmtest
pm2 start npm --name "autizmtest" -- start
# yoki ecosystem faylida: cwd: "/var/www/autizmtest"
```

**systemd:** Unit faylida `WorkingDirectory=/var/www/autizmtest` bo‘lsin.

### 3. Nginx

Agar Nginx orqali Next.js ga proxy qilsangiz, **barcha so‘rovlar** (shu jumladan `/uploads/...`) Next.js ga o‘tishi kerak; Next.js `public/` ni o‘zi serve qiladi:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

`/uploads` uchun alohida `alias` yoki `root` qo‘ymang — buni Next.js qiladi.

### 4. Tekshirish

- Rasm yuklang, keyin serverda:  
  `ls -la /var/www/autizmtest/public/uploads/aba/`  
  — fayl ko‘rinsa, yozish ishlayapti.
- Brauzerda to‘g‘ridan-to‘g‘ri oching:  
  `https://your-domain.com/uploads/aba/FAYL_NOMI.jpg`  
  — 404 bo‘lsa, Nginx/Next.js sozlamasini yoki papka ruxsatini tekshiring.
