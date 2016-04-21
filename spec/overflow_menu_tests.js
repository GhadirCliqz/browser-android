"use strict";

require("./helpers/setup");

var wd = require("wd"),
    config = require("./helpers/config").config,
    _ = require('underscore'),
    serverConfigs = require('./helpers/appium-servers');

describe("Overflow menu", function () {
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

  it("should be displayed", function () {
    return driver
      .elementById("com.cliqz.browser:id/search_edit_text")
        .should.eventually.exist
      .elementById("com.cliqz.browser:id/overflow_menu")
        .should.eventually.exist
        .click()
      .sleep(1000)
      .elementById("com.cliqz.browser:id/copy_link_menu_button")
        .should.eventually.exist;
  });

  it("should copy link", function () {
    return driver
      .elementById("com.cliqz.browser:id/search_edit_text")
        .should.eventually.exist
        .sendKeys("https://de.m.wikipedia.org/wiki/Rafael_Nadal")
      .pressDeviceKey(66)
      .sleep(3000)
      .elementById("com.cliqz.browser:id/overflow_menu")
        .should.eventually.exist
        .click()
      .elementById("com.cliqz.browser:id/copy_link_menu_button")
        .should.eventually.exist
        .click()
      .elementById("com.cliqz.browser:id/title_bar")
        .should.eventually.exist
        .click()
      .elementById("com.cliqz.browser:id/search_edit_text")
        .clear()
      .pressDeviceKey(50, 28672) //ctrl + v
      .elementById("com.cliqz.browser:id/search_edit_text")
        .text()
        .should.eventually.equal("https://de.m.wikipedia.org/wiki/Rafael_Nadal")
  });

  it("should share link", function() {
    return driver
      .installApp(config.helperUrl)
      .waitForElementById("com.cliqz.browser:id/search_edit_text")
        .sendKeys("https://cdn.cliqz.com/mobile/browser/tests/testpage.html")
      .pressDeviceKey(66)
      .sleep(3000)
      .elementById("com.cliqz.browser:id/overflow_menu")
        .should.eventually.exist
        .click()
      .elementById("com.cliqz.browser:id/action_share")
        .should.eventually.exist
        .click()
      .elementByName("CLIQZ Tests Helper")
        .should.eventually.exist;
  });

  it("should contact CLIQZ", function() {
    return driver
      .installApp(config.helperUrl)
      .waitForElementById("com.cliqz.browser:id/overflow_menu")
        .click()
      .waitForElementById("com.cliqz.browser:id/contact_cliqz_menu_button")
        .click()
      .elementByName("CLIQZ Tests Helper")
        .should.eventually.exist;
  });

  it("should go to settings", function() {
    return driver
      .elementById("com.cliqz.browser:id/search_edit_text")
        .should.eventually.exist
        .sendKeys("https://de.m.wikipedia.org/wiki/Rafael_Nadal")
      .pressDeviceKey(66)
      .sleep(3000)
      .elementById("com.cliqz.browser:id/overflow_menu")
        .should.eventually.exist
        .click()
      .elementById("com.cliqz.browser:id/settings_menu_button")
        .should.eventually.exist
        .click()
      .elementByName("feedback@cliqz.com")
        .should.eventually.exist;
  });

  it("should go forward", function() {
    let frwdPage = "https://cdn.cliqz.com/mobile/browser/tests/forward_test.html";
    let testPage = "https://cdn.cliqz.com/mobile/browser/tests/testpage.html";
    return driver
      .waitForElementById("com.cliqz.browser:id/search_edit_text")
        .sendKeys(frwdPage)
      .pressDeviceKey(66)
      .sleep(3000)
      .context("WEBVIEW_com.cliqz.browser")
      .waitForElementById("testlink")
        .click()
      .waitForElementById("datetime")
      .context("NATIVE_APP")
      .back()
      .waitForElementById("com.cliqz.browser:id/overflow_menu")
        .click()
      .waitForElementById("com.cliqz.browser:id/action_forward")
        .click()
      .context("WEBVIEW_com.cliqz.browser")
        .waitForElementById("datetime")
      .context("NATIVE_APP");
  });

  // Right now it will only check changes in the url, later we will check for
  // the tab to be listed in the tab manager
  it("should open a new tab", function() {
    return driver
      .elementById("com.cliqz.browser:id/search_edit_text")
        .should.eventually.exist
        .sendKeys("https://de.m.wikipedia.org/")
      .pressDeviceKey(66)
      .sleep(3000)
      .elementById("com.cliqz.browser:id/overflow_menu")
        .should.eventually.exist
        .click()
      .elementById("com.cliqz.browser:id/new_tab_menu_button")
        .should.eventually.exist
        .click()
      .sleep(3000)
      .elementById("com.cliqz.browser:id/search_edit_text")
        .should.eventually.exist
        .text()
        .should.eventually.equal("Search")
      .back()
      .resetApp(); // Always press back when opening a new tab
  });

  it("should open a new incognito tab", function() {
    return driver
      .elementById("com.cliqz.browser:id/overflow_menu")
        .should.eventually.exist
        .click()
      .elementById("com.cliqz.browser:id/new_incognito_tab_menu_button")
        .should.eventually.exist
        .click()
      .elementById("com.cliqz.browser:id/overflow_menu")
         .click()
      .elementsById("com.cliqz.browser:id/new_tab_menu_button")
        .should.eventually.have.lengthOf(0)
      .elementsById("com.cliqz.browser:id/add_to_favorites_menu_button")
        .should.eventually.have.lengthOf(0)
      .back(); // Always press back when opening a new tab
  });

});
