# Shrota Mobile App - Build Guide

> **Note:** This project uses local builds, NOT EAS (Expo Application Services).

## Quick Reference

| Command | Description |
|---------|-------------|
| `npm start` | Start Metro bundler |
| `npm run android` | Run on Android emulator/device |
| `npm run ios` | Run on iOS simulator |
| `npm run prebuild:clean` | Clean prebuild (both platforms) |
| `npm run prebuild:android` | Clean prebuild Android only |
| `npm run prebuild:ios` | Clean prebuild iOS only |
| `npm run build:aab` | Build release AAB for Google Play |
| `npm run build:apk` | Build release APK for testing |

## Development

### Start Development Server
```bash
npm start
```

### Run on Android Emulator/Device
```bash
npm run android
```

### Run on iOS Simulator
```bash
npm run ios
```

## Release Builds

### Build AAB for Google Play
```bash
npm run build:aab
```
Output: `android/app/build/outputs/bundle/release/app-release.aab`

### Build APK for Testing
```bash
npm run build:apk
```
Output: `android/app/build/outputs/apk/release/app-release.apk`

## Clean Build

### Full Clean (recommended when switching branches or fixing build issues)
```bash
# Remove android folder and rebuild
rm -rf android
npm run build:aab   # or build:apk
```

### Clean Android Build Cache
```bash
cd android && ./gradlew clean && cd ..
```

### Clean All Caches
```bash
# Remove all generated files and caches
rm -rf android
rm -rf ios
rm -rf node_modules
rm -rf .expo
npm install
```

### Reset Metro Cache
```bash
npm start -- --reset-cache
```

## Prebuild

### Clean Prebuild (removes and regenerates native folders)
```bash
npm run prebuild:clean     # both platforms
npm run prebuild:android   # android only
npm run prebuild:ios       # ios only
```

### Prebuild Without Clean (keeps existing native changes)
```bash
npm run prebuild
```

## Version Management

Update version in `app.json` before each Play Store release:

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

| Field | Description |
|-------|-------------|
| `version` | User-facing version (e.g., "1.0.0", "1.0.1") |
| `versionCode` | Integer, must increment with each Play Store upload |

## Keystore & Signing

- Keystore location: `keystore/shrota-release.keystore`
- Signing is configured automatically by `scripts/setup-release-signing.js` during build
- Credentials in `keystore/keystore credentials.txt`

## Build Process Details

The build scripts (`scripts/build-release.sh`, `scripts/build-apk.sh`) automatically:
1. Clean the android folder (`rm -rf android`)
2. Run expo prebuild (`npx expo prebuild --platform android --clean`)
3. Create `android/keystore.properties` with signing credentials
4. Modify `android/app/build.gradle` for release signing
5. Run gradle build (`./gradlew bundleRelease` or `assembleRelease`)

## Prerequisites

- Node.js (v18+)
- Java JDK 17
- Android SDK (via Android Studio)
- Android Emulator or physical device
- For iOS: macOS with Xcode

## Troubleshooting

### "APK signed in debug mode" error
Use the build scripts - they handle signing automatically:
```bash
npm run build:aab
```

### Build fails / Gradle errors
Clean and rebuild:
```bash
rm -rf android
npm run build:aab
```

### Metro bundler issues
Reset cache:
```bash
npm start -- --reset-cache
```

### node_modules issues
```bash
rm -rf node_modules
npm install
```

### "SDK location not found"
Create `android/local.properties`:
```
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

### Java version issues
Ensure JDK 17 is installed and set:
```bash
java -version  # Should show 17.x.x
```

## Manual Build (if scripts fail)

```bash
# 1. Clean
rm -rf android

# 2. Prebuild
npx expo prebuild --platform android --clean

# 3. Setup signing
node scripts/setup-release-signing.js

# 4. Build AAB
cd android && ./gradlew bundleRelease

# Or build APK
cd android && ./gradlew assembleRelease
```

## File Structure

```
mobile/
├── android/                    # Generated - do not edit directly
├── ios/                        # Generated - do not edit directly
├── keystore/
│   ├── shrota-release.keystore # Release signing keystore
│   └── keystore credentials.txt
├── scripts/
│   ├── build-release.sh        # Build AAB script
│   ├── build-apk.sh            # Build APK script
│   └── setup-release-signing.js # Configures signing after prebuild
├── app.json                    # Expo config (version, app name, etc.)
└── package.json                # Dependencies and npm scripts
```
