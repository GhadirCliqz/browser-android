System.register('autocomplete/smart-cliqz-cache/smart-cliqz-cache', ['autocomplete/smart-cliqz-cache/rich-header', 'core/cliqz', 'core/fs', 'autocomplete/smart-cliqz-cache/cache'], function (_export) {
  'use strict';

  var getSmartCliqz, utils, mkdir, Cache, CUSTOM_DATA_CACHE_FOLDER, CUSTOM_DATA_CACHE_FILE, MAX_ITEMS, ONE_MINUTE, ONE_HOUR, ONE_DAY, _default;

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_autocompleteSmartCliqzCacheRichHeader) {
      getSmartCliqz = _autocompleteSmartCliqzCacheRichHeader.getSmartCliqz;
    }, function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }, function (_coreFs) {
      mkdir = _coreFs.mkdir;
    }, function (_autocompleteSmartCliqzCacheCache) {
      Cache = _autocompleteSmartCliqzCacheCache['default'];
    }],
    execute: function () {
      CUSTOM_DATA_CACHE_FOLDER = 'cliqz';
      CUSTOM_DATA_CACHE_FILE = CUSTOM_DATA_CACHE_FOLDER + '/smartcliqz-custom-data-cache.json';

      // maximum number of items (e.g., categories or links) to keep
      MAX_ITEMS = 5;
      ONE_MINUTE = 60;
      ONE_HOUR = ONE_MINUTE * 60;
      ONE_DAY = ONE_HOUR * 24;

      /*
       * @namespace smart-cliqz-cache
       */

      _default = (function () {
        /**
        * This module caches SmartCliqz results in the extension. It
        * also customizes news SmartCliqz by re-ordering categories and
        * links based on the user's browsing history.
        * @class SmartCliqzCache
        * @constructor
        */

        function _default() {
          var _this = this;

          _classCallCheck(this, _default);

          this._smartCliqzCache = new Cache(ONE_MINUTE);
          // re-customize after an hour
          this._customDataCache = new Cache(ONE_HOUR);
          this._isCustomizationEnabledByDefault = true;
          this._isInitialized = false;
          // to prevent fetching while fetching is still in progress
          this._fetchLock = {};

          mkdir(CUSTOM_DATA_CACHE_FOLDER).then(function () {
            // TODO: detect when loaded; allow save only afterwards
            _this._customDataCache.load(CUSTOM_DATA_CACHE_FILE);
          })['catch'](function (e) {
            _this._log('init: unable to create cache folder:' + e);
          });

          this._isInitialized = true;
          this._log('init: initialized');
        }

        /*
        * stores SmartCliqz if newer than chached version
        * @method store
        * @param smartCliqz
        */

        _createClass(_default, [{
          key: 'store',
          value: function store(smartCliqz) {
            var url = this.getUrl(smartCliqz);

            this._smartCliqzCache.store(url, smartCliqz);

            try {
              if (this.isCustomizationEnabled() && this.isNews(smartCliqz) && this._customDataCache.isStale(url)) {

                this._log('store: found stale data for url ' + url);
                this._prepareCustomData(url);
              }
            } catch (e) {
              this._log('store: error while customizing data: ' + e);
            }
          }

          /**
          * @method fetchAndStore
          * @param id
          */
        }, {
          key: 'fetchAndStore',
          value: function fetchAndStore(url) {
            var _this2 = this;

            if (this._fetchLock.hasOwnProperty(url)) {
              this._log('fetchAndStore: fetching already in progress for ' + url);
              return;
            }

            this._log('fetchAndStore: for ' + url);
            this._fetchLock[url] = true;
            getSmartCliqz(url).then(function (smartCliqz) {
              // limit number of categories/links
              if (smartCliqz.hasOwnProperty('data')) {
                if (smartCliqz.data.hasOwnProperty('links')) {
                  smartCliqz.data.links = smartCliqz.data.links.slice(0, MAX_ITEMS);
                }
                if (smartCliqz.data.hasOwnProperty('categories')) {
                  smartCliqz.data.categories = smartCliqz.data.categories.slice(0, MAX_ITEMS);
                }
              }
              _this2.store(smartCliqz);
              delete _this2._fetchLock[url];
            }, function (e) {
              _this2._log('fetchAndStore: error while fetching data: ' + e.type + ' ' + e.message);
              delete _this2._fetchLock[url];
            });
          }

          /**
          * customizes SmartCliqz if news or domain supported, and user preference is set
          * @method retrieve
          * @param url
          * @returns SmartCliqz from cache (false if not found)
          */
        }, {
          key: 'retrieve',
          value: function retrieve(url) {
            var smartCliqz = this._smartCliqzCache.retrieve(url);

            if (this.isCustomizationEnabled() && smartCliqz && this.isNews(smartCliqz)) {
              try {
                this._customizeSmartCliqz(smartCliqz);
              } catch (e) {
                this._log('retrieveCustomized: error while customizing data: ' + e);
              }
            }

            return smartCliqz;
          }

          /**
           * Same as `retrieve`, but triggers asynchronous cache update:
           * fetches SmartCliqz (again) if not yet cached or if stale. If SmartCliqz
           * was not yet cached `false` is returned and update is initiated.
           * @param {String} url - The SmartCliqz trigger URL
           * @return {SmartCliqz} The cached SmartCliqz or false if not yet cached.
           */
        }, {
          key: 'retrieveAndUpdate',
          value: function retrieveAndUpdate(url) {
            var smartCliqz = this.retrieve(url);

            if (this._smartCliqzCache.isStale(url)) {
              utils.setTimeout((function () {
                this.fetchAndStore(url);
              }).bind(this), 0);
            }

            return smartCliqz;
          }

          /**
          * extracts domain from SmartCliqz
          * @method getDomain
          * @param smartCliqz
          */
        }, {
          key: 'getDomain',
          value: function getDomain(smartCliqz) {
            // TODO: define one place to store domain
            if (smartCliqz.data.domain) {
              return smartCliqz.data.domain;
            } else if (smartCliqz.data.trigger_urls && smartCliqz.data.trigger_urls.length > 0) {
              return utils.generalizeUrl(smartCliqz.data.trigger_urls[0]);
            } else {
              return false;
            }
          }

          /**
          * extracts id from SmartCliqz
          * @method getId
          * @param smartCliqz
          */
        }, {
          key: 'getId',
          value: function getId(smartCliqz) {
            return smartCliqz.data.__subType__.id;
          }

          /**
          * extracts URL from SmartCliqz
          * @method getUrl
          * @param smartCliqz
          */
        }, {
          key: 'getUrl',
          value: function getUrl(smartCliqz) {
            return utils.generalizeUrl(smartCliqz.val, true);
          }

          /**
          * extracts timestamp from SmartCliqz
          * @method getTimestamp
          * @param smartCliqz
          */
        }, {
          key: 'getTimestamp',
          value: function getTimestamp(smartCliqz) {
            return smartCliqz.data.ts;
          }

          /**
          * @method isNews
          * @param smartCliqz
          * returns true this is a news SmartCliqz
          */
        }, {
          key: 'isNews',
          value: function isNews(smartCliqz) {
            return typeof smartCliqz.data.news !== 'undefined';
          }

          /**
          * @method isCustomizationEnabled
          * @returns true if the user enabled customization
          */
        }, {
          key: 'isCustomizationEnabled',
          value: function isCustomizationEnabled() {
            try {
              var isEnabled = utils.getPref('enableSmartCliqzCustomization', undefined);
              return isEnabled === undefined ? this._isCustomizationEnabledByDefault : isEnabled;
            } catch (e) {
              return this._isCustomizationEnabledByDefault;
            }
          }

          // re-orders categories based on visit frequency
        }, {
          key: '_customizeSmartCliqz',
          value: function _customizeSmartCliqz(smartCliqz) {
            var url = this.getUrl(smartCliqz);
            if (this._customDataCache.isCached(url)) {
              this._injectCustomData(smartCliqz, this._customDataCache.retrieve(url));

              if (this._customDataCache.isStale(url)) {
                this._log('_customizeSmartCliqz: found stale data for ' + url);
                this._prepareCustomData(url);
              }
            } else {
              this._log('_customizeSmartCliqz: custom data not yet ready for ' + url);
            }
          }

          // replaces all keys from custom data in SmartCliqz data
        }, {
          key: '_injectCustomData',
          value: function _injectCustomData(smartCliqz, customData) {
            var url = this.getUrl(smartCliqz);
            this._log('_injectCustomData: injecting for ' + url);
            for (var key in customData) {
              if (customData.hasOwnProperty(key)) {
                smartCliqz.data[key] = customData[key];
                this._log('_injectCustomData: injecting key ' + key);
              }
            }
            this._log('_injectCustomData: done injecting for ' + url);
          }

          // prepares and stores custom data for SmartCliqz with given URL (async.),
          // (if custom data has not been prepared before and has not expired)
        }, {
          key: '_prepareCustomData',
          value: function _prepareCustomData(url) {
            var _this3 = this;

            if (this._customDataCache.isStale(url)) {
              // update time so that this method is not executed multiple
              // times while not yet finished (runs asynchronously)
              this._customDataCache.refresh(url);
              this._log('_prepareCustomData: preparing for ' + url);
            } else {
              this._log('_prepareCustomData: already updated or in update progress ' + url);
              return;
            }

            // for stats
            var oldCustomData = this._customDataCache.retrieve(url);

            // (1) fetch template from rich header
            getSmartCliqz(url).then(function (smartCliqz) {
              var domain = _this3.getDomain(smartCliqz);
              return Promise.all([Promise.resolve(smartCliqz), _this3._fetchVisitedUrls(domain)]);
            })
            // (2) fetch history for SmartCliqz domain
            .then(function (_ref) {
              var _ref2 = _slicedToArray(_ref, 2);

              var smartCliqz = _ref2[0];
              var urls = _ref2[1];

              // now, (3) re-order template categories based on history
              var domain = _this3.getDomain(smartCliqz);

              // TODO: define per SmartCliqz what the data field to be customized is called
              if (!_this3.isNews(smartCliqz)) {
                smartCliqz.data.categories = smartCliqz.data.links;
              }

              var categories = smartCliqz.data.categories.slice();

              // add some information to facilitate re-ordering
              for (var j = 0; j < categories.length; j++) {
                categories[j].genUrl = utils.generalizeUrl(categories[j].url);
                categories[j].matchCount = 0;
                categories[j].originalOrder = j;
              }

              // count category-visit matches (visit url contains category url)
              for (var i = 0; i < urls.length; i++) {
                var _url = utils.generalizeUrl(urls[i]);
                for (var j = 0; j < categories.length; j++) {
                  if (_this3._isMatch(_url, categories[j].genUrl)) {
                    categories[j].matchCount++;
                  }
                }
              }

              // re-order by match count; on tie use original order
              categories.sort(function compare(a, b) {
                if (a.matchCount !== b.matchCount) {
                  return b.matchCount - a.matchCount; // descending
                } else {
                    return a.originalOrder - b.originalOrder; // ascending
                  }
              });

              categories = categories.slice(0, MAX_ITEMS);

              var oldCategories = oldCustomData ?
              // previous customization: use either categories (news) or links (other SmartCliqz)
              _this3.isNews(smartCliqz) ? oldCustomData.categories : oldCustomData.links :
              // no previous customization: use default order
              smartCliqz.data.categories;

              // send some stats
              _this3._sendStats(oldCategories, categories, oldCustomData ? true : false, urls);

              // TODO: define per SmartCliqz what the data field to be customized is called
              if (_this3.isNews(smartCliqz)) {
                _this3._customDataCache.store(url, { categories: categories });
              } else {
                _this3._customDataCache.store(url, { links: categories });
              }

              _this3._log('_prepareCustomData: done preparing for ' + url);
              _this3._customDataCache.save(CUSTOM_DATA_CACHE_FILE);
            })['catch'](function (e) {
              return _this3._log('_prepareCustomData: error while fetching data: ' + e.message);
            });
          }

          // checks if URL from history matches a category URL
        }, {
          key: '_isMatch',
          value: function _isMatch(historyUrl, categoryUrl) {
            // TODO: check for subcategories, for example,
            //       Spiegel 'Soziales' has URL 'wirtschaft/soziales',
            //     thus such entries are counted twice, for 'Sozialez',
            //     but also for 'Wirtschaft'
            return historyUrl.indexOf(categoryUrl) > -1;
          }

          // from history, fetches all visits to given domain within 30 days from now (async.)
        }, {
          key: '_fetchVisitedUrls',
          value: function _fetchVisitedUrls(domain) {
            var _this4 = this;

            return new Promise(function (resolve, reject) {
              _this4._log('_fetchVisitedUrls: start fetching for domain ' + domain);
              // TODO: make cross platform
              var historyService = Components.classes['@mozilla.org/browser/nav-history-service;1'].getService(Components.interfaces.nsINavHistoryService);

              if (!historyService) {
                reject('_fetchVisitedUrls: history service not available');
              } else {
                var options = historyService.getNewQueryOptions();
                var query = historyService.getNewQuery();
                query.domain = domain;
                // 30 days from now
                query.beginTimeReference = query.TIME_RELATIVE_NOW;
                query.beginTime = -1 * 30 * 24 * 60 * 60 * 1000000;
                query.endTimeReference = query.TIME_RELATIVE_NOW;
                query.endTime = 0;

                var result = historyService.executeQuery(query, options);
                var container = result.root;
                container.containerOpen = true;

                var urls = [];
                for (var i = 0; i < container.childCount; i++) {
                  urls[i] = container.getChild(i).uri;
                }

                _this4._log('_fetchVisitedUrls: done fetching ' + urls.length + ' URLs for domain ' + domain);
                resolve(urls);
              }
            });
          }
        }, {
          key: '_sendStats',
          value: function _sendStats(oldCategories, newCategories, isRepeatedCustomization, urls) {
            var stats = {
              type: 'activity',
              action: 'smart_cliqz_customization',
              // SmartCliqz id
              id: 'na',
              // total number of URLs retrieved from history
              urlCandidateCount: urls.length,
              // number of URLs that produced a match within shown categories (currently 5)
              urlMatchCount: 0,
              // average number of URL matches across shown categories
              urlMatchCountAvg: 0,
              // standard deviation of URL matches across shown categories
              urlMatchCountSd: 0,
              // number of categories that changed (per position; swap counts twice)
              categoriesPosChangeCount: 0,
              // number of categories kept after re-ordering (positions might change)
              categoriesKeptCount: 0,
              // average position change of a kept categories
              categoriesKeptPosChangeAvg: 0,
              // true, if this customization is a re-customization
              isRepeatedCustomization: isRepeatedCustomization
            };

            var oldPositions = {};
            var length = Math.min(oldCategories.length, newCategories.length);

            for (var i = 0; i < length; i++) {
              stats.urlMatchCount += newCategories[i].matchCount;
              oldPositions[oldCategories[i].title] = i;

              if (newCategories[i].title !== oldCategories[i].title) {
                stats.categoriesPosChangeCount++;
              }
            }
            stats.urlMatchCountAvg = stats.urlMatchCount / length;

            for (var i = 0; i < length; i++) {
              stats.urlMatchCountSd += Math.pow(stats.urlMatchCountAvg - newCategories[i].matchCount, 2);
            }
            stats.urlMatchCountSd /= length;
            stats.urlMatchCountSd = Math.sqrt(stats.urlMatchCountSd);

            for (var i = 0; i < length; i++) {
              if (oldPositions.hasOwnProperty(newCategories[i].title)) {
                stats.categoriesKeptCount++;
                stats.categoriesKeptPosChangeAvg += Math.abs(i - oldPositions[newCategories[i].title]);
              }
            }
            stats.categoriesKeptPosChangeAvg /= stats.categoriesKeptCount;

            utils.telemetry(stats);
          }

          // log helper
        }, {
          key: '_log',
          value: function _log(msg) {
            utils.log(msg, 'smart-cliqz-cache');
          }
        }, {
          key: 'unload',
          value: function unload() {}
        }]);

        return _default;
      })();

      _export('default', _default);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dG9jb21wbGV0ZS9zbWFydC1jbGlxei1jYWNoZS9zbWFydC1jbGlxei1jYWNoZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7MENBS00sd0JBQXdCLEVBQ3hCLHNCQUFzQixFQUV0QixTQUFTLEVBRVQsVUFBVSxFQUNWLFFBQVEsRUFDUixPQUFPOzs7Ozs7Ozs7OzZEQVpKLGFBQWE7O3lCQUNiLEtBQUs7O3NCQUNMLEtBQUs7Ozs7O0FBR1IsOEJBQXdCLEdBQUcsT0FBTztBQUNsQyw0QkFBc0IsR0FBRyx3QkFBd0IsR0FBRyxvQ0FBb0M7OztBQUV4RixlQUFTLEdBQUcsQ0FBQztBQUViLGdCQUFVLEdBQUcsRUFBRTtBQUNmLGNBQVEsR0FBRyxVQUFVLEdBQUcsRUFBRTtBQUMxQixhQUFPLEdBQUcsUUFBUSxHQUFHLEVBQUU7Ozs7Ozs7Ozs7Ozs7OztBQWFoQiw0QkFBRzs7Ozs7QUFDWixjQUFJLENBQUMsZ0JBQWdCLEdBQUcsSUFBSSxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUM7O0FBRTlDLGNBQUksQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUM1QyxjQUFJLENBQUMsZ0NBQWdDLEdBQUcsSUFBSSxDQUFDO0FBQzdDLGNBQUksQ0FBQyxjQUFjLEdBQUcsS0FBSyxDQUFDOztBQUU1QixjQUFJLENBQUMsVUFBVSxHQUFHLEVBQUUsQ0FBQzs7QUFFckIsZUFBSyxDQUFDLHdCQUF3QixDQUFDLENBQUMsSUFBSSxDQUFDLFlBQU07O0FBRXpDLGtCQUFLLGdCQUFnQixDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO1dBQ3BELENBQUMsU0FBTSxDQUFDLFVBQUMsQ0FBQyxFQUFLO0FBQ2Qsa0JBQUssSUFBSSxDQUFDLHNDQUFzQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1dBQ3ZELENBQUMsQ0FBQzs7QUFFSCxjQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztBQUMzQixjQUFJLENBQUMsSUFBSSxD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QUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDL0Isa0JBQUksWUFBWSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUU7QUFDdkQscUJBQUssQ0FBQyxtQkFBbUIsRUFBRSxDQUFDO0FBQzVCLHFCQUFLLENBQUMsMEJBQTBCLElBQzlCLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLFlBQVksQ0FBQyxhQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQztlQUV0RDthQUNGO0FBQ0QsaUJBQUssQ0FBQywwQkFBMEIsSUFBSSxLQUFLLENBQUMsbUJBQW1CLENBQUM7O0FBRTlELGlCQUFLLENBQUMsU0FBUyxDQUFDLEtBQUssQ0FBQyxDQUFDO1dBQ3hCOzs7OztpQkFHRyxjQUFDLEdBQUcsRUFBRTtBQUNSLGlCQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDO1dBQ3JDOzs7aUJBRUssa0JBQUcsRUFDUiIsImZpbGUiOiJhdXRvY29tcGxldGUvc21hcnQtY2xpcXotY2FjaGUvc21hcnQtY2xpcXotY2FjaGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBnZXRTbWFydENsaXF6IH0gZnJvbSAnYXV0b2NvbXBsZXRlL3NtYXJ0LWNsaXF6LWNhY2hlL3JpY2gtaGVhZGVyJ1xuaW1wb3J0IHsgdXRpbHMgfSBmcm9tICdjb3JlL2NsaXF6JztcbmltcG9ydCB7IG1rZGlyIH0gZnJvbSAnY29yZS9mcyc7XG5pbXBvcnQgQ2FjaGUgZnJvbSAnYXV0b2NvbXBsZXRlL3NtYXJ0LWNsaXF6LWNhY2hlL2NhY2hlJztcblxuY29uc3QgQ1VTVE9NX0RBVEFfQ0FDSEVfRk9MREVSID0gJ2NsaXF6JztcbmNvbnN0IENVU1RPTV9EQVRBX0NBQ0hFX0ZJTEUgPSBDVVNUT01fREFUQV9DQUNIRV9GT0xERVIgKyAnL3NtYXJ0Y2xpcXotY3VzdG9tLWRhdGEtY2FjaGUuanNvbic7XG4vLyBtYXhpbXVtIG51bWJlciBvZiBpdGVtcyAoZS5nLiwgY2F0ZWdvcmllcyBvciBsaW5rcykgdG8ga2VlcFxuY29uc3QgTUFYX0lURU1TID0gNTtcblxuY29uc3QgT05FX01JTlVURSA9IDYwO1xuY29uc3QgT05FX0hPVVIgPSBPTkVfTUlOVVRFICogNjA7XG5jb25zdCBPTkVfREFZID0gT05FX0hPVVIgKiAyNDtcblxuLypcbiAqIEBuYW1lc3BhY2Ugc21hcnQtY2xpcXotY2FjaGVcbiAqL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3Mge1xuICAvKipcbiAgKiBUaGlzIG1vZHVsZSBjYWNoZXMgU21hcnRDbGlxeiByZXN1bHRzIGluIHRoZSBleHRlbnNpb24uIEl0XG4gICogYWxzbyBjdXN0b21pemVzIG5ld3MgU21hcnRDbGlxeiBieSByZS1vcmRlcmluZyBjYXRlZ29yaWVzIGFuZFxuICAqIGxpbmtzIGJhc2VkIG9uIHRoZSB1c2VyJ3MgYnJvd3NpbmcgaGlzdG9yeS5cbiAgKiBAY2xhc3MgU21hcnRDbGlxekNhY2hlXG4gICogQGNvbnN0cnVjdG9yXG4gICovXG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX3NtYXJ0Q2xpcXpDYWNoZSA9IG5ldyBDYWNoZShPTkVfTUlOVVRFKTtcbiAgICAvLyByZS1jdXN0b21pemUgYWZ0ZXIgYW4gaG91clxuICAgIHRoaXMuX2N1c3RvbURhdGFDYWNoZSA9IG5ldyBDYWNoZShPTkVfSE9VUik7XG4gICAgdGhpcy5faXNDdXN0b21pemF0aW9uRW5hYmxlZEJ5RGVmYXVsdCA9IHRydWU7XG4gICAgdGhpcy5faXNJbml0aWFsaXplZCA9IGZhbHNlO1xuICAgIC8vIHRvIHByZXZlbnQgZmV0Y2hpbmcgd2hpbGUgZmV0Y2hpbmcgaXMgc3RpbGwgaW4gcHJvZ3Jlc3NcbiAgICB0aGlzLl9mZXRjaExvY2sgPSB7fTtcblxuICAgIG1rZGlyKENVU1RPTV9EQVRBX0NBQ0hFX0ZPTERFUikudGhlbigoKSA9PiB7XG4gICAgICAvLyBUT0RPOiBkZXRlY3Qgd2hlbiBsb2FkZWQ7IGFsbG93IHNhdmUgb25seSBhZnRlcndhcmRzXG4gICAgICB0aGlzLl9jdXN0b21EYXRhQ2FjaGUubG9hZChDVVNUT01fREFUQV9DQUNIRV9GSUxFKTtcbiAgICB9KS5jYXRjaCgoZSkgPT4ge1xuICAgICAgdGhpcy5fbG9nKCdpbml0OiB1bmFibGUgdG8gY3JlYXRlIGNhY2hlIGZvbGRlcjonICsgZSk7XG4gICAgfSk7XG5cbiAgICB0aGlzLl9pc0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICB0aGlzLl9sb2coJ2luaXQ6IGluaXRpYWxpemVkJyk7XG4gIH1cblxuICAvKlxuICAqIHN0b3JlcyBTbWFydENsaXF6IGlmIG5ld2VyIHRoYW4gY2hhY2hlZCB2ZXJzaW9uXG4gICogQG1ldGhvZCBzdG9yZVxuICAqIEBwYXJhbSBzbWFydENsaXF6XG4gICovXG4gIHN0b3JlKHNtYXJ0Q2xpcXopIHtcbiAgICBjb25zdCB1cmwgPSB0aGlzLmdldFVybChzbWFydENsaXF6KTtcblxuICAgIHRoaXMuX3NtYXJ0Q2xpcXpDYWNoZS5zdG9yZSh1cmwsIHNtYXJ0Q2xpcXopO1xuXG4gICAgdHJ5IHtcbiAgICAgIGlmICh0aGlzLmlzQ3VzdG9taXphdGlvbkVuYWJsZWQoKSAmJlxuICAgICAgICAgdGhpcy5pc05ld3Moc21hcnRDbGlxeikgJiZcbiAgICAgICAgIHRoaXMuX2N1c3RvbURhdGFDYWNoZS5pc1N0YWxlKHVybCkpIHtcblxuICAgICAgICB0aGlzLl9sb2coJ3N0b3JlOiBmb3VuZCBzdGFsZSBkYXRhIGZvciB1cmwgJyArIHVybCk7XG4gICAgICAgIHRoaXMuX3ByZXBhcmVDdXN0b21EYXRhKHVybCk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhpcy5fbG9nKCdzdG9yZTogZXJyb3Igd2hpbGUgY3VzdG9taXppbmcgZGF0YTogJyArIGUpO1xuICAgIH1cbiAgfVxuICAvKipcbiAgKiBAbWV0aG9kIGZldGNoQW5kU3RvcmVcbiAgKiBAcGFyYW0gaWRcbiAgKi9cbiAgZmV0Y2hBbmRTdG9yZSh1cmwpIHtcbiAgICBpZiAodGhpcy5fZmV0Y2hMb2NrLmhhc093blByb3BlcnR5KHVybCkpIHtcbiAgICAgIHRoaXMuX2xvZygnZmV0Y2hBbmRTdG9yZTogZmV0Y2hpbmcgYWxyZWFkeSBpbiBwcm9ncmVzcyBmb3IgJyArIHVybCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5fbG9nKCdmZXRjaEFuZFN0b3JlOiBmb3IgJyArIHVybCk7XG4gICAgdGhpcy5fZmV0Y2hMb2NrW3VybF0gPSB0cnVlO1xuICAgIGdldFNtYXJ0Q2xpcXoodXJsKS50aGVuKChzbWFydENsaXF6KSA9PiB7XG4gICAgICAvLyBsaW1pdCBudW1iZXIgb2YgY2F0ZWdvcmllcy9saW5rc1xuICAgICAgaWYgKHNtYXJ0Q2xpcXouaGFzT3duUHJvcGVydHkoJ2RhdGEnKSkge1xuICAgICAgICBpZiAoc21hcnRDbGlxei5kYXRhLmhhc093blByb3BlcnR5KCdsaW5rcycpKSB7XG4gICAgICAgICAgc21hcnRDbGlxei5kYXRhLmxpbmtzID0gc21hcnRDbGlxei5kYXRhLmxpbmtzLnNsaWNlKDAsIE1BWF9JVEVNUyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNtYXJ0Q2xpcXouZGF0YS5oYXNPd25Qcm9wZXJ0eSgnY2F0ZWdvcmllcycpKSB7XG4gICAgICAgICAgc21hcnRDbGlxei5kYXRhLmNhdGVnb3JpZXMgPSBzbWFydENsaXF6LmRhdGEuY2F0ZWdvcmllcy5zbGljZSgwLCBNQVhfSVRFTVMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICB0aGlzLnN0b3JlKHNtYXJ0Q2xpcXopO1xuICAgICAgZGVsZXRlIHRoaXMuX2ZldGNoTG9ja1t1cmxdO1xuICAgIH0sIChlKSA9PiB7XG4gICAgICB0aGlzLl9sb2coJ2ZldGNoQW5kU3RvcmU6IGVycm9yIHdoaWxlIGZldGNoaW5nIGRhdGE6ICcgK1xuICAgICAgICAgICAgICAgICBlLnR5cGUgKyAnICcgKyBlLm1lc3NhZ2UpO1xuICAgICAgZGVsZXRlIHRoaXMuX2ZldGNoTG9ja1t1cmxdO1xuICAgIH0pO1xuICB9XG5cbiAgLyoqXG4gICogY3VzdG9taXplcyBTbWFydENsaXF6IGlmIG5ld3Mgb3IgZG9tYWluIHN1cHBvcnRlZCwgYW5kIHVzZXIgcHJlZmVyZW5jZSBpcyBzZXRcbiAgKiBAbWV0aG9kIHJldHJpZXZlXG4gICogQHBhcmFtIHVybFxuICAqIEByZXR1cm5zIFNtYXJ0Q2xpcXogZnJvbSBjYWNoZSAoZmFsc2UgaWYgbm90IGZvdW5kKVxuICAqL1xuICByZXRyaWV2ZSh1cmwpIHtcbiAgICBjb25zdCBzbWFydENsaXF6ID0gdGhpcy5fc21hcnRDbGlxekNhY2hlLnJldHJpZXZlKHVybCk7XG5cbiAgICBpZiAodGhpcy5pc0N1c3RvbWl6YXRpb25FbmFibGVkKCkgJiYgc21hcnRDbGlxeiAmJlxuICAgICAgdGhpcy5pc05ld3Moc21hcnRDbGlxeikpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuX2N1c3RvbWl6ZVNtYXJ0Q2xpcXooc21hcnRDbGlxeik7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRoaXMuX2xvZygncmV0cmlldmVDdXN0b21pemVkOiBlcnJvciB3aGlsZSBjdXN0b21pemluZyBkYXRhOiAnICsgZSk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIHNtYXJ0Q2xpcXo7XG4gIH1cblxuICAvKipcbiAgICogU2FtZSBhcyBgcmV0cmlldmVgLCBidXQgdHJpZ2dlcnMgYXN5bmNocm9ub3VzIGNhY2hlIHVwZGF0ZTpcbiAgICogZmV0Y2hlcyBTbWFydENsaXF6IChhZ2FpbikgaWYgbm90IHlldCBjYWNoZWQgb3IgaWYgc3RhbGUuIElmIFNtYXJ0Q2xpcXpcbiAgICogd2FzIG5vdCB5ZXQgY2FjaGVkIGBmYWxzZWAgaXMgcmV0dXJuZWQgYW5kIHVwZGF0ZSBpcyBpbml0aWF0ZWQuXG4gICAqIEBwYXJhbSB7U3RyaW5nfSB1cmwgLSBUaGUgU21hcnRDbGlxeiB0cmlnZ2VyIFVSTFxuICAgKiBAcmV0dXJuIHtTbWFydENsaXF6fSBUaGUgY2FjaGVkIFNtYXJ0Q2xpcXogb3IgZmFsc2UgaWYgbm90IHlldCBjYWNoZWQuXG4gICAqL1xuICByZXRyaWV2ZUFuZFVwZGF0ZSh1cmwpIHtcbiAgICBjb25zdCBzbWFydENsaXF6ID0gdGhpcy5yZXRyaWV2ZSh1cmwpO1xuXG4gICAgaWYgKHRoaXMuX3NtYXJ0Q2xpcXpDYWNoZS5pc1N0YWxlKHVybCkpIHtcbiAgICAgIHV0aWxzLnNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmZldGNoQW5kU3RvcmUodXJsKTtcbiAgICAgIH0uYmluZCh0aGlzKSwgMCk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHNtYXJ0Q2xpcXo7XG4gIH1cblxuICAvKipcbiAgKiBleHRyYWN0cyBkb21haW4gZnJvbSBTbWFydENsaXF6XG4gICogQG1ldGhvZCBnZXREb21haW5cbiAgKiBAcGFyYW0gc21hcnRDbGlxelxuICAqL1xuICBnZXREb21haW4oc21hcnRDbGlxeikge1xuICAgIC8vIFRPRE86IGRlZmluZSBvbmUgcGxhY2UgdG8gc3RvcmUgZG9tYWluXG4gICAgaWYgKHNtYXJ0Q2xpcXouZGF0YS5kb21haW4pIHtcbiAgICAgIHJldHVybiBzbWFydENsaXF6LmRhdGEuZG9tYWluO1xuICAgIH0gZWxzZSBpZiAoc21hcnRDbGlxei5kYXRhLnRyaWdnZXJfdXJscyAmJiBzbWFydENsaXF6LmRhdGEudHJpZ2dlcl91cmxzLmxlbmd0aCA+IDApIHtcbiAgICAgIHJldHVybiB1dGlscy5nZW5lcmFsaXplVXJsKHNtYXJ0Q2xpcXouZGF0YS50cmlnZ2VyX3VybHNbMF0pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICogZXh0cmFjdHMgaWQgZnJvbSBTbWFydENsaXF6XG4gICogQG1ldGhvZCBnZXRJZFxuICAqIEBwYXJhbSBzbWFydENsaXF6XG4gICovXG4gIGdldElkKHNtYXJ0Q2xpcXopIHtcbiAgICByZXR1cm4gc21hcnRDbGlxei5kYXRhLl9fc3ViVHlwZV9fLmlkO1xuICB9XG5cbiAgLyoqXG4gICogZXh0cmFjdHMgVVJMIGZyb20gU21hcnRDbGlxelxuICAqIEBtZXRob2QgZ2V0VXJsXG4gICogQHBhcmFtIHNtYXJ0Q2xpcXpcbiAgKi9cbiAgZ2V0VXJsKHNtYXJ0Q2xpcXopIHtcbiAgICByZXR1cm4gdXRpbHMuZ2VuZXJhbGl6ZVVybChzbWFydENsaXF6LnZhbCwgdHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgKiBleHRyYWN0cyB0aW1lc3RhbXAgZnJvbSBTbWFydENsaXF6XG4gICogQG1ldGhvZCBnZXRUaW1lc3RhbXBcbiAgKiBAcGFyYW0gc21hcnRDbGlxelxuICAqL1xuICBnZXRUaW1lc3RhbXAoc21hcnRDbGlxeikge1xuICAgIHJldHVybiBzbWFydENsaXF6LmRhdGEudHM7XG4gIH1cbiAgLyoqXG4gICogQG1ldGhvZCBpc05ld3NcbiAgKiBAcGFyYW0gc21hcnRDbGlxelxuICAqIHJldHVybnMgdHJ1ZSB0aGlzIGlzIGEgbmV3cyBTbWFydENsaXF6XG4gICovXG4gIGlzTmV3cyhzbWFydENsaXF6KSB7XG4gICAgcmV0dXJuICh0eXBlb2Ygc21hcnRDbGlxei5kYXRhLm5ld3MgIT09ICd1bmRlZmluZWQnKTtcbiAgfVxuXG4gIC8qKlxuICAqIEBtZXRob2QgaXNDdXN0b21pemF0aW9uRW5hYmxlZFxuICAqIEByZXR1cm5zIHRydWUgaWYgdGhlIHVzZXIgZW5hYmxlZCBjdXN0b21pemF0aW9uXG4gICovXG4gIGlzQ3VzdG9taXphdGlvbkVuYWJsZWQoKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGlzRW5hYmxlZCA9IHV0aWxzLmdldFByZWYoJ2VuYWJsZVNtYXJ0Q2xpcXpDdXN0b21pemF0aW9uJywgdW5kZWZpbmVkKTtcbiAgICAgIHJldHVybiBpc0VuYWJsZWQgPT09IHVuZGVmaW5lZCA/XG4gICAgICAgIHRoaXMuX2lzQ3VzdG9taXphdGlvbkVuYWJsZWRCeURlZmF1bHQgOiBpc0VuYWJsZWQ7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLl9pc0N1c3RvbWl6YXRpb25FbmFibGVkQnlEZWZhdWx0O1xuICAgIH1cbiAgfVxuXG4gIC8vIHJlLW9yZGVycyBjYXRlZ29yaWVzIGJhc2VkIG9uIHZpc2l0IGZyZXF1ZW5jeVxuICBfY3VzdG9taXplU21hcnRDbGlxeihzbWFydENsaXF6KSB7XG4gICAgY29uc3QgdXJsID0gdGhpcy5nZXRVcmwoc21hcnRDbGlxeik7XG4gICAgaWYgKHRoaXMuX2N1c3RvbURhdGFDYWNoZS5pc0NhY2hlZCh1cmwpKSB7XG4gICAgICB0aGlzLl9pbmplY3RDdXN0b21EYXRhKHNtYXJ0Q2xpcXosIHRoaXMuX2N1c3RvbURhdGFDYWNoZS5yZXRyaWV2ZSh1cmwpKTtcblxuICAgICAgaWYgKHRoaXMuX2N1c3RvbURhdGFDYWNoZS5pc1N0YWxlKHVybCkpIHtcbiAgICAgICAgdGhpcy5fbG9nKCdfY3VzdG9taXplU21hcnRDbGlxejogZm91bmQgc3RhbGUgZGF0YSBmb3IgJyArIHVybCk7XG4gICAgICAgIHRoaXMuX3ByZXBhcmVDdXN0b21EYXRhKHVybCk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuX2xvZygnX2N1c3RvbWl6ZVNtYXJ0Q2xpcXo6IGN1c3RvbSBkYXRhIG5vdCB5ZXQgcmVhZHkgZm9yICcgKyB1cmwpO1xuICAgIH1cbiAgfVxuXG4gIC8vIHJlcGxhY2VzIGFsbCBrZXlzIGZyb20gY3VzdG9tIGRhdGEgaW4gU21hcnRDbGlxeiBkYXRhXG4gIF9pbmplY3RDdXN0b21EYXRhKHNtYXJ0Q2xpcXosIGN1c3RvbURhdGEpIHtcbiAgICBjb25zdCB1cmwgPSB0aGlzLmdldFVybChzbWFydENsaXF6KTtcbiAgICB0aGlzLl9sb2coJ19pbmplY3RDdXN0b21EYXRhOiBpbmplY3RpbmcgZm9yICcgKyB1cmwpO1xuICAgIGZvciAobGV0IGtleSBpbiBjdXN0b21EYXRhKSB7XG4gICAgICBpZiAoY3VzdG9tRGF0YS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgIHNtYXJ0Q2xpcXouZGF0YVtrZXldID0gY3VzdG9tRGF0YVtrZXldO1xuICAgICAgICB0aGlzLl9sb2coJ19pbmplY3RDdXN0b21EYXRhOiBpbmplY3Rpbmcga2V5ICcgKyBrZXkpO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl9sb2coJ19pbmplY3RDdXN0b21EYXRhOiBkb25lIGluamVjdGluZyBmb3IgJyArIHVybCk7XG4gIH1cblxuICAvLyBwcmVwYXJlcyBhbmQgc3RvcmVzIGN1c3RvbSBkYXRhIGZvciBTbWFydENsaXF6IHdpdGggZ2l2ZW4gVVJMIChhc3luYy4pLFxuICAvLyAoaWYgY3VzdG9tIGRhdGEgaGFzIG5vdCBiZWVuIHByZXBhcmVkIGJlZm9yZSBhbmQgaGFzIG5vdCBleHBpcmVkKVxuICBfcHJlcGFyZUN1c3RvbURhdGEodXJsKSB7XG4gICAgaWYgKHRoaXMuX2N1c3RvbURhdGFDYWNoZS5pc1N0YWxlKHVybCkpIHtcbiAgICAgIC8vIHVwZGF0ZSB0aW1lIHNvIHRoYXQgdGhpcyBtZXRob2QgaXMgbm90IGV4ZWN1dGVkIG11bHRpcGxlXG4gICAgICAvLyB0aW1lcyB3aGlsZSBub3QgeWV0IGZpbmlzaGVkIChydW5zIGFzeW5jaHJvbm91c2x5KVxuICAgICAgdGhpcy5fY3VzdG9tRGF0YUNhY2hlLnJlZnJlc2godXJsKTtcbiAgICAgIHRoaXMuX2xvZygnX3ByZXBhcmVDdXN0b21EYXRhOiBwcmVwYXJpbmcgZm9yICcgKyB1cmwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLl9sb2coJ19wcmVwYXJlQ3VzdG9tRGF0YTogYWxyZWFkeSB1cGRhdGVkIG9yIGluIHVwZGF0ZSBwcm9ncmVzcyAnICsgdXJsKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBmb3Igc3RhdHNcbiAgICBjb25zdCBvbGRDdXN0b21EYXRhID0gdGhpcy5fY3VzdG9tRGF0YUNhY2hlLnJldHJpZXZlKHVybCk7XG5cbiAgICAvLyAoMSkgZmV0Y2ggdGVtcGxhdGUgZnJvbSByaWNoIGhlYWRlclxuICAgIGdldFNtYXJ0Q2xpcXoodXJsKVxuICAgICAgLnRoZW4oKHNtYXJ0Q2xpcXopID0+IHtcbiAgICAgICAgY29uc3QgZG9tYWluID0gdGhpcy5nZXREb21haW4oc21hcnRDbGlxeik7XG4gICAgICAgIHJldHVybiBQcm9taXNlLmFsbChbUHJvbWlzZS5yZXNvbHZlKHNtYXJ0Q2xpcXopLCB0aGlzLl9mZXRjaFZpc2l0ZWRVcmxzKGRvbWFpbildKTtcbiAgICAgIH0pXG4gICAgICAvLyAoMikgZmV0Y2ggaGlzdG9yeSBmb3IgU21hcnRDbGlxeiBkb21haW5cbiAgICAgIC50aGVuKChbc21hcnRDbGlxeiwgdXJsc10pID0+IHtcbiAgICAgICAgLy8gbm93LCAoMykgcmUtb3JkZXIgdGVtcGxhdGUgY2F0ZWdvcmllcyBiYXNlZCBvbiBoaXN0b3J5XG4gICAgICAgIGNvbnN0IGRvbWFpbiA9IHRoaXMuZ2V0RG9tYWluKHNtYXJ0Q2xpcXopO1xuXG4gICAgICAgIC8vIFRPRE86IGRlZmluZSBwZXIgU21hcnRDbGlxeiB3aGF0IHRoZSBkYXRhIGZpZWxkIHRvIGJlIGN1c3RvbWl6ZWQgaXMgY2FsbGVkXG4gICAgICAgIGlmICghdGhpcy5pc05ld3Moc21hcnRDbGlxeikpIHtcbiAgICAgICAgICBzbWFydENsaXF6LmRhdGEuY2F0ZWdvcmllcyA9IHNtYXJ0Q2xpcXouZGF0YS5saW5rcztcbiAgICAgICAgfVxuXG4gICAgICAgIGxldCBjYXRlZ29yaWVzID0gc21hcnRDbGlxei5kYXRhLmNhdGVnb3JpZXMuc2xpY2UoKTtcblxuICAgICAgICAvLyBhZGQgc29tZSBpbmZvcm1hdGlvbiB0byBmYWNpbGl0YXRlIHJlLW9yZGVyaW5nXG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgY2F0ZWdvcmllcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNhdGVnb3JpZXNbal0uZ2VuVXJsID0gdXRpbHMuZ2VuZXJhbGl6ZVVybChjYXRlZ29yaWVzW2pdLnVybCk7XG4gICAgICAgICAgY2F0ZWdvcmllc1tqXS5tYXRjaENvdW50ID0gMDtcbiAgICAgICAgICBjYXRlZ29yaWVzW2pdLm9yaWdpbmFsT3JkZXIgPSBqO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY291bnQgY2F0ZWdvcnktdmlzaXQgbWF0Y2hlcyAodmlzaXQgdXJsIGNvbnRhaW5zIGNhdGVnb3J5IHVybClcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB1cmxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgY29uc3QgdXJsID0gdXRpbHMuZ2VuZXJhbGl6ZVVybCh1cmxzW2ldKTtcbiAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNhdGVnb3JpZXMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLl9pc01hdGNoKHVybCwgY2F0ZWdvcmllc1tqXS5nZW5VcmwpKSB7XG4gICAgICAgICAgICAgIGNhdGVnb3JpZXNbal0ubWF0Y2hDb3VudCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHJlLW9yZGVyIGJ5IG1hdGNoIGNvdW50OyBvbiB0aWUgdXNlIG9yaWdpbmFsIG9yZGVyXG4gICAgICAgIGNhdGVnb3JpZXMuc29ydChmdW5jdGlvbiBjb21wYXJlKGEsIGIpIHtcbiAgICAgICAgICBpZiAoYS5tYXRjaENvdW50ICE9PSBiLm1hdGNoQ291bnQpIHtcbiAgICAgICAgICAgICAgcmV0dXJuIGIubWF0Y2hDb3VudCAtIGEubWF0Y2hDb3VudDsgLy8gZGVzY2VuZGluZ1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJldHVybiBhLm9yaWdpbmFsT3JkZXIgLSBiLm9yaWdpbmFsT3JkZXI7IC8vIGFzY2VuZGluZ1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgY2F0ZWdvcmllcyA9IGNhdGVnb3JpZXMuc2xpY2UoMCwgTUFYX0lURU1TKTtcblxuICAgICAgICBsZXQgb2xkQ2F0ZWdvcmllcyA9IG9sZEN1c3RvbURhdGEgP1xuICAgICAgICAgIC8vIHByZXZpb3VzIGN1c3RvbWl6YXRpb246IHVzZSBlaXRoZXIgY2F0ZWdvcmllcyAobmV3cykgb3IgbGlua3MgKG90aGVyIFNtYXJ0Q2xpcXopXG4gICAgICAgICAgKHRoaXMuaXNOZXdzKHNtYXJ0Q2xpcXopID8gb2xkQ3VzdG9tRGF0YS5jYXRlZ29yaWVzIDogb2xkQ3VzdG9tRGF0YS5saW5rcykgOlxuICAgICAgICAgIC8vIG5vIHByZXZpb3VzIGN1c3RvbWl6YXRpb246IHVzZSBkZWZhdWx0IG9yZGVyXG4gICAgICAgICAgc21hcnRDbGlxei5kYXRhLmNhdGVnb3JpZXM7XG5cbiAgICAgICAgLy8gc2VuZCBzb21lIHN0YXRzXG4gICAgICAgIHRoaXMuX3NlbmRTdGF0cyhvbGRDYXRlZ29yaWVzLCBjYXRlZ29yaWVzLCBvbGRDdXN0b21EYXRhID8gdHJ1ZSA6IGZhbHNlLCB1cmxzKTtcblxuICAgICAgICAvLyBUT0RPOiBkZWZpbmUgcGVyIFNtYXJ0Q2xpcXogd2hhdCB0aGUgZGF0YSBmaWVsZCB0byBiZSBjdXN0b21pemVkIGlzIGNhbGxlZFxuICAgICAgICBpZiAodGhpcy5pc05ld3Moc21hcnRDbGlxeikpIHtcbiAgICAgICAgICB0aGlzLl9jdXN0b21EYXRhQ2FjaGUuc3RvcmUodXJsLCB7IGNhdGVnb3JpZXM6IGNhdGVnb3JpZXMgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5fY3VzdG9tRGF0YUNhY2hlLnN0b3JlKHVybCwgeyBsaW5rczogY2F0ZWdvcmllcyB9KTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX2xvZygnX3ByZXBhcmVDdXN0b21EYXRhOiBkb25lIHByZXBhcmluZyBmb3IgJyArIHVybCk7XG4gICAgICAgIHRoaXMuX2N1c3RvbURhdGFDYWNoZS5zYXZlKENVU1RPTV9EQVRBX0NBQ0hFX0ZJTEUpO1xuICAgICAgfSlcbiAgICAgIC5jYXRjaChlID0+IHRoaXMuX2xvZygnX3ByZXBhcmVDdXN0b21EYXRhOiBlcnJvciB3aGlsZSBmZXRjaGluZyBkYXRhOiAnICsgZS5tZXNzYWdlKSk7XG4gIH1cblxuICAvLyBjaGVja3MgaWYgVVJMIGZyb20gaGlzdG9yeSBtYXRjaGVzIGEgY2F0ZWdvcnkgVVJMXG4gIF9pc01hdGNoKGhpc3RvcnlVcmwsIGNhdGVnb3J5VXJsKSB7XG4gICAgLy8gVE9ETzogY2hlY2sgZm9yIHN1YmNhdGVnb3JpZXMsIGZvciBleGFtcGxlLFxuICAgIC8vICAgICAgIFNwaWVnZWwgJ1NvemlhbGVzJyBoYXMgVVJMICd3aXJ0c2NoYWZ0L3NvemlhbGVzJyxcbiAgICAvLyAgICAgdGh1cyBzdWNoIGVudHJpZXMgYXJlIGNvdW50ZWQgdHdpY2UsIGZvciAnU296aWFsZXonLFxuICAgIC8vICAgICBidXQgYWxzbyBmb3IgJ1dpcnRzY2hhZnQnXG4gICAgcmV0dXJuIGhpc3RvcnlVcmwuaW5kZXhPZihjYXRlZ29yeVVybCkgPiAtMTtcbiAgfVxuXG4gIC8vIGZyb20gaGlzdG9yeSwgZmV0Y2hlcyBhbGwgdmlzaXRzIHRvIGdpdmVuIGRvbWFpbiB3aXRoaW4gMzAgZGF5cyBmcm9tIG5vdyAoYXN5bmMuKVxuICBfZmV0Y2hWaXNpdGVkVXJscyhkb21haW4pIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgdGhpcy5fbG9nKCdfZmV0Y2hWaXNpdGVkVXJsczogc3RhcnQgZmV0Y2hpbmcgZm9yIGRvbWFpbiAnICsgZG9tYWluKTtcbiAgICAgIC8vIFRPRE86IG1ha2UgY3Jvc3MgcGxhdGZvcm1cbiAgICAgIGNvbnN0IGhpc3RvcnlTZXJ2aWNlID0gQ29tcG9uZW50c1xuICAgICAgICAuY2xhc3Nlc1snQG1vemlsbGEub3JnL2Jyb3dzZXIvbmF2LWhpc3Rvcnktc2VydmljZTsxJ11cbiAgICAgICAgLmdldFNlcnZpY2UoQ29tcG9uZW50cy5pbnRlcmZhY2VzLm5zSU5hdkhpc3RvcnlTZXJ2aWNlKTtcblxuICAgICAgaWYgKCFoaXN0b3J5U2VydmljZSkge1xuICAgICAgICByZWplY3QoJ19mZXRjaFZpc2l0ZWRVcmxzOiBoaXN0b3J5IHNlcnZpY2Ugbm90IGF2YWlsYWJsZScpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IGhpc3RvcnlTZXJ2aWNlLmdldE5ld1F1ZXJ5T3B0aW9ucygpO1xuICAgICAgICBjb25zdCBxdWVyeSA9IGhpc3RvcnlTZXJ2aWNlLmdldE5ld1F1ZXJ5KCk7XG4gICAgICAgIHF1ZXJ5LmRvbWFpbiA9IGRvbWFpbjtcbiAgICAgICAgLy8gMzAgZGF5cyBmcm9tIG5vd1xuICAgICAgICBxdWVyeS5iZWdpblRpbWVSZWZlcmVuY2UgPSBxdWVyeS5USU1FX1JFTEFUSVZFX05PVztcbiAgICAgICAgcXVlcnkuYmVnaW5UaW1lID0gLTEgKiAzMCAqIDI0ICogNjAgKiA2MCAqIDEwMDAwMDA7XG4gICAgICAgIHF1ZXJ5LmVuZFRpbWVSZWZlcmVuY2UgPSBxdWVyeS5USU1FX1JFTEFUSVZFX05PVztcbiAgICAgICAgcXVlcnkuZW5kVGltZSA9IDA7XG5cbiAgICAgICAgY29uc3QgcmVzdWx0ID0gaGlzdG9yeVNlcnZpY2UuZXhlY3V0ZVF1ZXJ5KHF1ZXJ5LCBvcHRpb25zKTtcbiAgICAgICAgY29uc3QgY29udGFpbmVyID0gcmVzdWx0LnJvb3Q7XG4gICAgICAgIGNvbnRhaW5lci5jb250YWluZXJPcGVuID0gdHJ1ZTtcblxuICAgICAgICBsZXQgdXJscyA9IFtdO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGNvbnRhaW5lci5jaGlsZENvdW50OyBpICsrKSB7XG4gICAgICAgICAgdXJsc1tpXSA9IGNvbnRhaW5lci5nZXRDaGlsZChpKS51cmk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLl9sb2coXG4gICAgICAgICAgICAnX2ZldGNoVmlzaXRlZFVybHM6IGRvbmUgZmV0Y2hpbmcgJyArICB1cmxzLmxlbmd0aCArXG4gICAgICAgICAgICAnIFVSTHMgZm9yIGRvbWFpbiAnICsgZG9tYWluKTtcbiAgICAgICAgcmVzb2x2ZSh1cmxzKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG4gIF9zZW5kU3RhdHMob2xkQ2F0ZWdvcmllcywgbmV3Q2F0ZWdvcmllcywgaXNSZXBlYXRlZEN1c3RvbWl6YXRpb24sIHVybHMpIHtcbiAgICBjb25zdCBzdGF0cyA9IHtcbiAgICAgIHR5cGU6ICdhY3Rpdml0eScsXG4gICAgICBhY3Rpb246ICdzbWFydF9jbGlxel9jdXN0b21pemF0aW9uJyxcbiAgICAgIC8vIFNtYXJ0Q2xpcXogaWRcbiAgICAgIGlkOiAnbmEnLFxuICAgICAgLy8gdG90YWwgbnVtYmVyIG9mIFVSTHMgcmV0cmlldmVkIGZyb20gaGlzdG9yeVxuICAgICAgdXJsQ2FuZGlkYXRlQ291bnQ6IHVybHMubGVuZ3RoLFxuICAgICAgLy8gbnVtYmVyIG9mIFVSTHMgdGhhdCBwcm9kdWNlZCBhIG1hdGNoIHdpdGhpbiBzaG93biBjYXRlZ29yaWVzIChjdXJyZW50bHkgNSlcbiAgICAgIHVybE1hdGNoQ291bnQ6IDAsXG4gICAgICAvLyBhdmVyYWdlIG51bWJlciBvZiBVUkwgbWF0Y2hlcyBhY3Jvc3Mgc2hvd24gY2F0ZWdvcmllc1xuICAgICAgdXJsTWF0Y2hDb3VudEF2ZzogMCxcbiAgICAgIC8vIHN0YW5kYXJkIGRldmlhdGlvbiBvZiBVUkwgbWF0Y2hlcyBhY3Jvc3Mgc2hvd24gY2F0ZWdvcmllc1xuICAgICAgdXJsTWF0Y2hDb3VudFNkOiAwLFxuICAgICAgLy8gbnVtYmVyIG9mIGNhdGVnb3JpZXMgdGhhdCBjaGFuZ2VkIChwZXIgcG9zaXRpb247IHN3YXAgY291bnRzIHR3aWNlKVxuICAgICAgY2F0ZWdvcmllc1Bvc0NoYW5nZUNvdW50OiAwLFxuICAgICAgLy8gbnVtYmVyIG9mIGNhdGVnb3JpZXMga2VwdCBhZnRlciByZS1vcmRlcmluZyAocG9zaXRpb25zIG1pZ2h0IGNoYW5nZSlcbiAgICAgIGNhdGVnb3JpZXNLZXB0Q291bnQ6IDAsXG4gICAgICAvLyBhdmVyYWdlIHBvc2l0aW9uIGNoYW5nZSBvZiBhIGtlcHQgY2F0ZWdvcmllc1xuICAgICAgY2F0ZWdvcmllc0tlcHRQb3NDaGFuZ2VBdmc6IDAsXG4gICAgICAvLyB0cnVlLCBpZiB0aGlzIGN1c3RvbWl6YXRpb24gaXMgYSByZS1jdXN0b21pemF0aW9uXG4gICAgICBpc1JlcGVhdGVkQ3VzdG9taXphdGlvbjogaXNSZXBlYXRlZEN1c3RvbWl6YXRpb25cbiAgICB9O1xuXG4gICAgbGV0IG9sZFBvc2l0aW9ucyA9IHsgfTtcbiAgICBjb25zdCBsZW5ndGggPSBNYXRoLm1pbihvbGRDYXRlZ29yaWVzLmxlbmd0aCwgbmV3Q2F0ZWdvcmllcy5sZW5ndGgpO1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgc3RhdHMudXJsTWF0Y2hDb3VudCArPSBuZXdDYXRlZ29yaWVzW2ldLm1hdGNoQ291bnQ7XG4gICAgICBvbGRQb3NpdGlvbnNbb2xkQ2F0ZWdvcmllc1tpXS50aXRsZV0gPSBpO1xuXG4gICAgICBpZiAobmV3Q2F0ZWdvcmllc1tpXS50aXRsZSAhPT0gb2xkQ2F0ZWdvcmllc1tpXS50aXRsZSkge1xuICAgICAgICBzdGF0cy5jYXRlZ29yaWVzUG9zQ2hhbmdlQ291bnQrKztcbiAgICAgIH1cbiAgICB9XG4gICAgc3RhdHMudXJsTWF0Y2hDb3VudEF2ZyA9IHN0YXRzLnVybE1hdGNoQ291bnQgLyBsZW5ndGg7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBzdGF0cy51cmxNYXRjaENvdW50U2QgKz1cbiAgICAgICAgTWF0aC5wb3coc3RhdHMudXJsTWF0Y2hDb3VudEF2ZyAtIG5ld0NhdGVnb3JpZXNbaV0ubWF0Y2hDb3VudCwgMik7XG4gICAgfVxuICAgIHN0YXRzLnVybE1hdGNoQ291bnRTZCAvPSBsZW5ndGg7XG4gICAgc3RhdHMudXJsTWF0Y2hDb3VudFNkID0gTWF0aC5zcXJ0KHN0YXRzLnVybE1hdGNoQ291bnRTZCk7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAob2xkUG9zaXRpb25zLmhhc093blByb3BlcnR5KG5ld0NhdGVnb3JpZXNbaV0udGl0bGUpKSB7XG4gICAgICAgIHN0YXRzLmNhdGVnb3JpZXNLZXB0Q291bnQrKztcbiAgICAgICAgc3RhdHMuY2F0ZWdvcmllc0tlcHRQb3NDaGFuZ2VBdmcgKz1cbiAgICAgICAgICBNYXRoLmFicyhpIC0gb2xkUG9zaXRpb25zW25ld0NhdGVnb3JpZXNbaV0udGl0bGVdKTtcblxuICAgICAgfVxuICAgIH1cbiAgICBzdGF0cy5jYXRlZ29yaWVzS2VwdFBvc0NoYW5nZUF2ZyAvPSBzdGF0cy5jYXRlZ29yaWVzS2VwdENvdW50O1xuXG4gICAgdXRpbHMudGVsZW1ldHJ5KHN0YXRzKTtcbiAgfVxuXG4gIC8vIGxvZyBoZWxwZXJcbiAgX2xvZyhtc2cpIHtcbiAgICB1dGlscy5sb2cobXNnLCAnc21hcnQtY2xpcXotY2FjaGUnKTtcbiAgfVxuXG4gIHVubG9hZCgpIHtcbiAgfVxufVxuIl19