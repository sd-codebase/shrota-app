#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "🧹 Cleaning previous build..."
rm -rf android

echo "📦 Running expo prebuild..."
npx expo prebuild --platform android --clean

echo "🔐 Setting up release signing..."
node scripts/setup-release-signing.js

echo "🔨 Building release APK..."
cd android
./gradlew assembleRelease

echo ""
echo "✅ Build complete!"
echo "📍 APK location: mobile/android/app/build/outputs/apk/release/app-release.apk"
