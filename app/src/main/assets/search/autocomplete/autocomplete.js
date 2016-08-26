System.register("autocomplete/autocomplete", ["core/cliqz", "autocomplete/history-cluster", "autocomplete/result", "autocomplete/result-providers"], function (_export) {
    /*
     * This module implements the core functionality based on nsIAutoCompleteResult interface
     * http://mxr.mozilla.org/mozilla-central/source/toolkit/components/autocomplete/nsIAutoCompleteResult.idl
     */

    "use strict";

    var utils, events, historyCluster, Result, resultProviders, CliqzAutocomplete;

    function isQinvalid(q) {
        //TODO: add more
        if (q.indexOf('view-source:') === 0) return true;

        return false;
    }

    return {
        setters: [function (_coreCliqz) {
            utils = _coreCliqz.utils;
            events = _coreCliqz.events;
        }, function (_autocompleteHistoryCluster) {
            historyCluster = _autocompleteHistoryCluster["default"];
        }, function (_autocompleteResult) {
            Result = _autocompleteResult["default"];
        }, function (_autocompleteResultProviders) {
            resultProviders = _autocompleteResultProviders["default"];
        }],
        execute: function () {
            CliqzAutocomplete = {
                LOG_KEY: 'CliqzAutocomplete',
                TIMEOUT: 1000,
                HISTORY_TIMEOUT: 200,
                SCROLL_SIGNAL_MIN_TIME: 500,
                lastPattern: null,
                lastSearch: '',
                lastResult: null,
                lastSuggestions: null,
                lastResultHeights: [],
                hasUserScrolledCurrentResults: false, // set to true whenever user scrolls, set to false when new results are shown
                lastResultsUpdateTime: null, // to measure how long a result has been shown for
                resultsOverflowHeight: 0, // to determine if scrolling is possible (i.e., overflow > 0px)
                afterQueryCount: 0,
                discardedResults: 0,
                isPopupOpen: false,
                lastPopupOpen: null,
                lastQueryTime: null,
                lastDisplayTime: null,
                lastFocusTime: null,
                highlightFirstElement: false,
                spellCorrectionDict: {},
                spellCorr: {
                    'on': false,
                    'correctBack': {},
                    'override': false,
                    'pushed': null,
                    'userConfirmed': false,
                    'searchTerms': []
                },
                hm: null,
                currentAutoLoadURL: null,
                getResultsOrder: function getResultsOrder(results) {
                    return CliqzAutocomplete.prepareResultOrder(results);
                },
                // SOURCE: https://developer.mozilla.org/en-US/docs/How_to_implement_custom_autocomplete_search_component
                ProviderAutoCompleteResultCliqz: function ProviderAutoCompleteResultCliqz(searchString, searchResult, defaultIndex, errorDescription) {
                    this._searchString = searchString;
                    this._searchResult = searchResult;
                    this._defaultIndex = defaultIndex;
                },
                // SOURCE: http://mxr.mozilla.org/mozilla-central/source/toolkit/components/autocomplete/nsIAutoCompleteResult.idl
                CliqzResults: function CliqzResults() {},
                resetSpellCorr: function resetSpellCorr() {
                    CliqzAutocomplete.spellCorr = {
                        'on': false,
                        'correctBack': {},
                        'override': false,
                        'pushed': null,
                        'userConfirmed': false,
                        'searchTerms': []
                    };
                },
                initProvider: function initProvider() {
                    CliqzAutocomplete.ProviderAutoCompleteResultCliqz.prototype = Object.defineProperties({
                        _searchString: '',
                        _searchResult: 0,
                        _defaultIndex: 0,
                        _errorDescription: '',
                        _results: [],

                        getValueAt: function getValueAt(index) {
                            return (this._results[index] || {}).val;
                        },
                        getFinalCompleteValueAt: function getFinalCompleteValueAt(index) {
                            return null;
                        }, //FF31+
                        getCommentAt: function getCommentAt(index) {
                            return (this._results[index] || {}).comment;
                        },
                        getStyleAt: function getStyleAt(index) {
                            return (this._results[index] || {}).style;
                        },
                        getImageAt: function getImageAt(index) {
                            return '';
                        },
                        getLabelAt: function getLabelAt(index) {
                            return (this._results[index] || {}).label;
                        },
                        getDataAt: function getDataAt(index) {
                            return (this._results[index] || {}).data;
                        },
                        QueryInterface: XPCOMUtils.generateQI([]),
                        setResults: function setResults(results) {

                            this._results = this.filterUnexpected(results);

                            CliqzAutocomplete.lastResult = this;
                            events.pub('autocomplete.new_result', { result: this, isPopupOpen: CliqzAutocomplete.isPopupOpen });
                            var order = CliqzAutocomplete.getResultsOrder(this._results);
                            utils.setResultOrder(order);

                            // flag for rendering to avoid rendering of "unmixed" results
                            this.isMixed = true;
                        },

                        filterUnexpected: function filterUnexpected(results) {
                            // filter out ununsed/unexpected results
                            var ret = [];
                            for (var i = 0; i < results.length; i++) {
                                var r = results[i];
                                if (r.style == 'cliqz-extra') {
                                    if (r.data) {
                                        // override the template if the superTemplate is known
                                        if (utils.isUnknownTemplate(r.data.template)) {
                                            // unexpected/unknown template
                                            continue;
                                        }
                                    }
                                }

                                // If one of the results is data.only = true Remove all others.
                                // if (!r.invalid && r.data && r.data.only) {
                                //  return [r];
                                //}

                                ret.push(r);
                            }
                            return ret;
                        }
                    }, {
                        searchString: {
                            get: function get() {
                                return this._searchString;
                            },
                            configurable: true,
                            enumerable: true
                        },
                        searchResult: {
                            get: function get() {
                                return this._searchResult;
                            },
                            configurable: true,
                            enumerable: true
                        },
                        defaultIndex: {
                            get: function get() {
                                return this._defaultIndex;
                            },
                            configurable: true,
                            enumerable: true
                        },
                        errorDescription: {
                            get: function get() {
                                return this._errorDescription;
                            },
                            configurable: true,
                            enumerable: true
                        },
                        matchCount: {
                            get: function get() {
                                return this._results.length;
                            },
                            configurable: true,
                            enumerable: true
                        }
                    });
                },
                // a result is done once a new result comes in, or once the popup closes
                markResultsDone: function markResultsDone(newResultsUpdateTime) {
                    // is there a result to be marked as done?
                    if (CliqzAutocomplete.lastResultsUpdateTime) {
                        var resultsDisplayTime = Date.now() - CliqzAutocomplete.lastResultsUpdateTime;
                        this.sendResultsDoneSignal(resultsDisplayTime);
                    }
                    // start counting elapsed time anew
                    CliqzAutocomplete.lastResultsUpdateTime = newResultsUpdateTime;
                    CliqzAutocomplete.hasUserScrolledCurrentResults = false;
                },
                sendResultsDoneSignal: function sendResultsDoneSignal(resultsDisplayTime) {
                    // reduced traffic: only consider telemetry data if result was shown long enough (e.g., 0.5s)
                    if (resultsDisplayTime > CliqzAutocomplete.SCROLL_SIGNAL_MIN_TIME) {
                        var action = {
                            type: 'activity',
                            action: 'results_done',
                            has_user_scrolled: CliqzAutocomplete.hasUserScrolledCurrentResults,
                            results_display_time: resultsDisplayTime,
                            results_overflow_height: CliqzAutocomplete.resultsOverflowHeight,
                            can_user_scroll: CliqzAutocomplete.resultsOverflowHeight > 0
                        };
                        utils.telemetry(action);
                    }
                },
                // returns array of result kinds, adding each result's
                // height in terms of occupied dropdown slots (1-3) as
                // parameter (e.g., ["C|{\"h\":1}"],["m|{\"h\":1}"])
                prepareResultOrder: function prepareResultOrder(results) {
                    // heights is updated in UI's handleResults
                    var heights = CliqzAutocomplete.lastResultHeights,
                        resultOrder = [];

                    if (results) {
                        for (var i = 0; i < results.length; i++) {
                            if (results[i].data == null || results[i].data.kind == null) {
                                resultOrder.push('_'); //debug - it should not happen
                                continue;
                            }

                            var kind = results[i].data.kind.slice(0),
                                tokens = kind && kind.length > 0 ? kind[0].split('|') : [],
                                params = tokens.length > 1 ? JSON.parse(tokens[1]) : {};

                            params.h = i < heights.length ? heights[i] : 0;
                            kind[0] = tokens[0] + '|' + JSON.stringify(params);
                            resultOrder.push(kind);
                        }
                    }

                    return resultOrder;
                },
                initResults: function initResults() {
                    CliqzAutocomplete.CliqzResults.prototype = {
                        resultsTimer: null,
                        historyTimer: null,
                        historyTimeout: false,
                        instant: [],

                        historyTimeoutCallback: function historyTimeoutCallback(params) {
                            utils.log('history timeout', CliqzAutocomplete.LOG_KEY);
                            this.historyTimeout = true;
                            // History timed out but maybe we have some results already
                            // So show what you have - AB 1073
                            if (this.historyResults && CliqzUtils.getPref("history.timeouts", false)) {
                                historyCluster.addFirefoxHistory(this.historyResults);
                                CliqzUtils.log('historyTimeoutCallback: push collected results:' + this.historyResults.results.length, CliqzAutocomplete.LOG_KEY);
                            } else {
                                this.pushResults(this.searchString);
                            }
                        },
                        onHistoryDone: function onHistoryDone(result, resultExtra) {
                            if (!this.startTime) {
                                return; // no current search, just discard
                            }

                            var now = Date.now();

                            this.historyResults = result;
                            this.latency.history = now - this.startTime;

                            //utils.log("history results: " + (result ? result.matchCount : "null") + "; done: " + this.isHistoryReady() +
                            //               "; time: " + (now - this.startTime), CliqzAutocomplete.LOG_KEY)
                            // Choose an instant result if we have all history results (timeout)
                            // and we haven't already chosen one
                            if (result && (this.isHistoryReady() || this.historyTimeout) && this.mixedResults.matchCount == 0) {
                                utils.clearTimeout(this.historyTimer);
                                historyCluster.addFirefoxHistory(result);
                            }
                        },
                        isHistoryReady: function isHistoryReady() {
                            return this.historyResults && this.historyResults.ready;
                        },
                        cliqz_hm_search: function cliqz_hm_search(_this, res, hist_search_type) {
                            var data = null;
                            if (hist_search_type === 1) {
                                data = CliqzUtils.hm.do_search(res.query, false);
                                data['cont'] = null;
                            } else {
                                data = CliqzUtils.hm.do_search(res.query, true);
                            }

                            var urlAuto = CliqzUtils.hm.urlForAutoLoad(data);
                            if (false && urlAuto) {
                                var win = CliqzUtils.getWindow().gBrowser.contentWindow;
                                //if (CliqzAutocomplete.currentAutoLoadURL==null || win.location.href=='about:cliqz') {
                                if (win.location.href != urlAuto) {
                                    CliqzUtils.log(">> AUTOLOAD LAUNCH: " + urlAuto, 'CliqzHM');
                                    win.location.href = urlAuto;
                                    CliqzAutocomplete.currentAutoLoadURL = urlAuto;
                                }
                                //}
                            }

                            // Extract results
                            var patterns = [];
                            for (var i = 0; i < data.result.length; i++) {
                                var url = CliqzUtils.cleanMozillaActions(data.result[i][0])[1],
                                    title = data.result[i][1];

                                if (!title || title == 'N/A') {
                                    title = CliqzUtils.generalizeUrl(url);
                                }

                                if (title.length > 0 && url.length > 0 && Result.isValid(url, CliqzUtils.getDetailsFromUrl(url))) {

                                    var item = {
                                        url: url,
                                        title: title,
                                        favicon: null, //history.results[i].image,
                                        _genUrl: CliqzUtils.generalizeUrl(url, true)
                                    };

                                    if (data.result[i][3]) {
                                        if (data.result[i][3].hasOwnProperty('c')) item['xtra_c'] = data.result[i][3]['c'];
                                        if (data.result[i][3].hasOwnProperty('q')) item['xtra_q'] = data.result[i][3]['q'];
                                    }

                                    patterns.push(item);
                                }

                                var cont = null;
                                if (data.hasOwnProperty('cont')) cont = data['cont'];
                            }

                            if (patterns.length > 0) {
                                var res3 = historyCluster._simplePreparePatterns(patterns, res.query);
                                // This is also causing undefined issue. Specifically when the res.length == 0;
                                if (res3.results.length == 0) {
                                    res3.results.push({ "url": res.query, "title": "Found no result in local history for query: ", "favicon": "", "_genUrl": "", "base": true, "debug": "" });
                                }
                                historyCluster.simpleCreateInstantResult(res3, cont, _this.searchString, function (kk2) {
                                    var vjoin = [];
                                    vjoin.push(kk2[0]);
                                    _this.createInstantResultCallback(vjoin, 'hm');
                                });
                            }
                        },
                        historyPatternCallback: function historyPatternCallback(res) {

                            // abort if we already have results
                            if (this.mixedResults.matchCount > 0) return;

                            if (res.query == this.searchString) {
                                CliqzAutocomplete.lastPattern = res;

                                var latency = 0;
                                if (historyCluster.latencies[res.query]) {
                                    latency = new Date().getTime() - historyCluster.latencies[res.query];
                                }
                                this.latency.patterns = latency;

                                // Create instant result
                                historyCluster.createInstantResult(res, this.searchString, this.createInstantResultCallback, this.customResults);
                            }
                        },
                        createInstantResultCallback: function createInstantResultCallback(instant, type_res) {
                            if (type_res == 'hm') {
                                instant[0].type = 'hm';
                                this.instant.unshift(instant[0]);
                            } else {
                                if (this.instant.length > 0 && this.instant[0].type == 'hm') {
                                    this.instant[1] = instant[0];
                                } else {
                                    this.instant = instant;
                                }
                            }
                            this.pushResults(this.searchString);
                        },
                        pushTimeoutCallback: function pushTimeoutCallback(params) {
                            utils.log("pushResults timeout", CliqzAutocomplete.LOG_KEY);
                            this.pushResults(params);
                        },
                        // checks if all the results are ready or if the timeout is exceeded
                        pushResults: function pushResults(q) {
                            if (q == this.searchString && this.startTime != null) {
                                // be sure this is not a delayed result
                                var now = Date.now();

                                if (now > this.startTime + CliqzAutocomplete.TIMEOUT || // 1s timeout
                                (this.isHistoryReady() || this.historyTimeout) && // history is ready or timed out
                                this.cliqzResults) {
                                    // all results are ready
                                    /// Push full result
                                    utils.clearTimeout(this.resultsTimer);
                                    utils.clearTimeout(this.historyTimer);

                                    this.mixResults(false);

                                    this.latency.mixed = Date.now() - this.startTime;

                                    this.callback(this.mixedResults, this);

                                    this.latency.all = Date.now() - this.startTime;

                                    // delay wrapping to make sure rendering is complete
                                    // otherwise we don't get up to date autocomplete stats
                                    utils.setTimeout(this.fullWrapup, 0, this);

                                    return;
                                } else if (this.isHistoryReady()) {
                                    /// Push instant result
                                    this.latency.mixed = Date.now() - this.startTime;

                                    this.mixResults(true);

                                    // try to update as offen as possible if new results are ready
                                    // TODO - try to check if the same results are currently displaying
                                    this.mixedResults.matchCount && this.callback(this.mixedResults, this);

                                    this.latency.all = Date.now() - this.startTime;

                                    // Do partial wrapup, final wrapup will happen after all results are received
                                    utils.setTimeout(this.instantWrapup, 0, this);
                                } else {
                                    /// Nothing to push yet, probably only cliqz results are received, keep waiting
                                }
                            }
                        },

                        // handles fetched results from the cache
                        cliqzResultFetcher: function cliqzResultFetcher(req, q) {

                            // be sure this is not a delayed result
                            if (q != this.searchString) {
                                this.discardedResults += 1; // count results discarded from backend because they were out of date
                            } else {
                                    this.latency.backend = Date.now() - this.startTime;
                                    var results = [];
                                    var json = JSON.parse(req.response);

                                    // apply rerankers
                                    for (var i = 0; i < utils.RERANKERS.length; i++) {
                                        var reranker = utils.RERANKERS[i];
                                        if (reranker != null) {
                                            var rerankerResults = reranker.doRerank(json.result);
                                            json.result = rerankerResults.response;
                                            if (Object.keys(rerankerResults.telemetrySignal).length > 0) {
                                                this.userRerankers[reranker.name] = rerankerResults.telemetrySignal;
                                            }
                                        }
                                    }

                                    utils.log(json.result ? json.result.length : 0, "CliqzAutocomplete.cliqzResultFetcher");

                                    results = json.result || [];

                                    this.cliqzResultsExtra = [];

                                    if (json.images && json.images.results && json.images.results.length > 0) {
                                        var imgs = json.images.results.filter(function (r) {
                                            //ignore empty results
                                            return Object.keys(r).length != 0;
                                        });

                                        this.cliqzResultsExtra = imgs.map(Result.cliqzExtra);
                                    }

                                    var hasExtra = function hasExtra(el) {
                                        if (!el || !el.results || el.results.length == 0) return false;
                                        el.results = el.results.filter(function (r) {
                                            //ignore empty results
                                            return r.hasOwnProperty('url');
                                        });

                                        return el.results.length != 0;
                                    };

                                    if (hasExtra(json.extra)) {
                                        this.cliqzResultsExtra = json.extra.results.map(Result.cliqzExtra);
                                    }
                                    this.latency.cliqz = json.duration;

                                    this.cliqzResults = results.filter(function (r) {
                                        // filter results with no or empty url
                                        return r.url != undefined && r.url != '';
                                    });

                                    this.cliqzResultsParams = {
                                        choice: json.choice
                                    };
                                }
                            this.pushResults(q);
                        },
                        createFavicoUrl: function createFavicoUrl(url) {
                            return 'http://cdnfavicons.cliqz.com/' + url.replace('http://', '').replace('https://', '').split('/')[0];
                        },
                        // mixes backend results, entity zones, history and custom results
                        mixResults: function mixResults(only_instant) {

                            // set first history entry as autocompleted if it was
                            if (this.instant.length > 0 && CliqzAutocomplete.lastAutocompleteActive && !only_instant) {
                                this.instant[0].autocompleted = true;
                            }

                            var results = CliqzAutocomplete.Mixer.mix(this.searchString, this.cliqzResults, this.cliqzResultsExtra, this.instant, this.customResults, only_instant);
                            CliqzAutocomplete.lastResultIsInstant = only_instant;
                            CliqzAutocomplete.afterQueryCount = 0;

                            this.mixedResults.setResults(results);
                        },
                        analyzeQuery: function analyzeQuery(q) {
                            var parts = resultProviders.getCustomResults(q);
                            this.customResults = parts[1];
                            return parts[0];
                        },
                        //FF entry point
                        //TODO: to be moved to Environment!
                        startSearch: function startSearch(searchString, searchParam, previousResult, listener) {
                            this.search(searchString, function (results, ctx) {
                                listener.onSearchResult(ctx, results);
                            });
                        },
                        search: function search(searchString, callback) {

                            CliqzAutocomplete.lastQueryTime = Date.now();
                            CliqzAutocomplete.lastDisplayTime = null;
                            CliqzAutocomplete.lastResult = null;
                            CliqzAutocomplete.lastSuggestions = null;
                            this.oldPushLength = 0;
                            this.customResults = null;
                            this.latency = {
                                cliqz: null,
                                history: null,
                                backend: null,
                                mixed: null,
                                all: null
                            };
                            this.userRerankers = {};

                            utils.log('search: ' + searchString, CliqzAutocomplete.LOG_KEY);

                            var invalidQ = isQinvalid(searchString.trim()),
                                action = {
                                type: 'activity',
                                action: 'key_stroke',
                                current_length: searchString.length,
                                invalid: invalidQ
                            };
                            utils.telemetry(action);

                            if (invalidQ) {
                                //we call the callback with no results to trigger a dropdown close
                                callback(null, this);
                                return;
                            }

                            if (CliqzAutocomplete.lastSearch.length > searchString.length) {
                                CliqzAutocomplete.spellCorr.override = true;
                            }
                            // analyse and modify query for custom results
                            CliqzAutocomplete.lastSearch = searchString;
                            searchString = this.analyzeQuery(searchString);

                            // spell correction
                            var urlbar = utils.getWindow().document.getElementById('urlbar');
                            if (urlbar && //we do not have urlbar on mobile TODO - fix it better!
                            !CliqzAutocomplete.spellCorr.override && urlbar.selectionEnd == urlbar.selectionStart && urlbar.selectionEnd == urlbar.value.length) {
                                var parts = CliqzAutocomplete.spellCheck.check(searchString);
                                var newSearchString = parts[0];
                                var correctBack = parts[1];

                                for (var c in correctBack) {
                                    CliqzAutocomplete.spellCorr.correctBack[c] = correctBack[c];
                                }
                            } else {
                                // user don't want spell correction
                                var newSearchString = searchString;
                            }
                            this.wrongSearchString = searchString;
                            if (newSearchString != searchString) {
                                // the local spell checker kicks in
                                var action = {
                                    type: 'activity',
                                    action: 'spell_correction',
                                    current_length: searchString.length
                                };
                                utils.telemetry(action);
                                CliqzAutocomplete.spellCorr.on = true;
                                searchString = newSearchString;
                                CliqzAutocomplete.spellCorr['userConfirmed'] = false;
                            }

                            this.cliqzResults = null;
                            this.cliqzResultsExtra = null;
                            this.cliqzResultsParams = {};
                            this.cliqzCache = null;
                            this.historyResults = null;
                            this.instant = [];

                            this.callback = callback;
                            this.searchString = searchString;
                            this.searchStringSuggest = null;

                            this.mixedResults = new CliqzAutocomplete.ProviderAutoCompleteResultCliqz(this.searchString, Components.interfaces.nsIAutoCompleteResult.RESULT_SUCCESS, -2, // blocks autocomplete
                            '');

                            this.startTime = Date.now();
                            this.mixedResults.suggestionsRecieved = false;
                            // ensure context
                            this.cliqzResultFetcher = this.cliqzResultFetcher.bind(this);
                            this.pushResults = this.pushResults.bind(this);
                            this.historyTimeoutCallback = this.historyTimeoutCallback.bind(this);
                            this.pushTimeoutCallback = this.pushTimeoutCallback.bind(this);
                            this.historyPatternCallback = this.historyPatternCallback.bind(this);
                            this.createInstantResultCallback = this.createInstantResultCallback.bind(this);
                            historyCluster.historyCallback = this.historyPatternCallback;
                            if (searchString.trim().length) {
                                // start fetching results
                                utils.getBackendResults(searchString, this.cliqzResultFetcher);
                                // if spell correction, no suggestions
                                if (CliqzAutocomplete.spellCorr.on && !CliqzAutocomplete.spellCorr.override) {
                                    this.suggestionsRecieved = true;
                                    // change the wrong string to the real wrong string
                                    for (var p in CliqzAutocomplete.spellCorr.correctBack) {
                                        if (this.wrongSearchString.indexOf(CliqzAutocomplete.spellCorr.correctBack[p]) == -1) {
                                            this.wrongSearchString = this.wrongSearchString.replace(p, CliqzAutocomplete.spellCorr.correctBack[p]);
                                        }
                                    }
                                    this.cliqzSuggestions = [searchString, this.wrongSearchString];
                                    CliqzAutocomplete.lastSuggestions = this.cliqzSuggestions;
                                    utils.log(CliqzAutocomplete.lastSuggestions, 'spellcorr');

                                    //TODO: extract spell corrector out of CliqzAutocomplete
                                    if (urlbar) urlbar.mInputField.value = searchString;
                                } else {
                                    //utils.getSuggestions(searchString, this.cliqzSuggestionFetcher);
                                }
                                utils.clearTimeout(this.resultsTimer);
                                this.resultsTimer = utils.setTimeout(this.pushTimeoutCallback, CliqzAutocomplete.TIMEOUT, this.searchString);
                            } else {
                                this.cliqzResults = [];
                                this.cliqzResultsExtra = [];
                                CliqzAutocomplete.resetSpellCorr();
                            }

                            // trigger history search
                            utils.historySearch(searchString, this.onHistoryDone.bind(this), CliqzAutocomplete.sessionStart);

                            utils.clearTimeout(this.historyTimer);
                            this.historyTimer = utils.setTimeout(this.historyTimeoutCallback, CliqzAutocomplete.HISTORY_TIMEOUT, this.searchString);
                            this.historyTimeout = false;

                            var hist_search_type = utils.getPref('hist_search_type', 0);
                            if (hist_search_type != 0) {
                                CliqzUtils.log('Calling CliqzHM.cliqz_hm_search for: ' + searchString, 'CliqzHM');
                                this.cliqz_hm_search(this, { 'query': searchString }, hist_search_type);
                            }
                        },
                        /**
                        * Stops an asynchronous search that is in progress
                        */
                        stopSearch: function stopSearch() {
                            utils.clearTimeout(this.resultsTimer);
                            utils.clearTimeout(this.historyTimer);
                        },

                        sendResultsSignal: function sendResultsSignal(obj, instant) {
                            var results = obj.mixedResults._results;
                            var action = {
                                type: 'activity',
                                action: 'results',
                                query_length: CliqzAutocomplete.lastSearch.length,
                                result_order: CliqzAutocomplete.prepareResultOrder(results),
                                instant: instant,
                                popup: CliqzAutocomplete.isPopupOpen ? true : false,
                                latency_cliqz: obj.latency.cliqz,
                                latency_history: obj.historyTimeout ? null : obj.latency.history,
                                latency_patterns: obj.latency.patterns,
                                latency_backend: obj.latency.backend,
                                latency_mixed: obj.latency.mixed,
                                latency_all: obj.startTime ? Date.now() - obj.startTime : null,
                                discarded: obj.discardedResults,
                                user_rerankers: obj.userRerankers,
                                backend_params: obj.cliqzResultsParams,
                                v: 1
                            };

                            // reset count of discarded backend results
                            obj.discardedResults = 0;

                            if (CliqzAutocomplete.lastAutocompleteActive) {
                                action.autocompleted = CliqzAutocomplete.lastAutocompleteActive;
                                action.autocompleted_length = CliqzAutocomplete.lastAutocompleteLength;
                            }

                            if (action.result_order.indexOf('C') > -1 && utils.getPref('logCluster', false)) {
                                action.Ctype = utils.getClusteringDomain(results[0].val);
                            }

                            if (CliqzAutocomplete.isPopupOpen) {
                                // don't mark as done if popup closed as the user does not see anything
                                CliqzAutocomplete.markResultsDone(Date.now());
                            }

                            // remembers if the popup was open for last result
                            CliqzAutocomplete.lastPopupOpen = CliqzAutocomplete.isPopupOpen;
                            if (results.length > 0) {
                                CliqzAutocomplete.lastDisplayTime = Date.now();
                            }
                            utils.telemetry(action);
                        },

                        // Wrap up after a completed search
                        fullWrapup: function fullWrapup(obj) {
                            obj.sendResultsSignal(obj, false);

                            obj.startTime = null;
                            utils.clearTimeout(obj.resultsTimer);
                            utils.clearTimeout(obj.historyTimer);
                            obj.resultsTimer = null;
                            obj.historyTimer = null;
                            obj.cliqzResults = null;
                            obj.cliqzResultsExtra = null;
                            obj.cliqzCache = null;
                            obj.historyResults = null;
                            obj.instant = [];
                        },

                        // Wrap up after instant results are shown
                        instantWrapup: function instantWrapup(obj) {
                            obj.sendResultsSignal(obj, true);
                        }
                    };
                }
            };

            CliqzAutocomplete.initProvider();
            CliqzAutocomplete.initResults();

            _export("default", CliqzAutocomplete);
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dG9jb21wbGV0ZS9hdXRvY29tcGxldGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Z0VBaUJJLGlCQUFpQjs7QUFQckIsYUFBUyxVQUFVLENBQUMsQ0FBQyxFQUFDOztBQUVsQixZQUFHLENBQUMsQ0FBQyxPQUFPLENBQUMsY0FBYyxDQUFDLEtBQUssQ0FBQyxFQUFFLE9BQU8sSUFBSSxDQUFDOztBQUVoRCxlQUFPLEtBQUssQ0FBQztLQUNoQjs7OzsrQkFWUSxLQUFLO2dDQUFFLE1BQU07Ozs7Ozs7OztBQVlsQiw2QkFBaUIsR0FBRztBQUNwQix1QkFBTyxFQUFFLG1CQUFtQjtBQUM1Qix1QkFBTyxFQUFFLElBQUk7QUFDYiwrQkFBZSxFQUFFLEdBQUc7QUFDcEIsc0NBQXNCLEVBQUUsR0FBRztBQUMzQiwyQkFBVyxFQUFFLElBQUk7QUFDakIsMEJBQVUsRUFBRSxFQUFFO0FBQ2QsMEJBQVUsRUFBRSxJQUFJO0FBQ2hCLCtCQUFlLEVBQUUsSUFBSTtBQUNyQixpQ0FBaUIsRUFBRSxFQUFFO0FBQ3JCLDZDQUE2QixFQUFFLEtBQUs7QUFDcEMscUNBQXFCLEVBQUUsSUFBSTtBQUMzQixxQ0FBcUIsRUFBRSxDQUFDO0FBQ3hCLCtCQUFlLEVBQUUsQ0FBQztBQUNsQixnQ0FBZ0IsRUFBRSxDQUFDO0FBQ25CLDJCQUFXLEVBQUUsS0FBSztBQUNsQiw2QkFBYSxFQUFFLElBQUk7QUFDbkIsNkJBQWEsRUFBRSxJQUFJO0FBQ25CLCtCQUFlLEVBQUUsSUFBSTtBQUNyQiw2QkFBYSxFQUFFLElBQUk7QUFDbkIscUNBQXFCLEVBQUUsS0FBSztBQUM1QixtQ0FBbUIsRUFBRSxFQUFFO0FBQ3ZCLHlCQUFTLEVBQUU7QUFDUCx3QkFBSSxFQUFFLEtBQUs7QUFDWCxpQ0FBYSxFQUFFLEVBQUU7QUFDakIsOEJBQVUsRUFBRSxLQUFLO0FBQ2pCLDRCQUFRLEVBQUUsSUFBSTtBQUNkLG1DQUFlLEVBQUUsS0FBSztBQUN0QixpQ0FBYSxFQUFFLEVBQUU7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LEVBQUU7QUFDekIsK0JBQUcsQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7eUJBQ3BDO3FCQUNKLENBQUM7aUJBQ0w7YUFDSjs7QUFFRCw2QkFBaUIsQ0FBQyxZQUFZLEVBQUUsQ0FBQztBQUNqQyw2QkFBaUIsQ0FBQyxXQUFXLEVBQUUsQ0FBQzs7K0JBRWpCLGlCQUFpQiIsImZpbGUiOiJhdXRvY29tcGxldGUvYXV0b2NvbXBsZXRlLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIFRoaXMgbW9kdWxlIGltcGxlbWVudHMgdGhlIGNvcmUgZnVuY3Rpb25hbGl0eSBiYXNlZCBvbiBuc0lBdXRvQ29tcGxldGVSZXN1bHQgaW50ZXJmYWNlXG4gKiBodHRwOi8vbXhyLm1vemlsbGEub3JnL21vemlsbGEtY2VudHJhbC9zb3VyY2UvdG9vbGtpdC9jb21wb25lbnRzL2F1dG9jb21wbGV0ZS9uc0lBdXRvQ29tcGxldGVSZXN1bHQuaWRsXG4gKi9cblxuaW1wb3J0IHsgdXRpbHMsIGV2ZW50cyB9IGZyb20gXCJjb3JlL2NsaXF6XCI7XG5pbXBvcnQgaGlzdG9yeUNsdXN0ZXIgZnJvbSBcImF1dG9jb21wbGV0ZS9oaXN0b3J5LWNsdXN0ZXJcIjtcbmltcG9ydCBSZXN1bHQgZnJvbSBcImF1dG9jb21wbGV0ZS9yZXN1bHRcIjtcbmltcG9ydCByZXN1bHRQcm92aWRlcnMgZnJvbSBcImF1dG9jb21wbGV0ZS9yZXN1bHQtcHJvdmlkZXJzXCI7XG5cbmZ1bmN0aW9uIGlzUWludmFsaWQocSl7XG4gICAgLy9UT0RPOiBhZGQgbW9yZVxuICAgIGlmKHEuaW5kZXhPZigndmlldy1zb3VyY2U6JykgPT09IDApIHJldHVybiB0cnVlO1xuXG4gICAgcmV0dXJuIGZhbHNlO1xufVxuXG52YXIgQ2xpcXpBdXRvY29tcGxldGUgPSB7XG4gICAgTE9HX0tFWTogJ0NsaXF6QXV0b2NvbXBsZXRlJyxcbiAgICBUSU1FT1VUOiAxMDAwLFxuICAgIEhJU1RPUllfVElNRU9VVDogMjAwLFxuICAgIFNDUk9MTF9TSUdOQUxfTUlOX1RJTUU6IDUwMCxcbiAgICBsYXN0UGF0dGVybjogbnVsbCxcbiAgICBsYXN0U2VhcmNoOiAnJyxcbiAgICBsYXN0UmVzdWx0OiBudWxsLFxuICAgIGxhc3RTdWdnZXN0aW9uczogbnVsbCxcbiAgICBsYXN0UmVzdWx0SGVpZ2h0czogW10sXG4gICAgaGFzVXNlclNjcm9sbGVkQ3VycmVudFJlc3VsdHM6IGZhbHNlLCAvLyBzZXQgdG8gdHJ1ZSB3aGVuZXZlciB1c2VyIHNjcm9sbHMsIHNldCB0byBmYWxzZSB3aGVuIG5ldyByZXN1bHRzIGFyZSBzaG93blxuICAgIGxhc3RSZXN1bHRzVXBkYXRlVGltZTogbnVsbCwgLy8gdG8gbWVhc3VyZSBob3cgbG9uZyBhIHJlc3VsdCBoYXMgYmVlbiBzaG93biBmb3JcbiAgICByZXN1bHRzT3ZlcmZsb3dIZWlnaHQ6IDAsIC8vIHRvIGRldGVybWluZSBpZiBzY3JvbGxpbmcgaXMgcG9zc2libGUgKGkuZS4sIG92ZXJmbG93ID4gMHB4KVxuICAgIGFmdGVyUXVlcnlDb3VudDogMCxcbiAgICBkaXNjYXJkZWRSZXN1bHRzOiAwLFxuICAgIGlzUG9wdXBPcGVuOiBmYWxzZSxcbiAgICBsYXN0UG9wdXBPcGVuOiBudWxsLFxuICAgIGxhc3RRdWVyeVRpbWU6IG51bGwsXG4gICAgbGFzdERpc3BsYXlUaW1lOiBudWxsLFxuICAgIGxhc3RGb2N1c1RpbWU6IG51bGwsXG4gICAgaGlnaGxpZ2h0Rmlyc3RFbGVtZW50OiBmYWxzZSxcbiAgICBzcGVsbENvcnJlY3Rpb25EaWN0OiB7fSxcbiAgICBzcGVsbENvcnI6IHtcbiAgICAgICAgJ29uJzogZmFsc2UsXG4gICAgICAgICdjb3JyZWN0QmFjayc6IHt9LFxuICAgICAgICAnb3ZlcnJpZGUnOiBmYWxzZSxcbiAgICAgICAgJ3B1c2hlZCc6IG51bGwsXG4gICAgICAgICd1c2VyQ29uZmlybWVkJzogZmFsc2UsXG4gICAgICAgICdzZWFyY2hUZXJtcyc6IFtdXG4gICAgfSxcbiAgICBobTogbnVsbCxcbiAgICBjdXJyZW50QXV0b0xvYWRVUkw6IG51bGwsXG4gICAgZ2V0UmVzdWx0c09yZGVyOiBmdW5jdGlvbihyZXN1bHRzKXtcbiAgICAgICAgcmV0dXJuIENsaXF6QXV0b2NvbXBsZXRlLnByZXBhcmVSZXN1bHRPcmRlcihyZXN1bHRzKTtcbiAgICB9LFxuICAgIC8vIFNPVVJDRTogaHR0cHM6Ly9kZXZlbG9wZXIubW96aWxsYS5vcmcvZW4tVVMvZG9jcy9Ib3dfdG9faW1wbGVtZW50X2N1c3RvbV9hdXRvY29tcGxldGVfc2VhcmNoX2NvbXBvbmVudFxuICAgIFByb3ZpZGVyQXV0b0NvbXBsZXRlUmVzdWx0Q2xpcXo6IGZ1bmN0aW9uKHNlYXJjaFN0cmluZywgc2VhcmNoUmVzdWx0LFxuICAgICAgICBkZWZhdWx0SW5kZXgsIGVycm9yRGVzY3JpcHRpb24pIHtcbiAgICAgICAgdGhpcy5fc2VhcmNoU3RyaW5nID0gc2VhcmNoU3RyaW5nO1xuICAgICAgICB0aGlzLl9zZWFyY2hSZXN1bHQgPSBzZWFyY2hSZXN1bHQ7XG4gICAgICAgIHRoaXMuX2RlZmF1bHRJbmRleCA9IGRlZmF1bHRJbmRleDtcbiAgICB9LFxuICAgIC8vIFNPVVJDRTogaHR0cDovL214ci5tb3ppbGxhLm9yZy9tb3ppbGxhLWNlbnRyYWwvc291cmNlL3Rvb2xraXQvY29tcG9uZW50cy9hdXRvY29tcGxldGUvbnNJQXV0b0NvbXBsZXRlUmVzdWx0LmlkbFxuICAgIENsaXF6UmVzdWx0czogZnVuY3Rpb24oKXt9LFxuICAgIHJlc2V0U3BlbGxDb3JyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgQ2xpcXpBdXRvY29tcGxldGUuc3BlbGxDb3JyID0ge1xuICAgICAgICAgICAgJ29uJzogZmFsc2UsXG4gICAgICAgICAgICAnY29ycmVjdEJhY2snOiB7fSxcbiAgICAgICAgICAgICdvdmVycmlkZSc6IGZhbHNlLFxuICAgICAgICAgICAgJ3B1c2hlZCc6IG51bGwsXG4gICAgICAgICAgICAndXNlckNvbmZpcm1lZCc6IGZhbHNlLFxuICAgICAgICAgICAgJ3NlYXJjaFRlcm1zJzogW11cbiAgICAgICAgfVxuICAgIH0sXG4gICAgaW5pdFByb3ZpZGVyOiBmdW5jdGlvbigpe1xuICAgICAgICBDbGlxekF1dG9jb21wbGV0ZS5Qcm92aWRlckF1dG9Db21wbGV0ZVJlc3VsdENsaXF6LnByb3RvdHlwZSA9IHtcbiAgICAgICAgICAgIF9zZWFyY2hTdHJpbmc6ICcnLFxuICAgICAgICAgICAgX3NlYXJjaFJlc3VsdDogMCxcbiAgICAgICAgICAgIF9kZWZhdWx0SW5kZXg6IDAsXG4gICAgICAgICAgICBfZXJyb3JEZXNjcmlwdGlvbjogJycsXG4gICAgICAgICAgICBfcmVzdWx0czogW10sXG5cbiAgICAgICAgICAgIGdldCBzZWFyY2hTdHJpbmcoKSB7IHJldHVybiB0aGlzLl9zZWFyY2hTdHJpbmc7IH0sXG4gICAgICAgICAgICBnZXQgc2VhcmNoUmVzdWx0KCkgeyByZXR1cm4gdGhpcy5fc2VhcmNoUmVzdWx0OyB9LFxuICAgICAgICAgICAgZ2V0IGRlZmF1bHRJbmRleCgpIHsgcmV0dXJuIHRoaXMuX2RlZmF1bHRJbmRleDsgfSxcbiAgICAgICAgICAgIGdldCBlcnJvckRlc2NyaXB0aW9uKCkgeyByZXR1cm4gdGhpcy5fZXJyb3JEZXNjcmlwdGlvbjsgfSxcbiAgICAgICAgICAgIGdldCBtYXRjaENvdW50KCkgeyByZXR1cm4gdGhpcy5fcmVzdWx0cy5sZW5ndGg7IH0sXG4gICAgICAgICAgICBnZXRWYWx1ZUF0OiBmdW5jdGlvbihpbmRleCkgeyByZXR1cm4gKHRoaXMuX3Jlc3VsdHNbaW5kZXhdIHx8IHt9KS52YWw7IH0sXG4gICAgICAgICAgICBnZXRGaW5hbENvbXBsZXRlVmFsdWVBdDogZnVuY3Rpb24oaW5kZXgpIHsgcmV0dXJuIG51bGw7IH0sIC8vRkYzMStcbiAgICAgICAgICAgIGdldENvbW1lbnRBdDogZnVuY3Rpb24oaW5kZXgpIHsgcmV0dXJuICh0aGlzLl9yZXN1bHRzW2luZGV4XSB8fCB7fSkuY29tbWVudDsgfSxcbiAgICAgICAgICAgIGdldFN0eWxlQXQ6IGZ1bmN0aW9uKGluZGV4KSB7IHJldHVybiAodGhpcy5fcmVzdWx0c1tpbmRleF0gfHwge30pLnN0eWxlOyB9LFxuICAgICAgICAgICAgZ2V0SW1hZ2VBdDogZnVuY3Rpb24gKGluZGV4KSB7IHJldHVybiAnJzsgfSxcbiAgICAgICAgICAgIGdldExhYmVsQXQ6IGZ1bmN0aW9uKGluZGV4KSB7IHJldHVybiAodGhpcy5fcmVzdWx0c1tpbmRleF0gfHwge30pLmxhYmVsOyB9LFxuICAgICAgICAgICAgZ2V0RGF0YUF0OiBmdW5jdGlvbihpbmRleCkgeyByZXR1cm4gKHRoaXMuX3Jlc3VsdHNbaW5kZXhdIHx8IHt9KS5kYXRhOyB9LFxuICAgICAgICAgICAgUXVlcnlJbnRlcmZhY2U6IFhQQ09NVXRpbHMuZ2VuZXJhdGVRSShbICBdKSxcbiAgICAgICAgICAgIHNldFJlc3VsdHM6IGZ1bmN0aW9uKHJlc3VsdHMpe1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fcmVzdWx0cyA9IHRoaXMuZmlsdGVyVW5leHBlY3RlZChyZXN1bHRzKTtcblxuICAgICAgICAgICAgICAgIENsaXF6QXV0b2NvbXBsZXRlLmxhc3RSZXN1bHQgPSB0aGlzO1xuICAgICAgICAgICAgICAgIGV2ZW50cy5wdWIoJ2F1dG9jb21wbGV0ZS5uZXdfcmVzdWx0JywgeyByZXN1bHQ6IHRoaXMsIGlzUG9wdXBPcGVuOiBDbGlxekF1dG9jb21wbGV0ZS5pc1BvcHVwT3BlbiB9KTtcbiAgICAgICAgICAgICAgICB2YXIgb3JkZXIgPSBDbGlxekF1dG9jb21wbGV0ZS5nZXRSZXN1bHRzT3JkZXIodGhpcy5fcmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgdXRpbHMuc2V0UmVzdWx0T3JkZXIob3JkZXIpO1xuXG4gICAgICAgICAgICAgICAgLy8gZmxhZyBmb3IgcmVuZGVyaW5nIHRvIGF2b2lkIHJlbmRlcmluZyBvZiBcInVubWl4ZWRcIiByZXN1bHRzXG4gICAgICAgICAgICAgICAgdGhpcy5pc01peGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGZpbHRlclVuZXhwZWN0ZWQ6IGZ1bmN0aW9uKHJlc3VsdHMpe1xuICAgICAgICAgICAgICAgIC8vIGZpbHRlciBvdXQgdW51bnNlZC91bmV4cGVjdGVkIHJlc3VsdHNcbiAgICAgICAgICAgICAgICB2YXIgcmV0PVtdO1xuICAgICAgICAgICAgICAgIGZvcih2YXIgaT0wOyBpIDwgcmVzdWx0cy5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICAgICAgICAgIHZhciByID0gcmVzdWx0c1tpXTtcbiAgICAgICAgICAgICAgICAgICAgaWYoci5zdHlsZSA9PSAnY2xpcXotZXh0cmEnKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHIuZGF0YSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gb3ZlcnJpZGUgdGhlIHRlbXBsYXRlIGlmIHRoZSBzdXBlclRlbXBsYXRlIGlzIGtub3duXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYodXRpbHMuaXNVbmtub3duVGVtcGxhdGUoci5kYXRhLnRlbXBsYXRlKSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHVuZXhwZWN0ZWQvdW5rbm93biB0ZW1wbGF0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAvLyBJZiBvbmUgb2YgdGhlIHJlc3VsdHMgaXMgZGF0YS5vbmx5ID0gdHJ1ZSBSZW1vdmUgYWxsIG90aGVycy5cbiAgICAgICAgICAgICAgICAgICAgLy8gaWYgKCFyLmludmFsaWQgJiYgci5kYXRhICYmIHIuZGF0YS5vbmx5KSB7XG4gICAgICAgICAgICAgICAgICAgIC8vICByZXR1cm4gW3JdO1xuICAgICAgICAgICAgICAgICAgICAvL31cblxuICAgICAgICAgICAgICAgICAgICByZXQucHVzaChyKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgLy8gYSByZXN1bHQgaXMgZG9uZSBvbmNlIGEgbmV3IHJlc3VsdCBjb21lcyBpbiwgb3Igb25jZSB0aGUgcG9wdXAgY2xvc2VzXG4gICAgbWFya1Jlc3VsdHNEb25lOiBmdW5jdGlvbihuZXdSZXN1bHRzVXBkYXRlVGltZSkge1xuICAgICAgICAvLyBpcyB0aGVyZSBhIHJlc3VsdCB0byBiZSBtYXJrZWQgYXMgZG9uZT9cbiAgICAgICAgaWYgKENsaXF6QXV0b2NvbXBsZXRlLmxhc3RSZXN1bHRzVXBkYXRlVGltZSkge1xuICAgICAgICAgICAgdmFyIHJlc3VsdHNEaXNwbGF5VGltZSA9IERhdGUubm93KCkgLSBDbGlxekF1dG9jb21wbGV0ZS5sYXN0UmVzdWx0c1VwZGF0ZVRpbWU7XG4gICAgICAgICAgICB0aGlzLnNlbmRSZXN1bHRzRG9uZVNpZ25hbChyZXN1bHRzRGlzcGxheVRpbWUpO1xuICAgICAgICB9XG4gICAgICAgIC8vIHN0YXJ0IGNvdW50aW5nIGVsYXBzZWQgdGltZSBhbmV3XG4gICAgICAgIENsaXF6QXV0b2NvbXBsZXRlLmxhc3RSZXN1bHRzVXBkYXRlVGltZSA9IG5ld1Jlc3VsdHNVcGRhdGVUaW1lO1xuICAgICAgICBDbGlxekF1dG9jb21wbGV0ZS5oYXNVc2VyU2Nyb2xsZWRDdXJyZW50UmVzdWx0cyA9IGZhbHNlO1xuICAgIH0sXG4gICAgc2VuZFJlc3VsdHNEb25lU2lnbmFsOiBmdW5jdGlvbihyZXN1bHRzRGlzcGxheVRpbWUpIHtcbiAgICAgICAgLy8gcmVkdWNlZCB0cmFmZmljOiBvbmx5IGNvbnNpZGVyIHRlbGVtZXRyeSBkYXRhIGlmIHJlc3VsdCB3YXMgc2hvd24gbG9uZyBlbm91Z2ggKGUuZy4sIDAuNXMpXG4gICAgICAgIGlmIChyZXN1bHRzRGlzcGxheVRpbWUgPiBDbGlxekF1dG9jb21wbGV0ZS5TQ1JPTExfU0lHTkFMX01JTl9USU1FKSB7XG4gICAgICAgICAgICB2YXIgYWN0aW9uID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdhY3Rpdml0eScsXG4gICAgICAgICAgICAgICAgYWN0aW9uOiAncmVzdWx0c19kb25lJyxcbiAgICAgICAgICAgICAgICBoYXNfdXNlcl9zY3JvbGxlZDogQ2xpcXpBdXRvY29tcGxldGUuaGFzVXNlclNjcm9sbGVkQ3VycmVudFJlc3VsdHMsXG4gICAgICAgICAgICAgICAgcmVzdWx0c19kaXNwbGF5X3RpbWU6IHJlc3VsdHNEaXNwbGF5VGltZSxcbiAgICAgICAgICAgICAgICByZXN1bHRzX292ZXJmbG93X2hlaWdodDogQ2xpcXpBdXRvY29tcGxldGUucmVzdWx0c092ZXJmbG93SGVpZ2h0LFxuICAgICAgICAgICAgICAgIGNhbl91c2VyX3Njcm9sbDogQ2xpcXpBdXRvY29tcGxldGUucmVzdWx0c092ZXJmbG93SGVpZ2h0ID4gMFxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIHV0aWxzLnRlbGVtZXRyeShhY3Rpb24pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvLyByZXR1cm5zIGFycmF5IG9mIHJlc3VsdCBraW5kcywgYWRkaW5nIGVhY2ggcmVzdWx0J3NcbiAgICAvLyBoZWlnaHQgaW4gdGVybXMgb2Ygb2NjdXBpZWQgZHJvcGRvd24gc2xvdHMgKDEtMykgYXNcbiAgICAvLyBwYXJhbWV0ZXIgKGUuZy4sIFtcIkN8e1xcXCJoXFxcIjoxfVwiXSxbXCJtfHtcXFwiaFxcXCI6MX1cIl0pXG4gICAgcHJlcGFyZVJlc3VsdE9yZGVyOiBmdW5jdGlvbiAocmVzdWx0cykge1xuICAgICAgICAvLyBoZWlnaHRzIGlzIHVwZGF0ZWQgaW4gVUkncyBoYW5kbGVSZXN1bHRzXG4gICAgICAgIHZhciBoZWlnaHRzID0gQ2xpcXpBdXRvY29tcGxldGUubGFzdFJlc3VsdEhlaWdodHMsXG4gICAgICAgICAgICByZXN1bHRPcmRlciA9IFtdO1xuXG4gICAgICAgIGlmIChyZXN1bHRzKSB7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgcmVzdWx0cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGlmKHJlc3VsdHNbaV0uZGF0YSA9PSBudWxsIHx8IHJlc3VsdHNbaV0uZGF0YS5raW5kID09IG51bGwpe1xuICAgICAgICAgICAgICAgICAgcmVzdWx0T3JkZXIucHVzaCgnXycpOyAvL2RlYnVnIC0gaXQgc2hvdWxkIG5vdCBoYXBwZW5cbiAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBraW5kICAgPSByZXN1bHRzW2ldLmRhdGEua2luZC5zbGljZSgwKSxcbiAgICAgICAgICAgICAgICAgICAgdG9rZW5zID0ga2luZCAmJiBraW5kLmxlbmd0aCA+IDAgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBraW5kWzBdLnNwbGl0KCd8JykgOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1zID0gdG9rZW5zLmxlbmd0aCA+IDEgP1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICBKU09OLnBhcnNlKHRva2Vuc1sxXSkgOiB7fTtcblxuICAgICAgICAgICAgICAgIHBhcmFtcy5oID0gaSA8IGhlaWdodHMubGVuZ3RoID9cbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodHNbaV0gOiAwO1xuICAgICAgICAgICAgICAgIGtpbmRbMF0gPVxuICAgICAgICAgICAgICAgICAgICB0b2tlbnNbMF0gKyAnfCcgKyBKU09OLnN0cmluZ2lmeShwYXJhbXMpO1xuICAgICAgICAgICAgICAgIHJlc3VsdE9yZGVyLnB1c2goa2luZCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcmVzdWx0T3JkZXI7XG4gICAgfSxcbiAgICBpbml0UmVzdWx0czogZnVuY3Rpb24oKXtcbiAgICAgICAgQ2xpcXpBdXRvY29tcGxldGUuQ2xpcXpSZXN1bHRzLnByb3RvdHlwZSA9IHtcbiAgICAgICAgICAgIHJlc3VsdHNUaW1lcjogbnVsbCxcbiAgICAgICAgICAgIGhpc3RvcnlUaW1lcjogbnVsbCxcbiAgICAgICAgICAgIGhpc3RvcnlUaW1lb3V0OiBmYWxzZSxcbiAgICAgICAgICAgIGluc3RhbnQ6IFtdLFxuXG4gICAgICAgICAgICBoaXN0b3J5VGltZW91dENhbGxiYWNrOiBmdW5jdGlvbihwYXJhbXMpIHtcbiAgICAgICAgICAgICAgICB1dGlscy5sb2coJ2hpc3RvcnkgdGltZW91dCcsIENsaXF6QXV0b2NvbXBsZXRlLkxPR19LRVkpO1xuICAgICAgICAgICAgICAgIHRoaXMuaGlzdG9yeVRpbWVvdXQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIC8vIEhpc3RvcnkgdGltZWQgb3V0IGJ1dCBtYXliZSB3ZSBoYXZlIHNvbWUgcmVzdWx0cyBhbHJlYWR5XG4gICAgICAgICAgICAgICAgLy8gU28gc2hvdyB3aGF0IHlvdSBoYXZlIC0gQUIgMTA3M1xuICAgICAgICAgICAgICAgIGlmICh0aGlzLmhpc3RvcnlSZXN1bHRzICYmIENsaXF6VXRpbHMuZ2V0UHJlZihcImhpc3RvcnkudGltZW91dHNcIiwgZmFsc2UpKSB7XG4gICAgICAgICAgICAgICAgICAgIGhpc3RvcnlDbHVzdGVyLmFkZEZpcmVmb3hIaXN0b3J5KHRoaXMuaGlzdG9yeVJlc3VsdHMpO1xuICAgICAgICAgICAgICAgICAgICBDbGlxelV0aWxzLmxvZygnaGlzdG9yeVRpbWVvdXRDYWxsYmFjazogcHVzaCBjb2xsZWN0ZWQgcmVzdWx0czonICsgdGhpcy5oaXN0b3J5UmVzdWx0cy5yZXN1bHRzLmxlbmd0aCwgQ2xpcXpBdXRvY29tcGxldGUuTE9HX0tFWSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5wdXNoUmVzdWx0cyh0aGlzLnNlYXJjaFN0cmluZyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG9uSGlzdG9yeURvbmU6IGZ1bmN0aW9uKHJlc3VsdCwgcmVzdWx0RXh0cmEpIHtcbiAgICAgICAgICAgICAgICBpZighdGhpcy5zdGFydFRpbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuOyAvLyBubyBjdXJyZW50IHNlYXJjaCwganVzdCBkaXNjYXJkXG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG5cbiAgICAgICAgICAgICAgICB0aGlzLmhpc3RvcnlSZXN1bHRzID0gcmVzdWx0O1xuICAgICAgICAgICAgICAgIHRoaXMubGF0ZW5jeS5oaXN0b3J5ID0gbm93IC0gdGhpcy5zdGFydFRpbWU7XG5cbiAgICAgICAgICAgICAgICAvL3V0aWxzLmxvZyhcImhpc3RvcnkgcmVzdWx0czogXCIgKyAocmVzdWx0ID8gcmVzdWx0Lm1hdGNoQ291bnQgOiBcIm51bGxcIikgKyBcIjsgZG9uZTogXCIgKyB0aGlzLmlzSGlzdG9yeVJlYWR5KCkgK1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgICAgICAgXCI7IHRpbWU6IFwiICsgKG5vdyAtIHRoaXMuc3RhcnRUaW1lKSwgQ2xpcXpBdXRvY29tcGxldGUuTE9HX0tFWSlcbiAgICAgICAgICAgICAgICAvLyBDaG9vc2UgYW4gaW5zdGFudCByZXN1bHQgaWYgd2UgaGF2ZSBhbGwgaGlzdG9yeSByZXN1bHRzICh0aW1lb3V0KVxuICAgICAgICAgICAgICAgIC8vIGFuZCB3ZSBoYXZlbid0IGFscmVhZHkgY2hvc2VuIG9uZVxuICAgICAgICAgICAgICAgIGlmKHJlc3VsdCAmJiAodGhpcy5pc0hpc3RvcnlSZWFkeSgpIHx8IHRoaXMuaGlzdG9yeVRpbWVvdXQpICYmIHRoaXMubWl4ZWRSZXN1bHRzLm1hdGNoQ291bnQgPT0gMCkge1xuICAgICAgICAgICAgICAgICAgICB1dGlscy5jbGVhclRpbWVvdXQodGhpcy5oaXN0b3J5VGltZXIpO1xuICAgICAgICAgICAgICAgICAgICBoaXN0b3J5Q2x1c3Rlci5hZGRGaXJlZm94SGlzdG9yeShyZXN1bHQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBpc0hpc3RvcnlSZWFkeTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuaGlzdG9yeVJlc3VsdHMgJiYgdGhpcy5oaXN0b3J5UmVzdWx0cy5yZWFkeTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjbGlxel9obV9zZWFyY2g6IGZ1bmN0aW9uKF90aGlzLCByZXMsIGhpc3Rfc2VhcmNoX3R5cGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGF0YSA9IG51bGw7XG4gICAgICAgICAgICAgICAgaWYgKGhpc3Rfc2VhcmNoX3R5cGUgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgIGRhdGEgPSBDbGlxelV0aWxzLmhtLmRvX3NlYXJjaChyZXMucXVlcnksIGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgIGRhdGFbJ2NvbnQnXSA9IG51bGw7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgZGF0YSA9IENsaXF6VXRpbHMuaG0uZG9fc2VhcmNoKHJlcy5xdWVyeSwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHVybEF1dG8gPSBDbGlxelV0aWxzLmhtLnVybEZvckF1dG9Mb2FkKGRhdGEpO1xuICAgICAgICAgICAgICAgIGlmIChmYWxzZSAmJiB1cmxBdXRvKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB3aW4gPSBDbGlxelV0aWxzLmdldFdpbmRvdygpLmdCcm93c2VyLmNvbnRlbnRXaW5kb3c7XG4gICAgICAgICAgICAgICAgICAgIC8vaWYgKENsaXF6QXV0b2NvbXBsZXRlLmN1cnJlbnRBdXRvTG9hZFVSTD09bnVsbCB8fCB3aW4ubG9jYXRpb24uaHJlZj09J2Fib3V0OmNsaXF6Jykge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHdpbi5sb2NhdGlvbi5ocmVmIT11cmxBdXRvKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5sb2coXCI+PiBBVVRPTE9BRCBMQVVOQ0g6IFwiICsgdXJsQXV0bywgJ0NsaXF6SE0nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB3aW4ubG9jYXRpb24uaHJlZiA9IHVybEF1dG87XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2xpcXpBdXRvY29tcGxldGUuY3VycmVudEF1dG9Mb2FkVVJMID0gdXJsQXV0bztcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgLy99XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gRXh0cmFjdCByZXN1bHRzXG4gICAgICAgICAgICAgICAgdmFyIHBhdHRlcm5zID0gW107XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkYXRhLnJlc3VsdC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgdmFyIHVybCA9IENsaXF6VXRpbHMuY2xlYW5Nb3ppbGxhQWN0aW9ucyhkYXRhLnJlc3VsdFtpXVswXSlbMV0sXG4gICAgICAgICAgICAgICAgICAgICAgdGl0bGUgPSBkYXRhLnJlc3VsdFtpXVsxXTtcblxuICAgICAgICAgICAgICAgICAgaWYgKCF0aXRsZSB8fCB0aXRsZSA9PSAnTi9BJykge1xuICAgICAgICAgICAgICAgICAgICB0aXRsZSA9IENsaXF6VXRpbHMuZ2VuZXJhbGl6ZVVybCh1cmwpO1xuICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICBpZiAodGl0bGUubGVuZ3RoID4gMCAmJiB1cmwubGVuZ3RoID4gMCAmJlxuICAgICAgICAgICAgICAgICAgICAgIFJlc3VsdC5pc1ZhbGlkKHVybCwgQ2xpcXpVdGlscy5nZXREZXRhaWxzRnJvbVVybCh1cmwpKSkge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBpdGVtID0ge1xuICAgICAgICAgICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICAgICAgICAgIHRpdGxlOiB0aXRsZSxcbiAgICAgICAgICAgICAgICAgICAgICBmYXZpY29uOiBudWxsLCAvL2hpc3RvcnkucmVzdWx0c1tpXS5pbWFnZSxcbiAgICAgICAgICAgICAgICAgICAgICBfZ2VuVXJsOiBDbGlxelV0aWxzLmdlbmVyYWxpemVVcmwodXJsLCB0cnVlKSxcbiAgICAgICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5yZXN1bHRbaV1bM10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLnJlc3VsdFtpXVszXS5oYXNPd25Qcm9wZXJ0eSgnYycpKSBpdGVtWyd4dHJhX2MnXSA9IGRhdGEucmVzdWx0W2ldWzNdWydjJ107XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5yZXN1bHRbaV1bM10uaGFzT3duUHJvcGVydHkoJ3EnKSkgaXRlbVsneHRyYV9xJ10gPSBkYXRhLnJlc3VsdFtpXVszXVsncSddO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcGF0dGVybnMucHVzaChpdGVtKTtcbiAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgdmFyIGNvbnQgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuaGFzT3duUHJvcGVydHkoJ2NvbnQnKSkgY29udCA9IGRhdGFbJ2NvbnQnXTtcblxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmKHBhdHRlcm5zLmxlbmd0aCA+MCl7XG4gICAgICAgICAgICAgICAgICAgIHZhciByZXMzID0gaGlzdG9yeUNsdXN0ZXIuX3NpbXBsZVByZXBhcmVQYXR0ZXJucyhwYXR0ZXJucywgcmVzLnF1ZXJ5KTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBpcyBhbHNvIGNhdXNpbmcgdW5kZWZpbmVkIGlzc3VlLiBTcGVjaWZpY2FsbHkgd2hlbiB0aGUgcmVzLmxlbmd0aCA9PSAwO1xuICAgICAgICAgICAgICAgICAgICBpZihyZXMzLnJlc3VsdHMubGVuZ3RoID09IDApe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVzMy5yZXN1bHRzLnB1c2goe1widXJsXCI6IHJlcy5xdWVyeSxcInRpdGxlXCI6IFwiRm91bmQgbm8gcmVzdWx0IGluIGxvY2FsIGhpc3RvcnkgZm9yIHF1ZXJ5OiBcIixcImZhdmljb25cIjogXCJcIixcIl9nZW5VcmxcIjogXCJcIixcImJhc2VcIjogdHJ1ZSxcImRlYnVnXCI6IFwiXCJ9KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGhpc3RvcnlDbHVzdGVyLnNpbXBsZUNyZWF0ZUluc3RhbnRSZXN1bHQocmVzMywgY29udCwgIF90aGlzLnNlYXJjaFN0cmluZywgZnVuY3Rpb24oa2syKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgdmpvaW4gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZqb2luLnB1c2goa2syWzBdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIF90aGlzLmNyZWF0ZUluc3RhbnRSZXN1bHRDYWxsYmFjayh2am9pbiwgJ2htJyk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cblxuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaGlzdG9yeVBhdHRlcm5DYWxsYmFjazogZnVuY3Rpb24ocmVzKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBhYm9ydCBpZiB3ZSBhbHJlYWR5IGhhdmUgcmVzdWx0c1xuICAgICAgICAgICAgICAgIGlmKHRoaXMubWl4ZWRSZXN1bHRzLm1hdGNoQ291bnQgPiAwKSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICBpZiAocmVzLnF1ZXJ5ID09IHRoaXMuc2VhcmNoU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIENsaXF6QXV0b2NvbXBsZXRlLmxhc3RQYXR0ZXJuID0gcmVzO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBsYXRlbmN5ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGhpc3RvcnlDbHVzdGVyLmxhdGVuY2llc1tyZXMucXVlcnldKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsYXRlbmN5ID0gKG5ldyBEYXRlKCkpLmdldFRpbWUoKSAtIGhpc3RvcnlDbHVzdGVyLmxhdGVuY2llc1tyZXMucXVlcnldO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHRoaXMubGF0ZW5jeS5wYXR0ZXJucyA9IGxhdGVuY3k7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gQ3JlYXRlIGluc3RhbnQgcmVzdWx0XG4gICAgICAgICAgICAgICAgICAgIGhpc3RvcnlDbHVzdGVyLmNyZWF0ZUluc3RhbnRSZXN1bHQocmVzLCB0aGlzLnNlYXJjaFN0cmluZywgdGhpcy5jcmVhdGVJbnN0YW50UmVzdWx0Q2FsbGJhY2ssIHRoaXMuY3VzdG9tUmVzdWx0cyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNyZWF0ZUluc3RhbnRSZXN1bHRDYWxsYmFjazpmdW5jdGlvbihpbnN0YW50LCB0eXBlX3Jlcykge1xuICAgICAgICAgICAgICAgIGlmICh0eXBlX3JlcyA9PSAnaG0nKSB7XG4gICAgICAgICAgICAgICAgICBpbnN0YW50WzBdLnR5cGUgPSAnaG0nXG4gICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbnQudW5zaGlmdChpbnN0YW50WzBdKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgaWYodGhpcy5pbnN0YW50Lmxlbmd0aCA+IDAgJiYgdGhpcy5pbnN0YW50WzBdLnR5cGUgPT0gJ2htJyl7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFudFsxXSA9IGluc3RhbnRbMF07XG4gICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmluc3RhbnQgPSBpbnN0YW50XG4gICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHRoaXMucHVzaFJlc3VsdHModGhpcy5zZWFyY2hTdHJpbmcpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHB1c2hUaW1lb3V0Q2FsbGJhY2s6IGZ1bmN0aW9uKHBhcmFtcykge1xuICAgICAgICAgICAgICAgIHV0aWxzLmxvZyhcInB1c2hSZXN1bHRzIHRpbWVvdXRcIiwgQ2xpcXpBdXRvY29tcGxldGUuTE9HX0tFWSk7XG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoUmVzdWx0cyhwYXJhbXMpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIC8vIGNoZWNrcyBpZiBhbGwgdGhlIHJlc3VsdHMgYXJlIHJlYWR5IG9yIGlmIHRoZSB0aW1lb3V0IGlzIGV4Y2VlZGVkXG4gICAgICAgICAgICBwdXNoUmVzdWx0czogZnVuY3Rpb24ocSkge1xuICAgICAgICAgICAgICAgIGlmKHEgPT0gdGhpcy5zZWFyY2hTdHJpbmcgJiYgdGhpcy5zdGFydFRpbWUgIT0gbnVsbCl7IC8vIGJlIHN1cmUgdGhpcyBpcyBub3QgYSBkZWxheWVkIHJlc3VsdFxuICAgICAgICAgICAgICAgICAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcblxuICAgICAgICAgICAgICAgICAgICBpZigobm93ID4gdGhpcy5zdGFydFRpbWUgKyBDbGlxekF1dG9jb21wbGV0ZS5USU1FT1VUKSB8fCAvLyAxcyB0aW1lb3V0XG4gICAgICAgICAgICAgICAgICAgICAgICh0aGlzLmlzSGlzdG9yeVJlYWR5KCkgfHwgdGhpcy5oaXN0b3J5VGltZW91dCkgJiYgLy8gaGlzdG9yeSBpcyByZWFkeSBvciB0aW1lZCBvdXRcbiAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGlxelJlc3VsdHMpIHsgLy8gYWxsIHJlc3VsdHMgYXJlIHJlYWR5XG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gUHVzaCBmdWxsIHJlc3VsdFxuICAgICAgICAgICAgICAgICAgICAgICAgdXRpbHMuY2xlYXJUaW1lb3V0KHRoaXMucmVzdWx0c1RpbWVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHV0aWxzLmNsZWFyVGltZW91dCh0aGlzLmhpc3RvcnlUaW1lcik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubWl4UmVzdWx0cyhmYWxzZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGF0ZW5jeS5taXhlZCA9IERhdGUubm93KCkgLSB0aGlzLnN0YXJ0VGltZTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5jYWxsYmFjayh0aGlzLm1peGVkUmVzdWx0cywgdGhpcyk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMubGF0ZW5jeS5hbGwgPSBEYXRlLm5vdygpIC0gdGhpcy5zdGFydFRpbWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGRlbGF5IHdyYXBwaW5nIHRvIG1ha2Ugc3VyZSByZW5kZXJpbmcgaXMgY29tcGxldGVcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIG90aGVyd2lzZSB3ZSBkb24ndCBnZXQgdXAgdG8gZGF0ZSBhdXRvY29tcGxldGUgc3RhdHNcbiAgICAgICAgICAgICAgICAgICAgICAgIHV0aWxzLnNldFRpbWVvdXQodGhpcy5mdWxsV3JhcHVwLCAwLCB0aGlzKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYodGhpcy5pc0hpc3RvcnlSZWFkeSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gUHVzaCBpbnN0YW50IHJlc3VsdFxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5sYXRlbmN5Lm1peGVkID0gRGF0ZS5ub3coKSAtIHRoaXMuc3RhcnRUaW1lO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1peFJlc3VsdHModHJ1ZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRyeSB0byB1cGRhdGUgYXMgb2ZmZW4gYXMgcG9zc2libGUgaWYgbmV3IHJlc3VsdHMgYXJlIHJlYWR5XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBUT0RPIC0gdHJ5IHRvIGNoZWNrIGlmIHRoZSBzYW1lIHJlc3VsdHMgYXJlIGN1cnJlbnRseSBkaXNwbGF5aW5nXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm1peGVkUmVzdWx0cy5tYXRjaENvdW50ICYmIHRoaXMuY2FsbGJhY2sodGhpcy5taXhlZFJlc3VsdHMsIHRoaXMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmxhdGVuY3kuYWxsID0gRGF0ZS5ub3coKSAtIHRoaXMuc3RhcnRUaW1lO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBEbyBwYXJ0aWFsIHdyYXB1cCwgZmluYWwgd3JhcHVwIHdpbGwgaGFwcGVuIGFmdGVyIGFsbCByZXN1bHRzIGFyZSByZWNlaXZlZFxuICAgICAgICAgICAgICAgICAgICAgICAgdXRpbHMuc2V0VGltZW91dCh0aGlzLmluc3RhbnRXcmFwdXAsIDAsIHRoaXMpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIE5vdGhpbmcgdG8gcHVzaCB5ZXQsIHByb2JhYmx5IG9ubHkgY2xpcXogcmVzdWx0cyBhcmUgcmVjZWl2ZWQsIGtlZXAgd2FpdGluZ1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gaGFuZGxlcyBmZXRjaGVkIHJlc3VsdHMgZnJvbSB0aGUgY2FjaGVcbiAgICAgICAgICAgIGNsaXF6UmVzdWx0RmV0Y2hlcjogZnVuY3Rpb24ocmVxLCBxKSB7XG5cbiAgICAgICAgICAgICAgICAvLyBiZSBzdXJlIHRoaXMgaXMgbm90IGEgZGVsYXllZCByZXN1bHRcbiAgICAgICAgICAgICAgICBpZihxICE9IHRoaXMuc2VhcmNoU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuZGlzY2FyZGVkUmVzdWx0cyArPSAxOyAvLyBjb3VudCByZXN1bHRzIGRpc2NhcmRlZCBmcm9tIGJhY2tlbmQgYmVjYXVzZSB0aGV5IHdlcmUgb3V0IG9mIGRhdGVcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmxhdGVuY3kuYmFja2VuZCA9IERhdGUubm93KCkgLSB0aGlzLnN0YXJ0VGltZTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGpzb24gPSBKU09OLnBhcnNlKHJlcS5yZXNwb25zZSk7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gYXBwbHkgcmVyYW5rZXJzXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdXRpbHMuUkVSQU5LRVJTLmxlbmd0aDsgaSsrKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZXJhbmtlciA9IHV0aWxzLlJFUkFOS0VSU1tpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXJhbmtlciAhPSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVyYW5rZXJSZXN1bHRzID0gcmVyYW5rZXIuZG9SZXJhbmsoanNvbi5yZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzb24ucmVzdWx0ID0gcmVyYW5rZXJSZXN1bHRzLnJlc3BvbnNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhyZXJhbmtlclJlc3VsdHMudGVsZW1ldHJ5U2lnbmFsKS5sZW5ndGggPiAwKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy51c2VyUmVyYW5rZXJzW3JlcmFua2VyLm5hbWVdID0gcmVyYW5rZXJSZXN1bHRzLnRlbGVtZXRyeVNpZ25hbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHV0aWxzLmxvZyhqc29uLnJlc3VsdCA/IGpzb24ucmVzdWx0Lmxlbmd0aCA6IDAsXCJDbGlxekF1dG9jb21wbGV0ZS5jbGlxelJlc3VsdEZldGNoZXJcIik7XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0cyA9IGpzb24ucmVzdWx0IHx8IFtdO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xpcXpSZXN1bHRzRXh0cmEgPSBbXTtcblxuICAgICAgICAgICAgICAgICAgICBpZihqc29uLmltYWdlcyAmJiBqc29uLmltYWdlcy5yZXN1bHRzICYmIGpzb24uaW1hZ2VzLnJlc3VsdHMubGVuZ3RoID4wKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpbWdzID0ganNvbi5pbWFnZXMucmVzdWx0cy5maWx0ZXIoZnVuY3Rpb24ocil7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy9pZ25vcmUgZW1wdHkgcmVzdWx0c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBPYmplY3Qua2V5cyhyKS5sZW5ndGggIT0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNsaXF6UmVzdWx0c0V4dHJhID1pbWdzLm1hcChSZXN1bHQuY2xpcXpFeHRyYSk7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgaGFzRXh0cmEgPSBmdW5jdGlvbihlbCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZighZWwgfHwgIWVsLnJlc3VsdHMgfHwgZWwucmVzdWx0cy5sZW5ndGggPT0gMCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgZWwucmVzdWx0cyA9IGVsLnJlc3VsdHMuZmlsdGVyKGZ1bmN0aW9uKHIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vaWdub3JlIGVtcHR5IHJlc3VsdHNcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gci5oYXNPd25Qcm9wZXJ0eSgndXJsJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGVsLnJlc3VsdHMubGVuZ3RoICE9IDA7XG4gICAgICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYoaGFzRXh0cmEoanNvbi5leHRyYSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuY2xpcXpSZXN1bHRzRXh0cmEgPSBqc29uLmV4dHJhLnJlc3VsdHMubWFwKFJlc3VsdC5jbGlxekV4dHJhKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmxhdGVuY3kuY2xpcXogPSBqc29uLmR1cmF0aW9uO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xpcXpSZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIoZnVuY3Rpb24ocil7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmaWx0ZXIgcmVzdWx0cyB3aXRoIG5vIG9yIGVtcHR5IHVybFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHIudXJsICE9IHVuZGVmaW5lZCAmJiByLnVybCAhPSAnJztcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGlxelJlc3VsdHNQYXJhbXMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgY2hvaWNlOiBqc29uLmNob2ljZSxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGhpcy5wdXNoUmVzdWx0cyhxKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjcmVhdGVGYXZpY29Vcmw6IGZ1bmN0aW9uKHVybCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuICdodHRwOi8vY2RuZmF2aWNvbnMuY2xpcXouY29tLycgK1xuICAgICAgICAgICAgICAgICAgICAgICAgdXJsLnJlcGxhY2UoJ2h0dHA6Ly8nLCcnKS5yZXBsYWNlKCdodHRwczovLycsJycpLnNwbGl0KCcvJylbMF07XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLy8gbWl4ZXMgYmFja2VuZCByZXN1bHRzLCBlbnRpdHkgem9uZXMsIGhpc3RvcnkgYW5kIGN1c3RvbSByZXN1bHRzXG4gICAgICAgICAgICBtaXhSZXN1bHRzOiBmdW5jdGlvbihvbmx5X2luc3RhbnQpIHtcblxuICAgICAgICAgICAgICAgIC8vIHNldCBmaXJzdCBoaXN0b3J5IGVudHJ5IGFzIGF1dG9jb21wbGV0ZWQgaWYgaXQgd2FzXG4gICAgICAgICAgICAgICAgaWYodGhpcy5pbnN0YW50Lmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICAgICAgICAgICBDbGlxekF1dG9jb21wbGV0ZS5sYXN0QXV0b2NvbXBsZXRlQWN0aXZlICYmICFvbmx5X2luc3RhbnQpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFudFswXS5hdXRvY29tcGxldGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0cyA9IENsaXF6QXV0b2NvbXBsZXRlLk1peGVyLm1peChcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlYXJjaFN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNsaXF6UmVzdWx0cyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNsaXF6UmVzdWx0c0V4dHJhLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuaW5zdGFudCxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbVJlc3VsdHMsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb25seV9pbnN0YW50XG4gICAgICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgICAgQ2xpcXpBdXRvY29tcGxldGUubGFzdFJlc3VsdElzSW5zdGFudCA9IG9ubHlfaW5zdGFudDtcbiAgICAgICAgICAgICAgICBDbGlxekF1dG9jb21wbGV0ZS5hZnRlclF1ZXJ5Q291bnQgPSAwO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5taXhlZFJlc3VsdHMuc2V0UmVzdWx0cyhyZXN1bHRzKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBhbmFseXplUXVlcnk6IGZ1bmN0aW9uKHEpe1xuICAgICAgICAgICAgICAgIHZhciBwYXJ0cyA9IHJlc3VsdFByb3ZpZGVycy5nZXRDdXN0b21SZXN1bHRzKHEpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3VzdG9tUmVzdWx0cyA9IHBhcnRzWzFdO1xuICAgICAgICAgICAgICAgIHJldHVybiBwYXJ0c1swXTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAvL0ZGIGVudHJ5IHBvaW50XG4gICAgICAgICAgICAvL1RPRE86IHRvIGJlIG1vdmVkIHRvIEVudmlyb25tZW50IVxuICAgICAgICAgICAgc3RhcnRTZWFyY2g6IGZ1bmN0aW9uKHNlYXJjaFN0cmluZywgc2VhcmNoUGFyYW0sIHByZXZpb3VzUmVzdWx0LCBsaXN0ZW5lcil7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWFyY2goc2VhcmNoU3RyaW5nLCBmdW5jdGlvbihyZXN1bHRzLCBjdHgpe1xuICAgICAgICAgICAgICAgICAgICBsaXN0ZW5lci5vblNlYXJjaFJlc3VsdChjdHgsIHJlc3VsdHMpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2VhcmNoOiBmdW5jdGlvbihzZWFyY2hTdHJpbmcsIGNhbGxiYWNrKSB7XG5cbiAgICAgICAgICAgICAgICBDbGlxekF1dG9jb21wbGV0ZS5sYXN0UXVlcnlUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICBDbGlxekF1dG9jb21wbGV0ZS5sYXN0RGlzcGxheVRpbWUgPSBudWxsO1xuICAgICAgICAgICAgICAgIENsaXF6QXV0b2NvbXBsZXRlLmxhc3RSZXN1bHQgPSBudWxsO1xuICAgICAgICAgICAgICAgIENsaXF6QXV0b2NvbXBsZXRlLmxhc3RTdWdnZXN0aW9ucyA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5vbGRQdXNoTGVuZ3RoID0gMDtcbiAgICAgICAgICAgICAgICB0aGlzLmN1c3RvbVJlc3VsdHMgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMubGF0ZW5jeSA9IHtcbiAgICAgICAgICAgICAgICAgICAgY2xpcXo6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGhpc3Rvcnk6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIGJhY2tlbmQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgIG1peGVkOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICBhbGw6IG51bGxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHRoaXMudXNlclJlcmFua2VycyA9IHt9O1xuXG4gICAgICAgICAgICAgICAgdXRpbHMubG9nKCdzZWFyY2g6ICcgKyBzZWFyY2hTdHJpbmcsIENsaXF6QXV0b2NvbXBsZXRlLkxPR19LRVkpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGludmFsaWRRID0gaXNRaW52YWxpZChzZWFyY2hTdHJpbmcudHJpbSgpKSxcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbjogJ2tleV9zdHJva2UnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY3VycmVudF9sZW5ndGg6IHNlYXJjaFN0cmluZy5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgICAgICBpbnZhbGlkOiBpbnZhbGlkUVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHV0aWxzLnRlbGVtZXRyeShhY3Rpb24pO1xuXG4gICAgICAgICAgICAgICAgaWYoaW52YWxpZFEpIHtcbiAgICAgICAgICAgICAgICAgICAgLy93ZSBjYWxsIHRoZSBjYWxsYmFjayB3aXRoIG5vIHJlc3VsdHMgdG8gdHJpZ2dlciBhIGRyb3Bkb3duIGNsb3NlXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKG51bGwsIHRoaXMpXG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZihDbGlxekF1dG9jb21wbGV0ZS5sYXN0U2VhcmNoLmxlbmd0aCA+IHNlYXJjaFN0cmluZy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgIENsaXF6QXV0b2NvbXBsZXRlLnNwZWxsQ29yci5vdmVycmlkZSA9IHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIGFuYWx5c2UgYW5kIG1vZGlmeSBxdWVyeSBmb3IgY3VzdG9tIHJlc3VsdHNcbiAgICAgICAgICAgICAgICBDbGlxekF1dG9jb21wbGV0ZS5sYXN0U2VhcmNoID0gc2VhcmNoU3RyaW5nO1xuICAgICAgICAgICAgICAgIHNlYXJjaFN0cmluZyA9IHRoaXMuYW5hbHl6ZVF1ZXJ5KHNlYXJjaFN0cmluZyk7XG5cbiAgICAgICAgICAgICAgICAvLyBzcGVsbCBjb3JyZWN0aW9uXG4gICAgICAgICAgICAgICAgdmFyIHVybGJhciA9IHV0aWxzLmdldFdpbmRvdygpLmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCd1cmxiYXInKTtcbiAgICAgICAgICAgICAgICBpZiAodXJsYmFyICYmIC8vd2UgZG8gbm90IGhhdmUgdXJsYmFyIG9uIG1vYmlsZSBUT0RPIC0gZml4IGl0IGJldHRlciFcbiAgICAgICAgICAgICAgICAgICAgIUNsaXF6QXV0b2NvbXBsZXRlLnNwZWxsQ29yci5vdmVycmlkZSAmJlxuICAgICAgICAgICAgICAgICAgICB1cmxiYXIuc2VsZWN0aW9uRW5kID09IHVybGJhci5zZWxlY3Rpb25TdGFydCAmJlxuICAgICAgICAgICAgICAgICAgICB1cmxiYXIuc2VsZWN0aW9uRW5kID09IHVybGJhci52YWx1ZS5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBhcnRzID0gQ2xpcXpBdXRvY29tcGxldGUuc3BlbGxDaGVjay5jaGVjayhzZWFyY2hTdHJpbmcpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3U2VhcmNoU3RyaW5nID0gcGFydHNbMF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBjb3JyZWN0QmFjayA9IHBhcnRzWzFdO1xuXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGMgaW4gY29ycmVjdEJhY2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIENsaXF6QXV0b2NvbXBsZXRlLnNwZWxsQ29yci5jb3JyZWN0QmFja1tjXSA9IGNvcnJlY3RCYWNrW2NdO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyB1c2VyIGRvbid0IHdhbnQgc3BlbGwgY29ycmVjdGlvblxuICAgICAgICAgICAgICAgICAgICB2YXIgbmV3U2VhcmNoU3RyaW5nID0gc2VhcmNoU3RyaW5nO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0aGlzLndyb25nU2VhcmNoU3RyaW5nID0gc2VhcmNoU3RyaW5nO1xuICAgICAgICAgICAgICAgIGlmIChuZXdTZWFyY2hTdHJpbmcgIT0gc2VhcmNoU3RyaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBsb2NhbCBzcGVsbCBjaGVja2VyIGtpY2tzIGluXG4gICAgICAgICAgICAgICAgICAgIHZhciBhY3Rpb24gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnYWN0aXZpdHknLFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAnc3BlbGxfY29ycmVjdGlvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50X2xlbmd0aDogc2VhcmNoU3RyaW5nLmxlbmd0aFxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIHV0aWxzLnRlbGVtZXRyeShhY3Rpb24pO1xuICAgICAgICAgICAgICAgICAgICBDbGlxekF1dG9jb21wbGV0ZS5zcGVsbENvcnIub24gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBzZWFyY2hTdHJpbmcgPSBuZXdTZWFyY2hTdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIENsaXF6QXV0b2NvbXBsZXRlLnNwZWxsQ29yclsndXNlckNvbmZpcm1lZCddID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5jbGlxelJlc3VsdHMgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xpcXpSZXN1bHRzRXh0cmEgPSBudWxsO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xpcXpSZXN1bHRzUGFyYW1zID0geyB9O1xuICAgICAgICAgICAgICAgIHRoaXMuY2xpcXpDYWNoZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5oaXN0b3J5UmVzdWx0cyA9IG51bGw7XG4gICAgICAgICAgICAgICAgdGhpcy5pbnN0YW50ID0gW107XG5cbiAgICAgICAgICAgICAgICB0aGlzLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWFyY2hTdHJpbmcgPSBzZWFyY2hTdHJpbmc7XG4gICAgICAgICAgICAgICAgdGhpcy5zZWFyY2hTdHJpbmdTdWdnZXN0ID0gbnVsbDtcblxuICAgICAgICAgICAgICAgIHRoaXMubWl4ZWRSZXN1bHRzID0gbmV3IENsaXF6QXV0b2NvbXBsZXRlLlByb3ZpZGVyQXV0b0NvbXBsZXRlUmVzdWx0Q2xpcXooXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLnNlYXJjaFN0cmluZyxcbiAgICAgICAgICAgICAgICAgICAgICAgIENvbXBvbmVudHMuaW50ZXJmYWNlcy5uc0lBdXRvQ29tcGxldGVSZXN1bHQuUkVTVUxUX1NVQ0NFU1MsXG4gICAgICAgICAgICAgICAgICAgICAgICAtMiwgLy8gYmxvY2tzIGF1dG9jb21wbGV0ZVxuICAgICAgICAgICAgICAgICAgICAgICAgJycpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5zdGFydFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgICAgIHRoaXMubWl4ZWRSZXN1bHRzLnN1Z2dlc3Rpb25zUmVjaWV2ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyBlbnN1cmUgY29udGV4dFxuICAgICAgICAgICAgICAgIHRoaXMuY2xpcXpSZXN1bHRGZXRjaGVyID0gdGhpcy5jbGlxelJlc3VsdEZldGNoZXIuYmluZCh0aGlzKTtcbiAgICAgICAgICAgICAgICB0aGlzLnB1c2hSZXN1bHRzID0gdGhpcy5wdXNoUmVzdWx0cy5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuaGlzdG9yeVRpbWVvdXRDYWxsYmFjayA9IHRoaXMuaGlzdG9yeVRpbWVvdXRDYWxsYmFjay5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgICAgIHRoaXMucHVzaFRpbWVvdXRDYWxsYmFjayA9IHRoaXMucHVzaFRpbWVvdXRDYWxsYmFjay5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuaGlzdG9yeVBhdHRlcm5DYWxsYmFjayA9IHRoaXMuaGlzdG9yeVBhdHRlcm5DYWxsYmFjay5iaW5kKHRoaXMpO1xuICAgICAgICAgICAgICAgIHRoaXMuY3JlYXRlSW5zdGFudFJlc3VsdENhbGxiYWNrID0gdGhpcy5jcmVhdGVJbnN0YW50UmVzdWx0Q2FsbGJhY2suYmluZCh0aGlzKTtcbiAgICAgICAgICAgICAgICBoaXN0b3J5Q2x1c3Rlci5oaXN0b3J5Q2FsbGJhY2sgPSB0aGlzLmhpc3RvcnlQYXR0ZXJuQ2FsbGJhY2s7XG4gICAgICAgICAgICAgICAgaWYoc2VhcmNoU3RyaW5nLnRyaW0oKS5sZW5ndGgpe1xuICAgICAgICAgICAgICAgICAgICAvLyBzdGFydCBmZXRjaGluZyByZXN1bHRzXG4gICAgICAgICAgICAgICAgICAgIHV0aWxzLmdldEJhY2tlbmRSZXN1bHRzKHNlYXJjaFN0cmluZywgdGhpcy5jbGlxelJlc3VsdEZldGNoZXIpO1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiBzcGVsbCBjb3JyZWN0aW9uLCBubyBzdWdnZXN0aW9uc1xuICAgICAgICAgICAgICAgICAgICBpZiAoQ2xpcXpBdXRvY29tcGxldGUuc3BlbGxDb3JyLm9uICYmICFDbGlxekF1dG9jb21wbGV0ZS5zcGVsbENvcnIub3ZlcnJpZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuc3VnZ2VzdGlvbnNSZWNpZXZlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjaGFuZ2UgdGhlIHdyb25nIHN0cmluZyB0byB0aGUgcmVhbCB3cm9uZyBzdHJpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHAgaW4gQ2xpcXpBdXRvY29tcGxldGUuc3BlbGxDb3JyLmNvcnJlY3RCYWNrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRoaXMud3JvbmdTZWFyY2hTdHJpbmcuaW5kZXhPZihDbGlxekF1dG9jb21wbGV0ZS5zcGVsbENvcnIuY29ycmVjdEJhY2tbcF0pID09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMud3JvbmdTZWFyY2hTdHJpbmcgPSB0aGlzLndyb25nU2VhcmNoU3RyaW5nLnJlcGxhY2UocCwgQ2xpcXpBdXRvY29tcGxldGUuc3BlbGxDb3JyLmNvcnJlY3RCYWNrW3BdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLmNsaXF6U3VnZ2VzdGlvbnMgPSBbc2VhcmNoU3RyaW5nLCB0aGlzLndyb25nU2VhcmNoU3RyaW5nXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIENsaXF6QXV0b2NvbXBsZXRlLmxhc3RTdWdnZXN0aW9ucyA9IHRoaXMuY2xpcXpTdWdnZXN0aW9ucztcbiAgICAgICAgICAgICAgICAgICAgICAgIHV0aWxzLmxvZyhDbGlxekF1dG9jb21wbGV0ZS5sYXN0U3VnZ2VzdGlvbnMsICdzcGVsbGNvcnInKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy9UT0RPOiBleHRyYWN0IHNwZWxsIGNvcnJlY3RvciBvdXQgb2YgQ2xpcXpBdXRvY29tcGxldGVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHVybGJhcil1cmxiYXIubUlucHV0RmllbGQudmFsdWUgPSBzZWFyY2hTdHJpbmc7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvL3V0aWxzLmdldFN1Z2dlc3Rpb25zKHNlYXJjaFN0cmluZywgdGhpcy5jbGlxelN1Z2dlc3Rpb25GZXRjaGVyKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB1dGlscy5jbGVhclRpbWVvdXQodGhpcy5yZXN1bHRzVGltZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnJlc3VsdHNUaW1lciA9IHV0aWxzLnNldFRpbWVvdXQodGhpcy5wdXNoVGltZW91dENhbGxiYWNrLCBDbGlxekF1dG9jb21wbGV0ZS5USU1FT1VULCB0aGlzLnNlYXJjaFN0cmluZyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGlxelJlc3VsdHMgPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jbGlxelJlc3VsdHNFeHRyYSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBDbGlxekF1dG9jb21wbGV0ZS5yZXNldFNwZWxsQ29ycigpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHRyaWdnZXIgaGlzdG9yeSBzZWFyY2hcbiAgICAgICAgICAgICAgICB1dGlscy5oaXN0b3J5U2VhcmNoKFxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hTdHJpbmcsXG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25IaXN0b3J5RG9uZS5iaW5kKHRoaXMpLFxuICAgICAgICAgICAgICAgICAgICBDbGlxekF1dG9jb21wbGV0ZS5zZXNzaW9uU3RhcnQpO1xuXG4gICAgICAgICAgICAgICAgdXRpbHMuY2xlYXJUaW1lb3V0KHRoaXMuaGlzdG9yeVRpbWVyKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhpc3RvcnlUaW1lciA9IHV0aWxzLnNldFRpbWVvdXQodGhpcy5oaXN0b3J5VGltZW91dENhbGxiYWNrLCBDbGlxekF1dG9jb21wbGV0ZS5ISVNUT1JZX1RJTUVPVVQsIHRoaXMuc2VhcmNoU3RyaW5nKTtcbiAgICAgICAgICAgICAgICB0aGlzLmhpc3RvcnlUaW1lb3V0ID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICB2YXIgaGlzdF9zZWFyY2hfdHlwZSA9IHV0aWxzLmdldFByZWYoJ2hpc3Rfc2VhcmNoX3R5cGUnLCAwKTtcbiAgICAgICAgICAgICAgICBpZiAoaGlzdF9zZWFyY2hfdHlwZSAhPSAwKSB7XG4gICAgICAgICAgICAgICAgICBDbGlxelV0aWxzLmxvZygnQ2FsbGluZyBDbGlxekhNLmNsaXF6X2htX3NlYXJjaCBmb3I6ICcgKyBzZWFyY2hTdHJpbmcsICdDbGlxekhNJyk7XG4gICAgICAgICAgICAgICAgICB0aGlzLmNsaXF6X2htX3NlYXJjaCh0aGlzLCB7J3F1ZXJ5Jzogc2VhcmNoU3RyaW5nfSwgaGlzdF9zZWFyY2hfdHlwZSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAqIFN0b3BzIGFuIGFzeW5jaHJvbm91cyBzZWFyY2ggdGhhdCBpcyBpbiBwcm9ncmVzc1xuICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIHN0b3BTZWFyY2g6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHV0aWxzLmNsZWFyVGltZW91dCh0aGlzLnJlc3VsdHNUaW1lcik7XG4gICAgICAgICAgICAgICAgdXRpbHMuY2xlYXJUaW1lb3V0KHRoaXMuaGlzdG9yeVRpbWVyKTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHNlbmRSZXN1bHRzU2lnbmFsOiBmdW5jdGlvbihvYmosIGluc3RhbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVzdWx0cyA9IG9iai5taXhlZFJlc3VsdHMuX3Jlc3VsdHM7XG4gICAgICAgICAgICAgICAgdmFyIGFjdGlvbiA9IHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uOiAncmVzdWx0cycsXG4gICAgICAgICAgICAgICAgICAgIHF1ZXJ5X2xlbmd0aDogQ2xpcXpBdXRvY29tcGxldGUubGFzdFNlYXJjaC5sZW5ndGgsXG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdF9vcmRlcjogQ2xpcXpBdXRvY29tcGxldGUucHJlcGFyZVJlc3VsdE9yZGVyKHJlc3VsdHMpLFxuICAgICAgICAgICAgICAgICAgICBpbnN0YW50OiBpbnN0YW50LFxuICAgICAgICAgICAgICAgICAgICBwb3B1cDogQ2xpcXpBdXRvY29tcGxldGUuaXNQb3B1cE9wZW4gPyB0cnVlIDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIGxhdGVuY3lfY2xpcXo6IG9iai5sYXRlbmN5LmNsaXF6LFxuICAgICAgICAgICAgICAgICAgICBsYXRlbmN5X2hpc3Rvcnk6IG9iai5oaXN0b3J5VGltZW91dCA/IG51bGwgOiBvYmoubGF0ZW5jeS5oaXN0b3J5LFxuICAgICAgICAgICAgICAgICAgICBsYXRlbmN5X3BhdHRlcm5zOiBvYmoubGF0ZW5jeS5wYXR0ZXJucyxcbiAgICAgICAgICAgICAgICAgICAgbGF0ZW5jeV9iYWNrZW5kOiBvYmoubGF0ZW5jeS5iYWNrZW5kLFxuICAgICAgICAgICAgICAgICAgICBsYXRlbmN5X21peGVkOiBvYmoubGF0ZW5jeS5taXhlZCxcbiAgICAgICAgICAgICAgICAgICAgbGF0ZW5jeV9hbGw6IG9iai5zdGFydFRpbWU/IERhdGUubm93KCkgLSBvYmouc3RhcnRUaW1lIDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgZGlzY2FyZGVkOiBvYmouZGlzY2FyZGVkUmVzdWx0cyxcbiAgICAgICAgICAgICAgICAgICAgdXNlcl9yZXJhbmtlcnM6IG9iai51c2VyUmVyYW5rZXJzLFxuICAgICAgICAgICAgICAgICAgICBiYWNrZW5kX3BhcmFtczogb2JqLmNsaXF6UmVzdWx0c1BhcmFtcyxcbiAgICAgICAgICAgICAgICAgICAgdjogMVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICAvLyByZXNldCBjb3VudCBvZiBkaXNjYXJkZWQgYmFja2VuZCByZXN1bHRzXG4gICAgICAgICAgICAgICAgb2JqLmRpc2NhcmRlZFJlc3VsdHMgPSAwO1xuXG4gICAgICAgICAgICAgICAgaWYgKENsaXF6QXV0b2NvbXBsZXRlLmxhc3RBdXRvY29tcGxldGVBY3RpdmUpIHtcbiAgICAgICAgICAgICAgICAgIGFjdGlvbi5hdXRvY29tcGxldGVkID0gQ2xpcXpBdXRvY29tcGxldGUubGFzdEF1dG9jb21wbGV0ZUFjdGl2ZTtcbiAgICAgICAgICAgICAgICAgIGFjdGlvbi5hdXRvY29tcGxldGVkX2xlbmd0aCA9IENsaXF6QXV0b2NvbXBsZXRlLmxhc3RBdXRvY29tcGxldGVMZW5ndGg7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKGFjdGlvbi5yZXN1bHRfb3JkZXIuaW5kZXhPZignQycpID4gLTEgJiYgdXRpbHMuZ2V0UHJlZignbG9nQ2x1c3RlcicsIGZhbHNlKSkge1xuICAgICAgICAgICAgICAgICAgICBhY3Rpb24uQ3R5cGUgPSB1dGlscy5nZXRDbHVzdGVyaW5nRG9tYWluKHJlc3VsdHNbMF0udmFsKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoQ2xpcXpBdXRvY29tcGxldGUuaXNQb3B1cE9wZW4pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZG9uJ3QgbWFyayBhcyBkb25lIGlmIHBvcHVwIGNsb3NlZCBhcyB0aGUgdXNlciBkb2VzIG5vdCBzZWUgYW55dGhpbmdcbiAgICAgICAgICAgICAgICAgICAgQ2xpcXpBdXRvY29tcGxldGUubWFya1Jlc3VsdHNEb25lKERhdGUubm93KCkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHJlbWVtYmVycyBpZiB0aGUgcG9wdXAgd2FzIG9wZW4gZm9yIGxhc3QgcmVzdWx0XG4gICAgICAgICAgICAgICAgQ2xpcXpBdXRvY29tcGxldGUubGFzdFBvcHVwT3BlbiA9IENsaXF6QXV0b2NvbXBsZXRlLmlzUG9wdXBPcGVuO1xuICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgQ2xpcXpBdXRvY29tcGxldGUubGFzdERpc3BsYXlUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdXRpbHMudGVsZW1ldHJ5KGFjdGlvbik7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBXcmFwIHVwIGFmdGVyIGEgY29tcGxldGVkIHNlYXJjaFxuICAgICAgICAgICAgZnVsbFdyYXB1cDogZnVuY3Rpb24ob2JqKSB7XG4gICAgICAgICAgICAgICAgb2JqLnNlbmRSZXN1bHRzU2lnbmFsKG9iaiwgZmFsc2UpO1xuXG4gICAgICAgICAgICAgICAgb2JqLnN0YXJ0VGltZSA9IG51bGw7XG4gICAgICAgICAgICAgICAgdXRpbHMuY2xlYXJUaW1lb3V0KG9iai5yZXN1bHRzVGltZXIpO1xuICAgICAgICAgICAgICAgIHV0aWxzLmNsZWFyVGltZW91dChvYmouaGlzdG9yeVRpbWVyKTtcbiAgICAgICAgICAgICAgICBvYmoucmVzdWx0c1RpbWVyID0gbnVsbDtcbiAgICAgICAgICAgICAgICBvYmouaGlzdG9yeVRpbWVyID0gbnVsbDtcbiAgICAgICAgICAgICAgICBvYmouY2xpcXpSZXN1bHRzID0gbnVsbDtcbiAgICAgICAgICAgICAgICBvYmouY2xpcXpSZXN1bHRzRXh0cmEgPSBudWxsO1xuICAgICAgICAgICAgICAgIG9iai5jbGlxekNhY2hlID0gbnVsbDtcbiAgICAgICAgICAgICAgICBvYmouaGlzdG9yeVJlc3VsdHMgPSBudWxsO1xuICAgICAgICAgICAgICAgIG9iai5pbnN0YW50ID0gW107XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBXcmFwIHVwIGFmdGVyIGluc3RhbnQgcmVzdWx0cyBhcmUgc2hvd25cbiAgICAgICAgICAgIGluc3RhbnRXcmFwdXA6IGZ1bmN0aW9uKG9iaikge1xuICAgICAgICAgICAgICAgIG9iai5zZW5kUmVzdWx0c1NpZ25hbChvYmosIHRydWUpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICB9LFxufTtcblxuQ2xpcXpBdXRvY29tcGxldGUuaW5pdFByb3ZpZGVyKCk7XG5DbGlxekF1dG9jb21wbGV0ZS5pbml0UmVzdWx0cygpO1xuXG5leHBvcnQgZGVmYXVsdCBDbGlxekF1dG9jb21wbGV0ZTtcbiJdfQ==