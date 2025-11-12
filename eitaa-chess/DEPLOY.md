# راهنمای Deploy

## روش 1: استفاده از Render (پیشنهادی - رایگان)

### بک‌اند (Render):

1. به [render.com](https://render.com) بروید و ثبت‌نام کنید
2. New > Web Service
3. Repository را به GitHub متصل کنید
4. تنظیمات:
   - **Name:** `eitaa-chess-backend`
   - **Environment:** `Node`
   - **Build Command:** `cd server && pnpm install && pnpm build`
   - **Start Command:** `cd server && pnpm start`
   - **Root Directory:** `/` (root)
5. Environment Variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `DAILY_LIVE_CAP=10`
6. Deploy کنید

### فرانت (Vercel):

1. به [vercel.com](https://vercel.com) بروید و ثبت‌نام کنید
2. New Project
3. Repository را به GitHub متصل کنید
4. تنظیمات:
   - **Root Directory:** `web`
   - **Framework Preset:** `Vite`
   - **Build Command:** `pnpm build`
   - **Output Directory:** `dist`
5. Environment Variables:
   - `VITE_API_URL=https://your-backend-name.onrender.com`
6. Deploy کنید

## روش 2: استفاده از Railway (ساده‌تر)

1. به [railway.app](https://railway.app) بروید
2. New Project > Deploy from GitHub
3. دو سرویس بسازید:
   - یکی برای `server/`
   - یکی برای `web/`
4. برای web، Environment Variable اضافه کنید:
   - `VITE_API_URL=https://your-backend.railway.app`

## نکات مهم:

- بعد از deploy، URL بک‌اند را در Environment Variable فرانت قرار دهید
- برای Socket.IO، باید CORS درست تنظیم شود (در کد موجود است)
- Render ممکن است بعد از 15 دقیقه inactivity sleep شود (برای جلوگیری از این، از Render Pro استفاده کنید یا از Railway)

## لینک نهایی:

بعد از deploy، لینک فرانت را در تنظیمات ربات ایتا قرار دهید.

