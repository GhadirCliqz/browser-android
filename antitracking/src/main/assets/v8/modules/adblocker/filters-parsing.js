System.register('adblocker/filters-parsing', ['adblocker/utils'], function (_export) {

  // Uniq ID generator
  'use strict';

  var log, uidGen, AdCosmetics, AdFilter;

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  _export('default', parseList);

  _export('parseJSResource', parseJSResource);

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function parseLine(line) {
    if (/#[@$%]*#|[$]{2}/.test(line)) {
      return new AdCosmetics(line);
    }
    return new AdFilter(line);
  }

  function parseList(list) {
    try {
      var _ret = (function () {
        var networkFilters = [];
        var cosmeticFilters = [];
        list.forEach(function (line) {
          if (line) {
            var filter = parseLine(line.trim());
            if (filter.supported && !filter.isComment) {
              log('compiled ' + line + ' into ' + JSON.stringify(filter));
              if (filter.isNetworkFilter) {
                networkFilters.push(filter);
              } else {
                cosmeticFilters.push(filter);
              }
            }
          }
        });
        return {
          v: {
            networkFilters: networkFilters,
            cosmeticFilters: cosmeticFilters
          }
        };
      })();

      if (typeof _ret === 'object') return _ret.v;
    } catch (ex) {
      log('ERROR WHILE PARSING ' + typeof list + ' ' + ex);
      return null;
    }
  }

  function parseJSResource(lines) {
    var state = 'end';
    var tmpContent = '';
    var type = null;
    var name = '';
    var parsed = new Map();
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = lines[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var line = _step.value;

        line = line.trim();
        if (line.startsWith('#')) {
          state = 'comment';
        } else if (!line.trim()) {
          state = 'end';
        } else if (state !== 'content' && !type && line.split(' ').length === 2) {
          state = 'title';
        } else {
          state = 'content';
        }
        switch (state) {
          case 'end':
            if (tmpContent) {
              if (!parsed.get(type)) {
                parsed.set(type, new Map());
              }
              parsed.get(type).set(name, tmpContent);
              tmpContent = '';
              type = null;
            }
            break;
          case 'comment':
            break;
          case 'title':
            var _line$split3 = line.split(' ');

            var _line$split32 = _slicedToArray(_line$split3, 2);

            name = _line$split32[0];
            type = _line$split32[1];

            break;
          case 'content':
            tmpContent += line + '\n';
            break;
          default:
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

    if (tmpContent) {
      if (!parsed.get(type)) {
        parsed.set(type, new Map());
      }
      parsed.get(type).set(name, tmpContent);
    }
    return parsed;
  }

  return {
    setters: [function (_adblockerUtils) {
      log = _adblockerUtils.log;
    }],
    execute: function () {
      uidGen = 0;

      // TODO:
      // 1. support script tags filters:
      //    script:contains
      //    script:inject

      AdCosmetics = function AdCosmetics(line) {
        _classCallCheck(this, AdCosmetics);

        // Assign an id to the filter
        this.id = uidGen++;

        this.rawLine = line;
        this.supported = true;
        this.unhide = false;
        this.isCosmeticFilter = true;
        this.scriptInject = false;
        this.scriptReplaced = false;
        this.scriptBlock = false;

        this.hostnames = [];
        this.selector = null;

        // Ignore Adguard filters:
        // `#$#` `#@$#`
        // `#%#` `#@%#`
        // `$$`
        if (/#@?[$%]#|[$]{2}/.test(line)) {
          this.supported = false;
        } else {
          // Check if unhide
          this.unhide = line.includes('#@#');

          // Parse filter

          var _line$split = line.split(/#@?#/);

          var _line$split2 = _slicedToArray(_line$split, 2);

          var prefix = _line$split2[0];
          var suffix = _line$split2[1];

          // Parse hostnames
          if (prefix.length > 0) {
            this.hostnames = prefix.split(',');
          }

          // Parse selector
          if (suffix.length > 0) {
            this.selector = suffix;

            // extract script name
            if (this.selector.includes('script:inject')) {
              this.selector = this.selector.match(/script:inject\((.+)\)/)[1];
              this.scriptInject = true;
            }

            // extract blocked scripts
            if (this.selector.includes('script:contains')) {
              this.selector = this.selector.match(/script:contains\((.+)\)/)[1];
              if (this.selector[0] === '/' && this.selector.endsWith('/')) {
                this.selector = this.selector.substring(1, this.selector.length - 1);
              }
              this.scriptBlock = true;
            }
          }

          // Exceptions
          if (this.selector === null || this.selector.length === 0 || this.selector.endsWith('}') || this.selector.includes('##') || this.unhide && this.hostnames.length === 0) {
            this.supported = false;
          }
        }
      }

      // TODO:
      // 1. Options not supported yet:
      //  - redirect
      //  - popup
      //  - popunder
      //  - generichide
      //  - genericblock
      // 2. Lot of hostname anchors are of the form hostname[...]*[...]
      //    we could split it into prefix + plain pattern
      // 3. Replace some of the attributes by a bitmask
      ;

      _export('AdCosmetics', AdCosmetics);

      AdFilter = (function () {
        function AdFilter(line) {
          _classCallCheck(this, AdFilter);

          // Assign an id to the filter
          this.id = uidGen++;

          this.rawLine = line;
          this.filterStr = this.rawLine;
          this.supported = true;
          this.isException = false;
          this.rawOptions = null;
          this.hostname = null;
          this.isNetworkFilter = true;

          this.regex = null;

          // Options
          // null  == not specified
          // true  == value true
          // false == negation (~)
          this.optDomains = null;
          this.optNotDomains = null;

          this.isImportant = false;
          this.matchCase = false;

          this.thirdParty = null;
          this.firstParty = null;

          // Options on origin policy
          this.fromAny = true;
          this.fromImage = null;
          this.fromMedia = null;
          this.fromObject = null;
          this.fromObjectSubrequest = null;
          this.fromOther = null;
          this.fromPing = null;
          this.fromScript = null;
          this.fromStylesheet = null;
          this.fromSubdocument = null;
          this.fromXmlHttpRequest = null;

          // Kind of pattern
          this.isHostname = false;
          this.isPlain = false;
          this.isRegex = false;
          this.isLeftAnchor = false;
          this.isRightAnchor = false;
          this.isHostnameAnchor = false;

          // Deal with comments
          this.isComment = this.filterStr.startsWith('!') || this.filterStr.startsWith('#') || this.filterStr.startsWith('[Adblock');

          // Trim comments at the end of the line
          // eg: "... # Comment"
          this.filterStr = this.filterStr.replace(/[\s]#.*$/, '');

          if (!this.isComment) {
            // @@filter == Exception
            this.isException = this.filterStr.startsWith('@@');
            if (this.isException) {
              this.filterStr = this.filterStr.substring(2);
            }

            // filter$options == Options
            if (this.filterStr.includes('$')) {
              var filterAndOptions = this.filterStr.split('$');
              this.filterStr = filterAndOptions[0];
              this.rawOptions = filterAndOptions[1];
              // Parse options and set flags
              this.parseOptions(this.rawOptions);
            }

            if (this.supported) {
              // Identify kind of pattern

              // Deal with hostname pattern
              if (this.filterStr.startsWith('127.0.0.1')) {
                this.hostname = this.filterStr.split(' ').pop();
                this.filterStr = '';
                this.isHostname = true;
                this.isPlain = true;
                this.isRegex = false;
                this.isHostnameAnchor = true;
              } else {
                if (this.filterStr.endsWith('|')) {
                  this.isRightAnchor = true;
                  this.filterStr = this.filterStr.substring(0, this.filterStr.length - 1);
                }

                if (this.filterStr.startsWith('||')) {
                  this.isHostnameAnchor = true;
                  this.filterStr = this.filterStr.substring(2);
                } else if (this.filterStr.startsWith('|')) {
                  this.isLeftAnchor = true;
                  this.filterStr = this.filterStr.substring(1);
                }

                // If pattern ends with "*", strip it as it often can be
                // transformed into a "plain pattern" this way.
                if (this.filterStr.endsWith('*') && this.filterStr.length > 1) {
                  this.filterStr = this.filterStr.substring(0, this.filterStr.length - 1);
                }

                // Is regex?
                if (this.filterStr.includes('*') || this.filterStr.includes('^')) {
                  this.isRegex = true;
                } else {
                  this.isPlain = true;
                }

                // Extract hostname to match it more easily
                // NOTE: This is the most common case of filters
                if (this.isPlain && this.isHostnameAnchor) {
                  // Look for next /
                  var slashIndex = this.filterStr.indexOf('/');
                  if (slashIndex !== -1) {
                    this.hostname = this.filterStr.substring(0, slashIndex);
                    this.filterStr = this.filterStr.substring(slashIndex);
                  } else {
                    this.hostname = this.filterStr;
                    this.filterStr = '';
                  }
                } else if (this.isRegex && this.isHostnameAnchor) {
                  try {
                    // Split at the first '/' or '^' character to get the hostname
                    // and then the pattern.
                    var firstSep = this.filterStr.search(/[/^*]/);
                    if (firstSep !== -1) {
                      var hostname = this.filterStr.substring(0, firstSep);
                      var pattern = this.filterStr.substring(firstSep);

                      this.hostname = hostname;
                      this.isRegex = pattern.includes('^') || pattern.includes('*');
                      this.isPlain = !this.isRegex;
                      this.filterStr = pattern;

                      if (this.filterStr === '^') {
                        this.filterStr = '';
                        this.isPlain = true;
                        this.isRegex = false;
                      }

                      log('SPLIT ' + JSON.stringify({
                        raw: this.rawLine,
                        hostname: this.hostname,
                        filterStr: this.filterStr,
                        isRegex: this.isRegex
                      }));
                    }
                  } catch (ex) {
                    log('ERROR !! ' + ex);
                  }
                }
              }

              // Compile Regex
              if (this.isRegex) {
                this.regex = this.compileRegex(this.filterStr);
                this.rawRegex = this.regex.toString();
              } else {
                // if (!this.matchCase) {
                // NOTE: No filter seems to be using the `match-case` option,
                // hence, it's more efficient to just convert everything to
                // lower case before matching.
                if (this.filterStr) {
                  this.filterStr = this.filterStr.toLowerCase();
                }
                if (this.hostname) {
                  this.hostname = this.hostname.toLowerCase();
                }
              }
            }
          }
        }

        _createClass(AdFilter, [{
          key: 'compileRegex',
          value: function compileRegex(filterStr) {
            var filter = filterStr;

            // Escape special regex characters: |.$+?{}()[]\
            filter = filter.replace(/([|.$+?{}()[\]\\])/g, '\\$1');

            // * can match anything
            filter = filter.replace(/\*/g, '.*');
            // ^ can match any separator or the end of the pattern
            filter = filter.replace(/\^/g, '(?:[^\\w\\d_.%-]|$)');

            // Should match end of url
            if (this.isRightAnchor) {
              filter = filter + '$';
            }

            if (this.isHostnameAnchor || this.isLeftAnchor) {
              filter = '^' + filter;
            }

            try {
              // Compile regex
              if (this.matchCase) {
                return new RegExp(filter);
              }
              return new RegExp(filter, 'i');
            } catch (ex) {
              log('failed to compile regex ' + filter + ' with error ' + ex);
              // Ignore this filter
              this.supported = false;
              return null;
            }
          }
        }, {
          key: 'parseOptions',
          value: function parseOptions(rawOptions) {
            var _this = this;

            rawOptions.split(',').forEach(function (rawOption) {
              var negation = false;
              var option = rawOption;

              // Check for negation: ~option
              if (option.startsWith('~')) {
                negation = true;
                option = option.substring(1);
              } else {
                negation = false;
              }

              // Check for options: option=value1|value2
              var optionValues = [];
              if (option.includes('=')) {
                var optionAndValues = option.split('=', 2);
                option = optionAndValues[0];
                optionValues = optionAndValues[1].split('|');
              }

              switch (option) {
                case 'domain':
                  _this.optDomains = new Set();
                  _this.optNotDomains = new Set();

                  optionValues.forEach(function (value) {
                    if (value) {
                      if (value.startsWith('~')) {
                        _this.optNotDomains.add(value.substring(1));
                      } else {
                        _this.optDomains.add(value);
                      }
                    }
                  });

                  if (_this.optDomains.size === 0) {
                    _this.optDomains = null;
                  }
                  if (_this.optNotDomains.size === 0) {
                    _this.optNotDomains = null;
                  }

                  // this.optDomains = [...this.optDomains.values()];
                  // this.optNotDomains = [...this.optNotDomains.values()];
                  break;
                case 'image':
                  _this.fromImage = !negation;
                  break;
                case 'media':
                  _this.fromMedia = !negation;
                  break;
                case 'object':
                  _this.fromObject = !negation;
                  break;
                case 'object-subrequest':
                  _this.fromObjectSubrequest = !negation;
                  break;
                case 'other':
                  _this.fromOther = !negation;
                  break;
                case 'ping':
                  _this.fromPing = !negation;
                  break;
                case 'script':
                  _this.fromScript = !negation;
                  break;
                case 'stylesheet':
                  _this.fromStylesheet = !negation;
                  break;
                case 'subdocument':
                  _this.fromSubdocument = !negation;
                  break;
                case 'xmlhttprequest':
                  _this.fromXmlHttpRequest = !negation;
                  break;
                case 'important':
                  // Note: `negation` should always be `false` here.
                  _this.isImportant = true;
                  break;
                case 'match-case':
                  // Note: `negation` should always be `false` here.
                  _this.matchCase = true;
                  break;
                case 'third-party':
                  _this.thirdParty = !negation;
                  break;
                case 'first-party':
                  _this.firstParty = !negation;
                  break;
                case 'collapse':
                  break;
                // Disable this filter if any other option is encountered
                default:
                  // Disable this filter if we don't support all the options
                  _this.supported = false;
                  log('NOT SUPPORTED OPTION ' + option);
              }
            });

            // Check if any of the fromX flag is set
            this.fromAny = this.fromImage === null && this.fromMedia === null && this.fromObject === null && this.fromObjectSubrequest === null && this.fromOther === null && this.fromPing === null && this.fromScript === null && this.fromStylesheet === null && this.fromSubdocument === null && this.fromXmlHttpRequest === null;
          }
        }]);

        return AdFilter;
      })();

      _export('AdFilter', AdFilter);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFkYmxvY2tlci9maWx0ZXJzLXBhcnNpbmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7V0FHSSxNQUFNLEVBTUcsV0FBVyxFQTZFWCxRQUFROzs7Ozs7cUJBK1VHLFNBQVM7Ozs7OztBQVJqQyxXQUFTLFNBQVMsQ0FBQyxJQUFJLEVBQUU7QUFDdkIsUUFBSSxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUU7QUFDaEMsYUFBTyxJQUFJLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztLQUM5QjtBQUNELFdBQU8sSUFBSSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7R0FDM0I7O0FBR2MsV0FBUyxTQUFTLENBQUMsSUFBSSxFQUFFO0FBQ3RDLFFBQUk7O0FBQ0YsWUFBTSxjQUFjLEdBQUcsRUFBRSxDQUFDO0FBQzFCLFlBQU0sZUFBZSxHQUFHLEVBQUUsQ0FBQztBQUMzQixZQUFJLENBQUMsT0FBTyxDQUFDLFVBQUEsSUFBSSxFQUFJO0FBQ25CLGNBQUksSUFBSSxFQUFFO0FBQ1IsZ0JBQU0sTUFBTSxHQUFHLFNBQVMsQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsQ0FBQztBQUN0QyxnQkFBSSxNQUFNLENBQUMsU0FBUyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRTtBQUN6QyxpQkFBRyxlQUFhLElBQUksY0FBUyxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFHLENBQUM7QUFDdkQsa0JBQUksTUFBTSxDQUFDLGVBQWUsRUFBRTtBQUMxQiw4QkFBYyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztlQUM3QixNQUFNO0FBQ0wsK0JBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUM7ZUFDOUI7YUFDRjtXQUNGO1NBQ0YsQ0FBQyxDQUFDO0FBQ0g7YUFBTztBQUNMLDBCQUFjLEVBQWQsY0FBYztBQUNkLDJCQUFlLEVBQWYsZUFBZTtXQUNoQjtVQUFDOzs7O0tBQ0gsQ0FBQyxPQUFPLEVB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QixJQUFJLENBQUMsa0JBQWtCLEtBQUssSUFBSSxBQUFDLENBQUM7V0FDckM7OztlQW5VVSxRQUFRIiwiZmlsZSI6ImFkYmxvY2tlci9maWx0ZXJzLXBhcnNpbmcuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBsb2cgfSBmcm9tICdhZGJsb2NrZXIvdXRpbHMnO1xuXG4vLyBVbmlxIElEIGdlbmVyYXRvclxubGV0IHVpZEdlbiA9IDA7XG5cbi8vIFRPRE86XG4vLyAxLiBzdXBwb3J0IHNjcmlwdCB0YWdzIGZpbHRlcnM6XG4vLyAgICBzY3JpcHQ6Y29udGFpbnNcbi8vICAgIHNjcmlwdDppbmplY3RcbmV4cG9ydCBjbGFzcyBBZENvc21ldGljcyB7XG4gIGNvbnN0cnVjdG9yKGxpbmUpIHtcbiAgICAvLyBBc3NpZ24gYW4gaWQgdG8gdGhlIGZpbHRlclxuICAgIHRoaXMuaWQgPSB1aWRHZW4rKztcblxuICAgIHRoaXMucmF3TGluZSA9IGxpbmU7XG4gICAgdGhpcy5zdXBwb3J0ZWQgPSB0cnVlO1xuICAgIHRoaXMudW5oaWRlID0gZmFsc2U7XG4gICAgdGhpcy5pc0Nvc21ldGljRmlsdGVyID0gdHJ1ZTtcbiAgICB0aGlzLnNjcmlwdEluamVjdCA9IGZhbHNlO1xuICAgIHRoaXMuc2NyaXB0UmVwbGFjZWQgPSBmYWxzZTtcbiAgICB0aGlzLnNjcmlwdEJsb2NrID0gZmFsc2U7XG5cbiAgICB0aGlzLmhvc3RuYW1lcyA9IFtdO1xuICAgIHRoaXMuc2VsZWN0b3IgPSBudWxsO1xuXG4gICAgLy8gSWdub3JlIEFkZ3VhcmQgZmlsdGVyczpcbiAgICAvLyBgIyQjYCBgI0AkI2BcbiAgICAvLyBgIyUjYCBgI0AlI2BcbiAgICAvLyBgJCRgXG4gICAgaWYgKC8jQD9bJCVdI3xbJF17Mn0vLnRlc3QobGluZSkpIHtcbiAgICAgIHRoaXMuc3VwcG9ydGVkID0gZmFsc2U7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIENoZWNrIGlmIHVuaGlkZVxuICAgICAgdGhpcy51bmhpZGUgPSBsaW5lLmluY2x1ZGVzKCcjQCMnKTtcblxuICAgICAgLy8gUGFyc2UgZmlsdGVyXG4gICAgICBjb25zdCBbcHJlZml4LCBzdWZmaXhdID0gbGluZS5zcGxpdCgvI0A/Iy8pO1xuXG4gICAgICAvLyBQYXJzZSBob3N0bmFtZXNcbiAgICAgIGlmIChwcmVmaXgubGVuZ3RoID4gMCkge1xuICAgICAgICB0aGlzLmhvc3RuYW1lcyA9IHByZWZpeC5zcGxpdCgnLCcpO1xuICAgICAgfVxuXG4gICAgICAvLyBQYXJzZSBzZWxlY3RvclxuICAgICAgaWYgKHN1ZmZpeC5sZW5ndGggPiAwKSB7XG4gICAgICAgIHRoaXMuc2VsZWN0b3IgPSBzdWZmaXg7XG5cbiAgICAgICAgLy8gZXh0cmFjdCBzY3JpcHQgbmFtZVxuICAgICAgICBpZiAodGhpcy5zZWxlY3Rvci5pbmNsdWRlcygnc2NyaXB0OmluamVjdCcpKSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3RvciA9IHRoaXMuc2VsZWN0b3IubWF0Y2goL3NjcmlwdDppbmplY3RcXCgoLispXFwpLylbMV07XG4gICAgICAgICAgdGhpcy5zY3JpcHRJbmplY3QgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZXh0cmFjdCBibG9ja2VkIHNjcmlwdHNcbiAgICAgICAgaWYgKHRoaXMuc2VsZWN0b3IuaW5jbHVkZXMoJ3NjcmlwdDpjb250YWlucycpKSB7XG4gICAgICAgICAgdGhpcy5zZWxlY3RvciA9IHRoaXMuc2VsZWN0b3IubWF0Y2goL3NjcmlwdDpjb250YWluc1xcKCguKylcXCkvKVsxXTtcbiAgICAgICAgICBpZiAodGhpcy5zZWxlY3RvclswXSA9PT0gJy8nICYmIHRoaXMuc2VsZWN0b3IuZW5kc1dpdGgoJy8nKSkge1xuICAgICAgICAgICAgdGhpcy5zZWxlY3RvciA9IHRoaXMuc2VsZWN0b3Iuc3Vic3RyaW5nKDEsIHRoaXMuc2VsZWN0b3IubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHRoaXMuc2NyaXB0QmxvY2sgPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEV4Y2VwdGlvbnNcbiAgICAgIGlmICh0aGlzLnNlbGVjdG9yID09PSBudWxsIHx8XG4gICAgICAgICAgdGhpcy5zZWxlY3Rvci5sZW5ndGggPT09IDAgfHxcbiAgICAgICAgICB0aGlzLnNlbGVjdG9yLmVuZHNXaXRoKCd9JykgfHxcbiAgICAgICAgICB0aGlzLnNlbGVjdG9yLmluY2x1ZGVzKCcjIycpIHx8XG4gICAgICAgICAgKHRoaXMudW5oaWRlICYmIHRoaXMuaG9zdG5hbWVzLmxlbmd0aCA9PT0gMCkpIHtcbiAgICAgICAgdGhpcy5zdXBwb3J0ZWQgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuXG4vLyBUT0RPOlxuLy8gMS4gT3B0aW9ucyBub3Qgc3VwcG9ydGVkIHlldDpcbi8vICAtIHJlZGlyZWN0XG4vLyAgLSBwb3B1cFxuLy8gIC0gcG9wdW5kZXJcbi8vICAtIGdlbmVyaWNoaWRlXG4vLyAgLSBnZW5lcmljYmxvY2tcbi8vIDIuIExvdCBvZiBob3N0bmFtZSBhbmNob3JzIGFyZSBvZiB0aGUgZm9ybSBob3N0bmFtZVsuLi5dKlsuLi5dXG4vLyAgICB3ZSBjb3VsZCBzcGxpdCBpdCBpbnRvIHByZWZpeCArIHBsYWluIHBhdHRlcm5cbi8vIDMuIFJlcGxhY2Ugc29tZSBvZiB0aGUgYXR0cmlidXRlcyBieSBhIGJpdG1hc2tcbmV4cG9ydCBjbGFzcyBBZEZpbHRlciB7XG4gIGNvbnN0cnVjdG9yKGxpbmUpIHtcbiAgICAvLyBBc3NpZ24gYW4gaWQgdG8gdGhlIGZpbHRlclxuICAgIHRoaXMuaWQgPSB1aWRHZW4rKztcblxuICAgIHRoaXMucmF3TGluZSA9IGxpbmU7XG4gICAgdGhpcy5maWx0ZXJTdHIgPSB0aGlzLnJhd0xpbmU7XG4gICAgdGhpcy5zdXBwb3J0ZWQgPSB0cnVlO1xuICAgIHRoaXMuaXNFeGNlcHRpb24gPSBmYWxzZTtcbiAgICB0aGlzLnJhd09wdGlvbnMgPSBudWxsO1xuICAgIHRoaXMuaG9zdG5hbWUgPSBudWxsO1xuICAgIHRoaXMuaXNOZXR3b3JrRmlsdGVyID0gdHJ1ZTtcblxuICAgIHRoaXMucmVnZXggPSBudWxsO1xuXG4gICAgLy8gT3B0aW9uc1xuICAgIC8vIG51bGwgID09IG5vdCBzcGVjaWZpZWRcbiAgICAvLyB0cnVlICA9PSB2YWx1ZSB0cnVlXG4gICAgLy8gZmFsc2UgPT0gbmVnYXRpb24gKH4pXG4gICAgdGhpcy5vcHREb21haW5zID0gbnVsbDtcbiAgICB0aGlzLm9wdE5vdERvbWFpbnMgPSBudWxsO1xuXG4gICAgdGhpcy5pc0ltcG9ydGFudCA9IGZhbHNlO1xuICAgIHRoaXMubWF0Y2hDYXNlID0gZmFsc2U7XG5cbiAgICB0aGlzLnRoaXJkUGFydHkgPSBudWxsO1xuICAgIHRoaXMuZmlyc3RQYXJ0eSA9IG51bGw7XG5cbiAgICAvLyBPcHRpb25zIG9uIG9yaWdpbiBwb2xpY3lcbiAgICB0aGlzLmZyb21BbnkgPSB0cnVlO1xuICAgIHRoaXMuZnJvbUltYWdlID0gbnVsbDtcbiAgICB0aGlzLmZyb21NZWRpYSA9IG51bGw7XG4gICAgdGhpcy5mcm9tT2JqZWN0ID0gbnVsbDtcbiAgICB0aGlzLmZyb21PYmplY3RTdWJyZXF1ZXN0ID0gbnVsbDtcbiAgICB0aGlzLmZyb21PdGhlciA9IG51bGw7XG4gICAgdGhpcy5mcm9tUGluZyA9IG51bGw7XG4gICAgdGhpcy5mcm9tU2NyaXB0ID0gbnVsbDtcbiAgICB0aGlzLmZyb21TdHlsZXNoZWV0ID0gbnVsbDtcbiAgICB0aGlzLmZyb21TdWJkb2N1bWVudCA9IG51bGw7XG4gICAgdGhpcy5mcm9tWG1sSHR0cFJlcXVlc3QgPSBudWxsO1xuXG4gICAgLy8gS2luZCBvZiBwYXR0ZXJuXG4gICAgdGhpcy5pc0hvc3RuYW1lID0gZmFsc2U7XG4gICAgdGhpcy5pc1BsYWluID0gZmFsc2U7XG4gICAgdGhpcy5pc1JlZ2V4ID0gZmFsc2U7XG4gICAgdGhpcy5pc0xlZnRBbmNob3IgPSBmYWxzZTtcbiAgICB0aGlzLmlzUmlnaHRBbmNob3IgPSBmYWxzZTtcbiAgICB0aGlzLmlzSG9zdG5hbWVBbmNob3IgPSBmYWxzZTtcblxuICAgIC8vIERlYWwgd2l0aCBjb21tZW50c1xuICAgIHRoaXMuaXNDb21tZW50ID0gKHRoaXMuZmlsdGVyU3RyLnN0YXJ0c1dpdGgoJyEnKSB8fFxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsdGVyU3RyLnN0YXJ0c1dpdGgoJyMnKSB8fFxuICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmlsdGVyU3RyLnN0YXJ0c1dpdGgoJ1tBZGJsb2NrJykpO1xuXG4gICAgLy8gVHJpbSBjb21tZW50cyBhdCB0aGUgZW5kIG9mIHRoZSBsaW5lXG4gICAgLy8gZWc6IFwiLi4uICMgQ29tbWVudFwiXG4gICAgdGhpcy5maWx0ZXJTdHIgPSB0aGlzLmZpbHRlclN0ci5yZXBsYWNlKC9bXFxzXSMuKiQvLCAnJyk7XG5cbiAgICBpZiAoIXRoaXMuaXNDb21tZW50KSB7XG4gICAgICAvLyBAQGZpbHRlciA9PSBFeGNlcHRpb25cbiAgICAgIHRoaXMuaXNFeGNlcHRpb24gPSB0aGlzLmZpbHRlclN0ci5zdGFydHNXaXRoKCdAQCcpO1xuICAgICAgaWYgKHRoaXMuaXNFeGNlcHRpb24pIHtcbiAgICAgICAgdGhpcy5maWx0ZXJTdHIgPSB0aGlzLmZpbHRlclN0ci5zdWJzdHJpbmcoMik7XG4gICAgICB9XG5cbiAgICAgIC8vIGZpbHRlciRvcHRpb25zID09IE9wdGlvbnNcbiAgICAgIGlmICh0aGlzLmZpbHRlclN0ci5pbmNsdWRlcygnJCcpKSB7XG4gICAgICAgIGNvbnN0IGZpbHRlckFuZE9wdGlvbnMgPSB0aGlzLmZpbHRlclN0ci5zcGxpdCgnJCcpO1xuICAgICAgICB0aGlzLmZpbHRlclN0ciA9IGZpbHRlckFuZE9wdGlvbnNbMF07XG4gICAgICAgIHRoaXMucmF3T3B0aW9ucyA9IGZpbHRlckFuZE9wdGlvbnNbMV07XG4gICAgICAgIC8vIFBhcnNlIG9wdGlvbnMgYW5kIHNldCBmbGFnc1xuICAgICAgICB0aGlzLnBhcnNlT3B0aW9ucyh0aGlzLnJhd09wdGlvbnMpO1xuICAgICAgfVxuXG4gICAgICBpZiAodGhpcy5zdXBwb3J0ZWQpIHtcbiAgICAgICAgLy8gSWRlbnRpZnkga2luZCBvZiBwYXR0ZXJuXG5cbiAgICAgICAgLy8gRGVhbCB3aXRoIGhvc3RuYW1lIHBhdHRlcm5cbiAgICAgICAgaWYgKHRoaXMuZmlsdGVyU3RyLnN0YXJ0c1dpdGgoJzEyNy4wLjAuMScpKSB7XG4gICAgICAgICAgdGhpcy5ob3N0bmFtZSA9IHRoaXMuZmlsdGVyU3RyLnNwbGl0KCcgJykucG9wKCk7XG4gICAgICAgICAgdGhpcy5maWx0ZXJTdHIgPSAnJztcbiAgICAgICAgICB0aGlzLmlzSG9zdG5hbWUgPSB0cnVlO1xuICAgICAgICAgIHRoaXMuaXNQbGFpbiA9IHRydWU7XG4gICAgICAgICAgdGhpcy5pc1JlZ2V4ID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5pc0hvc3RuYW1lQW5jaG9yID0gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBpZiAodGhpcy5maWx0ZXJTdHIuZW5kc1dpdGgoJ3wnKSkge1xuICAgICAgICAgICAgdGhpcy5pc1JpZ2h0QW5jaG9yID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyU3RyID0gdGhpcy5maWx0ZXJTdHIuc3Vic3RyaW5nKDAsIHRoaXMuZmlsdGVyU3RyLmxlbmd0aCAtIDEpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmICh0aGlzLmZpbHRlclN0ci5zdGFydHNXaXRoKCd8fCcpKSB7XG4gICAgICAgICAgICB0aGlzLmlzSG9zdG5hbWVBbmNob3IgPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5maWx0ZXJTdHIgPSB0aGlzLmZpbHRlclN0ci5zdWJzdHJpbmcoMik7XG4gICAgICAgICAgfSBlbHNlIGlmICh0aGlzLmZpbHRlclN0ci5zdGFydHNXaXRoKCd8JykpIHtcbiAgICAgICAgICAgIHRoaXMuaXNMZWZ0QW5jaG9yID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuZmlsdGVyU3RyID0gdGhpcy5maWx0ZXJTdHIuc3Vic3RyaW5nKDEpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIC8vIElmIHBhdHRlcm4gZW5kcyB3aXRoIFwiKlwiLCBzdHJpcCBpdCBhcyBpdCBvZnRlbiBjYW4gYmVcbiAgICAgICAgICAvLyB0cmFuc2Zvcm1lZCBpbnRvIGEgXCJwbGFpbiBwYXR0ZXJuXCIgdGhpcyB3YXkuXG4gICAgICAgICAgaWYgKHRoaXMuZmlsdGVyU3RyLmVuZHNXaXRoKCcqJykgJiYgdGhpcy5maWx0ZXJTdHIubGVuZ3RoID4gMSkge1xuICAgICAgICAgICAgdGhpcy5maWx0ZXJTdHIgPSB0aGlzLmZpbHRlclN0ci5zdWJzdHJpbmcoMCwgdGhpcy5maWx0ZXJTdHIubGVuZ3RoIC0gMSk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgLy8gSXMgcmVnZXg/XG4gICAgICAgICAgaWYgKHRoaXMuZmlsdGVyU3RyLmluY2x1ZGVzKCcqJykgfHwgdGhpcy5maWx0ZXJTdHIuaW5jbHVkZXMoJ14nKSkge1xuICAgICAgICAgICAgdGhpcy5pc1JlZ2V4ID0gdHJ1ZTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5pc1BsYWluID0gdHJ1ZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyBFeHRyYWN0IGhvc3RuYW1lIHRvIG1hdGNoIGl0IG1vcmUgZWFzaWx5XG4gICAgICAgICAgLy8gTk9URTogVGhpcyBpcyB0aGUgbW9zdCBjb21tb24gY2FzZSBvZiBmaWx0ZXJzXG4gICAgICAgICAgaWYgKHRoaXMuaXNQbGFpbiAmJiB0aGlzLmlzSG9zdG5hbWVBbmNob3IpIHtcbiAgICAgICAgICAgIC8vIExvb2sgZm9yIG5leHQgL1xuICAgICAgICAgICAgY29uc3Qgc2xhc2hJbmRleCA9IHRoaXMuZmlsdGVyU3RyLmluZGV4T2YoJy8nKTtcbiAgICAgICAgICAgIGlmIChzbGFzaEluZGV4ICE9PSAtMSkge1xuICAgICAgICAgICAgICB0aGlzLmhvc3RuYW1lID0gdGhpcy5maWx0ZXJTdHIuc3Vic3RyaW5nKDAsIHNsYXNoSW5kZXgpO1xuICAgICAgICAgICAgICB0aGlzLmZpbHRlclN0ciA9IHRoaXMuZmlsdGVyU3RyLnN1YnN0cmluZyhzbGFzaEluZGV4KTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHRoaXMuaG9zdG5hbWUgPSB0aGlzLmZpbHRlclN0cjtcbiAgICAgICAgICAgICAgdGhpcy5maWx0ZXJTdHIgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGVsc2UgaWYgKHRoaXMuaXNSZWdleCAmJiB0aGlzLmlzSG9zdG5hbWVBbmNob3IpIHtcbiAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgIC8vIFNwbGl0IGF0IHRoZSBmaXJzdCAnLycgb3IgJ14nIGNoYXJhY3RlciB0byBnZXQgdGhlIGhvc3RuYW1lXG4gICAgICAgICAgICAgIC8vIGFuZCB0aGVuIHRoZSBwYXR0ZXJuLlxuICAgICAgICAgICAgICBjb25zdCBmaXJzdFNlcCA9IHRoaXMuZmlsdGVyU3RyLnNlYXJjaCgvWy9eKl0vKTtcbiAgICAgICAgICAgICAgaWYgKGZpcnN0U2VwICE9PSAtMSkge1xuICAgICAgICAgICAgICAgIGNvbnN0IGhvc3RuYW1lID0gdGhpcy5maWx0ZXJTdHIuc3Vic3RyaW5nKDAsIGZpcnN0U2VwKTtcbiAgICAgICAgICAgICAgICBjb25zdCBwYXR0ZXJuID0gdGhpcy5maWx0ZXJTdHIuc3Vic3RyaW5nKGZpcnN0U2VwKTtcblxuICAgICAgICAgICAgICAgIHRoaXMuaG9zdG5hbWUgPSBob3N0bmFtZTtcbiAgICAgICAgICAgICAgICB0aGlzLmlzUmVnZXggPSAocGF0dGVybi5pbmNsdWRlcygnXicpIHx8XG4gICAgICAgICAgICAgICAgICBwYXR0ZXJuLmluY2x1ZGVzKCcqJykpO1xuICAgICAgICAgICAgICAgIHRoaXMuaXNQbGFpbiA9ICF0aGlzLmlzUmVnZXg7XG4gICAgICAgICAgICAgICAgdGhpcy5maWx0ZXJTdHIgPSBwYXR0ZXJuO1xuXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuZmlsdGVyU3RyID09PSAnXicpIHtcbiAgICAgICAgICAgICAgICAgIHRoaXMuZmlsdGVyU3RyID0gJyc7XG4gICAgICAgICAgICAgICAgICB0aGlzLmlzUGxhaW4gPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgdGhpcy5pc1JlZ2V4ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgbG9nKGBTUExJVCAke0pTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgICAgIHJhdzogdGhpcy5yYXdMaW5lLFxuICAgICAgICAgICAgICAgICAgaG9zdG5hbWU6IHRoaXMuaG9zdG5hbWUsXG4gICAgICAgICAgICAgICAgICBmaWx0ZXJTdHI6IHRoaXMuZmlsdGVyU3RyLFxuICAgICAgICAgICAgICAgICAgaXNSZWdleDogdGhpcy5pc1JlZ2V4LFxuICAgICAgICAgICAgICAgIH0pfWApO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoIChleCkge1xuICAgICAgICAgICAgICBsb2coYEVSUk9SICEhICR7ZXh9YCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gQ29tcGlsZSBSZWdleFxuICAgICAgICBpZiAodGhpcy5pc1JlZ2V4KSB7XG4gICAgICAgICAgdGhpcy5yZWdleCA9IHRoaXMuY29tcGlsZVJlZ2V4KHRoaXMuZmlsdGVyU3RyKTtcbiAgICAgICAgICB0aGlzLnJhd1JlZ2V4ID0gdGhpcy5yZWdleC50b1N0cmluZygpO1xuICAgICAgICB9IGVsc2UgeyAvLyBpZiAoIXRoaXMubWF0Y2hDYXNlKSB7XG4gICAgICAgICAgLy8gTk9URTogTm8gZmlsdGVyIHNlZW1zIHRvIGJlIHVzaW5nIHRoZSBgbWF0Y2gtY2FzZWAgb3B0aW9uLFxuICAgICAgICAgIC8vIGhlbmNlLCBpdCdzIG1vcmUgZWZmaWNpZW50IHRvIGp1c3QgY29udmVydCBldmVyeXRoaW5nIHRvXG4gICAgICAgICAgLy8gbG93ZXIgY2FzZSBiZWZvcmUgbWF0Y2hpbmcuXG4gICAgICAgICAgaWYgKHRoaXMuZmlsdGVyU3RyKSB7XG4gICAgICAgICAgICB0aGlzLmZpbHRlclN0ciA9IHRoaXMuZmlsdGVyU3RyLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aGlzLmhvc3RuYW1lKSB7XG4gICAgICAgICAgICB0aGlzLmhvc3RuYW1lID0gdGhpcy5ob3N0bmFtZS50b0xvd2VyQ2FzZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGNvbXBpbGVSZWdleChmaWx0ZXJTdHIpIHtcbiAgICBsZXQgZmlsdGVyID0gZmlsdGVyU3RyO1xuXG4gICAgLy8gRXNjYXBlIHNwZWNpYWwgcmVnZXggY2hhcmFjdGVyczogfC4kKz97fSgpW11cXFxuICAgIGZpbHRlciA9IGZpbHRlci5yZXBsYWNlKC8oW3wuJCs/e30oKVtcXF1cXFxcXSkvZywgJ1xcXFwkMScpO1xuXG4gICAgLy8gKiBjYW4gbWF0Y2ggYW55dGhpbmdcbiAgICBmaWx0ZXIgPSBmaWx0ZXIucmVwbGFjZSgvXFwqL2csICcuKicpO1xuICAgIC8vIF4gY2FuIG1hdGNoIGFueSBzZXBhcmF0b3Igb3IgdGhlIGVuZCBvZiB0aGUgcGF0dGVyblxuICAgIGZpbHRlciA9IGZpbHRlci5yZXBsYWNlKC9cXF4vZywgJyg/OlteXFxcXHdcXFxcZF8uJS1dfCQpJyk7XG5cbiAgICAvLyBTaG91bGQgbWF0Y2ggZW5kIG9mIHVybFxuICAgIGlmICh0aGlzLmlzUmlnaHRBbmNob3IpIHtcbiAgICAgIGZpbHRlciA9IGAke2ZpbHRlcn0kYDtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5pc0hvc3RuYW1lQW5jaG9yIHx8IHRoaXMuaXNMZWZ0QW5jaG9yKSB7XG4gICAgICBmaWx0ZXIgPSBgXiR7ZmlsdGVyfWA7XG4gICAgfVxuXG4gICAgdHJ5IHtcbiAgICAgIC8vIENvbXBpbGUgcmVnZXhcbiAgICAgIGlmICh0aGlzLm1hdGNoQ2FzZSkge1xuICAgICAgICByZXR1cm4gbmV3IFJlZ0V4cChmaWx0ZXIpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG5ldyBSZWdFeHAoZmlsdGVyLCAnaScpO1xuICAgIH0gY2F0Y2ggKGV4KSB7XG4gICAgICBsb2coYGZhaWxlZCB0byBjb21waWxlIHJlZ2V4ICR7ZmlsdGVyfSB3aXRoIGVycm9yICR7ZXh9YCk7XG4gICAgICAvLyBJZ25vcmUgdGhpcyBmaWx0ZXJcbiAgICAgIHRoaXMuc3VwcG9ydGVkID0gZmFsc2U7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gIH1cblxuICBwYXJzZU9wdGlvbnMocmF3T3B0aW9ucykge1xuICAgIHJhd09wdGlvbnMuc3BsaXQoJywnKS5mb3JFYWNoKHJhd09wdGlvbiA9PiB7XG4gICAgICBsZXQgbmVnYXRpb24gPSBmYWxzZTtcbiAgICAgIGxldCBvcHRpb24gPSByYXdPcHRpb247XG5cbiAgICAgIC8vIENoZWNrIGZvciBuZWdhdGlvbjogfm9wdGlvblxuICAgICAgaWYgKG9wdGlvbi5zdGFydHNXaXRoKCd+JykpIHtcbiAgICAgICAgbmVnYXRpb24gPSB0cnVlO1xuICAgICAgICBvcHRpb24gPSBvcHRpb24uc3Vic3RyaW5nKDEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgbmVnYXRpb24gPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgLy8gQ2hlY2sgZm9yIG9wdGlvbnM6IG9wdGlvbj12YWx1ZTF8dmFsdWUyXG4gICAgICBsZXQgb3B0aW9uVmFsdWVzID0gW107XG4gICAgICBpZiAob3B0aW9uLmluY2x1ZGVzKCc9JykpIHtcbiAgICAgICAgY29uc3Qgb3B0aW9uQW5kVmFsdWVzID0gb3B0aW9uLnNwbGl0KCc9JywgMik7XG4gICAgICAgIG9wdGlvbiA9IG9wdGlvbkFuZFZhbHVlc1swXTtcbiAgICAgICAgb3B0aW9uVmFsdWVzID0gb3B0aW9uQW5kVmFsdWVzWzFdLnNwbGl0KCd8Jyk7XG4gICAgICB9XG5cbiAgICAgIHN3aXRjaCAob3B0aW9uKSB7XG4gICAgICAgIGNhc2UgJ2RvbWFpbic6XG4gICAgICAgICAgdGhpcy5vcHREb21haW5zID0gbmV3IFNldCgpO1xuICAgICAgICAgIHRoaXMub3B0Tm90RG9tYWlucyA9IG5ldyBTZXQoKTtcblxuICAgICAgICAgIG9wdGlvblZhbHVlcy5mb3JFYWNoKHZhbHVlID0+IHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICAgICAgICBpZiAodmFsdWUuc3RhcnRzV2l0aCgnficpKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHROb3REb21haW5zLmFkZCh2YWx1ZS5zdWJzdHJpbmcoMSkpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0RG9tYWlucy5hZGQodmFsdWUpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBpZiAodGhpcy5vcHREb21haW5zLnNpemUgPT09IDApIHtcbiAgICAgICAgICAgIHRoaXMub3B0RG9tYWlucyA9IG51bGw7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh0aGlzLm9wdE5vdERvbWFpbnMuc2l6ZSA9PT0gMCkge1xuICAgICAgICAgICAgdGhpcy5vcHROb3REb21haW5zID0gbnVsbDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICAvLyB0aGlzLm9wdERvbWFpbnMgPSBbLi4udGhpcy5vcHREb21haW5zLnZhbHVlcygpXTtcbiAgICAgICAgICAvLyB0aGlzLm9wdE5vdERvbWFpbnMgPSBbLi4udGhpcy5vcHROb3REb21haW5zLnZhbHVlcygpXTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnaW1hZ2UnOlxuICAgICAgICAgIHRoaXMuZnJvbUltYWdlID0gIW5lZ2F0aW9uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdtZWRpYSc6XG4gICAgICAgICAgdGhpcy5mcm9tTWVkaWEgPSAhbmVnYXRpb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ29iamVjdCc6XG4gICAgICAgICAgdGhpcy5mcm9tT2JqZWN0ID0gIW5lZ2F0aW9uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdvYmplY3Qtc3VicmVxdWVzdCc6XG4gICAgICAgICAgdGhpcy5mcm9tT2JqZWN0U3VicmVxdWVzdCA9ICFuZWdhdGlvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnb3RoZXInOlxuICAgICAgICAgIHRoaXMuZnJvbU90aGVyID0gIW5lZ2F0aW9uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdwaW5nJzpcbiAgICAgICAgICB0aGlzLmZyb21QaW5nID0gIW5lZ2F0aW9uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICdzY3JpcHQnOlxuICAgICAgICAgIHRoaXMuZnJvbVNjcmlwdCA9ICFuZWdhdGlvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnc3R5bGVzaGVldCc6XG4gICAgICAgICAgdGhpcy5mcm9tU3R5bGVzaGVldCA9ICFuZWdhdGlvbjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnc3ViZG9jdW1lbnQnOlxuICAgICAgICAgIHRoaXMuZnJvbVN1YmRvY3VtZW50ID0gIW5lZ2F0aW9uO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlICd4bWxodHRwcmVxdWVzdCc6XG4gICAgICAgICAgdGhpcy5mcm9tWG1sSHR0cFJlcXVlc3QgPSAhbmVnYXRpb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2ltcG9ydGFudCc6XG4gICAgICAgICAgLy8gTm90ZTogYG5lZ2F0aW9uYCBzaG91bGQgYWx3YXlzIGJlIGBmYWxzZWAgaGVyZS5cbiAgICAgICAgICB0aGlzLmlzSW1wb3J0YW50ID0gdHJ1ZTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAnbWF0Y2gtY2FzZSc6XG4gICAgICAgICAgLy8gTm90ZTogYG5lZ2F0aW9uYCBzaG91bGQgYWx3YXlzIGJlIGBmYWxzZWAgaGVyZS5cbiAgICAgICAgICB0aGlzLm1hdGNoQ2FzZSA9IHRydWU7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ3RoaXJkLXBhcnR5JzpcbiAgICAgICAgICB0aGlzLnRoaXJkUGFydHkgPSAhbmVnYXRpb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2ZpcnN0LXBhcnR5JzpcbiAgICAgICAgICB0aGlzLmZpcnN0UGFydHkgPSAhbmVnYXRpb247XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgJ2NvbGxhcHNlJzpcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgLy8gRGlzYWJsZSB0aGlzIGZpbHRlciBpZiBhbnkgb3RoZXIgb3B0aW9uIGlzIGVuY291bnRlcmVkXG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgLy8gRGlzYWJsZSB0aGlzIGZpbHRlciBpZiB3ZSBkb24ndCBzdXBwb3J0IGFsbCB0aGUgb3B0aW9uc1xuICAgICAgICAgIHRoaXMuc3VwcG9ydGVkID0gZmFsc2U7XG4gICAgICAgICAgbG9nKGBOT1QgU1VQUE9SVEVEIE9QVElPTiAke29wdGlvbn1gKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIENoZWNrIGlmIGFueSBvZiB0aGUgZnJvbVggZmxhZyBpcyBzZXRcbiAgICB0aGlzLmZyb21BbnkgPSAoXG4gICAgICB0aGlzLmZyb21JbWFnZSA9PT0gbnVsbCAmJlxuICAgICAgdGhpcy5mcm9tTWVkaWEgPT09IG51bGwgJiZcbiAgICAgIHRoaXMuZnJvbU9iamVjdCA9PT0gbnVsbCAmJlxuICAgICAgdGhpcy5mcm9tT2JqZWN0U3VicmVxdWVzdCA9PT0gbnVsbCAmJlxuICAgICAgdGhpcy5mcm9tT3RoZXIgPT09IG51bGwgJiZcbiAgICAgIHRoaXMuZnJvbVBpbmcgPT09IG51bGwgJiZcbiAgICAgIHRoaXMuZnJvbVNjcmlwdCA9PT0gbnVsbCAmJlxuICAgICAgdGhpcy5mcm9tU3R5bGVzaGVldCA9PT0gbnVsbCAmJlxuICAgICAgdGhpcy5mcm9tU3ViZG9jdW1lbnQgPT09IG51bGwgJiZcbiAgICAgIHRoaXMuZnJvbVhtbEh0dHBSZXF1ZXN0ID09PSBudWxsKTtcbiAgfVxufVxuXG5cbmZ1bmN0aW9uIHBhcnNlTGluZShsaW5lKSB7XG4gIGlmICgvI1tAJCVdKiN8WyRdezJ9Ly50ZXN0KGxpbmUpKSB7XG4gICAgcmV0dXJuIG5ldyBBZENvc21ldGljcyhsaW5lKTtcbiAgfVxuICByZXR1cm4gbmV3IEFkRmlsdGVyKGxpbmUpO1xufVxuXG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHBhcnNlTGlzdChsaXN0KSB7XG4gIHRyeSB7XG4gICAgY29uc3QgbmV0d29ya0ZpbHRlcnMgPSBbXTtcbiAgICBjb25zdCBjb3NtZXRpY0ZpbHRlcnMgPSBbXTtcbiAgICBsaXN0LmZvckVhY2gobGluZSA9PiB7XG4gICAgICBpZiAobGluZSkge1xuICAgICAgICBjb25zdCBmaWx0ZXIgPSBwYXJzZUxpbmUobGluZS50cmltKCkpO1xuICAgICAgICBpZiAoZmlsdGVyLnN1cHBvcnRlZCAmJiAhZmlsdGVyLmlzQ29tbWVudCkge1xuICAgICAgICAgIGxvZyhgY29tcGlsZWQgJHtsaW5lfSBpbnRvICR7SlNPTi5zdHJpbmdpZnkoZmlsdGVyKX1gKTtcbiAgICAgICAgICBpZiAoZmlsdGVyLmlzTmV0d29ya0ZpbHRlcikge1xuICAgICAgICAgICAgbmV0d29ya0ZpbHRlcnMucHVzaChmaWx0ZXIpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjb3NtZXRpY0ZpbHRlcnMucHVzaChmaWx0ZXIpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICAgIHJldHVybiB7XG4gICAgICBuZXR3b3JrRmlsdGVycyxcbiAgICAgIGNvc21ldGljRmlsdGVycyxcbiAgICB9O1xuICB9IGNhdGNoIChleCkge1xuICAgIGxvZyhgRVJST1IgV0hJTEUgUEFSU0lORyAke3R5cGVvZiBsaXN0fSAke2V4fWApO1xuICAgIHJldHVybiBudWxsO1xuICB9XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZUpTUmVzb3VyY2UobGluZXMpIHtcbiAgbGV0IHN0YXRlID0gJ2VuZCc7XG4gIGxldCB0bXBDb250ZW50ID0gJyc7XG4gIGxldCB0eXBlID0gbnVsbDtcbiAgbGV0IG5hbWUgPSAnJztcbiAgY29uc3QgcGFyc2VkID0gbmV3IE1hcCgpO1xuICBmb3IgKGxldCBsaW5lIG9mIGxpbmVzKSB7XG4gICAgbGluZSA9IGxpbmUudHJpbSgpO1xuICAgIGlmIChsaW5lLnN0YXJ0c1dpdGgoJyMnKSkge1xuICAgICAgc3RhdGUgPSAnY29tbWVudCc7XG4gICAgfSBlbHNlIGlmICghbGluZS50cmltKCkpIHtcbiAgICAgIHN0YXRlID0gJ2VuZCc7XG4gICAgfSBlbHNlIGlmIChzdGF0ZSAhPT0gJ2NvbnRlbnQnICYmICF0eXBlICYmIGxpbmUuc3BsaXQoJyAnKS5sZW5ndGggPT09IDIpIHtcbiAgICAgIHN0YXRlID0gJ3RpdGxlJztcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdGUgPSAnY29udGVudCc7XG4gICAgfVxuICAgIHN3aXRjaCAoc3RhdGUpIHtcbiAgICAgIGNhc2UgJ2VuZCc6XG4gICAgICAgIGlmICh0bXBDb250ZW50KSB7XG4gICAgICAgICAgaWYgKCFwYXJzZWQuZ2V0KHR5cGUpKSB7XG4gICAgICAgICAgICBwYXJzZWQuc2V0KHR5cGUsIG5ldyBNYXAoKSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHBhcnNlZC5nZXQodHlwZSkuc2V0KG5hbWUsIHRtcENvbnRlbnQpO1xuICAgICAgICAgIHRtcENvbnRlbnQgPSAnJztcbiAgICAgICAgICB0eXBlID0gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2NvbW1lbnQnOlxuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ3RpdGxlJzpcbiAgICAgICAgW25hbWUsIHR5cGVdID0gbGluZS5zcGxpdCgnICcpO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgJ2NvbnRlbnQnOlxuICAgICAgICB0bXBDb250ZW50ICs9IGAke2xpbmV9XFxuYDtcbiAgICAgICAgYnJlYWs7XG4gICAgICBkZWZhdWx0OlxuICAgIH1cbiAgfVxuICBpZiAodG1wQ29udGVudCkge1xuICAgIGlmICghcGFyc2VkLmdldCh0eXBlKSkge1xuICAgICAgcGFyc2VkLnNldCh0eXBlLCBuZXcgTWFwKCkpO1xuICAgIH1cbiAgICBwYXJzZWQuZ2V0KHR5cGUpLnNldChuYW1lLCB0bXBDb250ZW50KTtcbiAgfVxuICByZXR1cm4gcGFyc2VkO1xufVxuIl19