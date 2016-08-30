System.register("core/background", ["core/cliqz", "platform/language", "core/config", "platform/process-script-manager"], function (_export) {
  "use strict";

  var utils, events, language, config, ProcessScriptManager, lastRequestId, callbacks;
  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
      events = _coreCliqz.events;
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

        actions: {
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
//# sourceMappingURL=data:application/json;base64,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QUFDaEUsa0JBQU0sQ0FBQyxLQUFLLEVBQUUsQ0FBQztBQUNmLGtCQUFNLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQzNCLGtCQUFNLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsQ0FBQztXQUN4QztBQUNELG1CQUFTLEVBQUEsbUJBQUMsS0FBSyxFQUFFO0FBQ2YsbUJBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUM7V0FDdkM7QUFDRCxvQkFBVSxFQUFBLG9CQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUU7QUFDcEIsZ0JBQUksSUFBSSxFQUFFO0FBQ1Isc0JBQVEsQ0FBQyxTQUFTLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxDQUFDO2FBQy9CO0FBQ0QsbUJBQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1dBQzFCO0FBQ0Qsb0JBQVUsRUFBQSxvQkFBQyxHQUFHLEVBQUUsSUFBSSxFQUFFO0FBQ3BCLGtCQUFNLENBQUMsR0FBRyxDQUFDLGVBQWUsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7V0FDeEM7O0FBRUQseUJBQWUsRUFBQSwyQkFBRztBQUNoQixtQkFBTyxLQUFLLENBQUMsWUFBWSxDQUFDO1dBQzNCO1NBQ0Y7T0FDRiIsImZpbGUiOiJjb3JlL2JhY2tncm91bmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1dGlscywgZXZlbnRzIH0gZnJvbSBcImNvcmUvY2xpcXpcIjtcbmltcG9ydCBsYW5ndWFnZSBmcm9tIFwicGxhdGZvcm0vbGFuZ3VhZ2VcIjtcbmltcG9ydCBjb25maWcgZnJvbSBcImNvcmUvY29uZmlnXCI7XG5pbXBvcnQgUHJvY2Vzc1NjcmlwdE1hbmFnZXIgZnJvbSBcInBsYXRmb3JtL3Byb2Nlc3Mtc2NyaXB0LW1hbmFnZXJcIjtcblxudmFyIGxhc3RSZXF1ZXN0SWQgPSAwO1xudmFyIGNhbGxiYWNrcyA9IHt9O1xuXG5leHBvcnQgZGVmYXVsdCB7XG5cbiAgaW5pdChzZXR0aW5ncykge1xuICAgIHRoaXMuZGlzcGF0Y2hNZXNzYWdlID0gdGhpcy5kaXNwYXRjaE1lc3NhZ2UuYmluZCh0aGlzKTtcblxuICAgIHV0aWxzLmJpbmRPYmplY3RGdW5jdGlvbnModGhpcy5hY3Rpb25zLCB0aGlzKTtcblxuICAgIHRoaXMubW0gPSBuZXcgUHJvY2Vzc1NjcmlwdE1hbmFnZXIodGhpcy5kaXNwYXRjaE1lc3NhZ2UpO1xuICAgIHRoaXMubW0uaW5pdCgpO1xuICB9LFxuXG4gIHVubG9hZCgpIHtcbiAgICB0aGlzLm1tLnVubG9hZCgpO1xuICB9LFxuXG4gIHF1ZXJ5SFRNTCh1cmwsIHNlbGVjdG9yLCBhdHRyaWJ1dGUpIHtcbiAgICBjb25zdCByZXF1ZXN0SWQgPSBsYXN0UmVxdWVzdElkKyssXG4gICAgICAgICAgZG9jdW1lbnRzID0gW107XG5cbiAgICB0aGlzLm1tLmJyb2FkY2FzdChcImNsaXF6OmNvcmVcIiwge1xuICAgICAgYWN0aW9uOiBcInF1ZXJ5SFRNTFwiLFxuICAgICAgdXJsLFxuICAgICAgYXJnczogW3NlbGVjdG9yLCBhdHRyaWJ1dGVdLFxuICAgICAgcmVxdWVzdElkXG4gICAgfSk7XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoIChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIGNhbGxiYWNrc1tyZXF1ZXN0SWRdID0gZnVuY3Rpb24gKGF0dHJpYnV0ZVZhbHVlcykge1xuICAgICAgICBkZWxldGUgY2FsbGJhY2tzW3JlcXVlc3RJZF07XG4gICAgICAgIHJlc29sdmUoYXR0cmlidXRlVmFsdWVzKTtcbiAgICAgIH07XG5cbiAgICAgIHV0aWxzLnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICBkZWxldGUgY2FsbGJhY2tzW3JlcXVlc3RJZF07XG4gICAgICAgIHJlamVjdCgpO1xuICAgICAgfSwgMTAwMCk7XG4gICAgfSk7XG4gIH0sXG5cbiAgZ2V0SFRNTCh1cmwsIHRpbWVvdXQgPSAxMDAwKSB7XG4gICAgY29uc3QgcmVxdWVzdElkID0gbGFzdFJlcXVlc3RJZCsrLFxuICAgICAgICAgIGRvY3VtZW50cyA9IFtdO1xuXG4gICAgdGhpcy5tbS5icm9hZGNhc3QoXCJjbGlxejpjb3JlXCIsIHtcbiAgICAgIGFjdGlvbjogXCJnZXRIVE1MXCIsXG4gICAgICB1cmwsXG4gICAgICBhcmdzOiBbXSxcbiAgICAgIHJlcXVlc3RJZFxuICAgIH0pO1xuXG4gICAgY2FsbGJhY2tzW3JlcXVlc3RJZF0gPSBmdW5jdGlvbiAoZG9jKSB7XG4gICAgICBkb2N1bWVudHMucHVzaChkb2MpO1xuICAgIH07XG5cbiAgICByZXR1cm4gbmV3IFByb21pc2UoIHJlc29sdmUgPT4ge1xuICAgICAgdXRpbHMuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGRlbGV0ZSBjYWxsYmFja3NbcmVxdWVzdElkXTtcbiAgICAgICAgcmVzb2x2ZShkb2N1bWVudHMpO1xuICAgICAgfSwgdGltZW91dCk7XG4gICAgfSk7XG4gIH0sXG5cbiAgZ2V0Q29va2llKHVybCkge1xuICAgIGNvbnN0IHJlcXVlc3RJZCA9IGxhc3RSZXF1ZXN0SWQrKyxcbiAgICAgICAgICBkb2N1bWVudHMgPSBbXTtcblxuICAgIHRoaXMubW0uYnJvYWRjYXN0KFwiY2xpcXo6Y29yZVwiLCB7XG4gICAgICBhY3Rpb246IFwiZ2V0Q29va2llXCIsXG4gICAgICB1cmwsXG4gICAgICBhcmdzOiBbXSxcbiAgICAgIHJlcXVlc3RJZFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKCAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICBjYWxsYmFja3NbcmVxdWVzdElkXSA9IGZ1bmN0aW9uIChhdHRyaWJ1dGVWYWx1ZXMpIHtcbiAgICAgICAgZGVsZXRlIGNhbGxiYWNrc1tyZXF1ZXN0SWRdO1xuICAgICAgICByZXNvbHZlKGF0dHJpYnV0ZVZhbHVlcyk7XG4gICAgICB9O1xuXG4gICAgICB1dGlscy5zZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgZGVsZXRlIGNhbGxiYWNrc1tyZXF1ZXN0SWRdO1xuICAgICAgICByZWplY3QoKTtcbiAgICAgIH0sIDEwMDApO1xuICAgIH0pO1xuICB9LFxuXG4gIGRpc3BhdGNoTWVzc2FnZShtc2cpIHtcbiAgICBpZiAodHlwZW9mIG1zZy5kYXRhLnJlcXVlc3RJZCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgaWYgKG1zZy5kYXRhLnJlcXVlc3RJZCBpbiBjYWxsYmFja3MpIHtcbiAgICAgICAgdGhpcy5oYW5kbGVSZXNwb25zZShtc2cpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmhhbmRsZVJlcXVlc3QobXNnKTtcbiAgICB9XG4gIH0sXG5cbiAgaGFuZGxlUmVxdWVzdChtc2cpIHtcbiAgICBjb25zdCB7IGFjdGlvbiwgbW9kdWxlLCBhcmdzLCByZXF1ZXN0SWQgfSA9IG1zZy5kYXRhLnBheWxvYWQsXG4gICAgICAgICAgd2luZG93SWQgPSBtc2cuZGF0YS53aW5kb3dJZDtcbiAgICB1dGlscy5pbXBvcnRNb2R1bGUoYCR7bW9kdWxlfS9iYWNrZ3JvdW5kYCkudGhlbiggbW9kdWxlID0+IHtcbiAgICAgIGNvbnN0IGJhY2tncm91bmQgPSBtb2R1bGUuZGVmYXVsdDtcbiAgICAgIHJldHVybiBiYWNrZ3JvdW5kLmFjdGlvbnNbYWN0aW9uXS5hcHBseShudWxsLCBhcmdzKTtcbiAgICB9KS50aGVuKCByZXNwb25zZSA9PiB7XG4gICAgICB0aGlzLm1tLmJyb2FkY2FzdChgd2luZG93LSR7d2luZG93SWR9YCwge1xuICAgICAgICByZXNwb25zZSxcbiAgICAgICAgYWN0aW9uOiBtc2cuZGF0YS5wYXlsb2FkLmFjdGlvbixcbiAgICAgICAgcmVxdWVzdElkLFxuICAgICAgfSk7XG4gICAgfSkuY2F0Y2goIGUgPT4gdXRpbHMubG9nKGAke2UudG9TdHJpbmcoKX0tLSR7ZS5zdGFja31gLCBcIlByb2JsZW0gd2l0aCBmcmFtZVNjcmlwdFwiKSApO1xuICB9LFxuXG4gIGhhbmRsZVJlc3BvbnNlKG1zZykge1xuICAgIGNhbGxiYWNrc1ttc2cuZGF0YS5yZXF1ZXN0SWRdLmFwcGx5KG51bGwsIFttc2cuZGF0YS5wYXlsb2FkXSk7XG4gIH0sXG5cbiAgYWN0aW9uczoge1xuICAgIHNlbmRUZWxlbWV0cnkobXNnKSB7XG4gICAgICB1dGlscy50ZWxlbWV0cnkobXNnKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9LFxuICAgIHF1ZXJ5Q2xpcXoocXVlcnkpIHtcbiAgICAgIGxldCB1cmxCYXIgPSB1dGlscy5nZXRXaW5kb3coKS5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcInVybGJhclwiKVxuICAgICAgdXJsQmFyLmZvY3VzKCk7XG4gICAgICB1cmxCYXIubUlucHV0RmllbGQuZm9jdXMoKTtcbiAgICAgIHVybEJhci5tSW5wdXRGaWVsZC5zZXRVc2VySW5wdXQocXVlcnkpO1xuICAgIH0sXG4gICAgc2V0VXJsYmFyKHZhbHVlKSB7XG4gICAgICByZXR1cm4gdGhpcy5hY3Rpb25zLnF1ZXJ5Q2xpcXoodmFsdWUpO1xuICAgIH0sXG4gICAgcmVjb3JkTGFuZyh1cmwsIGxhbmcpIHtcbiAgICAgIGlmIChsYW5nKSB7XG4gICAgICAgIGxhbmd1YWdlLmFkZExvY2FsZSh1cmwsIGxhbmcpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSgpO1xuICAgIH0sXG4gICAgcmVjb3JkTWV0YSh1cmwsIG1ldGEpIHtcbiAgICAgIGV2ZW50cy5wdWIoXCJjb3JlOnVybC1tZXRhXCIsIHVybCwgbWV0YSk7XG4gICAgfSxcblxuICAgIGdldEZlZWRiYWNrUGFnZSgpIHtcbiAgICAgIHJldHVybiB1dGlscy5GRUVEQkFDS19VUkw7XG4gICAgfVxuICB9XG59O1xuIl19