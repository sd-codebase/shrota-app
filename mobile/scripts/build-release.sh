#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "🧹 Cleaning previous build..."
rm -rf android

echo "📦 Running expo prebuild..."
npx expo prebuild --platform android --clean

echo "🔐 Setting up release signing..."
node scripts/setup-release-signing.js

echo "🔨 Building release AAB..."
cd android
./gradlew bundleRelease

echo ""
echo "✅ Build complete!"
echo "📍 AAB location: mobile/android/app/build/outputs/bundle/release/app-release.aab"
