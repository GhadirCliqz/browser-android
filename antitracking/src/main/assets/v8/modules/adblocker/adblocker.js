System.register('adblocker/adblocker', ['core/cliqz', 'core/webrequest', 'antitracking/url', 'antitracking/domain', 'platform/browser', 'antitracking/persistent-state', 'antitracking/fixed-size-cache', 'antitracking/webrequest-context', 'adblocker/utils', 'adblocker/filters-engine', 'adblocker/filters-loader'], function (_export) {

  //import ContentPolicy from 'adblocker/content-policy';
  //import { hideNodes } from 'adblocker/cosmetics';
  //import { MutationLogger } from 'adblocker/mutation-logger';

  //import CliqzHumanWeb from 'human-web/human-web';

  // adb version
  'use strict';

  var utils, events, WebRequest, URLInfo, getGeneralDomain, sameGeneralDomain, browser, LazyPersistentObject, LRUCache, HttpRequestContext, log, FilterEngine, FiltersLoader, ADB_VER, ADB_PREF, ADB_ABTEST_PREF, ADB_PREF_VALUES, ADB_DEFAULT_VALUE, AdBlocker, CliqzADB;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  _export('autoBlockAds', autoBlockAds);

  _export('adbABTestEnabled', adbABTestEnabled);

  /* Wraps filter-based adblocking in a class. It has to handle both
   * the management of lists (fetching, updating) using a FiltersLoader
   * and the matching using a FilterEngine.
   */

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
    // 2 = Optimized
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
      sameGeneralDomain = _antitrackingDomain.sameGeneralDomain;
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
    }],
    execute: function () {
      ADB_VER = 0.01;

      _export('ADB_VER', ADB_VER);

      // Preferences
      ADB_PREF = 'cliqz-adb';

      _export('ADB_PREF', ADB_PREF);

      ADB_ABTEST_PREF = 'cliqz-adb-abtest';

      _export('ADB_ABTEST_PREF', ADB_ABTEST_PREF);

      ADB_PREF_VALUES = {
        Optimized: 2,
        Enabled: 1,
        Disabled: 0
      };

      _export('ADB_PREF_VALUES', ADB_PREF_VALUES);

      ADB_DEFAULT_VALUE = ADB_PREF_VALUES.Disabled;

      _export('ADB_DEFAULT_VALUE', ADB_DEFAULT_VALUE);

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

            _this.engine.onUpdateFilters(asset, filters);

            _this.initCache();
          });

          // Blacklists to disable adblocking on certain domains/urls
          this.blacklist = new Set();
          this.blacklistPersist = new LazyPersistentObject('adb-blacklist');

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
            var hostname = urlParts.hostname;
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
        adbStats: { pages: {} },
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
            //ContentPolicy.init();
            //CliqzADB.cp = ContentPolicy;
            //CliqzADB.mutationLogger = new MutationLogger();
            CliqzADB.adBlocker.init();
            CliqzADB.adblockInitialized = true;
            CliqzADB.initPacemaker();
            WebRequest.onBeforeRequest.addListener(CliqzADB.httpopenObserver.observe, undefined, ['blocking']);
          };

          if (adbEnabled()) {
            initAdBlocker();
          } else {
            events.sub('prefchange', function (pref) {
              if (pref === ADB_PREF && !CliqzADB.adblockInitialized && adbEnabled()) {
                initAdBlocker();
              }
            });
          }
        },

        unload: function unload() {
          CliqzADB.unloadPacemaker();
          browser.forEachWindow(CliqzADB.unloadWindow);
          WebRequest.onBeforeRequest.removeListener(CliqzADB.httpopenObserver.observe);
          ContentPolicy.unload();
        },

        initWindow: function initWindow(window) {
          if (CliqzADB.mutationLogger !== null) {
            window.gBrowser.addProgressListener(CliqzADB.mutationLogger);
          }
        },

        unloadWindow: function unloadWindow(window) {
          if (window.gBrowser && CliqzADB.mutationLogger !== null) {
            window.gBrowser.removeProgressListener(CliqzADB.mutationLogger);
          }
        },

        initPacemaker: function initPacemaker() {
          var t1 = utils.setInterval(function () {
            Object.keys(CliqzADB.adbStats.pages).forEach(function (url) {
              if (!CliqzADB.isTabURL[url]) {
                delete CliqzADB.adbStats.pages[url];
              }
            });
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

            var urlParts = URLInfo.get(url);

            if (requestContext.isFullPage()) {
              CliqzADB.adbStats.pages[url] = 0;
            }

            var sourceUrl = requestContext.getLoadingDocument();
            var sourceUrlParts = null;
            var sourceTab = requestContext.getOriginWindowID();

            if (!sourceUrl || sourceUrl.startsWith('about:')) {
              return {};
            }

            sourceUrlParts = URLInfo.get(sourceUrl);

            // same general domain
            var sameGd = sameGeneralDomain(urlParts.hostname, sourceUrlParts.hostname) || false;
            if (sameGd) {
              var wOri = requestContext.getOriginWindowID();
              var wOut = requestContext.getOuterWindowID();
              if (wOri !== wOut) {
                // request from iframe
                // const wm = Components.classes['@mozilla.org/appshell/window-mediator;1']
                //   .getService(Components.interfaces.nsIWindowMediator);
                // const frame = wm.getOuterWindowWithId(wOut).frameElement;

                // if (adbEnabled() && CliqzADB.adBlocker.match(requestContext)) {
                //   frame.style.display = 'none';  // hide this node
                //   CliqzADB.adbStats.pages[sourceUrl] = (CliqzADB.adbStats.pages[sourceUrl] || 0) + 1;

                //   frame.setAttribute('cliqz-adb', `source: ${url}`);
                //   return { cancel: true };
                // }
                //frame.setAttribute('cliqz-adblocker', 'safe');
                if (adbEnabled() && CliqzADB.adBlocker.match(requestContext)) {
                  return { cancel: true };
                }
              }
              return {};
            } else if (adbEnabled()) {
              if (CliqzADB.mutationLogger && CliqzADB.mutationLogger.tabsInfo[sourceTab] && !CliqzADB.mutationLogger.tabsInfo[sourceTab].observerAdded) {
                CliqzADB.mutationLogger.addMutationObserver(sourceTab);
              }
              if (CliqzADB.adBlocker.match(requestContext)) {
                //hideNodes(requestContext);
                return { cancel: true };
              }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFkYmxvY2tlci9hZGJsb2NrZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OEtBdUJhLE9BQU8sRUFHUCxRQUFRLEVBQ1IsZUFBZSxFQUNmLGVBQWUsRUFLZixpQkFBaUIsRUEwQnhCLFNBQVMsRUFzTFQsUUFBUTs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQTdNUCxXQUFTLFlBQVksR0FBRztBQUM3QixXQUFPLElBQUksQ0FBQztHQUNiOztBQUdNLFdBQVMsZ0JBQWdCLEdBQUc7QUFDakMsV0FBTyxVQUFVLENBQUMsT0FBTyxDQUFDLGVBQWUsRUFBRSxLQUFLLENBQUMsQ0FBQztHQUNuRDs7QUFHTSxXQUFTLFVBQVUsR0FBRzs7Ozs7QUFLM0IsV0FBTyxnQkFBZ0IsRUFBRSxJQUFJLFVBQVUsQ0FBQyxPQUFPLENBQUMsUUFBUSxFQUFFLGVBQWUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7R0FDM0Y7Ozs7eUJBcERRLEtBQUs7MEJBQUUsTUFBTTs7OztpQ0FHYixPQUFPOzs2Q0FDUCxnQkFBZ0I7OENBQUUsaUJBQWlCOzs7OzBEQUduQyxvQkFBb0I7Ozs7Ozs0QkFJcEIsR0FBRzs7Ozs7OztBQVlDLGFBQU8sR0FBRyxJQUFJOzs7OztBQUdkLGNBQVEsR0FBRyxXQUFXOzs7O0FBQ3RCLHFCQUFlLEdBQUcsa0JBQWtCOzs7O0FBQ3BDLHFCQUFlLEdBQUc7QUFDN0IsaUJBQVMsRUFBRSxDQUFDO0FBQ1osZUFBTyxFQUFFLENBQUM7QUFDVixnQkFBUSxFQUFFLENBQUM7T0FDWjs7OztBQUNZLHVCQUFpQixHQUFHLGVBQWUsQ0FBQyxRQUFROzs7O0FBMEJuRCxlQUFTO0FBQ0YsaUJBRFAsU0FBUyxHQUNDOzs7Z0NBRFYsU0FBUzs7QUFFWCxjQUFJLENBQUMsTUFBTSxHQUFHLElBQUksWUFBWSxFQUFFLENBQUM7O0FBRWpDLGNBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxhQUFhLEVBQUUsQ0FBQztBQUN4QyxjQUFJLENBQUMsWUFBWSxD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QUNsQixzQkFBTSxNQUFNLEdBQUcsY0FBYyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUM7QUFDOUMsc0JBQUksR0FBRyxLQUFLLE1BQU0sSUFBSSxHQUFHLEtBQUssTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRTtBQUNsRCwyQkFBTyxJQUFJLENBQUM7bUJBQ2I7aUJBQ0Y7ZUFDRjthQUNGO0FBQ0QsbUJBQU8sS0FBSyxDQUFDO1dBQ2QsQ0FBQyxPQUFNLENBQUMsRUFBRTtBQUNULG1CQUFPLEtBQUssQ0FBQztXQUNkO1NBQ0Y7T0FDRjs7eUJBRWMsUUFBUSIsImZpbGUiOiJhZGJsb2NrZXIvYWRibG9ja2VyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXRpbHMsIGV2ZW50cyB9IGZyb20gJ2NvcmUvY2xpcXonO1xuaW1wb3J0IFdlYlJlcXVlc3QgZnJvbSAnY29yZS93ZWJyZXF1ZXN0JztcblxuaW1wb3J0IHsgVVJMSW5mbyB9IGZyb20gJ2FudGl0cmFja2luZy91cmwnO1xuaW1wb3J0IHsgZ2V0R2VuZXJhbERvbWFpbiwgc2FtZUdlbmVyYWxEb21haW4gfSBmcm9tICdhbnRpdHJhY2tpbmcvZG9tYWluJztcbmltcG9ydCAqIGFzIGJyb3dzZXIgZnJvbSAncGxhdGZvcm0vYnJvd3Nlcic7XG5cbmltcG9ydCB7IExhenlQZXJzaXN0ZW50T2JqZWN0IH0gZnJvbSAnYW50aXRyYWNraW5nL3BlcnNpc3RlbnQtc3RhdGUnO1xuaW1wb3J0IExSVUNhY2hlIGZyb20gJ2FudGl0cmFja2luZy9maXhlZC1zaXplLWNhY2hlJztcbmltcG9ydCBIdHRwUmVxdWVzdENvbnRleHQgZnJvbSAnYW50aXRyYWNraW5nL3dlYnJlcXVlc3QtY29udGV4dCc7XG5cbmltcG9ydCB7IGxvZyB9IGZyb20gJ2FkYmxvY2tlci91dGlscyc7XG5pbXBvcnQgRmlsdGVyRW5naW5lIGZyb20gJ2FkYmxvY2tlci9maWx0ZXJzLWVuZ2luZSc7XG5pbXBvcnQgRmlsdGVyc0xvYWRlciBmcm9tICdhZGJsb2NrZXIvZmlsdGVycy1sb2FkZXInO1xuXG4vL2ltcG9ydCBDb250ZW50UG9saWN5IGZyb20gJ2FkYmxvY2tlci9jb250ZW50LXBvbGljeSc7XG4vL2ltcG9ydCB7IGhpZGVOb2RlcyB9IGZyb20gJ2FkYmxvY2tlci9jb3NtZXRpY3MnO1xuLy9pbXBvcnQgeyBNdXRhdGlvbkxvZ2dlciB9IGZyb20gJ2FkYmxvY2tlci9tdXRhdGlvbi1sb2dnZXInO1xuXG4vL2ltcG9ydCBDbGlxekh1bWFuV2ViIGZyb20gJ2h1bWFuLXdlYi9odW1hbi13ZWInO1xuXG5cbi8vIGFkYiB2ZXJzaW9uXG5leHBvcnQgY29uc3QgQURCX1ZFUiA9IDAuMDE7XG5cbi8vIFByZWZlcmVuY2VzXG5leHBvcnQgY29uc3QgQURCX1BSRUYgPSAnY2xpcXotYWRiJztcbmV4cG9ydCBjb25zdCBBREJfQUJURVNUX1BSRUYgPSAnY2xpcXotYWRiLWFidGVzdCc7XG5leHBvcnQgY29uc3QgQURCX1BSRUZfVkFMVUVTID0ge1xuICBPcHRpbWl6ZWQ6IDIsXG4gIEVuYWJsZWQ6IDEsXG4gIERpc2FibGVkOiAwLFxufTtcbmV4cG9ydCBjb25zdCBBREJfREVGQVVMVF9WQUxVRSA9IEFEQl9QUkVGX1ZBTFVFUy5EaXNhYmxlZDtcblxuXG5leHBvcnQgZnVuY3Rpb24gYXV0b0Jsb2NrQWRzKCkge1xuICByZXR1cm4gdHJ1ZTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gYWRiQUJUZXN0RW5hYmxlZCgpIHtcbiAgcmV0dXJuIENsaXF6VXRpbHMuZ2V0UHJlZihBREJfQUJURVNUX1BSRUYsIGZhbHNlKTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gYWRiRW5hYmxlZCgpIHtcbiAgLy8gVE9ETzogRGVhbCB3aXRoICdvcHRpbWl6ZWQnIG1vZGUuXG4gIC8vIDAgPSBEaXNhYmxlZFxuICAvLyAxID0gRW5hYmxlZFxuICAvLyAyID0gT3B0aW1pemVkXG4gIHJldHVybiBhZGJBQlRlc3RFbmFibGVkKCkgJiYgQ2xpcXpVdGlscy5nZXRQcmVmKEFEQl9QUkVGLCBBREJfUFJFRl9WQUxVRVMuRGlzYWJsZWQpICE9PSAwO1xufVxuXG5cbi8qIFdyYXBzIGZpbHRlci1iYXNlZCBhZGJsb2NraW5nIGluIGEgY2xhc3MuIEl0IGhhcyB0byBoYW5kbGUgYm90aFxuICogdGhlIG1hbmFnZW1lbnQgb2YgbGlzdHMgKGZldGNoaW5nLCB1cGRhdGluZykgdXNpbmcgYSBGaWx0ZXJzTG9hZGVyXG4gKiBhbmQgdGhlIG1hdGNoaW5nIHVzaW5nIGEgRmlsdGVyRW5naW5lLlxuICovXG5jbGFzcyBBZEJsb2NrZXIge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLmVuZ2luZSA9IG5ldyBGaWx0ZXJFbmdpbmUoKTtcblxuICAgIHRoaXMubGlzdHNNYW5hZ2VyID0gbmV3IEZpbHRlcnNMb2FkZXIoKTtcbiAgICB0aGlzLmxpc3RzTWFuYWdlci5vblVwZGF0ZSh1cGRhdGUgPT4ge1xuICAgICAgLy8gVXBkYXRlIGxpc3QgaW4gZW5naW5lXG4gICAgICBjb25zdCB7IGFzc2V0LCBmaWx0ZXJzIH0gPSB1cGRhdGU7XG4gICAgICB0aGlzLmVuZ2luZS5vblVwZGF0ZUZpbHRlcnMoYXNzZXQsIGZpbHRlcnMpO1xuXG4gICAgICB0aGlzLmluaXRDYWNoZSgpO1xuICAgIH0pO1xuXG4gICAgLy8gQmxhY2tsaXN0cyB0byBkaXNhYmxlIGFkYmxvY2tpbmcgb24gY2VydGFpbiBkb21haW5zL3VybHNcbiAgICB0aGlzLmJsYWNrbGlzdCA9IG5ldyBTZXQoKTtcbiAgICB0aGlzLmJsYWNrbGlzdFBlcnNpc3QgPSBuZXcgTGF6eVBlcnNpc3RlbnRPYmplY3QoJ2FkYi1ibGFja2xpc3QnKTtcblxuICAgIC8vIElzIHRoZSBhZGJsb2NrZXIgaW5pdGlhbGl6ZWRcbiAgICB0aGlzLmluaXRpYWxpemVkID0gZmFsc2U7XG4gIH1cblxuICBpbml0Q2FjaGUoKSB7XG4gICAgLy8gVG8gbWFrZSBzdXJlIHdlIGRvbid0IGJyZWFrIGFueSBmaWx0ZXIgYmVoYXZpb3IsIGVhY2gga2V5IGluIHRoZSBMUlVcbiAgICAvLyBjYWNoZSBpcyBtYWRlIHVwIG9mIHsgc291cmNlIGdlbmVyYWwgZG9tYWluIH0gKyB7IHVybCB9LlxuICAgIC8vIFRoaXMgaXMgYmVjYXVzZSBzb21lIGZpbHRlcnMgd2lsbCBiZWhhdmUgZGlmZmVyZW50bHkgYmFzZWQgb24gdGhlXG4gICAgLy8gZG9tYWluIG9mIHRoZSBzb3VyY2UuXG5cbiAgICAvLyBDYWNoZSBxdWVyaWVzIHRvIEZpbHRlckVuZ2luZVxuICAgIHRoaXMuY2FjaGUgPSBuZXcgTFJVQ2FjaGUoXG4gICAgICB0aGlzLmVuZ2luZS5tYXRjaC5iaW5kKHRoaXMuZW5naW5lKSwgICAgICAvLyBDb21wdXRlIHJlc3VsdFxuICAgICAgMTAwMCwgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTWF4aW11bSBudW1iZXIgb2YgZW50cmllc1xuICAgICAgcmVxdWVzdCA9PiByZXF1ZXN0LnNvdXJjZUdEICsgcmVxdWVzdC51cmwgLy8gU2VsZWN0IGtleVxuICAgICk7XG4gIH1cblxuICBpbml0KCkge1xuICAgIHRoaXMuaW5pdENhY2hlKCk7XG4gICAgdGhpcy5saXN0c01hbmFnZXIubG9hZCgpO1xuICAgIHRoaXMuYmxhY2tsaXN0UGVyc2lzdC5sb2FkKCkudGhlbih2YWx1ZSA9PiB7XG4gICAgICAvLyBTZXQgdmFsdWVcbiAgICAgIGlmICh2YWx1ZS51cmxzICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgdGhpcy5ibGFja2xpc3QgPSBuZXcgU2V0KHZhbHVlLnVybHMpO1xuICAgICAgfVxuICAgIH0pO1xuICAgIHRoaXMuaW5pdGlhbGl6ZWQgPSB0cnVlO1xuICB9XG5cbiAgcGVyc2lzdEJsYWNrbGlzdCgpIHtcbiAgICB0aGlzLmJsYWNrbGlzdFBlcnNpc3Quc2V0VmFsdWUoeyB1cmxzOiBbLi4udGhpcy5ibGFja2xpc3QudmFsdWVzKCldIH0pO1xuICB9XG5cbiAgYWRkVG9CbGFja2xpc3QodXJsKSB7XG4gICAgdGhpcy5ibGFja2xpc3QuYWRkKHVybCk7XG4gICAgdGhpcy5wZXJzaXN0QmxhY2tsaXN0KCk7XG4gIH1cblxuICByZW1vdmVGcm9tQmxhY2tsaXN0KHVybCkge1xuICAgIHRoaXMuYmxhY2tsaXN0LmRlbGV0ZSh1cmwpO1xuICAgIHRoaXMucGVyc2lzdEJsYWNrbGlzdCgpO1xuICB9XG5cbiAgaXNJbkJsYWNrbGlzdChyZXF1ZXN0KSB7XG4gICAgcmV0dXJuICh0aGlzLmJsYWNrbGlzdC5oYXMocmVxdWVzdC5zb3VyY2VVUkwpIHx8XG4gICAgICAgICAgICB0aGlzLmJsYWNrbGlzdC5oYXMocmVxdWVzdC5zb3VyY2VHRCkpO1xuICB9XG5cbiAgaXNEb21haW5JbkJsYWNrbGlzdCh1cmwpIHtcbiAgICAvLyBTaG91bGQgYWxsIHRoaXMgZG9tYWluIHN0dWZmIGJlIGV4dHJhY3RlZCBpbnRvIGEgZnVuY3Rpb24/XG4gICAgLy8gV2h5IGlzIENsaXF6VXRpbHMuZGV0RGV0YWlsc0Zyb21Vcmwgbm90IHVzZWQ/XG4gICAgY29uc3QgdXJsUGFydHMgPSBVUkxJbmZvLmdldCh1cmwpO1xuICAgIGxldCBob3N0bmFtZSA9IHVybFBhcnRzLmhvc3RuYW1lO1xuICAgIGlmIChob3N0bmFtZS5zdGFydHNXaXRoKCd3d3cuJykpIHtcbiAgICAgIGhvc3RuYW1lID0gaG9zdG5hbWUuc3Vic3RyaW5nKDQpO1xuICAgIH1cblxuICAgIHJldHVybiB0aGlzLmJsYWNrbGlzdC5oYXMoaG9zdG5hbWUpO1xuICB9XG5cbiAgaXNVcmxJbkJsYWNrbGlzdCh1cmwpIHtcbiAgICByZXR1cm4gdGhpcy5ibGFja2xpc3QuaGFzKHVybCk7XG4gIH1cblxuICBsb2dBY3Rpb25IVyh1cmwsIGFjdGlvbiwgZG9tYWluKSB7XG4gICAgbGV0IHR5cGUgPSAndXJsJztcbiAgICBpZiAoZG9tYWluKSB7XG4gICAgICB0eXBlID0gJ2RvbWFpbic7XG4gICAgfVxuICAgIGlmICghQ2xpcXpIdW1hbldlYi5zdGF0ZS52W3VybF0uYWRibG9ja2VyX2JsYWNrbGlzdCkge1xuICAgICAgQ2xpcXpIdW1hbldlYi5zdGF0ZS52W3VybF0uYWRibG9ja2VyX2JsYWNrbGlzdCA9IHt9O1xuICAgIH1cbiAgICBDbGlxekh1bWFuV2ViLnN0YXRlLnZbdXJsXS5hZGJsb2NrZXJfYmxhY2tsaXN0W2FjdGlvbl0gPSB0eXBlO1xuICB9XG5cbiAgdG9nZ2xlVXJsKHVybCwgZG9tYWluKSB7XG4gICAgbGV0IHByb2Nlc3NlZFVSTCA9IHVybDtcbiAgICBpZiAoZG9tYWluKSB7XG4gICAgICAvLyBTaG91bGQgYWxsIHRoaXMgZG9tYWluIHN0dWZmIGJlIGV4dHJhY3RlZCBpbnRvIGEgZnVuY3Rpb24/XG4gICAgICAvLyBXaHkgaXMgQ2xpcXpVdGlscy5nZXREZXRhaWxzRnJvbVVybCBub3QgdXNlZD9cbiAgICAgIHByb2Nlc3NlZFVSTCA9IFVSTEluZm8uZ2V0KHVybCkuaG9zdG5hbWU7XG4gICAgICBpZiAocHJvY2Vzc2VkVVJMLnN0YXJ0c1dpdGgoJ3d3dy4nKSkge1xuICAgICAgICBwcm9jZXNzZWRVUkwgPSBwcm9jZXNzZWRVUkwuc3Vic3RyaW5nKDQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNvbnN0IGV4aXN0SFcgPSBDbGlxekh1bWFuV2ViICYmIENsaXF6SHVtYW5XZWIuc3RhdGUudlt1cmxdO1xuICAgIGlmICh0aGlzLmJsYWNrbGlzdC5oYXMocHJvY2Vzc2VkVVJMKSkge1xuICAgICAgdGhpcy5ibGFja2xpc3QuZGVsZXRlKHByb2Nlc3NlZFVSTCk7XG4gICAgICAvLyBUT0RPOiBJdCdzIGJldHRlciB0byBoYXZlIGFuIEFQSSBmcm9tIGh1bWFud2ViIHRvIGluZGljYXRlIGlmIGEgdXJsIGlzIHByaXZhdGVcbiAgICAgIGlmIChleGlzdEhXKSB7XG4gICAgICAgIHRoaXMubG9nQWN0aW9uSFcodXJsLCAncmVtb3ZlJywgZG9tYWluKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5ibGFja2xpc3QuYWRkKHByb2Nlc3NlZFVSTCk7XG4gICAgICBpZiAoZXhpc3RIVykge1xuICAgICAgICB0aGlzLmxvZ0FjdGlvbkhXKHVybCwgJ2FkZCcsIGRvbWFpbik7XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5wZXJzaXN0QmxhY2tsaXN0KCk7XG4gIH1cblxuICAvKiBAcGFyYW0ge3dlYnJlcXVlc3QtY29udGV4dH0gaHR0cENvbnRleHQgLSBDb250ZXh0IG9mIHRoZSByZXF1ZXN0XG4gICAqL1xuICBtYXRjaChodHRwQ29udGV4dCkge1xuICAgIC8vIENoZWNrIGlmIHRoZSBhZGJsb2NrZXIgaXMgaW5pdGlhbGl6ZWRcbiAgICBpZiAoIXRoaXMuaW5pdGlhbGl6ZWQpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAvLyBQcm9jZXNzIGVuZHBvaW50IFVSTFxuICAgIGNvbnN0IHVybCA9IGh0dHBDb250ZXh0LnVybC50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHVybFBhcnRzID0gVVJMSW5mby5nZXQodXJsKTtcbiAgICBsZXQgaG9zdG5hbWUgPSB1cmxQYXJ0cy5ob3N0bmFtZTtcbiAgICBpZiAoaG9zdG5hbWUuc3RhcnRzV2l0aCgnd3d3LicpKSB7XG4gICAgICBob3N0bmFtZSA9IGhvc3RuYW1lLnN1YnN0cmluZyg0KTtcbiAgICB9XG4gICAgY29uc3QgaG9zdEdEID0gZ2V0R2VuZXJhbERvbWFpbihob3N0bmFtZSk7XG5cbiAgICAvLyBQcm9jZXNzIHNvdXJjZSB1cmxcbiAgICBjb25zdCBzb3VyY2VVUkwgPSBodHRwQ29udGV4dC5nZXRTb3VyY2VVUkwoKS50b0xvd2VyQ2FzZSgpO1xuICAgIGNvbnN0IHNvdXJjZVBhcnRzID0gVVJMSW5mby5nZXQoc291cmNlVVJMKTtcbiAgICBsZXQgc291cmNlSG9zdG5hbWUgPSBzb3VyY2VQYXJ0cy5ob3N0bmFtZTtcbiAgICBpZiAoc291cmNlSG9zdG5hbWUuc3RhcnRzV2l0aCgnd3d3LicpKSB7XG4gICAgICBzb3VyY2VIb3N0bmFtZSA9IHNvdXJjZUhvc3RuYW1lLnN1YnN0cmluZyg0KTtcbiAgICB9XG4gICAgY29uc3Qgc291cmNlR0QgPSBnZXRHZW5lcmFsRG9tYWluKHNvdXJjZUhvc3RuYW1lKTtcblxuICAgIC8vIFdyYXAgaW5mb3JtYXRpb25zIG5lZWRlZCB0byBtYXRjaCB0aGUgcmVxdWVzdFxuICAgIGNvbnN0IHJlcXVlc3QgPSB7XG4gICAgICAvLyBSZXF1ZXN0XG4gICAgICB1cmwsXG4gICAgICBjcHQ6IGh0dHBDb250ZXh0LmdldENvbnRlbnRQb2xpY3lUeXBlKCksXG4gICAgICAvLyBTb3VyY2VcbiAgICAgIHNvdXJjZVVSTCxcbiAgICAgIHNvdXJjZUhvc3RuYW1lLFxuICAgICAgc291cmNlR0QsXG4gICAgICAvLyBFbmRwb2ludFxuICAgICAgaG9zdG5hbWUsXG4gICAgICBob3N0R0QsXG4gICAgfTtcblxuICAgIGxvZyhgbWF0Y2ggJHtKU09OLnN0cmluZ2lmeShyZXF1ZXN0KX1gKTtcblxuICAgIGNvbnN0IHQwID0gRGF0ZS5ub3coKTtcbiAgICBjb25zdCBpc0FkID0gdGhpcy5pc0luQmxhY2tsaXN0KHJlcXVlc3QpID8gZmFsc2UgOiB0aGlzLmNhY2hlLmdldChyZXF1ZXN0KTtcbiAgICBjb25zdCB0b3RhbFRpbWUgPSBEYXRlLm5vdygpIC0gdDA7XG5cbiAgICBsb2coYEJMT0NLIEFEICR7SlNPTi5zdHJpbmdpZnkoe1xuICAgICAgdGltZUFkRmlsdGVyOiB0b3RhbFRpbWUsXG4gICAgICBpc0FkRmlsdGVyOiBpc0FkLFxuICAgICAgY29udGV4dDoge1xuICAgICAgICB1cmw6IGh0dHBDb250ZXh0LnVybCxcbiAgICAgICAgc291cmNlOiBodHRwQ29udGV4dC5nZXRTb3VyY2VVUkwoKSxcbiAgICAgICAgY3B0OiBodHRwQ29udGV4dC5nZXRDb250ZW50UG9saWN5VHlwZSgpLFxuICAgICAgICBtZXRob2Q6IGh0dHBDb250ZXh0Lm1ldGhvZCxcbiAgICAgIH0sXG4gICAgfSl9YCk7XG5cbiAgICByZXR1cm4gaXNBZDtcbiAgfVxufVxuXG5jb25zdCBDbGlxekFEQiA9IHtcbiAgYWRibG9ja0luaXRpYWxpemVkOiBmYWxzZSxcbiAgYWRiTWVtOiB7fSxcbiAgYWRiU3RhdHM6IHsgcGFnZXM6IHt9IH0sXG4gIG11dGF0aW9uTG9nZ2VyOiBudWxsLFxuICBhZGJEZWJ1ZzogZmFsc2UsXG4gIE1JTl9CUk9XU0VSX1ZFUlNJT046IDM1LFxuICB0aW1lcnM6IFtdLFxuXG4gIGluaXQoKSB7XG4gICAgLy8gU2V0IGBjbGlxei1hZGJgIGRlZmF1bHQgdG8gJ0Rpc2FibGVkJ1xuICAgIGlmIChDbGlxelV0aWxzLmdldFByZWYoQURCX1BSRUYsIHVuZGVmaW5lZCkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKEFEQl9QUkVGLCBBREJfUFJFRl9WQUxVRVMuRGlzYWJsZWQpO1xuICAgIH1cblxuICAgIENsaXF6QURCLmFkQmxvY2tlciA9IG5ldyBBZEJsb2NrZXIoKTtcblxuICAgIGNvbnN0IGluaXRBZEJsb2NrZXIgPSAoKSA9PiB7XG4gICAgICAvL0NvbnRlbnRQb2xpY3kuaW5pdCgpO1xuICAgICAgLy9DbGlxekFEQi5jcCA9IENvbnRlbnRQb2xpY3k7XG4gICAgICAvL0NsaXF6QURCLm11dGF0aW9uTG9nZ2VyID0gbmV3IE11dGF0aW9uTG9nZ2VyKCk7XG4gICAgICBDbGlxekFEQi5hZEJsb2NrZXIuaW5pdCgpO1xuICAgICAgQ2xpcXpBREIuYWRibG9ja0luaXRpYWxpemVkID0gdHJ1ZTtcbiAgICAgIENsaXF6QURCLmluaXRQYWNlbWFrZXIoKTtcbiAgICAgIFdlYlJlcXVlc3Qub25CZWZvcmVSZXF1ZXN0LmFkZExpc3RlbmVyKFxuICAgICAgICBDbGlxekFEQi5odHRwb3Blbk9ic2VydmVyLm9ic2VydmUsXG4gICAgICAgIHVuZGVmaW5lZCxcbiAgICAgICAgWydibG9ja2luZyddXG4gICAgICApO1xuICAgIH07XG5cbiAgICBpZiAoYWRiRW5hYmxlZCgpKSB7XG4gICAgICBpbml0QWRCbG9ja2VyKCk7XG4gICAgfSBlbHNlIHtcbiAgICAgIGV2ZW50cy5zdWIoJ3ByZWZjaGFuZ2UnLCBwcmVmID0+IHtcbiAgICAgICAgaWYgKHByZWYgPT09IEFEQl9QUkVGICYmXG4gICAgICAgICAgICAhQ2xpcXpBREIuYWRibG9ja0luaXRpYWxpemVkICYmXG4gICAgICAgICAgICBhZGJFbmFibGVkKCkpIHtcbiAgICAgICAgICBpbml0QWRCbG9ja2VyKCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICB1bmxvYWQoKSB7XG4gICAgQ2xpcXpBREIudW5sb2FkUGFjZW1ha2VyKCk7XG4gICAgYnJvd3Nlci5mb3JFYWNoV2luZG93KENsaXF6QURCLnVubG9hZFdpbmRvdyk7XG4gICAgV2ViUmVxdWVzdC5vbkJlZm9yZVJlcXVlc3QucmVtb3ZlTGlzdGVuZXIoQ2xpcXpBREIuaHR0cG9wZW5PYnNlcnZlci5vYnNlcnZlKTtcbiAgICBDb250ZW50UG9saWN5LnVubG9hZCgpO1xuICB9LFxuXG4gIGluaXRXaW5kb3cod2luZG93KSB7XG4gICAgaWYgKENsaXF6QURCLm11dGF0aW9uTG9nZ2VyICE9PSBudWxsKSB7XG4gICAgICB3aW5kb3cuZ0Jyb3dzZXIuYWRkUHJvZ3Jlc3NMaXN0ZW5lcihDbGlxekFEQi5tdXRhdGlvbkxvZ2dlcik7XG4gICAgfVxuICB9LFxuXG4gIHVubG9hZFdpbmRvdyh3aW5kb3cpIHtcbiAgICBpZiAod2luZG93LmdCcm93c2VyICYmIENsaXF6QURCLm11dGF0aW9uTG9nZ2VyICE9PSBudWxsKSB7XG4gICAgICB3aW5kb3cuZ0Jyb3dzZXIucmVtb3ZlUHJvZ3Jlc3NMaXN0ZW5lcihDbGlxekFEQi5tdXRhdGlvbkxvZ2dlcik7XG4gICAgfVxuICB9LFxuXG4gIGluaXRQYWNlbWFrZXIoKSB7XG4gICAgY29uc3QgdDEgPSB1dGlscy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICBPYmplY3Qua2V5cyhDbGlxekFEQi5hZGJTdGF0cy5wYWdlcykuZm9yRWFjaCh1cmwgPT4ge1xuICAgICAgICBpZiAoIUNsaXF6QURCLmlzVGFiVVJMW3VybF0pIHtcbiAgICAgICAgICBkZWxldGUgQ2xpcXpBREIuYWRiU3RhdHMucGFnZXNbdXJsXTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gICAgfSwgMTAgKiA2MCAqIDEwMDApO1xuICAgIENsaXF6QURCLnRpbWVycy5wdXNoKHQxKTtcblxuICAgIGNvbnN0IHQyID0gdXRpbHMuc2V0SW50ZXJ2YWwoKCkgPT4ge1xuICAgICAgaWYgKCFDbGlxekFEQi5jYWNoZUFEQikge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBPYmplY3Qua2V5cyhDbGlxekFEQi5jYWNoZUFEQikuZm9yRWFjaCh0ID0+IHtcbiAgICAgICAgaWYgKCFicm93c2VyLmlzV2luZG93QWN0aXZlKHQpKSB7XG4gICAgICAgICAgZGVsZXRlIENsaXF6QURCLmNhY2hlQURCW3RdO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9LCAxMCAqIDYwICogMTAwMCk7XG4gICAgQ2xpcXpBREIudGltZXJzLnB1c2godDIpO1xuICB9LFxuXG4gIHVubG9hZFBhY2VtYWtlcigpIHtcbiAgICBDbGlxekFEQi50aW1lcnMuZm9yRWFjaCh1dGlscy5jbGVhclRpbWVvdXQpO1xuICB9LFxuXG4gIGh0dHBvcGVuT2JzZXJ2ZXI6IHtcbiAgICBvYnNlcnZlKHJlcXVlc3REZXRhaWxzKSB7XG4gICAgICBpZiAoIWFkYkVuYWJsZWQoKSkge1xuICAgICAgICByZXR1cm4ge307XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IHJlcXVlc3RDb250ZXh0ID0gbmV3IEh0dHBSZXF1ZXN0Q29udGV4dChyZXF1ZXN0RGV0YWlscyk7XG4gICAgICBjb25zdCB1cmwgPSByZXF1ZXN0Q29udGV4dC51cmw7XG5cbiAgICAgIGlmICghdXJsKSB7XG4gICAgICAgIHJldHVybiB7fTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgdXJsUGFydHMgPSBVUkxJbmZvLmdldCh1cmwpO1xuXG4gICAgICBpZiAocmVxdWVzdENvbnRleHQuaXNGdWxsUGFnZSgpKSB7XG4gICAgICAgIENsaXF6QURCLmFkYlN0YXRzLnBhZ2VzW3VybF0gPSAwO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBzb3VyY2VVcmwgPSByZXF1ZXN0Q29udGV4dC5nZXRMb2FkaW5nRG9jdW1lbnQoKTtcbiAgICAgIGxldCBzb3VyY2VVcmxQYXJ0cyA9IG51bGw7XG4gICAgICBjb25zdCBzb3VyY2VUYWIgPSByZXF1ZXN0Q29udGV4dC5nZXRPcmlnaW5XaW5kb3dJRCgpO1xuXG4gICAgICBpZiAoIXNvdXJjZVVybCB8fCBzb3VyY2VVcmwuc3RhcnRzV2l0aCgnYWJvdXQ6JykpIHtcbiAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgfVxuXG4gICAgICBzb3VyY2VVcmxQYXJ0cyA9IFVSTEluZm8uZ2V0KHNvdXJjZVVybCk7XG5cbiAgICAgIC8vIHNhbWUgZ2VuZXJhbCBkb21haW5cbiAgICAgIGNvbnN0IHNhbWVHZCA9IHNhbWVHZW5lcmFsRG9tYWluKHVybFBhcnRzLmhvc3RuYW1lLCBzb3VyY2VVcmxQYXJ0cy5ob3N0bmFtZSkgfHwgZmFsc2U7XG4gICAgICBpZiAoc2FtZUdkKSB7XG4gICAgICAgIGNvbnN0IHdPcmkgPSByZXF1ZXN0Q29udGV4dC5nZXRPcmlnaW5XaW5kb3dJRCgpO1xuICAgICAgICBjb25zdCB3T3V0ID0gcmVxdWVzdENvbnRleHQuZ2V0T3V0ZXJXaW5kb3dJRCgpO1xuICAgICAgICBpZiAod09yaSAhPT0gd091dCkgeyAvLyByZXF1ZXN0IGZyb20gaWZyYW1lXG4gICAgICAgICAgLy8gY29uc3Qgd20gPSBDb21wb25lbnRzLmNsYXNzZXNbJ0Btb3ppbGxhLm9yZy9hcHBzaGVsbC93aW5kb3ctbWVkaWF0b3I7MSddXG4gICAgICAgICAgLy8gICAuZ2V0U2VydmljZShDb21wb25lbnRzLmludGVyZmFjZXMubnNJV2luZG93TWVkaWF0b3IpO1xuICAgICAgICAgIC8vIGNvbnN0IGZyYW1lID0gd20uZ2V0T3V0ZXJXaW5kb3dXaXRoSWQod091dCkuZnJhbWVFbGVtZW50O1xuXG4gICAgICAgICAgLy8gaWYgKGFkYkVuYWJsZWQoKSAmJiBDbGlxekFEQi5hZEJsb2NrZXIubWF0Y2gocmVxdWVzdENvbnRleHQpKSB7XG4gICAgICAgICAgLy8gICBmcmFtZS5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnOyAgLy8gaGlkZSB0aGlzIG5vZGVcbiAgICAgICAgICAvLyAgIENsaXF6QURCLmFkYlN0YXRzLnBhZ2VzW3NvdXJjZVVybF0gPSAoQ2xpcXpBREIuYWRiU3RhdHMucGFnZXNbc291cmNlVXJsXSB8fCAwKSArIDE7XG5cbiAgICAgICAgICAvLyAgIGZyYW1lLnNldEF0dHJpYnV0ZSgnY2xpcXotYWRiJywgYHNvdXJjZTogJHt1cmx9YCk7XG4gICAgICAgICAgLy8gICByZXR1cm4geyBjYW5jZWw6IHRydWUgfTtcbiAgICAgICAgICAvLyB9XG4gICAgICAgICAgLy9mcmFtZS5zZXRBdHRyaWJ1dGUoJ2NsaXF6LWFkYmxvY2tlcicsICdzYWZlJyk7XG4gICAgICAgICAgaWYgKGFkYkVuYWJsZWQoKSAmJiBDbGlxekFEQi5hZEJsb2NrZXIubWF0Y2gocmVxdWVzdENvbnRleHQpKSB7XG4gICAgICAgICAgICByZXR1cm4geyBjYW5jZWw6IHRydWUgfTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgfSBlbHNlIGlmIChhZGJFbmFibGVkKCkpIHtcbiAgICAgICAgaWYgKENsaXF6QURCLm11dGF0aW9uTG9nZ2VyICYmIENsaXF6QURCLm11dGF0aW9uTG9nZ2VyLnRhYnNJbmZvW3NvdXJjZVRhYl0gJiZcbiAgICAgICAgICAgICFDbGlxekFEQi5tdXRhdGlvbkxvZ2dlci50YWJzSW5mb1tzb3VyY2VUYWJdLm9ic2VydmVyQWRkZWQpIHtcbiAgICAgICAgICBDbGlxekFEQi5tdXRhdGlvbkxvZ2dlci5hZGRNdXRhdGlvbk9ic2VydmVyKHNvdXJjZVRhYik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKENsaXF6QURCLmFkQmxvY2tlci5tYXRjaChyZXF1ZXN0Q29udGV4dCkpIHtcbiAgICAgICAgICAvL2hpZGVOb2RlcyhyZXF1ZXN0Q29udGV4dCk7XG4gICAgICAgICAgcmV0dXJuIHsgY2FuY2VsOiB0cnVlIH07XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHt9O1xuICAgIH0sXG4gIH0sXG4gIGdldEJyb3dzZXJNYWpvclZlcnNpb24oKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IGFwcEluZm8gPSBDb21wb25lbnRzLmNsYXNzZXNbJ0Btb3ppbGxhLm9yZy94cmUvYXBwLWluZm87MSddXG4gICAgICAgICAgICAgICAgICAgICAgLmdldFNlcnZpY2UoQ29tcG9uZW50cy5pbnRlcmZhY2VzLm5zSVhVTEFwcEluZm8pO1xuICAgICAgcmV0dXJuIHBhcnNlSW50KGFwcEluZm8udmVyc2lvbi5zcGxpdCgnLicpWzBdLCAxMCk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICByZXR1cm4gMTAwO1xuICAgIH1cbiAgfSxcbiAgaXNUYWJVUkwodXJsKSB7XG4gICAgdHJ5IHtcbiAgICAgIGNvbnN0IHdtID0gQ29tcG9uZW50cy5jbGFzc2VzWydAbW96aWxsYS5vcmcvYXBwc2hlbGwvd2luZG93LW1lZGlhdG9yOzEnXVxuICAgICAgICAgICAgICAgIC5nZXRTZXJ2aWNlKENvbXBvbmVudHMuaW50ZXJmYWNlcy5uc0lXaW5kb3dNZWRpYXRvcik7XG4gICAgICBjb25zdCBicm93c2VyRW51bWVyYXRvciA9IHdtLmdldEVudW1lcmF0b3IoJ25hdmlnYXRvcjpicm93c2VyJyk7XG5cbiAgICAgIHdoaWxlIChicm93c2VyRW51bWVyYXRvci5oYXNNb3JlRWxlbWVudHMoKSkge1xuICAgICAgICBjb25zdCBicm93c2VyV2luID0gYnJvd3NlckVudW1lcmF0b3IuZ2V0TmV4dCgpO1xuICAgICAgICBjb25zdCB0YWJicm93c2VyID0gYnJvd3Nlcldpbi5nQnJvd3NlcjtcblxuICAgICAgICBjb25zdCBudW1UYWJzID0gdGFiYnJvd3Nlci5icm93c2Vycy5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBudW1UYWJzOyBpbmRleCsrKSB7XG4gICAgICAgICAgY29uc3QgY3VycmVudEJyb3dzZXIgPSB0YWJicm93c2VyLmdldEJyb3dzZXJBdEluZGV4KGluZGV4KTtcbiAgICAgICAgICBpZiAoY3VycmVudEJyb3dzZXIpIHtcbiAgICAgICAgICAgIGNvbnN0IHRhYlVSTCA9IGN1cnJlbnRCcm93c2VyLmN1cnJlbnRVUkkuc3BlYztcbiAgICAgICAgICAgIGlmICh1cmwgPT09IHRhYlVSTCB8fCB1cmwgPT09IHRhYlVSTC5zcGxpdCgnIycpWzBdKSB7XG4gICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IENsaXF6QURCO1xuIl19