System.register("autocomplete/background", ["core/cliqz", "core/platform", "autocomplete/autocomplete", "autocomplete/spell-check", "autocomplete/history-cluster", "autocomplete/result-providers", "autocomplete/smart-cliqz-cache/smart-cliqz-cache", "autocomplete/smart-cliqz-cache/trigger-url-cache", "autocomplete/result", "autocomplete/wikipedia-deduplication", "autocomplete/mixer"], function (_export) {
  "use strict";

  var utils, isFirefox, autocomplete, SpellCheck, historyCluster, ResultProviders, SmartCliqzCache, TriggerUrlCache, Result, WikipediaDeduplication, Mixer, AutocompleteComponent;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function onReady() {
    return new Promise(function (resolve) {
      if (isFirefox && Services.search && Services.search.init) {
        Services.search.init(resolve);
      } else {
        resolve();
      }
    });
  }

  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }, function (_corePlatform) {
      isFirefox = _corePlatform.isFirefox;
    }, function (_autocompleteAutocomplete) {
      autocomplete = _autocompleteAutocomplete["default"];
    }, function (_autocompleteSpellCheck) {
      SpellCheck = _autocompleteSpellCheck["default"];
    }, function (_autocompleteHistoryCluster) {
      historyCluster = _autocompleteHistoryCluster["default"];
    }, function (_autocompleteResultProviders) {
      ResultProviders = _autocompleteResultProviders["default"];
    }, function (_autocompleteSmartCliqzCacheSmartCliqzCache) {
      SmartCliqzCache = _autocompleteSmartCliqzCacheSmartCliqzCache["default"];
    }, function (_autocompleteSmartCliqzCacheTriggerUrlCache) {
      TriggerUrlCache = _autocompleteSmartCliqzCacheTriggerUrlCache["default"];
    }, function (_autocompleteResult) {
      Result = _autocompleteResult["default"];
    }, function (_autocompleteWikipediaDeduplication) {
      WikipediaDeduplication = _autocompleteWikipediaDeduplication["default"];
    }, function (_autocompleteMixer) {
      Mixer = _autocompleteMixer["default"];
    }],
    execute: function () {
      AutocompleteComponent = (function () {
        function AutocompleteComponent() {
          _classCallCheck(this, AutocompleteComponent);

          this.reg = Cm.QueryInterface(Ci.nsIComponentRegistrar);
          this.FFcontract = {
            classID: Components.ID('{59a99d57-b4ad-fa7e-aead-da9d4f4e77c8}'),
            classDescription: 'Cliqz',
            contractID: '@mozilla.org/autocomplete/search;1?name=cliqz-results',
            QueryInterface: XPCOMUtils.generateQI([Ci.nsIAutoCompleteSearch])
          };
        }

        _createClass(AutocompleteComponent, [{
          key: "unregister",
          value: function unregister() {
            try {
              this.reg.unregisterFactory(this.reg.contractIDToCID(this.FFcontract.contractID), this.reg.getClassObjectByContractID(this.FFcontract.contractID, Ci.nsISupports));
            } catch (e) {}
          }
        }, {
          key: "register",
          value: function register() {
            Object.assign(autocomplete.CliqzResults.prototype, this.FFcontract);
            var cp = autocomplete.CliqzResults.prototype;
            var factory = XPCOMUtils.generateNSGetFactory([autocomplete.CliqzResults])(cp.classID);
            this.reg.registerFactory(cp.classID, cp.classDescription, cp.contractID, factory);
          }
        }]);

        return AutocompleteComponent;
      })();

      _export("default", {

        init: function init(settings) {
          var _this = this;

          return onReady().then(function () {
            ResultProviders.init();
            autocomplete.CliqzResultProviders = ResultProviders;

            SpellCheck.init();
            autocomplete.CliqzHistoryCluster = historyCluster;

            _this.smartCliqzCache = new SmartCliqzCache();
            _this.triggerUrlCache = new TriggerUrlCache();
            _this.triggerUrlCache.init();

            if (isFirefox) {
              Mixer.init({
                smartCliqzCache: _this.smartCliqzCache,
                triggerUrlCache: _this.triggerUrlCache
              });
              _this.autocompleteComponent = new AutocompleteComponent();
              _this.autocompleteComponent.unregister();
              _this.autocompleteComponent.register();
              utils.RERANKERS.push(WikipediaDeduplication);
            } else {
              Mixer.init();
            }
            autocomplete.Mixer = Mixer;

            utils.getBackendResults = utils.getCliqzResults;
            // glueing stuff
            autocomplete.spellCheck = SpellCheck;
            utils.autocomplete = autocomplete;

            utils.registerResultProvider({
              ResultProviders: ResultProviders,
              Result: Result
            });
          });
        },

        unload: function unload() {
          if (isFirefox) {
            this.autocompleteComponent.unregister();
          }

          this.smartCliqzCache.unload();
          this.triggerUrlCache.unload();
        },

        beforeBrowserShutdown: function beforeBrowserShutdown() {}
      });
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dG9jb21wbGV0ZS9iYWNrZ3JvdW5kLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs0SkFZTSxxQkFBcUI7Ozs7OztBQWlDM0IsV0FBUyxPQUFPLEdBQUc7QUFDakIsV0FBTyxJQUFJLE9BQU8sQ0FBRSxVQUFBLE9BQU8sRUFBSTtBQUM3QixVQUFJLFNBQVMsSUFBSSxRQUFRLENBQUMsTUFBTSxJQUFJLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFO0FBQ3hELGdCQUFRLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztPQUMvQixNQUFNO0FBQ0wsZUFBTyxFQUFFLENBQUM7T0FDWDtLQUNGLENBQUMsQ0FBQztHQUNKOzs7O3lCQXJEUSxLQUFLOztnQ0FDTCxTQUFTOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFXWiwyQkFBcUI7QUFDZCxpQkFEUCxxQkFBcUIsR0FDWDtnQ0FEVixxQkFBcUI7O0FBRXZCLGNBQUksQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLGNBQWMsQ0FBQyxFQUFFLENBQUMscUJBQXFCLENBQUMsQ0FBQztBQUN2RCxjQUFJLENBQUMsVUFBVSxHQUFHO0FBQ2hCLG1CQUFPLEVBQUUsVUFBVSxDQUFDLEVBQUUsQ0FBQyx3Q0FBd0MsQ0FBQztBQUNoRSw0QkFBZ0IsRUFBRyxPQUFPO0FBQzFCLHNCQUFVLEVBQUUsdURBQXVEO0FBQ25FLDBCQUFjLEVBQUUsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFFLEVBQUUsQ0FBQyxxQkFBcUIsQ0FBRSxDQUFDO1dBQ3BFLENBQUM7U0FDSDs7cUJBVEcscUJBQXFCOztpQkFXZixzQkFBRztBQUNYLGdCQUFJO0FBQ0Ysa0JBQUksQ0FBQyxHQUFHLENBQUMsaUJBQWlCLENBQ3hCLElBQUksQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEVBQ3BELElBQUksQ0FBQyxHQUFHLENBQUMsMEJBQTBCLENBQ2pDLElBQUksQ0FBQyxVQUFVLENBQUMsVUFBVSxFQUMxQixFQUFFLENBQUMsV0FBVyxDQUNmLENBQ0YsQ0FBQzthQUNILENBQUMsT0FBTSxDQUFDLEVBQUUsRUFFVjtXQUNGOzs7aUJBRU8sb0JBQUc7QUFDVCxrQkFBTSxDQUFDLE1BQU0sQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLFNBQVMsRUFBRSxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDcEUsZ0JBQU0sRUFBRSxHQUFHLFlBQVksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDO0FBQy9DLGdCQUFNLE9BQU8sR0FBRyxVQUFVLENBQUMsb0JBQW9CLENBQUMsQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDekYsZ0JBQUksQ0FBQyxHQUFHLENBQUMsZUFBZSxDQUFDLEVBQUUsQ0FBQyxPQUFPLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixFQUFFLEVBQUUsQ0FBQyxVQUFVLEVBQUUsT0FBTyxDQUFDLENBQUM7V0FDbkY7OztlQTlCRyxxQkFBcUI7Ozt5QkEyQ1o7O0FBRWIsWUFBSSxFQUFBLGNBQUMsUUFBUSxFQUFFOzs7QUFDYixpQkFBTyxPQUFPLEVBQUUsQ0FBQyxJQUFJLENBQUUsWUFBTTtBQUMzQiwyQkFBZSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3ZCLHdCQUFZLENBQUMsb0JBQW9CLEdBQUcsZUFBZSxDQUFDOztBQUVwRCxzQkFBVSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ2xCLHdCQUFZLENBQUMsbUJBQW1CLEdBQUcsY0FBYyxDQUFDOztBQUVsRCxrQkFBSyxlQUFlLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztBQUM3QyxrQkFBSyxlQUFlLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztBQUM3QyxrQkFBSyxlQUFlLENBQUMsSUFBSSxFQUFFLENBQUM7O0FBRTVCLGdCQUFJLFNBQVMsRUFBRTtBQUNiLG1CQUFLLENBQUMsSUFBSSxDQUFDO0FBQ1QsK0JBQWUsRUFBRSxNQUFLLGVBQWU7QUFDckMsK0JBQWUsRUFBRSxNQUFLLGVBQWU7ZUFDdEMsQ0FBQyxDQUFDO0FBQ0gsb0JBQUsscUJBQXFCLEdBQUcsSUFBSSxxQkFBcUIsRUFBRSxDQUFDO0FBQ3pELG9CQUFLLHFCQUFxQixDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ3hDLG9CQUFLLHFCQUFxQixDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3RDLG1CQUFLLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxDQUFDO2FBQzlDLE1BQU07QUFDTCxtQkFBSyxDQUFDLElBQUksRUFBRSxDQUFDO2FBQ2Q7QUFDRCx3QkFBWSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7O0FBRTNCLGlCQUFLLENBQUMsaUJBQWlCLEdBQUcsS0FBSyxDQUFDLGVBQWUsQ0FBQzs7QUFFaEQsd0JBQVksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO0FBQ3JDLGlCQUFLLENBQUMsWUFBWSxHQUFHLFlBQVksQ0FBQzs7QUFFbEMsaUJBQUssQ0FBQyxzQkFBc0IsQ0FBQztBQUMzQiw2QkFBZSxFQUFmLGVBQWU7QUFDZixvQkFBTSxFQUFOLE1BQU07YUFDUCxDQUFDLENBQUM7V0FDSixDQUFDLENBQUM7U0FDSjs7QUFFRCxjQUFNLEVBQUEsa0JBQUc7QUFDUCxjQUFJLFNBQVMsRUFBRTtBQUNiLGdCQUFJLENBQUMscUJBQXFCLENBQUMsVUFBVSxFQUFFLENBQUM7V0FDekM7O0FBRUQsY0FBSSxDQUFDLGVBQWUsQ0FBQyxNQUFNLEVBQUUsQ0FBQztBQUM5QixjQUFJLENBQUMsZUFBZSxDQUFDLE1BQU0sRUFBRSxDQUFDO1NBQy9COztBQUVELDZCQUFxQixFQUFBLGlDQUFHLEVBRXZCO09BQ0YiLCJmaWxlIjoiYXV0b2NvbXBsZXRlL2JhY2tncm91bmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1dGlscyB9IGZyb20gXCJjb3JlL2NsaXF6XCI7XG5pbXBvcnQgeyBpc0ZpcmVmb3ggfSBmcm9tIFwiY29yZS9wbGF0Zm9ybVwiO1xuaW1wb3J0IGF1dG9jb21wbGV0ZSBmcm9tIFwiYXV0b2NvbXBsZXRlL2F1dG9jb21wbGV0ZVwiO1xuaW1wb3J0IFNwZWxsQ2hlY2sgZnJvbSBcImF1dG9jb21wbGV0ZS9zcGVsbC1jaGVja1wiO1xuaW1wb3J0IGhpc3RvcnlDbHVzdGVyIGZyb20gXCJhdXRvY29tcGxldGUvaGlzdG9yeS1jbHVzdGVyXCI7XG5pbXBvcnQgUmVzdWx0UHJvdmlkZXJzIGZyb20gXCJhdXRvY29tcGxldGUvcmVzdWx0LXByb3ZpZGVyc1wiO1xuaW1wb3J0IFNtYXJ0Q2xpcXpDYWNoZSBmcm9tICdhdXRvY29tcGxldGUvc21hcnQtY2xpcXotY2FjaGUvc21hcnQtY2xpcXotY2FjaGUnO1xuaW1wb3J0IFRyaWdnZXJVcmxDYWNoZSBmcm9tICdhdXRvY29tcGxldGUvc21hcnQtY2xpcXotY2FjaGUvdHJpZ2dlci11cmwtY2FjaGUnO1xuaW1wb3J0IFJlc3VsdCBmcm9tIFwiYXV0b2NvbXBsZXRlL3Jlc3VsdFwiO1xuaW1wb3J0IFdpa2lwZWRpYURlZHVwbGljYXRpb24gZnJvbSBcImF1dG9jb21wbGV0ZS93aWtpcGVkaWEtZGVkdXBsaWNhdGlvblwiO1xuaW1wb3J0IE1peGVyIGZyb20gXCJhdXRvY29tcGxldGUvbWl4ZXJcIjtcblxuY2xhc3MgQXV0b2NvbXBsZXRlQ29tcG9uZW50IHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5yZWcgPSBDbS5RdWVyeUludGVyZmFjZShDaS5uc0lDb21wb25lbnRSZWdpc3RyYXIpO1xuICAgIHRoaXMuRkZjb250cmFjdCA9IHtcbiAgICAgIGNsYXNzSUQ6IENvbXBvbmVudHMuSUQoJ3s1OWE5OWQ1Ny1iNGFkLWZhN2UtYWVhZC1kYTlkNGY0ZTc3Yzh9JyksXG4gICAgICBjbGFzc0Rlc2NyaXB0aW9uIDogJ0NsaXF6JyxcbiAgICAgIGNvbnRyYWN0SUQ6ICdAbW96aWxsYS5vcmcvYXV0b2NvbXBsZXRlL3NlYXJjaDsxP25hbWU9Y2xpcXotcmVzdWx0cycsXG4gICAgICBRdWVyeUludGVyZmFjZTogWFBDT01VdGlscy5nZW5lcmF0ZVFJKFsgQ2kubnNJQXV0b0NvbXBsZXRlU2VhcmNoIF0pXG4gICAgfTtcbiAgfVxuXG4gIHVucmVnaXN0ZXIoKSB7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMucmVnLnVucmVnaXN0ZXJGYWN0b3J5KFxuICAgICAgICB0aGlzLnJlZy5jb250cmFjdElEVG9DSUQodGhpcy5GRmNvbnRyYWN0LmNvbnRyYWN0SUQpLFxuICAgICAgICB0aGlzLnJlZy5nZXRDbGFzc09iamVjdEJ5Q29udHJhY3RJRChcbiAgICAgICAgICB0aGlzLkZGY29udHJhY3QuY29udHJhY3RJRCxcbiAgICAgICAgICBDaS5uc0lTdXBwb3J0c1xuICAgICAgICApXG4gICAgICApO1xuICAgIH0gY2F0Y2goZSkge1xuXG4gICAgfVxuICB9XG5cbiAgcmVnaXN0ZXIoKSB7XG4gICAgT2JqZWN0LmFzc2lnbihhdXRvY29tcGxldGUuQ2xpcXpSZXN1bHRzLnByb3RvdHlwZSwgdGhpcy5GRmNvbnRyYWN0KTtcbiAgICBjb25zdCBjcCA9IGF1dG9jb21wbGV0ZS5DbGlxelJlc3VsdHMucHJvdG90eXBlO1xuICAgIGNvbnN0IGZhY3RvcnkgPSBYUENPTVV0aWxzLmdlbmVyYXRlTlNHZXRGYWN0b3J5KFthdXRvY29tcGxldGUuQ2xpcXpSZXN1bHRzXSkoY3AuY2xhc3NJRCk7XG4gICAgdGhpcy5yZWcucmVnaXN0ZXJGYWN0b3J5KGNwLmNsYXNzSUQsIGNwLmNsYXNzRGVzY3JpcHRpb24sIGNwLmNvbnRyYWN0SUQsIGZhY3RvcnkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG9uUmVhZHkoKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSggcmVzb2x2ZSA9PiB7XG4gICAgaWYgKGlzRmlyZWZveCAmJiBTZXJ2aWNlcy5zZWFyY2ggJiYgU2VydmljZXMuc2VhcmNoLmluaXQpIHtcbiAgICAgIFNlcnZpY2VzLnNlYXJjaC5pbml0KHJlc29sdmUpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXNvbHZlKCk7XG4gICAgfVxuICB9KTtcbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuXG4gIGluaXQoc2V0dGluZ3MpIHtcbiAgICByZXR1cm4gb25SZWFkeSgpLnRoZW4oICgpID0+IHtcbiAgICAgIFJlc3VsdFByb3ZpZGVycy5pbml0KCk7XG4gICAgICBhdXRvY29tcGxldGUuQ2xpcXpSZXN1bHRQcm92aWRlcnMgPSBSZXN1bHRQcm92aWRlcnM7XG5cbiAgICAgIFNwZWxsQ2hlY2suaW5pdCgpO1xuICAgICAgYXV0b2NvbXBsZXRlLkNsaXF6SGlzdG9yeUNsdXN0ZXIgPSBoaXN0b3J5Q2x1c3RlcjtcblxuICAgICAgdGhpcy5zbWFydENsaXF6Q2FjaGUgPSBuZXcgU21hcnRDbGlxekNhY2hlKCk7XG4gICAgICB0aGlzLnRyaWdnZXJVcmxDYWNoZSA9IG5ldyBUcmlnZ2VyVXJsQ2FjaGUoKTtcbiAgICAgIHRoaXMudHJpZ2dlclVybENhY2hlLmluaXQoKTtcblxuICAgICAgaWYgKGlzRmlyZWZveCkge1xuICAgICAgICBNaXhlci5pbml0KHtcbiAgICAgICAgICBzbWFydENsaXF6Q2FjaGU6IHRoaXMuc21hcnRDbGlxekNhY2hlLFxuICAgICAgICAgIHRyaWdnZXJVcmxDYWNoZTogdGhpcy50cmlnZ2VyVXJsQ2FjaGUsXG4gICAgICAgIH0pO1xuICAgICAgICB0aGlzLmF1dG9jb21wbGV0ZUNvbXBvbmVudCA9IG5ldyBBdXRvY29tcGxldGVDb21wb25lbnQoKTtcbiAgICAgICAgdGhpcy5hdXRvY29tcGxldGVDb21wb25lbnQudW5yZWdpc3RlcigpO1xuICAgICAgICB0aGlzLmF1dG9jb21wbGV0ZUNvbXBvbmVudC5yZWdpc3RlcigpO1xuICAgICAgICB1dGlscy5SRVJBTktFUlMucHVzaChXaWtpcGVkaWFEZWR1cGxpY2F0aW9uKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIE1peGVyLmluaXQoKTtcbiAgICAgIH1cbiAgICAgIGF1dG9jb21wbGV0ZS5NaXhlciA9IE1peGVyO1xuXG4gICAgICB1dGlscy5nZXRCYWNrZW5kUmVzdWx0cyA9IHV0aWxzLmdldENsaXF6UmVzdWx0cztcbiAgICAgIC8vIGdsdWVpbmcgc3R1ZmZcbiAgICAgIGF1dG9jb21wbGV0ZS5zcGVsbENoZWNrID0gU3BlbGxDaGVjaztcbiAgICAgIHV0aWxzLmF1dG9jb21wbGV0ZSA9IGF1dG9jb21wbGV0ZTtcblxuICAgICAgdXRpbHMucmVnaXN0ZXJSZXN1bHRQcm92aWRlcih7XG4gICAgICAgIFJlc3VsdFByb3ZpZGVycyxcbiAgICAgICAgUmVzdWx0XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSxcblxuICB1bmxvYWQoKSB7XG4gICAgaWYgKGlzRmlyZWZveCkge1xuICAgICAgdGhpcy5hdXRvY29tcGxldGVDb21wb25lbnQudW5yZWdpc3RlcigpO1xuICAgIH1cblxuICAgIHRoaXMuc21hcnRDbGlxekNhY2hlLnVubG9hZCgpO1xuICAgIHRoaXMudHJpZ2dlclVybENhY2hlLnVubG9hZCgpO1xuICB9LFxuXG4gIGJlZm9yZUJyb3dzZXJTaHV0ZG93bigpIHtcblxuICB9XG59XG4iXX0=