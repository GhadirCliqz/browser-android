System.register('antitracking/tp_events', ['core/cliqz', 'antitracking/background', 'antitracking/attrack', 'antitracking/md5', 'antitracking/domain', 'antitracking/telemetry', 'platform/browser'], function (_export) {

    // Class to hold a page load and third party urls loaded by this page.
    'use strict';

    var utils, background, CliqzAttrack, md5, sameGeneralDomain, telemetry, browser, stats, tp_events;
    function PageLoadData(url, isPrivate) {

        // Create a short md5 hash of the input string s
        this._shortHash = function (s) {
            if (!s) return '';
            return md5(s).substring(0, 16);
        };

        this.url = url.toString();
        this.hostname = url.hostname;
        this.path = this._shortHash(url.path);
        this.scheme = url.protocol;
        this['private'] = isPrivate;
        this.c = 1;
        this.s = new Date().getTime();
        this.e = null;
        this.tps = {};
        this.redirects = [];

        this._plainObject = null;

        // Get a stat counter object for the given third party host and path in
        // this page load.
        this.getTpUrl = function (tp_host, tp_path) {
            // reset cached plain object
            this._plainObject = null;
            var path_key = tp_path; // TODO hash it?
            if (!(tp_host in this.tps)) {
                this.tps[tp_host] = {};
            }
            if (!(path_key in this.tps[tp_host])) {
                this.tps[tp_host][path_key] = this._tpStatCounter();
            }
            return this.tps[tp_host][path_key];
        };

        // Returns true if the given referrer matches this page load.
        // This can be either a direct referral (referrer matches page load url),
        // or nth degree (referrer is somewhere in the graph of referrals originating
        // from the original page load url).
        this.isReferredFrom = function (ref_parts) {
            if (!ref_parts) return false;
            if (sameGeneralDomain(ref_parts.hostname, this.hostname)) {
                return true;
            }
            // not a direct referral, but could be via a third party
            if (ref_parts.hostname in this.tps) {
                return true;
            }
            return false;
        };

        this._tpStatCounter = tp_events._newStatCounter;

        // Creates a plain, aggregated version of this object, suitable for converting
        // to JSON, and sending as telemetry.
        this.asPlainObject = function () {
            return this._plainObject || this._buildPlainObject();
        };

        this._buildPlainObject = function () {
            var _this = this;

            var self = this,
                obj = {
                hostname: this._shortHash(this.hostname),
                path: this.path,
                scheme: this.scheme,
                c: this.c,
                t: this.e - this.s,
                ra: this.ra || 0,
                tps: {},
                redirects: this.redirects.filter(function (hostname) {
                    return !sameGeneralDomain(hostname, self.hostname);
                })
            };
            if (!obj.hostname) return obj;

            var _loop = function (tp_domain) {
                tp_domain_data = _this.tps[tp_domain];
                tp_paths = Object.keys(tp_domain_data);

                // skip same general domain
                if (sameGeneralDomain(self.hostname, tp_domain)) {
                    return 'continue';
                }
                if (tp_paths.length > 0) {
                    // aggregate stats per tp domain.
                    path_data = tp_paths.map(function (k) {
                        tp_domain_data[k]['paths'] = [self._shortHash(k)];
                        return tp_domain_data[k];
                    });

                    obj['tps'][tp_domain] = path_data.reduce(_this._sumStats);

                    // Remove the keys which have value == 0;
                    stats.forEach(function (eachKey) {
                        if (obj['tps'][tp_domain] && obj['tps'][tp_domain][eachKey] == 0) delete obj['tps'][tp_domain][eachKey];
                    });
                }
            };

            for (var tp_domain in this.tps) {
                var tp_domain_data, tp_paths;
                var path_data;

                var _ret = _loop(tp_domain);

                if (_ret === 'continue') continue;
            }
            // This was added to collect data for experiment, safe to stop collecting it now.
            // checkBlackList(this.url, obj);
            // checkFingerPrinting(this.url, obj);
            this._plainObject = obj;
            return obj;
        };

        this._sumStats = function (a, b) {
            var c = {},
                stats_keys = new Set(Object.keys(a).concat(Object.keys(b)));
            // paths is a special case
            stats_keys['delete']('paths');
            stats_keys.forEach(function (s) {
                c[s] = (a[s] || 0) + (b[s] || 0);
            });
            c['paths'] = a['paths'].concat(b['paths']);
            return c;
        };
    }return {
        setters: [function (_coreCliqz) {
            utils = _coreCliqz.utils;
        }, function (_antitrackingBackground) {
            background = _antitrackingBackground['default'];
        }, function (_antitrackingAttrack) {
            CliqzAttrack = _antitrackingAttrack['default'];
        }, function (_antitrackingMd5) {
            md5 = _antitrackingMd5['default'];
        }, function (_antitrackingDomain) {
            sameGeneralDomain = _antitrackingDomain.sameGeneralDomain;
        }, function (_antitrackingTelemetry) {
            telemetry = _antitrackingTelemetry['default'];
        }, function (_platformBrowser) {
            browser = _platformBrowser;
        }],
        execute: function () {
            ;

            stats = ['c'];
            tp_events = {
                _active: {},
                _old_tab_idx: {},
                _staged: [],
                _last_clean: 0,
                _clean_interval: 1000 * 10, // 10s
                _push_interval: 1000 * 60 * 20, // 20 minutes decreasing the frequency from 5 minutes to 20 minutes.
                _last_push: 0,
                ignore: new Set(['self-repair.mozilla.org']),
                // Called when a url is loaded on windowID source.
                // Returns the PageLoadData object for this url.
                //  or returns null if the url is malformed or null.
                onFullPage: function onFullPage(url, tab_id, isPrivate) {
                    // previous request finished. Move to staged
                    this.stage(tab_id);
                    // create new page load entry for tab
                    if (url && url.hostname && tab_id > 0 && !this.ignore.has(url.hostname)) {
                        this._active[tab_id] = new PageLoadData(url, isPrivate || false);
                        return this._active[tab_id];
                    } else {
                        return null;
                    }
                },
                onRedirect: function onRedirect(url_parts, tab_id, isPrivate) {
                    if (tab_id in this._active) {
                        var prev = this._active[tab_id];
                        this._active[tab_id] = new PageLoadData(url_parts, isPrivate);
                        this._active[tab_id].redirects = prev.redirects;
                        this._active[tab_id].redirects.push(prev.hostname);
                    } else {
                        this.onFullPage(url_parts, tab_id, isPrivate);
                    }
                },
                // Get a stats object for the request to url, referred from ref, on tab source.
                // url_parts and ref_parts contain the decomposed parts (from parseURL) of url and ref respectively.
                // returns an object containing keys specified in tp_events._stats representing the running stats
                // for the requesting third party on the source page.
                // Returns null if the referrer is not valid.
                get: function get(url, url_parts, ref, ref_parts, source) {
                    if (source <= 0 || source === null || source === undefined) {
                        if (CliqzAttrack.debug) utils.log("No source for request, not logging!", "tp_events");
                        return null;
                    }

                    if (!(source in this._active)) {
                        if (!ref || !ref_parts || !ref_parts.hostname) {
                            return null;
                        }
                        if (CliqzAttrack.debug) utils.log("No fullpage request for referrer: " + ref + " -> " + url, "tp_events");
                        return null;
                    }

                    var page_graph = this._active[source];
                    if (!page_graph.isReferredFrom(ref_parts)) {
                        if (!ref || !ref_parts || !ref_parts.hostname) return null;
                        if (source in this._old_tab_idx) {
                            var prev_graph = this._staged[this._old_tab_idx[source]];
                            if (prev_graph && prev_graph.isReferredFrom(ref_parts)) {
                                if (CliqzAttrack.debug) utils.log("Request for expired tab " + ref_parts.hostname + " -> " + url_parts.hostname + " (" + prev_graph['hostname'] + ")", 'tp_events');
                                return prev_graph.getTpUrl(url_parts.hostname, url_parts.path);
                            }
                        }
                        if (CliqzAttrack.debug) utils.log("tab/referrer mismatch " + ref_parts.hostname + " -> " + url_parts.hostname + " (" + page_graph['hostname'] + ")", 'tp_events');
                        return null;
                    }

                    return page_graph.getTpUrl(url_parts.hostname, url_parts.path);
                },
                // Move the PageLoadData object for windowID to the staging area.
                stage: function stage(windowID) {
                    if (windowID in this._active) {
                        this._active[windowID]['e'] = new Date().getTime();
                        // push object to staging and save its id
                        this._old_tab_idx[windowID] = this._staged.push(this._active[windowID]) - 1;
                        delete this._active[windowID];
                    }
                },
                // Periodically stage any tabs which are no longer active.
                // Will run at a period specifed by tp_events._clean_interval, unless force_clean is true
                // If force_stage is true, will stage all tabs, otherwise will only stage inactive.
                commit: function commit(force_clean, force_stage) {
                    var now = new Date().getTime();
                    if (now - this._last_clean > this._clean_interval || force_clean == true) {
                        for (var k in this._active) {
                            var active = browser.isWindowActive(k);
                            if (!active || force_stage == true) {
                                if (CliqzAttrack.debug) utils.log('Stage tab ' + k, 'tp_events');
                                this.stage(k);
                            }
                        }
                        this._last_clean = now;
                    }
                },
                // Push staged PageLoadData to human web.
                // Will run at a period specified by tp_events._push_interval, unless force_push is true.
                push: function push(force_push) {
                    var now = new Date().getTime();
                    if (this._staged.length > 0 && (now - this._last_push > this._push_interval || force_push == true)) {
                        // convert staged objects into simple objects, and aggregate.
                        // then filter out ones with bad data (undefined hostname or no third parties)
                        var payload_data = this._staged.filter(function (pl) {
                            // remove private tabs
                            return !pl['private'];
                        }).map(function (item) {
                            return item.asPlainObject();
                        }).filter(function (item) {
                            return item['hostname'].length > 0 && Object.keys(item['tps']).length > 0;
                        });

                        // if we still have some data, send the telemetry
                        if (payload_data.length > 0) {
                            if (CliqzAttrack.debug) utils.log('Pushing data for ' + payload_data.length + ' requests', 'tp_events');
                            var enabled = {
                                'qs': CliqzAttrack.isQSEnabled(),
                                'cookie': CliqzAttrack.isCookieEnabled(),
                                'bloomFilter': CliqzAttrack.isBloomFilterEnabled(),
                                'trackTxt': CliqzAttrack.isTrackerTxtEnabled(),
                                'forceBlock': CliqzAttrack.isForceBlockEnabled(),
                                'ui': background.buttonEnabled
                            };
                            for (var i = 0; i < payload_data.length; i++) {
                                var payl = {
                                    'data': [payload_data[i]],
                                    'ver': CliqzAttrack.VERSION,
                                    'conf': enabled,
                                    'addons': CliqzAttrack.similarAddon,
                                    'updateInTime': CliqzAttrack.qs_whitelist.isUpToDate()
                                };
                                telemetry.telemetry({ 'type': telemetry.msgType, 'action': 'attrack.tp_events', 'payload': payl });
                            }
                        }
                        this._staged = [];
                        this._old_tab_idx = {};
                        this._last_push = now;
                    }
                },
                _newStatCounter: function _newStatCounter() {
                    var ctr = {},
                        stats_keys = stats;
                    for (var s in stats_keys) {
                        ctr[stats_keys[s]] = 0;
                    }
                    return ctr;
                },
                incrementStat: function incrementStat(req_log, stat_key, n) {
                    if (req_log != null) {
                        if (!(stat_key in req_log)) {
                            req_log[stat_key] = 0;
                        }
                        if (!Number.isInteger(n)) {
                            n = 1;
                        }
                        req_log[stat_key] += n;
                    }
                }
            };

            _export('default', tp_events);
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy90cF9ldmVudHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7cUZBK0hJLEtBQUssRUFFTCxTQUFTO0FBeEhiLGFBQVMsWUFBWSxDQUFDLEdBQUcsRUFBRSxTQUFTLEVBQUU7OztBQUdsQyxZQUFJLENBQUMsVUFBVSxHQUFHLFVBQVMsQ0FBQyxFQUFFO0FBQzFCLGdCQUFHLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDO0FBQ2pCLG1CQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxTQUFTLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1NBQ2xDLENBQUM7O0FBRUYsWUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDMUIsWUFBSSxDQUFDLFFBQVEsR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDO0FBQzdCLFlBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdEMsWUFBSSxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsUUFBUSxDQUFDO0FBQzNCLFlBQUksV0FBUSxHQUFHLFNBQVMsQ0FBQztBQUN6QixZQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNYLFlBQUksQ0FBQyxDQUFDLEdBQUcsQUFBQyxJQUFJLElBQUksRUFBRSxDQUFFLE9BQU8sRUFBRSxDQUFDO0FBQ2hDLFlBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2QsWUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDZCxZQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQzs7QUFFcEIsWUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7Ozs7QUFJekIsWUFBSSxDQUFDLFFBQVEsR0FBRyxVQUFTLE9BQU8sRUFBRSxPQUFPLEVBQUU7O0FBRXZDLGdCQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQztBQUN6Qixn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R0FBRyxDQUFDLENBQUM7cUJBQzFCO0FBQ0QsMkJBQU8sR0FBRyxDQUFDO2lCQUNkO0FBQ0QsNkJBQWEsRUFBRSx1QkFBUyxPQUFPLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRTtBQUMxQyx3QkFBSSxPQUFPLElBQUksSUFBSSxFQUFFO0FBQ2pCLDRCQUFHLEVBQUUsUUFBUSxJQUFJLE9BQU8sQ0FBQSxBQUFDLEVBQUU7QUFDdkIsbUNBQU8sQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUM7eUJBQ3pCO0FBQ0QsNEJBQUksQ0FBRSxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsQ0FBQyxFQUFHO0FBQ3hCLDZCQUFDLEdBQUcsQ0FBQyxDQUFDO3lCQUNUO0FBQ0QsK0JBQU8sQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQzFCO2lCQUNKO2FBQ0o7OytCQUVjLFNBQVMiLCJmaWxlIjoiYW50aXRyYWNraW5nL3RwX2V2ZW50cy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHV0aWxzIH0gZnJvbSAnY29yZS9jbGlxeic7XG5pbXBvcnQgYmFja2dyb3VuZCBmcm9tICdhbnRpdHJhY2tpbmcvYmFja2dyb3VuZCc7XG5pbXBvcnQgQ2xpcXpBdHRyYWNrIGZyb20gJ2FudGl0cmFja2luZy9hdHRyYWNrJztcbmltcG9ydCBtZDUgZnJvbSAnYW50aXRyYWNraW5nL21kNSc7XG5pbXBvcnQgeyBzYW1lR2VuZXJhbERvbWFpbiB9IGZyb20gJ2FudGl0cmFja2luZy9kb21haW4nO1xuaW1wb3J0IHRlbGVtZXRyeSBmcm9tICdhbnRpdHJhY2tpbmcvdGVsZW1ldHJ5JztcbmltcG9ydCAqIGFzIGJyb3dzZXIgZnJvbSAncGxhdGZvcm0vYnJvd3Nlcic7XG5cbi8vIENsYXNzIHRvIGhvbGQgYSBwYWdlIGxvYWQgYW5kIHRoaXJkIHBhcnR5IHVybHMgbG9hZGVkIGJ5IHRoaXMgcGFnZS5cbmZ1bmN0aW9uIFBhZ2VMb2FkRGF0YSh1cmwsIGlzUHJpdmF0ZSkge1xuXG4gICAgLy8gQ3JlYXRlIGEgc2hvcnQgbWQ1IGhhc2ggb2YgdGhlIGlucHV0IHN0cmluZyBzXG4gICAgdGhpcy5fc2hvcnRIYXNoID0gZnVuY3Rpb24ocykge1xuICAgICAgICBpZighcykgcmV0dXJuICcnO1xuICAgICAgICByZXR1cm4gbWQ1KHMpLnN1YnN0cmluZygwLCAxNik7XG4gICAgfTtcblxuICAgIHRoaXMudXJsID0gdXJsLnRvU3RyaW5nKCk7XG4gICAgdGhpcy5ob3N0bmFtZSA9IHVybC5ob3N0bmFtZTtcbiAgICB0aGlzLnBhdGggPSB0aGlzLl9zaG9ydEhhc2godXJsLnBhdGgpO1xuICAgIHRoaXMuc2NoZW1lID0gdXJsLnByb3RvY29sO1xuICAgIHRoaXMucHJpdmF0ZSA9IGlzUHJpdmF0ZTtcbiAgICB0aGlzLmMgPSAxO1xuICAgIHRoaXMucyA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgdGhpcy5lID0gbnVsbDtcbiAgICB0aGlzLnRwcyA9IHt9O1xuICAgIHRoaXMucmVkaXJlY3RzID0gW107XG5cbiAgICB0aGlzLl9wbGFpbk9iamVjdCA9IG51bGw7XG5cbiAgICAvLyBHZXQgYSBzdGF0IGNvdW50ZXIgb2JqZWN0IGZvciB0aGUgZ2l2ZW4gdGhpcmQgcGFydHkgaG9zdCBhbmQgcGF0aCBpblxuICAgIC8vIHRoaXMgcGFnZSBsb2FkLlxuICAgIHRoaXMuZ2V0VHBVcmwgPSBmdW5jdGlvbih0cF9ob3N0LCB0cF9wYXRoKSB7XG4gICAgICAgIC8vIHJlc2V0IGNhY2hlZCBwbGFpbiBvYmplY3RcbiAgICAgICAgdGhpcy5fcGxhaW5PYmplY3QgPSBudWxsO1xuICAgICAgICB2YXIgcGF0aF9rZXkgPSB0cF9wYXRoOyAvLyBUT0RPIGhhc2ggaXQ/XG4gICAgICAgIGlmKCEodHBfaG9zdCBpbiB0aGlzLnRwcykpIHtcbiAgICAgICAgICAgIHRoaXMudHBzW3RwX2hvc3RdID0ge307XG4gICAgICAgIH1cbiAgICAgICAgaWYoIShwYXRoX2tleSBpbiB0aGlzLnRwc1t0cF9ob3N0XSkpIHtcbiAgICAgICAgICAgIHRoaXMudHBzW3RwX2hvc3RdW3BhdGhfa2V5XSA9IHRoaXMuX3RwU3RhdENvdW50ZXIoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy50cHNbdHBfaG9zdF1bcGF0aF9rZXldO1xuICAgIH07XG5cbiAgICAvLyBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIHJlZmVycmVyIG1hdGNoZXMgdGhpcyBwYWdlIGxvYWQuXG4gICAgLy8gVGhpcyBjYW4gYmUgZWl0aGVyIGEgZGlyZWN0IHJlZmVycmFsIChyZWZlcnJlciBtYXRjaGVzIHBhZ2UgbG9hZCB1cmwpLFxuICAgIC8vIG9yIG50aCBkZWdyZWUgKHJlZmVycmVyIGlzIHNvbWV3aGVyZSBpbiB0aGUgZ3JhcGggb2YgcmVmZXJyYWxzIG9yaWdpbmF0aW5nXG4gICAgLy8gZnJvbSB0aGUgb3JpZ2luYWwgcGFnZSBsb2FkIHVybCkuXG4gICAgdGhpcy5pc1JlZmVycmVkRnJvbSA9IGZ1bmN0aW9uKHJlZl9wYXJ0cykge1xuICAgICAgICBpZighcmVmX3BhcnRzKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmKHNhbWVHZW5lcmFsRG9tYWluKHJlZl9wYXJ0cy5ob3N0bmFtZSwgdGhpcy5ob3N0bmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIG5vdCBhIGRpcmVjdCByZWZlcnJhbCwgYnV0IGNvdWxkIGJlIHZpYSBhIHRoaXJkIHBhcnR5XG4gICAgICAgIGlmKHJlZl9wYXJ0cy5ob3N0bmFtZSBpbiB0aGlzLnRwcykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICB0aGlzLl90cFN0YXRDb3VudGVyID0gdHBfZXZlbnRzLl9uZXdTdGF0Q291bnRlcjtcblxuICAgIC8vIENyZWF0ZXMgYSBwbGFpbiwgYWdncmVnYXRlZCB2ZXJzaW9uIG9mIHRoaXMgb2JqZWN0LCBzdWl0YWJsZSBmb3IgY29udmVydGluZ1xuICAgIC8vIHRvIEpTT04sIGFuZCBzZW5kaW5nIGFzIHRlbGVtZXRyeS5cbiAgICB0aGlzLmFzUGxhaW5PYmplY3QgPSBmdW5jdGlvbigpIHtcbiAgICAgIHJldHVybiB0aGlzLl9wbGFpbk9iamVjdCB8fCB0aGlzLl9idWlsZFBsYWluT2JqZWN0KCk7XG4gICAgfTtcblxuICAgIHRoaXMuX2J1aWxkUGxhaW5PYmplY3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgb2JqID0ge1xuICAgICAgICAgICAgICAgIGhvc3RuYW1lOiB0aGlzLl9zaG9ydEhhc2godGhpcy5ob3N0bmFtZSksXG4gICAgICAgICAgICAgICAgcGF0aDogdGhpcy5wYXRoLFxuICAgICAgICAgICAgICAgIHNjaGVtZTogdGhpcy5zY2hlbWUsXG4gICAgICAgICAgICAgICAgYzogdGhpcy5jLFxuICAgICAgICAgICAgICAgIHQ6IHRoaXMuZSAtIHRoaXMucyxcbiAgICAgICAgICAgICAgICByYTogdGhpcy5yYSB8fCAwLFxuICAgICAgICAgICAgICAgIHRwczoge30sXG4gICAgICAgICAgICAgICAgcmVkaXJlY3RzOiB0aGlzLnJlZGlyZWN0cy5maWx0ZXIoZnVuY3Rpb24oaG9zdG5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuICFzYW1lR2VuZXJhbERvbWFpbihob3N0bmFtZSwgc2VsZi5ob3N0bmFtZSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIH07XG4gICAgICAgIGlmKCFvYmouaG9zdG5hbWUpIHJldHVybiBvYmo7XG5cbiAgICAgICAgZm9yKGxldCB0cF9kb21haW4gaW4gdGhpcy50cHMpIHtcbiAgICAgICAgICAgIHZhciB0cF9kb21haW5fZGF0YSA9IHRoaXMudHBzW3RwX2RvbWFpbl0sXG4gICAgICAgICAgICAgICAgdHBfcGF0aHMgPSBPYmplY3Qua2V5cyh0cF9kb21haW5fZGF0YSk7XG4gICAgICAgICAgICAvLyBza2lwIHNhbWUgZ2VuZXJhbCBkb21haW5cbiAgICAgICAgICAgIGlmKHNhbWVHZW5lcmFsRG9tYWluKHNlbGYuaG9zdG5hbWUsIHRwX2RvbWFpbikpIHtcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKHRwX3BhdGhzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAvLyBhZ2dyZWdhdGUgc3RhdHMgcGVyIHRwIGRvbWFpbi5cbiAgICAgICAgICAgICAgICB2YXIgcGF0aF9kYXRhID0gdHBfcGF0aHMubWFwKGZ1bmN0aW9uKGspIHtcbiAgICAgICAgICAgICAgICAgICAgdHBfZG9tYWluX2RhdGFba11bJ3BhdGhzJ10gPSBbc2VsZi5fc2hvcnRIYXNoKGspXTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRwX2RvbWFpbl9kYXRhW2tdO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIG9ialsndHBzJ11bdHBfZG9tYWluXSA9IHBhdGhfZGF0YS5yZWR1Y2UodGhpcy5fc3VtU3RhdHMpO1xuXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBrZXlzIHdoaWNoIGhhdmUgdmFsdWUgPT0gMDtcbiAgICAgICAgICAgICAgICBzdGF0cy5mb3JFYWNoKGZ1bmN0aW9uKGVhY2hLZXkpe1xuICAgICAgICAgICAgICAgICAgICBpZihvYmpbJ3RwcyddW3RwX2RvbWFpbl0gJiYgb2JqWyd0cHMnXVt0cF9kb21haW5dW2VhY2hLZXldID09IDApXG4gICAgICAgICAgICAgICAgICAgICAgICBkZWxldGUgb2JqWyd0cHMnXVt0cF9kb21haW5dW2VhY2hLZXldO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIFRoaXMgd2FzIGFkZGVkIHRvIGNvbGxlY3QgZGF0YSBmb3IgZXhwZXJpbWVudCwgc2FmZSB0byBzdG9wIGNvbGxlY3RpbmcgaXQgbm93LlxuICAgICAgICAvLyBjaGVja0JsYWNrTGlzdCh0aGlzLnVybCwgb2JqKTtcbiAgICAgICAgLy8gY2hlY2tGaW5nZXJQcmludGluZyh0aGlzLnVybCwgb2JqKTtcbiAgICAgICAgdGhpcy5fcGxhaW5PYmplY3QgPSBvYmo7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfTtcblxuICAgIHRoaXMuX3N1bVN0YXRzID0gZnVuY3Rpb24oYSwgYikge1xuICAgICAgICB2YXIgYyA9IHt9LFxuICAgICAgICAgICAgc3RhdHNfa2V5cyA9IG5ldyBTZXQoT2JqZWN0LmtleXMoYSkuY29uY2F0KE9iamVjdC5rZXlzKGIpKSk7XG4gICAgICAgIC8vIHBhdGhzIGlzIGEgc3BlY2lhbCBjYXNlXG4gICAgICAgIHN0YXRzX2tleXMuZGVsZXRlKCdwYXRocycpO1xuICAgICAgICBzdGF0c19rZXlzLmZvckVhY2goZnVuY3Rpb24ocyl7XG4gICAgICAgICAgICBjW3NdID0gKGFbc10gfHwgMCkgKyAoYltzXSB8fCAwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNbJ3BhdGhzJ10gPSBhWydwYXRocyddLmNvbmNhdChiWydwYXRocyddKTtcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcbn07XG5cbnZhciBzdGF0cyA9IFsnYyddO1xuXG52YXIgdHBfZXZlbnRzID0ge1xuICAgIF9hY3RpdmU6IHt9LFxuICAgIF9vbGRfdGFiX2lkeDoge30sXG4gICAgX3N0YWdlZDogW10sXG4gICAgX2xhc3RfY2xlYW46IDAsXG4gICAgX2NsZWFuX2ludGVydmFsOiAxMDAwKjEwLCAvLyAxMHNcbiAgICBfcHVzaF9pbnRlcnZhbDogMTAwMCo2MCoyMCwgLy8gMjAgbWludXRlcyBkZWNyZWFzaW5nIHRoZSBmcmVxdWVuY3kgZnJvbSA1IG1pbnV0ZXMgdG8gMjAgbWludXRlcy5cbiAgICBfbGFzdF9wdXNoOiAwLFxuICAgIGlnbm9yZTogbmV3IFNldChbJ3NlbGYtcmVwYWlyLm1vemlsbGEub3JnJ10pLFxuICAgIC8vIENhbGxlZCB3aGVuIGEgdXJsIGlzIGxvYWRlZCBvbiB3aW5kb3dJRCBzb3VyY2UuXG4gICAgLy8gUmV0dXJucyB0aGUgUGFnZUxvYWREYXRhIG9iamVjdCBmb3IgdGhpcyB1cmwuXG4gICAgLy8gIG9yIHJldHVybnMgbnVsbCBpZiB0aGUgdXJsIGlzIG1hbGZvcm1lZCBvciBudWxsLlxuICAgIG9uRnVsbFBhZ2U6IGZ1bmN0aW9uKHVybCwgdGFiX2lkLCBpc1ByaXZhdGUpIHtcbiAgICAgICAgLy8gcHJldmlvdXMgcmVxdWVzdCBmaW5pc2hlZC4gTW92ZSB0byBzdGFnZWRcbiAgICAgICAgdGhpcy5zdGFnZSh0YWJfaWQpO1xuICAgICAgICAvLyBjcmVhdGUgbmV3IHBhZ2UgbG9hZCBlbnRyeSBmb3IgdGFiXG4gICAgICAgIGlmKHVybCAmJiB1cmwuaG9zdG5hbWUgJiYgdGFiX2lkID4gMCAmJiAhdGhpcy5pZ25vcmUuaGFzKHVybC5ob3N0bmFtZSkpIHtcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVt0YWJfaWRdID0gbmV3IFBhZ2VMb2FkRGF0YSh1cmwsIGlzUHJpdmF0ZSB8fCBmYWxzZSk7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5fYWN0aXZlW3RhYl9pZF07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgb25SZWRpcmVjdDogZnVuY3Rpb24odXJsX3BhcnRzLCB0YWJfaWQsIGlzUHJpdmF0ZSkge1xuICAgICAgICBpZih0YWJfaWQgaW4gdGhpcy5fYWN0aXZlKSB7XG4gICAgICAgICAgICBsZXQgcHJldiA9IHRoaXMuX2FjdGl2ZVt0YWJfaWRdO1xuICAgICAgICAgICAgdGhpcy5fYWN0aXZlW3RhYl9pZF0gPSBuZXcgUGFnZUxvYWREYXRhKHVybF9wYXJ0cywgaXNQcml2YXRlKTtcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVt0YWJfaWRdLnJlZGlyZWN0cyA9IHByZXYucmVkaXJlY3RzO1xuICAgICAgICAgICAgdGhpcy5fYWN0aXZlW3RhYl9pZF0ucmVkaXJlY3RzLnB1c2gocHJldi5ob3N0bmFtZSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLm9uRnVsbFBhZ2UodXJsX3BhcnRzLCB0YWJfaWQsIGlzUHJpdmF0ZSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8vIEdldCBhIHN0YXRzIG9iamVjdCBmb3IgdGhlIHJlcXVlc3QgdG8gdXJsLCByZWZlcnJlZCBmcm9tIHJlZiwgb24gdGFiIHNvdXJjZS5cbiAgICAvLyB1cmxfcGFydHMgYW5kIHJlZl9wYXJ0cyBjb250YWluIHRoZSBkZWNvbXBvc2VkIHBhcnRzIChmcm9tIHBhcnNlVVJMKSBvZiB1cmwgYW5kIHJlZiByZXNwZWN0aXZlbHkuXG4gICAgLy8gcmV0dXJucyBhbiBvYmplY3QgY29udGFpbmluZyBrZXlzIHNwZWNpZmllZCBpbiB0cF9ldmVudHMuX3N0YXRzIHJlcHJlc2VudGluZyB0aGUgcnVubmluZyBzdGF0c1xuICAgIC8vIGZvciB0aGUgcmVxdWVzdGluZyB0aGlyZCBwYXJ0eSBvbiB0aGUgc291cmNlIHBhZ2UuXG4gICAgLy8gUmV0dXJucyBudWxsIGlmIHRoZSByZWZlcnJlciBpcyBub3QgdmFsaWQuXG4gICAgZ2V0OiBmdW5jdGlvbih1cmwsIHVybF9wYXJ0cywgcmVmLCByZWZfcGFydHMsIHNvdXJjZSkge1xuICAgICAgICBpZihzb3VyY2UgPD0gMHx8IHNvdXJjZSA9PT0gbnVsbCB8fCBzb3VyY2UgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay5kZWJ1ZykgdXRpbHMubG9nKFwiTm8gc291cmNlIGZvciByZXF1ZXN0LCBub3QgbG9nZ2luZyFcIiwgXCJ0cF9ldmVudHNcIik7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKCEoc291cmNlIGluIHRoaXMuX2FjdGl2ZSkpIHtcbiAgICAgICAgICAgIGlmKCFyZWYgfHwgIXJlZl9wYXJ0cyB8fCAhcmVmX3BhcnRzLmhvc3RuYW1lKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmRlYnVnKSB1dGlscy5sb2coXCJObyBmdWxscGFnZSByZXF1ZXN0IGZvciByZWZlcnJlcjogXCIrIHJlZiArXCIgLT4gXCIrIHVybCAsIFwidHBfZXZlbnRzXCIpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuXG4gICAgICAgIHZhciBwYWdlX2dyYXBoID0gdGhpcy5fYWN0aXZlW3NvdXJjZV07XG4gICAgICAgIGlmKCFwYWdlX2dyYXBoLmlzUmVmZXJyZWRGcm9tKHJlZl9wYXJ0cykpIHtcbiAgICAgICAgICAgIGlmKCFyZWYgfHwgIXJlZl9wYXJ0cyB8fCAhcmVmX3BhcnRzLmhvc3RuYW1lKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIGlmKHNvdXJjZSBpbiB0aGlzLl9vbGRfdGFiX2lkeCkge1xuICAgICAgICAgICAgICAgIHZhciBwcmV2X2dyYXBoID0gdGhpcy5fc3RhZ2VkW3RoaXMuX29sZF90YWJfaWR4W3NvdXJjZV1dO1xuICAgICAgICAgICAgICAgIGlmKHByZXZfZ3JhcGggJiYgcHJldl9ncmFwaC5pc1JlZmVycmVkRnJvbShyZWZfcGFydHMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChDbGlxekF0dHJhY2suZGVidWcpIHV0aWxzLmxvZyhcIlJlcXVlc3QgZm9yIGV4cGlyZWQgdGFiIFwiKyByZWZfcGFydHMuaG9zdG5hbWUgK1wiIC0+IFwiKyB1cmxfcGFydHMuaG9zdG5hbWUgK1wiIChcIisgcHJldl9ncmFwaFsnaG9zdG5hbWUnXSArXCIpXCIsICd0cF9ldmVudHMnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHByZXZfZ3JhcGguZ2V0VHBVcmwodXJsX3BhcnRzLmhvc3RuYW1lLCB1cmxfcGFydHMucGF0aCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay5kZWJ1ZykgdXRpbHMubG9nKFwidGFiL3JlZmVycmVyIG1pc21hdGNoIFwiKyByZWZfcGFydHMuaG9zdG5hbWUgK1wiIC0+IFwiKyB1cmxfcGFydHMuaG9zdG5hbWUgK1wiIChcIisgcGFnZV9ncmFwaFsnaG9zdG5hbWUnXSArXCIpXCIsICd0cF9ldmVudHMnKTtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBhZ2VfZ3JhcGguZ2V0VHBVcmwodXJsX3BhcnRzLmhvc3RuYW1lLCB1cmxfcGFydHMucGF0aCk7XG4gICAgfSxcbiAgICAvLyBNb3ZlIHRoZSBQYWdlTG9hZERhdGEgb2JqZWN0IGZvciB3aW5kb3dJRCB0byB0aGUgc3RhZ2luZyBhcmVhLlxuICAgIHN0YWdlOiBmdW5jdGlvbih3aW5kb3dJRCkge1xuICAgICAgICBpZih3aW5kb3dJRCBpbiB0aGlzLl9hY3RpdmUpIHtcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVt3aW5kb3dJRF1bJ2UnXSA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICAgICAgICAvLyBwdXNoIG9iamVjdCB0byBzdGFnaW5nIGFuZCBzYXZlIGl0cyBpZFxuICAgICAgICAgICAgdGhpcy5fb2xkX3RhYl9pZHhbd2luZG93SURdID0gdGhpcy5fc3RhZ2VkLnB1c2godGhpcy5fYWN0aXZlW3dpbmRvd0lEXSkgLSAxO1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMuX2FjdGl2ZVt3aW5kb3dJRF07XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8vIFBlcmlvZGljYWxseSBzdGFnZSBhbnkgdGFicyB3aGljaCBhcmUgbm8gbG9uZ2VyIGFjdGl2ZS5cbiAgICAvLyBXaWxsIHJ1biBhdCBhIHBlcmlvZCBzcGVjaWZlZCBieSB0cF9ldmVudHMuX2NsZWFuX2ludGVydmFsLCB1bmxlc3MgZm9yY2VfY2xlYW4gaXMgdHJ1ZVxuICAgIC8vIElmIGZvcmNlX3N0YWdlIGlzIHRydWUsIHdpbGwgc3RhZ2UgYWxsIHRhYnMsIG90aGVyd2lzZSB3aWxsIG9ubHkgc3RhZ2UgaW5hY3RpdmUuXG4gICAgY29tbWl0OiBmdW5jdGlvbihmb3JjZV9jbGVhbiwgZm9yY2Vfc3RhZ2UpIHtcbiAgICAgICAgdmFyIG5vdyA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgICAgIGlmKG5vdyAtIHRoaXMuX2xhc3RfY2xlYW4gPiB0aGlzLl9jbGVhbl9pbnRlcnZhbCB8fCBmb3JjZV9jbGVhbiA9PSB0cnVlKSB7XG4gICAgICAgICAgICBmb3IobGV0IGsgaW4gdGhpcy5fYWN0aXZlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFjdGl2ZSA9IGJyb3dzZXIuaXNXaW5kb3dBY3RpdmUoayk7XG4gICAgICAgICAgICAgICAgaWYoIWFjdGl2ZSB8fCBmb3JjZV9zdGFnZSA9PSB0cnVlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChDbGlxekF0dHJhY2suZGVidWcpIHV0aWxzLmxvZygnU3RhZ2UgdGFiICcraywgJ3RwX2V2ZW50cycpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YWdlKGspO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2xhc3RfY2xlYW4gPSBub3c7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8vIFB1c2ggc3RhZ2VkIFBhZ2VMb2FkRGF0YSB0byBodW1hbiB3ZWIuXG4gICAgLy8gV2lsbCBydW4gYXQgYSBwZXJpb2Qgc3BlY2lmaWVkIGJ5IHRwX2V2ZW50cy5fcHVzaF9pbnRlcnZhbCwgdW5sZXNzIGZvcmNlX3B1c2ggaXMgdHJ1ZS5cbiAgICBwdXNoOiBmdW5jdGlvbihmb3JjZV9wdXNoKSB7XG4gICAgICAgIHZhciBub3cgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICBpZih0aGlzLl9zdGFnZWQubGVuZ3RoID4gMCAmJiAobm93IC0gdGhpcy5fbGFzdF9wdXNoID4gdGhpcy5fcHVzaF9pbnRlcnZhbCB8fCBmb3JjZV9wdXNoID09IHRydWUpKSB7XG4gICAgICAgICAgICAvLyBjb252ZXJ0IHN0YWdlZCBvYmplY3RzIGludG8gc2ltcGxlIG9iamVjdHMsIGFuZCBhZ2dyZWdhdGUuXG4gICAgICAgICAgICAvLyB0aGVuIGZpbHRlciBvdXQgb25lcyB3aXRoIGJhZCBkYXRhICh1bmRlZmluZWQgaG9zdG5hbWUgb3Igbm8gdGhpcmQgcGFydGllcylcbiAgICAgICAgICAgIHZhciBwYXlsb2FkX2RhdGEgPSB0aGlzLl9zdGFnZWQuZmlsdGVyKGZ1bmN0aW9uKHBsKSB7XG4gICAgICAgICAgICAgIC8vIHJlbW92ZSBwcml2YXRlIHRhYnNcbiAgICAgICAgICAgICAgcmV0dXJuICFwbC5wcml2YXRlO1xuICAgICAgICAgICAgfSkubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5hc1BsYWluT2JqZWN0KCk7XG4gICAgICAgICAgICB9KS5maWx0ZXIoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtWydob3N0bmFtZSddLmxlbmd0aCA+IDAgJiYgT2JqZWN0LmtleXMoaXRlbVsndHBzJ10pLmxlbmd0aCA+IDA7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gaWYgd2Ugc3RpbGwgaGF2ZSBzb21lIGRhdGEsIHNlbmQgdGhlIHRlbGVtZXRyeVxuICAgICAgICAgICAgaWYocGF5bG9hZF9kYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmRlYnVnKSB1dGlscy5sb2coJ1B1c2hpbmcgZGF0YSBmb3IgJysgcGF5bG9hZF9kYXRhLmxlbmd0aCArJyByZXF1ZXN0cycsICd0cF9ldmVudHMnKTtcbiAgICAgICAgICAgICAgICB2YXIgZW5hYmxlZCA9IHtcbiAgICAgICAgICAgICAgICAgICAgJ3FzJzogQ2xpcXpBdHRyYWNrLmlzUVNFbmFibGVkKCksXG4gICAgICAgICAgICAgICAgICAgICdjb29raWUnOiBDbGlxekF0dHJhY2suaXNDb29raWVFbmFibGVkKCksXG4gICAgICAgICAgICAgICAgICAgICdibG9vbUZpbHRlcic6IENsaXF6QXR0cmFjay5pc0Jsb29tRmlsdGVyRW5hYmxlZCgpLFxuICAgICAgICAgICAgICAgICAgICAndHJhY2tUeHQnOiBDbGlxekF0dHJhY2suaXNUcmFja2VyVHh0RW5hYmxlZCgpLFxuICAgICAgICAgICAgICAgICAgICAnZm9yY2VCbG9jayc6IENsaXF6QXR0cmFjay5pc0ZvcmNlQmxvY2tFbmFibGVkKCksXG4gICAgICAgICAgICAgICAgICAgICd1aSc6IGJhY2tncm91bmQuYnV0dG9uRW5hYmxlZFxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXlsb2FkX2RhdGEubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHBheWwgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAnZGF0YSc6IFtwYXlsb2FkX2RhdGFbaV1dLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ3Zlcic6IENsaXF6QXR0cmFjay5WRVJTSU9OLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2NvbmYnOiBlbmFibGVkLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ2FkZG9ucyc6IENsaXF6QXR0cmFjay5zaW1pbGFyQWRkb24sXG4gICAgICAgICAgICAgICAgICAgICAgICAndXBkYXRlSW5UaW1lJzogQ2xpcXpBdHRyYWNrLnFzX3doaXRlbGlzdC5pc1VwVG9EYXRlKClcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgdGVsZW1ldHJ5LnRlbGVtZXRyeSh7J3R5cGUnOiB0ZWxlbWV0cnkubXNnVHlwZSwgJ2FjdGlvbic6ICdhdHRyYWNrLnRwX2V2ZW50cycsICdwYXlsb2FkJzogcGF5bH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX3N0YWdlZCA9IFtdO1xuICAgICAgICAgICAgdGhpcy5fb2xkX3RhYl9pZHggPSB7fTtcbiAgICAgICAgICAgIHRoaXMuX2xhc3RfcHVzaCA9IG5vdztcbiAgICAgICAgfVxuICAgIH0sXG4gICAgX25ld1N0YXRDb3VudGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGN0ciA9IHt9LFxuICAgICAgICAgICAgc3RhdHNfa2V5cyA9IHN0YXRzO1xuICAgICAgICBmb3IodmFyIHMgaW4gc3RhdHNfa2V5cykge1xuICAgICAgICAgICAgY3RyW3N0YXRzX2tleXNbc11dID0gMDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gY3RyO1xuICAgIH0sXG4gICAgaW5jcmVtZW50U3RhdDogZnVuY3Rpb24ocmVxX2xvZywgc3RhdF9rZXksIG4pIHtcbiAgICAgICAgaWYgKHJlcV9sb2cgIT0gbnVsbCkge1xuICAgICAgICAgICAgaWYoIShzdGF0X2tleSBpbiByZXFfbG9nKSkge1xuICAgICAgICAgICAgICAgIHJlcV9sb2dbc3RhdF9rZXldID0gMDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICghIE51bWJlci5pc0ludGVnZXIobikgKSB7XG4gICAgICAgICAgICAgICAgbiA9IDE7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXFfbG9nW3N0YXRfa2V5XSArPSBuO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCB0cF9ldmVudHM7XG4iXX0=