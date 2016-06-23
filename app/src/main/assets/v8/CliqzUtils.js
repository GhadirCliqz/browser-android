
var CliqzUtils = {
  // logDebug provided by Java callback
  log: logDebug,
  prefs: {},
  _PREFS_FILE: 'cliqz.prefs.json',
  getPref: function(pref, defaultValue) {
    return CliqzUtils.prefs[pref] || defaultValue;
  },
  setPref: function(pref, value) {
    CliqzUtils.prefs[pref] = value;
    CliqzUtils._persistPrefs();
  },
  hasPref: function(pref) {
    return pref in CliqzUtils.prefs;
  },
  _persistPrefs: function() {
    writeFile(CliqzUtils._PREFS_FILE, JSON.stringify(CliqzUtils.prefs));
  },
  bindObjectFunctions: function() {},
  System: {
    baseURL: "file:///v8/modules/"
  },
  setTimeout: setTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  loadResource: function(url, callback, onerror) {
    try {
        return CliqzUtils.httpGet(url, callback, onerror, 3000);
    } catch (e) {
      CliqzUtils.log("Could not load resource " + url + " from the xpi",
                     "CliqzUtils.httpHandler");
      onerror && onerror();
    }
  },
  httpGet: function(url, callback, onerror, timeout, _, sync){
    return CliqzUtils.httpHandler('GET', url, callback, onerror, timeout, null);
  },
  httpPost: function(url, callback, data, onerror, timeout) {
    return CliqzUtils.httpHandler('POST', url, callback, onerror, timeout, data);
  },
  httpHandler: function(method, url, callback, onerror, timeout, data) {
    var wrappedCallback = (cb) => {
      return (resp) => {
        cb && cb(resp);
      }
    };
    httpHandler(method, url, wrappedCallback(callback), wrappedCallback(onerror), timeout || method === 'POST' ? 10000 : 1000, data || null);
  },
  promiseHttpHandler: function(method, url, data, timeout, compressedPost) {
    //lazy load gzip module
    if(compressedPost && !CLIQZEnvironment.gzip){
        CliqzUtils.importModule('core/gzip').then( function(gzip) {
           CLIQZEnvironment.gzip = gzip
        });
    }

    return new Promise( function(resolve, reject) {
        // gzip.compress may be false if there is no implementation for this platform
        // or maybe it is not loaded yet
        if ( CLIQZEnvironment.gzip && CLIQZEnvironment.gzip.compress && method === 'POST' && compressedPost) {
            var dataLength = data.length;
            data = CLIQZEnvironment.gzip.compress(data);
            CliqzUtils.log("Compressed request to "+ url +", bytes saved = "+ (dataLength - data.length) + " (" + (100*(dataLength - data.length)/ dataLength).toFixed(1) +"%)", "CLIQZEnvironment.httpHandler");
            CLIQZEnvironment.httpHandler(method, url, resolve, reject, timeout, data, undefined, 'gzip');
        } else {
            CLIQZEnvironment.httpHandler(method, url, resolve, reject, timeout, data);
        }
    });
    },
}

// load prefs from file
readFile(CliqzUtils._PREFS_FILE, (data) => {
  CliqzUtils.prefs = JSON.parse(data || '{}');
});
