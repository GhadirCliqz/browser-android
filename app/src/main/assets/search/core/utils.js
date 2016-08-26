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

          if (CLIQZEnvironment.USER_LAT && CLIQZEnvironment.USER_LNG || lat && lng) {
            qs += ['&loc=', lat || CLIQZEnvironment.USER_LAT, ',', lng || CLIQZEnvironment.USER_LNG, specifySource ? ',U' : ''].join('');
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
        distance: CLIQZEnvironment.distance,
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
        openLink: CLIQZEnvironment.openLink,
        promiseHttpHandler: CLIQZEnvironment.promiseHttpHandler,
        registerResultProvider: function registerResultProvider(o) {
          CLIQZEnvironment.CliqzResultProviders = o.ResultProviders;
          CLIQZEnvironment.Result = o.Result;
        },
        onRenderComplete: function onRenderComplete(query, box) {
          if (!CLIQZEnvironment.onRenderComplete) return;

          var linkNodes = box.querySelectorAll("[url]:not(.cqz-result-box):not(.entity-story):not([hidden]), [href]:not([hidden])");
          var urls = [].map.call(linkNodes, function (node) {
            return node.getAttribute("url") || node.getAttribute("href");
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
//# sourceMappingURL=data:application/json;base64,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QzlELENBQUMsQ0FBQzs7QUFFSCwwQkFBZ0IsQ0FBQyxnQkFBZ0IsQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLENBQUM7U0FDaEQ7T0FDRjs7eUJBRWMsVUFBVSIsImZpbGUiOiJjb3JlL3V0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IENMSVFaRW52aXJvbm1lbnQgZnJvbSBcInBsYXRmb3JtL2Vudmlyb25tZW50XCI7XG5cbnZhciBDbGlxekxhbmd1YWdlO1xuXG52YXIgVkVSVElDQUxfRU5DT0RJTkdTID0ge1xuICAgICdwZW9wbGUnOidwJyxcbiAgICAnbmV3cyc6J24nLFxuICAgICd2aWRlbyc6J3YnLFxuICAgICdocSc6J2gnLFxuICAgICdibSc6ICdtJyxcbiAgICAncmVjaXBlUkQnOiAncicsXG4gICAgJ2dhbWUnOiAnZycsXG4gICAgJ21vdmllJzogJ28nXG59O1xuXG52YXIgQ09MT1VSUyA9IFsnI2ZmY2U2ZCcsJyNmZjZmNjknLCcjOTZlMzk3JywnIzVjN2JhMScsJyNiZmJmYmYnLCcjM2I1NTk4JywnI2ZiYjQ0YycsJyMwMGIyZTUnLCcjYjNiM2IzJywnIzk5Y2NjYycsJyNmZjAwMjcnLCcjOTk5OTk5J10sXG4gICAgTE9HT1MgPSBbJ3dpa2lwZWRpYScsICdnb29nbGUnLCAnZmFjZWJvb2snLCAneW91dHViZScsICdkdWNrZHVja2dvJywgJ3N0ZXJuZWZyZXNzZXInLCAnemFsYW5kbycsICdiaWxkJywgJ3dlYicsICdlYmF5JywgJ2dteCcsICdhbWF6b24nLCAndC1vbmxpbmUnLCAnd2l3bycsICd3d2UnLCAnd2VpZ2h0d2F0Y2hlcnMnLCAncnAtb25saW5lJywgJ3dtYWdhemluZScsICdjaGlwJywgJ3NwaWVnZWwnLCAneWFob28nLCAncGF5cGFsJywgJ2ltZGInLCAnd2lraWEnLCAnbXNuJywgJ2F1dG9iaWxkJywgJ2RhaWx5bW90aW9uJywgJ2htJywgJ2hvdG1haWwnLCAnemVpdCcsICdiYWhuJywgJ3NvZnRvbmljJywgJ2hhbmRlbHNibGF0dCcsICdzdGVybicsICdjbm4nLCAnbW9iaWxlJywgJ2FldHYnLCAncG9zdGJhbmsnLCAnZGtiJywgJ2JpbmcnLCAnYWRvYmUnLCAnYmJjJywgJ25pa2UnLCAnc3RhcmJ1Y2tzJywgJ3RlY2hjcnVuY2gnLCAndmV2bycsICd0aW1lJywgJ3R3aXR0ZXInLCAnd2VhdGhlcnVuZGVyZ3JvdW5kJywgJ3hpbmcnLCAneWVscCcsICd5YW5kZXgnLCAnd2VhdGhlcicsICdmbGlja3InXSxcbiAgICBCUkFORFNfREFUQUJBU0UgPSB7IGRvbWFpbnM6IHt9LCBwYWxldHRlOiBbXCI5OTlcIl0gfSwgYnJhbmRfbG9hZGVkID0gZmFsc2UsXG4gICAgTUlOVVRFID0gNjAqMWUzLFxuICAgIGlwdjRfcGFydCA9IFwiMCooWzAtOV18WzEtOV1bMC05XXwxWzAtOV17Mn18MlswLTRdWzAtOV18MjVbMC01XSlcIiwgLy8gbnVtYmVycyAwIC0gMjU1XG4gICAgaXB2NF9yZWdleCA9IG5ldyBSZWdFeHAoXCJeXCIgKyBpcHY0X3BhcnQgKyBcIlxcXFwuXCIrIGlwdjRfcGFydCArIFwiXFxcXC5cIisgaXB2NF9wYXJ0ICsgXCJcXFxcLlwiKyBpcHY0X3BhcnQgKyBcIihbOl0oWzAtOV0pKyk/JFwiKSwgLy8gcG9ydCBudW1iZXJcbiAgICBpcHY2X3JlZ2V4ID0gbmV3IFJlZ0V4cChcIl5cXFxcWz8oKFswLTldfFthLWZdfFtBLUZdKSpbOi5dKyhbMC05XXxbYS1mXXxbQS1GXSkrWzouXSopK1tcXFxcXV0/KFs6XVswLTldKyk/JFwiKTtcblxuXG52YXIgQ2xpcXpVdGlscyA9IHtcbiAgTEFOR1M6ICAgICAgICAgICAgICAgICAgICAgICAgICB7J2RlJzonZGUnLCAnZW4nOidlbicsICdmcic6J2ZyJ30sXG4gIFJFU1VMVFNfUFJPVklERVI6ICAgICAgICAgICAgICAgJ2h0dHBzOi8vbmV3YmV0YS5jbGlxei5jb20vYXBpL3YxL3Jlc3VsdHM/cT0nLFxuICBSSUNIX0hFQURFUjogICAgICAgICAgICAgICAgICAgICdodHRwczovL25ld2JldGEuY2xpcXouY29tL2FwaS92MS9yaWNoLWhlYWRlcj9wYXRoPS9tYXAnLFxuICBSRVNVTFRTX1BST1ZJREVSX0xPRzogICAgICAgICAgICdodHRwczovL25ld2JldGEuY2xpcXouY29tL2FwaS92MS9sb2dnaW5nP3E9JyxcbiAgUkVTVUxUU19QUk9WSURFUl9QSU5HOiAgICAgICAgICAnaHR0cHM6Ly9uZXdiZXRhLmNsaXF6LmNvbS9waW5nJyxcbiAgQ09ORklHX1BST1ZJREVSOiAgICAgICAgICAgICAgICAnaHR0cHM6Ly9uZXdiZXRhLmNsaXF6LmNvbS9hcGkvdjEvY29uZmlnJyxcbiAgU0FGRV9CUk9XU0lORzogICAgICAgICAgICAgICAgICAnaHR0cHM6Ly9zYWZlLWJyb3dzaW5nLmNsaXF6LmNvbScsXG4gIFRVVE9SSUFMX1VSTDogICAgICAgICAgICAgICAgICAgJ2h0dHBzOi8vY2xpcXouY29tL2hvbWUvb25ib2FyZGluZycsXG4gIFVOSU5TVEFMTDogICAgICAgICAgICAgICAgICAgICAgJ2h0dHBzOi8vY2xpcXouY29tL2hvbWUvb2ZmYm9hcmRpbmcnLFxuICBGRUVEQkFDSzogICAgICAgICAgICAgICAgICAgICAgICdodHRwczovL2NsaXF6LmNvbS9mZWVkYmFjay8nLFxuICBTWVNURU1fQkFTRV9VUkw6ICAgICAgICAgICAgICAgIENMSVFaRW52aXJvbm1lbnQuU1lTVEVNX0JBU0VfVVJMLFxuICBQUkVGRVJSRURfTEFOR1VBR0U6ICAgICAgICAgICAgIG51bGwsXG5cbiAgQlJBTkRTX0RBVEFCQVNFOiBCUkFORFNfREFUQUJBU0UsXG5cbiAgLy93aWxsIGJlIHVwZGF0ZWQgZnJvbSB0aGUgbWl4ZXIgY29uZmlnIGVuZHBvaW50IGV2ZXJ5IHRpbWUgbmV3IGxvZ29zIGFyZSBnZW5lcmF0ZWRcbiAgQlJBTkRTX0RBVEFCQVNFX1ZFUlNJT046IDE0NTc5NTI5OTU4NDgsXG4gIEdFT0xPQ19XQVRDSF9JRDogICAgICAgICAgICAgICAgbnVsbCwgLy8gVGhlIElEIG9mIHRoZSBnZW9sb2NhdGlvbiB3YXRjaGVyIChmdW5jdGlvbiB0aGF0IHVwZGF0ZXMgY2FjaGVkIGdlb2xvY2F0aW9uIG9uIGNoYW5nZSlcbiAgVkVSVElDQUxfVEVNUExBVEVTOiB7XG4gICAgICAgICduJzogJ25ld3MnICAgICxcbiAgICAgICAgJ3AnOiAncGVvcGxlJyAgLFxuICAgICAgICAndic6ICd2aWRlbycgICAsXG4gICAgICAgICdoJzogJ2hxJyAgICAgICxcbiAgICAgICAgJ3InOiAncmVjaXBlJyAsXG4gICAgICAgICdnJzogJ2NwZ2FtZV9tb3ZpZScsXG4gICAgICAgICdvJzogJ2NwZ2FtZV9tb3ZpZSdcbiAgICB9LFxuICBobTogbnVsbCxcbiAgVEVNUExBVEVTX1BBVEg6IENMSVFaRW52aXJvbm1lbnQuVEVNUExBVEVTX1BBVEgsXG4gIFRFTVBMQVRFUzogQ0xJUVpFbnZpcm9ubWVudC5URU1QTEFURVMsXG4gIE1FU1NBR0VfVEVNUExBVEVTOiBDTElRWkVudmlyb25tZW50Lk1FU1NBR0VfVEVNUExBVEVTLFxuICBQQVJUSUFMUzogQ0xJUVpFbnZpcm9ubWVudC5QQVJUSUFMUyxcbiAgU0tJTl9QQVRIOiBDTElRWkVudmlyb25tZW50LlNLSU5fUEFUSCxcbiAgTE9DQUxFX1BBVEg6IENMSVFaRW52aXJvbm1lbnQuTE9DQUxFX1BBVEgsXG4gIFJFUkFOS0VSUzogQ0xJUVpFbnZpcm9ubWVudC5SRVJBTktFUlMsXG4gIE1JTl9RVUVSWV9MRU5HSFRfRk9SX0VaOiBDTElRWkVudmlyb25tZW50Lk1JTl9RVUVSWV9MRU5HSFRfRk9SX0VaLFxuXG4gIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpe1xuICAgIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gICAgaWYgKCFvcHRpb25zLmxhbmcpIHtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlamVjdChcImxhbmcgbWlzc2luZ1wiKTtcbiAgICB9XG4gICAgQ2xpcXpVdGlscy5pbXBvcnRNb2R1bGUoJ2NvcmUvZ3ppcCcpLnRoZW4oZnVuY3Rpb24oZ3ppcCkge1xuICAgICAgQ0xJUVpFbnZpcm9ubWVudC5nemlwID0gZ3ppcDtcbiAgICB9KS5jYXRjaChmdW5jdGlvbiAoKSB7XG4gICAgICAvL25vIGd6aXAsIGRvIG5vdGhpbmdcbiAgICB9KTtcblxuICAgIC8vIEZJWE1FOiBgaW1wb3J0IENsaXF6TGFuZ3VhZ2UgZnJvbSBcInBsYXRmb3JtL2xhbmd1YWdlXCI7YCBkb2VzIG5vdCB3b3JrXG4gICAgQ2xpcXpVdGlscy5pbXBvcnRNb2R1bGUoJ3BsYXRmb3JtL2xhbmd1YWdlJykudGhlbihmdW5jdGlvbihsYW5ndWFnZSkge1xuICAgICAgQ2xpcXpMYW5ndWFnZSA9IGxhbmd1YWdlLmRlZmF1bHQ7XG4gICAgfSkuY2F0Y2goZnVuY3Rpb24gKCkge1xuICAgICAgQ2xpcXpVdGlscy5sb2coJ2Vycm9yOiBjYW5ub3QgbG9hZCBDbGlxekxhbmd1YWdlJyk7XG4gICAgfSk7XG5cbiAgICAvLyBjdXR0aW5nIGN5Y2xpYyBkZXBlbmRlbmN5XG4gICAgQ0xJUVpFbnZpcm9ubWVudC5nZXRMb2dvRGV0YWlscyA9IENsaXF6VXRpbHMuZ2V0TG9nb0RldGFpbHMuYmluZChDbGlxelV0aWxzKTtcbiAgICBDTElRWkVudmlyb25tZW50LmdldERldGFpbHNGcm9tVXJsID0gQ2xpcXpVdGlscy5nZXREZXRhaWxzRnJvbVVybC5iaW5kKENsaXF6VXRpbHMpO1xuICAgIENMSVFaRW52aXJvbm1lbnQuZ2V0TG9jYWxpemVkU3RyaW5nID0gQ2xpcXpVdGlscy5nZXRMb2NhbGl6ZWRTdHJpbmcuYmluZChDbGlxelV0aWxzKTtcbiAgICBDTElRWkVudmlyb25tZW50LlNLSU5fUEFUSCA9IENsaXF6VXRpbHMuU0tJTl9QQVRIO1xuXG4gICAgaWYoIWJyYW5kX2xvYWRlZCl7XG4gICAgICBicmFuZF9sb2FkZWQgPSB0cnVlO1xuXG4gICAgICB2YXIgY29uZmlnID0gdGhpcy5nZXRQcmVmKFwiY29uZmlnX2xvZ29WZXJzaW9uXCIpLCBkZXYgPSB0aGlzLmdldFByZWYoXCJicmFuZHMtZGF0YWJhc2UtdmVyc2lvblwiKTtcblxuICAgICAgaWYgKGRldikgdGhpcy5CUkFORFNfREFUQUJBU0VfVkVSU0lPTiA9IGRldlxuICAgICAgZWxzZSBpZiAoY29uZmlnKSB0aGlzLkJSQU5EU19EQVRBQkFTRV9WRVJTSU9OID0gY29uZmlnXG5cbiAgICAgIHZhciByZXRyeVBhdHRlcm4gPSBbNjAqTUlOVVRFLCAxMCpNSU5VVEUsIDUqTUlOVVRFLCAyKk1JTlVURSwgTUlOVVRFXTtcblxuICAgICAgKGZ1bmN0aW9uIGdldExvZ29EQih1cmwpe1xuXG4gICAgICAgICAgQ2xpcXpVdGlscyAmJiBDbGlxelV0aWxzLmh0dHBHZXQodXJsLFxuICAgICAgICAgIGZ1bmN0aW9uKHJlcSl7XG4gICAgICAgICAgICBDbGlxelV0aWxzLkJSQU5EU19EQVRBQkFTRSA9ICBCUkFORFNfREFUQUJBU0UgPSBKU09OLnBhcnNlKHJlcS5yZXNwb25zZSk7IH0sXG4gICAgICAgICAgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHZhciByZXRyeSA9IHJldHJ5UGF0dGVybi5wb3AoKTtcbiAgICAgICAgICAgIGlmKHJldHJ5KSBDbGlxelV0aWxzLnNldFRpbWVvdXQoZ2V0TG9nb0RCLCByZXRyeSwgdXJsKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgLCBNSU5VVEUvMik7XG4gICAgICB9KShDTElRWkVudmlyb25tZW50LmdldEJyYW5kc0RCVXJsKHRoaXMuQlJBTkRTX0RBVEFCQVNFX1ZFUlNJT04pKTtcbiAgICB9XG5cbiAgICBDbGlxelV0aWxzLmxvZygnSW5pdGlhbGl6ZWQnLCAnQ2xpcXpVdGlscycpO1xuXG4gICAgQ2xpcXpVdGlscy5zZXRMYW5nKG9wdGlvbnMubGFuZyk7XG4gIH0sXG5cbiAgc2V0TGFuZzogZnVuY3Rpb24gKGxhbmcpIHtcbiAgICAgQ2xpcXpVdGlscy5QUkVGRVJSRURfTEFOR1VBR0UgPSBsYW5nO1xuICAgICBDbGlxelV0aWxzLmxvYWRMb2NhbGUoQ2xpcXpVdGlscy5QUkVGRVJSRURfTEFOR1VBR0UpO1xuICB9LFxuXG4gIGluaXRQbGF0Zm9ybTogZnVuY3Rpb24oU3lzdGVtKSB7XG4gICAgU3lzdGVtLmJhc2VVUkwgPSBDTElRWkVudmlyb25tZW50LlNZU1RFTV9CQVNFX1VSTDtcbiAgICBDbGlxelV0aWxzLlN5c3RlbSA9IFN5c3RlbTtcbiAgfSxcblxuICBpbXBvcnRNb2R1bGU6IGZ1bmN0aW9uKG1vZHVsZU5hbWUpIHtcbiAgICByZXR1cm4gQ2xpcXpVdGlscy5TeXN0ZW0uaW1wb3J0KG1vZHVsZU5hbWUpXG4gIH0sXG5cbiAgY2FsbEFjdGlvbihtb2R1bGVOYW1lLCBhY3Rpb25OYW1lLCBhcmdzKSB7XG4gICAgdmFyIG1vZHVsZSA9IENsaXF6VXRpbHMuU3lzdGVtLmdldChtb2R1bGVOYW1lK1wiL2JhY2tncm91bmRcIik7XG4gICAgdmFyIGFjdGlvbiA9IG1vZHVsZS5kZWZhdWx0LmFjdGlvbnNbYWN0aW9uTmFtZV07XG4gICAgcmV0dXJuIGFjdGlvbi5hcHBseShudWxsLCBhcmdzKTtcbiAgfSxcblxuICBpc051bWJlcjogZnVuY3Rpb24obil7XG4gICAgICAvKlxuICAgICAgTk9URTogdGhpcyBmdW5jdGlvbiBjYW4ndCByZWNvZ25pemUgbnVtYmVycyBpbiB0aGUgZm9ybSBzdWNoIGFzOiBcIjEuMkJcIiwgYnV0IGl0IGNhbiBmb3IgXCIxZTRcIi4gU2VlIHNwZWNpZmljYXRpb24gZm9yIGlzRmluaXRlKClcbiAgICAgICAqL1xuICAgICAgcmV0dXJuICFpc05hTihwYXJzZUZsb2F0KG4pKSAmJiBpc0Zpbml0ZShuKTtcbiAgfSxcblxuICAvL3JldHVybnMgdGhlIHR5cGUgb25seSBpZiBpdCBpcyBrbm93blxuICBnZXRLbm93blR5cGU6IGZ1bmN0aW9uKHR5cGUpe1xuICAgIHJldHVybiBWRVJUSUNBTF9FTkNPRElOR1MuaGFzT3duUHJvcGVydHkodHlwZSkgJiYgdHlwZTtcbiAgfSxcblxuICAvKipcbiAgICogQ29uc3RydWN0IGEgdXJpIGZyb20gYSB1cmxcbiAgICogQHBhcmFtIHtzdHJpbmd9ICBhVXJsIC0gdXJsXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgYU9yaWdpbkNoYXJzZXQgLSBvcHRpb25hbCBjaGFyYWN0ZXIgc2V0IGZvciB0aGUgVVJJXG4gICAqIEBwYXJhbSB7bnNJVVJJfSAgYUJhc2VVUkkgLSBiYXNlIFVSSSBmb3IgdGhlIHNwZWNcbiAgICovXG4gIG1ha2VVcmk6IENMSVFaRW52aXJvbm1lbnQubWFrZVVyaSxcblxuICAvL21vdmUgdGhpcyBvdXQgb2YgQ2xpcXpVdGlscyFcbiAgc2V0U3VwcG9ydEluZm86IGZ1bmN0aW9uKHN0YXR1cyl7XG4gICAgdmFyIHByZWZzID0gQ29tcG9uZW50cy5jbGFzc2VzWydAbW96aWxsYS5vcmcvcHJlZmVyZW5jZXMtc2VydmljZTsxJ10uZ2V0U2VydmljZShDb21wb25lbnRzLmludGVyZmFjZXMubnNJUHJlZkJyYW5jaCksXG4gICAgICAgIGhvc3QgPSAnZmlyZWZveCcsIGhvc3RWZXJzaW9uPScnO1xuXG4gICAgLy9jaGVjayBpZiB0aGUgcHJlZnMgZXhpc3QgYW5kIGlmIHRoZXkgYXJlIHN0cmluZ1xuICAgIGlmKHByZWZzLmdldFByZWZUeXBlKCdkaXN0cmlidXRpb24uaWQnKSA9PSAzMiAmJiBwcmVmcy5nZXRQcmVmVHlwZSgnZGlzdHJpYnV0aW9uLnZlcnNpb24nKSA9PSAzMil7XG4gICAgICBob3N0ID0gcHJlZnMuZ2V0Q2hhclByZWYoJ2Rpc3RyaWJ1dGlvbi5pZCcpO1xuICAgICAgaG9zdFZlcnNpb24gPSBwcmVmcy5nZXRDaGFyUHJlZignZGlzdHJpYnV0aW9uLnZlcnNpb24nKTtcbiAgICB9XG4gICAgdmFyIGluZm8gPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgdmVyc2lvbjogQ2xpcXpVdGlscy5leHRlbnNpb25WZXJzaW9uLFxuICAgICAgICAgIGhvc3Q6IGhvc3QsXG4gICAgICAgICAgaG9zdFZlcnNpb246IGhvc3RWZXJzaW9uLFxuICAgICAgICAgIHN0YXR1czogc3RhdHVzICE9IHVuZGVmaW5lZCA/IHN0YXR1cyA6IFwiYWN0aXZlXCJcbiAgICAgICAgfSksXG4gICAgICAgIHNpdGVzID0gW1wiaHR0cDovL2NsaXF6LmNvbVwiLFwiaHR0cHM6Ly9jbGlxei5jb21cIl1cblxuICAgIHNpdGVzLmZvckVhY2goZnVuY3Rpb24odXJsKXtcbiAgICAgICAgdmFyIGxzID0gQ0xJUVpFbnZpcm9ubWVudC5nZXRMb2NhbFN0b3JhZ2UodXJsKVxuXG4gICAgICAgIGlmIChscykgbHMuc2V0SXRlbShcImV4dGVuc2lvbi1pbmZvXCIsaW5mbylcbiAgICB9KVxuICB9LFxuICBnZXRMb2dvRGV0YWlsczogZnVuY3Rpb24odXJsRGV0YWlscyl7XG4gICAgdmFyIGJhc2UgPSB1cmxEZXRhaWxzLm5hbWUsXG4gICAgICAgIGJhc2VDb3JlID0gYmFzZS5yZXBsYWNlKC9bLV0vZywgXCJcIiksXG4gICAgICAgIGNoZWNrID0gZnVuY3Rpb24oaG9zdCxydWxlKXtcbiAgICAgICAgICB2YXIgYWRkcmVzcyA9IGhvc3QubGFzdEluZGV4T2YoYmFzZSksIHBhcnNlZGRvbWFpbiA9IGhvc3Quc3Vic3RyKDAsYWRkcmVzcykgKyBcIiRcIiArIGhvc3Quc3Vic3RyKGFkZHJlc3MgKyBiYXNlLmxlbmd0aClcblxuICAgICAgICAgIHJldHVybiBwYXJzZWRkb21haW4uaW5kZXhPZihydWxlKSAhPSAtMVxuICAgICAgICB9LFxuICAgICAgICByZXN1bHQgPSB7fSxcbiAgICAgICAgZG9tYWlucyA9IEJSQU5EU19EQVRBQkFTRS5kb21haW5zO1xuXG5cblxuICAgIGlmKGJhc2UubGVuZ3RoID09IDApXG4gICAgICByZXR1cm4gcmVzdWx0O1xuXG4gICAgaWYgKGJhc2UgPT0gXCJJUFwiKSByZXN1bHQgPSB7IHRleHQ6IFwiSVBcIiwgYmFja2dyb3VuZENvbG9yOiBcIjkwNzdlM1wiIH1cblxuICAgIGVsc2UgaWYgKGRvbWFpbnNbYmFzZV0pIHtcbiAgICAgIGZvciAodmFyIGk9MCxpbWF4PWRvbWFpbnNbYmFzZV0ubGVuZ3RoO2k8aW1heDtpKyspIHtcbiAgICAgICAgdmFyIHJ1bGUgPSBkb21haW5zW2Jhc2VdW2ldIC8vIHIgPSBydWxlLCBiID0gYmFja2dyb3VuZC1jb2xvciwgbCA9IGxvZ28sIHQgPSB0ZXh0LCBjID0gY29sb3JcblxuICAgICAgICBpZiAoaSA9PSBpbWF4IC0gMSB8fCBjaGVjayh1cmxEZXRhaWxzLmhvc3QscnVsZS5yKSkge1xuICAgICAgICAgIHJlc3VsdCA9IHtcbiAgICAgICAgICAgIGJhY2tncm91bmRDb2xvcjogcnVsZS5iP3J1bGUuYjpudWxsLFxuICAgICAgICAgICAgYmFja2dyb3VuZEltYWdlOiBydWxlLmw/XCJ1cmwoaHR0cHM6Ly9jZG4uY2xpcXouY29tL2JyYW5kcy1kYXRhYmFzZS9kYXRhYmFzZS9cIiArIHRoaXMuQlJBTkRTX0RBVEFCQVNFX1ZFUlNJT04gKyBcIi9sb2dvcy9cIiArIGJhc2UgKyBcIi9cIiArIHJ1bGUuciArIFwiLnN2ZylcIjpcIlwiLFxuICAgICAgICAgICAgdGV4dDogcnVsZS50LFxuICAgICAgICAgICAgY29sb3I6IHJ1bGUuYz9cIlwiOlwiI2ZmZlwiXG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnJlYWtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgICByZXN1bHQudGV4dCA9IHJlc3VsdC50ZXh0IHx8IChiYXNlQ29yZS5sZW5ndGggPiAxID8gKChiYXNlQ29yZVswXS50b1VwcGVyQ2FzZSgpICsgYmFzZUNvcmVbMV0udG9Mb3dlckNhc2UoKSkpIDogXCJcIilcbiAgICByZXN1bHQuYmFja2dyb3VuZENvbG9yID0gcmVzdWx0LmJhY2tncm91bmRDb2xvciB8fCBCUkFORFNfREFUQUJBU0UucGFsZXR0ZVtiYXNlLnNwbGl0KFwiXCIpLnJlZHVjZShmdW5jdGlvbihhLGIpeyByZXR1cm4gYSArIGIuY2hhckNvZGVBdCgwKSB9LDApICUgQlJBTkRTX0RBVEFCQVNFLnBhbGV0dGUubGVuZ3RoXVxuICAgIHZhciBjb2xvcklEID0gQlJBTkRTX0RBVEFCQVNFLnBhbGV0dGUuaW5kZXhPZihyZXN1bHQuYmFja2dyb3VuZENvbG9yKSxcbiAgICAgICAgYnV0dG9uQ2xhc3MgPSBCUkFORFNfREFUQUJBU0UuYnV0dG9ucyAmJiBjb2xvcklEICE9IC0xICYmIEJSQU5EU19EQVRBQkFTRS5idXR0b25zW2NvbG9ySURdP0JSQU5EU19EQVRBQkFTRS5idXR0b25zW2NvbG9ySURdOjEwXG5cbiAgICByZXN1bHQuYnV0dG9uc0NsYXNzID0gXCJjbGlxei1icmFuZHMtYnV0dG9uLVwiICsgYnV0dG9uQ2xhc3NcbiAgICByZXN1bHQuc3R5bGUgPSBcImJhY2tncm91bmQtY29sb3I6ICNcIiArIHJlc3VsdC5iYWNrZ3JvdW5kQ29sb3IgKyBcIjtjb2xvcjpcIiArIChyZXN1bHQuY29sb3IgfHwgJyNmZmYnKSArIFwiO1wiXG5cblxuICAgIGlmIChyZXN1bHQuYmFja2dyb3VuZEltYWdlKSByZXN1bHQuc3R5bGUgKz0gXCJiYWNrZ3JvdW5kLWltYWdlOlwiICsgcmVzdWx0LmJhY2tncm91bmRJbWFnZSArIFwiOyB0ZXh0LWluZGVudDogLTEwZW07XCJcblxuICAgIHJldHVybiByZXN1bHRcbiAgfSxcbiAgaHR0cEhhbmRsZXI6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgZXJyb3JIYW5kbGVyID0gYXJndW1lbnRzWzNdOyAvLyBzZWUgaHR0cEdldCBvciBodHRwUG9zdCBhcmd1bWVudHNcbiAgICB0cnkge1xuICAgICAgcmV0dXJuIENMSVFaRW52aXJvbm1lbnQuaHR0cEhhbmRsZXIuYXBwbHkoQ0xJUVpFbnZpcm9ubWVudCwgYXJndW1lbnRzKTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIGlmKGVycm9ySGFuZGxlcikge1xuICAgICAgICBlcnJvckhhbmRsZXIoZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBDbGlxelV0aWxzLmxvZyhlLCBcImh0dHBIYW5kbGVyIGZhaWxlZFwiKTtcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIGh0dHBHZXQ6IGZ1bmN0aW9uKHVybCwgY2FsbGJhY2ssIG9uZXJyb3IsIHRpbWVvdXQsIF8sIHN5bmMpe1xuICAgIHJldHVybiBDbGlxelV0aWxzLmh0dHBIYW5kbGVyKCdHRVQnLCB1cmwsIGNhbGxiYWNrLCBvbmVycm9yLCB0aW1lb3V0LCBfLCBzeW5jKTtcbiAgfSxcbiAgaHR0cFBvc3Q6IGZ1bmN0aW9uKHVybCwgY2FsbGJhY2ssIGRhdGEsIG9uZXJyb3IsIHRpbWVvdXQpIHtcbiAgICByZXR1cm4gQ2xpcXpVdGlscy5odHRwSGFuZGxlcignUE9TVCcsIHVybCwgY2FsbGJhY2ssIG9uZXJyb3IsIHRpbWVvdXQsIGRhdGEpO1xuICB9LFxuICBnZXRMb2NhbFN0b3JhZ2U6IENMSVFaRW52aXJvbm1lbnQuZ2V0TG9jYWxTdG9yYWdlLFxuICAvKipcbiAgICogTG9hZHMgYSByZXNvdXJjZSBVUkwgZnJvbSB0aGUgeHBpLlxuICAgKlxuICAgKiBXcmFwcyBodHRwR2V0IGluIGEgdHJ5LWNhdGNoIGNsYXVzZS4gV2UgbmVlZCB0byBkbyB0aGlzLCBiZWNhdXNlIHdoZW5cbiAgICogdHJ5aW5nIHRvIGxvYWQgYSBub24tZXhpc3RpbmcgZmlsZSBmcm9tIGFuIHhwaSB2aWEgeG1saHR0cHJlcXVlc3QsIEZpcmVmb3hcbiAgICogdGhyb3dzIGEgTlNfRVJST1JfRklMRV9OT1RfRk9VTkQgZXhjZXB0aW9uIGluc3RlYWQgb2YgY2FsbGluZyB0aGUgb25lcnJvclxuICAgKiBmdW5jdGlvbi5cbiAgICpcbiAgICogQHNlZSBodHRwczovL2J1Z3ppbGxhLm1vemlsbGEub3JnL3Nob3dfYnVnLmNnaT9pZD04MjcyNDMgKHByb2JhYmx5KS5cbiAgICovXG4gIGxvYWRSZXNvdXJjZTogZnVuY3Rpb24odXJsLCBjYWxsYmFjaywgb25lcnJvcikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBDbGlxelV0aWxzLmh0dHBHZXQodXJsLCBjYWxsYmFjaywgb25lcnJvciwgMzAwMCk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgQ2xpcXpVdGlscy5sb2coXCJDb3VsZCBub3QgbG9hZCByZXNvdXJjZSBcIiArIHVybCArIFwiIGZyb20gdGhlIHhwaVwiLFxuICAgICAgICAgICAgICAgICAgICAgXCJDbGlxelV0aWxzLmh0dHBIYW5kbGVyXCIpO1xuICAgICAgb25lcnJvciAmJiBvbmVycm9yKCk7XG4gICAgfVxuICB9LFxuICBvcGVuVGFiSW5XaW5kb3c6IENMSVFaRW52aXJvbm1lbnQub3BlblRhYkluV2luZG93LFxuICAvKipcbiAgICogR2V0IGEgdmFsdWUgZnJvbSBwcmVmZXJlbmNlcyBkYlxuICAgKiBAcGFyYW0ge3N0cmluZ30gIHByZWYgLSBwcmVmZXJlbmNlIGlkZW50aWZpZXJcbiAgICogQHBhcmFtIHsqPX0gICAgICBkZWZhdXRsVmFsdWUgLSByZXR1cm5lZCB2YWx1ZSBpbiBjYXNlIHByZWYgaXMgbm90IGRlZmluZWRcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBwcmVmaXggLSBwcmVmaXggZm9yIHByZWZcbiAgICovXG4gIGdldFByZWY6IENMSVFaRW52aXJvbm1lbnQuZ2V0UHJlZixcbiAgLyoqXG4gICAqIFNldCBhIHZhbHVlIGluIHByZWZlcmVuY2VzIGRiXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgcHJlZiAtIHByZWZlcmVuY2UgaWRlbnRpZmllclxuICAgKiBAcGFyYW0geyo9fSAgICAgIGRlZmF1dGxWYWx1ZSAtIHJldHVybmVkIHZhbHVlIGluIGNhc2UgcHJlZiBpcyBub3QgZGVmaW5lZFxuICAgKiBAcGFyYW0ge3N0cmluZz19IHByZWZpeCAtIHByZWZpeCBmb3IgcHJlZlxuICAgKi9cbiAgc2V0UHJlZjogQ0xJUVpFbnZpcm9ubWVudC5zZXRQcmVmLFxuICAvKipcbiAgICogQ2hlY2sgaWYgdGhlcmUgaXMgYSB2YWx1ZSBpbiBwcmVmZXJlbmNlcyBkYlxuICAgKiBAcGFyYW0ge3N0cmluZ30gIHByZWYgLSBwcmVmZXJlbmNlIGlkZW50aWZpZXJcbiAgICogQHBhcmFtIHtzdHJpbmc9fSBwcmVmaXggLSBwcmVmaXggZm9yIHByZWZcbiAgICovXG4gIGhhc1ByZWY6IENMSVFaRW52aXJvbm1lbnQuaGFzUHJlZixcbiAgLyoqXG4gICAqIENsZWFyIHZhbHVlIGluIHByZWZlcmVuY2VzIGRiXG4gICAqIEBwYXJhbSB7c3RyaW5nfSAgcHJlZiAtIHByZWZlcmVuY2UgaWRlbnRpZmllclxuICAgKiBAcGFyYW0ge3N0cmluZz19IHByZWZpeCAtIHByZWZpeCBmb3IgcHJlZlxuICAgKi9cbiAgY2xlYXJQcmVmOiBDTElRWkVudmlyb25tZW50LmNsZWFyUHJlZixcbiAgbG9nOiBDTElRWkVudmlyb25tZW50LmxvZyxcbiAgZ2V0RGF5OiBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gTWF0aC5mbG9vcihuZXcgRGF0ZSgpLmdldFRpbWUoKSAvIDg2NDAwMDAwKTtcbiAgfSxcbiAgLy9jcmVhdGVzIGEgcmFuZG9tICdsZW4nIGxvbmcgc3RyaW5nIGZyb20gdGhlIGlucHV0IHNwYWNlXG4gIHJhbmQ6IGZ1bmN0aW9uKGxlbiwgX3NwYWNlKXtcbiAgICAgIHZhciByZXQgPSAnJywgaSxcbiAgICAgICAgICBzcGFjZSA9IF9zcGFjZSB8fCAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVphYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejAxMjM0NTY3ODknLFxuICAgICAgICAgIHNMZW4gPSBzcGFjZS5sZW5ndGg7XG5cbiAgICAgIGZvcihpPTA7IGkgPCBsZW47IGkrKyApXG4gICAgICAgICAgcmV0ICs9IHNwYWNlLmNoYXJBdChNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBzTGVuKSk7XG5cbiAgICAgIHJldHVybiByZXQ7XG4gIH0sXG4gIGhhc2g6IGZ1bmN0aW9uKHMpe1xuICAgIHJldHVybiBzLnNwbGl0KCcnKS5yZWR1Y2UoZnVuY3Rpb24oYSxiKXsgcmV0dXJuICgoKGE8PDQpLWEpK2IuY2hhckNvZGVBdCgwKSkgJiAweEVGRkZGRkZ9LCAwKVxuICB9LFxuICBjbGVhbk1vemlsbGFBY3Rpb25zOiBmdW5jdGlvbih1cmwpe1xuICAgIGlmKHVybC5pbmRleE9mKFwibW96LWFjdGlvbjpcIikgPT0gMCkge1xuICAgICAgICB2YXIgWywgYWN0aW9uLCB1cmxdID0gdXJsLm1hdGNoKC9ebW96LWFjdGlvbjooW14sXSspLCguKikkLyk7XG4gICAgICAgIC8vdXJsID0gdXJsLm1hdGNoKC9ebW96LWFjdGlvbjooW14sXSspLCguKikkLylbMl07XG4gICAgfVxuICAgIHJldHVybiBbYWN0aW9uLCB1cmxdO1xuICB9LFxuICBjbGVhblVybFByb3RvY29sOiBmdW5jdGlvbih1cmwsIGNsZWFuV1dXKXtcbiAgICBpZighdXJsKSByZXR1cm4gJyc7XG5cbiAgICB2YXIgcHJvdG9jb2xQb3MgPSB1cmwuaW5kZXhPZignOi8vJyk7XG5cbiAgICAvLyByZW1vdmVzIHByb3RvY29sIGh0dHAocyksIGZ0cCwgLi4uXG4gICAgaWYocHJvdG9jb2xQb3MgIT0gLTEgJiYgcHJvdG9jb2xQb3MgPD0gNilcbiAgICAgIHVybCA9IHVybC5zcGxpdCgnOi8vJylbMV07XG5cbiAgICAvLyByZW1vdmVzIHRoZSB3d3cuXG4gICAgaWYoY2xlYW5XV1cgJiYgdXJsLnRvTG93ZXJDYXNlKCkuaW5kZXhPZignd3d3LicpID09IDApXG4gICAgICB1cmwgPSB1cmwuc2xpY2UoNCk7XG5cbiAgICByZXR1cm4gdXJsO1xuICB9LFxuICBnZXREZXRhaWxzRnJvbVVybDogZnVuY3Rpb24ob3JpZ2luYWxVcmwpe1xuICAgIHZhciBbYWN0aW9uLCBvcmlnaW5hbFVybF0gPSBDbGlxelV0aWxzLmNsZWFuTW96aWxsYUFjdGlvbnMob3JpZ2luYWxVcmwpO1xuICAgIC8vIGV4Y2x1ZGUgcHJvdG9jb2xcbiAgICB2YXIgdXJsID0gb3JpZ2luYWxVcmwsXG4gICAgICAgIG5hbWUgPSAnJyxcbiAgICAgICAgdGxkID0gJycsXG4gICAgICAgIHN1YmRvbWFpbnMgPSBbXSxcbiAgICAgICAgcGF0aCA9ICcnLFxuICAgICAgICBxdWVyeSA9JycsXG4gICAgICAgIGZyYWdtZW50ID0gJycsXG4gICAgICAgIHNzbCA9IG9yaWdpbmFsVXJsLmluZGV4T2YoJ2h0dHBzJykgPT0gMDtcblxuICAgIC8vIHJlbW92ZSBzY2hlbWVcbiAgICB1cmwgPSBDbGlxelV0aWxzLmNsZWFuVXJsUHJvdG9jb2wodXJsLCBmYWxzZSk7XG4gICAgdmFyIHNjaGVtZSA9IG9yaWdpbmFsVXJsLnJlcGxhY2UodXJsLCAnJykucmVwbGFjZSgnLy8nLCAnJyk7XG5cbiAgICAvLyBzZXBhcmF0ZSBob3N0bmFtZSBmcm9tIHBhdGgsIGV0Yy4gQ291bGQgYmUgc2VwYXJhdGVkIGZyb20gcmVzdCBieSAvLCA/IG9yICNcbiAgICB2YXIgaG9zdCA9IHVybC5zcGxpdCgvW1xcL1xcI1xcP10vKVswXS50b0xvd2VyQ2FzZSgpO1xuICAgIHZhciBwYXRoID0gdXJsLnJlcGxhY2UoaG9zdCwnJyk7XG5cbiAgICAvLyBzZXBhcmF0ZSB1c2VybmFtZTpwYXNzd29yZEAgZnJvbSBob3N0XG4gICAgdmFyIHVzZXJwYXNzX2hvc3QgPSBob3N0LnNwbGl0KCdAJyk7XG4gICAgaWYodXNlcnBhc3NfaG9zdC5sZW5ndGggPiAxKVxuICAgICAgaG9zdCA9IHVzZXJwYXNzX2hvc3RbMV07XG5cbiAgICAvLyBQYXJzZSBQb3J0IG51bWJlclxuICAgIHZhciBwb3J0ID0gXCJcIjtcblxuICAgIHZhciBpc0lQdjQgPSBpcHY0X3JlZ2V4LnRlc3QoaG9zdCk7XG4gICAgdmFyIGlzSVB2NiA9IGlwdjZfcmVnZXgudGVzdChob3N0KTtcblxuXG4gICAgdmFyIGluZGV4T2ZDb2xvbiA9IGhvc3QuaW5kZXhPZihcIjpcIik7XG4gICAgaWYgKCghaXNJUHY2IHx8IGlzSVB2NCkgJiYgaW5kZXhPZkNvbG9uID49IDApIHtcbiAgICAgIHBvcnQgPSBob3N0LnN1YnN0cihpbmRleE9mQ29sb24rMSk7XG4gICAgICBob3N0ID0gaG9zdC5zdWJzdHIoMCxpbmRleE9mQ29sb24pO1xuICAgIH1cbiAgICBlbHNlIGlmIChpc0lQdjYpIHtcbiAgICAgIC8vIElmIGFuIElQdjYgYWRkcmVzcyBoYXMgYSBwb3J0IG51bWJlciwgaXQgd2lsbCBiZSByaWdodCBhZnRlciBhIGNsb3NpbmcgYnJhY2tldCBdIDogZm9ybWF0IFtpcF92Nl06cG9ydFxuICAgICAgdmFyIGVuZE9mSVAgPSBob3N0LmluZGV4T2YoJ106Jyk7XG4gICAgICBpZiAoZW5kT2ZJUCA+PSAwKSB7XG4gICAgICAgIHBvcnQgPSBob3N0LnNwbGl0KCddOicpWzFdO1xuICAgICAgICBob3N0ID0gaG9zdC5zcGxpdCgnXTonKVswXS5yZXBsYWNlKCdbJywnJykucmVwbGFjZSgnXScsJycpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIGV4dHJhY3QgcXVlcnkgYW5kIGZyYWdtZW50IGZyb20gdXJsXG4gICAgdmFyIHF1ZXJ5ID0gJyc7XG4gICAgdmFyIHF1ZXJ5X2lkeCA9IHBhdGguaW5kZXhPZignPycpO1xuICAgIGlmKHF1ZXJ5X2lkeCAhPSAtMSkge1xuICAgICAgcXVlcnkgPSBwYXRoLnN1YnN0cihxdWVyeV9pZHgrMSk7XG4gICAgfVxuXG4gICAgdmFyIGZyYWdtZW50ID0gJyc7XG4gICAgdmFyIGZyYWdtZW50X2lkeCA9IHBhdGguaW5kZXhPZignIycpO1xuICAgIGlmKGZyYWdtZW50X2lkeCAhPSAtMSkge1xuICAgICAgZnJhZ21lbnQgPSBwYXRoLnN1YnN0cihmcmFnbWVudF9pZHgrMSk7XG4gICAgfVxuXG4gICAgLy8gcmVtb3ZlIHF1ZXJ5IGFuZCBmcmFnbWVudCBmcm9tIHBhdGhcbiAgICBwYXRoID0gcGF0aC5yZXBsYWNlKCc/JyArIHF1ZXJ5LCAnJyk7XG4gICAgcGF0aCA9IHBhdGgucmVwbGFjZSgnIycgKyBmcmFnbWVudCwgJycpO1xuICAgIHF1ZXJ5ID0gcXVlcnkucmVwbGFjZSgnIycgKyBmcmFnbWVudCwgJycpO1xuXG4gICAgLy8gZXh0cmEgLSBhbGwgcGF0aCwgcXVlcnkgYW5kIGZyYWdtZW50XG4gICAgdmFyIGV4dHJhID0gcGF0aDtcbiAgICBpZihxdWVyeSlcbiAgICAgIGV4dHJhICs9IFwiP1wiICsgcXVlcnk7XG4gICAgaWYoZnJhZ21lbnQpXG4gICAgICBleHRyYSArPSBcIiNcIiArIGZyYWdtZW50O1xuXG4gICAgaXNJUHY0ID0gaXB2NF9yZWdleC50ZXN0KGhvc3QpO1xuICAgIGlzSVB2NiA9IGlwdjZfcmVnZXgudGVzdChob3N0KTtcbiAgICB2YXIgaXNMb2NhbGhvc3QgPSBDbGlxelV0aWxzLmlzTG9jYWxob3N0KGhvc3QsIGlzSVB2NCwgaXNJUHY2KTtcblxuICAgIC8vIGZpbmQgcGFydHMgb2YgaG9zdG5hbWVcbiAgICBpZiAoIWlzSVB2NCAmJiAhaXNJUHY2ICYmICFpc0xvY2FsaG9zdCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGxkID0gQ0xJUVpFbnZpcm9ubWVudC50bGRFeHRyYWN0b3IoaG9zdCk7XG5cbiAgICAgICAgLy8gR2V0IHRoZSBkb21haW4gbmFtZSB3L28gc3ViZG9tYWlucyBhbmQgdy9vIFRMRFxuICAgICAgICBuYW1lID0gaG9zdC5zbGljZSgwLCAtKHRsZC5sZW5ndGgrMSkpLnNwbGl0KCcuJykucG9wKCk7IC8vICsxIGZvciB0aGUgJy4nXG5cbiAgICAgICAgLy8gR2V0IHN1YmRvbWFpbnNcbiAgICAgICAgdmFyIG5hbWVfdGxkID0gbmFtZSArIFwiLlwiICsgdGxkO1xuICAgICAgICBzdWJkb21haW5zID0gaG9zdC5zbGljZSgwLCAtbmFtZV90bGQubGVuZ3RoKS5zcGxpdChcIi5cIikuc2xpY2UoMCwgLTEpO1xuXG4gICAgICAgIC8vcmVtb3ZlIHd3dyBpZiBleGlzdHNcbiAgICAgICAgLy8gVE9ETzogSSBkb24ndCB0aGluayB0aGlzIGlzIHRoZSByaWdodCBwbGFjZSB0byBkbyB0aGlzLlxuICAgICAgICAvLyAgICAgICBEaXNhYmxlZCBmb3Igbm93LCBidXQgY2hlY2sgdGhlcmUgYXJlIG5vIGlzc3Vlcy5cbiAgICAgICAgLy8gaG9zdCA9IGhvc3QuaW5kZXhPZignd3d3LicpID09IDAgPyBob3N0LnNsaWNlKDQpIDogaG9zdDtcbiAgICAgIH0gY2F0Y2goZSl7XG4gICAgICAgIG5hbWUgPSBcIlwiO1xuICAgICAgICBob3N0ID0gXCJcIjtcbiAgICAgICAgLy9DbGlxelV0aWxzLmxvZygnV0FSTklORyBGYWlsZWQgZm9yOiAnICsgb3JpZ2luYWxVcmwsICdDbGlxelV0aWxzLmdldERldGFpbHNGcm9tVXJsJyk7XG4gICAgICB9XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgbmFtZSA9IGlzTG9jYWxob3N0ID8gXCJsb2NhbGhvc3RcIiA6IFwiSVBcIjtcbiAgICB9XG5cbiAgICAvLyByZW1vdmUgd3d3IGZyb20gYmVnaW5uaW5nLCB3ZSBuZWVkIGNsZWFuSG9zdCBpbiB0aGUgZnJpZW5kbHkgdXJsXG4gICAgdmFyIGNsZWFuSG9zdCA9IGhvc3Q7XG4gICAgaWYoaG9zdC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ3d3dy4nKSA9PSAwKSB7XG4gICAgICBjbGVhbkhvc3QgPSBob3N0LnNsaWNlKDQpO1xuICAgIH1cblxuICAgIHZhciBmcmllbmRseV91cmwgPSBjbGVhbkhvc3QgKyBleHRyYTtcbiAgICAvL3JlbW92ZSB0cmFpbGluZyBzbGFzaCBmcm9tIHRoZSBlbmRcbiAgICBmcmllbmRseV91cmwgPSBDbGlxelV0aWxzLnN0cmlwVHJhaWxpbmdTbGFzaChmcmllbmRseV91cmwpO1xuXG4gICAgLy9IYW5kbGUgY2FzZSB3aGVyZSB3ZSBoYXZlIG9ubHkgdGxkIGZvciBleGFtcGxlIGh0dHA6Ly9jbGlxem5hc1xuICAgIGlmKGNsZWFuSG9zdCA9PT0gdGxkKSB7XG4gICAgICBuYW1lID0gdGxkO1xuICAgIH1cblxuICAgIHZhciB1cmxEZXRhaWxzID0ge1xuICAgICAgICAgICAgICBzY2hlbWU6IHNjaGVtZSxcbiAgICAgICAgICAgICAgbmFtZTogbmFtZSxcbiAgICAgICAgICAgICAgZG9tYWluOiB0bGQgPyBuYW1lICsgJy4nICsgdGxkIDogJycsXG4gICAgICAgICAgICAgIHRsZDogdGxkLFxuICAgICAgICAgICAgICBzdWJkb21haW5zOiBzdWJkb21haW5zLFxuICAgICAgICAgICAgICBwYXRoOiBwYXRoLFxuICAgICAgICAgICAgICBxdWVyeTogcXVlcnksXG4gICAgICAgICAgICAgIGZyYWdtZW50OiBmcmFnbWVudCxcbiAgICAgICAgICAgICAgZXh0cmE6IGV4dHJhLFxuICAgICAgICAgICAgICBob3N0OiBob3N0LFxuICAgICAgICAgICAgICBjbGVhbkhvc3Q6IGNsZWFuSG9zdCxcbiAgICAgICAgICAgICAgc3NsOiBzc2wsXG4gICAgICAgICAgICAgIHBvcnQ6IHBvcnQsXG4gICAgICAgICAgICAgIGZyaWVuZGx5X3VybDogZnJpZW5kbHlfdXJsXG4gICAgICAgIH07XG5cbiAgICByZXR1cm4gdXJsRGV0YWlscztcbiAgfSxcbiAgc3RyaXBUcmFpbGluZ1NsYXNoOiBmdW5jdGlvbihzdHIpIHtcbiAgICBpZihzdHIuc3Vic3RyKC0xKSA9PT0gJy8nKSB7XG4gICAgICAgIHJldHVybiBzdHIuc3Vic3RyKDAsIHN0ci5sZW5ndGggLSAxKTtcbiAgICB9XG4gICAgcmV0dXJuIHN0cjtcbiAgfSxcbiAgX2lzVXJsUmVnRXhwOiAvXigoW2EtelxcZF0oW2EtelxcZC1dKlthLXpcXGRdKSlcXC4pK1thLXpdezIsfShcXDpcXGQrKT8kL2ksXG4gIGlzVXJsOiBmdW5jdGlvbihpbnB1dCl7XG4gICAgLy9zdGVwIDEgcmVtb3ZlIGV2ZW50dWFsIHByb3RvY29sXG4gICAgdmFyIHByb3RvY29sUG9zID0gaW5wdXQuaW5kZXhPZignOi8vJyk7XG4gICAgaWYocHJvdG9jb2xQb3MgIT0gLTEgJiYgcHJvdG9jb2xQb3MgPD0gNil7XG4gICAgICBpbnB1dCA9IGlucHV0LnNsaWNlKHByb3RvY29sUG9zKzMpXG4gICAgfVxuICAgIC8vc3RlcDIgcmVtb3ZlIHBhdGggJiBldmVyeXRoaW5nIGFmdGVyXG4gICAgaW5wdXQgPSBpbnB1dC5zcGxpdCgnLycpWzBdO1xuICAgIC8vc3RlcDMgcnVuIHRoZSByZWdleFxuICAgIHJldHVybiBDbGlxelV0aWxzLl9pc1VybFJlZ0V4cC50ZXN0KGlucHV0KTtcbiAgfSxcblxuXG4gIC8vIENoZWNoa3MgaWYgdGhlIGdpdmVuIHN0cmluZyBpcyBhIHZhbGlkIElQdjQgYWRkcmVzXG4gIGlzSVB2NDogZnVuY3Rpb24oaW5wdXQpIHtcbiAgICB2YXIgaXB2NF9wYXJ0ID0gXCIwKihbMC05XXxbMS05XVswLTldfDFbMC05XXsyfXwyWzAtNF1bMC05XXwyNVswLTVdKVwiOyAvLyBudW1iZXJzIDAgLSAyNTVcbiAgICB2YXIgaXB2NF9yZWdleCA9IG5ldyBSZWdFeHAoXCJeXCIgKyBpcHY0X3BhcnQgKyBcIlxcXFwuXCIrIGlwdjRfcGFydCArIFwiXFxcXC5cIisgaXB2NF9wYXJ0ICsgXCJcXFxcLlwiKyBpcHY0X3BhcnRcbiAgICArIFwiKFs6XShbMC05XSkrKT8kXCIpOyAvLyBwb3J0IG51bWJlclxuICAgIHJldHVybiBpcHY0X3JlZ2V4LnRlc3QoaW5wdXQpO1xuICB9LFxuXG4gIGlzSVB2NjogZnVuY3Rpb24oaW5wdXQpIHtcblxuICAgIC8vIEN1cnJlbnRseSB1c2luZyBhIHNpbXBsZSByZWdleCBmb3IgXCJ3aGF0IGxvb2tzIGxpa2UgYW4gSVB2NiBhZGRyZXNzXCIgZm9yIHJlYWRhYmlsaXR5XG4gICAgdmFyIGlwdjZfcmVnZXggPSBuZXcgUmVnRXhwKFwiXlxcXFxbPygoWzAtOV18W2EtZl18W0EtRl0pKls6Ll0rKFswLTldfFthLWZdfFtBLUZdKStbOi5dKikrW1xcXFxdXT8oWzpdWzAtOV0rKT8kXCIpXG4gICAgcmV0dXJuIGlwdjZfcmVnZXgudGVzdChpbnB1dCk7XG5cbiAgICAvKiBBIGJldHRlciAobW9yZSBwcmVjaXNlKSByZWdleCB0byB2YWxpZGF0ZSBJUFY2IGFkZHJlc3NlcyBmcm9tIFN0YWNrT3ZlcmZsb3c6XG4gICAgbGluazogaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy81MzQ5Ny9yZWd1bGFyLWV4cHJlc3Npb24tdGhhdC1tYXRjaGVzLXZhbGlkLWlwdjYtYWRkcmVzc2VzXG5cbiAgICB2YXIgaXB2Nl9yZWdleCA9IG5ldyBSZWdFeHAoXCIoKFswLTlhLWZBLUZdezEsNH06KXs3LDd9WzAtOWEtZkEtRl17MSw0fXwoWzAtOWEtZkEtRl17MSw0fTopezEsN306fChbMC05YS1mQS1GXXsxLDR9OilcIlxuICAgICsgXCJ7MSw2fTpbMC05YS1mQS1GXXsxLDR9fChbMC05YS1mQS1GXXsxLDR9Oil7MSw1fSg6WzAtOWEtZkEtRl17MSw0fSl7MSwyfXwoWzAtOWEtZkEtRl17MSw0fTopezEsNH0oOlswLTlhLWZBLUZdezEsXCJcbiAgICArIFwiNH0pezEsM318KFswLTlhLWZBLUZdezEsNH06KXsxLDN9KDpbMC05YS1mQS1GXXsxLDR9KXsxLDR9fChbMC05YS1mQS1GXXsxLDR9Oil7MSwyfSg6WzAtOWEtZkEtRl17MSw0fSl7MSw1fXxbMC05YVwiXG4gICAgKyBcIi1mQS1GXXsxLDR9OigoOlswLTlhLWZBLUZdezEsNH0pezEsNn0pfDooKDpbMC05YS1mQS1GXXsxLDR9KXsxLDd9fDopfGZlODA6KDpbMC05YS1mQS1GXXswLDR9KXswLDR9JVswLTlhLXpBLVpdezEsfVwiXG4gICAgKyBcInw6OihmZmZmKDowezEsNH0pezAsMX06KXswLDF9KCgyNVswLTVdfCgyWzAtNF18MXswLDF9WzAtOV0pezAsMX1bMC05XSlcXFxcLil7MywzfSgyNVswLTVdfCgyWzAtNF18MXswLDF9WzAtOV0pezAsMX1bMC05XSlcIlxuICAgICsgXCJ8KFswLTlhLWZBLUZdezEsNH06KXsxLDR9OigoMjVbMC01XXwoMlswLTRdfDF7MCwxfVswLTldKXswLDF9WzAtOV0pXFxcXC4pezMsM30oMjVbMC01XXwoMlswLTRdfDF7MCwxfVswLTldKXswLDF9WzAtOV0pKVwiKTtcbiAgICAqL1xuICB9LFxuXG4gIGlzTG9jYWxob3N0OiBmdW5jdGlvbihob3N0LCBpc0lQdjQsIGlzSVB2Nikge1xuICAgIGlmIChob3N0ID09IFwibG9jYWxob3N0XCIpIHJldHVybiB0cnVlO1xuICAgIGlmIChpc0lQdjQgJiYgaG9zdC5zdWJzdHIoMCwzKSA9PSBcIjEyN1wiKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAoaXNJUHY2ICYmIGhvc3QgPT0gXCI6OjFcIikgcmV0dXJuIHRydWU7XG5cbiAgICByZXR1cm4gZmFsc2U7XG5cbiAgfSxcblxuICAvLyBjaGVja3MgaWYgYSB2YWx1ZSByZXByZXNlbnRzIGFuIHVybCB3aGljaCBpcyBhIHNlYWNoIGVuZ2luZVxuICBpc1NlYXJjaDogZnVuY3Rpb24odmFsdWUpe1xuICAgIGlmKENsaXF6VXRpbHMuaXNVcmwodmFsdWUpKXtcbiAgICAgICByZXR1cm4gQ2xpcXpVdGlscy5nZXREZXRhaWxzRnJvbVVybCh2YWx1ZSkuaG9zdC5pbmRleE9mKCdnb29nbGUnKSA9PT0gMCA/IHRydWU6IGZhbHNlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0sXG4gIC8vIGNoZWNrcyBpZiBhIHN0cmluZyBpcyBhIGNvbXBsZXRlIHVybFxuICBpc0NvbXBsZXRlVXJsOiBmdW5jdGlvbihpbnB1dCl7XG4gICAgdmFyIHBhdHRlcm4gPSAvKGZ0cHxodHRwfGh0dHBzKTpcXC9cXC8oXFx3Kzp7MCwxfVxcdypAKT8oXFxTKykoOlswLTldKyk/KFxcL3xcXC8oW1xcdyMhOi4/Kz0mJUAhXFwtXFwvXSkpPy87XG4gICAgaWYoIXBhdHRlcm4udGVzdChpbnB1dCkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9LFxuICAvLyBleHRyYWN0IHF1ZXJ5IHRlcm0gZnJvbSBzZWFyY2ggZW5naW5lIHJlc3VsdCBwYWdlIFVSTHNcbiAgZXh0cmFjdFF1ZXJ5RnJvbVVybDogZnVuY3Rpb24odXJsKSB7XG4gICAgLy8gR29vZ2xlXG4gICAgaWYgKHVybC5zZWFyY2goL2h0dHAocz8pOlxcL1xcL3d3d1xcLmdvb2dsZVxcLi4qXFwvLipxPS4qL2kpID09PSAwKSB7XG4gICAgICB1cmwgPSB1cmwuc3Vic3RyaW5nKHVybC5sYXN0SW5kZXhPZigncT0nKSArIDIpLnNwbGl0KCcmJylbMF07XG4gICAgLy8gQmluZ1xuICAgIH0gZWxzZSBpZiAodXJsLnNlYXJjaCgvaHR0cChzPyk6XFwvXFwvd3d3XFwuYmluZ1xcLi4qXFwvLipxPS4qL2kpID09PSAwKSB7XG4gICAgICB1cmwgPSB1cmwuc3Vic3RyaW5nKHVybC5pbmRleE9mKCdxPScpICsgMikuc3BsaXQoJyYnKVswXTtcbiAgICAvLyBZYWhvb1xuICAgIH0gZWxzZSBpZiAodXJsLnNlYXJjaCgvaHR0cChzPyk6XFwvXFwvLipzZWFyY2hcXC55YWhvb1xcLmNvbVxcL3NlYXJjaC4qcD0uKi9pKSA9PT0gMCkge1xuICAgICAgdXJsID0gdXJsLnN1YnN0cmluZyh1cmwuaW5kZXhPZigncD0nKSArIDIpLnNwbGl0KCcmJylbMF07XG4gICAgfSBlbHNlIHtcbiAgICAgIHVybCA9IG51bGw7XG4gICAgfVxuICAgIHZhciBkZWNvZGVkID0gdXJsID8gZGVjb2RlVVJJQ29tcG9uZW50KHVybC5yZXBsYWNlKC9cXCsvZywnICcpKSA6IG51bGw7XG4gICAgaWYgKGRlY29kZWQpIHJldHVybiBkZWNvZGVkO1xuICAgIGVsc2UgcmV0dXJuIHVybDtcbiAgfSxcbiAgLy8gUmVtb3ZlIGNsdXR0ZXIgKGh0dHAsIHd3dykgZnJvbSB1cmxzXG4gIGdlbmVyYWxpemVVcmw6IGZ1bmN0aW9uKHVybCwgc2tpcENvcnJlY3Rpb24pIHtcbiAgICBpZiAoIXVybCkge1xuICAgICAgcmV0dXJuICcnO1xuICAgIH1cbiAgICB2YXIgdmFsID0gdXJsLnRvTG93ZXJDYXNlKCk7XG4gICAgdmFyIGNsZWFuUGFydHMgPSBDbGlxelV0aWxzLmNsZWFuVXJsUHJvdG9jb2wodmFsLCBmYWxzZSkuc3BsaXQoJy8nKSxcbiAgICAgIGhvc3QgPSBjbGVhblBhcnRzWzBdLFxuICAgICAgcGF0aExlbmd0aCA9IDAsXG4gICAgICBTWU1CT0xTID0gLyx8XFwuL2c7XG4gICAgaWYgKCFza2lwQ29ycmVjdGlvbikge1xuICAgICAgaWYgKGNsZWFuUGFydHMubGVuZ3RoID4gMSkge1xuICAgICAgICBwYXRoTGVuZ3RoID0gKCcvJyArIGNsZWFuUGFydHMuc2xpY2UoMSkuam9pbignLycpKS5sZW5ndGg7XG4gICAgICB9XG4gICAgICBpZiAoaG9zdC5pbmRleE9mKCd3d3cnKSA9PT0gMCAmJiBob3N0Lmxlbmd0aCA+IDQpIHtcbiAgICAgICAgLy8gb25seSBmaXggc3ltYm9scyBpbiBob3N0XG4gICAgICAgIGlmIChTWU1CT0xTLnRlc3QoaG9zdFszXSkgJiYgaG9zdFs0XSAhPSAnICcpXG4gICAgICAgIC8vIHJlcGxhY2Ugb25seSBpc3N1ZXMgaW4gdGhlIGhvc3QgbmFtZSwgbm90IGV2ZXIgaW4gdGhlIHBhdGhcbiAgICAgICAgICB2YWwgPSB2YWwuc3Vic3RyKDAsIHZhbC5sZW5ndGggLSBwYXRoTGVuZ3RoKS5yZXBsYWNlKFNZTUJPTFMsICcuJykgK1xuICAgICAgICAgIChwYXRoTGVuZ3RoID8gdmFsLnN1YnN0cigtcGF0aExlbmd0aCkgOiAnJyk7XG4gICAgICB9XG4gICAgfVxuICAgIHVybCA9IENsaXF6VXRpbHMuY2xlYW5VcmxQcm90b2NvbCh2YWwsIHRydWUpO1xuICAgIHJldHVybiB1cmxbdXJsLmxlbmd0aCAtIDFdID09ICcvJyA/IHVybC5zbGljZSgwLC0xKSA6IHVybDtcbiAgfSxcbiAgLy8gUmVtb3ZlIGNsdXR0ZXIgZnJvbSB1cmxzIHRoYXQgcHJldmVudHMgcGF0dGVybiBkZXRlY3Rpb24sIGUuZy4gY2hlY2tzdW1cbiAgc2ltcGxpZnlVcmw6IGZ1bmN0aW9uKHVybCkge1xuICAgIHZhciBxO1xuICAgIC8vIEdvb2dsZSByZWRpcmVjdCB1cmxzXG4gICAgaWYgKHVybC5zZWFyY2goL2h0dHAocz8pOlxcL1xcL3d3d1xcLmdvb2dsZVxcLi4qXFwvdXJsXFw/Lip1cmw9LiovaSkgPT09IDApIHtcbiAgICAgIC8vIFJldHVybiB0YXJnZXQgVVJMIGluc3RlYWRcbiAgICAgIHVybCA9IHVybC5zdWJzdHJpbmcodXJsLmxhc3RJbmRleE9mKCd1cmw9JykpLnNwbGl0KCcmJylbMF07XG4gICAgICB1cmwgPSB1cmwuc3Vic3RyKDQpO1xuICAgICAgcmV0dXJuIGRlY29kZVVSSUNvbXBvbmVudCh1cmwpO1xuXG4gICAgICAvLyBSZW1vdmUgY2x1dHRlciBmcm9tIEdvb2dsZSBzZWFyY2hlc1xuICAgIH0gZWxzZSBpZiAodXJsLnNlYXJjaCgvaHR0cChzPyk6XFwvXFwvd3d3XFwuZ29vZ2xlXFwuLipcXC8uKnE9LiovaSkgPT09IDApIHtcbiAgICAgIHEgPSB1cmwuc3Vic3RyaW5nKHVybC5sYXN0SW5kZXhPZigncT0nKSkuc3BsaXQoJyYnKVswXTtcbiAgICAgIGlmIChxICE9ICdxPScpIHtcbiAgICAgICAgLy8gdGJtIGRlZmluZXMgY2F0ZWdvcnkgKGltYWdlcy9uZXdzLy4uLilcbiAgICAgICAgdmFyIHBhcmFtID0gdXJsLmluZGV4T2YoJyMnKSAhPSAtMSA/IHVybC5zdWJzdHIodXJsLmluZGV4T2YoJyMnKSkgOiB1cmwuc3Vic3RyKHVybC5pbmRleE9mKCc/JykpO1xuICAgICAgICB2YXIgdGJtID0gcGFyYW0uaW5kZXhPZigndGJtPScpICE9IC0xID8gKCcmJyArIHBhcmFtLnN1YnN0cmluZyhwYXJhbS5sYXN0SW5kZXhPZigndGJtPScpKS5zcGxpdCgnJicpWzBdKSA6ICcnO1xuICAgICAgICB2YXIgcGFnZSA9IHBhcmFtLmluZGV4T2YoJ3N0YXJ0PScpICE9IC0xID8gKCcmJyArIHBhcmFtLnN1YnN0cmluZyhwYXJhbS5sYXN0SW5kZXhPZignc3RhcnQ9JykpLnNwbGl0KCcmJylbMF0pIDogJyc7XG4gICAgICAgIHJldHVybiAnaHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9zZWFyY2g/JyArIHEgKyB0Ym0gLyorIHBhZ2UqLztcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgICB9XG4gICAgICAvLyBCaW5nXG4gICAgfSBlbHNlIGlmICh1cmwuc2VhcmNoKC9odHRwKHM/KTpcXC9cXC93d3dcXC5iaW5nXFwuLipcXC8uKnE9LiovaSkgPT09IDApIHtcbiAgICAgIHEgPSB1cmwuc3Vic3RyaW5nKHVybC5pbmRleE9mKCdxPScpKS5zcGxpdCgnJicpWzBdO1xuICAgICAgaWYgKHEgIT0gJ3E9Jykge1xuICAgICAgICBpZiAodXJsLmluZGV4T2YoJ3NlYXJjaD8nKSAhPSAtMSlcbiAgICAgICAgICByZXR1cm4gdXJsLnN1YnN0cigwLCB1cmwuaW5kZXhPZignc2VhcmNoPycpKSArICdzZWFyY2g/JyArIHE7XG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gdXJsLnN1YnN0cigwLCB1cmwuaW5kZXhPZignLz8nKSkgKyAnLz8nICsgcTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgICB9XG4gICAgICAvLyBZYWhvbyByZWRpcmVjdFxuICAgIH0gZWxzZSBpZiAodXJsLnNlYXJjaCgvaHR0cChzPyk6XFwvXFwvci5zZWFyY2hcXC55YWhvb1xcLmNvbVxcLy4qL2kpID09PSAwKSB7XG4gICAgICB1cmwgPSB1cmwuc3Vic3RyaW5nKHVybC5sYXN0SW5kZXhPZignL1JVPScpKS5zcGxpdCgnL1JLPScpWzBdO1xuICAgICAgdXJsID0gdXJsLnN1YnN0cig0KTtcbiAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQodXJsKTtcbiAgICAgIC8vIFlhaG9vXG4gICAgfSBlbHNlIGlmICh1cmwuc2VhcmNoKC9odHRwKHM/KTpcXC9cXC8uKnNlYXJjaFxcLnlhaG9vXFwuY29tXFwvc2VhcmNoLipwPS4qL2kpID09PSAwKSB7XG4gICAgICB2YXIgcCA9IHVybC5zdWJzdHJpbmcodXJsLmluZGV4T2YoJ3A9JykpLnNwbGl0KCcmJylbMF07XG4gICAgICBpZiAocCAhPSAncD0nICYmIHVybC5pbmRleE9mKCc7JykgIT0gLTEpIHtcbiAgICAgICAgcmV0dXJuIHVybC5zdWJzdHIoMCwgdXJsLmluZGV4T2YoJzsnKSkgKyAnPycgKyBwO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG4gIH0sXG4gIC8vIGVzdGFibGlzaGVzIHRoZSBjb25uZWN0aW9uXG4gIHBpbmdDbGlxelJlc3VsdHM6IGZ1bmN0aW9uKCl7XG4gICAgQ2xpcXpVdGlscy5odHRwSGFuZGxlcignSEVBRCcsIENsaXF6VXRpbHMuUkVTVUxUU19QUk9WSURFUl9QSU5HKTtcbiAgfSxcbiAgZ2V0QmFja2VuZFJlc3VsdHM6ICBmdW5jdGlvbihxLCBjYWxsYmFjayl7XG4gICAgXG4gIH0sXG4gIGdldENsaXF6UmVzdWx0czogZnVuY3Rpb24ocSwgY2FsbGJhY2spe1xuICAgIENsaXF6VXRpbHMuX3Nlc3Npb25TZXErKztcblxuICAgIC8vIGlmIHRoZSB1c2VyIHNlZXMgdGhlIHJlc3VsdHMgbW9yZSB0aGFuIDUwMG1zIHdlIGNvbnNpZGVyIHRoYXQgaGUgc3RhcnRzIGEgbmV3IHF1ZXJ5XG4gICAgaWYoQ2xpcXpVdGlscy5fcXVlcnlMYXN0RHJhdyAmJiAoRGF0ZS5ub3coKSA+IENsaXF6VXRpbHMuX3F1ZXJ5TGFzdERyYXcgKyA1MDApKXtcbiAgICAgIENsaXF6VXRpbHMuX3F1ZXJ5Q291bnQrKztcbiAgICB9XG4gICAgQ2xpcXpVdGlscy5fcXVlcnlMYXN0RHJhdyA9IDA7IC8vIHJlc2V0IGxhc3QgRHJhdyAtIHdhaXQgZm9yIHRoZSBhY3R1YWwgZHJhd1xuICAgIENsaXF6VXRpbHMuX3F1ZXJ5TGFzdExlbmd0aCA9IHEubGVuZ3RoO1xuXG4gICAgdmFyIHVybCA9IENsaXF6VXRpbHMuUkVTVUxUU19QUk9WSURFUiArXG4gICAgICAgICAgICAgIGVuY29kZVVSSUNvbXBvbmVudChxKSArXG4gICAgICAgICAgICAgIENsaXF6VXRpbHMuZW5jb2RlU2Vzc2lvblBhcmFtcygpICtcbiAgICAgICAgICAgICAgQ2xpcXpMYW5ndWFnZS5zdGF0ZVRvUXVlcnlTdHJpbmcoKSArXG4gICAgICAgICAgICAgIENsaXF6VXRpbHMuZW5jb2RlTG9jYWxlKCkgK1xuICAgICAgICAgICAgICBDbGlxelV0aWxzLmVuY29kZVJlc3VsdE9yZGVyKCkgK1xuICAgICAgICAgICAgICBDbGlxelV0aWxzLmVuY29kZUNvdW50cnkoKSArXG4gICAgICAgICAgICAgIENsaXF6VXRpbHMuZW5jb2RlRmlsdGVyKCkgK1xuICAgICAgICAgICAgICBDbGlxelV0aWxzLmVuY29kZUxvY2F0aW9uKCkgK1xuICAgICAgICAgICAgICBDbGlxelV0aWxzLmVuY29kZVJlc3VsdENvdW50KDcpICtcbiAgICAgICAgICAgICAgQ2xpcXpVdGlscy5kaXNhYmxlV2lraURlZHVwKCk7XG5cbiAgICB2YXIgcmVxID0gQ2xpcXpVdGlscy5odHRwR2V0KHVybCwgZnVuY3Rpb24gKHJlcykge1xuICAgICAgY2FsbGJhY2sgJiYgY2FsbGJhY2socmVzLCBxKTtcbiAgICB9KTtcbiAgfSxcbiAgLy8gSVAgZHJpdmVuIGNvbmZpZ3VyYXRpb25cbiAgZmV0Y2hBbmRTdG9yZUNvbmZpZzogZnVuY3Rpb24oY2FsbGJhY2spe1xuICAgIENsaXF6VXRpbHMuaHR0cEdldChDbGlxelV0aWxzLkNPTkZJR19QUk9WSURFUixcbiAgICAgIGZ1bmN0aW9uKHJlcyl7XG4gICAgICAgIGlmKHJlcyAmJiByZXMucmVzcG9uc2Upe1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICB2YXIgY29uZmlnID0gSlNPTi5wYXJzZShyZXMucmVzcG9uc2UpO1xuICAgICAgICAgICAgZm9yKHZhciBrIGluIGNvbmZpZyl7XG4gICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZignY29uZmlnXycgKyBrLCBjb25maWdba10pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0gY2F0Y2goZSl7fVxuICAgICAgICB9XG5cbiAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgIH0sXG4gICAgICBjYWxsYmFjaywgLy9vbiBlcnJvciB0aGUgY2FsbGJhY2sgc3RpbGwgbmVlZHMgdG8gYmUgY2FsbGVkXG4gICAgICAyMDAwXG4gICAgKTtcbiAgfSxcbiAgZW5jb2RlTG9jYWxlOiBmdW5jdGlvbigpIHtcbiAgICAvLyBzZW5kIGJyb3dzZXIgbGFuZ3VhZ2UgdG8gdGhlIGJhY2stZW5kXG4gICAgcmV0dXJuICcmbG9jYWxlPScrIChDbGlxelV0aWxzLlBSRUZFUlJFRF9MQU5HVUFHRSB8fCBcIlwiKTtcbiAgfSxcbiAgZW5jb2RlQ291bnRyeTogZnVuY3Rpb24oKSB7XG4gICAgLy9pbnRlcm5hdGlvbmFsIHJlc3VsdHMgbm90IHN1cHBvcnRlZFxuICAgIHJldHVybiAnJmZvcmNlX2NvdW50cnk9dHJ1ZSc7XG4gIH0sXG4gIGRpc2FibGVXaWtpRGVkdXA6IGZ1bmN0aW9uKCkge1xuICAgIC8vIGRpc2FibGUgd2lraXBlZGlhIGRlZHVwbGljYXRpb24gb24gdGhlIGJhY2tlbmQgc2lkZVxuICAgIHZhciBkb0RlZHVwID0gQ2xpcXpVdGlscy5nZXRQcmVmKFwibGFuZ3VhZ2VEZWR1cFwiLCBmYWxzZSk7XG4gICAgaWYgKGRvRGVkdXApIHJldHVybiAnJmRkbD0wJztcbiAgICBlbHNlIHJldHVybiBcIlwiXG4gIH0sXG4gIGVuY29kZUZpbHRlcjogZnVuY3Rpb24oKSB7XG4gICAgdmFyIGRhdGEgPSB7XG4gICAgICAnY29uc2VydmF0aXZlJzogMyxcbiAgICAgICdtb2RlcmF0ZSc6IDAsXG4gICAgICAnbGliZXJhbCc6IDFcbiAgICB9LFxuICAgIHN0YXRlID0gZGF0YVtDbGlxelV0aWxzLmdldFByZWYoJ2FkdWx0Q29udGVudEZpbHRlcicsICdtb2RlcmF0ZScpXTtcblxuICAgIHJldHVybiAnJmFkdWx0PScrc3RhdGU7XG4gIH0sXG4gIGVuY29kZVJlc3VsdENvdW50OiBmdW5jdGlvbihjb3VudCkge1xuICAgIHZhciBkb0RlZHVwID0gQ2xpcXpVdGlscy5nZXRQcmVmKFwibGFuZ3VhZ2VEZWR1cFwiLCBmYWxzZSk7XG4gICAgY291bnQgPSBjb3VudCB8fCA1O1xuICAgIGlmIChkb0RlZHVwKSByZXR1cm4gJyZjb3VudD0nICsgY291bnQ7XG4gICAgZWxzZSByZXR1cm4gXCJcIlxuICB9LFxuICBlbmNvZGVSZXN1bHRUeXBlOiBmdW5jdGlvbih0eXBlKXtcbiAgICBpZih0eXBlLmluZGV4T2YoJ2FjdGlvbicpICE9PSAtMSkgcmV0dXJuIFsnVCddO1xuICAgIGVsc2UgaWYodHlwZS5pbmRleE9mKCdjbGlxei1yZXN1bHRzJykgPT0gMCkgcmV0dXJuIENsaXF6VXRpbHMuZW5jb2RlQ2xpcXpSZXN1bHRUeXBlKHR5cGUpO1xuICAgIGVsc2UgaWYodHlwZS5pbmRleE9mKCdjbGlxei1wYXR0ZXJuJykgPT0gMCkgcmV0dXJuIFsnQyddO1xuICAgIGVsc2UgaWYodHlwZSA9PT0gJ2NsaXF6LWV4dHJhJykgcmV0dXJuIFsnWCddO1xuICAgIGVsc2UgaWYodHlwZSA9PT0gJ2NsaXF6LXNlcmllcycpIHJldHVybiBbJ1MnXTtcblxuICAgIGVsc2UgaWYodHlwZS5pbmRleE9mKCdib29rbWFyaycpID09IDAgfHxcbiAgICAgICAgICAgIHR5cGUuaW5kZXhPZigndGFnJykgPT0gMCkgcmV0dXJuIFsnQiddLmNvbmNhdChDbGlxelV0aWxzLmVuY29kZUNsaXF6UmVzdWx0VHlwZSh0eXBlKSk7XG5cbiAgICBlbHNlIGlmKHR5cGUuaW5kZXhPZignZmF2aWNvbicpID09IDAgfHxcbiAgICAgICAgICAgIHR5cGUuaW5kZXhPZignaGlzdG9yeScpID09IDApIHJldHVybiBbJ0gnXS5jb25jYXQoQ2xpcXpVdGlscy5lbmNvZGVDbGlxelJlc3VsdFR5cGUodHlwZSkpO1xuXG4gICAgLy8gY2xpcXogdHlwZSA9IFwiY2xpcXotY3VzdG9tIHNvdXJjZXMtWFwiXG4gICAgZWxzZSBpZih0eXBlLmluZGV4T2YoJ2NsaXF6LWN1c3RvbScpID09IDApIHJldHVybiB0eXBlLnN1YnN0cigyMSk7XG5cbiAgICByZXR1cm4gdHlwZTsgLy9zaG91bGQgbmV2ZXIgaGFwcGVuXG4gIH0sXG4gIC8vZWcgdHlwZXM6IFsgXCJIXCIsIFwibVwiIF0sIFsgXCJIfGluc3RhbnRcIiwgXCJYfDExXCIgXVxuICBpc1ByaXZhdGVSZXN1bHRUeXBlOiBmdW5jdGlvbih0eXBlKSB7XG4gICAgdmFyIG9ubHlUeXBlID0gdHlwZVswXS5zcGxpdCgnfCcpWzBdO1xuICAgIHJldHVybiAnSEJUQ1MnLmluZGV4T2Yob25seVR5cGUpICE9IC0xICYmIHR5cGUubGVuZ3RoID09IDE7XG4gIH0sXG4gIC8vIGNsaXF6IHR5cGUgPSBcImNsaXF6LXJlc3VsdHMgc291cmNlcy1YWFhYWFwiIG9yIFwiZmF2aWNvbiBzb3VyY2VzLVhYWFhYXCIgaWYgY29tYmluZWQgd2l0aCBoaXN0b3J5XG4gIGVuY29kZUNsaXF6UmVzdWx0VHlwZTogZnVuY3Rpb24odHlwZSl7XG4gICAgdmFyIHBvcyA9IHR5cGUuaW5kZXhPZignc291cmNlcy0nKVxuICAgIGlmKHBvcyAhPSAtMSlcbiAgICAgIHJldHVybiBDbGlxelV0aWxzLmVuY29kZVNvdXJjZXModHlwZS5zdWJzdHIocG9zKzgpKTtcbiAgICBlbHNlXG4gICAgICByZXR1cm4gW107XG4gIH0sXG4gIC8vIHJhbmRvbSBJRCBnZW5lcmF0ZWQgYXQgZWFjaCB1cmxiYXIgZm9jdXNcbiAgX3NlYXJjaFNlc3Npb246ICcnLFxuICAvLyBudW1iZXIgb2Ygc2VxdWVuY2VzIGluIGVhY2ggc2Vzc2lvblxuICBfc2Vzc2lvblNlcTogMCxcbiAgX3F1ZXJ5TGFzdExlbmd0aDogbnVsbCxcbiAgX3F1ZXJ5TGFzdERyYXc6IG51bGwsXG4gIC8vIG51bWJlciBvZiBxdWVyaWVzIGluIHNlYXJjaCBzZXNzaW9uXG4gIF9xdWVyeUNvdW50OiBudWxsLFxuICBzZXRTZWFyY2hTZXNzaW9uOiBmdW5jdGlvbihyYW5kKXtcbiAgICBDbGlxelV0aWxzLl9zZWFyY2hTZXNzaW9uID0gcmFuZDtcbiAgICBDbGlxelV0aWxzLl9zZXNzaW9uU2VxID0gMDtcbiAgICBDbGlxelV0aWxzLl9xdWVyeUNvdW50ID0gMDtcbiAgICBDbGlxelV0aWxzLl9xdWVyeUxhc3RMZW5ndGggPSAwO1xuICAgIENsaXF6VXRpbHMuX3F1ZXJ5TGFzdERyYXcgPSAwO1xuICB9LFxuICBlbmNvZGVTZXNzaW9uUGFyYW1zOiBmdW5jdGlvbigpe1xuICAgIGlmKENsaXF6VXRpbHMuX3NlYXJjaFNlc3Npb24ubGVuZ3RoKXtcbiAgICAgIHJldHVybiAnJnM9JyArIGVuY29kZVVSSUNvbXBvbmVudChDbGlxelV0aWxzLl9zZWFyY2hTZXNzaW9uKSArXG4gICAgICAgICAgICAgJyZuPScgKyBDbGlxelV0aWxzLl9zZXNzaW9uU2VxICtcbiAgICAgICAgICAgICAnJnFjPScgKyBDbGlxelV0aWxzLl9xdWVyeUNvdW50XG4gICAgfSBlbHNlIHJldHVybiAnJztcbiAgfSxcblxuICBlbmNvZGVMb2NhdGlvbjogZnVuY3Rpb24oc3BlY2lmeVNvdXJjZSwgbGF0LCBsbmcpIHtcbiAgICB2YXIgcXMgPSBbXG4gICAgICcmbG9jX3ByZWY9JyxcbiAgICAgQ2xpcXpVdGlscy5nZXRQcmVmKCdzaGFyZV9sb2NhdGlvbicsJ2FzaycpXG4gICAgXS5qb2luKCcnKVxuXG4gICAgaWYgKENMSVFaRW52aXJvbm1lbnQuVVNFUl9MQVQgJiYgQ0xJUVpFbnZpcm9ubWVudC5VU0VSX0xORyB8fCBsYXQgJiYgbG5nKSB7XG4gICAgICBxcyArPSBbXG4gICAgICAgICcmbG9jPScsXG4gICAgICAgIGxhdCB8fCBDTElRWkVudmlyb25tZW50LlVTRVJfTEFULFxuICAgICAgICAnLCcsXG4gICAgICAgIGxuZyB8fCBDTElRWkVudmlyb25tZW50LlVTRVJfTE5HLFxuICAgICAgICAoc3BlY2lmeVNvdXJjZSA/ICcsVScgOiAnJylcbiAgICAgIF0uam9pbignJyk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHFzO1xuICB9LFxuICBlbmNvZGVTb3VyY2VzOiBmdW5jdGlvbihzb3VyY2VzKXtcbiAgICByZXR1cm4gc291cmNlcy50b0xvd2VyQ2FzZSgpLnNwbGl0KCcsICcpLm1hcChcbiAgICAgIGZ1bmN0aW9uKHMpe1xuICAgICAgICBpZihzLmluZGV4T2YoJ2NhY2hlJykgPT0gMCkgLy8gdG8gY2F0Y2ggJ2NhY2hlLSonIGZvciBzcGVjaWZpYyBjb3VudHJpZXNcbiAgICAgICAgICByZXR1cm4gJ2QnXG4gICAgICAgIGVsc2VcbiAgICAgICAgICByZXR1cm4gVkVSVElDQUxfRU5DT0RJTkdTW3NdIHx8IHM7XG4gICAgICB9KTtcbiAgfSxcbiAgaXNQcml2YXRlOiBDTElRWkVudmlyb25tZW50LmlzUHJpdmF0ZSxcbiAgdGVsZW1ldHJ5OiBDTElRWkVudmlyb25tZW50LnRlbGVtZXRyeSxcbiAgcmVzdWx0VGVsZW1ldHJ5OiBmdW5jdGlvbihxdWVyeSwgcXVlcnlBdXRvY29tcGxldGVkLCByZXN1bHRJbmRleCwgcmVzdWx0VXJsLCByZXN1bHRPcmRlciwgZXh0cmEpIHtcbiAgICBDbGlxelV0aWxzLnNldFJlc3VsdE9yZGVyKHJlc3VsdE9yZGVyKTtcbiAgICB2YXIgcGFyYW1zID0gZW5jb2RlVVJJQ29tcG9uZW50KHF1ZXJ5KSArXG4gICAgICAocXVlcnlBdXRvY29tcGxldGVkID8gJyZhPScgKyBlbmNvZGVVUklDb21wb25lbnQocXVlcnlBdXRvY29tcGxldGVkKSA6ICcnKSArXG4gICAgICAnJmk9JyArIHJlc3VsdEluZGV4ICtcbiAgICAgIChyZXN1bHRVcmwgPyAnJnU9JyArIGVuY29kZVVSSUNvbXBvbmVudChyZXN1bHRVcmwpIDogJycpICtcbiAgICAgIENsaXF6VXRpbHMuZW5jb2RlU2Vzc2lvblBhcmFtcygpICtcbiAgICAgIENsaXF6VXRpbHMuZW5jb2RlUmVzdWx0T3JkZXIoKSArXG4gICAgICAoZXh0cmEgPyAnJmU9JyArIGV4dHJhIDogJycpXG4gICAgQ2xpcXpVdGlscy5odHRwR2V0KENsaXF6VXRpbHMuUkVTVUxUU19QUk9WSURFUl9MT0cgKyBwYXJhbXMpO1xuICAgIENsaXF6VXRpbHMuc2V0UmVzdWx0T3JkZXIoJycpO1xuICAgIENsaXF6VXRpbHMubG9nKHBhcmFtcywgJ1V0aWxzLnJlc3VsdFRlbGVtZXRyeScpO1xuICB9LFxuICBfcmVzdWx0T3JkZXI6ICcnLFxuICBzZXRSZXN1bHRPcmRlcjogZnVuY3Rpb24ocmVzdWx0T3JkZXIpIHtcbiAgICBDbGlxelV0aWxzLl9yZXN1bHRPcmRlciA9IHJlc3VsdE9yZGVyO1xuICB9LFxuICBlbmNvZGVSZXN1bHRPcmRlcjogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIENsaXF6VXRpbHMuX3Jlc3VsdE9yZGVyICYmIENsaXF6VXRpbHMuX3Jlc3VsdE9yZGVyLmxlbmd0aCA/ICcmbz0nICsgZW5jb2RlVVJJQ29tcG9uZW50KEpTT04uc3RyaW5naWZ5KENsaXF6VXRpbHMuX3Jlc3VsdE9yZGVyKSkgOiAnJztcbiAgfSxcbiAgc2V0SW50ZXJ2YWw6IENMSVFaRW52aXJvbm1lbnQuc2V0SW50ZXJ2YWwsXG4gIHNldFRpbWVvdXQ6IENMSVFaRW52aXJvbm1lbnQuc2V0VGltZW91dCxcbiAgY2xlYXJUaW1lb3V0OiBDTElRWkVudmlyb25tZW50LmNsZWFyVGltZW91dCxcbiAgY2xlYXJJbnRlcnZhbDogQ0xJUVpFbnZpcm9ubWVudC5jbGVhclRpbWVvdXQsXG4gIFByb21pc2U6IENMSVFaRW52aXJvbm1lbnQuUHJvbWlzZSxcbiAgbG9jYWxlOiB7fSxcbiAgY3VyckxvY2FsZTogbnVsbCxcbiAgbG9hZExvY2FsZTogZnVuY3Rpb24gKGxhbmdfbG9jYWxlKSB7XG4gICAgdmFyIGxvY2FsZXMgPSB7XG4gICAgICBcImVuLVVTXCI6IFwiZW5cIlxuICAgIH07XG4gICAgbGFuZ19sb2NhbGUgPSBsb2NhbGVzW2xhbmdfbG9jYWxlXSB8fCBsYW5nX2xvY2FsZTtcblxuICAgIGlmICghQ2xpcXpVdGlscy5sb2NhbGUuaGFzT3duUHJvcGVydHkobGFuZ19sb2NhbGUpXG4gICAgICAmJiAhQ2xpcXpVdGlscy5sb2NhbGUuaGFzT3duUHJvcGVydHkoJ2RlZmF1bHQnKSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgQ2xpcXpVdGlscy5nZXRMb2NhbGVGaWxlKGVuY29kZVVSSUNvbXBvbmVudChsYW5nX2xvY2FsZSksIGxhbmdfbG9jYWxlKTtcbiAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICB2YXIgbG9jID0gQ2xpcXpVdGlscy5nZXRMYW5ndWFnZUZyb21Mb2NhbGUobGFuZ19sb2NhbGUpO1xuICAgICAgICB0cnkge1xuICAgICAgICAgIENsaXF6VXRpbHMuZ2V0TG9jYWxlRmlsZShsb2MsIGxhbmdfbG9jYWxlKTtcbiAgICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIENsaXF6VXRpbHMuZ2V0TG9jYWxlRmlsZSgnZGUnLCAnZGVmYXVsdCcpO1xuICAgICAgICAgIH0gY2F0Y2goZSkge1xuXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBnZXRMb2NhbGVGaWxlOiBmdW5jdGlvbiAobG9jYWxlX3BhdGgsIGxvY2FsZV9rZXkpIHtcbiAgICBmdW5jdGlvbiBjYWxsYmFjayhyZXEpIHtcbiAgICAgICAgaWYgKENsaXF6VXRpbHMpe1xuICAgICAgICAgIGlmIChsb2NhbGVfa2V5ICE9PSAnZGVmYXVsdCcpIHtcbiAgICAgICAgICAgIENsaXF6VXRpbHMuY3VyckxvY2FsZSA9IGxvY2FsZV9rZXk7XG4gICAgICAgICAgfVxuICAgICAgICAgIENsaXF6VXRpbHMubG9jYWxlW2xvY2FsZV9rZXldID0gSlNPTi5wYXJzZShyZXEucmVzcG9uc2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZ1bmN0aW9uIG9uZXJyb3IoZXJyKSB7XG4gICAgfVxuICAgIHZhciB1cmwgPSBDTElRWkVudmlyb25tZW50LkxPQ0FMRV9QQVRIICsgbG9jYWxlX3BhdGggKyAnL2NsaXF6Lmpzb24nO1xuICAgIHZhciByZXNwb25zZSA9IENsaXF6VXRpbHMuaHR0cEdldCh1cmwsIGNhbGxiYWNrLCBvbmVycm9yLCAzMDAwLCBudWxsLCB0cnVlKTtcbiAgICBpZiAocmVzcG9uc2UucmVhZHlTdGF0ZSAhPT0gMikge1xuICAgICAgdGhyb3cgXCJFcnJvclwiO1xuICAgIH1cbiAgICByZXR1cm4gcmVzcG9uc2U7XG4gIH0sXG4gIGdldExhbmd1YWdlRnJvbUxvY2FsZTogZnVuY3Rpb24obG9jYWxlKXtcbiAgICByZXR1cm4gbG9jYWxlLm1hdGNoKC8oW2Etel0rKSg/OlstX10oW0EtWl0rKSk/LylbMV07XG4gIH0sXG4gIGdldExhbmd1YWdlOiBmdW5jdGlvbih3aW4pe1xuICAgIHJldHVybiBDbGlxelV0aWxzLkxBTkdTW0NsaXF6VXRpbHMuZ2V0TGFuZ3VhZ2VGcm9tTG9jYWxlKHdpbi5uYXZpZ2F0b3IubGFuZ3VhZ2UpXSB8fCAnZW4nO1xuICB9LFxuICBnZXRMb2NhbGl6ZWRTdHJpbmc6IGZ1bmN0aW9uKGtleSwgc3Vic3RpdHV0aW9ucyl7XG4gICAgaWYoIWtleSkgcmV0dXJuICcnO1xuXG4gICAgdmFyIHN0ciA9IGtleSxcbiAgICAgICAgbG9jYWxNZXNzYWdlcztcblxuICAgIGlmIChDbGlxelV0aWxzLmN1cnJMb2NhbGUgIT0gbnVsbCAmJiBDbGlxelV0aWxzLmxvY2FsZVtDbGlxelV0aWxzLmN1cnJMb2NhbGVdXG4gICAgICAgICAgICAmJiBDbGlxelV0aWxzLmxvY2FsZVtDbGlxelV0aWxzLmN1cnJMb2NhbGVdW2tleV0pIHtcbiAgICAgICAgc3RyID0gQ2xpcXpVdGlscy5sb2NhbGVbQ2xpcXpVdGlscy5jdXJyTG9jYWxlXVtrZXldLm1lc3NhZ2U7XG4gICAgICAgIGxvY2FsTWVzc2FnZXMgPSBDbGlxelV0aWxzLmxvY2FsZVtDbGlxelV0aWxzLmN1cnJMb2NhbGVdO1xuICAgIH0gZWxzZSBpZiAoQ2xpcXpVdGlscy5sb2NhbGUuZGVmYXVsdCAmJiBDbGlxelV0aWxzLmxvY2FsZS5kZWZhdWx0W2tleV0pIHtcbiAgICAgICAgc3RyID0gQ2xpcXpVdGlscy5sb2NhbGUuZGVmYXVsdFtrZXldLm1lc3NhZ2U7XG4gICAgICAgIGxvY2FsTWVzc2FnZXMgPSBDbGlxelV0aWxzLmxvY2FsZS5kZWZhdWx0O1xuICAgIH1cblxuICAgIGlmICghc3Vic3RpdHV0aW9ucykge1xuICAgICAgc3Vic3RpdHV0aW9ucyA9IFtdO1xuICAgIH1cbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoc3Vic3RpdHV0aW9ucykpIHtcbiAgICAgIHN1YnN0aXR1dGlvbnMgPSBbc3Vic3RpdHV0aW9uc107XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcmVwbGFjZXIobWF0Y2hlZCwgaW5kZXgsIGRvbGxhclNpZ25zKSB7XG4gICAgICBpZiAoaW5kZXgpIHtcbiAgICAgICAgaW5kZXggPSBwYXJzZUludChpbmRleCwgMTApIC0gMTtcbiAgICAgICAgcmV0dXJuIGluZGV4IGluIHN1YnN0aXR1dGlvbnMgPyBzdWJzdGl0dXRpb25zW2luZGV4XSA6IFwiXCI7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAvLyBGb3IgYW55IHNlcmllcyBvZiBjb250aWd1b3VzIGAkYHMsIHRoZSBmaXJzdCBpcyBkcm9wcGVkLCBhbmRcbiAgICAgICAgLy8gdGhlIHJlc3QgcmVtYWluIGluIHRoZSBvdXRwdXQgc3RyaW5nLlxuICAgICAgICByZXR1cm4gZG9sbGFyU2lnbnM7XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBzdHIucmVwbGFjZSgvXFwkKD86KFsxLTldXFxkKil8KFxcJCspKS9nLCByZXBsYWNlcik7XG4gIH0sXG4gIC8vIGdldHMgYWxsIHRoZSBlbGVtZW50cyB3aXRoIHRoZSBjbGFzcyAnY2xpcXotbG9jYWxlJyBhbmQgYWRkc1xuICAvLyB0aGUgbG9jYWxpemVkIHN0cmluZyAtIGtleSBhdHRyaWJ1dGUgLSBhcyBjb250ZW50XG4gIGxvY2FsaXplRG9jOiBmdW5jdGlvbihkb2Mpe1xuICAgIHZhciBsb2NhbGUgPSBkb2MuZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSgnY2xpcXotbG9jYWxlJyk7XG4gICAgZm9yKHZhciBpID0gMDsgaSA8IGxvY2FsZS5sZW5ndGg7IGkrKyl7XG4gICAgICAgIHZhciBlbCA9IGxvY2FsZVtpXTtcbiAgICAgICAgZWwudGV4dENvbnRlbnQgPSBDbGlxelV0aWxzLmdldExvY2FsaXplZFN0cmluZyhlbC5nZXRBdHRyaWJ1dGUoJ2tleScpKTtcbiAgICB9XG4gIH0sXG4gIGV4dGVuc2lvblJlc3RhcnQ6IGZ1bmN0aW9uKGNoYW5nZXMpe1xuICAgIHZhciBlbnVtZXJhdG9yID0gU2VydmljZXMud20uZ2V0RW51bWVyYXRvcignbmF2aWdhdG9yOmJyb3dzZXInKTtcbiAgICB3aGlsZSAoZW51bWVyYXRvci5oYXNNb3JlRWxlbWVudHMoKSkge1xuICAgICAgdmFyIHdpbiA9IGVudW1lcmF0b3IuZ2V0TmV4dCgpO1xuICAgICAgaWYod2luLkNMSVFaICYmIHdpbi5DTElRWi5Db3JlKXtcbiAgICAgICAgd2luLkNMSVFaLkNvcmUudW5sb2FkKHRydWUpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGNoYW5nZXMgJiYgY2hhbmdlcygpO1xuXG4gICAgdmFyIGNvcmVQcm9taXNlcyA9IFtdO1xuICAgIGVudW1lcmF0b3IgPSBTZXJ2aWNlcy53bS5nZXRFbnVtZXJhdG9yKCduYXZpZ2F0b3I6YnJvd3NlcicpO1xuICAgIHdoaWxlIChlbnVtZXJhdG9yLmhhc01vcmVFbGVtZW50cygpKSB7XG4gICAgICB2YXIgd2luID0gZW51bWVyYXRvci5nZXROZXh0KCk7XG4gICAgICBpZih3aW4uQ0xJUVogJiYgd2luLkNMSVFaLkNvcmUpe1xuICAgICAgICBjb3JlUHJvbWlzZXMucHVzaCh3aW4uQ0xJUVouQ29yZS5pbml0KCkpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBQcm9taXNlLmFsbChjb3JlUHJvbWlzZXMpO1xuICB9LFxuICBpc1dpbmRvd3M6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIENMSVFaRW52aXJvbm1lbnQuT1MuaW5kZXhPZihcIndpblwiKSA9PT0gMDtcbiAgfSxcbiAgaXNNYWM6IGZ1bmN0aW9uKCl7XG4gICAgcmV0dXJuIENMSVFaRW52aXJvbm1lbnQuT1MuaW5kZXhPZihcImRhcndpblwiKSA9PT0gMDtcbiAgfSxcbiAgaXNMaW51eDogZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIENMSVFaRW52aXJvbm1lbnQuT1MuaW5kZXhPZihcImxpbnV4XCIpID09PSAwO1xuICB9LFxuICBnZXRXaW5kb3c6IENMSVFaRW52aXJvbm1lbnQuZ2V0V2luZG93LFxuICBnZXRXaW5kb3dJRDogQ0xJUVpFbnZpcm9ubWVudC5nZXRXaW5kb3dJRCxcbiAgaGFzQ2xhc3M6IGZ1bmN0aW9uKGVsZW1lbnQsIGNsYXNzTmFtZSkge1xuICAgIHJldHVybiAoJyAnICsgZWxlbWVudC5jbGFzc05hbWUgKyAnICcpLmluZGV4T2YoJyAnICsgY2xhc3NOYW1lICsgJyAnKSA+IC0xO1xuICB9LFxuICAvKipcbiAgICogQmluZCBmdW5jdGlvbnMgY29udGV4dHMgdG8gYSBzcGVjaWZpZWQgb2JqZWN0LlxuICAgKiBAcGFyYW0ge09iamVjdH0gZnJvbSAtIEFuIG9iamVjdCwgd2hvc2UgZnVuY3Rpb24gcHJvcGVydGllcyB3aWxsIGJlIHByb2Nlc3NlZC5cbiAgICogQHBhcmFtIHtPYmplY3R9IHRvIC0gQW4gb2JqZWN0LCB3aGljaCB3aWxsIGJlIHRoZSBjb250ZXh0ICh0aGlzKSBvZiBwcm9jZXNzZWQgZnVuY3Rpb25zLlxuICAgKi9cbiAgYmluZE9iamVjdEZ1bmN0aW9uczogZnVuY3Rpb24oZnJvbSwgdG8pIHtcbiAgICBmb3IgKHZhciBmdW5jTmFtZSBpbiBmcm9tKSB7XG4gICAgICB2YXIgZnVuYyA9IGZyb21bZnVuY05hbWVdO1xuICAgICAgaWYgKCFmcm9tLmhhc093blByb3BlcnR5KGZ1bmNOYW1lKSlcbiAgICAgICAgY29udGludWU7XG4gICAgICAvLyBDYW4ndCBjb21wYXJlIHdpdGggcHJvdG90eXBlIG9mIG9iamVjdCBmcm9tIGEgZGlmZmVyZW50IG1vZHVsZS5cbiAgICAgIGlmICh0eXBlb2YgZnVuYyAhPSBcImZ1bmN0aW9uXCIpXG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgZnJvbVtmdW5jTmFtZV0gPSBmdW5jLmJpbmQodG8pO1xuICAgIH1cbiAgfSxcbiAgdHJ5RGVjb2RlVVJJQ29tcG9uZW50OiBmdW5jdGlvbihzKSB7XG4gICAgLy8gYXZvaWRlIGVycm9yIGZyb20gZGVjb2RlVVJJQ29tcG9uZW50KCclMicpXG4gICAgdHJ5IHtcbiAgICAgIHJldHVybiBkZWNvZGVVUklDb21wb25lbnQocyk7XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICByZXR1cm4gcztcbiAgICB9XG4gIH0sXG4gIHRyeUVuY29kZVVSSUNvbXBvbmVudDogZnVuY3Rpb24ocykge1xuICAgIHRyeSB7XG4gICAgICByZXR1cm4gZW5jb2RlVVJJQ29tcG9uZW50KHMpO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgcmV0dXJuIHM7XG4gICAgfVxuICB9LFxuICBwYXJzZVF1ZXJ5U3RyaW5nOiBmdW5jdGlvbihxc3RyKSB7XG4gICAgdmFyIHF1ZXJ5ID0ge307XG4gICAgdmFyIGEgPSAocXN0ciB8fCAnJykuc3BsaXQoJyYnKTtcbiAgICBmb3IgKHZhciBpIGluIGEpXG4gICAge1xuICAgICAgdmFyIGIgPSBhW2ldLnNwbGl0KCc9Jyk7XG4gICAgICBxdWVyeVtDbGlxelV0aWxzLnRyeURlY29kZVVSSUNvbXBvbmVudChiWzBdKV0gPSBDbGlxelV0aWxzLnRyeURlY29kZVVSSUNvbXBvbmVudChiWzFdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcXVlcnk7XG4gIH0sXG4gIHJvdW5kVG9EZWNpbWFsOiBmdW5jdGlvbihudW1iZXIsIGRpZ2l0cykge1xuICAgIHZhciBtdWx0aXBsaWVyID0gTWF0aC5wb3coMTAsIGRpZ2l0cyk7XG4gICAgcmV0dXJuIE1hdGgucm91bmQobnVtYmVyICogbXVsdGlwbGllcikgLyBtdWx0aXBsaWVyO1xuICB9LFxuICBnZXRBZHVsdEZpbHRlclN0YXRlOiBmdW5jdGlvbigpe1xuICAgIHZhciBkYXRhID0ge1xuICAgICAgJ2NvbnNlcnZhdGl2ZSc6IHtcbiAgICAgICAgICAgICAgbmFtZTogQ2xpcXpVdGlscy5nZXRMb2NhbGl6ZWRTdHJpbmcoJ2Fsd2F5cycpLFxuICAgICAgICAgICAgICBzZWxlY3RlZDogZmFsc2VcbiAgICAgIH0sXG4gICAgICAnbW9kZXJhdGUnOiB7XG4gICAgICAgICAgICAgIG5hbWU6IENsaXF6VXRpbHMuZ2V0TG9jYWxpemVkU3RyaW5nKCdhbHdheXNfYXNrJyksXG4gICAgICAgICAgICAgIHNlbGVjdGVkOiBmYWxzZVxuICAgICAgfSxcbiAgICAgICdsaWJlcmFsJzoge1xuICAgICAgICAgIG5hbWU6IENsaXF6VXRpbHMuZ2V0TG9jYWxpemVkU3RyaW5nKCduZXZlcicpLFxuICAgICAgICAgIHNlbGVjdGVkOiBmYWxzZVxuICAgICAgfVxuICAgIH07XG5cbiAgICBkYXRhW0NsaXF6VXRpbHMuZ2V0UHJlZignYWR1bHRDb250ZW50RmlsdGVyJywgJ21vZGVyYXRlJyldLnNlbGVjdGVkID0gdHJ1ZTtcblxuICAgIHJldHVybiBkYXRhO1xuICB9LFxuICBnZXROb1Jlc3VsdHM6IENMSVFaRW52aXJvbm1lbnQuZ2V0Tm9SZXN1bHRzLFxuICBkaXNhYmxlQ2xpcXpSZXN1bHRzOiBDTElRWkVudmlyb25tZW50LmRpc2FibGVDbGlxelJlc3VsdHMsXG4gIGVuYWJsZUNsaXF6UmVzdWx0czogQ0xJUVpFbnZpcm9ubWVudC5lbmFibGVDbGlxelJlc3VsdHMsXG4gIGdldFBhcmFtZXRlckJ5TmFtZTogZnVuY3Rpb24obmFtZSwgbG9jYXRpb24pIHtcbiAgICBuYW1lID0gbmFtZS5yZXBsYWNlKC9bXFxbXS8sIFwiXFxcXFtcIikucmVwbGFjZSgvW1xcXV0vLCBcIlxcXFxdXCIpO1xuICAgIHZhciByZWdleCA9IG5ldyBSZWdFeHAoXCJbXFxcXD8mXVwiICsgbmFtZSArIFwiPShbXiYjXSopXCIpLFxuICAgIHJlc3VsdHMgPSByZWdleC5leGVjKGxvY2F0aW9uLnNlYXJjaCk7XG4gICAgcmV0dXJuIHJlc3VsdHMgPT09IG51bGwgPyBcIlwiIDogZGVjb2RlVVJJQ29tcG9uZW50KHJlc3VsdHNbMV0ucmVwbGFjZSgvXFwrL2csIFwiIFwiKSk7XG4gIH0sXG4gIGFkZEV2ZW50TGlzdGVuZXJUb0VsZW1lbnRzOiBDTElRWkVudmlyb25tZW50LmFkZEV2ZW50TGlzdGVuZXJUb0VsZW1lbnRzLFxuICBzZWFyY2g6IENMSVFaRW52aXJvbm1lbnQuc2VhcmNoLFxuICBkaXN0YW5jZTogQ0xJUVpFbnZpcm9ubWVudC5kaXN0YW5jZSxcbiAgZ2V0RGVmYXVsdFNlYXJjaEVuZ2luZTogQ0xJUVpFbnZpcm9ubWVudC5nZXREZWZhdWx0U2VhcmNoRW5naW5lLFxuICBjb3B5UmVzdWx0OiBDTElRWkVudmlyb25tZW50LmNvcHlSZXN1bHQsXG4gIG9wZW5Qb3B1cDogQ0xJUVpFbnZpcm9ubWVudC5vcGVuUG9wdXAsXG4gIGlzT25Qcml2YXRlVGFiOiBDTElRWkVudmlyb25tZW50LmlzT25Qcml2YXRlVGFiLFxuICBnZXRDbGlxelByZWZzOiBDTElRWkVudmlyb25tZW50LmdldENsaXF6UHJlZnMsXG4gIGlzRGVmYXVsdEJyb3dzZXI6IENMSVFaRW52aXJvbm1lbnQuaXNEZWZhdWx0QnJvd3NlcixcbiAgaW5pdEhvbWVwYWdlOiBDTElRWkVudmlyb25tZW50LmluaXRIb21lcGFnZSxcbiAgc2V0RGVmYXVsdFNlYXJjaEVuZ2luZTogQ0xJUVpFbnZpcm9ubWVudC5zZXREZWZhdWx0U2VhcmNoRW5naW5lLFxuICBpc1Vua25vd25UZW1wbGF0ZTogQ0xJUVpFbnZpcm9ubWVudC5pc1Vua25vd25UZW1wbGF0ZSxcbiAgaGlzdG9yeVNlYXJjaDogQ0xJUVpFbnZpcm9ubWVudC5oaXN0b3J5U2VhcmNoLFxuICBnZXRFbmdpbmVCeU5hbWU6IENMSVFaRW52aXJvbm1lbnQuZ2V0RW5naW5lQnlOYW1lLFxuICBhZGRFbmdpbmVXaXRoRGV0YWlsczogQ0xJUVpFbnZpcm9ubWVudC5hZGRFbmdpbmVXaXRoRGV0YWlscyxcbiAgZ2V0RW5naW5lQnlBbGlhczogQ0xJUVpFbnZpcm9ubWVudC5nZXRFbmdpbmVCeUFsaWFzLFxuICBnZXRTZWFyY2hFbmdpbmVzOiBDTElRWkVudmlyb25tZW50LmdldFNlYXJjaEVuZ2luZXMsXG4gIHVwZGF0ZUFsaWFzOiBDTElRWkVudmlyb25tZW50LnVwZGF0ZUFsaWFzLFxuICBvcGVuTGluazogQ0xJUVpFbnZpcm9ubWVudC5vcGVuTGluayxcbiAgcHJvbWlzZUh0dHBIYW5kbGVyOiBDTElRWkVudmlyb25tZW50LnByb21pc2VIdHRwSGFuZGxlcixcbiAgcmVnaXN0ZXJSZXN1bHRQcm92aWRlcjogZnVuY3Rpb24gKG8pIHtcbiAgICBDTElRWkVudmlyb25tZW50LkNsaXF6UmVzdWx0UHJvdmlkZXJzID0gby5SZXN1bHRQcm92aWRlcnM7XG4gICAgQ0xJUVpFbnZpcm9ubWVudC5SZXN1bHQgPSBvLlJlc3VsdDtcbiAgfSxcbiAgb25SZW5kZXJDb21wbGV0ZTogZnVuY3Rpb24ocXVlcnksIGJveCl7XG4gICAgaWYgKCFDTElRWkVudmlyb25tZW50Lm9uUmVuZGVyQ29tcGxldGUpXG4gICAgICByZXR1cm47XG5cbiAgICB2YXIgbGlua05vZGVzID0gYm94LnF1ZXJ5U2VsZWN0b3JBbGwoXCJbdXJsXTpub3QoLmNxei1yZXN1bHQtYm94KTpub3QoLmVudGl0eS1zdG9yeSk6bm90KFtoaWRkZW5dKSwgW2hyZWZdOm5vdChbaGlkZGVuXSlcIik7XG4gICAgdmFyIHVybHMgPSBbXS5tYXAuY2FsbChsaW5rTm9kZXMsIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgIHJldHVybiBub2RlLmdldEF0dHJpYnV0ZShcInVybFwiKSB8fCBub2RlLmdldEF0dHJpYnV0ZShcImhyZWZcIik7XG4gICAgfSk7XG5cbiAgICBDTElRWkVudmlyb25tZW50Lm9uUmVuZGVyQ29tcGxldGUocXVlcnksIHVybHMpO1xuICB9XG59O1xuXG5leHBvcnQgZGVmYXVsdCBDbGlxelV0aWxzO1xuIl19