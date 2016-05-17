'use strict';
'api level: 17,21';

require("../helpers/setup");

var wd = require("wd"),
    _ = require('underscore'),
    Promise = require('promise'),
    serverConfig = require('../helpers/servers');

console.log(serverConfig['cliqz_api_level']);
let id = (id) => process.env.APPIUM_API_LEVEL < 18 ? id : `com.cliqz.browser:id/${id}`;

describe("Browser", function () {
  this.timeout(300000);
  var driver;
  var allPassed = true;

  before(function () {
    driver = wd.promiseChainRemote(serverConfig);
    require("../helpers/logging").configure(driver);
    var desired = _.clone(require("../helpers/caps"));
    return driver
      .init(desired)
      .setImplicitWaitTimeout(3000);
      // .pushFileToDevice("/sdcard/com.cliqz.browser.no_onboarding", "")
      // .resetApp();
  });

  after(function () {
    return driver
      .quit();
  });

  it("should show onboarding", function () {
    return driver
      .dismissGoogleServicesDialog()
      .waitForElementByAccessibilityId("Next")
        .click()
      .waitForElementByAccessibilityId("Start now!")
        .click()
      .elementByAccessibilityId("Search Bar")
        .should.eventually.exist;
  });
});
