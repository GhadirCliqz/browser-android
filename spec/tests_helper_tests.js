"use strict";

require("./helpers/setup");

var wd = require("wd"),
    _ = require('underscore'),
    config = require("./helpers/config").config,
    serverConfigs = require('./helpers/appium-servers');

describe("Tests helper", function () {
  this.timeout(300000);
  var driver;
  var allPassed = true;

  before(function () {
    var serverConfig = process.env.SAUCE ?
      serverConfigs.sauce : serverConfigs.local;
    driver = wd.promiseChainRemote(serverConfig);
    require("./helpers/logging").configure(driver);

    var desired = _.clone(require("./helpers/caps").android21);
    // var desired = process.env.SAUCE ?
    //   _.clone(require("./helpers/caps").android18) :
    //   _.clone(require("./helpers/caps").android19);
    desired.app = require("./helpers/apps").androidStandardDebug;
    // if (process.env.SAUCE) {
    //   desired.name = 'android - simple';
    //   desired.tags = ['sample'];
    // }
    return driver
      .init(desired)
      .setImplicitWaitTimeout(3000)
      .pushFileToDevice("/sdcard/com.cliqz.browser.no_onboarding", "b3ZlcnJpZGU=")
      .installApp(config.helperUrl)
      .resetApp();
  });

  after(function () {
    return driver
      .quit()
      .finally(function () {
        if (process.env.SAUCE) {
          return driver.sauceJobStatus(allPassed);
        }
      });
  });

  afterEach(function () {
    allPassed = allPassed && this.currentTest.state === 'passed';
  });

  it("should be installed and start up", function () {
    return driver
      .pressDeviceKey(3)
      .startActivity({appPackage: "com.cliqz.browser.helper", appActivity: ".MainActivity"})
      .elementById("com.cliqz.browser.helper:id/open_url_action")
        .should.eventually.exist;
  });
});
