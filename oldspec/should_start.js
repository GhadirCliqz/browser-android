"use strict";

require("./helpers/setup");

var wd = require("wd"),
    _ = require('underscore'),
    serverConfigs = require('./helpers/appium-servers');

describe("Android Browser", function () {
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
      .pushFileToDevice("/sdcard/com.cliqz.browser.no_onboarding", "")
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

  it("should show onboarding", function () {
    return driver
      .elementById("com.cliqz.browser:id/next")
        .should.eventually.exist
      .click()
      .elementById("com.cliqz.browser:id/start_now")
        .should.eventually.exist
      .click()
      .elementById("com.cliqz.browser:id/search_edit_text")
        .should.eventually.exist
      .closeApp();
  });
});
