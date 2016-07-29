System.register('antitracking/tp_events', ['antitracking/background', 'antitracking/attrack', 'antitracking/md5', 'antitracking/domain', 'antitracking/telemetry', 'platform/browser'], function (_export) {

    // Class to hold a page load and third party urls loaded by this page.
    'use strict';

    var background, CliqzAttrack, md5, sameGeneralDomain, telemetry, browser, stats, tp_events;
    function PageLoadData(url) {

        // Create a short md5 hash of the input string s
        this._shortHash = function (s) {
            if (!s) return '';
            return md5(s).substring(0, 16);
        };

        this.url = url.toString();
        this.hostname = url.hostname;
        this.path = this._shortHash(url.path);
        this.c = 1;
        this.s = new Date().getTime();
        this.e = null;
        this.tps = {};
        this.redirects = [];

        // Get a stat counter object for the given third party host and path in
        // this page load.
        this.getTpUrl = function (tp_host, tp_path) {
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
            var _this = this;

            var self = this,
                obj = {
                hostname: this._shortHash(this.hostname),
                path: this.path,
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
        setters: [function (_antitrackingBackground) {
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
                onFullPage: function onFullPage(url, tab_id) {
                    // previous request finished. Move to staged
                    this.stage(tab_id);
                    // create new page load entry for tab
                    if (url && url.hostname && tab_id > 0 && !this.ignore.has(url.hostname)) {
                        this._active[tab_id] = new PageLoadData(url);
                        return this._active[tab_id];
                    } else {
                        return null;
                    }
                },
                onRedirect: function onRedirect(url_parts, tab_id) {
                    if (tab_id in this._active) {
                        var prev = this._active[tab_id];
                        this._active[tab_id] = new PageLoadData(url_parts);
                        this._active[tab_id].redirects = prev.redirects;
                        this._active[tab_id].redirects.push(prev.hostname);
                    } else {
                        this.onFullPage(url_parts, tab_id);
                    }
                },
                // Get a stats object for the request to url, referred from ref, on tab source.
                // url_parts and ref_parts contain the decomposed parts (from parseURL) of url and ref respectively.
                // returns an object containing keys specified in tp_events._stats representing the running stats
                // for the requesting third party on the source page.
                // Returns null if the referrer is not valid.
                get: function get(url, url_parts, ref, ref_parts, source) {
                    if (source <= 0 || source === null || source === undefined) {
                        if (CliqzAttrack.debug) CliqzUtils.log("No source for request, not logging!", "tp_events");
                        return null;
                    }

                    if (!(source in this._active)) {
                        if (!ref || !ref_parts || !ref_parts.hostname) {
                            return null;
                        }
                        if (CliqzAttrack.debug) CliqzUtils.log("No fullpage request for referrer: " + ref + " -> " + url, "tp_events");
                        return null;
                    }

                    var page_graph = this._active[source];
                    if (!page_graph.isReferredFrom(ref_parts)) {
                        if (!ref || !ref_parts || !ref_parts.hostname) return null;
                        if (source in this._old_tab_idx) {
                            var prev_graph = this._staged[this._old_tab_idx[source]];
                            if (prev_graph && prev_graph.isReferredFrom(ref_parts)) {
                                if (CliqzAttrack.debug) CliqzUtils.log("Request for expired tab " + ref_parts.hostname + " -> " + url_parts.hostname + " (" + prev_graph['hostname'] + ")", 'tp_events');
                                return prev_graph.getTpUrl(url_parts.hostname, url_parts.path);
                            }
                        }
                        if (CliqzAttrack.debug) CliqzUtils.log("tab/referrer mismatch " + ref_parts.hostname + " -> " + url_parts.hostname + " (" + page_graph['hostname'] + ")", 'tp_events');
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
                                if (CliqzAttrack.debug) CliqzUtils.log('Stage tab ' + k, 'tp_events');
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
                        var payload_data = this._staged.map(function (item) {
                            return item.asPlainObject();
                        }).filter(function (item) {
                            return item['hostname'].length > 0 && Object.keys(item['tps']).length > 0;
                        });

                        // if we still have some data, send the telemetry
                        if (payload_data.length > 0) {
                            if (CliqzAttrack.debug) CliqzUtils.log('Pushing data for ' + payload_data.length + ' requests', 'tp_events');
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy90cF9ldmVudHMuZXMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7OEVBa0hJLEtBQUssRUFFTCxTQUFTO0FBNUdiLGFBQVMsWUFBWSxDQUFDLEdBQUcsRUFBRTs7O0FBR3ZCLFlBQUksQ0FBQyxVQUFVLEdBQUcsVUFBUyxDQUFDLEVBQUU7QUFDMUIsZ0JBQUcsQ0FBQyxDQUFDLEVBQUUsT0FBTyxFQUFFLENBQUM7QUFDakIsbUJBQU8sR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDbEMsQ0FBQzs7QUFFRixZQUFJLENBQUMsR0FBRyxHQUFHLEdBQUcsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUMxQixZQUFJLENBQUMsUUFBUSxHQUFHLEdBQUcsQ0FBQyxRQUFRLENBQUM7QUFDN0IsWUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN0QyxZQUFJLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNYLFlBQUksQ0FBQyxDQUFDLEdBQUcsQUFBQyxJQUFJLElBQUksRUFBRSxDQUFFLE9BQU8sRUFBRSxDQUFDO0FBQ2hDLFlBQUksQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDO0FBQ2QsWUFBSSxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUM7QUFDZCxZQUFJLENBQUMsU0FBUyxHQUFHLEVBQUUsQ0FBQzs7OztBQUlwQixZQUFJLENBQUMsUUFBUSxHQUFHLFVBQVMsT0FBTyxFQUFFLE9BQU8sRUFBRTtBQUN2QyxnQkFBSSxRQUFRLEdBQUcsT0FBTyxDQUFDO0FBQ3ZCLGdCQUFHLEVBQUUsT0FBTyxJQUFJLElBQUksQ0FBQyxHQUFHLENBQUEsQUFBQyxFQUFFO0FBQ3ZCLG9CQUFJLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsQ0FBQzthQUMxQjtBQUNELGdCQUFHLEVBQUUsUUFBUSxJ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QUFFO2lDQUN6RCxDQUFDO0FBQ0YseUNBQVMsQ0FBQyxTQUFTLENBQUMsRUFBQyxNQUFNLEVBQUUsU0FBUyxDQUFDLE9BQU8sRUFBRSxRQUFRLEVBQUUsbUJBQW1CLEVBQUUsU0FBUyxFQUFFLElBQUksRUFBQyxDQUFDLENBQUM7NkJBQ3BHO3lCQUNKO0FBQ0QsNEJBQUksQ0FBQyxPQUFPLEdBQUcsRUFBRSxDQUFDO0FBQ2xCLDRCQUFJLENBQUMsWUFBWSxHQUFHLEVBQUUsQ0FBQztBQUN2Qiw0QkFBSSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7cUJBQ3pCO2lCQUNKO0FBQ0QsK0JBQWUsRUFBRSwyQkFBVztBQUN4Qix3QkFBSSxHQUFHLEdBQUcsRUFBRTt3QkFDUixVQUFVLEdBQUcsS0FBSyxDQUFDO0FBQ3ZCLHlCQUFJLElBQUksQ0FBQyxJQUFJLFVBQVUsRUFBRTtBQUNyQiwyQkFBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztxQkFDMUI7QUFDRCwyQkFBTyxHQUFHLENBQUM7aUJBQ2Q7QUFDRCw2QkFBYSxFQUFFLHVCQUFTLE9BQU8sRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFO0FBQzFDLHdCQUFJLE9BQU8sSUFBSSxJQUFJLEVBQUU7QUFDakIsNEJBQUcsRUFBRSxRQUFRLElBQUksT0FBTyxDQUFBLEFBQUMsRUFBRTtBQUN2QixtQ0FBTyxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQzt5QkFDekI7QUFDRCw0QkFBSSxDQUFFLE1BQU0sQ0FBQyxTQUFTLENBQUMsQ0FBQyxDQUFDLEVBQUc7QUFDeEIsNkJBQUMsR0FBRyxDQUFDLENBQUM7eUJBQ1Q7QUFDRCwrQkFBTyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztxQkFDMUI7aUJBQ0o7YUFDSjs7K0JBRWMsU0FBUyIsImZpbGUiOiJhbnRpdHJhY2tpbmcvdHBfZXZlbnRzLmVzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGJhY2tncm91bmQgZnJvbSAnYW50aXRyYWNraW5nL2JhY2tncm91bmQnO1xuaW1wb3J0IENsaXF6QXR0cmFjayBmcm9tICdhbnRpdHJhY2tpbmcvYXR0cmFjayc7XG5pbXBvcnQgbWQ1IGZyb20gJ2FudGl0cmFja2luZy9tZDUnO1xuaW1wb3J0IHsgc2FtZUdlbmVyYWxEb21haW4gfSBmcm9tICdhbnRpdHJhY2tpbmcvZG9tYWluJztcbmltcG9ydCB0ZWxlbWV0cnkgZnJvbSAnYW50aXRyYWNraW5nL3RlbGVtZXRyeSc7XG5pbXBvcnQgKiBhcyBicm93c2VyIGZyb20gJ3BsYXRmb3JtL2Jyb3dzZXInO1xuXG4vLyBDbGFzcyB0byBob2xkIGEgcGFnZSBsb2FkIGFuZCB0aGlyZCBwYXJ0eSB1cmxzIGxvYWRlZCBieSB0aGlzIHBhZ2UuXG5mdW5jdGlvbiBQYWdlTG9hZERhdGEodXJsKSB7XG5cbiAgICAvLyBDcmVhdGUgYSBzaG9ydCBtZDUgaGFzaCBvZiB0aGUgaW5wdXQgc3RyaW5nIHNcbiAgICB0aGlzLl9zaG9ydEhhc2ggPSBmdW5jdGlvbihzKSB7XG4gICAgICAgIGlmKCFzKSByZXR1cm4gJyc7XG4gICAgICAgIHJldHVybiBtZDUocykuc3Vic3RyaW5nKDAsIDE2KTtcbiAgICB9O1xuXG4gICAgdGhpcy51cmwgPSB1cmwudG9TdHJpbmcoKTtcbiAgICB0aGlzLmhvc3RuYW1lID0gdXJsLmhvc3RuYW1lO1xuICAgIHRoaXMucGF0aCA9IHRoaXMuX3Nob3J0SGFzaCh1cmwucGF0aCk7XG4gICAgdGhpcy5jID0gMTtcbiAgICB0aGlzLnMgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgIHRoaXMuZSA9IG51bGw7XG4gICAgdGhpcy50cHMgPSB7fTtcbiAgICB0aGlzLnJlZGlyZWN0cyA9IFtdO1xuXG4gICAgLy8gR2V0IGEgc3RhdCBjb3VudGVyIG9iamVjdCBmb3IgdGhlIGdpdmVuIHRoaXJkIHBhcnR5IGhvc3QgYW5kIHBhdGggaW5cbiAgICAvLyB0aGlzIHBhZ2UgbG9hZC5cbiAgICB0aGlzLmdldFRwVXJsID0gZnVuY3Rpb24odHBfaG9zdCwgdHBfcGF0aCkge1xuICAgICAgICB2YXIgcGF0aF9rZXkgPSB0cF9wYXRoOyAvLyBUT0RPIGhhc2ggaXQ/XG4gICAgICAgIGlmKCEodHBfaG9zdCBpbiB0aGlzLnRwcykpIHtcbiAgICAgICAgICAgIHRoaXMudHBzW3RwX2hvc3RdID0ge307XG4gICAgICAgIH1cbiAgICAgICAgaWYoIShwYXRoX2tleSBpbiB0aGlzLnRwc1t0cF9ob3N0XSkpIHtcbiAgICAgICAgICAgIHRoaXMudHBzW3RwX2hvc3RdW3BhdGhfa2V5XSA9IHRoaXMuX3RwU3RhdENvdW50ZXIoKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy50cHNbdHBfaG9zdF1bcGF0aF9rZXldO1xuICAgIH07XG5cbiAgICAvLyBSZXR1cm5zIHRydWUgaWYgdGhlIGdpdmVuIHJlZmVycmVyIG1hdGNoZXMgdGhpcyBwYWdlIGxvYWQuXG4gICAgLy8gVGhpcyBjYW4gYmUgZWl0aGVyIGEgZGlyZWN0IHJlZmVycmFsIChyZWZlcnJlciBtYXRjaGVzIHBhZ2UgbG9hZCB1cmwpLFxuICAgIC8vIG9yIG50aCBkZWdyZWUgKHJlZmVycmVyIGlzIHNvbWV3aGVyZSBpbiB0aGUgZ3JhcGggb2YgcmVmZXJyYWxzIG9yaWdpbmF0aW5nXG4gICAgLy8gZnJvbSB0aGUgb3JpZ2luYWwgcGFnZSBsb2FkIHVybCkuXG4gICAgdGhpcy5pc1JlZmVycmVkRnJvbSA9IGZ1bmN0aW9uKHJlZl9wYXJ0cykge1xuICAgICAgICBpZighcmVmX3BhcnRzKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIGlmKHNhbWVHZW5lcmFsRG9tYWluKHJlZl9wYXJ0cy5ob3N0bmFtZSwgdGhpcy5ob3N0bmFtZSkpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIC8vIG5vdCBhIGRpcmVjdCByZWZlcnJhbCwgYnV0IGNvdWxkIGJlIHZpYSBhIHRoaXJkIHBhcnR5XG4gICAgICAgIGlmKHJlZl9wYXJ0cy5ob3N0bmFtZSBpbiB0aGlzLnRwcykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG5cbiAgICB0aGlzLl90cFN0YXRDb3VudGVyID0gdHBfZXZlbnRzLl9uZXdTdGF0Q291bnRlcjtcblxuICAgIC8vIENyZWF0ZXMgYSBwbGFpbiwgYWdncmVnYXRlZCB2ZXJzaW9uIG9mIHRoaXMgb2JqZWN0LCBzdWl0YWJsZSBmb3IgY29udmVydGluZ1xuICAgIC8vIHRvIEpTT04sIGFuZCBzZW5kaW5nIGFzIHRlbGVtZXRyeS5cbiAgICB0aGlzLmFzUGxhaW5PYmplY3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzLFxuICAgICAgICAgICAgb2JqID0ge1xuICAgICAgICAgICAgICAgIGhvc3RuYW1lOiB0aGlzLl9zaG9ydEhhc2godGhpcy5ob3N0bmFtZSksXG4gICAgICAgICAgICAgICAgcGF0aDogdGhpcy5wYXRoLFxuICAgICAgICAgICAgICAgIGM6IHRoaXMuYyxcbiAgICAgICAgICAgICAgICB0OiB0aGlzLmUgLSB0aGlzLnMsXG4gICAgICAgICAgICAgICAgcmE6IHRoaXMucmEgfHwgMCxcbiAgICAgICAgICAgICAgICB0cHM6IHt9LFxuICAgICAgICAgICAgICAgIHJlZGlyZWN0czogdGhpcy5yZWRpcmVjdHMuZmlsdGVyKGZ1bmN0aW9uKGhvc3RuYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAhc2FtZUdlbmVyYWxEb21haW4oaG9zdG5hbWUsIHNlbGYuaG9zdG5hbWUpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICB9O1xuICAgICAgICBpZighb2JqLmhvc3RuYW1lKSByZXR1cm4gb2JqO1xuXG4gICAgICAgIGZvcihsZXQgdHBfZG9tYWluIGluIHRoaXMudHBzKSB7XG4gICAgICAgICAgICB2YXIgdHBfZG9tYWluX2RhdGEgPSB0aGlzLnRwc1t0cF9kb21haW5dLFxuICAgICAgICAgICAgICAgIHRwX3BhdGhzID0gT2JqZWN0LmtleXModHBfZG9tYWluX2RhdGEpO1xuICAgICAgICAgICAgLy8gc2tpcCBzYW1lIGdlbmVyYWwgZG9tYWluXG4gICAgICAgICAgICBpZihzYW1lR2VuZXJhbERvbWFpbihzZWxmLmhvc3RuYW1lLCB0cF9kb21haW4pKSB7XG4gICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZih0cF9wYXRocy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgLy8gYWdncmVnYXRlIHN0YXRzIHBlciB0cCBkb21haW4uXG4gICAgICAgICAgICAgICAgdmFyIHBhdGhfZGF0YSA9IHRwX3BhdGhzLm1hcChmdW5jdGlvbihrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRwX2RvbWFpbl9kYXRhW2tdWydwYXRocyddID0gW3NlbGYuX3Nob3J0SGFzaChrKV07XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cF9kb21haW5fZGF0YVtrXTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBvYmpbJ3RwcyddW3RwX2RvbWFpbl0gPSBwYXRoX2RhdGEucmVkdWNlKHRoaXMuX3N1bVN0YXRzKTtcblxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUga2V5cyB3aGljaCBoYXZlIHZhbHVlID09IDA7XG4gICAgICAgICAgICAgICAgc3RhdHMuZm9yRWFjaChmdW5jdGlvbihlYWNoS2V5KXtcbiAgICAgICAgICAgICAgICAgICAgaWYob2JqWyd0cHMnXVt0cF9kb21haW5dICYmIG9ialsndHBzJ11bdHBfZG9tYWluXVtlYWNoS2V5XSA9PSAwKVxuICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIG9ialsndHBzJ11bdHBfZG9tYWluXVtlYWNoS2V5XTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBUaGlzIHdhcyBhZGRlZCB0byBjb2xsZWN0IGRhdGEgZm9yIGV4cGVyaW1lbnQsIHNhZmUgdG8gc3RvcCBjb2xsZWN0aW5nIGl0IG5vdy5cbiAgICAgICAgLy8gY2hlY2tCbGFja0xpc3QodGhpcy51cmwsIG9iaik7XG4gICAgICAgIC8vIGNoZWNrRmluZ2VyUHJpbnRpbmcodGhpcy51cmwsIG9iaik7XG4gICAgICAgIHJldHVybiBvYmo7XG4gICAgfTtcblxuICAgIHRoaXMuX3N1bVN0YXRzID0gZnVuY3Rpb24oYSwgYikge1xuICAgICAgICB2YXIgYyA9IHt9LFxuICAgICAgICAgICAgc3RhdHNfa2V5cyA9IG5ldyBTZXQoT2JqZWN0LmtleXMoYSkuY29uY2F0KE9iamVjdC5rZXlzKGIpKSk7XG4gICAgICAgIC8vIHBhdGhzIGlzIGEgc3BlY2lhbCBjYXNlXG4gICAgICAgIHN0YXRzX2tleXMuZGVsZXRlKCdwYXRocycpO1xuICAgICAgICBzdGF0c19rZXlzLmZvckVhY2goZnVuY3Rpb24ocyl7XG4gICAgICAgICAgICBjW3NdID0gKGFbc10gfHwgMCkgKyAoYltzXSB8fCAwKTtcbiAgICAgICAgfSk7XG4gICAgICAgIGNbJ3BhdGhzJ10gPSBhWydwYXRocyddLmNvbmNhdChiWydwYXRocyddKTtcbiAgICAgICAgcmV0dXJuIGM7XG4gICAgfTtcbn07XG5cbnZhciBzdGF0cyA9IFsnYyddO1xuXG52YXIgdHBfZXZlbnRzID0ge1xuICAgIF9hY3RpdmU6IHt9LFxuICAgIF9vbGRfdGFiX2lkeDoge30sXG4gICAgX3N0YWdlZDogW10sXG4gICAgX2xhc3RfY2xlYW46IDAsXG4gICAgX2NsZWFuX2ludGVydmFsOiAxMDAwKjEwLCAvLyAxMHNcbiAgICBfcHVzaF9pbnRlcnZhbDogMTAwMCo2MCoyMCwgLy8gMjAgbWludXRlcyBkZWNyZWFzaW5nIHRoZSBmcmVxdWVuY3kgZnJvbSA1IG1pbnV0ZXMgdG8gMjAgbWludXRlcy5cbiAgICBfbGFzdF9wdXNoOiAwLFxuICAgIGlnbm9yZTogbmV3IFNldChbJ3NlbGYtcmVwYWlyLm1vemlsbGEub3JnJ10pLFxuICAgIC8vIENhbGxlZCB3aGVuIGEgdXJsIGlzIGxvYWRlZCBvbiB3aW5kb3dJRCBzb3VyY2UuXG4gICAgLy8gUmV0dXJucyB0aGUgUGFnZUxvYWREYXRhIG9iamVjdCBmb3IgdGhpcyB1cmwuXG4gICAgLy8gIG9yIHJldHVybnMgbnVsbCBpZiB0aGUgdXJsIGlzIG1hbGZvcm1lZCBvciBudWxsLlxuICAgIG9uRnVsbFBhZ2U6IGZ1bmN0aW9uKHVybCwgdGFiX2lkKSB7XG4gICAgICAgIC8vIHByZXZpb3VzIHJlcXVlc3QgZmluaXNoZWQuIE1vdmUgdG8gc3RhZ2VkXG4gICAgICAgIHRoaXMuc3RhZ2UodGFiX2lkKTtcbiAgICAgICAgLy8gY3JlYXRlIG5ldyBwYWdlIGxvYWQgZW50cnkgZm9yIHRhYlxuICAgICAgICBpZih1cmwgJiYgdXJsLmhvc3RuYW1lICYmIHRhYl9pZCA+IDAgJiYgIXRoaXMuaWdub3JlLmhhcyh1cmwuaG9zdG5hbWUpKSB7XG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVbdGFiX2lkXSA9IG5ldyBQYWdlTG9hZERhdGEodXJsKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl9hY3RpdmVbdGFiX2lkXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBvblJlZGlyZWN0OiBmdW5jdGlvbih1cmxfcGFydHMsIHRhYl9pZCkge1xuICAgICAgICBpZih0YWJfaWQgaW4gdGhpcy5fYWN0aXZlKSB7XG4gICAgICAgICAgICBsZXQgcHJldiA9IHRoaXMuX2FjdGl2ZVt0YWJfaWRdO1xuICAgICAgICAgICAgdGhpcy5fYWN0aXZlW3RhYl9pZF0gPSBuZXcgUGFnZUxvYWREYXRhKHVybF9wYXJ0cyk7XG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVbdGFiX2lkXS5yZWRpcmVjdHMgPSBwcmV2LnJlZGlyZWN0cztcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2ZVt0YWJfaWRdLnJlZGlyZWN0cy5wdXNoKHByZXYuaG9zdG5hbWUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5vbkZ1bGxQYWdlKHVybF9wYXJ0cywgdGFiX2lkKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgLy8gR2V0IGEgc3RhdHMgb2JqZWN0IGZvciB0aGUgcmVxdWVzdCB0byB1cmwsIHJlZmVycmVkIGZyb20gcmVmLCBvbiB0YWIgc291cmNlLlxuICAgIC8vIHVybF9wYXJ0cyBhbmQgcmVmX3BhcnRzIGNvbnRhaW4gdGhlIGRlY29tcG9zZWQgcGFydHMgKGZyb20gcGFyc2VVUkwpIG9mIHVybCBhbmQgcmVmIHJlc3BlY3RpdmVseS5cbiAgICAvLyByZXR1cm5zIGFuIG9iamVjdCBjb250YWluaW5nIGtleXMgc3BlY2lmaWVkIGluIHRwX2V2ZW50cy5fc3RhdHMgcmVwcmVzZW50aW5nIHRoZSBydW5uaW5nIHN0YXRzXG4gICAgLy8gZm9yIHRoZSByZXF1ZXN0aW5nIHRoaXJkIHBhcnR5IG9uIHRoZSBzb3VyY2UgcGFnZS5cbiAgICAvLyBSZXR1cm5zIG51bGwgaWYgdGhlIHJlZmVycmVyIGlzIG5vdCB2YWxpZC5cbiAgICBnZXQ6IGZ1bmN0aW9uKHVybCwgdXJsX3BhcnRzLCByZWYsIHJlZl9wYXJ0cywgc291cmNlKSB7XG4gICAgICAgIGlmKHNvdXJjZSA8PSAwfHwgc291cmNlID09PSBudWxsIHx8IHNvdXJjZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmRlYnVnKSBDbGlxelV0aWxzLmxvZyhcIk5vIHNvdXJjZSBmb3IgcmVxdWVzdCwgbm90IGxvZ2dpbmchXCIsIFwidHBfZXZlbnRzXCIpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuICAgICAgICBpZighKHNvdXJjZSBpbiB0aGlzLl9hY3RpdmUpKSB7XG4gICAgICAgICAgICBpZighcmVmIHx8ICFyZWZfcGFydHMgfHwgIXJlZl9wYXJ0cy5ob3N0bmFtZSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKENsaXF6QXR0cmFjay5kZWJ1ZykgQ2xpcXpVdGlscy5sb2coXCJObyBmdWxscGFnZSByZXF1ZXN0IGZvciByZWZlcnJlcjogXCIrIHJlZiArXCIgLT4gXCIrIHVybCAsIFwidHBfZXZlbnRzXCIpO1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cblxuXG4gICAgICAgIHZhciBwYWdlX2dyYXBoID0gdGhpcy5fYWN0aXZlW3NvdXJjZV07XG4gICAgICAgIGlmKCFwYWdlX2dyYXBoLmlzUmVmZXJyZWRGcm9tKHJlZl9wYXJ0cykpIHtcbiAgICAgICAgICAgIGlmKCFyZWYgfHwgIXJlZl9wYXJ0cyB8fCAhcmVmX3BhcnRzLmhvc3RuYW1lKSByZXR1cm4gbnVsbDtcbiAgICAgICAgICAgIGlmKHNvdXJjZSBpbiB0aGlzLl9vbGRfdGFiX2lkeCkge1xuICAgICAgICAgICAgICAgIHZhciBwcmV2X2dyYXBoID0gdGhpcy5fc3RhZ2VkW3RoaXMuX29sZF90YWJfaWR4W3NvdXJjZV1dO1xuICAgICAgICAgICAgICAgIGlmKHByZXZfZ3JhcGggJiYgcHJldl9ncmFwaC5pc1JlZmVycmVkRnJvbShyZWZfcGFydHMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChDbGlxekF0dHJhY2suZGVidWcpIENsaXF6VXRpbHMubG9nKFwiUmVxdWVzdCBmb3IgZXhwaXJlZCB0YWIgXCIrIHJlZl9wYXJ0cy5ob3N0bmFtZSArXCIgLT4gXCIrIHVybF9wYXJ0cy5ob3N0bmFtZSArXCIgKFwiKyBwcmV2X2dyYXBoWydob3N0bmFtZSddICtcIilcIiwgJ3RwX2V2ZW50cycpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcHJldl9ncmFwaC5nZXRUcFVybCh1cmxfcGFydHMuaG9zdG5hbWUsIHVybF9wYXJ0cy5wYXRoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmRlYnVnKSBDbGlxelV0aWxzLmxvZyhcInRhYi9yZWZlcnJlciBtaXNtYXRjaCBcIisgcmVmX3BhcnRzLmhvc3RuYW1lICtcIiAtPiBcIisgdXJsX3BhcnRzLmhvc3RuYW1lICtcIiAoXCIrIHBhZ2VfZ3JhcGhbJ2hvc3RuYW1lJ10gK1wiKVwiLCAndHBfZXZlbnRzJyk7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBwYWdlX2dyYXBoLmdldFRwVXJsKHVybF9wYXJ0cy5ob3N0bmFtZSwgdXJsX3BhcnRzLnBhdGgpO1xuICAgIH0sXG4gICAgLy8gTW92ZSB0aGUgUGFnZUxvYWREYXRhIG9iamVjdCBmb3Igd2luZG93SUQgdG8gdGhlIHN0YWdpbmcgYXJlYS5cbiAgICBzdGFnZTogZnVuY3Rpb24od2luZG93SUQpIHtcbiAgICAgICAgaWYod2luZG93SUQgaW4gdGhpcy5fYWN0aXZlKSB7XG4gICAgICAgICAgICB0aGlzLl9hY3RpdmVbd2luZG93SURdWydlJ10gPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICAgICAgLy8gcHVzaCBvYmplY3QgdG8gc3RhZ2luZyBhbmQgc2F2ZSBpdHMgaWRcbiAgICAgICAgICAgIHRoaXMuX29sZF90YWJfaWR4W3dpbmRvd0lEXSA9IHRoaXMuX3N0YWdlZC5wdXNoKHRoaXMuX2FjdGl2ZVt3aW5kb3dJRF0pIC0gMTtcbiAgICAgICAgICAgIGRlbGV0ZSB0aGlzLl9hY3RpdmVbd2luZG93SURdO1xuICAgICAgICB9XG4gICAgfSxcbiAgICAvLyBQZXJpb2RpY2FsbHkgc3RhZ2UgYW55IHRhYnMgd2hpY2ggYXJlIG5vIGxvbmdlciBhY3RpdmUuXG4gICAgLy8gV2lsbCBydW4gYXQgYSBwZXJpb2Qgc3BlY2lmZWQgYnkgdHBfZXZlbnRzLl9jbGVhbl9pbnRlcnZhbCwgdW5sZXNzIGZvcmNlX2NsZWFuIGlzIHRydWVcbiAgICAvLyBJZiBmb3JjZV9zdGFnZSBpcyB0cnVlLCB3aWxsIHN0YWdlIGFsbCB0YWJzLCBvdGhlcndpc2Ugd2lsbCBvbmx5IHN0YWdlIGluYWN0aXZlLlxuICAgIGNvbW1pdDogZnVuY3Rpb24oZm9yY2VfY2xlYW4sIGZvcmNlX3N0YWdlKSB7XG4gICAgICAgIHZhciBub3cgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICBpZihub3cgLSB0aGlzLl9sYXN0X2NsZWFuID4gdGhpcy5fY2xlYW5faW50ZXJ2YWwgfHwgZm9yY2VfY2xlYW4gPT0gdHJ1ZSkge1xuICAgICAgICAgICAgZm9yKGxldCBrIGluIHRoaXMuX2FjdGl2ZSkge1xuICAgICAgICAgICAgICAgIHZhciBhY3RpdmUgPSBicm93c2VyLmlzV2luZG93QWN0aXZlKGspO1xuICAgICAgICAgICAgICAgIGlmKCFhY3RpdmUgfHwgZm9yY2Vfc3RhZ2UgPT0gdHJ1ZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmRlYnVnKSBDbGlxelV0aWxzLmxvZygnU3RhZ2UgdGFiICcraywgJ3RwX2V2ZW50cycpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLnN0YWdlKGspO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuX2xhc3RfY2xlYW4gPSBub3c7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIC8vIFB1c2ggc3RhZ2VkIFBhZ2VMb2FkRGF0YSB0byBodW1hbiB3ZWIuXG4gICAgLy8gV2lsbCBydW4gYXQgYSBwZXJpb2Qgc3BlY2lmaWVkIGJ5IHRwX2V2ZW50cy5fcHVzaF9pbnRlcnZhbCwgdW5sZXNzIGZvcmNlX3B1c2ggaXMgdHJ1ZS5cbiAgICBwdXNoOiBmdW5jdGlvbihmb3JjZV9wdXNoKSB7XG4gICAgICAgIHZhciBub3cgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpO1xuICAgICAgICBpZih0aGlzLl9zdGFnZWQubGVuZ3RoID4gMCAmJiAobm93IC0gdGhpcy5fbGFzdF9wdXNoID4gdGhpcy5fcHVzaF9pbnRlcnZhbCB8fCBmb3JjZV9wdXNoID09IHRydWUpKSB7XG4gICAgICAgICAgICAvLyBjb252ZXJ0IHN0YWdlZCBvYmplY3RzIGludG8gc2ltcGxlIG9iamVjdHMsIGFuZCBhZ2dyZWdhdGUuXG4gICAgICAgICAgICAvLyB0aGVuIGZpbHRlciBvdXQgb25lcyB3aXRoIGJhZCBkYXRhICh1bmRlZmluZWQgaG9zdG5hbWUgb3Igbm8gdGhpcmQgcGFydGllcylcbiAgICAgICAgICAgIHZhciBwYXlsb2FkX2RhdGEgPSB0aGlzLl9zdGFnZWQubWFwKGZ1bmN0aW9uKGl0ZW0pIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaXRlbS5hc1BsYWluT2JqZWN0KCk7XG4gICAgICAgICAgICB9KS5maWx0ZXIoZnVuY3Rpb24oaXRlbSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBpdGVtWydob3N0bmFtZSddLmxlbmd0aCA+IDAgJiYgT2JqZWN0LmtleXMoaXRlbVsndHBzJ10pLmxlbmd0aCA+IDA7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gaWYgd2Ugc3RpbGwgaGF2ZSBzb21lIGRhdGEsIHNlbmQgdGhlIHRlbGVtZXRyeVxuICAgICAgICAgICAgaWYocGF5bG9hZF9kYXRhLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBpZiAoQ2xpcXpBdHRyYWNrLmRlYnVnKSBDbGlxelV0aWxzLmxvZygnUHVzaGluZyBkYXRhIGZvciAnKyBwYXlsb2FkX2RhdGEubGVuZ3RoICsnIHJlcXVlc3RzJywgJ3RwX2V2ZW50cycpO1xuICAgICAgICAgICAgICAgIHZhciBlbmFibGVkID0ge1xuICAgICAgICAgICAgICAgICAgICAncXMnOiBDbGlxekF0dHJhY2suaXNRU0VuYWJsZWQoKSxcbiAgICAgICAgICAgICAgICAgICAgJ2Nvb2tpZSc6IENsaXF6QXR0cmFjay5pc0Nvb2tpZUVuYWJsZWQoKSxcbiAgICAgICAgICAgICAgICAgICAgJ2Jsb29tRmlsdGVyJzogQ2xpcXpBdHRyYWNrLmlzQmxvb21GaWx0ZXJFbmFibGVkKCksXG4gICAgICAgICAgICAgICAgICAgICd0cmFja1R4dCc6IENsaXF6QXR0cmFjay5pc1RyYWNrZXJUeHRFbmFibGVkKCksXG4gICAgICAgICAgICAgICAgICAgICdmb3JjZUJsb2NrJzogQ2xpcXpBdHRyYWNrLmlzRm9yY2VCbG9ja0VuYWJsZWQoKSxcbiAgICAgICAgICAgICAgICAgICAgJ3VpJzogYmFja2dyb3VuZC5idXR0b25FbmFibGVkXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBheWxvYWRfZGF0YS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgcGF5bCA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICdkYXRhJzogW3BheWxvYWRfZGF0YVtpXV0sXG4gICAgICAgICAgICAgICAgICAgICAgICAndmVyJzogQ2xpcXpBdHRyYWNrLlZFUlNJT04sXG4gICAgICAgICAgICAgICAgICAgICAgICAnY29uZic6IGVuYWJsZWQsXG4gICAgICAgICAgICAgICAgICAgICAgICAnYWRkb25zJzogQ2xpcXpBdHRyYWNrLnNpbWlsYXJBZGRvbixcbiAgICAgICAgICAgICAgICAgICAgICAgICd1cGRhdGVJblRpbWUnOiBDbGlxekF0dHJhY2sucXNfd2hpdGVsaXN0LmlzVXBUb0RhdGUoKVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICB0ZWxlbWV0cnkudGVsZW1ldHJ5KHsndHlwZSc6IHRlbGVtZXRyeS5tc2dUeXBlLCAnYWN0aW9uJzogJ2F0dHJhY2sudHBfZXZlbnRzJywgJ3BheWxvYWQnOiBwYXlsfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5fc3RhZ2VkID0gW107XG4gICAgICAgICAgICB0aGlzLl9vbGRfdGFiX2lkeCA9IHt9O1xuICAgICAgICAgICAgdGhpcy5fbGFzdF9wdXNoID0gbm93O1xuICAgICAgICB9XG4gICAgfSxcbiAgICBfbmV3U3RhdENvdW50ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgY3RyID0ge30sXG4gICAgICAgICAgICBzdGF0c19rZXlzID0gc3RhdHM7XG4gICAgICAgIGZvcih2YXIgcyBpbiBzdGF0c19rZXlzKSB7XG4gICAgICAgICAgICBjdHJbc3RhdHNfa2V5c1tzXV0gPSAwO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBjdHI7XG4gICAgfSxcbiAgICBpbmNyZW1lbnRTdGF0OiBmdW5jdGlvbihyZXFfbG9nLCBzdGF0X2tleSwgbikge1xuICAgICAgICBpZiAocmVxX2xvZyAhPSBudWxsKSB7XG4gICAgICAgICAgICBpZighKHN0YXRfa2V5IGluIHJlcV9sb2cpKSB7XG4gICAgICAgICAgICAgICAgcmVxX2xvZ1tzdGF0X2tleV0gPSAwO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCEgTnVtYmVyLmlzSW50ZWdlcihuKSApIHtcbiAgICAgICAgICAgICAgICBuID0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcV9sb2dbc3RhdF9rZXldICs9IG47XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHRwX2V2ZW50cztcbiJdfQ==