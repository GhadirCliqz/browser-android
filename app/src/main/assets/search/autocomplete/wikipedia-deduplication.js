System.register("autocomplete/wikipedia-deduplication", ["core/cliqz", "platform/language"], function (_export) {
    /**
     * This modules implements reranking of results using user specific data
     */
    "use strict";

    var utils, language, CliqzWikipediaDeduplication;
    return {
        setters: [function (_coreCliqz) {
            utils = _coreCliqz.utils;
        }, function (_platformLanguage) {
            language = _platformLanguage["default"];
        }],
        execute: function () {
            CliqzWikipediaDeduplication = {
                LOG_KEY: 'CliqzWikipediaDeduplication',
                name: 'lang_deduplication',

                /* choose best url from list based on original order (reranking)*/
                chooseUrlByIndex: function chooseUrlByIndex(searchedUrls, originalUrls) {
                    var maxPos = originalUrls.length;
                    var bestUrl = null;
                    Object.keys(searchedUrls).forEach(function (lang) {
                        var urls = searchedUrls[lang];
                        urls.forEach(function (url) {
                            var i = originalUrls.indexOf(url);
                            if (i < maxPos) {
                                maxPos = i;
                                bestUrl = url;
                            }
                        });
                    });
                    return bestUrl;
                },
                /* choose best url from list taking language into account */
                chooseUrlByLang: function chooseUrlByLang(searchedUrls, originalUrls, requestedLangs) {
                    if (requestedLangs == null || requestedLangs.length == 0) {
                        return this.chooseUrlByIndex(searchedUrls, originalUrls);
                    }
                    var maxPos = originalUrls.length;
                    var bestUrl = null;
                    Object.keys(searchedUrls).forEach(function (lang) {
                        var urls = searchedUrls[lang];
                        urls.forEach(function (url) {
                            var i = originalUrls.indexOf(url);
                            if (i < maxPos && requestedLangs.indexOf(lang) != -1) {
                                maxPos = i;
                                bestUrl = url;
                            }
                        });
                    });
                    if (bestUrl == null) {
                        bestUrl = this.chooseUrlByIndex(searchedUrls, originalUrls);
                    }
                    return bestUrl;
                },
                /*strip protocol from url*/
                urlStripProtocol: function urlStripProtocol(url) {
                    var toRemove = ["https://", "http://", "www2.", "www.", "mobile.", "mobil.", "m."];
                    toRemove.forEach(function (part) {
                        if (url.toLowerCase().startsWith(part)) {
                            url = url.substring(part.length);
                        }
                    });
                    return url;
                },
                /*get most used user languages*/
                getUserLanguages: function getUserLanguages(factor) {
                    factor = typeof factor !== 'undefined' ? factor : 1.5;
                    var availableLangs = language.state(true);
                    var langs = [];
                    var lastValue = null;
                    availableLangs.forEach(function (langObj) {
                        // langObj = ["de", 0.0123]
                        if (lastValue == null) lastValue = langObj[1];
                        if (lastValue * factor >= langObj[1]) {
                            langs.push(langObj[0]);
                            lastValue = langObj[1];
                        }
                    });
                    return langs;
                },
                // dedup of languages for wikipedia case
                doRerank: function doRerank(response) {
                    //reset telemetry
                    var telemetrySignal = {};
                    var doDedup = CliqzUtils.getPref("languageDedup", false);
                    if (doDedup && response != null) {

                        var userLangs = this.getUserLanguages();

                        // dict of wiki languages to urls
                        var wikiLangs = {};

                        // list of all wiki urls
                        var wikiUrls = [];

                        // list of candidates to dedup with back link to original url
                        // {"de.wikipedia.org/url": "Https://de.wikipedia.org/URL"}
                        var candidates = {};

                        // list of all urls in response
                        var allUrls = [];

                        // dedup result
                        var dedups = {};

                        // process response and fill all structures
                        response.forEach(function (r) {
                            var obj = CliqzUtils.getDetailsFromUrl(r.url);
                            if (obj.domain == "wikipedia.org" && obj.subdomains.length) {
                                var lang = obj.subdomains[0];
                                if (wikiLangs[lang] == null) wikiLangs[lang] = [];
                                wikiLangs[lang].push(r.url);
                                candidates[this.urlStripProtocol(r.url).toLowerCase()] = r.url;
                                wikiUrls.push(r.url);
                                dedups[r.url] = [];
                            }
                            allUrls.push(r.url);
                        }, this);
                        telemetrySignal['available_languages'] = Object.keys(wikiLangs).length;
                        if (Object.keys(wikiLangs).length > 1) {
                            // we have wikipedia with different langs, try possible dedup
                            var bestUrl = this.chooseUrlByLang(wikiLangs, allUrls, userLangs);

                            var ind = allUrls.indexOf(bestUrl);
                            var bestUrlData = response[ind];
                            var langlinks = [];
                            try {
                                langlinks = bestUrlData.snippet.rich_data.langlinks;
                            } catch (e) {}
                            langlinks.forEach(function (langlink) {
                                var stripUrl = this.urlStripProtocol(langlink).toLowerCase();
                                var stripLang = stripUrl.split(".")[0];
                                if (stripUrl in candidates && userLangs.indexOf(stripLang) == -1) {
                                    var originalUrl = candidates[stripUrl];
                                    dedups[bestUrl].push(originalUrl);
                                    dedups[bestUrl].concat(dedups[originalUrl]);
                                    delete dedups[originalUrl];
                                }
                            }, this);
                            var deduped = wikiUrls.length - Object.keys(dedups).length;
                            telemetrySignal['total_urls'] = wikiUrls.length;
                            telemetrySignal['removed_urls'] = deduped;

                            if (deduped > 0) {
                                // backward structure with link where deduped url is pointing
                                var invertedUrls = {};
                                Object.keys(dedups).forEach(function (k) {
                                    dedups[k].forEach(function (url) {
                                        invertedUrls[url] = k;
                                    });
                                });
                                var dedupResponse = [];
                                for (var i = 0; i < response.length; i++) {
                                    var responseObj = response[i];
                                    if (responseObj.url in invertedUrls) {
                                        // this url should be replaced by main url
                                        var mainInd = allUrls.indexOf(invertedUrls[responseObj.url]);
                                        if (mainInd != -1) {
                                            var mainObj = response[mainInd];
                                            dedupResponse.push(mainObj);
                                            delete allUrls[mainInd];
                                        }
                                    } else {
                                        var maybeDeleted = allUrls.indexOf(responseObj.url);
                                        if (maybeDeleted != -1) {
                                            dedupResponse.push(responseObj);
                                            delete allUrls[i];
                                        }
                                    }
                                }

                                response = dedupResponse;
                            }
                        }
                    }
                    // if no dedups found
                    return {
                        telemetrySignal: telemetrySignal,
                        response: response
                    };
                }

            };

            _export("default", CliqzWikipediaDeduplication);
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dG9jb21wbGV0ZS93aWtpcGVkaWEtZGVkdXBsaWNhdGlvbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7eUJBT0ksMkJBQTJCOzs7K0JBSnRCLEtBQUs7Ozs7O0FBSVYsdUNBQTJCLEdBQUc7QUFDOUIsdUJBQU8sRUFBRSw2QkFBNkI7QUFDdEMsb0JBQUksRUFBRSxvQkFBb0I7OztBQUcxQixnQ0FBZ0IsRUFBRSwwQkFBUyxZQUFZLEVBQUUsWUFBWSxFQUFDO0FBQ2xELHdCQUFJLE1BQU0sR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDO0FBQ2pDLHdCQUFJLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDbkIsMEJBQU0sQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUMsT0FBTyxDQUFFLFVBQVUsSUFBSSxFQUFFO0FBQy9DLDRCQUFJLElBQUksR0FBRyxZQUFZLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDOUIsNEJBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxHQUFHLEVBQUM7QUFDdkIsZ0NBQUksQ0FBQyxHQUFHLFlBQVksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDbEMsZ0NBQUksQ0FBQyxHQUFHLE1BQU0sRUFBQztBQUNYLHNDQUFNLEdBQUcsQ0FBQyxDQUFDO0FBQ1gsdUNBQU8sR0FBRyxHQUFHLENBQUM7NkJBQ2pCO3lCQUNKLENBQUMsQ0FBQztxQkFDTixDQUFDLENBQUM7QUFDSCwyQkFBTyxPQUFPLENBQUM7aUJBQ2xCOztBQUVELCtCQUFlLEVBQUUseUJBQVMsWUFBWSxFQUFFLFlBQVksRUFBRSxjQUFjLEVBQUM7QUFDakUsd0JBQUksY0FBYyxJQUFJLElBQUksSUFBSSxjQUFjLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBQztBQUNyRCwrQkFBTyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsWUFBWSxFQUFFLFlBQVksQ0FBQyxDQUFDO3FCQUM1RDtBQUNELHdCQUFJLE1BQU0sR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDO0FB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Q0FBQyxFQUFFO0FBQ3BCLHlEQUFhLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ2hDLG1EQUFPLE9BQU8sQ0FBQyxDQUFDLENBQUMsQ0FBQzt5Q0FDckI7cUNBQ0o7aUNBQ0o7O0FBRUQsd0NBQVEsR0FBRyxhQUFhLENBQUM7NkJBQzVCO3lCQUNKO3FCQUNKOztBQUVELDJCQUFPO0FBQ0gsdUNBQWUsRUFBRSxlQUFlO0FBQ2hDLGdDQUFRLEVBQUUsUUFBUTtxQkFDckIsQ0FBQztpQkFDTDs7YUFFSjs7K0JBRWMsMkJBQTJCIiwiZmlsZSI6ImF1dG9jb21wbGV0ZS93aWtpcGVkaWEtZGVkdXBsaWNhdGlvbi5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogVGhpcyBtb2R1bGVzIGltcGxlbWVudHMgcmVyYW5raW5nIG9mIHJlc3VsdHMgdXNpbmcgdXNlciBzcGVjaWZpYyBkYXRhXG4gKi9cbmltcG9ydCB7IHV0aWxzIH0gZnJvbSBcImNvcmUvY2xpcXpcIjtcbmltcG9ydCBsYW5ndWFnZSBmcm9tIFwicGxhdGZvcm0vbGFuZ3VhZ2VcIjtcblxuXG52YXIgQ2xpcXpXaWtpcGVkaWFEZWR1cGxpY2F0aW9uID0ge1xuICAgIExPR19LRVk6ICdDbGlxeldpa2lwZWRpYURlZHVwbGljYXRpb24nLFxuICAgIG5hbWU6ICdsYW5nX2RlZHVwbGljYXRpb24nLFxuXG4gICAgLyogY2hvb3NlIGJlc3QgdXJsIGZyb20gbGlzdCBiYXNlZCBvbiBvcmlnaW5hbCBvcmRlciAocmVyYW5raW5nKSovXG4gICAgY2hvb3NlVXJsQnlJbmRleDogZnVuY3Rpb24oc2VhcmNoZWRVcmxzLCBvcmlnaW5hbFVybHMpe1xuICAgICAgICB2YXIgbWF4UG9zID0gb3JpZ2luYWxVcmxzLmxlbmd0aDtcbiAgICAgICAgdmFyIGJlc3RVcmwgPSBudWxsO1xuICAgICAgICBPYmplY3Qua2V5cyhzZWFyY2hlZFVybHMpLmZvckVhY2goIGZ1bmN0aW9uIChsYW5nKSB7XG4gICAgICAgICAgICB2YXIgdXJscyA9IHNlYXJjaGVkVXJsc1tsYW5nXTtcbiAgICAgICAgICAgIHVybHMuZm9yRWFjaChmdW5jdGlvbiAodXJsKXtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IG9yaWdpbmFsVXJscy5pbmRleE9mKHVybCk7XG4gICAgICAgICAgICAgICAgaWYgKGkgPCBtYXhQb3Mpe1xuICAgICAgICAgICAgICAgICAgICBtYXhQb3MgPSBpO1xuICAgICAgICAgICAgICAgICAgICBiZXN0VXJsID0gdXJsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIGJlc3RVcmw7XG4gICAgfSxcbiAgICAvKiBjaG9vc2UgYmVzdCB1cmwgZnJvbSBsaXN0IHRha2luZyBsYW5ndWFnZSBpbnRvIGFjY291bnQgKi9cbiAgICBjaG9vc2VVcmxCeUxhbmc6IGZ1bmN0aW9uKHNlYXJjaGVkVXJscywgb3JpZ2luYWxVcmxzLCByZXF1ZXN0ZWRMYW5ncyl7XG4gICAgICAgIGlmIChyZXF1ZXN0ZWRMYW5ncyA9PSBudWxsIHx8IHJlcXVlc3RlZExhbmdzLmxlbmd0aCA9PSAwKXtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNob29zZVVybEJ5SW5kZXgoc2VhcmNoZWRVcmxzLCBvcmlnaW5hbFVybHMpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBtYXhQb3MgPSBvcmlnaW5hbFVybHMubGVuZ3RoO1xuICAgICAgICB2YXIgYmVzdFVybCA9IG51bGw7XG4gICAgICAgIE9iamVjdC5rZXlzKHNlYXJjaGVkVXJscykuZm9yRWFjaCggZnVuY3Rpb24gKGxhbmcpIHtcbiAgICAgICAgICAgIHZhciB1cmxzID0gc2VhcmNoZWRVcmxzW2xhbmddO1xuICAgICAgICAgICAgdXJscy5mb3JFYWNoKGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgICAgICAgICB2YXIgaSA9IG9yaWdpbmFsVXJscy5pbmRleE9mKHVybCk7XG4gICAgICAgICAgICAgICAgaWYgKGkgPCBtYXhQb3MgJiYgcmVxdWVzdGVkTGFuZ3MuaW5kZXhPZihsYW5nKSAhPSAtMSkge1xuICAgICAgICAgICAgICAgICAgICBtYXhQb3MgPSBpO1xuICAgICAgICAgICAgICAgICAgICBiZXN0VXJsID0gdXJsO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICAgICAgaWYgKGJlc3RVcmwgPT0gbnVsbCl7XG4gICAgICAgICAgICBiZXN0VXJsID0gdGhpcy5jaG9vc2VVcmxCeUluZGV4KHNlYXJjaGVkVXJscywgb3JpZ2luYWxVcmxzKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gYmVzdFVybFxuXG4gICAgfSxcbiAgICAvKnN0cmlwIHByb3RvY29sIGZyb20gdXJsKi9cbiAgICB1cmxTdHJpcFByb3RvY29sOiBmdW5jdGlvbih1cmwpe1xuICAgICAgICB2YXIgdG9SZW1vdmUgPSBbXCJodHRwczovL1wiLCBcImh0dHA6Ly9cIixcbiAgICAgICAgICAgIFwid3d3Mi5cIiwgXCJ3d3cuXCIsXG4gICAgICAgICAgICBcIm1vYmlsZS5cIiwgXCJtb2JpbC5cIiwgXCJtLlwiXTtcbiAgICAgICAgdG9SZW1vdmUuZm9yRWFjaChmdW5jdGlvbiAocGFydCkge1xuICAgICAgICAgICAgaWYgKHVybC50b0xvd2VyQ2FzZSgpLnN0YXJ0c1dpdGgocGFydCkpe1xuICAgICAgICAgICAgICAgIHVybCA9IHVybC5zdWJzdHJpbmcocGFydC5sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9LFxuICAgIC8qZ2V0IG1vc3QgdXNlZCB1c2VyIGxhbmd1YWdlcyovXG4gICAgZ2V0VXNlckxhbmd1YWdlczogZnVuY3Rpb24oZmFjdG9yKXtcbiAgICAgICAgZmFjdG9yID0gdHlwZW9mIGZhY3RvciAhPT0gJ3VuZGVmaW5lZCcgPyBmYWN0b3IgOiAxLjU7XG4gICAgICAgIHZhciBhdmFpbGFibGVMYW5ncyA9IGxhbmd1YWdlLnN0YXRlKHRydWUpO1xuICAgICAgICB2YXIgbGFuZ3MgPSBbXTtcbiAgICAgICAgdmFyIGxhc3RWYWx1ZSA9IG51bGw7XG4gICAgICAgIGF2YWlsYWJsZUxhbmdzLmZvckVhY2goZnVuY3Rpb24obGFuZ09iaikge1xuICAgICAgICAgICAgLy8gbGFuZ09iaiA9IFtcImRlXCIsIDAuMDEyM11cbiAgICAgICAgICAgIGlmIChsYXN0VmFsdWUgPT0gbnVsbCkgbGFzdFZhbHVlID0gbGFuZ09ialsxXTtcbiAgICAgICAgICAgIGlmIChsYXN0VmFsdWUgKiBmYWN0b3IgPj0gbGFuZ09ialsxXSl7XG4gICAgICAgICAgICAgICAgbGFuZ3MucHVzaChsYW5nT2JqWzBdKTtcbiAgICAgICAgICAgICAgICBsYXN0VmFsdWUgPSBsYW5nT2JqWzFdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gbGFuZ3M7XG4gICAgfSxcbiAgICAvLyBkZWR1cCBvZiBsYW5ndWFnZXMgZm9yIHdpa2lwZWRpYSBjYXNlXG4gICAgZG9SZXJhbms6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAvL3Jlc2V0IHRlbGVtZXRyeVxuICAgICAgICB2YXIgdGVsZW1ldHJ5U2lnbmFsID0ge307XG4gICAgICAgIHZhciBkb0RlZHVwID0gQ2xpcXpVdGlscy5nZXRQcmVmKFwibGFuZ3VhZ2VEZWR1cFwiLCBmYWxzZSk7XG4gICAgICAgIGlmIChkb0RlZHVwICYmIHJlc3BvbnNlICE9IG51bGwpIHtcblxuICAgICAgICAgICAgdmFyIHVzZXJMYW5ncyA9IHRoaXMuZ2V0VXNlckxhbmd1YWdlcygpO1xuXG4gICAgICAgICAgICAvLyBkaWN0IG9mIHdpa2kgbGFuZ3VhZ2VzIHRvIHVybHNcbiAgICAgICAgICAgIHZhciB3aWtpTGFuZ3MgPSB7fTtcblxuICAgICAgICAgICAgLy8gbGlzdCBvZiBhbGwgd2lraSB1cmxzXG4gICAgICAgICAgICB2YXIgd2lraVVybHMgPSBbXTtcblxuICAgICAgICAgICAgLy8gbGlzdCBvZiBjYW5kaWRhdGVzIHRvIGRlZHVwIHdpdGggYmFjayBsaW5rIHRvIG9yaWdpbmFsIHVybFxuICAgICAgICAgICAgLy8ge1wiZGUud2lraXBlZGlhLm9yZy91cmxcIjogXCJIdHRwczovL2RlLndpa2lwZWRpYS5vcmcvVVJMXCJ9XG4gICAgICAgICAgICB2YXIgY2FuZGlkYXRlcyA9IHt9O1xuXG4gICAgICAgICAgICAvLyBsaXN0IG9mIGFsbCB1cmxzIGluIHJlc3BvbnNlXG4gICAgICAgICAgICB2YXIgYWxsVXJscyA9IFtdO1xuXG4gICAgICAgICAgICAvLyBkZWR1cCByZXN1bHRcbiAgICAgICAgICAgIHZhciBkZWR1cHMgPSB7fTtcblxuICAgICAgICAgICAgLy8gcHJvY2VzcyByZXNwb25zZSBhbmQgZmlsbCBhbGwgc3RydWN0dXJlc1xuICAgICAgICAgICAgcmVzcG9uc2UuZm9yRWFjaChmdW5jdGlvbiAocikge1xuICAgICAgICAgICAgICAgIHZhciBvYmogPSBDbGlxelV0aWxzLmdldERldGFpbHNGcm9tVXJsKHIudXJsKTtcbiAgICAgICAgICAgICAgICBpZiAob2JqLmRvbWFpbiA9PSBcIndpa2lwZWRpYS5vcmdcIiAmJiBvYmouc3ViZG9tYWlucy5sZW5ndGgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGxhbmcgPSBvYmouc3ViZG9tYWluc1swXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHdpa2lMYW5nc1tsYW5nXSA9PSBudWxsKSB3aWtpTGFuZ3NbbGFuZ10gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgd2lraUxhbmdzW2xhbmddLnB1c2goci51cmwpO1xuICAgICAgICAgICAgICAgICAgICBjYW5kaWRhdGVzW3RoaXMudXJsU3RyaXBQcm90b2NvbChyLnVybCkudG9Mb3dlckNhc2UoKV0gPSByLnVybDtcbiAgICAgICAgICAgICAgICAgICAgd2lraVVybHMucHVzaChyLnVybCk7XG4gICAgICAgICAgICAgICAgICAgIGRlZHVwc1tyLnVybF0gPSBbXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgYWxsVXJscy5wdXNoKHIudXJsKTtcblxuICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICB0ZWxlbWV0cnlTaWduYWxbJ2F2YWlsYWJsZV9sYW5ndWFnZXMnXSA9IE9iamVjdC5rZXlzKHdpa2lMYW5ncykubGVuZ3RoO1xuICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHdpa2lMYW5ncykubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgICAgIC8vIHdlIGhhdmUgd2lraXBlZGlhIHdpdGggZGlmZmVyZW50IGxhbmdzLCB0cnkgcG9zc2libGUgZGVkdXBcbiAgICAgICAgICAgICAgICB2YXIgYmVzdFVybCA9IHRoaXMuY2hvb3NlVXJsQnlMYW5nKHdpa2lMYW5ncywgYWxsVXJscywgdXNlckxhbmdzKTtcblxuICAgICAgICAgICAgICAgIHZhciBpbmQgPSBhbGxVcmxzLmluZGV4T2YoYmVzdFVybCk7XG4gICAgICAgICAgICAgICAgdmFyIGJlc3RVcmxEYXRhID0gcmVzcG9uc2VbaW5kXTtcbiAgICAgICAgICAgICAgICB2YXIgbGFuZ2xpbmtzID0gW107XG4gICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgbGFuZ2xpbmtzID0gYmVzdFVybERhdGEuc25pcHBldC5yaWNoX2RhdGEubGFuZ2xpbmtzO1xuICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbGFuZ2xpbmtzLmZvckVhY2goZnVuY3Rpb24gKGxhbmdsaW5rKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBzdHJpcFVybCA9IHRoaXMudXJsU3RyaXBQcm90b2NvbChsYW5nbGluaykudG9Mb3dlckNhc2UoKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHN0cmlwTGFuZyA9IHN0cmlwVXJsLnNwbGl0KFwiLlwiKVswXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKChzdHJpcFVybCBpbiBjYW5kaWRhdGVzKSAmJiAodXNlckxhbmdzLmluZGV4T2Yoc3RyaXBMYW5nKSA9PSAtMSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBvcmlnaW5hbFVybCA9IGNhbmRpZGF0ZXNbc3RyaXBVcmxdO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVkdXBzW2Jlc3RVcmxdLnB1c2gob3JpZ2luYWxVcmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgZGVkdXBzW2Jlc3RVcmxdLmNvbmNhdChkZWR1cHNbb3JpZ2luYWxVcmxdKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlbGV0ZSBkZWR1cHNbb3JpZ2luYWxVcmxdO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSwgdGhpcyk7XG4gICAgICAgICAgICAgICAgdmFyIGRlZHVwZWQgPSB3aWtpVXJscy5sZW5ndGggLSBPYmplY3Qua2V5cyhkZWR1cHMpLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB0ZWxlbWV0cnlTaWduYWxbJ3RvdGFsX3VybHMnXSA9IHdpa2lVcmxzLmxlbmd0aDtcbiAgICAgICAgICAgICAgICB0ZWxlbWV0cnlTaWduYWxbJ3JlbW92ZWRfdXJscyddID0gZGVkdXBlZDtcblxuICAgICAgICAgICAgICAgIGlmIChkZWR1cGVkID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBiYWNrd2FyZCBzdHJ1Y3R1cmUgd2l0aCBsaW5rIHdoZXJlIGRlZHVwZWQgdXJsIGlzIHBvaW50aW5nXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbnZlcnRlZFVybHMgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgT2JqZWN0LmtleXMoZGVkdXBzKS5mb3JFYWNoKGZ1bmN0aW9uIChrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkZWR1cHNba10uZm9yRWFjaChmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaW52ZXJ0ZWRVcmxzW3VybF0gPSBrO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGVkdXBSZXNwb25zZSA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3BvbnNlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgcmVzcG9uc2VPYmogPSByZXNwb25zZVtpXTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZU9iai51cmwgaW4gaW52ZXJ0ZWRVcmxzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gdGhpcyB1cmwgc2hvdWxkIGJlIHJlcGxhY2VkIGJ5IG1haW4gdXJsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1haW5JbmQgPSBhbGxVcmxzLmluZGV4T2YoaW52ZXJ0ZWRVcmxzW3Jlc3BvbnNlT2JqLnVybF0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYWluSW5kICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBtYWluT2JqID0gcmVzcG9uc2VbbWFpbkluZF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRlZHVwUmVzcG9uc2UucHVzaChtYWluT2JqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGFsbFVybHNbbWFpbkluZF07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIG1heWJlRGVsZXRlZCA9IGFsbFVybHMuaW5kZXhPZihyZXNwb25zZU9iai51cmwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChtYXliZURlbGV0ZWQgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVkdXBSZXNwb25zZS5wdXNoKHJlc3BvbnNlT2JqKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZGVsZXRlIGFsbFVybHNbaV07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2UgPSBkZWR1cFJlc3BvbnNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICAvLyBpZiBubyBkZWR1cHMgZm91bmRcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHRlbGVtZXRyeVNpZ25hbDogdGVsZW1ldHJ5U2lnbmFsLFxuICAgICAgICAgICAgcmVzcG9uc2U6IHJlc3BvbnNlXG4gICAgICAgIH07XG4gICAgfVxuXG59O1xuXG5leHBvcnQgZGVmYXVsdCBDbGlxeldpa2lwZWRpYURlZHVwbGljYXRpb247XG4iXX0=