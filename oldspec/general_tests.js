"use strict";

require("./helpers/setup");

var wd = require("wd"),
    _ = require('underscore'),
    config = require("./helpers/config").config,
    serverConfigs = require('./helpers/appium-servers');

describe("Browser", function () {
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

  it("should autocomlete", function() {
     return driver
       .elementById("com.cliqz.browser:id/search_edit_text")
         .should.eventually.exist
       .sendKeys("face")
       .sleep(3000)
         .text()
         .should.eventually.equal("facebook.com/");
  });

  it("should open tab instead of image", function() {
    return driver
      .waitForElementById("com.cliqz.browser:id/search_edit_text")
        .should.eventually.exist
        .sendKeys("http://m.idealo.de/")
      .pressDeviceKey(66)
      .context("WEBVIEW_com.cliqz.browser")
      .waitForElementByClassName("carousel-slideLink")
        .should.eventually.exist
        .click()
      .waitForElementByClassName("productVariants-listItem")
        .should.eventually.exist
        .click()
      .waitForElementByClassName("productOffers-listItem")
        .should.eventually.exist
        .click()
      .context("NATIVE_APP")
      .sleep(3000)
      .elementById("com.cliqz.browser:id/title_bar")
        .should.eventually.exist
      .back();
  });

  it("should go to complementary search enginge", function() {
     return driver
       .waitForElementById("com.cliqz.browser:id/overflow_menu")
         .should.eventually.exist
         .click()
       .waitForElementById("com.cliqz.browser:id/settings_menu_button")
         .should.eventually.exist
         .click()
       .elementByName("General")
         .should.eventually.exist
         .click()
       .elementByName("Complementary search engine")
         .should.eventually.exist
         .click()
       .elementByName("Bing")
         .should.eventually.exist
         .click()
       .elementById("android:id/button3")
         .should.eventually.exist
         .click()
       .back()
       .back()
       .elementById("com.cliqz.browser:id/search_edit_text")
         .should.eventually.exist
         .click()
         .sendKeys("Rafael Nadal")
       .pressDeviceKey(66)
       .sleep(3000)
       .elementById("com.cliqz.browser:id/title_bar")
         .should.eventually.exist
         .text()
         .should.eventually.contain("Bing");
  });

  // Remember: the default state is to have the ad-blocker enabled
  it("should block advertisement", function() {
    let size = { h: -1 };
    return driver
      .elementById("com.cliqz.browser:id/search_edit_text")
        .sendKeys("https://cdn.cliqz.com/mobile/browser/tests/advertisement.html")
        .pressDeviceKey(66)
      .contexts()
      .context("WEBVIEW_com.cliqz.browser")
      .waitForElementById("sample")
        .getAttribute("height")
        .then(function(h) {
          size.h = h;
          return driver;
        })
      .context("NATIVE_APP")
      .elementById("com.cliqz.browser:id/overflow_menu")
        .click()
      .elementById("com.cliqz.browser:id/settings_menu_button")
        .click()
      .waitForElementByName("General")
        .click()
      .waitForElementByName("Block Ads")
        .click()
      .back()
      .back()
      .elementById("com.cliqz.browser:id/overflow_menu")
        .click()
      .elementById("com.cliqz.browser:id/action_refresh")
        .click()
      .context("WEBVIEW_com.cliqz.browser")
        .waitForElementById("sample")
          .getAttribute("height")
          .should.eventually.be.above(size.h)
      .context("NATIVE_APP");
  });

  it("should not load images", function() {
     return driver
     .elementById("com.cliqz.browser:id/search_edit_text")
       .should.eventually.exist
       .sendKeys("https://cdn.cliqz.com/mobile/browser/tests/single_image.html")
     .pressDeviceKey(66)
     .elementById("com.cliqz.browser:id/overflow_menu")
       .should.eventually.exist
       .click()
     .elementById("com.cliqz.browser:id/settings_menu_button")
       .should.eventually.exist
       .click()
     .elementByName("General")
       .should.eventually.exist
       .click()
     .elementByName("Block Images")
       .should.eventually.exist
       .click()
     .back()
     .back()
     .elementById("com.cliqz.browser:id/overflow_menu")
       .should.eventually.exist
       .click()
     .elementById("com.cliqz.browser:id/action_refresh")
       .should.eventually.exist
       .click()
     .sleep(3000)
     .context("WEBVIEW_com.cliqz.browser")
     .elementById("sample")
       .should.eventually.exist
       .getAttribute("height")
       .should.eventually.equal("0")
    .context("NATIVE_APP");
  });

  it("should handle open url from outside", function() {
    return driver
      .installApp(config.helperUrl)
      .pressDeviceKey(3)
      .startActivity({appPackage: "com.cliqz.browser.helper", appActivity: ".MainActivity"})
      .waitForElementById("com.cliqz.browser.helper:id/open_url_action")
        .click()
      .waitForElementByName("CLIQZ Browser")
        .click()
      .context("WEBVIEW_com.cliqz.browser")
      .waitForElementById("datetime")
      .context("NATIVE_APP")
      .waitForElementById("com.cliqz.browser:id/title_bar")
        .text()
        .should.eventually.equal("CLIQZ Browser Test Page");
  });

  it("should refresh the currentpage", function() {
    let d = { dt: "" };
    return driver
      .elementById("com.cliqz.browser:id/search_edit_text")
        .sendKeys("https://cdn.cliqz.com/mobile/browser/tests/testpage.html")
        .pressDeviceKey(66)
      .context("WEBVIEW_com.cliqz.browser")
      .waitForElementById("datetime")
        .getAttribute("innerHTML")
        .then(function(t) {
          d.dt = t;
          return driver;
        })
      .context("NATIVE_APP")
      .elementById("com.cliqz.browser:id/overflow_menu")
        .click()
      .waitForElementById("com.cliqz.browser:id/action_refresh")
        .click()
      .sleep(3000)
      .context("WEBVIEW_com.cliqz.browser")
      .waitForElementById("datetime")
        .getAttribute("innerHTML")
        .should.eventually.not.equal(d.dt)
      .context("NATIVE_APP");
  });

  it("should block adult content", function() {
     return driver
       .elementById("com.cliqz.browser:id/search_edit_text")
         .should.eventually.exist
         .sendKeys("titten")
       .sleep(3000)
       .elementByName("We don't have great results this time.")
        .should.eventually.exist;
  });

});
