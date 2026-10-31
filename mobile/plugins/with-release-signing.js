const { withAppBuildGradle } = require('expo/config-plugins');

/*
 * Android release build'ni upload kaliti bilan imzolaydi (Google Play uchun).
 * Kalit loyihadan tashqarida: ~/.android-keys/autizmtest-upload.properties (storeFile, storePassword, keyAlias, keyPassword).
 * Boshqa joyda bo'lsa — AUTIZM_UPLOAD_PROPERTIES muhit o'zgaruvchisi. Fayl topilmasa, release debug kalit bilan yig'iladi.
 */

const MARKER = '// autizmtest-release-signing';

const SIGNING = `
${MARKER}
def uploadPropsFile = file(System.getenv("AUTIZM_UPLOAD_PROPERTIES") ?: "\${System.getProperty("user.home")}/.android-keys/autizmtest-upload.properties")
def uploadProps = new Properties()
if (uploadPropsFile.exists()) uploadPropsFile.withInputStream { uploadProps.load(it) }
`;

const RELEASE_CONFIG = `
        release {
            if (uploadPropsFile.exists()) {
                storeFile file(uploadProps.getProperty("storeFile"))
                storePassword uploadProps.getProperty("storePassword")
                keyAlias uploadProps.getProperty("keyAlias")
                keyPassword uploadProps.getProperty("keyPassword")
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let gradle = cfg.modResults.contents;
    if (gradle.includes(MARKER)) return cfg;

    gradle = gradle.replace(/^android \{/m, `${SIGNING}\nandroid {`);
    // signingConfigs { debug {...} } ichiga release qo'shiladi
    gradle = gradle.replace(/signingConfigs \{(\s*debug \{[\s\S]*?\n\s{8}\})/, (m, debug) => `signingConfigs {${debug}${RELEASE_CONFIG}`);
    // buildTypes.release: kalit bo'lsa release imzosi
    gradle = gradle.replace(
      /(buildTypes \{[\s\S]*?release \{[\s\S]*?)signingConfig signingConfigs\.debug/,
      '$1signingConfig uploadPropsFile.exists() ? signingConfigs.release : signingConfigs.debug',
    );
    cfg.modResults.contents = gradle;
    return cfg;
  });
};
