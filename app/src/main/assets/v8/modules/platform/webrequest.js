System.register(["core/cliqz"], function (_export) {
  "use strict";

  var utils;
  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }],
    execute: function () {
      _export("default", {
        onBeforeRequest: {
          listeners: [],
          addListener: function addListener(listener, filter, extraInfo) {
            utils.log("Listener register", "webrequests");
            this.listeners.push({ fn: listener, filter: filter, extraInfo: extraInfo });
          },
          removeListener: function removeListener(listener) {},

          _trigger: function _trigger(requestInfo) {
            // getter for request headers
            requestInfo.getRequestHeader = function (header) {
              return requestInfo.requestHeaders[header];
            };
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = this.listeners[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var listener = _step.value;
                var fn = listener.fn;
                var filter = listener.filter;
                var extraInfo = listener.extraInfo;

                try {
                  var blockingResponse = fn(requestInfo);

                  if (blockingResponse && Object.keys(blockingResponse).length > 0) {
                    return blockingResponse;
                  }
                } catch (e) {
                  utils.log(e, "webrequests");
                }
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator["return"]) {
                  _iterator["return"]();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }

            return {};
          }
        },

        onBeforeSendHeaders: {
          addListener: function addListener(listener, filter, extraInfo) {},
          removeListener: function removeListener(listener) {}
        },

        onHeadersReceived: {
          addListener: function addListener(listener, filter, extraInfo) {},
          removeListener: function removeListener(listener) {}
        }
      });
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnJlcXVlc3QuZXMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O3lCQUFTLEtBQUs7Ozt5QkFFQztBQUNiLHVCQUFlLEVBQUU7QUFDZixtQkFBUyxFQUFFLEVBQUU7QUFDYixxQkFBVyxFQUFBLHFCQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFO0FBQ3ZDLGlCQUFLLENBQUMsR0FBRyxDQUFDLG1CQUFtQixFQUFFLGFBQWEsQ0FBQyxDQUFDO0FBQzlDLGdCQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxFQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUUsTUFBTSxFQUFOLE1BQU0sRUFBRSxTQUFTLEVBQVQsU0FBUyxFQUFDLENBQUMsQ0FBQztXQUN4RDtBQUNELHdCQUFjLEVBQUEsd0JBQUMsUUFBUSxFQUFFLEVBQUU7O0FBRTNCLGtCQUFRLEVBQUEsa0JBQUMsV0FBVyxFQUFFOztBQUVwQix1QkFBVyxDQUFDLGdCQUFnQixHQUFHLFVBQVMsTUFBTSxFQUFFO0FBQzlDLHFCQUFPLFdBQVcsQ0FBQyxjQUFjLENBQUMsTUFBTSxDQUFDLENBQUM7YUFDM0MsQ0FBQzs7Ozs7O0FBQ0YsbUNBQXFCLElBQUksQ0FBQyxTQUFTLDhIQUFFO29CQUE1QixRQUFRO29CQUNSLEVBQUUsR0FBdUIsUUFBUSxDQUFqQyxFQUFFO29CQUFFLE1BQU0sR0FBZSxRQUFRLENBQTdCLE1BQU07b0JBQUUsU0FBUyxHQUFJLFFBQVEsQ0FBckIsU0FBUzs7QUFDNUIsb0JBQUk7QUFDRixzQkFBTSxnQkFBZ0IsR0FBRyxFQUFFLENBQUMsV0FBVyxDQUFDLENBQUM7O0FBRXZDLHNCQUFJLGdCQUFnQixJQUFJLE1BQU0sQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFO0FBQ2xFLDJCQUFPLGdCQUFnQixDQUFDO21CQUN6QjtpQkFDRixDQUFDLE9BQU0sQ0FBQyxFQUFFO0FBQ1QsdUJBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLGFBQWEsQ0FBQyxDQUFDO2lCQUM3QjtlQUVGOzs7Ozs7Ozs7Ozs7Ozs7O0FBQ0QsbUJBQU8sRUFBRSxDQUFDO1dBQ1g7U0FDRjs7QUFFRCwyQkFBbUIsRUFBRTtBQUNuQixxQkFBVyxFQUFBLHFCQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7QUFDM0Msd0JBQWMsRUFBQSx3QkFBQyxRQUFRLEVBQUUsRUFBRTtTQUM1Qjs7QUFFRCx5QkFBaUIsRUFBRTtBQUNqQixxQkFBVyxFQUFBLHFCQUFDLFFBQVEsRUFBRSxNQUFNLEVBQUUsU0FBUyxFQUFFLEVBQUU7QUFDM0Msd0JBQWMsRUFBQSx3QkFBQyxRQUFRLEVBQUUsRUFBRTtTQUM1QjtPQUNGIiwiZmlsZSI6IndlYnJlcXVlc3QuZXMiLCJzb3VyY2VSb290IjoicGxhdGZvcm0iLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1dGlscyB9IGZyb20gXCJjb3JlL2NsaXF6XCI7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgb25CZWZvcmVSZXF1ZXN0OiB7XG4gICAgbGlzdGVuZXJzOiBbXSxcbiAgICBhZGRMaXN0ZW5lcihsaXN0ZW5lciwgZmlsdGVyLCBleHRyYUluZm8pIHtcbiAgICAgIHV0aWxzLmxvZyhcIkxpc3RlbmVyIHJlZ2lzdGVyXCIsIFwid2VicmVxdWVzdHNcIik7XG4gICAgICB0aGlzLmxpc3RlbmVycy5wdXNoKHtmbjogbGlzdGVuZXIsIGZpbHRlciwgZXh0cmFJbmZvfSk7XG4gICAgfSxcbiAgICByZW1vdmVMaXN0ZW5lcihsaXN0ZW5lcikge30sXG5cbiAgICBfdHJpZ2dlcihyZXF1ZXN0SW5mbykge1xuICAgICAgLy8gZ2V0dGVyIGZvciByZXF1ZXN0IGhlYWRlcnNcbiAgICAgIHJlcXVlc3RJbmZvLmdldFJlcXVlc3RIZWFkZXIgPSBmdW5jdGlvbihoZWFkZXIpIHtcbiAgICAgICAgcmV0dXJuIHJlcXVlc3RJbmZvLnJlcXVlc3RIZWFkZXJzW2hlYWRlcl07XG4gICAgICB9O1xuICAgICAgZm9yIChsZXQgbGlzdGVuZXIgb2YgdGhpcy5saXN0ZW5lcnMpIHtcbiAgICAgICAgY29uc3Qge2ZuLCBmaWx0ZXIsIGV4dHJhSW5mb30gPSBsaXN0ZW5lcjtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBjb25zdCBibG9ja2luZ1Jlc3BvbnNlID0gZm4ocmVxdWVzdEluZm8pO1xuXG4gICAgICAgICAgICBpZiAoYmxvY2tpbmdSZXNwb25zZSAmJiBPYmplY3Qua2V5cyhibG9ja2luZ1Jlc3BvbnNlKS5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICByZXR1cm4gYmxvY2tpbmdSZXNwb25zZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgIHV0aWxzLmxvZyhlLCBcIndlYnJlcXVlc3RzXCIpO1xuICAgICAgICB9XG5cbiAgICAgIH1cbiAgICAgIHJldHVybiB7fTtcbiAgICB9XG4gIH0sXG5cbiAgb25CZWZvcmVTZW5kSGVhZGVyczoge1xuICAgIGFkZExpc3RlbmVyKGxpc3RlbmVyLCBmaWx0ZXIsIGV4dHJhSW5mbykge30sXG4gICAgcmVtb3ZlTGlzdGVuZXIobGlzdGVuZXIpIHt9XG4gIH0sXG5cbiAgb25IZWFkZXJzUmVjZWl2ZWQ6IHtcbiAgICBhZGRMaXN0ZW5lcihsaXN0ZW5lciwgZmlsdGVyLCBleHRyYUluZm8pIHt9LFxuICAgIHJlbW92ZUxpc3RlbmVyKGxpc3RlbmVyKSB7fVxuICB9XG59XG5cblxuIl19