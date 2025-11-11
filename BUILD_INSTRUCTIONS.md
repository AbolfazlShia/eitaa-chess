# راهنمای ساخت و نصب اپلیکیشن

## روش ۱: استفاده از Script (ساده‌ترین روش)

### پیش‌نیازها:
- macOS
- Xcode Command Line Tools (یا Xcode کامل)

### مراحل:

1. **نصب Xcode Command Line Tools** (اگر نصب نیست):
```bash
xcode-select --install
```

2. **اجرای Script**:
```bash
chmod +x build.sh
./build.sh
```

3. **نصب اپلیکیشن**:
   - فایل DMG یا ZIP در پوشه `build` ساخته می‌شود
   - DMG را باز کنید و اپلیکیشن را به Applications بکشید
   - یا ZIP را extract کنید و اپلیکیشن را به Applications بکشید

## روش ۲: استفاده از Xcode (برای توسعه‌دهندگان)

### مراحل:

1. **باز کردن پروژه**:
   - فایل `hhh.xcodeproj` را در Xcode باز کنید

2. **Build کردن**:
   - از منوی Product > Build (یا Cmd+B)
   - یا Product > Archive برای ساخت نسخه Release

3. **Export کردن**:
   - از Organizer (Window > Organizer)
   - Archive را انتخاب کنید
   - "Distribute App" را کلیک کنید
   - "Copy App" را انتخاب کنید
   - محل ذخیره را انتخاب کنید

4. **نصب**:
   - اپلیکیشن را به پوشه Applications بکشید
   - اگر خطای امنیتی دیدید:
     - System Preferences > Security & Privacy
     - روی "Open Anyway" کلیک کنید

## روش ۳: Build مستقیم با xcodebuild

```bash
# Build Release
xcodebuild -project hhh.xcodeproj -scheme hhh -configuration Release

# پیدا کردن فایل app
find ~/Library/Developer/Xcode/DerivedData -name "hhh.app" -type d
```

## حل مشکلات رایج

### خطای Code Signing:
اگر خطای code signing دیدید، در Xcode:
1. Project Settings > Signing & Capabilities
2. "Automatically manage signing" را غیرفعال کنید
3. یا Team را انتخاب کنید

### خطای "App is damaged":
```bash
# Remove quarantine attribute
xattr -cr /Applications/TypingPractice.app
```

### خطای "Cannot be opened":
1. System Preferences > Security & Privacy
2. روی "Open Anyway" کلیک کنید
3. یا:
```bash
sudo spctl --master-disable
```

## ساخت DMG دستی

اگر script کار نکرد:

```bash
# Create DMG
hdiutil create -volname "TypingPractice" -srcfolder build/TypingPractice.app -ov -format UDZO build/TypingPractice.dmg
```

## نکات

- برای اولین بار، macOS ممکن است اپلیکیشن را block کند
- همیشه از System Preferences > Security & Privacy > "Open Anyway" استفاده کنید
- برای توزیع عمومی، باید از Apple Developer Account استفاده کنید و app را sign کنید

