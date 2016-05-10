'use strict';

var apps = {};

let default_v21_apk = 'latest';
let default_v16_apk = 'latest';

if (process.env.TESTDROID) {
  apps['21+'] = process.env.CLIQZ_APK_V21_URL || default_v21_apk;
  apps['16+'] = process.env.CLIQZ_APK_V16_URL || default_v16_apk;
} else {
  apps['21+'] = __dirname + "/../../app/build/outputs/apk/app-standard-universal-debug.apk";
  apps['16+'] = __dirname + "/../../app/build/outputs/apk/app-xwalk-universal-debug.apk";
}

module.exports = apps;
