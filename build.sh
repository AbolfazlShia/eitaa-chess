#!/bin/bash

# Build script for Typing Practice macOS App
# This script builds the app and creates an installable package

set -e

echo "🚀 Building Typing Practice App..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_DIR="$SCRIPT_DIR"
BUILD_DIR="$PROJECT_DIR/build"
APP_NAME="TypingPractice"
BUNDLE_ID="a.hhh"

# Clean previous builds
echo -e "${YELLOW}Cleaning previous builds...${NC}"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR"

# Check if Xcode is installed
if ! command -v xcodebuild &> /dev/null; then
    echo -e "${YELLOW}⚠️  Xcode command line tools not found.${NC}"
    echo "Please install Xcode from the App Store or run:"
    echo "xcode-select --install"
    exit 1
fi

# Check if full Xcode is installed (not just command line tools)
XCODE_PATH=$(xcode-select -p 2>/dev/null || echo "")
if [[ "$XCODE_PATH" == "/Library/Developer/CommandLineTools" ]]; then
    echo -e "${YELLOW}❌ مشکل: فقط Command Line Tools نصب است!${NC}"
    echo ""
    echo -e "${BLUE}برای build کردن macOS app، نیاز به Xcode کامل دارید.${NC}"
    echo ""
    echo -e "${GREEN}راه حل‌ها:${NC}"
    echo ""
    echo -e "${YELLOW}روش ۱: نصب Xcode کامل (توصیه می‌شود)${NC}"
    echo "1. App Store را باز کنید"
    echo "2. 'Xcode' را جستجو کنید"
    echo "3. Xcode را نصب کنید (حدود 12GB فضا نیاز دارد)"
    echo "4. بعد از نصب، این دستور را اجرا کنید:"
    echo "   sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer"
    echo ""
    echo -e "${YELLOW}روش ۲: استفاده از نسخه Web (فوری)${NC}"
    echo "فایل typing-practice.html را در مرورگر باز کنید!"
    echo "   open typing-practice.html"
    echo ""
    echo -e "${YELLOW}روش ۳: Build دستی در Xcode${NC}"
    echo "1. فایل hhh.xcodeproj را در Xcode باز کنید"
    echo "2. Product > Archive"
    echo "3. از Organizer > Distribute App > Copy App"
    echo ""
    exit 1
fi

# Build the app
echo -e "${BLUE}Building app...${NC}"
cd "$PROJECT_DIR"

xcodebuild \
    -project hhh.xcodeproj \
    -scheme hhh \
    -configuration Release \
    -derivedDataPath "$BUILD_DIR/DerivedData" \
    -archivePath "$BUILD_DIR/$APP_NAME.xcarchive" \
    archive \
    CODE_SIGN_IDENTITY="" \
    CODE_SIGNING_REQUIRED=NO \
    CODE_SIGNING_ALLOWED=NO

# Extract the app from archive
echo -e "${BLUE}Extracting app...${NC}"
APP_PATH="$BUILD_DIR/$APP_NAME.app"
ARCHIVE_APP_PATH="$BUILD_DIR/$APP_NAME.xcarchive/Products/Applications/hhh.app"

if [ -d "$ARCHIVE_APP_PATH" ]; then
    cp -R "$ARCHIVE_APP_PATH" "$APP_PATH"
    echo -e "${GREEN}✅ App built successfully!${NC}"
else
    # Try alternative path
    ARCHIVE_APP_PATH="$BUILD_DIR/$APP_NAME.xcarchive/Products/Applications/hhh.app"
    if [ -d "$ARCHIVE_APP_PATH" ]; then
        cp -R "$ARCHIVE_APP_PATH" "$APP_PATH"
        echo -e "${GREEN}✅ App built successfully!${NC}"
    else
        echo -e "${YELLOW}⚠️  App not found in archive. Trying direct build...${NC}"
        
        # Try direct build
        xcodebuild \
            -project hhh.xcodeproj \
            -scheme hhh \
            -configuration Release \
            -derivedDataPath "$BUILD_DIR/DerivedData" \
            CODE_SIGN_IDENTITY="" \
            CODE_SIGNING_REQUIRED=NO \
            CODE_SIGNING_ALLOWED=NO
        
        # Find the app in DerivedData
        APP_PATH=$(find "$BUILD_DIR/DerivedData" -name "hhh.app" -type d | head -1)
        
        if [ -z "$APP_PATH" ]; then
            echo -e "${YELLOW}❌ Could not find built app.${NC}"
            echo "Please build manually in Xcode:"
            echo "1. Open hhh.xcodeproj in Xcode"
            echo "2. Select 'Product' > 'Archive'"
            echo "3. Export the app from Organizer"
            exit 1
        fi
        
        cp -R "$APP_PATH" "$BUILD_DIR/$APP_NAME.app"
        APP_PATH="$BUILD_DIR/$APP_NAME.app"
        echo -e "${GREEN}✅ App built successfully!${NC}"
    fi
fi

# Create DMG
echo -e "${BLUE}Creating DMG installer...${NC}"

DMG_NAME="$APP_NAME-Installer"
DMG_PATH="$BUILD_DIR/$DMG_NAME.dmg"
DMG_TEMP_DIR="$BUILD_DIR/dmg_temp"

# Clean up temp directory
rm -rf "$DMG_TEMP_DIR"
mkdir -p "$DMG_TEMP_DIR"

# Copy app to temp directory
cp -R "$APP_PATH" "$DMG_TEMP_DIR/"

# Create Applications symlink
ln -s /Applications "$DMG_TEMP_DIR/Applications"

# Create README
cat > "$DMG_TEMP_DIR/README.txt" << EOF
تمرین تایپ ده انگشتی - Typing Practice App

نصب:
1. اپلیکیشن را به پوشه Applications بکشید
2. اپلیکیشن را از Applications باز کنید

Installation:
1. Drag the app to the Applications folder
2. Open the app from Applications

Enjoy practicing touch typing!
EOF

# Create DMG
hdiutil create -volname "$APP_NAME" -srcfolder "$DMG_TEMP_DIR" -ov -format UDZO "$DMG_PATH" 2>/dev/null || {
    echo -e "${YELLOW}⚠️  Could not create DMG. Creating ZIP instead...${NC}"
    cd "$BUILD_DIR"
    zip -r "$APP_NAME.zip" "$APP_NAME.app"
    echo -e "${GREEN}✅ Created $APP_NAME.zip${NC}"
    echo -e "${GREEN}📦 Installer ready at: $BUILD_DIR/$APP_NAME.zip${NC}"
    exit 0
}

echo -e "${GREEN}✅ DMG created successfully!${NC}"
echo ""
echo -e "${GREEN}📦 Installer ready at: $DMG_PATH${NC}"
echo ""
echo "To install:"
echo "1. Double-click the DMG file"
echo "2. Drag the app to Applications folder"
echo "3. Open from Applications"

