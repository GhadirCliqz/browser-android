System.register("platform/environment", [], function (_export) {
  //TODO: get rid of me!
  "use strict";

  var lastSucceededUrl, latestUrl, TEMPLATES, CLIQZEnvironment;
  return {
    setters: [],
    execute: function () {

      // END TEMP
      TEMPLATES = Object.freeze(Object.assign(Object.create(null), {
        "Cliqz": true,
        "EZ-category": true,
        "EZ-history": true,
        "calculator": true,
        "celebrities": true,
        "conversations": true,
        "favorites": true,
        "currency": true,
        "emphasis": true,
        "empty": true,
        "entity-news-1": true,
        "entity-search-1": true,
        "flightStatusEZ-2": true,
        "generic": true,
        "history": true,
        "ligaEZ1Game": true,
        "ligaEZTable": true,
        "ligaEZUpcomingGames": true,
        "local-cinema-sc": true,
        "local-data-sc": true,
        "local-movie-sc": true,
        "logo": true,
        "main": true,
        "noResult": true,
        "rd-h3-w-rating": true,
        "results": true,
        "stocks": true,
        "topnews": true,
        "topsites": true,
        "url": true,
        "weatherAlert": true,
        "weatherEZ": true,
        "liveTicker": true
      }));
      CLIQZEnvironment = {
        BRANDS_DATA_URL: 'static/brands_database.json',
        TEMPLATES_PATH: 'mobile-ui/templates/',
        LOCALE_PATH: 'static/locale/',
        SYSTEM_BASE_URL: './',
        RESULTS_LIMIT: 3,
        MIN_QUERY_LENGHT_FOR_EZ: 0,
        RERANKERS: [],
        TEMPLATES: TEMPLATES,
        KNOWN_TEMPLATES: {
          'entity-portal': true,
          'entity-generic': true,
          'entity-video-1': true,
          'recipe': true,
          'ez-generic-2': true,
          'vod': true
        },
        PARTIALS: ['url', 'logo', 'EZ-category', 'EZ-history', 'rd-h3-w-rating', 'pattern-h1'],
        GOOGLE_ENGINE: { name: 'Google', url: 'http://www.google.com/search?q=' },
        log: function log(msg, key) {
          console.log('[[' + key + ']]', msg);
        },
        //TODO: check if calling the bridge for each telemetry point is expensive or not
        telemetry: function telemetry(msg) {
          msg.ts = Date.now();
          osAPI.pushTelemetry(msg);
        },
        isUnknownTemplate: function isUnknownTemplate(template) {
          // in case an unknown template is required
          return template && !CLIQZEnvironment.TEMPLATES[template] && !CLIQZEnvironment.KNOWN_TEMPLATES.hasOwnProperty(template);
        },
        getBrandsDBUrl: function getBrandsDBUrl(version) {
          //TODO - consider the version !!
          return 'static/brands_database.json';
        },
        // TODO - SHOUD BE MOVED TO A LOGIC MODULE
        autoComplete: function autoComplete(val, searchString) {

          if (val && val.length > 0) {
            val = val.replace(/http([s]?):\/\/(www.)?/, '');
            val = val.toLowerCase();
            var urlbarValue = CLIQZEnvironment.lastSearch.toLowerCase();

            if (val.indexOf(urlbarValue) === 0) {
              // CliqzUtils.log('jsBridge autocomplete value:'+val,'osAPI1');
              osAPI.autocomplete(val);
            } else {
              var ls = JSON.parse(CLIQZEnvironment.getLocalStorage().recentQueries || '[]');
              for (var i in ls) {
                if (ls[i].query.toLowerCase().indexOf(searchString.toLowerCase()) === 0) {
                  osAPI.autocomplete(ls[i].query.toLowerCase());
                  break;
                }
              }
            }
          }
        },
        // TODO - SHOUD BE MOVED TO A LOGIC MODULE
        putHistoryFirst: function putHistoryFirst(r) {
          var history = [],
              backend = [];
          r._results.forEach(function (res) {
            if (res.style === 'cliqz-pattern' || res.style === 'favicon') {
              history.push(res);
            } else {
              backend.push(res);
            }
          });
          r._results = history.concat(backend);
        },
        resultsHandler: function resultsHandler(r) {

          if (CLIQZEnvironment.lastSearch !== r._searchString) {
            CliqzUtils.log("u='" + CLIQZEnvironment.lastSearch + "'' s='" + r._searchString + "', returning", "urlbar!=search");
            return;
          }

          CLIQZEnvironment.putHistoryFirst(r);

          r._results.splice(CLIQZEnvironment.RESULTS_LIMIT);

          var renderedResults = CLIQZ.UI.renderResults(r);

          renderedResults[0] && CLIQZEnvironment.autoComplete(renderedResults[0].url, r._searchString);
        },
        search: function search(e, location_enabled, latitude, longitude) {
          if (!e || e === '') {
            // should be moved to UI except 'CLIQZEnvironment.initHomepage(true);'
            CLIQZEnvironment.lastSearch = '';
            CLIQZ.UI.hideResultsBox();
            window.document.getElementById('startingpoint').style.display = 'block';
            CLIQZEnvironment.initHomepage(true);
            CLIQZ.UI.stopProgressBar();
            CLIQZ.UI.lastResults = null;
            return;
          }

          CLIQZEnvironment.setCurrentQuery(e);

          e = e.toLowerCase().trim();

          CLIQZEnvironment.lastSearch = e;
          CLIQZEnvironment.location_enabled = location_enabled;
          if (location_enabled) {
            CLIQZEnvironment.USER_LAT = latitude;
            CLIQZEnvironment.USER_LNG = longitude;
          } else {
            delete CLIQZEnvironment.USER_LAT;
            delete CLIQZEnvironment.USER_LNG;
          }

          window.document.getElementById('startingpoint').style.display = 'none';

          CLIQZ.UI.startProgressBar();

          // start XHR call ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
          //CliqzUtils.log(e,'XHR');
          new CliqzAutocomplete.CliqzResults().search(e, CLIQZEnvironment.resultsHandler);
        },
        getPref: function getPref(pref, notFound) {
          var mypref;
          if (mypref = CLIQZEnvironment.getLocalStorage().getItem(pref)) {
            return mypref;
          } else {
            return notFound;
          }
        },
        setPref: function setPref(pref, val) {
          //CliqzUtils.log('setPrefs',arguments);
          CLIQZEnvironment.getLocalStorage().setItem(pref, val);
        },
        setInterval: (function (_setInterval) {
          function setInterval() {
            return _setInterval.apply(this, arguments);
          }

          setInterval.toString = function () {
            return _setInterval.toString();
          };

          return setInterval;
        })(function () {
          return setInterval.apply(null, arguments);
        }),
        setTimeout: (function (_setTimeout) {
          function setTimeout() {
            return _setTimeout.apply(this, arguments);
          }

          setTimeout.toString = function () {
            return _setTimeout.toString();
          };

          return setTimeout;
        })(function () {
          return setTimeout.apply(null, arguments);
        }),
        clearTimeout: (function (_clearTimeout) {
          function clearTimeout() {
            return _clearTimeout.apply(this, arguments);
          }

          clearTimeout.toString = function () {
            return _clearTimeout.toString();
          };

          return clearTimeout;
        })(function () {
          clearTimeout.apply(null, arguments);
        }),
        Promise: Promise,
        tldExtractor: function tldExtractor(host) {
          //temp
          return host.split('.').splice(-1)[0];
        },
        getLocalStorage: function getLocalStorage(url) {
          return CLIQZEnvironment.storage;
        },
        OS: 'mobile',
        isPrivate: function isPrivate() {
          return false;
        },
        isOnPrivateTab: function isOnPrivateTab(win) {
          return false;
        },
        getWindow: function getWindow() {
          return window;
        },
        httpHandler: function httpHandler(method, url, callback, onerror, timeout, data, sync) {
          latestUrl = url;

          function isMixerUrl(url) {
            return url.indexOf(CliqzUtils.RESULTS_PROVIDER) === 0;
          }

          var req = new XMLHttpRequest();
          req.open(method, url, !sync);
          req.overrideMimeType && req.overrideMimeType('application/json');
          req.onload = function () {
            if (!parseInt) {
              return;
            } //parseInt is not a function after extension disable/uninstall

            var statusClass = parseInt(req.status / 100);
            if (statusClass === 2 || statusClass === 3 || statusClass === 0 /* local files */) {

                if (isMixerUrl(url)) {
                  if (typeof CustomEvent !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('connected'));
                  }
                  lastSucceededUrl = url;
                  CliqzUtils.log('status ' + req.status, 'CLIQZEnvironment.httpHandler.onload');
                }

                callback && callback(req);
              } else {
              CliqzUtils.log('loaded with non-200 ' + url + ' (status=' + req.status + ' ' + req.statusText + ')', 'CLIQZEnvironment.httpHandler.onload');
              onerror && onerror();
            }
          };
          req.onerror = function () {
            if (latestUrl !== url || url === lastSucceededUrl || !isMixerUrl(url)) {
              onerror && onerror();
              return;
            }
            if (typeof CustomEvent !== 'undefined') {
              window.dispatchEvent(new CustomEvent('disconnected', { 'detail': 'This could be caused because of request error' }));
            }

            if (CLIQZEnvironment) {
              if (isMixerUrl(url)) {
                setTimeout(CLIQZEnvironment.httpHandler, 500, method, url, callback, onerror, timeout, data, sync);
              }
              CliqzUtils.log('error loading ' + url + ' (status=' + req.status + ' ' + req.statusText + ')', 'CLIQZEnvironment.httpHandler,onerror');
              onerror && onerror();
            }
          };
          req.ontimeout = function () {

            CliqzUtils.log('BEFORE', 'CLIQZEnvironment.httpHandler.ontimeout');
            if (latestUrl !== url || url === lastSucceededUrl || !isMixerUrl(url)) {
              return;
            }
            if (typeof CustomEvent !== 'undefined') {
              window.dispatchEvent(new CustomEvent('disconnected', { 'detail': 'This could be caused because of timed out request' }));
            }

            if (CLIQZEnvironment) {
              //might happen after disabling the extension
              if (isMixerUrl(url)) {
                setTimeout(CLIQZEnvironment.httpHandler, 500, method, url, callback, onerror, timeout, data, sync);
              }
              CliqzUtils.log('resending: timeout for ' + url, 'CLIQZEnvironment.httpHandler.ontimeout');
              onerror && onerror();
            }
          };

          if (callback && !sync) {
            if (timeout) {
              req.timeout = parseInt(timeout);
            } else {
              req.timeout = method === 'POST' ? 10000 : 1000;
            }
          }

          req.send(data);
          return req;
        },
        // TODO - SHOUD BE MOVED TO A LOGIC MODULE
        openLink: function openLink(window, url) {
          if (url !== '#') {
            if (url.indexOf('http') === -1) {
              url = 'http://' + url;
            }
            osAPI.openLink(url);
          }

          return false;
        },
        // TODO - SHOUD BE MOVED TO A LOGIC MODULE
        processHistory: function processHistory(data) {
          try {
            var items = data.results;
            var res = [];
            for (var i in items) {
              var item = items[i];
              res.push({
                style: 'favicon',
                value: item.url,
                image: '',
                comment: typeof item.title !== 'undefined' ? item.title : 'no comment',
                label: ''
              });
            }
            return { results: res, query: data.query, ready: true };
          } catch (e) {
            CliqzUtils.log('Error: ' + e, 'CLIQZEnvironment.processHistory');
          }
        },
        // TODO - SHOUD BE MOVED TO A LOGIC MODULE
        displayHistory: function displayHistory(data) {
          console.log(this, 'bbb');
          CLIQZEnvironment.searchHistoryCallback(CLIQZEnvironment.processHistory(data));
        },
        // TODO - SHOUD BE MOVED TO A LOGIC MODULE
        historySearch: function historySearch(q, callback) {
          CLIQZEnvironment.searchHistoryCallback = callback;
          console.log(this, 'aaa');
          window.osAPI.searchHistory(q, 'CLIQZEnvironment.displayHistory');
        },
        //TODO: remove this dependency
        getSearchEngines: function getSearchEngines() {
          return [];
        },
        //TODO: move this out to CLIQZ utils
        distance: function distance(lon1, lat1, lon2, lat2) {
          /** Converts numeric degrees to radians */
          function degreesToRad(degree) {
            return degree * Math.PI / 180;
          }

          var R = 6371; // Radius of the earth in km
          if (!lon2 || !lon1 || !lat2 || !lat1) {
            return -1;
          }
          var dLat = degreesToRad(lat2 - lat1); // Javascript functions in radians
          var dLon = degreesToRad(lon2 - lon1);
          var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(degreesToRad(lat1)) * Math.cos(degreesToRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          var d = R * c; // Distance in km
          return d;
        },
        // mocked functions
        getEngineByName: function getEngineByName() {
          return '';
        },
        getEngineByAlias: function getEngineByAlias() {
          return '';
        },
        copyResult: function copyResult(val) {
          osAPI.copyResult(val);
        },
        addEventListenerToElements: function addEventListenerToElements(elementSelector, eventType, listener) {
          Array.prototype.slice.call(document.querySelectorAll(elementSelector)).forEach(function (element) {
            element.addEventListener(eventType, listener);
          });
        },

        initHomepage: function initHomepage(hideLastState) {
          if (hideLastState) {
            var start = document.getElementById('resetState');
            start && (start.style.display = 'none');
          }
          osAPI.getTopSites('News.startPageHandler', 15);
        },
        getNoResults: function getNoResults() {
          var engine = CLIQZEnvironment.getDefaultSearchEngine();
          var details = CLIQZEnvironment.getDetailsFromUrl(engine.url);
          var logo = CLIQZEnvironment.getLogoDetails(details);

          var result = CLIQZEnvironment.Result.cliqzExtra({
            data: {
              template: 'noResult',
              title: CLIQZEnvironment.getLocalizedString('mobile_no_result_title'),
              action: CLIQZEnvironment.getLocalizedString('mobile_no_result_action', engine.name),
              searchString: encodeURIComponent(CLIQZEnvironment.lastSearch),
              searchEngineUrl: engine.url,
              logo: logo,
              background: logo.backgroundColor
            },
            subType: JSON.stringify({ empty: true })
          });
          result.data.kind = ['CL'];
          return result;
        },
        setDefaultSearchEngine: function setDefaultSearchEngine(engine) {
          CLIQZEnvironment.getLocalStorage().setObject('defaultSearchEngine', engine);
        },
        getDefaultSearchEngine: function getDefaultSearchEngine() {
          return CLIQZEnvironment.getLocalStorage().getObject('defaultSearchEngine') || CLIQZEnvironment.GOOGLE_ENGINE;
        }
      };

      CLIQZEnvironment.setCurrentQuery = function (query) {

        if (CLIQZEnvironment.getPref('incognito') === "true" || query.match(/http[s]{0,1}:/)) {
          return;
        }

        var recentItems = CLIQZEnvironment.getLocalStorage().getObject('recentQueries', []);

        if (!recentItems[0]) {
          recentItems = [{ id: 1, query: query, timestamp: Date.now() }];
          CLIQZEnvironment.getLocalStorage().setObject('recentQueries', recentItems);
        } else if (recentItems[0].query === query && Date.now() - recentItems[0].timestamp < 10 * 1000 * 60) {
          // DO NOTHING
          // temporary work around repetitive queries coming from iOS
        } else if (recentItems[0].query.indexOf(query) + query.indexOf(recentItems[0].query) > -2 && Date.now() - recentItems[0].timestamp < 5 * 1000) {
            recentItems[0] = { id: recentItems[0].id, query: query, timestamp: Date.now() };
            CLIQZEnvironment.getLocalStorage().setObject('recentQueries', recentItems);
          } else {
            recentItems.unshift({ id: recentItems[0].id + 1, query: query, timestamp: Date.now() });
            recentItems = recentItems.slice(0, 60);
            CLIQZEnvironment.getLocalStorage().setObject('recentQueries', recentItems);
          }
      };

      _export("default", CLIQZEnvironment);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,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QUFDLENBQUMsQ0FBQyxTQUFTLEdBQUcsRUFBRSxHQUFHLElBQUksR0FBRyxFQUFFLEVBQUU7OztTQUdwRyxNQUFNLElBQUcsV0FBVyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQ2hGLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxHQUFHLENBQUMsR0FBRyxJQUFJLEVBQUU7QUFDeEQsdUJBQVcsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFDLEVBQUUsRUFBRSxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLEtBQUssRUFBQyxLQUFLLEVBQUUsU0FBUyxFQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBQyxDQUFDO0FBQzVFLDRCQUFnQixDQUFDLGVBQWUsRUFBRSxDQUFDLFNBQVMsQ0FBQyxlQUFlLEVBQUUsV0FBVyxDQUFDLENBQUM7V0FDNUUsTUFDSTtBQUNILHVCQUFXLENBQUMsT0FBTyxDQUFDLEVBQUMsRUFBRSxFQUFFLFdBQVcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEtBQUssRUFBQyxLQUFLLEVBQUMsU0FBUyxFQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsRUFBQyxDQUFDLENBQUM7QUFDbkYsdUJBQVcsR0FBRyxXQUFXLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBQyxFQUFFLENBQUMsQ0FBQztBQUN0Qyw0QkFBZ0IsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxTQUFTLENBQUMsZUFBZSxFQUFFLFdBQVcsQ0FBQyxDQUFDO1dBQzVFO09BQ0YsQ0FBQzs7eUJBRWEsZ0JBQWdCIiwiZmlsZSI6ImVudmlyb25tZW50LmVzIiwic291cmNlc0NvbnRlbnQiOlsiLy9UT0RPOiBnZXQgcmlkIG9mIG1lIVxudmFyIGxhc3RTdWNjZWVkZWRVcmw7XG52YXIgbGF0ZXN0VXJsO1xuXG4vLyBFTkQgVEVNUFxuY29uc3QgVEVNUExBVEVTID0gT2JqZWN0LmZyZWV6ZShPYmplY3QuYXNzaWduKE9iamVjdC5jcmVhdGUobnVsbCksIHtcbiAgXCJDbGlxelwiOiB0cnVlLFxuICBcIkVaLWNhdGVnb3J5XCI6IHRydWUsXG4gIFwiRVotaGlzdG9yeVwiOiB0cnVlLFxuICBcImNhbGN1bGF0b3JcIjogdHJ1ZSxcbiAgXCJjZWxlYnJpdGllc1wiOiB0cnVlLFxuICBcImNvbnZlcnNhdGlvbnNcIjogdHJ1ZSxcbiAgXCJmYXZvcml0ZXNcIjogdHJ1ZSxcbiAgXCJjdXJyZW5jeVwiOiB0cnVlLFxuICBcImVtcGhhc2lzXCI6IHRydWUsXG4gIFwiZW1wdHlcIjogdHJ1ZSxcbiAgXCJlbnRpdHktbmV3cy0xXCI6IHRydWUsXG4gIFwiZW50aXR5LXNlYXJjaC0xXCI6IHRydWUsXG4gIFwiZmxpZ2h0U3RhdHVzRVotMlwiOiB0cnVlLFxuICBcImdlbmVyaWNcIjogdHJ1ZSxcbiAgXCJoaXN0b3J5XCI6IHRydWUsXG4gIFwibGlnYUVaMUdhbWVcIjogdHJ1ZSxcbiAgXCJsaWdhRVpUYWJsZVwiOiB0cnVlLFxuICBcImxpZ2FFWlVwY29taW5nR2FtZXNcIjogdHJ1ZSxcbiAgXCJsb2NhbC1jaW5lbWEtc2NcIjogdHJ1ZSxcbiAgXCJsb2NhbC1kYXRhLXNjXCI6IHRydWUsXG4gIFwibG9jYWwtbW92aWUtc2NcIjogdHJ1ZSxcbiAgXCJsb2dvXCI6IHRydWUsXG4gIFwibWFpblwiOiB0cnVlLFxuICBcIm5vUmVzdWx0XCI6IHRydWUsXG4gIFwicmQtaDMtdy1yYXRpbmdcIjogdHJ1ZSxcbiAgXCJyZXN1bHRzXCI6IHRydWUsXG4gIFwic3RvY2tzXCI6IHRydWUsXG4gIFwidG9wbmV3c1wiOiB0cnVlLFxuICBcInRvcHNpdGVzXCI6IHRydWUsXG4gIFwidXJsXCI6IHRydWUsXG4gIFwid2VhdGhlckFsZXJ0XCI6IHRydWUsXG4gIFwid2VhdGhlckVaXCI6IHRydWUsXG4gIFwibGl2ZVRpY2tlclwiOiB0cnVlXG59KSk7XG5cbnZhciBDTElRWkVudmlyb25tZW50ID0ge1xuICBCUkFORFNfREFUQV9VUkw6ICdzdGF0aWMvYnJhbmRzX2RhdGFiYXNlLmpzb24nLFxuICBURU1QTEFURVNfUEFUSDogJ21vYmlsZS11aS90ZW1wbGF0ZXMvJyxcbiAgTE9DQUxFX1BBVEg6ICdzdGF0aWMvbG9jYWxlLycsXG4gIFNZU1RFTV9CQVNFX1VSTDogJy4vJyxcbiAgUkVTVUxUU19MSU1JVDogMyxcbiAgTUlOX1FVRVJZX0xFTkdIVF9GT1JfRVo6IDAsXG4gIFJFUkFOS0VSUzogW10sXG4gIFRFTVBMQVRFUzogVEVNUExBVEVTLFxuICBLTk9XTl9URU1QTEFURVM6IHtcbiAgICAgICdlbnRpdHktcG9ydGFsJzogdHJ1ZSxcbiAgICAgICdlbnRpdHktZ2VuZXJpYyc6IHRydWUsXG4gICAgICAnZW50aXR5LXZpZGVvLTEnOiB0cnVlLFxuICAgICAgJ3JlY2lwZSc6IHRydWUsXG4gICAgICAnZXotZ2VuZXJpYy0yJzogdHJ1ZSxcbiAgICAgICd2b2QnOiB0cnVlXG4gIH0sXG4gIFBBUlRJQUxTOiBbXG4gICAgICAndXJsJyxcbiAgICAgICdsb2dvJyxcbiAgICAgICdFWi1jYXRlZ29yeScsXG4gICAgICAnRVotaGlzdG9yeScsXG4gICAgICAncmQtaDMtdy1yYXRpbmcnLFxuICAgICAgJ3BhdHRlcm4taDEnXG4gIF0sXG4gIEdPT0dMRV9FTkdJTkU6IHtuYW1lOidHb29nbGUnLCB1cmw6ICdodHRwOi8vd3d3Lmdvb2dsZS5jb20vc2VhcmNoP3E9J30sXG4gIGxvZzogZnVuY3Rpb24obXNnLCBrZXkpe1xuICAgIGNvbnNvbGUubG9nKCdbWycgKyBrZXkgKyAnXV0nLCBtc2cpO1xuICB9LFxuICAvL1RPRE86IGNoZWNrIGlmIGNhbGxpbmcgdGhlIGJyaWRnZSBmb3IgZWFjaCB0ZWxlbWV0cnkgcG9pbnQgaXMgZXhwZW5zaXZlIG9yIG5vdFxuICB0ZWxlbWV0cnk6IGZ1bmN0aW9uKG1zZykge1xuICAgIG1zZy50cyA9IERhdGUubm93KCk7XG4gICAgb3NBUEkucHVzaFRlbGVtZXRyeShtc2cpO1xuICB9LFxuICBpc1Vua25vd25UZW1wbGF0ZTogZnVuY3Rpb24odGVtcGxhdGUpe1xuICAgICAvLyBpbiBjYXNlIGFuIHVua25vd24gdGVtcGxhdGUgaXMgcmVxdWlyZWRcbiAgICAgcmV0dXJuIHRlbXBsYXRlICYmXG4gICAgICAgICAgICAhQ0xJUVpFbnZpcm9ubWVudC5URU1QTEFURVNbdGVtcGxhdGVdICYmXG4gICAgICAgICAgICAhQ0xJUVpFbnZpcm9ubWVudC5LTk9XTl9URU1QTEFURVMuaGFzT3duUHJvcGVydHkodGVtcGxhdGUpO1xuICB9LFxuICBnZXRCcmFuZHNEQlVybDogZnVuY3Rpb24odmVyc2lvbil7XG4gICAgLy9UT0RPIC0gY29uc2lkZXIgdGhlIHZlcnNpb24gISFcbiAgICByZXR1cm4gJ3N0YXRpYy9icmFuZHNfZGF0YWJhc2UuanNvbidcbiAgfSxcbiAgLy8gVE9ETyAtIFNIT1VEIEJFIE1PVkVEIFRPIEEgTE9HSUMgTU9EVUxFXG4gIGF1dG9Db21wbGV0ZTogZnVuY3Rpb24gKHZhbCxzZWFyY2hTdHJpbmcpIHtcblxuICAgIGlmKCB2YWwgJiYgdmFsLmxlbmd0aCA+IDApe1xuICAgICAgdmFsID0gdmFsLnJlcGxhY2UoL2h0dHAoW3NdPyk6XFwvXFwvKHd3dy4pPy8sJycpO1xuICAgICAgdmFsID0gdmFsLnRvTG93ZXJDYXNlKCk7XG4gICAgICB2YXIgdXJsYmFyVmFsdWUgPSBDTElRWkVudmlyb25tZW50Lmxhc3RTZWFyY2gudG9Mb3dlckNhc2UoKTtcblxuICAgICAgaWYoIHZhbC5pbmRleE9mKHVybGJhclZhbHVlKSA9PT0gMCApIHtcbiAgICAgICAgLy8gQ2xpcXpVdGlscy5sb2coJ2pzQnJpZGdlIGF1dG9jb21wbGV0ZSB2YWx1ZTonK3ZhbCwnb3NBUEkxJyk7XG4gICAgICAgIG9zQVBJLmF1dG9jb21wbGV0ZSh2YWwpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGxzID0gSlNPTi5wYXJzZShDTElRWkVudmlyb25tZW50LmdldExvY2FsU3RvcmFnZSgpLnJlY2VudFF1ZXJpZXMgfHwgJ1tdJyk7XG4gICAgICAgIGZvciggdmFyIGkgaW4gbHMgKSB7XG4gICAgICAgICAgaWYoIGxzW2ldLnF1ZXJ5LnRvTG93ZXJDYXNlKCkuaW5kZXhPZihzZWFyY2hTdHJpbmcudG9Mb3dlckNhc2UoKSkgPT09IDAgKSB7XG4gICAgICAgICAgICBvc0FQSS5hdXRvY29tcGxldGUobHNbaV0ucXVlcnkudG9Mb3dlckNhc2UoKSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIC8vIFRPRE8gLSBTSE9VRCBCRSBNT1ZFRCBUTyBBIExPR0lDIE1PRFVMRVxuICBwdXRIaXN0b3J5Rmlyc3Q6IGZ1bmN0aW9uKHIpIHtcbiAgICB2YXIgaGlzdG9yeSA9IFtdLCBiYWNrZW5kID0gW107XG4gICAgci5fcmVzdWx0cy5mb3JFYWNoKGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgIGlmKHJlcy5zdHlsZSA9PT0gJ2NsaXF6LXBhdHRlcm4nIHx8IHJlcy5zdHlsZSA9PT0gJ2Zhdmljb24nKSB7XG4gICAgICAgIGhpc3RvcnkucHVzaChyZXMpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgYmFja2VuZC5wdXNoKHJlcyk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgci5fcmVzdWx0cyA9IGhpc3RvcnkuY29uY2F0KGJhY2tlbmQpO1xuICB9LFxuICByZXN1bHRzSGFuZGxlcjogZnVuY3Rpb24gKHIpIHtcblxuICAgIGlmKCBDTElRWkVudmlyb25tZW50Lmxhc3RTZWFyY2ggIT09IHIuX3NlYXJjaFN0cmluZyAgKXtcbiAgICAgIENsaXF6VXRpbHMubG9nKFwidT0nXCIrQ0xJUVpFbnZpcm9ubWVudC5sYXN0U2VhcmNoK1wiJycgcz0nXCIrci5fc2VhcmNoU3RyaW5nK1wiJywgcmV0dXJuaW5nXCIsXCJ1cmxiYXIhPXNlYXJjaFwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBDTElRWkVudmlyb25tZW50LnB1dEhpc3RvcnlGaXJzdChyKTtcblxuICAgIHIuX3Jlc3VsdHMuc3BsaWNlKENMSVFaRW52aXJvbm1lbnQuUkVTVUxUU19MSU1JVCk7XG5cbiAgICBjb25zdCByZW5kZXJlZFJlc3VsdHMgPSBDTElRWi5VSS5yZW5kZXJSZXN1bHRzKHIpO1xuXG4gICAgcmVuZGVyZWRSZXN1bHRzWzBdICYmIENMSVFaRW52aXJvbm1lbnQuYXV0b0NvbXBsZXRlKHJlbmRlcmVkUmVzdWx0c1swXS51cmwsIHIuX3NlYXJjaFN0cmluZyk7XG4gIH0sXG4gIHNlYXJjaDogZnVuY3Rpb24oZSwgbG9jYXRpb25fZW5hYmxlZCwgbGF0aXR1ZGUsIGxvbmdpdHVkZSkge1xuICAgIGlmKCFlIHx8IGUgPT09ICcnKSB7XG4gICAgICAvLyBzaG91bGQgYmUgbW92ZWQgdG8gVUkgZXhjZXB0ICdDTElRWkVudmlyb25tZW50LmluaXRIb21lcGFnZSh0cnVlKTsnXG4gICAgICBDTElRWkVudmlyb25tZW50Lmxhc3RTZWFyY2ggPSAnJztcbiAgICAgIENMSVFaLlVJLmhpZGVSZXN1bHRzQm94KCk7XG4gICAgICB3aW5kb3cuZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3N0YXJ0aW5ncG9pbnQnKS5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgIENMSVFaRW52aXJvbm1lbnQuaW5pdEhvbWVwYWdlKHRydWUpO1xuICAgICAgQ0xJUVouVUkuc3RvcFByb2dyZXNzQmFyKCk7XG4gICAgICBDTElRWi5VSS5sYXN0UmVzdWx0cyA9IG51bGw7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgQ0xJUVpFbnZpcm9ubWVudC5zZXRDdXJyZW50UXVlcnkoZSk7XG5cbiAgICBlID0gZS50b0xvd2VyQ2FzZSgpLnRyaW0oKTtcblxuICAgIENMSVFaRW52aXJvbm1lbnQubGFzdFNlYXJjaCA9IGU7XG4gICAgQ0xJUVpFbnZpcm9ubWVudC5sb2NhdGlvbl9lbmFibGVkID0gbG9jYXRpb25fZW5hYmxlZDtcbiAgICBpZihsb2NhdGlvbl9lbmFibGVkKSB7XG4gICAgICBDTElRWkVudmlyb25tZW50LlVTRVJfTEFUID0gbGF0aXR1ZGU7XG4gICAgICBDTElRWkVudmlyb25tZW50LlVTRVJfTE5HID0gbG9uZ2l0dWRlO1xuICAgIH0gZWxzZSB7XG4gICAgICBkZWxldGUgQ0xJUVpFbnZpcm9ubWVudC5VU0VSX0xBVDtcbiAgICAgIGRlbGV0ZSBDTElRWkVudmlyb25tZW50LlVTRVJfTE5HO1xuICAgIH1cblxuICAgIHdpbmRvdy5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnc3RhcnRpbmdwb2ludCcpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG5cbiAgICBDTElRWi5VSS5zdGFydFByb2dyZXNzQmFyKCk7XG5cblxuICAgIC8vIHN0YXJ0IFhIUiBjYWxsIH5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5+fn5cbiAgICAvL0NsaXF6VXRpbHMubG9nKGUsJ1hIUicpO1xuICAgIChuZXcgQ2xpcXpBdXRvY29tcGxldGUuQ2xpcXpSZXN1bHRzKCkpLnNlYXJjaChlLCBDTElRWkVudmlyb25tZW50LnJlc3VsdHNIYW5kbGVyKTtcbiAgfSxcbiAgZ2V0UHJlZjogZnVuY3Rpb24ocHJlZiwgbm90Rm91bmQpe1xuICAgIHZhciBteXByZWY7XG4gICAgaWYobXlwcmVmID0gQ0xJUVpFbnZpcm9ubWVudC5nZXRMb2NhbFN0b3JhZ2UoKS5nZXRJdGVtKHByZWYpKSB7XG4gICAgICByZXR1cm4gbXlwcmVmO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gbm90Rm91bmQ7XG4gICAgfVxuICB9LFxuICBzZXRQcmVmOiBmdW5jdGlvbihwcmVmLCB2YWwpe1xuICAgIC8vQ2xpcXpVdGlscy5sb2coJ3NldFByZWZzJyxhcmd1bWVudHMpO1xuICAgIENMSVFaRW52aXJvbm1lbnQuZ2V0TG9jYWxTdG9yYWdlKCkuc2V0SXRlbShwcmVmLHZhbCk7XG4gIH0sXG4gIHNldEludGVydmFsOiBmdW5jdGlvbigpeyByZXR1cm4gc2V0SW50ZXJ2YWwuYXBwbHkobnVsbCwgYXJndW1lbnRzKTsgfSxcbiAgc2V0VGltZW91dDogZnVuY3Rpb24oKXsgcmV0dXJuIHNldFRpbWVvdXQuYXBwbHkobnVsbCwgYXJndW1lbnRzKTsgfSxcbiAgY2xlYXJUaW1lb3V0OiBmdW5jdGlvbigpeyBjbGVhclRpbWVvdXQuYXBwbHkobnVsbCwgYXJndW1lbnRzKTsgfSxcbiAgUHJvbWlzZTogUHJvbWlzZSxcbiAgdGxkRXh0cmFjdG9yOiBmdW5jdGlvbihob3N0KXtcbiAgICAvL3RlbXBcbiAgICByZXR1cm4gaG9zdC5zcGxpdCgnLicpLnNwbGljZSgtMSlbMF07XG4gIH0sXG4gIGdldExvY2FsU3RvcmFnZTogZnVuY3Rpb24odXJsKSB7XG4gICAgcmV0dXJuIENMSVFaRW52aXJvbm1lbnQuc3RvcmFnZTtcbiAgfSxcbiAgT1M6ICdtb2JpbGUnLFxuICBpc1ByaXZhdGU6IGZ1bmN0aW9uKCl7IHJldHVybiBmYWxzZTsgfSxcbiAgaXNPblByaXZhdGVUYWI6IGZ1bmN0aW9uKHdpbikgeyByZXR1cm4gZmFsc2U7IH0sXG4gIGdldFdpbmRvdzogZnVuY3Rpb24oKXsgcmV0dXJuIHdpbmRvdzsgfSxcbiAgaHR0cEhhbmRsZXI6IGZ1bmN0aW9uKG1ldGhvZCwgdXJsLCBjYWxsYmFjaywgb25lcnJvciwgdGltZW91dCwgZGF0YSwgc3luYykge1xuICAgIGxhdGVzdFVybCA9IHVybDtcblxuICAgIGZ1bmN0aW9uIGlzTWl4ZXJVcmwodXJsKSB7IHJldHVybiB1cmwuaW5kZXhPZihDbGlxelV0aWxzLlJFU1VMVFNfUFJPVklERVIpID09PSAwOyB9XG5cbiAgICB2YXIgcmVxID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG4gICAgcmVxLm9wZW4obWV0aG9kLCB1cmwsICFzeW5jKVxuICAgIHJlcS5vdmVycmlkZU1pbWVUeXBlICYmIHJlcS5vdmVycmlkZU1pbWVUeXBlKCdhcHBsaWNhdGlvbi9qc29uJyk7XG4gICAgcmVxLm9ubG9hZCA9IGZ1bmN0aW9uKCl7XG4gICAgICBpZighcGFyc2VJbnQpIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfSAvL3BhcnNlSW50IGlzIG5vdCBhIGZ1bmN0aW9uIGFmdGVyIGV4dGVuc2lvbiBkaXNhYmxlL3VuaW5zdGFsbFxuXG4gICAgICB2YXIgc3RhdHVzQ2xhc3MgPSBwYXJzZUludChyZXEuc3RhdHVzIC8gMTAwKTtcbiAgICAgIGlmKHN0YXR1c0NsYXNzID09PSAyIHx8IHN0YXR1c0NsYXNzID09PSAzIHx8IHN0YXR1c0NsYXNzID09PSAwIC8qIGxvY2FsIGZpbGVzICovKXtcblxuICAgICAgICBpZihpc01peGVyVXJsKHVybCkpe1xuICAgICAgICAgIGlmKHR5cGVvZiBDdXN0b21FdmVudCAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnY29ubmVjdGVkJykpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBsYXN0U3VjY2VlZGVkVXJsID0gdXJsO1xuICAgICAgICAgIENsaXF6VXRpbHMubG9nKCdzdGF0dXMgJytyZXEuc3RhdHVzLCAnQ0xJUVpFbnZpcm9ubWVudC5odHRwSGFuZGxlci5vbmxvYWQnKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHJlcSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBDbGlxelV0aWxzLmxvZyggJ2xvYWRlZCB3aXRoIG5vbi0yMDAgJyArIHVybCArICcgKHN0YXR1cz0nICsgcmVxLnN0YXR1cyArICcgJyArIHJlcS5zdGF0dXNUZXh0ICsgJyknLCAnQ0xJUVpFbnZpcm9ubWVudC5odHRwSGFuZGxlci5vbmxvYWQnKTtcbiAgICAgICAgb25lcnJvciAmJiBvbmVycm9yKCk7XG4gICAgICB9XG4gICAgfTtcbiAgICByZXEub25lcnJvciA9IGZ1bmN0aW9uKCl7XG4gICAgICBpZihsYXRlc3RVcmwgIT09IHVybCB8fCB1cmwgPT09IGxhc3RTdWNjZWVkZWRVcmwgfHwgIWlzTWl4ZXJVcmwodXJsKSkge1xuICAgICAgICBvbmVycm9yICYmIG9uZXJyb3IoKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYodHlwZW9mIEN1c3RvbUV2ZW50ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICB3aW5kb3cuZGlzcGF0Y2hFdmVudChuZXcgQ3VzdG9tRXZlbnQoJ2Rpc2Nvbm5lY3RlZCcsIHsgJ2RldGFpbCc6ICdUaGlzIGNvdWxkIGJlIGNhdXNlZCBiZWNhdXNlIG9mIHJlcXVlc3QgZXJyb3InIH0pKTtcbiAgICAgIH1cblxuICAgICAgaWYoQ0xJUVpFbnZpcm9ubWVudCl7XG4gICAgICAgIGlmKGlzTWl4ZXJVcmwodXJsKSl7XG4gICAgICAgICAgc2V0VGltZW91dChDTElRWkVudmlyb25tZW50Lmh0dHBIYW5kbGVyLCA1MDAsIG1ldGhvZCwgdXJsLCBjYWxsYmFjaywgb25lcnJvciwgdGltZW91dCwgZGF0YSwgc3luYyk7XG4gICAgICAgIH1cbiAgICAgICAgQ2xpcXpVdGlscy5sb2coICdlcnJvciBsb2FkaW5nICcgKyB1cmwgKyAnIChzdGF0dXM9JyArIHJlcS5zdGF0dXMgKyAnICcgKyByZXEuc3RhdHVzVGV4dCArICcpJywgJ0NMSVFaRW52aXJvbm1lbnQuaHR0cEhhbmRsZXIsb25lcnJvcicpO1xuICAgICAgICBvbmVycm9yICYmIG9uZXJyb3IoKTtcbiAgICAgIH1cbiAgICB9O1xuICAgIHJlcS5vbnRpbWVvdXQgPSBmdW5jdGlvbigpe1xuXG4gICAgICBDbGlxelV0aWxzLmxvZygnQkVGT1JFJywgJ0NMSVFaRW52aXJvbm1lbnQuaHR0cEhhbmRsZXIub250aW1lb3V0Jyk7XG4gICAgICBpZihsYXRlc3RVcmwgIT09IHVybCB8fCB1cmwgPT09IGxhc3RTdWNjZWVkZWRVcmwgfHwgIWlzTWl4ZXJVcmwodXJsKSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZih0eXBlb2YgQ3VzdG9tRXZlbnQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHdpbmRvdy5kaXNwYXRjaEV2ZW50KG5ldyBDdXN0b21FdmVudCgnZGlzY29ubmVjdGVkJywgeyAnZGV0YWlsJzogJ1RoaXMgY291bGQgYmUgY2F1c2VkIGJlY2F1c2Ugb2YgdGltZWQgb3V0IHJlcXVlc3QnIH0pKTtcbiAgICAgIH1cblxuICAgICAgaWYoQ0xJUVpFbnZpcm9ubWVudCl7IC8vbWlnaHQgaGFwcGVuIGFmdGVyIGRpc2FibGluZyB0aGUgZXh0ZW5zaW9uXG4gICAgICAgIGlmKGlzTWl4ZXJVcmwodXJsKSl7XG4gICAgICAgICAgc2V0VGltZW91dChDTElRWkVudmlyb25tZW50Lmh0dHBIYW5kbGVyLCA1MDAsIG1ldGhvZCwgdXJsLCBjYWxsYmFjaywgb25lcnJvciwgdGltZW91dCwgZGF0YSwgc3luYyk7XG4gICAgICAgIH1cbiAgICAgICAgQ2xpcXpVdGlscy5sb2coICdyZXNlbmRpbmc6IHRpbWVvdXQgZm9yICcgKyB1cmwsICdDTElRWkVudmlyb25tZW50Lmh0dHBIYW5kbGVyLm9udGltZW91dCcpO1xuICAgICAgICBvbmVycm9yICYmIG9uZXJyb3IoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgaWYoY2FsbGJhY2sgJiYgIXN5bmMpe1xuICAgICAgaWYodGltZW91dCl7XG4gICAgICAgIHJlcS50aW1lb3V0ID0gcGFyc2VJbnQodGltZW91dCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXEudGltZW91dCA9IChtZXRob2QgPT09ICdQT1NUJz8gMTAwMDAgOiAxMDAwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXEuc2VuZChkYXRhKTtcbiAgICByZXR1cm4gcmVxO1xuICB9LFxuICAvLyBUT0RPIC0gU0hPVUQgQkUgTU9WRUQgVE8gQSBMT0dJQyBNT0RVTEVcbiAgb3Blbkxpbms6IGZ1bmN0aW9uKHdpbmRvdywgdXJsKXtcbiAgICBpZih1cmwgIT09ICcjJykgIHtcbiAgICAgIGlmKCB1cmwuaW5kZXhPZignaHR0cCcpID09PSAtMSApIHtcbiAgICAgICAgdXJsID0gJ2h0dHA6Ly8nICsgdXJsO1xuICAgICAgfVxuICAgICAgb3NBUEkub3BlbkxpbmsodXJsKTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG4gIC8vIFRPRE8gLSBTSE9VRCBCRSBNT1ZFRCBUTyBBIExPR0lDIE1PRFVMRVxuICBwcm9jZXNzSGlzdG9yeTogZnVuY3Rpb24oZGF0YSkge1xuICAgIHRyeSB7XG4gICAgICB2YXIgaXRlbXMgPSBkYXRhLnJlc3VsdHM7XG4gICAgICB2YXIgcmVzID0gW107XG4gICAgICBmb3IgKHZhciBpIGluIGl0ZW1zKSB7XG4gICAgICAgIHZhciBpdGVtID0gaXRlbXNbaV07XG4gICAgICAgIHJlcy5wdXNoKHtcbiAgICAgICAgICBzdHlsZTogICAnZmF2aWNvbicsXG4gICAgICAgICAgdmFsdWU6ICAgaXRlbS51cmwsXG4gICAgICAgICAgaW1hZ2U6ICAgJycsXG4gICAgICAgICAgY29tbWVudDogKHR5cGVvZihpdGVtLnRpdGxlKSAhPT0gJ3VuZGVmaW5lZCcgPyBpdGVtLnRpdGxlIDogJ25vIGNvbW1lbnQnKSxcbiAgICAgICAgICBsYWJlbDogICAnJ1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7cmVzdWx0czogcmVzLCBxdWVyeTpkYXRhLnF1ZXJ5LCByZWFkeTp0cnVlfTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBDbGlxelV0aWxzLmxvZygnRXJyb3I6ICcgKyBlLCAnQ0xJUVpFbnZpcm9ubWVudC5wcm9jZXNzSGlzdG9yeScpO1xuICAgIH1cbiAgfSxcbiAgLy8gVE9ETyAtIFNIT1VEIEJFIE1PVkVEIFRPIEEgTE9HSUMgTU9EVUxFXG4gIGRpc3BsYXlIaXN0b3J5OiBmdW5jdGlvbihkYXRhKXtcbiAgICBjb25zb2xlLmxvZyh0aGlzLCAnYmJiJyk7XG4gICAgQ0xJUVpFbnZpcm9ubWVudC5zZWFyY2hIaXN0b3J5Q2FsbGJhY2soQ0xJUVpFbnZpcm9ubWVudC5wcm9jZXNzSGlzdG9yeShkYXRhKSk7XG4gIH0sXG4gIC8vIFRPRE8gLSBTSE9VRCBCRSBNT1ZFRCBUTyBBIExPR0lDIE1PRFVMRVxuICBoaXN0b3J5U2VhcmNoOiBmdW5jdGlvbihxLCBjYWxsYmFjayl7XG4gICAgQ0xJUVpFbnZpcm9ubWVudC5zZWFyY2hIaXN0b3J5Q2FsbGJhY2sgPSBjYWxsYmFjaztcbiAgICBjb25zb2xlLmxvZyh0aGlzLCAnYWFhJyk7XG4gICAgd2luZG93Lm9zQVBJLnNlYXJjaEhpc3RvcnkocSwgJ0NMSVFaRW52aXJvbm1lbnQuZGlzcGxheUhpc3RvcnknKTtcbiAgfSxcbiAgLy9UT0RPOiByZW1vdmUgdGhpcyBkZXBlbmRlbmN5XG4gIGdldFNlYXJjaEVuZ2luZXM6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIFtdXG4gIH0sXG4gIC8vVE9ETzogbW92ZSB0aGlzIG91dCB0byBDTElRWiB1dGlsc1xuICBkaXN0YW5jZTogZnVuY3Rpb24obG9uMSwgbGF0MSwgbG9uMiwgbGF0Mikge1xuICAgIC8qKiBDb252ZXJ0cyBudW1lcmljIGRlZ3JlZXMgdG8gcmFkaWFucyAqL1xuICAgIGZ1bmN0aW9uIGRlZ3JlZXNUb1JhZChkZWdyZWUpe1xuICAgICAgcmV0dXJuIGRlZ3JlZSAqIE1hdGguUEkgLyAxODA7XG4gICAgfVxuXG4gICAgdmFyIFIgPSA2MzcxOyAvLyBSYWRpdXMgb2YgdGhlIGVhcnRoIGluIGttXG4gICAgaWYoIWxvbjIgfHwgIWxvbjEgfHwgIWxhdDIgfHwgIWxhdDEpIHsgcmV0dXJuIC0xOyB9XG4gICAgdmFyIGRMYXQgPSBkZWdyZWVzVG9SYWQobGF0Mi1sYXQxKTsgIC8vIEphdmFzY3JpcHQgZnVuY3Rpb25zIGluIHJhZGlhbnNcbiAgICB2YXIgZExvbiA9IGRlZ3JlZXNUb1JhZChsb24yLWxvbjEpO1xuICAgIHZhciBhID0gTWF0aC5zaW4oZExhdC8yKSAqIE1hdGguc2luKGRMYXQvMikgK1xuICAgICAgICAgICAgTWF0aC5jb3MoZGVncmVlc1RvUmFkKGxhdDEpKSAqIE1hdGguY29zKGRlZ3JlZXNUb1JhZChsYXQyKSkgKlxuICAgICAgICAgICAgTWF0aC5zaW4oZExvbi8yKSAqIE1hdGguc2luKGRMb24vMik7XG4gICAgdmFyIGMgPSAyICogTWF0aC5hdGFuMihNYXRoLnNxcnQoYSksIE1hdGguc3FydCgxLWEpKTtcbiAgICB2YXIgZCA9IFIgKiBjOyAvLyBEaXN0YW5jZSBpbiBrbVxuICAgIHJldHVybiBkO1xuICB9LFxuICAvLyBtb2NrZWQgZnVuY3Rpb25zXG4gIGdldEVuZ2luZUJ5TmFtZTogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAnJztcbiAgfSxcbiAgZ2V0RW5naW5lQnlBbGlhczogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiAnJztcbiAgfSxcbiAgY29weVJlc3VsdDogZnVuY3Rpb24odmFsKSB7XG4gICAgb3NBUEkuY29weVJlc3VsdCh2YWwpO1xuICB9LFxuICBhZGRFdmVudExpc3RlbmVyVG9FbGVtZW50czogZnVuY3Rpb24gKGVsZW1lbnRTZWxlY3RvciwgZXZlbnRUeXBlLCBsaXN0ZW5lcikge1xuICAgIEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoZWxlbWVudFNlbGVjdG9yKSkuZm9yRWFjaChmdW5jdGlvbiAoZWxlbWVudCkge1xuICAgICAgZWxlbWVudC5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgbGlzdGVuZXIpO1xuICAgIH0pO1xuICB9LFxuXG4gIGluaXRIb21lcGFnZTogZnVuY3Rpb24oaGlkZUxhc3RTdGF0ZSkge1xuICAgIGlmKGhpZGVMYXN0U3RhdGUpIHtcbiAgICAgIHZhciBzdGFydCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXNldFN0YXRlJyk7XG4gICAgICBzdGFydCAmJiAoc3RhcnQuc3R5bGUuZGlzcGxheSA9ICdub25lJyk7XG4gICAgfVxuICAgIG9zQVBJLmdldFRvcFNpdGVzKCdOZXdzLnN0YXJ0UGFnZUhhbmRsZXInLCAxNSk7XG4gIH0sXG4gIGdldE5vUmVzdWx0czogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGVuZ2luZSA9IENMSVFaRW52aXJvbm1lbnQuZ2V0RGVmYXVsdFNlYXJjaEVuZ2luZSgpO1xuICAgIHZhciBkZXRhaWxzID0gQ0xJUVpFbnZpcm9ubWVudC5nZXREZXRhaWxzRnJvbVVybChlbmdpbmUudXJsKTtcbiAgICB2YXIgbG9nbyA9IENMSVFaRW52aXJvbm1lbnQuZ2V0TG9nb0RldGFpbHMoZGV0YWlscyk7XG5cbiAgICB2YXIgcmVzdWx0ID0gIENMSVFaRW52aXJvbm1lbnQuUmVzdWx0LmNsaXF6RXh0cmEoXG4gICAgICB7XG4gICAgICAgIGRhdGE6XG4gICAgICAgICAge1xuICAgICAgICAgICAgdGVtcGxhdGU6J25vUmVzdWx0JyxcbiAgICAgICAgICAgIHRpdGxlOiBDTElRWkVudmlyb25tZW50LmdldExvY2FsaXplZFN0cmluZygnbW9iaWxlX25vX3Jlc3VsdF90aXRsZScpLFxuICAgICAgICAgICAgYWN0aW9uOiBDTElRWkVudmlyb25tZW50LmdldExvY2FsaXplZFN0cmluZygnbW9iaWxlX25vX3Jlc3VsdF9hY3Rpb24nLCBlbmdpbmUubmFtZSksXG4gICAgICAgICAgICBzZWFyY2hTdHJpbmc6IGVuY29kZVVSSUNvbXBvbmVudChDTElRWkVudmlyb25tZW50Lmxhc3RTZWFyY2gpLFxuICAgICAgICAgICAgc2VhcmNoRW5naW5lVXJsOiBlbmdpbmUudXJsLFxuICAgICAgICAgICAgbG9nbzogbG9nbyxcbiAgICAgICAgICAgIGJhY2tncm91bmQ6IGxvZ28uYmFja2dyb3VuZENvbG9yXG4gICAgICAgICAgfSxcbiAgICAgICAgc3ViVHlwZTogSlNPTi5zdHJpbmdpZnkoe2VtcHR5OnRydWV9KVxuICAgICAgfVxuICAgICk7XG4gICAgcmVzdWx0LmRhdGEua2luZCA9IFsnQ0wnXTtcbiAgICByZXR1cm4gcmVzdWx0O1xuICB9LFxuICBzZXREZWZhdWx0U2VhcmNoRW5naW5lOiBmdW5jdGlvbihlbmdpbmUpIHtcbiAgICBDTElRWkVudmlyb25tZW50LmdldExvY2FsU3RvcmFnZSgpLnNldE9iamVjdCgnZGVmYXVsdFNlYXJjaEVuZ2luZScsIGVuZ2luZSk7XG4gIH0sXG4gIGdldERlZmF1bHRTZWFyY2hFbmdpbmU6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBDTElRWkVudmlyb25tZW50LmdldExvY2FsU3RvcmFnZSgpLmdldE9iamVjdCgnZGVmYXVsdFNlYXJjaEVuZ2luZScpIHx8IENMSVFaRW52aXJvbm1lbnQuR09PR0xFX0VOR0lORTtcbiAgfSxcbn07XG5cbkNMSVFaRW52aXJvbm1lbnQuc2V0Q3VycmVudFF1ZXJ5ID0gZnVuY3Rpb24ocXVlcnkpIHtcblxuICBpZihDTElRWkVudmlyb25tZW50LmdldFByZWYoJ2luY29nbml0bycpID09PSBcInRydWVcIiB8fCBxdWVyeS5tYXRjaCgvaHR0cFtzXXswLDF9Oi8pKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdmFyIHJlY2VudEl0ZW1zID0gQ0xJUVpFbnZpcm9ubWVudC5nZXRMb2NhbFN0b3JhZ2UoKS5nZXRPYmplY3QoJ3JlY2VudFF1ZXJpZXMnLCBbXSk7XG5cbiAgaWYoIXJlY2VudEl0ZW1zWzBdKSB7XG4gICAgcmVjZW50SXRlbXMgPSBbe2lkOiAxLCBxdWVyeTpxdWVyeSwgdGltZXN0YW1wOkRhdGUubm93KCl9XTtcbiAgICBDTElRWkVudmlyb25tZW50LmdldExvY2FsU3RvcmFnZSgpLnNldE9iamVjdCgncmVjZW50UXVlcmllcycsIHJlY2VudEl0ZW1zKTtcbiAgfSBlbHNlIGlmIChyZWNlbnRJdGVtc1swXS5xdWVyeSA9PT0gcXVlcnkgJiYgRGF0ZS5ub3coKSAtIHJlY2VudEl0ZW1zWzBdLnRpbWVzdGFtcCA8IDEwICogMTAwMCAqIDYwKSB7XG4gICAgLy8gRE8gTk9USElOR1xuICAgIC8vIHRlbXBvcmFyeSB3b3JrIGFyb3VuZCByZXBldGl0aXZlIHF1ZXJpZXMgY29taW5nIGZyb20gaU9TXG4gIH0gZWxzZSBpZihyZWNlbnRJdGVtc1swXS5xdWVyeS5pbmRleE9mKHF1ZXJ5KSArIHF1ZXJ5LmluZGV4T2YocmVjZW50SXRlbXNbMF0ucXVlcnkpID4gLTIgJiZcbiAgICAgICAgICBEYXRlLm5vdygpIC0gcmVjZW50SXRlbXNbMF0udGltZXN0YW1wIDwgNSAqIDEwMDApIHtcbiAgICByZWNlbnRJdGVtc1swXSA9IHtpZDogcmVjZW50SXRlbXNbMF0uaWQsIHF1ZXJ5OnF1ZXJ5LCB0aW1lc3RhbXA6RGF0ZS5ub3coKX07XG4gICAgQ0xJUVpFbnZpcm9ubWVudC5nZXRMb2NhbFN0b3JhZ2UoKS5zZXRPYmplY3QoJ3JlY2VudFF1ZXJpZXMnLCByZWNlbnRJdGVtcyk7XG4gIH1cbiAgZWxzZSB7XG4gICAgcmVjZW50SXRlbXMudW5zaGlmdCh7aWQ6IHJlY2VudEl0ZW1zWzBdLmlkICsgMSwgcXVlcnk6cXVlcnksdGltZXN0YW1wOkRhdGUubm93KCl9KTtcbiAgICByZWNlbnRJdGVtcyA9IHJlY2VudEl0ZW1zLnNsaWNlKDAsNjApO1xuICAgIENMSVFaRW52aXJvbm1lbnQuZ2V0TG9jYWxTdG9yYWdlKCkuc2V0T2JqZWN0KCdyZWNlbnRRdWVyaWVzJywgcmVjZW50SXRlbXMpO1xuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBDTElRWkVudmlyb25tZW50O1xuIl19