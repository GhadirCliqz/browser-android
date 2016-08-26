System.register("autocomplete/mixer", ["core/cliqz", "autocomplete/result", "autocomplete/url-compare"], function (_export) {
  /*
   * This module mixes the results from cliqz with the history
   *
   */

  "use strict";

  var utils, Result, UrlCompare, CliqzSmartCliqzCache, SmartCliqzTriggerUrlCache, Mixer;

  function objectExtend(target, obj) {
    Object.keys(obj).forEach(function (key) {
      target[key] = obj[key];
    });

    return target;
  }

  // enriches data kind
  function kindEnricher(newKindParams, kind) {
    var parts = kind.split('|'),
        params = JSON.parse(parts[1] || '{}');

    objectExtend(params, newKindParams);

    return parts[0] + '|' + JSON.stringify(params);
  }

  function resultKindEnricher(newKindParams, result) {
    result.data.kind[0] = kindEnricher(newKindParams, result.data.kind[0]);
    return result;
  }

  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }, function (_autocompleteResult) {
      Result = _autocompleteResult["default"];
    }, function (_autocompleteUrlCompare) {
      UrlCompare = _autocompleteUrlCompare["default"];
    }],
    execute: function () {
      Mixer = {
        EZ_COMBINE: ['entity-generic', 'ez-generic-2', 'entity-search-1', 'entity-portal', 'entity-banking-2'],
        EZ_QUERY_BLACKLIST: ['www', 'www.', 'http://www', 'https://www', 'http://www.', 'https://www.'],

        init: function init() {
          var _ref = arguments.length <= 0 || arguments[0] === undefined ? {} : arguments[0];

          var smartCliqzCache = _ref.smartCliqzCache;
          var triggerUrlCache = _ref.triggerUrlCache;

          CliqzSmartCliqzCache = smartCliqzCache;
          SmartCliqzTriggerUrlCache = triggerUrlCache;
        },

        // Prepare 'extra' results (dynamic results from Rich Header) for mixing
        _prepareExtraResults: function _prepareExtraResults(results) {
          // Remove invalid EZs
          results = results.filter(function (r) {
            if (Mixer._isValidEZ(r)) {
              return true;
            } else {
              utils.log('Discarding bad EZ: ' + JSON.stringify(r), 'Mixer');
              return false;
            }
          });

          // set trigger method for EZs returned from RH
          return results.map(resultKindEnricher.bind(null, {
            trigger_method: 'rh_query'
          }));
        },

        // Various checks to make sure the supplied EZ is valid
        _isValidEZ: function _isValidEZ(ez) {
          if (!ez.val) {
            return false;
          }

          if (!ez.data) {
            return false;
          }

          if (!ez.data.subType) {
            return false;
          }

          if (!ez.data.__subType__) {
            return false;
          }

          try {
            var ezId = Mixer._getSmartCliqzId(ez);
            if (!ezId) {
              return false;
            }
            var ezClass = JSON.parse(ez.data.subType)["class"];
            if (!ezClass) {
              return false;
            }
          } catch (e) {
            return false;
          }

          return true;
        },

        // Prepare backend results for mixing
        _prepareCliqzResults: function _prepareCliqzResults(results) {
          return results.map(function (result, i) {
            var subType = JSON.parse(result.subType || '{}');
            subType.i = i;
            result.subType = JSON.stringify(subType);
            return Result.cliqz(result);
          });
        },

        // Prepare history results for mixing
        _prepareHistoryResults: function _prepareHistoryResults(results) {
          return results.map(Result.clone);
        },
        // Is query valid for triggering an EZ?
        // Must have more than 2 chars and not in blacklist
        //  - avoids many unexpected EZ triggerings
        _isValidQueryForEZ: function _isValidQueryForEZ(q) {
          var trimmed = q.trim();
          if (trimmed.length <= utils.MIN_QUERY_LENGHT_FOR_EZ) {
            return false;
          }

          return Mixer.EZ_QUERY_BLACKLIST.indexOf(trimmed.toLowerCase()) == -1;
        },

        // extract any entity zone accompanying the result, add to extraResults
        _addEZfromBM: function _addEZfromBM(extraResults, result) {
          if (!result.extra) {
            return;
          }

          var extra = Result.cliqzExtra(result.extra, result.snippet);
          //resultKindEnricher({trigger_method: 'backend_url'}, extra);
          extraResults.push(extra);
        },

        // Collect all sublinks and return a single list.
        //  - called recursively, looking for any keys that look like URLs
        _collectSublinks: function _collectSublinks(data) {
          var links = [];

          for (var key in data) {
            if (typeof data[key] == 'object') {
              // recurse
              links = links.concat(Mixer._collectSublinks(data[key]));
            } else if (['url', 'href'].indexOf(key) != -1) {
              links.push(data[key]);
            }
          }

          return links;
        },

        // mark entries in second that are found in first
        _getDuplicates: function _getDuplicates(first, second) {
          return second.map(function (c) {
            var duplicate = false;
            first.forEach(function (i) {
              // Does the main link match?
              if (UrlCompare.sameUrls(c.label, i.label)) {
                duplicate = true;
                return;
              }

              // Do any of the sublinks match?
              var sublinks = Mixer._collectSublinks(i.data);
              sublinks.some(function (u) {
                if (UrlCompare.sameUrls(u, c.label)) {
                  duplicate = true;
                  return true; // stop iteration
                }
              });
            });

            if (duplicate) {
              return c;
            }
          }).filter(function (result) {
            return result;
          });
        },

        // Remove results from second list that are present in the first
        // Copy some information (such as the kind) to entry in the first list
        _deduplicateResults: function _deduplicateResults(first, second) {
          var duplicates = Mixer._getDuplicates(first, second);

          // remove duplicates from second list
          second = second.filter(function (c) {
            return duplicates.indexOf(c) === -1;
          });

          // take data from duplicate second result to augment result
          // Note: this does not combine data if it is a sublink match
          first = first.map(function (r) {
            duplicates.forEach(function (dup) {
              if (UrlCompare.sameUrls(r.val, dup.val)) {
                r = Result.combine(r, dup);
              }
            });

            return r;
          });

          return { first: first, second: second };
        },

        // Special case deduplication: remove clustered links from history if already
        // somewhere else in the EZ
        _deduplicateHistory: function _deduplicateHistory(result) {
          // Collect sublinks not in history
          var otherLinks = [];
          Object.keys(result.data).filter(function (key) {
            return key != 'urls';
          }).forEach(function (key) {
            var sublinks = Mixer._collectSublinks(result.data[key]);
            otherLinks.concat(sublinks);
          });

          // Filter history entry, if
          result.data.urls = result.data.urls.filter(function (entry) {
            var duplicate = false;
            otherLinks.some(function (u) {
              if (UrlCompare.sameUrls(u, entry.label)) {
                duplicate = true;
                return true; // stop iteration
              }
            });

            return !duplicate;
          });
        },
        _getSmartCliqzId: function _getSmartCliqzId(smartCliqz) {
          return smartCliqz.data.__subType__.id;
        },

        // Find any entity zone in the results and cache them for later use.
        // Go backwards to prioritize the newest, which will be first in the list.
        _cacheEZs: function _cacheEZs(extraResults) {
          if (!CliqzSmartCliqzCache || !SmartCliqzTriggerUrlCache) {
            return;
          }

          // slice creates a shallow copy, so we don't reverse existing array.
          extraResults.slice().reverse().forEach(function (r) {
            var trigger_urls = r.data.trigger_urls || [];
            var wasCacheUpdated = false;

            trigger_urls.forEach(function (url) {
              if (!SmartCliqzTriggerUrlCache.isCached(url)) {
                SmartCliqzTriggerUrlCache.store(url, true);
                wasCacheUpdated = true;
              }
            });

            if (wasCacheUpdated) {
              SmartCliqzTriggerUrlCache.save();
            }

            CliqzSmartCliqzCache.store(r);
          });
        },

        // Take the first entry (if history cluster) and see if we can trigger an EZ
        // with it, this will override an EZ sent by backend.
        _historyTriggerEZ: function _historyTriggerEZ(result) {
          if (!result || !result.data || !result.data.cluster || // if not history cluster
          result.data.autoAdd) {
            // if the base domain was auto added (guessed)
            return undefined;
          }

          if (!CliqzSmartCliqzCache || !SmartCliqzTriggerUrlCache) {
            return undefined;
          }

          var url = utils.generalizeUrl(result.val, true),
              ez;

          if (SmartCliqzTriggerUrlCache.isCached(url)) {
            var ezId = SmartCliqzTriggerUrlCache.retrieve(url);
            // clear dirty data that got into the data base
            if (ezId === 'deprecated') {
              SmartCliqzTriggerUrlCache["delete"](url);
              return undefined;
            }
            ez = CliqzSmartCliqzCache.retrieveAndUpdate(url);
            if (ez) {
              // Cached EZ is available
              ez = Result.clone(ez);

              // copy over title and description from history entry
              if (!result.data.generic) {
                ez.data.title = result.data.title;
                if (!ez.data.description) ez.data.description = result.data.description;
              }

              resultKindEnricher({ trigger_method: 'history_url' }, ez);
            } else {
              // Not available: start fetching now so it is available soon
              CliqzSmartCliqzCache.fetchAndStore(url);
            }

            if (SmartCliqzTriggerUrlCache.isStale(url)) {
              SmartCliqzTriggerUrlCache["delete"](url);
            }
          }

          return ez;
        },

        // Filter out any EZs that conflict with the firstresult
        _filterConflictingEZ: function _filterConflictingEZ(cliqzExtra, firstresult) {
          return cliqzExtra.filter(function (ez) {

            // Did we make a 'bet' on a url from history that does not match this EZ?
            if (firstresult.data && firstresult.data.cluster && !UrlCompare.sameUrls(ez.val, firstresult.val)) {
              utils.log('Not showing EZ ' + ez.val + ' because different than cluster ' + firstresult.val, 'Mixer');
              return false;
            }

            // Will the autocomplete change if we use this EZ?
            if (firstresult.autocompleted && !UrlCompare.sameUrls(ez.val, firstresult.val)) {
              utils.log('Not showing EZ ' + ez.val + ' because autocomplete would change', 'Mixer');
              return false;
            }

            return true;
          });
        },
        // Mix together history, backend and custom results. Called twice per query:
        // once with only history (instant), second with all data.
        mix: function mix(q, cliqz, cliqzExtra, history, customResults, only_history) {

          if (!Mixer._isValidQueryForEZ(q)) {
            cliqzExtra = [];
          } else {
            // Prepare incoming EZ results
            cliqzExtra = Mixer._prepareExtraResults(cliqzExtra || []);

            // Add EZ from first cliqz results to list of EZs, if valid
            if (cliqz && cliqz.length > 0) {
              Mixer._addEZfromBM(cliqzExtra, cliqz[0]);
            }

            // Cache any EZs found
            Mixer._cacheEZs(cliqzExtra);
          }

          // Prepare other incoming data
          cliqz = Mixer._prepareCliqzResults(cliqz || []);
          history = Mixer._prepareHistoryResults(history || []);

          utils.log('only_history:' + only_history + ' history:' + history.length + ' cliqz:' + cliqz.length + ' extra:' + cliqzExtra.length, 'Mixer');

          // Were any history results also available as a cliqz result?
          //  if so, remove from backend list and combine sources in history result
          var r = Mixer._deduplicateResults(history, cliqz);

          // Prepare results: history (first) then backend results (second)
          var results = r.first.concat(r.second);

          // Trigger EZ with first entry
          var historyEZ = Mixer._historyTriggerEZ(results[0]);
          if (historyEZ) {
            cliqzExtra = [historyEZ];
          }

          // Filter conflicting EZs
          if (results.length > 0) {
            cliqzExtra = Mixer._filterConflictingEZ(cliqzExtra, results[0]);
          }

          // Add custom results to the beginning if there are any
          if (customResults && customResults.length > 0) {
            cliqzExtra = customResults.concat(cliqzExtra);
          }

          // limit to one entity zone
          cliqzExtra = cliqzExtra.slice(0, 1);

          // remove any BM or simple history results covered by EZ
          r = Mixer._deduplicateResults(cliqzExtra, results);
          results = r.second;
          var ez = r.first[0];

          // Add EZ to result list result list
          if (ez) {
            utils.log('EZ (' + ez.data.kind + ') for ' + ez.val, 'Mixer');

            // Make a combined entry, if possible
            if (results.length > 0 && results[0].data.cluster && Mixer.EZ_COMBINE.indexOf(ez.data.template) !== -1 && UrlCompare.sameUrls(results[0].val, ez.val)) {

              utils.log('Making combined entry.', 'Mixer');
              results[0] = Result.combine(ez, result[0]);
              Mixer._deduplicateHistory(results[0]);
            } else {
              // Add EZ to top of result list
              results = [ez].concat(results);
            }
          }

          // Special case: adjust second result if it doesn't fit
          if (utils.getPref('hist_search_type', 0) == 0 && results.length > 1 && results[1].data.template == 'pattern-h2') {
            utils.log('Converting cluster for ' + results[1].val + ' to simple history', 'Mixer');

            // convert to simple history entry
            var simple = Result.generic('favicon', results[1].val, null, results[1].data.title, null, searchString);
            simple.data.kind = ['H'];
            simple.data.description = result[1].data.description;
            results[1] = simple;
          }

          // Only show a maximum 3 BM results
          var cliqzRes = 0;
          results = results.filter(function (r) {
            if (r.style.indexOf('cliqz-results ') === 0) cliqzRes++;
            return cliqzRes <= 3;
          });

          // Show no results message
          if (results.length === 0 && !only_history) {
            results.push(utils.getNoResults());
          }

          return results;
        }
      };

      _export("default", Mixer);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,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QyxNQUFNLENBQUMsVUFBUyxDQUFDLEVBQUU7QUFDbkMsZ0JBQUksQ0FBQyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsS0FBSyxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUM7QUFDeEQsbUJBQU8sUUFBUSxJQUFJLENBQUMsQ0FBQztXQUN0QixDQUFDLENBQUM7OztBQUdILGNBQUksT0FBTyxDQUFDLE1BQU0sS0FBSyxDQUFDLElBQUksQ0FBQyxZQUFZLEVBQUU7QUFDekMsbUJBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksRUFBRSxDQUFDLENBQUM7V0FDcEM7O0FBRUQsaUJBQU8sT0FBTyxDQUFDO1NBQ2hCO09BQ0Y7O3lCQUVjLEtBQUsiLCJmaWxlIjoiYXV0b2NvbXBsZXRlL21peGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIFRoaXMgbW9kdWxlIG1peGVzIHRoZSByZXN1bHRzIGZyb20gY2xpcXogd2l0aCB0aGUgaGlzdG9yeVxuICpcbiAqL1xuXG5pbXBvcnQgeyB1dGlscyB9IGZyb20gXCJjb3JlL2NsaXF6XCI7XG5pbXBvcnQgUmVzdWx0IGZyb20gXCJhdXRvY29tcGxldGUvcmVzdWx0XCI7XG5pbXBvcnQgVXJsQ29tcGFyZSBmcm9tIFwiYXV0b2NvbXBsZXRlL3VybC1jb21wYXJlXCI7XG5cbnZhciBDbGlxelNtYXJ0Q2xpcXpDYWNoZTtcbnZhciBTbWFydENsaXF6VHJpZ2dlclVybENhY2hlO1xuXG5mdW5jdGlvbiBvYmplY3RFeHRlbmQodGFyZ2V0LCBvYmopIHtcbiAgT2JqZWN0LmtleXMob2JqKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkge1xuICAgIHRhcmdldFtrZXldID0gb2JqW2tleV07XG4gIH0pO1xuXG4gIHJldHVybiB0YXJnZXQ7XG59XG5cbi8vIGVucmljaGVzIGRhdGEga2luZFxuZnVuY3Rpb24ga2luZEVucmljaGVyKG5ld0tpbmRQYXJhbXMsIGtpbmQpIHtcbiAgdmFyIHBhcnRzID0ga2luZC5zcGxpdCgnfCcpLFxuICAgICAgcGFyYW1zID0gSlNPTi5wYXJzZShwYXJ0c1sxXSB8fCAne30nKTtcblxuICBvYmplY3RFeHRlbmQocGFyYW1zLCBuZXdLaW5kUGFyYW1zKTtcblxuICByZXR1cm4gcGFydHNbMF0gKyAnfCcgKyBKU09OLnN0cmluZ2lmeShwYXJhbXMpO1xufVxuXG5mdW5jdGlvbiByZXN1bHRLaW5kRW5yaWNoZXIobmV3S2luZFBhcmFtcywgcmVzdWx0KSB7XG4gIHJlc3VsdC5kYXRhLmtpbmRbMF0gPSBraW5kRW5yaWNoZXIobmV3S2luZFBhcmFtcywgcmVzdWx0LmRhdGEua2luZFswXSk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbnZhciBNaXhlciA9IHtcbiAgRVpfQ09NQklORTogW1xuICAgICdlbnRpdHktZ2VuZXJpYycsICdlei1nZW5lcmljLTInLCAnZW50aXR5LXNlYXJjaC0xJyxcbiAgICAnZW50aXR5LXBvcnRhbCcsICdlbnRpdHktYmFua2luZy0yJyxcbiAgXSxcbiAgRVpfUVVFUllfQkxBQ0tMSVNUOiBbXG4gICAgJ3d3dycsICd3d3cuJywgJ2h0dHA6Ly93d3cnLCAnaHR0cHM6Ly93d3cnLFxuICAgICdodHRwOi8vd3d3LicsICdodHRwczovL3d3dy4nLFxuICBdLFxuXG4gIGluaXQ6IGZ1bmN0aW9uKCB7IHNtYXJ0Q2xpcXpDYWNoZSwgdHJpZ2dlclVybENhY2hlIH0gPSB7fSApIHtcbiAgICBDbGlxelNtYXJ0Q2xpcXpDYWNoZSA9IHNtYXJ0Q2xpcXpDYWNoZTtcbiAgICBTbWFydENsaXF6VHJpZ2dlclVybENhY2hlID0gdHJpZ2dlclVybENhY2hlO1xuICB9LFxuXG4gIC8vIFByZXBhcmUgJ2V4dHJhJyByZXN1bHRzIChkeW5hbWljIHJlc3VsdHMgZnJvbSBSaWNoIEhlYWRlcikgZm9yIG1peGluZ1xuICBfcHJlcGFyZUV4dHJhUmVzdWx0czogZnVuY3Rpb24ocmVzdWx0cykge1xuICAgIC8vIFJlbW92ZSBpbnZhbGlkIEVac1xuICAgIHJlc3VsdHMgPSByZXN1bHRzLmZpbHRlcihmdW5jdGlvbihyKSB7XG4gICAgICBpZiAoTWl4ZXIuX2lzVmFsaWRFWihyKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHV0aWxzLmxvZygnRGlzY2FyZGluZyBiYWQgRVo6ICcgKyBKU09OLnN0cmluZ2lmeShyKSwgJ01peGVyJyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIHNldCB0cmlnZ2VyIG1ldGhvZCBmb3IgRVpzIHJldHVybmVkIGZyb20gUkhcbiAgICByZXR1cm4gcmVzdWx0cy5tYXAocmVzdWx0S2luZEVucmljaGVyLmJpbmQobnVsbCwge1xuICAgICAgdHJpZ2dlcl9tZXRob2Q6ICdyaF9xdWVyeScsXG4gICAgfSkpO1xuICB9LFxuXG4gIC8vIFZhcmlvdXMgY2hlY2tzIHRvIG1ha2Ugc3VyZSB0aGUgc3VwcGxpZWQgRVogaXMgdmFsaWRcbiAgX2lzVmFsaWRFWjogZnVuY3Rpb24oZXopIHtcbiAgICBpZiAoIWV6LnZhbCkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghZXouZGF0YSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIGlmICghZXouZGF0YS5zdWJUeXBlKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFlei5kYXRhLl9fc3ViVHlwZV9fKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIHZhciBleklkID0gTWl4ZXIuX2dldFNtYXJ0Q2xpcXpJZChleik7XG4gICAgICBpZiAoIWV6SWQpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgICAgdmFyIGV6Q2xhc3MgPSBKU09OLnBhcnNlKGV6LmRhdGEuc3ViVHlwZSkuY2xhc3M7XG4gICAgICBpZiAoIWV6Q2xhc3MpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSxcblxuICAvLyBQcmVwYXJlIGJhY2tlbmQgcmVzdWx0cyBmb3IgbWl4aW5nXG4gIF9wcmVwYXJlQ2xpcXpSZXN1bHRzOiBmdW5jdGlvbihyZXN1bHRzKSB7XG4gICAgcmV0dXJuIHJlc3VsdHMubWFwKGZ1bmN0aW9uKHJlc3VsdCwgaSkge1xuICAgICAgdmFyIHN1YlR5cGUgPSBKU09OLnBhcnNlKHJlc3VsdC5zdWJUeXBlIHx8ICd7fScpO1xuICAgICAgc3ViVHlwZS5pID0gaTtcbiAgICAgIHJlc3VsdC5zdWJUeXBlID0gSlNPTi5zdHJpbmdpZnkoc3ViVHlwZSk7XG4gICAgICByZXR1cm4gUmVzdWx0LmNsaXF6KHJlc3VsdCk7XG4gICAgfSk7XG4gIH0sXG5cbiAgLy8gUHJlcGFyZSBoaXN0b3J5IHJlc3VsdHMgZm9yIG1peGluZ1xuICBfcHJlcGFyZUhpc3RvcnlSZXN1bHRzOiBmdW5jdGlvbihyZXN1bHRzKSB7XG4gICAgcmV0dXJuIHJlc3VsdHMubWFwKFJlc3VsdC5jbG9uZSk7XG4gIH0sXG4gIC8vIElzIHF1ZXJ5IHZhbGlkIGZvciB0cmlnZ2VyaW5nIGFuIEVaP1xuICAvLyBNdXN0IGhhdmUgbW9yZSB0aGFuIDIgY2hhcnMgYW5kIG5vdCBpbiBibGFja2xpc3RcbiAgLy8gIC0gYXZvaWRzIG1hbnkgdW5leHBlY3RlZCBFWiB0cmlnZ2VyaW5nc1xuICBfaXNWYWxpZFF1ZXJ5Rm9yRVo6IGZ1bmN0aW9uKHEpIHtcbiAgICB2YXIgdHJpbW1lZCA9IHEudHJpbSgpO1xuICAgIGlmICh0cmltbWVkLmxlbmd0aCA8PSB1dGlscy5NSU5fUVVFUllfTEVOR0hUX0ZPUl9FWikge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiBNaXhlci5FWl9RVUVSWV9CTEFDS0xJU1QuaW5kZXhPZih0cmltbWVkLnRvTG93ZXJDYXNlKCkpID09IC0xO1xuICB9LFxuXG4gIC8vIGV4dHJhY3QgYW55IGVudGl0eSB6b25lIGFjY29tcGFueWluZyB0aGUgcmVzdWx0LCBhZGQgdG8gZXh0cmFSZXN1bHRzXG4gIF9hZGRFWmZyb21CTTogZnVuY3Rpb24oZXh0cmFSZXN1bHRzLCByZXN1bHQpIHtcbiAgICBpZiAoIXJlc3VsdC5leHRyYSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHZhciBleHRyYSA9IFJlc3VsdC5jbGlxekV4dHJhKHJlc3VsdC5leHRyYSwgcmVzdWx0LnNuaXBwZXQpO1xuICAgIC8vcmVzdWx0S2luZEVucmljaGVyKHt0cmlnZ2VyX21ldGhvZDogJ2JhY2tlbmRfdXJsJ30sIGV4dHJhKTtcbiAgICBleHRyYVJlc3VsdHMucHVzaChleHRyYSk7XG4gIH0sXG5cbiAgLy8gQ29sbGVjdCBhbGwgc3VibGlua3MgYW5kIHJldHVybiBhIHNpbmdsZSBsaXN0LlxuICAvLyAgLSBjYWxsZWQgcmVjdXJzaXZlbHksIGxvb2tpbmcgZm9yIGFueSBrZXlzIHRoYXQgbG9vayBsaWtlIFVSTHNcbiAgX2NvbGxlY3RTdWJsaW5rczogZnVuY3Rpb24oZGF0YSkge1xuICAgIHZhciBsaW5rcyA9IFtdO1xuXG4gICAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcbiAgICAgIGlmICh0eXBlb2YgKGRhdGFba2V5XSkgPT0gJ29iamVjdCcpIHtcbiAgICAgICAgLy8gcmVjdXJzZVxuICAgICAgICBsaW5rcyA9IGxpbmtzLmNvbmNhdChNaXhlci5fY29sbGVjdFN1YmxpbmtzKGRhdGFba2V5XSkpO1xuICAgICAgfSBlbHNlIGlmIChbJ3VybCcsICdocmVmJ10uaW5kZXhPZihrZXkpICE9IC0xKSB7XG4gICAgICAgIGxpbmtzLnB1c2goZGF0YVtrZXldKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gbGlua3M7XG4gIH0sXG5cbiAgLy8gbWFyayBlbnRyaWVzIGluIHNlY29uZCB0aGF0IGFyZSBmb3VuZCBpbiBmaXJzdFxuICBfZ2V0RHVwbGljYXRlczogZnVuY3Rpb24oZmlyc3QsIHNlY29uZCkge1xuICAgIHJldHVybiBzZWNvbmQubWFwKGZ1bmN0aW9uKGMpIHtcbiAgICAgIHZhciBkdXBsaWNhdGUgPSBmYWxzZTtcbiAgICAgIGZpcnN0LmZvckVhY2goZnVuY3Rpb24oaSkge1xuICAgICAgICAvLyBEb2VzIHRoZSBtYWluIGxpbmsgbWF0Y2g/XG4gICAgICAgIGlmIChVcmxDb21wYXJlLnNhbWVVcmxzKGMubGFiZWwsIGkubGFiZWwpKSB7XG4gICAgICAgICAgZHVwbGljYXRlID0gdHJ1ZTtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyBEbyBhbnkgb2YgdGhlIHN1YmxpbmtzIG1hdGNoP1xuICAgICAgICB2YXIgc3VibGlua3MgPSBNaXhlci5fY29sbGVjdFN1YmxpbmtzKGkuZGF0YSk7XG4gICAgICAgIHN1YmxpbmtzLnNvbWUoZnVuY3Rpb24odSkge1xuICAgICAgICAgIGlmIChVcmxDb21wYXJlLnNhbWVVcmxzKHUsIGMubGFiZWwpKSB7XG4gICAgICAgICAgICBkdXBsaWNhdGUgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7IC8vIHN0b3AgaXRlcmF0aW9uXG4gICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgIH0pO1xuXG4gICAgICBpZiAoZHVwbGljYXRlKSB7XG4gICAgICAgIHJldHVybiBjO1xuICAgICAgfVxuICAgIH0pLmZpbHRlcihmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfSk7XG4gIH0sXG5cbiAgLy8gUmVtb3ZlIHJlc3VsdHMgZnJvbSBzZWNvbmQgbGlzdCB0aGF0IGFyZSBwcmVzZW50IGluIHRoZSBmaXJzdFxuICAvLyBDb3B5IHNvbWUgaW5mb3JtYXRpb24gKHN1Y2ggYXMgdGhlIGtpbmQpIHRvIGVudHJ5IGluIHRoZSBmaXJzdCBsaXN0XG4gIF9kZWR1cGxpY2F0ZVJlc3VsdHM6IGZ1bmN0aW9uKGZpcnN0LCBzZWNvbmQpIHtcbiAgICB2YXIgZHVwbGljYXRlcyA9IE1peGVyLl9nZXREdXBsaWNhdGVzKGZpcnN0LCBzZWNvbmQpO1xuXG4gICAgLy8gcmVtb3ZlIGR1cGxpY2F0ZXMgZnJvbSBzZWNvbmQgbGlzdFxuICAgIHNlY29uZCA9IHNlY29uZC5maWx0ZXIoZnVuY3Rpb24oYykge1xuICAgICAgcmV0dXJuIGR1cGxpY2F0ZXMuaW5kZXhPZihjKSA9PT0gLTE7XG4gICAgfSk7XG5cbiAgICAvLyB0YWtlIGRhdGEgZnJvbSBkdXBsaWNhdGUgc2Vjb25kIHJlc3VsdCB0byBhdWdtZW50IHJlc3VsdFxuICAgIC8vIE5vdGU6IHRoaXMgZG9lcyBub3QgY29tYmluZSBkYXRhIGlmIGl0IGlzIGEgc3VibGluayBtYXRjaFxuICAgIGZpcnN0ID0gZmlyc3QubWFwKGZ1bmN0aW9uKHIpIHtcbiAgICAgIGR1cGxpY2F0ZXMuZm9yRWFjaChmdW5jdGlvbihkdXApIHtcbiAgICAgICAgaWYgKFVybENvbXBhcmUuc2FtZVVybHMoci52YWwsIGR1cC52YWwpKSB7XG4gICAgICAgICAgciA9IFJlc3VsdC5jb21iaW5lKHIsIGR1cCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICByZXR1cm4gcjtcbiAgICB9KTtcblxuICAgIHJldHVybiB7IGZpcnN0OiBmaXJzdCwgc2Vjb25kOiBzZWNvbmQgfTtcbiAgfSxcblxuICAvLyBTcGVjaWFsIGNhc2UgZGVkdXBsaWNhdGlvbjogcmVtb3ZlIGNsdXN0ZXJlZCBsaW5rcyBmcm9tIGhpc3RvcnkgaWYgYWxyZWFkeVxuICAvLyBzb21ld2hlcmUgZWxzZSBpbiB0aGUgRVpcbiAgX2RlZHVwbGljYXRlSGlzdG9yeTogZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgLy8gQ29sbGVjdCBzdWJsaW5rcyBub3QgaW4gaGlzdG9yeVxuICAgIHZhciBvdGhlckxpbmtzID0gW107XG4gICAgT2JqZWN0LmtleXMocmVzdWx0LmRhdGEpLmZpbHRlcihmdW5jdGlvbihrZXkpIHtcbiAgICAgIHJldHVybiBrZXkgIT0gJ3VybHMnO1xuICAgIH0pLmZvckVhY2goZnVuY3Rpb24oa2V5KSB7XG4gICAgICB2YXIgc3VibGlua3MgPSBNaXhlci5fY29sbGVjdFN1YmxpbmtzKHJlc3VsdC5kYXRhW2tleV0pO1xuICAgICAgb3RoZXJMaW5rcy5jb25jYXQoc3VibGlua3MpO1xuICAgIH0pO1xuXG4gICAgLy8gRmlsdGVyIGhpc3RvcnkgZW50cnksIGlmXG4gICAgcmVzdWx0LmRhdGEudXJscyA9IHJlc3VsdC5kYXRhLnVybHMuZmlsdGVyKGZ1bmN0aW9uKGVudHJ5KSB7XG4gICAgICB2YXIgZHVwbGljYXRlID0gZmFsc2U7XG4gICAgICBvdGhlckxpbmtzLnNvbWUoZnVuY3Rpb24odSkge1xuICAgICAgICBpZiAoVXJsQ29tcGFyZS5zYW1lVXJscyh1LCBlbnRyeS5sYWJlbCkpIHtcbiAgICAgICAgICBkdXBsaWNhdGUgPSB0cnVlO1xuICAgICAgICAgIHJldHVybiB0cnVlOyAvLyBzdG9wIGl0ZXJhdGlvblxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgcmV0dXJuICFkdXBsaWNhdGU7XG4gICAgfSk7XG4gIH0sXG4gIF9nZXRTbWFydENsaXF6SWQ6IGZ1bmN0aW9uKHNtYXJ0Q2xpcXopIHtcbiAgICByZXR1cm4gc21hcnRDbGlxei5kYXRhLl9fc3ViVHlwZV9fLmlkO1xuICB9LFxuXG4gIC8vIEZpbmQgYW55IGVudGl0eSB6b25lIGluIHRoZSByZXN1bHRzIGFuZCBjYWNoZSB0aGVtIGZvciBsYXRlciB1c2UuXG4gIC8vIEdvIGJhY2t3YXJkcyB0byBwcmlvcml0aXplIHRoZSBuZXdlc3QsIHdoaWNoIHdpbGwgYmUgZmlyc3QgaW4gdGhlIGxpc3QuXG4gIF9jYWNoZUVaczogZnVuY3Rpb24oZXh0cmFSZXN1bHRzKSB7XG4gICAgaWYgKCFDbGlxelNtYXJ0Q2xpcXpDYWNoZSB8fCAhU21hcnRDbGlxelRyaWdnZXJVcmxDYWNoZSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIC8vIHNsaWNlIGNyZWF0ZXMgYSBzaGFsbG93IGNvcHksIHNvIHdlIGRvbid0IHJldmVyc2UgZXhpc3RpbmcgYXJyYXkuXG4gICAgZXh0cmFSZXN1bHRzLnNsaWNlKCkucmV2ZXJzZSgpLmZvckVhY2goZnVuY3Rpb24ocikge1xuICAgICAgdmFyIHRyaWdnZXJfdXJscyA9IHIuZGF0YS50cmlnZ2VyX3VybHMgfHwgW107XG4gICAgICB2YXIgd2FzQ2FjaGVVcGRhdGVkID0gZmFsc2U7XG5cbiAgICAgIHRyaWdnZXJfdXJscy5mb3JFYWNoKGZ1bmN0aW9uKHVybCkge1xuICAgICAgICBpZiAoIVNtYXJ0Q2xpcXpUcmlnZ2VyVXJsQ2FjaGUuaXNDYWNoZWQodXJsKSkge1xuICAgICAgICAgIFNtYXJ0Q2xpcXpUcmlnZ2VyVXJsQ2FjaGUuc3RvcmUodXJsLCB0cnVlKTtcbiAgICAgICAgICB3YXNDYWNoZVVwZGF0ZWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgaWYgKHdhc0NhY2hlVXBkYXRlZCkge1xuICAgICAgICBTbWFydENsaXF6VHJpZ2dlclVybENhY2hlLnNhdmUoKTtcbiAgICAgIH1cblxuICAgICAgQ2xpcXpTbWFydENsaXF6Q2FjaGUuc3RvcmUocik7XG4gICAgfSk7XG4gIH0sXG5cbiAgLy8gVGFrZSB0aGUgZmlyc3QgZW50cnkgKGlmIGhpc3RvcnkgY2x1c3RlcikgYW5kIHNlZSBpZiB3ZSBjYW4gdHJpZ2dlciBhbiBFWlxuICAvLyB3aXRoIGl0LCB0aGlzIHdpbGwgb3ZlcnJpZGUgYW4gRVogc2VudCBieSBiYWNrZW5kLlxuICBfaGlzdG9yeVRyaWdnZXJFWjogZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgaWYgKCFyZXN1bHQgfHwgIXJlc3VsdC5kYXRhIHx8XG4gICAgICAgIXJlc3VsdC5kYXRhLmNsdXN0ZXIgfHwgLy8gaWYgbm90IGhpc3RvcnkgY2x1c3RlclxuICAgICAgIHJlc3VsdC5kYXRhLmF1dG9BZGQpIHsgLy8gaWYgdGhlIGJhc2UgZG9tYWluIHdhcyBhdXRvIGFkZGVkIChndWVzc2VkKVxuICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICBpZiAoIUNsaXF6U21hcnRDbGlxekNhY2hlIHx8ICFTbWFydENsaXF6VHJpZ2dlclVybENhY2hlKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHZhciB1cmwgPSB1dGlscy5nZW5lcmFsaXplVXJsKHJlc3VsdC52YWwsIHRydWUpLFxuICAgICAgZXo7XG5cbiAgICBpZiAoU21hcnRDbGlxelRyaWdnZXJVcmxDYWNoZS5pc0NhY2hlZCh1cmwpKSB7XG4gICAgICB2YXIgZXpJZCA9IFNtYXJ0Q2xpcXpUcmlnZ2VyVXJsQ2FjaGUucmV0cmlldmUodXJsKTtcbiAgICAgIC8vIGNsZWFyIGRpcnR5IGRhdGEgdGhhdCBnb3QgaW50byB0aGUgZGF0YSBiYXNlXG4gICAgICBpZiAoZXpJZCA9PT0gJ2RlcHJlY2F0ZWQnKSB7XG4gICAgICAgIFNtYXJ0Q2xpcXpUcmlnZ2VyVXJsQ2FjaGUuZGVsZXRlKHVybCk7XG4gICAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgICBleiA9IENsaXF6U21hcnRDbGlxekNhY2hlLnJldHJpZXZlQW5kVXBkYXRlKHVybCk7XG4gICAgICBpZiAoZXopIHtcbiAgICAgICAgLy8gQ2FjaGVkIEVaIGlzIGF2YWlsYWJsZVxuICAgICAgICBleiA9IFJlc3VsdC5jbG9uZShleik7XG5cbiAgICAgICAgLy8gY29weSBvdmVyIHRpdGxlIGFuZCBkZXNjcmlwdGlvbiBmcm9tIGhpc3RvcnkgZW50cnlcbiAgICAgICAgaWYgKCFyZXN1bHQuZGF0YS5nZW5lcmljKSB7XG4gICAgICAgICAgZXouZGF0YS50aXRsZSA9IHJlc3VsdC5kYXRhLnRpdGxlO1xuICAgICAgICAgIGlmICghZXouZGF0YS5kZXNjcmlwdGlvbilcbiAgICAgICAgICAgICAgZXouZGF0YS5kZXNjcmlwdGlvbiA9IHJlc3VsdC5kYXRhLmRlc2NyaXB0aW9uO1xuICAgICAgICB9XG5cbiAgICAgICAgcmVzdWx0S2luZEVucmljaGVyKHt0cmlnZ2VyX21ldGhvZDogJ2hpc3RvcnlfdXJsJ30sIGV6KTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIE5vdCBhdmFpbGFibGU6IHN0YXJ0IGZldGNoaW5nIG5vdyBzbyBpdCBpcyBhdmFpbGFibGUgc29vblxuICAgICAgICBDbGlxelNtYXJ0Q2xpcXpDYWNoZS5mZXRjaEFuZFN0b3JlKHVybCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChTbWFydENsaXF6VHJpZ2dlclVybENhY2hlLmlzU3RhbGUodXJsKSkge1xuICAgICAgICBTbWFydENsaXF6VHJpZ2dlclVybENhY2hlLmRlbGV0ZSh1cmwpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBlejtcbiAgfSxcblxuICAvLyBGaWx0ZXIgb3V0IGFueSBFWnMgdGhhdCBjb25mbGljdCB3aXRoIHRoZSBmaXJzdHJlc3VsdFxuICBfZmlsdGVyQ29uZmxpY3RpbmdFWjogZnVuY3Rpb24oY2xpcXpFeHRyYSwgZmlyc3RyZXN1bHQpIHtcbiAgICByZXR1cm4gY2xpcXpFeHRyYS5maWx0ZXIoZnVuY3Rpb24oZXopIHtcblxuICAgICAgLy8gRGlkIHdlIG1ha2UgYSAnYmV0JyBvbiBhIHVybCBmcm9tIGhpc3RvcnkgdGhhdCBkb2VzIG5vdCBtYXRjaCB0aGlzIEVaP1xuICAgICAgaWYgKGZpcnN0cmVzdWx0LmRhdGEgJiYgZmlyc3RyZXN1bHQuZGF0YS5jbHVzdGVyICYmXG4gICAgICAgICAhVXJsQ29tcGFyZS5zYW1lVXJscyhlei52YWwsIGZpcnN0cmVzdWx0LnZhbCkpIHtcbiAgICAgICAgdXRpbHMubG9nKCdOb3Qgc2hvd2luZyBFWiAnICsgZXoudmFsICtcbiAgICAgICAgICAgICAgICAgICAgICAgJyBiZWNhdXNlIGRpZmZlcmVudCB0aGFuIGNsdXN0ZXIgJyArIGZpcnN0cmVzdWx0LnZhbCxcbiAgICAgICAgICAgICAgICAgICAgICAgJ01peGVyJyk7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gV2lsbCB0aGUgYXV0b2NvbXBsZXRlIGNoYW5nZSBpZiB3ZSB1c2UgdGhpcyBFWj9cbiAgICAgIGlmIChmaXJzdHJlc3VsdC5hdXRvY29tcGxldGVkICYmXG4gICAgICAgICAhVXJsQ29tcGFyZS5zYW1lVXJscyhlei52YWwsIGZpcnN0cmVzdWx0LnZhbCkpIHtcbiAgICAgICAgdXRpbHMubG9nKCdOb3Qgc2hvd2luZyBFWiAnICsgZXoudmFsICtcbiAgICAgICAgICAgICAgICAgICAgICAgJyBiZWNhdXNlIGF1dG9jb21wbGV0ZSB3b3VsZCBjaGFuZ2UnLCAnTWl4ZXInKTtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuXG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9KTtcbiAgfSxcbiAgLy8gTWl4IHRvZ2V0aGVyIGhpc3RvcnksIGJhY2tlbmQgYW5kIGN1c3RvbSByZXN1bHRzLiBDYWxsZWQgdHdpY2UgcGVyIHF1ZXJ5OlxuICAvLyBvbmNlIHdpdGggb25seSBoaXN0b3J5IChpbnN0YW50KSwgc2Vjb25kIHdpdGggYWxsIGRhdGEuXG4gIG1peDogZnVuY3Rpb24ocSwgY2xpcXosIGNsaXF6RXh0cmEsIGhpc3RvcnksIGN1c3RvbVJlc3VsdHMsXG4gICAgICAgICAgICAgICAgb25seV9oaXN0b3J5KSB7XG5cbiAgICBpZiAoIU1peGVyLl9pc1ZhbGlkUXVlcnlGb3JFWihxKSkge1xuICAgICAgY2xpcXpFeHRyYSA9IFtdO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBQcmVwYXJlIGluY29taW5nIEVaIHJlc3VsdHNcbiAgICAgIGNsaXF6RXh0cmEgPSBNaXhlci5fcHJlcGFyZUV4dHJhUmVzdWx0cyhjbGlxekV4dHJhIHx8IFtdKTtcblxuICAgICAgLy8gQWRkIEVaIGZyb20gZmlyc3QgY2xpcXogcmVzdWx0cyB0byBsaXN0IG9mIEVacywgaWYgdmFsaWRcbiAgICAgIGlmIChjbGlxeiAmJiBjbGlxei5sZW5ndGggPiAwKSB7XG4gICAgICAgIE1peGVyLl9hZGRFWmZyb21CTShjbGlxekV4dHJhLCBjbGlxelswXSk7XG4gICAgICB9XG5cbiAgICAgIC8vIENhY2hlIGFueSBFWnMgZm91bmRcbiAgICAgIE1peGVyLl9jYWNoZUVacyhjbGlxekV4dHJhKTtcbiAgICB9XG5cbiAgICAvLyBQcmVwYXJlIG90aGVyIGluY29taW5nIGRhdGFcbiAgICBjbGlxeiA9IE1peGVyLl9wcmVwYXJlQ2xpcXpSZXN1bHRzKGNsaXF6IHx8IFtdKTtcbiAgICBoaXN0b3J5ID0gTWl4ZXIuX3ByZXBhcmVIaXN0b3J5UmVzdWx0cyhoaXN0b3J5IHx8IFtdKTtcblxuICAgIHV0aWxzLmxvZygnb25seV9oaXN0b3J5OicgKyBvbmx5X2hpc3RvcnkgK1xuICAgICAgICAgICAgICAgICAgICcgaGlzdG9yeTonICsgaGlzdG9yeS5sZW5ndGggK1xuICAgICAgICAgICAgICAgICAgICcgY2xpcXo6JyArIGNsaXF6Lmxlbmd0aCArXG4gICAgICAgICAgICAgICAgICAgJyBleHRyYTonICsgY2xpcXpFeHRyYS5sZW5ndGgsICdNaXhlcicpO1xuXG4gICAgLy8gV2VyZSBhbnkgaGlzdG9yeSByZXN1bHRzIGFsc28gYXZhaWxhYmxlIGFzIGEgY2xpcXogcmVzdWx0P1xuICAgIC8vICBpZiBzbywgcmVtb3ZlIGZyb20gYmFja2VuZCBsaXN0IGFuZCBjb21iaW5lIHNvdXJjZXMgaW4gaGlzdG9yeSByZXN1bHRcbiAgICB2YXIgciA9IE1peGVyLl9kZWR1cGxpY2F0ZVJlc3VsdHMoaGlzdG9yeSwgY2xpcXopO1xuXG4gICAgLy8gUHJlcGFyZSByZXN1bHRzOiBoaXN0b3J5IChmaXJzdCkgdGhlbiBiYWNrZW5kIHJlc3VsdHMgKHNlY29uZClcbiAgICB2YXIgcmVzdWx0cyA9IHIuZmlyc3QuY29uY2F0KHIuc2Vjb25kKTtcblxuICAgIC8vIFRyaWdnZXIgRVogd2l0aCBmaXJzdCBlbnRyeVxuICAgIHZhciBoaXN0b3J5RVogPSBNaXhlci5faGlzdG9yeVRyaWdnZXJFWihyZXN1bHRzWzBdKTtcbiAgICBpZiAoaGlzdG9yeUVaKSB7XG4gICAgICBjbGlxekV4dHJhID0gW2hpc3RvcnlFWl07XG4gICAgfVxuXG4gICAgLy8gRmlsdGVyIGNvbmZsaWN0aW5nIEVac1xuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNsaXF6RXh0cmEgPSBNaXhlci5fZmlsdGVyQ29uZmxpY3RpbmdFWihjbGlxekV4dHJhLCByZXN1bHRzWzBdKTtcbiAgICB9XG5cblxuICAgIC8vIEFkZCBjdXN0b20gcmVzdWx0cyB0byB0aGUgYmVnaW5uaW5nIGlmIHRoZXJlIGFyZSBhbnlcbiAgICBpZiAoY3VzdG9tUmVzdWx0cyAmJiBjdXN0b21SZXN1bHRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNsaXF6RXh0cmEgPSBjdXN0b21SZXN1bHRzLmNvbmNhdChjbGlxekV4dHJhKTtcbiAgICB9XG5cbiAgICAvLyBsaW1pdCB0byBvbmUgZW50aXR5IHpvbmVcbiAgICBjbGlxekV4dHJhID0gY2xpcXpFeHRyYS5zbGljZSgwLCAxKTtcblxuICAgIC8vIHJlbW92ZSBhbnkgQk0gb3Igc2ltcGxlIGhpc3RvcnkgcmVzdWx0cyBjb3ZlcmVkIGJ5IEVaXG4gICAgciA9IE1peGVyLl9kZWR1cGxpY2F0ZVJlc3VsdHMoY2xpcXpFeHRyYSwgcmVzdWx0cyk7XG4gICAgcmVzdWx0cyA9IHIuc2Vjb25kO1xuICAgIHZhciBleiA9IHIuZmlyc3RbMF07XG5cbiAgICAvLyBBZGQgRVogdG8gcmVzdWx0IGxpc3QgcmVzdWx0IGxpc3RcbiAgICBpZiAoZXopIHtcbiAgICAgIHV0aWxzLmxvZygnRVogKCcgKyBlei5kYXRhLmtpbmQgKyAnKSBmb3IgJyArIGV6LnZhbCwgJ01peGVyJyk7XG5cbiAgICAgIC8vIE1ha2UgYSBjb21iaW5lZCBlbnRyeSwgaWYgcG9zc2libGVcbiAgICAgIGlmIChyZXN1bHRzLmxlbmd0aCA+IDAgJiYgcmVzdWx0c1swXS5kYXRhLmNsdXN0ZXIgJiZcbiAgICAgICAgIE1peGVyLkVaX0NPTUJJTkUuaW5kZXhPZihlei5kYXRhLnRlbXBsYXRlKSAhPT0gLTEgJiZcbiAgICAgICAgIFVybENvbXBhcmUuc2FtZVVybHMocmVzdWx0c1swXS52YWwsIGV6LnZhbCkpIHtcblxuICAgICAgICB1dGlscy5sb2coJ01ha2luZyBjb21iaW5lZCBlbnRyeS4nLCAnTWl4ZXInKTtcbiAgICAgICAgcmVzdWx0c1swXSA9IFJlc3VsdC5jb21iaW5lKGV6LCByZXN1bHRbMF0pO1xuICAgICAgICBNaXhlci5fZGVkdXBsaWNhdGVIaXN0b3J5KHJlc3VsdHNbMF0pO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gQWRkIEVaIHRvIHRvcCBvZiByZXN1bHQgbGlzdFxuICAgICAgICByZXN1bHRzID0gW2V6XS5jb25jYXQocmVzdWx0cyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gU3BlY2lhbCBjYXNlOiBhZGp1c3Qgc2Vjb25kIHJlc3VsdCBpZiBpdCBkb2Vzbid0IGZpdFxuICAgIGlmICh1dGlscy5nZXRQcmVmKCdoaXN0X3NlYXJjaF90eXBlJywgMCkgPT0gMCAmJiByZXN1bHRzLmxlbmd0aCA+IDEgJiYgcmVzdWx0c1sxXS5kYXRhLnRlbXBsYXRlID09ICdwYXR0ZXJuLWgyJykge1xuICAgICAgdXRpbHMubG9nKCdDb252ZXJ0aW5nIGNsdXN0ZXIgZm9yICcgKyByZXN1bHRzWzFdLnZhbCArXG4gICAgICAgICAgICAgICAgICAgICAnIHRvIHNpbXBsZSBoaXN0b3J5JywgJ01peGVyJyk7XG5cbiAgICAgIC8vIGNvbnZlcnQgdG8gc2ltcGxlIGhpc3RvcnkgZW50cnlcbiAgICAgIHZhciBzaW1wbGUgPSBSZXN1bHQuZ2VuZXJpYygnZmF2aWNvbicsIHJlc3VsdHNbMV0udmFsLCBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdHNbMV0uZGF0YS50aXRsZSwgbnVsbCwgc2VhcmNoU3RyaW5nKTtcbiAgICAgIHNpbXBsZS5kYXRhLmtpbmQgPSBbJ0gnXTtcbiAgICAgIHNpbXBsZS5kYXRhLmRlc2NyaXB0aW9uID0gcmVzdWx0WzFdLmRhdGEuZGVzY3JpcHRpb247XG4gICAgICByZXN1bHRzWzFdID0gc2ltcGxlO1xuICAgIH1cblxuICAgIC8vIE9ubHkgc2hvdyBhIG1heGltdW0gMyBCTSByZXN1bHRzXG4gICAgdmFyIGNsaXF6UmVzID0gMDtcbiAgICByZXN1bHRzID0gcmVzdWx0cy5maWx0ZXIoZnVuY3Rpb24ocikge1xuICAgICAgaWYgKHIuc3R5bGUuaW5kZXhPZignY2xpcXotcmVzdWx0cyAnKSA9PT0gMCkgY2xpcXpSZXMrKztcbiAgICAgIHJldHVybiBjbGlxelJlcyA8PSAzO1xuICAgIH0pO1xuXG4gICAgLy8gU2hvdyBubyByZXN1bHRzIG1lc3NhZ2VcbiAgICBpZiAocmVzdWx0cy5sZW5ndGggPT09IDAgJiYgIW9ubHlfaGlzdG9yeSkge1xuICAgICAgcmVzdWx0cy5wdXNoKHV0aWxzLmdldE5vUmVzdWx0cygpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcmVzdWx0cztcbiAgfSxcbn07XG5cbmV4cG9ydCBkZWZhdWx0IE1peGVyO1xuIl19