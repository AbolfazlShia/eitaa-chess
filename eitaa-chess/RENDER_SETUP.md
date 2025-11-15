# راهنمای سریع راه‌اندازی در Render (فارسی)

این فایل شامل مراحل دقیق برای deploy کردن پروژهٔ شما روی Render است، به‌طوری که کافیست آن را در مخزن (Git) پوش کنید و سپس در داشبورد Render مخزن را متصل کنید.

پیش‌نیازها
- یک حساب GitHub/GitLab/Bitbucket
- یک حساب در https://render.com

گام‌ها (خلاصه)
1. پوش کردن تغییرات محلی به مخزن راه دور (GitHub).
2. در Render حساب بسازید و مخزن را Import کنید.
3. دو سرویس بسازید (یا از `render.yaml` استفاده کنید):
   - Static Site برای فرانت‌اند (`web`)
   - Web Service (Node) برای بک‌اند (`server`) اگر به API نیاز دارید
4. در هر سرویس تنظیمات Build/Start را مطابق زیر قرار دهید.

مقادیر پیشنهادی (قابل copy/paste)

برای فرانت‌اند (Static Site)
- Type: Static Site
- Repository: (مخزن شما)
- Branch: main
- Root Directory: web
- Build Command:
  npm install && npm run build
- Publish Directory:
  dist

برای بک‌اند (Web Service)
- Type: Web Service
- Environment: Node
- Repository: (مخزن شما)
- Branch: main
- Root Directory: server
- Build Command:
  npm install && npm run build
- Start Command:
  npm run start

نکات مهم
- در Build Command نیازی به `cd server` یا `cd web` نیست؛ Render دستورها را از Root Directory اجرا می‌کند.
- اگر در لاگ‌ها پیامی دیدید که نشان می‌دهد `cd: server: No such file or directory`، به این معنی است که Root Directory نادرست است.
- اگر repo شما از pnpm استفاده می‌کند و فایل `pnpm-lock.yaml` دارد، می‌توانید به جای `npm install` از `pnpm install` استفاده کنید.

تست محلی سریع
- فرانت‌اند:
  cd web
  npm install
  npm run build

- بک‌اند:
  cd server
  npm install
  npm run build
  npm run start

رفع خطای متداول (مثال از لاگ شما)
- پیغام: "bash: line 1: cd: server: No such file or directory"
  - علت: در Build Command از `cd server` استفاده شده یا Root Directory در تنظیمات Render درست نیست.
  - راه حل: Root Directory را `server` قرار دهید و Build Command را فقط `npm install && npm run build` بگذارید.

اجرای Deploy و دریافت لینک
1. بعد از ایجاد سرویس، Render یک URL عمومی می‌سازد مانند:
   https://<service-name>.onrender.com
   اگر سرویس را `eitaa-chess-frontend` نامگذاری کنید، URL احتمالی: `https://eitaa-chess-frontend.onrender.com`
2. آدرس دقیق بعد از اولین Deploy در صفحهٔ سرویس نمایش داده می‌شود.

اگر می‌خواهید من همهٔ این کارها را برایتان انجام بدهم، باید به من دسترسی به مخزن GitHub یا حساب Render بدهید (یا فایل‌های لازم را push کنم از این محیط). در غیر این صورت من همهٔ فایل‌های کمکی و دستورالعمل‌ها را آماده کرده‌ام تا شما دو کلیک در Render و یک push به GitHub انجام دهید.
