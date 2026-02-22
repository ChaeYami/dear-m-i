#!/usr/bin/env node
/**
 * 버전 동기화 스크립트 — app.json / package.json / Info.plist 한 번에 bump.
 *
 * Usage:
 *   node scripts/bump-version.js patch          # 1.0.2 → 1.0.3 + build/versionCode +1 (둘 다)
 *   node scripts/bump-version.js minor          # 1.0.2 → 1.1.0 + build/versionCode +1 (둘 다)
 *   node scripts/bump-version.js major          # 1.0.2 → 2.0.0 + build/versionCode +1 (둘 다)
 *   node scripts/bump-version.js build          # version 유지 + build/versionCode +1 (둘 다)
 *   node scripts/bump-version.js build:ios      # version 유지 + iOS buildNumber 만 +1
 *   node scripts/bump-version.js build:android  # version 유지 + Android versionCode 만 +1
 *   node scripts/bump-version.js 1.2.3          # 지정 버전 + build/versionCode +1 (둘 다)
 *
 * 업데이트 대상:
 *   - app.json              : expo.version, expo.ios.buildNumber, expo.android.versionCode
 *   - package.json          : version
 *   - ios/DearMI/Info.plist : CFBundleShortVersionString, CFBundleVersion
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const APP_JSON_PATH = path.join(ROOT, 'app.json');
const PKG_JSON_PATH = path.join(ROOT, 'package.json');
const INFO_PLIST_PATH = path.join(ROOT, 'ios/DearMI/Info.plist');

const SEMVER = /^(\d+)\.(\d+)\.(\d+)$/;

const arg = process.argv[2];
if (!arg) {
  console.error('Usage: node scripts/bump-version.js <patch|minor|major|build|build:ios|build:android|x.y.z>');
  process.exit(1);
}

const appJson = JSON.parse(fs.readFileSync(APP_JSON_PATH, 'utf8'));
const pkgJson = JSON.parse(fs.readFileSync(PKG_JSON_PATH, 'utf8'));

const currentVersion = appJson.expo.version;
const currentBuild = parseInt(appJson.expo.ios?.buildNumber ?? '0', 10);
const currentVersionCode = appJson.expo.android?.versionCode ?? 0;

let newVersion = currentVersion;
let bumpIos = true;
let bumpAndroid = true;

if (arg === 'build') {
  // keep version, bump both
} else if (arg === 'build:ios') {
  bumpAndroid = false;
} else if (arg === 'build:android') {
  bumpIos = false;
} else if (['patch', 'minor', 'major'].includes(arg)) {
  const m = currentVersion.match(SEMVER);
  if (!m) {
    console.error(`Cannot parse current version: ${currentVersion}`);
    process.exit(1);
  }
  let [, major, minor, patch] = m.map(Number);
  if (arg === 'patch') patch += 1;
  if (arg === 'minor') { minor += 1; patch = 0; }
  if (arg === 'major') { major += 1; minor = 0; patch = 0; }
  newVersion = `${major}.${minor}.${patch}`;
} else if (SEMVER.test(arg)) {
  newVersion = arg;
} else {
  console.error(`Invalid argument: ${arg}`);
  console.error('Expected: patch | minor | major | build | build:ios | build:android | x.y.z');
  process.exit(1);
}

const newBuild = bumpIos ? currentBuild + 1 : currentBuild;
const newVersionCode = bumpAndroid ? currentVersionCode + 1 : currentVersionCode;

appJson.expo.version = newVersion;
appJson.expo.ios = appJson.expo.ios ?? {};
appJson.expo.ios.buildNumber = String(newBuild);
appJson.expo.android = appJson.expo.android ?? {};
appJson.expo.android.versionCode = newVersionCode;
fs.writeFileSync(APP_JSON_PATH, JSON.stringify(appJson, null, 2) + '\n');

pkgJson.version = newVersion;
fs.writeFileSync(PKG_JSON_PATH, JSON.stringify(pkgJson, null, 2) + '\n');

let plist = fs.readFileSync(INFO_PLIST_PATH, 'utf8');
const shortVerRe = /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*(<\/string>)/;
const buildVerRe = /(<key>CFBundleVersion<\/key>\s*<string>)[^<]*(<\/string>)/;

if (!shortVerRe.test(plist) || !buildVerRe.test(plist)) {
  console.error('Info.plist: CFBundleShortVersionString 또는 CFBundleVersion 키를 찾지 못함');
  process.exit(1);
}

plist = plist
  .replace(shortVerRe, `$1${newVersion}$2`)
  .replace(buildVerRe, `$1${newBuild}$2`);
fs.writeFileSync(INFO_PLIST_PATH, plist);

console.log(`version:       ${currentVersion} -> ${newVersion}`);
console.log(`iOS build:     ${currentBuild} -> ${newBuild}${bumpIos ? '' : ' (유지)'}`);
console.log(`Android vCode: ${currentVersionCode} -> ${newVersionCode}${bumpAndroid ? '' : ' (유지)'}`);
console.log('');
console.log('Updated:');
console.log('  - app.json');
console.log('  - package.json');
console.log('  - ios/DearMI/Info.plist');
