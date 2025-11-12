# 🎯 راهنمای سریع Deploy

## ⚡ روش ساده (3 مرحله)

### مرحله 1: Push به GitHub

```bash
cd /Users/abolfazl/Documents/hhh
git add .
git commit -m "Initial commit"
git branch -M main

# یک repository جدید در GitHub بسازید، سپس:
git remote add origin https://github.com/YOUR_USERNAME/eitaa-chess.git
git push -u origin main
```

### مرحله 2: Deploy بک‌اند (Render)

1. برید به: **https://render.com**
2. **Sign Up** با GitHub
3. **New > Web Service**
4. Repository رو انتخاب کنید
5. تنظیمات:
   - **Name:** `eitaa-chess-backend`
   - **Build Command:** `cd server && pnpm install && pnpm build`
   - **Start Command:** `cd server && pnpm start`
6. **Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   DAILY_LIVE_CAP=10
   ```
7. **Create Web Service**
8. **URL بک‌اند را کپی کنید** (مثلاً: `https://eitaa-chess-backend.onrender.com`)

### مرحله 3: Deploy فرانت (Vercel)

1. برید به: **https://vercel.com**
2. **Sign Up** با GitHub
3. **Add New > Project**
4. Repository رو انتخاب کنید
5. تنظیمات:
   - **Root Directory:** `web`
   - **Framework Preset:** `Vite`
6. **Environment Variables:**
   ```
   VITE_API_URL=https://eitaa-chess-backend.onrender.com
   ```
   (URL بک‌اند خودتون رو بذارید)
7. **Deploy**
8. **URL فرانت را کپی کنید** (مثلاً: `https://eitaa-chess.vercel.app`)

### مرحله 4: تنظیمات ایتا

URL فرانت را در تنظیمات ربات ایتا قرار دهید.

---

## ✅ لینک نهایی شما:

بعد از deploy، لینک شما چیزی شبیه این خواهد بود:
```
https://eitaa-chess.vercel.app
```

این لینک را در تنظیمات ربات ایتا قرار دهید.

---

## 📞 اگر مشکلی پیش آمد:

- فایل `DEPLOY_STEPS.md` را برای راهنمای کامل ببینید
- مطمئن شوید که `pnpm-workspace.yaml` در root وجود دارد
- در Render، Root Directory را خالی بذارید

