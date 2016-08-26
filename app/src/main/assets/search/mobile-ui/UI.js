System.register('mobile-ui/UI', ['mobile-ui/DelayedImageLoader', 'core/templates', 'core/mobile-webview', 'mobile-ui/views/currency', 'mobile-ui/views/entity-generic', 'mobile-ui/views/generic', 'mobile-ui/views/hq', 'mobile-ui/views/local-data-sc', 'mobile-ui/views/stocks', 'mobile-ui/views/weatherAlert', 'mobile-ui/views/weatherEZ', 'mobile-ui/views/liveTicker'], function (_export) {
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
          position_type: getResultKind(el)
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

  return {
    setters: [function (_mobileUiDelayedImageLoader) {
      DelayedImageLoader = _mobileUiDelayedImageLoader['default'];
    }, function (_coreTemplates) {
      handlebars = _coreTemplates['default'];
    }, function (_coreMobileWebview) {
      window = _coreMobileWebview.window;
      document = _coreMobileWebview.document;
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
//# sourceMappingURL=data:application/json;base64,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RSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ3BDLFlBQUUsQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxFQUFFLENBQUMsV0FBVyxHQUFHLGlCQUFpQixHQUFHLEVBQUUsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUNuRixtQkFBUyxDQUFDLFNBQVMsQ0FBQyxFQUFFLENBQUMsV0FBVyxFQUFFLENBQUMsQ0FBQyxDQUFDO1NBQ3hDLEVBQUUsR0FBRyxDQUFDLENBQUM7T0FFVCxDQUFDLENBQUM7O0FBRUgsWUFBTSxDQUFDLGdCQUFnQixDQUFDLGNBQWMsRUFBRSxZQUFZO0FBQ2xELFlBQUksSUFBSSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsY0FBYyxDQUFDLENBQUM7QUFDbkQsWUFBSSxLQUFLLElBQUksQ0FBQyxTQUFTLEdBQUcsTUFBTSxHQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyx5QkFBeUIsQ0FBQyxHQUFDLE9BQU8sQ0FBQSxBQUFDLENBQUM7T0FDcEcsQ0FBQyxDQUFDOztBQUVILFlBQU0sQ0FBQyxnQkFBZ0IsQ0FBQyxXQUFXLEVBQUUsWUFBWTtBQUMvQyxZQUFJLElBQUksR0FBRyxRQUFRLENBQUMsY0FBYyxDQUFDLGNBQWMsQ0FBQyxDQUFDO0FBQ25ELFlBQUksS0FBSyxJQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQSxBQUFDLENBQUM7T0FDL0IsQ0FBQyxDQUFDO3lCQXlCWSxFQUFFIiwiZmlsZSI6Im1vYmlsZS11aS9VSS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBUaGlzIGlzIHRoZSBtb2R1bGUgd2hpY2ggY3JlYXRlcyB0aGUgVUkgZm9yIHRoZSByZXN1bHRzXG4gKiAgIC0gdXNlcyBoYW5kbGViYXJzIHRlbXBsYXRlc1xuICogICAtIGF0dGFjaGVzIGFsbCB0aGUgbmVlZGVkIGxpc3RuZXJzIChrZXlib2FyZC9tb3VzZSlcbiAqL1xuXG5pbXBvcnQgRGVsYXllZEltYWdlTG9hZGVyIGZyb20gJ21vYmlsZS11aS9EZWxheWVkSW1hZ2VMb2FkZXInO1xuaW1wb3J0IGhhbmRsZWJhcnMgZnJvbSBcImNvcmUvdGVtcGxhdGVzXCI7XG5pbXBvcnQgeyB3aW5kb3csIGRvY3VtZW50IH0gZnJvbSAnY29yZS9tb2JpbGUtd2Vidmlldyc7XG5cbi8vVE9ETzogaW1wcm92ZSBsb2FkaW5nIG9mIHRoZXNlIHZpZXdzIVxuaW1wb3J0IHYxIGZyb20gJ21vYmlsZS11aS92aWV3cy9jdXJyZW5jeSc7XG5pbXBvcnQgdjIgZnJvbSAnbW9iaWxlLXVpL3ZpZXdzL2VudGl0eS1nZW5lcmljJztcbmltcG9ydCB2MyBmcm9tICdtb2JpbGUtdWkvdmlld3MvZ2VuZXJpYyc7XG5pbXBvcnQgdjQgZnJvbSAnbW9iaWxlLXVpL3ZpZXdzL2hxJztcbmltcG9ydCB2NiBmcm9tICdtb2JpbGUtdWkvdmlld3MvbG9jYWwtZGF0YS1zYyc7XG5pbXBvcnQgdjcgZnJvbSAnbW9iaWxlLXVpL3ZpZXdzL3N0b2Nrcyc7XG5pbXBvcnQgdjggZnJvbSAnbW9iaWxlLXVpL3ZpZXdzL3dlYXRoZXJBbGVydCc7XG5pbXBvcnQgdjkgZnJvbSAnbW9iaWxlLXVpL3ZpZXdzL3dlYXRoZXJFWic7XG5pbXBvcnQgdjEwIGZyb20gJ21vYmlsZS11aS92aWV3cy9saXZlVGlja2VyJztcblxudmFyIHJlc3VsdHNCb3ggPSBudWxsLFxuICAgIHZpZXdQYWdlciA9IG51bGwsXG4gICAgY3VycmVudFJlc3VsdHMgPSBudWxsLFxuICAgIGltZ0xvYWRlciA9IG51bGwsXG4gICAgcHJvZ3Jlc3NCYXJJbnRlcnZhbCA9IG51bGwsXG4gICAgUEVFSyA9IDI1LFxuICAgIGN1cnJlbnRSZXN1bHRzQ291bnQgPSAwLFxuICAgIEZSQU1FID0gJ2ZyYW1lJztcblxudmFyIFVJID0ge1xuICAgIGN1cnJlbnRQYWdlOiAwLFxuICAgIGxhc3RSZXN1bHRzOiBudWxsLFxuICAgIENBUkRfV0lEVEg6IDAsXG4gICAgbkNhcmRzUGVyUGFnZTogMSxcbiAgICBuUGFnZXM6IDEsXG4gICAgRGVsYXllZEltYWdlTG9hZGVyOiBudWxsLFxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgLy9jaGVjayBpZiBsb2FkaW5nIGlzIGRvbmVcbiAgICAgICAgaWYgKCFoYW5kbGViYXJzLnRwbENhY2hlLm1haW4pIHJldHVybjtcbiAgICAgICAgbGV0IGJveCA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdyZXN1bHRzJyk7XG4gICAgICAgIGJveC5pbm5lckhUTUwgPSBoYW5kbGViYXJzLnRwbENhY2hlLm1haW4oKTtcblxuICAgICAgICByZXN1bHRzQm94ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2NsaXF6LXJlc3VsdHMnLCBib3gpO1xuXG4gICAgICAgIHZpZXdQYWdlciA9IFVJLmluaXRWaWV3cGFnZXIoKTtcblxuICAgICAgICByZXN1bHRzQm94LmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgcmVzdWx0Q2xpY2spO1xuXG4gICAgICAgIC8vIEZJWE1FOiBpbXBvcnQgZG9lcyBub3Qgd29ya1xuICAgICAgICBVSS5EZWxheWVkSW1hZ2VMb2FkZXIgPSBTeXN0ZW0uZ2V0KCdtb2JpbGUtdWkvRGVsYXllZEltYWdlTG9hZGVyJykuZGVmYXVsdDtcbiAgICAgICAgbG9hZFZpZXdzKCk7XG4gICAgfSxcbiAgICBzZXREaW1lbnNpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICBVSS5DQVJEX1dJRFRIID0gd2luZG93LmlubmVyV2lkdGggIC0gIDIgKiBQRUVLO1xuICAgICAgVUkuQ0FSRF9XSURUSCAvPSBVSS5uQ2FyZHNQZXJQYWdlO1xuICAgIH0sXG4gICAgcmVuZGVyUmVzdWx0czogZnVuY3Rpb24ocikge1xuXG4gICAgICBjb25zdCByZW5kZXJlZFJlc3VsdHMgPSBVSS5yZXN1bHRzKHIpO1xuXG4gICAgICBVSS5sYXN0UmVzdWx0cyA9IHJlbmRlcmVkUmVzdWx0cztcblxuICAgICAgQ0xJUVouVUkuc3RvcFByb2dyZXNzQmFyKCk7XG5cbiAgICAgIHJldHVybiByZW5kZXJlZFJlc3VsdHM7XG4gICAgfSxcbiAgICBzZXRUaGVtZTogZnVuY3Rpb24gKGluY29nbml0byA9IGZhbHNlKSB7XG4gICAgICB3aW5kb3cuZG9jdW1lbnQuYm9keS5zdHlsZS5iYWNrZ3JvdW5kQ29sb3IgPSBpbmNvZ25pdG8gPyAnIzRhNGE0YScgOiAnI0U4RThFOCc7XG4gICAgfSxcbiAgICBzZXRNb2JpbGVCYXNlZFVybHM6IGZ1bmN0aW9uICAobykge1xuICAgICAgaWYgKCFvKSByZXR1cm47XG4gICAgICBjb25zdCB1cmwgPSBvLmRhdGEgJiYgby5kYXRhLm1vYmlsZV91cmw7XG4gICAgICBpZiAoby52YWwpIHtcbiAgICAgICAgby52YWwgPSB1cmwgfHwgby52YWw7XG4gICAgICB9XG4gICAgICBpZiAoby51cmwpIHtcbiAgICAgICAgby51cmwgPSB1cmwgfHwgby51cmw7XG4gICAgICB9XG4gICAgICBpZiAoby51cmwgJiYgby5tX3VybCkge1xuICAgICAgICBvLnVybCA9IG8ubV91cmw7XG4gICAgICB9XG4gICAgICBmb3IgKGxldCBpIGluIG8pIHtcbiAgICAgICAgaWYgKHR5cGVvZihvW2ldKSA9PT0gJ29iamVjdCcpIHtcbiAgICAgICAgICAgIFVJLnNldE1vYmlsZUJhc2VkVXJscyhvW2ldKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0sXG4gICAgcmVzdWx0czogZnVuY3Rpb24gKHIpIHtcblxuICAgICAgVUkuY3VycmVudFBhZ2UgPSAwO1xuICAgICAgdmlld1BhZ2VyLmdvVG9JbmRleChVSS5jdXJyZW50UGFnZSk7XG4gICAgICBVSS5zZXRNb2JpbGVCYXNlZFVybHMocik7XG5cbiAgICAgIHNldENhcmRDb3VudFBlclBhZ2Uod2luZG93LmlubmVyV2lkdGgpO1xuXG4gICAgICBVSS5zZXREaW1lbnNpb25zKCk7XG5cbiAgICAgIHZhciBlbmdpbmUgPSBDbGlxelV0aWxzLmdldERlZmF1bHRTZWFyY2hFbmdpbmUoKTtcbiAgICAgIHZhciBkZXRhaWxzID0gQ2xpcXpVdGlscy5nZXREZXRhaWxzRnJvbVVybChlbmdpbmUudXJsKTtcbiAgICAgIHZhciBsb2dvID0gQ2xpcXpVdGlscy5nZXRMb2dvRGV0YWlscyhkZXRhaWxzKTtcblxuICAgICAgdmFyIGVuaGFuY2VkUmVzdWx0cyA9IGVuaGFuY2VSZXN1bHRzKHIuX3Jlc3VsdHMpO1xuXG4gICAgICBjdXJyZW50UmVzdWx0cyA9IHtcbiAgICAgICAgc2VhcmNoU3RyaW5nOiByLl9zZWFyY2hTdHJpbmcsXG4gICAgICAgIGZyYW1lV2lkdGg6IFVJLkNBUkRfV0lEVEgsXG4gICAgICAgIHJlc3VsdHM6IGVuaGFuY2VkUmVzdWx0cyxcbiAgICAgICAgaXNJbnN0YW50OiBmYWxzZSxcbiAgICAgICAgaXNNaXhlZDogdHJ1ZSxcbiAgICAgICAgZ29vZ2xlVGhpczoge1xuICAgICAgICAgIHRpdGxlOiBDbGlxelV0aWxzLmdldExvY2FsaXplZFN0cmluZygnbW9iaWxlX21vcmVfcmVzdWx0c190aXRsZScpLFxuICAgICAgICAgIGFjdGlvbjogQ2xpcXpVdGlscy5nZXRMb2NhbGl6ZWRTdHJpbmcoJ21vYmlsZV9tb3JlX3Jlc3VsdHNfYWN0aW9uJywgZW5naW5lLm5hbWUpLFxuICAgICAgICAgIGxlZnQ6IFVJLkNBUkRfV0lEVEggKiBlbmhhbmNlZFJlc3VsdHMubGVuZ3RoLFxuICAgICAgICAgIGZyYW1lV2lkdGg6IFVJLkNBUkRfV0lEVEgsXG4gICAgICAgICAgc2VhcmNoU3RyaW5nOiBlbmNvZGVVUklDb21wb25lbnQoci5fc2VhcmNoU3RyaW5nKSxcbiAgICAgICAgICBzZWFyY2hFbmdpbmVVcmw6IGVuZ2luZS51cmwsXG4gICAgICAgICAgbG9nbzogbG9nbyxcbiAgICAgICAgICBiYWNrZ3JvdW5kOiBsb2dvLmJhY2tncm91bmRDb2xvclxuICAgICAgICB9XG4gICAgICB9O1xuICAgICAgICB2YXIgcXVlcnkgPSBjdXJyZW50UmVzdWx0cy5zZWFyY2hTdHJpbmcgfHwgJyc7XG5cbiAgICAgICAgaWYgKGltZ0xvYWRlcikgaW1nTG9hZGVyLnN0b3AoKTtcblxuICAgICAgICAvLyBSZXN1bHRzIHRoYXQgYXJlIG5vdCByZWFkeSAoZXh0cmEgcmVzdWx0cywgZm9yIHdoaWNoIHdlIHJlY2VpdmVkIGEgY2FsbGJhY2tfdXJsKVxuICAgICAgICB2YXIgYXN5bmNSZXN1bHRzID0gY3VycmVudFJlc3VsdHMucmVzdWx0cy5maWx0ZXIoYXNzZXNzQXN5bmModHJ1ZSkpO1xuICAgICAgICBjdXJyZW50UmVzdWx0cy5yZXN1bHRzID0gY3VycmVudFJlc3VsdHMucmVzdWx0cy5maWx0ZXIoYXNzZXNzQXN5bmMoZmFsc2UpKTtcblxuICAgICAgICByZWRyYXdEcm9wZG93bihoYW5kbGViYXJzLnRwbENhY2hlLnJlc3VsdHMoY3VycmVudFJlc3VsdHMpLCBxdWVyeSk7XG5cbiAgICAgICAgaWYgKGFzeW5jUmVzdWx0cy5sZW5ndGgpIGxvYWRBc3luY1Jlc3VsdChhc3luY1Jlc3VsdHMsIHF1ZXJ5KTtcblxuICAgICAgICBpbWdMb2FkZXIgPSBuZXcgVUkuRGVsYXllZEltYWdlTG9hZGVyKCcjY2xpcXotcmVzdWx0cyBpbWdbZGF0YS1zcmNdLCAjY2xpcXotcmVzdWx0cyBkaXZbZGF0YS1zdHlsZV0sICNjbGlxei1yZXN1bHRzIHNwYW5bZGF0YS1zdHlsZV0nKTtcbiAgICAgICAgaW1nTG9hZGVyLnN0YXJ0KCk7XG5cbiAgICAgICAgY3Jvc3NUcmFuc2Zvcm0ocmVzdWx0c0JveCwgMCk7XG5cbiAgICAgICAgc2V0UmVzdWx0TmF2aWdhdGlvbihjdXJyZW50UmVzdWx0cy5yZXN1bHRzKTtcblxuICAgICAgICByZXR1cm4gY3VycmVudFJlc3VsdHMucmVzdWx0cztcbiAgICB9LFxuICAgIFZJRVdTOiB7fSxcbiAgICBpbml0Vmlld3BhZ2VyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB2aWV3cyA9IHt9LFxuICAgICAgICAgICAgcGFnZVNob3dUcyA9IERhdGUubm93KCksXG4gICAgICAgICAgICBpbm5lcldpZHRoID0gd2luZG93LmlubmVyV2lkdGgsXG4gICAgICAgICAgICBvZmZzZXQgPSAwO1xuXG4gICAgICAgIHJldHVybiBuZXcgVmlld1BhZ2VyKHJlc3VsdHNCb3gsIHtcbiAgICAgICAgICBkcmFnU2l6ZTogd2luZG93LmlubmVyV2lkdGgsXG4gICAgICAgICAgcHJldmVudF9hbGxfbmF0aXZlX3Njcm9sbGluZzogZmFsc2UsXG4gICAgICAgICAgdmVydGljYWw6IGZhbHNlLFxuICAgICAgICAgIGFuaW1fZHVyYXRpb246NDAwLFxuICAgICAgICAgIHRpcHBpbmdfcG9pbnQ6MC40LFxuICAgICAgICAgIG9uUGFnZVNjcm9sbCA6IGZ1bmN0aW9uIChzY3JvbGxJbmZvKSB7XG4gICAgICAgICAgICBvZmZzZXQgPSAtc2Nyb2xsSW5mby50b3RhbE9mZnNldDtcbiAgICAgICAgICAgIGNyb3NzVHJhbnNmb3JtKHJlc3VsdHNCb3gsIChvZmZzZXQgKiBVSS5DQVJEX1dJRFRIICogVUkubkNhcmRzUGVyUGFnZSkpO1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBvblBhZ2VDaGFuZ2UgOiBmdW5jdGlvbiAocGFnZSkge1xuICAgICAgICAgICAgcGFnZSA9IE1hdGguYWJzKHBhZ2UpO1xuXG4gICAgICAgICAgICBpZiAocGFnZSA9PT0gVUkuY3VycmVudFBhZ2UgfHwgIVVJLmlzU2VhcmNoKCkpIHJldHVybjtcblxuICAgICAgICAgICAgdmlld3NbcGFnZV0gPSAodmlld3NbcGFnZV0gfHwgMCkgKyAxO1xuXG5cbiAgICAgICAgICAgIENsaXF6VXRpbHMudGVsZW1ldHJ5KHtcbiAgICAgICAgICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcbiAgICAgICAgICAgICAgYWN0aW9uOiAnc3dpcGUnLFxuICAgICAgICAgICAgICBzd2lwZV9kaXJlY3Rpb246IHBhZ2UgPiBVSS5jdXJyZW50UGFnZSA/ICdyaWdodCcgOiAnbGVmdCcsXG4gICAgICAgICAgICAgIGN1cnJlbnRfcG9zaXRpb246IHBhZ2UsXG4gICAgICAgICAgICAgIHZpZXdzOiB2aWV3c1twYWdlXSxcbiAgICAgICAgICAgICAgcHJldl9wb3NpdGlvbjogVUkuY3VycmVudFBhZ2UsXG4gICAgICAgICAgICAgIHByZXZfZGlzcGxheV90aW1lOiBEYXRlLm5vdygpIC0gcGFnZVNob3dUc1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHBhZ2VTaG93VHMgPSBEYXRlLm5vdygpO1xuXG4gICAgICAgICAgICBVSS5jdXJyZW50UGFnZSA9IHBhZ2U7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGhpZGVSZXN1bHRzQm94OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgcmVzdWx0c0JveC5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgIH0sXG4gICAgdXBkYXRlU2VhcmNoQ2FyZDogZnVuY3Rpb24gKGVuZ2luZSkge1xuICAgICAgdmFyIGVuZ2luZURpdiA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdkZWZhdWx0RW5naW5lJyk7XG4gICAgICBpZiAoZW5naW5lRGl2ICYmIENsaXF6QXV0b2NvbXBsZXRlLmxhc3RTZWFyY2gpIHtcbiAgICAgICAgZW5naW5lRGl2LnNldEF0dHJpYnV0ZSgndXJsJywgZW5naW5lLnVybCArIGVuY29kZVVSSUNvbXBvbmVudChDbGlxekF1dG9jb21wbGV0ZS5sYXN0U2VhcmNoKSk7XG4gICAgICB9XG4gICAgfSxcbiAgICBzdGFydFByb2dyZXNzQmFyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAvLyBzdXNwZW5kZWRcbiAgICAgIHJldHVybjtcbiAgICAgIGlmIChwcm9ncmVzc0JhckludGVydmFsKSB7XG4gICAgICAgIGNsZWFySW50ZXJ2YWwocHJvZ3Jlc3NCYXJJbnRlcnZhbCk7XG4gICAgICB9XG4gICAgICB2YXIgbXVsdGlwbGllciA9IHBhcnNlSW50KE1hdGguY2VpbCh3aW5kb3cuaW5uZXJXaWR0aC8xMDApKSxcbiAgICAgIHByb2dyZXNzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3Byb2dyZXNzJyksXG4gICAgICBpID0gMDtcbiAgICAgIHByb2dyZXNzQmFySW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbiAoKSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgcHJvZ3Jlc3Muc3R5bGUud2lkdGggPSAoaSptdWx0aXBsaWVyKSsncHgnO1xuICAgICAgfSwyMCk7XG5cbiAgICAgIHNldFRpbWVvdXQoVUkuc3RvcFByb2dyZXNzQmFyLDQwMDApO1xuICAgIH0sXG5cbiAgICBzdG9wUHJvZ3Jlc3NCYXI6IGZ1bmN0aW9uICgpIHtcbiAgICAgIC8vIHN1c3BlbmRlZFxuICAgICAgcmV0dXJuO1xuICAgICAgaWYgKHByb2dyZXNzQmFySW50ZXJ2YWwpIHtcbiAgICAgICAgY2xlYXJJbnRlcnZhbChwcm9ncmVzc0JhckludGVydmFsKTtcbiAgICAgIH1cbiAgICAgIGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdwcm9ncmVzcycpLnN0eWxlLndpZHRoID0gJzBweCc7XG4gICAgfSxcbiAgICBpc1NlYXJjaDogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIHJlc3VsdHNCb3ggJiYgcmVzdWx0c0JveC5zdHlsZS5kaXNwbGF5ID09PSAnYmxvY2snO1xuICAgIH1cbn07XG5cbmZ1bmN0aW9uIHNldENhcmRDb3VudFBlclBhZ2Uod2luZG93V2lkdGgpIHtcbiAgVUkubkNhcmRzUGVyUGFnZSA9IE1hdGguZmxvb3Iod2luZG93V2lkdGggLyAzMjApIHx8IDE7XG59XG5cblxuZnVuY3Rpb24gbG9hZEFzeW5jUmVzdWx0KHJlcywgcXVlcnkpIHtcbiAgICBmb3IgKHZhciBpIGluIHJlcykge1xuICAgICAgdmFyIHIgPSByZXNbaV07XG4gICAgICB2YXIgcXQgPSBxdWVyeSArIFwiOiBcIiArIG5ldyBEYXRlKCkuZ2V0VGltZSgpO1xuICAgICAgQ2xpcXpVdGlscy5sb2cocixcIkxPQURJTkdBU1lOQ1wiKTtcbiAgICAgIENsaXF6VXRpbHMubG9nKHF1ZXJ5LFwibG9hZEFzeW5jUmVzdWx0XCIpO1xuICAgICAgdmFyIGxvb3BfY291bnQgPSAwO1xuICAgICAgdmFyIGFzeW5jX2NhbGxiYWNrID0gZnVuY3Rpb24gKHJlcSkge1xuICAgICAgICAgIENsaXF6VXRpbHMubG9nKHF1ZXJ5LFwiYXN5bmNfY2FsbGJhY2tcIik7XG4gICAgICAgICAgdmFyIHJlc3AgPSBudWxsO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICByZXNwID0gSlNPTi5wYXJzZShyZXEucmVzcG9uc2UpLnJlc3VsdHNbMF07XG4gICAgICAgICAgfVxuICAgICAgICAgIGNhdGNoKGVycikge1xuICAgICAgICAgICAgcmVzLnNwbGljZShpLDEpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAocmVzcCAmJiAgQ2xpcXpBdXRvY29tcGxldGUubGFzdFNlYXJjaCA9PT0gcXVlcnkpIHtcblxuICAgICAgICAgICAgdmFyIGtpbmQgPSByLmRhdGEua2luZDtcbiAgICAgICAgICAgIGlmIChcIl9fY2FsbGJhY2tfdXJsX19cIiBpbiByZXNwLmRhdGEpIHtcbiAgICAgICAgICAgICAgICAvLyBJZiB0aGUgcmVzdWx0IGlzIGFnYWluIGEgcHJvbWlzZSwgcmV0cnkuXG4gICAgICAgICAgICAgICAgaWYgKGxvb3BfY291bnQgPCAxMCAvKnNtYXJ0Q2xpcXpNYXhBdHRlbXB0cyovKSB7XG4gICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9vcF9jb3VudCArPSAxO1xuICAgICAgICAgICAgICAgICAgICBDbGlxelV0aWxzLmh0dHBHZXQocmVzcC5kYXRhLl9fY2FsbGJhY2tfdXJsX18sIGFzeW5jX2NhbGxiYWNrLCBhc3luY19jYWxsYmFjayk7XG4gICAgICAgICAgICAgICAgICB9LCAxMDAgLypzbWFydENsaXF6V2FpdFRpbWUqLyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2UgaWYgKCFjdXJyZW50UmVzdWx0cy5yZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICAgICAgcmVkcmF3RHJvcGRvd24oaGFuZGxlYmFycy50cGxDYWNoZS5ub1Jlc3VsdChDbGlxelV0aWxzLmdldE5vUmVzdWx0cygpKSwgcXVlcnkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICByLmRhdGEgPSByZXNwLmRhdGE7XG4gICAgICAgICAgICAgIHIudXJsID0gcmVzcC51cmw7XG4gICAgICAgICAgICAgIHIuZGF0YS5raW5kID0ga2luZDtcbiAgICAgICAgICAgICAgci5kYXRhLnN1YlR5cGUgPSByZXNwLnN1YlR5cGU7XG4gICAgICAgICAgICAgIHIuZGF0YS50cmlnZ2VyX3VybHMgPSByZXNwLnRyaWdnZXJfdXJscztcbiAgICAgICAgICAgICAgci52ZXJ0aWNhbCA9IGdldFZlcnRpY2FsKHIpO1xuICAgICAgICAgICAgICByLnVybERldGFpbHMgPSBDbGlxelV0aWxzLmdldERldGFpbHNGcm9tVXJsKHIudXJsKTtcbiAgICAgICAgICAgICAgci5sb2dvID0gQ2xpcXpVdGlscy5nZXRMb2dvRGV0YWlscyhyLnVybERldGFpbHMpO1xuXG4gICAgICAgICAgICAgIGlmIChyZXN1bHRzQm94ICYmIENsaXF6QXV0b2NvbXBsZXRlLmxhc3RTZWFyY2ggPT09IHF1ZXJ5KSB7XG4gICAgICAgICAgICAgICAgICAvLyBSZW1vdmUgYWxsIGV4aXN0aW5nIGV4dHJhIHJlc3VsdHNcbiAgICAgICAgICAgICAgICAgIGN1cnJlbnRSZXN1bHRzLnJlc3VsdHMgPSBjdXJyZW50UmVzdWx0cy5yZXN1bHRzLmZpbHRlcihmdW5jdGlvbiAocikgeyByZXR1cm4gci50eXBlICE9PSAnY2xpcXotZXh0cmEnOyB9ICk7XG4gICAgICAgICAgICAgICAgICAvLyBhZGQgdGhlIGN1cnJlbnQgb25lIG9uIHRvcCBvZiB0aGUgbGlzdFxuICAgICAgICAgICAgICAgICAgY3VycmVudFJlc3VsdHMucmVzdWx0cy51bnNoaWZ0KHIpO1xuXG4gICAgICAgICAgICAgICAgICBpZiAoY3VycmVudFJlc3VsdHMucmVzdWx0cy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmVkcmF3RHJvcGRvd24oaGFuZGxlYmFycy50cGxDYWNoZS5yZXN1bHRzKGN1cnJlbnRSZXN1bHRzKSwgcXVlcnkpO1xuICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJlZHJhd0Ryb3Bkb3duKGhhbmRsZWJhcnMudHBsQ2FjaGUubm9SZXN1bHQoQ2xpcXpVdGlscy5nZXROb1Jlc3VsdHMoKSksIHF1ZXJ5KTtcbiAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgIGltZ0xvYWRlciA9IG5ldyBVSS5EZWxheWVkSW1hZ2VMb2FkZXIoJyNjbGlxei1yZXN1bHRzIGltZ1tkYXRhLXNyY10sICNjbGlxei1yZXN1bHRzIGRpdltkYXRhLXN0eWxlXSwgI2NsaXF6LXJlc3VsdHMgc3BhbltkYXRhLXN0eWxlXScpO1xuICAgICAgICAgICAgICAgICAgaW1nTG9hZGVyLnN0YXJ0KCk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgLy8gdG8gaGFuZGxlIGJyb2tlbiBwcm9taXNlcyAoZWcuIFdlYXRoZXIgYW5kIGZsaWdodHMpIG9uIG1vYmlsZVxuICAgICAgICAgIGVsc2UgaWYgKHIuZGF0YSAmJiByLmRhdGEuX19jYWxsYmFja191cmxfXykge1xuICAgICAgICAgICAgc2hpZnRSZXN1bHRzKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgcmVzLnNwbGljZShpLDEpO1xuICAgICAgICAgICAgaWYgKCFjdXJyZW50UmVzdWx0cy5yZXN1bHRzLmxlbmd0aCkge1xuICAgICAgICAgICAgICByZWRyYXdEcm9wZG93bihoYW5kbGViYXJzLnRwbENhY2hlLm5vUmVzdWx0KENsaXF6VXRpbHMuZ2V0Tm9SZXN1bHRzKCkpLCBxdWVyeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICB9O1xuICAgICAgQ2xpcXpVdGlscy5odHRwR2V0KHIuZGF0YS5fX2NhbGxiYWNrX3VybF9fLCBhc3luY19jYWxsYmFjaywgYXN5bmNfY2FsbGJhY2spO1xuICAgIH1cbn1cblxuXG5mdW5jdGlvbiBhc3Nlc3NBc3luYyhnZXRBc3luYykge1xuICAgIHJldHVybiBmdW5jdGlvbiAocmVzdWx0KSB7XG4gICAgICAgIHZhciBpc0FzeW5jID0gcmVzdWx0LnR5cGUgPT09ICdjbGlxei1leHRyYScgJiYgcmVzdWx0LmRhdGEgJiYgJ19fY2FsbGJhY2tfdXJsX18nIGluIHJlc3VsdC5kYXRhIDtcbiAgICAgICAgcmV0dXJuIGdldEFzeW5jID8gaXNBc3luYyA6ICFpc0FzeW5jO1xuICAgIH07XG59XG5cbmZ1bmN0aW9uIHJlZHJhd0Ryb3Bkb3duKG5ld0hUTUwpIHtcbiAgICByZXN1bHRzQm94LnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuXG4gICAgcmVzdWx0c0JveC5pbm5lckhUTUwgPSBuZXdIVE1MO1xufVxuXG5mdW5jdGlvbiBnZXRWZXJ0aWNhbChyZXN1bHQpIHtcbiAgLy8gaWYgaGlzdG9yeSByZWNvcmRzIGFyZSBsZXNzIHRoYW4gMyBpdCBnb2VzIHRvIGdlbmVyaWNcbiAgbGV0IHRlbXBsYXRlO1xuICBpZiAocmVzdWx0LmRhdGEudGVtcGxhdGUgPT09ICdwYXR0ZXJuLWgzJykge1xuICAgIHRlbXBsYXRlID0gJ2hpc3RvcnknO1xuICB9IGVsc2UgaWYgKENsaXF6VXRpbHMuVEVNUExBVEVTW3Jlc3VsdC5kYXRhLnN1cGVyVGVtcGxhdGVdKSB7XG4gICAgICB0ZW1wbGF0ZSA9IHJlc3VsdC5kYXRhLnN1cGVyVGVtcGxhdGU7XG4gIH0gZWxzZSBpZihDbGlxelV0aWxzLlRFTVBMQVRFU1tyZXN1bHQuZGF0YS50ZW1wbGF0ZV0pIHtcbiAgICB0ZW1wbGF0ZSA9IHJlc3VsdC5kYXRhLnRlbXBsYXRlXG4gIH0gZWxzZSB7XG4gICAgdGVtcGxhdGUgPSAnZ2VuZXJpYyc7XG4gIH1cbiAgcmV0dXJuIHRlbXBsYXRlO1xufVxuXG5mdW5jdGlvbiBlbmhhbmNlUmVzdWx0cyhyZXN1bHRzKSB7XG4gIGxldCBlbmhhbmNlZFJlc3VsdHMgPSBbXTtcbiAgcmVzdWx0cy5mb3JFYWNoKChyLCBpbmRleCkgPT4ge1xuICAgIGNvbnN0IF90bXAgPSBnZXREZWJ1Z01zZyhyLmNvbW1lbnQgfHwgJycpO1xuICAgIGNvbnN0IHVybCA9IHIudmFsIHx8ICcnO1xuICAgIGNvbnN0IHVybERldGFpbHMgPSBDbGlxelV0aWxzLmdldERldGFpbHNGcm9tVXJsKHVybCk7XG5cbiAgICBlbmhhbmNlZFJlc3VsdHMucHVzaChlbmhhbmNlU3BlY2lmaWNSZXN1bHQoe1xuICAgICAgdHlwZTogci5zdHlsZSxcbiAgICAgIGxlZnQ6IChVSS5DQVJEX1dJRFRIICogaW5kZXgpLFxuICAgICAgZGF0YTogci5kYXRhIHx8IHt9LFxuICAgICAgdXJsLFxuICAgICAgdXJsRGV0YWlscyxcbiAgICAgIGxvZ286IENsaXF6VXRpbHMuZ2V0TG9nb0RldGFpbHModXJsRGV0YWlscyksXG4gICAgICB0aXRsZTogX3RtcFswXSxcbiAgICAgIGRlYnVnOiBfdG1wWzFdXG4gICAgfSkpO1xuICB9KTtcblxuICBsZXQgZmlsdGVyZWRSZXN1bHRzID0gZW5oYW5jZWRSZXN1bHRzLmZpbHRlcihmdW5jdGlvbiAocikgeyByZXR1cm4gIShyLmRhdGEgJiYgci5kYXRhLmFkdWx0KTsgfSk7XG5cbiAgLy8gaWYgdGhlcmUgbm8gcmVzdWx0cyBhZnRlciBhZHVsdCBmaWx0ZXIgLSBzaG93IG5vIHJlc3VsdHMgZW50cnlcbiAgaWYgKCFmaWx0ZXJlZFJlc3VsdHMubGVuZ3RoKSB7XG4gICAgZmlsdGVyZWRSZXN1bHRzLnB1c2goQ2xpcXpVdGlscy5nZXROb1Jlc3VsdHMoKSk7XG4gICAgZmlsdGVyZWRSZXN1bHRzWzBdLnZlcnRpY2FsID0gJ25vUmVzdWx0JztcbiAgfVxuXG4gIHJldHVybiBmaWx0ZXJlZFJlc3VsdHM7XG59XG5cbi8vIGRlYnVnIG1lc3NhZ2UgYXJlIGF0IHRoZSBlbmQgb2YgdGhlIHRpdGxlIGxpa2UgdGhpczogXCJ0aXRsZSAoZGVidWcpIVwiXG5mdW5jdGlvbiBnZXREZWJ1Z01zZyhmdWxsVGl0bGUpIHtcbiAgICAvLyByZWdleCBtYXRjaGVzIHR3byBwYXJ0czpcbiAgICAvLyAxKSB0aGUgdGl0bGUsIGNhbiBiZSBhbnl0aGluZyAoW1xcc1xcU10gaXMgbW9yZSBpbmNsdXNpdmUgdGhhbiAnLicgYXMgaXQgaW5jbHVkZXMgbmV3bGluZSlcbiAgICAvLyBmb2xsb3dlZCBieTpcbiAgICAvLyAyKSBhIGRlYnVnIHN0cmluZyBsaWtlIHRoaXMgXCIgKGRlYnVnKSFcIlxuICAgIGlmIChmdWxsVGl0bGUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBbbnVsbCwgbnVsbF07XG4gICAgfVxuICAgIGNvbnN0IHIgPSBmdWxsVGl0bGUubWF0Y2goL14oW1xcc1xcU10rKSBcXCgoLiopXFwpISQvKTtcbiAgICBpZiAociAmJiByLmxlbmd0aCA+PSAzKSB7XG4gICAgICByZXR1cm4gW3JbMV0sIHJbMl1dO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHJldHVybiBbZnVsbFRpdGxlLCBudWxsXTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGVuaGFuY2VTcGVjaWZpY1Jlc3VsdChyKSB7XG4gIGNvbnN0IGNvbnRlbnRBcmVhID0ge1xuICAgIHdpZHRoOiBVSS5DQVJEX1dJRFRILFxuICAgIGhlaWdodDogd2luZG93LnNjcmVlbi5oZWlnaHRcbiAgfTtcblxuICBpZiAoci5zdWJUeXBlICYmIEpTT04ucGFyc2Uoci5zdWJUeXBlKS5leikge1xuICAgICAgLy8gSW5kaWNhdGUgdGhhdCB0aGlzIGlzIGEgUkggcmVzdWx0LlxuICAgICAgci50eXBlID0gJ2NsaXF6LWV4dHJhJztcbiAgfVxuXG4gIGNvbnN0IHRlbXBsYXRlID0gci52ZXJ0aWNhbCA9IGdldFZlcnRpY2FsKHIpO1xuXG4gIGNvbnN0IHNwZWNpZmljVmlldyA9IFVJLlZJRVdTW3RlbXBsYXRlXSB8fCBVSS5WSUVXUy5nZW5lcmljO1xuICBzcGVjaWZpY1ZpZXcuZW5oYW5jZVJlc3VsdHMgJiYgc3BlY2lmaWNWaWV3LmVuaGFuY2VSZXN1bHRzKHIuZGF0YSwgY29udGVudEFyZWEpO1xuXG4gIHJldHVybiByO1xuXG59XG5cbmZ1bmN0aW9uIGNyb3NzVHJhbnNmb3JtIChlbGVtZW50LCB4KSB7XG4gIHZhciBwbGF0Zm9ybXMgPSBbJycsICctd2Via2l0LScsICctbXMtJ107XG4gIHBsYXRmb3Jtcy5mb3JFYWNoKGZ1bmN0aW9uIChwbGF0Zm9ybSkge1xuICAgIGVsZW1lbnQuc3R5bGVbcGxhdGZvcm0gKyAndHJhbnNmb3JtJ10gPSAndHJhbnNsYXRlM2QoJysgeCArJ3B4LCAwcHgsIDBweCknO1xuICB9KTtcbn1cblxuZnVuY3Rpb24gZ2V0UmVzdWx0S2luZChlbCkge1xuICAgIHJldHVybiBnZXRSZXN1bHRPckNoaWxkQXR0cihlbCwgJ2tpbmQnKS5zcGxpdCgnOycpO1xufVxuXG4vLyBidWJibGVzIHVwIG1heGltdW0gdG8gdGhlIHJlc3VsdCBjb250YWluZXJcbmZ1bmN0aW9uIGdldFJlc3VsdE9yQ2hpbGRBdHRyKGVsLCBhdHRyKSB7XG4gIGlmIChlbCA9PT0gbnVsbCkgcmV0dXJuICcnO1xuICBpZiAoZWwuY2xhc3NOYW1lID09PSBGUkFNRSkgcmV0dXJuIGVsLmdldEF0dHJpYnV0ZShhdHRyKSB8fCAnJztcbiAgcmV0dXJuIGVsLmdldEF0dHJpYnV0ZShhdHRyKSB8fCBnZXRSZXN1bHRPckNoaWxkQXR0cihlbC5wYXJlbnRFbGVtZW50LCBhdHRyKTtcbn1cblxuZnVuY3Rpb24gcmVzdWx0Q2xpY2soZXYpIHtcbiAgICB2YXIgZWwgPSBldi50YXJnZXQsIHVybCxcbiAgICAgICAgZXh0cmEsXG4gICAgICAgIGFjdGlvbjtcblxuICAgIHdoaWxlIChlbCkge1xuICAgICAgICBleHRyYSA9IGV4dHJhIHx8IGVsLmdldEF0dHJpYnV0ZSgnZXh0cmEnKTtcbiAgICAgICAgdXJsID0gZWwuZ2V0QXR0cmlidXRlKCd1cmwnKTtcbiAgICAgICAgYWN0aW9uID0gZWwuZ2V0QXR0cmlidXRlKCdjbGlxei1hY3Rpb24nKTtcblxuICAgICAgICBpZiAodXJsICYmIHVybCAhPT0gJyMnKSB7XG5cbiAgICAgICAgICAgIHZhciBjYXJkID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnY2FyZCcpW1VJLmN1cnJlbnRQYWdlXTtcbiAgICAgICAgICAgIHZhciBjYXJkUG9zaXRpb24gPSBjYXJkLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgdmFyIGNvb3JkaW5hdGUgPSBbZXYuY2xpZW50WCAtIGNhcmRQb3NpdGlvbi5sZWZ0LCBldi5jbGllbnRZIC0gY2FyZFBvc2l0aW9uLnRvcCwgVUkuQ0FSRF9XSURUSF07XG5cbiAgICAgICAgICAgIHZhciBzaWduYWwgPSB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdyZXN1bHRfY2xpY2snLFxuICAgICAgICAgICAgICAgIGV4dHJhOiBleHRyYSxcbiAgICAgICAgICAgICAgICBtb3VzZTogY29vcmRpbmF0ZSxcbiAgICAgICAgICAgICAgICBwb3NpdGlvbl90eXBlOiBnZXRSZXN1bHRLaW5kKGVsKVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgQ2xpcXpVdGlscy50ZWxlbWV0cnkoc2lnbmFsKTtcbiAgICAgICAgICAgIENsaXF6VXRpbHMub3Blbkxpbmsod2luZG93LCB1cmwpO1xuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIH0gZWxzZSBpZiAoYWN0aW9uKSB7XG4gICAgICAgICAgICBzd2l0Y2ggKGFjdGlvbikge1xuICAgICAgICAgICAgICAgIGNhc2UgJ3N0b3AtY2xpY2stZXZlbnQtcHJvcGFnYXRpb24nOlxuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgY2FzZSAnY29weS1jYWxjLWFuc3dlcic6XG4gICAgICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuY29weVJlc3VsdChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FsYy1hbnN3ZXInKS5pbm5lckhUTUwpO1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FsYy1jb3BpZWQtbXNnJykuc3R5bGUuZGlzcGxheSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY2FsYy1jb3B5LW1zZycpLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGVsLmNsYXNzTmFtZSA9PT0gRlJBTUUpIGJyZWFrOyAvLyBkbyBub3QgZ28gaGlnaGVyIHRoYW4gYSByZXN1bHRcbiAgICAgICAgZWwgPSBlbC5wYXJlbnRFbGVtZW50O1xuICAgIH1cbn1cblxuZnVuY3Rpb24gc2hpZnRSZXN1bHRzKCkge1xuICB2YXIgZnJhbWVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnZnJhbWUnKTtcbiAgZm9yICh2YXIgaSA9IDA7IGkgPCBmcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgbGVmdCA9IGZyYW1lc1tpXS5zdHlsZS5sZWZ0LnN1YnN0cmluZygwLCBmcmFtZXNbaV0uc3R5bGUubGVmdC5sZW5ndGggLSAxKTtcbiAgICBsZWZ0ID0gcGFyc2VJbnQobGVmdCk7XG4gICAgbGVmdCAtPSAobGVmdCAvIChpICsgMSkpO1xuICAgIFVJLmxhc3RSZXN1bHRzW2ldICYmIChVSS5sYXN0UmVzdWx0c1tpXS5sZWZ0ID0gbGVmdCk7XG4gICAgZnJhbWVzW2ldLnN0eWxlLmxlZnQgPSBsZWZ0ICsgJ3B4JztcbiAgfVxuICBzZXRSZXN1bHROYXZpZ2F0aW9uKFVJLmxhc3RSZXN1bHRzKTtcbn1cblxuXG5mdW5jdGlvbiBzZXRSZXN1bHROYXZpZ2F0aW9uKHJlc3VsdHMpIHtcblxuICB2YXIgc2hvd0dvb2dsZXRoaXMgPSAxO1xuICBpZiAoIXJlc3VsdHNbMF0gfHwgcmVzdWx0c1swXS5kYXRhLnRlbXBsYXRlID09PSAnbm9SZXN1bHQnKSB7XG4gICAgc2hvd0dvb2dsZXRoaXMgPSAwO1xuICB9XG5cbiAgcmVzdWx0c0JveC5zdHlsZS53aWR0aCA9IHdpbmRvdy5pbm5lcldpZHRoICsgJ3B4JztcbiAgcmVzdWx0c0JveC5zdHlsZS5tYXJnaW5MZWZ0ID0gUEVFSyArICdweCc7XG5cblxuICB2YXIgbGFzdFJlc3VsdE9mZnNldCA9IHJlc3VsdHMubGVuZ3RoID8gcmVzdWx0c1tyZXN1bHRzLmxlbmd0aCAtIDFdLmxlZnQgfHwgMCA6IDA7XG5cbiAgY3VycmVudFJlc3VsdHNDb3VudCA9IGxhc3RSZXN1bHRPZmZzZXQgLyBVSS5DQVJEX1dJRFRIICsgc2hvd0dvb2dsZXRoaXMgKyAxO1xuXG4gIC8vIGdldCBudW1iZXIgb2YgcGFnZXMgYWNjb3JkaW5nIHRvIG51bWJlciBvZiBjYXJkcyBwZXIgcGFnZVxuICBVSS5uUGFnZXMgPSBNYXRoLmNlaWwoY3VycmVudFJlc3VsdHNDb3VudCAvIFVJLm5DYXJkc1BlclBhZ2UpO1xuXG4gIGlmIChkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3VycmVuY3ktdHBsJykpIHtcbiAgICBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnY3VycmVuY3ktdHBsJykucGFyZW50Tm9kZS5yZW1vdmVBdHRyaWJ1dGUoJ3VybCcpO1xuICB9XG59XG5cbnZhciByZXNpemVUaW1lb3V0O1xud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ3Jlc2l6ZScsIGZ1bmN0aW9uICgpIHtcbiAgaWYgKCFVSS5pc1NlYXJjaCgpKSByZXR1cm47XG4gIGNsZWFyVGltZW91dChyZXNpemVUaW1lb3V0KTtcbiAgcmVzaXplVGltZW91dCA9IHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgIGNvbnN0IGxhc3RuQ2FyZHNQZXJQYWdlID0gVUkubkNhcmRzUGVyUGFnZTtcbiAgICBzZXRDYXJkQ291bnRQZXJQYWdlKHdpbmRvdy5pbm5lcldpZHRoKTtcbiAgICBVSS5zZXREaW1lbnNpb25zKCk7XG4gICAgY29uc3QgZnJhbWVzID0gZG9jdW1lbnQuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZShGUkFNRSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmcmFtZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGxldCBsZWZ0ID0gVUkuQ0FSRF9XSURUSCAqIGk7XG4gICAgICBmcmFtZXNbaV0uc3R5bGUubGVmdCA9IGxlZnQgKyAncHgnO1xuICAgICAgVUkubGFzdFJlc3VsdHNbaV0gJiYgKFVJLmxhc3RSZXN1bHRzW2ldLmxlZnQgPSBsZWZ0KTtcbiAgICAgIGZyYW1lc1tpXS5zdHlsZS53aWR0aCA9IFVJLkNBUkRfV0lEVEggKyAncHgnO1xuICAgIH1cbiAgICBzZXRSZXN1bHROYXZpZ2F0aW9uKFVJLmxhc3RSZXN1bHRzKTtcbiAgICBVSS5jdXJyZW50UGFnZSA9IE1hdGguZmxvb3IoVUkuY3VycmVudFBhZ2UgKiBsYXN0bkNhcmRzUGVyUGFnZSAvIFVJLm5DYXJkc1BlclBhZ2UpO1xuICAgIHZpZXdQYWdlci5nb1RvSW5kZXgoVUkuY3VycmVudFBhZ2UsIDApO1xuICB9LCAyMDApO1xuXG59KTtcblxud2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2Rpc2Nvbm5lY3RlZCcsIGZ1bmN0aW9uICgpIHtcbiAgbGV0IGVsZW0gPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgncmVjb25uZWN0aW5nJyk7XG4gIGVsZW0gJiYgKGVsZW0uaW5uZXJIVE1MID0gJzxoMz4nK0NsaXF6VXRpbHMuZ2V0TG9jYWxpemVkU3RyaW5nKCdtb2JpbGVfcmVjb25uZWN0aW5nX21zZycpKyc8L2gzPicpO1xufSk7XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdjb25uZWN0ZWQnLCBmdW5jdGlvbiAoKSB7XG4gIGxldCBlbGVtID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ3JlY29ubmVjdGluZycpO1xuICBlbGVtICYmIChlbGVtLmlubmVySFRNTCA9ICcnKTtcbn0pO1xuXG5mdW5jdGlvbiBsb2FkVmlld3MoKSB7XG4gIFVJLmNsaWNrSGFuZGxlcnMgPSB7fTtcbiAgT2JqZWN0LmtleXMoQ2xpcXpIYW5kbGViYXJzLlRFTVBMQVRFUykuY29uY2F0KENsaXF6SGFuZGxlYmFycy5NRVNTQUdFX1RFTVBMQVRFUykuY29uY2F0KENsaXF6SGFuZGxlYmFycy5QQVJUSUFMUykuZm9yRWFjaChmdW5jdGlvbiAodGVtcGxhdGVOYW1lKSB7XG4gICAgVUkuVklFV1NbdGVtcGxhdGVOYW1lXSA9IE9iamVjdC5jcmVhdGUobnVsbCk7XG4gICAgdHJ5IHtcbiAgICAgIGxldCBtb2R1bGUgPSBTeXN0ZW0uZ2V0KCdtb2JpbGUtdWkvdmlld3MvJyArIHRlbXBsYXRlTmFtZSk7XG4gICAgICBpZiAobW9kdWxlKSB7XG4gICAgICAgIFVJLlZJRVdTW3RlbXBsYXRlTmFtZV0gPSBuZXcgbW9kdWxlLmRlZmF1bHQod2luZG93KTtcblxuICAgICAgICBpZiAoVUkuVklFV1NbdGVtcGxhdGVOYW1lXS5ldmVudHMgJiYgVUkuVklFV1NbdGVtcGxhdGVOYW1lXS5ldmVudHMuY2xpY2spIHtcbiAgICAgICAgICBPYmplY3Qua2V5cyhVSS5WSUVXU1t0ZW1wbGF0ZU5hbWVdLmV2ZW50cy5jbGljaykuZm9yRWFjaChmdW5jdGlvbiAoc2VsZWN0b3IpIHtcbiAgICAgICAgICAgIFVJLmNsaWNrSGFuZGxlcnNbc2VsZWN0b3JdID0gVUkuVklFV1NbdGVtcGxhdGVOYW1lXS5ldmVudHMuY2xpY2tbc2VsZWN0b3JdO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBDbGlxelV0aWxzLmxvZygnZmFpbGVkIHRvIGxvYWQgJyArIHRlbXBsYXRlTmFtZSwgJ1VJJyk7XG4gICAgICB9XG4gICAgfSBjYXRjaCAoZXgpIHtcbiAgICAgIENsaXF6VXRpbHMubG9nKGV4LCAnVUknKTtcbiAgICB9XG4gIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBVSTtcbiAgICAiXX0=