#!/bin/bash

echo "🚀 آماده‌سازی پروژه برای Deploy..."
echo ""

# بررسی وجود فایل‌های لازم
if [ ! -f "pnpm-workspace.yaml" ]; then
    echo "❌ فایل pnpm-workspace.yaml پیدا نشد!"
    exit 1
fi

# Build بک‌اند
echo "📦 در حال build بک‌اند..."
cd server
pnpm build
if [ $? -ne 0 ]; then
    echo "❌ خطا در build بک‌اند!"
    exit 1
fi
cd ..

# Build فرانت
echo "📦 در حال build فرانت..."
cd web
pnpm build
if [ $? -ne 0 ]; then
    echo "❌ خطا در build فرانت!"
    exit 1
fi
cd ..

echo ""
echo "✅ Build موفقیت‌آمیز بود!"
echo ""
echo "📝 مراحل بعدی:"
echo "1. پروژه را به GitHub push کنید"
echo "2. از DEPLOY_STEPS.md برای deploy استفاده کنید"
echo ""

