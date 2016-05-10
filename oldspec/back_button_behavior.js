"use strict";

require("./helpers/setup");

var wd = require("wd"),
    _ = require('underscore'),
    serverConfigs = require('./helpers/appium-servers');

describe("Back button behavior", function () {
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

  it("should exit if no history", function () {
    return driver
      .elementById("com.cliqz.browser:id/main_activity_content")
        .should.eventually.exist
      .hideKeyboard()
      .back()
      .elementById("com.cliqz.browser:id/main_activity_content")
        .should.be.rejected;
  });

  it("should go back to cards if in a web page", function() {
    return driver
      .elementById("com.cliqz.browser:id/search_edit_text")
        .should.eventually.exist
        .sendKeys("pippo")
      .sleep(3000)
      .elementByAccessibilityId("Pippo Pollina |")
        .should.eventually.exist
        .then(function(elem) {
          let action = new wd.TouchAction(driver);
          return action.press({el: elem}).wait(50).release().perform();
        })
      .context("NATIVE_APP")
      .sleep(5000)
      .back()
      .elementById("com.cliqz.browser:id/main_activity_content")
        .should.eventually.exist;
  });

  it("should navigate back", function() {
      return driver
        .elementById("com.cliqz.browser:id/search_edit_text")
          .should.eventually.exist
          .sendKeys("https://de.m.wikipedia.org/wiki/Rafael_Nadal")
        .pressDeviceKey(66)
        .sleep(3000)
        .context("WEBVIEW_com.cliqz.browser")
        .elementByLinkText("Spanien")
          .should.eventually.exist
          .click()
        .sleep(3000)
        .back()
        .context("NATIVE_APP")
        .sleep(3000)
        .elementById("com.cliqz.browser:id/title_bar")
          .tap()
        .elementById("com.cliqz.browser:id/search_edit_text")
          .text()
          .should.eventually.equal("https://de.m.wikipedia.org/wiki/Rafael_Nadal")
  });
});
