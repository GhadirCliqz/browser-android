'use strict';
'api level: 17,18,19';

const testpage = "https://cdn.cliqz.com/mobile/browser/tests/testpage.html";

require("../helpers/setup");

var wd = require("wd"),
    _ = require('underscore'),
    Promise = require('promise'),
    serverConfig = require('../helpers/servers'),
    assert = require('chai').assert;

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

  it("should navigate to test page", function() {
    return driver
      .waitForElementByAccessibilityId("Search Bar")
        .sendKeys(testpage)
        .pressDeviceKey(66)
      .context("WEBVIEW_com.cliqz.browser")
      .elementById("datetime")
        .should.eventually.exist
      .context("NATIVE_APP")
  });

  it("should show multiple cards when in landscape", function() {
    const storage = { width: 0, x: 0 };
    return driver
      .waitForElementByAccessibilityId("Search Bar")
        .sendKeys("pippo")
      .setOrientation('LANDSCAPE')
      .context("WEBVIEW_com.cliqz.browser")
      .findWindowWithTitle("developer tool")
      .waitForElementById('cliqz-results')
        .then(function(el) {
          return driver.getSize(el);
        })
        .then(function(size) {
          storage.width = parseInt(size.width);
          return driver;
        })
      .eval("document.getElementsByClassName('frame')[2].style.left")
        .then(function (value) {
          storage.x = parseInt(value);
          return driver;
        })
      .context("NATIVE_APP")
        .then(function() {
          assert.isBelow(storage.x, storage.width, "The third card is not visible");
          return driver;
        });
  });
});
