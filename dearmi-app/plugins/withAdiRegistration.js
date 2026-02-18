const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Google Play Android Developer Verification 용 토큰 파일을
 * Android APK 의 assets/ 폴더에 복사하는 Expo config plugin.
 *
 * 프로젝트 루트 `assets/adi-registration.properties` 는 Expo JS 번들용이라
 * APK 의 네이티브 assets/ 엔 자동 포함되지 않으므로 prebuild 단계에서 복사한다.
 */
const withAdiRegistration = (config) => {
  return withDangerousMod(config, [
    'android',
    async (cfg) => {
      const src = path.join(cfg.modRequest.projectRoot, 'assets', 'adi-registration.properties');
      const destDir = path.join(cfg.modRequest.platformProjectRoot, 'app', 'src', 'main', 'assets');
      const dest = path.join(destDir, 'adi-registration.properties');

      if (!fs.existsSync(src)) {
        throw new Error(`[withAdiRegistration] source missing: ${src}`);
      }
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(src, dest);

      return cfg;
    },
  ]);
};

module.exports = withAdiRegistration;
