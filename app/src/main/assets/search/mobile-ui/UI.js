System.register('mobile-ui/UI', ['mobile-ui/DelayedImageLoader', 'core/templates', 'mobile-ui/webview', 'mobile-ui/views/currency', 'mobile-ui/views/entity-generic', 'mobile-ui/views/generic', 'mobile-ui/views/hq', 'mobile-ui/views/local-data-sc', 'mobile-ui/views/stocks', 'mobile-ui/views/weatherAlert', 'mobile-ui/views/weatherEZ', 'mobile-ui/views/liveTicker'], function (_export) {
  /*
   * This is the module which creates the UI for the results
   *   - uses handlebars templates
   *   - attaches all the needed listners (keyboard/mouse)
   */

  'use strict';

  //TODO: improve loading of these views!
  var DelayedImageLoader, handlebars, window, document, v1, v2, v3, v4, v6, v7, v8, v9, v10, resultsBox, viewPager, currentResults, imgLoader, progressBarInterval, PEEK, currentResultsCount, FRAME, UI, resizeTimeout;

  function setCardCountPerPage(windowWidth) {
    UI.nCardsPerPage = Math.floor(windowWidth / 320) || 1;
  }

  function loadAsyncResult(res, query) {
    for (var i in res) {
      var r = res[i];
      var qt = query + ": " + new Date().getTime();
      CliqzUtils.log(r, "LOADINGASYNC");
      CliqzUtils.log(query, "loadAsyncResult");
      var loop_count = 0;
      var async_callback = function async_callback(req) {
        CliqzUtils.log(query, "async_callback");
        var resp = null;
        try {
          resp = JSON.parse(req.response).results[0];
        } catch (err) {
          res.splice(i, 1);
        }
        if (resp && CliqzAutocomplete.lastSearch === query) {

          var kind = r.data.kind;
          if ("__callback_url__" in resp.data) {
            // If the result is again a promise, retry.
            if (loop_count < 10 /*smartCliqzMaxAttempts*/) {
                setTimeout(function () {
                  loop_count += 1;
                  CliqzUtils.httpGet(resp.data.__callback_url__, async_callback, async_callback);
                }, 100 /*smartCliqzWaitTime*/);
              } else if (!currentResults.results.length) {
                redrawDropdown(handlebars.tplCache.noResult(CliqzUtils.getNoResults()), query);
              }
          } else {
            r.data = resp.data;
            r.url = resp.url;
            r.data.kind = kind;
            r.data.subType = resp.subType;
            r.data.trigger_urls = resp.trigger_urls;
            r.vertical = getVertical(r);
            r.urlDetails = CliqzUtils.getDetailsFromUrl(r.url);
            r.logo = CliqzUtils.getLogoDetails(r.urlDetails);

            if (resultsBox && CliqzAutocomplete.lastSearch === query) {
              // Remove all existing extra results
              currentResults.results = currentResults.results.filter(function (r) {
                return r.type !== 'cliqz-extra';
              });
              // add the current one on top of the list
              currentResults.results.unshift(r);

              if (currentResults.results.length) {
                redrawDropdown(handlebars.tplCache.results(currentResults), query);
              } else {
                redrawDropdown(handlebars.tplCache.noResult(CliqzUtils.getNoResults()), query);
              }
              imgLoader = new UI.DelayedImageLoader('#cliqz-results img[data-src], #cliqz-results div[data-style], #cliqz-results span[data-style]');
              imgLoader.start();
            }
          }
        }
        // to handle broken promises (eg. Weather and flights) on mobile
        else if (r.data && r.data.__callback_url__) {
            shiftResults();
          } else {
            res.splice(i, 1);
            if (!currentResults.results.length) {
              redrawDropdown(handlebars.tplCache.noResult(CliqzUtils.getNoResults()), query);
            }
          }
      };
      CliqzUtils.httpGet(r.data.__callback_url__, async_callback, async_callback);
    }
  }

  function assessAsync(getAsync) {
    return function (result) {
      var isAsync = result.type === 'cliqz-extra' && result.data && '__callback_url__' in result.data;
      return getAsync ? isAsync : !isAsync;
    };
  }

  function redrawDropdown(newHTML) {
    resultsBox.style.display = 'block';

    resultsBox.innerHTML = newHTML;
  }

  function getVertical(result) {
    // if history records are less than 3 it goes to generic
    var template = undefined;
    if (result.data.template === 'pattern-h3') {
      template = 'history';
    } else if (CliqzUtils.TEMPLATES[result.data.superTemplate]) {
      template = result.data.superTemplate;
    } else if (CliqzUtils.TEMPLATES[result.data.template]) {
      template = result.data.template;
    } else {
      template = 'generic';
    }
    return template;
  }

  function enhanceResults(results) {
    var enhancedResults = [];
    results.forEach(function (r, index) {
      var _tmp = getDebugMsg(r.comment || '');
      var url = r.val || '';
      var urlDetails = CliqzUtils.getDetailsFromUrl(url);

      enhancedResults.push(enhanceSpecificResult({
        query: r.query,
        type: r.style,
        left: UI.CARD_WIDTH * index,
        data: r.data || {},
        url: url,
        urlDetails: urlDetails,
        logo: CliqzUtils.getLogoDetails(urlDetails),
        title: _tmp[0],
        debug: _tmp[1]
      }));
    });

    var filteredResults = enhancedResults.filter(function (r) {
      return !(r.data && r.data.adult);
    });

    // if there no results after adult filter - show no results entry
    if (!filteredResults.length) {
      filteredResults.push(CliqzUtils.getNoResults());
      filteredResults[0].vertical = 'noResult';
    }

    return filteredResults;
  }

  // debug message are at the end of the title like this: "title (debug)!"
  function getDebugMsg(fullTitle) {
    // regex matches two parts:
    // 1) the title, can be anything ([\s\S] is more inclusive than '.' as it includes newline)
    // followed by:
    // 2) a debug string like this " (debug)!"
    if (fullTitle === null) {
      return [null, null];
    }
    var r = fullTitle.match(/^([\s\S]+) \((.*)\)!$/);
    if (r && r.length >= 3) {
      return [r[1], r[2]];
    } else {
      return [fullTitle, null];
    }
  }

  function enhanceSpecificResult(r) {
    var contentArea = {
      width: UI.CARD_WIDTH,
      height: window.screen.height
    };

    if (r.subType && JSON.parse(r.subType).ez) {
      // Indicate that this is a RH result.
      r.type = 'cliqz-extra';
    }

    var template = r.vertical = getVertical(r);

    var specificView = UI.VIEWS[template] || UI.VIEWS.generic;
    specificView.enhanceResults && specificView.enhanceResults(r.data, contentArea);

    return r;
  }

  function crossTransform(element, x) {
    var platforms = ['', '-webkit-', '-ms-'];
    platforms.forEach(function (platform) {
      element.style[platform + 'transform'] = 'translate3d(' + x + 'px, 0px, 0px)';
    });
  }

  function getResultKind(el) {
    return getResultOrChildAttr(el, 'kind').split(';');
  }

  // bubbles up maximum to the result container
  function getResultOrChildAttr(_x2, _x3) {
    var _left;

    var _again = true;

    _function: while (_again) {
      var el = _x2,
          attr = _x3;
      _again = false;

      if (el === null) return '';
      if (el.className === FRAME) return el.getAttribute(attr) || '';

      if (_left = el.getAttribute(attr)) {
        return _left;
      }

      _x2 = el.parentElement;
      _x3 = attr;
      _again = true;
      continue _function;
    }
  }

  function resultClick(ev) {
    var el = ev.target,
        url,
        extra,
        action;

    while (el) {
      extra = extra || el.getAttribute('extra');
      url = el.getAttribute('url');
      action = el.getAttribute('cliqz-action');

      if (url && url !== '#') {

        var card = document.getElementsByClassName('card')[UI.currentPage];
        var cardPosition = card.getBoundingClientRect();
        var coordinate = [ev.clientX - cardPosition.left, ev.clientY - cardPosition.top, UI.CARD_WIDTH];

        var signal = {
          type: 'activity',
          action: 'result_click',
          extra: extra,
          mouse: coordinate,
          position_type: getResultKind(el),
          current_position: UI.currentPage
        };

        CliqzUtils.telemetry(signal);
        CliqzUtils.openLink(window, url);
        return;
      } else if (action) {
        switch (action) {
          case 'stop-click-event-propagation':
            return;
          case 'copy-calc-answer':
            CliqzUtils.copyResult(document.getElementById('calc-answer').innerHTML);
            document.getElementById('calc-copied-msg').style.display = '';
            document.getElementById('calc-copy-msg').style.display = 'none';
            break;
        }
      }

      if (el.className === FRAME) break; // do not go higher than a result
      el = el.parentElement;
    }
  }

  function shiftResults() {
    var frames = document.getElementsByClassName('frame');
    for (var i = 0; i < frames.length; i++) {
      var left = frames[i].style.left.substring(0, frames[i].style.left.length - 1);
      left = parseInt(left);
      left -= left / (i + 1);
      UI.lastResults[i] && (UI.lastResults[i].left = left);
      frames[i].style.left = left + 'px';
    }
    setResultNavigation(UI.lastResults);
  }

  function setResultNavigation(results) {

    var showGooglethis = 1;
    if (!results[0] || results[0].data.template === 'noResult') {
      showGooglethis = 0;
    }

    resultsBox.style.width = window.innerWidth + 'px';
    resultsBox.style.marginLeft = PEEK + 'px';

    var lastResultOffset = results.length ? results[results.length - 1].left || 0 : 0;

    currentResultsCount = lastResultOffset / UI.CARD_WIDTH + showGooglethis + 1;

    // get number of pages according to number of cards per page
    UI.nPages = Math.ceil(currentResultsCount / UI.nCardsPerPage);

    if (document.getElementById('currency-tpl')) {
      document.getElementById('currency-tpl').parentNode.removeAttribute('url');
    }
  }

  function loadViews() {
    UI.clickHandlers = {};
    Object.keys(CliqzHandlebars.TEMPLATES).concat(CliqzHandlebars.MESSAGE_TEMPLATES).concat(CliqzHandlebars.PARTIALS).forEach(function (templateName) {
      UI.VIEWS[templateName] = Object.create(null);
      try {
        var _module2 = System.get('mobile-ui/views/' + templateName);
        if (_module2) {
          UI.VIEWS[templateName] = new _module2['default'](window);

          if (UI.VIEWS[templateName].events && UI.VIEWS[templateName].events.click) {
            Object.keys(UI.VIEWS[templateName].events.click).forEach(function (selector) {
              UI.clickHandlers[selector] = UI.VIEWS[templateName].events.click[selector];
            });
          }
        } else {
          CliqzUtils.log('failed to load ' + templateName, 'UI');
        }
      } catch (ex) {
        CliqzUtils.log(ex, 'UI');
      }
    });
  }

  function subscribeEvents() {
    CliqzEvents.sub('show', jsAPI.onShow);
    CliqzEvents.sub('search', jsAPI.search);
    CliqzEvents.sub('notify_preferences', jsAPI.setClientPreferences);
    CliqzEvents.sub('restore_blocked_topsites', jsAPI.restoreBlockedTopSites);
    CliqzEvents.sub('reset_state', jsAPI.resetState);
    CliqzEvents.sub('set_search_engine', jsAPI.setDefaultSearchEngine);
    CliqzEvents.sub('publish_card_url', jsAPI.getCardUrl);
  }

  return {
    setters: [function (_mobileUiDelayedImageLoader) {
      DelayedImageLoader = _mobileUiDelayedImageLoader['default'];
    }, function (_coreTemplates) {
      handlebars = _coreTemplates['default'];
    }, function (_mobileUiWebview) {
      window = _mobileUiWebview.window;
      document = _mobileUiWebview.document;
    }, function (_mobileUiViewsCurrency) {
      v1 = _mobileUiViewsCurrency['default'];
    }, function (_mobileUiViewsEntityGeneric) {
      v2 = _mobileUiViewsEntityGeneric['default'];
    }, function (_mobileUiViewsGeneric) {
      v3 = _mobileUiViewsGeneric['default'];
    }, function (_mobileUiViewsHq) {
      v4 = _mobileUiViewsHq['default'];
    }, function (_mobileUiViewsLocalDataSc) {
      v6 = _mobileUiViewsLocalDataSc['default'];
    }, function (_mobileUiViewsStocks) {
      v7 = _mobileUiViewsStocks['default'];
    }, function (_mobileUiViewsWeatherAlert) {
      v8 = _mobileUiViewsWeatherAlert['default'];
    }, function (_mobileUiViewsWeatherEZ) {
      v9 = _mobileUiViewsWeatherEZ['default'];
    }, function (_mobileUiViewsLiveTicker) {
      v10 = _mobileUiViewsLiveTicker['default'];
    }],
    execute: function () {
      resultsBox = null;
      viewPager = null;
      currentResults = null;
      imgLoader = null;
      progressBarInterval = null;
      PEEK = 25;
      currentResultsCount = 0;
      FRAME = 'frame';
      UI = {
        currentPage: 0,
        lastResults: null,
        CARD_WIDTH: 0,
        nCardsPerPage: 1,
        nPages: 1,
        DelayedImageLoader: null,
        init: function init() {
          //check if loading is done
          if (!handlebars.tplCache.main) return;
          var box = document.getElementById('results');
          box.innerHTML = handlebars.tplCache.main();

          resultsBox = document.getElementById('cliqz-results', box);

          viewPager = UI.initViewpager();

          resultsBox.addEventListener('click', resultClick);

          // FIXME: import does not work
          UI.DelayedImageLoader = System.get('mobile-ui/DelayedImageLoader')['default'];
          loadViews();
          subscribeEvents();
        },
        setDimensions: function setDimensions() {
          UI.CARD_WIDTH = window.innerWidth - 2 * PEEK;
          UI.CARD_WIDTH /= UI.nCardsPerPage;
        },
        renderResults: function renderResults(r) {

          var renderedResults = UI.results(r);

          UI.lastResults = renderedResults;

          CLIQZ.UI.stopProgressBar();

          return renderedResults;
        },
        setTheme: function setTheme() {
          var incognito = arguments.length <= 0 || arguments[0] === undefined ? false : arguments[0];

          window.document.body.style.backgroundColor = incognito ? '#4a4a4a' : '#E8E8E8';
        },
        setMobileBasedUrls: function setMobileBasedUrls(o) {
          if (!o) return;
          var url = o.data && o.data.mobile_url;
          if (o.val) {
            o.val = url || o.val;
          }
          if (o.url) {
            o.url = url || o.url;
          }
          if (o.url && o.m_url) {
            o.url = o.m_url;
          }
          for (var i in o) {
            if (typeof o[i] === 'object') {
              UI.setMobileBasedUrls(o[i]);
            }
          }
        },
        results: function results(r) {

          UI.currentPage = 0;
          viewPager.goToIndex(UI.currentPage);
          UI.setMobileBasedUrls(r);

          setCardCountPerPage(window.innerWidth);

          UI.setDimensions();

          var engine = CliqzUtils.getDefaultSearchEngine();
          var details = CliqzUtils.getDetailsFromUrl(engine.url);
          var logo = CliqzUtils.getLogoDetails(details);

          var enhancedResults = enhanceResults(r._results);

          currentResults = {
            searchString: r._searchString,
            frameWidth: UI.CARD_WIDTH,
            results: enhancedResults,
            isInstant: false,
            isMixed: true,
            googleThis: {
              title: CliqzUtils.getLocalizedString('mobile_more_results_title'),
              action: CliqzUtils.getLocalizedString('mobile_more_results_action', engine.name),
              left: UI.CARD_WIDTH * enhancedResults.length,
              frameWidth: UI.CARD_WIDTH,
              searchString: encodeURIComponent(r._searchString),
              searchEngineUrl: engine.url,
              logo: logo,
              background: logo.backgroundColor
            }
          };
          var query = currentResults.searchString || '';

          if (imgLoader) imgLoader.stop();

          // Results that are not ready (extra results, for which we received a callback_url)
          var asyncResults = currentResults.results.filter(assessAsync(true));
          currentResults.results = currentResults.results.filter(assessAsync(false));

          redrawDropdown(handlebars.tplCache.results(currentResults), query);

          if (asyncResults.length) loadAsyncResult(asyncResults, query);

          imgLoader = new UI.DelayedImageLoader('#cliqz-results img[data-src], #cliqz-results div[data-style], #cliqz-results span[data-style]');
          imgLoader.start();

          crossTransform(resultsBox, 0);

          setResultNavigation(currentResults.results);

          return currentResults.results;
        },
        VIEWS: {},
        initViewpager: function initViewpager() {
          var views = {},
              pageShowTs = Date.now(),
              innerWidth = window.innerWidth,
              offset = 0;

          return new ViewPager(resultsBox, {
            dragSize: window.innerWidth,
            prevent_all_native_scrolling: false,
            vertical: false,
            anim_duration: 400,
            tipping_point: 0.4,
            onPageScroll: function onPageScroll(scrollInfo) {
              offset = -scrollInfo.totalOffset;
              crossTransform(resultsBox, offset * UI.CARD_WIDTH * UI.nCardsPerPage);
            },

            onPageChange: function onPageChange(page) {
              page = Math.abs(page);

              if (page === UI.currentPage || !UI.isSearch()) return;

              views[page] = (views[page] || 0) + 1;

              CliqzUtils.telemetry({
                type: 'activity',
                action: 'swipe',
                swipe_direction: page > UI.currentPage ? 'right' : 'left',
                current_position: page,
                views: views[page],
                prev_position: UI.currentPage,
                prev_display_time: Date.now() - pageShowTs
              });

              pageShowTs = Date.now();

              UI.currentPage = page;
            }
          });
        },
        hideResultsBox: function hideResultsBox() {
          resultsBox.style.display = 'none';
        },
        updateSearchCard: function updateSearchCard(engine) {
          var engineDiv = document.getElementById('defaultEngine');
          if (engineDiv && CliqzAutocomplete.lastSearch) {
            engineDiv.setAttribute('url', engine.url + encodeURIComponent(CliqzAutocomplete.lastSearch));
          }
        },
        startProgressBar: function startProgressBar() {
          // suspended
          return;
          if (progressBarInterval) {
            clearInterval(progressBarInterval);
          }
          var multiplier = parseInt(Math.ceil(window.innerWidth / 100)),
              progress = document.getElementById('progress'),
              i = 0;
          progressBarInterval = setInterval(function () {
            i++;
            progress.style.width = i * multiplier + 'px';
          }, 20);

          setTimeout(UI.stopProgressBar, 4000);
        },

        stopProgressBar: function stopProgressBar() {
          // suspended
          return;
          if (progressBarInterval) {
            clearInterval(progressBarInterval);
          }
          document.getElementById('progress').style.width = '0px';
        },
        isSearch: function isSearch() {
          return resultsBox && resultsBox.style.display === 'block';
        }
      };

      window.addEventListener('resize', function () {
        if (!UI.isSearch()) return;
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function () {
          var lastnCardsPerPage = UI.nCardsPerPage;
          setCardCountPerPage(window.innerWidth);
          UI.setDimensions();
          var frames = document.getElementsByClassName(FRAME);
          for (var i = 0; i < frames.length; i++) {
            var left = UI.CARD_WIDTH * i;
            frames[i].style.left = left + 'px';
            UI.lastResults[i] && (UI.lastResults[i].left = left);
            frames[i].style.width = UI.CARD_WIDTH + 'px';
          }
          setResultNavigation(UI.lastResults);
          UI.currentPage = Math.floor(UI.currentPage * lastnCardsPerPage / UI.nCardsPerPage);
          viewPager.goToIndex(UI.currentPage, 0);
        }, 200);
      });

      window.addEventListener('disconnected', function () {
        var elem = document.getElementById('reconnecting');
        elem && (elem.innerHTML = '<h3>' + CliqzUtils.getLocalizedString('mobile_reconnecting_msg') + '</h3>');
      });

      window.addEventListener('connected', function () {
        var elem = document.getElementById('reconnecting');
        elem && (elem.innerHTML = '');
      });
      _export('default', UI);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,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LENBQUMsU0FBUyxHQUFHLE1BQU0sR0FBQyxVQUFVLENBQUMsa0JBQWtCLENBQUMseUJBQXlCLENBQUMsR0FBQyxPQUFPLENBQUEsQUFBQyxDQUFDO09BQ3BHLENBQUMsQ0FBQzs7QUFFSCxZQUFNLENBQUMsZ0JBQWdCLENBQUMsV0FBVyxFQUFFLFlBQVk7QUFDL0MsWUFBSSxJQUFJLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUNuRCxZQUFJLEtBQUssSUFBSSxDQUFDLFNBQVMsR0FBRyxFQUFFLENBQUEsQUFBQyxDQUFDO09BQy9CLENBQUMsQ0FBQzt5QkFtQ1ksRUFBRSIsImZpbGUiOiJtb2JpbGUtdWkvVUkuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogVGhpcyBpcyB0aGUgbW9kdWxlIHdoaWNoIGNyZWF0ZXMgdGhlIFVJIGZvciB0aGUgcmVzdWx0c1xuICogICAtIHVzZXMgaGFuZGxlYmFycyB0ZW1wbGF0ZXNcbiAqICAgLSBhdHRhY2hlcyBhbGwgdGhlIG5lZWRlZCBsaXN0bmVycyAoa2V5Ym9hcmQvbW91c2UpXG4gKi9cblxuaW1wb3J0IERlbGF5ZWRJbWFnZUxvYWRlciBmcm9tICdtb2JpbGUtdWkvRGVsYXllZEltYWdlTG9hZGVyJztcbmltcG9ydCBoYW5kbGViYXJzIGZyb20gXCJjb3JlL3RlbXBsYXRlc1wiO1xuaW1wb3J0IHsgd2luZG93LCBkb2N1bWVudCB9IGZyb20gJ21vYmlsZS11aS93ZWJ2aWV3JztcblxuLy9UT0RPOiBpbXByb3ZlIGxvYWRpbmcgb2YgdGhlc2Ugdmlld3MhXG5pbXBvcnQgdjEgZnJvbSAnbW9iaWxlLXVpL3ZpZXdzL2N1cnJlbmN5JztcbmltcG9ydCB2MiBmcm9tICdtb2JpbGUtdWkvdmlld3MvZW50aXR5LWdlbmVyaWMnO1xuaW1wb3J0IHYzIGZyb20gJ21vYmlsZS11aS92aWV3cy9nZW5lcmljJztcbmltcG9ydCB2NCBmcm9tICdtb2JpbGUtdWkvdmlld3MvaHEnO1xuaW1wb3J0IHY2IGZyb20gJ21vYmlsZS11aS92aWV3cy9sb2NhbC1kYXRhLXNjJztcbmltcG9ydCB2NyBmcm9tICdtb2JpbGUtdWkvdmlld3Mvc3RvY2tzJztcbmltcG9ydCB2OCBmcm9tICdtb2JpbGUtdWkvdmlld3Mvd2VhdGhlckFsZXJ0JztcbmltcG9ydCB2OSBmcm9tICdtb2JpbGUtdWkvdmlld3Mvd2VhdGhlckVaJztcbmltcG9ydCB2MTAgZnJvbSAnbW9iaWxlLXVpL3ZpZXdzL2xpdmVUaWNrZXInO1xuXG52YXIgcmVzdWx0c0JveCA9IG51bGwsXG4gICAgdmlld1BhZ2VyID0gbnVsbCxcbiAgICBjdXJyZW50UmVzdWx0cyA9IG51bGwsXG4gICAgaW1nTG9hZGVyID0gbnVsbCxcbiAgICBwcm9ncmVzc0JhckludGVydmFsID0gbnVsbCxcbiAgICBQRUVLID0gMjUsXG4gICAgY3VycmVudFJlc3VsdHNDb3VudCA9IDAsXG4gICAgRlJBTUUgPSAnZnJhbWUnO1xuXG52YXIgVUkgPSB7XG4gICAgY3VycmVudFBhZ2U6IDAsXG4gICAgbGFzdFJlc3VsdHM6IG51bGwsXG4gICAgQ0FSRF9XSURUSDogMCxcbiAgICBuQ2FyZHNQZXJQYWdlOiAxLFxuICAgIG5QYWdlczogMSxcbiAgICBEZWxheWVkSW1hZ2VMb2FkZXI6IG51bGwsXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICAvL2NoZWNrIGlmIGxvYWRpbmcgaXMgZG9uZVxuICAgICAgICBpZiAoIWhhbmRsZWJhcnMudHBsQ2FjaGUubWFpbikgcmV0dXJuO1xuICAgICAgICBsZXQgYm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Jlc3VsdHMnKTtcbiAgICAgICAgYm94LmlubmVySFRNTCA9IGhhbmRsZWJhcnMudHBsQ2FjaGUubWFpbigpO1xuXG4gICAgICAgIHJlc3VsdHNCb3ggPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2xpcXotcmVzdWx0cycsIGJveCk7XG5cbiAgICAgICAgdmlld1BhZ2VyID0gVUkuaW5pdFZpZXdwYWdlcigpO1xuXG4gICAgICAgIHJlc3VsdHNCb3guYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCByZXN1bHRDbGljayk7XG5cbiAgICAgICAgLy8gRklYTUU6IGltcG9ydCBkb2VzIG5vdCB3b3JrXG4gICAgICAgIFVJLkRlbGF5ZWRJbWFnZUxvYWRlciA9IFN5c3RlbS5nZXQoJ21vYmlsZS11aS9EZWxheWVkSW1hZ2VMb2FkZXInKS5kZWZhdWx0O1xuICAgICAgICBsb2FkVmlld3MoKTtcbiAgICAgICAgc3Vic2NyaWJlRXZlbnRzKCk7XG4gICAgfSxcbiAgICBzZXREaW1lbnNpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICBVSS5DQVJEX1dJRFRIID0gd2luZG93LmlubmVyV2lkdGggIC0gIDIgKiBQRUVLO1xuICAgICAgVUkuQ0FSRF9XSURUSCAvPSBVSS5uQ2FyZHNQZXJQYWdlO1xuICAgIH0sXG4gICAgcmVuZGVyUmVzdWx0czogZnVuY3Rpb24ocikge1xuXG4gICAgICBjb25zdCByZW5kZXJlZFJlc3VsdHMgPSBVSS5yZXN1bHRzKHIpO1xuXG4gICAgICBVSS5sYXN0UmVzdWx0cyA9IHJlbmRlcmVkUmVzdWx0cztcblxuICAgICAgQ0xJUVouVUkuc3RvcFByb2dyZXNzQmFyKCk7XG5cbiAgICAgIHJldHVybiByZW5kZXJlZFJlc3VsdHM7XG4gICAgfSxcbiAgICBzZXRUaGVtZTogZnVuY3Rpb24gKGluY29nbml0byA9IGZhbHNlKSB7XG4gICAgICB3aW5kb3cuZG9jdW1lbnQuYm9keS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBpbmNvZ25pdG8gPyAnIzRhNGE0YScgOiAnI0U4RThFOCc7XG4gICAgfSxcbiAgICBzZXRNb2JpbGVCYXNlZFVybHM6IGZ1bmN0aW9uICAobykge1xuICAgICAgaWYgKCFvKSByZXR1cm47XG4gICAgICBjb25zdCB1cmwgPSBvLmRhdGEgJiYgby5kYXRhLm1vYmlsZV91cmw7XG4gICAgICBpZiAoby52YWwpIHtcbiAgICAgICAgby52YWwgPSB1cmwgfHwgby52YWw7XG4gICAgICB9XG4gICAgICBpZiAoby51cmwpIHtcbiAgICAgICAgby51cmwgPSB1cmwgfHwgby51cmw7XG4gICAgICB9XG4gICAgICBpZiAoby51cmwgJiYgby5tX3VybCkge1xuICAgICAgICBvLnVybCA9IG8ubV91cmw7XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBpIGluIG8pIHtcbiAgICAgICAgaWYgKHR5cGVvZihvW2ldKSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIFVJLnNldE1vYmlsZUJhc2VkVXJscyhvW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgcmVzdWx0czogZnVuY3Rpb24gKHIpIHtcblxuICAgICAgVUkuY3VycmVudFBhZ2UgPSAwO1xuICAgICAgdmlld1BhZ2VyLmdvVG9JbmRleChVSS5jdXJyZW50UGFnZSk7XG4gICAgICBVSS5zZXRNb2JpbGVCYXNlZFVybHMocik7XG5cbiAgICAgIHNldENhcmRDb3VudFBlclBhZ2Uod2luZG93LmlubmVyV2lkdGgpO1xuXG4gICAgICBVSS5zZXREaW1lbnNpb25zKCk7XG5cbiAgICAgIHZhciBlbmdpbmUgPSBDbGlxelV0aWxzLmdldERlZmF1bHRTZWFyY2hFbmdpbmUoKTtcbiAgICAgIHZhciBkZXRhaWxzID0gQ2xpcXpVdGlscy5nZXREZXRhaWxzRnJvbVVybChlbmdpbmUudXJsKTtcbiAgICAgIHZhciBsb2dvID0gQ2xpcXpVdGlscy5nZXRMb2dvRGV0YWlscyhkZXRhaWxzKTtcblxuICAgICAgdmFyIGVuaGFuY2VkUmVzdWx0cyA9IGVuaGFuY2VSZXN1bHRzKHIuX3Jlc3VsdHMpO1xuXG4gICAgICBjdXJyZW50UmVzdWx0cyA9IHtcbiAgICAgICAgc2VhcmNoU3RyaW5nOiByLl9zZWFyY2hTdHJpbmcsXG4gICAgICAgIGZyYW1lV2lkdGg6IFVJLkNBUkRfV0lEVEgsXG4gICAgICAgIHJlc3VsdHM6IGVuaGFuY2VkUmVzdWx0cyxcbiAgICAgICAgaXNJbnN0YW50OiBmYWxzZSxcbiAgICAgICAgaXNNaXhlZDogdHJ1ZSxcbiAgICAgICAgZ29vZ2xlVGhpczoge1xuICAgICAgICAgIHRpdGxlOiBDbGlxelV0aWxzLmdldExvY2FsaXplZFN0cmluZygnbW9iaWxlX21vcmVfcmVzdWx0c190aXRsZScpLFxuICAgICAgICAgIGFjdGlvbjogQ2xpcXpVdGlscy5nZXRMb2NhbGl6ZWRTdHJpbmcoJ21vYmlsZV9tb3JlX3Jlc3VsdHNfYWN0aW9uJywgZW5naW5lLm5hbWUpLFxuICAgICAgICAgIGxlZnQ6IFVJLkNBUkRfV0lEVEggKiBlbmhhbmNlZFJlc3VsdHMubGVuZ3RoLFxuICAgICAgICAgIGZyYW1lV2lkdGg6IFVJLkNBUkRfV0lEVEgsXG4gICAgICAgICAgc2VhcmNoU3RyaW5nOiBlbmNvZGVVUklDb21wb25lbnQoci5fc2VhcmNoU3RyaW5nKSxcbiAgICAgICAgICBzZWFyY2hFbmdpbmVVcmw6IGVuZ2luZS51cmwsXG4gICAgICAgICAgbG9nbzogbG9nbyxcbiAgICAgICAgICBiYWNrZ3JvdW5kOiBsb2dvLmJhY2tncm91bmRDb2xvclxuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgICB2YXIgcXVlcnkgPSBjdXJyZW50UmVzdWx0cy5zZWFyY2hTdHJpbmcgfHwgJyc7XG5cbiAgICAgICAgaWYgKGltZ0xvYWRlcikgaW1nTG9hZGVyLnN0b3AoKTtcblxuICAgICAgICAvLyBSZXN1bHRzIHRoYXQgYXJlIG5vdCByZWFkeSAoZXh0cmEgcmVzdWx0cywgZm9yIHdoaWNoIHdlIHJlY2VpdmVkIGEgY2FsbGJhY2tfdXJsKVxuICAgICAgICB2YXIgYXN5bmNSZXN1bHRzID0gY3VycmVudFJlc3VsdHMucmVzdWx0cy5maWx0ZXIoYXNzZXNzQXN5bmModHJ1ZSkpO1xuICAgICAgICBjdXJyZW50UmVzdWx0cy5yZXN1bHRzID0gY3VycmVudFJlc3VsdHMucmVzdWx0cy5maWx0ZXIoYXNzZXNzQXN5bmMoZmFsc2UpKTtcblxuICAgICAgICByZWRyYXdEcm9wZG93bihoYW5kbGViYXJzLnRwbENhY2hlLnJlc3VsdHMoY3VycmVudFJlc3VsdHMpLCBxdWVyeSk7XG5cbiAgICAgICAgaWYgKGFzeW5jUmVzdWx0cy5sZW5ndGgpIGxvYWRBc3luY1Jlc3VsdChhc3luY1Jlc3VsdHMsIHF1ZXJ5KTtcblxuICAgICAgICBpbWdMb2FkZXIgPSBuZXcgVUkuRGVsYXllZEltYWdlTG9hZGVyKCcjY2xpcXotcmVzdWx0cyBpbWdbZGF0YS1zcmNdLCAjY2xpcXotcmVzdWx0cyBkaXZbZGF0YS1zdHlsZV0sICNjbGlxei1yZXN1bHRzIHNwYW5bZGF0YS1zdHlsZV0nKTtcbiAgICAgICAgaW1nTG9hZGVyLnN0YXJ0KCk7XG5cbiAgICAgICAgY3Jvc3NUcmFuc2Zvcm0ocmVzdWx0c0JveCwgMCk7XG5cbiAgICAgICAgc2V0UmVzdWx0TmF2aWdhdGlvbihjdXJyZW50UmVzdWx0cy5yZXN1bHRzKTtcblxuICAgICAgICByZXR1cm4gY3VycmVudFJlc3VsdHMucmVzdWx0cztcbiAgICB9LFxuICAgIFZJRVdTOiB7fSxcbiAgICBpbml0Vmlld3BhZ2VyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB2aWV3cyA9IHt9LFxuICAgICAgICAgICAgcGFnZVNob3dUcyA9IERhdGUubm93KCksXG4gICAgICAgICAgICBpbm5lcldpZHRoID0gd2luZG93LmlubmVyV2lkdGgsXG4gICAgICAgICAgICBvZmZzZXQgPSAwO1xuXG4gICAgICAgIHJldHVybiBuZXcgVmlld1BhZ2VyKHJlc3VsdHNCb3gsIHtcbiAgICAgICAgICBkcmFnU2l6ZTogd2luZG93LmlubmVyV2lkdGgsXG4gICAgICAgICAgcHJldmVudF9hbGxfbmF0aXZlX3Njcm9sbGluZzogZmFsc2UsXG4gICAgICAgICAgdmVydGljYWw6IGZhbHNlLFxuICAgICAgICAgIGFuaW1fZHVyYXRpb246NDAwLFxuICAgICAgICAgIHRpcHBpbmdfcG9pbnQ6MC40LFxuICAgICAgICAgIG9uUGFnZVNjcm9sbCA6IGZ1bmN0aW9uIChzY3JvbGxJbmZvKSB7XG4gICAgICAgICAgICBvZmZzZXQgPSAtc2Nyb2xsSW5mby50b3RhbE9mZnNldDtcbiAgICAgICAgICAgIGNyb3NzVHJhbnNmb3JtKHJlc3VsdHNCb3gsIChvZmZzZXQgKiBVSS5DQVJEX1dJRFRIICogVUkubkNhcmRzUGVyUGFnZSkpO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBvblBhZ2VDaGFuZ2UgOiBmdW5jdGlvbiAocGFnZSkge1xuICAgICAgICAgICAgcGFnZSA9IE1hdGguYWJzKHBhZ2UpO1xuXG4gICAgICAgICAgICBpZiAocGFnZSA9PT0gVUkuY3VycmVudFBhZ2UgfHwgIVVJLmlzU2VhcmNoKCkpIHJldHVybjtcblxuICAgICAgICAgICAgdmlld3NbcGFnZV0gPSAodmlld3NbcGFnZV0gfHwgMCkgKyAxO1xuXG5cbiAgICAgICAgICAgIENsaXF6VXRpbHMudGVsZW1ldHJ5KHtcbiAgICAgICAgICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc3dpcGUnLFxuICAgICAgICAgICAgICBzd2lwZV9kaXJlY3Rpb246IHBhZ2UgPiBVSS5jdXJyZW50UGFnZSA/ICdyaWdodCcgOiAnbGVmdCcsXG4gICAgICAgICAgICAgIGN1cnJlbnRfcG9zaXRpb246IHBhZ2UsXG4gICAgICAgICAgICAgIHZpZXdzOiB2aWV3c1twYWdlXSxcbiAgICAgICAgICAgICAgcHJldl9wb3NpdGlvbjogVUkuY3VycmVudFBhZ2UsXG4gICAgICAgICAgICAgIHByZXZfZGlzcGxheV90aW1lOiBEYXRlLm5vdygpIC0gcGFnZVNob3dUc1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHBhZ2VTaG93VHMgPSBEYXRlLm5vdygpO1xuXG4gICAgICAgICAgICBVSS5jdXJyZW50UGFnZSA9IHBhZ2U7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGhpZGVSZXN1bHRzQm94OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmVzdWx0c0JveC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH0sXG4gICAgdXBkYXRlU2VhcmNoQ2FyZDogZnVuY3Rpb24gKGVuZ2luZSkge1xuICAgICAgdmFyIGVuZ2luZURpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWZhdWx0RW5naW5lJyk7XG4gICAgICBpZiAoZW5naW5lRGl2ICYmIENsaXF6QXV0b2NvbXBsZXRlLmxhc3RTZWFyY2gpIHtcbiAgICAgICAgZW5naW5lRGl2LnNldEF0dHJpYnV0ZSgndXJsJywgZW5naW5lLnVybCArIGVuY29kZVVSSUNvbXBvbmVudChDbGlxekF1dG9jb21wbGV0ZS5sYXN0U2VhcmNoKSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBzdGFydFByb2dyZXNzQmFyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBzdXNwZW5kZWRcbiAgICAgIHJldHVybjtcbiAgICAgIGlmIChwcm9ncmVzc0JhckludGVydmFsKSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwocHJvZ3Jlc3NCYXJJbnRlcnZhbCk7XG4gICAgICB9XG4gICAgICB2YXIgbXVsdGlwbGllciA9IHBhcnNlSW50KE1hdGguY2VpbCh3aW5kb3cuaW5uZXJXaWR0aC8xMDApKSxcbiAgICAgIHByb2dyZXNzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Byb2dyZXNzJyksXG4gICAgICBpID0gMDtcbiAgICAgIHByb2dyZXNzQmFySW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgcHJvZ3Jlc3Muc3R5bGUud2lkdGggPSAoaSptdWx0aXBsaWVyKSsncHgnO1xuICAgICAgfSwyMCk7XG5cbiAgICAgIHNldFRpbWVvdXQoVUkuc3RvcFByb2dyZXNzQmFyLDQwMDApO1xuICAgIH0sXG5cbiAgICBzdG9wUHJvZ3Jlc3NCYXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIHN1c3BlbmRlZFxuICAgICAgcmV0dXJuO1xuICAgICAgaWYgKHByb2dyZXNzQmFySW50ZXJ2YWwpIHtcbiAgICAgICAgY2xlYXJJbnRlcnZhbChwcm9ncmVzc0JhckludGVydmFsKTtcbiAgICAgIH1cbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcm9ncmVzcycpLnN0eWxlLndpZHRoID0gJzBweCc7XG4gICAgfSxcbiAgICBpc1NlYXJjaDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHJlc3VsdHNCb3ggJiYgcmVzdWx0c0JveC5zdHlsZS5kaXNwbGF5ID09PSAnYmxvY2snO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIHNldENhcmRDb3VudFBlclBhZ2Uod2luZG93V2lkdGgpIHtcbiAgVUkubkNhcmRzUGVyUGFnZSA9IE1hdGguZmxvb3Iod2luZG93V2lkdGggLyAzMjApIHx8IDE7XG59XG5cblxuZnVuY3Rpb24gbG9hZEFzeW5jUmVzdWx0KHJlcywgcXVlcnkpIHtcbiAgICBmb3IgKHZhciBpIGluIHJlcykge1xuICAgICAgdmFyIHIgPSByZXNbaV07XG4gICAgICB2YXIgcXQgPSBxdWVyeSArIFwiOiBcIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgQ2xpcXpVdGlscy5sb2cocixcIkxPQURJTkdBU1lOQ1wiKTtcbiAgICAgIENsaXF6VXRpbHMubG9nKHF1ZXJ5LFwibG9hZEFzeW5jUmVzdWx0XCIpO1xuICAgICAgdmFyIGxvb3BfY291bnQgPSAwO1xuICAgICAgdmFyIGFzeW5jX2NhbGxiYWNrID0gZnVuY3Rpb24gKHJlcSkge1xuICAgICAgICAgIENsaXF6VXRpbHMubG9nKHF1ZXJ5LFwiYXN5bmNfY2FsbGJhY2tcIik7XG4gICAgICAgICAgdmFyIHJlc3AgPSBudWxsO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXNwID0gSlNPTi5wYXJzZShyZXEucmVzcG9uc2UpLnJlc3VsdHNbMF07XG4gICAgICAgICAgfVxuICAgICAgICAgIGNhdGNoKGVycikge1xuICAgICAgICAgICAgcmVzLnNwbGljZShpLDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVzcCAmJiAgQ2xpcXpBdXRvY29tcGxldGUubGFzdFNlYXJjaCA9PT0gcXVlcnkpIHtcblxuICAgICAgICAgICAgdmFyIGtpbmQgPSByLmRhdGEua2luZDtcbiAgICAgICAgICAgIGlmIChcIl9fY2FsbGJhY2tfdXJsX19cIiBpbiByZXNwLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgcmVzdWx0IGlzIGFnYWluIGEgcHJvbWlzZSwgcmV0cnkuXG4gICAgICAgICAgICAgICAgaWYgKGxvb3BfY291bnQgPCAxMCAvKnNtYXJ0Q2xpcXpNYXhBdHRlbXB0cyovKSB7XG4gICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9vcF9jb3VudCArPSAxO1xuICAgICAgICAgICAgICAgICAgICBDbGlxelV0aWxzLmh0dHBHZXQocmVzcC5kYXRhLl9fY2FsbGJhY2tfdXJsX18sIGFzeW5jX2NhbGxiYWNrLCBhc3luY19jYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgICB9LCAxMDAgLypzbWFydENsaXF6V2FpdFRpbWUqLyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFjdXJyZW50UmVzdWx0cy5yZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgcmVkcmF3RHJvcGRvd24oaGFuZGxlYmFycy50cGxDYWNoZS5ub1Jlc3VsdChDbGlxelV0aWxzLmdldE5vUmVzdWx0cygpKSwgcXVlcnkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICByLmRhdGEgPSByZXNwLmRhdGE7XG4gICAgICAgICAgICAgIHIudXJsID0gcmVzcC51cmw7XG4gICAgICAgICAgICAgIHIuZGF0YS5raW5kID0ga2luZDtcbiAgICAgICAgICAgICAgci5kYXRhLnN1YlR5cGUgPSByZXNwLnN1YlR5cGU7XG4gICAgICAgICAgICAgIHIuZGF0YS50cmlnZ2VyX3VybHMgPSByZXNwLnRyaWdnZXJfdXJscztcbiAgICAgICAgICAgICAgci52ZXJ0aWNhbCA9IGdldFZlcnRpY2FsKHIpO1xuICAgICAgICAgICAgICByLnVybERldGFpbHMgPSBDbGlxelV0aWxzLmdldERldGFpbHNGcm9tVXJsKHIudXJsKTtcbiAgICAgICAgICAgICAgci5sb2dvID0gQ2xpcXpVdGlscy5nZXRMb2dvRGV0YWlscyhyLnVybERldGFpbHMpO1xuXG4gICAgICAgICAgICAgIGlmIChyZXN1bHRzQm94ICYmIENsaXF6QXV0b2NvbXBsZXRlLmxhc3RTZWFyY2ggPT09IHF1ZXJ5KSB7XG4gICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgYWxsIGV4aXN0aW5nIGV4dHJhIHJlc3VsdHNcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRSZXN1bHRzLnJlc3VsdHMgPSBjdXJyZW50UmVzdWx0cy5yZXN1bHRzLmZpbHRlcihmdW5jdGlvbiAocikgeyByZXR1cm4gci50eXBlICE9PSAnY2xpcXotZXh0cmEnOyB9ICk7XG4gICAgICAgICAgICAgICAgICAvLyBhZGQgdGhlIGN1cnJlbnQgb25lIG9uIHRvcCBvZiB0aGUgbGlzdFxuICAgICAgICAgICAgICAgICAgY3VycmVudFJlc3VsdHMucmVzdWx0cy51bnNoaWZ0KHIpO1xuXG4gICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFJlc3VsdHMucmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVkcmF3RHJvcGRvd24oaGFuZGxlYmFycy50cGxDYWNoZS5yZXN1bHRzKGN1cnJlbnRSZXN1bHRzKSwgcXVlcnkpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZHJhd0Ryb3Bkb3duKGhhbmRsZWJhcnMudHBsQ2FjaGUubm9SZXN1bHQoQ2xpcXpVdGlscy5nZXROb1Jlc3VsdHMoKSksIHF1ZXJ5KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGltZ0xvYWRlciA9IG5ldyBVSS5EZWxheWVkSW1hZ2VMb2FkZXIoJyNjbGlxei1yZXN1bHRzIGltZ1tkYXRhLXNyY10sICNjbGlxei1yZXN1bHRzIGRpdltkYXRhLXN0eWxlXSwgI2NsaXF6LXJlc3VsdHMgc3BhbltkYXRhLXN0eWxlXScpO1xuICAgICAgICAgICAgICAgICAgaW1nTG9hZGVyLnN0YXJ0KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gdG8gaGFuZGxlIGJyb2tlbiBwcm9taXNlcyAoZWcuIFdlYXRoZXIgYW5kIGZsaWdodHMpIG9uIG1vYmlsZVxuICAgICAgICAgIGVsc2UgaWYgKHIuZGF0YSAmJiByLmRhdGEuX19jYWxsYmFja191cmxfXykge1xuICAgICAgICAgICAgc2hpZnRSZXN1bHRzKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzLnNwbGljZShpLDEpO1xuICAgICAgICAgICAgaWYgKCFjdXJyZW50UmVzdWx0cy5yZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICByZWRyYXdEcm9wZG93bihoYW5kbGViYXJzLnRwbENhY2hlLm5vUmVzdWx0KENsaXF6VXRpbHMuZ2V0Tm9SZXN1bHRzKCkpLCBxdWVyeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICB9O1xuICAgICAgQ2xpcXpVdGlscy5odHRwR2V0KHIuZGF0YS5fX2NhbGxiYWNrX3VybF9fLCBhc3luY19jYWxsYmFjaywgYXN5bmNfY2FsbGJhY2spO1xuICAgIH1cbn1cblxuXG5mdW5jdGlvbiBhc3Nlc3NBc3luYyhnZXRBc3luYykge1xuICAgIHJldHVybiBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgIHZhciBpc0FzeW5jID0gcmVzdWx0LnR5cGUgPT09ICdjbGlxei1leHRyYScgJiYgcmVzdWx0LmRhdGEgJiYgJ19fY2FsbGJhY2tfdXJsX18nIGluIHJlc3VsdC5kYXRhIDtcbiAgICAgICAgcmV0dXJuIGdldEFzeW5jID8gaXNBc3luYyA6ICFpc0FzeW5jO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHJlZHJhd0Ryb3Bkb3duKG5ld0hUTUwpIHtcbiAgICByZXN1bHRzQm94LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXG4gICAgcmVzdWx0c0JveC5pbm5lckhUTUwgPSBuZXdIVE1MO1xufVxuXG5mdW5jdGlvbiBnZXRWZXJ0aWNhbChyZXN1bHQpIHtcbiAgLy8gaWYgaGlzdG9yeSByZWNvcmRzIGFyZSBsZXNzIHRoYW4gMyBpdCBnb2VzIHRvIGdlbmVyaWNcbiAgbGV0IHRlbXBsYXRlO1xuICBpZiAocmVzdWx0LmRhdGEudGVtcGxhdGUgPT09ICdwYXR0ZXJuLWgzJykge1xuICAgIHRlbXBsYXRlID0gJ2hpc3RvcnknO1xuICB9IGVsc2UgaWYgKENsaXF6VXRpbHMuVEVNUExBVEVTW3Jlc3VsdC5kYXRhLnN1cGVyVGVtcGxhdGVdKSB7XG4gICAgICB0ZW1wbGF0ZSA9IHJlc3VsdC5kYXRhLnN1cGVyVGVtcGxhdGU7XG4gIH0gZWxzZSBpZihDbGlxelV0aWxzLlRFTVBMQVRFU1tyZXN1bHQuZGF0YS50ZW1wbGF0ZV0pIHtcbiAgICB0ZW1wbGF0ZSA9IHJlc3VsdC5kYXRhLnRlbXBsYXRlXG4gIH0gZWxzZSB7XG4gICAgdGVtcGxhdGUgPSAnZ2VuZXJpYyc7XG4gIH1cbiAgcmV0dXJuIHRlbXBsYXRlO1xufVxuXG5mdW5jdGlvbiBlbmhhbmNlUmVzdWx0cyhyZXN1bHRzKSB7XG4gIGxldCBlbmhhbmNlZFJlc3VsdHMgPSBbXTtcbiAgcmVzdWx0cy5mb3JFYWNoKChyLCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IF90bXAgPSBnZXREZWJ1Z01zZyhyLmNvbW1lbnQgfHwgJycpO1xuICAgIGNvbnN0IHVybCA9IHIudmFsIHx8ICcnO1xuICAgIGNvbnN0IHVybERldGFpbHMgPSBDbGlxelV0aWxzLmdldERldGFpbHNGcm9tVXJsKHVybCk7XG5cbiAgICBlbmhhbmNlZFJlc3VsdHMucHVzaChlbmhhbmNlU3BlY2lmaWNSZXN1bHQoe1xuICAgICAgcXVlcnk6IHIucXVlcnksXG4gICAgICB0eXBlOiByLnN0eWxlLFxuICAgICAgbGVmdDogKFVJLkNBUkRfV0lEVEggKiBpbmRleCksXG4gICAgICBkYXRhOiByLmRhdGEgfHwge30sXG4gICAgICB1cmwsXG4gICAgICB1cmxEZXRhaWxzLFxuICAgICAgbG9nbzogQ2xpcXpVdGlscy5nZXRMb2dvRGV0YWlscyh1cmxEZXRhaWxzKSxcbiAgICAgIHRpdGxlOiBfdG1wWzBdLFxuICAgICAgZGVidWc6IF90bXBbMV1cbiAgICB9KSk7XG4gIH0pO1xuXG4gIGxldCBmaWx0ZXJlZFJlc3VsdHMgPSBlbmhhbmNlZFJlc3VsdHMuZmlsdGVyKGZ1bmN0aW9uIChyKSB7IHJldHVybiAhKHIuZGF0YSAmJiByLmRhdGEuYWR1bHQpOyB9KTtcblxuICAvLyBpZiB0aGVyZSBubyByZXN1bHRzIGFmdGVyIGFkdWx0IGZpbHRlciAtIHNob3cgbm8gcmVzdWx0cyBlbnRyeVxuICBpZiAoIWZpbHRlcmVkUmVzdWx0cy5sZW5ndGgpIHtcbiAgICBmaWx0ZXJlZFJlc3VsdHMucHVzaChDbGlxelV0aWxzLmdldE5vUmVzdWx0cygpKTtcbiAgICBmaWx0ZXJlZFJlc3VsdHNbMF0udmVydGljYWwgPSAnbm9SZXN1bHQnO1xuICB9XG5cbiAgcmV0dXJuIGZpbHRlcmVkUmVzdWx0cztcbn1cblxuLy8gZGVidWcgbWVzc2FnZSBhcmUgYXQgdGhlIGVuZCBvZiB0aGUgdGl0bGUgbGlrZSB0aGlzOiBcInRpdGxlIChkZWJ1ZykhXCJcbmZ1bmN0aW9uIGdldERlYnVnTXNnKGZ1bGxUaXRsZSkge1xuICAgIC8vIHJlZ2V4IG1hdGNoZXMgdHdvIHBhcnRzOlxuICAgIC8vIDEpIHRoZSB0aXRsZSwgY2FuIGJlIGFueXRoaW5nIChbXFxzXFxTXSBpcyBtb3JlIGluY2x1c2l2ZSB0aGFuICcuJyBhcyBpdCBpbmNsdWRlcyBuZXdsaW5lKVxuICAgIC8vIGZvbGxvd2VkIGJ5OlxuICAgIC8vIDIpIGEgZGVidWcgc3RyaW5nIGxpa2UgdGhpcyBcIiAoZGVidWcpIVwiXG4gICAgaWYgKGZ1bGxUaXRsZSA9PT0gbnVsbCkge1xuICAgICAgcmV0dXJuIFtudWxsLCBudWxsXTtcbiAgICB9XG4gICAgY29uc3QgciA9IGZ1bGxUaXRsZS5tYXRjaCgvXihbXFxzXFxTXSspIFxcKCguKilcXCkhJC8pO1xuICAgIGlmIChyICYmIHIubGVuZ3RoID49IDMpIHtcbiAgICAgIHJldHVybiBbclsxXSwgclsyXV07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgcmV0dXJuIFtmdWxsVGl0bGUsIG51bGxdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZW5oYW5jZVNwZWNpZmljUmVzdWx0KHIpIHtcbiAgY29uc3QgY29udGVudEFyZWEgPSB7XG4gICAgd2lkdGg6IFVJLkNBUkRfV0lEVEgsXG4gICAgaGVpZ2h0OiB3aW5kb3cuc2NyZWVuLmhlaWdodFxuICB9O1xuXG4gIGlmIChyLnN1YlR5cGUgJiYgSlNPTi5wYXJzZShyLnN1YlR5cGUpLmV6KSB7XG4gICAgICAvLyBJbmRpY2F0ZSB0aGF0IHRoaXMgaXMgYSBSSCByZXN1bHQuXG4gICAgICByLnR5cGUgPSAnY2xpcXotZXh0cmEnO1xuICB9XG5cbiAgY29uc3QgdGVtcGxhdGUgPSByLnZlcnRpY2FsID0gZ2V0VmVydGljYWwocik7XG5cbiAgY29uc3Qgc3BlY2lmaWNWaWV3ID0gVUkuVklFV1NbdGVtcGxhdGVdIHx8IFVJLlZJRVdTLmdlbmVyaWM7XG4gIHNwZWNpZmljVmlldy5lbmhhbmNlUmVzdWx0cyAmJiBzcGVjaWZpY1ZpZXcuZW5oYW5jZVJlc3VsdHMoci5kYXRhLCBjb250ZW50QXJlYSk7XG5cbiAgcmV0dXJuIHI7XG5cbn1cblxuZnVuY3Rpb24gY3Jvc3NUcmFuc2Zvcm0gKGVsZW1lbnQsIHgpIHtcbiAgdmFyIHBsYXRmb3JtcyA9IFsnJywgJy13ZWJraXQtJywgJy1tcy0nXTtcbiAgcGxhdGZvcm1zLmZvckVhY2goZnVuY3Rpb24gKHBsYXRmb3JtKSB7XG4gICAgZWxlbWVudC5zdHlsZVtwbGF0Zm9ybSArICd0cmFuc2Zvcm0nXSA9ICd0cmFuc2xhdGUzZCgnKyB4ICsncHgsIDBweCwgMHB4KSc7XG4gIH0pO1xufVxuXG5mdW5jdGlvbiBnZXRSZXN1bHRLaW5kKGVsKSB7XG4gICAgcmV0dXJuIGdldFJlc3VsdE9yQ2hpbGRBdHRyKGVsLCAna2luZCcpLnNwbGl0KCc7Jyk7XG59XG5cbi8vIGJ1YmJsZXMgdXAgbWF4aW11bSB0byB0aGUgcmVzdWx0IGNvbnRhaW5lclxuZnVuY3Rpb24gZ2V0UmVzdWx0T3JDaGlsZEF0dHIoZWwsIGF0dHIpIHtcbiAgaWYgKGVsID09PSBudWxsKSByZXR1cm4gJyc7XG4gIGlmIChlbC5jbGFzc05hbWUgPT09IEZSQU1FKSByZXR1cm4gZWwuZ2V0QXR0cmlidXRlKGF0dHIpIHx8ICcnO1xuICByZXR1cm4gZWwuZ2V0QXR0cmlidXRlKGF0dHIpIHx8IGdldFJlc3VsdE9yQ2hpbGRBdHRyKGVsLnBhcmVudEVsZW1lbnQsIGF0dHIpO1xufVxuXG5mdW5jdGlvbiByZXN1bHRDbGljayhldikge1xuICAgIHZhciBlbCA9IGV2LnRhcmdldCwgdXJsLFxuICAgICAgICBleHRyYSxcbiAgICAgICAgYWN0aW9uO1xuXG4gICAgd2hpbGUgKGVsKSB7XG4gICAgICAgIGV4dHJhID0gZXh0cmEgfHwgZWwuZ2V0QXR0cmlidXRlKCdleHRyYScpO1xuICAgICAgICB1cmwgPSBlbC5nZXRBdHRyaWJ1dGUoJ3VybCcpO1xuICAgICAgICBhY3Rpb24gPSBlbC5nZXRBdHRyaWJ1dGUoJ2NsaXF6LWFjdGlvbicpO1xuXG4gICAgICAgIGlmICh1cmwgJiYgdXJsICE9PSAnIycpIHtcblxuICAgICAgICAgICAgdmFyIGNhcmQgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdjYXJkJylbVUkuY3VycmVudFBhZ2VdO1xuICAgICAgICAgICAgdmFyIGNhcmRQb3NpdGlvbiA9IGNhcmQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICB2YXIgY29vcmRpbmF0ZSA9IFtldi5jbGllbnRYIC0gY2FyZFBvc2l0aW9uLmxlZnQsIGV2LmNsaWVudFkgLSBjYXJkUG9zaXRpb24udG9wLCBVSS5DQVJEX1dJRFRIXTtcblxuICAgICAgICAgICAgdmFyIHNpZ25hbCA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYWN0aXZpdHknLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ3Jlc3VsdF9jbGljaycsXG4gICAgICAgICAgICAgICAgZXh0cmE6IGV4dHJhLFxuICAgICAgICAgICAgICAgIG1vdXNlOiBjb29yZGluYXRlLFxuICAgICAgICAgICAgICAgIHBvc2l0aW9uX3R5cGU6IGdldFJlc3VsdEtpbmQoZWwpLFxuICAgICAgICAgICAgICAgIGN1cnJlbnRfcG9zaXRpb246IFVJLmN1cnJlbnRQYWdlXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBDbGlxelV0aWxzLnRlbGVtZXRyeShzaWduYWwpO1xuICAgICAgICAgICAgQ2xpcXpVdGlscy5vcGVuTGluayh3aW5kb3csIHVybCk7XG4gICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgfSBlbHNlIGlmIChhY3Rpb24pIHtcbiAgICAgICAgICAgIHN3aXRjaCAoYWN0aW9uKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnc3RvcC1jbGljay1ldmVudC1wcm9wYWdhdGlvbic6XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICBjYXNlICdjb3B5LWNhbGMtYW5zd2VyJzpcbiAgICAgICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5jb3B5UmVzdWx0KGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYWxjLWFuc3dlcicpLmlubmVySFRNTCk7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYWxjLWNvcGllZC1tc2cnKS5zdHlsZS5kaXNwbGF5ID0gJyc7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjYWxjLWNvcHktbXNnJykuc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZWwuY2xhc3NOYW1lID09PSBGUkFNRSkgYnJlYWs7IC8vIGRvIG5vdCBnbyBoaWdoZXIgdGhhbiBhIHJlc3VsdFxuICAgICAgICBlbCA9IGVsLnBhcmVudEVsZW1lbnQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBzaGlmdFJlc3VsdHMoKSB7XG4gIHZhciBmcmFtZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKCdmcmFtZScpO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgIHZhciBsZWZ0ID0gZnJhbWVzW2ldLnN0eWxlLmxlZnQuc3Vic3RyaW5nKDAsIGZyYW1lc1tpXS5zdHlsZS5sZWZ0Lmxlbmd0aCAtIDEpO1xuICAgIGxlZnQgPSBwYXJzZUludChsZWZ0KTtcbiAgICBsZWZ0IC09IChsZWZ0IC8gKGkgKyAxKSk7XG4gICAgVUkubGFzdFJlc3VsdHNbaV0gJiYgKFVJLmxhc3RSZXN1bHRzW2ldLmxlZnQgPSBsZWZ0KTtcbiAgICBmcmFtZXNbaV0uc3R5bGUubGVmdCA9IGxlZnQgKyAncHgnO1xuICB9XG4gIHNldFJlc3VsdE5hdmlnYXRpb24oVUkubGFzdFJlc3VsdHMpO1xufVxuXG5cbmZ1bmN0aW9uIHNldFJlc3VsdE5hdmlnYXRpb24ocmVzdWx0cykge1xuXG4gIHZhciBzaG93R29vZ2xldGhpcyA9IDE7XG4gIGlmICghcmVzdWx0c1swXSB8fCByZXN1bHRzWzBdLmRhdGEudGVtcGxhdGUgPT09ICdub1Jlc3VsdCcpIHtcbiAgICBzaG93R29vZ2xldGhpcyA9IDA7XG4gIH1cblxuICByZXN1bHRzQm94LnN0eWxlLndpZHRoID0gd2luZG93LmlubmVyV2lkdGggKyAncHgnO1xuICByZXN1bHRzQm94LnN0eWxlLm1hcmdpbkxlZnQgPSBQRUVLICsgJ3B4JztcblxuXG4gIHZhciBsYXN0UmVzdWx0T2Zmc2V0ID0gcmVzdWx0cy5sZW5ndGggPyByZXN1bHRzW3Jlc3VsdHMubGVuZ3RoIC0gMV0ubGVmdCB8fCAwIDogMDtcblxuICBjdXJyZW50UmVzdWx0c0NvdW50ID0gbGFzdFJlc3VsdE9mZnNldCAvIFVJLkNBUkRfV0lEVEggKyBzaG93R29vZ2xldGhpcyArIDE7XG5cbiAgLy8gZ2V0IG51bWJlciBvZiBwYWdlcyBhY2NvcmRpbmcgdG8gbnVtYmVyIG9mIGNhcmRzIHBlciBwYWdlXG4gIFVJLm5QYWdlcyA9IE1hdGguY2VpbChjdXJyZW50UmVzdWx0c0NvdW50IC8gVUkubkNhcmRzUGVyUGFnZSk7XG5cbiAgaWYgKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdXJyZW5jeS10cGwnKSkge1xuICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdjdXJyZW5jeS10cGwnKS5wYXJlbnROb2RlLnJlbW92ZUF0dHJpYnV0ZSgndXJsJyk7XG4gIH1cbn1cblxudmFyIHJlc2l6ZVRpbWVvdXQ7XG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcigncmVzaXplJywgZnVuY3Rpb24gKCkge1xuICBpZiAoIVVJLmlzU2VhcmNoKCkpIHJldHVybjtcbiAgY2xlYXJUaW1lb3V0KHJlc2l6ZVRpbWVvdXQpO1xuICByZXNpemVUaW1lb3V0ID0gc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgY29uc3QgbGFzdG5DYXJkc1BlclBhZ2UgPSBVSS5uQ2FyZHNQZXJQYWdlO1xuICAgIHNldENhcmRDb3VudFBlclBhZ2Uod2luZG93LmlubmVyV2lkdGgpO1xuICAgIFVJLnNldERpbWVuc2lvbnMoKTtcbiAgICBjb25zdCBmcmFtZXMgPSBkb2N1bWVudC5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKEZSQU1FKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZyYW1lcy5sZW5ndGg7IGkrKykge1xuICAgICAgbGV0IGxlZnQgPSBVSS5DQVJEX1dJRFRIICogaTtcbiAgICAgIGZyYW1lc1tpXS5zdHlsZS5sZWZ0ID0gbGVmdCArICdweCc7XG4gICAgICBVSS5sYXN0UmVzdWx0c1tpXSAmJiAoVUkubGFzdFJlc3VsdHNbaV0ubGVmdCA9IGxlZnQpO1xuICAgICAgZnJhbWVzW2ldLnN0eWxlLndpZHRoID0gVUkuQ0FSRF9XSURUSCArICdweCc7XG4gICAgfVxuICAgIHNldFJlc3VsdE5hdmlnYXRpb24oVUkubGFzdFJlc3VsdHMpO1xuICAgIFVJLmN1cnJlbnRQYWdlID0gTWF0aC5mbG9vcihVSS5jdXJyZW50UGFnZSAqIGxhc3RuQ2FyZHNQZXJQYWdlIC8gVUkubkNhcmRzUGVyUGFnZSk7XG4gICAgdmlld1BhZ2VyLmdvVG9JbmRleChVSS5jdXJyZW50UGFnZSwgMCk7XG4gIH0sIDIwMCk7XG5cbn0pO1xuXG53aW5kb3cuYWRkRXZlbnRMaXN0ZW5lcignZGlzY29ubmVjdGVkJywgZnVuY3Rpb24gKCkge1xuICBsZXQgZWxlbSA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZWNvbm5lY3RpbmcnKTtcbiAgZWxlbSAmJiAoZWxlbS5pbm5lckhUTUwgPSAnPGgzPicrQ2xpcXpVdGlscy5nZXRMb2NhbGl6ZWRTdHJpbmcoJ21vYmlsZV9yZWNvbm5lY3RpbmdfbXNnJykrJzwvaDM+Jyk7XG59KTtcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2Nvbm5lY3RlZCcsIGZ1bmN0aW9uICgpIHtcbiAgbGV0IGVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVjb25uZWN0aW5nJyk7XG4gIGVsZW0gJiYgKGVsZW0uaW5uZXJIVE1MID0gJycpO1xufSk7XG5cbmZ1bmN0aW9uIGxvYWRWaWV3cygpIHtcbiAgVUkuY2xpY2tIYW5kbGVycyA9IHt9O1xuICBPYmplY3Qua2V5cyhDbGlxekhhbmRsZWJhcnMuVEVNUExBVEVTKS5jb25jYXQoQ2xpcXpIYW5kbGViYXJzLk1FU1NBR0VfVEVNUExBVEVTKS5jb25jYXQoQ2xpcXpIYW5kbGViYXJzLlBBUlRJQUxTKS5mb3JFYWNoKGZ1bmN0aW9uICh0ZW1wbGF0ZU5hbWUpIHtcbiAgICBVSS5WSUVXU1t0ZW1wbGF0ZU5hbWVdID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICB0cnkge1xuICAgICAgbGV0IG1vZHVsZSA9IFN5c3RlbS5nZXQoJ21vYmlsZS11aS92aWV3cy8nICsgdGVtcGxhdGVOYW1lKTtcbiAgICAgIGlmIChtb2R1bGUpIHtcbiAgICAgICAgVUkuVklFV1NbdGVtcGxhdGVOYW1lXSA9IG5ldyBtb2R1bGUuZGVmYXVsdCh3aW5kb3cpO1xuXG4gICAgICAgIGlmIChVSS5WSUVXU1t0ZW1wbGF0ZU5hbWVdLmV2ZW50cyAmJiBVSS5WSUVXU1t0ZW1wbGF0ZU5hbWVdLmV2ZW50cy5jbGljaykge1xuICAgICAgICAgIE9iamVjdC5rZXlzKFVJLlZJRVdTW3RlbXBsYXRlTmFtZV0uZXZlbnRzLmNsaWNrKS5mb3JFYWNoKGZ1bmN0aW9uIChzZWxlY3Rvcikge1xuICAgICAgICAgICAgVUkuY2xpY2tIYW5kbGVyc1tzZWxlY3Rvcl0gPSBVSS5WSUVXU1t0ZW1wbGF0ZU5hbWVdLmV2ZW50cy5jbGlja1tzZWxlY3Rvcl07XG4gICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIENsaXF6VXRpbHMubG9nKCdmYWlsZWQgdG8gbG9hZCAnICsgdGVtcGxhdGVOYW1lLCAnVUknKTtcbiAgICAgIH1cbiAgICB9IGNhdGNoIChleCkge1xuICAgICAgQ2xpcXpVdGlscy5sb2coZXgsICdVSScpO1xuICAgIH1cbiAgfSk7XG59XG5cbmZ1bmN0aW9uIHN1YnNjcmliZUV2ZW50cygpIHtcbiAgQ2xpcXpFdmVudHMuc3ViKCdzaG93JywganNBUEkub25TaG93KTtcbiAgQ2xpcXpFdmVudHMuc3ViKCdzZWFyY2gnLCBqc0FQSS5zZWFyY2gpO1xuICBDbGlxekV2ZW50cy5zdWIoJ25vdGlmeV9wcmVmZXJlbmNlcycsIGpzQVBJLnNldENsaWVudFByZWZlcmVuY2VzKTtcbiAgQ2xpcXpFdmVudHMuc3ViKCdyZXN0b3JlX2Jsb2NrZWRfdG9wc2l0ZXMnLCBqc0FQSS5yZXN0b3JlQmxvY2tlZFRvcFNpdGVzKTtcbiAgQ2xpcXpFdmVudHMuc3ViKCdyZXNldF9zdGF0ZScsIGpzQVBJLnJlc2V0U3RhdGUpO1xuICBDbGlxekV2ZW50cy5zdWIoJ3NldF9zZWFyY2hfZW5naW5lJywganNBUEkuc2V0RGVmYXVsdFNlYXJjaEVuZ2luZSk7XG4gIENsaXF6RXZlbnRzLnN1YigncHVibGlzaF9jYXJkX3VybCcsIGpzQVBJLmdldENhcmRVcmwpO1xufVxuXG5leHBvcnQgZGVmYXVsdCBVSTtcbiAgICAiXX0=