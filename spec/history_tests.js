"use strict";

require("./helpers/setup");

var wd = require("wd"),
    _ = require('underscore'),
    serverConfigs = require('./helpers/appium-servers');

describe("History tests", function () {
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

  it("should save in history", function() {
      return driver
        .elementById("com.cliqz.browser:id/search_edit_text")
          .should.eventually.exist
          .sendKeys("m.facebook.com")
        .pressDeviceKey(66)
        .sleep(3000)
        .elementById("com.cliqz.browser:id/menu_history")
          .should.eventually.exist
          .click()
        .elementByName("m.facebook.com")
          .should.eventually.exist;
  });

  it("should not save history in incognito", function() {
      return driver
        .elementById("com.cliqz.browser:id/overflow_menu")
          .should.eventually.exist
          .click()
        .elementById("com.cliqz.browser:id/new_incognito_tab_menu_button")
          .should.eventually.exist
          .click()
        .elementById("com.cliqz.browser:id/search_edit_text")
          .should.eventually.exist
          .sendKeys("https://cdn.cliqz.com/mobile/browser/tests/testpage.html")
        .pressDeviceKey(66)
        .sleep(3000)
        .elementById("com.cliqz.browser:id/menu_history")
          .should.eventually.exist
          .click()
        .elementByName("Bisher hast Du noch nicht gesucht und warst auf keinen Webseiten.")
          .should.eventually.exist;
  });

  it("should delete history", function() {
     return driver
       .elementById("com.cliqz.browser:id/search_edit_text")
         .should.eventually.exist
         .sendKeys("https://cdn.cliqz.com/mobile/browser/tests/testpage.html")
       .pressDeviceKey(66)
       .sleep(3000)
       .elementById("com.cliqz.browser:id/overflow_menu")
         .should.eventually.exist
         .click()
       .elementById("com.cliqz.browser:id/settings_menu_button")
         .should.eventually.exist
         .click()
       .elementByName("Privacy")
         .should.eventually.exist
         .click()
       .elementByName("Clear History")
         .should.eventually.exist
         .click()
       .elementById("com.cliqz.browser:id/clear_history_queries")
         .should.eventually.exist
         .click()
       .elementById("android:id/button1")
         .should.eventually.exist
         .click()
       .back()
       .back()
       .elementById("com.cliqz.browser:id/menu_history")
         .should.eventually.exist
         .click()
       .elementByName("Bisher hast Du noch nicht gesucht und warst auf keinen Webseiten.")
         .should.eventually.exist;
  });

});
