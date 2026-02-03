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

// Add keystore loading before "android {"
const keystoreLoader = `// Load keystore properties for release signing
def keystorePropertiesFile = rootProject.file("keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {`;

buildGradle = buildGradle.replace('android {', keystoreLoader);

// Add release signing config after debug signing config
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
    `debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }`,
    releaseSigningConfig
);

// Change release buildType to use release signing
buildGradle = buildGradle.replace(
    /buildTypes \{[\s\S]*?release \{[\s\S]*?signingConfig signingConfigs\.debug/,
    (match) => match.replace('signingConfigs.debug', 'signingConfigs.release')
);

fs.writeFileSync(buildGradlePath, buildGradle);
console.log('✅ Updated build.gradle with release signing config');
console.log('');
console.log('🔨 Now run: cd android && ./gradlew bundleRelease');
