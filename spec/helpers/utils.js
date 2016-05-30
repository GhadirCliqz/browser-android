'use strict';

let Promise = require('promise');

exports.dismissGoogleServicesDialog = function () {
  const resolveElementText = function(element) {
    return new Promise(function (resolve, reject) {
      element
        .text()
        .then((text) => {
          resolve({
            element: element,
            text: text
          });
        });
    });
  };
  let driver = this;
  return driver
    .elementsByClassName("android.widget.Button")
    .then((elements) => {
      const pr = elements.map((el) => resolveElementText(el));
      return Promise.all(pr);
    })
    .then((elements) => {
      elements.forEach((element) => {
        if ((element.text === 'Update') ||
          (element.text === 'Get Google Play services')) {
          return driver.back();
        }
      });
      return driver;
    })
};

exports.findWindowWithTitle = function (desiredTitle) {
  const driver = this;
  return driver
    .windowHandles()
      .then(function(handles) {
        return new Promise(function(resolve, reject) {
          let call = function() {
            if (handles.length == 0) {
              reject("Can't find " + desiredTitle + " window");
            } else {
              let handle = handles.pop();
              driver
                .window(handle)
                .title()
                  .then(function(title) {
                    if (title === desiredTitle) {
                      resolve(driver);
                    } else {
                      call();
                    }
                  });
            }
          }
          call();
        });
      });
};
