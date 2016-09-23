System.register('adblocker/adblocker', ['core/cliqz', 'core/webrequest', 'antitracking/url', 'antitracking/domain', 'platform/browser', 'antitracking/persistent-state', 'antitracking/fixed-size-cache', 'antitracking/webrequest-context', 'adblocker/utils', 'adblocker/filters-engine', 'adblocker/filters-loader', 'adblocker/adb-stats'], function (_export) {

  // adb version
  'use strict';

  var utils, events, WebRequest, URLInfo, getGeneralDomain, browser, LazyPersistentObject, LRUCache, HttpRequestContext, log, FilterEngine, FiltersLoader, AdbStats, ADB_VER, ADB_PREF, ADB_PREF_OPTIMIZED, ADB_ABTEST_PREF, ADB_PREF_VALUES, ADB_DEFAULT_VALUE, CliqzHumanWeb, AdBlocker, CliqzADB;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  _export('autoBlockAds', autoBlockAds);

  _export('adbABTestEnabled', adbABTestEnabled);

  _export('adbEnabled', adbEnabled);

  function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function autoBlockAds() {
    return true;
  }

  function adbABTestEnabled() {
    return CliqzUtils.getPref(ADB_ABTEST_PREF, false);
  }

  function adbEnabled() {
    // TODO: Deal with 'optimized' mode.
    // 0 = Disabled
    // 1 = Enabled
    return adbABTestEnabled() && CliqzUtils.getPref(ADB_PREF, ADB_PREF_VALUES.Disabled) !== 0;
  }

  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
      events = _coreCliqz.events;
    }, function (_coreWebrequest) {
      WebRequest = _coreWebrequest['default'];
    }, function (_antitrackingUrl) {
      URLInfo = _antitrackingUrl.URLInfo;
    }, function (_antitrackingDomain) {
      getGeneralDomain = _antitrackingDomain.getGeneralDomain;
    }, function (_platformBrowser) {
      browser = _platformBrowser;
    }, function (_antitrackingPersistentState) {
      LazyPersistentObject = _antitrackingPersistentState.LazyPersistentObject;
    }, function (_antitrackingFixedSizeCache) {
      LRUCache = _antitrackingFixedSizeCache['default'];
    }, function (_antitrackingWebrequestContext) {
      HttpRequestContext = _antitrackingWebrequestContext['default'];
    }, function (_adblockerUtils) {
      log = _adblockerUtils.log;
    }, function (_adblockerFiltersEngine) {
      FilterEngine = _adblockerFiltersEngine['default'];
    }, function (_adblockerFiltersLoader) {
      FiltersLoader = _adblockerFiltersLoader['default'];
    }, function (_adblockerAdbStats) {
      AdbStats = _adblockerAdbStats['default'];
    }],
    execute: function () {
      ADB_VER = 0.01;

      _export('ADB_VER', ADB_VER);

      // Preferences
      ADB_PREF = 'cliqz-adb';

      _export('ADB_PREF', ADB_PREF);

      ADB_PREF_OPTIMIZED = 'cliqz-adb-optimized';

      _export('ADB_PREF_OPTIMIZED', ADB_PREF_OPTIMIZED);

      ADB_ABTEST_PREF = 'cliqz-adb-abtest';

      _export('ADB_ABTEST_PREF', ADB_ABTEST_PREF);

      ADB_PREF_VALUES = {
        Enabled: 1,
        Disabled: 0
      };

      _export('ADB_PREF_VALUES', ADB_PREF_VALUES);

      ADB_DEFAULT_VALUE = ADB_PREF_VALUES.Disabled;

      _export('ADB_DEFAULT_VALUE', ADB_DEFAULT_VALUE);

      CliqzHumanWeb = null;

      /* Wraps filter-based adblocking in a class. It has to handle both
       * the management of lists (fetching, updating) using a FiltersLoader
       * and the matching using a FilterEngine.
       */

      AdBlocker = (function () {
        function AdBlocker() {
          var _this = this;

          _classCallCheck(this, AdBlocker);

          this.engine = new FilterEngine();

          this.listsManager = new FiltersLoader();
          this.listsManager.onUpdate(function (update) {
            // Update list in engine
            var asset = update.asset;
            var filters = update.filters;
            var isFiltersList = update.isFiltersList;

            if (isFiltersList) {
              _this.engine.onUpdateFilters(asset, filters);
            } else {
              _this.engine.onUpdateResource(asset, filters);
            }
            _this.initCache();
          });

          // Blacklists to disable adblocking on certain domains/urls
          this.blacklist = new Set();
          this.blacklistPersist = new LazyPersistentObject('adb-blacklist');

          // load human-web if available (for blocklist annotations)
          System['import']('human-web/human-web').then(function (mod) {
            CliqzHumanWeb = mod['default'];
          })['catch'](function () {
            CliqzHumanWeb = null;
          });
          // Is the adblocker initialized
          this.initialized = false;
        }

        _createClass(AdBlocker, [{
          key: 'initCache',
          value: function initCache() {
            // To make sure we don't break any filter behavior, each key in the LRU
            // cache is made up of { source general domain } + { url }.
            // This is because some filters will behave differently based on the
            // domain of the source.

            // Cache queries to FilterEngine
            this.cache = new LRUCache(this.engine.match.bind(this.engine), // Compute result
            1000, // Maximum number of entries
            function (request) {
              return request.sourceGD + request.url;
            } // Select key
            );
          }
        }, {
          key: 'init',
          value: function init() {
            var _this2 = this;

            this.initCache();
            this.listsManager.load();
            this.blacklistPersist.load().then(function (value) {
              // Set value
              if (value.urls !== undefined) {
                _this2.blacklist = new Set(value.urls);
              }
            });
            this.initialized = true;
          }
        }, {
          key: 'persistBlacklist',
          value: function persistBlacklist() {
            this.blacklistPersist.setValue({ urls: [].concat(_toConsumableArray(this.blacklist.values())) });
          }
        }, {
          key: 'addToBlacklist',
          value: function addToBlacklist(url) {
            this.blacklist.add(url);
            this.persistBlacklist();
          }
        }, {
          key: 'removeFromBlacklist',
          value: function removeFromBlacklist(url) {
            this.blacklist['delete'](url);
            this.persistBlacklist();
          }
        }, {
          key: 'isInBlacklist',
          value: function isInBlacklist(request) {
            return this.blacklist.has(request.sourceURL) || this.blacklist.has(request.sourceGD);
          }
        }, {
          key: 'isDomainInBlacklist',
          value: function isDomainInBlacklist(url) {
            // Should all this domain stuff be extracted into a function?
            // Why is CliqzUtils.detDetailsFromUrl not used?
            var urlParts = URLInfo.get(url);
            var hostname = urlParts.hostname || url;
            if (hostname.startsWith('www.')) {
              hostname = hostname.substring(4);
            }

            return this.blacklist.has(hostname);
          }
        }, {
          key: 'isUrlInBlacklist',
          value: function isUrlInBlacklist(url) {
            return this.blacklist.has(url);
          }
        }, {
          key: 'logActionHW',
          value: function logActionHW(url, action, domain) {
            var type = 'url';
            if (domain) {
              type = 'domain';
            }
            if (!CliqzHumanWeb.state.v[url].adblocker_blacklist) {
              CliqzHumanWeb.state.v[url].adblocker_blacklist = {};
            }
            CliqzHumanWeb.state.v[url].adblocker_blacklist[action] = type;
          }
        }, {
          key: 'toggleUrl',
          value: function toggleUrl(url, domain) {
            var processedURL = url;
            if (domain) {
              // Should all this domain stuff be extracted into a function?
              // Why is CliqzUtils.getDetailsFromUrl not used?
              processedURL = URLInfo.get(url).hostname;
              if (processedURL.startsWith('www.')) {
                processedURL = processedURL.substring(4);
              }
            }

            var existHW = CliqzHumanWeb && CliqzHumanWeb.state.v[url];
            if (this.blacklist.has(processedURL)) {
              this.blacklist['delete'](processedURL);
              // TODO: It's better to have an API from humanweb to indicate if a url is private
              if (existHW) {
                this.logActionHW(url, 'remove', domain);
              }
            } else {
              this.blacklist.add(processedURL);
              if (existHW) {
                this.logActionHW(url, 'add', domain);
              }
            }

            this.persistBlacklist();
          }

          /* @param {webrequest-context} httpContext - Context of the request
           */
        }, {
          key: 'match',
          value: function match(httpContext) {
            // Check if the adblocker is initialized
            if (!this.initialized) {
              return false;
            }

            // Process endpoint URL
            var url = httpContext.url.toLowerCase();
            var urlParts = URLInfo.get(url);
            var hostname = urlParts.hostname;
            if (hostname.startsWith('www.')) {
              hostname = hostname.substring(4);
            }
            var hostGD = getGeneralDomain(hostname);

            // Process source url
            var sourceURL = httpContext.getSourceURL().toLowerCase();
            var sourceParts = URLInfo.get(sourceURL);
            var sourceHostname = sourceParts.hostname;
            if (sourceHostname.startsWith('www.')) {
              sourceHostname = sourceHostname.substring(4);
            }
            var sourceGD = getGeneralDomain(sourceHostname);

            // Wrap informations needed to match the request
            var request = {
              // Request
              url: url,
              cpt: httpContext.getContentPolicyType(),
              // Source
              sourceURL: sourceURL,
              sourceHostname: sourceHostname,
              sourceGD: sourceGD,
              // Endpoint
              hostname: hostname,
              hostGD: hostGD
            };

            log('match ' + JSON.stringify(request));

            var t0 = Date.now();
            var isAd = this.isInBlacklist(request) ? false : this.cache.get(request);
            var totalTime = Date.now() - t0;

            log('BLOCK AD ' + JSON.stringify({
              timeAdFilter: totalTime,
              isAdFilter: isAd,
              context: {
                url: httpContext.url,
                source: httpContext.getSourceURL(),
                cpt: httpContext.getContentPolicyType(),
                method: httpContext.method
              }
            }));

            return isAd;
          }
        }]);

        return AdBlocker;
      })();

      CliqzADB = {
        adblockInitialized: false,
        adbMem: {},
        adbStats: new AdbStats(),
        mutationLogger: null,
        adbDebug: false,
        MIN_BROWSER_VERSION: 35,
        timers: [],

        init: function init() {
          // Set `cliqz-adb` default to 'Disabled'
          if (CliqzUtils.getPref(ADB_PREF, undefined) === undefined) {
            CliqzUtils.setPref(ADB_PREF, ADB_PREF_VALUES.Disabled);
          }

          CliqzADB.adBlocker = new AdBlocker();

          var initAdBlocker = function initAdBlocker() {
            CliqzADB.adBlocker.init();
            CliqzADB.adblockInitialized = true;
            CliqzADB.initPacemaker();
            WebRequest.onBeforeRequest.addListener(CliqzADB.httpopenObserver.observe, undefined, ['blocking']);
          };

          if (adbEnabled()) {
            initAdBlocker();
          } else {
            events.sub('prefchange', function (pref) {
              if ((pref === ADB_PREF || pref === ADB_ABTEST_PREF) && !CliqzADB.adblockInitialized && adbEnabled()) {
                initAdBlocker();
              }
            });
          }
        },

        unload: function unload() {
          CliqzADB.unloadPacemaker();
          browser.forEachWindow(CliqzADB.unloadWindow);
          WebRequest.onBeforeRequest.removeListener(CliqzADB.httpopenObserver.observe);
        },

        initWindow: function initWindow() /* window */{},

        unloadWindow: function unloadWindow() /* window */{},

        initPacemaker: function initPacemaker() {
          var t1 = utils.setInterval(function () {
            CliqzADB.adbStats.clearStats();
          }, 10 * 60 * 1000);
          CliqzADB.timers.push(t1);

          var t2 = utils.setInterval(function () {
            if (!CliqzADB.cacheADB) {
              return;
            }
            Object.keys(CliqzADB.cacheADB).forEach(function (t) {
              if (!browser.isWindowActive(t)) {
                delete CliqzADB.cacheADB[t];
              }
            });
          }, 10 * 60 * 1000);
          CliqzADB.timers.push(t2);
        },

        unloadPacemaker: function unloadPacemaker() {
          CliqzADB.timers.forEach(utils.clearTimeout);
        },

        httpopenObserver: {
          observe: function observe(requestDetails) {
            if (!adbEnabled()) {
              return {};
            }

            var requestContext = new HttpRequestContext(requestDetails);
            var url = requestContext.url;

            if (!url) {
              return {};
            }

            if (requestContext.isFullPage()) {
              CliqzADB.adbStats.addNewPage(url);
            }

            var sourceUrl = requestContext.getLoadingDocument();

            if (!sourceUrl || sourceUrl.startsWith('about:')) {
              return {};
            }

            if (adbEnabled() && CliqzADB.adBlocker.match(requestContext)) {
              CliqzADB.adbStats.addBlockedUrl(sourceUrl, url);
              return { cancel: true };
            }

            return {};
          }
        },
        getBrowserMajorVersion: function getBrowserMajorVersion() {
          try {
            var appInfo = Components.classes['@mozilla.org/xre/app-info;1'].getService(Components.interfaces.nsIXULAppInfo);
            return parseInt(appInfo.version.split('.')[0], 10);
          } catch (e) {
            return 100;
          }
        },
        isTabURL: function isTabURL(url) {
          try {
            var wm = Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator);
            var browserEnumerator = wm.getEnumerator('navigator:browser');

            while (browserEnumerator.hasMoreElements()) {
              var browserWin = browserEnumerator.getNext();
              var tabbrowser = browserWin.gBrowser;

              var numTabs = tabbrowser.browsers.length;
              for (var index = 0; index < numTabs; index++) {
                var currentBrowser = tabbrowser.getBrowserAtIndex(index);
                if (currentBrowser) {
                  var tabURL = currentBrowser.currentURI.spec;
                  if (url === tabURL || url === tabURL.split('#')[0]) {
                    return true;
                  }
                }
              }
            }
            return false;
          } catch (e) {
            return false;
          }
        }
      };

      _export('default', CliqzADB);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFkYmxvY2tlci9hZGJsb2NrZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7cUtBaUJhLE9BQU8sRUFHUCxRQUFRLEVBQ1Isa0JBQWtCLEVBQ2xCLGVBQWUsRUFDZixlQUFlLEVBSWYsaUJBQWlCLEVBb0IxQixhQUFhLEVBTVgsU0FBUyxFQStMVCxRQUFROzs7Ozs7Ozs7Ozs7OztBQXROUCxXQUFTLFlBQVksR0FBRztBQUM3QixXQUFPLElBQUksQ0FBQztHQUNiOztBQUdNLFdBQVMsZ0JBQWdCLEdBQUc7QUFDakMsV0FBTyxVQUFVLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztHQUNuRDs7QUFHTSxXQUFTLFVBQVUsR0FBRzs7OztBQUkzQixXQUFPLGdCQUFnQixFQUFFLElBQUksVUFBVSxDQUFDLE9BQU8sQ0FBQyxRQUFRLEVBQUUsZUFBZSxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsQ0FBQztHQUMzRjs7Ozt5QkE3Q1EsS0FBSzswQkFBRSxNQUFNOzs7O2lDQUdiLE9BQU87OzZDQUNQLGdCQUFnQjs7OzswREFHaEIsb0JBQW9COzs7Ozs7NEJBSXBCLEdBQUc7Ozs7Ozs7OztBQU1DLGFBQU8sR0FBRyxJQUFJOzs7OztBQUdkLGNBQVEsR0FBRyxXQUFXOzs7O0FBQ3RCLHdCQUFrQixHQUFHLHFCQUFxQjs7OztBQUMxQyxxQkFBZSxHQUFHLGtCQUFrQjs7OztBQUNwQyxxQkFBZSxHQUFHO0FBQzdCLGVBQU8sRUFBRSxDQUFDO0FBQ1YsZ0JBQVEsRUFBRSxDQUFDO09BQ1o7Ozs7QUFDWSx1QkFBaUIsR0FBRyxlQUFlLENBQUMsUUFBUTs7OztBQW9CckQsbUJBQWEsR0FBRyxJQUFJOzs7Ozs7O0FBTWxCLGVBQVM7QUFDRixpQkFEUCxTQUFTLEdBQ0M7OztnQ0FEVixTQUFTOztBQUVYLGNBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxZQUFZLEVBQUUsQ0FBQzs7QUFFakMsY0FBSSxDQUFDLFlBQVksR0FBRyxJQUFJLGFB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QyxDQUFDO0FBQzNELG9CQUFJLGNBQWMsRUFBRTtBQUNsQixzQkFBTSxNQUFNLEdBQUcsY0FBYyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7QUFDOUMsc0JBQUksR0FBRyxLQUFLLE1BQU0sSUFBSSxHQUFHLEtBQUssTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUNsRCwyQkFBTyxJQUFJLENBQUM7bUJBQ2I7aUJBQ0Y7ZUFDRjthQUNGO0FBQ0QsbUJBQU8sS0FBSyxDQUFDO1dBQ2QsQ0FBQyxPQUFNLENBQUMsRUFBRTtBQUNULG1CQUFPLEtBQUssQ0FBQztXQUNkO1NBQ0Y7T0FDRjs7eUJBRWMsUUFBUSIsImZpbGUiOiJhZGJsb2NrZXIvYWRibG9ja2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXRpbHMsIGV2ZW50cyB9IGZyb20gJ2NvcmUvY2xpcXonO1xuaW1wb3J0IFdlYlJlcXVlc3QgZnJvbSAnY29yZS93ZWJyZXF1ZXN0JztcblxuaW1wb3J0IHsgVVJMSW5mbyB9IGZyb20gJ2FudGl0cmFja2luZy91cmwnO1xuaW1wb3J0IHsgZ2V0R2VuZXJhbERvbWFpbiB9IGZyb20gJ2FudGl0cmFja2luZy9kb21haW4nO1xuaW1wb3J0ICogYXMgYnJvd3NlciBmcm9tICdwbGF0Zm9ybS9icm93c2VyJztcblxuaW1wb3J0IHsgTGF6eVBlcnNpc3RlbnRPYmplY3QgfSBmcm9tICdhbnRpdHJhY2tpbmcvcGVyc2lzdGVudC1zdGF0ZSc7XG5pbXBvcnQgTFJVQ2FjaGUgZnJvbSAnYW50aXRyYWNraW5nL2ZpeGVkLXNpemUtY2FjaGUnO1xuaW1wb3J0IEh0dHBSZXF1ZXN0Q29udGV4dCBmcm9tICdhbnRpdHJhY2tpbmcvd2VicmVxdWVzdC1jb250ZXh0JztcblxuaW1wb3J0IHsgbG9nIH0gZnJvbSAnYWRibG9ja2VyL3V0aWxzJztcbmltcG9ydCBGaWx0ZXJFbmdpbmUgZnJvbSAnYWRibG9ja2VyL2ZpbHRlcnMtZW5naW5lJztcbmltcG9ydCBGaWx0ZXJzTG9hZGVyIGZyb20gJ2FkYmxvY2tlci9maWx0ZXJzLWxvYWRlcic7XG5pbXBvcnQgQWRiU3RhdHMgZnJvbSAnYWRibG9ja2VyL2FkYi1zdGF0cyc7XG5cbi8vIGFkYiB2ZXJzaW9uXG5leHBvcnQgY29uc3QgQURCX1ZFUiA9IDAuMDE7XG5cbi8vIFByZWZlcmVuY2VzXG5leHBvcnQgY29uc3QgQURCX1BSRUYgPSAnY2xpcXotYWRiJztcbmV4cG9ydCBjb25zdCBBREJfUFJFRl9PUFRJTUlaRUQgPSAnY2xpcXotYWRiLW9wdGltaXplZCc7XG5leHBvcnQgY29uc3QgQURCX0FCVEVTVF9QUkVGID0gJ2NsaXF6LWFkYi1hYnRlc3QnO1xuZXhwb3J0IGNvbnN0IEFEQl9QUkVGX1ZBTFVFUyA9IHtcbiAgRW5hYmxlZDogMSxcbiAgRGlzYWJsZWQ6IDAsXG59O1xuZXhwb3J0IGNvbnN0IEFEQl9ERUZBVUxUX1ZBTFVFID0gQURCX1BSRUZfVkFMVUVTLkRpc2FibGVkO1xuXG5cbmV4cG9ydCBmdW5jdGlvbiBhdXRvQmxvY2tBZHMoKSB7XG4gIHJldHVybiB0cnVlO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBhZGJBQlRlc3RFbmFibGVkKCkge1xuICByZXR1cm4gQ2xpcXpVdGlscy5nZXRQcmVmKEFEQl9BQlRFU1RfUFJFRiwgZmFsc2UpO1xufVxuXG5cbmV4cG9ydCBmdW5jdGlvbiBhZGJFbmFibGVkKCkge1xuICAvLyBUT0RPOiBEZWFsIHdpdGggJ29wdGltaXplZCcgbW9kZS5cbiAgLy8gMCA9IERpc2FibGVkXG4gIC8vIDEgPSBFbmFibGVkXG4gIHJldHVybiBhZGJBQlRlc3RFbmFibGVkKCkgJiYgQ2xpcXpVdGlscy5nZXRQcmVmKEFEQl9QUkVGLCBBREJfUFJFRl9WQUxVRVMuRGlzYWJsZWQpICE9PSAwO1xufVxuXG52YXIgQ2xpcXpIdW1hbldlYiA9IG51bGw7XG5cbi8qIFdyYXBzIGZpbHRlci1iYXNlZCBhZGJsb2NraW5nIGluIGEgY2xhc3MuIEl0IGhhcyB0byBoYW5kbGUgYm90aFxuICogdGhlIG1hbmFnZW1lbnQgb2YgbGlzdHMgKGZldGNoaW5nLCB1cGRhdGluZykgdXNpbmcgYSBGaWx0ZXJzTG9hZGVyXG4gKiBhbmQgdGhlIG1hdGNoaW5nIHVzaW5nIGEgRmlsdGVyRW5naW5lLlxuICovXG5jbGFzcyBBZEJsb2NrZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmVuZ2luZSA9IG5ldyBGaWx0ZXJFbmdpbmUoKTtcblxuICAgIHRoaXMubGlzdHNNYW5hZ2VyID0gbmV3IEZpbHRlcnNMb2FkZXIoKTtcbiAgICB0aGlzLmxpc3RzTWFuYWdlci5vblVwZGF0ZSh1cGRhdGUgPT4ge1xuICAgICAgLy8gVXBkYXRlIGxpc3QgaW4gZW5naW5lXG4gICAgICBjb25zdCB7IGFzc2V0LCBmaWx0ZXJzLCBpc0ZpbHRlcnNMaXN0IH0gPSB1cGRhdGU7XG4gICAgICBpZiAoaXNGaWx0ZXJzTGlzdCkge1xuICAgICAgICB0aGlzLmVuZ2luZS5vblVwZGF0ZUZpbHRlcnMoYXNzZXQsIGZpbHRlcnMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5lbmdpbmUub25VcGRhdGVSZXNvdXJjZShhc3NldCwgZmlsdGVycyk7XG4gICAgICB9XG4gICAgICB0aGlzLmluaXRDYWNoZSgpO1xuICAgIH0pO1xuXG4gICAgLy8gQmxhY2tsaXN0cyB0byBkaXNhYmxlIGFkYmxvY2tpbmcgb24gY2VydGFpbiBkb21haW5zL3VybHNcbiAgICB0aGlzLmJsYWNrbGlzdCA9IG5ldyBTZXQoKTtcbiAgICB0aGlzLmJsYWNrbGlzdFBlcnNpc3QgPSBuZXcgTGF6eVBlcnNpc3RlbnRPYmplY3QoJ2FkYi1ibGFja2xpc3QnKTtcblxuICAgIC8vIGxvYWQgaHVtYW4td2ViIGlmIGF2YWlsYWJsZSAoZm9yIGJsb2NrbGlzdCBhbm5vdGF0aW9ucylcbiAgICBTeXN0ZW0uaW1wb3J0KCdodW1hbi13ZWIvaHVtYW4td2ViJykudGhlbigobW9kKSA9PiB7XG4gICAgICBDbGlxekh1bWFuV2ViID0gbW9kLmRlZmF1bHRcbiAgICB9KS5jYXRjaCgoKSA9PiB7XG4gICAgICBDbGlxekh1bWFuV2ViID0gbnVsbFxuICAgIH0pO1xuICAgIC8vIElzIHRoZSBhZGJsb2NrZXIgaW5pdGlhbGl6ZWRcbiAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG4gIH1cblxuICBpbml0Q2FjaGUoKSB7XG4gICAgLy8gVG8gbWFrZSBzdXJlIHdlIGRvbid0IGJyZWFrIGFueSBmaWx0ZXIgYmVoYXZpb3IsIGVhY2gga2V5IGluIHRoZSBMUlVcbiAgICAvLyBjYWNoZSBpcyBtYWRlIHVwIG9mIHsgc291cmNlIGdlbmVyYWwgZG9tYWluIH0gKyB7IHVybCB9LlxuICAgIC8vIFRoaXMgaXMgYmVjYXVzZSBzb21lIGZpbHRlcnMgd2lsbCBiZWhhdmUgZGlmZmVyZW50bHkgYmFzZWQgb24gdGhlXG4gICAgLy8gZG9tYWluIG9mIHRoZSBzb3VyY2UuXG5cbiAgICAvLyBDYWNoZSBxdWVyaWVzIHRvIEZpbHRlckVuZ2luZVxuICAgIHRoaXMuY2FjaGUgPSBuZXcgTFJVQ2FjaGUoXG4gICAgICB0aGlzLmVuZ2luZS5tYXRjaC5iaW5kKHRoaXMuZW5naW5lKSwgICAgICAvLyBDb21wdXRlIHJlc3VsdFxuICAgICAgMTAwMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWF4aW11bSBudW1iZXIgb2YgZW50cmllc1xuICAgICAgcmVxdWVzdCA9PiByZXF1ZXN0LnNvdXJjZUdEICsgcmVxdWVzdC51cmwgLy8gU2VsZWN0IGtleVxuICAgICk7XG4gIH1cblxuICBpbml0KCkge1xuICAgIHRoaXMuaW5pdENhY2hlKCk7XG4gICAgdGhpcy5saXN0c01hbmFnZXIubG9hZCgpO1xuICAgIHRoaXMuYmxhY2tsaXN0UGVyc2lzdC5sb2FkKCkudGhlbih2YWx1ZSA9PiB7XG4gICAgICAvLyBTZXQgdmFsdWVcbiAgICAgIGlmICh2YWx1ZS51cmxzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5ibGFja2xpc3QgPSBuZXcgU2V0KHZhbHVlLnVybHMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICB9XG5cbiAgcGVyc2lzdEJsYWNrbGlzdCgpIHtcbiAgICB0aGlzLmJsYWNrbGlzdFBlcnNpc3Quc2V0VmFsdWUoeyB1cmxzOiBbLi4udGhpcy5ibGFja2xpc3QudmFsdWVzKCldIH0pO1xuICB9XG5cbiAgYWRkVG9CbGFja2xpc3QodXJsKSB7XG4gICAgdGhpcy5ibGFja2xpc3QuYWRkKHVybCk7XG4gICAgdGhpcy5wZXJzaXN0QmxhY2tsaXN0KCk7XG4gIH1cblxuICByZW1vdmVGcm9tQmxhY2tsaXN0KHVybCkge1xuICAgIHRoaXMuYmxhY2tsaXN0LmRlbGV0ZSh1cmwpO1xuICAgIHRoaXMucGVyc2lzdEJsYWNrbGlzdCgpO1xuICB9XG5cbiAgaXNJbkJsYWNrbGlzdChyZXF1ZXN0KSB7XG4gICAgcmV0dXJuICh0aGlzLmJsYWNrbGlzdC5oYXMocmVxdWVzdC5zb3VyY2VVUkwpIHx8XG4gICAgICAgICAgICB0aGlzLmJsYWNrbGlzdC5oYXMocmVxdWVzdC5zb3VyY2VHRCkpO1xuICB9XG5cbiAgaXNEb21haW5JbkJsYWNrbGlzdCh1cmwpIHtcbiAgICAvLyBTaG91bGQgYWxsIHRoaXMgZG9tYWluIHN0dWZmIGJlIGV4dHJhY3RlZCBpbnRvIGEgZnVuY3Rpb24/XG4gICAgLy8gV2h5IGlzIENsaXF6VXRpbHMuZGV0RGV0YWlsc0Zyb21Vcmwgbm90IHVzZWQ/XG4gICAgY29uc3QgdXJsUGFydHMgPSBVUkxJbmZvLmdldCh1cmwpO1xuICAgIGxldCBob3N0bmFtZSA9IHVybFBhcnRzLmhvc3RuYW1lIHx8IHVybDtcbiAgICBpZiAoaG9zdG5hbWUuc3RhcnRzV2l0aCgnd3d3LicpKSB7XG4gICAgICBob3N0bmFtZSA9IGhvc3RuYW1lLnN1YnN0cmluZyg0KTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5ibGFja2xpc3QuaGFzKGhvc3RuYW1lKTtcbiAgfVxuXG4gIGlzVXJsSW5CbGFja2xpc3QodXJsKSB7XG4gICAgcmV0dXJuIHRoaXMuYmxhY2tsaXN0Lmhhcyh1cmwpO1xuICB9XG5cbiAgbG9nQWN0aW9uSFcodXJsLCBhY3Rpb24sIGRvbWFpbikge1xuICAgIGxldCB0eXBlID0gJ3VybCc7XG4gICAgaWYgKGRvbWFpbikge1xuICAgICAgdHlwZSA9ICdkb21haW4nO1xuICAgIH1cbiAgICBpZiAoIUNsaXF6SHVtYW5XZWIuc3RhdGUudlt1cmxdLmFkYmxvY2tlcl9ibGFja2xpc3QpIHtcbiAgICAgIENsaXF6SHVtYW5XZWIuc3RhdGUudlt1cmxdLmFkYmxvY2tlcl9ibGFja2xpc3QgPSB7fTtcbiAgICB9XG4gICAgQ2xpcXpIdW1hbldlYi5zdGF0ZS52W3VybF0uYWRibG9ja2VyX2JsYWNrbGlzdFthY3Rpb25dID0gdHlwZTtcbiAgfVxuXG4gIHRvZ2dsZVVybCh1cmwsIGRvbWFpbikge1xuICAgIGxldCBwcm9jZXNzZWRVUkwgPSB1cmw7XG4gICAgaWYgKGRvbWFpbikge1xuICAgICAgLy8gU2hvdWxkIGFsbCB0aGlzIGRvbWFpbiBzdHVmZiBiZSBleHRyYWN0ZWQgaW50byBhIGZ1bmN0aW9uP1xuICAgICAgLy8gV2h5IGlzIENsaXF6VXRpbHMuZ2V0RGV0YWlsc0Zyb21Vcmwgbm90IHVzZWQ/XG4gICAgICBwcm9jZXNzZWRVUkwgPSBVUkxJbmZvLmdldCh1cmwpLmhvc3RuYW1lO1xuICAgICAgaWYgKHByb2Nlc3NlZFVSTC5zdGFydHNXaXRoKCd3d3cuJykpIHtcbiAgICAgICAgcHJvY2Vzc2VkVVJMID0gcHJvY2Vzc2VkVVJMLnN1YnN0cmluZyg0KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zdCBleGlzdEhXID0gQ2xpcXpIdW1hbldlYiAmJiBDbGlxekh1bWFuV2ViLnN0YXRlLnZbdXJsXTtcbiAgICBpZiAodGhpcy5ibGFja2xpc3QuaGFzKHByb2Nlc3NlZFVSTCkpIHtcbiAgICAgIHRoaXMuYmxhY2tsaXN0LmRlbGV0ZShwcm9jZXNzZWRVUkwpO1xuICAgICAgLy8gVE9ETzogSXQncyBiZXR0ZXIgdG8gaGF2ZSBhbiBBUEkgZnJvbSBodW1hbndlYiB0byBpbmRpY2F0ZSBpZiBhIHVybCBpcyBwcml2YXRlXG4gICAgICBpZiAoZXhpc3RIVykge1xuICAgICAgICB0aGlzLmxvZ0FjdGlvbkhXKHVybCwgJ3JlbW92ZScsIGRvbWFpbik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIHRoaXMuYmxhY2tsaXN0LmFkZChwcm9jZXNzZWRVUkwpO1xuICAgICAgaWYgKGV4aXN0SFcpIHtcbiAgICAgICAgdGhpcy5sb2dBY3Rpb25IVyh1cmwsICdhZGQnLCBkb21haW4pO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMucGVyc2lzdEJsYWNrbGlzdCgpO1xuICB9XG5cbiAgLyogQHBhcmFtIHt3ZWJyZXF1ZXN0LWNvbnRleHR9IGh0dHBDb250ZXh0IC0gQ29udGV4dCBvZiB0aGUgcmVxdWVzdFxuICAgKi9cbiAgbWF0Y2goaHR0cENvbnRleHQpIHtcbiAgICAvLyBDaGVjayBpZiB0aGUgYWRibG9ja2VyIGlzIGluaXRpYWxpemVkXG4gICAgaWYgKCF0aGlzLmluaXRpYWxpemVkKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgLy8gUHJvY2VzcyBlbmRwb2ludCBVUkxcbiAgICBjb25zdCB1cmwgPSBodHRwQ29udGV4dC51cmwudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCB1cmxQYXJ0cyA9IFVSTEluZm8uZ2V0KHVybCk7XG4gICAgbGV0IGhvc3RuYW1lID0gdXJsUGFydHMuaG9zdG5hbWU7XG4gICAgaWYgKGhvc3RuYW1lLnN0YXJ0c1dpdGgoJ3d3dy4nKSkge1xuICAgICAgaG9zdG5hbWUgPSBob3N0bmFtZS5zdWJzdHJpbmcoNCk7XG4gICAgfVxuICAgIGNvbnN0IGhvc3RHRCA9IGdldEdlbmVyYWxEb21haW4oaG9zdG5hbWUpO1xuXG4gICAgLy8gUHJvY2VzcyBzb3VyY2UgdXJsXG4gICAgY29uc3Qgc291cmNlVVJMID0gaHR0cENvbnRleHQuZ2V0U291cmNlVVJMKCkudG9Mb3dlckNhc2UoKTtcbiAgICBjb25zdCBzb3VyY2VQYXJ0cyA9IFVSTEluZm8uZ2V0KHNvdXJjZVVSTCk7XG4gICAgbGV0IHNvdXJjZUhvc3RuYW1lID0gc291cmNlUGFydHMuaG9zdG5hbWU7XG4gICAgaWYgKHNvdXJjZUhvc3RuYW1lLnN0YXJ0c1dpdGgoJ3d3dy4nKSkge1xuICAgICAgc291cmNlSG9zdG5hbWUgPSBzb3VyY2VIb3N0bmFtZS5zdWJzdHJpbmcoNCk7XG4gICAgfVxuICAgIGNvbnN0IHNvdXJjZUdEID0gZ2V0R2VuZXJhbERvbWFpbihzb3VyY2VIb3N0bmFtZSk7XG5cbiAgICAvLyBXcmFwIGluZm9ybWF0aW9ucyBuZWVkZWQgdG8gbWF0Y2ggdGhlIHJlcXVlc3RcbiAgICBjb25zdCByZXF1ZXN0ID0ge1xuICAgICAgLy8gUmVxdWVzdFxuICAgICAgdXJsLFxuICAgICAgY3B0OiBodHRwQ29udGV4dC5nZXRDb250ZW50UG9saWN5VHlwZSgpLFxuICAgICAgLy8gU291cmNlXG4gICAgICBzb3VyY2VVUkwsXG4gICAgICBzb3VyY2VIb3N0bmFtZSxcbiAgICAgIHNvdXJjZUdELFxuICAgICAgLy8gRW5kcG9pbnRcbiAgICAgIGhvc3RuYW1lLFxuICAgICAgaG9zdEdELFxuICAgIH07XG5cbiAgICBsb2coYG1hdGNoICR7SlNPTi5zdHJpbmdpZnkocmVxdWVzdCl9YCk7XG5cbiAgICBjb25zdCB0MCA9IERhdGUubm93KCk7XG4gICAgY29uc3QgaXNBZCA9IHRoaXMuaXNJbkJsYWNrbGlzdChyZXF1ZXN0KSA/IGZhbHNlIDogdGhpcy5jYWNoZS5nZXQocmVxdWVzdCk7XG4gICAgY29uc3QgdG90YWxUaW1lID0gRGF0ZS5ub3coKSAtIHQwO1xuXG4gICAgbG9nKGBCTE9DSyBBRCAke0pTT04uc3RyaW5naWZ5KHtcbiAgICAgIHRpbWVBZEZpbHRlcjogdG90YWxUaW1lLFxuICAgICAgaXNBZEZpbHRlcjogaXNBZCxcbiAgICAgIGNvbnRleHQ6IHtcbiAgICAgICAgdXJsOiBodHRwQ29udGV4dC51cmwsXG4gICAgICAgIHNvdXJjZTogaHR0cENvbnRleHQuZ2V0U291cmNlVVJMKCksXG4gICAgICAgIGNwdDogaHR0cENvbnRleHQuZ2V0Q29udGVudFBvbGljeVR5cGUoKSxcbiAgICAgICAgbWV0aG9kOiBodHRwQ29udGV4dC5tZXRob2QsXG4gICAgICB9LFxuICAgIH0pfWApO1xuXG4gICAgcmV0dXJuIGlzQWQ7XG4gIH1cbn1cblxuY29uc3QgQ2xpcXpBREIgPSB7XG4gIGFkYmxvY2tJbml0aWFsaXplZDogZmFsc2UsXG4gIGFkYk1lbToge30sXG4gIGFkYlN0YXRzOiBuZXcgQWRiU3RhdHMoKSxcbiAgbXV0YXRpb25Mb2dnZXI6IG51bGwsXG4gIGFkYkRlYnVnOiBmYWxzZSxcbiAgTUlOX0JST1dTRVJfVkVSU0lPTjogMzUsXG4gIHRpbWVyczogW10sXG5cbiAgaW5pdCgpIHtcbiAgICAvLyBTZXQgYGNsaXF6LWFkYmAgZGVmYXVsdCB0byAnRGlzYWJsZWQnXG4gICAgaWYgKENsaXF6VXRpbHMuZ2V0UHJlZihBREJfUFJFRiwgdW5kZWZpbmVkKSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBDbGlxelV0aWxzLnNldFByZWYoQURCX1BSRUYsIEFEQl9QUkVGX1ZBTFVFUy5EaXNhYmxlZCk7XG4gICAgfVxuXG4gICAgQ2xpcXpBREIuYWRCbG9ja2VyID0gbmV3IEFkQmxvY2tlcigpO1xuXG4gICAgY29uc3QgaW5pdEFkQmxvY2tlciA9ICgpID0+IHtcbiAgICAgIENsaXF6QURCLmFkQmxvY2tlci5pbml0KCk7XG4gICAgICBDbGlxekFEQi5hZGJsb2NrSW5pdGlhbGl6ZWQgPSB0cnVlO1xuICAgICAgQ2xpcXpBREIuaW5pdFBhY2VtYWtlcigpO1xuICAgICAgV2ViUmVxdWVzdC5vbkJlZm9yZVJlcXVlc3QuYWRkTGlzdGVuZXIoXG4gICAgICAgIENsaXF6QURCLmh0dHBvcGVuT2JzZXJ2ZXIub2JzZXJ2ZSxcbiAgICAgICAgdW5kZWZpbmVkLFxuICAgICAgICBbJ2Jsb2NraW5nJ11cbiAgICAgICk7XG4gICAgfTtcblxuICAgIGlmIChhZGJFbmFibGVkKCkpIHtcbiAgICAgIGluaXRBZEJsb2NrZXIoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgZXZlbnRzLnN1YigncHJlZmNoYW5nZScsIHByZWYgPT4ge1xuICAgICAgICBpZiAoKHByZWYgPT09IEFEQl9QUkVGIHx8IHByZWYgPT09IEFEQl9BQlRFU1RfUFJFRikgJiZcbiAgICAgICAgICAgICFDbGlxekFEQi5hZGJsb2NrSW5pdGlhbGl6ZWQgJiZcbiAgICAgICAgICAgIGFkYkVuYWJsZWQoKSkge1xuICAgICAgICAgIGluaXRBZEJsb2NrZXIoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfVxuICB9LFxuXG4gIHVubG9hZCgpIHtcbiAgICBDbGlxekFEQi51bmxvYWRQYWNlbWFrZXIoKTtcbiAgICBicm93c2VyLmZvckVhY2hXaW5kb3coQ2xpcXpBREIudW5sb2FkV2luZG93KTtcbiAgICBXZWJSZXF1ZXN0Lm9uQmVmb3JlUmVxdWVzdC5yZW1vdmVMaXN0ZW5lcihDbGlxekFEQi5odHRwb3Blbk9ic2VydmVyLm9ic2VydmUpO1xuICB9LFxuXG4gIGluaXRXaW5kb3coLyogd2luZG93ICovKSB7XG4gIH0sXG5cbiAgdW5sb2FkV2luZG93KC8qIHdpbmRvdyAqLykge1xuICB9LFxuXG4gIGluaXRQYWNlbWFrZXIoKSB7XG4gICAgY29uc3QgdDEgPSB1dGlscy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBDbGlxekFEQi5hZGJTdGF0cy5jbGVhclN0YXRzKCk7XG4gICAgfSwgMTAgKiA2MCAqIDEwMDApO1xuICAgIENsaXF6QURCLnRpbWVycy5wdXNoKHQxKTtcblxuICAgIGNvbnN0IHQyID0gdXRpbHMuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgaWYgKCFDbGlxekFEQi5jYWNoZUFEQikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBPYmplY3Qua2V5cyhDbGlxekFEQi5jYWNoZUFEQikuZm9yRWFjaCh0ID0+IHtcbiAgICAgICAgaWYgKCFicm93c2VyLmlzV2luZG93QWN0aXZlKHQpKSB7XG4gICAgICAgICAgZGVsZXRlIENsaXF6QURCLmNhY2hlQURCW3RdO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LCAxMCAqIDYwICogMTAwMCk7XG4gICAgQ2xpcXpBREIudGltZXJzLnB1c2godDIpO1xuICB9LFxuXG4gIHVubG9hZFBhY2VtYWtlcigpIHtcbiAgICBDbGlxekFEQi50aW1lcnMuZm9yRWFjaCh1dGlscy5jbGVhclRpbWVvdXQpO1xuICB9LFxuXG4gIGh0dHBvcGVuT2JzZXJ2ZXI6IHtcbiAgICBvYnNlcnZlKHJlcXVlc3REZXRhaWxzKSB7XG4gICAgICBpZiAoIWFkYkVuYWJsZWQoKSkge1xuICAgICAgICByZXR1cm4ge307XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlcXVlc3RDb250ZXh0ID0gbmV3IEh0dHBSZXF1ZXN0Q29udGV4dChyZXF1ZXN0RGV0YWlscyk7XG4gICAgICBjb25zdCB1cmwgPSByZXF1ZXN0Q29udGV4dC51cmw7XG5cbiAgICAgIGlmICghdXJsKSB7XG4gICAgICAgIHJldHVybiB7fTtcbiAgICAgIH1cblxuICAgICAgaWYgKHJlcXVlc3RDb250ZXh0LmlzRnVsbFBhZ2UoKSkge1xuICAgICAgICBDbGlxekFEQi5hZGJTdGF0cy5hZGROZXdQYWdlKHVybCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHNvdXJjZVVybCA9IHJlcXVlc3RDb250ZXh0LmdldExvYWRpbmdEb2N1bWVudCgpO1xuXG4gICAgICBpZiAoIXNvdXJjZVVybCB8fCBzb3VyY2VVcmwuc3RhcnRzV2l0aCgnYWJvdXQ6JykpIHtcbiAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgfVxuXG4gICAgICBpZiAoYWRiRW5hYmxlZCgpICYmIENsaXF6QURCLmFkQmxvY2tlci5tYXRjaChyZXF1ZXN0Q29udGV4dCkpIHtcbiAgICAgICAgQ2xpcXpBREIuYWRiU3RhdHMuYWRkQmxvY2tlZFVybChzb3VyY2VVcmwsIHVybCk7XG4gICAgICAgIHJldHVybiB7IGNhbmNlbDogdHJ1ZSB9O1xuICAgICAgfVxuXG4gICAgICByZXR1cm4ge307XG4gICAgfSxcbiAgfSxcbiAgZ2V0QnJvd3Nlck1ham9yVmVyc2lvbigpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgYXBwSW5mbyA9IENvbXBvbmVudHMuY2xhc3Nlc1snQG1vemlsbGEub3JnL3hyZS9hcHAtaW5mbzsxJ11cbiAgICAgICAgICAgICAgICAgICAgICAuZ2V0U2VydmljZShDb21wb25lbnRzLmludGVyZmFjZXMubnNJWFVMQXBwSW5mbyk7XG4gICAgICByZXR1cm4gcGFyc2VJbnQoYXBwSW5mby52ZXJzaW9uLnNwbGl0KCcuJylbMF0sIDEwKTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIHJldHVybiAxMDA7XG4gICAgfVxuICB9LFxuICBpc1RhYlVSTCh1cmwpIHtcbiAgICB0cnkge1xuICAgICAgY29uc3Qgd20gPSBDb21wb25lbnRzLmNsYXNzZXNbJ0Btb3ppbGxhLm9yZy9hcHBzaGVsbC93aW5kb3ctbWVkaWF0b3I7MSddXG4gICAgICAgICAgICAgICAgLmdldFNlcnZpY2UoQ29tcG9uZW50cy5pbnRlcmZhY2VzLm5zSVdpbmRvd01lZGlhdG9yKTtcbiAgICAgIGNvbnN0IGJyb3dzZXJFbnVtZXJhdG9yID0gd20uZ2V0RW51bWVyYXRvcignbmF2aWdhdG9yOmJyb3dzZXInKTtcblxuICAgICAgd2hpbGUgKGJyb3dzZXJFbnVtZXJhdG9yLmhhc01vcmVFbGVtZW50cygpKSB7XG4gICAgICAgIGNvbnN0IGJyb3dzZXJXaW4gPSBicm93c2VyRW51bWVyYXRvci5nZXROZXh0KCk7XG4gICAgICAgIGNvbnN0IHRhYmJyb3dzZXIgPSBicm93c2VyV2luLmdCcm93c2VyO1xuXG4gICAgICAgIGNvbnN0IG51bVRhYnMgPSB0YWJicm93c2VyLmJyb3dzZXJzLmxlbmd0aDtcbiAgICAgICAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IG51bVRhYnM7IGluZGV4KyspIHtcbiAgICAgICAgICBjb25zdCBjdXJyZW50QnJvd3NlciA9IHRhYmJyb3dzZXIuZ2V0QnJvd3NlckF0SW5kZXgoaW5kZXgpO1xuICAgICAgICAgIGlmIChjdXJyZW50QnJvd3Nlcikge1xuICAgICAgICAgICAgY29uc3QgdGFiVVJMID0gY3VycmVudEJyb3dzZXIuY3VycmVudFVSSS5zcGVjO1xuICAgICAgICAgICAgaWYgKHVybCA9PT0gdGFiVVJMIHx8IHVybCA9PT0gdGFiVVJMLnNwbGl0KCcjJylbMF0pIHtcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9LFxufTtcblxuZXhwb3J0IGRlZmF1bHQgQ2xpcXpBREI7XG4iXX0=