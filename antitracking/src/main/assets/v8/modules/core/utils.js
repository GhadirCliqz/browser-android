System.register('core/utils', ['platform/environment'], function (_export) {
  'use strict';

  var CLIQZEnvironment, CliqzLanguage, VERTICAL_ENCODINGS, COLOURS, LOGOS, BRANDS_DATABASE, brand_loaded, MINUTE, ipv4_part, ipv4_regex, ipv6_regex, CliqzUtils;

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  return {
    setters: [function (_platformEnvironment) {
      CLIQZEnvironment = _platformEnvironment['default'];
    }],
    execute: function () {
      VERTICAL_ENCODINGS = {
        'people': 'p',
        'news': 'n',
        'video': 'v',
        'hq': 'h',
        'bm': 'm',
        'recipeRD': 'r',
        'game': 'g',
        'movie': 'o'
      };
      COLOURS = ['#ffce6d', '#ff6f69', '#96e397', '#5c7ba1', '#bfbfbf', '#3b5598', '#fbb44c', '#00b2e5', '#b3b3b3', '#99cccc', '#ff0027', '#999999'];
      LOGOS = ['wikipedia', 'google', 'facebook', 'youtube', 'duckduckgo', 'sternefresser', 'zalando', 'bild', 'web', 'ebay', 'gmx', 'amazon', 't-online', 'wiwo', 'wwe', 'weightwatchers', 'rp-online', 'wmagazine', 'chip', 'spiegel', 'yahoo', 'paypal', 'imdb', 'wikia', 'msn', 'autobild', 'dailymotion', 'hm', 'hotmail', 'zeit', 'bahn', 'softonic', 'handelsblatt', 'stern', 'cnn', 'mobile', 'aetv', 'postbank', 'dkb', 'bing', 'adobe', 'bbc', 'nike', 'starbucks', 'techcrunch', 'vevo', 'time', 'twitter', 'weatherunderground', 'xing', 'yelp', 'yandex', 'weather', 'flickr'];
      BRANDS_DATABASE = { domains: {}, palette: ["999"] };
      brand_loaded = false;
      MINUTE = 60 * 1e3;
      ipv4_part = "0*([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])";
      ipv4_regex = new RegExp("^" + ipv4_part + "\\." + ipv4_part + "\\." + ipv4_part + "\\." + ipv4_part + "([:]([0-9])+)?$");
      ipv6_regex = new RegExp("^\\[?(([0-9]|[a-f]|[A-F])*[:.]+([0-9]|[a-f]|[A-F])+[:.]*)+[\\]]?([:][0-9]+)?$");
      CliqzUtils = {
        LANGS: { 'de': 'de', 'en': 'en', 'fr': 'fr' },
        RESULTS_PROVIDER: 'https://newbeta.cliqz.com/api/v1/results?q=',
        RICH_HEADER: 'https://newbeta.cliqz.com/api/v1/rich-header?path=/map',
        RESULTS_PROVIDER_LOG: 'https://newbeta.cliqz.com/api/v1/logging?q=',
        RESULTS_PROVIDER_PING: 'https://newbeta.cliqz.com/ping',
        CONFIG_PROVIDER: 'https://newbeta.cliqz.com/api/v1/config',
        SAFE_BROWSING: 'https://safe-browsing.cliqz.com',
        TUTORIAL_URL: 'https://cliqz.com/home/onboarding',
        UNINSTALL: 'https://cliqz.com/home/offboarding',
        FEEDBACK: 'https://cliqz.com/feedback/',
        SYSTEM_BASE_URL: CLIQZEnvironment.SYSTEM_BASE_URL,
        PREFERRED_LANGUAGE: null,
        RESULTS_TIMEOUT: CLIQZEnvironment.RESULTS_TIMEOUT,

        BRANDS_DATABASE: BRANDS_DATABASE,

        //will be updated from the mixer config endpoint every time new logos are generated
        BRANDS_DATABASE_VERSION: 1457952995848,
        GEOLOC_WATCH_ID: null, // The ID of the geolocation watcher (function that updates cached geolocation on change)
        VERTICAL_TEMPLATES: {
          'n': 'news',
          'p': 'people',
          'v': 'video',
          'h': 'hq',
          'r': 'recipe',
          'g': 'cpgame_movie',
          'o': 'cpgame_movie'
        },
        hm: null,
        TEMPLATES_PATH: CLIQZEnvironment.TEMPLATES_PATH,
        TEMPLATES: CLIQZEnvironment.TEMPLATES,
        MESSAGE_TEMPLATES: CLIQZEnvironment.MESSAGE_TEMPLATES,
        PARTIALS: CLIQZEnvironment.PARTIALS,
        SKIN_PATH: CLIQZEnvironment.SKIN_PATH,
        LOCALE_PATH: CLIQZEnvironment.LOCALE_PATH,
        RERANKERS: CLIQZEnvironment.RERANKERS,
        MIN_QUERY_LENGHT_FOR_EZ: CLIQZEnvironment.MIN_QUERY_LENGHT_FOR_EZ,

        init: function init(options) {
          options = options || {};

          if (!options.lang) {
            return Promise.reject("lang missing");
          }
          CliqzUtils.importModule('core/gzip').then(function (gzip) {
            CLIQZEnvironment.gzip = gzip;
          })['catch'](function () {
            //no gzip, do nothing
          });

          // FIXME: `import CliqzLanguage from "platform/language";` does not work
          CliqzUtils.importModule('platform/language').then(function (language) {
            CliqzLanguage = language['default'];
          })['catch'](function () {
            CliqzUtils.log('error: cannot load CliqzLanguage');
          });

          // cutting cyclic dependency
          CLIQZEnvironment.getLogoDetails = CliqzUtils.getLogoDetails.bind(CliqzUtils);
          CLIQZEnvironment.getDetailsFromUrl = CliqzUtils.getDetailsFromUrl.bind(CliqzUtils);
          CLIQZEnvironment.getLocalizedString = CliqzUtils.getLocalizedString.bind(CliqzUtils);
          CLIQZEnvironment.SKIN_PATH = CliqzUtils.SKIN_PATH;

          if (!brand_loaded) {
            brand_loaded = true;

            var config = this.getPref("config_logoVersion"),
                dev = this.getPref("brands-database-version");

            if (dev) this.BRANDS_DATABASE_VERSION = dev;else if (config) this.BRANDS_DATABASE_VERSION = config;

            var retryPattern = [60 * MINUTE, 10 * MINUTE, 5 * MINUTE, 2 * MINUTE, MINUTE];

            (function getLogoDB(url) {

              CliqzUtils && CliqzUtils.httpGet(url, function (req) {
                CliqzUtils.BRANDS_DATABASE = BRANDS_DATABASE = JSON.parse(req.response);
              }, function () {
                var retry = retryPattern.pop();
                if (retry) CliqzUtils.setTimeout(getLogoDB, retry, url);
              }, MINUTE / 2);
            })(CLIQZEnvironment.getBrandsDBUrl(this.BRANDS_DATABASE_VERSION));
          }

          CliqzUtils.log('Initialized', 'CliqzUtils');

          CliqzUtils.setLang(options.lang);
        },

        setLang: function setLang(lang) {
          CliqzUtils.PREFERRED_LANGUAGE = lang;
          CliqzUtils.loadLocale(CliqzUtils.PREFERRED_LANGUAGE);
        },

        initPlatform: function initPlatform(System) {
          System.baseURL = CLIQZEnvironment.SYSTEM_BASE_URL;
          CliqzUtils.System = System;
        },

        importModule: function importModule(moduleName) {
          return CliqzUtils.System['import'](moduleName);
        },

        callAction: function callAction(moduleName, actionName, args) {
          var module = CliqzUtils.System.get(moduleName + "/background");
          var action = module['default'].actions[actionName];
          return action.apply(null, args);
        },

        callWindowAction: function callWindowAction(win, moduleName, actionName, args) {
          try {
            var module = win.CLIQZ.Core.windowModules[moduleName];
            var action = module.actions[actionName];
            return action.apply(null, args);
          } catch (e) {
            CliqzUtils.log(e.message, "callWindowAction failed");
          }
        },

        isNumber: function isNumber(n) {
          /*
          NOTE: this function can't recognize numbers in the form such as: "1.2B", but it can for "1e4". See specification for isFinite()
           */
          return !isNaN(parseFloat(n)) && isFinite(n);
        },

        //returns the type only if it is known
        getKnownType: function getKnownType(type) {
          return VERTICAL_ENCODINGS.hasOwnProperty(type) && type;
        },

        /**
         * Construct a uri from a url
         * @param {string}  aUrl - url
         * @param {string}  aOriginCharset - optional character set for the URI
         * @param {nsIURI}  aBaseURI - base URI for the spec
         */
        makeUri: CLIQZEnvironment.makeUri,

        //move this out of CliqzUtils!
        setSupportInfo: function setSupportInfo(status) {
          var prefs = Components.classes['@mozilla.org/preferences-service;1'].getService(Components.interfaces.nsIPrefBranch),
              host = 'firefox',
              hostVersion = '';

          //check if the prefs exist and if they are string
          if (prefs.getPrefType('distribution.id') == 32 && prefs.getPrefType('distribution.version') == 32) {
            host = prefs.getCharPref('distribution.id');
            hostVersion = prefs.getCharPref('distribution.version');
          }
          var info = JSON.stringify({
            version: CliqzUtils.extensionVersion,
            host: host,
            hostVersion: hostVersion,
            status: status != undefined ? status : "active"
          }),
              sites = ["http://cliqz.com", "https://cliqz.com"];

          sites.forEach(function (url) {
            var ls = CLIQZEnvironment.getLocalStorage(url);

            if (ls) ls.setItem("extension-info", info);
          });
        },
        getLogoDetails: function getLogoDetails(urlDetails) {
          var base = urlDetails.name,
              baseCore = base.replace(/[-]/g, ""),
              check = function check(host, rule) {
            var address = host.lastIndexOf(base),
                parseddomain = host.substr(0, address) + "$" + host.substr(address + base.length);

            return parseddomain.indexOf(rule) != -1;
          },
              result = {},
              domains = BRANDS_DATABASE.domains;

          if (base.length == 0) return result;

          if (base == "IP") result = { text: "IP", backgroundColor: "9077e3" };else if (domains[base]) {
            for (var i = 0, imax = domains[base].length; i < imax; i++) {
              var rule = domains[base][i]; // r = rule, b = background-color, l = logo, t = text, c = color

              if (i == imax - 1 || check(urlDetails.host, rule.r)) {
                result = {
                  backgroundColor: rule.b ? rule.b : null,
                  backgroundImage: rule.l ? "url(https://cdn.cliqz.com/brands-database/database/" + this.BRANDS_DATABASE_VERSION + "/logos/" + base + "/" + rule.r + ".svg)" : "",
                  text: rule.t,
                  color: rule.c ? "" : "#fff"
                };

                break;
              }
            }
          }
          result.text = result.text || (baseCore.length > 1 ? baseCore[0].toUpperCase() + baseCore[1].toLowerCase() : "");
          result.backgroundColor = result.backgroundColor || BRANDS_DATABASE.palette[base.split("").reduce(function (a, b) {
            return a + b.charCodeAt(0);
          }, 0) % BRANDS_DATABASE.palette.length];
          var colorID = BRANDS_DATABASE.palette.indexOf(result.backgroundColor),
              buttonClass = BRANDS_DATABASE.buttons && colorID != -1 && BRANDS_DATABASE.buttons[colorID] ? BRANDS_DATABASE.buttons[colorID] : 10;

          result.buttonsClass = "cliqz-brands-button-" + buttonClass;
          result.style = "background-color: #" + result.backgroundColor + ";color:" + (result.color || '#fff') + ";";

          if (result.backgroundImage) result.style += "background-image:" + result.backgroundImage + "; text-indent: -10em;";

          return result;
        },
        httpHandler: function httpHandler() {
          var errorHandler = arguments[3]; // see httpGet or httpPost arguments
          try {
            return CLIQZEnvironment.httpHandler.apply(CLIQZEnvironment, arguments);
          } catch (e) {
            if (errorHandler) {
              errorHandler(e);
            } else {
              CliqzUtils.log(e, "httpHandler failed");
            }
          }
        },
        httpGet: function httpGet(url, callback, onerror, timeout, _, sync) {
          return CliqzUtils.httpHandler('GET', url, callback, onerror, timeout, _, sync);
        },
        httpPost: function httpPost(url, callback, data, onerror, timeout) {
          return CliqzUtils.httpHandler('POST', url, callback, onerror, timeout, data);
        },
        getLocalStorage: CLIQZEnvironment.getLocalStorage,
        /**
         * Loads a resource URL from the xpi.
         *
         * Wraps httpGet in a try-catch clause. We need to do this, because when
         * trying to load a non-existing file from an xpi via xmlhttprequest, Firefox
         * throws a NS_ERROR_FILE_NOT_FOUND exception instead of calling the onerror
         * function.
         *
         * @see https://bugzilla.mozilla.org/show_bug.cgi?id=827243 (probably).
         */
        loadResource: function loadResource(url, callback, onerror) {
          try {
            return CliqzUtils.httpGet(url, callback, onerror, 3000);
          } catch (e) {
            CliqzUtils.log("Could not load resource " + url + " from the xpi", "CliqzUtils.httpHandler");
            onerror && onerror();
          }
        },
        openTabInWindow: CLIQZEnvironment.openTabInWindow,
        /**
         * Get a value from preferences db
         * @param {string}  pref - preference identifier
         * @param {*=}      defautlValue - returned value in case pref is not defined
         * @param {string=} prefix - prefix for pref
         */
        getPref: CLIQZEnvironment.getPref,
        /**
         * Set a value in preferences db
         * @param {string}  pref - preference identifier
         * @param {*=}      defautlValue - returned value in case pref is not defined
         * @param {string=} prefix - prefix for pref
         */
        setPref: CLIQZEnvironment.setPref,
        /**
         * Check if there is a value in preferences db
         * @param {string}  pref - preference identifier
         * @param {string=} prefix - prefix for pref
         */
        hasPref: CLIQZEnvironment.hasPref,
        /**
         * Clear value in preferences db
         * @param {string}  pref - preference identifier
         * @param {string=} prefix - prefix for pref
         */
        clearPref: CLIQZEnvironment.clearPref,
        log: CLIQZEnvironment.log,
        getDay: function getDay() {
          return Math.floor(new Date().getTime() / 86400000);
        },
        //creates a random 'len' long string from the input space
        rand: function rand(len, _space) {
          var ret = '',
              i,
              space = _space || 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
              sLen = space.length;

          for (i = 0; i < len; i++) ret += space.charAt(Math.floor(Math.random() * sLen));

          return ret;
        },
        hash: function hash(s) {
          return s.split('').reduce(function (a, b) {
            return (a << 4) - a + b.charCodeAt(0) & 0xEFFFFFF;
          }, 0);
        },
        cleanMozillaActions: function cleanMozillaActions(url) {
          if (url.indexOf("moz-action:") == 0) {
            var _url$match = url.match(/^moz-action:([^,]+),(.*)$/);

            var _url$match2 = _slicedToArray(_url$match, 3);

            var action = _url$match2[1];
            var url = _url$match2[2];

            //url = url.match(/^moz-action:([^,]+),(.*)$/)[2];
          }
          return [action, url];
        },
        cleanUrlProtocol: function cleanUrlProtocol(url, cleanWWW) {
          if (!url) return '';

          var protocolPos = url.indexOf('://');

          // removes protocol http(s), ftp, ...
          if (protocolPos != -1 && protocolPos <= 6) url = url.split('://')[1];

          // removes the www.
          if (cleanWWW && url.toLowerCase().indexOf('www.') == 0) url = url.slice(4);

          return url;
        },
        getDetailsFromUrl: function getDetailsFromUrl(originalUrl) {
          var _CliqzUtils$cleanMozillaActions = CliqzUtils.cleanMozillaActions(originalUrl);

          var _CliqzUtils$cleanMozillaActions2 = _slicedToArray(_CliqzUtils$cleanMozillaActions, 2);

          var action = _CliqzUtils$cleanMozillaActions2[0];
          var originalUrl = _CliqzUtils$cleanMozillaActions2[1];

          // exclude protocol
          var url = originalUrl,
              name = '',
              tld = '',
              subdomains = [],
              path = '',
              query = '',
              fragment = '',
              ssl = originalUrl.indexOf('https') == 0;

          // remove scheme
          url = CliqzUtils.cleanUrlProtocol(url, false);
          var scheme = originalUrl.replace(url, '').replace('//', '');

          // separate hostname from path, etc. Could be separated from rest by /, ? or #
          var host = url.split(/[\/\#\?]/)[0].toLowerCase();
          var path = url.replace(host, '');

          // separate username:password@ from host
          var userpass_host = host.split('@');
          if (userpass_host.length > 1) host = userpass_host[1];

          // Parse Port number
          var port = "";

          var isIPv4 = ipv4_regex.test(host);
          var isIPv6 = ipv6_regex.test(host);

          var indexOfColon = host.indexOf(":");
          if ((!isIPv6 || isIPv4) && indexOfColon >= 0) {
            port = host.substr(indexOfColon + 1);
            host = host.substr(0, indexOfColon);
          } else if (isIPv6) {
            // If an IPv6 address has a port number, it will be right after a closing bracket ] : format [ip_v6]:port
            var endOfIP = host.indexOf(']:');
            if (endOfIP >= 0) {
              port = host.split(']:')[1];
              host = host.split(']:')[0].replace('[', '').replace(']', '');
            }
          }

          // extract query and fragment from url
          var query = '';
          var query_idx = path.indexOf('?');
          if (query_idx != -1) {
            query = path.substr(query_idx + 1);
          }

          var fragment = '';
          var fragment_idx = path.indexOf('#');
          if (fragment_idx != -1) {
            fragment = path.substr(fragment_idx + 1);
          }

          // remove query and fragment from path
          path = path.replace('?' + query, '');
          path = path.replace('#' + fragment, '');
          query = query.replace('#' + fragment, '');

          // extra - all path, query and fragment
          var extra = path;
          if (query) extra += "?" + query;
          if (fragment) extra += "#" + fragment;

          isIPv4 = ipv4_regex.test(host);
          isIPv6 = ipv6_regex.test(host);
          var isLocalhost = CliqzUtils.isLocalhost(host, isIPv4, isIPv6);

          // find parts of hostname
          if (!isIPv4 && !isIPv6 && !isLocalhost) {
            try {
              tld = CLIQZEnvironment.tldExtractor(host);

              // Get the domain name w/o subdomains and w/o TLD
              name = host.slice(0, -(tld.length + 1)).split('.').pop(); // +1 for the '.'

              // Get subdomains
              var name_tld = name + "." + tld;
              subdomains = host.slice(0, -name_tld.length).split(".").slice(0, -1);

              //remove www if exists
              // TODO: I don't think this is the right place to do this.
              //       Disabled for now, but check there are no issues.
              // host = host.indexOf('www.') == 0 ? host.slice(4) : host;
            } catch (e) {
              name = "";
              host = "";
              //CliqzUtils.log('WARNING Failed for: ' + originalUrl, 'CliqzUtils.getDetailsFromUrl');
            }
          } else {
              name = isLocalhost ? "localhost" : "IP";
            }

          // remove www from beginning, we need cleanHost in the friendly url
          var cleanHost = host;
          if (host.toLowerCase().indexOf('www.') == 0) {
            cleanHost = host.slice(4);
          }

          var friendly_url = cleanHost + extra;
          //remove trailing slash from the end
          friendly_url = CliqzUtils.stripTrailingSlash(friendly_url);

          //Handle case where we have only tld for example http://cliqznas
          if (cleanHost === tld) {
            name = tld;
          }

          var urlDetails = {
            scheme: scheme,
            name: name,
            domain: tld ? name + '.' + tld : '',
            tld: tld,
            subdomains: subdomains,
            path: path,
            query: query,
            fragment: fragment,
            extra: extra,
            host: host,
            cleanHost: cleanHost,
            ssl: ssl,
            port: port,
            friendly_url: friendly_url
          };

          return urlDetails;
        },
        stripTrailingSlash: function stripTrailingSlash(str) {
          if (str.substr(-1) === '/') {
            return str.substr(0, str.length - 1);
          }
          return str;
        },
        _isUrlRegExp: /^(([a-z\d]([a-z\d-]*[a-z\d]))\.)+[a-z]{2,}(\:\d+)?$/i,
        isUrl: function isUrl(input) {
          //step 1 remove eventual protocol
          var protocolPos = input.indexOf('://');
          if (protocolPos != -1 && protocolPos <= 6) {
            input = input.slice(protocolPos + 3);
          }
          //step2 remove path & everything after
          input = input.split('/')[0];
          //step3 run the regex
          return CliqzUtils._isUrlRegExp.test(input);
        },

        // Chechks if the given string is a valid IPv4 addres
        isIPv4: function isIPv4(input) {
          var ipv4_part = "0*([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])"; // numbers 0 - 255
          var ipv4_regex = new RegExp("^" + ipv4_part + "\\." + ipv4_part + "\\." + ipv4_part + "\\." + ipv4_part + "([:]([0-9])+)?$"); // port number
          return ipv4_regex.test(input);
        },

        isIPv6: function isIPv6(input) {

          // Currently using a simple regex for "what looks like an IPv6 address" for readability
          var ipv6_regex = new RegExp("^\\[?(([0-9]|[a-f]|[A-F])*[:.]+([0-9]|[a-f]|[A-F])+[:.]*)+[\\]]?([:][0-9]+)?$");
          return ipv6_regex.test(input);

          /* A better (more precise) regex to validate IPV6 addresses from StackOverflow:
          link: http://stackoverflow.com/questions/53497/regular-expression-that-matches-valid-ipv6-addresses
           var ipv6_regex = new RegExp("(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:)"
          + "{1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,"
          + "4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a"
          + "-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}"
          + "|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])"
          + "|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))");
          */
        },

        isLocalhost: function isLocalhost(host, isIPv4, isIPv6) {
          if (host == "localhost") return true;
          if (isIPv4 && host.substr(0, 3) == "127") return true;
          if (isIPv6 && host == "::1") return true;

          return false;
        },

        // checks if a value represents an url which is a seach engine
        isSearch: function isSearch(value) {
          if (CliqzUtils.isUrl(value)) {
            return CliqzUtils.getDetailsFromUrl(value).host.indexOf('google') === 0 ? true : false;
          }
          return false;
        },
        // checks if a string is a complete url
        isCompleteUrl: function isCompleteUrl(input) {
          var pattern = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/;
          if (!pattern.test(input)) {
            return false;
          } else {
            return true;
          }
        },
        // extract query term from search engine result page URLs
        extractQueryFromUrl: function extractQueryFromUrl(url) {
          // Google
          if (url.search(/http(s?):\/\/www\.google\..*\/.*q=.*/i) === 0) {
            url = url.substring(url.lastIndexOf('q=') + 2).split('&')[0];
            // Bing
          } else if (url.search(/http(s?):\/\/www\.bing\..*\/.*q=.*/i) === 0) {
              url = url.substring(url.indexOf('q=') + 2).split('&')[0];
              // Yahoo
            } else if (url.search(/http(s?):\/\/.*search\.yahoo\.com\/search.*p=.*/i) === 0) {
                url = url.substring(url.indexOf('p=') + 2).split('&')[0];
              } else {
                url = null;
              }
          var decoded = url ? decodeURIComponent(url.replace(/\+/g, ' ')) : null;
          if (decoded) return decoded;else return url;
        },
        // Remove clutter (http, www) from urls
        generalizeUrl: function generalizeUrl(url, skipCorrection) {
          if (!url) {
            return '';
          }
          var val = url.toLowerCase();
          var cleanParts = CliqzUtils.cleanUrlProtocol(val, false).split('/'),
              host = cleanParts[0],
              pathLength = 0,
              SYMBOLS = /,|\./g;
          if (!skipCorrection) {
            if (cleanParts.length > 1) {
              pathLength = ('/' + cleanParts.slice(1).join('/')).length;
            }
            if (host.indexOf('www') === 0 && host.length > 4) {
              // only fix symbols in host
              if (SYMBOLS.test(host[3]) && host[4] != ' ')
                // replace only issues in the host name, not ever in the path
                val = val.substr(0, val.length - pathLength).replace(SYMBOLS, '.') + (pathLength ? val.substr(-pathLength) : '');
            }
          }
          url = CliqzUtils.cleanUrlProtocol(val, true);
          return url[url.length - 1] == '/' ? url.slice(0, -1) : url;
        },
        // Remove clutter from urls that prevents pattern detection, e.g. checksum
        simplifyUrl: function simplifyUrl(url) {
          var q;
          // Google redirect urls
          if (url.search(/http(s?):\/\/www\.google\..*\/url\?.*url=.*/i) === 0) {
            // Return target URL instead
            url = url.substring(url.lastIndexOf('url=')).split('&')[0];
            url = url.substr(4);
            return decodeURIComponent(url);

            // Remove clutter from Google searches
          } else if (url.search(/http(s?):\/\/www\.google\..*\/.*q=.*/i) === 0) {
              q = url.substring(url.lastIndexOf('q=')).split('&')[0];
              if (q != 'q=') {
                // tbm defines category (images/news/...)
                var param = url.indexOf('#') != -1 ? url.substr(url.indexOf('#')) : url.substr(url.indexOf('?'));
                var tbm = param.indexOf('tbm=') != -1 ? '&' + param.substring(param.lastIndexOf('tbm=')).split('&')[0] : '';
                var page = param.indexOf('start=') != -1 ? '&' + param.substring(param.lastIndexOf('start=')).split('&')[0] : '';
                return 'https://www.google.com/search?' + q + tbm /*+ page*/;
              } else {
                  return url;
                }
              // Bing
            } else if (url.search(/http(s?):\/\/www\.bing\..*\/.*q=.*/i) === 0) {
                q = url.substring(url.indexOf('q=')).split('&')[0];
                if (q != 'q=') {
                  if (url.indexOf('search?') != -1) return url.substr(0, url.indexOf('search?')) + 'search?' + q;else return url.substr(0, url.indexOf('/?')) + '/?' + q;
                } else {
                  return url;
                }
                // Yahoo redirect
              } else if (url.search(/http(s?):\/\/r.search\.yahoo\.com\/.*/i) === 0) {
                  url = url.substring(url.lastIndexOf('/RU=')).split('/RK=')[0];
                  url = url.substr(4);
                  return decodeURIComponent(url);
                  // Yahoo
                } else if (url.search(/http(s?):\/\/.*search\.yahoo\.com\/search.*p=.*/i) === 0) {
                    var p = url.substring(url.indexOf('p=')).split('&')[0];
                    if (p != 'p=' && url.indexOf(';') != -1) {
                      return url.substr(0, url.indexOf(';')) + '?' + p;
                    } else {
                      return url;
                    }
                  } else {
                    return url;
                  }
        },
        // establishes the connection
        pingCliqzResults: function pingCliqzResults() {
          CliqzUtils.httpHandler('HEAD', CliqzUtils.RESULTS_PROVIDER_PING);
        },
        getBackendResults: function getBackendResults(q, callback) {},
        getCliqzResults: function getCliqzResults(q, callback) {
          CliqzUtils._sessionSeq++;

          // if the user sees the results more than 500ms we consider that he starts a new query
          if (CliqzUtils._queryLastDraw && Date.now() > CliqzUtils._queryLastDraw + 500) {
            CliqzUtils._queryCount++;
          }
          CliqzUtils._queryLastDraw = 0; // reset last Draw - wait for the actual draw
          CliqzUtils._queryLastLength = q.length;

          var url = CliqzUtils.RESULTS_PROVIDER + encodeURIComponent(q) + CliqzUtils.encodeSessionParams() + CliqzLanguage.stateToQueryString() + CliqzUtils.encodeLocale() + CliqzUtils.encodeResultOrder() + CliqzUtils.encodeCountry() + CliqzUtils.encodeFilter() + CliqzUtils.encodeLocation() + CliqzUtils.encodeResultCount(7) + CliqzUtils.disableWikiDedup();

          var req = CliqzUtils.httpGet(url, function (res) {
            callback && callback(res, q);
          });
        },
        // IP driven configuration
        fetchAndStoreConfig: function fetchAndStoreConfig(callback) {
          CliqzUtils.httpGet(CliqzUtils.CONFIG_PROVIDER, function (res) {
            if (res && res.response) {
              try {
                var config = JSON.parse(res.response);
                for (var k in config) {
                  CliqzUtils.setPref('config_' + k, config[k]);
                }
              } catch (e) {}
            }

            callback();
          }, callback, //on error the callback still needs to be called
          2000);
        },
        encodeLocale: function encodeLocale() {
          // send browser language to the back-end
          return '&locale=' + (CliqzUtils.PREFERRED_LANGUAGE || "");
        },
        encodeCountry: function encodeCountry() {
          //international results not supported
          return '&force_country=true';
        },
        disableWikiDedup: function disableWikiDedup() {
          // disable wikipedia deduplication on the backend side
          var doDedup = CliqzUtils.getPref("languageDedup", false);
          if (doDedup) return '&ddl=0';else return "";
        },
        encodeFilter: function encodeFilter() {
          var data = {
            'conservative': 3,
            'moderate': 0,
            'liberal': 1
          },
              state = data[CliqzUtils.getPref('adultContentFilter', 'moderate')];

          return '&adult=' + state;
        },
        encodeResultCount: function encodeResultCount(count) {
          var doDedup = CliqzUtils.getPref("languageDedup", false);
          count = count || 5;
          if (doDedup) return '&count=' + count;else return "";
        },
        encodeResultType: function encodeResultType(type) {
          if (type.indexOf('action') !== -1) return ['T'];else if (type.indexOf('cliqz-results') == 0) return CliqzUtils.encodeCliqzResultType(type);else if (type.indexOf('cliqz-pattern') == 0) return ['C'];else if (type === 'cliqz-extra') return ['X'];else if (type === 'cliqz-series') return ['S'];else if (type.indexOf('bookmark') == 0 || type.indexOf('tag') == 0) return ['B'].concat(CliqzUtils.encodeCliqzResultType(type));else if (type.indexOf('favicon') == 0 || type.indexOf('history') == 0) return ['H'].concat(CliqzUtils.encodeCliqzResultType(type));

          // cliqz type = "cliqz-custom sources-X"
          else if (type.indexOf('cliqz-custom') == 0) return type.substr(21);

          return type; //should never happen
        },
        //eg types: [ "H", "m" ], [ "H|instant", "X|11" ]
        isPrivateResultType: function isPrivateResultType(type) {
          var onlyType = type[0].split('|')[0];
          return 'HBTCS'.indexOf(onlyType) != -1 && type.length == 1;
        },
        // cliqz type = "cliqz-results sources-XXXXX" or "favicon sources-XXXXX" if combined with history
        encodeCliqzResultType: function encodeCliqzResultType(type) {
          var pos = type.indexOf('sources-');
          if (pos != -1) return CliqzUtils.encodeSources(type.substr(pos + 8));else return [];
        },
        // random ID generated at each urlbar focus
        _searchSession: '',
        // number of sequences in each session
        _sessionSeq: 0,
        _queryLastLength: null,
        _queryLastDraw: null,
        // number of queries in search session
        _queryCount: null,
        setSearchSession: function setSearchSession(rand) {
          CliqzUtils._searchSession = rand;
          CliqzUtils._sessionSeq = 0;
          CliqzUtils._queryCount = 0;
          CliqzUtils._queryLastLength = 0;
          CliqzUtils._queryLastDraw = 0;
        },
        encodeSessionParams: function encodeSessionParams() {
          if (CliqzUtils._searchSession.length) {
            return '&s=' + encodeURIComponent(CliqzUtils._searchSession) + '&n=' + CliqzUtils._sessionSeq + '&qc=' + CliqzUtils._queryCount;
          } else return '';
        },

        encodeLocation: function encodeLocation(specifySource, lat, lng) {
          var qs = ['&loc_pref=', CliqzUtils.getPref('share_location', 'ask')].join('');

          if (CliqzUtils.USER_LAT && CliqzUtils.USER_LNG || lat && lng) {
            qs += ['&loc=', lat || CliqzUtils.USER_LAT, ',', lng || CliqzUtils.USER_LNG, specifySource ? ',U' : ''].join('');
          }

          return qs;
        },
        encodeSources: function encodeSources(sources) {
          return sources.toLowerCase().split(', ').map(function (s) {
            if (s.indexOf('cache') == 0) // to catch 'cache-*' for specific countries
              return 'd';else return VERTICAL_ENCODINGS[s] || s;
          });
        },
        isPrivate: CLIQZEnvironment.isPrivate,
        telemetry: CLIQZEnvironment.telemetry,
        resultTelemetry: function resultTelemetry(query, queryAutocompleted, resultIndex, resultUrl, resultOrder, extra) {
          CliqzUtils.setResultOrder(resultOrder);
          var params = encodeURIComponent(query) + (queryAutocompleted ? '&a=' + encodeURIComponent(queryAutocompleted) : '') + '&i=' + resultIndex + (resultUrl ? '&u=' + encodeURIComponent(resultUrl) : '') + CliqzUtils.encodeSessionParams() + CliqzUtils.encodeResultOrder() + (extra ? '&e=' + extra : '');
          CliqzUtils.httpGet(CliqzUtils.RESULTS_PROVIDER_LOG + params);
          CliqzUtils.setResultOrder('');
          CliqzUtils.log(params, 'Utils.resultTelemetry');
        },
        _resultOrder: '',
        setResultOrder: function setResultOrder(resultOrder) {
          CliqzUtils._resultOrder = resultOrder;
        },
        encodeResultOrder: function encodeResultOrder() {
          return CliqzUtils._resultOrder && CliqzUtils._resultOrder.length ? '&o=' + encodeURIComponent(JSON.stringify(CliqzUtils._resultOrder)) : '';
        },
        setInterval: CLIQZEnvironment.setInterval,
        setTimeout: CLIQZEnvironment.setTimeout,
        clearTimeout: CLIQZEnvironment.clearTimeout,
        clearInterval: CLIQZEnvironment.clearTimeout,
        Promise: CLIQZEnvironment.Promise,
        locale: {},
        currLocale: null,
        loadLocale: function loadLocale(lang_locale) {
          var locales = {
            "en-US": "en"
          };
          lang_locale = locales[lang_locale] || lang_locale;

          if (!CliqzUtils.locale.hasOwnProperty(lang_locale) && !CliqzUtils.locale.hasOwnProperty('default')) {
            try {
              CliqzUtils.getLocaleFile(encodeURIComponent(lang_locale), lang_locale);
            } catch (e) {
              var loc = CliqzUtils.getLanguageFromLocale(lang_locale);
              try {
                CliqzUtils.getLocaleFile(loc, lang_locale);
              } catch (e) {
                try {
                  CliqzUtils.getLocaleFile('de', 'default');
                } catch (e) {}
              }
            }
          }
        },
        getLocaleFile: function getLocaleFile(locale_path, locale_key) {
          function callback(req) {
            if (CliqzUtils) {
              if (locale_key !== 'default') {
                CliqzUtils.currLocale = locale_key;
              }
              CliqzUtils.locale[locale_key] = JSON.parse(req.response);
            }
          }
          function onerror(err) {}
          var url = CLIQZEnvironment.LOCALE_PATH + locale_path + '/cliqz.json';
          var response = CliqzUtils.httpGet(url, callback, onerror, 3000, null, true);
          if (response.readyState !== 2) {
            throw "Error";
          }
          return response;
        },
        getLanguageFromLocale: function getLanguageFromLocale(locale) {
          return locale.match(/([a-z]+)(?:[-_]([A-Z]+))?/)[1];
        },
        getLanguage: function getLanguage(win) {
          return CliqzUtils.LANGS[CliqzUtils.getLanguageFromLocale(win.navigator.language)] || 'en';
        },
        getLocalizedString: function getLocalizedString(key, substitutions) {
          if (!key) return '';

          var str = key,
              localMessages;

          if (CliqzUtils.currLocale != null && CliqzUtils.locale[CliqzUtils.currLocale] && CliqzUtils.locale[CliqzUtils.currLocale][key]) {
            str = CliqzUtils.locale[CliqzUtils.currLocale][key].message;
            localMessages = CliqzUtils.locale[CliqzUtils.currLocale];
          } else if (CliqzUtils.locale['default'] && CliqzUtils.locale['default'][key]) {
            str = CliqzUtils.locale['default'][key].message;
            localMessages = CliqzUtils.locale['default'];
          }

          if (!substitutions) {
            substitutions = [];
          }
          if (!Array.isArray(substitutions)) {
            substitutions = [substitutions];
          }

          function replacer(matched, index, dollarSigns) {
            if (index) {
              index = parseInt(index, 10) - 1;
              return index in substitutions ? substitutions[index] : "";
            } else {
              // For any series of contiguous `$`s, the first is dropped, and
              // the rest remain in the output string.
              return dollarSigns;
            }
          }
          return str.replace(/\$(?:([1-9]\d*)|(\$+))/g, replacer);
        },
        // gets all the elements with the class 'cliqz-locale' and adds
        // the localized string - key attribute - as content
        localizeDoc: function localizeDoc(doc) {
          var locale = doc.getElementsByClassName('cliqz-locale');
          for (var i = 0; i < locale.length; i++) {
            var el = locale[i];
            el.textContent = CliqzUtils.getLocalizedString(el.getAttribute('key'));
          }
        },
        extensionRestart: function extensionRestart(changes) {
          var enumerator = Services.wm.getEnumerator('navigator:browser');
          while (enumerator.hasMoreElements()) {
            var win = enumerator.getNext();
            if (win.CLIQZ && win.CLIQZ.Core) {
              win.CLIQZ.Core.unload(true);
            }
          }

          changes && changes();

          var corePromises = [];
          enumerator = Services.wm.getEnumerator('navigator:browser');
          while (enumerator.hasMoreElements()) {
            var win = enumerator.getNext();
            if (win.CLIQZ && win.CLIQZ.Core) {
              corePromises.push(win.CLIQZ.Core.init());
            }
          }

          return Promise.all(corePromises);
        },
        isWindows: function isWindows() {
          return CLIQZEnvironment.OS.indexOf("win") === 0;
        },
        isMac: function isMac() {
          return CLIQZEnvironment.OS.indexOf("darwin") === 0;
        },
        isLinux: function isLinux() {
          return CLIQZEnvironment.OS.indexOf("linux") === 0;
        },
        getWindow: CLIQZEnvironment.getWindow,
        getWindowID: CLIQZEnvironment.getWindowID,
        hasClass: function hasClass(element, className) {
          return (' ' + element.className + ' ').indexOf(' ' + className + ' ') > -1;
        },
        /**
         * Bind functions contexts to a specified object.
         * @param {Object} from - An object, whose function properties will be processed.
         * @param {Object} to - An object, which will be the context (this) of processed functions.
         */
        bindObjectFunctions: function bindObjectFunctions(from, to) {
          for (var funcName in from) {
            var func = from[funcName];
            if (!from.hasOwnProperty(funcName)) continue;
            // Can't compare with prototype of object from a different module.
            if (typeof func != "function") continue;
            from[funcName] = func.bind(to);
          }
        },
        tryDecodeURIComponent: function tryDecodeURIComponent(s) {
          // avoide error from decodeURIComponent('%2')
          try {
            return decodeURIComponent(s);
          } catch (e) {
            return s;
          }
        },
        tryEncodeURIComponent: function tryEncodeURIComponent(s) {
          try {
            return encodeURIComponent(s);
          } catch (e) {
            return s;
          }
        },
        parseQueryString: function parseQueryString(qstr) {
          var query = {};
          var a = (qstr || '').split('&');
          for (var i in a) {
            var b = a[i].split('=');
            query[CliqzUtils.tryDecodeURIComponent(b[0])] = CliqzUtils.tryDecodeURIComponent(b[1]);
          }

          return query;
        },
        roundToDecimal: function roundToDecimal(number, digits) {
          var multiplier = Math.pow(10, digits);
          return Math.round(number * multiplier) / multiplier;
        },
        getAdultFilterState: function getAdultFilterState() {
          var data = {
            'conservative': {
              name: CliqzUtils.getLocalizedString('always'),
              selected: false
            },
            'moderate': {
              name: CliqzUtils.getLocalizedString('always_ask'),
              selected: false
            },
            'liberal': {
              name: CliqzUtils.getLocalizedString('never'),
              selected: false
            }
          };

          data[CliqzUtils.getPref('adultContentFilter', 'moderate')].selected = true;

          return data;
        },
        getLocationPermState: function getLocationPermState() {
          var data = {
            'yes': {
              name: CliqzUtils.getLocalizedString('always'),
              selected: false
            },
            'ask': {
              name: CliqzUtils.getLocalizedString('always_ask'),
              selected: false
            },
            'no': {
              name: CliqzUtils.getLocalizedString('never'),
              selected: false
            }
          };

          data[CliqzUtils.getPref('share_location', 'ask')].selected = true;

          return data;
        },

        // Returns result elements selecatble and navigatable from keyboard.
        // |container| search context, usually it's `CLIQZ.UI.gCliqzBox`.
        extractSelectableElements: function extractSelectableElements(container) {
          return Array.prototype.slice.call(container.querySelectorAll('[arrow]')).filter(function (el) {
            // dont consider hidden elements
            if (el.offsetParent == null) return false;

            if (!el.getAttribute('arrow-if-visible')) return true;

            // check if the element is visible
            //
            // for now this check is enough but we might be forced to switch to a
            // more generic approach - maybe using document.elementFromPoint(x, y)
            if (el.offsetLeft + el.offsetWidth > el.parentElement.offsetWidth) return false;
            return true;
          });
        },

        getNoResults: CLIQZEnvironment.getNoResults,
        disableCliqzResults: CLIQZEnvironment.disableCliqzResults,
        enableCliqzResults: CLIQZEnvironment.enableCliqzResults,
        getParameterByName: function getParameterByName(name, location) {
          name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
          var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
              results = regex.exec(location.search);
          return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
        },
        addEventListenerToElements: CLIQZEnvironment.addEventListenerToElements,
        search: CLIQZEnvironment.search,
        distance: function distance(lon1, lat1) {
          var lon2 = arguments.length <= 2 || arguments[2] === undefined ? CliqzUtils.USER_LNG : arguments[2];
          var lat2 = arguments.length <= 3 || arguments[3] === undefined ? CliqzUtils.USER_LAT : arguments[3];

          /** Converts numeric degrees to radians */
          function degreesToRad(degree) {
            return degree * Math.PI / 180;
          }

          var R = 6371; // Radius of the earth in km
          if (!lon2 || !lon1 || !lat2 || !lat1) {
            return -1;
          }
          var dLat = degreesToRad(lat2 - lat1); // Javascript functions in radians
          var dLon = degreesToRad(lon2 - lon1);
          var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(degreesToRad(lat1)) * Math.cos(degreesToRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
          var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          var d = R * c; // Distance in km
          return d;
        },
        getDefaultSearchEngine: CLIQZEnvironment.getDefaultSearchEngine,
        copyResult: CLIQZEnvironment.copyResult,
        openPopup: CLIQZEnvironment.openPopup,
        isOnPrivateTab: CLIQZEnvironment.isOnPrivateTab,
        getCliqzPrefs: CLIQZEnvironment.getCliqzPrefs,
        isDefaultBrowser: CLIQZEnvironment.isDefaultBrowser,
        initHomepage: CLIQZEnvironment.initHomepage,
        setDefaultSearchEngine: CLIQZEnvironment.setDefaultSearchEngine,
        isUnknownTemplate: CLIQZEnvironment.isUnknownTemplate,
        historySearch: CLIQZEnvironment.historySearch,
        getEngineByName: CLIQZEnvironment.getEngineByName,
        addEngineWithDetails: CLIQZEnvironment.addEngineWithDetails,
        getEngineByAlias: CLIQZEnvironment.getEngineByAlias,
        getSearchEngines: CLIQZEnvironment.getSearchEngines,
        updateAlias: CLIQZEnvironment.updateAlias,
        promiseHttpHandler: CLIQZEnvironment.promiseHttpHandler,
        registerResultProvider: function registerResultProvider(o) {
          CLIQZEnvironment.CliqzResultProviders = o.ResultProviders;
          CLIQZEnvironment.Result = o.Result;
        },
        onRenderComplete: function onRenderComplete(query, box) {
          if (!CLIQZEnvironment.onRenderComplete) return;

          var linkNodes = this.extractSelectableElements(box);
          var urls = linkNodes.map(function (node) {
            return node.getAttribute("url") || node.getAttribute("href");
          }).filter(function (url) {
            return !!url;
          });

          CLIQZEnvironment.onRenderComplete(query, urls);
        }
      };

      _export('default', CliqzUtils);
    }
  };
});
// numbers 0 - 255
// port number
//# sourceMappingURL=data:application/json;base64,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QyxNQUFNLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQztTQUNwQztBQUNELHdCQUFnQixFQUFFLDBCQUFTLEtBQUssRUFBRSxHQUFHLEVBQUM7QUFDcEMsY0FBSSxDQUFDLGdCQUFnQixDQUFDLGdCQUFnQixFQUNwQyxPQUFPOztBQUVULGNBQUksU0FBUyxHQUFHLElBQUksQ0FBQyx5QkFBeUIsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNwRCxjQUFJLElBQUksR0FBRyxTQUFTLENBQ2YsR0FBRyxDQUFDLFVBQUEsSUFBSTttQkFBSSxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsTUFBTSxDQUFDO1dBQUEsQ0FBQyxDQUNsRSxNQUFNLENBQUMsVUFBQSxHQUFHO21CQUFJLENBQUMsQ0FBQyxHQUFHO1dBQUEsQ0FBQyxDQUFDOztBQUUxQiwwQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDaEQ7T0FDRjs7eUJBRWMsVUFBVSIsImZpbGUiOiJjb3JlL3V0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IENMSVFaRW52aXJvbm1lbnQgZnJvbSBcInBsYXRmb3JtL2Vudmlyb25tZW50XCI7XG5cbnZhciBDbGlxekxhbmd1YWdlO1xuXG52YXIgVkVSVElDQUxfRU5DT0RJTkdTID0ge1xuICAgICdwZW9wbGUnOidwJyxcbiAgICAnbmV3cyc6J24nLFxuICAgICd2aWRlbyc6J3YnLFxuICAgICdocSc6J2gnLFxuICAgICdibSc6ICdtJyxcbiAgICAncmVjaXBlUkQnOiAncicsXG4gICAgJ2dhbWUnOiAnZycsXG4gICAgJ21vdmllJzogJ28nXG59O1xuXG52YXIgQ09MT1VSUyA9IFsnI2ZmY2U2ZCcsJyNmZjZmNjknLCcjOTZlMzk3JywnIzVjN2JhMScsJyNiZmJmYmYnLCcjM2I1NTk4JywnI2ZiYjQ0YycsJyMwMGIyZTUnLCcjYjNiM2IzJywnIzk5Y2NjYycsJyNmZjAwMjcnLCcjOTk5OTk5J10sXG4gICAgTE9HT1MgPSBbJ3dpa2lwZWRpYScsICdnb29nbGUnLCAnZmFjZWJvb2snLCAneW91dHViZScsICdkdWNrZHVja2dvJywgJ3N0ZXJuZWZyZXNzZXInLCAnemFsYW5kbycsICdiaWxkJywgJ3dlYicsICdlYmF5JywgJ2dteCcsICdhbWF6b24nLCAndC1vbmxpbmUnLCAnd2l3bycsICd3d2UnLCAnd2VpZ2h0d2F0Y2hlcnMnLCAncnAtb25saW5lJywgJ3dtYWdhemluZScsICdjaGlwJywgJ3NwaWVnZWwnLCAneWFob28nLCAncGF5cGFsJywgJ2ltZGInLCAnd2lraWEnLCAnbXNuJywgJ2F1dG9iaWxkJywgJ2RhaWx5bW90aW9uJywgJ2htJywgJ2hvdG1haWwnLCAnemVpdCcsICdiYWhuJywgJ3NvZnRvbmljJywgJ2hhbmRlbHNibGF0dCcsICdzdGVybicsICdjbm4nLCAnbW9iaWxlJywgJ2FldHYnLCAncG9zdGJhbmsnLCAnZGtiJywgJ2JpbmcnLCAnYWRvYmUnLCAnYmJjJywgJ25pa2UnLCAnc3RhcmJ1Y2tzJywgJ3RlY2hjcnVuY2gnLCAndmV2bycsICd0aW1lJywgJ3R3aXR0ZXInLCAnd2VhdGhlcnVuZGVyZ3JvdW5kJywgJ3hpbmcnLCAneWVscCcsICd5YW5kZXgnLCAnd2VhdGhlcicsICdmbGlja3InXSxcbiAgICBCUkFORFNfREFUQUJBU0UgPSB7IGRvbWFpbnM6IHt9LCBwYWxldHRlOiBbXCI5OTlcIl0gfSwgYnJhbmRfbG9hZGVkID0gZmFsc2UsXG4gICAgTUlOVVRFID0gNjAqMWUzLFxuICAgIGlwdjRfcGFydCA9IFwiMCooWzAtOV18WzEtOV1bMC05XXwxWzAtOV17Mn18MlswLTRdWzAtOV18MjVbMC01XSlcIiwgLy8gbnVtYmVycyAwIC0gMjU1XG4gICAgaXB2NF9yZWdleCA9IG5ldyBSZWdFeHAoXCJeXCIgKyBpcHY0X3BhcnQgKyBcIlxcXFwuXCIrIGlwdjRfcGFydCArIFwiXFxcXC5cIisgaXB2NF9wYXJ0ICsgXCJcXFxcLlwiKyBpcHY0X3BhcnQgKyBcIihbOl0oWzAtOV0pKyk/JFwiKSwgLy8gcG9ydCBudW1iZXJcbiAgICBpcHY2X3JlZ2V4ID0gbmV3IFJlZ0V4cChcIl5cXFxcWz8oKFswLTldfFthLWZdfFtBLUZdKSpbOi5dKyhbMC05XXxbYS1mXXxbQS1GXSkrWzouXSopK1tcXFxcXV0/KFs6XVswLTldKyk/JFwiKTtcblxuXG52YXIgQ2xpcXpVdGlscyA9IHtcbiAgTEFOR1M6ICAgICAgICAgICAgICAgICAgICAgICAgICB7J2RlJzonZGUnLCAnZW4nOidlbicsICdmcic6J2ZyJ30sXG4gIFJFU1VMVFNfUFJPVklERVI6ICAgICAgICAgICAgICAgJ2h0dHBzOi8vbmV3YmV0YS5jbGlxei5jb20vYXBpL3YxL3Jlc3VsdHM/cT0nLFxuICBSSUNIX0hFQURFUjogICAgICAgICAgICAgICAgICAgICdodHRwczovL25ld2JldGEuY2xpcXouY29tL2FwaS92MS9yaWNoLWhlYWRlcj9wYXRoPS9tYXAnLFxuICBSRVNVTFRTX1BST1ZJREVSX0xPRzogICAgICAgICAgICdodHRwczovL25ld2JldGEuY2xpcXouY29tL2FwaS92MS9sb2dnaW5nP3E9JyxcbiAgUkVTVUxUU19QUk9WSURFUl9QSU5HOiAgICAgICAgICAnaHR0cHM6Ly9uZXdiZXRhLmNsaXF6LmNvbS9waW5nJyxcbiAgQ09ORklHX1BST1ZJREVSOiAgICAgICAgICAgICAgICAnaHR0cHM6Ly9uZXdiZXRhLmNsaXF6LmNvbS9hcGkvdjEvY29uZmlnJyxcbiAgU0FGRV9CUk9XU0lORzogICAgICAgICAgICAgICAgICAnaHR0cHM6Ly9zYWZlLWJyb3dzaW5nLmNsaXF6LmNvbScsXG4gIFRVVE9SSUFMX1VSTDogICAgICAgICAgICAgICAgICAgJ2h0dHBzOi8vY2xpcXouY29tL2hvbWUvb25ib2FyZGluZycsXG4gIFVOSU5TVEFMTDogICAgICAgICAgICAgICAgICAgICAgJ2h0dHBzOi8vY2xpcXouY29tL2hvbWUvb2ZmYm9hcmRpbmcnLFxuICBGRUVEQkFDSzogICAgICAgICAgICAgICAgICAgICAgICdodHRwczovL2NsaXF6LmNvbS9mZWVkYmFjay8nLFxuICBTWVNURU1fQkFTRV9VUkw6ICAgICAgICAgICAgICAgIENMSVFaRW52aXJvbm1lbnQuU1lTVEVNX0JBU0VfVVJMLFxuICBQUkVGRVJSRURfTEFOR1VBR0U6ICAgICAgICAgICAgIG51bGwsXG4gIFJFU1VMVFNfVElNRU9VVDogICAgICAgICAgICAgICAgQ0xJUVpFbnZpcm9ubWVudC5SRVNVTFRTX1RJTUVPVVQsXG5cbiAgQlJBTkRTX0RBVEFCQVNFOiBCUkFORFNfREFUQUJBU0UsXG5cbiAgLy93aWxsIGJlIHVwZGF0ZWQgZnJvbSB0aGUgbWl4ZXIgY29uZmlnIGVuZHBvaW50IGV2ZXJ5IHRpbWUgbmV3IGxvZ29zIGFyZSBnZW5lcmF0ZWRcbiAgQlJBTkRTX0RBVEFCQVNFX1ZFUlNJT046IDE0NTc5NTI5OTU4NDgsXG4gIEdFT0xPQ19XQVRDSF9JRDogICAgICAgICAgICAgICAgbnVsbCwgLy8gVGhlIElEIG9mIHRoZSBnZW9sb2NhdGlvbiB3YXRjaGVyIChmdW5jdGlvbiB0aGF0IHVwZGF0ZXMgY2FjaGVkIGdlb2xvY2F0aW9uIG9uIGNoYW5nZSlcbiAgVkVSVElDQUxfVEVNUExBVEVTOiB7XG4gICAgICAgICduJzogJ25ld3MnICAgICxcbiAgICAgICAgJ3AnOiAncGVvcGxlJyAgLFxuICAgICAgICAndic6ICd2aWRlbycgICAsXG4gICAgICAgICdoJzogJ2hxJyAgICAgICxcbiAgICAgICAgJ3InOiAncmVjaXBlJyAsXG4gICAgICAgICdnJzogJ2NwZ2FtZV9tb3ZpZScsXG4gICAgICAgICdvJzogJ2NwZ2FtZV9tb3ZpZSdcbiAgICB9LFxuICBobTogbnVsbCxcbiAgVEVNUExBVEVTX1BBVEg6IENMSVFaRW52aXJvbm1lbnQuVEVNUExBVEVTX1BBVEgsXG4gIFRFTVBMQVRFUzogQ0xJUVpFbnZpcm9ubWVudC5URU1QTEFURVMsXG4gIE1FU1NBR0VfVEVNUExBVEVTOiBDTElRWkVudmlyb25tZW50Lk1FU1NBR0VfVEVNUExBVEVTLFxuICBQQVJUSUFMUzogQ0xJUVpFbnZpcm9ubWVudC5QQVJUSUFMUyxcbiAgU0tJTl9QQVRIOiBDTElRWkVudmlyb25tZW50LlNLSU5fUEFUSCxcbiAgTE9DQUxFX1BBVEg6IENMSVFaRW52aXJvbm1lbnQuTE9DQUxFX1BBVEgsXG4gIFJFUkFOS0VSUzogQ0xJUVpFbnZpcm9ubWVudC5SRVJBTktFUlMsXG4gIE1JTl9RVUVSWV9MRU5HSFRfRk9SX0VaOiBDTElRWkVudmlyb25tZW50Lk1JTl9RVUVSWV9MRU5HSFRfRk9SX0VaLFxuXG4gIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpe1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgaWYgKCFvcHRpb25zLmxhbmcpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcImxhbmcgbWlzc2luZ1wiKTtcbiAgICB9XG4gICAgQ2xpcXpVdGlscy5pbXBvcnRNb2R1bGUoJ2NvcmUvZ3ppcCcpLnRoZW4oZnVuY3Rpb24oZ3ppcCkge1xuICAgICAgQ0xJUVpFbnZpcm9ubWVudC5nemlwID0gZ3ppcDtcbiAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAvL25vIGd6aXAsIGRvIG5vdGhpbmdcbiAgICB9KTtcblxuICAgIC8vIEZJWE1FOiBgaW1wb3J0IENsaXF6TGFuZ3VhZ2UgZnJvbSBcInBsYXRmb3JtL2xhbmd1YWdlXCI7YCBkb2VzIG5vdCB3b3JrXG4gICAgQ2xpcXpVdGlscy5pbXBvcnRNb2R1bGUoJ3BsYXRmb3JtL2xhbmd1YWdlJykudGhlbihmdW5jdGlvbihsYW5ndWFnZSkge1xuICAgICAgQ2xpcXpMYW5ndWFnZSA9IGxhbmd1YWdlLmRlZmF1bHQ7XG4gICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgQ2xpcXpVdGlscy5sb2coJ2Vycm9yOiBjYW5ub3QgbG9hZCBDbGlxekxhbmd1YWdlJyk7XG4gICAgfSk7XG5cbiAgICAvLyBjdXR0aW5nIGN5Y2xpYyBkZXBlbmRlbmN5XG4gICAgQ0xJUVpFbnZpcm9ubWVudC5nZXRMb2dvRGV0YWlscyA9IENsaXF6VXRpbHMuZ2V0TG9nb0RldGFpbHMuYmluZChDbGlxelV0aWxzKTtcbiAgICBDTElRWkVudmlyb25tZW50LmdldERldGFpbHNGcm9tVXJsID0gQ2xpcXpVdGlscy5nZXREZXRhaWxzRnJvbVVybC5iaW5kKENsaXF6VXRpbHMpO1xuICAgIENMSVFaRW52aXJvbm1lbnQuZ2V0TG9jYWxpemVkU3RyaW5nID0gQ2xpcXpVdGlscy5nZXRMb2NhbGl6ZWRTdHJpbmcuYmluZChDbGlxelV0aWxzKTtcbiAgICBDTElRWkVudmlyb25tZW50LlNLSU5fUEFUSCA9IENsaXF6VXRpbHMuU0tJTl9QQVRIO1xuXG4gICAgaWYoIWJyYW5kX2xvYWRlZCl7XG4gICAgICBicmFuZF9sb2FkZWQgPSB0cnVlO1xuXG4gICAgICB2YXIgY29uZmlnID0gdGhpcy5nZXRQcmVmKFwiY29uZmlnX2xvZ29WZXJzaW9uXCIpLCBkZXYgPSB0aGlzLmdldFByZWYoXCJicmFuZHMtZGF0YWJhc2UtdmVyc2lvblwiKTtcblxuICAgICAgaWYgKGRldikgdGhpcy5CUkFORFNfREFUQUJBU0VfVkVSU0lPTiA9IGRldlxuICAgICAgZWxzZSBpZiAoY29uZmlnKSB0aGlzLkJSQU5EU19EQVRBQkFTRV9WRVJTSU9OID0gY29uZmlnXG5cbiAgICAgIHZhciByZXRyeVBhdHRlcm4gPSBbNjAqTUlOVVRFLCAxMCpNSU5VVEUsIDUqTUlOVVRFLCAyKk1JTlVURSwgTUlOVVRFXTtcblxuICAgICAgKGZ1bmN0aW9uIGdldExvZ29EQih1cmwpe1xuXG4gICAgICAgICAgQ2xpcXpVdGlscyAmJiBDbGlxelV0aWxzLmh0dHBHZXQodXJsLFxuICAgICAgICAgIGZ1bmN0aW9uKHJlcSl7XG4gICAgICAgICAgICBDbGlxelV0aWxzLkJSQU5EU19EQVRBQkFTRSA9ICBCUkFORFNfREFUQUJBU0UgPSBKU09OLnBhcnNlKHJlcS5yZXNwb25zZSk7IH0sXG4gICAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByZXRyeSA9IHJldHJ5UGF0dGVybi5wb3AoKTtcbiAgICAgICAgICAgIGlmKHJldHJ5KSBDbGlxelV0aWxzLnNldFRpbWVvdXQoZ2V0TG9nb0RCLCByZXRyeSwgdXJsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLCBNSU5VVEUvMik7XG4gICAgICB9KShDTElRWkVudmlyb25tZW50LmdldEJyYW5kc0RCVXJsKHRoaXMuQlJBTkRTX0RBVEFCQVNFX1ZFUlNJT04pKTtcbiAgICB9XG5cbiAgICBDbGlxelV0aWxzLmxvZygnSW5pdGlhbGl6ZWQnLCAnQ2xpcXpVdGlscycpO1xuXG4gICAgQ2xpcXpVdGlscy5zZXRMYW5nKG9wdGlvbnMubGFuZyk7XG4gIH0sXG5cbiAgc2V0TGFuZzogZnVuY3Rpb24gKGxhbmcpIHtcbiAgICAgQ2xpcXpVdGlscy5QUkVGRVJSRURfTEFOR1VBR0UgPSBsYW5nO1xuICAgICBDbGlxelV0aWxzLmxvYWRMb2NhbGUoQ2xpcXpVdGlscy5QUkVGRVJSRURfTEFOR1VBR0UpO1xuICB9LFxuXG4gIGluaXRQbGF0Zm9ybTogZnVuY3Rpb24oU3lzdGVtKSB7XG4gICAgU3lzdGVtLmJhc2VVUkwgPSBDTElRWkVudmlyb25tZW50LlNZU1RFTV9CQVNFX1VSTDtcbiAgICBDbGlxelV0aWxzLlN5c3RlbSA9IFN5c3RlbTtcbiAgfSxcblxuICBpbXBvcnRNb2R1bGU6IGZ1bmN0aW9uKG1vZHVsZU5hbWUpIHtcbiAgICByZXR1cm4gQ2xpcXpVdGlscy5TeXN0ZW0uaW1wb3J0KG1vZHVsZU5hbWUpXG4gIH0sXG5cbiAgY2FsbEFjdGlvbihtb2R1bGVOYW1lLCBhY3Rpb25OYW1lLCBhcmdzKSB7XG4gICAgdmFyIG1vZHVsZSA9IENsaXF6VXRpbHMuU3lzdGVtLmdldChtb2R1bGVOYW1lK1wiL2JhY2tncm91bmRcIik7XG4gICAgdmFyIGFjdGlvbiA9IG1vZHVsZS5kZWZhdWx0LmFjdGlvbnNbYWN0aW9uTmFtZV07XG4gICAgcmV0dXJuIGFjdGlvbi5hcHBseShudWxsLCBhcmdzKTtcbiAgfSxcblxuICBjYWxsV2luZG93QWN0aW9uKHdpbiwgbW9kdWxlTmFtZSwgYWN0aW9uTmFtZSwgYXJncykge1xuICAgIHRyeSB7XG4gICAgICB2YXIgbW9kdWxlID0gd2luLkNMSVFaLkNvcmUud2luZG93TW9kdWxlc1ttb2R1bGVOYW1lXTtcbiAgICAgIHZhciBhY3Rpb24gPSBtb2R1bGUuYWN0aW9uc1thY3Rpb25OYW1lXTtcbiAgICAgIHJldHVybiBhY3Rpb24uYXBwbHkobnVsbCwgYXJncyk7XG4gICAgfSBjYXRjaCAoZSl7XG4gICAgICBDbGlxelV0aWxzLmxvZyhlLm1lc3NhZ2UsIFwiY2FsbFdpbmRvd0FjdGlvbiBmYWlsZWRcIik7XG4gICAgfVxuICB9LFxuXG4gIGlzTnVtYmVyOiBmdW5jdGlvbihuKXtcbiAgICAgIC8qXG4gICAgICBOT1RFOiB0aGlzIGZ1bmN0aW9uIGNhbid0IHJlY29nbml6ZSBudW1iZXJzIGluIHRoZSBmb3JtIHN1Y2ggYXM6IFwiMS4yQlwiLCBidXQgaXQgY2FuIGZvciBcIjFlNFwiLiBTZWUgc3BlY2lmaWNhdGlvbiBmb3IgaXNGaW5pdGUoKVxuICAgICAgICovXG4gICAgICByZXR1cm4gIWlzTmFOKHBhcnNlRmxvYXQobikpICYmIGlzRmluaXRlKG4pO1xuICB9LFxuXG4gIC8vcmV0dXJucyB0aGUgdHlwZSBvbmx5IGlmIGl0IGlzIGtub3duXG4gIGdldEtub3duVHlwZTogZnVuY3Rpb24odHlwZSl7XG4gICAgcmV0dXJuIFZFUlRJQ0FMX0VOQ09ESU5HUy5oYXNPd25Qcm9wZXJ0eSh0eXBlKSAmJiB0eXBlO1xuICB9LFxuXG4gIC8qKlxuICAgKiBDb25zdHJ1Y3QgYSB1cmkgZnJvbSBhIHVybFxuICAgKiBAcGFyYW0ge3N0cmluZ30gIGFVcmwgLSB1cmxcbiAgICogQHBhcmFtIHtzdHJpbmd9ICBhT3JpZ2luQ2hhcnNldCAtIG9wdGlvbmFsIGNoYXJhY3RlciBzZXQgZm9yIHRoZSBVUklcbiAgICogQHBhcmFtIHtuc0lVUkl9ICBhQmFzZVVSSSAtIGJhc2UgVVJJIGZvciB0aGUgc3BlY1xuICAgKi9cbiAgbWFrZVVyaTogQ0xJUVpFbnZpcm9ubWVudC5tYWtlVXJpLFxuXG4gIC8vbW92ZSB0aGlzIG91dCBvZiBDbGlxelV0aWxzIVxuICBzZXRTdXBwb3J0SW5mbzogZnVuY3Rpb24oc3RhdHVzKXtcbiAgICB2YXIgcHJlZnMgPSBDb21wb25lbnRzLmNsYXNzZXNbJ0Btb3ppbGxhLm9yZy9wcmVmZXJlbmNlcy1zZXJ2aWNlOzEnXS5nZXRTZXJ2aWNlKENvbXBvbmVudHMuaW50ZXJmYWNlcy5uc0lQcmVmQnJhbmNoKSxcbiAgICAgICAgaG9zdCA9ICdmaXJlZm94JywgaG9zdFZlcnNpb249Jyc7XG5cbiAgICAvL2NoZWNrIGlmIHRoZSBwcmVmcyBleGlzdCBhbmQgaWYgdGhleSBhcmUgc3RyaW5nXG4gICAgaWYocHJlZnMuZ2V0UHJlZlR5cGUoJ2Rpc3RyaWJ1dGlvbi5pZCcpID09IDMyICYmIHByZWZzLmdldFByZWZUeXBlKCdkaXN0cmlidXRpb24udmVyc2lvbicpID09IDMyKXtcbiAgICAgIGhvc3QgPSBwcmVmcy5nZXRDaGFyUHJlZignZGlzdHJpYnV0aW9uLmlkJyk7XG4gICAgICBob3N0VmVyc2lvbiA9IHByZWZzLmdldENoYXJQcmVmKCdkaXN0cmlidXRpb24udmVyc2lvbicpO1xuICAgIH1cbiAgICB2YXIgaW5mbyA9IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICB2ZXJzaW9uOiBDbGlxelV0aWxzLmV4dGVuc2lvblZlcnNpb24sXG4gICAgICAgICAgaG9zdDogaG9zdCxcbiAgICAgICAgICBob3N0VmVyc2lvbjogaG9zdFZlcnNpb24sXG4gICAgICAgICAgc3RhdHVzOiBzdGF0dXMgIT0gdW5kZWZpbmVkID8gc3RhdHVzIDogXCJhY3RpdmVcIlxuICAgICAgICB9KSxcbiAgICAgICAgc2l0ZXMgPSBbXCJodHRwOi8vY2xpcXouY29tXCIsXCJodHRwczovL2NsaXF6LmNvbVwiXVxuXG4gICAgc2l0ZXMuZm9yRWFjaChmdW5jdGlvbih1cmwpe1xuICAgICAgICB2YXIgbHMgPSBDTElRWkVudmlyb25tZW50LmdldExvY2FsU3RvcmFnZSh1cmwpXG5cbiAgICAgICAgaWYgKGxzKSBscy5zZXRJdGVtKFwiZXh0ZW5zaW9uLWluZm9cIixpbmZvKVxuICAgIH0pXG4gIH0sXG4gIGdldExvZ29EZXRhaWxzOiBmdW5jdGlvbih1cmxEZXRhaWxzKXtcbiAgICB2YXIgYmFzZSA9IHVybERldGFpbHMubmFtZSxcbiAgICAgICAgYmFzZUNvcmUgPSBiYXNlLnJlcGxhY2UoL1stXS9nLCBcIlwiKSxcbiAgICAgICAgY2hlY2sgPSBmdW5jdGlvbihob3N0LHJ1bGUpe1xuICAgICAgICAgIHZhciBhZGRyZXNzID0gaG9zdC5sYXN0SW5kZXhPZihiYXNlKSwgcGFyc2VkZG9tYWluID0gaG9zdC5zdWJzdHIoMCxhZGRyZXNzKSArIFwiJFwiICsgaG9zdC5zdWJzdHIoYWRkcmVzcyArIGJhc2UubGVuZ3RoKVxuXG4gICAgICAgICAgcmV0dXJuIHBhcnNlZGRvbWFpbi5pbmRleE9mKHJ1bGUpICE9IC0xXG4gICAgICAgIH0sXG4gICAgICAgIHJlc3VsdCA9IHt9LFxuICAgICAgICBkb21haW5zID0gQlJBTkRTX0RBVEFCQVNFLmRvbWFpbnM7XG5cblxuXG4gICAgaWYoYmFzZS5sZW5ndGggPT0gMClcbiAgICAgIHJldHVybiByZXN1bHQ7XG5cbiAgICBpZiAoYmFzZSA9PSBcIklQXCIpIHJlc3VsdCA9IHsgdGV4dDogXCJJUFwiLCBiYWNrZ3JvdW5kQ29sb3I6IFwiOTA3N2UzXCIgfVxuXG4gICAgZWxzZSBpZiAoZG9tYWluc1tiYXNlXSkge1xuICAgICAgZm9yICh2YXIgaT0wLGltYXg9ZG9tYWluc1tiYXNlXS5sZW5ndGg7aTxpbWF4O2krKykge1xuICAgICAgICB2YXIgcnVsZSA9IGRvbWFpbnNbYmFzZV1baV0gLy8gciA9IHJ1bGUsIGIgPSBiYWNrZ3JvdW5kLWNvbG9yLCBsID0gbG9nbywgdCA9IHRleHQsIGMgPSBjb2xvclxuXG4gICAgICAgIGlmIChpID09IGltYXggLSAxIHx8IGNoZWNrKHVybERldGFpbHMuaG9zdCxydWxlLnIpKSB7XG4gICAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgICAgYmFja2dyb3VuZENvbG9yOiBydWxlLmI/cnVsZS5iOm51bGwsXG4gICAgICAgICAgICBiYWNrZ3JvdW5kSW1hZ2U6IHJ1bGUubD9cInVybChodHRwczovL2Nkbi5jbGlxei5jb20vYnJhbmRzLWRhdGFiYXNlL2RhdGFiYXNlL1wiICsgdGhpcy5CUkFORFNfREFUQUJBU0VfVkVSU0lPTiArIFwiL2xvZ29zL1wiICsgYmFzZSArIFwiL1wiICsgcnVsZS5yICsgXCIuc3ZnKVwiOlwiXCIsXG4gICAgICAgICAgICB0ZXh0OiBydWxlLnQsXG4gICAgICAgICAgICBjb2xvcjogcnVsZS5jP1wiXCI6XCIjZmZmXCJcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBicmVha1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJlc3VsdC50ZXh0ID0gcmVzdWx0LnRleHQgfHwgKGJhc2VDb3JlLmxlbmd0aCA+IDEgPyAoKGJhc2VDb3JlWzBdLnRvVXBwZXJDYXNlKCkgKyBiYXNlQ29yZVsxXS50b0xvd2VyQ2FzZSgpKSkgOiBcIlwiKVxuICAgIHJlc3VsdC5iYWNrZ3JvdW5kQ29sb3IgPSByZXN1bHQuYmFja2dyb3VuZENvbG9yIHx8IEJSQU5EU19EQVRBQkFTRS5wYWxldHRlW2Jhc2Uuc3BsaXQoXCJcIikucmVkdWNlKGZ1bmN0aW9uKGEsYil7IHJldHVybiBhICsgYi5jaGFyQ29kZUF0KDApIH0sMCkgJSBCUkFORFNfREFUQUJBU0UucGFsZXR0ZS5sZW5ndGhdXG4gICAgdmFyIGNvbG9ySUQgPSBCUkFORFNfREFUQUJBU0UucGFsZXR0ZS5pbmRleE9mKHJlc3VsdC5iYWNrZ3JvdW5kQ29sb3IpLFxuICAgICAgICBidXR0b25DbGFzcyA9IEJSQU5EU19EQVRBQkFTRS5idXR0b25zICYmIGNvbG9ySUQgIT0gLTEgJiYgQlJBTkRTX0RBVEFCQVNFLmJ1dHRvbnNbY29sb3JJRF0/QlJBTkRTX0RBVEFCQVNFLmJ1dHRvbnNbY29sb3JJRF06MTBcblxuICAgIHJlc3VsdC5idXR0b25zQ2xhc3MgPSBcImNsaXF6LWJyYW5kcy1idXR0b24tXCIgKyBidXR0b25DbGFzc1xuICAgIHJlc3VsdC5zdHlsZSA9IFwiYmFja2dyb3VuZC1jb2xvcjogI1wiICsgcmVzdWx0LmJhY2tncm91bmRDb2xvciArIFwiO2NvbG9yOlwiICsgKHJlc3VsdC5jb2xvciB8fCAnI2ZmZicpICsgXCI7XCJcblxuXG4gICAgaWYgKHJlc3VsdC5iYWNrZ3JvdW5kSW1hZ2UpIHJlc3VsdC5zdHlsZSArPSBcImJhY2tncm91bmQtaW1hZ2U6XCIgKyByZXN1bHQuYmFja2dyb3VuZEltYWdlICsgXCI7IHRleHQtaW5kZW50OiAtMTBlbTtcIlxuXG4gICAgcmV0dXJuIHJlc3VsdFxuICB9LFxuICBodHRwSGFuZGxlcjogZnVuY3Rpb24gKCkge1xuICAgIHZhciBlcnJvckhhbmRsZXIgPSBhcmd1bWVudHNbM107IC8vIHNlZSBodHRwR2V0IG9yIGh0dHBQb3N0IGFyZ3VtZW50c1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gQ0xJUVpFbnZpcm9ubWVudC5odHRwSGFuZGxlci5hcHBseShDTElRWkVudmlyb25tZW50LCBhcmd1bWVudHMpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgaWYoZXJyb3JIYW5kbGVyKSB7XG4gICAgICAgIGVycm9ySGFuZGxlcihlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIENsaXF6VXRpbHMubG9nKGUsIFwiaHR0cEhhbmRsZXIgZmFpbGVkXCIpO1xuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgaHR0cEdldDogZnVuY3Rpb24odXJsLCBjYWxsYmFjaywgb25lcnJvciwgdGltZW91dCwgXywgc3luYyl7XG4gICAgcmV0dXJuIENsaXF6VXRpbHMuaHR0cEhhbmRsZXIoJ0dFVCcsIHVybCwgY2FsbGJhY2ssIG9uZXJyb3IsIHRpbWVvdXQsIF8sIHN5bmMpO1xuICB9LFxuICBodHRwUG9zdDogZnVuY3Rpb24odXJsLCBjYWxsYmFjaywgZGF0YSwgb25lcnJvciwgdGltZW91dCkge1xuICAgIHJldHVybiBDbGlxelV0aWxzLmh0dHBIYW5kbGVyKCdQT1NUJywgdXJsLCBjYWxsYmFjaywgb25lcnJvciwgdGltZW91dCwgZGF0YSk7XG4gIH0sXG4gIGdldExvY2FsU3RvcmFnZTogQ0xJUVpFbnZpcm9ubWVudC5nZXRMb2NhbFN0b3JhZ2UsXG4gIC8qKlxuICAgKiBMb2FkcyBhIHJlc291cmNlIFVSTCBmcm9tIHRoZSB4cGkuXG4gICAqXG4gICAqIFdyYXBzIGh0dHBHZXQgaW4gYSB0cnktY2F0Y2ggY2xhdXNlLiBXZSBuZWVkIHRvIGRvIHRoaXMsIGJlY2F1c2Ugd2hlblxuICAgKiB0cnlpbmcgdG8gbG9hZCBhIG5vbi1leGlzdGluZyBmaWxlIGZyb20gYW4geHBpIHZpYSB4bWxodHRwcmVxdWVzdCwgRmlyZWZveFxuICAgKiB0aHJvd3MgYSBOU19FUlJPUl9GSUxFX05PVF9GT1VORCBleGNlcHRpb24gaW5zdGVhZCBvZiBjYWxsaW5nIHRoZSBvbmVycm9yXG4gICAqIGZ1bmN0aW9uLlxuICAgKlxuICAgKiBAc2VlIGh0dHBzOi8vYnVnemlsbGEubW96aWxsYS5vcmcvc2hvd19idWcuY2dpP2lkPTgyNzI0MyAocHJvYmFibHkpLlxuICAgKi9cbiAgbG9hZFJlc291cmNlOiBmdW5jdGlvbih1cmwsIGNhbGxiYWNrLCBvbmVycm9yKSB7XG4gICAgdHJ5IHtcbiAgICAgICAgcmV0dXJuIENsaXF6VXRpbHMuaHR0cEdldCh1cmwsIGNhbGxiYWNrLCBvbmVycm9yLCAzMDAwKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICBDbGlxelV0aWxzLmxvZyhcIkNvdWxkIG5vdCBsb2FkIHJlc291cmNlIFwiICsgdXJsICsgXCIgZnJvbSB0aGUgeHBpXCIsXG4gICAgICAgICAgICAgICAgICAgICBcIkNsaXF6VXRpbHMuaHR0cEhhbmRsZXJcIik7XG4gICAgICBvbmVycm9yICYmIG9uZXJyb3IoKTtcbiAgICB9XG4gIH0sXG4gIG9wZW5UYWJJbldpbmRvdzogQ0xJUVpFbnZpcm9ubWVudC5vcGVuVGFiSW5XaW5kb3csXG4gIC8qKlxuICAgKiBHZXQgYSB2YWx1ZSBmcm9tIHByZWZlcmVuY2VzIGRiXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgcHJlZiAtIHByZWZlcmVuY2UgaWRlbnRpZmllclxuICAgKiBAcGFyYW0geyo9fSAgICAgIGRlZmF1dGxWYWx1ZSAtIHJldHVybmVkIHZhbHVlIGluIGNhc2UgcHJlZiBpcyBub3QgZGVmaW5lZFxuICAgKiBAcGFyYW0ge3N0cmluZz19IHByZWZpeCAtIHByZWZpeCBmb3IgcHJlZlxuICAgKi9cbiAgZ2V0UHJlZjogQ0xJUVpFbnZpcm9ubWVudC5nZXRQcmVmLFxuICAvKipcbiAgICogU2V0IGEgdmFsdWUgaW4gcHJlZmVyZW5jZXMgZGJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICBwcmVmIC0gcHJlZmVyZW5jZSBpZGVudGlmaWVyXG4gICAqIEBwYXJhbSB7Kj19ICAgICAgZGVmYXV0bFZhbHVlIC0gcmV0dXJuZWQgdmFsdWUgaW4gY2FzZSBwcmVmIGlzIG5vdCBkZWZpbmVkXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gcHJlZml4IC0gcHJlZml4IGZvciBwcmVmXG4gICAqL1xuICBzZXRQcmVmOiBDTElRWkVudmlyb25tZW50LnNldFByZWYsXG4gIC8qKlxuICAgKiBDaGVjayBpZiB0aGVyZSBpcyBhIHZhbHVlIGluIHByZWZlcmVuY2VzIGRiXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgcHJlZiAtIHByZWZlcmVuY2UgaWRlbnRpZmllclxuICAgKiBAcGFyYW0ge3N0cmluZz19IHByZWZpeCAtIHByZWZpeCBmb3IgcHJlZlxuICAgKi9cbiAgaGFzUHJlZjogQ0xJUVpFbnZpcm9ubWVudC5oYXNQcmVmLFxuICAvKipcbiAgICogQ2xlYXIgdmFsdWUgaW4gcHJlZmVyZW5jZXMgZGJcbiAgICogQHBhcmFtIHtzdHJpbmd9ICBwcmVmIC0gcHJlZmVyZW5jZSBpZGVudGlmaWVyXG4gICAqIEBwYXJhbSB7c3RyaW5nPX0gcHJlZml4IC0gcHJlZml4IGZvciBwcmVmXG4gICAqL1xuICBjbGVhclByZWY6IENMSVFaRW52aXJvbm1lbnQuY2xlYXJQcmVmLFxuICBsb2c6IENMSVFaRW52aXJvbm1lbnQubG9nLFxuICBnZXREYXk6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBNYXRoLmZsb29yKG5ldyBEYXRlKCkuZ2V0VGltZSgpIC8gODY0MDAwMDApO1xuICB9LFxuICAvL2NyZWF0ZXMgYSByYW5kb20gJ2xlbicgbG9uZyBzdHJpbmcgZnJvbSB0aGUgaW5wdXQgc3BhY2VcbiAgcmFuZDogZnVuY3Rpb24obGVuLCBfc3BhY2Upe1xuICAgICAgdmFyIHJldCA9ICcnLCBpLFxuICAgICAgICAgIHNwYWNlID0gX3NwYWNlIHx8ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OScsXG4gICAgICAgICAgc0xlbiA9IHNwYWNlLmxlbmd0aDtcblxuICAgICAgZm9yKGk9MDsgaSA8IGxlbjsgaSsrIClcbiAgICAgICAgICByZXQgKz0gc3BhY2UuY2hhckF0KE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIHNMZW4pKTtcblxuICAgICAgcmV0dXJuIHJldDtcbiAgfSxcbiAgaGFzaDogZnVuY3Rpb24ocyl7XG4gICAgcmV0dXJuIHMuc3BsaXQoJycpLnJlZHVjZShmdW5jdGlvbihhLGIpeyByZXR1cm4gKCgoYTw8NCktYSkrYi5jaGFyQ29kZUF0KDApKSAmIDB4RUZGRkZGRn0sIDApXG4gIH0sXG4gIGNsZWFuTW96aWxsYUFjdGlvbnM6IGZ1bmN0aW9uKHVybCl7XG4gICAgaWYodXJsLmluZGV4T2YoXCJtb3otYWN0aW9uOlwiKSA9PSAwKSB7XG4gICAgICAgIHZhciBbLCBhY3Rpb24sIHVybF0gPSB1cmwubWF0Y2goL15tb3otYWN0aW9uOihbXixdKyksKC4qKSQvKTtcbiAgICAgICAgLy91cmwgPSB1cmwubWF0Y2goL15tb3otYWN0aW9uOihbXixdKyksKC4qKSQvKVsyXTtcbiAgICB9XG4gICAgcmV0dXJuIFthY3Rpb24sIHVybF07XG4gIH0sXG4gIGNsZWFuVXJsUHJvdG9jb2w6IGZ1bmN0aW9uKHVybCwgY2xlYW5XV1cpe1xuICAgIGlmKCF1cmwpIHJldHVybiAnJztcblxuICAgIHZhciBwcm90b2NvbFBvcyA9IHVybC5pbmRleE9mKCc6Ly8nKTtcblxuICAgIC8vIHJlbW92ZXMgcHJvdG9jb2wgaHR0cChzKSwgZnRwLCAuLi5cbiAgICBpZihwcm90b2NvbFBvcyAhPSAtMSAmJiBwcm90b2NvbFBvcyA8PSA2KVxuICAgICAgdXJsID0gdXJsLnNwbGl0KCc6Ly8nKVsxXTtcblxuICAgIC8vIHJlbW92ZXMgdGhlIHd3dy5cbiAgICBpZihjbGVhbldXVyAmJiB1cmwudG9Mb3dlckNhc2UoKS5pbmRleE9mKCd3d3cuJykgPT0gMClcbiAgICAgIHVybCA9IHVybC5zbGljZSg0KTtcblxuICAgIHJldHVybiB1cmw7XG4gIH0sXG4gIGdldERldGFpbHNGcm9tVXJsOiBmdW5jdGlvbihvcmlnaW5hbFVybCl7XG4gICAgdmFyIFthY3Rpb24sIG9yaWdpbmFsVXJsXSA9IENsaXF6VXRpbHMuY2xlYW5Nb3ppbGxhQWN0aW9ucyhvcmlnaW5hbFVybCk7XG4gICAgLy8gZXhjbHVkZSBwcm90b2NvbFxuICAgIHZhciB1cmwgPSBvcmlnaW5hbFVybCxcbiAgICAgICAgbmFtZSA9ICcnLFxuICAgICAgICB0bGQgPSAnJyxcbiAgICAgICAgc3ViZG9tYWlucyA9IFtdLFxuICAgICAgICBwYXRoID0gJycsXG4gICAgICAgIHF1ZXJ5ID0nJyxcbiAgICAgICAgZnJhZ21lbnQgPSAnJyxcbiAgICAgICAgc3NsID0gb3JpZ2luYWxVcmwuaW5kZXhPZignaHR0cHMnKSA9PSAwO1xuXG4gICAgLy8gcmVtb3ZlIHNjaGVtZVxuICAgIHVybCA9IENsaXF6VXRpbHMuY2xlYW5VcmxQcm90b2NvbCh1cmwsIGZhbHNlKTtcbiAgICB2YXIgc2NoZW1lID0gb3JpZ2luYWxVcmwucmVwbGFjZSh1cmwsICcnKS5yZXBsYWNlKCcvLycsICcnKTtcblxuICAgIC8vIHNlcGFyYXRlIGhvc3RuYW1lIGZyb20gcGF0aCwgZXRjLiBDb3VsZCBiZSBzZXBhcmF0ZWQgZnJvbSByZXN0IGJ5IC8sID8gb3IgI1xuICAgIHZhciBob3N0ID0gdXJsLnNwbGl0KC9bXFwvXFwjXFw/XS8pWzBdLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIHBhdGggPSB1cmwucmVwbGFjZShob3N0LCcnKTtcblxuICAgIC8vIHNlcGFyYXRlIHVzZXJuYW1lOnBhc3N3b3JkQCBmcm9tIGhvc3RcbiAgICB2YXIgdXNlcnBhc3NfaG9zdCA9IGhvc3Quc3BsaXQoJ0AnKTtcbiAgICBpZih1c2VycGFzc19ob3N0Lmxlbmd0aCA+IDEpXG4gICAgICBob3N0ID0gdXNlcnBhc3NfaG9zdFsxXTtcblxuICAgIC8vIFBhcnNlIFBvcnQgbnVtYmVyXG4gICAgdmFyIHBvcnQgPSBcIlwiO1xuXG4gICAgdmFyIGlzSVB2NCA9IGlwdjRfcmVnZXgudGVzdChob3N0KTtcbiAgICB2YXIgaXNJUHY2ID0gaXB2Nl9yZWdleC50ZXN0KGhvc3QpO1xuXG5cbiAgICB2YXIgaW5kZXhPZkNvbG9uID0gaG9zdC5pbmRleE9mKFwiOlwiKTtcbiAgICBpZiAoKCFpc0lQdjYgfHwgaXNJUHY0KSAmJiBpbmRleE9mQ29sb24gPj0gMCkge1xuICAgICAgcG9ydCA9IGhvc3Quc3Vic3RyKGluZGV4T2ZDb2xvbisxKTtcbiAgICAgIGhvc3QgPSBob3N0LnN1YnN0cigwLGluZGV4T2ZDb2xvbik7XG4gICAgfVxuICAgIGVsc2UgaWYgKGlzSVB2Nikge1xuICAgICAgLy8gSWYgYW4gSVB2NiBhZGRyZXNzIGhhcyBhIHBvcnQgbnVtYmVyLCBpdCB3aWxsIGJlIHJpZ2h0IGFmdGVyIGEgY2xvc2luZyBicmFja2V0IF0gOiBmb3JtYXQgW2lwX3Y2XTpwb3J0XG4gICAgICB2YXIgZW5kT2ZJUCA9IGhvc3QuaW5kZXhPZignXTonKTtcbiAgICAgIGlmIChlbmRPZklQID49IDApIHtcbiAgICAgICAgcG9ydCA9IGhvc3Quc3BsaXQoJ106JylbMV07XG4gICAgICAgIGhvc3QgPSBob3N0LnNwbGl0KCddOicpWzBdLnJlcGxhY2UoJ1snLCcnKS5yZXBsYWNlKCddJywnJyk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgLy8gZXh0cmFjdCBxdWVyeSBhbmQgZnJhZ21lbnQgZnJvbSB1cmxcbiAgICB2YXIgcXVlcnkgPSAnJztcbiAgICB2YXIgcXVlcnlfaWR4ID0gcGF0aC5pbmRleE9mKCc/Jyk7XG4gICAgaWYocXVlcnlfaWR4ICE9IC0xKSB7XG4gICAgICBxdWVyeSA9IHBhdGguc3Vic3RyKHF1ZXJ5X2lkeCsxKTtcbiAgICB9XG5cbiAgICB2YXIgZnJhZ21lbnQgPSAnJztcbiAgICB2YXIgZnJhZ21lbnRfaWR4ID0gcGF0aC5pbmRleE9mKCcjJyk7XG4gICAgaWYoZnJhZ21lbnRfaWR4ICE9IC0xKSB7XG4gICAgICBmcmFnbWVudCA9IHBhdGguc3Vic3RyKGZyYWdtZW50X2lkeCsxKTtcbiAgICB9XG5cbiAgICAvLyByZW1vdmUgcXVlcnkgYW5kIGZyYWdtZW50IGZyb20gcGF0aFxuICAgIHBhdGggPSBwYXRoLnJlcGxhY2UoJz8nICsgcXVlcnksICcnKTtcbiAgICBwYXRoID0gcGF0aC5yZXBsYWNlKCcjJyArIGZyYWdtZW50LCAnJyk7XG4gICAgcXVlcnkgPSBxdWVyeS5yZXBsYWNlKCcjJyArIGZyYWdtZW50LCAnJyk7XG5cbiAgICAvLyBleHRyYSAtIGFsbCBwYXRoLCBxdWVyeSBhbmQgZnJhZ21lbnRcbiAgICB2YXIgZXh0cmEgPSBwYXRoO1xuICAgIGlmKHF1ZXJ5KVxuICAgICAgZXh0cmEgKz0gXCI/XCIgKyBxdWVyeTtcbiAgICBpZihmcmFnbWVudClcbiAgICAgIGV4dHJhICs9IFwiI1wiICsgZnJhZ21lbnQ7XG5cbiAgICBpc0lQdjQgPSBpcHY0X3JlZ2V4LnRlc3QoaG9zdCk7XG4gICAgaXNJUHY2ID0gaXB2Nl9yZWdleC50ZXN0KGhvc3QpO1xuICAgIHZhciBpc0xvY2FsaG9zdCA9IENsaXF6VXRpbHMuaXNMb2NhbGhvc3QoaG9zdCwgaXNJUHY0LCBpc0lQdjYpO1xuXG4gICAgLy8gZmluZCBwYXJ0cyBvZiBob3N0bmFtZVxuICAgIGlmICghaXNJUHY0ICYmICFpc0lQdjYgJiYgIWlzTG9jYWxob3N0KSB7XG4gICAgICB0cnkge1xuICAgICAgICB0bGQgPSBDTElRWkVudmlyb25tZW50LnRsZEV4dHJhY3Rvcihob3N0KTtcblxuICAgICAgICAvLyBHZXQgdGhlIGRvbWFpbiBuYW1lIHcvbyBzdWJkb21haW5zIGFuZCB3L28gVExEXG4gICAgICAgIG5hbWUgPSBob3N0LnNsaWNlKDAsIC0odGxkLmxlbmd0aCsxKSkuc3BsaXQoJy4nKS5wb3AoKTsgLy8gKzEgZm9yIHRoZSAnLidcblxuICAgICAgICAvLyBHZXQgc3ViZG9tYWluc1xuICAgICAgICB2YXIgbmFtZV90bGQgPSBuYW1lICsgXCIuXCIgKyB0bGQ7XG4gICAgICAgIHN1YmRvbWFpbnMgPSBob3N0LnNsaWNlKDAsIC1uYW1lX3RsZC5sZW5ndGgpLnNwbGl0KFwiLlwiKS5zbGljZSgwLCAtMSk7XG5cbiAgICAgICAgLy9yZW1vdmUgd3d3IGlmIGV4aXN0c1xuICAgICAgICAvLyBUT0RPOiBJIGRvbid0IHRoaW5rIHRoaXMgaXMgdGhlIHJpZ2h0IHBsYWNlIHRvIGRvIHRoaXMuXG4gICAgICAgIC8vICAgICAgIERpc2FibGVkIGZvciBub3csIGJ1dCBjaGVjayB0aGVyZSBhcmUgbm8gaXNzdWVzLlxuICAgICAgICAvLyBob3N0ID0gaG9zdC5pbmRleE9mKCd3d3cuJykgPT0gMCA/IGhvc3Quc2xpY2UoNCkgOiBob3N0O1xuICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgbmFtZSA9IFwiXCI7XG4gICAgICAgIGhvc3QgPSBcIlwiO1xuICAgICAgICAvL0NsaXF6VXRpbHMubG9nKCdXQVJOSU5HIEZhaWxlZCBmb3I6ICcgKyBvcmlnaW5hbFVybCwgJ0NsaXF6VXRpbHMuZ2V0RGV0YWlsc0Zyb21VcmwnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICBuYW1lID0gaXNMb2NhbGhvc3QgPyBcImxvY2FsaG9zdFwiIDogXCJJUFwiO1xuICAgIH1cblxuICAgIC8vIHJlbW92ZSB3d3cgZnJvbSBiZWdpbm5pbmcsIHdlIG5lZWQgY2xlYW5Ib3N0IGluIHRoZSBmcmllbmRseSB1cmxcbiAgICB2YXIgY2xlYW5Ib3N0ID0gaG9zdDtcbiAgICBpZihob3N0LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignd3d3LicpID09IDApIHtcbiAgICAgIGNsZWFuSG9zdCA9IGhvc3Quc2xpY2UoNCk7XG4gICAgfVxuXG4gICAgdmFyIGZyaWVuZGx5X3VybCA9IGNsZWFuSG9zdCArIGV4dHJhO1xuICAgIC8vcmVtb3ZlIHRyYWlsaW5nIHNsYXNoIGZyb20gdGhlIGVuZFxuICAgIGZyaWVuZGx5X3VybCA9IENsaXF6VXRpbHMuc3RyaXBUcmFpbGluZ1NsYXNoKGZyaWVuZGx5X3VybCk7XG5cbiAgICAvL0hhbmRsZSBjYXNlIHdoZXJlIHdlIGhhdmUgb25seSB0bGQgZm9yIGV4YW1wbGUgaHR0cDovL2NsaXF6bmFzXG4gICAgaWYoY2xlYW5Ib3N0ID09PSB0bGQpIHtcbiAgICAgIG5hbWUgPSB0bGQ7XG4gICAgfVxuXG4gICAgdmFyIHVybERldGFpbHMgPSB7XG4gICAgICAgICAgICAgIHNjaGVtZTogc2NoZW1lLFxuICAgICAgICAgICAgICBuYW1lOiBuYW1lLFxuICAgICAgICAgICAgICBkb21haW46IHRsZCA/IG5hbWUgKyAnLicgKyB0bGQgOiAnJyxcbiAgICAgICAgICAgICAgdGxkOiB0bGQsXG4gICAgICAgICAgICAgIHN1YmRvbWFpbnM6IHN1YmRvbWFpbnMsXG4gICAgICAgICAgICAgIHBhdGg6IHBhdGgsXG4gICAgICAgICAgICAgIHF1ZXJ5OiBxdWVyeSxcbiAgICAgICAgICAgICAgZnJhZ21lbnQ6IGZyYWdtZW50LFxuICAgICAgICAgICAgICBleHRyYTogZXh0cmEsXG4gICAgICAgICAgICAgIGhvc3Q6IGhvc3QsXG4gICAgICAgICAgICAgIGNsZWFuSG9zdDogY2xlYW5Ib3N0LFxuICAgICAgICAgICAgICBzc2w6IHNzbCxcbiAgICAgICAgICAgICAgcG9ydDogcG9ydCxcbiAgICAgICAgICAgICAgZnJpZW5kbHlfdXJsOiBmcmllbmRseV91cmxcbiAgICAgICAgfTtcblxuICAgIHJldHVybiB1cmxEZXRhaWxzO1xuICB9LFxuICBzdHJpcFRyYWlsaW5nU2xhc2g6IGZ1bmN0aW9uKHN0cikge1xuICAgIGlmKHN0ci5zdWJzdHIoLTEpID09PSAnLycpIHtcbiAgICAgICAgcmV0dXJuIHN0ci5zdWJzdHIoMCwgc3RyLmxlbmd0aCAtIDEpO1xuICAgIH1cbiAgICByZXR1cm4gc3RyO1xuICB9LFxuICBfaXNVcmxSZWdFeHA6IC9eKChbYS16XFxkXShbYS16XFxkLV0qW2EtelxcZF0pKVxcLikrW2Etel17Mix9KFxcOlxcZCspPyQvaSxcbiAgaXNVcmw6IGZ1bmN0aW9uKGlucHV0KXtcbiAgICAvL3N0ZXAgMSByZW1vdmUgZXZlbnR1YWwgcHJvdG9jb2xcbiAgICB2YXIgcHJvdG9jb2xQb3MgPSBpbnB1dC5pbmRleE9mKCc6Ly8nKTtcbiAgICBpZihwcm90b2NvbFBvcyAhPSAtMSAmJiBwcm90b2NvbFBvcyA8PSA2KXtcbiAgICAgIGlucHV0ID0gaW5wdXQuc2xpY2UocHJvdG9jb2xQb3MrMylcbiAgICB9XG4gICAgLy9zdGVwMiByZW1vdmUgcGF0aCAmIGV2ZXJ5dGhpbmcgYWZ0ZXJcbiAgICBpbnB1dCA9IGlucHV0LnNwbGl0KCcvJylbMF07XG4gICAgLy9zdGVwMyBydW4gdGhlIHJlZ2V4XG4gICAgcmV0dXJuIENsaXF6VXRpbHMuX2lzVXJsUmVnRXhwLnRlc3QoaW5wdXQpO1xuICB9LFxuXG5cbiAgLy8gQ2hlY2hrcyBpZiB0aGUgZ2l2ZW4gc3RyaW5nIGlzIGEgdmFsaWQgSVB2NCBhZGRyZXNcbiAgaXNJUHY0OiBmdW5jdGlvbihpbnB1dCkge1xuICAgIHZhciBpcHY0X3BhcnQgPSBcIjAqKFswLTldfFsxLTldWzAtOV18MVswLTldezJ9fDJbMC00XVswLTldfDI1WzAtNV0pXCI7IC8vIG51bWJlcnMgMCAtIDI1NVxuICAgIHZhciBpcHY0X3JlZ2V4ID0gbmV3IFJlZ0V4cChcIl5cIiArIGlwdjRfcGFydCArIFwiXFxcXC5cIisgaXB2NF9wYXJ0ICsgXCJcXFxcLlwiKyBpcHY0X3BhcnQgKyBcIlxcXFwuXCIrIGlwdjRfcGFydFxuICAgICsgXCIoWzpdKFswLTldKSspPyRcIik7IC8vIHBvcnQgbnVtYmVyXG4gICAgcmV0dXJuIGlwdjRfcmVnZXgudGVzdChpbnB1dCk7XG4gIH0sXG5cbiAgaXNJUHY2OiBmdW5jdGlvbihpbnB1dCkge1xuXG4gICAgLy8gQ3VycmVudGx5IHVzaW5nIGEgc2ltcGxlIHJlZ2V4IGZvciBcIndoYXQgbG9va3MgbGlrZSBhbiBJUHY2IGFkZHJlc3NcIiBmb3IgcmVhZGFiaWxpdHlcbiAgICB2YXIgaXB2Nl9yZWdleCA9IG5ldyBSZWdFeHAoXCJeXFxcXFs/KChbMC05XXxbYS1mXXxbQS1GXSkqWzouXSsoWzAtOV18W2EtZl18W0EtRl0pK1s6Ll0qKStbXFxcXF1dPyhbOl1bMC05XSspPyRcIilcbiAgICByZXR1cm4gaXB2Nl9yZWdleC50ZXN0KGlucHV0KTtcblxuICAgIC8qIEEgYmV0dGVyIChtb3JlIHByZWNpc2UpIHJlZ2V4IHRvIHZhbGlkYXRlIElQVjYgYWRkcmVzc2VzIGZyb20gU3RhY2tPdmVyZmxvdzpcbiAgICBsaW5rOiBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzUzNDk3L3JlZ3VsYXItZXhwcmVzc2lvbi10aGF0LW1hdGNoZXMtdmFsaWQtaXB2Ni1hZGRyZXNzZXNcblxuICAgIHZhciBpcHY2X3JlZ2V4ID0gbmV3IFJlZ0V4cChcIigoWzAtOWEtZkEtRl17MSw0fTopezcsN31bMC05YS1mQS1GXXsxLDR9fChbMC05YS1mQS1GXXsxLDR9Oil7MSw3fTp8KFswLTlhLWZBLUZdezEsNH06KVwiXG4gICAgKyBcInsxLDZ9OlswLTlhLWZBLUZdezEsNH18KFswLTlhLWZBLUZdezEsNH06KXsxLDV9KDpbMC05YS1mQS1GXXsxLDR9KXsxLDJ9fChbMC05YS1mQS1GXXsxLDR9Oil7MSw0fSg6WzAtOWEtZkEtRl17MSxcIlxuICAgICsgXCI0fSl7MSwzfXwoWzAtOWEtZkEtRl17MSw0fTopezEsM30oOlswLTlhLWZBLUZdezEsNH0pezEsNH18KFswLTlhLWZBLUZdezEsNH06KXsxLDJ9KDpbMC05YS1mQS1GXXsxLDR9KXsxLDV9fFswLTlhXCJcbiAgICArIFwiLWZBLUZdezEsNH06KCg6WzAtOWEtZkEtRl17MSw0fSl7MSw2fSl8OigoOlswLTlhLWZBLUZdezEsNH0pezEsN318Oil8ZmU4MDooOlswLTlhLWZBLUZdezAsNH0pezAsNH0lWzAtOWEtekEtWl17MSx9XCJcbiAgICArIFwifDo6KGZmZmYoOjB7MSw0fSl7MCwxfTopezAsMX0oKDI1WzAtNV18KDJbMC00XXwxezAsMX1bMC05XSl7MCwxfVswLTldKVxcXFwuKXszLDN9KDI1WzAtNV18KDJbMC00XXwxezAsMX1bMC05XSl7MCwxfVswLTldKVwiXG4gICAgKyBcInwoWzAtOWEtZkEtRl17MSw0fTopezEsNH06KCgyNVswLTVdfCgyWzAtNF18MXswLDF9WzAtOV0pezAsMX1bMC05XSlcXFxcLil7MywzfSgyNVswLTVdfCgyWzAtNF18MXswLDF9WzAtOV0pezAsMX1bMC05XSkpXCIpO1xuICAgICovXG4gIH0sXG5cbiAgaXNMb2NhbGhvc3Q6IGZ1bmN0aW9uKGhvc3QsIGlzSVB2NCwgaXNJUHY2KSB7XG4gICAgaWYgKGhvc3QgPT0gXCJsb2NhbGhvc3RcIikgcmV0dXJuIHRydWU7XG4gICAgaWYgKGlzSVB2NCAmJiBob3N0LnN1YnN0cigwLDMpID09IFwiMTI3XCIpIHJldHVybiB0cnVlO1xuICAgIGlmIChpc0lQdjYgJiYgaG9zdCA9PSBcIjo6MVwiKSByZXR1cm4gdHJ1ZTtcblxuICAgIHJldHVybiBmYWxzZTtcblxuICB9LFxuXG4gIC8vIGNoZWNrcyBpZiBhIHZhbHVlIHJlcHJlc2VudHMgYW4gdXJsIHdoaWNoIGlzIGEgc2VhY2ggZW5naW5lXG4gIGlzU2VhcmNoOiBmdW5jdGlvbih2YWx1ZSl7XG4gICAgaWYoQ2xpcXpVdGlscy5pc1VybCh2YWx1ZSkpe1xuICAgICAgIHJldHVybiBDbGlxelV0aWxzLmdldERldGFpbHNGcm9tVXJsKHZhbHVlKS5ob3N0LmluZGV4T2YoJ2dvb2dsZScpID09PSAwID8gdHJ1ZTogZmFsc2U7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSxcbiAgLy8gY2hlY2tzIGlmIGEgc3RyaW5nIGlzIGEgY29tcGxldGUgdXJsXG4gIGlzQ29tcGxldGVVcmw6IGZ1bmN0aW9uKGlucHV0KXtcbiAgICB2YXIgcGF0dGVybiA9IC8oZnRwfGh0dHB8aHR0cHMpOlxcL1xcLyhcXHcrOnswLDF9XFx3KkApPyhcXFMrKSg6WzAtOV0rKT8oXFwvfFxcLyhbXFx3IyE6Lj8rPSYlQCFcXC1cXC9dKSk/LztcbiAgICBpZighcGF0dGVybi50ZXN0KGlucHV0KSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH0sXG4gIC8vIGV4dHJhY3QgcXVlcnkgdGVybSBmcm9tIHNlYXJjaCBlbmdpbmUgcmVzdWx0IHBhZ2UgVVJMc1xuICBleHRyYWN0UXVlcnlGcm9tVXJsOiBmdW5jdGlvbih1cmwpIHtcbiAgICAvLyBHb29nbGVcbiAgICBpZiAodXJsLnNlYXJjaCgvaHR0cChzPyk6XFwvXFwvd3d3XFwuZ29vZ2xlXFwuLipcXC8uKnE9LiovaSkgPT09IDApIHtcbiAgICAgIHVybCA9IHVybC5zdWJzdHJpbmcodXJsLmxhc3RJbmRleE9mKCdxPScpICsgMikuc3BsaXQoJyYnKVswXTtcbiAgICAvLyBCaW5nXG4gICAgfSBlbHNlIGlmICh1cmwuc2VhcmNoKC9odHRwKHM/KTpcXC9cXC93d3dcXC5iaW5nXFwuLipcXC8uKnE9LiovaSkgPT09IDApIHtcbiAgICAgIHVybCA9IHVybC5zdWJzdHJpbmcodXJsLmluZGV4T2YoJ3E9JykgKyAyKS5zcGxpdCgnJicpWzBdO1xuICAgIC8vIFlhaG9vXG4gICAgfSBlbHNlIGlmICh1cmwuc2VhcmNoKC9odHRwKHM/KTpcXC9cXC8uKnNlYXJjaFxcLnlhaG9vXFwuY29tXFwvc2VhcmNoLipwPS4qL2kpID09PSAwKSB7XG4gICAgICB1cmwgPSB1cmwuc3Vic3RyaW5nKHVybC5pbmRleE9mKCdwPScpICsgMikuc3BsaXQoJyYnKVswXTtcbiAgICB9IGVsc2Uge1xuICAgICAgdXJsID0gbnVsbDtcbiAgICB9XG4gICAgdmFyIGRlY29kZWQgPSB1cmwgPyBkZWNvZGVVUklDb21wb25lbnQodXJsLnJlcGxhY2UoL1xcKy9nLCcgJykpIDogbnVsbDtcbiAgICBpZiAoZGVjb2RlZCkgcmV0dXJuIGRlY29kZWQ7XG4gICAgZWxzZSByZXR1cm4gdXJsO1xuICB9LFxuICAvLyBSZW1vdmUgY2x1dHRlciAoaHR0cCwgd3d3KSBmcm9tIHVybHNcbiAgZ2VuZXJhbGl6ZVVybDogZnVuY3Rpb24odXJsLCBza2lwQ29ycmVjdGlvbikge1xuICAgIGlmICghdXJsKSB7XG4gICAgICByZXR1cm4gJyc7XG4gICAgfVxuICAgIHZhciB2YWwgPSB1cmwudG9Mb3dlckNhc2UoKTtcbiAgICB2YXIgY2xlYW5QYXJ0cyA9IENsaXF6VXRpbHMuY2xlYW5VcmxQcm90b2NvbCh2YWwsIGZhbHNlKS5zcGxpdCgnLycpLFxuICAgICAgaG9zdCA9IGNsZWFuUGFydHNbMF0sXG4gICAgICBwYXRoTGVuZ3RoID0gMCxcbiAgICAgIFNZTUJPTFMgPSAvLHxcXC4vZztcbiAgICBpZiAoIXNraXBDb3JyZWN0aW9uKSB7XG4gICAgICBpZiAoY2xlYW5QYXJ0cy5sZW5ndGggPiAxKSB7XG4gICAgICAgIHBhdGhMZW5ndGggPSAoJy8nICsgY2xlYW5QYXJ0cy5zbGljZSgxKS5qb2luKCcvJykpLmxlbmd0aDtcbiAgICAgIH1cbiAgICAgIGlmIChob3N0LmluZGV4T2YoJ3d3dycpID09PSAwICYmIGhvc3QubGVuZ3RoID4gNCkge1xuICAgICAgICAvLyBvbmx5IGZpeCBzeW1ib2xzIGluIGhvc3RcbiAgICAgICAgaWYgKFNZTUJPTFMudGVzdChob3N0WzNdKSAmJiBob3N0WzRdICE9ICcgJylcbiAgICAgICAgLy8gcmVwbGFjZSBvbmx5IGlzc3VlcyBpbiB0aGUgaG9zdCBuYW1lLCBub3QgZXZlciBpbiB0aGUgcGF0aFxuICAgICAgICAgIHZhbCA9IHZhbC5zdWJzdHIoMCwgdmFsLmxlbmd0aCAtIHBhdGhMZW5ndGgpLnJlcGxhY2UoU1lNQk9MUywgJy4nKSArXG4gICAgICAgICAgKHBhdGhMZW5ndGggPyB2YWwuc3Vic3RyKC1wYXRoTGVuZ3RoKSA6ICcnKTtcbiAgICAgIH1cbiAgICB9XG4gICAgdXJsID0gQ2xpcXpVdGlscy5jbGVhblVybFByb3RvY29sKHZhbCwgdHJ1ZSk7XG4gICAgcmV0dXJuIHVybFt1cmwubGVuZ3RoIC0gMV0gPT0gJy8nID8gdXJsLnNsaWNlKDAsLTEpIDogdXJsO1xuICB9LFxuICAvLyBSZW1vdmUgY2x1dHRlciBmcm9tIHVybHMgdGhhdCBwcmV2ZW50cyBwYXR0ZXJuIGRldGVjdGlvbiwgZS5nLiBjaGVja3N1bVxuICBzaW1wbGlmeVVybDogZnVuY3Rpb24odXJsKSB7XG4gICAgdmFyIHE7XG4gICAgLy8gR29vZ2xlIHJlZGlyZWN0IHVybHNcbiAgICBpZiAodXJsLnNlYXJjaCgvaHR0cChzPyk6XFwvXFwvd3d3XFwuZ29vZ2xlXFwuLipcXC91cmxcXD8uKnVybD0uKi9pKSA9PT0gMCkge1xuICAgICAgLy8gUmV0dXJuIHRhcmdldCBVUkwgaW5zdGVhZFxuICAgICAgdXJsID0gdXJsLnN1YnN0cmluZyh1cmwubGFzdEluZGV4T2YoJ3VybD0nKSkuc3BsaXQoJyYnKVswXTtcbiAgICAgIHVybCA9IHVybC5zdWJzdHIoNCk7XG4gICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHVybCk7XG5cbiAgICAgIC8vIFJlbW92ZSBjbHV0dGVyIGZyb20gR29vZ2xlIHNlYXJjaGVzXG4gICAgfSBlbHNlIGlmICh1cmwuc2VhcmNoKC9odHRwKHM/KTpcXC9cXC93d3dcXC5nb29nbGVcXC4uKlxcLy4qcT0uKi9pKSA9PT0gMCkge1xuICAgICAgcSA9IHVybC5zdWJzdHJpbmcodXJsLmxhc3RJbmRleE9mKCdxPScpKS5zcGxpdCgnJicpWzBdO1xuICAgICAgaWYgKHEgIT0gJ3E9Jykge1xuICAgICAgICAvLyB0Ym0gZGVmaW5lcyBjYXRlZ29yeSAoaW1hZ2VzL25ld3MvLi4uKVxuICAgICAgICB2YXIgcGFyYW0gPSB1cmwuaW5kZXhPZignIycpICE9IC0xID8gdXJsLnN1YnN0cih1cmwuaW5kZXhPZignIycpKSA6IHVybC5zdWJzdHIodXJsLmluZGV4T2YoJz8nKSk7XG4gICAgICAgIHZhciB0Ym0gPSBwYXJhbS5pbmRleE9mKCd0Ym09JykgIT0gLTEgPyAoJyYnICsgcGFyYW0uc3Vic3RyaW5nKHBhcmFtLmxhc3RJbmRleE9mKCd0Ym09JykpLnNwbGl0KCcmJylbMF0pIDogJyc7XG4gICAgICAgIHZhciBwYWdlID0gcGFyYW0uaW5kZXhPZignc3RhcnQ9JykgIT0gLTEgPyAoJyYnICsgcGFyYW0uc3Vic3RyaW5nKHBhcmFtLmxhc3RJbmRleE9mKCdzdGFydD0nKSkuc3BsaXQoJyYnKVswXSkgOiAnJztcbiAgICAgICAgcmV0dXJuICdodHRwczovL3d3dy5nb29nbGUuY29tL3NlYXJjaD8nICsgcSArIHRibSAvKisgcGFnZSovO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICAgIH1cbiAgICAgIC8vIEJpbmdcbiAgICB9IGVsc2UgaWYgKHVybC5zZWFyY2goL2h0dHAocz8pOlxcL1xcL3d3d1xcLmJpbmdcXC4uKlxcLy4qcT0uKi9pKSA9PT0gMCkge1xuICAgICAgcSA9IHVybC5zdWJzdHJpbmcodXJsLmluZGV4T2YoJ3E9JykpLnNwbGl0KCcmJylbMF07XG4gICAgICBpZiAocSAhPSAncT0nKSB7XG4gICAgICAgIGlmICh1cmwuaW5kZXhPZignc2VhcmNoPycpICE9IC0xKVxuICAgICAgICAgIHJldHVybiB1cmwuc3Vic3RyKDAsIHVybC5pbmRleE9mKCdzZWFyY2g/JykpICsgJ3NlYXJjaD8nICsgcTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgIHJldHVybiB1cmwuc3Vic3RyKDAsIHVybC5pbmRleE9mKCcvPycpKSArICcvPycgKyBxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICAgIH1cbiAgICAgIC8vIFlhaG9vIHJlZGlyZWN0XG4gICAgfSBlbHNlIGlmICh1cmwuc2VhcmNoKC9odHRwKHM/KTpcXC9cXC9yLnNlYXJjaFxcLnlhaG9vXFwuY29tXFwvLiovaSkgPT09IDApIHtcbiAgICAgIHVybCA9IHVybC5zdWJzdHJpbmcodXJsLmxhc3RJbmRleE9mKCcvUlU9JykpLnNwbGl0KCcvUks9JylbMF07XG4gICAgICB1cmwgPSB1cmwuc3Vic3RyKDQpO1xuICAgICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudCh1cmwpO1xuICAgICAgLy8gWWFob29cbiAgICB9IGVsc2UgaWYgKHVybC5zZWFyY2goL2h0dHAocz8pOlxcL1xcLy4qc2VhcmNoXFwueWFob29cXC5jb21cXC9zZWFyY2guKnA9LiovaSkgPT09IDApIHtcbiAgICAgIHZhciBwID0gdXJsLnN1YnN0cmluZyh1cmwuaW5kZXhPZigncD0nKSkuc3BsaXQoJyYnKVswXTtcbiAgICAgIGlmIChwICE9ICdwPScgJiYgdXJsLmluZGV4T2YoJzsnKSAhPSAtMSkge1xuICAgICAgICByZXR1cm4gdXJsLnN1YnN0cigwLCB1cmwuaW5kZXhPZignOycpKSArICc/JyArIHA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdXJsO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdXJsO1xuICAgIH1cbiAgfSxcbiAgLy8gZXN0YWJsaXNoZXMgdGhlIGNvbm5lY3Rpb25cbiAgcGluZ0NsaXF6UmVzdWx0czogZnVuY3Rpb24oKXtcbiAgICBDbGlxelV0aWxzLmh0dHBIYW5kbGVyKCdIRUFEJywgQ2xpcXpVdGlscy5SRVNVTFRTX1BST1ZJREVSX1BJTkcpO1xuICB9LFxuICBnZXRCYWNrZW5kUmVzdWx0czogIGZ1bmN0aW9uKHEsIGNhbGxiYWNrKXtcblxuICB9LFxuICBnZXRDbGlxelJlc3VsdHM6IGZ1bmN0aW9uKHEsIGNhbGxiYWNrKXtcbiAgICBDbGlxelV0aWxzLl9zZXNzaW9uU2VxKys7XG5cbiAgICAvLyBpZiB0aGUgdXNlciBzZWVzIHRoZSByZXN1bHRzIG1vcmUgdGhhbiA1MDBtcyB3ZSBjb25zaWRlciB0aGF0IGhlIHN0YXJ0cyBhIG5ldyBxdWVyeVxuICAgIGlmKENsaXF6VXRpbHMuX3F1ZXJ5TGFzdERyYXcgJiYgKERhdGUubm93KCkgPiBDbGlxelV0aWxzLl9xdWVyeUxhc3REcmF3ICsgNTAwKSl7XG4gICAgICBDbGlxelV0aWxzLl9xdWVyeUNvdW50Kys7XG4gICAgfVxuICAgIENsaXF6VXRpbHMuX3F1ZXJ5TGFzdERyYXcgPSAwOyAvLyByZXNldCBsYXN0IERyYXcgLSB3YWl0IGZvciB0aGUgYWN0dWFsIGRyYXdcbiAgICBDbGlxelV0aWxzLl9xdWVyeUxhc3RMZW5ndGggPSBxLmxlbmd0aDtcblxuICAgIHZhciB1cmwgPSBDbGlxelV0aWxzLlJFU1VMVFNfUFJPVklERVIgK1xuICAgICAgICAgICAgICBlbmNvZGVVUklDb21wb25lbnQocSkgK1xuICAgICAgICAgICAgICBDbGlxelV0aWxzLmVuY29kZVNlc3Npb25QYXJhbXMoKSArXG4gICAgICAgICAgICAgIENsaXF6TGFuZ3VhZ2Uuc3RhdGVUb1F1ZXJ5U3RyaW5nKCkgK1xuICAgICAgICAgICAgICBDbGlxelV0aWxzLmVuY29kZUxvY2FsZSgpICtcbiAgICAgICAgICAgICAgQ2xpcXpVdGlscy5lbmNvZGVSZXN1bHRPcmRlcigpICtcbiAgICAgICAgICAgICAgQ2xpcXpVdGlscy5lbmNvZGVDb3VudHJ5KCkgK1xuICAgICAgICAgICAgICBDbGlxelV0aWxzLmVuY29kZUZpbHRlcigpICtcbiAgICAgICAgICAgICAgQ2xpcXpVdGlscy5lbmNvZGVMb2NhdGlvbigpICtcbiAgICAgICAgICAgICAgQ2xpcXpVdGlscy5lbmNvZGVSZXN1bHRDb3VudCg3KSArXG4gICAgICAgICAgICAgIENsaXF6VXRpbHMuZGlzYWJsZVdpa2lEZWR1cCgpO1xuXG4gICAgdmFyIHJlcSA9IENsaXF6VXRpbHMuaHR0cEdldCh1cmwsIGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgIGNhbGxiYWNrICYmIGNhbGxiYWNrKHJlcywgcSk7XG4gICAgfSk7XG4gIH0sXG4gIC8vIElQIGRyaXZlbiBjb25maWd1cmF0aW9uXG4gIGZldGNoQW5kU3RvcmVDb25maWc6IGZ1bmN0aW9uKGNhbGxiYWNrKXtcbiAgICBDbGlxelV0aWxzLmh0dHBHZXQoQ2xpcXpVdGlscy5DT05GSUdfUFJPVklERVIsXG4gICAgICBmdW5jdGlvbihyZXMpe1xuICAgICAgICBpZihyZXMgJiYgcmVzLnJlc3BvbnNlKXtcbiAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIGNvbmZpZyA9IEpTT04ucGFyc2UocmVzLnJlc3BvbnNlKTtcbiAgICAgICAgICAgIGZvcih2YXIgayBpbiBjb25maWcpe1xuICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoJ2NvbmZpZ18nICsgaywgY29uZmlnW2tdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9IGNhdGNoKGUpe31cbiAgICAgICAgfVxuXG4gICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICB9LFxuICAgICAgY2FsbGJhY2ssIC8vb24gZXJyb3IgdGhlIGNhbGxiYWNrIHN0aWxsIG5lZWRzIHRvIGJlIGNhbGxlZFxuICAgICAgMjAwMFxuICAgICk7XG4gIH0sXG4gIGVuY29kZUxvY2FsZTogZnVuY3Rpb24oKSB7XG4gICAgLy8gc2VuZCBicm93c2VyIGxhbmd1YWdlIHRvIHRoZSBiYWNrLWVuZFxuICAgIHJldHVybiAnJmxvY2FsZT0nKyAoQ2xpcXpVdGlscy5QUkVGRVJSRURfTEFOR1VBR0UgfHwgXCJcIik7XG4gIH0sXG4gIGVuY29kZUNvdW50cnk6IGZ1bmN0aW9uKCkge1xuICAgIC8vaW50ZXJuYXRpb25hbCByZXN1bHRzIG5vdCBzdXBwb3J0ZWRcbiAgICByZXR1cm4gJyZmb3JjZV9jb3VudHJ5PXRydWUnO1xuICB9LFxuICBkaXNhYmxlV2lraURlZHVwOiBmdW5jdGlvbigpIHtcbiAgICAvLyBkaXNhYmxlIHdpa2lwZWRpYSBkZWR1cGxpY2F0aW9uIG9uIHRoZSBiYWNrZW5kIHNpZGVcbiAgICB2YXIgZG9EZWR1cCA9IENsaXF6VXRpbHMuZ2V0UHJlZihcImxhbmd1YWdlRGVkdXBcIiwgZmFsc2UpO1xuICAgIGlmIChkb0RlZHVwKSByZXR1cm4gJyZkZGw9MCc7XG4gICAgZWxzZSByZXR1cm4gXCJcIlxuICB9LFxuICBlbmNvZGVGaWx0ZXI6IGZ1bmN0aW9uKCkge1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgJ2NvbnNlcnZhdGl2ZSc6IDMsXG4gICAgICAnbW9kZXJhdGUnOiAwLFxuICAgICAgJ2xpYmVyYWwnOiAxXG4gICAgfSxcbiAgICBzdGF0ZSA9IGRhdGFbQ2xpcXpVdGlscy5nZXRQcmVmKCdhZHVsdENvbnRlbnRGaWx0ZXInLCAnbW9kZXJhdGUnKV07XG5cbiAgICByZXR1cm4gJyZhZHVsdD0nK3N0YXRlO1xuICB9LFxuICBlbmNvZGVSZXN1bHRDb3VudDogZnVuY3Rpb24oY291bnQpIHtcbiAgICB2YXIgZG9EZWR1cCA9IENsaXF6VXRpbHMuZ2V0UHJlZihcImxhbmd1YWdlRGVkdXBcIiwgZmFsc2UpO1xuICAgIGNvdW50ID0gY291bnQgfHwgNTtcbiAgICBpZiAoZG9EZWR1cCkgcmV0dXJuICcmY291bnQ9JyArIGNvdW50O1xuICAgIGVsc2UgcmV0dXJuIFwiXCJcbiAgfSxcbiAgZW5jb2RlUmVzdWx0VHlwZTogZnVuY3Rpb24odHlwZSl7XG4gICAgaWYodHlwZS5pbmRleE9mKCdhY3Rpb24nKSAhPT0gLTEpIHJldHVybiBbJ1QnXTtcbiAgICBlbHNlIGlmKHR5cGUuaW5kZXhPZignY2xpcXotcmVzdWx0cycpID09IDApIHJldHVybiBDbGlxelV0aWxzLmVuY29kZUNsaXF6UmVzdWx0VHlwZSh0eXBlKTtcbiAgICBlbHNlIGlmKHR5cGUuaW5kZXhPZignY2xpcXotcGF0dGVybicpID09IDApIHJldHVybiBbJ0MnXTtcbiAgICBlbHNlIGlmKHR5cGUgPT09ICdjbGlxei1leHRyYScpIHJldHVybiBbJ1gnXTtcbiAgICBlbHNlIGlmKHR5cGUgPT09ICdjbGlxei1zZXJpZXMnKSByZXR1cm4gWydTJ107XG5cbiAgICBlbHNlIGlmKHR5cGUuaW5kZXhPZignYm9va21hcmsnKSA9PSAwIHx8XG4gICAgICAgICAgICB0eXBlLmluZGV4T2YoJ3RhZycpID09IDApIHJldHVybiBbJ0InXS5jb25jYXQoQ2xpcXpVdGlscy5lbmNvZGVDbGlxelJlc3VsdFR5cGUodHlwZSkpO1xuXG4gICAgZWxzZSBpZih0eXBlLmluZGV4T2YoJ2Zhdmljb24nKSA9PSAwIHx8XG4gICAgICAgICAgICB0eXBlLmluZGV4T2YoJ2hpc3RvcnknKSA9PSAwKSByZXR1cm4gWydIJ10uY29uY2F0KENsaXF6VXRpbHMuZW5jb2RlQ2xpcXpSZXN1bHRUeXBlKHR5cGUpKTtcblxuICAgIC8vIGNsaXF6IHR5cGUgPSBcImNsaXF6LWN1c3RvbSBzb3VyY2VzLVhcIlxuICAgIGVsc2UgaWYodHlwZS5pbmRleE9mKCdjbGlxei1jdXN0b20nKSA9PSAwKSByZXR1cm4gdHlwZS5zdWJzdHIoMjEpO1xuXG4gICAgcmV0dXJuIHR5cGU7IC8vc2hvdWxkIG5ldmVyIGhhcHBlblxuICB9LFxuICAvL2VnIHR5cGVzOiBbIFwiSFwiLCBcIm1cIiBdLCBbIFwiSHxpbnN0YW50XCIsIFwiWHwxMVwiIF1cbiAgaXNQcml2YXRlUmVzdWx0VHlwZTogZnVuY3Rpb24odHlwZSkge1xuICAgIHZhciBvbmx5VHlwZSA9IHR5cGVbMF0uc3BsaXQoJ3wnKVswXTtcbiAgICByZXR1cm4gJ0hCVENTJy5pbmRleE9mKG9ubHlUeXBlKSAhPSAtMSAmJiB0eXBlLmxlbmd0aCA9PSAxO1xuICB9LFxuICAvLyBjbGlxeiB0eXBlID0gXCJjbGlxei1yZXN1bHRzIHNvdXJjZXMtWFhYWFhcIiBvciBcImZhdmljb24gc291cmNlcy1YWFhYWFwiIGlmIGNvbWJpbmVkIHdpdGggaGlzdG9yeVxuICBlbmNvZGVDbGlxelJlc3VsdFR5cGU6IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHZhciBwb3MgPSB0eXBlLmluZGV4T2YoJ3NvdXJjZXMtJylcbiAgICBpZihwb3MgIT0gLTEpXG4gICAgICByZXR1cm4gQ2xpcXpVdGlscy5lbmNvZGVTb3VyY2VzKHR5cGUuc3Vic3RyKHBvcys4KSk7XG4gICAgZWxzZVxuICAgICAgcmV0dXJuIFtdO1xuICB9LFxuICAvLyByYW5kb20gSUQgZ2VuZXJhdGVkIGF0IGVhY2ggdXJsYmFyIGZvY3VzXG4gIF9zZWFyY2hTZXNzaW9uOiAnJyxcbiAgLy8gbnVtYmVyIG9mIHNlcXVlbmNlcyBpbiBlYWNoIHNlc3Npb25cbiAgX3Nlc3Npb25TZXE6IDAsXG4gIF9xdWVyeUxhc3RMZW5ndGg6IG51bGwsXG4gIF9xdWVyeUxhc3REcmF3OiBudWxsLFxuICAvLyBudW1iZXIgb2YgcXVlcmllcyBpbiBzZWFyY2ggc2Vzc2lvblxuICBfcXVlcnlDb3VudDogbnVsbCxcbiAgc2V0U2VhcmNoU2Vzc2lvbjogZnVuY3Rpb24ocmFuZCl7XG4gICAgQ2xpcXpVdGlscy5fc2VhcmNoU2Vzc2lvbiA9IHJhbmQ7XG4gICAgQ2xpcXpVdGlscy5fc2Vzc2lvblNlcSA9IDA7XG4gICAgQ2xpcXpVdGlscy5fcXVlcnlDb3VudCA9IDA7XG4gICAgQ2xpcXpVdGlscy5fcXVlcnlMYXN0TGVuZ3RoID0gMDtcbiAgICBDbGlxelV0aWxzLl9xdWVyeUxhc3REcmF3ID0gMDtcbiAgfSxcbiAgZW5jb2RlU2Vzc2lvblBhcmFtczogZnVuY3Rpb24oKXtcbiAgICBpZihDbGlxelV0aWxzLl9zZWFyY2hTZXNzaW9uLmxlbmd0aCl7XG4gICAgICByZXR1cm4gJyZzPScgKyBlbmNvZGVVUklDb21wb25lbnQoQ2xpcXpVdGlscy5fc2VhcmNoU2Vzc2lvbikgK1xuICAgICAgICAgICAgICcmbj0nICsgQ2xpcXpVdGlscy5fc2Vzc2lvblNlcSArXG4gICAgICAgICAgICAgJyZxYz0nICsgQ2xpcXpVdGlscy5fcXVlcnlDb3VudFxuICAgIH0gZWxzZSByZXR1cm4gJyc7XG4gIH0sXG5cbiAgZW5jb2RlTG9jYXRpb246IGZ1bmN0aW9uKHNwZWNpZnlTb3VyY2UsIGxhdCwgbG5nKSB7XG4gICAgdmFyIHFzID0gW1xuICAgICAnJmxvY19wcmVmPScsXG4gICAgIENsaXF6VXRpbHMuZ2V0UHJlZignc2hhcmVfbG9jYXRpb24nLCdhc2snKVxuICAgIF0uam9pbignJylcblxuICAgIGlmIChDbGlxelV0aWxzLlVTRVJfTEFUICYmIENsaXF6VXRpbHMuVVNFUl9MTkcgfHwgbGF0ICYmIGxuZykge1xuICAgICAgcXMgKz0gW1xuICAgICAgICAnJmxvYz0nLFxuICAgICAgICBsYXQgfHwgQ2xpcXpVdGlscy5VU0VSX0xBVCxcbiAgICAgICAgJywnLFxuICAgICAgICBsbmcgfHwgQ2xpcXpVdGlscy5VU0VSX0xORyxcbiAgICAgICAgKHNwZWNpZnlTb3VyY2UgPyAnLFUnIDogJycpXG4gICAgICBdLmpvaW4oJycpO1xuICAgIH1cblxuICAgIHJldHVybiBxcztcbiAgfSxcbiAgZW5jb2RlU291cmNlczogZnVuY3Rpb24oc291cmNlcyl7XG4gICAgcmV0dXJuIHNvdXJjZXMudG9Mb3dlckNhc2UoKS5zcGxpdCgnLCAnKS5tYXAoXG4gICAgICBmdW5jdGlvbihzKXtcbiAgICAgICAgaWYocy5pbmRleE9mKCdjYWNoZScpID09IDApIC8vIHRvIGNhdGNoICdjYWNoZS0qJyBmb3Igc3BlY2lmaWMgY291bnRyaWVzXG4gICAgICAgICAgcmV0dXJuICdkJ1xuICAgICAgICBlbHNlXG4gICAgICAgICAgcmV0dXJuIFZFUlRJQ0FMX0VOQ09ESU5HU1tzXSB8fCBzO1xuICAgICAgfSk7XG4gIH0sXG4gIGlzUHJpdmF0ZTogQ0xJUVpFbnZpcm9ubWVudC5pc1ByaXZhdGUsXG4gIHRlbGVtZXRyeTogQ0xJUVpFbnZpcm9ubWVudC50ZWxlbWV0cnksXG4gIHJlc3VsdFRlbGVtZXRyeTogZnVuY3Rpb24ocXVlcnksIHF1ZXJ5QXV0b2NvbXBsZXRlZCwgcmVzdWx0SW5kZXgsIHJlc3VsdFVybCwgcmVzdWx0T3JkZXIsIGV4dHJhKSB7XG4gICAgQ2xpcXpVdGlscy5zZXRSZXN1bHRPcmRlcihyZXN1bHRPcmRlcik7XG4gICAgdmFyIHBhcmFtcyA9IGVuY29kZVVSSUNvbXBvbmVudChxdWVyeSkgK1xuICAgICAgKHF1ZXJ5QXV0b2NvbXBsZXRlZCA/ICcmYT0nICsgZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5QXV0b2NvbXBsZXRlZCkgOiAnJykgK1xuICAgICAgJyZpPScgKyByZXN1bHRJbmRleCArXG4gICAgICAocmVzdWx0VXJsID8gJyZ1PScgKyBlbmNvZGVVUklDb21wb25lbnQocmVzdWx0VXJsKSA6ICcnKSArXG4gICAgICBDbGlxelV0aWxzLmVuY29kZVNlc3Npb25QYXJhbXMoKSArXG4gICAgICBDbGlxelV0aWxzLmVuY29kZVJlc3VsdE9yZGVyKCkgK1xuICAgICAgKGV4dHJhID8gJyZlPScgKyBleHRyYSA6ICcnKVxuICAgIENsaXF6VXRpbHMuaHR0cEdldChDbGlxelV0aWxzLlJFU1VMVFNfUFJPVklERVJfTE9HICsgcGFyYW1zKTtcbiAgICBDbGlxelV0aWxzLnNldFJlc3VsdE9yZGVyKCcnKTtcbiAgICBDbGlxelV0aWxzLmxvZyhwYXJhbXMsICdVdGlscy5yZXN1bHRUZWxlbWV0cnknKTtcbiAgfSxcbiAgX3Jlc3VsdE9yZGVyOiAnJyxcbiAgc2V0UmVzdWx0T3JkZXI6IGZ1bmN0aW9uKHJlc3VsdE9yZGVyKSB7XG4gICAgQ2xpcXpVdGlscy5fcmVzdWx0T3JkZXIgPSByZXN1bHRPcmRlcjtcbiAgfSxcbiAgZW5jb2RlUmVzdWx0T3JkZXI6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBDbGlxelV0aWxzLl9yZXN1bHRPcmRlciAmJiBDbGlxelV0aWxzLl9yZXN1bHRPcmRlci5sZW5ndGggPyAnJm89JyArIGVuY29kZVVSSUNvbXBvbmVudChKU09OLnN0cmluZ2lmeShDbGlxelV0aWxzLl9yZXN1bHRPcmRlcikpIDogJyc7XG4gIH0sXG4gIHNldEludGVydmFsOiBDTElRWkVudmlyb25tZW50LnNldEludGVydmFsLFxuICBzZXRUaW1lb3V0OiBDTElRWkVudmlyb25tZW50LnNldFRpbWVvdXQsXG4gIGNsZWFyVGltZW91dDogQ0xJUVpFbnZpcm9ubWVudC5jbGVhclRpbWVvdXQsXG4gIGNsZWFySW50ZXJ2YWw6IENMSVFaRW52aXJvbm1lbnQuY2xlYXJUaW1lb3V0LFxuICBQcm9taXNlOiBDTElRWkVudmlyb25tZW50LlByb21pc2UsXG4gIGxvY2FsZToge30sXG4gIGN1cnJMb2NhbGU6IG51bGwsXG4gIGxvYWRMb2NhbGU6IGZ1bmN0aW9uIChsYW5nX2xvY2FsZSkge1xuICAgIHZhciBsb2NhbGVzID0ge1xuICAgICAgXCJlbi1VU1wiOiBcImVuXCJcbiAgICB9O1xuICAgIGxhbmdfbG9jYWxlID0gbG9jYWxlc1tsYW5nX2xvY2FsZV0gfHwgbGFuZ19sb2NhbGU7XG5cbiAgICBpZiAoIUNsaXF6VXRpbHMubG9jYWxlLmhhc093blByb3BlcnR5KGxhbmdfbG9jYWxlKVxuICAgICAgJiYgIUNsaXF6VXRpbHMubG9jYWxlLmhhc093blByb3BlcnR5KCdkZWZhdWx0JykpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIENsaXF6VXRpbHMuZ2V0TG9jYWxlRmlsZShlbmNvZGVVUklDb21wb25lbnQobGFuZ19sb2NhbGUpLCBsYW5nX2xvY2FsZSk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgdmFyIGxvYyA9IENsaXF6VXRpbHMuZ2V0TGFuZ3VhZ2VGcm9tTG9jYWxlKGxhbmdfbG9jYWxlKTtcbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBDbGlxelV0aWxzLmdldExvY2FsZUZpbGUobG9jLCBsYW5nX2xvY2FsZSk7XG4gICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICBDbGlxelV0aWxzLmdldExvY2FsZUZpbGUoJ2RlJywgJ2RlZmF1bHQnKTtcbiAgICAgICAgICB9IGNhdGNoKGUpIHtcblxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAgZ2V0TG9jYWxlRmlsZTogZnVuY3Rpb24gKGxvY2FsZV9wYXRoLCBsb2NhbGVfa2V5KSB7XG4gICAgZnVuY3Rpb24gY2FsbGJhY2socmVxKSB7XG4gICAgICAgIGlmIChDbGlxelV0aWxzKXtcbiAgICAgICAgICBpZiAobG9jYWxlX2tleSAhPT0gJ2RlZmF1bHQnKSB7XG4gICAgICAgICAgICBDbGlxelV0aWxzLmN1cnJMb2NhbGUgPSBsb2NhbGVfa2V5O1xuICAgICAgICAgIH1cbiAgICAgICAgICBDbGlxelV0aWxzLmxvY2FsZVtsb2NhbGVfa2V5XSA9IEpTT04ucGFyc2UocmVxLnJlc3BvbnNlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmdW5jdGlvbiBvbmVycm9yKGVycikge1xuICAgIH1cbiAgICB2YXIgdXJsID0gQ0xJUVpFbnZpcm9ubWVudC5MT0NBTEVfUEFUSCArIGxvY2FsZV9wYXRoICsgJy9jbGlxei5qc29uJztcbiAgICB2YXIgcmVzcG9uc2UgPSBDbGlxelV0aWxzLmh0dHBHZXQodXJsLCBjYWxsYmFjaywgb25lcnJvciwgMzAwMCwgbnVsbCwgdHJ1ZSk7XG4gICAgaWYgKHJlc3BvbnNlLnJlYWR5U3RhdGUgIT09IDIpIHtcbiAgICAgIHRocm93IFwiRXJyb3JcIjtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3BvbnNlO1xuICB9LFxuICBnZXRMYW5ndWFnZUZyb21Mb2NhbGU6IGZ1bmN0aW9uKGxvY2FsZSl7XG4gICAgcmV0dXJuIGxvY2FsZS5tYXRjaCgvKFthLXpdKykoPzpbLV9dKFtBLVpdKykpPy8pWzFdO1xuICB9LFxuICBnZXRMYW5ndWFnZTogZnVuY3Rpb24od2luKXtcbiAgICByZXR1cm4gQ2xpcXpVdGlscy5MQU5HU1tDbGlxelV0aWxzLmdldExhbmd1YWdlRnJvbUxvY2FsZSh3aW4ubmF2aWdhdG9yLmxhbmd1YWdlKV0gfHwgJ2VuJztcbiAgfSxcbiAgZ2V0TG9jYWxpemVkU3RyaW5nOiBmdW5jdGlvbihrZXksIHN1YnN0aXR1dGlvbnMpe1xuICAgIGlmKCFrZXkpIHJldHVybiAnJztcblxuICAgIHZhciBzdHIgPSBrZXksXG4gICAgICAgIGxvY2FsTWVzc2FnZXM7XG5cbiAgICBpZiAoQ2xpcXpVdGlscy5jdXJyTG9jYWxlICE9IG51bGwgJiYgQ2xpcXpVdGlscy5sb2NhbGVbQ2xpcXpVdGlscy5jdXJyTG9jYWxlXVxuICAgICAgICAgICAgJiYgQ2xpcXpVdGlscy5sb2NhbGVbQ2xpcXpVdGlscy5jdXJyTG9jYWxlXVtrZXldKSB7XG4gICAgICAgIHN0ciA9IENsaXF6VXRpbHMubG9jYWxlW0NsaXF6VXRpbHMuY3VyckxvY2FsZV1ba2V5XS5tZXNzYWdlO1xuICAgICAgICBsb2NhbE1lc3NhZ2VzID0gQ2xpcXpVdGlscy5sb2NhbGVbQ2xpcXpVdGlscy5jdXJyTG9jYWxlXTtcbiAgICB9IGVsc2UgaWYgKENsaXF6VXRpbHMubG9jYWxlLmRlZmF1bHQgJiYgQ2xpcXpVdGlscy5sb2NhbGUuZGVmYXVsdFtrZXldKSB7XG4gICAgICAgIHN0ciA9IENsaXF6VXRpbHMubG9jYWxlLmRlZmF1bHRba2V5XS5tZXNzYWdlO1xuICAgICAgICBsb2NhbE1lc3NhZ2VzID0gQ2xpcXpVdGlscy5sb2NhbGUuZGVmYXVsdDtcbiAgICB9XG5cbiAgICBpZiAoIXN1YnN0aXR1dGlvbnMpIHtcbiAgICAgIHN1YnN0aXR1dGlvbnMgPSBbXTtcbiAgICB9XG4gICAgaWYgKCFBcnJheS5pc0FycmF5KHN1YnN0aXR1dGlvbnMpKSB7XG4gICAgICBzdWJzdGl0dXRpb25zID0gW3N1YnN0aXR1dGlvbnNdO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHJlcGxhY2VyKG1hdGNoZWQsIGluZGV4LCBkb2xsYXJTaWducykge1xuICAgICAgaWYgKGluZGV4KSB7XG4gICAgICAgIGluZGV4ID0gcGFyc2VJbnQoaW5kZXgsIDEwKSAtIDE7XG4gICAgICAgIHJldHVybiBpbmRleCBpbiBzdWJzdGl0dXRpb25zID8gc3Vic3RpdHV0aW9uc1tpbmRleF0gOiBcIlwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgLy8gRm9yIGFueSBzZXJpZXMgb2YgY29udGlndW91cyBgJGBzLCB0aGUgZmlyc3QgaXMgZHJvcHBlZCwgYW5kXG4gICAgICAgIC8vIHRoZSByZXN0IHJlbWFpbiBpbiB0aGUgb3V0cHV0IHN0cmluZy5cbiAgICAgICAgcmV0dXJuIGRvbGxhclNpZ25zO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gc3RyLnJlcGxhY2UoL1xcJCg/OihbMS05XVxcZCopfChcXCQrKSkvZywgcmVwbGFjZXIpO1xuICB9LFxuICAvLyBnZXRzIGFsbCB0aGUgZWxlbWVudHMgd2l0aCB0aGUgY2xhc3MgJ2NsaXF6LWxvY2FsZScgYW5kIGFkZHNcbiAgLy8gdGhlIGxvY2FsaXplZCBzdHJpbmcgLSBrZXkgYXR0cmlidXRlIC0gYXMgY29udGVudFxuICBsb2NhbGl6ZURvYzogZnVuY3Rpb24oZG9jKXtcbiAgICB2YXIgbG9jYWxlID0gZG9jLmdldEVsZW1lbnRzQnlDbGFzc05hbWUoJ2NsaXF6LWxvY2FsZScpO1xuICAgIGZvcih2YXIgaSA9IDA7IGkgPCBsb2NhbGUubGVuZ3RoOyBpKyspe1xuICAgICAgICB2YXIgZWwgPSBsb2NhbGVbaV07XG4gICAgICAgIGVsLnRleHRDb250ZW50ID0gQ2xpcXpVdGlscy5nZXRMb2NhbGl6ZWRTdHJpbmcoZWwuZ2V0QXR0cmlidXRlKCdrZXknKSk7XG4gICAgfVxuICB9LFxuICBleHRlbnNpb25SZXN0YXJ0OiBmdW5jdGlvbihjaGFuZ2VzKXtcbiAgICB2YXIgZW51bWVyYXRvciA9IFNlcnZpY2VzLndtLmdldEVudW1lcmF0b3IoJ25hdmlnYXRvcjpicm93c2VyJyk7XG4gICAgd2hpbGUgKGVudW1lcmF0b3IuaGFzTW9yZUVsZW1lbnRzKCkpIHtcbiAgICAgIHZhciB3aW4gPSBlbnVtZXJhdG9yLmdldE5leHQoKTtcbiAgICAgIGlmKHdpbi5DTElRWiAmJiB3aW4uQ0xJUVouQ29yZSl7XG4gICAgICAgIHdpbi5DTElRWi5Db3JlLnVubG9hZCh0cnVlKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjaGFuZ2VzICYmIGNoYW5nZXMoKTtcblxuICAgIHZhciBjb3JlUHJvbWlzZXMgPSBbXTtcbiAgICBlbnVtZXJhdG9yID0gU2VydmljZXMud20uZ2V0RW51bWVyYXRvcignbmF2aWdhdG9yOmJyb3dzZXInKTtcbiAgICB3aGlsZSAoZW51bWVyYXRvci5oYXNNb3JlRWxlbWVudHMoKSkge1xuICAgICAgdmFyIHdpbiA9IGVudW1lcmF0b3IuZ2V0TmV4dCgpO1xuICAgICAgaWYod2luLkNMSVFaICYmIHdpbi5DTElRWi5Db3JlKXtcbiAgICAgICAgY29yZVByb21pc2VzLnB1c2god2luLkNMSVFaLkNvcmUuaW5pdCgpKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gUHJvbWlzZS5hbGwoY29yZVByb21pc2VzKTtcbiAgfSxcbiAgaXNXaW5kb3dzOiBmdW5jdGlvbigpe1xuICAgIHJldHVybiBDTElRWkVudmlyb25tZW50Lk9TLmluZGV4T2YoXCJ3aW5cIikgPT09IDA7XG4gIH0sXG4gIGlzTWFjOiBmdW5jdGlvbigpe1xuICAgIHJldHVybiBDTElRWkVudmlyb25tZW50Lk9TLmluZGV4T2YoXCJkYXJ3aW5cIikgPT09IDA7XG4gIH0sXG4gIGlzTGludXg6IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBDTElRWkVudmlyb25tZW50Lk9TLmluZGV4T2YoXCJsaW51eFwiKSA9PT0gMDtcbiAgfSxcbiAgZ2V0V2luZG93OiBDTElRWkVudmlyb25tZW50LmdldFdpbmRvdyxcbiAgZ2V0V2luZG93SUQ6IENMSVFaRW52aXJvbm1lbnQuZ2V0V2luZG93SUQsXG4gIGhhc0NsYXNzOiBmdW5jdGlvbihlbGVtZW50LCBjbGFzc05hbWUpIHtcbiAgICByZXR1cm4gKCcgJyArIGVsZW1lbnQuY2xhc3NOYW1lICsgJyAnKS5pbmRleE9mKCcgJyArIGNsYXNzTmFtZSArICcgJykgPiAtMTtcbiAgfSxcbiAgLyoqXG4gICAqIEJpbmQgZnVuY3Rpb25zIGNvbnRleHRzIHRvIGEgc3BlY2lmaWVkIG9iamVjdC5cbiAgICogQHBhcmFtIHtPYmplY3R9IGZyb20gLSBBbiBvYmplY3QsIHdob3NlIGZ1bmN0aW9uIHByb3BlcnRpZXMgd2lsbCBiZSBwcm9jZXNzZWQuXG4gICAqIEBwYXJhbSB7T2JqZWN0fSB0byAtIEFuIG9iamVjdCwgd2hpY2ggd2lsbCBiZSB0aGUgY29udGV4dCAodGhpcykgb2YgcHJvY2Vzc2VkIGZ1bmN0aW9ucy5cbiAgICovXG4gIGJpbmRPYmplY3RGdW5jdGlvbnM6IGZ1bmN0aW9uKGZyb20sIHRvKSB7XG4gICAgZm9yICh2YXIgZnVuY05hbWUgaW4gZnJvbSkge1xuICAgICAgdmFyIGZ1bmMgPSBmcm9tW2Z1bmNOYW1lXTtcbiAgICAgIGlmICghZnJvbS5oYXNPd25Qcm9wZXJ0eShmdW5jTmFtZSkpXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgLy8gQ2FuJ3QgY29tcGFyZSB3aXRoIHByb3RvdHlwZSBvZiBvYmplY3QgZnJvbSBhIGRpZmZlcmVudCBtb2R1bGUuXG4gICAgICBpZiAodHlwZW9mIGZ1bmMgIT0gXCJmdW5jdGlvblwiKVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIGZyb21bZnVuY05hbWVdID0gZnVuYy5iaW5kKHRvKTtcbiAgICB9XG4gIH0sXG4gIHRyeURlY29kZVVSSUNvbXBvbmVudDogZnVuY3Rpb24ocykge1xuICAgIC8vIGF2b2lkZSBlcnJvciBmcm9tIGRlY29kZVVSSUNvbXBvbmVudCgnJTInKVxuICAgIHRyeSB7XG4gICAgICByZXR1cm4gZGVjb2RlVVJJQ29tcG9uZW50KHMpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgcmV0dXJuIHM7XG4gICAgfVxuICB9LFxuICB0cnlFbmNvZGVVUklDb21wb25lbnQ6IGZ1bmN0aW9uKHMpIHtcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudChzKTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIHJldHVybiBzO1xuICAgIH1cbiAgfSxcbiAgcGFyc2VRdWVyeVN0cmluZzogZnVuY3Rpb24ocXN0cikge1xuICAgIHZhciBxdWVyeSA9IHt9O1xuICAgIHZhciBhID0gKHFzdHIgfHwgJycpLnNwbGl0KCcmJyk7XG4gICAgZm9yICh2YXIgaSBpbiBhKVxuICAgIHtcbiAgICAgIHZhciBiID0gYVtpXS5zcGxpdCgnPScpO1xuICAgICAgcXVlcnlbQ2xpcXpVdGlscy50cnlEZWNvZGVVUklDb21wb25lbnQoYlswXSldID0gQ2xpcXpVdGlscy50cnlEZWNvZGVVUklDb21wb25lbnQoYlsxXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHF1ZXJ5O1xuICB9LFxuICByb3VuZFRvRGVjaW1hbDogZnVuY3Rpb24obnVtYmVyLCBkaWdpdHMpIHtcbiAgICB2YXIgbXVsdGlwbGllciA9IE1hdGgucG93KDEwLCBkaWdpdHMpO1xuICAgIHJldHVybiBNYXRoLnJvdW5kKG51bWJlciAqIG11bHRpcGxpZXIpIC8gbXVsdGlwbGllcjtcbiAgfSxcbiAgZ2V0QWR1bHRGaWx0ZXJTdGF0ZTogZnVuY3Rpb24oKXtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgICdjb25zZXJ2YXRpdmUnOiB7XG4gICAgICAgICAgICAgIG5hbWU6IENsaXF6VXRpbHMuZ2V0TG9jYWxpemVkU3RyaW5nKCdhbHdheXMnKSxcbiAgICAgICAgICAgICAgc2VsZWN0ZWQ6IGZhbHNlXG4gICAgICB9LFxuICAgICAgJ21vZGVyYXRlJzoge1xuICAgICAgICAgICAgICBuYW1lOiBDbGlxelV0aWxzLmdldExvY2FsaXplZFN0cmluZygnYWx3YXlzX2FzaycpLFxuICAgICAgICAgICAgICBzZWxlY3RlZDogZmFsc2VcbiAgICAgIH0sXG4gICAgICAnbGliZXJhbCc6IHtcbiAgICAgICAgICBuYW1lOiBDbGlxelV0aWxzLmdldExvY2FsaXplZFN0cmluZygnbmV2ZXInKSxcbiAgICAgICAgICBzZWxlY3RlZDogZmFsc2VcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgZGF0YVtDbGlxelV0aWxzLmdldFByZWYoJ2FkdWx0Q29udGVudEZpbHRlcicsICdtb2RlcmF0ZScpXS5zZWxlY3RlZCA9IHRydWU7XG5cbiAgICByZXR1cm4gZGF0YTtcbiAgfSxcbiAgZ2V0TG9jYXRpb25QZXJtU3RhdGUoKXtcbiAgICB2YXIgZGF0YSA9IHtcbiAgICAgICd5ZXMnOiB7XG4gICAgICAgIG5hbWU6IENsaXF6VXRpbHMuZ2V0TG9jYWxpemVkU3RyaW5nKCdhbHdheXMnKSxcbiAgICAgICAgc2VsZWN0ZWQ6IGZhbHNlXG4gICAgICB9LFxuICAgICAgJ2Fzayc6IHtcbiAgICAgICAgbmFtZTogQ2xpcXpVdGlscy5nZXRMb2NhbGl6ZWRTdHJpbmcoJ2Fsd2F5c19hc2snKSxcbiAgICAgICAgc2VsZWN0ZWQ6IGZhbHNlXG4gICAgICB9LFxuICAgICAgJ25vJzoge1xuICAgICAgICBuYW1lOiBDbGlxelV0aWxzLmdldExvY2FsaXplZFN0cmluZygnbmV2ZXInKSxcbiAgICAgICAgc2VsZWN0ZWQ6IGZhbHNlXG4gICAgICB9XG4gICAgfTtcblxuICAgIGRhdGFbQ2xpcXpVdGlscy5nZXRQcmVmKCdzaGFyZV9sb2NhdGlvbicsICdhc2snKV0uc2VsZWN0ZWQgPSB0cnVlO1xuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH0sXG5cbiAgLy8gUmV0dXJucyByZXN1bHQgZWxlbWVudHMgc2VsZWNhdGJsZSBhbmQgbmF2aWdhdGFibGUgZnJvbSBrZXlib2FyZC5cbiAgLy8gfGNvbnRhaW5lcnwgc2VhcmNoIGNvbnRleHQsIHVzdWFsbHkgaXQncyBgQ0xJUVouVUkuZ0NsaXF6Qm94YC5cbiAgZXh0cmFjdFNlbGVjdGFibGVFbGVtZW50cyhjb250YWluZXIpIHtcbiAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoXG4gICAgICAgIGNvbnRhaW5lci5xdWVyeVNlbGVjdG9yQWxsKCdbYXJyb3ddJykpLmZpbHRlcihcbiAgICAgICAgICAgIGZ1bmN0aW9uKGVsKSB7XG4gICAgICAgICAgICAgIC8vIGRvbnQgY29uc2lkZXIgaGlkZGVuIGVsZW1lbnRzXG4gICAgICAgICAgICAgIGlmKGVsLm9mZnNldFBhcmVudCA9PSBudWxsKVxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcblxuICAgICAgICAgICAgICBpZighZWwuZ2V0QXR0cmlidXRlKCdhcnJvdy1pZi12aXNpYmxlJykpXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG5cbiAgICAgICAgICAgICAgLy8gY2hlY2sgaWYgdGhlIGVsZW1lbnQgaXMgdmlzaWJsZVxuICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAvLyBmb3Igbm93IHRoaXMgY2hlY2sgaXMgZW5vdWdoIGJ1dCB3ZSBtaWdodCBiZSBmb3JjZWQgdG8gc3dpdGNoIHRvIGFcbiAgICAgICAgICAgICAgLy8gbW9yZSBnZW5lcmljIGFwcHJvYWNoIC0gbWF5YmUgdXNpbmcgZG9jdW1lbnQuZWxlbWVudEZyb21Qb2ludCh4LCB5KVxuICAgICAgICAgICAgICBpZiAoZWwub2Zmc2V0TGVmdCArIGVsLm9mZnNldFdpZHRoID4gZWwucGFyZW50RWxlbWVudC5vZmZzZXRXaWR0aClcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2VcbiAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9KTtcbiAgfSxcblxuICBnZXROb1Jlc3VsdHM6IENMSVFaRW52aXJvbm1lbnQuZ2V0Tm9SZXN1bHRzLFxuICBkaXNhYmxlQ2xpcXpSZXN1bHRzOiBDTElRWkVudmlyb25tZW50LmRpc2FibGVDbGlxelJlc3VsdHMsXG4gIGVuYWJsZUNsaXF6UmVzdWx0czogQ0xJUVpFbnZpcm9ubWVudC5lbmFibGVDbGlxelJlc3VsdHMsXG4gIGdldFBhcmFtZXRlckJ5TmFtZTogZnVuY3Rpb24obmFtZSwgbG9jYXRpb24pIHtcbiAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFxbXS8sIFwiXFxcXFtcIikucmVwbGFjZSgvW1xcXV0vLCBcIlxcXFxdXCIpO1xuICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAoXCJbXFxcXD8mXVwiICsgbmFtZSArIFwiPShbXiYjXSopXCIpLFxuICAgIHJlc3VsdHMgPSByZWdleC5leGVjKGxvY2F0aW9uLnNlYXJjaCk7XG4gICAgcmV0dXJuIHJlc3VsdHMgPT09IG51bGwgPyBcIlwiIDogZGVjb2RlVVJJQ29tcG9uZW50KHJlc3VsdHNbMV0ucmVwbGFjZSgvXFwrL2csIFwiIFwiKSk7XG4gIH0sXG4gIGFkZEV2ZW50TGlzdGVuZXJUb0VsZW1lbnRzOiBDTElRWkVudmlyb25tZW50LmFkZEV2ZW50TGlzdGVuZXJUb0VsZW1lbnRzLFxuICBzZWFyY2g6IENMSVFaRW52aXJvbm1lbnQuc2VhcmNoLFxuICBkaXN0YW5jZTogZnVuY3Rpb24obG9uMSwgbGF0MSwgbG9uMiA9IENsaXF6VXRpbHMuVVNFUl9MTkcsIGxhdDIgPSBDbGlxelV0aWxzLlVTRVJfTEFUKSB7XG4gICAgLyoqIENvbnZlcnRzIG51bWVyaWMgZGVncmVlcyB0byByYWRpYW5zICovXG4gICAgZnVuY3Rpb24gZGVncmVlc1RvUmFkKGRlZ3JlZSl7XG4gICAgICByZXR1cm4gZGVncmVlICogTWF0aC5QSSAvIDE4MDtcbiAgICB9XG5cbiAgICB2YXIgUiA9IDYzNzE7IC8vIFJhZGl1cyBvZiB0aGUgZWFydGggaW4ga21cbiAgICBpZighbG9uMiB8fCAhbG9uMSB8fCAhbGF0MiB8fCAhbGF0MSkgeyByZXR1cm4gLTE7IH1cbiAgICB2YXIgZExhdCA9IGRlZ3JlZXNUb1JhZChsYXQyLWxhdDEpOyAgLy8gSmF2YXNjcmlwdCBmdW5jdGlvbnMgaW4gcmFkaWFuc1xuICAgIHZhciBkTG9uID0gZGVncmVlc1RvUmFkKGxvbjItbG9uMSk7XG4gICAgdmFyIGEgPSBNYXRoLnNpbihkTGF0LzIpICogTWF0aC5zaW4oZExhdC8yKSArXG4gICAgICAgICAgICBNYXRoLmNvcyhkZWdyZWVzVG9SYWQobGF0MSkpICogTWF0aC5jb3MoZGVncmVlc1RvUmFkKGxhdDIpKSAqXG4gICAgICAgICAgICBNYXRoLnNpbihkTG9uLzIpICogTWF0aC5zaW4oZExvbi8yKTtcbiAgICB2YXIgYyA9IDIgKiBNYXRoLmF0YW4yKE1hdGguc3FydChhKSwgTWF0aC5zcXJ0KDEtYSkpO1xuICAgIHZhciBkID0gUiAqIGM7IC8vIERpc3RhbmNlIGluIGttXG4gICAgcmV0dXJuIGQ7XG4gIH0sXG4gIGdldERlZmF1bHRTZWFyY2hFbmdpbmU6IENMSVFaRW52aXJvbm1lbnQuZ2V0RGVmYXVsdFNlYXJjaEVuZ2luZSxcbiAgY29weVJlc3VsdDogQ0xJUVpFbnZpcm9ubWVudC5jb3B5UmVzdWx0LFxuICBvcGVuUG9wdXA6IENMSVFaRW52aXJvbm1lbnQub3BlblBvcHVwLFxuICBpc09uUHJpdmF0ZVRhYjogQ0xJUVpFbnZpcm9ubWVudC5pc09uUHJpdmF0ZVRhYixcbiAgZ2V0Q2xpcXpQcmVmczogQ0xJUVpFbnZpcm9ubWVudC5nZXRDbGlxelByZWZzLFxuICBpc0RlZmF1bHRCcm93c2VyOiBDTElRWkVudmlyb25tZW50LmlzRGVmYXVsdEJyb3dzZXIsXG4gIGluaXRIb21lcGFnZTogQ0xJUVpFbnZpcm9ubWVudC5pbml0SG9tZXBhZ2UsXG4gIHNldERlZmF1bHRTZWFyY2hFbmdpbmU6IENMSVFaRW52aXJvbm1lbnQuc2V0RGVmYXVsdFNlYXJjaEVuZ2luZSxcbiAgaXNVbmtub3duVGVtcGxhdGU6IENMSVFaRW52aXJvbm1lbnQuaXNVbmtub3duVGVtcGxhdGUsXG4gIGhpc3RvcnlTZWFyY2g6IENMSVFaRW52aXJvbm1lbnQuaGlzdG9yeVNlYXJjaCxcbiAgZ2V0RW5naW5lQnlOYW1lOiBDTElRWkVudmlyb25tZW50LmdldEVuZ2luZUJ5TmFtZSxcbiAgYWRkRW5naW5lV2l0aERldGFpbHM6IENMSVFaRW52aXJvbm1lbnQuYWRkRW5naW5lV2l0aERldGFpbHMsXG4gIGdldEVuZ2luZUJ5QWxpYXM6IENMSVFaRW52aXJvbm1lbnQuZ2V0RW5naW5lQnlBbGlhcyxcbiAgZ2V0U2VhcmNoRW5naW5lczogQ0xJUVpFbnZpcm9ubWVudC5nZXRTZWFyY2hFbmdpbmVzLFxuICB1cGRhdGVBbGlhczogQ0xJUVpFbnZpcm9ubWVudC51cGRhdGVBbGlhcyxcbiAgcHJvbWlzZUh0dHBIYW5kbGVyOiBDTElRWkVudmlyb25tZW50LnByb21pc2VIdHRwSGFuZGxlcixcbiAgcmVnaXN0ZXJSZXN1bHRQcm92aWRlcjogZnVuY3Rpb24gKG8pIHtcbiAgICBDTElRWkVudmlyb25tZW50LkNsaXF6UmVzdWx0UHJvdmlkZXJzID0gby5SZXN1bHRQcm92aWRlcnM7XG4gICAgQ0xJUVpFbnZpcm9ubWVudC5SZXN1bHQgPSBvLlJlc3VsdDtcbiAgfSxcbiAgb25SZW5kZXJDb21wbGV0ZTogZnVuY3Rpb24ocXVlcnksIGJveCl7XG4gICAgaWYgKCFDTElRWkVudmlyb25tZW50Lm9uUmVuZGVyQ29tcGxldGUpXG4gICAgICByZXR1cm47XG5cbiAgICB2YXIgbGlua05vZGVzID0gdGhpcy5leHRyYWN0U2VsZWN0YWJsZUVsZW1lbnRzKGJveCk7XG4gICAgdmFyIHVybHMgPSBsaW5rTm9kZXNcbiAgICAgICAgLm1hcChub2RlID0+IG5vZGUuZ2V0QXR0cmlidXRlKFwidXJsXCIpIHx8IG5vZGUuZ2V0QXR0cmlidXRlKFwiaHJlZlwiKSlcbiAgICAgICAgLmZpbHRlcih1cmwgPT4gISF1cmwpO1xuXG4gICAgQ0xJUVpFbnZpcm9ubWVudC5vblJlbmRlckNvbXBsZXRlKHF1ZXJ5LCB1cmxzKTtcbiAgfVxufTtcblxuZXhwb3J0IGRlZmF1bHQgQ2xpcXpVdGlscztcbiJdfQ==