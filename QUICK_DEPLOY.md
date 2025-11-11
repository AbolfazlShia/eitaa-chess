# 🚀 راهنمای سریع Deploy

## روش ساده: استفاده از Render (رایگان)

### مرحله 1: بک‌اند (Backend)

1. به [render.com](https://render.com) بروید و با GitHub ثبت‌نام کنید
2. **New > Web Service** را انتخاب کنید
3. Repository خود را انتخاب کنید (یا از GitHub import کنید)
4. تنظیمات:
   - **Name:** `eitaa-chess-backend`
   - **Environment:** `Node`
   - **Build Command:** `cd server && pnpm install && pnpm build`
   - **Start Command:** `cd server && pnpm start`
   - **Root Directory:** `/` (root)
5. **Environment Variables:**
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `DAILY_LIVE_CAP` = `10`
6. **Deploy** را بزنید
7. بعد از deploy، URL بک‌اند را کپی کنید (مثلاً: `https://eitaa-chess-backend.onrender.com`)

### مرحله 2: فرانت (Frontend)

1. به [vercel.com](https://vercel.com) بروید و با GitHub ثبت‌نام کنید
2. **Add New > Project** را انتخاب کنید
3. Repository خود را انتخاب کنید
4. تنظیمات:
   - **Root Directory:** `web`
   - **Framework Preset:** `Vite`
   - **Build Command:** `pnpm build` (یا `cd web && pnpm build`)
   - **Output Directory:** `dist`
5. **Environment Variables:**
   - `VITE_API_URL` = URL بک‌اند شما (مثلاً: `https://eitaa-chess-backend.onrender.com`)
6. **Deploy** را بزنید
7. بعد از deploy، URL فرانت را کپی کنید (مثلاً: `https://eitaa-chess.vercel.app`)

### مرحله 3: تنظیمات ایتا

1. URL فرانت را در تنظیمات ربات ایتا قرار دهید
2. ربات به صورت خودکار پارامترهای `eitaa_id`، `name` و `avatar_url` را اضافه می‌کند

---

## روش جایگزین: Railway (ساده‌تر)

1. به [railway.app](https://railway.app) بروید
2. **New Project > Deploy from GitHub** را انتخاب کنید
3. دو سرویس بسازید:
   - **Service 1:** برای `server/` directory
     - Build Command: `cd server && pnpm install && pnpm build`
     - Start Command: `cd server && pnpm start`
   - **Service 2:** برای `web/` directory
     - Build Command: `cd web && pnpm install && pnpm build`
     - Start Command: `cd web && pnpm preview` (یا از Vercel برای فرانت استفاده کنید)
4. برای Service 2 (web)، Environment Variable اضافه کنید:
   - `VITE_API_URL` = URL Service 1 (بک‌اند)

---

## نکات مهم:

- ⚠️ Render ممکن است بعد از 15 دقیقه inactivity sleep شود (برای جلوگیری از این، از Render Pro استفاده کنید یا از Railway)
- ✅ Railway معمولاً sleep نمی‌شود اما محدودیت‌های رایگان دارد
- 🔒 برای production، بهتر است از دیتابیس (مثل PostgreSQL) استفاده کنید به جای in-memory storage
- 📝 بعد از deploy، حتماً URL بک‌اند را در Environment Variable فرانت قرار دهید

---

## تست محلی با ngrok (برای تست سریع):

```bash
# Terminal 1: بک‌اند
cd server && pnpm dev

# Terminal 2: فرانت
cd web && pnpm dev

# Terminal 3: ngrok
ngrok http 8787
```

سپس URL ngrok را در `VITE_API_URL` قرار دهید.

