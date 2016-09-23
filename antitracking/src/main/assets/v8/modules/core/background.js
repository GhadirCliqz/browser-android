System.register("core/background", ["core/cliqz", "platform/language", "core/config", "platform/process-script-manager"], function (_export) {
  "use strict";

  var utils, events, Promise, language, config, ProcessScriptManager, lastRequestId, callbacks;
  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
      events = _coreCliqz.events;
      Promise = _coreCliqz.Promise;
    }, function (_platformLanguage) {
      language = _platformLanguage["default"];
    }, function (_coreConfig) {
      config = _coreConfig["default"];
    }, function (_platformProcessScriptManager) {
      ProcessScriptManager = _platformProcessScriptManager["default"];
    }],
    execute: function () {
      lastRequestId = 0;
      callbacks = {};

      _export("default", {

        init: function init(settings) {
          this.dispatchMessage = this.dispatchMessage.bind(this);

          utils.bindObjectFunctions(this.actions, this);

          this.mm = new ProcessScriptManager(this.dispatchMessage);
          this.mm.init();
        },

        unload: function unload() {
          this.mm.unload();
        },

        queryHTML: function queryHTML(url, selector, attribute) {
          var requestId = lastRequestId++,
              documents = [];

          this.mm.broadcast("cliqz:core", {
            action: "queryHTML",
            url: url,
            args: [selector, attribute],
            requestId: requestId
          });

          return new Promise(function (resolve, reject) {
            callbacks[requestId] = function (attributeValues) {
              delete callbacks[requestId];
              resolve(attributeValues);
            };

            utils.setTimeout(function () {
              delete callbacks[requestId];
              reject();
            }, 1000);
          });
        },

        getHTML: function getHTML(url) {
          var timeout = arguments.length <= 1 || arguments[1] === undefined ? 1000 : arguments[1];

          var requestId = lastRequestId++,
              documents = [];

          this.mm.broadcast("cliqz:core", {
            action: "getHTML",
            url: url,
            args: [],
            requestId: requestId
          });

          callbacks[requestId] = function (doc) {
            documents.push(doc);
          };

          return new Promise(function (resolve) {
            utils.setTimeout(function () {
              delete callbacks[requestId];
              resolve(documents);
            }, timeout);
          });
        },

        getCookie: function getCookie(url) {
          var requestId = lastRequestId++,
              documents = [];

          this.mm.broadcast("cliqz:core", {
            action: "getCookie",
            url: url,
            args: [],
            requestId: requestId
          });

          return new Promise(function (resolve, reject) {
            callbacks[requestId] = function (attributeValues) {
              delete callbacks[requestId];
              resolve(attributeValues);
            };

            utils.setTimeout(function () {
              delete callbacks[requestId];
              reject();
            }, 1000);
          });
        },

        dispatchMessage: function dispatchMessage(msg) {
          if (typeof msg.data.requestId === "number") {
            if (msg.data.requestId in callbacks) {
              this.handleResponse(msg);
            }
          } else {
            this.handleRequest(msg);
          }
        },

        handleRequest: function handleRequest(msg) {
          var _this = this;

          var _msg$data$payload = msg.data.payload;
          var action = _msg$data$payload.action;
          var module = _msg$data$payload.module;
          var args = _msg$data$payload.args;
          var requestId = _msg$data$payload.requestId;
          var windowId = msg.data.windowId;
          utils.importModule(module + "/background").then(function (module) {
            var background = module["default"];
            return background.actions[action].apply(null, args);
          }).then(function (response) {
            _this.mm.broadcast("window-" + windowId, {
              response: response,
              action: msg.data.payload.action,
              requestId: requestId
            });
          })["catch"](function (e) {
            return utils.log(e.toString() + "--" + e.stack, "Problem with frameScript");
          });
        },

        handleResponse: function handleResponse(msg) {
          callbacks[msg.data.requestId].apply(null, [msg.data.payload]);
        },

        getWindowStatusFromModules: function getWindowStatusFromModules(win) {
          return config.modules.map(function (moduleName) {
            var module = win.CLIQZ.Core.windowModules[moduleName];
            return module && module.status ? module.status() : {};
          });
        },

        actions: {
          getWindowStatus: function getWindowStatus(win) {
            return Promise.all(this.getWindowStatusFromModules(win)).then(function (allStatus) {
              var result = {};

              allStatus.forEach(function (status, moduleIdx) {
                result[config.modules[moduleIdx]] = status || null;
              });

              return result;
            });
          },
          sendTelemetry: function sendTelemetry(msg) {
            utils.telemetry(msg);
            return Promise.resolve();
          },
          queryCliqz: function queryCliqz(query) {
            var urlBar = utils.getWindow().document.getElementById("urlbar");
            urlBar.focus();
            urlBar.mInputField.focus();
            urlBar.mInputField.setUserInput(query);
          },
          setUrlbar: function setUrlbar(value) {
            return this.actions.queryCliqz(value);
          },
          recordLang: function recordLang(url, lang) {
            if (lang) {
              language.addLocale(url, lang);
            }
            return Promise.resolve();
          },
          recordMeta: function recordMeta(url, meta) {
            events.pub("core:url-meta", url, meta);
          },

          getFeedbackPage: function getFeedbackPage() {
            return utils.FEEDBACK_URL;
          }
        }
      });
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvYmFja2dyb3VuZC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7c0VBS0ksYUFBYSxFQUNiLFNBQVM7Ozt5QkFOSixLQUFLOzBCQUFFLE1BQU07MkJBQUUsT0FBTzs7Ozs7Ozs7O0FBSzNCLG1CQUFhLEdBQUcsQ0FBQztBQUNqQixlQUFTLEdBQUcsRUFBRTs7eUJBRUg7O0FBRWIsWUFBSSxFQUFBLGNBQUMsUUFBUSxFQUFFO0FBQ2IsY0FBSSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQzs7QUFFdkQsZUFBSyxDQUFDLG1CQUFtQixDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsSUFBSSxDQUFDLENBQUM7O0FBRTlDLGNBQUksQ0FBQyxFQUFFLEdBQUcsSUFBSSxvQkFBb0IsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7QUFDekQsY0FBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLEVBQUUsQ0FBQztTQUNoQjs7QUFFRCxjQUFNLEVBQUEsa0JBQUc7QUFDUCxjQUFJLENBQUMsRUFBRSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQ2xCOztBQUVELGlCQUFTLEVBQUEsbUJBQUMsR0FBRyxFQUFFLFFBQVEsRUFBRSxTQUFTLEVBQUU7QUFDbEMsY0FBTSxTQUFTLEdBQUcsYUFBYSxFQUFFO2NBQzNCLFNBQVMsR0FBRyxFQUFFLENBQUM7O0FBRXJCLGNBQUksQ0FBQyxFQUFFLENBQUMsU0FBUyxDQUFDLFlBQVksRUFBRTtBQUM5QixrQkFBTSxFQUFFLFdBQVc7QUFDbkIsZUFBRyxFQUFILEdBQUc7QUFDSCxnQkFBSSxFQUFFLENBQUMsUUFBUSxFQUFFLFNBQVMsQ0FBQztBQUMzQixxQkFBUyxFQUFULFNBQVM7V0FDVixDQUFDLENBQUM7O0FBRUgsaUJBQU8sSUFBSSxPQUFPLENBQUUsVUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFLO0FBQ3ZDLHFCQUFTLENBQUMsU0FBUyxDQUFDLEdBQUcsVUFBVSxlQUFlLEVBQUU7QUFDaEQscUJBQU8sU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzVCLHFCQUFPLENBQUMsZUFBZSxDQUFDLENBQUM7YUFDMUIsQ0FBQzs7QUFFRixpQkFBSyxDQUFDLFVBQVUsQ0FBQyxZQUFZO0FBQzNCLHFCQUFPLFNBQVMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUM1QixvQkFBTSxFQUFFLENBQUM7YUFDVixFQUFFLElBQUksQ0FBQyxDQUFDO1dBQ1YsQ0FBQyxDQUFDO1NBQ0o7O0FBRUQsZUFBTyxFQUFBLGlCQUFDLEdBQUcsRUFBa0I7Y0FBaEIsT0FBTyx5REFBRyxJQUFJOztBQUN6QixjQUFNLFNBQVMsR0FBRyxhQUFhLEVBQUU7Y0FDM0IsU0FBUyxHQUFHLEVBQUUsQ0FBQzs7QUFFckIsY0FBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFO0FBQzlCLGtCQUFNLEVBQUUsU0FBUztBQUNqQixlQUFHLEVBQUgsR0FBRztBQUNILGdCQUFJLEVBQUUsRUFBRTtBQUNSLHFCQUFTLEVBQVQsU0FBUztXQUNWLENBQUMsQ0FBQzs7QUFFSCxtQkFBUyxDQUFDLFNBQVMsQ0FBQyxHQUFHLFVBQVUsR0FBRyxFQUFFO0FBQ3BDLHFCQUFTLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1dBQ3JCLENBQUM7O0FBRUYsaUJBQU8sSUFBSSxPQUFPLENBQUUsVUFBQSxPQUFPLEVBQUk7QUFDN0IsaUJBQUssQ0FBQyxVQUFVLENBQUMsWUFBWTtBQUMzQixxQkFBTyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDNUIscUJBQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQzthQUNwQixFQUFFLE9BQU8sQ0FBQyxDQUFDO1dBQ2IsQ0FBQyxDQUFDO1NBQ0o7O0FBRUQsaUJBQVMsRUFBQSxtQkFBQyxHQUFHLEVBQUU7QUFDYixjQUFNLFNBQVMsR0FBRyxhQUFhLEVBQUU7Y0FDM0IsU0FBUyxHQUFHLEVBQUUsQ0FBQzs7QUFFckIsY0FBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLENBQUMsWUFBWSxFQUFFO0FBQzlCLGtCQUFNLEVBQUUsV0FBVztBQUNuQixlQUFHLEVBQUgsR0FBRztBQUNILGdCQUFJLEVBQUUsRUFBRTtBQUNSLHFCQUFTLEVBQVQsU0FBUztXQUNWLENBQUMsQ0FBQzs7QUFFSCxpQkFBTyxJQUFJLE9BQU8sQ0FBRSxVQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUs7QUFDdkMscUJBQVMsQ0FBQyxTQUFTLENBQUMsR0FBRyxVQUFVLGVBQWUsRUFBRTtBQUNoRCxxQkFBTyxTQUFTLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDNUIscUJBQU8sQ0FBQyxlQUFlLENBQUMsQ0FBQzthQUMxQixDQUFDOztBQUVGLGlCQUFLLENBQUMsVUFBVSxDQUFDLFlBQVk7QUFDM0IscUJBQU8sU0FBUyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQzVCLG9CQUFNLEVBQUUsQ0FBQzthQUNWLEVBQUUsSUFBSSxDQUFDLENBQUM7V0FDVixDQUFDLENBQUM7U0FDSjs7QUFFRCx1QkFBZSxFQUFBLHlCQUFDLEdBQUcsRUFBRTtBQUNuQixjQUFJLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLEtBQUssUUFBUSxFQUFFO0FBQzFDLGdCQUFJLEdBQUcsQ0FBQyxJQUFJLENBQUMsU0FBUyxJQUFJLFNBQVMsRUFBRTtBQUNuQyxrQkFBSSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUMxQjtXQUNGLE1BQU07QUFDTCxnQkFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsQ0FBQztXQUN6QjtTQUNGOztBQUVELHFCQUFhLEVBQUEsdUJBQUMsR0FBRyxFQUFFOzs7a0NBQzJCLEdBQUcsQ0FBQyxJQUFJLENBQUMsT0FBTztjQUFwRCxNQUFNLHFCQUFOLE1BQU07Y0FBRSxNQUFNLHFCQUFOLE1BQU07Y0FBRSxJQUFJLHFCQUFKLElBQUk7QUFBdEIsY0FBd0IsU0FBUyxxQkFBVCxTQUFTLENBQXFCO0FBQ3RELGNBQUEsUUFBUSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFBO0FBQ2xDLGVBQUssQ0FBQyxZQUFZLENBQUksTUFBTSxpQkFBYyxDQUFDLElBQUksQ0FBRSxVQUFBLE1BQU0sRUFBSTtBQUN6RCxnQkFBTSxVQUFVLEdBQUcsTUFBTSxXQUFRLENBQUM7QUFDbEMsbUJBQU8sVUFBVSxDQUFDLE9BQU8sQ0FBQyxNQUFNLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1dBQ3JELENBQUMsQ0FBQyxJQUFJLENBQUUsVUFBQSxRQUFRLEVBQUk7QUFDbkIsa0JBQUssRUFBRSxDQUFDLFNBQVMsYUFBVyxRQUFRLEVBQUk7QUFDdEMsc0JBQVEsRUFBUixRQUFRO0FBQ1Isb0JBQU0sRUFBRSxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxNQUFNO0FBQy9CLHVCQUFTLEVBQVQsU0FBUzthQUNWLENBQUMsQ0FBQztXQUNKLENBQUMsU0FBTSxDQUFFLFVBQUEsQ0FBQzttQkFBSSxLQUFLLENBQUMsR0FBRyxDQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsVUFBSyxDQUFDLENBQUMsS0FBSyxFQUFJLDBCQUEwQixDQUFDO1dBQUEsQ0FBRSxDQUFDO1NBQ3ZGOztBQUVELHNCQUFjLEVBQUEsd0JBQUMsR0FBRyxFQUFFO0FBQ2xCLG1CQUFTLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQyxDQUFDO1NBQy9EOztBQUVELGtDQUEwQixFQUFBLG9DQUFDLEdBQUcsRUFBQztBQUM3QixpQkFBTyxNQUFNLENBQUMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxVQUFDLFVBQVUsRUFBSztBQUN4QyxnQkFBSSxNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQ3RELG1CQUFPLE1BQU0sSUFBSSxNQUFNLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLENBQUE7V0FDdEQsQ0FBQyxDQUFBO1NBQ0g7O0FBRUQsZUFBTyxFQUFFO0FBQ1AseUJBQWUsRUFBQSx5QkFBQyxHQUFHLEVBQUU7QUFDbkIsbUJBQU8sT0FBTyxDQUNYLEdBQUcsQ0FBQyxJQUFJLENBQUMsMEJBQTBCLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FDekMsSUFBSSxDQUFDLFVBQUMsU0FBUyxFQUFLO0FBQ25CLGtCQUFJLE1BQU0sR0FBRyxFQUFFLENBQUE7O0FBRWYsdUJBQVMsQ0FBQyxPQUFPLENBQUMsVUFBQyxNQUFNLEVBQUUsU0FBUyxFQUFLO0FBQ3ZDLHNCQUFNLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLE1BQU0sSUFBSSxJQUFJLENBQUM7ZUFDcEQsQ0FBQyxDQUFBOztBQUVGLHFCQUFPLE1BQU0sQ0FBQzthQUNmLENBQUMsQ0FBQTtXQUNMO0FBQ0QsdUJBQWEsRUFBQSx1QkFBQyxHQUFHLEVBQUU7QUFDakIsaUJBQUssQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDckIsbUJBQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1dBQzFCO0FBQ0Qsb0JBQVUsRUFBQSxvQkFBQyxLQUFLLEVBQUU7QUFDaEIsZ0JBQUksTUFBTSxHQUFHLEtBQUssQ0FBQyxTQUFTLEVBQUUsQ0FBQyxRQUFRLENBQUMsY0FBYyxDQUFDLFFBQVEsQ0FBQyxDQUFBO0FBQ2hFLGtCQUFNLENBQUMsS0FBSyxFQUFFLENBQUM7QUFDZixrQkFBTSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUMzQixrQkFBTSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLENBQUM7V0FDeEM7QUFDRCxtQkFBUyxFQUFBLG1CQUFDLEtBQUssRUFBRTtBQUNmLG1CQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1dBQ3ZDO0FBQ0Qsb0JBQVUsRUFBQSxvQkFBQyxHQUFHLEVBQUUsSUFBSSxFQUFFO0FBQ3BCLGdCQUFJLElBQUksRUFBRTtBQUNSLHNCQUFRLENBQUMsU0FBUyxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUMsQ0FBQzthQUMvQjtBQUNELG1CQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztXQUMxQjtBQUNELG9CQUFVLEVBQUEsb0JBQUMsR0FBRyxFQUFFLElBQUksRUFBRTtBQUNwQixrQkFBTSxDQUFDLEdBQUcsQ0FBQyxlQUFlLEVBQUUsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO1dBQ3hDOztBQUVELHlCQUFlLEVBQUEsMkJBQUc7QUFDaEIsbUJBQU8sS0FBSyxDQUFDLFlBQVksQ0FBQztXQUMzQjtTQUNGO09BQ0YiLCJmaWxlIjoiY29yZS9iYWNrZ3JvdW5kLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXRpbHMsIGV2ZW50cywgUHJvbWlzZSB9IGZyb20gXCJjb3JlL2NsaXF6XCI7XG5pbXBvcnQgbGFuZ3VhZ2UgZnJvbSBcInBsYXRmb3JtL2xhbmd1YWdlXCI7XG5pbXBvcnQgY29uZmlnIGZyb20gXCJjb3JlL2NvbmZpZ1wiO1xuaW1wb3J0IFByb2Nlc3NTY3JpcHRNYW5hZ2VyIGZyb20gXCJwbGF0Zm9ybS9wcm9jZXNzLXNjcmlwdC1tYW5hZ2VyXCI7XG5cbnZhciBsYXN0UmVxdWVzdElkID0gMDtcbnZhciBjYWxsYmFja3MgPSB7fTtcblxuZXhwb3J0IGRlZmF1bHQge1xuXG4gIGluaXQoc2V0dGluZ3MpIHtcbiAgICB0aGlzLmRpc3BhdGNoTWVzc2FnZSA9IHRoaXMuZGlzcGF0Y2hNZXNzYWdlLmJpbmQodGhpcyk7XG5cbiAgICB1dGlscy5iaW5kT2JqZWN0RnVuY3Rpb25zKHRoaXMuYWN0aW9ucywgdGhpcyk7XG5cbiAgICB0aGlzLm1tID0gbmV3IFByb2Nlc3NTY3JpcHRNYW5hZ2VyKHRoaXMuZGlzcGF0Y2hNZXNzYWdlKTtcbiAgICB0aGlzLm1tLmluaXQoKTtcbiAgfSxcblxuICB1bmxvYWQoKSB7XG4gICAgdGhpcy5tbS51bmxvYWQoKTtcbiAgfSxcblxuICBxdWVyeUhUTUwodXJsLCBzZWxlY3RvciwgYXR0cmlidXRlKSB7XG4gICAgY29uc3QgcmVxdWVzdElkID0gbGFzdFJlcXVlc3RJZCsrLFxuICAgICAgICAgIGRvY3VtZW50cyA9IFtdO1xuXG4gICAgdGhpcy5tbS5icm9hZGNhc3QoXCJjbGlxejpjb3JlXCIsIHtcbiAgICAgIGFjdGlvbjogXCJxdWVyeUhUTUxcIixcbiAgICAgIHVybCxcbiAgICAgIGFyZ3M6IFtzZWxlY3RvciwgYXR0cmlidXRlXSxcbiAgICAgIHJlcXVlc3RJZFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKCAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjYWxsYmFja3NbcmVxdWVzdElkXSA9IGZ1bmN0aW9uIChhdHRyaWJ1dGVWYWx1ZXMpIHtcbiAgICAgICAgZGVsZXRlIGNhbGxiYWNrc1tyZXF1ZXN0SWRdO1xuICAgICAgICByZXNvbHZlKGF0dHJpYnV0ZVZhbHVlcyk7XG4gICAgICB9O1xuXG4gICAgICB1dGlscy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZGVsZXRlIGNhbGxiYWNrc1tyZXF1ZXN0SWRdO1xuICAgICAgICByZWplY3QoKTtcbiAgICAgIH0sIDEwMDApO1xuICAgIH0pO1xuICB9LFxuXG4gIGdldEhUTUwodXJsLCB0aW1lb3V0ID0gMTAwMCkge1xuICAgIGNvbnN0IHJlcXVlc3RJZCA9IGxhc3RSZXF1ZXN0SWQrKyxcbiAgICAgICAgICBkb2N1bWVudHMgPSBbXTtcblxuICAgIHRoaXMubW0uYnJvYWRjYXN0KFwiY2xpcXo6Y29yZVwiLCB7XG4gICAgICBhY3Rpb246IFwiZ2V0SFRNTFwiLFxuICAgICAgdXJsLFxuICAgICAgYXJnczogW10sXG4gICAgICByZXF1ZXN0SWRcbiAgICB9KTtcblxuICAgIGNhbGxiYWNrc1tyZXF1ZXN0SWRdID0gZnVuY3Rpb24gKGRvYykge1xuICAgICAgZG9jdW1lbnRzLnB1c2goZG9jKTtcbiAgICB9O1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKCByZXNvbHZlID0+IHtcbiAgICAgIHV0aWxzLnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBkZWxldGUgY2FsbGJhY2tzW3JlcXVlc3RJZF07XG4gICAgICAgIHJlc29sdmUoZG9jdW1lbnRzKTtcbiAgICAgIH0sIHRpbWVvdXQpO1xuICAgIH0pO1xuICB9LFxuXG4gIGdldENvb2tpZSh1cmwpIHtcbiAgICBjb25zdCByZXF1ZXN0SWQgPSBsYXN0UmVxdWVzdElkKyssXG4gICAgICAgICAgZG9jdW1lbnRzID0gW107XG5cbiAgICB0aGlzLm1tLmJyb2FkY2FzdChcImNsaXF6OmNvcmVcIiwge1xuICAgICAgYWN0aW9uOiBcImdldENvb2tpZVwiLFxuICAgICAgdXJsLFxuICAgICAgYXJnczogW10sXG4gICAgICByZXF1ZXN0SWRcbiAgICB9KTtcblxuICAgIHJldHVybiBuZXcgUHJvbWlzZSggKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgY2FsbGJhY2tzW3JlcXVlc3RJZF0gPSBmdW5jdGlvbiAoYXR0cmlidXRlVmFsdWVzKSB7XG4gICAgICAgIGRlbGV0ZSBjYWxsYmFja3NbcmVxdWVzdElkXTtcbiAgICAgICAgcmVzb2x2ZShhdHRyaWJ1dGVWYWx1ZXMpO1xuICAgICAgfTtcblxuICAgICAgdXRpbHMuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGRlbGV0ZSBjYWxsYmFja3NbcmVxdWVzdElkXTtcbiAgICAgICAgcmVqZWN0KCk7XG4gICAgICB9LCAxMDAwKTtcbiAgICB9KTtcbiAgfSxcblxuICBkaXNwYXRjaE1lc3NhZ2UobXNnKSB7XG4gICAgaWYgKHR5cGVvZiBtc2cuZGF0YS5yZXF1ZXN0SWQgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgIGlmIChtc2cuZGF0YS5yZXF1ZXN0SWQgaW4gY2FsbGJhY2tzKSB7XG4gICAgICAgIHRoaXMuaGFuZGxlUmVzcG9uc2UobXNnKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5oYW5kbGVSZXF1ZXN0KG1zZyk7XG4gICAgfVxuICB9LFxuXG4gIGhhbmRsZVJlcXVlc3QobXNnKSB7XG4gICAgY29uc3QgeyBhY3Rpb24sIG1vZHVsZSwgYXJncywgcmVxdWVzdElkIH0gPSBtc2cuZGF0YS5wYXlsb2FkLFxuICAgICAgICAgIHdpbmRvd0lkID0gbXNnLmRhdGEud2luZG93SWQ7XG4gICAgdXRpbHMuaW1wb3J0TW9kdWxlKGAke21vZHVsZX0vYmFja2dyb3VuZGApLnRoZW4oIG1vZHVsZSA9PiB7XG4gICAgICBjb25zdCBiYWNrZ3JvdW5kID0gbW9kdWxlLmRlZmF1bHQ7XG4gICAgICByZXR1cm4gYmFja2dyb3VuZC5hY3Rpb25zW2FjdGlvbl0uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfSkudGhlbiggcmVzcG9uc2UgPT4ge1xuICAgICAgdGhpcy5tbS5icm9hZGNhc3QoYHdpbmRvdy0ke3dpbmRvd0lkfWAsIHtcbiAgICAgICAgcmVzcG9uc2UsXG4gICAgICAgIGFjdGlvbjogbXNnLmRhdGEucGF5bG9hZC5hY3Rpb24sXG4gICAgICAgIHJlcXVlc3RJZCxcbiAgICAgIH0pO1xuICAgIH0pLmNhdGNoKCBlID0+IHV0aWxzLmxvZyhgJHtlLnRvU3RyaW5nKCl9LS0ke2Uuc3RhY2t9YCwgXCJQcm9ibGVtIHdpdGggZnJhbWVTY3JpcHRcIikgKTtcbiAgfSxcblxuICBoYW5kbGVSZXNwb25zZShtc2cpIHtcbiAgICBjYWxsYmFja3NbbXNnLmRhdGEucmVxdWVzdElkXS5hcHBseShudWxsLCBbbXNnLmRhdGEucGF5bG9hZF0pO1xuICB9LFxuXG4gIGdldFdpbmRvd1N0YXR1c0Zyb21Nb2R1bGVzKHdpbil7XG4gICAgcmV0dXJuIGNvbmZpZy5tb2R1bGVzLm1hcCgobW9kdWxlTmFtZSkgPT4ge1xuICAgICAgdmFyIG1vZHVsZSA9IHdpbi5DTElRWi5Db3JlLndpbmRvd01vZHVsZXNbbW9kdWxlTmFtZV07XG4gICAgICByZXR1cm4gbW9kdWxlICYmIG1vZHVsZS5zdGF0dXMgPyBtb2R1bGUuc3RhdHVzKCkgOiB7fVxuICAgIH0pXG4gIH0sXG5cbiAgYWN0aW9uczoge1xuICAgIGdldFdpbmRvd1N0YXR1cyh3aW4pIHtcbiAgICAgIHJldHVybiBQcm9taXNlXG4gICAgICAgIC5hbGwodGhpcy5nZXRXaW5kb3dTdGF0dXNGcm9tTW9kdWxlcyh3aW4pKVxuICAgICAgICAudGhlbigoYWxsU3RhdHVzKSA9PiB7XG4gICAgICAgICAgdmFyIHJlc3VsdCA9IHt9XG5cbiAgICAgICAgICBhbGxTdGF0dXMuZm9yRWFjaCgoc3RhdHVzLCBtb2R1bGVJZHgpID0+IHtcbiAgICAgICAgICAgIHJlc3VsdFtjb25maWcubW9kdWxlc1ttb2R1bGVJZHhdXSA9IHN0YXR1cyB8fCBudWxsO1xuICAgICAgICAgIH0pXG5cbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9KVxuICAgIH0sXG4gICAgc2VuZFRlbGVtZXRyeShtc2cpIHtcbiAgICAgIHV0aWxzLnRlbGVtZXRyeShtc2cpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH0sXG4gICAgcXVlcnlDbGlxeihxdWVyeSkge1xuICAgICAgbGV0IHVybEJhciA9IHV0aWxzLmdldFdpbmRvdygpLmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwidXJsYmFyXCIpXG4gICAgICB1cmxCYXIuZm9jdXMoKTtcbiAgICAgIHVybEJhci5tSW5wdXRGaWVsZC5mb2N1cygpO1xuICAgICAgdXJsQmFyLm1JbnB1dEZpZWxkLnNldFVzZXJJbnB1dChxdWVyeSk7XG4gICAgfSxcbiAgICBzZXRVcmxiYXIodmFsdWUpIHtcbiAgICAgIHJldHVybiB0aGlzLmFjdGlvbnMucXVlcnlDbGlxeih2YWx1ZSk7XG4gICAgfSxcbiAgICByZWNvcmRMYW5nKHVybCwgbGFuZykge1xuICAgICAgaWYgKGxhbmcpIHtcbiAgICAgICAgbGFuZ3VhZ2UuYWRkTG9jYWxlKHVybCwgbGFuZyk7XG4gICAgICB9XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfSxcbiAgICByZWNvcmRNZXRhKHVybCwgbWV0YSkge1xuICAgICAgZXZlbnRzLnB1YihcImNvcmU6dXJsLW1ldGFcIiwgdXJsLCBtZXRhKTtcbiAgICB9LFxuXG4gICAgZ2V0RmVlZGJhY2tQYWdlKCkge1xuICAgICAgcmV0dXJuIHV0aWxzLkZFRURCQUNLX1VSTDtcbiAgICB9XG4gIH1cbn07XG4iXX0=