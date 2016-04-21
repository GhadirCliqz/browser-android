"use strict";

require("./helpers/setup");

var wd = require("wd"),
    _ = require('underscore'),
    serverConfigs = require('./helpers/appium-servers');

describe("Browser password manager", function () {
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
    // Create no onboarding file
    return driver
      .init(desired)
      .setImplicitWaitTimeout(10000)
      .pushFileToDevice("/sdcard/com.cliqz.browser.no_onboarding", "b3ZlcnJpZGU=")
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
    driver.resetApp();
  });

  it("should save passwords", function() {
      return driver
        .elementById("com.cliqz.browser:id/search_edit_text")
          .should.eventually.exist
          .sendKeys("m.facebook.com")
        .pressDeviceKey(66)
        .sleep(3000)
        .context("WEBVIEW_com.cliqz.browser")
        .elementByName("email")
          .should.eventually.exist
          .sendKeys("test@cliqz.com")
        .elementByName("pass")
          .should.eventually.exist
          .sendKeys("cliqz")
        .elementByName("login")
          .should.eventually.exist
          .click()
        .sleep(5000)
        .context("WEBVIEW_com.cliqz.browser")
        .elementByName("email")
          .getAttribute("value")
          .should.eventually.equal("test@cliqz.com")
        .elementByName("pass")
          .getAttribute("value")
          .should.eventually.equal("cliqz");
  });

});
