System.register("autocomplete/history-cluster", ["core/cliqz", "autocomplete/result"], function (_export) {
  "use strict";

  var utils, Result, FF_DEF_FAVICON, Q_DEF_FAVICON, CliqzHistoryCluster;
  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }, function (_autocompleteResult) {
      Result = _autocompleteResult["default"];
    }],
    execute: function () {
      FF_DEF_FAVICON = 'chrome://mozapps/skin/places/defaultFavicon.png';
      Q_DEF_FAVICON = utils.SKIN_PATH + 'defaultFavicon.png';
      CliqzHistoryCluster = {
        historyCallback: null,
        latencies: [],

        // Generate result json from patterns
        _generateResult: function _generateResult(patterns, query, cluster, baseUrl) {
          if (!patterns) {
            patterns = [];
          }
          return {
            query: query,
            cluster: cluster,
            top_domain: baseUrl || CliqzHistoryCluster._maxDomainShare(patterns)[0],
            results: patterns,
            filteredResults: function filteredResults() {
              var self = this;
              return this.results.filter(function (r) {
                return r.title && utils.getDetailsFromUrl(r.url).name == utils.getDetailsFromUrl(self.top_domain).name;
              });
            }
          };
        },
        // This method is triggered when the Firefox history has finished loading
        addFirefoxHistory: function addFirefoxHistory(history) {
          var query = history.query;
          var res;

          // Extract results
          var patterns = [];
          for (var i = 0; i < history.results.length; i++) {
            var parts = CliqzUtils.cleanMozillaActions(history.results[i].value);
            var url = parts[1],
                action = parts[0],
                title = history.results[i].comment;
            // Filters out results with value: "moz-action:searchengine,{"engineName":"Google","input":"awz","searchQuery":"awz"}"
            // that are returned from the unifiedcomplete history provider that is the only provider from Firefox 49.0 on
            if (action === 'searchengine') {
              continue;
            }

            if (!title) {
              title = utils.generalizeUrl(url);
            }

            if (title.length > 0 && url.length > 0 && Result.isValid(url, utils.getDetailsFromUrl(url))) {

              patterns.push({
                url: url,
                title: title,
                favicon: history.results[i].image,
                _genUrl: utils.generalizeUrl(url, true)
              });
            }
          }
          // Process patterns
          res = CliqzHistoryCluster._preparePatterns(patterns, query);
          CliqzHistoryCluster.firefoxHistory = [];
          CliqzHistoryCluster.firefoxHistory.res = res;
          CliqzHistoryCluster.firefoxHistory.query = query;
          CliqzHistoryCluster.historyCallback(res);
        },
        _simplePreparePatterns: function _simplePreparePatterns(patterns, query) {
          var baseUrl,
              favicon,
              orig_query = query;

          query = CliqzUtils.cleanUrlProtocol(query, true).trim();

          // Filter patterns that don't match search
          //patterns = CliqzHistoryCluster._filterPatterns(patterns, query.toLowerCase());
          //var share = CliqzHistoryCluster._maxDomainShare(patterns);

          // Remove patterns with same url or title
          //patterns = CliqzHistoryCluster._removeDuplicates(patterns);

          // Move base domain to top
          //var adjustedResults = CliqzHistoryCluster._adjustBaseDomain(patterns, query);
          //patterns = adjustedResults[0];
          //baseUrl = adjustedResults[1];
          //favicon = adjustedResults[2];
          //var https = adjustedResults[3];
          var res = CliqzHistoryCluster._generateResult(patterns, orig_query, false, baseUrl);

          res.cluster = false;

          res.results = CliqzHistoryCluster._removeDuplicates(res.results);
          return res;
        },

        // Process patterns
        _preparePatterns: function _preparePatterns(patterns, query) {
          var baseUrl,
              favicon,
              orig_query = query;

          query = utils.cleanUrlProtocol(query, true).trim();

          // Filter patterns that don't match search
          patterns = CliqzHistoryCluster._filterPatterns(patterns, query.toLowerCase());
          var share = CliqzHistoryCluster._maxDomainShare(patterns);

          // Remove patterns with same url or title
          patterns = CliqzHistoryCluster._removeDuplicates(patterns);

          // Move base domain to top
          var adjustedResults = CliqzHistoryCluster._adjustBaseDomain(patterns, query);
          patterns = adjustedResults[0];
          baseUrl = adjustedResults[1];
          favicon = adjustedResults[2];
          var https = adjustedResults[3];
          var res = CliqzHistoryCluster._generateResult(patterns, orig_query, false, baseUrl);

          // Add base domain if above threshold
          var fRes = res.filteredResults();
          var genQ = utils.generalizeUrl(query);
          if (share[1] > 0.5 && fRes.length > 2 && !(utils.generalizeUrl(patterns[0].url).indexOf(genQ) !== 0 && share[1] < 0.8)) {
            // Check if base domain changed due to filtering
            var tmpBaseUrl = CliqzHistoryCluster._adjustBaseDomain(fRes, query)[1];
            baseUrl = tmpBaseUrl;
            CliqzHistoryCluster._addBaseDomain(patterns, baseUrl, favicon, https);
            res.cluster = true;
            // Threshold not reached or clustering not enabled -> no domain clustering
          } else {
              // Disable domain filtering
              res.filteredResults = function () {
                return this.results;
              };
            }

          // Remove automatically added patterns if they don't match query
          if (patterns && patterns.length > 0 && patterns[0].autoAdd && utils.generalizeUrl(patterns[0].url).indexOf(genQ) !== 0) {
            patterns.shift();
            res.cluster = false;
          }

          res.results = CliqzHistoryCluster._removeDuplicates(res.results);
          return res;
        },

        // Calculates the _weighted_ share of the most common domain in given patterns
        _maxDomainShare: function _maxDomainShare(patterns) {
          var patternCount = patterns.length;
          // boost the first X domain entries (i.e., within boostRange)
          var boostRange = 3;
          // weight for the first X entries, all other entries have weight of 1;
          // this makes the first X entries as important as the remaining (N - X) entries
          var boostFactor = (patternCount - boostRange) / (1 * boostRange);

          // make sure the first results do not become less important, which happens if
          // if there are only very few patterns (i.e, patternCount < boostRange * 2)
          boostFactor = Math.max(1, boostFactor);

          var domains = [];
          var index = 0;
          var cnt = 0;

          for (var key in patterns) {
            var url = patterns[key].url;
            var domaintmp = utils.getDetailsFromUrl(url).domain;
            // assign a higher weight to this domain entry if it is one of the first N entries
            var weightedCount = index < boostRange ? boostFactor : 1;
            if (!domains[domaintmp]) {
              domains[domaintmp] = weightedCount;
            } else {
              cnt = 1;
              if (patterns[key].cnt) cnt = patterns[key].cnt;
              domains[domaintmp] += weightedCount;
            }
            index++;
          }
          var max = 0.0;
          cnt = 0.0;
          var domain = null;
          for (key in domains) {
            cnt += domains[key];
            if (domains[key] > max) {
              max = domains[key];
              domain = key;
            }
          }

          return [domain, max / cnt];
        },
        _filterPatterns: function _filterPatterns(patterns, full_query) {
          var queries = full_query.trim().split(' ');
          var newPatterns = [];
          for (var key in patterns) {
            var match = true;
            // Check all queries for matches
            for (var wordKey in queries) {
              var titleUrlMatch = false;
              if (patterns[key].url.indexOf(queries[wordKey]) != -1 || (patterns[key].title || '').toLowerCase().indexOf(queries[wordKey]) != -1) {
                titleUrlMatch = true;
              }
              var queryMatch = false;
              for (var qkey in patterns[key].query) {
                var q = patterns[key].query[qkey];
                if (q.indexOf(queries[wordKey]) != -1) {
                  queryMatch = true;
                  break;
                }
              }
              if (!queryMatch && !titleUrlMatch) {
                match = false;
                break;
              }
            }
            if (match) newPatterns.push(patterns[key]);
          }
          return newPatterns;
        },
        // Deduplicate URLs and titles
        _removeDuplicates: function _removeDuplicates(patterns) {
          var newPatterns;
          newPatterns = CliqzHistoryCluster._removeDuplicatesByKey(patterns, '_genUrl');
          newPatterns = CliqzHistoryCluster._removeDuplicatesByKey(newPatterns, 'title');
          return newPatterns;
        },
        // Deduplicate entries by value of key, with a preference for https and proper titles
        _removeDuplicatesByKey: function _removeDuplicatesByKey(patterns, key) {
          var reorg = {};
          var order = [];

          var value;

          // Pass 1: group similar entries by key
          for (var i = 0; i < patterns.length; i++) {
            value = patterns[i][key];
            if (!reorg.hasOwnProperty(value)) {
              order.push(value);
              reorg[value] = [];
            }
            reorg[value].push(patterns[i]);
          }

          // Pass 2: take the best entry from each group
          // and add to newPatterns in original order.
          var newPatterns = [];
          for (i = 0; i < order.length; i++) {
            value = order[i];

            if (reorg[value].length == 1) {
              newPatterns.push(reorg[value][0]);
              continue;
            }

            // Separate http and https links
            var https = [],
                http = [];
            for (var j = 0; j < reorg[value].length; j++) {
              if (reorg[value][j].url.indexOf('https://') === 0) {
                https.push(reorg[value][j]);
              } else {
                http.push(reorg[value][j]);
              }
            }

            // if any https links, proceed with them only
            var candidates;
            if (https.length > 0) candidates = https;else candidates = http;

            // Pick the one with a "real" title.
            // Some history entries will have a title the same as the URL,
            // don't use these if possible.
            var found = false;
            for (var x = 0; x < candidates.length; x++) {
              if (!(candidates[x].title == candidates[x]._genUrl || candidates[x].title == 'www.' + candidates[x]._genUrl || candidates[x].title == candidates[x].url)) {
                newPatterns.push(candidates[x]);
                found = true;
                break;
              }
            }
            if (!found) newPatterns.push(candidates[0]);
          }

          return newPatterns;
        },
        // Search all patterns for matching substring (should be domain)
        _findCommonDomain: function _findCommonDomain(patterns) {
          if (patterns.length < 2) {
            return null;
          }
          var scores = {};

          for (var key in patterns) {
            var url1 = patterns[key]._genUrl;
            scores[url1] = true;
            for (var key2 in patterns) {
              var url2 = patterns[key2]._genUrl;
              if (key != key2 && url2.indexOf(url1) == -1) {
                scores[url1] = false;
              }
            }
          }

          // Return match with most occurences
          for (var scorekey in scores) {
            if (scores[scorekey] === true) {
              return scorekey;
            }
          }
          return null;
        },
        // Move base domain to top
        _adjustBaseDomain: function _adjustBaseDomain(patterns, query) {
          if (patterns.length === 0) {
            return [];
          }
          var basePattern = null,
              baseUrl = null,
              favicon = null,
              commonDomain = CliqzHistoryCluster._findCommonDomain(patterns);

          // Check for url matching query
          query = utils.generalizeUrl(query, true);
          var key;
          for (key in patterns) {
            var url = patterns[key].url;
            if (url.indexOf(query) === 0) {
              baseUrl = url;
              favicon = patterns[key].favicon;
              break;
            }
          }

          // if none found, use the first entry
          if (!baseUrl) {
            baseUrl = patterns[0]._genUrl;
            favicon = patterns[0].favicon;
          }

          baseUrl = commonDomain || baseUrl.split('/')[0];

          // find if there is an entry matching the base URL.
          var pUrl;
          for (var i = 0; i < patterns.length; i++) {
            pUrl = patterns[i]._genUrl;
            if (baseUrl == pUrl) {
              basePattern = patterns[i];
              break;
            }
          }
          var https = false;
          var newPatterns = [];
          if (basePattern) {
            // found a history entry representing the base pattern,
            // use at the first entry in newPatterns
            basePattern.base = true;
            patterns[0].debug = 'Replaced by base domain';
            newPatterns.push(basePattern);
          } else {
            utils.log('Using a base url that did not exist in history list.', 'CliqzHistoryCluster');

            for (key in patterns) {
              // if any pattern uses an https domain, try to use that for
              // base domain too.
              pUrl = patterns[key].url;
              if (pUrl.indexOf('https://') === 0) {
                https = true;
                break;
              }

              // Add https if required
              if (https) {
                // ...but only if there is a history entry with title
                if (CliqzHistoryManager.getPageTitle('https://' + baseUrl)) {
                  utils.log('found https base URL with title', 'CliqzHistoryCluster');
                  // keep https as true
                } else {
                    utils.log('no https base URL with title, do not change original base URL', 'CliqzHistoryCluster');
                    https = false;
                  }
              }
            }
          }

          for (key in patterns) {
            // keep everything else except for base, it is already there
            if (patterns[key] != basePattern) newPatterns.push(patterns[key]);
          }
          return [newPatterns, baseUrl, favicon, https];
        },
        // Add base domain of given result to top of patterns, if necessary
        _addBaseDomain: function _addBaseDomain(patterns, baseUrl, favicon, https) {
          baseUrl = utils.generalizeUrl(baseUrl, true);
          // Add base domain entry if there is not one already
          if (patterns && patterns.length > 0 && !patterns[0].base) {
            var title = utils.getDetailsFromUrl(baseUrl).domain;
            if (!title) {
              utils.log('Failed to add base domain because there is no title: ' + baseUrl, 'CliqzHistoryCluster');
              return;
            }

            utils.log('Adding base domain to history cluster: ' + baseUrl, 'CliqzHistoryCluster');

            // Add trailing slash if not there
            var urldetails = utils.getDetailsFromUrl(baseUrl);
            if (urldetails.path === '') baseUrl = baseUrl + '/';

            patterns.unshift({
              title: title.charAt(0).toUpperCase() + title.split('.')[0].slice(1),
              url: baseUrl,
              favicon: favicon
            });
            patterns[0].autoAdd = true;
          }
        },
        // Autocomplete an urlbar value with the given patterns
        autocompleteTerm: function autocompleteTerm(urlbar, pattern, loose) {
          var MAX_AUTOCOMPLETE_LENGTH = 80; // max length of autocomplete portion

          function matchQuery(queries) {
            var query = '';
            for (var key in queries) {
              var q = queries[key].toLowerCase();
              if (q.indexOf(input) === 0 && q.length > query.length) {
                query = q;
              }
            }
            return query;
          }
          if (urlbar == 'www.' || urlbar == 'http://' || urlbar.substr(urlbar.indexOf('://') + 3) == 'www.' || urlbar === '') return {};

          var url = utils.simplifyUrl(pattern.url);
          url = utils.generalizeUrl(url, true);
          var input = utils.generalizeUrl(urlbar);
          if (urlbar[urlbar.length - 1] == '/') input += '/';

          var autocomplete = false,
              highlight = false,
              selectionStart = 0,
              urlbarCompleted = '';
          var queryMatch = matchQuery(pattern.query);

          // Url
          if (url.indexOf(input) === 0 && url != input && url.length - input.length <= MAX_AUTOCOMPLETE_LENGTH) {
            autocomplete = true;
            highlight = true;
            urlbarCompleted = urlbar + url.substring(url.indexOf(input) + input.length);
          }

          if (autocomplete) {
            selectionStart = urlbar.toLowerCase().lastIndexOf(input) + input.length;
          }

          // Adjust url to user protocol
          if (urlbar.indexOf('://') != -1) {
            var prot_user = urlbar.substr(0, urlbar.indexOf('://') + 3);
            var prot_auto = pattern.url.substr(0, pattern.url.indexOf('://') + 3);
            pattern.url = pattern.url.replace(prot_auto, prot_user);
          }

          return {
            url: url,
            full_url: pattern.url,
            autocomplete: autocomplete,
            urlbar: urlbarCompleted,
            selectionStart: selectionStart,
            highlight: highlight
          };
        },

        // Attach a list of URLs to a cluster result
        _attachURLs: function _attachURLs(result, urls, with_favicon) {
          result.data.urls = [];

          for (var i = 0; i < urls.length; i++) {
            var domain = utils.generalizeUrl(urls[i].url, true).split('/')[0],
                url = urls[i].url;

            if (url[url.length - 1] == '/') url = url.substring(0, url.length - 1);

            var favicon = with_favicon && (urls[i].favicon == FF_DEF_FAVICON ? Q_DEF_FAVICON : urls[i].favicon),
                cleanUrl = utils.cleanUrlProtocol(utils.simplifyUrl(url), true);

            var item = {
              href: urls[i].url,
              link: cleanUrl,
              domain: cleanUrl.split('/')[0],
              title: urls[i].title,
              extra: 'history-' + i,
              favicon: favicon,
              // logo is only necessary for 3-up mini-history view, this can be removed if that is retired
              logo: CliqzUtils.getLogoDetails(CliqzUtils.getDetailsFromUrl(urls[i].url)),
              kind: ['H']
            };

            if (urls[i].hasOwnProperty('xtra_c')) {
              item['xtra_c'] = urls[i]['xtra_c'];
              item['class-col-cluster'] = 'cqz-col-12';
              //item['class-col-query'] = 'cqz-col-0';
            }

            if (urls[i].hasOwnProperty('xtra_q')) {
              item['xtra_q'] = urls[i]['xtra_q'];
              item['class-col-cluster'] = 'cqz-col-8';
              item['class-col-query'] = 'cqz-col-4';
            }

            result.data.urls.push(item);

            if (result.data.urls.length > 9 && result.data.template == 'pattern-h1' || result.data.urls.length > 5 && result.data.template == 'pattern-h2' || result.data.urls.length > 2 && result.data.template == 'pattern-h3') {
              break;
            }
          }
        },
        // Creates one (or potentially more) instant results based on history
        createInstantResult: function createInstantResult(res, searchString, callback, customResults) {
          var instant_results = [];
          var results = res.filteredResults();
          var promises = [];

          if (results.length === 0 && !res.urls) {
            // no results, so do nothing

          } else if (res.urls) {
              // Rule-based clustering has already been performed, just take the entry as it is
              var instant = Result.generic('cliqz-pattern', res.url, null, res.title, null, searchString, res);
              instant.comment += ' (history rules cluster)';
              // override with any titles we have saved
              //promises.push(CliqzHistoryCluster._getTitle(instant));

              instant.data.template = 'pattern-h2';
              instant.data.cluster = true; // a history cluster based on a destination bet
              instant_results.push(instant);
            } else if (searchString.length === 0 && customResults === null) {
              // special case for user request of top sites from history
              var instant = Result.generic('cliqz-pattern', '', null, '', null, searchString);
              instant.data.title = utils.getLocalizedString('history_results_cluster');
              instant.data.url = results[0].url;
              instant.comment += ' (history top sites)!';
              instant.data.template = 'pattern-h1';
              instant.data.generic = true;

              this._attachURLs(instant, results);

              instant_results.push(instant);
            } else if (res.cluster) {
              // domain-based cluster
              var instant = Result.generic('cliqz-pattern', results[0].url, null, results[0].title, null, searchString);
              var title = results[0].title;
              if (!title) {
                title = results[0].url;
                utils.log('No title, assigning ' + title, 'CliqzHistoryCluster');
              }
              instant.data.title = title;
              // override with any titles we have saved
              //promises.push(CliqzHistoryCluster._getTitle(instant));

              // get description in case we need it
              //(if this cluster is converted back to simple history)
              //promises.push(CliqzHistoryCluster._getDescription(instant));

              instant.data.url = results[0].url;
              instant.comment += ' (history domain cluster)!';
              instant.data.template = 'pattern-h2';
              instant.data.autoAdd = results[0].autoAdd;
              instant.data.cluster = true; // a history cluster based on a destination bet

              // first entry is used as the main URL of this cluster, remove from remaining result list
              results.shift();

              CliqzHistoryCluster._attachURLs(instant, results);

              instant_results.push(instant);
            } else if (results.length < 3) {
              for (var i = 0; i < results.length; i++) {
                var instant = Result.generic('favicon', results[i].url, null, results[i].title, null, searchString);
                instant.comment += ' (history generic)!';
                instant.data.kind = ['H'];
                //promises.push(CliqzHistoryCluster._getDescription(instant));
                instant_results.push(instant);
              }
            } else {
              // 3-up combined generic history entry
              var instant = Result.generic('cliqz-pattern', '', null, '', null, searchString);
              instant.data.title = '';
              instant.comment += ' (history generic)!';
              instant.data.template = 'pattern-h3';
              instant.data.generic = true;

              this._attachURLs(instant, results, true);
              instant_results.push(instant);
            }

          if (typeof Promise === 'undefined') {
            // Firefox versions < 29
            callback(instant_results, 'cliqz-prod');
          } else {
            Promise.all(promises).then(function (data) {
              callback(instant_results, 'cliqz-prod');
            });
          }
        },
        // Creates one (or potentially more) instant results based on history
        simpleCreateInstantResult: function simpleCreateInstantResult(res, cont, searchString, callback) {
          var instant_results = [];
          //var results = res.filteredResults();
          var results = res.results;
          var promises = [];

          if (results.length === 0 && !res.urls) {
            // no results, so do nothing

          } else {
              // generic history
              var simple_generic = CliqzUtils.getPref('simpleHistory', false);
              //var simple_generic = true;

              // 3-up combined generic history entry
              var instant = Result.generic('cliqz-pattern', '', null, '', null, searchString);
              instant.data.title = '';
              instant.comment += ' (history generic)!';

              //
              // There is so many levels of abstraction here that is impossible to follow,
              // 5 function to be able to printout something, stack overflow :-/
              //
              instant.data.template = 'pattern-hm';
              //instant.data.template = 'pattern-h3';

              instant.data.generic = true;

              instant.data.cont = cont;

              this._attachURLs(instant, results, true);

              instant_results.push(instant);
            }

          if (typeof Promise === 'undefined') {
            // Firefox versions < 29
            callback(instant_results, 'hm');
          } else {
            Promise.all(promises).then(function (data) {
              callback(instant_results, 'hm');
            });
          }
        },
        // Removes a given url from the instant.data.url list
        removeUrlFromResult: function removeUrlFromResult(urlList, _url) {
          var url = utils.generalizeUrl(_url);
          for (var key in urlList) {
            var r_url = utils.generalizeUrl(urlList[key].href);
            if (r_url == url) {
              urlList.splice(key, 1);
              return;
            }
          }
        }
      };

      _export("default", CliqzHistoryCluster);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dG9jb21wbGV0ZS9oaXN0b3J5LWNsdXN0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O3FCQUdJLGNBQWMsRUFDZCxhQUFhLEVBRWIsbUJBQW1COzs7eUJBTmQsS0FBSzs7Ozs7QUFHVixvQkFBYyxHQUFHLGlEQUFpRDtBQUNsRSxtQkFBYSxHQUFHLEtBQUssQ0FBQyxTQUFTLEdBQUcsb0JBQW9CO0FBRXRELHlCQUFtQixHQUFHO0FBQ3hCLHVCQUFlLEVBQUUsSUFBSTtBQUNyQixpQkFBUyxFQUFFLEVBQUU7OztBQUdiLHVCQUFlLEVBQUUseUJBQVMsUUFBUSxFQUFFLEtBQUssRUFBRSxPQUFPLEVBQUUsT0FBTyxFQUFFO0FBQzNELGNBQUksQ0FBQyxRQUFRLEVBQUU7QUFDYixvQkFBUSxHQUFHLEVBQUUsQ0FBQztXQUNmO0FBQ0QsaUJBQU87QUFDTCxpQkFBSyxFQUFFLEtBQUs7QUFDWixtQkFBTyxFQUFFLE9BQU87QUFDaEIsc0JBQVUsRUFBRSxPQUFPLElBQUksbUJBQW1CLENBQUMsZUFBZSxDQUFDLFFBQVEsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN2RSxtQkFBTyxFQUFFLFFBQVE7QUFDakIsMkJBQWUsRUFBRSwyQkFBVztBQUMxQixrQkFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDO0FBQ2hCLHFCQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLFVBQVMsQ0FBQyxFQUFFO0FBQ3JDLHVCQUFPLENBQUMsQ0FBQyxLQUFLLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxJQUFJLElBQUksS0FBSyxDQUFDLGlCQUFpQixDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxJQUFJLENBQUM7ZUFDeEcsQ0FBQyxDQUFDO2FBQ0o7V0FDRixDQUFDO1NBQ0g7O0FBRUQseUJBQWlCLEVBQUUsMkJBQVMsT0FBTyxFQUFFO0FBQ25DLGNBQUksS0FBSyxHQUFHLE9BQU8sQ0FBQyxLQUFLLENB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LElBQUksQ0FBQyxVQUFTLElBQUksRUFBRTtBQUN4QyxzQkFBUSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsQ0FBQzthQUNqQyxDQUFDLENBQUM7V0FDSjtTQUNGOztBQUVELDJCQUFtQixFQUFFLDZCQUFTLE9BQU8sRUFBRSxJQUFJLEVBQUU7QUFDM0MsY0FBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNwQyxlQUFLLElBQUksR0FBRyxJQUFJLE9BQU8sRUFBRTtBQUN2QixnQkFBSSxLQUFLLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDbkQsZ0JBQUksS0FBSyxJQUFJLEdBQUcsRUFBRTtBQUNoQixxQkFBTyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDdkIscUJBQU87YUFDUjtXQUNGO1NBQ0Y7T0FDRjs7eUJBRWMsbUJBQW1CIiwiZmlsZSI6ImF1dG9jb21wbGV0ZS9oaXN0b3J5LWNsdXN0ZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1dGlscyB9IGZyb20gXCJjb3JlL2NsaXF6XCI7XG5pbXBvcnQgUmVzdWx0IGZyb20gXCJhdXRvY29tcGxldGUvcmVzdWx0XCI7XG5cbnZhciBGRl9ERUZfRkFWSUNPTiA9ICdjaHJvbWU6Ly9tb3phcHBzL3NraW4vcGxhY2VzL2RlZmF1bHRGYXZpY29uLnBuZycsXG4gICAgUV9ERUZfRkFWSUNPTiA9IHV0aWxzLlNLSU5fUEFUSCArICdkZWZhdWx0RmF2aWNvbi5wbmcnO1xuXG52YXIgQ2xpcXpIaXN0b3J5Q2x1c3RlciA9IHtcbiAgaGlzdG9yeUNhbGxiYWNrOiBudWxsLFxuICBsYXRlbmNpZXM6IFtdLFxuXG4gIC8vIEdlbmVyYXRlIHJlc3VsdCBqc29uIGZyb20gcGF0dGVybnNcbiAgX2dlbmVyYXRlUmVzdWx0OiBmdW5jdGlvbihwYXR0ZXJucywgcXVlcnksIGNsdXN0ZXIsIGJhc2VVcmwpIHtcbiAgICBpZiAoIXBhdHRlcm5zKSB7XG4gICAgICBwYXR0ZXJucyA9IFtdO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgcXVlcnk6IHF1ZXJ5LFxuICAgICAgY2x1c3RlcjogY2x1c3RlcixcbiAgICAgIHRvcF9kb21haW46IGJhc2VVcmwgfHwgQ2xpcXpIaXN0b3J5Q2x1c3Rlci5fbWF4RG9tYWluU2hhcmUocGF0dGVybnMpWzBdLFxuICAgICAgcmVzdWx0czogcGF0dGVybnMsXG4gICAgICBmaWx0ZXJlZFJlc3VsdHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHJldHVybiB0aGlzLnJlc3VsdHMuZmlsdGVyKGZ1bmN0aW9uKHIpIHtcbiAgICAgICAgICByZXR1cm4gci50aXRsZSAmJiB1dGlscy5nZXREZXRhaWxzRnJvbVVybChyLnVybCkubmFtZSA9PSB1dGlscy5nZXREZXRhaWxzRnJvbVVybChzZWxmLnRvcF9kb21haW4pLm5hbWU7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG4gIH0sXG4gIC8vIFRoaXMgbWV0aG9kIGlzIHRyaWdnZXJlZCB3aGVuIHRoZSBGaXJlZm94IGhpc3RvcnkgaGFzIGZpbmlzaGVkIGxvYWRpbmdcbiAgYWRkRmlyZWZveEhpc3Rvcnk6IGZ1bmN0aW9uKGhpc3RvcnkpIHtcbiAgICB2YXIgcXVlcnkgPSBoaXN0b3J5LnF1ZXJ5O1xuICAgIHZhciByZXM7XG5cbiAgICAvLyBFeHRyYWN0IHJlc3VsdHNcbiAgICB2YXIgcGF0dGVybnMgPSBbXTtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGhpc3RvcnkucmVzdWx0cy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFyIHBhcnRzID0gQ2xpcXpVdGlscy5jbGVhbk1vemlsbGFBY3Rpb25zKGhpc3RvcnkucmVzdWx0c1tpXS52YWx1ZSk7XG4gICAgICB2YXIgdXJsID0gcGFydHNbMV0sXG4gICAgICAgICAgYWN0aW9uID0gcGFydHNbMF0sXG4gICAgICAgICAgdGl0bGUgPSBoaXN0b3J5LnJlc3VsdHNbaV0uY29tbWVudDtcbiAgICAgIC8vIEZpbHRlcnMgb3V0IHJlc3VsdHMgd2l0aCB2YWx1ZTogXCJtb3otYWN0aW9uOnNlYXJjaGVuZ2luZSx7XCJlbmdpbmVOYW1lXCI6XCJHb29nbGVcIixcImlucHV0XCI6XCJhd3pcIixcInNlYXJjaFF1ZXJ5XCI6XCJhd3pcIn1cIlxuICAgICAgLy8gdGhhdCBhcmUgcmV0dXJuZWQgZnJvbSB0aGUgdW5pZmllZGNvbXBsZXRlIGhpc3RvcnkgcHJvdmlkZXIgdGhhdCBpcyB0aGUgb25seSBwcm92aWRlciBmcm9tIEZpcmVmb3ggNDkuMCBvblxuICAgICAgaWYgKGFjdGlvbiA9PT0gJ3NlYXJjaGVuZ2luZScpe1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKCF0aXRsZSkge1xuICAgICAgICB0aXRsZSA9IHV0aWxzLmdlbmVyYWxpemVVcmwodXJsKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHRpdGxlLmxlbmd0aCA+IDAgJiYgdXJsLmxlbmd0aCA+IDAgJiZcbiAgICAgICAgICBSZXN1bHQuaXNWYWxpZCh1cmwsIHV0aWxzLmdldERldGFpbHNGcm9tVXJsKHVybCkpKSB7XG5cbiAgICAgICAgcGF0dGVybnMucHVzaCh7XG4gICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgdGl0bGU6IHRpdGxlLFxuICAgICAgICAgIGZhdmljb246IGhpc3RvcnkucmVzdWx0c1tpXS5pbWFnZSxcbiAgICAgICAgICBfZ2VuVXJsOiB1dGlscy5nZW5lcmFsaXplVXJsKHVybCwgdHJ1ZSlcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfVxuICAgIC8vIFByb2Nlc3MgcGF0dGVybnNcbiAgICByZXMgPSBDbGlxekhpc3RvcnlDbHVzdGVyLl9wcmVwYXJlUGF0dGVybnMocGF0dGVybnMsIHF1ZXJ5KTtcbiAgICBDbGlxekhpc3RvcnlDbHVzdGVyLmZpcmVmb3hIaXN0b3J5ID0gW107XG4gICAgQ2xpcXpIaXN0b3J5Q2x1c3Rlci5maXJlZm94SGlzdG9yeS5yZXMgPSByZXM7XG4gICAgQ2xpcXpIaXN0b3J5Q2x1c3Rlci5maXJlZm94SGlzdG9yeS5xdWVyeSA9IHF1ZXJ5O1xuICAgIENsaXF6SGlzdG9yeUNsdXN0ZXIuaGlzdG9yeUNhbGxiYWNrKHJlcyk7XG4gIH0sXG4gIF9zaW1wbGVQcmVwYXJlUGF0dGVybnM6IGZ1bmN0aW9uKHBhdHRlcm5zLCBxdWVyeSkge1xuICAgIHZhciBiYXNlVXJsLCBmYXZpY29uLCBvcmlnX3F1ZXJ5ID0gcXVlcnk7XG5cbiAgICBxdWVyeSA9IENsaXF6VXRpbHMuY2xlYW5VcmxQcm90b2NvbChxdWVyeSwgdHJ1ZSkudHJpbSgpO1xuXG4gICAgLy8gRmlsdGVyIHBhdHRlcm5zIHRoYXQgZG9uJ3QgbWF0Y2ggc2VhcmNoXG4gICAgLy9wYXR0ZXJucyA9IENsaXF6SGlzdG9yeUNsdXN0ZXIuX2ZpbHRlclBhdHRlcm5zKHBhdHRlcm5zLCBxdWVyeS50b0xvd2VyQ2FzZSgpKTtcbiAgICAvL3ZhciBzaGFyZSA9IENsaXF6SGlzdG9yeUNsdXN0ZXIuX21heERvbWFpblNoYXJlKHBhdHRlcm5zKTtcblxuICAgIC8vIFJlbW92ZSBwYXR0ZXJucyB3aXRoIHNhbWUgdXJsIG9yIHRpdGxlXG4gICAgLy9wYXR0ZXJucyA9IENsaXF6SGlzdG9yeUNsdXN0ZXIuX3JlbW92ZUR1cGxpY2F0ZXMocGF0dGVybnMpO1xuXG4gICAgLy8gTW92ZSBiYXNlIGRvbWFpbiB0byB0b3BcbiAgICAvL3ZhciBhZGp1c3RlZFJlc3VsdHMgPSBDbGlxekhpc3RvcnlDbHVzdGVyLl9hZGp1c3RCYXNlRG9tYWluKHBhdHRlcm5zLCBxdWVyeSk7XG4gICAgLy9wYXR0ZXJucyA9IGFkanVzdGVkUmVzdWx0c1swXTtcbiAgICAvL2Jhc2VVcmwgPSBhZGp1c3RlZFJlc3VsdHNbMV07XG4gICAgLy9mYXZpY29uID0gYWRqdXN0ZWRSZXN1bHRzWzJdO1xuICAgIC8vdmFyIGh0dHBzID0gYWRqdXN0ZWRSZXN1bHRzWzNdO1xuICAgIHZhciByZXMgPSBDbGlxekhpc3RvcnlDbHVzdGVyLl9nZW5lcmF0ZVJlc3VsdChwYXR0ZXJucywgb3JpZ19xdWVyeSwgZmFsc2UsIGJhc2VVcmwpO1xuXG4gICAgcmVzLmNsdXN0ZXIgPSBmYWxzZTtcblxuICAgIHJlcy5yZXN1bHRzID0gQ2xpcXpIaXN0b3J5Q2x1c3Rlci5fcmVtb3ZlRHVwbGljYXRlcyhyZXMucmVzdWx0cyk7XG4gICAgcmV0dXJuIHJlcztcbiAgfSxcblxuICAvLyBQcm9jZXNzIHBhdHRlcm5zXG4gIF9wcmVwYXJlUGF0dGVybnM6IGZ1bmN0aW9uKHBhdHRlcm5zLCBxdWVyeSkge1xuICAgIHZhciBiYXNlVXJsLCBmYXZpY29uLCBvcmlnX3F1ZXJ5ID0gcXVlcnk7XG5cbiAgICBxdWVyeSA9IHV0aWxzLmNsZWFuVXJsUHJvdG9jb2wocXVlcnksIHRydWUpLnRyaW0oKTtcblxuICAgIC8vIEZpbHRlciBwYXR0ZXJucyB0aGF0IGRvbid0IG1hdGNoIHNlYXJjaFxuICAgIHBhdHRlcm5zID0gQ2xpcXpIaXN0b3J5Q2x1c3Rlci5fZmlsdGVyUGF0dGVybnMocGF0dGVybnMsIHF1ZXJ5LnRvTG93ZXJDYXNlKCkpO1xuICAgIHZhciBzaGFyZSA9IENsaXF6SGlzdG9yeUNsdXN0ZXIuX21heERvbWFpblNoYXJlKHBhdHRlcm5zKTtcblxuICAgIC8vIFJlbW92ZSBwYXR0ZXJucyB3aXRoIHNhbWUgdXJsIG9yIHRpdGxlXG4gICAgcGF0dGVybnMgPSBDbGlxekhpc3RvcnlDbHVzdGVyLl9yZW1vdmVEdXBsaWNhdGVzKHBhdHRlcm5zKTtcblxuICAgIC8vIE1vdmUgYmFzZSBkb21haW4gdG8gdG9wXG4gICAgdmFyIGFkanVzdGVkUmVzdWx0cyA9IENsaXF6SGlzdG9yeUNsdXN0ZXIuX2FkanVzdEJhc2VEb21haW4ocGF0dGVybnMsIHF1ZXJ5KTtcbiAgICBwYXR0ZXJucyA9IGFkanVzdGVkUmVzdWx0c1swXTtcbiAgICBiYXNlVXJsID0gYWRqdXN0ZWRSZXN1bHRzWzFdO1xuICAgIGZhdmljb24gPSBhZGp1c3RlZFJlc3VsdHNbMl07XG4gICAgdmFyIGh0dHBzID0gYWRqdXN0ZWRSZXN1bHRzWzNdO1xuICAgIHZhciByZXMgPSBDbGlxekhpc3RvcnlDbHVzdGVyLl9nZW5lcmF0ZVJlc3VsdChwYXR0ZXJucywgb3JpZ19xdWVyeSwgZmFsc2UsIGJhc2VVcmwpO1xuXG4gICAgLy8gQWRkIGJhc2UgZG9tYWluIGlmIGFib3ZlIHRocmVzaG9sZFxuICAgIHZhciBmUmVzID0gcmVzLmZpbHRlcmVkUmVzdWx0cygpO1xuICAgIHZhciBnZW5RID0gdXRpbHMuZ2VuZXJhbGl6ZVVybChxdWVyeSk7XG4gICAgaWYgKHNoYXJlWzFdID4gMC41ICYmIGZSZXMubGVuZ3RoID4gMiAmJlxuICAgICAgICEodXRpbHMuZ2VuZXJhbGl6ZVVybChwYXR0ZXJuc1swXS51cmwpLmluZGV4T2YoZ2VuUSkgIT09IDAgJiYgc2hhcmVbMV0gPCAwLjgpKSB7XG4gICAgICAvLyBDaGVjayBpZiBiYXNlIGRvbWFpbiBjaGFuZ2VkIGR1ZSB0byBmaWx0ZXJpbmdcbiAgICAgIHZhciB0bXBCYXNlVXJsID0gQ2xpcXpIaXN0b3J5Q2x1c3Rlci5fYWRqdXN0QmFzZURvbWFpbihmUmVzLCBxdWVyeSlbMV07XG4gICAgICBiYXNlVXJsID0gdG1wQmFzZVVybDtcbiAgICAgIENsaXF6SGlzdG9yeUNsdXN0ZXIuX2FkZEJhc2VEb21haW4ocGF0dGVybnMsIGJhc2VVcmwsIGZhdmljb24sIGh0dHBzKTtcbiAgICAgIHJlcy5jbHVzdGVyID0gdHJ1ZTtcbiAgICAvLyBUaHJlc2hvbGQgbm90IHJlYWNoZWQgb3IgY2x1c3RlcmluZyBub3QgZW5hYmxlZCAtPiBubyBkb21haW4gY2x1c3RlcmluZ1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBEaXNhYmxlIGRvbWFpbiBmaWx0ZXJpbmdcbiAgICAgIHJlcy5maWx0ZXJlZFJlc3VsdHMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMucmVzdWx0cztcbiAgICAgIH07XG4gICAgfVxuXG4gICAgLy8gUmVtb3ZlIGF1dG9tYXRpY2FsbHkgYWRkZWQgcGF0dGVybnMgaWYgdGhleSBkb24ndCBtYXRjaCBxdWVyeVxuICAgIGlmIChwYXR0ZXJucyAmJiBwYXR0ZXJucy5sZW5ndGggPiAwICYmXG4gICAgICAgcGF0dGVybnNbMF0uYXV0b0FkZCAmJlxuICAgICAgIHV0aWxzLmdlbmVyYWxpemVVcmwocGF0dGVybnNbMF0udXJsKS5pbmRleE9mKGdlblEpICE9PSAwKSB7XG4gICAgICBwYXR0ZXJucy5zaGlmdCgpO1xuICAgICAgcmVzLmNsdXN0ZXIgPSBmYWxzZTtcbiAgICB9XG5cbiAgICByZXMucmVzdWx0cyA9IENsaXF6SGlzdG9yeUNsdXN0ZXIuX3JlbW92ZUR1cGxpY2F0ZXMocmVzLnJlc3VsdHMpO1xuICAgIHJldHVybiByZXM7XG4gIH0sXG5cbiAgLy8gQ2FsY3VsYXRlcyB0aGUgX3dlaWdodGVkXyBzaGFyZSBvZiB0aGUgbW9zdCBjb21tb24gZG9tYWluIGluIGdpdmVuIHBhdHRlcm5zXG4gIF9tYXhEb21haW5TaGFyZTogZnVuY3Rpb24ocGF0dGVybnMpIHtcbiAgICB2YXIgcGF0dGVybkNvdW50ID0gcGF0dGVybnMubGVuZ3RoO1xuICAgIC8vIGJvb3N0IHRoZSBmaXJzdCBYIGRvbWFpbiBlbnRyaWVzIChpLmUuLCB3aXRoaW4gYm9vc3RSYW5nZSlcbiAgICB2YXIgYm9vc3RSYW5nZSA9IDM7XG4gICAgLy8gd2VpZ2h0IGZvciB0aGUgZmlyc3QgWCBlbnRyaWVzLCBhbGwgb3RoZXIgZW50cmllcyBoYXZlIHdlaWdodCBvZiAxO1xuICAgIC8vIHRoaXMgbWFrZXMgdGhlIGZpcnN0IFggZW50cmllcyBhcyBpbXBvcnRhbnQgYXMgdGhlIHJlbWFpbmluZyAoTiAtIFgpIGVudHJpZXNcbiAgICB2YXIgYm9vc3RGYWN0b3IgPSAocGF0dGVybkNvdW50IC0gYm9vc3RSYW5nZSkgLyAoMSAqIGJvb3N0UmFuZ2UpO1xuXG4gICAgLy8gbWFrZSBzdXJlIHRoZSBmaXJzdCByZXN1bHRzIGRvIG5vdCBiZWNvbWUgbGVzcyBpbXBvcnRhbnQsIHdoaWNoIGhhcHBlbnMgaWZcbiAgICAvLyBpZiB0aGVyZSBhcmUgb25seSB2ZXJ5IGZldyBwYXR0ZXJucyAoaS5lLCBwYXR0ZXJuQ291bnQgPCBib29zdFJhbmdlICogMilcbiAgICBib29zdEZhY3RvciA9IE1hdGgubWF4KDEsIGJvb3N0RmFjdG9yKTtcblxuICAgIHZhciBkb21haW5zID0gW107XG4gICAgdmFyIGluZGV4ID0gMDtcbiAgICB2YXIgY250ID0gMDtcblxuICAgIGZvciAodmFyIGtleSBpbiBwYXR0ZXJucykge1xuICAgICAgdmFyIHVybCA9IHBhdHRlcm5zW2tleV0udXJsO1xuICAgICAgdmFyIGRvbWFpbnRtcCA9IHV0aWxzLmdldERldGFpbHNGcm9tVXJsKHVybCkuZG9tYWluO1xuICAgICAgLy8gYXNzaWduIGEgaGlnaGVyIHdlaWdodCB0byB0aGlzIGRvbWFpbiBlbnRyeSBpZiBpdCBpcyBvbmUgb2YgdGhlIGZpcnN0IE4gZW50cmllc1xuICAgICAgdmFyIHdlaWdodGVkQ291bnQgPSBpbmRleCA8IGJvb3N0UmFuZ2UgPyBib29zdEZhY3RvciA6IDE7XG4gICAgICBpZiAoIWRvbWFpbnNbZG9tYWludG1wXSkge1xuICAgICAgICBkb21haW5zW2RvbWFpbnRtcF0gPSB3ZWlnaHRlZENvdW50O1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY250ID0gMTtcbiAgICAgICAgaWYgKHBhdHRlcm5zW2tleV0uY250KSBjbnQgPSBwYXR0ZXJuc1trZXldLmNudDtcbiAgICAgICAgZG9tYWluc1tkb21haW50bXBdICs9IHdlaWdodGVkQ291bnQ7XG4gICAgICB9XG4gICAgICBpbmRleCsrO1xuICAgIH1cbiAgICB2YXIgbWF4ID0gMC4wO1xuICAgIGNudCA9IDAuMDtcbiAgICB2YXIgZG9tYWluID0gbnVsbDtcbiAgICBmb3IgKGtleSBpbiBkb21haW5zKSB7XG4gICAgICBjbnQgKz0gZG9tYWluc1trZXldO1xuICAgICAgaWYgKGRvbWFpbnNba2V5XSA+IG1heCkge1xuICAgICAgICBtYXggPSBkb21haW5zW2tleV07XG4gICAgICAgIGRvbWFpbiA9IGtleTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gW2RvbWFpbiwgbWF4IC8gY250XTtcbiAgfSxcbiAgX2ZpbHRlclBhdHRlcm5zOiBmdW5jdGlvbihwYXR0ZXJucywgZnVsbF9xdWVyeSkge1xuICAgIHZhciBxdWVyaWVzID0gZnVsbF9xdWVyeS50cmltKCkuc3BsaXQoJyAnKTtcbiAgICB2YXIgbmV3UGF0dGVybnMgPSBbXTtcbiAgICBmb3IgKHZhciBrZXkgaW4gcGF0dGVybnMpIHtcbiAgICAgIHZhciBtYXRjaCA9IHRydWU7XG4gICAgICAvLyBDaGVjayBhbGwgcXVlcmllcyBmb3IgbWF0Y2hlc1xuICAgICAgZm9yICh2YXIgd29yZEtleSBpbiBxdWVyaWVzKSB7XG4gICAgICAgIHZhciB0aXRsZVVybE1hdGNoID0gZmFsc2U7XG4gICAgICAgIGlmIChwYXR0ZXJuc1trZXldLnVybC5pbmRleE9mKHF1ZXJpZXNbd29yZEtleV0pICE9IC0xIHx8XG4gICAgICAgICAgKChwYXR0ZXJuc1trZXldLnRpdGxlIHx8ICcnKS50b0xvd2VyQ2FzZSgpLmluZGV4T2YocXVlcmllc1t3b3JkS2V5XSkgIT0gLTEpKSB7XG4gICAgICAgICAgdGl0bGVVcmxNYXRjaCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHF1ZXJ5TWF0Y2ggPSBmYWxzZTtcbiAgICAgICAgZm9yICh2YXIgcWtleSBpbiBwYXR0ZXJuc1trZXldLnF1ZXJ5KSB7XG4gICAgICAgICAgdmFyIHEgPSBwYXR0ZXJuc1trZXldLnF1ZXJ5W3FrZXldO1xuICAgICAgICAgIGlmIChxLmluZGV4T2YocXVlcmllc1t3b3JkS2V5XSkgIT0gLTEpIHtcbiAgICAgICAgICAgIHF1ZXJ5TWF0Y2ggPSB0cnVlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmICghcXVlcnlNYXRjaCAmJiAhdGl0bGVVcmxNYXRjaCkge1xuICAgICAgICAgIG1hdGNoID0gZmFsc2U7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChtYXRjaCkgbmV3UGF0dGVybnMucHVzaChwYXR0ZXJuc1trZXldKTtcbiAgICB9XG4gICAgcmV0dXJuIG5ld1BhdHRlcm5zO1xuICB9LFxuICAvLyBEZWR1cGxpY2F0ZSBVUkxzIGFuZCB0aXRsZXNcbiAgX3JlbW92ZUR1cGxpY2F0ZXM6IGZ1bmN0aW9uKHBhdHRlcm5zKSB7XG4gICAgdmFyIG5ld1BhdHRlcm5zO1xuICAgIG5ld1BhdHRlcm5zID0gQ2xpcXpIaXN0b3J5Q2x1c3Rlci5fcmVtb3ZlRHVwbGljYXRlc0J5S2V5KHBhdHRlcm5zLCAnX2dlblVybCcpO1xuICAgIG5ld1BhdHRlcm5zID0gQ2xpcXpIaXN0b3J5Q2x1c3Rlci5fcmVtb3ZlRHVwbGljYXRlc0J5S2V5KG5ld1BhdHRlcm5zLCAndGl0bGUnKTtcbiAgICByZXR1cm4gbmV3UGF0dGVybnM7XG4gIH0sXG4gIC8vIERlZHVwbGljYXRlIGVudHJpZXMgYnkgdmFsdWUgb2Yga2V5LCB3aXRoIGEgcHJlZmVyZW5jZSBmb3IgaHR0cHMgYW5kIHByb3BlciB0aXRsZXNcbiAgX3JlbW92ZUR1cGxpY2F0ZXNCeUtleTogZnVuY3Rpb24ocGF0dGVybnMsIGtleSkge1xuICAgIHZhciByZW9yZyA9IHt9O1xuICAgIHZhciBvcmRlciA9IFtdO1xuXG4gICAgdmFyIHZhbHVlO1xuXG4gICAgLy8gUGFzcyAxOiBncm91cCBzaW1pbGFyIGVudHJpZXMgYnkga2V5XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXR0ZXJucy5sZW5ndGg7IGkrKykge1xuICAgICAgdmFsdWUgPSBwYXR0ZXJuc1tpXVtrZXldO1xuICAgICAgaWYgKCFyZW9yZy5oYXNPd25Qcm9wZXJ0eSh2YWx1ZSkpIHtcbiAgICAgICAgb3JkZXIucHVzaCh2YWx1ZSk7XG4gICAgICAgIHJlb3JnW3ZhbHVlXSA9IFtdO1xuICAgICAgfVxuICAgICAgcmVvcmdbdmFsdWVdLnB1c2gocGF0dGVybnNbaV0pO1xuICAgIH1cblxuICAgIC8vIFBhc3MgMjogdGFrZSB0aGUgYmVzdCBlbnRyeSBmcm9tIGVhY2ggZ3JvdXBcbiAgICAvLyBhbmQgYWRkIHRvIG5ld1BhdHRlcm5zIGluIG9yaWdpbmFsIG9yZGVyLlxuICAgIHZhciBuZXdQYXR0ZXJucyA9IFtdO1xuICAgIGZvciAoaSA9IDA7IGkgPCBvcmRlci5sZW5ndGg7IGkrKykge1xuICAgICAgdmFsdWUgPSBvcmRlcltpXTtcblxuICAgICAgaWYgKHJlb3JnW3ZhbHVlXS5sZW5ndGggPT0gMSkge1xuICAgICAgICBuZXdQYXR0ZXJucy5wdXNoKHJlb3JnW3ZhbHVlXVswXSk7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBTZXBhcmF0ZSBodHRwIGFuZCBodHRwcyBsaW5rc1xuICAgICAgdmFyIGh0dHBzID0gW10sXG4gICAgICAgICAgaHR0cCA9IFtdO1xuICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCByZW9yZ1t2YWx1ZV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgaWYgKHJlb3JnW3ZhbHVlXVtqXS51cmwuaW5kZXhPZignaHR0cHM6Ly8nKSA9PT0gMCkge1xuICAgICAgICAgIGh0dHBzLnB1c2gocmVvcmdbdmFsdWVdW2pdKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBodHRwLnB1c2gocmVvcmdbdmFsdWVdW2pdKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBpZiBhbnkgaHR0cHMgbGlua3MsIHByb2NlZWQgd2l0aCB0aGVtIG9ubHlcbiAgICAgIHZhciBjYW5kaWRhdGVzO1xuICAgICAgaWYgKGh0dHBzLmxlbmd0aCA+IDApXG4gICAgICAgIGNhbmRpZGF0ZXMgPSBodHRwcztcbiAgICAgIGVsc2VcbiAgICAgICAgY2FuZGlkYXRlcyA9IGh0dHA7XG5cbiAgICAgIC8vIFBpY2sgdGhlIG9uZSB3aXRoIGEgXCJyZWFsXCIgdGl0bGUuXG4gICAgICAvLyBTb21lIGhpc3RvcnkgZW50cmllcyB3aWxsIGhhdmUgYSB0aXRsZSB0aGUgc2FtZSBhcyB0aGUgVVJMLFxuICAgICAgLy8gZG9uJ3QgdXNlIHRoZXNlIGlmIHBvc3NpYmxlLlxuICAgICAgdmFyIGZvdW5kID0gZmFsc2U7XG4gICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IGNhbmRpZGF0ZXMubGVuZ3RoOyB4KyspIHtcbiAgICAgICAgaWYgKCEoY2FuZGlkYXRlc1t4XS50aXRsZSA9PSBjYW5kaWRhdGVzW3hdLl9nZW5VcmwgfHxcbiAgICAgICAgICAgICBjYW5kaWRhdGVzW3hdLnRpdGxlID09ICd3d3cuJyArIGNhbmRpZGF0ZXNbeF0uX2dlblVybCB8fFxuICAgICAgICAgICAgIGNhbmRpZGF0ZXNbeF0udGl0bGUgPT0gY2FuZGlkYXRlc1t4XS51cmwpKSB7XG4gICAgICAgICAgbmV3UGF0dGVybnMucHVzaChjYW5kaWRhdGVzW3hdKTtcbiAgICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmICghZm91bmQpXG4gICAgICAgIG5ld1BhdHRlcm5zLnB1c2goY2FuZGlkYXRlc1swXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIG5ld1BhdHRlcm5zO1xuICB9LFxuICAvLyBTZWFyY2ggYWxsIHBhdHRlcm5zIGZvciBtYXRjaGluZyBzdWJzdHJpbmcgKHNob3VsZCBiZSBkb21haW4pXG4gIF9maW5kQ29tbW9uRG9tYWluOiBmdW5jdGlvbihwYXR0ZXJucykge1xuICAgIGlmIChwYXR0ZXJucy5sZW5ndGggPCAyKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgdmFyIHNjb3JlcyA9IHt9O1xuXG4gICAgZm9yICh2YXIga2V5IGluIHBhdHRlcm5zKSB7XG4gICAgICB2YXIgdXJsMSA9IHBhdHRlcm5zW2tleV0uX2dlblVybDtcbiAgICAgIHNjb3Jlc1t1cmwxXSA9IHRydWU7XG4gICAgICBmb3IgKHZhciBrZXkyIGluIHBhdHRlcm5zKSB7XG4gICAgICAgIHZhciB1cmwyID0gcGF0dGVybnNba2V5Ml0uX2dlblVybDtcbiAgICAgICAgaWYgKGtleSAhPSBrZXkyICYmIHVybDIuaW5kZXhPZih1cmwxKSA9PSAtMSkge1xuICAgICAgICAgIHNjb3Jlc1t1cmwxXSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gUmV0dXJuIG1hdGNoIHdpdGggbW9zdCBvY2N1cmVuY2VzXG4gICAgZm9yICh2YXIgc2NvcmVrZXkgaW4gc2NvcmVzKSB7XG4gICAgICBpZiAoc2NvcmVzW3Njb3Jla2V5XSA9PT0gdHJ1ZSkge1xuICAgICAgICByZXR1cm4gc2NvcmVrZXk7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xuICB9LFxuICAvLyBNb3ZlIGJhc2UgZG9tYWluIHRvIHRvcFxuICBfYWRqdXN0QmFzZURvbWFpbjogZnVuY3Rpb24ocGF0dGVybnMsIHF1ZXJ5KSB7XG4gICAgaWYgKHBhdHRlcm5zLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFtdO1xuICAgIH1cbiAgICB2YXIgYmFzZVBhdHRlcm4gPSBudWxsLCBiYXNlVXJsID0gbnVsbCwgZmF2aWNvbiA9IG51bGwsXG4gICAgICAgIGNvbW1vbkRvbWFpbiA9IENsaXF6SGlzdG9yeUNsdXN0ZXIuX2ZpbmRDb21tb25Eb21haW4ocGF0dGVybnMpO1xuXG4gICAgLy8gQ2hlY2sgZm9yIHVybCBtYXRjaGluZyBxdWVyeVxuICAgIHF1ZXJ5ID0gdXRpbHMuZ2VuZXJhbGl6ZVVybChxdWVyeSwgdHJ1ZSk7XG4gICAgdmFyIGtleTtcbiAgICBmb3IgKGtleSBpbiBwYXR0ZXJucykge1xuICAgICAgdmFyIHVybCA9IHBhdHRlcm5zW2tleV0udXJsO1xuICAgICAgaWYgKHVybC5pbmRleE9mKHF1ZXJ5KSA9PT0gMCkge1xuICAgICAgICBiYXNlVXJsID0gdXJsO1xuICAgICAgICBmYXZpY29uID0gcGF0dGVybnNba2V5XS5mYXZpY29uO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBpZiBub25lIGZvdW5kLCB1c2UgdGhlIGZpcnN0IGVudHJ5XG4gICAgaWYgKCFiYXNlVXJsKSB7XG4gICAgICBiYXNlVXJsID0gcGF0dGVybnNbMF0uX2dlblVybDtcbiAgICAgIGZhdmljb24gPSBwYXR0ZXJuc1swXS5mYXZpY29uO1xuICAgIH1cblxuICAgIGJhc2VVcmwgPSBjb21tb25Eb21haW4gfHwgYmFzZVVybC5zcGxpdCgnLycpWzBdO1xuXG4gICAgLy8gZmluZCBpZiB0aGVyZSBpcyBhbiBlbnRyeSBtYXRjaGluZyB0aGUgYmFzZSBVUkwuXG4gICAgdmFyIHBVcmw7XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBwYXR0ZXJucy5sZW5ndGg7IGkrKykge1xuICAgICAgcFVybCA9IHBhdHRlcm5zW2ldLl9nZW5Vcmw7XG4gICAgICBpZiAoYmFzZVVybCA9PSBwVXJsKSB7XG4gICAgICAgIGJhc2VQYXR0ZXJuID0gcGF0dGVybnNbaV07XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICB2YXIgaHR0cHMgPSBmYWxzZTtcbiAgICB2YXIgbmV3UGF0dGVybnMgPSBbXTtcbiAgICBpZiAoYmFzZVBhdHRlcm4pIHtcbiAgICAgIC8vIGZvdW5kIGEgaGlzdG9yeSBlbnRyeSByZXByZXNlbnRpbmcgdGhlIGJhc2UgcGF0dGVybixcbiAgICAgIC8vIHVzZSBhdCB0aGUgZmlyc3QgZW50cnkgaW4gbmV3UGF0dGVybnNcbiAgICAgIGJhc2VQYXR0ZXJuLmJhc2UgPSB0cnVlO1xuICAgICAgcGF0dGVybnNbMF0uZGVidWcgPSAnUmVwbGFjZWQgYnkgYmFzZSBkb21haW4nO1xuICAgICAgbmV3UGF0dGVybnMucHVzaChiYXNlUGF0dGVybik7XG5cbiAgICB9IGVsc2Uge1xuICAgICAgdXRpbHMubG9nKCdVc2luZyBhIGJhc2UgdXJsIHRoYXQgZGlkIG5vdCBleGlzdCBpbiBoaXN0b3J5IGxpc3QuJywgJ0NsaXF6SGlzdG9yeUNsdXN0ZXInKTtcblxuICAgICAgZm9yIChrZXkgaW4gcGF0dGVybnMpIHtcbiAgICAgICAgLy8gaWYgYW55IHBhdHRlcm4gdXNlcyBhbiBodHRwcyBkb21haW4sIHRyeSB0byB1c2UgdGhhdCBmb3JcbiAgICAgICAgLy8gYmFzZSBkb21haW4gdG9vLlxuICAgICAgICBwVXJsID0gcGF0dGVybnNba2V5XS51cmw7XG4gICAgICAgIGlmIChwVXJsLmluZGV4T2YoJ2h0dHBzOi8vJykgPT09IDApIHtcbiAgICAgICAgICBodHRwcyA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBZGQgaHR0cHMgaWYgcmVxdWlyZWRcbiAgICAgICAgaWYgKGh0dHBzKSB7XG4gICAgICAgICAgLy8gLi4uYnV0IG9ubHkgaWYgdGhlcmUgaXMgYSBoaXN0b3J5IGVudHJ5IHdpdGggdGl0bGVcbiAgICAgICAgICBpZiAoQ2xpcXpIaXN0b3J5TWFuYWdlci5nZXRQYWdlVGl0bGUoJ2h0dHBzOi8vJyArIGJhc2VVcmwpKSB7XG4gICAgICAgICAgICB1dGlscy5sb2coJ2ZvdW5kIGh0dHBzIGJhc2UgVVJMIHdpdGggdGl0bGUnLCAnQ2xpcXpIaXN0b3J5Q2x1c3RlcicpO1xuICAgICAgICAgICAgLy8ga2VlcCBodHRwcyBhcyB0cnVlXG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHV0aWxzLmxvZygnbm8gaHR0cHMgYmFzZSBVUkwgd2l0aCB0aXRsZSwgZG8gbm90IGNoYW5nZSBvcmlnaW5hbCBiYXNlIFVSTCcsICdDbGlxekhpc3RvcnlDbHVzdGVyJyk7XG4gICAgICAgICAgICBodHRwcyA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGZvciAoa2V5IGluIHBhdHRlcm5zKSB7XG4gICAgICAvLyBrZWVwIGV2ZXJ5dGhpbmcgZWxzZSBleGNlcHQgZm9yIGJhc2UsIGl0IGlzIGFscmVhZHkgdGhlcmVcbiAgICAgIGlmIChwYXR0ZXJuc1trZXldICE9IGJhc2VQYXR0ZXJuKSBuZXdQYXR0ZXJucy5wdXNoKHBhdHRlcm5zW2tleV0pO1xuICAgIH1cbiAgICByZXR1cm4gW25ld1BhdHRlcm5zLCBiYXNlVXJsLCBmYXZpY29uLCBodHRwc107XG4gIH0sXG4gIC8vIEFkZCBiYXNlIGRvbWFpbiBvZiBnaXZlbiByZXN1bHQgdG8gdG9wIG9mIHBhdHRlcm5zLCBpZiBuZWNlc3NhcnlcbiAgX2FkZEJhc2VEb21haW46IGZ1bmN0aW9uKHBhdHRlcm5zLCBiYXNlVXJsLCBmYXZpY29uLCBodHRwcykge1xuICAgIGJhc2VVcmwgPSB1dGlscy5nZW5lcmFsaXplVXJsKGJhc2VVcmwsIHRydWUpO1xuICAgIC8vIEFkZCBiYXNlIGRvbWFpbiBlbnRyeSBpZiB0aGVyZSBpcyBub3Qgb25lIGFscmVhZHlcbiAgICBpZiAocGF0dGVybnMgJiYgcGF0dGVybnMubGVuZ3RoID4gMCAmJiAhcGF0dGVybnNbMF0uYmFzZSkge1xuICAgICAgdmFyIHRpdGxlID0gdXRpbHMuZ2V0RGV0YWlsc0Zyb21VcmwoYmFzZVVybCkuZG9tYWluO1xuICAgICAgaWYgKCF0aXRsZSkge1xuICAgICAgICB1dGlscy5sb2coJ0ZhaWxlZCB0byBhZGQgYmFzZSBkb21haW4gYmVjYXVzZSB0aGVyZSBpcyBubyB0aXRsZTogJyArIGJhc2VVcmwsICdDbGlxekhpc3RvcnlDbHVzdGVyJyk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cblxuICAgICAgdXRpbHMubG9nKCdBZGRpbmcgYmFzZSBkb21haW4gdG8gaGlzdG9yeSBjbHVzdGVyOiAnICsgYmFzZVVybCwgJ0NsaXF6SGlzdG9yeUNsdXN0ZXInKTtcblxuICAgICAgLy8gQWRkIHRyYWlsaW5nIHNsYXNoIGlmIG5vdCB0aGVyZVxuICAgICAgdmFyIHVybGRldGFpbHMgPSB1dGlscy5nZXREZXRhaWxzRnJvbVVybChiYXNlVXJsKTtcbiAgICAgIGlmICh1cmxkZXRhaWxzLnBhdGggPT09ICcnKVxuICAgICAgICBiYXNlVXJsID0gYmFzZVVybCArICcvJztcblxuICAgICAgcGF0dGVybnMudW5zaGlmdCh7XG4gICAgICAgIHRpdGxlOiB0aXRsZS5jaGFyQXQoMCkudG9VcHBlckNhc2UoKSArIHRpdGxlLnNwbGl0KCcuJylbMF0uc2xpY2UoMSksXG4gICAgICAgIHVybDogYmFzZVVybCxcbiAgICAgICAgZmF2aWNvbjogZmF2aWNvblxuICAgICAgfSk7XG4gICAgICBwYXR0ZXJuc1swXS5hdXRvQWRkID0gdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIC8vIEF1dG9jb21wbGV0ZSBhbiB1cmxiYXIgdmFsdWUgd2l0aCB0aGUgZ2l2ZW4gcGF0dGVybnNcbiAgYXV0b2NvbXBsZXRlVGVybTogZnVuY3Rpb24odXJsYmFyLCBwYXR0ZXJuLCBsb29zZSkge1xuICAgIHZhciBNQVhfQVVUT0NPTVBMRVRFX0xFTkdUSCA9IDgwOyAvLyBtYXggbGVuZ3RoIG9mIGF1dG9jb21wbGV0ZSBwb3J0aW9uXG5cbiAgICBmdW5jdGlvbiBtYXRjaFF1ZXJ5KHF1ZXJpZXMpIHtcbiAgICAgIHZhciBxdWVyeSA9ICcnO1xuICAgICAgZm9yICh2YXIga2V5IGluIHF1ZXJpZXMpIHtcbiAgICAgICAgdmFyIHEgPSBxdWVyaWVzW2tleV0udG9Mb3dlckNhc2UoKTtcbiAgICAgICAgaWYgKHEuaW5kZXhPZihpbnB1dCkgPT09IDAgJiYgcS5sZW5ndGggPiBxdWVyeS5sZW5ndGgpIHtcbiAgICAgICAgICBxdWVyeSA9IHE7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiBxdWVyeTtcbiAgICB9XG4gICAgaWYgKHVybGJhciA9PSAnd3d3LicgfHwgdXJsYmFyID09ICdodHRwOi8vJyB8fCB1cmxiYXIuc3Vic3RyKHVybGJhci5pbmRleE9mKCc6Ly8nKSArIDMpID09ICd3d3cuJyB8fCB1cmxiYXIgPT09ICcnKVxuICAgICAgcmV0dXJuIHt9O1xuXG4gICAgdmFyIHVybCA9IHV0aWxzLnNpbXBsaWZ5VXJsKHBhdHRlcm4udXJsKTtcbiAgICB1cmwgPSB1dGlscy5nZW5lcmFsaXplVXJsKHVybCwgdHJ1ZSk7XG4gICAgdmFyIGlucHV0ID0gdXRpbHMuZ2VuZXJhbGl6ZVVybCh1cmxiYXIpO1xuICAgIGlmICh1cmxiYXJbdXJsYmFyLmxlbmd0aCAtIDFdID09ICcvJykgaW5wdXQgKz0gJy8nO1xuXG4gICAgdmFyIGF1dG9jb21wbGV0ZSA9IGZhbHNlLFxuICAgICAgaGlnaGxpZ2h0ID0gZmFsc2UsXG4gICAgICBzZWxlY3Rpb25TdGFydCA9IDAsXG4gICAgICB1cmxiYXJDb21wbGV0ZWQgPSAnJztcbiAgICB2YXIgcXVlcnlNYXRjaCA9IG1hdGNoUXVlcnkocGF0dGVybi5xdWVyeSk7XG5cbiAgICAvLyBVcmxcbiAgICBpZiAodXJsLmluZGV4T2YoaW5wdXQpID09PSAwICYmIHVybCAhPSBpbnB1dCAmJlxuICAgICAgICh1cmwubGVuZ3RoIC0gaW5wdXQubGVuZ3RoKSA8PSBNQVhfQVVUT0NPTVBMRVRFX0xFTkdUSCkge1xuICAgICAgYXV0b2NvbXBsZXRlID0gdHJ1ZTtcbiAgICAgIGhpZ2hsaWdodCA9IHRydWU7XG4gICAgICB1cmxiYXJDb21wbGV0ZWQgPSB1cmxiYXIgKyB1cmwuc3Vic3RyaW5nKHVybC5pbmRleE9mKGlucHV0KSArIGlucHV0Lmxlbmd0aCk7XG4gICAgfVxuXG4gICAgaWYgKGF1dG9jb21wbGV0ZSkge1xuICAgICAgc2VsZWN0aW9uU3RhcnQgPSB1cmxiYXIudG9Mb3dlckNhc2UoKS5sYXN0SW5kZXhPZihpbnB1dCkgKyBpbnB1dC5sZW5ndGg7XG4gICAgfVxuXG4gICAgLy8gQWRqdXN0IHVybCB0byB1c2VyIHByb3RvY29sXG4gICAgaWYgKHVybGJhci5pbmRleE9mKCc6Ly8nKSAhPSAtMSkge1xuICAgICAgdmFyIHByb3RfdXNlciA9IHVybGJhci5zdWJzdHIoMCwgdXJsYmFyLmluZGV4T2YoJzovLycpICsgMyk7XG4gICAgICB2YXIgcHJvdF9hdXRvID0gcGF0dGVybi51cmwuc3Vic3RyKDAsIHBhdHRlcm4udXJsLmluZGV4T2YoJzovLycpICsgMyk7XG4gICAgICBwYXR0ZXJuLnVybCA9IHBhdHRlcm4udXJsLnJlcGxhY2UocHJvdF9hdXRvLCBwcm90X3VzZXIpO1xuICAgIH1cblxuICAgIHJldHVybiB7XG4gICAgICB1cmw6IHVybCxcbiAgICAgIGZ1bGxfdXJsOiBwYXR0ZXJuLnVybCxcbiAgICAgIGF1dG9jb21wbGV0ZTogYXV0b2NvbXBsZXRlLFxuICAgICAgdXJsYmFyOiB1cmxiYXJDb21wbGV0ZWQsXG4gICAgICBzZWxlY3Rpb25TdGFydDogc2VsZWN0aW9uU3RhcnQsXG4gICAgICBoaWdobGlnaHQ6IGhpZ2hsaWdodFxuICAgIH07XG4gIH0sXG5cbiAgLy8gQXR0YWNoIGEgbGlzdCBvZiBVUkxzIHRvIGEgY2x1c3RlciByZXN1bHRcbiAgX2F0dGFjaFVSTHM6IGZ1bmN0aW9uKHJlc3VsdCwgdXJscywgd2l0aF9mYXZpY29uKSB7XG4gICAgcmVzdWx0LmRhdGEudXJscyA9IFtdO1xuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCB1cmxzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgZG9tYWluID0gdXRpbHMuZ2VuZXJhbGl6ZVVybCh1cmxzW2ldLnVybCwgdHJ1ZSkuc3BsaXQoJy8nKVswXSxcbiAgICAgICAgICB1cmwgPSB1cmxzW2ldLnVybDtcblxuICAgICAgaWYgKHVybFt1cmwubGVuZ3RoIC0gMV0gPT0gJy8nKSB1cmwgPSB1cmwuc3Vic3RyaW5nKDAsIHVybC5sZW5ndGggLSAxKTtcblxuICAgICAgdmFyIGZhdmljb24gPSB3aXRoX2Zhdmljb24gJiYgKHVybHNbaV0uZmF2aWNvbiA9PSBGRl9ERUZfRkFWSUNPTiA/IFFfREVGX0ZBVklDT04gOiB1cmxzW2ldLmZhdmljb24pLFxuICAgICAgICAgIGNsZWFuVXJsID0gdXRpbHMuY2xlYW5VcmxQcm90b2NvbCh1dGlscy5zaW1wbGlmeVVybCh1cmwpLCB0cnVlKTtcblxuICAgICAgdmFyIGl0ZW0gPSB7XG4gICAgICAgIGhyZWY6IHVybHNbaV0udXJsLFxuICAgICAgICBsaW5rOiBjbGVhblVybCxcbiAgICAgICAgZG9tYWluOiBjbGVhblVybC5zcGxpdCgnLycpWzBdLFxuICAgICAgICB0aXRsZTogdXJsc1tpXS50aXRsZSxcbiAgICAgICAgZXh0cmE6ICdoaXN0b3J5LScgKyBpLFxuICAgICAgICBmYXZpY29uOiBmYXZpY29uLFxuICAgICAgICAvLyBsb2dvIGlzIG9ubHkgbmVjZXNzYXJ5IGZvciAzLXVwIG1pbmktaGlzdG9yeSB2aWV3LCB0aGlzIGNhbiBiZSByZW1vdmVkIGlmIHRoYXQgaXMgcmV0aXJlZFxuICAgICAgICBsb2dvOiBDbGlxelV0aWxzLmdldExvZ29EZXRhaWxzKENsaXF6VXRpbHMuZ2V0RGV0YWlsc0Zyb21VcmwodXJsc1tpXS51cmwpKSxcbiAgICAgICAga2luZDogWydIJ10sXG4gICAgICB9O1xuXG4gICAgICBpZiAodXJsc1tpXS5oYXNPd25Qcm9wZXJ0eSgneHRyYV9jJykpIHtcbiAgICAgICAgaXRlbVsneHRyYV9jJ10gPSB1cmxzW2ldWyd4dHJhX2MnXTtcbiAgICAgICAgaXRlbVsnY2xhc3MtY29sLWNsdXN0ZXInXSA9ICdjcXotY29sLTEyJztcbiAgICAgICAgLy9pdGVtWydjbGFzcy1jb2wtcXVlcnknXSA9ICdjcXotY29sLTAnO1xuICAgICAgfVxuXG4gICAgICBpZiAodXJsc1tpXS5oYXNPd25Qcm9wZXJ0eSgneHRyYV9xJykpIHtcbiAgICAgICAgaXRlbVsneHRyYV9xJ10gPSB1cmxzW2ldWyd4dHJhX3EnXTtcbiAgICAgICAgaXRlbVsnY2xhc3MtY29sLWNsdXN0ZXInXSA9ICdjcXotY29sLTgnO1xuICAgICAgICBpdGVtWydjbGFzcy1jb2wtcXVlcnknXSA9ICdjcXotY29sLTQnO1xuICAgICAgfVxuXG4gICAgICByZXN1bHQuZGF0YS51cmxzLnB1c2goaXRlbSk7XG5cbiAgICAgIGlmICgocmVzdWx0LmRhdGEudXJscy5sZW5ndGggPiA5ICYmIHJlc3VsdC5kYXRhLnRlbXBsYXRlID09ICdwYXR0ZXJuLWgxJykgfHxcbiAgICAgICAgICAocmVzdWx0LmRhdGEudXJscy5sZW5ndGggPiA1ICYmIHJlc3VsdC5kYXRhLnRlbXBsYXRlID09ICdwYXR0ZXJuLWgyJykgfHxcbiAgICAgICAgICAocmVzdWx0LmRhdGEudXJscy5sZW5ndGggPiAyICYmIHJlc3VsdC5kYXRhLnRlbXBsYXRlID09ICdwYXR0ZXJuLWgzJykpIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICAvLyBDcmVhdGVzIG9uZSAob3IgcG90ZW50aWFsbHkgbW9yZSkgaW5zdGFudCByZXN1bHRzIGJhc2VkIG9uIGhpc3RvcnlcbiAgY3JlYXRlSW5zdGFudFJlc3VsdDogZnVuY3Rpb24ocmVzLCBzZWFyY2hTdHJpbmcsIGNhbGxiYWNrLCBjdXN0b21SZXN1bHRzKSB7XG4gICAgdmFyIGluc3RhbnRfcmVzdWx0cyA9IFtdO1xuICAgIHZhciByZXN1bHRzID0gcmVzLmZpbHRlcmVkUmVzdWx0cygpO1xuICAgIHZhciBwcm9taXNlcyA9IFtdO1xuXG4gICAgaWYgKHJlc3VsdHMubGVuZ3RoID09PSAwICYmICFyZXMudXJscykge1xuICAgICAgLy8gbm8gcmVzdWx0cywgc28gZG8gbm90aGluZ1xuXG4gICAgfSBlbHNlIGlmIChyZXMudXJscykge1xuICAgICAgLy8gUnVsZS1iYXNlZCBjbHVzdGVyaW5nIGhhcyBhbHJlYWR5IGJlZW4gcGVyZm9ybWVkLCBqdXN0IHRha2UgdGhlIGVudHJ5IGFzIGl0IGlzXG4gICAgICB2YXIgaW5zdGFudCA9IFJlc3VsdC5nZW5lcmljKCdjbGlxei1wYXR0ZXJuJywgcmVzLnVybCwgbnVsbCwgcmVzLnRpdGxlLCBudWxsLCBzZWFyY2hTdHJpbmcsIHJlcyk7XG4gICAgICBpbnN0YW50LmNvbW1lbnQgKz0gJyAoaGlzdG9yeSBydWxlcyBjbHVzdGVyKSc7XG4gICAgICAvLyBvdmVycmlkZSB3aXRoIGFueSB0aXRsZXMgd2UgaGF2ZSBzYXZlZFxuICAgICAgLy9wcm9taXNlcy5wdXNoKENsaXF6SGlzdG9yeUNsdXN0ZXIuX2dldFRpdGxlKGluc3RhbnQpKTtcblxuICAgICAgaW5zdGFudC5kYXRhLnRlbXBsYXRlID0gJ3BhdHRlcm4taDInO1xuICAgICAgaW5zdGFudC5kYXRhLmNsdXN0ZXIgPSB0cnVlOyAvLyBhIGhpc3RvcnkgY2x1c3RlciBiYXNlZCBvbiBhIGRlc3RpbmF0aW9uIGJldFxuICAgICAgaW5zdGFudF9yZXN1bHRzLnB1c2goaW5zdGFudCk7XG5cbiAgICB9IGVsc2UgaWYgKHNlYXJjaFN0cmluZy5sZW5ndGggPT09IDAgJiYgY3VzdG9tUmVzdWx0cyA9PT0gbnVsbCApIHtcbiAgICAgIC8vIHNwZWNpYWwgY2FzZSBmb3IgdXNlciByZXF1ZXN0IG9mIHRvcCBzaXRlcyBmcm9tIGhpc3RvcnlcbiAgICAgIHZhciBpbnN0YW50ID0gUmVzdWx0LmdlbmVyaWMoJ2NsaXF6LXBhdHRlcm4nLCAnJywgbnVsbCwgJycsIG51bGwsIHNlYXJjaFN0cmluZyk7XG4gICAgICBpbnN0YW50LmRhdGEudGl0bGUgPSB1dGlscy5nZXRMb2NhbGl6ZWRTdHJpbmcoJ2hpc3RvcnlfcmVzdWx0c19jbHVzdGVyJyk7XG4gICAgICBpbnN0YW50LmRhdGEudXJsID0gcmVzdWx0c1swXS51cmw7XG4gICAgICBpbnN0YW50LmNvbW1lbnQgKz0gJyAoaGlzdG9yeSB0b3Agc2l0ZXMpISc7XG4gICAgICBpbnN0YW50LmRhdGEudGVtcGxhdGUgPSAncGF0dGVybi1oMSc7XG4gICAgICBpbnN0YW50LmRhdGEuZ2VuZXJpYyA9IHRydWU7XG5cbiAgICAgIHRoaXMuX2F0dGFjaFVSTHMoaW5zdGFudCwgcmVzdWx0cyk7XG5cbiAgICAgIGluc3RhbnRfcmVzdWx0cy5wdXNoKGluc3RhbnQpO1xuXG4gICAgfSBlbHNlIGlmIChyZXMuY2x1c3Rlcikge1xuICAgICAgLy8gZG9tYWluLWJhc2VkIGNsdXN0ZXJcbiAgICAgIHZhciBpbnN0YW50ID0gUmVzdWx0LmdlbmVyaWMoJ2NsaXF6LXBhdHRlcm4nLCByZXN1bHRzWzBdLnVybCwgbnVsbCwgcmVzdWx0c1swXS50aXRsZSwgbnVsbCwgc2VhcmNoU3RyaW5nKTtcbiAgICAgIHZhciB0aXRsZSA9IHJlc3VsdHNbMF0udGl0bGU7XG4gICAgICBpZiAoIXRpdGxlKSB7XG4gICAgICAgIHRpdGxlID0gcmVzdWx0c1swXS51cmw7XG4gICAgICAgIHV0aWxzLmxvZygnTm8gdGl0bGUsIGFzc2lnbmluZyAnICsgdGl0bGUsICdDbGlxekhpc3RvcnlDbHVzdGVyJyk7XG4gICAgICB9XG4gICAgICBpbnN0YW50LmRhdGEudGl0bGUgPSB0aXRsZTtcbiAgICAgIC8vIG92ZXJyaWRlIHdpdGggYW55IHRpdGxlcyB3ZSBoYXZlIHNhdmVkXG4gICAgICAvL3Byb21pc2VzLnB1c2goQ2xpcXpIaXN0b3J5Q2x1c3Rlci5fZ2V0VGl0bGUoaW5zdGFudCkpO1xuXG4gICAgICAvLyBnZXQgZGVzY3JpcHRpb24gaW4gY2FzZSB3ZSBuZWVkIGl0XG4gICAgICAvLyhpZiB0aGlzIGNsdXN0ZXIgaXMgY29udmVydGVkIGJhY2sgdG8gc2ltcGxlIGhpc3RvcnkpXG4gICAgICAvL3Byb21pc2VzLnB1c2goQ2xpcXpIaXN0b3J5Q2x1c3Rlci5fZ2V0RGVzY3JpcHRpb24oaW5zdGFudCkpO1xuXG4gICAgICBpbnN0YW50LmRhdGEudXJsID0gcmVzdWx0c1swXS51cmw7XG4gICAgICBpbnN0YW50LmNvbW1lbnQgKz0gJyAoaGlzdG9yeSBkb21haW4gY2x1c3RlcikhJztcbiAgICAgIGluc3RhbnQuZGF0YS50ZW1wbGF0ZSA9ICdwYXR0ZXJuLWgyJztcbiAgICAgIGluc3RhbnQuZGF0YS5hdXRvQWRkID0gcmVzdWx0c1swXS5hdXRvQWRkO1xuICAgICAgaW5zdGFudC5kYXRhLmNsdXN0ZXIgPSB0cnVlOyAvLyBhIGhpc3RvcnkgY2x1c3RlciBiYXNlZCBvbiBhIGRlc3RpbmF0aW9uIGJldFxuXG4gICAgICAvLyBmaXJzdCBlbnRyeSBpcyB1c2VkIGFzIHRoZSBtYWluIFVSTCBvZiB0aGlzIGNsdXN0ZXIsIHJlbW92ZSBmcm9tIHJlbWFpbmluZyByZXN1bHQgbGlzdFxuICAgICAgcmVzdWx0cy5zaGlmdCgpO1xuXG4gICAgICBDbGlxekhpc3RvcnlDbHVzdGVyLl9hdHRhY2hVUkxzKGluc3RhbnQsIHJlc3VsdHMpO1xuXG4gICAgICBpbnN0YW50X3Jlc3VsdHMucHVzaChpbnN0YW50KTtcblxuICAgIH0gZWxzZSBpZiAocmVzdWx0cy5sZW5ndGggPCAzKSB7XG4gICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHJlc3VsdHMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGluc3RhbnQgPSBSZXN1bHQuZ2VuZXJpYygnZmF2aWNvbicsIHJlc3VsdHNbaV0udXJsLCBudWxsLCByZXN1bHRzW2ldLnRpdGxlLCBudWxsLCBzZWFyY2hTdHJpbmcpO1xuICAgICAgICBpbnN0YW50LmNvbW1lbnQgKz0gJyAoaGlzdG9yeSBnZW5lcmljKSEnO1xuICAgICAgICBpbnN0YW50LmRhdGEua2luZCA9IFsnSCddO1xuICAgICAgICAvL3Byb21pc2VzLnB1c2goQ2xpcXpIaXN0b3J5Q2x1c3Rlci5fZ2V0RGVzY3JpcHRpb24oaW5zdGFudCkpO1xuICAgICAgICBpbnN0YW50X3Jlc3VsdHMucHVzaChpbnN0YW50KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgLy8gMy11cCBjb21iaW5lZCBnZW5lcmljIGhpc3RvcnkgZW50cnlcbiAgICAgIHZhciBpbnN0YW50ID0gUmVzdWx0LmdlbmVyaWMoJ2NsaXF6LXBhdHRlcm4nLCAnJywgbnVsbCwgJycsIG51bGwsIHNlYXJjaFN0cmluZyk7XG4gICAgICBpbnN0YW50LmRhdGEudGl0bGUgPSAnJztcbiAgICAgIGluc3RhbnQuY29tbWVudCArPSAnIChoaXN0b3J5IGdlbmVyaWMpISc7XG4gICAgICBpbnN0YW50LmRhdGEudGVtcGxhdGUgPSAncGF0dGVybi1oMyc7XG4gICAgICBpbnN0YW50LmRhdGEuZ2VuZXJpYyA9IHRydWU7XG5cbiAgICAgIHRoaXMuX2F0dGFjaFVSTHMoaW5zdGFudCwgcmVzdWx0cywgdHJ1ZSk7XG4gICAgICBpbnN0YW50X3Jlc3VsdHMucHVzaChpbnN0YW50KTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mKFByb21pc2UpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgLy8gRmlyZWZveCB2ZXJzaW9ucyA8IDI5XG4gICAgICBjYWxsYmFjayhpbnN0YW50X3Jlc3VsdHMsICdjbGlxei1wcm9kJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgY2FsbGJhY2soaW5zdGFudF9yZXN1bHRzLCAnY2xpcXotcHJvZCcpO1xuICAgICAgfSk7XG4gICAgfVxuICB9LFxuICAvLyBDcmVhdGVzIG9uZSAob3IgcG90ZW50aWFsbHkgbW9yZSkgaW5zdGFudCByZXN1bHRzIGJhc2VkIG9uIGhpc3RvcnlcbiAgc2ltcGxlQ3JlYXRlSW5zdGFudFJlc3VsdDogZnVuY3Rpb24ocmVzLCBjb250LCBzZWFyY2hTdHJpbmcsIGNhbGxiYWNrKSB7XG4gICAgdmFyIGluc3RhbnRfcmVzdWx0cyA9IFtdO1xuICAgIC8vdmFyIHJlc3VsdHMgPSByZXMuZmlsdGVyZWRSZXN1bHRzKCk7XG4gICAgdmFyIHJlc3VsdHMgPSByZXMucmVzdWx0cztcbiAgICB2YXIgcHJvbWlzZXMgPSBbXTtcblxuICAgIGlmIChyZXN1bHRzLmxlbmd0aCA9PT0gMCAmJiAhcmVzLnVybHMpIHtcbiAgICAgIC8vIG5vIHJlc3VsdHMsIHNvIGRvIG5vdGhpbmdcblxuICAgIH0gZWxzZSB7XG4gICAgICAvLyBnZW5lcmljIGhpc3RvcnlcbiAgICAgIHZhciBzaW1wbGVfZ2VuZXJpYyA9IENsaXF6VXRpbHMuZ2V0UHJlZignc2ltcGxlSGlzdG9yeScsIGZhbHNlKTtcbiAgICAgIC8vdmFyIHNpbXBsZV9nZW5lcmljID0gdHJ1ZTtcblxuICAgICAgLy8gMy11cCBjb21iaW5lZCBnZW5lcmljIGhpc3RvcnkgZW50cnlcbiAgICAgIHZhciBpbnN0YW50ID0gUmVzdWx0LmdlbmVyaWMoJ2NsaXF6LXBhdHRlcm4nLCAnJywgbnVsbCwgJycsIG51bGwsIHNlYXJjaFN0cmluZyk7XG4gICAgICBpbnN0YW50LmRhdGEudGl0bGUgPSAnJztcbiAgICAgIGluc3RhbnQuY29tbWVudCArPSAnIChoaXN0b3J5IGdlbmVyaWMpISc7XG5cbiAgICAgIC8vXG4gICAgICAvLyBUaGVyZSBpcyBzbyBtYW55IGxldmVscyBvZiBhYnN0cmFjdGlvbiBoZXJlIHRoYXQgaXMgaW1wb3NzaWJsZSB0byBmb2xsb3csXG4gICAgICAvLyA1IGZ1bmN0aW9uIHRvIGJlIGFibGUgdG8gcHJpbnRvdXQgc29tZXRoaW5nLCBzdGFjayBvdmVyZmxvdyA6LS9cbiAgICAgIC8vXG4gICAgICBpbnN0YW50LmRhdGEudGVtcGxhdGUgPSAncGF0dGVybi1obSc7XG4gICAgICAvL2luc3RhbnQuZGF0YS50ZW1wbGF0ZSA9ICdwYXR0ZXJuLWgzJztcblxuICAgICAgaW5zdGFudC5kYXRhLmdlbmVyaWMgPSB0cnVlO1xuXG4gICAgICBpbnN0YW50LmRhdGEuY29udCA9IGNvbnQ7XG5cbiAgICAgIHRoaXMuX2F0dGFjaFVSTHMoaW5zdGFudCwgcmVzdWx0cywgdHJ1ZSk7XG5cbiAgICAgIGluc3RhbnRfcmVzdWx0cy5wdXNoKGluc3RhbnQpO1xuICAgIH1cblxuICAgIGlmICh0eXBlb2YoUHJvbWlzZSkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAvLyBGaXJlZm94IHZlcnNpb25zIDwgMjlcbiAgICAgIGNhbGxiYWNrKGluc3RhbnRfcmVzdWx0cywgJ2htJyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIFByb21pc2UuYWxsKHByb21pc2VzKS50aGVuKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgY2FsbGJhY2soaW5zdGFudF9yZXN1bHRzLCAnaG0nKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcbiAgLy8gUmVtb3ZlcyBhIGdpdmVuIHVybCBmcm9tIHRoZSBpbnN0YW50LmRhdGEudXJsIGxpc3RcbiAgcmVtb3ZlVXJsRnJvbVJlc3VsdDogZnVuY3Rpb24odXJsTGlzdCwgX3VybCkge1xuICAgIHZhciB1cmwgPSB1dGlscy5nZW5lcmFsaXplVXJsKF91cmwpO1xuICAgIGZvciAodmFyIGtleSBpbiB1cmxMaXN0KSB7XG4gICAgICB2YXIgcl91cmwgPSB1dGlscy5nZW5lcmFsaXplVXJsKHVybExpc3Rba2V5XS5ocmVmKTtcbiAgICAgIGlmIChyX3VybCA9PSB1cmwpIHtcbiAgICAgICAgdXJsTGlzdC5zcGxpY2Uoa2V5LCAxKTtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgIH1cbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgQ2xpcXpIaXN0b3J5Q2x1c3RlcjtcbiJdfQ==