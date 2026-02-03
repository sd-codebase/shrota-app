const fs = require('fs');
const path = require('path');

const androidDir = path.join(__dirname, '..', 'android');
const buildGradlePath = path.join(androidDir, 'app', 'build.gradle');
const keystorePropsPath = path.join(androidDir, 'keystore.properties');

// Create keystore.properties
const keystoreProps = `storeFile=../../keystore/shrota-release.keystore
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
    buildGradle = buildGradle.replace(
        'android {',
        `// Load keystore properties for release signing
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {`
    );
    console.log('✅ Added keystore loader');
}

// 2. Add release signing config inside signingConfigs block
// Find the signingConfigs block and add release config after debug
const signingConfigsRegex = /(signingConfigs\s*\{[\s\S]*?debug\s*\{[^}]*\})/;

if (!buildGradle.includes('signingConfigs') || !buildGradle.match(/signingConfigs[\s\S]*?release\s*\{[\s\S]*?keystoreProperties/)) {
    buildGradle = buildGradle.replace(
        signingConfigsRegex,
        `$1
        release {
            if (keystorePropertiesFile.exists()) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }`
    );
    console.log('✅ Added release signing config');
}

// 3. Ensure release buildType uses signingConfigs.release
buildGradle = buildGradle.replace(
    /signingConfig signingConfigs\.debug(\s*\n\s*def enableShrinkResources)/,
    'signingConfig signingConfigs.release$1'
);

console.log('✅ Fixed signing config for release build type');

fs.writeFileSync(buildGradlePath, buildGradle);
console.log('✅ Updated build.gradle');
console.log('');
console.log('🔨 Now run: cd android && ./gradlew bundleRelease');
