System.register('adblocker/filters-engine', ['antitracking/domain', 'antitracking/url', 'adblocker/utils', 'adblocker/filters-parsing', 'adblocker/filters-matching'], function (_export) {
	'use strict';

	var TLDs, URLInfo, log, parseList, parseJSResource, match, TOKEN_BLACKLIST, FuzzyIndex, FilterReverseIndex, FilterHostnameDispatch, FilterSourceDomainDispatch, CosmeticBucket, CosmeticEngine, _default;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	_export('tokenizeURL', tokenizeURL);

	function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	function tokenizeHostname(hostname) {
		return hostname.split('.').filter(function (token) {
			return token && !TLDs[token] && !TOKEN_BLACKLIST.has(token);
		});
	}

	function tokenizeURL(pattern) {
		return pattern.match(/[a-zA-Z0-9]+/g) || [];
	}

	return {
		setters: [function (_antitrackingDomain) {
			TLDs = _antitrackingDomain.TLDs;
		}, function (_antitrackingUrl) {
			URLInfo = _antitrackingUrl.URLInfo;
		}, function (_adblockerUtils) {
			log = _adblockerUtils.log;
		}, function (_adblockerFiltersParsing) {
			parseList = _adblockerFiltersParsing['default'];
			parseJSResource = _adblockerFiltersParsing.parseJSResource;
		}, function (_adblockerFiltersMatching) {
			match = _adblockerFiltersMatching['default'];
		}],
		execute: function () {
			TOKEN_BLACKLIST = new Set(['com', 'http', 'https', 'icon', 'images', 'img', 'js', 'net', 'news', 'www']);

			FuzzyIndex = (function () {
				function FuzzyIndex(tokenizer, buildBucket, indexOnlyOne) {
					_classCallCheck(this, FuzzyIndex);

					// Define tokenizer
					this.tokenizer = tokenizer;
					if (this.tokenizer === undefined) {
						this.tokenizer = function (key, cb) {
							tokenizeURL(key).forEach(cb);
						};
					}

					// Should we index with all tokens, or just one
					this.indexOnlyOne = indexOnlyOne;

					// Function used to create a new bucket
					this.buildBucket = buildBucket;
					if (this.buildBucket === undefined) {
						this.buildBucket = function () {
							return [];
						};
					}

					// {token -> list of values}
					this.index = new Map();
					this.size = 0;
				}

				/* A filter reverse index is the lowest level of optimization we apply on filter
     * matching. To avoid inspecting filters that have no chance of matching, we
     * dispatch them in an index { ngram -> list of filter }.
     *
     * When we need to know if there is a match for an URL, we extract ngrams from it
     * and find all the buckets for which filters contains at list one of the ngram of
     * the URL. We then stop at the first match.
     */

				_createClass(FuzzyIndex, [{
					key: 'set',
					value: function set(key, value) {
						var _this = this;

						// Only true if we insert something (we have at least 1 token)
						log('SET ' + key);
						var inserted = false;
						var insertValue = function insertValue(token) {
							log('FOUND TOKEN ' + token);
							if (!(_this.indexOnlyOne && inserted)) {
								inserted = true;
								var bucket = _this.index.get(token);
								if (bucket === undefined) {
									var newBucket = _this.buildBucket(token);
									newBucket.push(value);
									_this.index.set(token, newBucket);
								} else {
									bucket.push(value);
								}
							}
						};

						// Split tokens into good, common, tld
						// common: too common tokens
						// tld: corresponding to hostname extensions
						// good: anything else
						// TODO: What about trying to insert bigger tokens first?
						var goodTokens = [];
						var commonTokens = [];
						var tldTokens = [];
						this.tokenizer(key, function (token) {
							if (TOKEN_BLACKLIST.has(token)) {
								commonTokens.push(token);
							} else if (TLDs[token]) {
								tldTokens.push(token);
							} else {
								goodTokens.push(token);
							}
						});

						// Try to insert
						goodTokens.forEach(insertValue);
						if (!inserted) {
							tldTokens.forEach(insertValue);
						}
						if (!inserted) {
							commonTokens.forEach(insertValue);
						}

						if (inserted) {
							this.size += 1;
						}

						return inserted;
					}
				}, {
					key: 'getFromKey',
					value: function getFromKey(key) {
						var _this2 = this;

						var buckets = [];
						this.tokenizer(key, function (token) {
							var bucket = _this2.index.get(token);
							if (bucket !== undefined) {
								log('BUCKET ' + token + ' size ' + bucket.length);
								buckets.push(bucket);
							}
						});
						return buckets;
					}
				}, {
					key: 'getFromTokens',
					value: function getFromTokens(tokens) {
						var _this3 = this;

						var buckets = [];
						tokens.forEach(function (token) {
							var bucket = _this3.index.get(token);
							if (bucket !== undefined) {
								log('BUCKET ' + token + ' size ' + bucket.length);
								buckets.push(bucket);
							}
						});
						return buckets;
					}
				}, {
					key: 'length',
					get: function get() {
						return this.size;
					}
				}]);

				return FuzzyIndex;
			})();

			FilterReverseIndex = (function () {
				function FilterReverseIndex(name, filters) {
					_classCallCheck(this, FilterReverseIndex);

					// Name of this index (for debugging purpose)
					this.name = name;

					// Remaining filters not stored in the index
					this.miscFilters = [];
					this.size = 0;

					// Tokenizer used on patterns for fuzzy matching
					this.tokenizer = function (pattern, cb) {
						pattern.split(/[*^]/g).forEach(function (part) {
							tokenizeURL(part).forEach(cb);
						});
					};
					this.index = new FuzzyIndex(this.tokenizer, undefined, true);

					// Update index
					if (filters) {
						filters.forEach(this.push.bind(this));
					}
				}

				/* A Bucket manages a subsets of all the filters. To avoid matching too many
     * useless filters, there is a second level of dispatch here.
     *
     * [ hostname anchors (||filter) ]    [ remaining filters ]
     *
     * The first structure map { domain -> filters that apply only on domain }
     * as the `hostname anchors` only apply on a specific domain name.
     *
     * Each group of filters is stored in a Filter index that is the last level
     * of dispatch of our matching engine.
     */

				_createClass(FilterReverseIndex, [{
					key: 'push',
					value: function push(filter) {
						log('REVERSE INDEX ' + this.name + ' INSERT ' + filter.rawLine);
						++this.size;
						var inserted = this.index.set(filter.filterStr, filter);

						if (!inserted) {
							log(this.name + ' MISC FILTER ' + filter.rawLine);
							this.miscFilters.push(filter);
						}
					}
				}, {
					key: 'matchList',
					value: function matchList(request, list, checkedFilters) {
						for (var i = 0; i < list.length; i++) {
							var filter = list[i];
							if (!checkedFilters.has(filter.id)) {
								checkedFilters.add(filter.id);
								if (match(filter, request)) {
									log('INDEX ' + this.name + ' MATCH ' + filter.rawLine + ' ~= ' + request.url);
									return filter;
								}
							}
						}
						return null;
					}
				}, {
					key: 'match',
					value: function match(request, checkedFilters) {
						// Keep track of filters checked
						if (checkedFilters === undefined) {
							checkedFilters = new Set();
						}

						var buckets = this.index.getFromTokens(request.tokens);

						var _iteratorNormalCompletion = true;
						var _didIteratorError = false;
						var _iteratorError = undefined;

						try {
							for (var _iterator = buckets[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
								var bucket = _step.value;

								log('INDEX ' + this.name + ' BUCKET => ' + bucket.length);
								if (this.matchList(request, bucket, checkedFilters) !== null) {
									return true;
								}
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

						log('INDEX ' + this.name + ' ' + this.miscFilters.length + ' remaining filters checked');

						// If no match found, check regexes
						return this.matchList(request, this.miscFilters, checkedFilters) !== null;
					}
				}, {
					key: 'length',
					get: function get() {
						return this.size;
					}
				}]);

				return FilterReverseIndex;
			})();

			FilterHostnameDispatch = (function () {
				function FilterHostnameDispatch(name, filters) {
					_classCallCheck(this, FilterHostnameDispatch);

					// TODO: Dispatch also on:
					// - fromImage
					// - fromMedia
					// - fromObject
					// - fromObjectSubrequest
					// - fromOther
					// - fromPing
					// - fromScript
					// - fromStylesheet
					// - fromXmlHttpRequest
					// To avoid matching filter if request type doesn't match
					// If we do it, we could simplify the match function of Filter

					this.name = name;
					this.size = 0;

					// ||hostname filter
					this.hostnameAnchors = new FuzzyIndex(
					// Tokenize key
					function (hostname, cb) {
						tokenizeHostname(hostname).forEach(cb);
					},
					// Create a new empty bucket
					function (token) {
						return new FilterReverseIndex(token + '_' + name);
					});

					// All other filters
					this.filters = new FilterReverseIndex(this.name);

					// Dispatch filters
					if (filters !== undefined) {
						filters.forEach(this.push.bind(this));
					}

					log(name + ' CREATE BUCKET: ' + this.filters.length + ' filters +' + (this.hostnameAnchors.size + ' hostnames'));
				}

				_createClass(FilterHostnameDispatch, [{
					key: 'push',
					value: function push(filter) {
						++this.size;

						log('PUSH ' + filter.rawLine);
						if (filter.hostname !== null) {
							this.hostnameAnchors.set(filter.hostname, filter);
						} else {
							this.filters.push(filter);
						}
					}
				}, {
					key: 'matchWithDomain',
					value: function matchWithDomain(request, domain, checkedFilters) {
						var buckets = this.hostnameAnchors.getFromKey(domain);
						var _iteratorNormalCompletion2 = true;
						var _didIteratorError2 = false;
						var _iteratorError2 = undefined;

						try {
							for (var _iterator2 = buckets[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
								var bucket = _step2.value;

								if (bucket !== undefined) {
									log(this.name + ' bucket try to match hostnameAnchors (' + domain + '/' + bucket.name + ')');
									if (bucket.match(request, checkedFilters)) {
										return true;
									}
								}
							}
						} catch (err) {
							_didIteratorError2 = true;
							_iteratorError2 = err;
						} finally {
							try {
								if (!_iteratorNormalCompletion2 && _iterator2['return']) {
									_iterator2['return']();
								}
							} finally {
								if (_didIteratorError2) {
									throw _iteratorError2;
								}
							}
						}

						return false;
					}
				}, {
					key: 'match',
					value: function match(request, checkedFilters) {
						if (checkedFilters === undefined) {
							checkedFilters = new Set();
						}

						if (this.matchWithDomain(request, request.hostname, checkedFilters)) {
							return true;
						}

						// Try to find a match with remaining filters
						log(this.name + ' bucket try to match misc');
						return this.filters.match(request, checkedFilters);
					}
				}, {
					key: 'length',
					get: function get() {
						return this.size;
					}
				}]);

				return FilterHostnameDispatch;
			})();

			FilterSourceDomainDispatch = (function () {
				function FilterSourceDomainDispatch(name, filters) {
					_classCallCheck(this, FilterSourceDomainDispatch);

					this.name = name;
					this.size = 0;

					// Dispatch on source domain
					this.sourceDomainDispatch = new Map();
					// Filters without source domain specified
					this.miscFilters = new FilterHostnameDispatch(this.name);

					if (filters) {
						filters.forEach(this.push.bind(this));
					}
				}

				/**
     * Dispatch cosmetics filters on selectors
     */

				_createClass(FilterSourceDomainDispatch, [{
					key: 'push',
					value: function push(filter) {
						var _this4 = this;

						++this.size;

						if (filter.optNotDomains === null && filter.optDomains !== null) {
							filter.optDomains.forEach(function (domain) {
								log('SOURCE DOMAIN DISPATCH ' + domain + ' filter: ' + filter.rawLine);
								var bucket = _this4.sourceDomainDispatch.get(domain);
								if (bucket === undefined) {
									var newIndex = new FilterHostnameDispatch(_this4.name + '_' + domain);
									newIndex.push(filter);
									_this4.sourceDomainDispatch.set(domain, newIndex);
								} else {
									bucket.push(filter);
								}
							});
						} else {
							this.miscFilters.push(filter);
						}
					}
				}, {
					key: 'match',
					value: function match(request, checkedFilters) {
						// Check bucket for source domain
						var bucket = this.sourceDomainDispatch.get(request.sourceGD);
						var foundMatch = false;
						if (bucket !== undefined) {
							log('Source domain dispatch ' + request.sourceGD + ' size ' + bucket.length);
							foundMatch = bucket.match(request, checkedFilters);
						}

						if (!foundMatch) {
							log('Source domain dispatch misc size ' + this.miscFilters.length);
							foundMatch = this.miscFilters.match(request, checkedFilters);
						}

						return foundMatch;
					}
				}, {
					key: 'length',
					get: function get() {
						return this.size;
					}
				}]);

				return FilterSourceDomainDispatch;
			})();

			CosmeticBucket = (function () {
				function CosmeticBucket(name, filters) {
					_classCallCheck(this, CosmeticBucket);

					this.name = name;
					this.size = 0;

					this.miscFilters = [];
					this.index = new FuzzyIndex(function (selector, cb) {
						selector.split(/[^#.\w_-]/g).filter(function (token) {
							return token.length > 0;
						}).forEach(cb);
					});

					if (filters) {
						filters.forEach(this.push.bind(this));
					}
				}

				_createClass(CosmeticBucket, [{
					key: 'push',
					value: function push(filter) {
						++this.size;
						var inserted = this.index.set(filter.selector, filter);

						if (!inserted) {
							log(this.name + ' MISC FILTER ' + filter.rawLine);
							this.miscFilters.push(filter);
						}
					}
				}, {
					key: 'getMatchingRules',
					value: function getMatchingRules(nodeInfo) {
						var _this5 = this;

						var rules = [].concat(_toConsumableArray(this.miscFilters));

						nodeInfo.forEach(function (node) {
							// [id, tagName, className] = node
							node.forEach(function (token) {
								_this5.index.getFromKey(token).forEach(function (bucket) {
									bucket.forEach(function (rule) {
										rules.push(rule);
									});
								});
							});
						});

						return rules;
					}
				}]);

				return CosmeticBucket;
			})();

			CosmeticEngine = (function () {
				function CosmeticEngine() {
					_classCallCheck(this, CosmeticEngine);

					this.size = 0;

					this.miscFilters = new CosmeticBucket('misc');
					this.cosmetics = new FuzzyIndex(function (hostname, cb) {
						tokenizeHostname(hostname).forEach(cb);
					}, function (token) {
						return new CosmeticBucket(token + '_cosmetics');
					});
				}

				/* Manage a list of filters and match them in an efficient way.
     * To avoid inspecting to many filters for each request, we create
     * the following accelerating structure:
     *
     * [ Importants ]    [ Exceptions ]    [ Remaining filters ]
     *
     * Each of theses is a `FilterHostnameDispatch`, which manage a subset of filters.
     *
     * Importants filters are not subject to exceptions, hence we try it first.
     * If no important filter matched, try to use the remaining filters bucket.
     * If we have a match, try to find an exception.
     */

				_createClass(CosmeticEngine, [{
					key: 'push',
					value: function push(filter) {
						var _this6 = this;

						if (filter.hostnames.length === 0) {
							this.miscFilters.push(filter);
						} else {
							filter.hostnames.forEach(function (hostname) {
								_this6.cosmetics.set(hostname, filter);
							});
						}
					}

					/**
      * Return a list of potential cosmetics filters
      *
      * @param {string} url - url of the page.
      * @param {Array} nodeInfo - Array of tuples [id, tagName, className].
     **/
				}, {
					key: 'getMatchingRules',
					value: function getMatchingRules(url, nodeInfo) {
						var uniqIds = new Set();
						var rules = [];
						var hostname = URLInfo.get(url).hostname;
						log('getMatchingRules ' + url + ' => ' + hostname + ' (' + JSON.stringify(nodeInfo) + ')');

						// Check misc bucket
						this.miscFilters.getMatchingRules(nodeInfo).forEach(function (rule) {
							if (!uniqIds.has(rule.id)) {
								log('Found rule ' + JSON.stringify(rule));
								uniqIds.add(rule.id);
								rules.push(rule);
							}
						});

						// Check hostname buckets
						this.cosmetics.getFromKey(hostname).forEach(function (bucket) {
							log('Found bucket ' + bucket.size);
							bucket.getMatchingRules(nodeInfo).forEach(function (rule) {
								if (!rule.scriptInject && !uniqIds.has(rule.id)) {
									log('Found rule ' + JSON.stringify(rule));
									uniqIds.add(rule.id);
									rules.push(rule);
								}
							});
						});

						log('COSMETICS found ' + rules.length + ' potential rules for ' + url);
						return rules;
					}

					/**
      * Return all the cosmetic filters on a domain
      *
      * @param {string} url - url of the page
     **/
				}, {
					key: 'getDomainRules',
					value: function getDomainRules(url, js) {
						var hostname = URLInfo.get(url).hostname;
						var rules = [];
						var uniqIds = new Set();
						log('getDomainRules ' + url + ' => ' + hostname);
						this.cosmetics.getFromKey(hostname).forEach(function (bucket) {
							var _iteratorNormalCompletion3 = true;
							var _didIteratorError3 = false;
							var _iteratorError3 = undefined;

							try {
								for (var _iterator3 = bucket.index.index.values()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
									var value = _step3.value;

									value.forEach(function (rule) {
										if (!uniqIds.has(rule.id)) {
											if (rule.scriptInject) {
												// make sure the selector was replaced by javascript
												if (!rule.scriptReplaced) {
													rule.selector = js.get(rule.selector);
													rule.scriptReplaced = true;
												}
											}
											if (rule.selector) {
												rules.push(rule);
												uniqIds.add(rule.id);
											}
										}
									});
								}
							} catch (err) {
								_didIteratorError3 = true;
								_iteratorError3 = err;
							} finally {
								try {
									if (!_iteratorNormalCompletion3 && _iterator3['return']) {
										_iterator3['return']();
									}
								} finally {
									if (_didIteratorError3) {
										throw _iteratorError3;
									}
								}
							}
						});
						return rules;
					}
				}, {
					key: 'length',
					get: function get() {
						return this.size;
					}
				}]);

				return CosmeticEngine;
			})();

			_default = (function () {
				function _default() {
					_classCallCheck(this, _default);

					this.lists = new Map();
					this.size = 0;

					// *************** //
					// Network filters //
					// *************** //

					// @@filter
					this.exceptions = new FilterSourceDomainDispatch('exceptions');
					// $important
					this.importants = new FilterSourceDomainDispatch('importants');
					// All other filters
					this.filters = new FilterSourceDomainDispatch('filters');

					// ***************** //
					// Cosmetic filters  //
					// ***************** //

					this.cosmetics = new CosmeticEngine();

					// injections
					this.js = new Map();
				}

				_createClass(_default, [{
					key: 'onUpdateResource',
					value: function onUpdateResource(asset, data) {
						// the resource containing javascirpts to be injected
						var js = parseJSResource(data).get('application/javascript');
						// TODO: handle other type
						if (js) {
							this.js = js;
						}
					}
				}, {
					key: 'onUpdateFilters',
					value: function onUpdateFilters(asset, newFilters) {
						// Network filters
						var filters = [];
						var exceptions = [];
						var importants = [];

						// Cosmetic filters
						var cosmetics = [];

						// Parse and dispatch filters depending on type
						var parsed = parseList(newFilters);

						parsed.networkFilters.forEach(function (filter) {
							if (filter.isException) {
								exceptions.push(filter);
							} else if (filter.isImportant) {
								importants.push(filter);
							} else {
								filters.push(filter);
							}
						});

						parsed.cosmeticFilters.forEach(function (filter) {
							cosmetics.push(filter);
						});

						if (!this.lists.has(asset)) {
							log('FILTER ENGINE ' + asset + ' UPDATE');
							// Update data structures
							this.size += filters.length + exceptions.length + importants.length + cosmetics.length;
							filters.forEach(this.filters.push.bind(this.filters));
							exceptions.forEach(this.exceptions.push.bind(this.exceptions));
							importants.forEach(this.importants.push.bind(this.importants));
							cosmetics.forEach(this.cosmetics.push.bind(this.cosmetics));

							this.lists.set(asset, { filters: filters, exceptions: exceptions, importants: importants, cosmetics: cosmetics });
						} else {
							log('FILTER ENGINE ' + asset + ' REBUILD');
							// Rebuild everything
							var _iteratorNormalCompletion4 = true;
							var _didIteratorError4 = false;
							var _iteratorError4 = undefined;

							try {
								for (var _iterator4 = this.lists.values()[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
									var list = _step4.value;

									list.filters.forEach(filters.push.bind(filters));
									list.exceptions.forEach(exceptions.push.bind(exceptions));
									list.importants.forEach(importants.push.bind(importants));
									list.cosmetics.forEach(cosmetics.push.bind(cosmetics));
								}
							} catch (err) {
								_didIteratorError4 = true;
								_iteratorError4 = err;
							} finally {
								try {
									if (!_iteratorNormalCompletion4 && _iterator4['return']) {
										_iterator4['return']();
									}
								} finally {
									if (_didIteratorError4) {
										throw _iteratorError4;
									}
								}
							}

							this.size = filters.length + exceptions.length + importants.length + cosmetics.length;
							this.filters = new FilterSourceDomainDispatch('filters', filters);
							this.exceptions = new FilterSourceDomainDispatch('exceptions', exceptions);
							this.importants = new FilterSourceDomainDispatch('importants', importants);
							this.cosmetics = new CosmeticEngine(cosmetics);
						}

						log('Filter engine updated with ' + filters.length + ' filters, ' + (exceptions.length + ' exceptions, ') + (importants.length + ' importants and ' + cosmetics.length + ' cosmetic filters\n'));
					}
				}, {
					key: 'getCosmeticsFilters',
					value: function getCosmeticsFilters(url, nodes) {
						return this.cosmetics.getMatchingRules(url, nodes);
					}
				}, {
					key: 'getDomainFilters',
					value: function getDomainFilters(url) {
						return this.cosmetics.getDomainRules(url, this.js);
					}
				}, {
					key: 'match',
					value: function match(request) {
						log('MATCH ' + JSON.stringify(request));
						request.tokens = tokenizeURL(request.url);

						var checkedFilters = new Set();
						var result = false;

						if (this.importants.match(request, checkedFilters)) {
							log('IMPORTANT');
							result = true;
						} else if (this.filters.match(request, checkedFilters)) {
							log('FILTER');
							if (this.exceptions.match(request, checkedFilters)) {
								log('EXCEPTION');
								result = false;
							} else {
								result = true;
							}
						}

						log('Total filters ' + checkedFilters.size);
						return result;
					}
				}]);

				return _default;
			})();

			_export('default', _default);
		}
	};
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFkYmxvY2tlci9maWx0ZXJzLWVuZ2luZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7NERBUU0sZUFBZSxFQTJCZixVQUFVLEVBbUhWLGtCQUFrQixFQXNGbEIsc0JBQXNCLEVBc0Z0QiwwQkFBMEIsRUE4RDFCLGNBQWMsRUE0Q2QsY0FBYzs7Ozs7Ozs7OztBQXRacEIsVUFBUyxnQkFBZ0IsQ0FBQyxRQUFRLEVBQUU7QUFDbkMsU0FBTyxRQUFRLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUN4QixNQUFNLENBQUMsVUFBQSxLQUFLO1VBQUssS0FBSyxJQUNyQixDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFDWixDQUFDLGVBQWUsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUFDO0dBQUMsQ0FBQyxDQUFDO0VBQ2pDOztBQUdNLFVBQVMsV0FBVyxDQUFDLE9BQU8sRUFBRTtBQUNwQyxTQUFPLE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLElBQUksRUFBRSxDQUFDO0VBQzVDOzs7OzhCQWhDUSxJQUFJOzs4QkFDSixPQUFPOzt5QkFFUCxHQUFHOzs7OENBQ1EsZUFBZTs7Ozs7QUFJN0Isa0JBQWUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxDQUMvQixLQUFLLEVBQ0wsTUFBTSxFQUNOLE9BQU8sRUFDUCxNQUFNLEVBQ04sUUFBUSxFQUNSLEtBQUssRUFDTCxJQUFJLEVBQ0osS0FBSyxFQUNMLE1BQU0sRUFDTixLQUFLLENBQ0wsQ0FBQzs7QUFnQkksYUFBVTtBQUNKLGFBRE4sVUFBVSxDQUNILFNBQVMsRUFBRSxXQUFXLEVBQUUsWUFBWSxFQUFFOzJCQUQ3QyxVQUFVOzs7QUFHZCxTQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztBQUMzQixTQUFJLElBQUksQ0FBQyxTQUFTLEtBQUssU0FBUyxFQUFFO0FBQ2pDLFVBQUksQ0FBQyxTQUFTLEdBQUcsVUFBQyxHQUFHLEVBQUUsRUFBRSxFQUFLO0FBQzdCLGtCQUFXLENBQUMsR0FBRyxDQUFD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ZXIvZmlsdGVycy1lbmdpbmUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBUTERzIH0gZnJvbSAnYW50aXRyYWNraW5nL2RvbWFpbic7XG5pbXBvcnQgeyBVUkxJbmZvIH0gZnJvbSAnYW50aXRyYWNraW5nL3VybCc7XG5cbmltcG9ydCB7IGxvZyB9IGZyb20gJ2FkYmxvY2tlci91dGlscyc7XG5pbXBvcnQgcGFyc2VMaXN0LCB7IHBhcnNlSlNSZXNvdXJjZSB9IGZyb20gJ2FkYmxvY2tlci9maWx0ZXJzLXBhcnNpbmcnO1xuaW1wb3J0IG1hdGNoIGZyb20gJ2FkYmxvY2tlci9maWx0ZXJzLW1hdGNoaW5nJztcblxuXG5jb25zdCBUT0tFTl9CTEFDS0xJU1QgPSBuZXcgU2V0KFtcblx0J2NvbScsXG5cdCdodHRwJyxcblx0J2h0dHBzJyxcblx0J2ljb24nLFxuXHQnaW1hZ2VzJyxcblx0J2ltZycsXG5cdCdqcycsXG5cdCduZXQnLFxuXHQnbmV3cycsXG5cdCd3d3cnLFxuXSk7XG5cblxuZnVuY3Rpb24gdG9rZW5pemVIb3N0bmFtZShob3N0bmFtZSkge1xuXHRyZXR1cm4gaG9zdG5hbWUuc3BsaXQoJy4nKVxuXHRcdC5maWx0ZXIodG9rZW4gPT4gKHRva2VuICYmXG5cdFx0XHRcdCFUTERzW3Rva2VuXSAmJlxuXHRcdFx0XHQhVE9LRU5fQkxBQ0tMSVNULmhhcyh0b2tlbikpKTtcbn1cblxuXG5leHBvcnQgZnVuY3Rpb24gdG9rZW5pemVVUkwocGF0dGVybikge1xuXHRyZXR1cm4gcGF0dGVybi5tYXRjaCgvW2EtekEtWjAtOV0rL2cpIHx8IFtdO1xufVxuXG5cbmNsYXNzIEZ1enp5SW5kZXgge1xuXHRjb25zdHJ1Y3Rvcih0b2tlbml6ZXIsIGJ1aWxkQnVja2V0LCBpbmRleE9ubHlPbmUpIHtcblx0XHQvLyBEZWZpbmUgdG9rZW5pemVyXG5cdFx0dGhpcy50b2tlbml6ZXIgPSB0b2tlbml6ZXI7XG5cdFx0aWYgKHRoaXMudG9rZW5pemVyID09PSB1bmRlZmluZWQpIHtcblx0XHRcdHRoaXMudG9rZW5pemVyID0gKGtleSwgY2IpID0+IHtcblx0XHRcdFx0dG9rZW5pemVVUkwoa2V5KS5mb3JFYWNoKGNiKTtcblx0XHRcdH07XG5cdFx0fVxuXG5cdFx0Ly8gU2hvdWxkIHdlIGluZGV4IHdpdGggYWxsIHRva2Vucywgb3IganVzdCBvbmVcblx0XHR0aGlzLmluZGV4T25seU9uZSA9IGluZGV4T25seU9uZTtcblxuXHRcdC8vIEZ1bmN0aW9uIHVzZWQgdG8gY3JlYXRlIGEgbmV3IGJ1Y2tldFxuXHRcdHRoaXMuYnVpbGRCdWNrZXQgPSBidWlsZEJ1Y2tldDtcblx0XHRpZiAodGhpcy5idWlsZEJ1Y2tldCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHR0aGlzLmJ1aWxkQnVja2V0ID0gKCkgPT4gW107XG5cdFx0fVxuXG5cdFx0Ly8ge3Rva2VuIC0+IGxpc3Qgb2YgdmFsdWVzfVxuXHRcdHRoaXMuaW5kZXggPSBuZXcgTWFwKCk7XG5cdFx0dGhpcy5zaXplID0gMDtcblx0fVxuXG5cdGdldCBsZW5ndGgoKSB7XG5cdFx0cmV0dXJuIHRoaXMuc2l6ZTtcblx0fVxuXG5cdHNldChrZXksIHZhbHVlKSB7XG5cdFx0Ly8gT25seSB0cnVlIGlmIHdlIGluc2VydCBzb21ldGhpbmcgKHdlIGhhdmUgYXQgbGVhc3QgMSB0b2tlbilcblx0XHRsb2coYFNFVCAke2tleX1gKTtcblx0XHRsZXQgaW5zZXJ0ZWQgPSBmYWxzZTtcblx0XHRjb25zdCBpbnNlcnRWYWx1ZSA9IHRva2VuID0+IHtcblx0XHRcdGxvZyhgRk9VTkQgVE9LRU4gJHt0b2tlbn1gKTtcblx0XHRcdGlmICghKHRoaXMuaW5kZXhPbmx5T25lICYmIGluc2VydGVkKSkge1xuXHRcdFx0XHRpbnNlcnRlZCA9IHRydWU7XG5cdFx0XHRcdGNvbnN0IGJ1Y2tldCA9IHRoaXMuaW5kZXguZ2V0KHRva2VuKTtcblx0XHRcdFx0aWYgKGJ1Y2tldCA9PT0gdW5kZWZpbmVkKSB7XG5cdFx0XHRcdFx0Y29uc3QgbmV3QnVja2V0ID0gdGhpcy5idWlsZEJ1Y2tldCh0b2tlbik7XG5cdFx0XHRcdFx0bmV3QnVja2V0LnB1c2godmFsdWUpO1xuXHRcdFx0XHRcdHRoaXMuaW5kZXguc2V0KHRva2VuLCBuZXdCdWNrZXQpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGJ1Y2tldC5wdXNoKHZhbHVlKTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH07XG5cblx0XHQvLyBTcGxpdCB0b2tlbnMgaW50byBnb29kLCBjb21tb24sIHRsZFxuXHRcdC8vIGNvbW1vbjogdG9vIGNvbW1vbiB0b2tlbnNcblx0XHQvLyB0bGQ6IGNvcnJlc3BvbmRpbmcgdG8gaG9zdG5hbWUgZXh0ZW5zaW9uc1xuXHRcdC8vIGdvb2Q6IGFueXRoaW5nIGVsc2Vcblx0XHQvLyBUT0RPOiBXaGF0IGFib3V0IHRyeWluZyB0byBpbnNlcnQgYmlnZ2VyIHRva2VucyBmaXJzdD9cblx0XHRjb25zdCBnb29kVG9rZW5zID0gW107XG5cdFx0Y29uc3QgY29tbW9uVG9rZW5zID0gW107XG5cdFx0Y29uc3QgdGxkVG9rZW5zID0gW107XG5cdFx0dGhpcy50b2tlbml6ZXIoa2V5LCB0b2tlbiA9PiB7XG5cdFx0XHRpZiAoVE9LRU5fQkxBQ0tMSVNULmhhcyh0b2tlbikpIHtcblx0XHRcdFx0Y29tbW9uVG9rZW5zLnB1c2godG9rZW4pO1xuXHRcdFx0fSBlbHNlIGlmIChUTERzW3Rva2VuXSkge1xuXHRcdFx0XHR0bGRUb2tlbnMucHVzaCh0b2tlbik7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRnb29kVG9rZW5zLnB1c2godG9rZW4pO1xuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0Ly8gVHJ5IHRvIGluc2VydFxuXHRcdGdvb2RUb2tlbnMuZm9yRWFjaChpbnNlcnRWYWx1ZSk7XG5cdFx0aWYgKCFpbnNlcnRlZCkge1xuXHRcdFx0dGxkVG9rZW5zLmZvckVhY2goaW5zZXJ0VmFsdWUpO1xuXHRcdH1cblx0XHRpZiAoIWluc2VydGVkKSB7XG5cdFx0XHRjb21tb25Ub2tlbnMuZm9yRWFjaChpbnNlcnRWYWx1ZSk7XG5cdFx0fVxuXG5cdFx0aWYgKGluc2VydGVkKSB7XG5cdFx0XHR0aGlzLnNpemUgKz0gMTtcblx0XHR9XG5cblx0XHRyZXR1cm4gaW5zZXJ0ZWQ7XG5cdH1cblxuXHRnZXRGcm9tS2V5KGtleSkge1xuXHRcdGNvbnN0IGJ1Y2tldHMgPSBbXTtcblx0XHR0aGlzLnRva2VuaXplcihrZXksIHRva2VuID0+IHtcblx0XHRcdGNvbnN0IGJ1Y2tldCA9IHRoaXMuaW5kZXguZ2V0KHRva2VuKTtcblx0XHRcdGlmIChidWNrZXQgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRsb2coYEJVQ0tFVCAke3Rva2VufSBzaXplICR7YnVja2V0Lmxlbmd0aH1gKTtcblx0XHRcdFx0YnVja2V0cy5wdXNoKGJ1Y2tldCk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0cmV0dXJuIGJ1Y2tldHM7XG5cdH1cblxuXHRnZXRGcm9tVG9rZW5zKHRva2Vucykge1xuXHRcdGNvbnN0IGJ1Y2tldHMgPSBbXTtcblx0XHR0b2tlbnMuZm9yRWFjaCh0b2tlbiA9PiB7XG5cdFx0XHRjb25zdCBidWNrZXQgPSB0aGlzLmluZGV4LmdldCh0b2tlbik7XG5cdFx0XHRpZiAoYnVja2V0ICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdFx0bG9nKGBCVUNLRVQgJHt0b2tlbn0gc2l6ZSAke2J1Y2tldC5sZW5ndGh9YCk7XG5cdFx0XHRcdGJ1Y2tldHMucHVzaChidWNrZXQpO1xuXHRcdFx0fVxuXHRcdH0pO1xuXHRcdHJldHVybiBidWNrZXRzO1xuXHR9XG59XG5cblxuLyogQSBmaWx0ZXIgcmV2ZXJzZSBpbmRleCBpcyB0aGUgbG93ZXN0IGxldmVsIG9mIG9wdGltaXphdGlvbiB3ZSBhcHBseSBvbiBmaWx0ZXJcbiAqIG1hdGNoaW5nLiBUbyBhdm9pZCBpbnNwZWN0aW5nIGZpbHRlcnMgdGhhdCBoYXZlIG5vIGNoYW5jZSBvZiBtYXRjaGluZywgd2VcbiAqIGRpc3BhdGNoIHRoZW0gaW4gYW4gaW5kZXggeyBuZ3JhbSAtPiBsaXN0IG9mIGZpbHRlciB9LlxuICpcbiAqIFdoZW4gd2UgbmVlZCB0byBrbm93IGlmIHRoZXJlIGlzIGEgbWF0Y2ggZm9yIGFuIFVSTCwgd2UgZXh0cmFjdCBuZ3JhbXMgZnJvbSBpdFxuICogYW5kIGZpbmQgYWxsIHRoZSBidWNrZXRzIGZvciB3aGljaCBmaWx0ZXJzIGNvbnRhaW5zIGF0IGxpc3Qgb25lIG9mIHRoZSBuZ3JhbSBvZlxuICogdGhlIFVSTC4gV2UgdGhlbiBzdG9wIGF0IHRoZSBmaXJzdCBtYXRjaC5cbiAqL1xuY2xhc3MgRmlsdGVyUmV2ZXJzZUluZGV4IHtcblx0Y29uc3RydWN0b3IobmFtZSwgZmlsdGVycykge1xuXHRcdC8vIE5hbWUgb2YgdGhpcyBpbmRleCAoZm9yIGRlYnVnZ2luZyBwdXJwb3NlKVxuXHRcdHRoaXMubmFtZSA9IG5hbWU7XG5cblx0XHQvLyBSZW1haW5pbmcgZmlsdGVycyBub3Qgc3RvcmVkIGluIHRoZSBpbmRleFxuXHRcdHRoaXMubWlzY0ZpbHRlcnMgPSBbXTtcblx0XHR0aGlzLnNpemUgPSAwO1xuXG5cdFx0Ly8gVG9rZW5pemVyIHVzZWQgb24gcGF0dGVybnMgZm9yIGZ1enp5IG1hdGNoaW5nXG5cdFx0dGhpcy50b2tlbml6ZXIgPSAocGF0dGVybiwgY2IpID0+IHtcblx0XHRcdHBhdHRlcm4uc3BsaXQoL1sqXl0vZykuZm9yRWFjaChwYXJ0ID0+IHtcblx0XHRcdFx0dG9rZW5pemVVUkwocGFydCkuZm9yRWFjaChjYik7XG5cdFx0XHR9KTtcblx0XHR9O1xuXHRcdHRoaXMuaW5kZXggPSBuZXcgRnV6enlJbmRleCh0aGlzLnRva2VuaXplciwgdW5kZWZpbmVkLCB0cnVlKTtcblxuXHRcdC8vIFVwZGF0ZSBpbmRleFxuXHRcdGlmIChmaWx0ZXJzKSB7XG5cdFx0XHRmaWx0ZXJzLmZvckVhY2godGhpcy5wdXNoLmJpbmQodGhpcykpO1xuXHRcdH1cblx0fVxuXG5cdGdldCBsZW5ndGgoKSB7XG5cdFx0cmV0dXJuIHRoaXMuc2l6ZTtcblx0fVxuXG5cdHB1c2goZmlsdGVyKSB7XG5cdFx0bG9nKGBSRVZFUlNFIElOREVYICR7dGhpcy5uYW1lfSBJTlNFUlQgJHtmaWx0ZXIucmF3TGluZX1gKTtcblx0XHQrK3RoaXMuc2l6ZTtcblx0XHRjb25zdCBpbnNlcnRlZCA9IHRoaXMuaW5kZXguc2V0KGZpbHRlci5maWx0ZXJTdHIsIGZpbHRlcik7XG5cblx0XHRpZiAoIWluc2VydGVkKSB7XG5cdFx0XHRsb2coYCR7dGhpcy5uYW1lfSBNSVNDIEZJTFRFUiAke2ZpbHRlci5yYXdMaW5lfWApO1xuXHRcdFx0dGhpcy5taXNjRmlsdGVycy5wdXNoKGZpbHRlcik7XG5cdFx0fVxuXHR9XG5cblx0bWF0Y2hMaXN0KHJlcXVlc3QsIGxpc3QsIGNoZWNrZWRGaWx0ZXJzKSB7XG5cdFx0Zm9yIChsZXQgaSA9IDA7IGkgPCBsaXN0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRjb25zdCBmaWx0ZXIgPSBsaXN0W2ldO1xuXHRcdFx0aWYgKCFjaGVja2VkRmlsdGVycy5oYXMoZmlsdGVyLmlkKSkge1xuXHRcdFx0XHRjaGVja2VkRmlsdGVycy5hZGQoZmlsdGVyLmlkKTtcblx0XHRcdFx0aWYgKG1hdGNoKGZpbHRlciwgcmVxdWVzdCkpIHtcblx0XHRcdFx0XHRsb2coYElOREVYICR7dGhpcy5uYW1lfSBNQVRDSCAke2ZpbHRlci5yYXdMaW5lfSB+PSAke3JlcXVlc3QudXJsfWApO1xuXHRcdFx0XHRcdHJldHVybiBmaWx0ZXI7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIG51bGw7XG5cdH1cblxuXHRtYXRjaChyZXF1ZXN0LCBjaGVja2VkRmlsdGVycykge1xuXHRcdC8vIEtlZXAgdHJhY2sgb2YgZmlsdGVycyBjaGVja2VkXG5cdFx0aWYgKGNoZWNrZWRGaWx0ZXJzID09PSB1bmRlZmluZWQpIHtcblx0XHRcdGNoZWNrZWRGaWx0ZXJzID0gbmV3IFNldCgpO1xuXHRcdH1cblxuXHRcdGNvbnN0IGJ1Y2tldHMgPSB0aGlzLmluZGV4LmdldEZyb21Ub2tlbnMocmVxdWVzdC50b2tlbnMpO1xuXG5cdFx0Zm9yIChjb25zdCBidWNrZXQgb2YgYnVja2V0cykge1xuXHRcdFx0bG9nKGBJTkRFWCAke3RoaXMubmFtZX0gQlVDS0VUID0+ICR7YnVja2V0Lmxlbmd0aH1gKTtcblx0XHRcdGlmICh0aGlzLm1hdGNoTGlzdChyZXF1ZXN0LCBidWNrZXQsIGNoZWNrZWRGaWx0ZXJzKSAhPT0gbnVsbCkge1xuXHRcdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRsb2coYElOREVYICR7dGhpcy5uYW1lfSAke3RoaXMubWlzY0ZpbHRlcnMubGVuZ3RofSByZW1haW5pbmcgZmlsdGVycyBjaGVja2VkYCk7XG5cblx0XHQvLyBJZiBubyBtYXRjaCBmb3VuZCwgY2hlY2sgcmVnZXhlc1xuXHRcdHJldHVybiB0aGlzLm1hdGNoTGlzdChyZXF1ZXN0LCB0aGlzLm1pc2NGaWx0ZXJzLCBjaGVja2VkRmlsdGVycykgIT09IG51bGw7XG5cdH1cbn1cblxuXG4vKiBBIEJ1Y2tldCBtYW5hZ2VzIGEgc3Vic2V0cyBvZiBhbGwgdGhlIGZpbHRlcnMuIFRvIGF2b2lkIG1hdGNoaW5nIHRvbyBtYW55XG4gKiB1c2VsZXNzIGZpbHRlcnMsIHRoZXJlIGlzIGEgc2Vjb25kIGxldmVsIG9mIGRpc3BhdGNoIGhlcmUuXG4gKlxuICogWyBob3N0bmFtZSBhbmNob3JzICh8fGZpbHRlcikgXSAgICBbIHJlbWFpbmluZyBmaWx0ZXJzIF1cbiAqXG4gKiBUaGUgZmlyc3Qgc3RydWN0dXJlIG1hcCB7IGRvbWFpbiAtPiBmaWx0ZXJzIHRoYXQgYXBwbHkgb25seSBvbiBkb21haW4gfVxuICogYXMgdGhlIGBob3N0bmFtZSBhbmNob3JzYCBvbmx5IGFwcGx5IG9uIGEgc3BlY2lmaWMgZG9tYWluIG5hbWUuXG4gKlxuICogRWFjaCBncm91cCBvZiBmaWx0ZXJzIGlzIHN0b3JlZCBpbiBhIEZpbHRlciBpbmRleCB0aGF0IGlzIHRoZSBsYXN0IGxldmVsXG4gKiBvZiBkaXNwYXRjaCBvZiBvdXIgbWF0Y2hpbmcgZW5naW5lLlxuICovXG5jbGFzcyBGaWx0ZXJIb3N0bmFtZURpc3BhdGNoIHtcblxuXHRjb25zdHJ1Y3RvcihuYW1lLCBmaWx0ZXJzKSB7XG5cdFx0Ly8gVE9ETzogRGlzcGF0Y2ggYWxzbyBvbjpcblx0XHQvLyAtIGZyb21JbWFnZVxuXHRcdC8vIC0gZnJvbU1lZGlhXG5cdFx0Ly8gLSBmcm9tT2JqZWN0XG5cdFx0Ly8gLSBmcm9tT2JqZWN0U3VicmVxdWVzdFxuXHRcdC8vIC0gZnJvbU90aGVyXG5cdFx0Ly8gLSBmcm9tUGluZ1xuXHRcdC8vIC0gZnJvbVNjcmlwdFxuXHRcdC8vIC0gZnJvbVN0eWxlc2hlZXRcblx0XHQvLyAtIGZyb21YbWxIdHRwUmVxdWVzdFxuXHRcdC8vIFRvIGF2b2lkIG1hdGNoaW5nIGZpbHRlciBpZiByZXF1ZXN0IHR5cGUgZG9lc24ndCBtYXRjaFxuXHRcdC8vIElmIHdlIGRvIGl0LCB3ZSBjb3VsZCBzaW1wbGlmeSB0aGUgbWF0Y2ggZnVuY3Rpb24gb2YgRmlsdGVyXG5cblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdHRoaXMuc2l6ZSA9IDA7XG5cblx0XHQvLyB8fGhvc3RuYW1lIGZpbHRlclxuXHRcdHRoaXMuaG9zdG5hbWVBbmNob3JzID0gbmV3IEZ1enp5SW5kZXgoXG5cdFx0XHQvLyBUb2tlbml6ZSBrZXlcblx0XHRcdChob3N0bmFtZSwgY2IpID0+IHtcblx0XHRcdFx0dG9rZW5pemVIb3N0bmFtZShob3N0bmFtZSkuZm9yRWFjaChjYik7XG5cdFx0XHR9LFxuXHRcdFx0Ly8gQ3JlYXRlIGEgbmV3IGVtcHR5IGJ1Y2tldFxuXHRcdFx0dG9rZW4gPT4gbmV3IEZpbHRlclJldmVyc2VJbmRleChgJHt0b2tlbn1fJHtuYW1lfWApXG5cdFx0KTtcblxuXHRcdC8vIEFsbCBvdGhlciBmaWx0ZXJzXG5cdFx0dGhpcy5maWx0ZXJzID0gbmV3IEZpbHRlclJldmVyc2VJbmRleCh0aGlzLm5hbWUpO1xuXG5cdFx0Ly8gRGlzcGF0Y2ggZmlsdGVyc1xuXHRcdGlmIChmaWx0ZXJzICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGZpbHRlcnMuZm9yRWFjaCh0aGlzLnB1c2guYmluZCh0aGlzKSk7XG5cdFx0fVxuXG5cdFx0bG9nKGAke25hbWV9IENSRUFURSBCVUNLRVQ6ICR7dGhpcy5maWx0ZXJzLmxlbmd0aH0gZmlsdGVycyArYCArXG5cdFx0XHRcdGAke3RoaXMuaG9zdG5hbWVBbmNob3JzLnNpemV9IGhvc3RuYW1lc2ApO1xuXHR9XG5cblx0Z2V0IGxlbmd0aCgpIHtcblx0XHRyZXR1cm4gdGhpcy5zaXplO1xuXHR9XG5cblx0cHVzaChmaWx0ZXIpIHtcblx0XHQrK3RoaXMuc2l6ZTtcblxuXHRcdGxvZyhgUFVTSCAke2ZpbHRlci5yYXdMaW5lfWApO1xuXHRcdGlmIChmaWx0ZXIuaG9zdG5hbWUgIT09IG51bGwpIHtcblx0XHRcdHRoaXMuaG9zdG5hbWVBbmNob3JzLnNldChmaWx0ZXIuaG9zdG5hbWUsIGZpbHRlcik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuZmlsdGVycy5wdXNoKGZpbHRlcik7XG5cdFx0fVxuXHR9XG5cblx0bWF0Y2hXaXRoRG9tYWluKHJlcXVlc3QsIGRvbWFpbiwgY2hlY2tlZEZpbHRlcnMpIHtcblx0XHRjb25zdCBidWNrZXRzID0gdGhpcy5ob3N0bmFtZUFuY2hvcnMuZ2V0RnJvbUtleShkb21haW4pO1xuXHRcdGZvciAoY29uc3QgYnVja2V0IG9mIGJ1Y2tldHMpIHtcblx0XHRcdGlmIChidWNrZXQgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRsb2coYCR7dGhpcy5uYW1lfSBidWNrZXQgdHJ5IHRvIG1hdGNoIGhvc3RuYW1lQW5jaG9ycyAoJHtkb21haW59LyR7YnVja2V0Lm5hbWV9KWApO1xuXHRcdFx0XHRpZiAoYnVja2V0Lm1hdGNoKHJlcXVlc3QsIGNoZWNrZWRGaWx0ZXJzKSkge1xuXHRcdFx0XHRcdHJldHVybiB0cnVlO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZhbHNlO1xuXHR9XG5cblx0bWF0Y2gocmVxdWVzdCwgY2hlY2tlZEZpbHRlcnMpIHtcblx0XHRpZiAoY2hlY2tlZEZpbHRlcnMgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0Y2hlY2tlZEZpbHRlcnMgPSBuZXcgU2V0KCk7XG5cdFx0fVxuXG5cdFx0aWYgKHRoaXMubWF0Y2hXaXRoRG9tYWluKHJlcXVlc3QsIHJlcXVlc3QuaG9zdG5hbWUsIGNoZWNrZWRGaWx0ZXJzKSkge1xuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fVxuXG5cdFx0Ly8gVHJ5IHRvIGZpbmQgYSBtYXRjaCB3aXRoIHJlbWFpbmluZyBmaWx0ZXJzXG5cdFx0bG9nKGAke3RoaXMubmFtZX0gYnVja2V0IHRyeSB0byBtYXRjaCBtaXNjYCk7XG5cdFx0cmV0dXJuIHRoaXMuZmlsdGVycy5tYXRjaChyZXF1ZXN0LCBjaGVja2VkRmlsdGVycyk7XG5cdH1cbn1cblxuXG5jbGFzcyBGaWx0ZXJTb3VyY2VEb21haW5EaXNwYXRjaCB7XG5cdGNvbnN0cnVjdG9yKG5hbWUsIGZpbHRlcnMpIHtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdHRoaXMuc2l6ZSA9IDA7XG5cblx0XHQvLyBEaXNwYXRjaCBvbiBzb3VyY2UgZG9tYWluXG5cdFx0dGhpcy5zb3VyY2VEb21haW5EaXNwYXRjaCA9IG5ldyBNYXAoKTtcblx0XHQvLyBGaWx0ZXJzIHdpdGhvdXQgc291cmNlIGRvbWFpbiBzcGVjaWZpZWRcblx0XHR0aGlzLm1pc2NGaWx0ZXJzID0gbmV3IEZpbHRlckhvc3RuYW1lRGlzcGF0Y2godGhpcy5uYW1lKTtcblxuXHRcdGlmIChmaWx0ZXJzKSB7XG5cdFx0XHRmaWx0ZXJzLmZvckVhY2godGhpcy5wdXNoLmJpbmQodGhpcykpO1xuXHRcdH1cblx0fVxuXG5cdGdldCBsZW5ndGgoKSB7XG5cdFx0cmV0dXJuIHRoaXMuc2l6ZTtcblx0fVxuXG5cdHB1c2goZmlsdGVyKSB7XG5cdFx0Kyt0aGlzLnNpemU7XG5cblx0XHRpZiAoZmlsdGVyLm9wdE5vdERvbWFpbnMgPT09IG51bGwgJiZcblx0XHRcdFx0ZmlsdGVyLm9wdERvbWFpbnMgIT09IG51bGwpIHtcblx0XHRcdGZpbHRlci5vcHREb21haW5zLmZvckVhY2goZG9tYWluID0+IHtcblx0XHRcdFx0bG9nKGBTT1VSQ0UgRE9NQUlOIERJU1BBVENIICR7ZG9tYWlufSBmaWx0ZXI6ICR7ZmlsdGVyLnJhd0xpbmV9YCk7XG5cdFx0XHRcdGNvbnN0IGJ1Y2tldCA9IHRoaXMuc291cmNlRG9tYWluRGlzcGF0Y2guZ2V0KGRvbWFpbik7XG5cdFx0XHRcdGlmIChidWNrZXQgPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHRcdGNvbnN0IG5ld0luZGV4ID0gbmV3IEZpbHRlckhvc3RuYW1lRGlzcGF0Y2goYCR7dGhpcy5uYW1lfV8ke2RvbWFpbn1gKTtcblx0XHRcdFx0XHRuZXdJbmRleC5wdXNoKGZpbHRlcik7XG5cdFx0XHRcdFx0dGhpcy5zb3VyY2VEb21haW5EaXNwYXRjaC5zZXQoZG9tYWluLCBuZXdJbmRleCk7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0YnVja2V0LnB1c2goZmlsdGVyKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMubWlzY0ZpbHRlcnMucHVzaChmaWx0ZXIpO1xuXHRcdH1cblx0fVxuXG5cdG1hdGNoKHJlcXVlc3QsIGNoZWNrZWRGaWx0ZXJzKSB7XG5cdFx0Ly8gQ2hlY2sgYnVja2V0IGZvciBzb3VyY2UgZG9tYWluXG5cdFx0Y29uc3QgYnVja2V0ID0gdGhpcy5zb3VyY2VEb21haW5EaXNwYXRjaC5nZXQocmVxdWVzdC5zb3VyY2VHRCk7XG5cdFx0bGV0IGZvdW5kTWF0Y2ggPSBmYWxzZTtcblx0XHRpZiAoYnVja2V0ICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdGxvZyhgU291cmNlIGRvbWFpbiBkaXNwYXRjaCAke3JlcXVlc3Quc291cmNlR0R9IHNpemUgJHtidWNrZXQubGVuZ3RofWApO1xuXHRcdFx0Zm91bmRNYXRjaCA9IGJ1Y2tldC5tYXRjaChyZXF1ZXN0LCBjaGVja2VkRmlsdGVycyk7XG5cdFx0fVxuXG5cdFx0aWYgKCFmb3VuZE1hdGNoKSB7XG5cdFx0XHRsb2coYFNvdXJjZSBkb21haW4gZGlzcGF0Y2ggbWlzYyBzaXplICR7dGhpcy5taXNjRmlsdGVycy5sZW5ndGh9YCk7XG5cdFx0XHRmb3VuZE1hdGNoID0gdGhpcy5taXNjRmlsdGVycy5tYXRjaChyZXF1ZXN0LCBjaGVja2VkRmlsdGVycyk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGZvdW5kTWF0Y2g7XG5cdH1cbn1cblxuXG4vKipcbiAqIERpc3BhdGNoIGNvc21ldGljcyBmaWx0ZXJzIG9uIHNlbGVjdG9yc1xuICovXG5jbGFzcyBDb3NtZXRpY0J1Y2tldCB7XG5cdGNvbnN0cnVjdG9yKG5hbWUsIGZpbHRlcnMpIHtcblx0XHR0aGlzLm5hbWUgPSBuYW1lO1xuXHRcdHRoaXMuc2l6ZSA9IDA7XG5cblx0XHR0aGlzLm1pc2NGaWx0ZXJzID0gW107XG5cdFx0dGhpcy5pbmRleCA9IG5ldyBGdXp6eUluZGV4KFxuXHRcdFx0KHNlbGVjdG9yLCBjYikgPT4ge1xuXHRcdFx0XHRzZWxlY3Rvci5zcGxpdCgvW14jLlxcd18tXS9nKS5maWx0ZXIodG9rZW4gPT4gdG9rZW4ubGVuZ3RoID4gMCkuZm9yRWFjaChjYik7XG5cdFx0XHR9XG5cdFx0KTtcblxuXHRcdGlmIChmaWx0ZXJzKSB7XG5cdFx0XHRmaWx0ZXJzLmZvckVhY2godGhpcy5wdXNoLmJpbmQodGhpcykpO1xuXHRcdH1cblx0fVxuXG5cdHB1c2goZmlsdGVyKSB7XG5cdFx0Kyt0aGlzLnNpemU7XG5cdFx0Y29uc3QgaW5zZXJ0ZWQgPSB0aGlzLmluZGV4LnNldChmaWx0ZXIuc2VsZWN0b3IsIGZpbHRlcik7XG5cblx0XHRpZiAoIWluc2VydGVkKSB7XG5cdFx0XHRsb2coYCR7dGhpcy5uYW1lfSBNSVNDIEZJTFRFUiAke2ZpbHRlci5yYXdMaW5lfWApO1xuXHRcdFx0dGhpcy5taXNjRmlsdGVycy5wdXNoKGZpbHRlcik7XG5cdFx0fVxuXHR9XG5cblx0Z2V0TWF0Y2hpbmdSdWxlcyhub2RlSW5mbykge1xuXHRcdGNvbnN0IHJ1bGVzID0gWy4uLnRoaXMubWlzY0ZpbHRlcnNdO1xuXG5cdFx0bm9kZUluZm8uZm9yRWFjaChub2RlID0+IHtcblx0XHRcdC8vIFtpZCwgdGFnTmFtZSwgY2xhc3NOYW1lXSA9IG5vZGVcblx0XHRcdG5vZGUuZm9yRWFjaCh0b2tlbiA9PiB7XG5cdFx0XHRcdHRoaXMuaW5kZXguZ2V0RnJvbUtleSh0b2tlbikuZm9yRWFjaChidWNrZXQgPT4ge1xuXHRcdFx0XHRcdGJ1Y2tldC5mb3JFYWNoKHJ1bGUgPT4geyBydWxlcy5wdXNoKHJ1bGUpOyB9KTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0XHR9KTtcblxuXHRcdHJldHVybiBydWxlcztcblx0fVxufVxuXG5cbmNsYXNzIENvc21ldGljRW5naW5lIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5zaXplID0gMDtcblxuXHRcdHRoaXMubWlzY0ZpbHRlcnMgPSBuZXcgQ29zbWV0aWNCdWNrZXQoJ21pc2MnKTtcblx0XHR0aGlzLmNvc21ldGljcyA9IG5ldyBGdXp6eUluZGV4KFxuXHRcdFx0KGhvc3RuYW1lLCBjYikgPT4ge1xuXHRcdFx0XHR0b2tlbml6ZUhvc3RuYW1lKGhvc3RuYW1lKS5mb3JFYWNoKGNiKTtcblx0XHRcdH0sXG5cdFx0XHR0b2tlbiA9PiBuZXcgQ29zbWV0aWNCdWNrZXQoYCR7dG9rZW59X2Nvc21ldGljc2ApXG5cdFx0KTtcblx0fVxuXG5cdGdldCBsZW5ndGgoKSB7XG5cdFx0cmV0dXJuIHRoaXMuc2l6ZTtcblx0fVxuXG5cdHB1c2goZmlsdGVyKSB7XG5cdFx0aWYgKGZpbHRlci5ob3N0bmFtZXMubGVuZ3RoID09PSAwKSB7XG5cdFx0XHR0aGlzLm1pc2NGaWx0ZXJzLnB1c2goZmlsdGVyKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZmlsdGVyLmhvc3RuYW1lcy5mb3JFYWNoKGhvc3RuYW1lID0+IHtcblx0XHRcdFx0dGhpcy5jb3NtZXRpY3Muc2V0KGhvc3RuYW1lLCBmaWx0ZXIpO1xuXHRcdFx0fSk7XG5cdFx0fVxuXHR9XG5cblx0LyoqXG5cdCAqIFJldHVybiBhIGxpc3Qgb2YgcG90ZW50aWFsIGNvc21ldGljcyBmaWx0ZXJzXG5cdCAqXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSB1cmwgLSB1cmwgb2YgdGhlIHBhZ2UuXG5cdCAqIEBwYXJhbSB7QXJyYXl9IG5vZGVJbmZvIC0gQXJyYXkgb2YgdHVwbGVzIFtpZCwgdGFnTmFtZSwgY2xhc3NOYW1lXS5cblx0KiovXG5cdGdldE1hdGNoaW5nUnVsZXModXJsLCBub2RlSW5mbykge1xuXHRcdGNvbnN0IHVuaXFJZHMgPSBuZXcgU2V0KCk7XG5cdFx0Y29uc3QgcnVsZXMgPSBbXTtcblx0XHRjb25zdCBob3N0bmFtZSA9IFVSTEluZm8uZ2V0KHVybCkuaG9zdG5hbWU7XG5cdFx0bG9nKGBnZXRNYXRjaGluZ1J1bGVzICR7dXJsfSA9PiAke2hvc3RuYW1lfSAoJHtKU09OLnN0cmluZ2lmeShub2RlSW5mbyl9KWApO1xuXG5cdFx0Ly8gQ2hlY2sgbWlzYyBidWNrZXRcblx0XHR0aGlzLm1pc2NGaWx0ZXJzLmdldE1hdGNoaW5nUnVsZXMobm9kZUluZm8pLmZvckVhY2gocnVsZSA9PiB7XG5cdFx0XHRpZiAoIXVuaXFJZHMuaGFzKHJ1bGUuaWQpKSB7XG5cdFx0XHRcdGxvZyhgRm91bmQgcnVsZSAke0pTT04uc3RyaW5naWZ5KHJ1bGUpfWApO1xuXHRcdFx0XHR1bmlxSWRzLmFkZChydWxlLmlkKTtcblx0XHRcdFx0cnVsZXMucHVzaChydWxlKTtcblx0XHRcdH1cblx0XHR9KTtcblxuXHRcdC8vIENoZWNrIGhvc3RuYW1lIGJ1Y2tldHNcblx0XHR0aGlzLmNvc21ldGljcy5nZXRGcm9tS2V5KGhvc3RuYW1lKS5mb3JFYWNoKGJ1Y2tldCA9PiB7XG5cdFx0XHRsb2coYEZvdW5kIGJ1Y2tldCAke2J1Y2tldC5zaXplfWApO1xuXHRcdFx0YnVja2V0LmdldE1hdGNoaW5nUnVsZXMobm9kZUluZm8pLmZvckVhY2gocnVsZSA9PiB7XG5cdFx0XHRcdGlmICghcnVsZS5zY3JpcHRJbmplY3QgJiYgIXVuaXFJZHMuaGFzKHJ1bGUuaWQpKSB7XG5cdFx0XHRcdFx0bG9nKGBGb3VuZCBydWxlICR7SlNPTi5zdHJpbmdpZnkocnVsZSl9YCk7XG5cdFx0XHRcdFx0dW5pcUlkcy5hZGQocnVsZS5pZCk7XG5cdFx0XHRcdFx0cnVsZXMucHVzaChydWxlKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdFx0fSk7XG5cblx0XHRsb2coYENPU01FVElDUyBmb3VuZCAke3J1bGVzLmxlbmd0aH0gcG90ZW50aWFsIHJ1bGVzIGZvciAke3VybH1gKTtcblx0XHRyZXR1cm4gcnVsZXM7XG5cdH1cblxuXHQvKipcblx0ICogUmV0dXJuIGFsbCB0aGUgY29zbWV0aWMgZmlsdGVycyBvbiBhIGRvbWFpblxuXHQgKlxuXHQgKiBAcGFyYW0ge3N0cmluZ30gdXJsIC0gdXJsIG9mIHRoZSBwYWdlXG5cdCoqL1xuXHRnZXREb21haW5SdWxlcyh1cmwsIGpzKSB7XG5cdFx0Y29uc3QgaG9zdG5hbWUgPSBVUkxJbmZvLmdldCh1cmwpLmhvc3RuYW1lO1xuXHRcdGNvbnN0IHJ1bGVzID0gW107XG5cdFx0Y29uc3QgdW5pcUlkcyA9IG5ldyBTZXQoKTtcblx0XHRsb2coYGdldERvbWFpblJ1bGVzICR7dXJsfSA9PiAke2hvc3RuYW1lfWApO1xuXHRcdHRoaXMuY29zbWV0aWNzLmdldEZyb21LZXkoaG9zdG5hbWUpLmZvckVhY2goYnVja2V0ID0+IHtcblx0XHRcdGZvciAoY29uc3QgdmFsdWUgb2YgYnVja2V0LmluZGV4LmluZGV4LnZhbHVlcygpKSB7XG5cdFx0XHRcdHZhbHVlLmZvckVhY2gocnVsZSA9PiB7XG5cdFx0XHRcdFx0aWYgKCF1bmlxSWRzLmhhcyhydWxlLmlkKSkge1xuXHRcdFx0XHRcdFx0aWYgKHJ1bGUuc2NyaXB0SW5qZWN0KSB7XG5cdFx0XHRcdFx0XHRcdC8vIG1ha2Ugc3VyZSB0aGUgc2VsZWN0b3Igd2FzIHJlcGxhY2VkIGJ5IGphdmFzY3JpcHRcblx0XHRcdFx0XHRcdFx0aWYgKCFydWxlLnNjcmlwdFJlcGxhY2VkKSB7XG5cdFx0XHRcdFx0XHRcdFx0cnVsZS5zZWxlY3RvciA9IGpzLmdldChydWxlLnNlbGVjdG9yKTtcblx0XHRcdFx0XHRcdFx0XHRydWxlLnNjcmlwdFJlcGxhY2VkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0aWYgKHJ1bGUuc2VsZWN0b3IpIHtcblx0XHRcdFx0XHRcdFx0cnVsZXMucHVzaChydWxlKTtcblx0XHRcdFx0XHRcdFx0dW5pcUlkcy5hZGQocnVsZS5pZCk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblx0XHR9KTtcblx0XHRyZXR1cm4gcnVsZXM7XG5cdH1cbn1cblxuXG4vKiBNYW5hZ2UgYSBsaXN0IG9mIGZpbHRlcnMgYW5kIG1hdGNoIHRoZW0gaW4gYW4gZWZmaWNpZW50IHdheS5cbiAqIFRvIGF2b2lkIGluc3BlY3RpbmcgdG8gbWFueSBmaWx0ZXJzIGZvciBlYWNoIHJlcXVlc3QsIHdlIGNyZWF0ZVxuICogdGhlIGZvbGxvd2luZyBhY2NlbGVyYXRpbmcgc3RydWN0dXJlOlxuICpcbiAqIFsgSW1wb3J0YW50cyBdICAgIFsgRXhjZXB0aW9ucyBdICAgIFsgUmVtYWluaW5nIGZpbHRlcnMgXVxuICpcbiAqIEVhY2ggb2YgdGhlc2VzIGlzIGEgYEZpbHRlckhvc3RuYW1lRGlzcGF0Y2hgLCB3aGljaCBtYW5hZ2UgYSBzdWJzZXQgb2YgZmlsdGVycy5cbiAqXG4gKiBJbXBvcnRhbnRzIGZpbHRlcnMgYXJlIG5vdCBzdWJqZWN0IHRvIGV4Y2VwdGlvbnMsIGhlbmNlIHdlIHRyeSBpdCBmaXJzdC5cbiAqIElmIG5vIGltcG9ydGFudCBmaWx0ZXIgbWF0Y2hlZCwgdHJ5IHRvIHVzZSB0aGUgcmVtYWluaW5nIGZpbHRlcnMgYnVja2V0LlxuICogSWYgd2UgaGF2ZSBhIG1hdGNoLCB0cnkgdG8gZmluZCBhbiBleGNlcHRpb24uXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5saXN0cyA9IG5ldyBNYXAoKTtcblx0XHR0aGlzLnNpemUgPSAwO1xuXG5cdFx0Ly8gKioqKioqKioqKioqKioqIC8vXG5cdFx0Ly8gTmV0d29yayBmaWx0ZXJzIC8vXG5cdFx0Ly8gKioqKioqKioqKioqKioqIC8vXG5cblx0XHQvLyBAQGZpbHRlclxuXHRcdHRoaXMuZXhjZXB0aW9ucyA9IG5ldyBGaWx0ZXJTb3VyY2VEb21haW5EaXNwYXRjaCgnZXhjZXB0aW9ucycpO1xuXHRcdC8vICRpbXBvcnRhbnRcblx0XHR0aGlzLmltcG9ydGFudHMgPSBuZXcgRmlsdGVyU291cmNlRG9tYWluRGlzcGF0Y2goJ2ltcG9ydGFudHMnKTtcblx0XHQvLyBBbGwgb3RoZXIgZmlsdGVyc1xuXHRcdHRoaXMuZmlsdGVycyA9IG5ldyBGaWx0ZXJTb3VyY2VEb21haW5EaXNwYXRjaCgnZmlsdGVycycpO1xuXG5cdFx0Ly8gKioqKioqKioqKioqKioqKiogLy9cblx0XHQvLyBDb3NtZXRpYyBmaWx0ZXJzICAvL1xuXHRcdC8vICoqKioqKioqKioqKioqKioqIC8vXG5cblx0XHR0aGlzLmNvc21ldGljcyA9IG5ldyBDb3NtZXRpY0VuZ2luZSgpO1xuXG5cdFx0Ly8gaW5qZWN0aW9uc1xuXHRcdHRoaXMuanMgPSBuZXcgTWFwKCk7XG5cdH1cblxuXHRvblVwZGF0ZVJlc291cmNlKGFzc2V0LCBkYXRhKSB7XG5cdFx0Ly8gdGhlIHJlc291cmNlIGNvbnRhaW5pbmcgamF2YXNjaXJwdHMgdG8gYmUgaW5qZWN0ZWRcblx0XHRjb25zdCBqcyA9IHBhcnNlSlNSZXNvdXJjZShkYXRhKS5nZXQoJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnKTtcblx0XHQvLyBUT0RPOiBoYW5kbGUgb3RoZXIgdHlwZVxuXHRcdGlmIChqcykge1xuXHRcdFx0dGhpcy5qcyA9IGpzO1xuXHRcdH1cblx0fVxuXG5cdG9uVXBkYXRlRmlsdGVycyhhc3NldCwgbmV3RmlsdGVycykge1xuXHRcdC8vIE5ldHdvcmsgZmlsdGVyc1xuXHRcdGNvbnN0IGZpbHRlcnMgPSBbXTtcblx0XHRjb25zdCBleGNlcHRpb25zID0gW107XG5cdFx0Y29uc3QgaW1wb3J0YW50cyA9IFtdO1xuXG5cdFx0Ly8gQ29zbWV0aWMgZmlsdGVyc1xuXHRcdGNvbnN0IGNvc21ldGljcyA9IFtdO1xuXG5cdFx0Ly8gUGFyc2UgYW5kIGRpc3BhdGNoIGZpbHRlcnMgZGVwZW5kaW5nIG9uIHR5cGVcblx0XHRjb25zdCBwYXJzZWQgPSBwYXJzZUxpc3QobmV3RmlsdGVycyk7XG5cblx0XHRwYXJzZWQubmV0d29ya0ZpbHRlcnMuZm9yRWFjaChmaWx0ZXIgPT4ge1xuXHRcdFx0aWYgKGZpbHRlci5pc0V4Y2VwdGlvbikge1xuXHRcdFx0XHRleGNlcHRpb25zLnB1c2goZmlsdGVyKTtcblx0XHRcdH0gZWxzZSBpZiAoZmlsdGVyLmlzSW1wb3J0YW50KSB7XG5cdFx0XHRcdGltcG9ydGFudHMucHVzaChmaWx0ZXIpO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0ZmlsdGVycy5wdXNoKGZpbHRlcik7XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHRwYXJzZWQuY29zbWV0aWNGaWx0ZXJzLmZvckVhY2goZmlsdGVyID0+IHtcblx0XHRcdGNvc21ldGljcy5wdXNoKGZpbHRlcik7XG5cdFx0fSk7XG5cblx0XHRpZiAoIXRoaXMubGlzdHMuaGFzKGFzc2V0KSkge1xuXHRcdFx0bG9nKGBGSUxURVIgRU5HSU5FICR7YXNzZXR9IFVQREFURWApO1xuXHRcdFx0Ly8gVXBkYXRlIGRhdGEgc3RydWN0dXJlc1xuXHRcdFx0dGhpcy5zaXplICs9IGZpbHRlcnMubGVuZ3RoICsgZXhjZXB0aW9ucy5sZW5ndGggKyBpbXBvcnRhbnRzLmxlbmd0aCArIGNvc21ldGljcy5sZW5ndGg7XG5cdFx0XHRmaWx0ZXJzLmZvckVhY2godGhpcy5maWx0ZXJzLnB1c2guYmluZCh0aGlzLmZpbHRlcnMpKTtcblx0XHRcdGV4Y2VwdGlvbnMuZm9yRWFjaCh0aGlzLmV4Y2VwdGlvbnMucHVzaC5iaW5kKHRoaXMuZXhjZXB0aW9ucykpO1xuXHRcdFx0aW1wb3J0YW50cy5mb3JFYWNoKHRoaXMuaW1wb3J0YW50cy5wdXNoLmJpbmQodGhpcy5pbXBvcnRhbnRzKSk7XG5cdFx0XHRjb3NtZXRpY3MuZm9yRWFjaCh0aGlzLmNvc21ldGljcy5wdXNoLmJpbmQodGhpcy5jb3NtZXRpY3MpKTtcblxuXHRcdFx0dGhpcy5saXN0cy5zZXQoYXNzZXQsIHsgZmlsdGVycywgZXhjZXB0aW9ucywgaW1wb3J0YW50cywgY29zbWV0aWNzIH0pO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsb2coYEZJTFRFUiBFTkdJTkUgJHthc3NldH0gUkVCVUlMRGApO1xuXHRcdFx0Ly8gUmVidWlsZCBldmVyeXRoaW5nXG5cdFx0XHRmb3IgKGNvbnN0IGxpc3Qgb2YgdGhpcy5saXN0cy52YWx1ZXMoKSkge1xuXHRcdFx0XHRsaXN0LmZpbHRlcnMuZm9yRWFjaChmaWx0ZXJzLnB1c2guYmluZChmaWx0ZXJzKSk7XG5cdFx0XHRcdGxpc3QuZXhjZXB0aW9ucy5mb3JFYWNoKGV4Y2VwdGlvbnMucHVzaC5iaW5kKGV4Y2VwdGlvbnMpKTtcblx0XHRcdFx0bGlzdC5pbXBvcnRhbnRzLmZvckVhY2goaW1wb3J0YW50cy5wdXNoLmJpbmQoaW1wb3J0YW50cykpO1xuXHRcdFx0XHRsaXN0LmNvc21ldGljcy5mb3JFYWNoKGNvc21ldGljcy5wdXNoLmJpbmQoY29zbWV0aWNzKSk7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMuc2l6ZSA9IGZpbHRlcnMubGVuZ3RoICsgZXhjZXB0aW9ucy5sZW5ndGggKyBpbXBvcnRhbnRzLmxlbmd0aCArIGNvc21ldGljcy5sZW5ndGg7XG5cdFx0XHR0aGlzLmZpbHRlcnMgPSBuZXcgRmlsdGVyU291cmNlRG9tYWluRGlzcGF0Y2goJ2ZpbHRlcnMnLCBmaWx0ZXJzKTtcblx0XHRcdHRoaXMuZXhjZXB0aW9ucyA9IG5ldyBGaWx0ZXJTb3VyY2VEb21haW5EaXNwYXRjaCgnZXhjZXB0aW9ucycsIGV4Y2VwdGlvbnMpO1xuXHRcdFx0dGhpcy5pbXBvcnRhbnRzID0gbmV3IEZpbHRlclNvdXJjZURvbWFpbkRpc3BhdGNoKCdpbXBvcnRhbnRzJywgaW1wb3J0YW50cyk7XG5cdFx0XHR0aGlzLmNvc21ldGljcyA9IG5ldyBDb3NtZXRpY0VuZ2luZShjb3NtZXRpY3MpO1xuXHRcdH1cblxuXHRcdGxvZyhgRmlsdGVyIGVuZ2luZSB1cGRhdGVkIHdpdGggJHtmaWx0ZXJzLmxlbmd0aH0gZmlsdGVycywgYCArXG5cdFx0XHRcdGAke2V4Y2VwdGlvbnMubGVuZ3RofSBleGNlcHRpb25zLCBgICtcblx0XHRcdFx0YCR7aW1wb3J0YW50cy5sZW5ndGh9IGltcG9ydGFudHMgYW5kICR7Y29zbWV0aWNzLmxlbmd0aH0gY29zbWV0aWMgZmlsdGVyc1xcbmApO1xuXHR9XG5cblx0Z2V0Q29zbWV0aWNzRmlsdGVycyh1cmwsIG5vZGVzKSB7XG5cdFx0cmV0dXJuIHRoaXMuY29zbWV0aWNzLmdldE1hdGNoaW5nUnVsZXModXJsLCBub2Rlcyk7XG5cdH1cblxuXHRnZXREb21haW5GaWx0ZXJzKHVybCkge1xuXHRcdHJldHVybiB0aGlzLmNvc21ldGljcy5nZXREb21haW5SdWxlcyh1cmwsIHRoaXMuanMpO1xuXHR9XG5cblx0bWF0Y2gocmVxdWVzdCkge1xuXHRcdGxvZyhgTUFUQ0ggJHtKU09OLnN0cmluZ2lmeShyZXF1ZXN0KX1gKTtcblx0XHRyZXF1ZXN0LnRva2VucyA9IHRva2VuaXplVVJMKHJlcXVlc3QudXJsKTtcblxuXHRcdGNvbnN0IGNoZWNrZWRGaWx0ZXJzID0gbmV3IFNldCgpO1xuXHRcdGxldCByZXN1bHQgPSBmYWxzZTtcblxuXHRcdGlmICh0aGlzLmltcG9ydGFudHMubWF0Y2gocmVxdWVzdCwgY2hlY2tlZEZpbHRlcnMpKSB7XG5cdFx0XHRsb2coJ0lNUE9SVEFOVCcpO1xuXHRcdFx0cmVzdWx0ID0gdHJ1ZTtcblx0XHR9IGVsc2UgaWYgKHRoaXMuZmlsdGVycy5tYXRjaChyZXF1ZXN0LCBjaGVja2VkRmlsdGVycykpIHtcblx0XHRcdGxvZygnRklMVEVSJyk7XG5cdFx0XHRpZiAodGhpcy5leGNlcHRpb25zLm1hdGNoKHJlcXVlc3QsIGNoZWNrZWRGaWx0ZXJzKSkge1xuXHRcdFx0XHRsb2coJ0VYQ0VQVElPTicpO1xuXHRcdFx0XHRyZXN1bHQgPSBmYWxzZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJlc3VsdCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0bG9nKGBUb3RhbCBmaWx0ZXJzICR7Y2hlY2tlZEZpbHRlcnMuc2l6ZX1gKTtcblx0XHRyZXR1cm4gcmVzdWx0O1xuXHR9XG59XG4iXX0=