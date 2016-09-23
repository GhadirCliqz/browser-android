System.register('adblocker/background', ['core/cliqz', 'core/base/background', 'adblocker/adblocker'], function (_export) {
  'use strict';

  var utils, background, CliqzADB, ADB_PREF_VALUES, ADB_PREF, ADB_PREF_OPTIMIZED, adbEnabled;

  function isAdbActive(url) {
    return adbEnabled() && !CliqzADB.adBlocker.isDomainInBlacklist(url) && !CliqzADB.adBlocker.isUrlInBlacklist(url);
  }

  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }, function (_coreBaseBackground) {
      background = _coreBaseBackground['default'];
    }, function (_adblockerAdblocker) {
      CliqzADB = _adblockerAdblocker['default'];
      ADB_PREF_VALUES = _adblockerAdblocker.ADB_PREF_VALUES;
      ADB_PREF = _adblockerAdblocker.ADB_PREF;
      ADB_PREF_OPTIMIZED = _adblockerAdblocker.ADB_PREF_OPTIMIZED;
      adbEnabled = _adblockerAdblocker.adbEnabled;
    }],
    execute: function () {
      _export('default', background({
        enabled: function enabled() {
          return true;
        },

        init: function init() {
          if (CliqzADB.getBrowserMajorVersion() < CliqzADB.MIN_BROWSER_VERSION) {
            return;
          }
          CliqzADB.init();
        },

        unload: function unload() {
          if (CliqzADB.getBrowserMajorVersion() < CliqzADB.MIN_BROWSER_VERSION) {
            return;
          }
          CliqzADB.unload();
        },

        events: {
          "control-center:adb-optimized": function controlCenterAdbOptimized() {
            utils.setPref(ADB_PREF_OPTIMIZED, !utils.getPref(ADB_PREF_OPTIMIZED, false));
          },
          "control-center:adb-activator": function controlCenterAdbActivator(data) {
            var isUrlInBlacklist = CliqzADB.adBlocker.isUrlInBlacklist(data.url),
                isDomainInBlacklist = CliqzADB.adBlocker.isDomainInBlacklist(data.url);

            //we first need to togle it off to be able to turn it on for the right thing - site or domain
            if (isUrlInBlacklist) {
              CliqzADB.adBlocker.toggleUrl(data.url);
            }

            if (isDomainInBlacklist) {
              CliqzADB.adBlocker.toggleUrl(data.url, true);
            }

            if (data.status == 'active') {
              utils.setPref(ADB_PREF, ADB_PREF_VALUES.Enabled);
            } else if (data.status == 'off') {
              if (data.option == 'all-sites') {
                utils.setPref(ADB_PREF, ADB_PREF_VALUES.Disabled);
              } else {
                utils.setPref(ADB_PREF, ADB_PREF_VALUES.Enabled);
                CliqzADB.adBlocker.toggleUrl(data.url, data.option == 'domain' ? true : false);
              }
            }
          }
        },

        actions: {
          // handles messages coming from process script
          nodes: function nodes(url, _nodes) {
            if (!isAdbActive(url)) {
              return {
                rules: [],
                active: false
              };
            }
            var candidates = CliqzADB.adBlocker.engine.getCosmeticsFilters(url, _nodes);
            return {
              rules: candidates.map(function (rule) {
                return rule.selector;
              }),
              active: true
            };
          },

          url: function url(_url) {
            if (!isAdbActive(_url)) {
              return {
                scripts: [],
                sytles: [],
                type: 'domain-rules',
                active: false
              };
            }

            var candidates = CliqzADB.adBlocker.engine.getDomainFilters(_url);
            return {
              styles: candidates.filter(function (rule) {
                return !rule.scriptInject && !rule.scriptBlock;
              }).map(function (rule) {
                return rule.selector;
              }),
              scripts: candidates.filter(function (rule) {
                return rule.scriptInject;
              }).map(function (rule) {
                return rule.selector;
              }),
              scriptBlock: candidates.filter(function (rule) {
                return rule.scriptBlock;
              }).map(function (rule) {
                return rule.selector;
              }),
              type: 'domain-rules',
              active: true
            };
          }
        }
      }));
    }
  };
});
//# sourceMappingURL=data:application/json;base64,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QyxRQUFRO2VBQUEsQ0FBQztBQUNuRixrQkFBSSxFQUFFLGNBQWM7QUFDcEIsb0JBQU0sRUFBRSxJQUFJO2FBQ2IsQ0FBQTtXQUNGO1NBQ0Y7T0FDRixDQUFDIiwiZmlsZSI6ImFkYmxvY2tlci9iYWNrZ3JvdW5kLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXRpbHMgfSBmcm9tICdjb3JlL2NsaXF6JztcbmltcG9ydCBiYWNrZ3JvdW5kIGZyb20gXCJjb3JlL2Jhc2UvYmFja2dyb3VuZFwiO1xuaW1wb3J0IENsaXF6QURCLFxuICAgICAgeyBBREJfUFJFRl9WQUxVRVMsXG4gICAgICAgIEFEQl9QUkVGLFxuICAgICAgICBBREJfUFJFRl9PUFRJTUlaRUQsXG4gICAgICAgIGFkYkVuYWJsZWQgfSBmcm9tICdhZGJsb2NrZXIvYWRibG9ja2VyJztcblxuZnVuY3Rpb24gaXNBZGJBY3RpdmUodXJsKSB7XG4gIHJldHVybiBhZGJFbmFibGVkKCkgJiZcbiAgICAgICAgICFDbGlxekFEQi5hZEJsb2NrZXIuaXNEb21haW5JbkJsYWNrbGlzdCh1cmwpICYmXG4gICAgICAgICAhQ2xpcXpBREIuYWRCbG9ja2VyLmlzVXJsSW5CbGFja2xpc3QodXJsKVxufVxuXG5leHBvcnQgZGVmYXVsdCBiYWNrZ3JvdW5kKHtcbiAgZW5hYmxlZCgpIHsgcmV0dXJuIHRydWU7IH0sXG5cbiAgaW5pdCgpIHtcbiAgICBpZiAoQ2xpcXpBREIuZ2V0QnJvd3Nlck1ham9yVmVyc2lvbigpIDwgQ2xpcXpBREIuTUlOX0JST1dTRVJfVkVSU0lPTikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBDbGlxekFEQi5pbml0KCk7XG4gIH0sXG5cbiAgdW5sb2FkKCkge1xuICAgIGlmIChDbGlxekFEQi5nZXRCcm93c2VyTWFqb3JWZXJzaW9uKCkgPCBDbGlxekFEQi5NSU5fQlJPV1NFUl9WRVJTSU9OKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIENsaXF6QURCLnVubG9hZCgpO1xuICB9LFxuXG4gIGV2ZW50czoge1xuICAgIFwiY29udHJvbC1jZW50ZXI6YWRiLW9wdGltaXplZFwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICB1dGlscy5zZXRQcmVmKEFEQl9QUkVGX09QVElNSVpFRCwgIXV0aWxzLmdldFByZWYoQURCX1BSRUZfT1BUSU1JWkVELCBmYWxzZSkpO1xuICAgIH0sXG4gICAgXCJjb250cm9sLWNlbnRlcjphZGItYWN0aXZhdG9yXCI6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICBjb25zdCBpc1VybEluQmxhY2tsaXN0ID0gQ2xpcXpBREIuYWRCbG9ja2VyLmlzVXJsSW5CbGFja2xpc3QoZGF0YS51cmwpLFxuICAgICAgICAgICAgaXNEb21haW5JbkJsYWNrbGlzdCA9IENsaXF6QURCLmFkQmxvY2tlci5pc0RvbWFpbkluQmxhY2tsaXN0KGRhdGEudXJsKTtcblxuICAgICAgLy93ZSBmaXJzdCBuZWVkIHRvIHRvZ2xlIGl0IG9mZiB0byBiZSBhYmxlIHRvIHR1cm4gaXQgb24gZm9yIHRoZSByaWdodCB0aGluZyAtIHNpdGUgb3IgZG9tYWluXG4gICAgICBpZihpc1VybEluQmxhY2tsaXN0KXtcbiAgICAgICAgQ2xpcXpBREIuYWRCbG9ja2VyLnRvZ2dsZVVybChkYXRhLnVybCk7XG4gICAgICB9XG5cbiAgICAgIGlmKGlzRG9tYWluSW5CbGFja2xpc3Qpe1xuICAgICAgICBDbGlxekFEQi5hZEJsb2NrZXIudG9nZ2xlVXJsKGRhdGEudXJsLCB0cnVlKTtcbiAgICAgIH1cblxuICAgICAgaWYoZGF0YS5zdGF0dXMgPT0gJ2FjdGl2ZScpe1xuICAgICAgICB1dGlscy5zZXRQcmVmKEFEQl9QUkVGLCBBREJfUFJFRl9WQUxVRVMuRW5hYmxlZCk7XG4gICAgICB9IGVsc2UgaWYoZGF0YS5zdGF0dXMgPT0gJ29mZicpe1xuICAgICAgICBpZihkYXRhLm9wdGlvbiA9PSAnYWxsLXNpdGVzJyl7XG4gICAgICAgICAgdXRpbHMuc2V0UHJlZihBREJfUFJFRiwgQURCX1BSRUZfVkFMVUVTLkRpc2FibGVkKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1dGlscy5zZXRQcmVmKEFEQl9QUkVGLCBBREJfUFJFRl9WQUxVRVMuRW5hYmxlZCk7XG4gICAgICAgICAgQ2xpcXpBREIuYWRCbG9ja2VyLnRvZ2dsZVVybChkYXRhLnVybCwgZGF0YS5vcHRpb24gPT0gJ2RvbWFpbicgPyB0cnVlIDogZmFsc2UpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9LFxuXG4gIGFjdGlvbnM6IHtcbiAgICAvLyBoYW5kbGVzIG1lc3NhZ2VzIGNvbWluZyBmcm9tIHByb2Nlc3Mgc2NyaXB0XG4gICAgbm9kZXModXJsLCBub2Rlcykge1xuICAgICAgaWYgKCFpc0FkYkFjdGl2ZSh1cmwpKSB7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgcnVsZXM6IFtdLFxuICAgICAgICAgIGFjdGl2ZTogZmFsc2VcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IGNhbmRpZGF0ZXMgPSBDbGlxekFEQi5hZEJsb2NrZXIuZW5naW5lLmdldENvc21ldGljc0ZpbHRlcnModXJsLCBub2Rlcyk7XG4gICAgICByZXR1cm4ge1xuICAgICAgICBydWxlczogY2FuZGlkYXRlcy5tYXAocnVsZSA9PiBydWxlLnNlbGVjdG9yKSxcbiAgICAgICAgYWN0aXZlOiB0cnVlXG4gICAgICB9XG4gICAgfSxcblxuICAgIHVybCh1cmwpIHtcbiAgICAgIGlmICghaXNBZGJBY3RpdmUodXJsKSkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHNjcmlwdHM6IFtdLFxuICAgICAgICAgIHN5dGxlczogW10sXG4gICAgICAgICAgdHlwZTogJ2RvbWFpbi1ydWxlcycsXG4gICAgICAgICAgYWN0aXZlOiBmYWxzZVxuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGNhbmRpZGF0ZXMgPSBDbGlxekFEQi5hZEJsb2NrZXIuZW5naW5lLmdldERvbWFpbkZpbHRlcnModXJsKTtcbiAgICAgIHJldHVybiB7XG4gICAgICAgIHN0eWxlczogY2FuZGlkYXRlcy5maWx0ZXIocnVsZSA9PiAhcnVsZS5zY3JpcHRJbmplY3QgJiYgIXJ1bGUuc2NyaXB0QmxvY2spLm1hcChydWxlID0+IHJ1bGUuc2VsZWN0b3IpLFxuICAgICAgICBzY3JpcHRzOiBjYW5kaWRhdGVzLmZpbHRlcihydWxlID0+IHJ1bGUuc2NyaXB0SW5qZWN0KS5tYXAocnVsZSA9PiBydWxlLnNlbGVjdG9yKSxcbiAgICAgICAgc2NyaXB0QmxvY2s6IGNhbmRpZGF0ZXMuZmlsdGVyKHJ1bGUgPT4gcnVsZS5zY3JpcHRCbG9jaykubWFwKHJ1bGUgPT4gcnVsZS5zZWxlY3RvciksXG4gICAgICAgIHR5cGU6ICdkb21haW4tcnVsZXMnLFxuICAgICAgICBhY3RpdmU6IHRydWVcbiAgICAgIH1cbiAgICB9XG4gIH0sXG59KTtcbiJdfQ==