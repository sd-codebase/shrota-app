# Shrota Mobile App - Build Guide

## Quick Commands

| Command | Description | Output |
|---------|-------------|--------|
| `npm run build:aab` | Build release AAB for Google Play | `android/app/build/outputs/bundle/release/app-release.aab` |
| `npm run build:apk` | Build release APK for testing | `android/app/build/outputs/apk/release/app-release.apk` |

## Prerequisites

- Node.js installed
- Java JDK 17
- Android SDK
- Run `npm install` first

## Build Process

The build scripts automatically:
1. Clean the android folder
2. Run `npx expo prebuild --platform android --clean`
3. Configure release signing via `scripts/setup-release-signing.js`
4. Build the signed release

## Keystore

Location: `keystore/shrota-release.keystore`

Credentials are configured in `scripts/setup-release-signing.js` which creates `android/keystore.properties` during build.

## Version Management

Update version in `app.json`:
```json
{
  "expo": {
    "version": "1.0.0",
    "android": {
      "versionCode": 1
    }
  }
}
```

- `version`: User-facing version string (e.g., "1.0.0")
- `versionCode`: Integer that must increment with each Play Store upload

## Troubleshooting

### "APK signed in debug mode" error
The build scripts handle this automatically. If you still get this error, ensure you're using `npm run build:aab` and not building manually.

### Build fails after prebuild
Run a clean build:
```bash
rm -rf android
npm run build:aab
```

## Manual Build (if needed)

```bash
# 1. Prebuild
npx expo prebuild --platform android --clean

# 2. Setup signing
node scripts/setup-release-signing.js

# 3. Build
cd android && ./gradlew bundleRelease
```
