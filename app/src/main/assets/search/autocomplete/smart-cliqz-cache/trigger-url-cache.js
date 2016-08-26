System.register('autocomplete/smart-cliqz-cache/trigger-url-cache', ['autocomplete/smart-cliqz-cache/rich-header', 'core/cliqz', 'autocomplete/smart-cliqz-cache/cache'], function (_export) {
  'use strict';

  var getSmartCliqz, utils, Cache, HOUR, DAY, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  return {
    setters: [function (_autocompleteSmartCliqzCacheRichHeader) {
      getSmartCliqz = _autocompleteSmartCliqzCacheRichHeader.getSmartCliqz;
    }, function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }, function (_autocompleteSmartCliqzCacheCache) {
      Cache = _autocompleteSmartCliqzCacheCache['default'];
    }],
    execute: function () {
      HOUR = 1000 * 60 * 60;
      DAY = 24 * HOUR;

      /**
      * @namespace smart-cliqz-cache
      */

      _default = (function (_Cache) {
        _inherits(_default, _Cache);

        /**
        * @class TriggerUrlCache
        * @constructor
        */

        function _default() {
          var file = arguments.length <= 0 || arguments[0] === undefined ? 'cliqz/smartcliqz-trigger-urls-cache.json' : arguments[0];

          _classCallCheck(this, _default);

          _get(Object.getPrototypeOf(_default.prototype), 'constructor', this).call(this, false);
          this.file = file;
        }

        /**
        * @method init
        */

        _createClass(_default, [{
          key: 'init',
          value: function init() {
            this.load();
            this.scheduleRecurringClean();
          }

          /**
          * @method load
          */
        }, {
          key: 'load',
          value: function load() {
            return _get(Object.getPrototypeOf(_default.prototype), 'load', this).call(this, this.file);
          }

          /**
          * @method save
          */
        }, {
          key: 'save',
          value: function save() {
            return _get(Object.getPrototypeOf(_default.prototype), 'save', this).call(this, this.file);
          }

          /**
          * @method scheduleRecurringClean
          * @param delay
          */
        }, {
          key: 'scheduleRecurringClean',
          value: function scheduleRecurringClean(delay) {
            var _this = this;

            if (!delay) {
              var lastCleanTime = utils.getPref('smart-cliqz-last-clean-ts');
              if (!lastCleanTime) {
                delay = 0;
              } else {
                var timeSinceLastClean = Date.now() - new Date(Number(lastCleanTime));
                delay = timeSinceLastClean > DAY ? 0 : DAY - timeSinceLastClean;
              }
            }

            this.cleanTimeout = utils.setTimeout(function (_) {
              _this.clean().then(function (_) {
                utils.setPref('smart-cliqz-last-clean-ts', Date.now().toString());
                _this.scheduleRecurringClean(DAY);
              });
            }, delay);
            utils.log('scheduled SmartCliqz trigger URLs cleaning in ' + Math.round(delay / 1000 / 60) + ' minutes');
          }

          /**
          * clean trigger URLs that are no longer valid
          * @method clean
          * @param delay {Number}
          */
        }, {
          key: 'clean',
          value: function clean() {
            var _this2 = this;

            var delay = arguments.length <= 0 || arguments[0] === undefined ? 1000 : arguments[0];

            return new Promise(function (resolve, reject) {
              utils.log('start cleaning SmartCliqz trigger URLs');

              var cleaners = Object.keys(_this2._cache).map(function (url, idx) {
                return function () {
                  return new Promise(function (resolve, reject) {
                    utils.setTimeout(function () {
                      if (_this2.isUnloaded) {
                        reject('unloaded');
                        return;
                      }
                      getSmartCliqz(url).then(function (smartCliqz) {
                        if (!smartCliqz.data.trigger_urls.some(function (u) {
                          return u === url;
                        })) {
                          utils.log('unknown trigger URL: deleting SmartCliqz ' + url);
                          _this2['delete'](url);
                          _this2.save();
                        }
                        resolve();
                      })['catch'](function (e) {
                        if (e.type && e.type === 'URL_NOT_FOUND') {
                          utils.log('unkown URL: deleting SmartCliqz ' + url);
                          _this2['delete'](url);
                          _this2.save();
                        }
                        resolve();
                      });
                    }, idx * delay);
                  });
                };
              });
              // final action: resolve
              cleaners.push(function () {
                utils.log('done cleaning SmartCliqz trigger URLs');
                resolve();
                return Promise.resolve();
              });
              // execute sequentually
              cleaners.reduce(function (current, next) {
                return current.then(function (_) {
                  return next();
                }, function (e) {
                  reject(e);return Promise.reject();
                });
              }, Promise.resolve());
            });
          }

          /**
          * @method unload
          */
        }, {
          key: 'unload',
          value: function unload() {
            this.isUnloaded = true;
            utils.clearTimeout(this.cleanTimeout);
          }
        }]);

        return _default;
      })(Cache);

      _export('default', _default);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dG9jb21wbGV0ZS9zbWFydC1jbGlxei1jYWNoZS90cmlnZ2VyLXVybC1jYWNoZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7bUNBSU0sSUFBSSxFQUNKLEdBQUc7Ozs7Ozs7Ozs7Ozs2REFMQSxhQUFhOzt5QkFDYixLQUFLOzs7OztBQUdSLFVBQUksR0FBRyxJQUFJLEdBQUcsRUFBRSxHQUFHLEVBQUU7QUFDckIsU0FBRyxHQUFHLEVBQUUsR0FBRyxJQUFJOzs7Ozs7Ozs7Ozs7OztBQVNSLDRCQUFvRDtjQUFuRCxJQUFJLHlEQUFHLDBDQUEwQzs7OztBQUMzRCwwRkFBTSxLQUFLLEVBQUU7QUFDYixjQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztTQUNsQjs7Ozs7Ozs7aUJBSUcsZ0JBQUc7QUFDTCxnQkFBSSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ1osZ0JBQUksQ0FBQyxzQkFBc0IsRUFBRSxDQUFDO1dBQy9COzs7Ozs7O2lCQUlHLGdCQUFHO0FBQ0wsNEZBQWtCLElBQUksQ0FBQyxJQUFJLEVBQUU7V0FDOUI7Ozs7Ozs7aUJBSUcsZ0JBQUc7QUFDTCw0RkFBa0IsSUFBSSxDQUFDLElBQUksRUFBRTtXQUM5Qjs7Ozs7Ozs7aUJBS3FCLGdDQUFDLEtBQUssRUFBRTs7O0FBQzVCLGdCQUFJLENBQUMsS0FBSyxFQUFFO0FBQ1Ysa0JBQU0sYUFBYSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsMkJBQTJCLENBQUMsQ0FBQztBQUNqRSxrQkFBSSxDQUFDLGFBQWEsRUFBRTtBQUNsQixxQkFBSyxHQUFHLENBQUMsQ0FBQztlQUNYLE1BQU07QUFDTCxvQkFBTSxrQkFBa0IsR0FBRyxJQUFJLENBQUMsR0FBRyxFQUFFLEdBQUksSUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxDQUFDLEFBQUMsQ0FBQztBQUMxRSxxQkFBSyxHQUFHLGtCQUFrQixHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsR0FBRyxHQUFHLGtCQUFrQixDQUFD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LENBQUM7V0FDSjs7Ozs7OztpQkFJSyxrQkFBRztBQUNQLGdCQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQztBQUN2QixpQkFBSyxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7V0FDdkM7Ozs7U0F2RzBCLEtBQUsiLCJmaWxlIjoiYXV0b2NvbXBsZXRlL3NtYXJ0LWNsaXF6LWNhY2hlL3RyaWdnZXItdXJsLWNhY2hlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZ2V0U21hcnRDbGlxeiB9IGZyb20gJ2F1dG9jb21wbGV0ZS9zbWFydC1jbGlxei1jYWNoZS9yaWNoLWhlYWRlcic7XG5pbXBvcnQgeyB1dGlscyB9IGZyb20gJ2NvcmUvY2xpcXonO1xuaW1wb3J0IENhY2hlIGZyb20gJ2F1dG9jb21wbGV0ZS9zbWFydC1jbGlxei1jYWNoZS9jYWNoZSc7XG5cbmNvbnN0IEhPVVIgPSAxMDAwICogNjAgKiA2MDtcbmNvbnN0IERBWSA9IDI0ICogSE9VUjtcbi8qKlxuKiBAbmFtZXNwYWNlIHNtYXJ0LWNsaXF6LWNhY2hlXG4qL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3MgZXh0ZW5kcyBDYWNoZSB7XG4gIC8qKlxuICAqIEBjbGFzcyBUcmlnZ2VyVXJsQ2FjaGVcbiAgKiBAY29uc3RydWN0b3JcbiAgKi9cbiAgY29uc3RydWN0b3IoZmlsZSA9ICdjbGlxei9zbWFydGNsaXF6LXRyaWdnZXItdXJscy1jYWNoZS5qc29uJykge1xuICAgIHN1cGVyKGZhbHNlKTtcbiAgICB0aGlzLmZpbGUgPSBmaWxlO1xuICB9XG4gIC8qKlxuICAqIEBtZXRob2QgaW5pdFxuICAqL1xuICBpbml0KCkge1xuICAgIHRoaXMubG9hZCgpO1xuICAgIHRoaXMuc2NoZWR1bGVSZWN1cnJpbmdDbGVhbigpO1xuICB9XG4gIC8qKlxuICAqIEBtZXRob2QgbG9hZFxuICAqL1xuICBsb2FkKCkge1xuICAgIHJldHVybiBzdXBlci5sb2FkKHRoaXMuZmlsZSk7XG4gIH1cbiAgLyoqXG4gICogQG1ldGhvZCBzYXZlXG4gICovXG4gIHNhdmUoKSB7XG4gICAgcmV0dXJuIHN1cGVyLnNhdmUodGhpcy5maWxlKTtcbiAgfVxuICAvKipcbiAgKiBAbWV0aG9kIHNjaGVkdWxlUmVjdXJyaW5nQ2xlYW5cbiAgKiBAcGFyYW0gZGVsYXlcbiAgKi9cbiAgc2NoZWR1bGVSZWN1cnJpbmdDbGVhbihkZWxheSkge1xuICAgIGlmICghZGVsYXkpIHtcbiAgICAgIGNvbnN0IGxhc3RDbGVhblRpbWUgPSB1dGlscy5nZXRQcmVmKCdzbWFydC1jbGlxei1sYXN0LWNsZWFuLXRzJyk7XG4gICAgICBpZiAoIWxhc3RDbGVhblRpbWUpIHtcbiAgICAgICAgZGVsYXkgPSAwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3QgdGltZVNpbmNlTGFzdENsZWFuID0gRGF0ZS5ub3coKSAtIChuZXcgRGF0ZShOdW1iZXIobGFzdENsZWFuVGltZSkpKTtcbiAgICAgICAgZGVsYXkgPSB0aW1lU2luY2VMYXN0Q2xlYW4gPiBEQVkgPyAwIDogREFZIC0gdGltZVNpbmNlTGFzdENsZWFuO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY2xlYW5UaW1lb3V0ID0gdXRpbHMuc2V0VGltZW91dChfID0+IHtcbiAgICAgIHRoaXMuY2xlYW4oKS50aGVuKF8gPT4ge1xuICAgICAgICB1dGlscy5zZXRQcmVmKCdzbWFydC1jbGlxei1sYXN0LWNsZWFuLXRzJywgRGF0ZS5ub3coKS50b1N0cmluZygpKTtcbiAgICAgICAgdGhpcy5zY2hlZHVsZVJlY3VycmluZ0NsZWFuKERBWSk7XG4gICAgICB9KTtcbiAgICB9LCBkZWxheSk7XG4gICAgdXRpbHMubG9nKGBzY2hlZHVsZWQgU21hcnRDbGlxeiB0cmlnZ2VyIFVSTHMgY2xlYW5pbmcgaW4gJHtNYXRoLnJvdW5kKGRlbGF5IC8gMTAwMCAvIDYwKX0gbWludXRlc2ApO1xuICB9XG5cbiAgLyoqXG4gICogY2xlYW4gdHJpZ2dlciBVUkxzIHRoYXQgYXJlIG5vIGxvbmdlciB2YWxpZFxuICAqIEBtZXRob2QgY2xlYW5cbiAgKiBAcGFyYW0gZGVsYXkge051bWJlcn1cbiAgKi9cbiAgY2xlYW4oZGVsYXkgPSAxMDAwKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICAgIHV0aWxzLmxvZygnc3RhcnQgY2xlYW5pbmcgU21hcnRDbGlxeiB0cmlnZ2VyIFVSTHMnKTtcblxuICAgICAgY29uc3QgY2xlYW5lcnMgPSBPYmplY3Qua2V5cyh0aGlzLl9jYWNoZSkubWFwKCh1cmwsIGlkeCkgPT4gKCkgPT4ge1xuICAgICAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgICAgIHV0aWxzLnNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgaWYgKHRoaXMuaXNVbmxvYWRlZCkge1xuICAgICAgICAgICAgICByZWplY3QoJ3VubG9hZGVkJyk7XG4gICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGdldFNtYXJ0Q2xpcXoodXJsKS50aGVuKChzbWFydENsaXF6KSA9PiB7XG4gICAgICAgICAgICAgIGlmICghc21hcnRDbGlxei5kYXRhLnRyaWdnZXJfdXJscy5zb21lKHUgPT4gdSA9PT0gdXJsKSkge1xuICAgICAgICAgICAgICAgIHV0aWxzLmxvZyhgdW5rbm93biB0cmlnZ2VyIFVSTDogZGVsZXRpbmcgU21hcnRDbGlxeiAke3VybH1gKTtcbiAgICAgICAgICAgICAgICB0aGlzLmRlbGV0ZSh1cmwpO1xuICAgICAgICAgICAgICAgIHRoaXMuc2F2ZSgpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIHJlc29sdmUoKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKChlKSA9PiB7XG4gICAgICAgICAgICAgIGlmIChlLnR5cGUgJiYgZS50eXBlID09PSAnVVJMX05PVF9GT1VORCcpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5sb2coYHVua293biBVUkw6IGRlbGV0aW5nIFNtYXJ0Q2xpcXogJHt1cmx9YCk7XG4gICAgICAgICAgICAgICAgdGhpcy5kZWxldGUodXJsKTtcbiAgICAgICAgICAgICAgICB0aGlzLnNhdmUoKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICByZXNvbHZlKCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LCBpZHggKiBkZWxheSk7XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgICAvLyBmaW5hbCBhY3Rpb246IHJlc29sdmVcbiAgICAgIGNsZWFuZXJzLnB1c2goKCkgPT4ge1xuICAgICAgICB1dGlscy5sb2coJ2RvbmUgY2xlYW5pbmcgU21hcnRDbGlxeiB0cmlnZ2VyIFVSTHMnKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgICB9KTtcbiAgICAgIC8vIGV4ZWN1dGUgc2VxdWVudHVhbGx5XG4gICAgICBjbGVhbmVycy5yZWR1Y2UoKGN1cnJlbnQsIG5leHQpID0+XG4gICAgICAgIGN1cnJlbnQudGhlbihfID0+IG5leHQoKSwgZSA9PiB7IHJlamVjdChlKTsgcmV0dXJuIFByb21pc2UucmVqZWN0KCk7IH0pLCBQcm9taXNlLnJlc29sdmUoKSk7XG4gICAgfSk7XG4gIH1cbiAgLyoqXG4gICogQG1ldGhvZCB1bmxvYWRcbiAgKi9cbiAgdW5sb2FkKCkge1xuICAgIHRoaXMuaXNVbmxvYWRlZCA9IHRydWU7XG4gICAgdXRpbHMuY2xlYXJUaW1lb3V0KHRoaXMuY2xlYW5UaW1lb3V0KTtcbiAgfVxufVxuIl19