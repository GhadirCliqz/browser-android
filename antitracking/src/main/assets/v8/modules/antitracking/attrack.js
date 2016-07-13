System.register('antitracking/attrack', ['antitracking/pacemaker', 'antitracking/persistent-state', 'antitracking/temp-set', 'antitracking/webrequest-context', 'antitracking/tp_events', 'antitracking/md5', 'antitracking/url', 'antitracking/domain', 'antitracking/hash', 'antitracking/tracker-txt', 'antitracking/bloom-filter', 'antitracking/time', 'antitracking/local-tracking-table', 'antitracking/qs-whitelists', 'antitracking/block-log', 'core/cliqz', 'core/resource-loader', 'core/background', 'antitracking/cookie-checker', 'antitracking/tracker-proxy', 'antitracking/utils', 'antitracking/privacy-score', 'platform/browser', 'core/webrequest', 'antitracking/telemetry'], function (_export) {
    /*
     * This module prevents user from 3rd party tracking
     */
    'use strict';

    var pacemaker, persist, TempSet, HttpRequestContext, tp_events, md5, parseURL, dURIC, getHeaderMD5, URLInfo, shuffle, findOauth, getGeneralDomain, sameGeneralDomain, HashProb, TrackerTXT, sleep, getDefaultTrackerTxtRule, AttrackBloomFilter, datetime, TrackingTable, QSWhitelist, BlockLog, utils, events, ResourceLoader, core, CookieChecker, TrackerProxy, compressionAvailable, splitTelemetryData, compressJSONToBase64, generatePayload, PrivacyScore, browser, WebRequest, telemetry, countReload, CliqzAttrack;

    function onUrlbarFocus() {
        countReload = true;
    }

    /**
     * Add padding characters to the left of the given string.
     *
     * @param {string} str  - original string.
     * @param {string} char - char used for padding the string.
     * @param {number} size - desired size of the resulting string (after padding)
    **/
    function leftpad(str, char, size) {
        // This function only makes sens if `char` is a character.
        if (char.length != 1) {
            throw new Error("`char` argument must only contain one character");
        }

        if (str.length >= size) {
            return str;
        } else {
            return char.repeat(size - str.length) + str;
        }
    }

    /**
     * Remove any trace of source domains, or hashes of source domains
     * from the data to be sent to the backend. This is made to ensure
     * there is no way to backtrack to user's history using data sent to
     * the backend.
     *
     * Replace all the keys of `trackerData` (which are 16-chars prefixes of
     * hash of the source domain) by unique random strings of size 16 (which is
     * expected by backend). We don't have to make them unique among all data,
     * it is enough to ensure unicity on a per-tracker basis.
     *
     * @param {Object} trackerData - associate source domains to key/value pairs.
    **/
    function anonymizeTrackerTokens(trackerData) {
        // Random base id
        var min = 1;
        var max = Number.MAX_SAFE_INTEGER;
        var randId = Math.floor(Math.random() * (max - min + 1)) + min;

        // Anonymize the given tracker data
        var anonymizedTrackerData = {};

        for (var originalKey in trackerData) {
            var newRandomKey = leftpad(randId.toString().substr(0, 16), '0', 16);
            randId = (randId + 1) % max;
            anonymizedTrackerData[newRandomKey] = trackerData[originalKey];
        }

        return anonymizedTrackerData;
    }

    return {
        setters: [function (_antitrackingPacemaker) {
            pacemaker = _antitrackingPacemaker['default'];
        }, function (_antitrackingPersistentState) {
            persist = _antitrackingPersistentState;
        }, function (_antitrackingTempSet) {
            TempSet = _antitrackingTempSet['default'];
        }, function (_antitrackingWebrequestContext) {
            HttpRequestContext = _antitrackingWebrequestContext['default'];
        }, function (_antitrackingTp_events) {
            tp_events = _antitrackingTp_events['default'];
        }, function (_antitrackingMd5) {
            md5 = _antitrackingMd5['default'];
        }, function (_antitrackingUrl) {
            parseURL = _antitrackingUrl.parseURL;
            dURIC = _antitrackingUrl.dURIC;
            getHeaderMD5 = _antitrackingUrl.getHeaderMD5;
            URLInfo = _antitrackingUrl.URLInfo;
            shuffle = _antitrackingUrl.shuffle;
            findOauth = _antitrackingUrl.findOauth;
        }, function (_antitrackingDomain) {
            getGeneralDomain = _antitrackingDomain.getGeneralDomain;
            sameGeneralDomain = _antitrackingDomain.sameGeneralDomain;
        }, function (_antitrackingHash) {
            HashProb = _antitrackingHash.HashProb;
        }, function (_antitrackingTrackerTxt) {
            TrackerTXT = _antitrackingTrackerTxt.TrackerTXT;
            sleep = _antitrackingTrackerTxt.sleep;
            getDefaultTrackerTxtRule = _antitrackingTrackerTxt.getDefaultTrackerTxtRule;
        }, function (_antitrackingBloomFilter) {
            AttrackBloomFilter = _antitrackingBloomFilter.AttrackBloomFilter;
        }, function (_antitrackingTime) {
            datetime = _antitrackingTime;
        }, function (_antitrackingLocalTrackingTable) {
            TrackingTable = _antitrackingLocalTrackingTable['default'];
        }, function (_antitrackingQsWhitelists) {
            QSWhitelist = _antitrackingQsWhitelists['default'];
        }, function (_antitrackingBlockLog) {
            BlockLog = _antitrackingBlockLog['default'];
        }, function (_coreCliqz) {
            utils = _coreCliqz.utils;
            events = _coreCliqz.events;
        }, function (_coreResourceLoader) {
            ResourceLoader = _coreResourceLoader['default'];
        }, function (_coreBackground) {
            core = _coreBackground['default'];
        }, function (_antitrackingCookieChecker) {
            CookieChecker = _antitrackingCookieChecker['default'];
        }, function (_antitrackingTrackerProxy) {
            TrackerProxy = _antitrackingTrackerProxy['default'];
        }, function (_antitrackingUtils) {
            compressionAvailable = _antitrackingUtils.compressionAvailable;
            splitTelemetryData = _antitrackingUtils.splitTelemetryData;
            compressJSONToBase64 = _antitrackingUtils.compressJSONToBase64;
            generatePayload = _antitrackingUtils.generatePayload;
        }, function (_antitrackingPrivacyScore) {
            PrivacyScore = _antitrackingPrivacyScore.PrivacyScore;
        }, function (_platformBrowser) {
            browser = _platformBrowser;
        }, function (_coreWebrequest) {
            WebRequest = _coreWebrequest['default'];
        }, function (_antitrackingTelemetry) {
            telemetry = _antitrackingTelemetry['default'];
        }],
        execute: function () {
            countReload = false;
            CliqzAttrack = {
                VERSION: '0.96',
                MIN_BROWSER_VERSION: 35,
                LOG_KEY: 'attrack',
                VERSIONCHECK_URL: 'https://cdn.cliqz.com/anti-tracking/whitelist/versioncheck.json',
                URL_ALERT_RULES: 'chrome://cliqz/content/anti-tracking-rules.json',
                URL_BLOCK_RULES: 'https://cdn.cliqz.com/anti-tracking/whitelist/anti-tracking-block-rules.json',
                ENABLE_PREF: 'antiTrackTest',
                debug: false,
                msgType: 'attrack',
                timeCleaningCache: 180 * 1000,
                timeAfterLink: 5 * 1000,
                timeActive: 20 * 1000,
                timeBootup: 10 * 1000,
                bootupTime: Date.now(),
                bootingUp: true,
                whitelist: null,
                obsCounter: {},
                similarAddon: false,
                blockingFailed: {},
                trackReload: {},
                reloadWhiteList: {},
                tokenDomainCountThreshold: 2,
                safeKeyExpire: 7,
                localBlockExpire: 24,
                shortTokenLength: 8,
                safekeyValuesThreshold: 4,
                cChecker: new CookieChecker(),
                qsBlockRule: null, // list of domains should be blocked instead of shuffling
                blocked: null, // log what's been blocked
                placeHolder: '',
                tp_events: tp_events,
                tokens: null,
                instantTokenCache: {},
                requestKeyValue: null,
                recentlyModified: new TempSet(),
                cliqzHeader: 'CLIQZ-AntiTracking',
                replacement: "",
                obfuscate: function obfuscate(s, method, replacement) {
                    // used when action != 'block'
                    // default is a placeholder
                    switch (method) {
                        case 'empty':
                            return '';
                        case 'replace':
                            return shuffle(s);
                        case 'same':
                            return s;
                        case 'placeholder':
                            return CliqzAttrack.placeHolder;
                        default:
                            return CliqzAttrack.placeHolder;
                    }
                },
                bootupWhitelistCache: {},
                blockedCache: {},
                visitCache: {},
                contextOauth: {},
                linksFromDom: {},
                cookiesFromDom: {},
                loadedTabs: {},
                getBrowserMajorVersion: function getBrowserMajorVersion() {
                    try {
                        var appInfo = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo);
                        return parseInt(appInfo.version.split('.')[0]);
                    } catch (e) {
                        // fallback for when no version API
                        return 100;
                    }
                },
                getPrivateValues: function getPrivateValues(window) {
                    // creates a list of return values of functions may leak private info
                    var p = {};
                    // var navigator = CliqzUtils.getWindow().navigator;
                    var navigator = window.navigator;
                    // plugins
                    for (var i = 0; i < navigator.plugins.length; i++) {
                        var name = navigator.plugins[i].name;
                        if (name.length >= 8) {
                            p[name] = true;
                        }
                    }
                    CliqzAttrack.privateValues = p;
                },
                getCookieValues: function getCookieValues(c, url) {
                    if (c == null) {
                        return {};
                    }
                    var v = 0,
                        cookies = {};
                    if (c.match(/^\s*\$Version=(?:"1"|1);\s*(.*)/)) {
                        c = RegExp.$1;
                        v = 1;
                    }
                    if (v === 0) {
                        c.split(/[,;]/).map(function (cookie) {
                            var parts = cookie.split(/=/);
                            if (parts.length > 1) parts[1] = parts.slice(1).join('=');
                            var name = dURIC(parts[0].trimLeft()),
                                value = parts.length > 1 ? dURIC(parts[1].trimRight()) : null;
                            cookies[name] = value;
                        });
                    } else {
                        c.match(/(?:^|\s+)([!#$%&'*+\-.0-9A-Z^`a-z|~]+)=([!#$%&'*+\-.0-9A-Z^`a-z|~]*|"(?:[\x20-\x7E\x80\xFF]|\\[\x00-\x7F])*")(?=\s*[,;]|$)/g).map(function ($0, $1) {
                            var name = $0,
                                value = $1.charAt(0) === '"' ? $1.substr(1, -1).replace(/\\(.)/g, "$1") : $1;
                            cookies[name] = value;
                        });
                    }
                    // return cookies;
                    var cookieVal = {};
                    for (var key in cookies) {
                        if (url.indexOf(cookies[key]) == -1) {
                            // cookies save as part of the url is allowed
                            cookieVal[cookies[key]] = true;
                        }
                    }
                    return cookieVal;
                },
                httpopenObserver: {
                    observe: function observe(requestDetails) {
                        if (!CliqzAttrack.qs_whitelist.isReady()) {
                            return;
                        }

                        var requestContext = new HttpRequestContext(requestDetails);
                        var url = requestContext.url;
                        if (!url || url == '') return;
                        var url_parts = URLInfo.get(url);

                        if (requestContext.isFullPage()) {
                            CliqzAttrack.tp_events.onFullPage(url_parts, requestContext.getOuterWindowID());
                            if (CliqzAttrack.isTrackerTxtEnabled()) {
                                TrackerTXT.get(url_parts).update();
                            }
                            CliqzAttrack.blockLog.incrementLoadedPages();
                            return;
                        }

                        // find the ok tokens fields
                        var isPrivate = requestContext.isChannelPrivate();
                        if (!isPrivate) {
                            CliqzAttrack.examineTokens(url_parts);
                        }

                        // This needs to be a common function aswell. Also consider getting ORIGIN header.
                        var referrer = requestContext.getReferrer();
                        var same_gd = false;

                        // We need to get the source from where the request originated.
                        // There are two ways in which we can get it.
                        // 1. header -> REFERRER
                        // 2. Get source url.
                        // 3. header -> ORIGIN (This needs to be investigated.)

                        var source_url = requestContext.getLoadingDocument(),
                            source_url_parts = null,
                            source_tab = requestContext.getOriginWindowID();

                        var page_load_type = null;
                        var request_type = null;
                        switch (requestContext.getContentPolicyType()) {
                            case 6:
                                page_load_type = "fullpage";
                                request_type = "fullpage";
                                break;
                            case 7:
                                page_load_type = "frame";break;
                            default:
                                page_load_type = null;
                        }
                        if (source_url == '' || source_url.indexOf('about:') == 0) return;
                        if (page_load_type == 'fullpage') return;

                        // modify or cancel the http request if the url contains personal identifier
                        // Now refstr should not be null, but still keeping the clause to check from edge cases.

                        if (source_url != null) {
                            source_url_parts = URLInfo.get(source_url);

                            // same general domain
                            same_gd = sameGeneralDomain(url_parts.hostname, source_url_parts.hostname) || false;
                            if (same_gd) {
                                return;
                            }

                            // extract and save tokens
                            CliqzAttrack.extractKeyTokens(url_parts, source_url_parts['hostname'], isPrivate, CliqzAttrack.saveKeyTokens);
                            CliqzAttrack.recordLinksForURL(source_url);

                            var reflinks = CliqzAttrack.linksFromDom[source_url] || {};

                            // work around for https://github.com/cliqz/navigation-extension/issues/1230
                            if (CliqzAttrack.recentlyModified.contains(source_tab + url)) {
                                CliqzAttrack.recentlyModified['delete'](source_tab + url);
                                return { cancel: true };
                            }
                            if (url in reflinks) {
                                CliqzAttrack.tp_events.incrementStat(req_log, "url_in_reflinks");
                                // return;
                            }

                            // log third party request
                            var req_log = null;
                            if (url_parts.hostname != source_url_parts.hostname) {
                                req_log = CliqzAttrack.tp_events.get(url, url_parts, source_url, source_url_parts, source_tab);
                                tp_events.incrementStat(req_log, 'c');
                                if (url_parts['query'].length > 0) {
                                    tp_events.incrementStat(req_log, 'has_qs');
                                }
                                if (url_parts['parameters'].length > 0) {
                                    tp_events.incrementStat(req_log, 'has_ps');
                                }
                                if (url_parts['fragment'].length > 0) {
                                    tp_events.incrementStat(req_log, 'has_fragment');
                                }
                                var content_type = requestContext.getContentPolicyType();
                                if (!content_type) {
                                    CliqzAttrack.tp_events.incrementStat(req_log, "type_unknown");
                                } else {
                                    CliqzAttrack.tp_events.incrementStat(req_log, "type_" + content_type);
                                }
                            }

                            // get cookie data
                            var cookievalue = {},
                                docCookie = '';
                            if (source_url in CliqzAttrack.cookiesFromDom && CliqzAttrack.cookiesFromDom[source_url]) {
                                docCookie = CliqzAttrack.cookiesFromDom[source_url];
                                cookievalue = CliqzAttrack.getCookieValues(docCookie, url);
                            } else {
                                // try to get the document from source
                                try {
                                    if (source.lc) {
                                        docCookie = source.lc.topWindow.document.cookie;
                                        if (docCookie) {
                                            cookievalue = CliqzAttrack.getCookieValues(docCookie, url);
                                        }
                                    }
                                } catch (e) {}
                            }
                            try {
                                var cookiedata = requestContext.getRequestHeader('Cookie');
                                var cookie2 = CliqzAttrack.getCookieValues(cookiedata, url);
                            } catch (e) {
                                var cookie2 = {};
                            }

                            for (var c in cookie2) {
                                cookievalue[c] = true;
                            }

                            var stats = {};
                            var badTokens = CliqzAttrack.checkTokens(url_parts, source_url, cookievalue, stats, source_url_parts);
                            if (req_log) {
                                // save token stats to the log.
                                Object.keys(stats).forEach(function (key) {
                                    if (stats[key] > 0) {
                                        tp_events.incrementStat(req_log, 'token.has_' + key);
                                        tp_events.incrementStat(req_log, 'token.' + key, stats[key]);
                                    }
                                });
                            }

                            if (badTokens.length == 0) {
                                if (CliqzAttrack.trackerProxy.checkShouldProxy(url)) {
                                    tp_events.incrementStat(req_log, 'proxy');
                                }
                                return;
                            }

                            // Block request based on rules specified
                            var _key = source_tab + ":" + source_url;
                            if (CliqzAttrack.isQSEnabled() && !CliqzAttrack.reloadWhiteList[_key]) {
                                for (var i = 0; i < CliqzAttrack.qsBlockRule.length; i++) {
                                    var sRule = CliqzAttrack.qsBlockRule[i][0],
                                        uRule = CliqzAttrack.qsBlockRule[i][1];
                                    if (source_url_parts.hostname.endsWith(sRule) && url_parts.hostname.endsWith(uRule)) {
                                        tp_events.incrementStat(req_log, 'req_rule_aborted');
                                        return { cancel: true };
                                    }
                                }
                            }

                            if (badTokens.length > 0) {
                                tp_events.incrementStat(req_log, 'bad_qs');
                                tp_events.incrementStat(req_log, 'bad_tokens', badTokens.length);
                            }

                            // altering request
                            // Additional check to verify if the user reloaded the page.
                            if (CliqzAttrack.isQSEnabled() && !CliqzAttrack.reloadWhiteList[_key]) {

                                if (CliqzAttrack.isSourceWhitelisted(source_url_parts.hostname)) {
                                    CliqzAttrack.tp_events.incrementStat(req_log, "source_whitelisted");
                                    return;
                                }

                                if (CliqzAttrack.debug) {
                                    CliqzUtils.log("altering request " + url + " " + source_url + ' ' + same_gd, 'tokk');
                                    CliqzUtils.log('bad tokens: ' + JSON.stringify(badTokens), 'tokk');
                                }

                                if (badTokens.length > 0 && CliqzAttrack.qs_whitelist.isUpToDate()) {
                                    // determin action based on tracker.txt
                                    var rule = CliqzAttrack.getDefaultRule(),
                                        _trackerTxt = TrackerTXT.get(source_url_parts);
                                    if (!CliqzAttrack.isForceBlockEnabled() && CliqzAttrack.isTrackerTxtEnabled()) {
                                        if (_trackerTxt.last_update === null) {
                                            // The first update is not ready yet for this first party, allow it
                                            tp_events.incrementStat(req_log, 'tracker.txt_not_ready' + rule);
                                            return;
                                        }
                                        rule = _trackerTxt.getRule(url_parts.hostname);
                                    }
                                    if (rule == 'block') {
                                        tp_events.incrementStat(req_log, 'token_blocked_' + rule);
                                        return { cancel: true };
                                    } else {
                                        var tmp_url = requestContext.url;
                                        for (var i = 0; i < badTokens.length; i++) {
                                            if (tmp_url.indexOf(badTokens[i]) < 0) {
                                                badTokens[i] = encodeURIComponent(badTokens[i]);
                                            }
                                            tmp_url = tmp_url.replace(badTokens[i], CliqzAttrack.obfuscate(badTokens[i], rule, CliqzAttrack.replacement));
                                        }

                                        // In case unsafe tokens were in the hostname, the URI is not valid
                                        // anymore and we can cancel the request.
                                        if (!tmp_url.startsWith(url_parts.protocol + '://' + url_parts.hostname)) {
                                            return { cancel: true };
                                        }

                                        tp_events.incrementStat(req_log, 'token_blocked_' + rule);

                                        if (CliqzAttrack.trackerProxy.checkShouldProxy(tmp_url)) {
                                            tp_events.incrementStat(req_log, 'proxy');
                                        }
                                        CliqzAttrack.recentlyModified.add(source_tab + url, 30000);
                                        return {
                                            redirectUrl: tmp_url,
                                            requestHeaders: rule != 'same' ? [{ name: CliqzAttrack.cliqzHeader, value: ' ' }] : undefined
                                        };
                                    }
                                }
                            }
                        } else {
                            // no refstr: might be able to get a referrer from load context to verify if favicon or extension request
                            // Now this should not happen. Keeping the code block for now. Will remove it after more testing.
                            if (CliqzAttrack.debug) CliqzUtils.log("THIS CALL DID NOT HAVE A REF", "no_refstr");
                        }
                    }
                },
                httpResponseObserver: {
                    observe: function observe(requestDetails) {
                        if (!CliqzAttrack.qs_whitelist.isReady()) {
                            return;
                        }
                        var requestContext = new HttpRequestContext(requestDetails),
                            url = requestContext.url;

                        if (!url) return;
                        var url_parts = URLInfo.get(url);
                        var referrer = requestContext.getReferrer();
                        var same_gd = false;

                        var source_url = requestContext.getLoadingDocument(),
                            source_url_parts = null,
                            source_tab = requestContext.getOriginWindowID();

                        // full page
                        if (requestContext.isFullPage()) {
                            if ([300, 301, 302, 303, 307].indexOf(requestContext.channel.responseStatus) >= 0) {
                                // redirect, update location for tab
                                // if no redirect location set, stage the tab id so we don't get false data
                                var redirect_url = requestContext.getResponseHeader("Location");
                                var redirect_url_parts = URLInfo.get(redirect_url);
                                // if redirect is relative, use source domain
                                if (!redirect_url_parts.hostname) {
                                    redirect_url_parts.hostname = url_parts.hostname;
                                    redirect_url_parts.path = redirect_url;
                                }
                                CliqzAttrack.tp_events.onRedirect(redirect_url_parts, requestContext.getOuterWindowID());
                            }
                            return;
                        }

                        if (source_url == '' || source_url.indexOf('about:') == 0) return;

                        if (source_url != null) {
                            source_url_parts = URLInfo.get(source_url);
                            // extract and save tokens
                            same_gd = sameGeneralDomain(url_parts.hostname, source_url_parts.hostname) || false;
                            if (same_gd) return;

                            if (url_parts.hostname != source_url_parts.hostname) var req_log = CliqzAttrack.tp_events.get(url, url_parts, source_url, source_url_parts, source_tab);
                            if (req_log) {
                                tp_events.incrementStat(req_log, 'resp_ob');
                                tp_events.incrementStat(req_log, 'content_length', parseInt(requestContext.getResponseHeader('Content-Length')) || 0);
                                tp_events.incrementStat(req_log, 'status_' + requestContext.channel.responseStatus);
                            }

                            // is cached?
                            var cached = requestContext.isCached;
                            CliqzAttrack.tp_events.incrementStat(req_log, cached ? 'cached' : 'not_cached');
                        }
                    }
                },
                httpmodObserver: {
                    observe: function observe(requestDetails) {
                        var requestContext = new HttpRequestContext(requestDetails),
                            url = requestContext.url,
                            blockingResponse = {};

                        if (!url) return;

                        var url_parts = URLInfo.get(url);

                        var cookie_data = requestContext.getCookieData();

                        // Quick escapes:
                        // localhost or no cookie data
                        if (url_parts['hostname'] == 'localhost' || !cookie_data) {
                            return;
                        }

                        // Gather more info for further checks
                        var curr_time = Date.now();
                        if (curr_time - CliqzAttrack.bootupTime > CliqzAttrack.timeBootup) CliqzAttrack.bootingUp = false;

                        // check if fill context oauth, this needs to be done before accepting or requesting the cookies.
                        var ourl = findOauth(url, url_parts);
                        if (ourl) {
                            CliqzAttrack.contextOauth = { 'ts': curr_time, 'html': dURIC(ourl) + ':' + url };
                            if (CliqzAttrack.debug) CliqzUtils.log("OAUTH: " + JSON.stringify(CliqzAttrack.contextOauth), CliqzAttrack.LOG_KEY);
                        }

                        // content policy type 6 == TYPE_DOCUMENT: top level dom element. Do not block.
                        if (requestContext.isFullPage()) {
                            return;
                        }

                        var referrer = requestContext.getReferrer();

                        // if the request is originating from a tab, we can get a source url
                        // The implementation below is causing a bug, if we load different urls in same tab.
                        // This is better handeled in capturing request type. When request type == fullpage
                        // Then uri.spec == source_url
                        // Only get source tabs for now.

                        var source_url = requestContext.getLoadingDocument(),
                            source_url_parts = null,
                            source_tab = requestContext.getOriginWindowID();

                        var page_load_type = null;
                        var request_type = null;
                        switch (requestContext.getContentPolicyType()) {
                            case 6:
                                page_load_type = "fullpage";
                                request_type = "fullpage";
                                break;
                            case 7:
                                page_load_type = "frame";break;
                            default:
                                page_load_type = null;
                        }

                        // Fallback to referrer if we don't find source from tab
                        if (source_url === undefined || source_url == '') {
                            source_url = referrer;
                        }

                        if (!source_url) {
                            return;
                        }

                        source_url_parts = URLInfo.get(source_url);
                        var req_log = null;

                        var same_gd = false;
                        if (url_parts.hostname != '' && source_url_parts && source_url_parts.hostname != '') {
                            same_gd = sameGeneralDomain(url_parts.hostname, source_url_parts.hostname);
                        }

                        if (same_gd) {
                            // not a 3rd party cookie, do nothing
                            return;
                        }

                        req_log = CliqzAttrack.tp_events.get(url, url_parts, source_url, source_url_parts, source_tab);

                        if (req_log && req_log.c === 0) {
                            blockingResponse = CliqzAttrack.httpopenObserver.observe(requestDetails) || {};
                            req_log = CliqzAttrack.tp_events.get(url, url_parts, source_url, source_url_parts, source_tab);
                        }

                        tp_events.incrementStat(req_log, 'cookie_set');
                        if (source_url.indexOf('about:') == 0) {
                            // it's a brand new tab, and the url is loaded externally,
                            // about:home, about:blank
                            tp_events.incrementStat(req_log, 'cookie_allow_newtab');
                            CliqzAttrack.allowCookie(url, { 'dst': url_parts.hostname, 'src': source_url, 'data': cookie_data, 'ts': curr_time }, "about:blank");
                            return blockingResponse;
                        }

                        // check if domain is whitelisted,
                        if (CliqzAttrack.isInWhitelist(url_parts.hostname)) {
                            tp_events.incrementStat(req_log, 'cookie_allow_whitelisted');
                            if (CliqzAttrack.debug) CliqzUtils.log("Is whitelisted (type: direct): " + url, CliqzAttrack.LOG_KEY);
                            return blockingResponse;
                        }

                        var host = getGeneralDomain(url_parts.hostname);
                        var diff = curr_time - (CliqzAttrack.visitCache[host] || 0);

                        // This is order to only allow visited sources from browser. Else some redirect calls
                        // Getting leaked.
                        var s_host = '';
                        if (source_url && source_url_parts.hostname) {
                            s_host = getGeneralDomain(source_url_parts.hostname);
                        }

                        // check visitcache to see if this domain is temporarily allowed.
                        // Additional check required when gd=false and request_type== full_page, else block
                        if (diff < CliqzAttrack.timeActive && CliqzAttrack.visitCache[s_host]) {
                            var src = null;
                            if (source_url_parts && source_url_parts.hostname) src = source_url_parts.hostname;
                            tp_events.incrementStat(req_log, 'cookie_allow_visitcache');
                            CliqzAttrack.allowCookie(url, { 'dst': url_parts.hostname, 'src': src, 'data': cookie_data, 'ts': curr_time }, "visitcache");
                            return blockingResponse;
                        }

                        // check if user initiated this request by an element click.
                        if (CliqzAttrack.cChecker.contextFromEvent) {
                            var diff = curr_time - (CliqzAttrack.cChecker.contextFromEvent.ts || 0);
                            if (diff < CliqzAttrack.timeAfterLink) {

                                var host = getGeneralDomain(url_parts.hostname);
                                if (host === CliqzAttrack.cChecker.contextFromEvent.gDM) {
                                    CliqzAttrack.visitCache[host] = curr_time;
                                    var src = null;
                                    if (source_url_parts && source_url_parts.hostname) src = source_url_parts.hostname;
                                    tp_events.incrementStat(req_log, 'cookie_allow_userinit_same_context_gd');
                                    CliqzAttrack.allowCookie(url, { 'dst': url_parts.hostname, 'src': src, 'data': cookie_data, 'ts': curr_time }, "contextFromEvent");
                                    return blockingResponse;
                                }
                                var pu = url.split(/[?&;]/)[0];
                                if (CliqzAttrack.cChecker.contextFromEvent.html.indexOf(pu) != -1) {
                                    if (CliqzAttrack.debug) CliqzUtils.log(">>> Cookie ALLOWED (type2): " + pu + " " + CliqzAttrack.cChecker.contextFromEvent.html, CliqzAttrack.LOG_KEY);

                                    // the url is in pu
                                    if (url_parts && url_parts.hostname && url_parts.hostname != '') {

                                        CliqzAttrack.visitCache[host] = curr_time;

                                        tp_events.incrementStat(req_log, 'cookie_allow_userinit_same_gd_link');
                                        CliqzAttrack.allowCookie(url, { 'dst': url_parts.hostname, 'src': src, 'data': cookie_data, 'ts': curr_time }, "contextFromEvent");
                                        return blockingResponse;
                                    }
                                }
                            }
                        }

                        // check for OAuth requests
                        if (CliqzAttrack.contextOauth) {
                            var diff = curr_time - (CliqzAttrack.contextOauth.ts || 0);
                            if (diff < CliqzAttrack.timeActive) {

                                var pu = url.split(/[?&;]/)[0];

                                if (CliqzAttrack.contextOauth.html.indexOf(pu) != -1) {
                                    // the url is in pu
                                    if (url_parts && url_parts.hostname && url_parts.hostname != '') {
                                        var contextFromEvent = browser.contextFromEvent();
                                        if (contextFromEvent && contextFromEvent.html && contextFromEvent.html.indexOf(pu) != -1) {

                                            if (CliqzAttrack.debug) CliqzUtils.log("OAUTH and click " + url, CliqzAttrack.LOG_KEY);
                                            var host = getGeneralDomain(url_parts.hostname);
                                            var src = null;
                                            if (source_url_parts && source_url_parts.hostname) src = source_url_parts.hostname;
                                            tp_events.incrementStat(req_log, 'cookie_allow_oauth');
                                            tp_events.incrementStat(req_log, 'req_oauth');
                                            CliqzAttrack.allowCookie(url, { 'dst': url_parts.hostname, 'src': src, 'data': cookie_data, 'ts': curr_time }, "contextOauth");
                                            return blockingResponse;
                                        } else {
                                            if (CliqzAttrack.debug) CliqzUtils.log("OAUTH and NOT click " + url, CliqzAttrack.LOG_KEY);
                                        }
                                    }
                                }
                            }
                        }

                        if (url_parts.hostname != '' && source_url_parts && source_url_parts.hostname != '') {

                            // the hostnames are different, but they might still be the same site: e.g.
                            // loc5.lacaixa.es => metrics.lacaixa.es

                            if (CliqzAttrack.debug) {
                                CliqzUtils.log("cookie detected >>> " + source_url_parts.hostname + " : " + url_parts.hostname, CliqzAttrack.LOG_KEY);
                            }

                            if (!same_gd && cookie_data && cookie_data.length > 10) {

                                // as test, we do not send the hostname as md5
                                var md5_source_hostname = source_url_parts.hostname;

                                // now, let's kill that cookie and see what happens :-)
                                var _key = source_tab + ":" + source_url;
                                if (CliqzAttrack.isCookieEnabled(source_url_parts.hostname) && !CliqzAttrack.reloadWhiteList[_key]) {
                                    // blocking cookie
                                    var src = null;
                                    if (source_url_parts && source_url_parts.hostname) src = source_url_parts.hostname;
                                    tp_events.incrementStat(req_log, 'cookie_blocked');
                                    tp_events.incrementStat(req_log, 'cookie_block_tp1');
                                    CliqzAttrack.blockCookie(source_url_parts.hostname, { 'src': src, 'dst': url_parts.hostname, 'data': cookie_data, 'ts': curr_time }, 'type1');
                                    blockingResponse.requestHeaders = [{ name: 'Cookie', value: '' }, { name: CliqzAttrack.cliqzHeader, value: ' ' }];
                                    return blockingResponse;
                                } else {
                                    // was not enabled, therefore the cookie gets sent
                                    tp_events.incrementStat(req_log, 'bad_cookie_sent');
                                }
                            }
                        } else {
                            if (CliqzAttrack.bootingUp) {

                                if (curr_time - CliqzAttrack.bootupTime > CliqzAttrack.timeBootup) CliqzAttrack.bootingUp = false;

                                if (CliqzAttrack.debug) CliqzUtils.log(">>> Booting up: " + url + " : " + url_parts.hostname, CliqzAttrack.LOG_KEY);
                                var key = url_parts.hostname + url_parts.path;
                                if (key && key != '') CliqzAttrack.bootupWhitelistCache[key] = true;
                                tp_events.incrementStat(req_log, 'cookie_allow_bootingup');
                                if (CliqzAttrack.debug) CliqzUtils.log(">>> Cookie ALLOWED because bootup: " + key, CliqzAttrack.LOG_KEY);
                            } else {

                                var key = url_parts.hostname + url_parts.path;
                                if (CliqzAttrack.bootupWhitelistCache[key] == null) {

                                    if (CliqzAttrack.isCookieEnabled(source_url_parts.hostname) && !CliqzAttrack.reloadWhiteList[_key]) {
                                        // blocking cookie
                                        var src = null;
                                        if (source_url_parts && source_url_parts.hostname) src = source_url_parts.hostname;
                                        tp_events.incrementStat(req_log, 'cookie_blocked');
                                        tp_events.incrementStat(req_log, 'cookie_block_tp2');
                                        CliqzAttrack.blockCookie(url, { 'src': src, 'dst': url_parts.hostname, 'data': cookie_data, 'ts': curr_time }, 'type2');
                                        blockingResponse.requestHeaders = [{ name: 'Cookie', value: '' }, { name: CliqzAttrack.cliqzHeader, value: ' ' }];
                                        return blockingResponse;
                                    } else {
                                        // was not enabled, therefore the cookie gets sent
                                        tp_events.incrementStat(req_log, 'bad_cookie_sent');
                                    }
                                } else {
                                    // should allow, same domain and path as bootup request,
                                    if (CliqzAttrack.debug) CliqzUtils.log(">>> Cookie ALLOWED because bootup: " + key, CliqzAttrack.LOG_KEY);
                                }
                            }
                        }
                        return blockingResponse;
                    }
                },
                allowCookie: function allowCookie(url, req_metadata, reason) {
                    if (CliqzAttrack.debug) CliqzUtils.log("ALLOWING because of " + reason + " " + req_metadata['dst'] + ' %% ' + url, CliqzAttrack.LOG_KEY);
                },
                blockCookie: function blockCookie(url, req_metadata, reason) {
                    if (CliqzAttrack.debug) CliqzUtils.log(">>> Cookie REMOVED (" + reason + "): " + req_metadata['dst'] + " >>> " + url, CliqzAttrack.LOG_KEY);
                    CliqzAttrack.blockedCache[req_metadata['dst']] = req_metadata['ts'];
                },
                onTabLocationChange: function onTabLocationChange(evnt) {
                    var url = evnt.url;

                    CliqzAttrack.linksFromDom[url] = {};

                    if (evnt.isLoadingDocument) {
                        // when a new page is loaded, try to extract internal links and cookies
                        var doc = evnt.document;
                        CliqzAttrack.loadedTabs[url] = false;

                        if (doc) {
                            if (doc.body) {
                                CliqzAttrack.recordLinksForURL(url);
                            }
                            doc.addEventListener('DOMContentLoaded', function (ev) {
                                CliqzAttrack.loadedTabs[url] = true;
                                CliqzAttrack.recordLinksForURL(url);
                            });
                            CliqzAttrack.clearDomLinks();
                        }
                    }

                    // New location, means a page loaded on the top window, visible tab
                    var activeURL = browser.currentURL();
                    var curr_time = Date.now();

                    if (activeURL.indexOf('about:') != 0 && activeURL.indexOf('chrome:') != 0) {

                        var url_parts = parseURL(activeURL);

                        if (url_parts && url_parts.hostname && url_parts.hostname != '') {
                            var host = getGeneralDomain(url_parts.hostname);
                            CliqzAttrack.visitCache[host] = curr_time;
                        }
                    }
                },
                getDefaultRule: function getDefaultRule() {
                    if (CliqzAttrack.isForceBlockEnabled()) {
                        return 'block';
                    } else {
                        return getDefaultTrackerTxtRule();
                    }
                },
                isEnabled: function isEnabled() {
                    return CliqzUtils.getPref(CliqzAttrack.ENABLE_PREF, false);
                },
                isCookieEnabled: function isCookieEnabled(source_hostname) {
                    if (source_hostname != undefined && CliqzAttrack.isSourceWhitelisted(source_hostname)) {
                        return false;
                    }
                    return CliqzUtils.getPref('attrackBlockCookieTracking', true);
                },
                isQSEnabled: function isQSEnabled() {
                    return CliqzUtils.getPref('attrackRemoveQueryStringTracking', true);
                },
                isFingerprintingEnabled: function isFingerprintingEnabled() {
                    return CliqzUtils.getPref('attrackCanvasFingerprintTracking', false);
                },
                isReferrerEnabled: function isReferrerEnabled() {
                    return CliqzUtils.getPref('attrackRefererTracking', false);
                },
                isTrackerTxtEnabled: function isTrackerTxtEnabled() {
                    return CliqzUtils.getPref('trackerTxt', false);
                },
                isBloomFilterEnabled: function isBloomFilterEnabled() {
                    return CliqzUtils.getPref('attrackBloomFilter', false);
                },
                isForceBlockEnabled: function isForceBlockEnabled() {
                    return CliqzUtils.getPref('attrackForceBlock', false);
                },
                initPacemaker: function initPacemaker() {
                    var two_mins = 2 * 60 * 1000;

                    // create a constraint which returns true when the time changes at the specified fidelity
                    function timeChangeConstraint(name, fidelity) {
                        if (fidelity == "day") fidelity = 8;else if (fidelity == "hour") fidelity = 10;
                        return function (task) {
                            var timestamp = datetime.getTime().slice(0, fidelity),
                                lastHour = persist.getValue(name + "lastRun") || timestamp;
                            persist.setValue(name + "lastRun", timestamp);
                            return timestamp != lastHour;
                        };
                    }

                    pacemaker.register(CliqzAttrack.updateConfig, 3 * 60 * 60 * 1000);

                    // send instant cache tokens whenever hour changes
                    pacemaker.register(CliqzAttrack.sendTokens, 5 * 60 * 1000);
                    // if the hour has changed
                    pacemaker.register(CliqzAttrack.hourChanged, two_mins, timeChangeConstraint("hourChanged", "hour"));

                    // every 2 mins
                    pacemaker.register(function clean_visitCache(curr_time) {
                        var keys = Object.keys(CliqzAttrack.visitCache);
                        for (var i = 0; i < keys.length; i++) {
                            var diff = curr_time - (CliqzAttrack.visitCache[keys[i]] || 0);
                            if (diff > CliqzAttrack.timeCleaningCache) delete CliqzAttrack.visitCache[keys[i]];
                        }
                    }, two_mins);

                    pacemaker.register(function clean_reloadWhiteList(curr_time) {
                        var keys = Object.keys(CliqzAttrack.reloadWhiteList);
                        for (var i = 0; i < keys.length; i++) {
                            var diff = curr_time - (CliqzAttrack.reloadWhiteList[keys[i]] || 0);
                            if (diff > CliqzAttrack.timeCleaningCache) {
                                delete CliqzAttrack.reloadWhiteList[keys[i]];
                            }
                        }
                    }, two_mins);

                    pacemaker.register(function clean_trackReload(curr_time) {
                        var keys = Object.keys(CliqzAttrack.trackReload);
                        for (var i = 0; i < keys.length; i++) {
                            var diff = curr_time - (CliqzAttrack.trackReload[keys[i]] || 0);
                            if (diff > CliqzAttrack.timeCleaningCache) {
                                delete CliqzAttrack.trackReload[keys[i]];
                            }
                        }
                    }, two_mins);

                    pacemaker.register(function clean_blockedCache(curr_time) {
                        var keys = Object.keys(CliqzAttrack.blockedCache);
                        for (var i = 0; i < keys.length; i++) {
                            var diff = curr_time - (CliqzAttrack.blockedCache[keys[i]] || 0);
                            if (diff > CliqzAttrack.timeCleaningCache) delete CliqzAttrack.blockedCache[keys[i]];
                        }
                    }, two_mins);

                    var bootup_task = pacemaker.register(function bootup_check(curr_time) {
                        if (curr_time - CliqzAttrack.bootupTime > CliqzAttrack.timeBootup) {
                            CliqzUtils.log("bootup end");
                            CliqzAttrack.bootingUp = false;
                            pacemaker.deregister(bootup_task);
                        }
                    });

                    pacemaker.register(function tp_event_commit() {
                        CliqzAttrack.tp_events.commit();
                        CliqzAttrack.tp_events.push();
                    }, two_mins);

                    // every hour
                    var hourly = 60 * 60 * 1000;
                    pacemaker.register(CliqzAttrack.pruneRequestKeyValue, hourly);

                    // send tracking occurances whenever day changes
                    pacemaker.register(function sendTrackingDetections() {
                        if (CliqzAttrack.local_tracking.isEnabled()) {
                            CliqzAttrack.local_tracking.getTrackingOccurances(function (results) {
                                if (results.length > 0) {
                                    CliqzAttrack.local_tracking.getTableSize(function (table_size) {
                                        var payl = {
                                            'ver': CliqzAttrack.VERSION,
                                            'ts': datetime.getTime().substring(0, 8),
                                            'data': {
                                                'lt': results.map(function (tup) {
                                                    return { 'tp': tup[0], 'k': tup[1], 'v': tup[2], 'n': tup[3] };
                                                }),
                                                'c': table_size
                                            }
                                        };
                                        telemetry.telemetry({
                                            'type': telemetry.msgType,
                                            'action': 'attrack.tracked',
                                            'payload': payl
                                        });
                                    });
                                }
                                CliqzAttrack.local_tracking.cleanTable();
                            });
                        }
                    }, hourly, timeChangeConstraint("local_tracking", "day"));

                    pacemaker.register(function annotateSafeKeys() {
                        CliqzAttrack.qs_whitelist.annotateSafeKeys(CliqzAttrack.requestKeyValue);
                    }, 10 * 60 * 60 * 1000);
                },
                /** Global module initialisation.
                 */
                init: function init() {
                    // disable for older browsers
                    if (CliqzAttrack.getBrowserMajorVersion() < CliqzAttrack.MIN_BROWSER_VERSION) {
                        return;
                    }

                    // Replace getWindow functions with window object used in init.
                    if (CliqzAttrack.debug) CliqzUtils.log("Init function called:", CliqzAttrack.LOG_KEY);

                    CliqzAttrack.hashProb = new HashProb();

                    // load all caches:
                    // Large dynamic caches are loaded via the persist module, which will lazily propegate changes back
                    // to the browser's sqlite database.
                    // Large static caches (e.g. token whitelist) are loaded from sqlite
                    // Smaller caches (e.g. update timestamps) are kept in prefs
                    this._tokens = new persist.AutoPersistentObject("tokens", function (v) {
                        return CliqzAttrack.tokens = v;
                    }, 60000);
                    //this._blocked = new persist.AutoPersistentObject("blocked", (v) => CliqzAttrack.blocked = v, 300000);

                    CliqzAttrack.qs_whitelist = CliqzAttrack.isBloomFilterEnabled() ? new AttrackBloomFilter() : new QSWhitelist();
                    CliqzAttrack.qs_whitelist.init();
                    CliqzAttrack.blockLog = new BlockLog(CliqzAttrack.qs_whitelist);
                    CliqzAttrack.blockLog.init();

                    this._requestKeyValue = new persist.AutoPersistentObject("requestKeyValue", function (v) {
                        return CliqzAttrack.requestKeyValue = v;
                    }, 60000);
                    // force clean requestKeyValue
                    events.sub("attrack:safekeys_updated", function (version, forceClean) {
                        if (forceClean) {
                            CliqzAttrack._requestKeyValue.clear();
                        }
                    });

                    if (CliqzAttrack.qsBlockRule == null) CliqzAttrack.loadBlockRules();

                    // load tracker companies data
                    this._trackerLoader = new ResourceLoader(['antitracking', 'tracker_owners.json'], {
                        remoteURL: 'https://cdn.cliqz.com/anti-tracking/tracker_owners_list.json',
                        cron: 24 * 60 * 60 * 1000
                    });
                    this._trackerLoader.load().then(CliqzAttrack._parseTrackerCompanies);
                    this._trackerLoader.onUpdate(CliqzAttrack._parseTrackerCompanies);

                    // load cookie whitelist
                    this._cookieWhitelistLoader = new ResourceLoader(['antitracking', 'cookie_whitelist.json'], {
                        remoteURL: 'https://cdn.cliqz.com/anti-tracking/whitelist/cookie_whitelist.json',
                        cron: 24 * 60 * 60 * 1000
                    });
                    var updateCookieWhitelist = function updateCookieWhitelist(data) {
                        CliqzAttrack.whitelist = data;
                    };
                    this._cookieWhitelistLoader.load().then(updateCookieWhitelist);
                    this._cookieWhitelistLoader.onUpdate(updateCookieWhitelist);

                    CliqzAttrack.checkInstalledAddons();

                    if (CliqzAttrack.visitCache == null) {
                        CliqzAttrack.visitCache = {};
                    }

                    CliqzAttrack.initPacemaker();
                    pacemaker.start();

                    WebRequest.onBeforeRequest.addListener(CliqzAttrack.httpopenObserver.observe, undefined, ['blocking']);
                    WebRequest.onBeforeSendHeaders.addListener(CliqzAttrack.httpmodObserver.observe, undefined, ['blocking']);
                    WebRequest.onHeadersReceived.addListener(CliqzAttrack.httpResponseObserver.observe);

                    try {
                        CliqzAttrack.disabled_sites = new Set(JSON.parse(CliqzUtils.getPref(CliqzAttrack.DISABLED_SITES_PREF, "[]")));
                    } catch (e) {
                        CliqzAttrack.disabled_sites = new Set();
                    }

                    CliqzAttrack.local_tracking = new TrackingTable();

                    // note: if a 0 value were to be saved, the default would be preferred. This is ok because these options
                    // cannot have 0 values.
                    CliqzAttrack.safekeyValuesThreshold = parseInt(persist.getValue('safekeyValuesThreshold')) || 4;
                    CliqzAttrack.shortTokenLength = parseInt(persist.getValue('shortTokenLength')) || 8;

                    CliqzAttrack.placeHolder = persist.getValue('placeHolder', CliqzAttrack.placeHolder);
                    CliqzAttrack.cliqzHeader = persist.getValue('cliqzHeader', CliqzAttrack.cliqzHeader);

                    CliqzAttrack.trackerProxy = new TrackerProxy();
                    CliqzAttrack.trackerProxy.init();
                },
                /** Per-window module initialisation
                 */
                initWindow: function initWindow(window) {
                    if (CliqzAttrack.getBrowserMajorVersion() < CliqzAttrack.MIN_BROWSER_VERSION) {
                        return;
                    }
                    // Load listerners:
                    window.CLIQZ.Core.urlbar.addEventListener('focus', onUrlbarFocus);

                    CliqzAttrack.getPrivateValues(window);
                },
                unload: function unload() {
                    // don't need to unload if disabled
                    if (CliqzAttrack.getBrowserMajorVersion() < CliqzAttrack.MIN_BROWSER_VERSION) {
                        return;
                    }
                    //Check is active usage, was sent

                    // force send tab telemetry data
                    CliqzAttrack.tp_events.commit(true, true);
                    CliqzAttrack.tp_events.push(true);

                    CliqzAttrack.blockLog.destroy();
                    CliqzAttrack.qs_whitelist.destroy();

                    browser.forEachWindow(CliqzAttrack.unloadWindow);

                    WebRequest.onBeforeRequest.removeListener(CliqzAttrack.httpopenObserver.observe);
                    WebRequest.onBeforeSendHeaders.removeListener(CliqzAttrack.httpmodObserver.observe);
                    WebRequest.onHeadersReceived.removeListener(CliqzAttrack.httpResponseObserver.observe);

                    pacemaker.stop();
                    HttpRequestContext.unloadCleaner();

                    CliqzAttrack.trackerProxy.destroy();
                },
                unloadWindow: function unloadWindow(window) {
                    if (window.CLIQZ) {
                        window.CLIQZ.Core.urlbar.removeEventListener('focus', onUrlbarFocus);
                    }
                },
                checkInstalledAddons: function checkInstalledAddons() {
                    System['import']('platform/antitracking/addon-check').then(function (addons) {
                        CliqzAttrack.similarAddon = addons.checkInstalledAddons();
                    })['catch'](function (e) {
                        utils.log("Error loading addon checker", "attrack");
                    });
                },
                generateAttrackPayload: function generateAttrackPayload(data, ts) {
                    var extraAttrs = CliqzAttrack.qs_whitelist.getVersion();
                    extraAttrs.ver = CliqzAttrack.VERSION;
                    ts = ts || datetime.getHourTimestamp();
                    return generatePayload(data, ts, false, extraAttrs);
                },
                sendTokens: function sendTokens() {
                    // send tokens every 5 minutes
                    var data = {},
                        hour = datetime.getTime(),
                        limit = Object.keys(CliqzAttrack.tokens).length / 12;

                    // sort tracker keys by lastSent, i.e. send oldest data first
                    var sortedTrackers = Object.keys(CliqzAttrack.tokens).sort(function (a, b) {
                        return parseInt(CliqzAttrack.tokens[a].lastSent || 0) - parseInt(CliqzAttrack.tokens[b].lastSent || 0);
                    });

                    for (var i in sortedTrackers) {
                        var tracker = sortedTrackers[i];

                        if (limit > 0 && Object.keys(data).length > limit) {
                            break;
                        }

                        var tokenData = CliqzAttrack.tokens[tracker];
                        if (!tokenData.lastSent || tokenData.lastSent < hour) {
                            delete tokenData.lastSent;
                            data[tracker] = anonymizeTrackerTokens(tokenData);
                            delete CliqzAttrack.tokens[tracker];
                        }
                    }

                    if (Object.keys(data).length > 0) {
                        (function () {
                            var compress = compressionAvailable();

                            splitTelemetryData(data, 20000).map(function (d) {
                                var payl = CliqzAttrack.generateAttrackPayload(d);
                                var msg = {
                                    'type': telemetry.msgType,
                                    'action': 'attrack.tokens',
                                    'payload': payl
                                };
                                if (compress) {
                                    msg.compressed = true;
                                    msg.payload = compressJSONToBase64(payl);
                                }
                                telemetry.telemetry(msg);
                            });
                        })();
                    }
                    CliqzAttrack._tokens.setDirty();
                },
                hourChanged: function hourChanged() {
                    // clear the tokens if the hour changed
                    if (CliqzAttrack.tokens && Object.keys(CliqzAttrack.tokens).length > 0) {
                        if (CliqzAttrack.local_tracking.isEnabled()) {
                            CliqzAttrack.local_tracking.loadTokens(CliqzAttrack.tokens);
                        }
                    }

                    // trigger other hourly events
                    events.pub("attrack:hour_changed");
                },
                updateConfig: function updateConfig() {
                    var today = datetime.getTime().substring(0, 10);
                    utils.httpGet(CliqzAttrack.VERSIONCHECK_URL + "?" + today, function (req) {
                        // on load
                        var versioncheck = JSON.parse(req.response);

                        // config in versioncheck
                        if (versioncheck.placeHolder) {
                            persist.setValue('placeHolder', versioncheck.placeHolder);
                            CliqzAttrack.placeHolder = versioncheck.placeHolder;
                        }

                        if (versioncheck.shortTokenLength) {
                            persist.setValue('shortTokenLength', versioncheck.shortTokenLength);
                            CliqzAttrack.shortTokenLength = parseInt(versioncheck.shortTokenLength) || CliqzAttrack.shortTokenLength;
                        }

                        if (versioncheck.safekeyValuesThreshold) {
                            persist.setValue('safekeyValuesThreshold', versioncheck.safekeyValuesThreshold);
                            CliqzAttrack.safekeyValuesThreshold = parseInt(versioncheck.safekeyValuesThreshold) || CliqzAttrack.safekeyValuesThreshold;
                        }

                        if (versioncheck.cliqzHeader) {
                            persist.setValue('cliqzHeader', versioncheck.cliqzHeader);
                            CliqzAttrack.cliqzHeader = versioncheck.cliqzHeader;
                        }

                        // fire events for list update
                        events.pub("attrack:updated_config", versioncheck);
                    }, utils.log, 10000);
                },
                pruneRequestKeyValue: function pruneRequestKeyValue() {
                    var day = datetime.newUTCDate();
                    day.setDate(day.getDate() - CliqzAttrack.safeKeyExpire);
                    var dayCutoff = datetime.dateString(day);
                    for (var s in CliqzAttrack.requestKeyValue) {
                        for (var key in CliqzAttrack.requestKeyValue[s]) {
                            for (var tok in CliqzAttrack.requestKeyValue[s][key]) {
                                if (CliqzAttrack.requestKeyValue[s][key][tok] < dayCutoff) {
                                    delete CliqzAttrack.requestKeyValue[s][key][tok];
                                }
                            }
                            if (Object.keys(CliqzAttrack.requestKeyValue[s][key]).length == 0) {
                                delete CliqzAttrack.requestKeyValue[s][key];
                            }
                        }
                        if (Object.keys(CliqzAttrack.requestKeyValue[s]).length == 0) {
                            delete CliqzAttrack.requestKeyValue[s];
                        }
                    }
                    CliqzAttrack._requestKeyValue.setDirty();
                    CliqzAttrack._requestKeyValue.save();
                },
                loadBlockRules: function loadBlockRules() {
                    CliqzAttrack.qsBlockRule = [];
                    CliqzUtils.loadResource(CliqzAttrack.URL_BLOCK_RULES, function (req) {
                        try {
                            CliqzAttrack.qsBlockRule = JSON.parse(req.response);
                        } catch (e) {
                            CliqzAttrack.qsBlockRule = [];
                        }
                    });
                },
                isInWhitelist: function isInWhitelist(domain) {
                    if (!CliqzAttrack.whitelist) return false;
                    var keys = CliqzAttrack.whitelist;
                    for (var i = 0; i < keys.length; i++) {
                        var ind = domain.indexOf(keys[i]);
                        if (ind >= 0) {
                            if (ind + keys[i].length == domain.length) return true;
                        }
                    }
                    return false;
                },
                checkTokens: function checkTokens(url_parts, source_url, cookievalue, stats, source_url_parts) {
                    // bad tokens will still be returned in the same format

                    var s = getGeneralDomain(url_parts.hostname);
                    s = md5(s).substr(0, 16);
                    // If it's a rare 3rd party, we don't do the rest
                    if (!CliqzAttrack.qs_whitelist.isTrackerDomain(s)) return [];

                    var sourceD = md5(source_url_parts.hostname).substr(0, 16);
                    var today = datetime.getTime().substr(0, 8);

                    if (url_parts['query'].length == 0 && url_parts['parameters'].length == 0) return [];
                    var tok;

                    var badTokens = [];

                    // stats keys
                    ['cookie', 'private', 'cookie_b64', 'private_b64', 'safekey', 'whitelisted', 'cookie_newToken', 'cookie_countThreshold', 'private_newToken', 'private_countThreshold', 'short_no_hash', 'cookie_b64_newToken', 'cookie_b64_countThreshold', 'private_b64_newToken', 'private_b64_countThreshold', 'qs_newToken', 'qs_countThreshold'].forEach(function (k) {
                        stats[k] = 0;
                    });

                    var _countCheck = function _countCheck(tok) {
                        // for token length < 12 and may be not a hash, we let it pass
                        if (tok.length < 12 && !CliqzAttrack.hashProb.isHash(tok)) return 0;
                        // update tokenDomain
                        tok = md5(tok);
                        CliqzAttrack.blockLog.tokenDomain.addTokenOnFirstParty(tok, sourceD);
                        return CliqzAttrack.blockLog.tokenDomain.getNFirstPartiesForToken(tok);
                    };

                    var _incrStats = function _incrStats(cc, prefix, tok, key, val) {
                        if (cc == 0) stats['short_no_hash']++;else if (cc < CliqzAttrack.tokenDomainCountThreshold) stats[prefix + '_newToken']++;else {
                            _addBlockLog(s, key, val, prefix);
                            badTokens.push(val);
                            if (cc == CliqzAttrack.tokenDomainCountThreshold) stats[prefix + '_countThreshold']++;
                            stats[prefix]++;
                            return true;
                        }
                        return false;
                    };

                    var _addBlockLog = function _addBlockLog(s, key, val, prefix) {
                        CliqzAttrack.blockLog.blockLog.add(source_url, s, key, val, prefix);
                    };

                    var _checkTokens = function _checkTokens(key, val) {
                        CliqzAttrack.blockLog.incrementCheckedTokens();

                        var tok = dURIC(val);
                        while (tok != dURIC(tok)) {
                            tok = dURIC(tok);
                        }

                        if (tok.length < CliqzAttrack.shortTokenLength || source_url.indexOf(tok) > -1) return;

                        // Bad values (cookies)
                        for (var c in cookievalue) {
                            if (tok.indexOf(c) > -1 && c.length >= CliqzAttrack.shortTokenLength || c.indexOf(tok) > -1) {
                                if (CliqzAttrack.debug) CliqzUtils.log('same value as cookie ' + val, 'tokk');
                                var cc = _countCheck(tok);
                                if (c != tok) {
                                    cc = Math.max(cc, _countCheck(c));
                                }
                                if (_incrStats(cc, 'cookie', tok, key, val)) return;
                            }
                        }

                        // private value (from js function returns)
                        for (var c in CliqzAttrack.privateValues) {
                            if (tok.indexOf(c) > -1 && c.length >= CliqzAttrack.shortTokenLength || c.indexOf(tok) > -1) {
                                if (CliqzAttrack.debug) CliqzUtils.log('same private values ' + val, 'tokk');
                                var cc = _countCheck(tok);
                                if (c != tok) {
                                    cc = Math.max(cc, _countCheck(c));
                                }
                                if (_incrStats(cc, 'private', tok, key, val)) return;
                            }
                        }
                        var b64 = null;
                        try {
                            b64 = atob(tok);
                        } catch (e) {}
                        if (b64 != null) {
                            for (var c in cookievalue) {
                                if (b64.indexOf(c) > -1 && c.length >= CliqzAttrack.shortTokenLength || c.indexOf(b64) > -1) {
                                    if (CliqzAttrack.debug) CliqzUtils.log('same value as cookie ' + b64, 'tokk-b64');
                                    var cc = _countCheck(tok);
                                    if (c != tok) {
                                        cc = Math.max(cc, _countCheck(c));
                                    }
                                    if (_incrStats(cc, 'cookie_b64', tok, key, val)) return;
                                }
                            }
                            for (var c in CliqzAttrack.privateValues) {
                                if (b64.indexOf(c) > -1 && c.length >= CliqzAttrack.shortTokenLength) {
                                    if (CliqzAttrack.debug) CliqzUtils.log('same private values ' + b64, 'tokk-b64');
                                    var cc = _countCheck(tok);
                                    if (c != tok) {
                                        cc = Math.max(cc, _countCheck(c));
                                    }
                                    if (_incrStats(cc, 'private_b64', tok, key, val)) return;
                                }
                            }
                        }

                        // Good keys.
                        if (CliqzAttrack.qs_whitelist.isSafeKey(s, md5(key))) {
                            stats['safekey']++;
                            return;
                        }

                        if (source_url.indexOf(tok) == -1) {
                            if (!CliqzAttrack.qs_whitelist.isSafeToken(s, md5(tok))) {
                                var cc = _countCheck(tok);
                                _incrStats(cc, 'qs', tok, key, val);
                            } else stats['whitelisted']++;
                        }
                    };

                    url_parts.getKeyValues().forEach(function (kv) {
                        _checkTokens(kv.k, kv.v);
                    });

                    // update blockedToken
                    CliqzAttrack.blockLog.incrementBlockedTokens(badTokens.length);
                    return badTokens;
                },
                examineTokens: function examineTokens(url_parts) {
                    var day = datetime.newUTCDate();
                    var today = datetime.dateString(day);
                    // save appeared tokens with field name
                    // mark field name as "safe" if different values appears
                    var s = getGeneralDomain(url_parts.hostname);
                    s = md5(s).substr(0, 16);
                    url_parts.getKeyValuesMD5().filter(function (kv) {
                        return kv.v_len >= CliqzAttrack.shortTokenLength;
                    }).forEach(function (kv) {
                        var key = kv.k,
                            tok = kv.v;
                        if (CliqzAttrack.qs_whitelist.isSafeKey(s, key)) return;
                        if (CliqzAttrack.requestKeyValue[s] == null) CliqzAttrack.requestKeyValue[s] = {};
                        if (CliqzAttrack.requestKeyValue[s][key] == null) CliqzAttrack.requestKeyValue[s][key] = {};

                        CliqzAttrack.requestKeyValue[s][key][tok] = today;
                        // see at least 3 different value until it's safe
                        var valueCount = Object.keys(CliqzAttrack.requestKeyValue[s][key]).length;
                        if (valueCount > CliqzAttrack.safekeyValuesThreshold) {
                            CliqzAttrack.qs_whitelist.addSafeKey(s, key, valueCount);
                            // keep the last seen token
                            CliqzAttrack.requestKeyValue[s][key] = { tok: today };
                        }
                        CliqzAttrack._requestKeyValue.setDirty();
                    });
                },
                extractKeyTokens: function extractKeyTokens(url_parts, refstr, isPrivate, callback) {
                    // keys, value of query strings will be sent in md5
                    // url, refstr will be sent in half of md5
                    var keyTokens = url_parts.getKeyValuesMD5();
                    if (keyTokens.length > 0) {
                        var s = md5(url_parts.hostname).substr(0, 16);
                        refstr = md5(refstr).substr(0, 16);
                        callback(s, keyTokens, refstr, isPrivate);
                    }
                },
                saveKeyTokens: function saveKeyTokens(s, keyTokens, r, isPrivate) {
                    // anything here should already be hash
                    if (CliqzAttrack.tokens[s] == null) CliqzAttrack.tokens[s] = { lastSent: datetime.getTime() };
                    if (CliqzAttrack.tokens[s][r] == null) CliqzAttrack.tokens[s][r] = { 'c': 0, 'kv': {} };
                    CliqzAttrack.tokens[s][r]['c'] = (CliqzAttrack.tokens[s][r]['c'] || 0) + 1;
                    var _iteratorNormalCompletion = true;
                    var _didIteratorError = false;
                    var _iteratorError = undefined;

                    try {
                        for (var _iterator = keyTokens[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                            var kv = _step.value;

                            var tok = kv.v,
                                k = kv.k;
                            if (CliqzAttrack.tokens[s][r]['kv'][k] == null) CliqzAttrack.tokens[s][r]['kv'][k] = {};
                            if (CliqzAttrack.tokens[s][r]['kv'][k][tok] == null) {
                                CliqzAttrack.tokens[s][r]['kv'][k][tok] = {
                                    c: 0,
                                    k_len: kv.k_len,
                                    v_len: kv.v_len,
                                    isPrivate: isPrivate
                                };
                            }
                            CliqzAttrack.tokens[s][r]['kv'][k][tok].c += 1;
                        }
                    } catch (err) {
                        _didIteratorError = true;
                        _iteratorError = err;
                    } finally {
                        try {
                            if (!_iteratorNormalCompletion && _iterator['return']) {
                                _iterator['return']();
                            }
                        } finally {
                            if (_didIteratorError) {
                                throw _iteratorError;
                            }
                        }
                    }

                    CliqzAttrack._tokens.setDirty();
                },
                recordLinksForURL: function recordLinksForURL(url) {
                    if (CliqzAttrack.loadedTabs[url]) {
                        return;
                    }

                    return Promise.all([core.getCookie(url).then(function (cookie) {
                        return CliqzAttrack.cookiesFromDom[url] = cookie;
                    }), Promise.all([core.queryHTML(url, 'a[href]', 'href'), core.queryHTML(url, 'link[href]', 'href'), core.queryHTML(url, 'script[src]', 'src').then(function (hrefs) {
                        return hrefs.filter(function (href) {
                            return href.indexOf('http') === 0;
                        });
                    })]).then(function (reflinks) {
                        var hrefSet = reflinks.reduce(function (hrefSet, hrefs) {
                            hrefs.forEach(function (href) {
                                return hrefSet[href] = true;
                            });
                            return hrefSet;
                        }, {});

                        CliqzAttrack.linksFromDom[url] = hrefSet;
                    })]);
                },
                clearDomLinks: function clearDomLinks() {
                    for (var url in CliqzAttrack.linksFromDom) {
                        if (!CliqzAttrack.isTabURL(url)) {
                            delete CliqzAttrack.linksFromDom[url];
                            delete CliqzAttrack.cookiesFromDom[url];
                            delete CliqzAttrack.loadedTabs[url];
                        }
                    }
                },
                isTabURL: function isTabURL(url) {
                    var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
                    var browserEnumerator = wm.getEnumerator("navigator:browser");

                    while (browserEnumerator.hasMoreElements()) {
                        var browserWin = browserEnumerator.getNext();
                        var tabbrowser = browserWin.gBrowser;

                        var numTabs = tabbrowser.browsers.length;
                        for (var index = 0; index < numTabs; index++) {
                            var currentBrowser = tabbrowser.getBrowserAtIndex(index);
                            if (currentBrowser) {
                                var tabURL = currentBrowser.currentURI.spec;
                                if (url == tabURL || url == tabURL.split('#')[0]) {
                                    return true;
                                }
                            }
                        }
                    }
                    return false;
                },
                // Listens for requests initiated in tabs.
                // Allows us to track tab windowIDs to urls.
                tab_listener: {
                    _tabsStatus: {},

                    onStateChange: function onStateChange(evnt) {
                        var urlSpec = evnt.urlSpec;
                        var isNewPage = evnt.isNewPage;
                        var windowID = evnt.windowID;

                        // check flags for started request
                        if (isNewPage && urlSpec && windowID) {
                            // add window -> url pair to tab cache.
                            this._tabsStatus[windowID] = urlSpec;
                            var _key = windowID + ":" + urlSpec;
                            if (!CliqzAttrack.trackReload[_key]) {
                                CliqzAttrack.trackReload[_key] = new Date();
                            } else {
                                var t2 = new Date();
                                var dur = (t2 - CliqzAttrack.trackReload[_key]) / 1000;
                                if (dur < 30000 && countReload && windowID in CliqzAttrack.tp_events._active) {
                                    CliqzAttrack.tp_events._active[windowID]['ra'] = 1;
                                    CliqzAttrack.reloadWhiteList[_key] = t2;
                                }
                            }
                            countReload = false;
                        }
                    },

                    // Get an array of windowIDs for tabs which a currently on the given URL.
                    getTabsForURL: function getTabsForURL(url) {
                        var tabs = [];
                        for (var windowID in this._tabsStatus) {
                            var tabURL = this._tabsStatus[windowID];
                            if (url == tabURL || url == tabURL.split('#')[0]) {
                                tabs.push(windowID);
                            }
                        }
                        return tabs;
                    },

                    isWindowActive: browser.isWindowActive

                },
                /** Get info about trackers and blocking done in a specified tab.
                 *
                 *  Returns an object describing anti-tracking actions for this page, with keys as follows:
                 *    cookies: 'allowed' and 'blocked' counts.
                 *    requests: 'safe' and 'unsafe' counts. 'Unsafe' means that unsafe data was seen in a request to a tracker.
                 *    trackers: more detailed information about each tracker. Object with keys being tracker domain and values
                 *        more detailed blocking data.
                 */
                getTabBlockingInfo: function getTabBlockingInfo(tab_id, url) {
                    var result = {
                        hostname: '',
                        cookies: { allowed: 0, blocked: 0 },
                        requests: { safe: 0, unsafe: 0 },
                        trackers: {},
                        companies: {},
                        ps: null
                    };

                    // ignore special tabs
                    if (url && (url.indexOf('about') == 0 || url.indexOf('chrome') == 0)) {
                        result.error = 'Special tab';
                        return result;
                    }

                    if (!(tab_id in CliqzAttrack.tp_events._active)) {
                        // no tp event, but 'active' tab = must reload for data
                        // otherwise -> system tab
                        if (browser.isWindowActive(tab_id)) {
                            result.reload = true;
                        }
                        result.error = 'No Data';
                        return result;
                    }

                    var tab_data = CliqzAttrack.tp_events._active[tab_id],
                        trackers = Object.keys(tab_data.tps).filter(function (domain) {
                        return CliqzAttrack.qs_whitelist.isTrackerDomain(md5(getGeneralDomain(domain)).substring(0, 16));
                    }),
                        plain_data = tab_data.asPlainObject(),
                        firstPartyCompany = CliqzAttrack.tracker_companies[getGeneralDomain(tab_data.hostname)];
                    result.hostname = tab_data.hostname;
                    result.ps = PrivacyScore.get(md5(getGeneralDomain(result.hostname)).substr(0, 16) + 'site');
                    if (!result.ps.score) {
                        result.ps.getPrivacyScore();
                    }

                    trackers.forEach(function (dom) {
                        result.trackers[dom] = {};
                        ['c', 'cookie_set', 'cookie_blocked', 'bad_cookie_sent', 'bad_qs', 'tokens_blocked', 'req_aborted'].forEach(function (k) {
                            result.trackers[dom][k] = plain_data.tps[dom][k] || 0;
                        });
                        result.cookies.allowed += result.trackers[dom]['cookie_set'] - result.trackers[dom]['cookie_blocked'];
                        result.cookies.blocked += result.trackers[dom]['cookie_blocked'];
                        result.requests.safe += result.trackers[dom]['c'] - result.trackers[dom]['bad_qs'];
                        result.requests.unsafe += result.trackers[dom]['bad_qs'];

                        var tld = getGeneralDomain(dom),
                            company = tld;
                        // find the company behind this tracker. I
                        // If the first party is from a tracker company, then do not add the company so that the actual tlds will be shown in the list
                        if (tld in CliqzAttrack.tracker_companies && CliqzAttrack.tracker_companies[tld] !== firstPartyCompany) {
                            company = CliqzAttrack.tracker_companies[tld];
                        }
                        if (!(company in result.companies)) {
                            result.companies[company] = [];
                        }
                        result.companies[company].push(dom);
                    });

                    return result;
                },
                getCurrentTabBlockingInfo: function getCurrentTabBlockingInfo() {
                    var tabId, urlForTab;
                    try {
                        var gBrowser = CliqzUtils.getWindow().gBrowser,
                            selectedBrowser = gBrowser.selectedBrowser;

                        tabId = selectedBrowser.outerWindowID;
                        urlForTab = selectedBrowser.currentURI.spec;
                    } catch (e) {}
                    return CliqzAttrack.getTabBlockingInfo(tabId, urlForTab);
                },
                tracker_companies: {},
                /** Parse tracker owners list {Company: [list, of, domains]}, into lookup table {domain: Company}
                 */
                _parseTrackerCompanies: function _parseTrackerCompanies(company_list) {
                    var rev_list = {};
                    for (var company in company_list) {
                        company_list[company].forEach(function (d) {
                            rev_list[d] = company;
                        });
                    }
                    CliqzAttrack.tracker_companies = rev_list;
                },
                /** Enables Attrack module with cookie, QS and referrer protection enabled.
                 *  if module_only is set to true, will not set preferences for cookie, QS and referrer protection (for selective loading in AB tests)
                 */
                enableModule: function enableModule(module_only) {
                    if (CliqzAttrack.isEnabled()) {
                        return;
                    }
                    CliqzUtils.setPref(CliqzAttrack.ENABLE_PREF, true);
                    if (!module_only) {
                        CliqzUtils.setPref('attrackBlockCookieTracking', true);
                        CliqzUtils.setPref('attrackRemoveQueryStringTracking', true);
                    }
                },
                /** Disables anti-tracking immediately.
                 */
                disableModule: function disableModule() {
                    CliqzUtils.setPref(CliqzAttrack.ENABLE_PREF, false);
                },
                disabled_sites: new Set(),
                DISABLED_SITES_PREF: "attrackSourceDomainWhitelist",
                saveSourceDomainWhitelist: function saveSourceDomainWhitelist() {
                    CliqzUtils.setPref(CliqzAttrack.DISABLED_SITES_PREF, JSON.stringify(Array.from(CliqzAttrack.disabled_sites)));
                },
                isSourceWhitelisted: function isSourceWhitelisted(hostname) {
                    return CliqzAttrack.disabled_sites.has(hostname);
                },
                addSourceDomainToWhitelist: function addSourceDomainToWhitelist(domain) {
                    CliqzAttrack.disabled_sites.add(domain);
                    // also send domain to humanweb
                    telemetry.telemetry({
                        'type': telemetry.msgType,
                        'action': 'attrack.whitelistDomain',
                        'payload': domain
                    });
                    CliqzAttrack.saveSourceDomainWhitelist();
                },
                removeSourceDomainFromWhitelist: function removeSourceDomainFromWhitelist(domain) {
                    CliqzAttrack.disabled_sites['delete'](domain);
                    CliqzAttrack.saveSourceDomainWhitelist();
                }
            };

            _export('default', CliqzAttrack);
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy9hdHRyYWNrLmVzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztzZUE2QkksV0FBVyxFQTBEWCxZQUFZOztBQXhEaEIsYUFBUyxhQUFhLEdBQUU7QUFDcEIsbUJBQVcsR0FBRyxJQUFJLENBQUM7S0FDdEI7Ozs7Ozs7OztBQVNELGFBQVMsT0FBTyxDQUFDLEdBQUcsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFOztBQUVoQyxZQUFJLElBQUksQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO0FBQ3BCLGtCQUFNLElBQUksS0FBSyxDQUFDLGlEQUFpRCxDQUFDLENBQUM7U0FDcEU7O0FBRUQsWUFBSSxHQUFHLENBQUMsTUFBTSxJQUFJLElBQUksRUFBRTtBQUN0QixtQkFBTyxHQUFHLENBQUM7U0FDWixNQUNJO0FBQ0gsbUJBQVEsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsQ0FBRTtTQUMvQztLQUNGOzs7Ozs7Ozs7Ozs7Ozs7QUFlRCxhQUFTLHNCQUFzQixDQUFDLFdBQVcsRUFBRTs7QUFFM0MsWUFBTSxHQUFHLEdBQUcsQ0FBQyxDQUFDO0FBQ2QsWUFBTSxHQUFHLEdBQUcsTUFBTSxDQUFDLGdCQUFnQixDQUFDO0FBQ3BDLFlBQUksTUFBTSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxJQUFJLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxDQUFBLEFBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQzs7O0FBRy9ELFlBQUkscUJBQXFCLEdBQUcsRUFBRSxDQUFDOztBQUUvQixhQUFLLElBQUksV0FBVyxJQUFJLFdBQVcsRUFBRTtBQUNuQyxnQkFBTSxZQUFZLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLENBQUMsQ0FBQztB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USxFQUFFO0FBQ3BDLDJCQUFPLFlBQVksQ0FBQyxjQUFjLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO2lCQUNwRDtBQUNELDBDQUEwQixFQUFFLG9DQUFTLE1BQU0sRUFBRTtBQUMzQyxnQ0FBWSxDQUFDLGNBQWMsQ0FBQyxHQUFHLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRXhDLDZCQUFTLENBQUMsU0FBUyxDQUFDO0FBQ2xCLDhCQUFNLEVBQUUsU0FBUyxDQUFDLE9BQU87QUFDekIsZ0NBQVEsRUFBRSx5QkFBeUI7QUFDbkMsaUNBQVMsRUFBRSxNQUFNO3FCQUNsQixDQUFDLENBQUM7QUFDSCxnQ0FBWSxDQUFDLHlCQUF5QixFQUFFLENBQUM7aUJBQzFDO0FBQ0QsK0NBQStCLEVBQUUseUNBQVMsTUFBTSxFQUFFO0FBQ2hELGdDQUFZLENBQUMsY0FBYyxVQUFPLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDM0MsZ0NBQVksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDO2lCQUMxQzthQUNKOzsrQkFFYyxZQUFZIiwiZmlsZSI6ImFudGl0cmFja2luZy9hdHRyYWNrLmVzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIFRoaXMgbW9kdWxlIHByZXZlbnRzIHVzZXIgZnJvbSAzcmQgcGFydHkgdHJhY2tpbmdcbiAqL1xuaW1wb3J0IHBhY2VtYWtlciBmcm9tICdhbnRpdHJhY2tpbmcvcGFjZW1ha2VyJztcbmltcG9ydCAqIGFzIHBlcnNpc3QgZnJvbSAnYW50aXRyYWNraW5nL3BlcnNpc3RlbnQtc3RhdGUnO1xuaW1wb3J0IFRlbXBTZXQgZnJvbSAnYW50aXRyYWNraW5nL3RlbXAtc2V0JztcbmltcG9ydCBIdHRwUmVxdWVzdENvbnRleHQgZnJvbSAnYW50aXRyYWNraW5nL3dlYnJlcXVlc3QtY29udGV4dCc7XG5pbXBvcnQgdHBfZXZlbnRzIGZyb20gJ2FudGl0cmFja2luZy90cF9ldmVudHMnO1xuaW1wb3J0IG1kNSBmcm9tICdhbnRpdHJhY2tpbmcvbWQ1JztcbmltcG9ydCB7IHBhcnNlVVJMLCBkVVJJQywgZ2V0SGVhZGVyTUQ1LCBVUkxJbmZvLCBzaHVmZmxlLCBmaW5kT2F1dGggfSBmcm9tICdhbnRpdHJhY2tpbmcvdXJsJztcbmltcG9ydCB7IGdldEdlbmVyYWxEb21haW4sIHNhbWVHZW5lcmFsRG9tYWluIH0gZnJvbSAnYW50aXRyYWNraW5nL2RvbWFpbic7XG5pbXBvcnQgeyBIYXNoUHJvYiB9IGZyb20gJ2FudGl0cmFja2luZy9oYXNoJztcbmltcG9ydCB7IFRyYWNrZXJUWFQsIHNsZWVwLCBnZXREZWZhdWx0VHJhY2tlclR4dFJ1bGUgfSBmcm9tICdhbnRpdHJhY2tpbmcvdHJhY2tlci10eHQnO1xuaW1wb3J0IHsgQXR0cmFja0Jsb29tRmlsdGVyIH0gZnJvbSAnYW50aXRyYWNraW5nL2Jsb29tLWZpbHRlcic7XG5pbXBvcnQgKiBhcyBkYXRldGltZSBmcm9tICdhbnRpdHJhY2tpbmcvdGltZSc7XG5pbXBvcnQgVHJhY2tpbmdUYWJsZSBmcm9tICdhbnRpdHJhY2tpbmcvbG9jYWwtdHJhY2tpbmctdGFibGUnO1xuaW1wb3J0IFFTV2hpdGVsaXN0IGZyb20gJ2FudGl0cmFja2luZy9xcy13aGl0ZWxpc3RzJztcbmltcG9ydCBCbG9ja0xvZyBmcm9tICdhbnRpdHJhY2tpbmcvYmxvY2stbG9nJztcbmltcG9ydCB7IHV0aWxzLCBldmVudHMgfSBmcm9tICdjb3JlL2NsaXF6JztcbmltcG9ydCBSZXNvdXJjZUxvYWRlciBmcm9tICdjb3JlL3Jlc291cmNlLWxvYWRlcic7XG5pbXBvcnQgY29yZSBmcm9tICdjb3JlL2JhY2tncm91bmQnO1xuaW1wb3J0IENvb2tpZUNoZWNrZXIgZnJvbSAnYW50aXRyYWNraW5nL2Nvb2tpZS1jaGVja2VyJztcbmltcG9ydCBUcmFja2VyUHJveHkgZnJvbSAnYW50aXRyYWNraW5nL3RyYWNrZXItcHJveHknO1xuaW1wb3J0IHsgY29tcHJlc3Npb25BdmFpbGFibGUsIHNwbGl0VGVsZW1ldHJ5RGF0YSwgY29tcHJlc3NKU09OVG9CYXNlNjQsIGdlbmVyYXRlUGF5bG9hZCB9IGZyb20gJ2FudGl0cmFja2luZy91dGlscyc7XG5pbXBvcnQge1ByaXZhY3lTY29yZX0gZnJvbSAnYW50aXRyYWNraW5nL3ByaXZhY3ktc2NvcmUnO1xuaW1wb3J0ICogYXMgYnJvd3NlciBmcm9tICdwbGF0Zm9ybS9icm93c2VyJztcbmltcG9ydCBXZWJSZXF1ZXN0IGZyb20gJ2NvcmUvd2VicmVxdWVzdCc7XG5pbXBvcnQgdGVsZW1ldHJ5IGZyb20gJ2FudGl0cmFja2luZy90ZWxlbWV0cnknO1xuXG52YXIgY291bnRSZWxvYWQgPSBmYWxzZTtcblxuZnVuY3Rpb24gb25VcmxiYXJGb2N1cygpe1xuICAgIGNvdW50UmVsb2FkID0gdHJ1ZTtcbn1cblxuLyoqXG4gKiBBZGQgcGFkZGluZyBjaGFyYWN0ZXJzIHRvIHRoZSBsZWZ0IG9mIHRoZSBnaXZlbiBzdHJpbmcuXG4gKlxuICogQHBhcmFtIHtzdHJpbmd9IHN0ciAgLSBvcmlnaW5hbCBzdHJpbmcuXG4gKiBAcGFyYW0ge3N0cmluZ30gY2hhciAtIGNoYXIgdXNlZCBmb3IgcGFkZGluZyB0aGUgc3RyaW5nLlxuICogQHBhcmFtIHtudW1iZXJ9IHNpemUgLSBkZXNpcmVkIHNpemUgb2YgdGhlIHJlc3VsdGluZyBzdHJpbmcgKGFmdGVyIHBhZGRpbmcpXG4qKi9cbmZ1bmN0aW9uIGxlZnRwYWQoc3RyLCBjaGFyLCBzaXplKSB7XG4gIC8vIFRoaXMgZnVuY3Rpb24gb25seSBtYWtlcyBzZW5zIGlmIGBjaGFyYCBpcyBhIGNoYXJhY3Rlci5cbiAgaWYgKGNoYXIubGVuZ3RoICE9IDEpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoXCJgY2hhcmAgYXJndW1lbnQgbXVzdCBvbmx5IGNvbnRhaW4gb25lIGNoYXJhY3RlclwiKTtcbiAgfVxuXG4gIGlmIChzdHIubGVuZ3RoID49IHNpemUpIHtcbiAgICByZXR1cm4gc3RyO1xuICB9XG4gIGVsc2Uge1xuICAgIHJldHVybiAoY2hhci5yZXBlYXQoc2l6ZSAtIHN0ci5sZW5ndGgpICsgc3RyKTtcbiAgfVxufVxuXG4vKipcbiAqIFJlbW92ZSBhbnkgdHJhY2Ugb2Ygc291cmNlIGRvbWFpbnMsIG9yIGhhc2hlcyBvZiBzb3VyY2UgZG9tYWluc1xuICogZnJvbSB0aGUgZGF0YSB0byBiZSBzZW50IHRvIHRoZSBiYWNrZW5kLiBUaGlzIGlzIG1hZGUgdG8gZW5zdXJlXG4gKiB0aGVyZSBpcyBubyB3YXkgdG8gYmFja3RyYWNrIHRvIHVzZXIncyBoaXN0b3J5IHVzaW5nIGRhdGEgc2VudCB0b1xuICogdGhlIGJhY2tlbmQuXG4gKlxuICogUmVwbGFjZSBhbGwgdGhlIGtleXMgb2YgYHRyYWNrZXJEYXRhYCAod2hpY2ggYXJlIDE2LWNoYXJzIHByZWZpeGVzIG9mXG4gKiBoYXNoIG9mIHRoZSBzb3VyY2UgZG9tYWluKSBieSB1bmlxdWUgcmFuZG9tIHN0cmluZ3Mgb2Ygc2l6ZSAxNiAod2hpY2ggaXNcbiAqIGV4cGVjdGVkIGJ5IGJhY2tlbmQpLiBXZSBkb24ndCBoYXZlIHRvIG1ha2UgdGhlbSB1bmlxdWUgYW1vbmcgYWxsIGRhdGEsXG4gKiBpdCBpcyBlbm91Z2ggdG8gZW5zdXJlIHVuaWNpdHkgb24gYSBwZXItdHJhY2tlciBiYXNpcy5cbiAqXG4gKiBAcGFyYW0ge09iamVjdH0gdHJhY2tlckRhdGEgLSBhc3NvY2lhdGUgc291cmNlIGRvbWFpbnMgdG8ga2V5L3ZhbHVlIHBhaXJzLlxuKiovXG5mdW5jdGlvbiBhbm9ueW1pemVUcmFja2VyVG9rZW5zKHRyYWNrZXJEYXRhKSB7XG4gIC8vIFJhbmRvbSBiYXNlIGlkXG4gIGNvbnN0IG1pbiA9IDE7XG4gIGNvbnN0IG1heCA9IE51bWJlci5NQVhfU0FGRV9JTlRFR0VSO1xuICBsZXQgcmFuZElkID0gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKG1heCAtIG1pbiArIDEpKSArIG1pbjtcblxuICAvLyBBbm9ueW1pemUgdGhlIGdpdmVuIHRyYWNrZXIgZGF0YVxuICBsZXQgYW5vbnltaXplZFRyYWNrZXJEYXRhID0ge307XG5cbiAgZm9yIChsZXQgb3JpZ2luYWxLZXkgaW4gdHJhY2tlckRhdGEpIHtcbiAgICBjb25zdCBuZXdSYW5kb21LZXkgPSBsZWZ0cGFkKHJhbmRJZC50b1N0cmluZygpLnN1YnN0cigwLCAxNiksICcwJywgMTYpO1xuICAgIHJhbmRJZCA9IChyYW5kSWQgKyAxKSAlIG1heDtcbiAgICBhbm9ueW1pemVkVHJhY2tlckRhdGFbbmV3UmFuZG9tS2V5XSA9IHRyYWNrZXJEYXRhW29yaWdpbmFsS2V5XTtcbiAgfVxuXG4gIHJldHVybiBhbm9ueW1pemVkVHJhY2tlckRhdGE7XG59XG5cbnZhciBDbGlxekF0dHJhY2sgPSB7XG4gICAgVkVSU0lPTjogJzAuOTYnLFxuICAgIE1JTl9CUk9XU0VSX1ZFUlNJT046IDM1LFxuICAgIExPR19LRVk6ICdhdHRyYWNrJyxcbiAgICBWRVJTSU9OQ0hFQ0tfVVJMOiAnaHR0cHM6Ly9jZG4uY2xpcXouY29tL2FudGktdHJhY2tpbmcvd2hpdGVsaXN0L3ZlcnNpb25jaGVjay5qc29uJyxcbiAgICBVUkxfQUxFUlRfUlVMRVM6ICdjaHJvbWU6Ly9jbGlxei9jb250ZW50L2FudGktdHJhY2tpbmctcnVsZXMuanNvbicsXG4gICAgVVJMX0JMT0NLX1JVTEVTOiAnaHR0cHM6Ly9jZG4uY2xpcXouY29tL2FudGktdHJhY2tpbmcvd2hpdGVsaXN0L2FudGktdHJhY2tpbmctYmxvY2stcnVsZXMuanNvbicsXG4gICAgRU5BQkxFX1BSRUY6ICdhbnRpVHJhY2tUZXN0JyxcbiAgICBkZWJ1ZzogZmFsc2UsXG4gICAgbXNnVHlwZTonYXR0cmFjaycsXG4gICAgdGltZUNsZWFuaW5nQ2FjaGU6IDE4MCoxMDAwLFxuICAgIHRpbWVBZnRlckxpbms6IDUqMTAwMCxcbiAgICB0aW1lQWN0aXZlOiAyMCoxMDAwLFxuICAgIHRpbWVCb290dXA6IDEwKjEwMDAsXG4gICAgYm9vdHVwVGltZTogRGF0ZS5ub3coKSxcbiAgICBib290aW5nVXA6IHRydWUsXG4gICAgd2hpdGVsaXN0OiBudWxsLFxuICAgIG9ic0NvdW50ZXI6IHt9LFxuICAgIHNpbWlsYXJBZGRvbjogZmFsc2UsXG4gICAgYmxvY2tpbmdGYWlsZWQ6e30sXG4gICAgdHJhY2tSZWxvYWQ6e30sXG4gICAgcmVsb2FkV2hpdGVMaXN0Ont9LFxuICAgIHRva2VuRG9tYWluQ291bnRUaHJlc2hvbGQ6IDIsXG4gICAgc2FmZUtleUV4cGlyZTogNyxcbiAgICBsb2NhbEJsb2NrRXhwaXJlOiAyNCxcbiAgICBzaG9ydFRva2VuTGVuZ3RoOiA4LFxuICAgIHNhZmVrZXlWYWx1ZXNUaHJlc2hvbGQ6IDQsXG4gICAgY0NoZWNrZXI6IG5ldyBDb29raWVDaGVja2VyKCksXG4gICAgcXNCbG9ja1J1bGU6IG51bGwsICAvLyBsaXN0IG9mIGRvbWFpbnMgc2hvdWxkIGJlIGJsb2NrZWQgaW5zdGVhZCBvZiBzaHVmZmxpbmdcbiAgICBibG9ja2VkOiBudWxsLCAgLy8gbG9nIHdoYXQncyBiZWVuIGJsb2NrZWRcbiAgICBwbGFjZUhvbGRlcjogJycsXG4gICAgdHBfZXZlbnRzOiB0cF9ldmVudHMsXG4gICAgdG9rZW5zOiBudWxsLFxuICAgIGluc3RhbnRUb2tlbkNhY2hlOiB7fSxcbiAgICByZXF1ZXN0S2V5VmFsdWU6IG51bGwsXG4gICAgcmVjZW50bHlNb2RpZmllZDogbmV3IFRlbXBTZXQoKSxcbiAgICBjbGlxekhlYWRlcjogJ0NMSVFaLUFudGlUcmFja2luZycsXG4gICAgcmVwbGFjZW1lbnQ6IFwiXCIsXG4gICAgb2JmdXNjYXRlOiBmdW5jdGlvbihzLCBtZXRob2QsIHJlcGxhY2VtZW50KSB7XG4gICAgICAgIC8vIHVzZWQgd2hlbiBhY3Rpb24gIT0gJ2Jsb2NrJ1xuICAgICAgICAvLyBkZWZhdWx0IGlzIGEgcGxhY2Vob2xkZXJcbiAgICAgICAgc3dpdGNoKG1ldGhvZCkge1xuICAgICAgICBjYXNlICdlbXB0eSc6XG4gICAgICAgICAgICByZXR1cm4gJyc7XG4gICAgICAgIGNhc2UgJ3JlcGxhY2UnOlxuICAgICAgICAgICAgcmV0dXJuIHNodWZmbGUocyk7XG4gICAgICAgIGNhc2UgJ3NhbWUnOlxuICAgICAgICAgICAgcmV0dXJuIHM7XG4gICAgICAgIGNhc2UgJ3BsYWNlaG9sZGVyJzpcbiAgICAgICAgICAgIHJldHVybiBDbGlxekF0dHJhY2sucGxhY2VIb2xkZXI7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICByZXR1cm4gQ2xpcXpBdHRyYWNrLnBsYWNlSG9sZGVyO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBib290dXBXaGl0ZWxpc3RDYWNoZToge30sXG4gICAgYmxvY2tlZENhY2hlOiB7fSxcbiAgICB2aXNpdENhY2hlOiB7fSxcbiAgICBjb250ZXh0T2F1dGg6IHt9LFxuICAgIGxpbmtzRnJvbURvbToge30sXG4gICAgY29va2llc0Zyb21Eb206IHt9LFxuICAgIGxvYWRlZFRhYnM6IHt9LFxuICAgIGdldEJyb3dzZXJNYWpvclZlcnNpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHZhciBhcHBJbmZvID0gQ29tcG9uZW50cy5jbGFzc2VzW1wiQG1vemlsbGEub3JnL3hyZS9hcHAtaW5mbzsxXCJdXG4gICAgICAgICAgICAgICAgICAgICAgICAgIC5nZXRTZXJ2aWNlKENvbXBvbmVudHMuaW50ZXJmYWNlcy5uc0lYVUxBcHBJbmZvKTtcbiAgICAgICAgICByZXR1cm4gcGFyc2VJbnQoYXBwSW5mby52ZXJzaW9uLnNwbGl0KCcuJylbMF0pO1xuICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAvLyBmYWxsYmFjayBmb3Igd2hlbiBubyB2ZXJzaW9uIEFQSVxuICAgICAgICAgIHJldHVybiAxMDA7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGdldFByaXZhdGVWYWx1ZXM6IGZ1bmN0aW9uKHdpbmRvdykge1xuICAgICAgICAvLyBjcmVhdGVzIGEgbGlzdCBvZiByZXR1cm4gdmFsdWVzIG9mIGZ1bmN0aW9ucyBtYXkgbGVhayBwcml2YXRlIGluZm9cbiAgICAgICAgdmFyIHAgPSB7fTtcbiAgICAgICAgLy8gdmFyIG5hdmlnYXRvciA9IENsaXF6VXRpbHMuZ2V0V2luZG93KCkubmF2aWdhdG9yO1xuICAgICAgICB2YXIgbmF2aWdhdG9yID0gd2luZG93Lm5hdmlnYXRvcjtcbiAgICAgICAgLy8gcGx1Z2luc1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG5hdmlnYXRvci5wbHVnaW5zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbmFtZSA9IG5hdmlnYXRvci5wbHVnaW5zW2ldLm5hbWU7XG4gICAgICAgICAgICBpZiAobmFtZS5sZW5ndGggPj0gOCkge1xuICAgICAgICAgICAgICAgIHBbbmFtZV0gPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIENsaXF6QXR0cmFjay5wcml2YXRlVmFsdWVzID0gcDtcbiAgICB9LFxuICAgIGdldENvb2tpZVZhbHVlczogZnVuY3Rpb24oYywgdXJsKSB7XG4gICAgICAgIGlmIChjID09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB7fTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgdiA9IDAsIGNvb2tpZXMgPSB7fTtcbiAgICAgICAgaWYgKGMubWF0Y2goL15cXHMqXFwkVmVyc2lvbj0oPzpcIjFcInwxKTtcXHMqKC4qKS8pKSB7XG4gICAgICAgICAgICBjID0gUmVnRXhwLiQxO1xuICAgICAgICAgICAgdiA9IDE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHYgPT09IDApIHtcbiAgICAgICAgICAgIGMuc3BsaXQoL1ssO10vKS5tYXAoZnVuY3Rpb24oY29va2llKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhcnRzID0gY29va2llLnNwbGl0KC89Lyk7XG4gICAgICAgICAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA+IDEpIHBhcnRzWzFdID0gcGFydHMuc2xpY2UoMSkuam9pbignPScpO1xuICAgICAgICAgICAgICAgIHZhciBuYW1lID0gZFVSSUMocGFydHNbMF0udHJpbUxlZnQoKSksXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gcGFydHMubGVuZ3RoID4gMSA/IGRVUklDKHBhcnRzWzFdLnRyaW1SaWdodCgpKSA6IG51bGw7XG4gICAgICAgICAgICAgICAgY29va2llc1tuYW1lXSA9IHZhbHVlO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjLm1hdGNoKC8oPzpefFxccyspKFshIyQlJicqK1xcLS4wLTlBLVpeYGEtenx+XSspPShbISMkJSYnKitcXC0uMC05QS1aXmBhLXp8fl0qfFwiKD86W1xceDIwLVxceDdFXFx4ODBcXHhGRl18XFxcXFtcXHgwMC1cXHg3Rl0pKlwiKSg/PVxccypbLDtdfCQpL2cpLm1hcChmdW5jdGlvbigkMCwgJDEpIHtcbiAgICAgICAgICAgIHZhciBuYW1lID0gJDAsXG4gICAgICAgICAgICAgICAgdmFsdWUgPSAkMS5jaGFyQXQoMCkgPT09ICdcIidcbiAgICAgICAgICAgICAgICAgICAgICAgICAgPyAkMS5zdWJzdHIoMSwgLTEpLnJlcGxhY2UoL1xcXFwoLikvZywgXCIkMVwiKVxuICAgICAgICAgICAgICAgICAgICAgICAgICA6ICQxO1xuICAgICAgICAgICAgICAgIGNvb2tpZXNbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIC8vIHJldHVybiBjb29raWVzO1xuICAgICAgICB2YXIgY29va2llVmFsID0ge307XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBjb29raWVzKSB7XG4gICAgICAgICAgICBpZiAodXJsLmluZGV4T2YoY29va2llc1trZXldKSA9PSAtMSkgeyAvLyBjb29raWVzIHNhdmUgYXMgcGFydCBvZiB0aGUgdXJsIGlzIGFsbG93ZWRcbiAgICAgICAgICAgICAgICBjb29raWVWYWxbY29va2llc1trZXldXSA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGNvb2tpZVZhbDtcbiAgICB9LFxuICAgIGh0dHBvcGVuT2JzZXJ2ZXI6IHtcbiAgICAgICAgb2JzZXJ2ZSA6IGZ1bmN0aW9uKHJlcXVlc3REZXRhaWxzKSB7XG4gICAgICAgICAgICBpZiAoIUNsaXF6QXR0cmFjay5xc193aGl0ZWxpc3QuaXNSZWFkeSgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgcmVxdWVzdENvbnRleHQgPSBuZXcgSHR0cFJlcXVlc3RDb250ZXh0KHJlcXVlc3REZXRhaWxzKTtcbiAgICAgICAgICAgIHZhciB1cmwgPSByZXF1ZXN0Q29udGV4dC51cmw7XG4gICAgICAgICAgICBpZiAoIXVybCB8fCB1cmwgPT0gJycpIHJldHVybjtcbiAgICAgICAgICAgIHZhciB1cmxfcGFydHMgPSBVUkxJbmZvLmdldCh1cmwpO1xuXG4gICAgICAgICAgICBpZiAocmVxdWVzdENvbnRleHQuaXNGdWxsUGFnZSgpKSB7XG4gICAgICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLnRwX2V2ZW50cy5vbkZ1bGxQYWdlKHVybF9wYXJ0cywgcmVxdWVzdENvbnRleHQuZ2V0T3V0ZXJXaW5kb3dJRCgpKTtcbiAgICAgICAgICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmlzVHJhY2tlclR4dEVuYWJsZWQoKSkge1xuICAgICAgICAgICAgICAgICAgICBUcmFja2VyVFhULmdldCh1cmxfcGFydHMpLnVwZGF0ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBDbGlxekF0dHJhY2suYmxvY2tMb2cuaW5jcmVtZW50TG9hZGVkUGFnZXMoKTtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGZpbmQgdGhlIG9rIHRva2VucyBmaWVsZHNcbiAgICAgICAgICAgIHZhciBpc1ByaXZhdGUgPSByZXF1ZXN0Q29udGV4dC5pc0NoYW5uZWxQcml2YXRlKCk7XG4gICAgICAgICAgICBpZiAoIWlzUHJpdmF0ZSkge1xuICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay5leGFtaW5lVG9rZW5zKHVybF9wYXJ0cyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIFRoaXMgbmVlZHMgdG8gYmUgYSBjb21tb24gZnVuY3Rpb24gYXN3ZWxsLiBBbHNvIGNvbnNpZGVyIGdldHRpbmcgT1JJR0lOIGhlYWRlci5cbiAgICAgICAgICAgIHZhciByZWZlcnJlciA9IHJlcXVlc3RDb250ZXh0LmdldFJlZmVycmVyKCk7XG4gICAgICAgICAgICB2YXIgc2FtZV9nZCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAvLyBXZSBuZWVkIHRvIGdldCB0aGUgc291cmNlIGZyb20gd2hlcmUgdGhlIHJlcXVlc3Qgb3JpZ2luYXRlZC5cbiAgICAgICAgICAgIC8vIFRoZXJlIGFyZSB0d28gd2F5cyBpbiB3aGljaCB3ZSBjYW4gZ2V0IGl0LlxuICAgICAgICAgICAgLy8gMS4gaGVhZGVyIC0+IFJFRkVSUkVSXG4gICAgICAgICAgICAvLyAyLiBHZXQgc291cmNlIHVybC5cbiAgICAgICAgICAgIC8vIDMuIGhlYWRlciAtPiBPUklHSU4gKFRoaXMgbmVlZHMgdG8gYmUgaW52ZXN0aWdhdGVkLilcblxuICAgICAgICAgICAgdmFyIHNvdXJjZV91cmwgPSByZXF1ZXN0Q29udGV4dC5nZXRMb2FkaW5nRG9jdW1lbnQoKSxcbiAgICAgICAgICAgICAgICBzb3VyY2VfdXJsX3BhcnRzID0gbnVsbCxcbiAgICAgICAgICAgICAgICBzb3VyY2VfdGFiID0gcmVxdWVzdENvbnRleHQuZ2V0T3JpZ2luV2luZG93SUQoKTtcblxuICAgICAgICAgICAgdmFyIHBhZ2VfbG9hZF90eXBlID0gbnVsbDtcbiAgICAgICAgICAgIHZhciByZXF1ZXN0X3R5cGUgPSBudWxsO1xuICAgICAgICAgICAgc3dpdGNoKHJlcXVlc3RDb250ZXh0LmdldENvbnRlbnRQb2xpY3lUeXBlKCkpIHtcbiAgICAgICAgICAgICAgICBjYXNlIDY6XG4gICAgICAgICAgICAgICAgICAgIHBhZ2VfbG9hZF90eXBlID0gXCJmdWxscGFnZVwiO1xuICAgICAgICAgICAgICAgICAgICByZXF1ZXN0X3R5cGUgPSBcImZ1bGxwYWdlXCI7XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgNzogcGFnZV9sb2FkX3R5cGUgPSBcImZyYW1lXCI7IGJyZWFrO1xuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHBhZ2VfbG9hZF90eXBlID0gbnVsbDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChzb3VyY2VfdXJsID09ICcnIHx8IHNvdXJjZV91cmwuaW5kZXhPZignYWJvdXQ6Jyk9PTApIHJldHVybjtcbiAgICAgICAgICAgIGlmKHBhZ2VfbG9hZF90eXBlID09ICdmdWxscGFnZScpIHJldHVybjtcblxuICAgICAgICAgICAgLy8gbW9kaWZ5IG9yIGNhbmNlbCB0aGUgaHR0cCByZXF1ZXN0IGlmIHRoZSB1cmwgY29udGFpbnMgcGVyc29uYWwgaWRlbnRpZmllclxuICAgICAgICAgICAgLy8gTm93IHJlZnN0ciBzaG91bGQgbm90IGJlIG51bGwsIGJ1dCBzdGlsbCBrZWVwaW5nIHRoZSBjbGF1c2UgdG8gY2hlY2sgZnJvbSBlZGdlIGNhc2VzLlxuXG4gICAgICAgICAgICBpZiAoc291cmNlX3VybCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc291cmNlX3VybF9wYXJ0cyA9IFVSTEluZm8uZ2V0KHNvdXJjZV91cmwpO1xuXG4gICAgICAgICAgICAgICAgLy8gc2FtZSBnZW5lcmFsIGRvbWFpblxuICAgICAgICAgICAgICAgIHNhbWVfZ2QgPSBzYW1lR2VuZXJhbERvbWFpbih1cmxfcGFydHMuaG9zdG5hbWUsIHNvdXJjZV91cmxfcGFydHMuaG9zdG5hbWUpIHx8IGZhbHNlO1xuICAgICAgICAgICAgICAgIGlmIChzYW1lX2dkKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gZXh0cmFjdCBhbmQgc2F2ZSB0b2tlbnNcbiAgICAgICAgICAgICAgICBDbGlxekF0dHJhY2suZXh0cmFjdEtleVRva2Vucyh1cmxfcGFydHMsIHNvdXJjZV91cmxfcGFydHNbJ2hvc3RuYW1lJ10sIGlzUHJpdmF0ZSwgQ2xpcXpBdHRyYWNrLnNhdmVLZXlUb2tlbnMpO1xuICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay5yZWNvcmRMaW5rc0ZvclVSTChzb3VyY2VfdXJsKTtcblxuICAgICAgICAgICAgICAgIHZhciByZWZsaW5rcyA9IENsaXF6QXR0cmFjay5saW5rc0Zyb21Eb21bc291cmNlX3VybF0gfHwge307XG5cbiAgICAgICAgICAgICAgICAvLyB3b3JrIGFyb3VuZCBmb3IgaHR0cHM6Ly9naXRodWIuY29tL2NsaXF6L25hdmlnYXRpb24tZXh0ZW5zaW9uL2lzc3Vlcy8xMjMwXG4gICAgICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay5yZWNlbnRseU1vZGlmaWVkLmNvbnRhaW5zKHNvdXJjZV90YWIgKyB1cmwpKSB7XG4gICAgICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay5yZWNlbnRseU1vZGlmaWVkLmRlbGV0ZShzb3VyY2VfdGFiICsgdXJsKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtjYW5jZWw6IHRydWV9IDtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKHVybCBpbiByZWZsaW5rcykge1xuICAgICAgICAgICAgICAgICAgICBDbGlxekF0dHJhY2sudHBfZXZlbnRzLmluY3JlbWVudFN0YXQocmVxX2xvZywgXCJ1cmxfaW5fcmVmbGlua3NcIik7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBsb2cgdGhpcmQgcGFydHkgcmVxdWVzdFxuICAgICAgICAgICAgICAgIHZhciByZXFfbG9nID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpZih1cmxfcGFydHMuaG9zdG5hbWUgIT0gc291cmNlX3VybF9wYXJ0cy5ob3N0bmFtZSkge1xuICAgICAgICAgICAgICAgICAgICByZXFfbG9nID0gQ2xpcXpBdHRyYWNrLnRwX2V2ZW50cy5nZXQodXJsLCB1cmxfcGFydHMsIHNvdXJjZV91cmwsIHNvdXJjZV91cmxfcGFydHMsIHNvdXJjZV90YWIpO1xuICAgICAgICAgICAgICAgICAgICB0cF9ldmVudHMuaW5jcmVtZW50U3RhdChyZXFfbG9nLCAnYycpO1xuICAgICAgICAgICAgICAgICAgICBpZih1cmxfcGFydHNbJ3F1ZXJ5J10ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHBfZXZlbnRzLmluY3JlbWVudFN0YXQocmVxX2xvZywgJ2hhc19xcycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGlmKHVybF9wYXJ0c1sncGFyYW1ldGVycyddLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRwX2V2ZW50cy5pbmNyZW1lbnRTdGF0KHJlcV9sb2csICdoYXNfcHMnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZih1cmxfcGFydHNbJ2ZyYWdtZW50J10ubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHBfZXZlbnRzLmluY3JlbWVudFN0YXQocmVxX2xvZywgJ2hhc19mcmFnbWVudCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGxldCBjb250ZW50X3R5cGUgPSByZXF1ZXN0Q29udGV4dC5nZXRDb250ZW50UG9saWN5VHlwZSgpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWNvbnRlbnRfdHlwZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLnRwX2V2ZW50cy5pbmNyZW1lbnRTdGF0KHJlcV9sb2csIFwidHlwZV91bmtub3duXCIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLnRwX2V2ZW50cy5pbmNyZW1lbnRTdGF0KHJlcV9sb2csIFwidHlwZV9cIiArIGNvbnRlbnRfdHlwZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAvLyBnZXQgY29va2llIGRhdGFcbiAgICAgICAgICAgICAgICB2YXIgY29va2lldmFsdWUgPSB7fSxcbiAgICAgICAgICAgICAgICAgICAgZG9jQ29va2llID0gJyc7XG4gICAgICAgICAgICAgICAgaWYgKHNvdXJjZV91cmwgaW4gQ2xpcXpBdHRyYWNrLmNvb2tpZXNGcm9tRG9tICYmIENsaXF6QXR0cmFjay5jb29raWVzRnJvbURvbVtzb3VyY2VfdXJsXSkge1xuICAgICAgICAgICAgICAgICAgICBkb2NDb29raWUgPSBDbGlxekF0dHJhY2suY29va2llc0Zyb21Eb21bc291cmNlX3VybF07XG4gICAgICAgICAgICAgICAgICAgIGNvb2tpZXZhbHVlID0gQ2xpcXpBdHRyYWNrLmdldENvb2tpZVZhbHVlcyhkb2NDb29raWUsIHVybCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gdHJ5IHRvIGdldCB0aGUgZG9jdW1lbnQgZnJvbSBzb3VyY2VcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2UubGMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkb2NDb29raWUgPSBzb3VyY2UubGMudG9wV2luZG93LmRvY3VtZW50LmNvb2tpZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoZG9jQ29va2llKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvb2tpZXZhbHVlID0gQ2xpcXpBdHRyYWNrLmdldENvb2tpZVZhbHVlcyhkb2NDb29raWUsIHVybCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29va2llZGF0YSA9IHJlcXVlc3RDb250ZXh0LmdldFJlcXVlc3RIZWFkZXIoJ0Nvb2tpZScpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY29va2llMiA9IENsaXF6QXR0cmFjay5nZXRDb29raWVWYWx1ZXMoY29va2llZGF0YSwgdXJsKTtcbiAgICAgICAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNvb2tpZTIgPSB7fTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBjIGluIGNvb2tpZTIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29va2lldmFsdWVbY10gPSB0cnVlO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBzdGF0cyA9IHt9O1xuICAgICAgICAgICAgICAgIHZhciBiYWRUb2tlbnMgPSBDbGlxekF0dHJhY2suY2hlY2tUb2tlbnModXJsX3BhcnRzLCBzb3VyY2VfdXJsLCBjb29raWV2YWx1ZSwgc3RhdHMsIHNvdXJjZV91cmxfcGFydHMpO1xuICAgICAgICAgICAgICAgIGlmKHJlcV9sb2cpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2F2ZSB0b2tlbiBzdGF0cyB0byB0aGUgbG9nLlxuICAgICAgICAgICAgICAgICAgICBPYmplY3Qua2V5cyhzdGF0cykuZm9yRWFjaChmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHN0YXRzW2tleV0gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHBfZXZlbnRzLmluY3JlbWVudFN0YXQocmVxX2xvZywgJ3Rva2VuLmhhc18nKyBrZXkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRwX2V2ZW50cy5pbmNyZW1lbnRTdGF0KHJlcV9sb2csICd0b2tlbi4nKyBrZXksIHN0YXRzW2tleV0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoYmFkVG9rZW5zLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChDbGlxekF0dHJhY2sudHJhY2tlclByb3h5LmNoZWNrU2hvdWxkUHJveHkodXJsKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHBfZXZlbnRzLmluY3JlbWVudFN0YXQocmVxX2xvZywgJ3Byb3h5Jyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIEJsb2NrIHJlcXVlc3QgYmFzZWQgb24gcnVsZXMgc3BlY2lmaWVkXG4gICAgICAgICAgICAgICAgdmFyIF9rZXkgPSBzb3VyY2VfdGFiICsgXCI6XCIgKyBzb3VyY2VfdXJsO1xuICAgICAgICAgICAgICAgIGlmIChDbGlxekF0dHJhY2suaXNRU0VuYWJsZWQoKSAmJiAhKENsaXF6QXR0cmFjay5yZWxvYWRXaGl0ZUxpc3RbX2tleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgQ2xpcXpBdHRyYWNrLnFzQmxvY2tSdWxlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc1J1bGUgPSBDbGlxekF0dHJhY2sucXNCbG9ja1J1bGVbaV1bMF0sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdVJ1bGUgPSBDbGlxekF0dHJhY2sucXNCbG9ja1J1bGVbaV1bMV07XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoc291cmNlX3VybF9wYXJ0cy5ob3N0bmFtZS5lbmRzV2l0aChzUnVsZSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmxfcGFydHMuaG9zdG5hbWUuZW5kc1dpdGgodVJ1bGUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHBfZXZlbnRzLmluY3JlbWVudFN0YXQocmVxX2xvZywgJ3JlcV9ydWxlX2Fib3J0ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge2NhbmNlbDogdHJ1ZX07XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZihiYWRUb2tlbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICB0cF9ldmVudHMuaW5jcmVtZW50U3RhdChyZXFfbG9nLCAnYmFkX3FzJyk7XG4gICAgICAgICAgICAgICAgICAgIHRwX2V2ZW50cy5pbmNyZW1lbnRTdGF0KHJlcV9sb2csICdiYWRfdG9rZW5zJywgYmFkVG9rZW5zLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gYWx0ZXJpbmcgcmVxdWVzdFxuICAgICAgICAgICAgICAgIC8vIEFkZGl0aW9uYWwgY2hlY2sgdG8gdmVyaWZ5IGlmIHRoZSB1c2VyIHJlbG9hZGVkIHRoZSBwYWdlLlxuICAgICAgICAgICAgICAgIGlmIChDbGlxekF0dHJhY2suaXNRU0VuYWJsZWQoKSAmJiAhKENsaXF6QXR0cmFjay5yZWxvYWRXaGl0ZUxpc3RbX2tleV0pKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay5pc1NvdXJjZVdoaXRlbGlzdGVkKHNvdXJjZV91cmxfcGFydHMuaG9zdG5hbWUpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDbGlxekF0dHJhY2sudHBfZXZlbnRzLmluY3JlbWVudFN0YXQocmVxX2xvZywgXCJzb3VyY2Vfd2hpdGVsaXN0ZWRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmRlYnVnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDbGlxelV0aWxzLmxvZyhcImFsdGVyaW5nIHJlcXVlc3QgXCIgKyB1cmwgKyBcIiBcIiArIHNvdXJjZV91cmwgKyAnICcgKyBzYW1lX2dkLCAndG9raycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5sb2coJ2JhZCB0b2tlbnM6ICcgKyBKU09OLnN0cmluZ2lmeShiYWRUb2tlbnMpLCAndG9raycpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKGJhZFRva2Vucy5sZW5ndGggPiAwICYmIENsaXF6QXR0cmFjay5xc193aGl0ZWxpc3QuaXNVcFRvRGF0ZSgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBkZXRlcm1pbiBhY3Rpb24gYmFzZWQgb24gdHJhY2tlci50eHRcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBydWxlID0gQ2xpcXpBdHRyYWNrLmdldERlZmF1bHRSdWxlKCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX3RyYWNrZXJUeHQgPSBUcmFja2VyVFhULmdldChzb3VyY2VfdXJsX3BhcnRzKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghQ2xpcXpBdHRyYWNrLmlzRm9yY2VCbG9ja0VuYWJsZWQoKSAmJiBDbGlxekF0dHJhY2suaXNUcmFja2VyVHh0RW5hYmxlZCgpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKF90cmFja2VyVHh0Lmxhc3RfdXBkYXRlID09PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFRoZSBmaXJzdCB1cGRhdGUgaXMgbm90IHJlYWR5IHlldCBmb3IgdGhpcyBmaXJzdCBwYXJ0eSwgYWxsb3cgaXRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdHBfZXZlbnRzLmluY3JlbWVudFN0YXQocmVxX2xvZywgJ3RyYWNrZXIudHh0X25vdF9yZWFkeScgKyBydWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBydWxlID0gX3RyYWNrZXJUeHQuZ2V0UnVsZSh1cmxfcGFydHMuaG9zdG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJ1bGUgPT0gJ2Jsb2NrJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRwX2V2ZW50cy5pbmNyZW1lbnRTdGF0KHJlcV9sb2csICd0b2tlbl9ibG9ja2VkXycgKyBydWxlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge2NhbmNlbDogdHJ1ZX1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIHRtcF91cmwgPSByZXF1ZXN0Q29udGV4dC51cmw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBiYWRUb2tlbnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHRtcF91cmwuaW5kZXhPZihiYWRUb2tlbnNbaV0pIDwgMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFkVG9rZW5zW2ldID0gZW5jb2RlVVJJQ29tcG9uZW50KGJhZFRva2Vuc1tpXSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0bXBfdXJsID0gdG1wX3VybC5yZXBsYWNlKGJhZFRva2Vuc1tpXSwgQ2xpcXpBdHRyYWNrLm9iZnVzY2F0ZShiYWRUb2tlbnNbaV0sIHJ1bGUsIENsaXF6QXR0cmFjay5yZXBsYWNlbWVudCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEluIGNhc2UgdW5zYWZlIHRva2VucyB3ZXJlIGluIHRoZSBob3N0bmFtZSwgdGhlIFVSSSBpcyBub3QgdmFsaWRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBhbnltb3JlIGFuZCB3ZSBjYW4gY2FuY2VsIHRoZSByZXF1ZXN0LlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICghdG1wX3VybC5zdGFydHNXaXRoKHVybF9wYXJ0cy5wcm90b2NvbCArICc6Ly8nICsgdXJsX3BhcnRzLmhvc3RuYW1lKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHtjYW5jZWw6IHRydWV9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHBfZXZlbnRzLmluY3JlbWVudFN0YXQocmVxX2xvZywgJ3Rva2VuX2Jsb2NrZWRfJyArIHJ1bGUpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay50cmFja2VyUHJveHkuY2hlY2tTaG91bGRQcm94eSh0bXBfdXJsKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cF9ldmVudHMuaW5jcmVtZW50U3RhdChyZXFfbG9nLCAncHJveHknKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLnJlY2VudGx5TW9kaWZpZWQuYWRkKHNvdXJjZV90YWIgKyB1cmwsIDMwMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVkaXJlY3RVcmw6IHRtcF91cmwsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0SGVhZGVyczogcnVsZSAhPSAnc2FtZScgPyBbe25hbWU6IENsaXF6QXR0cmFjay5jbGlxekhlYWRlciwgdmFsdWU6ICcgJ31dIDogdW5kZWZpbmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBubyByZWZzdHI6IG1pZ2h0IGJlIGFibGUgdG8gZ2V0IGEgcmVmZXJyZXIgZnJvbSBsb2FkIGNvbnRleHQgdG8gdmVyaWZ5IGlmIGZhdmljb24gb3IgZXh0ZW5zaW9uIHJlcXVlc3RcbiAgICAgICAgICAgICAgICAvLyBOb3cgdGhpcyBzaG91bGQgbm90IGhhcHBlbi4gS2VlcGluZyB0aGUgY29kZSBibG9jayBmb3Igbm93LiBXaWxsIHJlbW92ZSBpdCBhZnRlciBtb3JlIHRlc3RpbmcuXG4gICAgICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay5kZWJ1ZykgQ2xpcXpVdGlscy5sb2coXCJUSElTIENBTEwgRElEIE5PVCBIQVZFIEEgUkVGXCIsXCJub19yZWZzdHJcIik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGh0dHBSZXNwb25zZU9ic2VydmVyOiB7XG4gICAgICAgIG9ic2VydmU6IGZ1bmN0aW9uKHJlcXVlc3REZXRhaWxzKSB7XG4gICAgICAgICAgICBpZiAoIUNsaXF6QXR0cmFjay5xc193aGl0ZWxpc3QuaXNSZWFkeSgpKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIHJlcXVlc3RDb250ZXh0ID0gbmV3IEh0dHBSZXF1ZXN0Q29udGV4dChyZXF1ZXN0RGV0YWlscyksXG4gICAgICAgICAgICAgICAgdXJsID0gcmVxdWVzdENvbnRleHQudXJsO1xuXG4gICAgICAgICAgICBpZiAoIXVybCkgcmV0dXJuO1xuICAgICAgICAgICAgdmFyIHVybF9wYXJ0cyA9IFVSTEluZm8uZ2V0KHVybCk7XG4gICAgICAgICAgICB2YXIgcmVmZXJyZXIgPSByZXF1ZXN0Q29udGV4dC5nZXRSZWZlcnJlcigpO1xuICAgICAgICAgICAgdmFyIHNhbWVfZ2QgPSBmYWxzZTtcblxuICAgICAgICAgICAgdmFyIHNvdXJjZV91cmwgPSByZXF1ZXN0Q29udGV4dC5nZXRMb2FkaW5nRG9jdW1lbnQoKSxcbiAgICAgICAgICAgICAgICBzb3VyY2VfdXJsX3BhcnRzID0gbnVsbCxcbiAgICAgICAgICAgICAgICBzb3VyY2VfdGFiID0gcmVxdWVzdENvbnRleHQuZ2V0T3JpZ2luV2luZG93SUQoKTtcblxuICAgICAgICAgICAgLy8gZnVsbCBwYWdlXG4gICAgICAgICAgICBpZiAocmVxdWVzdENvbnRleHQuaXNGdWxsUGFnZSgpKSB7XG4gICAgICAgICAgICAgICAgaWYgKFszMDAsIDMwMSwgMzAyLCAzMDMsIDMwN10uaW5kZXhPZihyZXF1ZXN0Q29udGV4dC5jaGFubmVsLnJlc3BvbnNlU3RhdHVzKSA+PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHJlZGlyZWN0LCB1cGRhdGUgbG9jYXRpb24gZm9yIHRhYlxuICAgICAgICAgICAgICAgICAgICAvLyBpZiBubyByZWRpcmVjdCBsb2NhdGlvbiBzZXQsIHN0YWdlIHRoZSB0YWIgaWQgc28gd2UgZG9uJ3QgZ2V0IGZhbHNlIGRhdGFcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlZGlyZWN0X3VybCA9IHJlcXVlc3RDb250ZXh0LmdldFJlc3BvbnNlSGVhZGVyKFwiTG9jYXRpb25cIik7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZWRpcmVjdF91cmxfcGFydHMgPSBVUkxJbmZvLmdldChyZWRpcmVjdF91cmwpO1xuICAgICAgICAgICAgICAgICAgICAvLyBpZiByZWRpcmVjdCBpcyByZWxhdGl2ZSwgdXNlIHNvdXJjZSBkb21haW5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCFyZWRpcmVjdF91cmxfcGFydHMuaG9zdG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZGlyZWN0X3VybF9wYXJ0cy5ob3N0bmFtZSA9IHVybF9wYXJ0cy5ob3N0bmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlZGlyZWN0X3VybF9wYXJ0cy5wYXRoID0gcmVkaXJlY3RfdXJsO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay50cF9ldmVudHMub25SZWRpcmVjdChyZWRpcmVjdF91cmxfcGFydHMsIHJlcXVlc3RDb250ZXh0LmdldE91dGVyV2luZG93SUQoKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHNvdXJjZV91cmwgPT0gJycgfHwgc291cmNlX3VybC5pbmRleE9mKCdhYm91dDonKT09MCkgcmV0dXJuO1xuXG4gICAgICAgICAgICBpZiAoc291cmNlX3VybCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgc291cmNlX3VybF9wYXJ0cyA9IFVSTEluZm8uZ2V0KHNvdXJjZV91cmwpO1xuICAgICAgICAgICAgICAgIC8vIGV4dHJhY3QgYW5kIHNhdmUgdG9rZW5zXG4gICAgICAgICAgICAgICAgc2FtZV9nZCA9IHNhbWVHZW5lcmFsRG9tYWluKHVybF9wYXJ0cy5ob3N0bmFtZSwgc291cmNlX3VybF9wYXJ0cy5ob3N0bmFtZSkgfHwgZmFsc2U7XG4gICAgICAgICAgICAgICAgaWYgKHNhbWVfZ2QpIHJldHVybjtcblxuICAgICAgICAgICAgICAgIGlmKHVybF9wYXJ0cy5ob3N0bmFtZSAhPSBzb3VyY2VfdXJsX3BhcnRzLmhvc3RuYW1lKVxuICAgICAgICAgICAgICAgICAgICB2YXIgcmVxX2xvZyA9IENsaXF6QXR0cmFjay50cF9ldmVudHMuZ2V0KHVybCwgdXJsX3BhcnRzLCBzb3VyY2VfdXJsLCBzb3VyY2VfdXJsX3BhcnRzLCBzb3VyY2VfdGFiKTtcbiAgICAgICAgICAgICAgICBpZiAocmVxX2xvZykge1xuICAgICAgICAgICAgICAgICAgICB0cF9ldmVudHMuaW5jcmVtZW50U3RhdChyZXFfbG9nLCAncmVzcF9vYicpO1xuICAgICAgICAgICAgICAgICAgICB0cF9ldmVudHMuaW5jcmVtZW50U3RhdChyZXFfbG9nLCAnY29udGVudF9sZW5ndGgnLCBwYXJzZUludChyZXF1ZXN0Q29udGV4dC5nZXRSZXNwb25zZUhlYWRlcignQ29udGVudC1MZW5ndGgnKSkgfHwgMCk7XG4gICAgICAgICAgICAgICAgICAgIHRwX2V2ZW50cy5pbmNyZW1lbnRTdGF0KHJlcV9sb2csIGBzdGF0dXNfJHtyZXF1ZXN0Q29udGV4dC5jaGFubmVsLnJlc3BvbnNlU3RhdHVzfWApO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIGlzIGNhY2hlZD9cbiAgICAgICAgICAgICAgICBsZXQgY2FjaGVkID0gcmVxdWVzdENvbnRleHQuaXNDYWNoZWQ7XG4gICAgICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLnRwX2V2ZW50cy5pbmNyZW1lbnRTdGF0KHJlcV9sb2csIGNhY2hlZCA/ICdjYWNoZWQnIDogJ25vdF9jYWNoZWQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgaHR0cG1vZE9ic2VydmVyOiB7XG4gICAgICAgIG9ic2VydmUgOiBmdW5jdGlvbihyZXF1ZXN0RGV0YWlscykge1xuICAgICAgICAgICAgdmFyIHJlcXVlc3RDb250ZXh0ID0gbmV3IEh0dHBSZXF1ZXN0Q29udGV4dChyZXF1ZXN0RGV0YWlscyksXG4gICAgICAgICAgICAgICAgdXJsID0gcmVxdWVzdENvbnRleHQudXJsLFxuICAgICAgICAgICAgICAgIGJsb2NraW5nUmVzcG9uc2UgPSB7fTtcblxuICAgICAgICAgICAgaWYgKCF1cmwpIHJldHVybjtcblxuICAgICAgICAgICAgdmFyIHVybF9wYXJ0cyA9IFVSTEluZm8uZ2V0KHVybCk7XG5cbiAgICAgICAgICAgIHZhciBjb29raWVfZGF0YSA9IHJlcXVlc3RDb250ZXh0LmdldENvb2tpZURhdGEoKTtcblxuXG4gICAgICAgICAgICAvLyBRdWljayBlc2NhcGVzOlxuICAgICAgICAgICAgLy8gbG9jYWxob3N0IG9yIG5vIGNvb2tpZSBkYXRhXG4gICAgICAgICAgICBpZiAodXJsX3BhcnRzWydob3N0bmFtZSddID09ICdsb2NhbGhvc3QnIHx8ICFjb29raWVfZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gR2F0aGVyIG1vcmUgaW5mbyBmb3IgZnVydGhlciBjaGVja3NcbiAgICAgICAgICAgIHZhciBjdXJyX3RpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgaWYgKChjdXJyX3RpbWUgLSBDbGlxekF0dHJhY2suYm9vdHVwVGltZSkgPiBDbGlxekF0dHJhY2sudGltZUJvb3R1cCkgQ2xpcXpBdHRyYWNrLmJvb3RpbmdVcCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAvLyBjaGVjayBpZiBmaWxsIGNvbnRleHQgb2F1dGgsIHRoaXMgbmVlZHMgdG8gYmUgZG9uZSBiZWZvcmUgYWNjZXB0aW5nIG9yIHJlcXVlc3RpbmcgdGhlIGNvb2tpZXMuXG4gICAgICAgICAgICB2YXIgb3VybCA9IGZpbmRPYXV0aCh1cmwsIHVybF9wYXJ0cyk7XG4gICAgICAgICAgICBpZiAob3VybCkge1xuICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay5jb250ZXh0T2F1dGggPSB7J3RzJzogY3Vycl90aW1lLCAnaHRtbCc6IGRVUklDKG91cmwpICsgJzonICsgdXJsfTtcbiAgICAgICAgICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmRlYnVnKSBDbGlxelV0aWxzLmxvZyhcIk9BVVRIOiBcIiArIEpTT04uc3RyaW5naWZ5KENsaXF6QXR0cmFjay5jb250ZXh0T2F1dGgpLCBDbGlxekF0dHJhY2suTE9HX0tFWSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNvbnRlbnQgcG9saWN5IHR5cGUgNiA9PSBUWVBFX0RPQ1VNRU5UOiB0b3AgbGV2ZWwgZG9tIGVsZW1lbnQuIERvIG5vdCBibG9jay5cbiAgICAgICAgICAgIGlmIChyZXF1ZXN0Q29udGV4dC5pc0Z1bGxQYWdlKCkpIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciByZWZlcnJlciA9IHJlcXVlc3RDb250ZXh0LmdldFJlZmVycmVyKCk7XG5cbiAgICAgICAgICAgIC8vIGlmIHRoZSByZXF1ZXN0IGlzIG9yaWdpbmF0aW5nIGZyb20gYSB0YWIsIHdlIGNhbiBnZXQgYSBzb3VyY2UgdXJsXG4gICAgICAgICAgICAvLyBUaGUgaW1wbGVtZW50YXRpb24gYmVsb3cgaXMgY2F1c2luZyBhIGJ1ZywgaWYgd2UgbG9hZCBkaWZmZXJlbnQgdXJscyBpbiBzYW1lIHRhYi5cbiAgICAgICAgICAgIC8vIFRoaXMgaXMgYmV0dGVyIGhhbmRlbGVkIGluIGNhcHR1cmluZyByZXF1ZXN0IHR5cGUuIFdoZW4gcmVxdWVzdCB0eXBlID09IGZ1bGxwYWdlXG4gICAgICAgICAgICAvLyBUaGVuIHVyaS5zcGVjID09IHNvdXJjZV91cmxcbiAgICAgICAgICAgIC8vIE9ubHkgZ2V0IHNvdXJjZSB0YWJzIGZvciBub3cuXG5cbiAgICAgICAgICAgIHZhciBzb3VyY2VfdXJsID0gcmVxdWVzdENvbnRleHQuZ2V0TG9hZGluZ0RvY3VtZW50KCksXG4gICAgICAgICAgICAgICAgc291cmNlX3VybF9wYXJ0cyA9IG51bGwsXG4gICAgICAgICAgICAgICAgc291cmNlX3RhYiA9IHJlcXVlc3RDb250ZXh0LmdldE9yaWdpbldpbmRvd0lEKCk7XG5cbiAgICAgICAgICAgIHZhciBwYWdlX2xvYWRfdHlwZSA9IG51bGw7XG4gICAgICAgICAgICB2YXIgcmVxdWVzdF90eXBlID0gbnVsbDtcbiAgICAgICAgICAgIHN3aXRjaChyZXF1ZXN0Q29udGV4dC5nZXRDb250ZW50UG9saWN5VHlwZSgpKSB7XG4gICAgICAgICAgICAgICAgY2FzZSA2OlxuICAgICAgICAgICAgICAgICAgICBwYWdlX2xvYWRfdHlwZSA9IFwiZnVsbHBhZ2VcIjtcbiAgICAgICAgICAgICAgICAgICAgcmVxdWVzdF90eXBlID0gXCJmdWxscGFnZVwiO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlIDc6IHBhZ2VfbG9hZF90eXBlID0gXCJmcmFtZVwiOyBicmVhaztcbiAgICAgICAgICAgICAgICBkZWZhdWx0OiBwYWdlX2xvYWRfdHlwZSA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEZhbGxiYWNrIHRvIHJlZmVycmVyIGlmIHdlIGRvbid0IGZpbmQgc291cmNlIGZyb20gdGFiXG4gICAgICAgICAgICBpZiAoc291cmNlX3VybCA9PT0gdW5kZWZpbmVkIHx8IHNvdXJjZV91cmwgPT0gJycpe1xuICAgICAgICAgICAgICAgIHNvdXJjZV91cmwgPSByZWZlcnJlcjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKCFzb3VyY2VfdXJsKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzb3VyY2VfdXJsX3BhcnRzID0gVVJMSW5mby5nZXQoc291cmNlX3VybCk7XG4gICAgICAgICAgICB2YXIgcmVxX2xvZyA9IG51bGw7XG5cbiAgICAgICAgICAgIHZhciBzYW1lX2dkID0gZmFsc2U7XG4gICAgICAgICAgICBpZiAodXJsX3BhcnRzLmhvc3RuYW1lIT0nJyAmJiBzb3VyY2VfdXJsX3BhcnRzICYmIHNvdXJjZV91cmxfcGFydHMuaG9zdG5hbWUhPScnKSB7XG4gICAgICAgICAgICAgICAgc2FtZV9nZCA9IHNhbWVHZW5lcmFsRG9tYWluKHVybF9wYXJ0cy5ob3N0bmFtZSwgc291cmNlX3VybF9wYXJ0cy5ob3N0bmFtZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChzYW1lX2dkKSB7XG4gICAgICAgICAgICAgICAgLy8gbm90IGEgM3JkIHBhcnR5IGNvb2tpZSwgZG8gbm90aGluZ1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmVxX2xvZyA9IENsaXF6QXR0cmFjay50cF9ldmVudHMuZ2V0KHVybCwgdXJsX3BhcnRzLCBzb3VyY2VfdXJsLCBzb3VyY2VfdXJsX3BhcnRzLCBzb3VyY2VfdGFiKTtcblxuICAgICAgICAgICAgaWYgKHJlcV9sb2cgJiYgcmVxX2xvZy5jID09PSAwKSB7XG4gICAgICAgICAgICAgICAgYmxvY2tpbmdSZXNwb25zZSA9IENsaXF6QXR0cmFjay5odHRwb3Blbk9ic2VydmVyLm9ic2VydmUocmVxdWVzdERldGFpbHMpIHx8IHt9O1xuICAgICAgICAgICAgICAgIHJlcV9sb2cgPSBDbGlxekF0dHJhY2sudHBfZXZlbnRzLmdldCh1cmwsIHVybF9wYXJ0cywgc291cmNlX3VybCwgc291cmNlX3VybF9wYXJ0cywgc291cmNlX3RhYik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRwX2V2ZW50cy5pbmNyZW1lbnRTdGF0KHJlcV9sb2csICdjb29raWVfc2V0Jyk7XG4gICAgICAgICAgICBpZiAoc291cmNlX3VybC5pbmRleE9mKCdhYm91dDonKT09MCkge1xuICAgICAgICAgICAgICAgIC8vIGl0J3MgYSBicmFuZCBuZXcgdGFiLCBhbmQgdGhlIHVybCBpcyBsb2FkZWQgZXh0ZXJuYWxseSxcbiAgICAgICAgICAgICAgICAvLyBhYm91dDpob21lLCBhYm91dDpibGFua1xuICAgICAgICAgICAgICAgIHRwX2V2ZW50cy5pbmNyZW1lbnRTdGF0KHJlcV9sb2csICdjb29raWVfYWxsb3dfbmV3dGFiJyk7XG4gICAgICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLmFsbG93Q29va2llKHVybCwgeydkc3QnOiB1cmxfcGFydHMuaG9zdG5hbWUsICdzcmMnOiBzb3VyY2VfdXJsLCAnZGF0YSc6IGNvb2tpZV9kYXRhLCAndHMnOiBjdXJyX3RpbWV9LCBcImFib3V0OmJsYW5rXCIpO1xuICAgICAgICAgICAgICAgIHJldHVybiBibG9ja2luZ1Jlc3BvbnNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjaGVjayBpZiBkb21haW4gaXMgd2hpdGVsaXN0ZWQsXG4gICAgICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmlzSW5XaGl0ZWxpc3QodXJsX3BhcnRzLmhvc3RuYW1lKSkge1xuICAgICAgICAgICAgICAgIHRwX2V2ZW50cy5pbmNyZW1lbnRTdGF0KHJlcV9sb2csICdjb29raWVfYWxsb3dfd2hpdGVsaXN0ZWQnKTtcbiAgICAgICAgICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmRlYnVnKSBDbGlxelV0aWxzLmxvZyhcIklzIHdoaXRlbGlzdGVkICh0eXBlOiBkaXJlY3QpOiBcIiArIHVybCwgQ2xpcXpBdHRyYWNrLkxPR19LRVkpO1xuICAgICAgICAgICAgICAgIHJldHVybiBibG9ja2luZ1Jlc3BvbnNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgaG9zdCA9IGdldEdlbmVyYWxEb21haW4odXJsX3BhcnRzLmhvc3RuYW1lKTtcbiAgICAgICAgICAgIHZhciBkaWZmID0gY3Vycl90aW1lIC0gKENsaXF6QXR0cmFjay52aXNpdENhY2hlW2hvc3RdIHx8IDApO1xuXG4gICAgICAgICAgICAvLyBUaGlzIGlzIG9yZGVyIHRvIG9ubHkgYWxsb3cgdmlzaXRlZCBzb3VyY2VzIGZyb20gYnJvd3Nlci4gRWxzZSBzb21lIHJlZGlyZWN0IGNhbGxzXG4gICAgICAgICAgICAvLyBHZXR0aW5nIGxlYWtlZC5cbiAgICAgICAgICAgIHZhciBzX2hvc3QgPSAnJztcbiAgICAgICAgICAgIGlmKHNvdXJjZV91cmwgJiYgc291cmNlX3VybF9wYXJ0cy5ob3N0bmFtZSl7XG4gICAgICAgICAgICAgICAgc19ob3N0ID0gZ2V0R2VuZXJhbERvbWFpbihzb3VyY2VfdXJsX3BhcnRzLmhvc3RuYW1lKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gY2hlY2sgdmlzaXRjYWNoZSB0byBzZWUgaWYgdGhpcyBkb21haW4gaXMgdGVtcG9yYXJpbHkgYWxsb3dlZC5cbiAgICAgICAgICAgIC8vIEFkZGl0aW9uYWwgY2hlY2sgcmVxdWlyZWQgd2hlbiBnZD1mYWxzZSBhbmQgcmVxdWVzdF90eXBlPT0gZnVsbF9wYWdlLCBlbHNlIGJsb2NrXG4gICAgICAgICAgICBpZiAoZGlmZiA8IENsaXF6QXR0cmFjay50aW1lQWN0aXZlICYmIENsaXF6QXR0cmFjay52aXNpdENhY2hlW3NfaG9zdF0pIHtcbiAgICAgICAgICAgICAgICB2YXIgc3JjID0gbnVsbDtcbiAgICAgICAgICAgICAgICBpZiAoc291cmNlX3VybF9wYXJ0cyAmJiBzb3VyY2VfdXJsX3BhcnRzLmhvc3RuYW1lKSBzcmMgPSBzb3VyY2VfdXJsX3BhcnRzLmhvc3RuYW1lO1xuICAgICAgICAgICAgICAgIHRwX2V2ZW50cy5pbmNyZW1lbnRTdGF0KHJlcV9sb2csICdjb29raWVfYWxsb3dfdmlzaXRjYWNoZScpO1xuICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay5hbGxvd0Nvb2tpZSh1cmwsIHsnZHN0JzogdXJsX3BhcnRzLmhvc3RuYW1lLCAnc3JjJzogc3JjLCAnZGF0YSc6IGNvb2tpZV9kYXRhLCAndHMnOiBjdXJyX3RpbWV9LCBcInZpc2l0Y2FjaGVcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGJsb2NraW5nUmVzcG9uc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGlmIHVzZXIgaW5pdGlhdGVkIHRoaXMgcmVxdWVzdCBieSBhbiBlbGVtZW50IGNsaWNrLlxuICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay5jQ2hlY2tlci5jb250ZXh0RnJvbUV2ZW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpZmYgPSBjdXJyX3RpbWUgLSAoQ2xpcXpBdHRyYWNrLmNDaGVja2VyLmNvbnRleHRGcm9tRXZlbnQudHMgfHwgMCk7XG4gICAgICAgICAgICAgICAgaWYgKGRpZmYgPCBDbGlxekF0dHJhY2sudGltZUFmdGVyTGluaykge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBob3N0ID0gZ2V0R2VuZXJhbERvbWFpbih1cmxfcGFydHMuaG9zdG5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoaG9zdCA9PT0gQ2xpcXpBdHRyYWNrLmNDaGVja2VyLmNvbnRleHRGcm9tRXZlbnQuZ0RNKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDbGlxekF0dHJhY2sudmlzaXRDYWNoZVtob3N0XSA9IGN1cnJfdGltZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzcmMgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHNvdXJjZV91cmxfcGFydHMgJiYgc291cmNlX3VybF9wYXJ0cy5ob3N0bmFtZSkgc3JjID0gc291cmNlX3VybF9wYXJ0cy5ob3N0bmFtZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRwX2V2ZW50cy5pbmNyZW1lbnRTdGF0KHJlcV9sb2csICdjb29raWVfYWxsb3dfdXNlcmluaXRfc2FtZV9jb250ZXh0X2dkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBDbGlxekF0dHJhY2suYWxsb3dDb29raWUodXJsLCB7J2RzdCc6IHVybF9wYXJ0cy5ob3N0bmFtZSwgJ3NyYyc6IHNyYywgJ2RhdGEnOiBjb29raWVfZGF0YSwgJ3RzJzogY3Vycl90aW1lfSwgXCJjb250ZXh0RnJvbUV2ZW50XCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJsb2NraW5nUmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgdmFyIHB1ID0gdXJsLnNwbGl0KC9bPyY7XS8pWzBdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmNDaGVja2VyLmNvbnRleHRGcm9tRXZlbnQuaHRtbC5pbmRleE9mKHB1KSE9LTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDbGlxekF0dHJhY2suZGVidWcpIENsaXF6VXRpbHMubG9nKFwiPj4+IENvb2tpZSBBTExPV0VEICh0eXBlMik6IFwiICsgcHUgKyBcIiBcIiArIENsaXF6QXR0cmFjay5jQ2hlY2tlci5jb250ZXh0RnJvbUV2ZW50Lmh0bWwsIENsaXF6QXR0cmFjay5MT0dfS0VZKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHVybCBpcyBpbiBwdVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHVybF9wYXJ0cyAmJiB1cmxfcGFydHMuaG9zdG5hbWUgJiYgdXJsX3BhcnRzLmhvc3RuYW1lIT0nJykge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLnZpc2l0Q2FjaGVbaG9zdF0gPSBjdXJyX3RpbWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cF9ldmVudHMuaW5jcmVtZW50U3RhdChyZXFfbG9nLCAnY29va2llX2FsbG93X3VzZXJpbml0X3NhbWVfZ2RfbGluaycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay5hbGxvd0Nvb2tpZSh1cmwsIHsnZHN0JzogdXJsX3BhcnRzLmhvc3RuYW1lLCAnc3JjJzogc3JjLCAnZGF0YSc6IGNvb2tpZV9kYXRhLCAndHMnOiBjdXJyX3RpbWV9LCBcImNvbnRleHRGcm9tRXZlbnRcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJsb2NraW5nUmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGNoZWNrIGZvciBPQXV0aCByZXF1ZXN0c1xuICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay5jb250ZXh0T2F1dGgpIHtcbiAgICAgICAgICAgICAgICB2YXIgZGlmZiA9IGN1cnJfdGltZSAtIChDbGlxekF0dHJhY2suY29udGV4dE9hdXRoLnRzIHx8IDApO1xuICAgICAgICAgICAgICAgIGlmIChkaWZmIDwgQ2xpcXpBdHRyYWNrLnRpbWVBY3RpdmUpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgcHUgPSB1cmwuc3BsaXQoL1s/JjtdLylbMF07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay5jb250ZXh0T2F1dGguaHRtbC5pbmRleE9mKHB1KSE9LTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRoZSB1cmwgaXMgaW4gcHVcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh1cmxfcGFydHMgJiYgdXJsX3BhcnRzLmhvc3RuYW1lICYmIHVybF9wYXJ0cy5ob3N0bmFtZSE9JycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsZXQgY29udGV4dEZyb21FdmVudCA9IGJyb3dzZXIuY29udGV4dEZyb21FdmVudCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb250ZXh0RnJvbUV2ZW50ICYmIGNvbnRleHRGcm9tRXZlbnQuaHRtbCAmJiBjb250ZXh0RnJvbUV2ZW50Lmh0bWwuaW5kZXhPZihwdSkhPS0xKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay5kZWJ1ZykgQ2xpcXpVdGlscy5sb2coXCJPQVVUSCBhbmQgY2xpY2sgXCIgKyB1cmwsIENsaXF6QXR0cmFjay5MT0dfS0VZKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhvc3QgPSBnZXRHZW5lcmFsRG9tYWluKHVybF9wYXJ0cy5ob3N0bmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzcmMgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoc291cmNlX3VybF9wYXJ0cyAmJiBzb3VyY2VfdXJsX3BhcnRzLmhvc3RuYW1lKSBzcmMgPSBzb3VyY2VfdXJsX3BhcnRzLmhvc3RuYW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cF9ldmVudHMuaW5jcmVtZW50U3RhdChyZXFfbG9nLCAnY29va2llX2FsbG93X29hdXRoJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRwX2V2ZW50cy5pbmNyZW1lbnRTdGF0KHJlcV9sb2csICdyZXFfb2F1dGgnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLmFsbG93Q29va2llKHVybCwgeydkc3QnOiB1cmxfcGFydHMuaG9zdG5hbWUsICdzcmMnOiBzcmMsICdkYXRhJzogY29va2llX2RhdGEsICd0cyc6IGN1cnJfdGltZX0sIFwiY29udGV4dE9hdXRoXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gYmxvY2tpbmdSZXNwb25zZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChDbGlxekF0dHJhY2suZGVidWcpIENsaXF6VXRpbHMubG9nKFwiT0FVVEggYW5kIE5PVCBjbGljayBcIiArIHVybCwgQ2xpcXpBdHRyYWNrLkxPR19LRVkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHVybF9wYXJ0cy5ob3N0bmFtZSE9JycgJiYgc291cmNlX3VybF9wYXJ0cyAmJiBzb3VyY2VfdXJsX3BhcnRzLmhvc3RuYW1lIT0nJykge1xuXG4gICAgICAgICAgICAgICAgLy8gdGhlIGhvc3RuYW1lcyBhcmUgZGlmZmVyZW50LCBidXQgdGhleSBtaWdodCBzdGlsbCBiZSB0aGUgc2FtZSBzaXRlOiBlLmcuXG4gICAgICAgICAgICAgICAgLy8gbG9jNS5sYWNhaXhhLmVzID0+IG1ldHJpY3MubGFjYWl4YS5lc1xuXG4gICAgICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay5kZWJ1Zykge1xuICAgICAgICAgICAgICAgICAgICBDbGlxelV0aWxzLmxvZyhcImNvb2tpZSBkZXRlY3RlZCA+Pj4gXCIgKyBzb3VyY2VfdXJsX3BhcnRzLmhvc3RuYW1lICsgXCIgOiBcIiArIHVybF9wYXJ0cy5ob3N0bmFtZSwgQ2xpcXpBdHRyYWNrLkxPR19LRVkpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICgoIXNhbWVfZ2QpICYmIGNvb2tpZV9kYXRhICYmICBjb29raWVfZGF0YS5sZW5ndGg+MTApIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBhcyB0ZXN0LCB3ZSBkbyBub3Qgc2VuZCB0aGUgaG9zdG5hbWUgYXMgbWQ1XG4gICAgICAgICAgICAgICAgICAgIHZhciBtZDVfc291cmNlX2hvc3RuYW1lID0gc291cmNlX3VybF9wYXJ0cy5ob3N0bmFtZTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBub3csIGxldCdzIGtpbGwgdGhhdCBjb29raWUgYW5kIHNlZSB3aGF0IGhhcHBlbnMgOi0pXG4gICAgICAgICAgICAgICAgICAgIHZhciBfa2V5ID0gc291cmNlX3RhYiArIFwiOlwiICsgc291cmNlX3VybDtcbiAgICAgICAgICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay5pc0Nvb2tpZUVuYWJsZWQoc291cmNlX3VybF9wYXJ0cy5ob3N0bmFtZSkgJiYgIShDbGlxekF0dHJhY2sucmVsb2FkV2hpdGVMaXN0W19rZXldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYmxvY2tpbmcgY29va2llXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgc3JjID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2VfdXJsX3BhcnRzICYmIHNvdXJjZV91cmxfcGFydHMuaG9zdG5hbWUpIHNyYyA9IHNvdXJjZV91cmxfcGFydHMuaG9zdG5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB0cF9ldmVudHMuaW5jcmVtZW50U3RhdChyZXFfbG9nLCAnY29va2llX2Jsb2NrZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRwX2V2ZW50cy5pbmNyZW1lbnRTdGF0KHJlcV9sb2csICdjb29raWVfYmxvY2tfdHAxJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBDbGlxekF0dHJhY2suYmxvY2tDb29raWUoc291cmNlX3VybF9wYXJ0cy5ob3N0bmFtZSwgeydzcmMnOiBzcmMsICdkc3QnOiB1cmxfcGFydHMuaG9zdG5hbWUsICdkYXRhJzogY29va2llX2RhdGEsICd0cyc6IGN1cnJfdGltZX0sICd0eXBlMScpXG4gICAgICAgICAgICAgICAgICAgICAgICBibG9ja2luZ1Jlc3BvbnNlLnJlcXVlc3RIZWFkZXJzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgICB7bmFtZTogJ0Nvb2tpZScsIHZhbHVlOiAnJ30sXG4gICAgICAgICAgICAgICAgICAgICAgICAgIHtuYW1lOiBDbGlxekF0dHJhY2suY2xpcXpIZWFkZXIsIHZhbHVlOiAnICd9XG4gICAgICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGJsb2NraW5nUmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB3YXMgbm90IGVuYWJsZWQsIHRoZXJlZm9yZSB0aGUgY29va2llIGdldHMgc2VudFxuICAgICAgICAgICAgICAgICAgICAgICAgdHBfZXZlbnRzLmluY3JlbWVudFN0YXQocmVxX2xvZywgJ2JhZF9jb29raWVfc2VudCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGlmIChDbGlxekF0dHJhY2suYm9vdGluZ1VwKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKChjdXJyX3RpbWUgLSBDbGlxekF0dHJhY2suYm9vdHVwVGltZSkgPiBDbGlxekF0dHJhY2sudGltZUJvb3R1cCkgQ2xpcXpBdHRyYWNrLmJvb3RpbmdVcCA9IGZhbHNlO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChDbGlxekF0dHJhY2suZGVidWcpIENsaXF6VXRpbHMubG9nKFwiPj4+IEJvb3RpbmcgdXA6IFwiICArIHVybCArIFwiIDogXCIgKyB1cmxfcGFydHMuaG9zdG5hbWUsIENsaXF6QXR0cmFjay5MT0dfS0VZKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IHVybF9wYXJ0cy5ob3N0bmFtZSArIHVybF9wYXJ0cy5wYXRoO1xuICAgICAgICAgICAgICAgICAgICBpZiAoa2V5ICYmIGtleSE9JycpIENsaXF6QXR0cmFjay5ib290dXBXaGl0ZWxpc3RDYWNoZVtrZXldID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgdHBfZXZlbnRzLmluY3JlbWVudFN0YXQocmVxX2xvZywgJ2Nvb2tpZV9hbGxvd19ib290aW5ndXAnKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay5kZWJ1ZykgQ2xpcXpVdGlscy5sb2coXCI+Pj4gQ29va2llIEFMTE9XRUQgYmVjYXVzZSBib290dXA6IFwiICsga2V5LCBDbGlxekF0dHJhY2suTE9HX0tFWSk7XG5cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGtleSA9IHVybF9wYXJ0cy5ob3N0bmFtZSArIHVybF9wYXJ0cy5wYXRoO1xuICAgICAgICAgICAgICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmJvb3R1cFdoaXRlbGlzdENhY2hlW2tleV09PW51bGwpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay5pc0Nvb2tpZUVuYWJsZWQoc291cmNlX3VybF9wYXJ0cy5ob3N0bmFtZSkgJiYgIShDbGlxekF0dHJhY2sucmVsb2FkV2hpdGVMaXN0W19rZXldKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGJsb2NraW5nIGNvb2tpZVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBzcmMgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChzb3VyY2VfdXJsX3BhcnRzICYmIHNvdXJjZV91cmxfcGFydHMuaG9zdG5hbWUpIHNyYyA9IHNvdXJjZV91cmxfcGFydHMuaG9zdG5hbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHBfZXZlbnRzLmluY3JlbWVudFN0YXQocmVxX2xvZywgJ2Nvb2tpZV9ibG9ja2VkJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHBfZXZlbnRzLmluY3JlbWVudFN0YXQocmVxX2xvZywgJ2Nvb2tpZV9ibG9ja190cDInKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBDbGlxekF0dHJhY2suYmxvY2tDb29raWUodXJsLCB7J3NyYyc6IHNyYywgJ2RzdCc6IHVybF9wYXJ0cy5ob3N0bmFtZSwgJ2RhdGEnOiBjb29raWVfZGF0YSwgJ3RzJzogY3Vycl90aW1lfSwgJ3R5cGUyJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBibG9ja2luZ1Jlc3BvbnNlLnJlcXVlc3RIZWFkZXJzID0gW1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge25hbWU6ICdDb29raWUnLCB2YWx1ZTogJyd9LFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAge25hbWU6IENsaXF6QXR0cmFjay5jbGlxekhlYWRlciwgdmFsdWU6ICcgJ31cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBibG9ja2luZ1Jlc3BvbnNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gd2FzIG5vdCBlbmFibGVkLCB0aGVyZWZvcmUgdGhlIGNvb2tpZSBnZXRzIHNlbnRcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cF9ldmVudHMuaW5jcmVtZW50U3RhdChyZXFfbG9nLCAnYmFkX2Nvb2tpZV9zZW50Jyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBzaG91bGQgYWxsb3csIHNhbWUgZG9tYWluIGFuZCBwYXRoIGFzIGJvb3R1cCByZXF1ZXN0LFxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay5kZWJ1ZykgQ2xpcXpVdGlscy5sb2coXCI+Pj4gQ29va2llIEFMTE9XRUQgYmVjYXVzZSBib290dXA6IFwiICsga2V5LCBDbGlxekF0dHJhY2suTE9HX0tFWSk7XG5cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBibG9ja2luZ1Jlc3BvbnNlO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBhbGxvd0Nvb2tpZTogZnVuY3Rpb24odXJsLCByZXFfbWV0YWRhdGEsIHJlYXNvbikge1xuICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmRlYnVnKSBDbGlxelV0aWxzLmxvZyhcIkFMTE9XSU5HIGJlY2F1c2Ugb2YgXCIgKyByZWFzb24gKyBcIiBcIiArIHJlcV9tZXRhZGF0YVsnZHN0J10gKyAnICUlICcgKyB1cmwsIENsaXF6QXR0cmFjay5MT0dfS0VZKTtcbiAgICB9LFxuICAgIGJsb2NrQ29va2llOiBmdW5jdGlvbih1cmwsIHJlcV9tZXRhZGF0YSwgcmVhc29uKSB7XG4gICAgICAgIGlmIChDbGlxekF0dHJhY2suZGVidWcpIENsaXF6VXRpbHMubG9nKFwiPj4+IENvb2tpZSBSRU1PVkVEIChcIiArIHJlYXNvbiArIFwiKTogXCIgICsgcmVxX21ldGFkYXRhWydkc3QnXSArIFwiID4+PiBcIiArIHVybCwgQ2xpcXpBdHRyYWNrLkxPR19LRVkpO1xuICAgICAgICBDbGlxekF0dHJhY2suYmxvY2tlZENhY2hlW3JlcV9tZXRhZGF0YVsnZHN0J11dID0gcmVxX21ldGFkYXRhWyd0cyddO1xuICAgIH0sXG4gICAgb25UYWJMb2NhdGlvbkNoYW5nZTogZnVuY3Rpb24oZXZudCkge1xuICAgICAgICB2YXIgdXJsID0gZXZudC51cmw7XG5cbiAgICAgICAgQ2xpcXpBdHRyYWNrLmxpbmtzRnJvbURvbVt1cmxdID0ge307XG5cbiAgICAgICAgaWYgKGV2bnQuaXNMb2FkaW5nRG9jdW1lbnQpIHtcbiAgICAgICAgICAgIC8vIHdoZW4gYSBuZXcgcGFnZSBpcyBsb2FkZWQsIHRyeSB0byBleHRyYWN0IGludGVybmFsIGxpbmtzIGFuZCBjb29raWVzXG4gICAgICAgICAgICB2YXIgZG9jID0gZXZudC5kb2N1bWVudDtcbiAgICAgICAgICAgIENsaXF6QXR0cmFjay5sb2FkZWRUYWJzW3VybF0gPSBmYWxzZTtcblxuICAgICAgICAgICAgaWYoZG9jKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRvYy5ib2R5KSB7XG4gICAgICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay5yZWNvcmRMaW5rc0ZvclVSTCh1cmwpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBkb2MuYWRkRXZlbnRMaXN0ZW5lcihcbiAgICAgICAgICAgICAgICAgICAgJ0RPTUNvbnRlbnRMb2FkZWQnLFxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihldikge1xuICAgICAgICAgICAgICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLmxvYWRlZFRhYnNbdXJsXSA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBDbGlxekF0dHJhY2sucmVjb3JkTGlua3NGb3JVUkwodXJsKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLmNsZWFyRG9tTGlua3MoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE5ldyBsb2NhdGlvbiwgbWVhbnMgYSBwYWdlIGxvYWRlZCBvbiB0aGUgdG9wIHdpbmRvdywgdmlzaWJsZSB0YWJcbiAgICAgICAgdmFyIGFjdGl2ZVVSTCA9IGJyb3dzZXIuY3VycmVudFVSTCgpO1xuICAgICAgICB2YXIgY3Vycl90aW1lID0gRGF0ZS5ub3coKTtcblxuICAgICAgICBpZiAoKGFjdGl2ZVVSTC5pbmRleE9mKCdhYm91dDonKSE9MCkgJiYgKGFjdGl2ZVVSTC5pbmRleE9mKCdjaHJvbWU6JykhPTApKSB7XG5cbiAgICAgICAgICAgIHZhciB1cmxfcGFydHMgPSBwYXJzZVVSTChhY3RpdmVVUkwpO1xuXG4gICAgICAgICAgICBpZiAodXJsX3BhcnRzICYmIHVybF9wYXJ0cy5ob3N0bmFtZSAmJiB1cmxfcGFydHMuaG9zdG5hbWUhPScnKSB7XG4gICAgICAgICAgICAgICAgdmFyIGhvc3QgPSBnZXRHZW5lcmFsRG9tYWluKHVybF9wYXJ0cy5ob3N0bmFtZSk7XG4gICAgICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLnZpc2l0Q2FjaGVbaG9zdF0gPSBjdXJyX3RpbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGdldERlZmF1bHRSdWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKENsaXF6QXR0cmFjay5pc0ZvcmNlQmxvY2tFbmFibGVkKCkpIHtcbiAgICAgICAgICAgIHJldHVybiAnYmxvY2snO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGdldERlZmF1bHRUcmFja2VyVHh0UnVsZSgpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBpc0VuYWJsZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gQ2xpcXpVdGlscy5nZXRQcmVmKENsaXF6QXR0cmFjay5FTkFCTEVfUFJFRiwgZmFsc2UpO1xuICAgIH0sXG4gICAgaXNDb29raWVFbmFibGVkOiBmdW5jdGlvbihzb3VyY2VfaG9zdG5hbWUpIHtcbiAgICAgICAgaWYgKHNvdXJjZV9ob3N0bmFtZSAhPSB1bmRlZmluZWQgJiYgQ2xpcXpBdHRyYWNrLmlzU291cmNlV2hpdGVsaXN0ZWQoc291cmNlX2hvc3RuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBDbGlxelV0aWxzLmdldFByZWYoJ2F0dHJhY2tCbG9ja0Nvb2tpZVRyYWNraW5nJywgdHJ1ZSk7XG4gICAgfSxcbiAgICBpc1FTRW5hYmxlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBDbGlxelV0aWxzLmdldFByZWYoJ2F0dHJhY2tSZW1vdmVRdWVyeVN0cmluZ1RyYWNraW5nJywgdHJ1ZSk7XG4gICAgfSxcbiAgICBpc0ZpbmdlcnByaW50aW5nRW5hYmxlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBDbGlxelV0aWxzLmdldFByZWYoJ2F0dHJhY2tDYW52YXNGaW5nZXJwcmludFRyYWNraW5nJywgZmFsc2UpO1xuICAgIH0sXG4gICAgaXNSZWZlcnJlckVuYWJsZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gQ2xpcXpVdGlscy5nZXRQcmVmKCdhdHRyYWNrUmVmZXJlclRyYWNraW5nJywgZmFsc2UpO1xuICAgIH0sXG4gICAgaXNUcmFja2VyVHh0RW5hYmxlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBDbGlxelV0aWxzLmdldFByZWYoJ3RyYWNrZXJUeHQnLCBmYWxzZSk7XG4gICAgfSxcbiAgICBpc0Jsb29tRmlsdGVyRW5hYmxlZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBDbGlxelV0aWxzLmdldFByZWYoJ2F0dHJhY2tCbG9vbUZpbHRlcicsIGZhbHNlKTtcbiAgICB9LFxuICAgIGlzRm9yY2VCbG9ja0VuYWJsZWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gQ2xpcXpVdGlscy5nZXRQcmVmKCdhdHRyYWNrRm9yY2VCbG9jaycsIGZhbHNlKTtcbiAgICB9LFxuICAgIGluaXRQYWNlbWFrZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICBsZXQgdHdvX21pbnMgPSAyICogNjAgKiAxMDAwO1xuXG4gICAgICAgIC8vIGNyZWF0ZSBhIGNvbnN0cmFpbnQgd2hpY2ggcmV0dXJucyB0cnVlIHdoZW4gdGhlIHRpbWUgY2hhbmdlcyBhdCB0aGUgc3BlY2lmaWVkIGZpZGVsaXR5XG4gICAgICAgIGZ1bmN0aW9uIHRpbWVDaGFuZ2VDb25zdHJhaW50KG5hbWUsIGZpZGVsaXR5KSB7XG4gICAgICAgICAgICBpZiAoZmlkZWxpdHkgPT0gXCJkYXlcIikgZmlkZWxpdHkgPSA4O1xuICAgICAgICAgICAgZWxzZSBpZihmaWRlbGl0eSA9PSBcImhvdXJcIikgZmlkZWxpdHkgPSAxMDtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbiAodGFzaykge1xuICAgICAgICAgICAgICAgIHZhciB0aW1lc3RhbXAgPSBkYXRldGltZS5nZXRUaW1lKCkuc2xpY2UoMCwgZmlkZWxpdHkpLFxuICAgICAgICAgICAgICAgICAgICBsYXN0SG91ciA9IHBlcnNpc3QuZ2V0VmFsdWUobmFtZSArIFwibGFzdFJ1blwiKSB8fCB0aW1lc3RhbXA7XG4gICAgICAgICAgICAgICAgcGVyc2lzdC5zZXRWYWx1ZShuYW1lICtcImxhc3RSdW5cIiwgdGltZXN0YW1wKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGltZXN0YW1wICE9IGxhc3RIb3VyO1xuICAgICAgICAgICAgfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHBhY2VtYWtlci5yZWdpc3RlcihDbGlxekF0dHJhY2sudXBkYXRlQ29uZmlnLCAzICogNjAgKiA2MCAqIDEwMDApO1xuXG4gICAgICAgIC8vIHNlbmQgaW5zdGFudCBjYWNoZSB0b2tlbnMgd2hlbmV2ZXIgaG91ciBjaGFuZ2VzXG4gICAgICAgIHBhY2VtYWtlci5yZWdpc3RlcihDbGlxekF0dHJhY2suc2VuZFRva2VucywgNSAqIDYwICogMTAwMCk7XG4gICAgICAgIC8vIGlmIHRoZSBob3VyIGhhcyBjaGFuZ2VkXG4gICAgICAgIHBhY2VtYWtlci5yZWdpc3RlcihDbGlxekF0dHJhY2suaG91ckNoYW5nZWQsIHR3b19taW5zLCB0aW1lQ2hhbmdlQ29uc3RyYWludChcImhvdXJDaGFuZ2VkXCIsIFwiaG91clwiKSk7XG5cbiAgICAgICAgLy8gZXZlcnkgMiBtaW5zXG4gICAgICAgIHBhY2VtYWtlci5yZWdpc3RlcihmdW5jdGlvbiBjbGVhbl92aXNpdENhY2hlKGN1cnJfdGltZSkge1xuICAgICAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhDbGlxekF0dHJhY2sudmlzaXRDYWNoZSk7XG4gICAgICAgICAgICBmb3IodmFyIGk9MDtpPGtleXMubGVuZ3RoO2krKykge1xuICAgICAgICAgICAgICAgIHZhciBkaWZmID0gY3Vycl90aW1lIC0gKENsaXF6QXR0cmFjay52aXNpdENhY2hlW2tleXNbaV1dIHx8IDApO1xuICAgICAgICAgICAgICAgIGlmIChkaWZmID4gQ2xpcXpBdHRyYWNrLnRpbWVDbGVhbmluZ0NhY2hlKSBkZWxldGUgQ2xpcXpBdHRyYWNrLnZpc2l0Q2FjaGVba2V5c1tpXV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHR3b19taW5zKTtcblxuICAgICAgICBwYWNlbWFrZXIucmVnaXN0ZXIoZnVuY3Rpb24gY2xlYW5fcmVsb2FkV2hpdGVMaXN0KGN1cnJfdGltZSkge1xuICAgICAgICAgICAgdmFyIGtleXMgPSBPYmplY3Qua2V5cyhDbGlxekF0dHJhY2sucmVsb2FkV2hpdGVMaXN0KTtcbiAgICAgICAgICAgIGZvcih2YXIgaT0wO2k8a2V5cy5sZW5ndGg7aSsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGRpZmYgPSBjdXJyX3RpbWUgLSAoQ2xpcXpBdHRyYWNrLnJlbG9hZFdoaXRlTGlzdFtrZXlzW2ldXSB8fCAwKTtcbiAgICAgICAgICAgICAgICBpZiAoZGlmZiA+IENsaXF6QXR0cmFjay50aW1lQ2xlYW5pbmdDYWNoZSkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgQ2xpcXpBdHRyYWNrLnJlbG9hZFdoaXRlTGlzdFtrZXlzW2ldXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHR3b19taW5zKTtcblxuICAgICAgICBwYWNlbWFrZXIucmVnaXN0ZXIoZnVuY3Rpb24gY2xlYW5fdHJhY2tSZWxvYWQoY3Vycl90aW1lKSB7XG4gICAgICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKENsaXF6QXR0cmFjay50cmFja1JlbG9hZCk7XG4gICAgICAgICAgICBmb3IodmFyIGk9MDtpPGtleXMubGVuZ3RoO2krKykge1xuICAgICAgICAgICAgICAgIHZhciBkaWZmID0gY3Vycl90aW1lIC0gKENsaXF6QXR0cmFjay50cmFja1JlbG9hZFtrZXlzW2ldXSB8fCAwKTtcbiAgICAgICAgICAgICAgICBpZiAoZGlmZiA+IENsaXF6QXR0cmFjay50aW1lQ2xlYW5pbmdDYWNoZSkge1xuICAgICAgICAgICAgICAgICAgICBkZWxldGUgQ2xpcXpBdHRyYWNrLnRyYWNrUmVsb2FkW2tleXNbaV1dO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHdvX21pbnMpO1xuXG4gICAgICAgIHBhY2VtYWtlci5yZWdpc3RlcihmdW5jdGlvbiBjbGVhbl9ibG9ja2VkQ2FjaGUoY3Vycl90aW1lKSB7XG4gICAgICAgICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKENsaXF6QXR0cmFjay5ibG9ja2VkQ2FjaGUpO1xuICAgICAgICAgICAgZm9yKHZhciBpPTA7aTxrZXlzLmxlbmd0aDtpKyspIHtcbiAgICAgICAgICAgICAgICB2YXIgZGlmZiA9IGN1cnJfdGltZSAtIChDbGlxekF0dHJhY2suYmxvY2tlZENhY2hlW2tleXNbaV1dIHx8IDApO1xuICAgICAgICAgICAgICAgIGlmIChkaWZmID4gQ2xpcXpBdHRyYWNrLnRpbWVDbGVhbmluZ0NhY2hlKSBkZWxldGUgQ2xpcXpBdHRyYWNrLmJsb2NrZWRDYWNoZVtrZXlzW2ldXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSwgdHdvX21pbnMpO1xuXG4gICAgICAgIHZhciBib290dXBfdGFzayA9IHBhY2VtYWtlci5yZWdpc3RlcihmdW5jdGlvbiBib290dXBfY2hlY2soY3Vycl90aW1lKSB7XG4gICAgICAgICAgICBpZiAoKGN1cnJfdGltZSAtIENsaXF6QXR0cmFjay5ib290dXBUaW1lKSA+IENsaXF6QXR0cmFjay50aW1lQm9vdHVwKSB7XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5sb2coXCJib290dXAgZW5kXCIpO1xuICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay5ib290aW5nVXAgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBwYWNlbWFrZXIuZGVyZWdpc3Rlcihib290dXBfdGFzayk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHBhY2VtYWtlci5yZWdpc3RlcihmdW5jdGlvbiB0cF9ldmVudF9jb21taXQoKSB7XG4gICAgICAgICAgICBDbGlxekF0dHJhY2sudHBfZXZlbnRzLmNvbW1pdCgpO1xuICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLnRwX2V2ZW50cy5wdXNoKCk7XG4gICAgICAgIH0sIHR3b19taW5zKTtcblxuICAgICAgICAvLyBldmVyeSBob3VyXG4gICAgICAgIGxldCBob3VybHkgPSA2MCAqIDYwICogMTAwMDtcbiAgICAgICAgcGFjZW1ha2VyLnJlZ2lzdGVyKENsaXF6QXR0cmFjay5wcnVuZVJlcXVlc3RLZXlWYWx1ZSwgaG91cmx5KTtcblxuICAgICAgICAvLyBzZW5kIHRyYWNraW5nIG9jY3VyYW5jZXMgd2hlbmV2ZXIgZGF5IGNoYW5nZXNcbiAgICAgICAgcGFjZW1ha2VyLnJlZ2lzdGVyKGZ1bmN0aW9uIHNlbmRUcmFja2luZ0RldGVjdGlvbnMoKSB7XG4gICAgICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmxvY2FsX3RyYWNraW5nLmlzRW5hYmxlZCgpKSB7XG4gICAgICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLmxvY2FsX3RyYWNraW5nLmdldFRyYWNraW5nT2NjdXJhbmNlcyhmdW5jdGlvbihyZXN1bHRzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay5sb2NhbF90cmFja2luZy5nZXRUYWJsZVNpemUoZnVuY3Rpb24odGFibGVfc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBwYXlsID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAndmVyJzogQ2xpcXpBdHRyYWNrLlZFUlNJT04sXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0cyc6IGRhdGV0aW1lLmdldFRpbWUoKS5zdWJzdHJpbmcoMCwgOCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzoge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ2x0JzogcmVzdWx0cy5tYXAoZnVuY3Rpb24odHVwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHsndHAnOiB0dXBbMF0sICdrJzogdHVwWzFdLCAndic6IHR1cFsyXSwgJ24nOiB0dXBbM119O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnYyc6IHRhYmxlX3NpemVcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGVsZW1ldHJ5LnRlbGVtZXRyeSh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICd0eXBlJzogdGVsZW1ldHJ5Lm1zZ1R5cGUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdhY3Rpb24nOiAnYXR0cmFjay50cmFja2VkJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ3BheWxvYWQnOiBwYXlsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBDbGlxekF0dHJhY2subG9jYWxfdHJhY2tpbmcuY2xlYW5UYWJsZSgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCBob3VybHksIHRpbWVDaGFuZ2VDb25zdHJhaW50KFwibG9jYWxfdHJhY2tpbmdcIiwgXCJkYXlcIikpO1xuXG4gICAgICAgIHBhY2VtYWtlci5yZWdpc3RlcihmdW5jdGlvbiBhbm5vdGF0ZVNhZmVLZXlzKCkge1xuICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLnFzX3doaXRlbGlzdC5hbm5vdGF0ZVNhZmVLZXlzKENsaXF6QXR0cmFjay5yZXF1ZXN0S2V5VmFsdWUpO1xuICAgICAgICB9LCAxMCAqIDYwICogNjAgKiAxMDAwKTtcblxuICAgIH0sXG4gICAgLyoqIEdsb2JhbCBtb2R1bGUgaW5pdGlhbGlzYXRpb24uXG4gICAgICovXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIGRpc2FibGUgZm9yIG9sZGVyIGJyb3dzZXJzXG4gICAgICAgIGlmIChDbGlxekF0dHJhY2suZ2V0QnJvd3Nlck1ham9yVmVyc2lvbigpIDwgQ2xpcXpBdHRyYWNrLk1JTl9CUk9XU0VSX1ZFUlNJT04pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJlcGxhY2UgZ2V0V2luZG93IGZ1bmN0aW9ucyB3aXRoIHdpbmRvdyBvYmplY3QgdXNlZCBpbiBpbml0LlxuICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmRlYnVnKSBDbGlxelV0aWxzLmxvZyhcIkluaXQgZnVuY3Rpb24gY2FsbGVkOlwiLCBDbGlxekF0dHJhY2suTE9HX0tFWSk7XG5cbiAgICAgICAgQ2xpcXpBdHRyYWNrLmhhc2hQcm9iID0gbmV3IEhhc2hQcm9iKCk7XG5cbiAgICAgICAgLy8gbG9hZCBhbGwgY2FjaGVzOlxuICAgICAgICAvLyBMYXJnZSBkeW5hbWljIGNhY2hlcyBhcmUgbG9hZGVkIHZpYSB0aGUgcGVyc2lzdCBtb2R1bGUsIHdoaWNoIHdpbGwgbGF6aWx5IHByb3BlZ2F0ZSBjaGFuZ2VzIGJhY2tcbiAgICAgICAgLy8gdG8gdGhlIGJyb3dzZXIncyBzcWxpdGUgZGF0YWJhc2UuXG4gICAgICAgIC8vIExhcmdlIHN0YXRpYyBjYWNoZXMgKGUuZy4gdG9rZW4gd2hpdGVsaXN0KSBhcmUgbG9hZGVkIGZyb20gc3FsaXRlXG4gICAgICAgIC8vIFNtYWxsZXIgY2FjaGVzIChlLmcuIHVwZGF0ZSB0aW1lc3RhbXBzKSBhcmUga2VwdCBpbiBwcmVmc1xuICAgICAgICB0aGlzLl90b2tlbnMgPSBuZXcgcGVyc2lzdC5BdXRvUGVyc2lzdGVudE9iamVjdChcInRva2Vuc1wiLCAodikgPT4gQ2xpcXpBdHRyYWNrLnRva2VucyA9IHYsIDYwMDAwKTtcbiAgICAgICAgLy90aGlzLl9ibG9ja2VkID0gbmV3IHBlcnNpc3QuQXV0b1BlcnNpc3RlbnRPYmplY3QoXCJibG9ja2VkXCIsICh2KSA9PiBDbGlxekF0dHJhY2suYmxvY2tlZCA9IHYsIDMwMDAwMCk7XG5cbiAgICAgICAgQ2xpcXpBdHRyYWNrLnFzX3doaXRlbGlzdCA9IENsaXF6QXR0cmFjay5pc0Jsb29tRmlsdGVyRW5hYmxlZCgpID8gbmV3IEF0dHJhY2tCbG9vbUZpbHRlcigpIDogbmV3IFFTV2hpdGVsaXN0KCk7XG4gICAgICAgIENsaXF6QXR0cmFjay5xc193aGl0ZWxpc3QuaW5pdCgpO1xuICAgICAgICBDbGlxekF0dHJhY2suYmxvY2tMb2cgPSBuZXcgQmxvY2tMb2coQ2xpcXpBdHRyYWNrLnFzX3doaXRlbGlzdCk7XG4gICAgICAgIENsaXF6QXR0cmFjay5ibG9ja0xvZy5pbml0KCk7XG5cbiAgICAgICAgdGhpcy5fcmVxdWVzdEtleVZhbHVlID0gbmV3IHBlcnNpc3QuQXV0b1BlcnNpc3RlbnRPYmplY3QoXCJyZXF1ZXN0S2V5VmFsdWVcIiwgKHYpID0+IENsaXF6QXR0cmFjay5yZXF1ZXN0S2V5VmFsdWUgPSB2LCA2MDAwMCk7XG4gICAgICAgIC8vIGZvcmNlIGNsZWFuIHJlcXVlc3RLZXlWYWx1ZVxuICAgICAgICBldmVudHMuc3ViKFwiYXR0cmFjazpzYWZla2V5c191cGRhdGVkXCIsICh2ZXJzaW9uLCBmb3JjZUNsZWFuKSA9PiB7XG4gICAgICAgICAgICBpZiAoZm9yY2VDbGVhbikge1xuICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay5fcmVxdWVzdEtleVZhbHVlLmNsZWFyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGlmIChDbGlxekF0dHJhY2sucXNCbG9ja1J1bGUgPT0gbnVsbCkgQ2xpcXpBdHRyYWNrLmxvYWRCbG9ja1J1bGVzKCk7XG5cbiAgICAgICAgLy8gbG9hZCB0cmFja2VyIGNvbXBhbmllcyBkYXRhXG4gICAgICAgIHRoaXMuX3RyYWNrZXJMb2FkZXIgPSBuZXcgUmVzb3VyY2VMb2FkZXIoIFsnYW50aXRyYWNraW5nJywgJ3RyYWNrZXJfb3duZXJzLmpzb24nXSwge1xuICAgICAgICAgICAgcmVtb3RlVVJMOiAnaHR0cHM6Ly9jZG4uY2xpcXouY29tL2FudGktdHJhY2tpbmcvdHJhY2tlcl9vd25lcnNfbGlzdC5qc29uJyxcbiAgICAgICAgICAgIGNyb246IDI0ICogNjAgKiA2MCAqIDEwMDAsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLl90cmFja2VyTG9hZGVyLmxvYWQoKS50aGVuKENsaXF6QXR0cmFjay5fcGFyc2VUcmFja2VyQ29tcGFuaWVzKTtcbiAgICAgICAgdGhpcy5fdHJhY2tlckxvYWRlci5vblVwZGF0ZShDbGlxekF0dHJhY2suX3BhcnNlVHJhY2tlckNvbXBhbmllcyk7XG5cbiAgICAgICAgLy8gbG9hZCBjb29raWUgd2hpdGVsaXN0XG4gICAgICAgIHRoaXMuX2Nvb2tpZVdoaXRlbGlzdExvYWRlciA9IG5ldyBSZXNvdXJjZUxvYWRlciggWydhbnRpdHJhY2tpbmcnLCAnY29va2llX3doaXRlbGlzdC5qc29uJ10sIHtcbiAgICAgICAgICAgIHJlbW90ZVVSTDogJ2h0dHBzOi8vY2RuLmNsaXF6LmNvbS9hbnRpLXRyYWNraW5nL3doaXRlbGlzdC9jb29raWVfd2hpdGVsaXN0Lmpzb24nLFxuICAgICAgICAgICAgY3JvbjogMjQgKiA2MCAqIDYwICogMTAwMFxuICAgICAgICB9KTtcbiAgICAgICAgdmFyIHVwZGF0ZUNvb2tpZVdoaXRlbGlzdCA9IChkYXRhKSA9PiB7IENsaXF6QXR0cmFjay53aGl0ZWxpc3QgPSBkYXRhIH1cbiAgICAgICAgdGhpcy5fY29va2llV2hpdGVsaXN0TG9hZGVyLmxvYWQoKS50aGVuKHVwZGF0ZUNvb2tpZVdoaXRlbGlzdCk7XG4gICAgICAgIHRoaXMuX2Nvb2tpZVdoaXRlbGlzdExvYWRlci5vblVwZGF0ZSh1cGRhdGVDb29raWVXaGl0ZWxpc3QpO1xuXG4gICAgICAgIENsaXF6QXR0cmFjay5jaGVja0luc3RhbGxlZEFkZG9ucygpO1xuXG4gICAgICAgIGlmIChDbGlxekF0dHJhY2sudmlzaXRDYWNoZSA9PSBudWxsKSB7XG4gICAgICAgICAgICBDbGlxekF0dHJhY2sudmlzaXRDYWNoZSA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgQ2xpcXpBdHRyYWNrLmluaXRQYWNlbWFrZXIoKTtcbiAgICAgICAgcGFjZW1ha2VyLnN0YXJ0KCk7XG5cbiAgICAgICAgV2ViUmVxdWVzdC5vbkJlZm9yZVJlcXVlc3QuYWRkTGlzdGVuZXIoQ2xpcXpBdHRyYWNrLmh0dHBvcGVuT2JzZXJ2ZXIub2JzZXJ2ZSwgdW5kZWZpbmVkLCBbJ2Jsb2NraW5nJ10pO1xuICAgICAgICBXZWJSZXF1ZXN0Lm9uQmVmb3JlU2VuZEhlYWRlcnMuYWRkTGlzdGVuZXIoQ2xpcXpBdHRyYWNrLmh0dHBtb2RPYnNlcnZlci5vYnNlcnZlLCB1bmRlZmluZWQsIFsnYmxvY2tpbmcnXSk7XG4gICAgICAgIFdlYlJlcXVlc3Qub25IZWFkZXJzUmVjZWl2ZWQuYWRkTGlzdGVuZXIoQ2xpcXpBdHRyYWNrLmh0dHBSZXNwb25zZU9ic2VydmVyLm9ic2VydmUpO1xuXG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBDbGlxekF0dHJhY2suZGlzYWJsZWRfc2l0ZXMgPSBuZXcgU2V0KEpTT04ucGFyc2UoQ2xpcXpVdGlscy5nZXRQcmVmKENsaXF6QXR0cmFjay5ESVNBQkxFRF9TSVRFU19QUkVGLCBcIltdXCIpKSk7XG4gICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLmRpc2FibGVkX3NpdGVzID0gbmV3IFNldCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgQ2xpcXpBdHRyYWNrLmxvY2FsX3RyYWNraW5nID0gbmV3IFRyYWNraW5nVGFibGUoKTtcblxuXG4gICAgICAgIC8vIG5vdGU6IGlmIGEgMCB2YWx1ZSB3ZXJlIHRvIGJlIHNhdmVkLCB0aGUgZGVmYXVsdCB3b3VsZCBiZSBwcmVmZXJyZWQuIFRoaXMgaXMgb2sgYmVjYXVzZSB0aGVzZSBvcHRpb25zXG4gICAgICAgIC8vIGNhbm5vdCBoYXZlIDAgdmFsdWVzLlxuICAgICAgICBDbGlxekF0dHJhY2suc2FmZWtleVZhbHVlc1RocmVzaG9sZCA9IHBhcnNlSW50KHBlcnNpc3QuZ2V0VmFsdWUoJ3NhZmVrZXlWYWx1ZXNUaHJlc2hvbGQnKSkgfHwgNDtcbiAgICAgICAgQ2xpcXpBdHRyYWNrLnNob3J0VG9rZW5MZW5ndGggPSBwYXJzZUludChwZXJzaXN0LmdldFZhbHVlKCdzaG9ydFRva2VuTGVuZ3RoJykpIHx8IDg7XG5cbiAgICAgICAgQ2xpcXpBdHRyYWNrLnBsYWNlSG9sZGVyID0gcGVyc2lzdC5nZXRWYWx1ZSgncGxhY2VIb2xkZXInLCBDbGlxekF0dHJhY2sucGxhY2VIb2xkZXIpO1xuICAgICAgICBDbGlxekF0dHJhY2suY2xpcXpIZWFkZXIgPSBwZXJzaXN0LmdldFZhbHVlKCdjbGlxekhlYWRlcicsIENsaXF6QXR0cmFjay5jbGlxekhlYWRlcik7XG5cbiAgICAgICAgQ2xpcXpBdHRyYWNrLnRyYWNrZXJQcm94eSA9IG5ldyBUcmFja2VyUHJveHkoKTtcbiAgICAgICAgQ2xpcXpBdHRyYWNrLnRyYWNrZXJQcm94eS5pbml0KCk7XG4gICAgfSxcbiAgICAvKiogUGVyLXdpbmRvdyBtb2R1bGUgaW5pdGlhbGlzYXRpb25cbiAgICAgKi9cbiAgICBpbml0V2luZG93OiBmdW5jdGlvbih3aW5kb3cpIHtcbiAgICAgICAgaWYgKENsaXF6QXR0cmFjay5nZXRCcm93c2VyTWFqb3JWZXJzaW9uKCkgPCBDbGlxekF0dHJhY2suTUlOX0JST1dTRVJfVkVSU0lPTikge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIC8vIExvYWQgbGlzdGVybmVyczpcbiAgICAgICAgd2luZG93LkNMSVFaLkNvcmUudXJsYmFyLmFkZEV2ZW50TGlzdGVuZXIoJ2ZvY3VzJywgb25VcmxiYXJGb2N1cyk7XG5cbiAgICAgICAgQ2xpcXpBdHRyYWNrLmdldFByaXZhdGVWYWx1ZXMod2luZG93KTtcbiAgICB9LFxuICAgIHVubG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIGRvbid0IG5lZWQgdG8gdW5sb2FkIGlmIGRpc2FibGVkXG4gICAgICAgIGlmIChDbGlxekF0dHJhY2suZ2V0QnJvd3Nlck1ham9yVmVyc2lvbigpIDwgQ2xpcXpBdHRyYWNrLk1JTl9CUk9XU0VSX1ZFUlNJT04pIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICAvL0NoZWNrIGlzIGFjdGl2ZSB1c2FnZSwgd2FzIHNlbnRcblxuICAgICAgICAvLyBmb3JjZSBzZW5kIHRhYiB0ZWxlbWV0cnkgZGF0YVxuICAgICAgICBDbGlxekF0dHJhY2sudHBfZXZlbnRzLmNvbW1pdCh0cnVlLCB0cnVlKTtcbiAgICAgICAgQ2xpcXpBdHRyYWNrLnRwX2V2ZW50cy5wdXNoKHRydWUpO1xuXG4gICAgICAgIENsaXF6QXR0cmFjay5ibG9ja0xvZy5kZXN0cm95KCk7XG4gICAgICAgIENsaXF6QXR0cmFjay5xc193aGl0ZWxpc3QuZGVzdHJveSgpO1xuXG4gICAgICAgIGJyb3dzZXIuZm9yRWFjaFdpbmRvdyhDbGlxekF0dHJhY2sudW5sb2FkV2luZG93KTtcblxuICAgICAgICBXZWJSZXF1ZXN0Lm9uQmVmb3JlUmVxdWVzdC5yZW1vdmVMaXN0ZW5lcihDbGlxekF0dHJhY2suaHR0cG9wZW5PYnNlcnZlci5vYnNlcnZlKTtcbiAgICAgICAgV2ViUmVxdWVzdC5vbkJlZm9yZVNlbmRIZWFkZXJzLnJlbW92ZUxpc3RlbmVyKENsaXF6QXR0cmFjay5odHRwbW9kT2JzZXJ2ZXIub2JzZXJ2ZSk7XG4gICAgICAgIFdlYlJlcXVlc3Qub25IZWFkZXJzUmVjZWl2ZWQucmVtb3ZlTGlzdGVuZXIoQ2xpcXpBdHRyYWNrLmh0dHBSZXNwb25zZU9ic2VydmVyLm9ic2VydmUpO1xuXG4gICAgICAgIHBhY2VtYWtlci5zdG9wKCk7XG4gICAgICAgIEh0dHBSZXF1ZXN0Q29udGV4dC51bmxvYWRDbGVhbmVyKCk7XG5cbiAgICAgICAgQ2xpcXpBdHRyYWNrLnRyYWNrZXJQcm94eS5kZXN0cm95KCk7XG4gICAgfSxcbiAgICB1bmxvYWRXaW5kb3c6IGZ1bmN0aW9uKHdpbmRvdykge1xuICAgICAgICBpZiAod2luZG93LkNMSVFaKSB7XG4gICAgICAgICAgICB3aW5kb3cuQ0xJUVouQ29yZS51cmxiYXIucmVtb3ZlRXZlbnRMaXN0ZW5lcignZm9jdXMnLCBvblVybGJhckZvY3VzKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY2hlY2tJbnN0YWxsZWRBZGRvbnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBTeXN0ZW0uaW1wb3J0KCdwbGF0Zm9ybS9hbnRpdHJhY2tpbmcvYWRkb24tY2hlY2snKS50aGVuKCAoYWRkb25zKSA9PiB7XG4gICAgICAgICAgICBDbGlxekF0dHJhY2suc2ltaWxhckFkZG9uID0gYWRkb25zLmNoZWNrSW5zdGFsbGVkQWRkb25zKCk7XG4gICAgICAgIH0pLmNhdGNoKCAoZSkgPT4ge1xuICAgICAgICAgICAgdXRpbHMubG9nKFwiRXJyb3IgbG9hZGluZyBhZGRvbiBjaGVja2VyXCIsIFwiYXR0cmFja1wiKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBnZW5lcmF0ZUF0dHJhY2tQYXlsb2FkOiBmdW5jdGlvbihkYXRhLCB0cykge1xuICAgICAgICBjb25zdCBleHRyYUF0dHJzID0gQ2xpcXpBdHRyYWNrLnFzX3doaXRlbGlzdC5nZXRWZXJzaW9uKCk7XG4gICAgICAgIGV4dHJhQXR0cnMudmVyID0gQ2xpcXpBdHRyYWNrLlZFUlNJT047XG4gICAgICAgIHRzID0gdHMgfHwgZGF0ZXRpbWUuZ2V0SG91clRpbWVzdGFtcCgpO1xuICAgICAgICByZXR1cm4gZ2VuZXJhdGVQYXlsb2FkKGRhdGEsIHRzLCBmYWxzZSwgZXh0cmFBdHRycyk7XG4gICAgfSxcbiAgICBzZW5kVG9rZW5zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gc2VuZCB0b2tlbnMgZXZlcnkgNSBtaW51dGVzXG4gICAgICAgIGxldCBkYXRhID0ge30sXG4gICAgICAgICAgICBob3VyID0gZGF0ZXRpbWUuZ2V0VGltZSgpLFxuICAgICAgICAgICAgbGltaXQgPSBPYmplY3Qua2V5cyhDbGlxekF0dHJhY2sudG9rZW5zKS5sZW5ndGggLyAxMjtcblxuICAgICAgICAvLyBzb3J0IHRyYWNrZXIga2V5cyBieSBsYXN0U2VudCwgaS5lLiBzZW5kIG9sZGVzdCBkYXRhIGZpcnN0XG4gICAgICAgIGxldCBzb3J0ZWRUcmFja2VycyA9IE9iamVjdC5rZXlzKENsaXF6QXR0cmFjay50b2tlbnMpLnNvcnQoKGEsIGIpID0+IHtcbiAgICAgICAgICAgIHJldHVybiBwYXJzZUludChDbGlxekF0dHJhY2sudG9rZW5zW2FdLmxhc3RTZW50IHx8IDApIC0gcGFyc2VJbnQoQ2xpcXpBdHRyYWNrLnRva2Vuc1tiXS5sYXN0U2VudCB8fCAwKVxuICAgICAgICB9KTtcblxuICAgICAgICBmb3IgKGxldCBpIGluIHNvcnRlZFRyYWNrZXJzKSB7XG4gICAgICAgICAgICBsZXQgdHJhY2tlciA9IHNvcnRlZFRyYWNrZXJzW2ldO1xuXG4gICAgICAgICAgICBpZiAobGltaXQgPiAwICYmIE9iamVjdC5rZXlzKGRhdGEpLmxlbmd0aCA+IGxpbWl0KSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGxldCB0b2tlbkRhdGEgPSBDbGlxekF0dHJhY2sudG9rZW5zW3RyYWNrZXJdO1xuICAgICAgICAgICAgaWYgKCEodG9rZW5EYXRhLmxhc3RTZW50KSB8fCB0b2tlbkRhdGEubGFzdFNlbnQgPCBob3VyKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlKHRva2VuRGF0YS5sYXN0U2VudCk7XG4gICAgICAgICAgICAgICAgZGF0YVt0cmFja2VyXSA9IGFub255bWl6ZVRyYWNrZXJUb2tlbnModG9rZW5EYXRhKTtcbiAgICAgICAgICAgICAgICBkZWxldGUoQ2xpcXpBdHRyYWNrLnRva2Vuc1t0cmFja2VyXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoT2JqZWN0LmtleXMoZGF0YSkubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgY29uc3QgY29tcHJlc3MgPSBjb21wcmVzc2lvbkF2YWlsYWJsZSgpO1xuXG4gICAgICAgICAgICBzcGxpdFRlbGVtZXRyeURhdGEoZGF0YSwgMjAwMDApLm1hcCgoZCkgPT4ge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBheWwgPSBDbGlxekF0dHJhY2suZ2VuZXJhdGVBdHRyYWNrUGF5bG9hZChkKTtcbiAgICAgICAgICAgICAgICBjb25zdCBtc2cgPSB7XG4gICAgICAgICAgICAgICAgICAgICd0eXBlJzogdGVsZW1ldHJ5Lm1zZ1R5cGUsXG4gICAgICAgICAgICAgICAgICAgICdhY3Rpb24nOiAnYXR0cmFjay50b2tlbnMnLFxuICAgICAgICAgICAgICAgICAgICAncGF5bG9hZCc6IHBheWxcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmICggY29tcHJlc3MgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5jb21wcmVzc2VkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgbXNnLnBheWxvYWQgPSBjb21wcmVzc0pTT05Ub0Jhc2U2NChwYXlsKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdGVsZW1ldHJ5LnRlbGVtZXRyeShtc2cpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgQ2xpcXpBdHRyYWNrLl90b2tlbnMuc2V0RGlydHkoKTtcbiAgICB9LFxuICAgIGhvdXJDaGFuZ2VkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gY2xlYXIgdGhlIHRva2VucyBpZiB0aGUgaG91ciBjaGFuZ2VkXG4gICAgICAgIGlmIChDbGlxekF0dHJhY2sudG9rZW5zICYmIE9iamVjdC5rZXlzKENsaXF6QXR0cmFjay50b2tlbnMpLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgIGlmIChDbGlxekF0dHJhY2subG9jYWxfdHJhY2tpbmcuaXNFbmFibGVkKCkpIHtcbiAgICAgICAgICAgICAgICBDbGlxekF0dHJhY2subG9jYWxfdHJhY2tpbmcubG9hZFRva2VucyhDbGlxekF0dHJhY2sudG9rZW5zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRyaWdnZXIgb3RoZXIgaG91cmx5IGV2ZW50c1xuICAgICAgICBldmVudHMucHViKFwiYXR0cmFjazpob3VyX2NoYW5nZWRcIik7XG4gICAgfSxcbiAgICB1cGRhdGVDb25maWc6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdG9kYXkgPSBkYXRldGltZS5nZXRUaW1lKCkuc3Vic3RyaW5nKDAsIDEwKTtcbiAgICAgICAgdXRpbHMuaHR0cEdldChDbGlxekF0dHJhY2suVkVSU0lPTkNIRUNLX1VSTCArXCI/XCIrIHRvZGF5LCBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgICAgIC8vIG9uIGxvYWRcbiAgICAgICAgICAgIHZhciB2ZXJzaW9uY2hlY2sgPSBKU09OLnBhcnNlKHJlcS5yZXNwb25zZSk7XG5cbiAgICAgICAgICAgIC8vIGNvbmZpZyBpbiB2ZXJzaW9uY2hlY2tcbiAgICAgICAgICAgIGlmICh2ZXJzaW9uY2hlY2sucGxhY2VIb2xkZXIpIHtcbiAgICAgICAgICAgICAgICBwZXJzaXN0LnNldFZhbHVlKCdwbGFjZUhvbGRlcicsIHZlcnNpb25jaGVjay5wbGFjZUhvbGRlcik7XG4gICAgICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLnBsYWNlSG9sZGVyID0gdmVyc2lvbmNoZWNrLnBsYWNlSG9sZGVyO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodmVyc2lvbmNoZWNrLnNob3J0VG9rZW5MZW5ndGgpIHtcbiAgICAgICAgICAgICAgICBwZXJzaXN0LnNldFZhbHVlKCdzaG9ydFRva2VuTGVuZ3RoJywgdmVyc2lvbmNoZWNrLnNob3J0VG9rZW5MZW5ndGgpO1xuICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay5zaG9ydFRva2VuTGVuZ3RoID0gcGFyc2VJbnQodmVyc2lvbmNoZWNrLnNob3J0VG9rZW5MZW5ndGgpIHx8IENsaXF6QXR0cmFjay5zaG9ydFRva2VuTGVuZ3RoO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodmVyc2lvbmNoZWNrLnNhZmVrZXlWYWx1ZXNUaHJlc2hvbGQpIHtcbiAgICAgICAgICAgICAgICBwZXJzaXN0LnNldFZhbHVlKCdzYWZla2V5VmFsdWVzVGhyZXNob2xkJywgdmVyc2lvbmNoZWNrLnNhZmVrZXlWYWx1ZXNUaHJlc2hvbGQpO1xuICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay5zYWZla2V5VmFsdWVzVGhyZXNob2xkID0gcGFyc2VJbnQodmVyc2lvbmNoZWNrLnNhZmVrZXlWYWx1ZXNUaHJlc2hvbGQpIHx8IENsaXF6QXR0cmFjay5zYWZla2V5VmFsdWVzVGhyZXNob2xkO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodmVyc2lvbmNoZWNrLmNsaXF6SGVhZGVyKSB7XG4gICAgICAgICAgICAgICAgcGVyc2lzdC5zZXRWYWx1ZSgnY2xpcXpIZWFkZXInLCB2ZXJzaW9uY2hlY2suY2xpcXpIZWFkZXIpO1xuICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay5jbGlxekhlYWRlciA9IHZlcnNpb25jaGVjay5jbGlxekhlYWRlcjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gZmlyZSBldmVudHMgZm9yIGxpc3QgdXBkYXRlXG4gICAgICAgICAgICBldmVudHMucHViKFwiYXR0cmFjazp1cGRhdGVkX2NvbmZpZ1wiLCB2ZXJzaW9uY2hlY2spO1xuICAgICAgICB9LCB1dGlscy5sb2csIDEwMDAwKTtcbiAgICB9LFxuICAgIHBydW5lUmVxdWVzdEtleVZhbHVlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRheSA9IGRhdGV0aW1lLm5ld1VUQ0RhdGUoKTtcbiAgICAgICAgZGF5LnNldERhdGUoZGF5LmdldERhdGUoKSAtIENsaXF6QXR0cmFjay5zYWZlS2V5RXhwaXJlKTtcbiAgICAgICAgdmFyIGRheUN1dG9mZiAgPSBkYXRldGltZS5kYXRlU3RyaW5nKGRheSk7XG4gICAgICAgIGZvciAodmFyIHMgaW4gQ2xpcXpBdHRyYWNrLnJlcXVlc3RLZXlWYWx1ZSkge1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIENsaXF6QXR0cmFjay5yZXF1ZXN0S2V5VmFsdWVbc10pIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciB0b2sgaW4gQ2xpcXpBdHRyYWNrLnJlcXVlc3RLZXlWYWx1ZVtzXVtrZXldKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChDbGlxekF0dHJhY2sucmVxdWVzdEtleVZhbHVlW3NdW2tleV1bdG9rXSA8IGRheUN1dG9mZikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIENsaXF6QXR0cmFjay5yZXF1ZXN0S2V5VmFsdWVbc11ba2V5XVt0b2tdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmIChPYmplY3Qua2V5cyhDbGlxekF0dHJhY2sucmVxdWVzdEtleVZhbHVlW3NdW2tleV0pLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBDbGlxekF0dHJhY2sucmVxdWVzdEtleVZhbHVlW3NdW2tleV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKENsaXF6QXR0cmFjay5yZXF1ZXN0S2V5VmFsdWVbc10pLmxlbmd0aCA9PSAwKSB7XG4gICAgICAgICAgICAgICAgZGVsZXRlIENsaXF6QXR0cmFjay5yZXF1ZXN0S2V5VmFsdWVbc107XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgQ2xpcXpBdHRyYWNrLl9yZXF1ZXN0S2V5VmFsdWUuc2V0RGlydHkoKTtcbiAgICAgICAgQ2xpcXpBdHRyYWNrLl9yZXF1ZXN0S2V5VmFsdWUuc2F2ZSgpO1xuICAgIH0sXG4gICAgbG9hZEJsb2NrUnVsZXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICBDbGlxekF0dHJhY2sucXNCbG9ja1J1bGUgPSBbXTtcbiAgICAgICAgQ2xpcXpVdGlscy5sb2FkUmVzb3VyY2UoQ2xpcXpBdHRyYWNrLlVSTF9CTE9DS19SVUxFUywgZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay5xc0Jsb2NrUnVsZSA9IEpTT04ucGFyc2UocmVxLnJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay5xc0Jsb2NrUnVsZSA9IFtdO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGlzSW5XaGl0ZWxpc3Q6IGZ1bmN0aW9uKGRvbWFpbikge1xuICAgICAgICBpZighQ2xpcXpBdHRyYWNrLndoaXRlbGlzdCkgcmV0dXJuIGZhbHNlO1xuICAgICAgICB2YXIga2V5cyA9IENsaXF6QXR0cmFjay53aGl0ZWxpc3Q7XG4gICAgICAgIGZvcih2YXIgaT0wO2k8a2V5cy5sZW5ndGg7aSsrKSB7XG4gICAgICAgICAgICB2YXIgaW5kID0gZG9tYWluLmluZGV4T2Yoa2V5c1tpXSk7XG4gICAgICAgICAgICBpZiAoaW5kPj0wKSB7XG4gICAgICAgICAgICAgICAgaWYgKChpbmQra2V5c1tpXS5sZW5ndGgpID09IGRvbWFpbi5sZW5ndGgpIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9LFxuICAgIGNoZWNrVG9rZW5zOiBmdW5jdGlvbih1cmxfcGFydHMsIHNvdXJjZV91cmwsIGNvb2tpZXZhbHVlLCBzdGF0cywgc291cmNlX3VybF9wYXJ0cykge1xuICAgICAgICAvLyBiYWQgdG9rZW5zIHdpbGwgc3RpbGwgYmUgcmV0dXJuZWQgaW4gdGhlIHNhbWUgZm9ybWF0XG5cbiAgICAgICAgdmFyIHMgPSBnZXRHZW5lcmFsRG9tYWluKHVybF9wYXJ0cy5ob3N0bmFtZSk7XG4gICAgICAgIHMgPSBtZDUocykuc3Vic3RyKDAsIDE2KTtcbiAgICAgICAgLy8gSWYgaXQncyBhIHJhcmUgM3JkIHBhcnR5LCB3ZSBkb24ndCBkbyB0aGUgcmVzdFxuICAgICAgICBpZiAoIUNsaXF6QXR0cmFjay5xc193aGl0ZWxpc3QuaXNUcmFja2VyRG9tYWluKHMpKSByZXR1cm4gW107XG5cbiAgICAgICAgdmFyIHNvdXJjZUQgPSBtZDUoc291cmNlX3VybF9wYXJ0cy5ob3N0bmFtZSkuc3Vic3RyKDAsIDE2KTtcbiAgICAgICAgdmFyIHRvZGF5ID0gZGF0ZXRpbWUuZ2V0VGltZSgpLnN1YnN0cigwLCA4KTtcblxuICAgICAgICBpZiAodXJsX3BhcnRzWydxdWVyeSddLmxlbmd0aCA9PSAwICYmIHVybF9wYXJ0c1sncGFyYW1ldGVycyddLmxlbmd0aCA9PSAwKSByZXR1cm4gW107XG4gICAgICAgIHZhciB0b2s7XG5cbiAgICAgICAgdmFyIGJhZFRva2VucyA9IFtdO1xuXG4gICAgICAgIC8vIHN0YXRzIGtleXNcbiAgICAgICAgWydjb29raWUnLCAncHJpdmF0ZScsICdjb29raWVfYjY0JywgJ3ByaXZhdGVfYjY0JywgJ3NhZmVrZXknLCAnd2hpdGVsaXN0ZWQnLFxuICAgICAgICAgJ2Nvb2tpZV9uZXdUb2tlbicsICdjb29raWVfY291bnRUaHJlc2hvbGQnLCAncHJpdmF0ZV9uZXdUb2tlbicsICdwcml2YXRlX2NvdW50VGhyZXNob2xkJyxcbiAgICAgICAgICdzaG9ydF9ub19oYXNoJywgJ2Nvb2tpZV9iNjRfbmV3VG9rZW4nLCAnY29va2llX2I2NF9jb3VudFRocmVzaG9sZCcsICdwcml2YXRlX2I2NF9uZXdUb2tlbicsXG4gICAgICAgICAncHJpdmF0ZV9iNjRfY291bnRUaHJlc2hvbGQnLCAncXNfbmV3VG9rZW4nLCAncXNfY291bnRUaHJlc2hvbGQnLCBdLmZvckVhY2goZnVuY3Rpb24oaykge3N0YXRzW2tdID0gMDt9KTtcblxuICAgICAgICB2YXIgX2NvdW50Q2hlY2sgPSBmdW5jdGlvbih0b2spIHtcbiAgICAgICAgICAgIC8vIGZvciB0b2tlbiBsZW5ndGggPCAxMiBhbmQgbWF5IGJlIG5vdCBhIGhhc2gsIHdlIGxldCBpdCBwYXNzXG4gICAgICAgICAgICBpZiAodG9rLmxlbmd0aCA8IDEyICYmICFDbGlxekF0dHJhY2suaGFzaFByb2IuaXNIYXNoKHRvaykpXG4gICAgICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgICAgICAvLyB1cGRhdGUgdG9rZW5Eb21haW5cbiAgICAgICAgICAgIHRvayA9IG1kNSh0b2spO1xuICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLmJsb2NrTG9nLnRva2VuRG9tYWluLmFkZFRva2VuT25GaXJzdFBhcnR5KHRvaywgc291cmNlRCk7XG4gICAgICAgICAgICByZXR1cm4gQ2xpcXpBdHRyYWNrLmJsb2NrTG9nLnRva2VuRG9tYWluLmdldE5GaXJzdFBhcnRpZXNGb3JUb2tlbih0b2spO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBfaW5jclN0YXRzID0gZnVuY3Rpb24oY2MsIHByZWZpeCwgdG9rLCBrZXksIHZhbCkge1xuICAgICAgICAgICAgaWYgKGNjID09IDApXG4gICAgICAgICAgICAgICAgc3RhdHNbJ3Nob3J0X25vX2hhc2gnXSsrO1xuICAgICAgICAgICAgZWxzZSBpZiAoY2MgPCBDbGlxekF0dHJhY2sudG9rZW5Eb21haW5Db3VudFRocmVzaG9sZClcbiAgICAgICAgICAgICAgICBzdGF0c1twcmVmaXgrJ19uZXdUb2tlbiddKys7XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBfYWRkQmxvY2tMb2cocywga2V5LCB2YWwsIHByZWZpeCk7XG4gICAgICAgICAgICAgICAgYmFkVG9rZW5zLnB1c2godmFsKTtcbiAgICAgICAgICAgICAgICBpZiAoY2MgPT0gQ2xpcXpBdHRyYWNrLnRva2VuRG9tYWluQ291bnRUaHJlc2hvbGQpXG4gICAgICAgICAgICAgICAgICAgIHN0YXRzW3ByZWZpeCArICdfY291bnRUaHJlc2hvbGQnXSsrO1xuICAgICAgICAgICAgICAgIHN0YXRzW3ByZWZpeF0rKztcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgX2FkZEJsb2NrTG9nID0gKHMsIGtleSwgdmFsLCBwcmVmaXgpID0+IHtcbiAgICAgICAgICAgIENsaXF6QXR0cmFjay5ibG9ja0xvZy5ibG9ja0xvZy5hZGQoc291cmNlX3VybCwgcywga2V5LCB2YWwsIHByZWZpeCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgX2NoZWNrVG9rZW5zID0gZnVuY3Rpb24oa2V5LCB2YWwpIHtcbiAgICAgICAgICAgIENsaXF6QXR0cmFjay5ibG9ja0xvZy5pbmNyZW1lbnRDaGVja2VkVG9rZW5zKCk7XG5cbiAgICAgICAgICAgIHZhciB0b2sgPSBkVVJJQyh2YWwpO1xuICAgICAgICAgICAgd2hpbGUgKHRvayAhPSBkVVJJQyh0b2spKSB7XG4gICAgICAgICAgICAgICAgdG9rID0gZFVSSUModG9rKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHRvay5sZW5ndGggPCBDbGlxekF0dHJhY2suc2hvcnRUb2tlbkxlbmd0aCB8fCBzb3VyY2VfdXJsLmluZGV4T2YodG9rKSA+IC0xKSByZXR1cm47XG5cbiAgICAgICAgICAgIC8vIEJhZCB2YWx1ZXMgKGNvb2tpZXMpXG4gICAgICAgICAgICBmb3IgKHZhciBjIGluIGNvb2tpZXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCh0b2suaW5kZXhPZihjKSA+IC0xICYmIGMubGVuZ3RoID49IENsaXF6QXR0cmFjay5zaG9ydFRva2VuTGVuZ3RoKSB8fCBjLmluZGV4T2YodG9rKSA+IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChDbGlxekF0dHJhY2suZGVidWcpIENsaXF6VXRpbHMubG9nKCdzYW1lIHZhbHVlIGFzIGNvb2tpZSAnICsgdmFsLCAndG9raycpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2MgPSBfY291bnRDaGVjayh0b2spO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYyAhPSB0b2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjID0gTWF0aC5tYXgoY2MsIF9jb3VudENoZWNrKGMpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoX2luY3JTdGF0cyhjYywgJ2Nvb2tpZScsIHRvaywga2V5LCB2YWwpKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gcHJpdmF0ZSB2YWx1ZSAoZnJvbSBqcyBmdW5jdGlvbiByZXR1cm5zKVxuICAgICAgICAgICAgZm9yICh2YXIgYyBpbiBDbGlxekF0dHJhY2sucHJpdmF0ZVZhbHVlcykge1xuICAgICAgICAgICAgICAgIGlmICgodG9rLmluZGV4T2YoYykgPiAtMSAmJiBjLmxlbmd0aCA+PSBDbGlxekF0dHJhY2suc2hvcnRUb2tlbkxlbmd0aCkgfHwgYy5pbmRleE9mKHRvaykgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmRlYnVnKSBDbGlxelV0aWxzLmxvZygnc2FtZSBwcml2YXRlIHZhbHVlcyAnICsgdmFsLCAndG9raycpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2MgPSBfY291bnRDaGVjayh0b2spO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYyAhPSB0b2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNjID0gTWF0aC5tYXgoY2MsIF9jb3VudENoZWNrKGMpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoX2luY3JTdGF0cyhjYywgJ3ByaXZhdGUnLCB0b2ssIGtleSwgdmFsKSlcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgYjY0ID0gbnVsbDtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgYjY0ID0gYXRvYih0b2spO1xuICAgICAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoYjY0ICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBjIGluIGNvb2tpZXZhbHVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICgoYjY0LmluZGV4T2YoYykgPiAtMSAmJiBjLmxlbmd0aCA+PSBDbGlxekF0dHJhY2suc2hvcnRUb2tlbkxlbmd0aCkgfHwgYy5pbmRleE9mKGI2NCkgPiAtMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay5kZWJ1ZykgQ2xpcXpVdGlscy5sb2coJ3NhbWUgdmFsdWUgYXMgY29va2llICcgKyBiNjQsICd0b2trLWI2NCcpO1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGNjID0gX2NvdW50Q2hlY2sodG9rKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjICE9IHRvaykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNjID0gTWF0aC5tYXgoY2MsIF9jb3VudENoZWNrKGMpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChfaW5jclN0YXRzKGNjLCAnY29va2llX2I2NCcsIHRvaywga2V5LCB2YWwpKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBmb3IgKHZhciBjIGluIENsaXF6QXR0cmFjay5wcml2YXRlVmFsdWVzKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChiNjQuaW5kZXhPZihjKSA+IC0xICYmIGMubGVuZ3RoID49IENsaXF6QXR0cmFjay5zaG9ydFRva2VuTGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmRlYnVnKSBDbGlxelV0aWxzLmxvZygnc2FtZSBwcml2YXRlIHZhbHVlcyAnICsgYjY0LCAndG9ray1iNjQnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBjYyA9IF9jb3VudENoZWNrKHRvayk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoYyAhPSB0b2spIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYyA9IE1hdGgubWF4KGNjLCBfY291bnRDaGVjayhjKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoX2luY3JTdGF0cyhjYywgJ3ByaXZhdGVfYjY0JywgdG9rLCBrZXksIHZhbCkpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgICAgIC8vIEdvb2Qga2V5cy5cbiAgICAgICAgICAgIGlmIChDbGlxekF0dHJhY2sucXNfd2hpdGVsaXN0LmlzU2FmZUtleShzLCBtZDUoa2V5KSkpIHtcbiAgICAgICAgICAgICAgICBzdGF0c1snc2FmZWtleSddKys7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoc291cmNlX3VybC5pbmRleE9mKHRvaykgPT0gLTEpIHtcbiAgICAgICAgICAgICAgICBpZiAoIUNsaXF6QXR0cmFjay5xc193aGl0ZWxpc3QuaXNTYWZlVG9rZW4ocywgbWQ1KHRvaykpKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjYyA9IF9jb3VudENoZWNrKHRvayk7XG4gICAgICAgICAgICAgICAgICAgIF9pbmNyU3RhdHMoY2MsICdxcycsIHRvaywga2V5LCB2YWwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZVxuICAgICAgICAgICAgICAgICAgICBzdGF0c1snd2hpdGVsaXN0ZWQnXSsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHVybF9wYXJ0cy5nZXRLZXlWYWx1ZXMoKS5mb3JFYWNoKGZ1bmN0aW9uIChrdikge1xuICAgICAgICAgIF9jaGVja1Rva2Vucyhrdi5rLCBrdi52KTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8gdXBkYXRlIGJsb2NrZWRUb2tlblxuICAgICAgICBDbGlxekF0dHJhY2suYmxvY2tMb2cuaW5jcmVtZW50QmxvY2tlZFRva2VucyhiYWRUb2tlbnMubGVuZ3RoKTtcbiAgICAgICAgcmV0dXJuIGJhZFRva2VucztcbiAgICB9LFxuICAgIGV4YW1pbmVUb2tlbnM6IGZ1bmN0aW9uKHVybF9wYXJ0cykge1xuICAgICAgICB2YXIgZGF5ID0gZGF0ZXRpbWUubmV3VVRDRGF0ZSgpO1xuICAgICAgICB2YXIgdG9kYXkgPSBkYXRldGltZS5kYXRlU3RyaW5nKGRheSk7XG4gICAgICAgIC8vIHNhdmUgYXBwZWFyZWQgdG9rZW5zIHdpdGggZmllbGQgbmFtZVxuICAgICAgICAvLyBtYXJrIGZpZWxkIG5hbWUgYXMgXCJzYWZlXCIgaWYgZGlmZmVyZW50IHZhbHVlcyBhcHBlYXJzXG4gICAgICAgIHZhciBzID0gZ2V0R2VuZXJhbERvbWFpbih1cmxfcGFydHMuaG9zdG5hbWUpO1xuICAgICAgICBzID0gbWQ1KHMpLnN1YnN0cigwLCAxNik7XG4gICAgICAgIHVybF9wYXJ0cy5nZXRLZXlWYWx1ZXNNRDUoKS5maWx0ZXIoZnVuY3Rpb24gKGt2KSB7XG4gICAgICAgICAgcmV0dXJuIGt2LnZfbGVuID49IENsaXF6QXR0cmFjay5zaG9ydFRva2VuTGVuZ3RoO1xuICAgICAgICB9KS5mb3JFYWNoKGZ1bmN0aW9uIChrdikge1xuICAgICAgICAgICAgdmFyIGtleSA9IGt2LmssXG4gICAgICAgICAgICAgICAgdG9rID0ga3YudjtcbiAgICAgICAgICAgIGlmIChDbGlxekF0dHJhY2sucXNfd2hpdGVsaXN0LmlzU2FmZUtleShzLCBrZXkpKVxuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIGlmIChDbGlxekF0dHJhY2sucmVxdWVzdEtleVZhbHVlW3NdID09IG51bGwpXG4gICAgICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLnJlcXVlc3RLZXlWYWx1ZVtzXSA9IHt9O1xuICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay5yZXF1ZXN0S2V5VmFsdWVbc11ba2V5XSA9PSBudWxsKVxuICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay5yZXF1ZXN0S2V5VmFsdWVbc11ba2V5XSA9IHt9O1xuXG4gICAgICAgICAgICBDbGlxekF0dHJhY2sucmVxdWVzdEtleVZhbHVlW3NdW2tleV1bdG9rXSA9IHRvZGF5O1xuICAgICAgICAgICAgLy8gc2VlIGF0IGxlYXN0IDMgZGlmZmVyZW50IHZhbHVlIHVudGlsIGl0J3Mgc2FmZVxuICAgICAgICAgICAgbGV0IHZhbHVlQ291bnQgPSBPYmplY3Qua2V5cyhDbGlxekF0dHJhY2sucmVxdWVzdEtleVZhbHVlW3NdW2tleV0pLmxlbmd0aFxuICAgICAgICAgICAgaWYgKCB2YWx1ZUNvdW50ID4gQ2xpcXpBdHRyYWNrLnNhZmVrZXlWYWx1ZXNUaHJlc2hvbGQgKSB7XG4gICAgICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLnFzX3doaXRlbGlzdC5hZGRTYWZlS2V5KHMsIGtleSwgdmFsdWVDb3VudCk7XG4gICAgICAgICAgICAgICAgLy8ga2VlcCB0aGUgbGFzdCBzZWVuIHRva2VuXG4gICAgICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLnJlcXVlc3RLZXlWYWx1ZVtzXVtrZXldID0ge3RvazogdG9kYXl9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLl9yZXF1ZXN0S2V5VmFsdWUuc2V0RGlydHkoKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBleHRyYWN0S2V5VG9rZW5zOiBmdW5jdGlvbih1cmxfcGFydHMsIHJlZnN0ciwgaXNQcml2YXRlLCBjYWxsYmFjaykge1xuICAgICAgICAvLyBrZXlzLCB2YWx1ZSBvZiBxdWVyeSBzdHJpbmdzIHdpbGwgYmUgc2VudCBpbiBtZDVcbiAgICAgICAgLy8gdXJsLCByZWZzdHIgd2lsbCBiZSBzZW50IGluIGhhbGYgb2YgbWQ1XG4gICAgICAgIHZhciBrZXlUb2tlbnMgPSB1cmxfcGFydHMuZ2V0S2V5VmFsdWVzTUQ1KCk7XG4gICAgICAgIGlmIChrZXlUb2tlbnMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgdmFyIHMgPSBtZDUodXJsX3BhcnRzLmhvc3RuYW1lKS5zdWJzdHIoMCwgMTYpO1xuICAgICAgICAgICAgcmVmc3RyID0gbWQ1KHJlZnN0cikuc3Vic3RyKDAsIDE2KTtcbiAgICAgICAgICAgIGNhbGxiYWNrKHMsIGtleVRva2VucywgcmVmc3RyLCBpc1ByaXZhdGUpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBzYXZlS2V5VG9rZW5zOiBmdW5jdGlvbihzLCBrZXlUb2tlbnMsIHIsIGlzUHJpdmF0ZSkge1xuICAgICAgICAvLyBhbnl0aGluZyBoZXJlIHNob3VsZCBhbHJlYWR5IGJlIGhhc2hcbiAgICAgICAgaWYgKENsaXF6QXR0cmFjay50b2tlbnNbc10gPT0gbnVsbCkgQ2xpcXpBdHRyYWNrLnRva2Vuc1tzXSA9IHtsYXN0U2VudDogZGF0ZXRpbWUuZ2V0VGltZSgpfTtcbiAgICAgICAgaWYgKENsaXF6QXR0cmFjay50b2tlbnNbc11bcl0gPT0gbnVsbCkgQ2xpcXpBdHRyYWNrLnRva2Vuc1tzXVtyXSA9IHsnYyc6IDAsICdrdic6IHt9fTtcbiAgICAgICAgQ2xpcXpBdHRyYWNrLnRva2Vuc1tzXVtyXVsnYyddID0gIChDbGlxekF0dHJhY2sudG9rZW5zW3NdW3JdWydjJ10gfHwgMCkgKyAxO1xuICAgICAgICBmb3IgKHZhciBrdiBvZiBrZXlUb2tlbnMpIHtcbiAgICAgICAgICAgIHZhciB0b2sgPSBrdi52LFxuICAgICAgICAgICAgICAgIGsgPSBrdi5rO1xuICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay50b2tlbnNbc11bcl1bJ2t2J11ba10gPT0gbnVsbCkgQ2xpcXpBdHRyYWNrLnRva2Vuc1tzXVtyXVsna3YnXVtrXSA9IHt9O1xuICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay50b2tlbnNbc11bcl1bJ2t2J11ba11bdG9rXSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLnRva2Vuc1tzXVtyXVsna3YnXVtrXVt0b2tdID0ge1xuICAgICAgICAgICAgICAgICAgICBjOiAwLFxuICAgICAgICAgICAgICAgICAgICBrX2xlbjoga3Yua19sZW4sXG4gICAgICAgICAgICAgICAgICAgIHZfbGVuOiBrdi52X2xlbixcbiAgICAgICAgICAgICAgICAgICAgaXNQcml2YXRlOiBpc1ByaXZhdGVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgQ2xpcXpBdHRyYWNrLnRva2Vuc1tzXVtyXVsna3YnXVtrXVt0b2tdLmMgKz0gMTtcbiAgICAgICAgfVxuICAgICAgICBDbGlxekF0dHJhY2suX3Rva2Vucy5zZXREaXJ0eSgpO1xuICAgIH0sXG4gICAgcmVjb3JkTGlua3NGb3JVUkwodXJsKSB7XG4gICAgICBpZiAoQ2xpcXpBdHRyYWNrLmxvYWRlZFRhYnNbdXJsXSkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG5cbiAgICAgIHJldHVybiBQcm9taXNlLmFsbChbXG5cbiAgICAgICAgY29yZS5nZXRDb29raWUodXJsKS50aGVuKFxuICAgICAgICAgIGNvb2tpZSA9PiBDbGlxekF0dHJhY2suY29va2llc0Zyb21Eb21bdXJsXSA9IGNvb2tpZVxuICAgICAgICApLFxuXG4gICAgICAgIFByb21pc2UuYWxsKFtcbiAgICAgICAgICBjb3JlLnF1ZXJ5SFRNTCh1cmwsICdhW2hyZWZdJywgJ2hyZWYnKSxcbiAgICAgICAgICBjb3JlLnF1ZXJ5SFRNTCh1cmwsICdsaW5rW2hyZWZdJywgJ2hyZWYnKSxcbiAgICAgICAgICBjb3JlLnF1ZXJ5SFRNTCh1cmwsICdzY3JpcHRbc3JjXScsICdzcmMnKS50aGVuKGZ1bmN0aW9uIChocmVmcykge1xuICAgICAgICAgICAgcmV0dXJuIGhyZWZzLmZpbHRlciggaHJlZiA9PiBocmVmLmluZGV4T2YoJ2h0dHAnKSA9PT0gMCApO1xuICAgICAgICAgIH0pLFxuICAgICAgICBdKS50aGVuKGZ1bmN0aW9uIChyZWZsaW5rcykge1xuICAgICAgICAgIHZhciBocmVmU2V0ID0gcmVmbGlua3MucmVkdWNlKChocmVmU2V0LCBocmVmcykgPT4ge1xuICAgICAgICAgICAgaHJlZnMuZm9yRWFjaCggaHJlZiA9PiBocmVmU2V0W2hyZWZdID0gdHJ1ZSApO1xuICAgICAgICAgICAgcmV0dXJuIGhyZWZTZXQ7XG4gICAgICAgICAgfSwge30pO1xuXG4gICAgICAgICAgQ2xpcXpBdHRyYWNrLmxpbmtzRnJvbURvbVt1cmxdID0gaHJlZlNldDtcbiAgICAgICAgfSlcblxuICAgICAgXSk7XG4gICAgfSxcbiAgICBjbGVhckRvbUxpbmtzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZm9yICh2YXIgdXJsIGluIENsaXF6QXR0cmFjay5saW5rc0Zyb21Eb20pIHtcbiAgICAgICAgICAgIGlmICghQ2xpcXpBdHRyYWNrLmlzVGFiVVJMKHVybCkpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgQ2xpcXpBdHRyYWNrLmxpbmtzRnJvbURvbVt1cmxdO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBDbGlxekF0dHJhY2suY29va2llc0Zyb21Eb21bdXJsXTtcbiAgICAgICAgICAgICAgICBkZWxldGUgQ2xpcXpBdHRyYWNrLmxvYWRlZFRhYnNbdXJsXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG4gICAgaXNUYWJVUkw6IGZ1bmN0aW9uKHVybCkge1xuICAgICAgICB2YXIgd20gPSBDb21wb25lbnRzLmNsYXNzZXNbXCJAbW96aWxsYS5vcmcvYXBwc2hlbGwvd2luZG93LW1lZGlhdG9yOzFcIl1cbiAgICAgICAgICAgICAgICAuZ2V0U2VydmljZShDb21wb25lbnRzLmludGVyZmFjZXMubnNJV2luZG93TWVkaWF0b3IpO1xuICAgICAgICB2YXIgYnJvd3NlckVudW1lcmF0b3IgPSB3bS5nZXRFbnVtZXJhdG9yKFwibmF2aWdhdG9yOmJyb3dzZXJcIik7XG5cbiAgICAgICAgd2hpbGUgKGJyb3dzZXJFbnVtZXJhdG9yLmhhc01vcmVFbGVtZW50cygpKSB7XG4gICAgICAgICAgICB2YXIgYnJvd3NlcldpbiA9IGJyb3dzZXJFbnVtZXJhdG9yLmdldE5leHQoKTtcbiAgICAgICAgICAgIHZhciB0YWJicm93c2VyID0gYnJvd3Nlcldpbi5nQnJvd3NlcjtcblxuICAgICAgICAgICAgdmFyIG51bVRhYnMgPSB0YWJicm93c2VyLmJyb3dzZXJzLmxlbmd0aDtcbiAgICAgICAgICAgIGZvciAodmFyIGluZGV4ID0gMDsgaW5kZXggPCBudW1UYWJzOyBpbmRleCsrKSB7XG4gICAgICAgICAgICAgICAgdmFyIGN1cnJlbnRCcm93c2VyID0gdGFiYnJvd3Nlci5nZXRCcm93c2VyQXRJbmRleChpbmRleCk7XG4gICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRCcm93c2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0YWJVUkwgPSBjdXJyZW50QnJvd3Nlci5jdXJyZW50VVJJLnNwZWM7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1cmwgPT0gdGFiVVJMIHx8IHVybCA9PSB0YWJVUkwuc3BsaXQoJyMnKVswXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG4gICAgLy8gTGlzdGVucyBmb3IgcmVxdWVzdHMgaW5pdGlhdGVkIGluIHRhYnMuXG4gICAgLy8gQWxsb3dzIHVzIHRvIHRyYWNrIHRhYiB3aW5kb3dJRHMgdG8gdXJscy5cbiAgICB0YWJfbGlzdGVuZXI6IHtcbiAgICAgICAgX3RhYnNTdGF0dXM6IHt9LFxuXG4gICAgICAgIG9uU3RhdGVDaGFuZ2U6IGZ1bmN0aW9uKGV2bnQpIHtcbiAgICAgICAgICAgIGxldCB7dXJsU3BlYywgaXNOZXdQYWdlLCB3aW5kb3dJRH0gPSBldm50O1xuICAgICAgICAgICAgLy8gY2hlY2sgZmxhZ3MgZm9yIHN0YXJ0ZWQgcmVxdWVzdFxuICAgICAgICAgICAgaWYgKGlzTmV3UGFnZSAmJiB1cmxTcGVjICYmIHdpbmRvd0lEKSB7XG4gICAgICAgICAgICAgICAgLy8gYWRkIHdpbmRvdyAtPiB1cmwgcGFpciB0byB0YWIgY2FjaGUuXG4gICAgICAgICAgICAgICAgdGhpcy5fdGFic1N0YXR1c1t3aW5kb3dJRF0gPSB1cmxTcGVjO1xuICAgICAgICAgICAgICAgIHZhciBfa2V5ID0gd2luZG93SUQgKyBcIjpcIiArIHVybFNwZWM7XG4gICAgICAgICAgICAgICAgaWYoIShDbGlxekF0dHJhY2sudHJhY2tSZWxvYWRbX2tleV0pKSB7XG4gICAgICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay50cmFja1JlbG9hZFtfa2V5XSA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2V7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0MiA9IG5ldyBEYXRlKCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkdXIgPSAodDIgLSAgQ2xpcXpBdHRyYWNrLnRyYWNrUmVsb2FkW19rZXldKSAvIDEwMDA7XG4gICAgICAgICAgICAgICAgICAgIGlmKGR1ciA8IDMwMDAwICYmIGNvdW50UmVsb2FkICYmIHdpbmRvd0lEIGluIENsaXF6QXR0cmFjay50cF9ldmVudHMuX2FjdGl2ZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBDbGlxekF0dHJhY2sudHBfZXZlbnRzLl9hY3RpdmVbd2luZG93SURdWydyYSddID0gMTtcbiAgICAgICAgICAgICAgICAgICAgICAgIENsaXF6QXR0cmFjay5yZWxvYWRXaGl0ZUxpc3RbX2tleV0gPSB0MjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBjb3VudFJlbG9hZCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIC8vIEdldCBhbiBhcnJheSBvZiB3aW5kb3dJRHMgZm9yIHRhYnMgd2hpY2ggYSBjdXJyZW50bHkgb24gdGhlIGdpdmVuIFVSTC5cbiAgICAgICAgZ2V0VGFic0ZvclVSTDogZnVuY3Rpb24odXJsKSB7XG4gICAgICAgICAgICB2YXIgdGFicyA9IFtdO1xuICAgICAgICAgICAgZm9yKHZhciB3aW5kb3dJRCBpbiB0aGlzLl90YWJzU3RhdHVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHRhYlVSTCA9IHRoaXMuX3RhYnNTdGF0dXNbd2luZG93SURdO1xuICAgICAgICAgICAgICAgIGlmICh1cmwgPT0gdGFiVVJMIHx8IHVybCA9PSB0YWJVUkwuc3BsaXQoJyMnKVswXSkge1xuICAgICAgICAgICAgICAgICAgICB0YWJzLnB1c2god2luZG93SUQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiB0YWJzO1xuICAgICAgICB9LFxuXG4gICAgICAgIGlzV2luZG93QWN0aXZlOiBicm93c2VyLmlzV2luZG93QWN0aXZlXG5cbiAgICB9LFxuICAgIC8qKiBHZXQgaW5mbyBhYm91dCB0cmFja2VycyBhbmQgYmxvY2tpbmcgZG9uZSBpbiBhIHNwZWNpZmllZCB0YWIuXG4gICAgICpcbiAgICAgKiAgUmV0dXJucyBhbiBvYmplY3QgZGVzY3JpYmluZyBhbnRpLXRyYWNraW5nIGFjdGlvbnMgZm9yIHRoaXMgcGFnZSwgd2l0aCBrZXlzIGFzIGZvbGxvd3M6XG4gICAgICogICAgY29va2llczogJ2FsbG93ZWQnIGFuZCAnYmxvY2tlZCcgY291bnRzLlxuICAgICAqICAgIHJlcXVlc3RzOiAnc2FmZScgYW5kICd1bnNhZmUnIGNvdW50cy4gJ1Vuc2FmZScgbWVhbnMgdGhhdCB1bnNhZmUgZGF0YSB3YXMgc2VlbiBpbiBhIHJlcXVlc3QgdG8gYSB0cmFja2VyLlxuICAgICAqICAgIHRyYWNrZXJzOiBtb3JlIGRldGFpbGVkIGluZm9ybWF0aW9uIGFib3V0IGVhY2ggdHJhY2tlci4gT2JqZWN0IHdpdGgga2V5cyBiZWluZyB0cmFja2VyIGRvbWFpbiBhbmQgdmFsdWVzXG4gICAgICogICAgICAgIG1vcmUgZGV0YWlsZWQgYmxvY2tpbmcgZGF0YS5cbiAgICAgKi9cbiAgICBnZXRUYWJCbG9ja2luZ0luZm86IGZ1bmN0aW9uKHRhYl9pZCwgdXJsKSB7XG4gICAgICB2YXIgcmVzdWx0ID0ge1xuICAgICAgICAgIGhvc3RuYW1lOiAnJyxcbiAgICAgICAgICBjb29raWVzOiB7YWxsb3dlZDogMCwgYmxvY2tlZDogMH0sXG4gICAgICAgICAgcmVxdWVzdHM6IHtzYWZlOiAwLCB1bnNhZmU6IDB9LFxuICAgICAgICAgIHRyYWNrZXJzOiB7fSxcbiAgICAgICAgICBjb21wYW5pZXM6IHt9LFxuICAgICAgICAgIHBzOiBudWxsXG4gICAgICAgIH07XG5cbiAgICAgIC8vIGlnbm9yZSBzcGVjaWFsIHRhYnNcbiAgICAgIGlmICh1cmwgJiYgKHVybC5pbmRleE9mKCdhYm91dCcpID09IDAgfHwgdXJsLmluZGV4T2YoJ2Nocm9tZScpID09IDApICkge1xuICAgICAgICByZXN1bHQuZXJyb3IgPSAnU3BlY2lhbCB0YWInO1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgfVxuXG4gICAgICBpZiAoISAodGFiX2lkIGluIENsaXF6QXR0cmFjay50cF9ldmVudHMuX2FjdGl2ZSkgKSB7XG4gICAgICAgIC8vIG5vIHRwIGV2ZW50LCBidXQgJ2FjdGl2ZScgdGFiID0gbXVzdCByZWxvYWQgZm9yIGRhdGFcbiAgICAgICAgLy8gb3RoZXJ3aXNlIC0+IHN5c3RlbSB0YWJcbiAgICAgICAgaWYgKCBicm93c2VyLmlzV2luZG93QWN0aXZlKHRhYl9pZCkgKSB7XG4gICAgICAgICAgICByZXN1bHQucmVsb2FkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXN1bHQuZXJyb3IgPSAnTm8gRGF0YSc7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICB9XG5cbiAgICAgIHZhciB0YWJfZGF0YSA9IENsaXF6QXR0cmFjay50cF9ldmVudHMuX2FjdGl2ZVt0YWJfaWRdLFxuICAgICAgICB0cmFja2VycyA9IE9iamVjdC5rZXlzKHRhYl9kYXRhLnRwcykuZmlsdGVyKGZ1bmN0aW9uKGRvbWFpbikge1xuICAgICAgICAgIHJldHVybiBDbGlxekF0dHJhY2sucXNfd2hpdGVsaXN0LmlzVHJhY2tlckRvbWFpbihtZDUoZ2V0R2VuZXJhbERvbWFpbihkb21haW4pKS5zdWJzdHJpbmcoMCwgMTYpKTtcbiAgICAgICAgfSksXG4gICAgICAgIHBsYWluX2RhdGEgPSB0YWJfZGF0YS5hc1BsYWluT2JqZWN0KCksXG4gICAgICAgIGZpcnN0UGFydHlDb21wYW55ID0gQ2xpcXpBdHRyYWNrLnRyYWNrZXJfY29tcGFuaWVzW2dldEdlbmVyYWxEb21haW4odGFiX2RhdGEuaG9zdG5hbWUpXTtcbiAgICAgIHJlc3VsdC5ob3N0bmFtZSA9IHRhYl9kYXRhLmhvc3RuYW1lO1xuICAgICAgcmVzdWx0LnBzID0gUHJpdmFjeVNjb3JlLmdldChtZDUoZ2V0R2VuZXJhbERvbWFpbihyZXN1bHQuaG9zdG5hbWUpKS5zdWJzdHIoMCwgMTYpICsgJ3NpdGUnKTtcbiAgICAgIGlmICghcmVzdWx0LnBzLnNjb3JlKSB7XG4gICAgICAgIHJlc3VsdC5wcy5nZXRQcml2YWN5U2NvcmUoKTtcbiAgICAgIH1cblxuICAgICAgdHJhY2tlcnMuZm9yRWFjaChmdW5jdGlvbihkb20pIHtcbiAgICAgICAgcmVzdWx0LnRyYWNrZXJzW2RvbV0gPSB7fTtcbiAgICAgICAgWydjJywgJ2Nvb2tpZV9zZXQnLCAnY29va2llX2Jsb2NrZWQnLCAnYmFkX2Nvb2tpZV9zZW50JywgJ2JhZF9xcycsICd0b2tlbnNfYmxvY2tlZCcsICdyZXFfYWJvcnRlZCddLmZvckVhY2goZnVuY3Rpb24gKGspIHtcbiAgICAgICAgICByZXN1bHQudHJhY2tlcnNbZG9tXVtrXSA9IHBsYWluX2RhdGEudHBzW2RvbV1ba10gfHwgMDtcbiAgICAgICAgfSk7XG4gICAgICAgIHJlc3VsdC5jb29raWVzLmFsbG93ZWQgKz0gcmVzdWx0LnRyYWNrZXJzW2RvbV1bJ2Nvb2tpZV9zZXQnXSAtIHJlc3VsdC50cmFja2Vyc1tkb21dWydjb29raWVfYmxvY2tlZCddO1xuICAgICAgICByZXN1bHQuY29va2llcy5ibG9ja2VkICs9IHJlc3VsdC50cmFja2Vyc1tkb21dWydjb29raWVfYmxvY2tlZCddO1xuICAgICAgICByZXN1bHQucmVxdWVzdHMuc2FmZSArPSByZXN1bHQudHJhY2tlcnNbZG9tXVsnYyddIC0gcmVzdWx0LnRyYWNrZXJzW2RvbV1bJ2JhZF9xcyddO1xuICAgICAgICByZXN1bHQucmVxdWVzdHMudW5zYWZlICs9IHJlc3VsdC50cmFja2Vyc1tkb21dWydiYWRfcXMnXTtcblxuICAgICAgICBsZXQgdGxkID0gZ2V0R2VuZXJhbERvbWFpbihkb20pLFxuICAgICAgICAgIGNvbXBhbnkgPSB0bGQ7XG4gICAgICAgIC8vIGZpbmQgdGhlIGNvbXBhbnkgYmVoaW5kIHRoaXMgdHJhY2tlci4gSVxuICAgICAgICAvLyBJZiB0aGUgZmlyc3QgcGFydHkgaXMgZnJvbSBhIHRyYWNrZXIgY29tcGFueSwgdGhlbiBkbyBub3QgYWRkIHRoZSBjb21wYW55IHNvIHRoYXQgdGhlIGFjdHVhbCB0bGRzIHdpbGwgYmUgc2hvd24gaW4gdGhlIGxpc3RcbiAgICAgICAgaWYgKHRsZCBpbiBDbGlxekF0dHJhY2sudHJhY2tlcl9jb21wYW5pZXMgJiYgQ2xpcXpBdHRyYWNrLnRyYWNrZXJfY29tcGFuaWVzW3RsZF0gIT09IGZpcnN0UGFydHlDb21wYW55KSB7XG4gICAgICAgICAgY29tcGFueSA9IENsaXF6QXR0cmFjay50cmFja2VyX2NvbXBhbmllc1t0bGRdO1xuICAgICAgICB9XG4gICAgICAgIGlmICghKGNvbXBhbnkgaW4gcmVzdWx0LmNvbXBhbmllcykpIHtcbiAgICAgICAgICByZXN1bHQuY29tcGFuaWVzW2NvbXBhbnldID0gW107XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0LmNvbXBhbmllc1tjb21wYW55XS5wdXNoKGRvbSk7XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9LFxuICAgIGdldEN1cnJlbnRUYWJCbG9ja2luZ0luZm86IGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHRhYklkLCB1cmxGb3JUYWI7XG4gICAgICB0cnkge1xuICAgICAgICB2YXIgZ0Jyb3dzZXIgPSBDbGlxelV0aWxzLmdldFdpbmRvdygpLmdCcm93c2VyLFxuICAgICAgICAgICAgc2VsZWN0ZWRCcm93c2VyID0gZ0Jyb3dzZXIuc2VsZWN0ZWRCcm93c2VyO1xuXG4gICAgICAgIHRhYklkID0gc2VsZWN0ZWRCcm93c2VyLm91dGVyV2luZG93SUQ7XG4gICAgICAgIHVybEZvclRhYiA9IHNlbGVjdGVkQnJvd3Nlci5jdXJyZW50VVJJLnNwZWM7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICB9XG4gICAgICByZXR1cm4gQ2xpcXpBdHRyYWNrLmdldFRhYkJsb2NraW5nSW5mbyh0YWJJZCwgdXJsRm9yVGFiKTtcbiAgICB9LFxuICAgIHRyYWNrZXJfY29tcGFuaWVzOiB7fSxcbiAgICAvKiogUGFyc2UgdHJhY2tlciBvd25lcnMgbGlzdCB7Q29tcGFueTogW2xpc3QsIG9mLCBkb21haW5zXX0sIGludG8gbG9va3VwIHRhYmxlIHtkb21haW46IENvbXBhbnl9XG4gICAgICovXG4gICAgX3BhcnNlVHJhY2tlckNvbXBhbmllczogZnVuY3Rpb24oY29tcGFueV9saXN0KSB7XG4gICAgICB2YXIgcmV2X2xpc3QgPSB7fTtcbiAgICAgIGZvciAodmFyIGNvbXBhbnkgaW4gY29tcGFueV9saXN0KSB7XG4gICAgICAgIGNvbXBhbnlfbGlzdFtjb21wYW55XS5mb3JFYWNoKGZ1bmN0aW9uKGQpIHtcbiAgICAgICAgICByZXZfbGlzdFtkXSA9IGNvbXBhbnk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgQ2xpcXpBdHRyYWNrLnRyYWNrZXJfY29tcGFuaWVzID0gcmV2X2xpc3Q7XG4gICAgfSxcbiAgICAvKiogRW5hYmxlcyBBdHRyYWNrIG1vZHVsZSB3aXRoIGNvb2tpZSwgUVMgYW5kIHJlZmVycmVyIHByb3RlY3Rpb24gZW5hYmxlZC5cbiAgICAgKiAgaWYgbW9kdWxlX29ubHkgaXMgc2V0IHRvIHRydWUsIHdpbGwgbm90IHNldCBwcmVmZXJlbmNlcyBmb3IgY29va2llLCBRUyBhbmQgcmVmZXJyZXIgcHJvdGVjdGlvbiAoZm9yIHNlbGVjdGl2ZSBsb2FkaW5nIGluIEFCIHRlc3RzKVxuICAgICAqL1xuICAgIGVuYWJsZU1vZHVsZTogZnVuY3Rpb24obW9kdWxlX29ubHkpIHtcbiAgICAgIGlmIChDbGlxekF0dHJhY2suaXNFbmFibGVkKCkpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBDbGlxelV0aWxzLnNldFByZWYoQ2xpcXpBdHRyYWNrLkVOQUJMRV9QUkVGLCB0cnVlKTtcbiAgICAgIGlmICghbW9kdWxlX29ubHkpIHtcbiAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKCdhdHRyYWNrQmxvY2tDb29raWVUcmFja2luZycsIHRydWUpO1xuICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoJ2F0dHJhY2tSZW1vdmVRdWVyeVN0cmluZ1RyYWNraW5nJywgdHJ1ZSk7XG4gICAgICB9XG4gICAgfSxcbiAgICAvKiogRGlzYWJsZXMgYW50aS10cmFja2luZyBpbW1lZGlhdGVseS5cbiAgICAgKi9cbiAgICBkaXNhYmxlTW9kdWxlOiBmdW5jdGlvbigpIHtcbiAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihDbGlxekF0dHJhY2suRU5BQkxFX1BSRUYsIGZhbHNlKTtcbiAgICB9LFxuICAgIGRpc2FibGVkX3NpdGVzOiBuZXcgU2V0KCksXG4gICAgRElTQUJMRURfU0lURVNfUFJFRjogXCJhdHRyYWNrU291cmNlRG9tYWluV2hpdGVsaXN0XCIsXG4gICAgc2F2ZVNvdXJjZURvbWFpbldoaXRlbGlzdDogZnVuY3Rpb24oKSB7XG4gICAgICBDbGlxelV0aWxzLnNldFByZWYoQ2xpcXpBdHRyYWNrLkRJU0FCTEVEX1NJVEVTX1BSRUYsXG4gICAgICAgIEpTT04uc3RyaW5naWZ5KEFycmF5LmZyb20oQ2xpcXpBdHRyYWNrLmRpc2FibGVkX3NpdGVzKSkpO1xuICAgIH0sXG4gICAgaXNTb3VyY2VXaGl0ZWxpc3RlZDogZnVuY3Rpb24oaG9zdG5hbWUpIHtcbiAgICAgICAgcmV0dXJuIENsaXF6QXR0cmFjay5kaXNhYmxlZF9zaXRlcy5oYXMoaG9zdG5hbWUpO1xuICAgIH0sXG4gICAgYWRkU291cmNlRG9tYWluVG9XaGl0ZWxpc3Q6IGZ1bmN0aW9uKGRvbWFpbikge1xuICAgICAgQ2xpcXpBdHRyYWNrLmRpc2FibGVkX3NpdGVzLmFkZChkb21haW4pO1xuICAgICAgLy8gYWxzbyBzZW5kIGRvbWFpbiB0byBodW1hbndlYlxuICAgICAgdGVsZW1ldHJ5LnRlbGVtZXRyeSh7XG4gICAgICAgICd0eXBlJzogdGVsZW1ldHJ5Lm1zZ1R5cGUsXG4gICAgICAgICdhY3Rpb24nOiAnYXR0cmFjay53aGl0ZWxpc3REb21haW4nLFxuICAgICAgICAncGF5bG9hZCc6IGRvbWFpblxuICAgICAgfSk7XG4gICAgICBDbGlxekF0dHJhY2suc2F2ZVNvdXJjZURvbWFpbldoaXRlbGlzdCgpO1xuICAgIH0sXG4gICAgcmVtb3ZlU291cmNlRG9tYWluRnJvbVdoaXRlbGlzdDogZnVuY3Rpb24oZG9tYWluKSB7XG4gICAgICBDbGlxekF0dHJhY2suZGlzYWJsZWRfc2l0ZXMuZGVsZXRlKGRvbWFpbik7XG4gICAgICBDbGlxekF0dHJhY2suc2F2ZVNvdXJjZURvbWFpbldoaXRlbGlzdCgpO1xuICAgIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IENsaXF6QXR0cmFjaztcbiJdfQ==