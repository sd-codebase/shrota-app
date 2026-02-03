const fs = require('fs');
const path = require('path');

const androidDir = path.join(__dirname, '..', 'android');
const buildGradlePath = path.join(androidDir, 'app', 'build.gradle');
const keystorePropsPath = path.join(androidDir, 'keystore.properties');

// Create keystore.properties
const keystoreProps = `storeFile=../keystore/shrota-release.keystore
storePassword=shrota123
keyAlias=shrota
keyPassword=shrota123
`;

fs.writeFileSync(keystorePropsPath, keystoreProps);
console.log('✅ Created keystore.properties');

// Read build.gradle
let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

// 1. Add keystore loading before "android {" (only if not already present)
if (!buildGradle.includes('keystorePropertiesFile')) {
    const keystoreLoader = `// Load keystore properties for release signing
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {`;

    buildGradle = buildGradle.replace('android {', keystoreLoader);
    console.log('✅ Added keystore loader');
}

// 2. Add release signing config after debug signing config (only if not already present)
if (!buildGradle.includes('signingConfigs') || !buildGradle.match(/signingConfigs\s*\{[\s\S]*?release\s*\{/)) {
    const releaseSigningConfig = `debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }`;

    buildGradle = buildGradle.replace(
        /debug \{\s*storeFile file\('debug\.keystore'\)\s*storePassword 'android'\s*keyAlias 'androiddebugkey'\s*keyPassword 'android'\s*\}/,
        releaseSigningConfig
    );
    console.log('✅ Added release signing config');
}

// 3. Fix debug buildType to use debug signing (not release)
buildGradle = buildGradle.replace(
    /(buildTypes\s*\{[\s\S]*?debug\s*\{[\s\S]*?)signingConfig signingConfigs\.release/,
    '$1signingConfig signingConfigs.debug'
);

// 4. Fix release buildType to use release signing (not debug)
buildGradle = buildGradle.replace(
    /(buildTypes\s*\{[\s\S]*?release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
    '$1signingConfig signingConfigs.release'
);

console.log('✅ Fixed signing configs for build types');

fs.writeFileSync(buildGradlePath, buildGradle);
console.log('✅ Updated build.gradle with release signing config');
console.log('');
console.log('🔨 Now run: cd android && ./gradlew bundleRelease');
