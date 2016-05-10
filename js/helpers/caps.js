'use strict';

let api_levels = require('./api-levels');

let capabilities = {};

for (var k in api_levels) {
  if (api_levels.hasOwnProperty(k)) {
    capabilities[k] = {
      'appium-version': '1.5',
      platformName: 'Android',
      platformVersion: api_levels[k].version,
      deviceName: 'Android Device',
      app: undefined // will be set later
    }
  }
}

module.exports = capabilities;
