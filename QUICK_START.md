# 🚀 راهنمای سریع نصب

## روش ساده (توصیه می‌شود)

### مرحله ۱: Build کردن اپلیکیشن

در Terminal اجرا کنید:

```bash
cd /Users/abolfazl/Documents/hhh
./build.sh
```

یا اگر permission ندارید:

```bash
chmod +x build.sh
./build.sh
```

### مرحله ۲: نصب

بعد از اجرای script:

1. به پوشه `build` بروید
2. فایل `TypingPractice-Installer.dmg` را باز کنید
3. اپلیکیشن را به پوشه Applications بکشید
4. از Applications اپلیکیشن را باز کنید

### مرحله ۳: حل مشکل امنیتی (اگر نیاز بود)

اگر macOS گفت "App is damaged" یا "Cannot be opened":

**روش ۱:**
1. System Preferences > Security & Privacy
2. روی "Open Anyway" کلیک کنید

**روش ۲ (Terminal):**
```bash
xattr -cr /Applications/TypingPractice.app
```

## 🎉 تمام!

حالا می‌توانید از اپلیکیشن استفاده کنید!

---

**اگر مشکلی پیش آمد:** [BUILD_INSTRUCTIONS.md](BUILD_INSTRUCTIONS.md) را بخوانید.

