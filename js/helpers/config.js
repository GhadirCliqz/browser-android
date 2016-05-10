'use strict';

let _ = require('underscore')
let servers = require("./servers");
let Devices = require("./devices");
let tests = require("./tests");
let apps = require("./apps");

let testsGroup = tests.reduce((result, test) => {
  for (var i = 1; i < 50; i++) {
    if (test.api_level(i)) {
      let group = result[""+i] || [];
      group.push(test);
      result[""+i] = group;
    }
  }
  return result;
}, {});

// let devicesAndTests = devices.map((device) => {
//   device.tests = testsGroup[device.api_level];
//   device.app = device.api_level < 21 ? apps['16+'] : apps['21+'];
//   return device;
// });
//
// let config = {
// };

// module.exports = config;

exports.loadConfig = function(callback) {
  Devices.loadDevices(function(devices) {
    let devicesAndTests = devices.map(function(device) {
      device.tests = testsGroup[device.api_level];
      device.app = device.api_level < 21 ? apps['16+'] : apps['21+'];
      return device;
    });
    callback({
      server: process.env.TESTDROID ? servers.testdroid : servers.local,
      driver: undefined,
      devices: devicesAndTests
    });
  });
};
