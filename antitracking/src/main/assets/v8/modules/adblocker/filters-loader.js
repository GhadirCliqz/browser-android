System.register('adblocker/filters-loader', ['core/resource-loader', 'platform/language', 'platform/platform'], function (_export) {

  // Disk persisting
  'use strict';

  var ResourceLoader, Resource, UpdateCallbackHandler, CliqzLanguage, platform, RESOURCES_PATH, ONE_SECOND, ONE_MINUTE, ONE_HOUR, ONE_DAY, BASE_URL, LANGS, Checksums, FiltersList, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  return {
    setters: [function (_coreResourceLoader) {
      ResourceLoader = _coreResourceLoader['default'];
      Resource = _coreResourceLoader.Resource;
      UpdateCallbackHandler = _coreResourceLoader.UpdateCallbackHandler;
    }, function (_platformLanguage) {
      CliqzLanguage = _platformLanguage['default'];
    }, function (_platformPlatform) {
      platform = _platformPlatform['default'];
    }],
    execute: function () {
      RESOURCES_PATH = ['adblocker'];

      // Common durations
      ONE_SECOND = 1000;
      ONE_MINUTE = 60 * ONE_SECOND;
      ONE_HOUR = 60 * ONE_MINUTE;
      ONE_DAY = 24 * ONE_HOUR;

      // URLs to fetch block lists

      BASE_URL = 'https://cdn.cliqz.com/adblocking/latest-filters/';
      LANGS = CliqzLanguage.state();

      Checksums = (function (_UpdateCallbackHandler) {
        _inherits(Checksums, _UpdateCallbackHandler);

        function Checksums() {
          _classCallCheck(this, Checksums);

          _get(Object.getPrototypeOf(Checksums.prototype), 'constructor', this).call(this);

          this.loader = new ResourceLoader(RESOURCES_PATH.concat('checksums'), {
            cron: ONE_DAY,
            dataType: 'json',
            remoteURL: this.remoteURL
          });
          this.loader.onUpdate(this.updateChecksums.bind(this));
        }

        // TODO: Download the file everytime, but we should find a way to use the checksum
        // Or, since some lists use an expiration date, we could store a timestamp instead of checksum

        _createClass(Checksums, [{
          key: 'load',
          value: function load() {
            this.loader.load().then(this.updateChecksums.bind(this));
          }

          // Private API

        }, {
          key: 'updateChecksums',
          value: function updateChecksums(data) {
            var _this = this;

            // Update the URL as it must include the timestamp to avoid caching
            // NOTE: This mustn't be removed as it would break the update.
            this.loader.resource.remoteURL = this.remoteURL;

            // Parse checksums
            Object.keys(data).forEach(function (list) {
              Object.keys(data[list]).forEach(function (asset) {
                var checksum = data[list][asset].checksum;
                var lang = null;
                if (list === 'country_lists') {
                  lang = data[list][asset].language;
                }

                var assetName = asset;

                // Strip prefix
                ['http://', 'https://'].forEach(function (prefix) {
                  if (assetName.startsWith(prefix)) {
                    assetName = assetName.substring(prefix.length);
                  }
                });

                var remoteURL = BASE_URL + assetName;
                var flag = true;

                if (list === 'mobile_customized') {
                  remoteURL = 'https://cdn.cliqz.com/adblocking/customized_filters_mobile_specific.txt';
                  if (platform.isFirefox || platform.isChromium) {
                    flag = false;
                  }
                }

                // Trigger callback even if checksum is the same since
                // it wouldn't work for filter-lists.json file which could
                // have the same checksum but lists could be expired.
                // FiltersList class has then to check the checksum before update.
                if (flag && (lang === null || LANGS.indexOf(lang) > -1)) {
                  CliqzUtils.log('adblocker', asset + ' ' + remoteURL);
                  _this.triggerCallbacks({
                    checksum: checksum,
                    asset: asset,
                    remoteURL: remoteURL,
                    key: list
                  });
                }
              });
            });
          }
        }, {
          key: 'remoteURL',
          get: function get() {
            // The URL should contain a timestamp to avoid caching
            return 'https://cdn.cliqz.com/adblocking/allowed-lists.json?';
          }
        }]);

        return Checksums;
      })(UpdateCallbackHandler);

      FiltersList = (function (_UpdateCallbackHandler2) {
        _inherits(FiltersList, _UpdateCallbackHandler2);

        function FiltersList(checksum, asset, remoteURL) {
          _classCallCheck(this, FiltersList);

          _get(Object.getPrototypeOf(FiltersList.prototype), 'constructor', this).call(this);
          this.checksum = checksum;

          var assetName = asset;

          // Strip prefix
          ['http://', 'https://'].forEach(function (prefix) {
            if (assetName.startsWith(prefix)) {
              assetName = assetName.substring(prefix.length);
            }
          });

          this.resource = new Resource(RESOURCES_PATH.concat(assetName.split('/')), { remoteURL: remoteURL, dataType: 'plainText' });
          this.resource.onUpdate(this.updateList.bind(this));
        }

        /* Class responsible for loading, persisting and updating filters lists.
         */

        _createClass(FiltersList, [{
          key: 'load',
          value: function load() {
            this.resource.load().then(this.updateList.bind(this));
          }
        }, {
          key: 'updateFromChecksum',
          value: function updateFromChecksum(checksum) {
            if (checksum === undefined || checksum !== this.checksum) {
              this.checksum = checksum;
              this.resource.updateFromRemote();
            }
          }
        }, {
          key: 'updateList',
          value: function updateList(data) {
            var filters = data.split(/\r\n|\r|\n/g);
            if (filters.length > 0) {
              this.triggerCallbacks(filters);
            }
          }
        }]);

        return FiltersList;
      })(UpdateCallbackHandler);

      _default = (function (_UpdateCallbackHandler3) {
        _inherits(_default, _UpdateCallbackHandler3);

        function _default() {
          _classCallCheck(this, _default);

          _get(Object.getPrototypeOf(_default.prototype), 'constructor', this).call(this);

          // Current checksums of official filters lists
          this.checksums = new Checksums();

          // Lists of filters currently loaded
          this.lists = new Map();

          // Register callbacks on list creation
          this.checksums.onUpdate(this.updateList.bind(this));
        }

        _createClass(_default, [{
          key: 'load',
          value: function load() {
            this.checksums.load();
          }
        }, {
          key: 'updateList',
          value: function updateList(_ref) {
            var _this2 = this;

            var checksum = _ref.checksum;
            var asset = _ref.asset;
            var remoteURL = _ref.remoteURL;
            var key = _ref.key;

            var list = this.lists.get(asset);

            if (list === undefined) {
              list = new FiltersList(checksum, asset, remoteURL);
              this.lists.set(asset, list);
              list.onUpdate(function (filters) {
                var isFiltersList = key !== 'js_resources';
                _this2.triggerCallbacks({ asset: asset, filters: filters, isFiltersList: isFiltersList });
              });
              list.load();
            } else {
              list.updateFromChecksum(checksum);
            }
          }
        }]);

        return _default;
      })(UpdateCallbackHandler);

      _export('default', _default);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFkYmxvY2tlci9maWx0ZXJzLWxvYWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7OztnRkFLTSxjQUFjLEVBSWQsVUFBVSxFQUNWLFVBQVUsRUFDVixRQUFRLEVBQ1IsT0FBTyxFQUtQLFFBQVEsRUFFUixLQUFLLEVBRUwsU0FBUyxFQWlGVCxXQUFXOzs7Ozs7Ozs7Ozs7O3FDQXRHUSxRQUFRO2tEQUFFLHFCQUFxQjs7Ozs7OztBQUtsRCxvQkFBYyxHQUFHLENBQUMsV0FBVyxDQUFDOzs7QUFJOUIsZ0JBQVUsR0FBRyxJQUFJO0FBQ2pCLGdCQUFVLEdBQUcsRUFBRSxHQUFHLFVBQVU7QUFDNUIsY0FBUSxHQUFHLEVBQUUsR0FBRyxVQUFVO0FBQzFCLGFBQU8sR0FBRyxFQUFFLEdBQUcsUUFBUTs7OztBQUt2QixjQUFRLEdBQUcsa0RBQWtEO0FBRTdELFdBQUssR0FBRyxhQUFhLENBQUMsS0FBSyxFQUFFOztBQUU3QixlQUFTO2tCQUFULFNBQVM7O0FBQ0YsaUJBRFAsU0FBUyxHQUNDO2dDQURWLFNBQVM7O0FBRVgscUNBRkUsU0FBUyw2Q0FFSDs7QUFFUixjQUFJLENBQUMsTUFBTSxHQUFHLElBQUksY0FBYyxDQUM5QixjQUFjLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FBQyxFQUNsQztBQUNFLGdCQUFJLEVBQUUsT0FBTztBQUNiLG9CQUFRLEVBQUUsTUFBTTtBQUNoQixxQkFBUyxFQUFFLElBQUksQ0FBQyxTQUFTO1dBQzFCLENBQ0YsQ0FBQztBQUNGLGNBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7U0FDdkQ7Ozs7O3FCQWJHLFNBQVM7O2lCQWVULGdCQUFHO0FBQ0wsZ0JBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7V0FD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Z0JBQUc7QUFDTCxnQkFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztXQUN2Qjs7O2lCQUVTLG9CQUFDLElBQW1DLEVBQUU7OztnQkFBbkMsUUFBUSxHQUFWLElBQW1DLENBQWpDLFFBQVE7Z0JBQUUsS0FBSyxHQUFqQixJQUFtQyxDQUF2QixLQUFLO2dCQUFFLFNBQVMsR0FBNUIsSUFBbUMsQ0FBaEIsU0FBUztnQkFBRSxHQUFHLEdBQWpDLElBQW1DLENBQUwsR0FBRzs7QUFDMUMsZ0JBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxDQUFDOztBQUVqQyxnQkFBSSxJQUFJLEtBQUssU0FBUyxFQUFFO0FBQ3RCLGtCQUFJLEdBQUcsSUFBSSxXQUFXLENBQUMsUUFBUSxFQUFFLEtBQUssRUFBRSxTQUFTLENBQUMsQ0FBQztBQUNuRCxrQkFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLElBQUksQ0FBQyxDQUFDO0FBQzVCLGtCQUFJLENBQUMsUUFBUSxDQUFDLFVBQUEsT0FBTyxFQUFJO0FBQ3ZCLG9CQUFNLGFBQWEsR0FBRyxHQUFHLEtBQUssY0FBYyxDQUFDO0FBQzdDLHVCQUFLLGdCQUFnQixDQUFDLEVBQUUsS0FBSyxFQUFMLEtBQUssRUFBRSxPQUFPLEVBQVAsT0FBTyxFQUFFLGFBQWEsRUFBYixhQUFhLEVBQUUsQ0FBQyxDQUFDO2VBQzFELENBQUMsQ0FBQztBQUNILGtCQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDYixNQUFNO0FBQ0wsa0JBQUksQ0FBQyxrQkFBa0IsQ0FBQyxRQUFRLENBQUMsQ0FBQzthQUNuQztXQUNGOzs7O1NBbkMwQixxQkFBcUIiLCJmaWxlIjoiYWRibG9ja2VyL2ZpbHRlcnMtbG9hZGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IFJlc291cmNlTG9hZGVyLCB7IFJlc291cmNlLCBVcGRhdGVDYWxsYmFja0hhbmRsZXIgfSBmcm9tICdjb3JlL3Jlc291cmNlLWxvYWRlcic7XG5pbXBvcnQgQ2xpcXpMYW5ndWFnZSBmcm9tICdwbGF0Zm9ybS9sYW5ndWFnZSc7XG5pbXBvcnQgcGxhdGZvcm0gZnJvbSAncGxhdGZvcm0vcGxhdGZvcm0nO1xuXG4vLyBEaXNrIHBlcnNpc3RpbmdcbmNvbnN0IFJFU09VUkNFU19QQVRIID0gWydhZGJsb2NrZXInXTtcblxuXG4vLyBDb21tb24gZHVyYXRpb25zXG5jb25zdCBPTkVfU0VDT05EID0gMTAwMDtcbmNvbnN0IE9ORV9NSU5VVEUgPSA2MCAqIE9ORV9TRUNPTkQ7XG5jb25zdCBPTkVfSE9VUiA9IDYwICogT05FX01JTlVURTtcbmNvbnN0IE9ORV9EQVkgPSAyNCAqIE9ORV9IT1VSO1xuXG5cbi8vIFVSTHMgdG8gZmV0Y2ggYmxvY2sgbGlzdHNcblxuY29uc3QgQkFTRV9VUkwgPSAnaHR0cHM6Ly9jZG4uY2xpcXouY29tL2FkYmxvY2tpbmcvbGF0ZXN0LWZpbHRlcnMvJztcblxuY29uc3QgTEFOR1MgPSBDbGlxekxhbmd1YWdlLnN0YXRlKCk7XG5cbmNsYXNzIENoZWNrc3VtcyBleHRlbmRzIFVwZGF0ZUNhbGxiYWNrSGFuZGxlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLmxvYWRlciA9IG5ldyBSZXNvdXJjZUxvYWRlcihcbiAgICAgIFJFU09VUkNFU19QQVRILmNvbmNhdCgnY2hlY2tzdW1zJyksXG4gICAgICB7XG4gICAgICAgIGNyb246IE9ORV9EQVksXG4gICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgIHJlbW90ZVVSTDogdGhpcy5yZW1vdGVVUkwsXG4gICAgICB9XG4gICAgKTtcbiAgICB0aGlzLmxvYWRlci5vblVwZGF0ZSh0aGlzLnVwZGF0ZUNoZWNrc3Vtcy5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIGxvYWQoKSB7XG4gICAgdGhpcy5sb2FkZXIubG9hZCgpLnRoZW4odGhpcy51cGRhdGVDaGVja3N1bXMuYmluZCh0aGlzKSk7XG4gIH1cblxuICAvLyBQcml2YXRlIEFQSVxuXG4gIGdldCByZW1vdGVVUkwoKSB7XG4gICAgLy8gVGhlIFVSTCBzaG91bGQgY29udGFpbiBhIHRpbWVzdGFtcCB0byBhdm9pZCBjYWNoaW5nXG4gICAgcmV0dXJuICdodHRwczovL2Nkbi5jbGlxei5jb20vYWRibG9ja2luZy9hbGxvd2VkLWxpc3RzLmpzb24/JztcbiAgfVxuXG4gIFxuICB1cGRhdGVDaGVja3N1bXMoZGF0YSkge1xuICAgIC8vIFVwZGF0ZSB0aGUgVVJMIGFzIGl0IG11c3QgaW5jbHVkZSB0aGUgdGltZXN0YW1wIHRvIGF2b2lkIGNhY2hpbmdcbiAgICAvLyBOT1RFOiBUaGlzIG11c3RuJ3QgYmUgcmVtb3ZlZCBhcyBpdCB3b3VsZCBicmVhayB0aGUgdXBkYXRlLlxuICAgIHRoaXMubG9hZGVyLnJlc291cmNlLnJlbW90ZVVSTCA9IHRoaXMucmVtb3RlVVJMO1xuXG4gICAgLy8gUGFyc2UgY2hlY2tzdW1zXG4gICAgT2JqZWN0LmtleXMoZGF0YSkuZm9yRWFjaChsaXN0ID0+IHtcbiAgICAgIE9iamVjdC5rZXlzKGRhdGFbbGlzdF0pLmZvckVhY2goYXNzZXQgPT4ge1xuICAgICAgICBjb25zdCBjaGVja3N1bSA9IGRhdGFbbGlzdF1bYXNzZXRdLmNoZWNrc3VtO1xuICAgICAgICBsZXQgbGFuZyA9IG51bGw7XG4gICAgICAgIGlmIChsaXN0ID09PSAnY291bnRyeV9saXN0cycpe1xuICAgICAgICAgIGxhbmcgPSBkYXRhW2xpc3RdW2Fzc2V0XS5sYW5ndWFnZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBhc3NldE5hbWUgPSBhc3NldDtcblxuICAgICAgICAvLyBTdHJpcCBwcmVmaXhcbiAgICAgICAgWydodHRwOi8vJywgJ2h0dHBzOi8vJ10uZm9yRWFjaChwcmVmaXggPT4ge1xuICAgICAgICAgIGlmIChhc3NldE5hbWUuc3RhcnRzV2l0aChwcmVmaXgpKSB7XG4gICAgICAgICAgICBhc3NldE5hbWUgPSBhc3NldE5hbWUuc3Vic3RyaW5nKHByZWZpeC5sZW5ndGgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgbGV0IHJlbW90ZVVSTCA9IEJBU0VfVVJMICsgYXNzZXROYW1lO1xuICAgICAgICBsZXQgZmxhZyA9IHRydWU7XG5cbiAgICAgICAgaWYgKGxpc3QgPT09ICdtb2JpbGVfY3VzdG9taXplZCcpIHtcbiAgICAgICAgICByZW1vdGVVUkwgPSAnaHR0cHM6Ly9jZG4uY2xpcXouY29tL2FkYmxvY2tpbmcvY3VzdG9taXplZF9maWx0ZXJzX21vYmlsZV9zcGVjaWZpYy50eHQnO1xuICAgICAgICAgIGlmIChwbGF0Zm9ybS5pc0ZpcmVmb3ggfHwgcGxhdGZvcm0uaXNDaHJvbWl1bSkge1xuICAgICAgICAgICAgZmxhZyA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFRyaWdnZXIgY2FsbGJhY2sgZXZlbiBpZiBjaGVja3N1bSBpcyB0aGUgc2FtZSBzaW5jZVxuICAgICAgICAvLyBpdCB3b3VsZG4ndCB3b3JrIGZvciBmaWx0ZXItbGlzdHMuanNvbiBmaWxlIHdoaWNoIGNvdWxkXG4gICAgICAgIC8vIGhhdmUgdGhlIHNhbWUgY2hlY2tzdW0gYnV0IGxpc3RzIGNvdWxkIGJlIGV4cGlyZWQuXG4gICAgICAgIC8vIEZpbHRlcnNMaXN0IGNsYXNzIGhhcyB0aGVuIHRvIGNoZWNrIHRoZSBjaGVja3N1bSBiZWZvcmUgdXBkYXRlLlxuICAgICAgICBpZiAoZmxhZyAmJiAobGFuZyA9PT0gbnVsbCB8fCBMQU5HUy5pbmRleE9mKGxhbmcpID4gLTEpKXtcbiAgICAgICAgICBDbGlxelV0aWxzLmxvZygnYWRibG9ja2VyJywgYXNzZXQrJyAnK3JlbW90ZVVSTCk7XG4gICAgICAgICAgdGhpcy50cmlnZ2VyQ2FsbGJhY2tzKHtcbiAgICAgICAgICAgIGNoZWNrc3VtLFxuICAgICAgICAgICAgYXNzZXQsXG4gICAgICAgICAgICByZW1vdGVVUkw6IHJlbW90ZVVSTCxcbiAgICAgICAgICAgIGtleTogbGlzdCxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbn1cblxuXG4vLyBUT0RPOiBEb3dubG9hZCB0aGUgZmlsZSBldmVyeXRpbWUsIGJ1dCB3ZSBzaG91bGQgZmluZCBhIHdheSB0byB1c2UgdGhlIGNoZWNrc3VtXG4vLyBPciwgc2luY2Ugc29tZSBsaXN0cyB1c2UgYW4gZXhwaXJhdGlvbiBkYXRlLCB3ZSBjb3VsZCBzdG9yZSBhIHRpbWVzdGFtcCBpbnN0ZWFkIG9mIGNoZWNrc3VtXG5jbGFzcyBGaWx0ZXJzTGlzdCBleHRlbmRzIFVwZGF0ZUNhbGxiYWNrSGFuZGxlciB7XG4gIGNvbnN0cnVjdG9yKGNoZWNrc3VtLCBhc3NldCwgcmVtb3RlVVJMKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmNoZWNrc3VtID0gY2hlY2tzdW07XG5cbiAgICBsZXQgYXNzZXROYW1lID0gYXNzZXQ7XG5cbiAgICAvLyBTdHJpcCBwcmVmaXhcbiAgICBbJ2h0dHA6Ly8nLCAnaHR0cHM6Ly8nXS5mb3JFYWNoKHByZWZpeCA9PiB7XG4gICAgICBpZiAoYXNzZXROYW1lLnN0YXJ0c1dpdGgocHJlZml4KSkge1xuICAgICAgICBhc3NldE5hbWUgPSBhc3NldE5hbWUuc3Vic3RyaW5nKHByZWZpeC5sZW5ndGgpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgdGhpcy5yZXNvdXJjZSA9IG5ldyBSZXNvdXJjZShcbiAgICAgIFJFU09VUkNFU19QQVRILmNvbmNhdChhc3NldE5hbWUuc3BsaXQoJy8nKSksXG4gICAgICB7IHJlbW90ZVVSTCwgZGF0YVR5cGU6ICdwbGFpblRleHQnIH1cbiAgICApO1xuICAgIHRoaXMucmVzb3VyY2Uub25VcGRhdGUodGhpcy51cGRhdGVMaXN0LmJpbmQodGhpcykpO1xuICB9XG5cbiAgbG9hZCgpIHtcbiAgICB0aGlzLnJlc291cmNlLmxvYWQoKS50aGVuKHRoaXMudXBkYXRlTGlzdC5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIHVwZGF0ZUZyb21DaGVja3N1bShjaGVja3N1bSkge1xuICAgIGlmIChjaGVja3N1bSA9PT0gdW5kZWZpbmVkIHx8IGNoZWNrc3VtICE9PSB0aGlzLmNoZWNrc3VtKSB7XG4gICAgICB0aGlzLmNoZWNrc3VtID0gY2hlY2tzdW07XG4gICAgICB0aGlzLnJlc291cmNlLnVwZGF0ZUZyb21SZW1vdGUoKTtcbiAgICB9XG4gIH1cblxuICB1cGRhdGVMaXN0KGRhdGEpIHtcbiAgICBjb25zdCBmaWx0ZXJzID0gZGF0YS5zcGxpdCgvXFxyXFxufFxccnxcXG4vZyk7XG4gICAgaWYgKGZpbHRlcnMubGVuZ3RoID4gMCkge1xuICAgICAgdGhpcy50cmlnZ2VyQ2FsbGJhY2tzKGZpbHRlcnMpO1xuICAgIH1cbiAgfVxufVxuXG5cbi8qIENsYXNzIHJlc3BvbnNpYmxlIGZvciBsb2FkaW5nLCBwZXJzaXN0aW5nIGFuZCB1cGRhdGluZyBmaWx0ZXJzIGxpc3RzLlxuICovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBleHRlbmRzIFVwZGF0ZUNhbGxiYWNrSGFuZGxlciB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIC8vIEN1cnJlbnQgY2hlY2tzdW1zIG9mIG9mZmljaWFsIGZpbHRlcnMgbGlzdHNcbiAgICB0aGlzLmNoZWNrc3VtcyA9IG5ldyBDaGVja3N1bXMoKTtcblxuXG4gICAgLy8gTGlzdHMgb2YgZmlsdGVycyBjdXJyZW50bHkgbG9hZGVkXG4gICAgdGhpcy5saXN0cyA9IG5ldyBNYXAoKTtcblxuXG4gICAgLy8gUmVnaXN0ZXIgY2FsbGJhY2tzIG9uIGxpc3QgY3JlYXRpb25cbiAgICB0aGlzLmNoZWNrc3Vtcy5vblVwZGF0ZSh0aGlzLnVwZGF0ZUxpc3QuYmluZCh0aGlzKSk7XG4gIH1cblxuICBsb2FkKCkge1xuICAgIHRoaXMuY2hlY2tzdW1zLmxvYWQoKTtcbiAgfVxuXG4gIHVwZGF0ZUxpc3QoeyBjaGVja3N1bSwgYXNzZXQsIHJlbW90ZVVSTCwga2V5IH0pIHtcbiAgICBsZXQgbGlzdCA9IHRoaXMubGlzdHMuZ2V0KGFzc2V0KTtcblxuICAgIGlmIChsaXN0ID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGxpc3QgPSBuZXcgRmlsdGVyc0xpc3QoY2hlY2tzdW0sIGFzc2V0LCByZW1vdGVVUkwpO1xuICAgICAgdGhpcy5saXN0cy5zZXQoYXNzZXQsIGxpc3QpO1xuICAgICAgbGlzdC5vblVwZGF0ZShmaWx0ZXJzID0+IHtcbiAgICAgICAgY29uc3QgaXNGaWx0ZXJzTGlzdCA9IGtleSAhPT0gJ2pzX3Jlc291cmNlcyc7XG4gICAgICAgIHRoaXMudHJpZ2dlckNhbGxiYWNrcyh7IGFzc2V0LCBmaWx0ZXJzLCBpc0ZpbHRlcnNMaXN0IH0pO1xuICAgICAgfSk7XG4gICAgICBsaXN0LmxvYWQoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGlzdC51cGRhdGVGcm9tQ2hlY2tzdW0oY2hlY2tzdW0pO1xuICAgIH1cbiAgfVxufVxuIl19