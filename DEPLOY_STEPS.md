# 📋 مراحل Deploy (گام به گام)

## ⚡ روش سریع (5 دقیقه)

### 1️⃣ آماده‌سازی GitHub

```bash
cd /Users/abolfazl/Documents/hhh
git add .
git commit -m "Initial commit"
git branch -M main
```

سپس یک repository جدید در GitHub بسازید و push کنید:

```bash
git remote add origin https://github.com/YOUR_USERNAME/eitaa-chess.git
git push -u origin main
```

### 2️⃣ Deploy بک‌اند (Render)

1. برید به: https://render.com
2. **Sign Up** با GitHub
3. **New > Web Service**
4. Repository رو انتخاب کنید
5. تنظیمات:
   - **Name:** `eitaa-chess-backend`
   - **Region:** `Singapore` (نزدیک‌تر به ایران)
   - **Branch:** `main`
   - **Root Directory:** `/` (خالی بذارید)
   - **Environment:** `Node`
   - **Build Command:** `cd server && pnpm install && pnpm build`
   - **Start Command:** `cd server && pnpm start`
6. **Advanced > Environment Variables:**
   ```
   NODE_ENV=production
   PORT=10000
   DAILY_LIVE_CAP=10
   ```
7. **Create Web Service**
8. منتظر بمانید تا deploy شود (2-3 دقیقه)
9. **URL بک‌اند را کپی کنید** (مثلاً: `https://eitaa-chess-backend.onrender.com`)

### 3️⃣ Deploy فرانت (Vercel)

1. برید به: https://vercel.com
2. **Sign Up** با GitHub
3. **Add New > Project**
4. Repository رو انتخاب کنید
5. تنظیمات:
   - **Root Directory:** `web`
   - **Framework Preset:** `Vite`
   - **Build Command:** `pnpm build` (یا `cd web && pnpm build`)
   - **Output Directory:** `dist`
6. **Environment Variables:**
   ```
   VITE_API_URL=https://eitaa-chess-backend.onrender.com
   ```
   (URL بک‌اند خودتون رو بذارید)
7. **Deploy**
8. منتظر بمانید تا deploy شود (1-2 دقیقه)
9. **URL فرانت را کپی کنید** (مثلاً: `https://eitaa-chess.vercel.app`)

### 4️⃣ تنظیمات ایتا

1. URL فرانت را در تنظیمات ربات ایتا قرار دهید
2. ✅ تمام!

---

## 🔧 اگر مشکلی پیش آمد:

### مشکل: Render sleep می‌شود
**راه حل:** از Railway استفاده کنید (معمولاً sleep نمی‌شود)

### مشکل: Socket.IO کار نمی‌کند
**راه حل:** مطمئن شوید که `VITE_API_URL` در Vercel درست تنظیم شده

### مشکل: Build Error
**راه حل:** 
- مطمئن شوید که `pnpm-workspace.yaml` در root وجود دارد
- در Render، Root Directory را خالی بذارید

---

## 🎯 لینک نهایی:

بعد از deploy، لینک فرانت شما چیزی شبیه این خواهد بود:
```
https://eitaa-chess.vercel.app
```

این لینک را در تنظیمات ربات ایتا قرار دهید.

