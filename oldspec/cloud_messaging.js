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
    desired.app = require("./helpers/apps").androidStandardDebug;
    return driver
      .init(desired)
      .setImplicitWaitTimeout(3000)
      .installApp(config.helperUrl)
      .resetApp();
  });

  after(function () {
    return driver
      .removeApp("com.cliqz.browser.helper")
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

  it("should display notifications", function () {
    let title = "This is a test push notification";
    return driver
      .startActivity({appPackage: "com.cliqz.browser.helper", appActivity: ".MainActivity"})
      .waitForElementById("com.cliqz.browser.helper:id/send_msg_action")
        .click()
      .waitForElementById("com.cliqz.browser.helper:id/title")
        .sendKeys(title)
      .elementById("com.cliqz.browser.helper:id/url")
        .sendKeys("https://cdn.cliqz.com/mobile/browser/tests/testpage.html")
      .elementById("android:id/button2")
        .click()
      .openNotifications()
        .elementByName(title)
        .should.eventually.exist
      back();
  });
});
