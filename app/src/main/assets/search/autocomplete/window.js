System.register("autocomplete/window", ["autocomplete/autocomplete", "autocomplete/result-providers", "core/cliqz"], function (_export) {
  "use strict";

  var autocomplete, CliqzResultProviders, utils, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  return {
    setters: [function (_autocompleteAutocomplete) {
      autocomplete = _autocompleteAutocomplete["default"];
    }, function (_autocompleteResultProviders) {
      CliqzResultProviders = _autocompleteResultProviders["default"];
    }, function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }],
    execute: function () {
      _default = (function () {
        function _default(settings) {
          _classCallCheck(this, _default);

          this.window = settings.window;
        }

        _createClass(_default, [{
          key: "init",
          value: function init() {
            this.window.CliqzAutocomplete = autocomplete;
          }
        }, {
          key: "unload",
          value: function unload() {
            delete this.window.CliqzAutocomplete;
          }
        }, {
          key: "createButtonItem",
          value: function createButtonItem() {
            if (utils.getPref("cliqz_core_disabled", false)) return;

            var doc = this.window.document,
                menu = doc.createElement('menu'),
                menupopup = doc.createElement('menupopup'),
                engines = CliqzResultProviders.getSearchEngines(),
                def = Services.search.currentEngine.name;

            menu.setAttribute('label', utils.getLocalizedString('btnDefaultSearchEngine'));

            for (var i in engines) {

              var engine = engines[i],
                  item = doc.createElement('menuitem');
              item.setAttribute('label', '[' + engine.prefix + '] ' + engine.name);
              item.setAttribute('class', 'menuitem-iconic');
              item.engineName = engine.name;
              if (engine.name == def) {
                item.style.listStyleImage = 'url(' + utils.SKIN_PATH + 'checkmark.png)';
              }
              // TODO: Where is this listener removed?
              item.addEventListener('command', (function (event) {
                CliqzResultProviders.setCurrentSearchEngine(event.currentTarget.engineName);
                utils.telemetry({
                  type: 'activity',
                  action: 'cliqz_menu_button',
                  button_name: 'search_engine_change_' + event.currentTarget.engineName
                });
              }).bind(this), false);

              menupopup.appendChild(item);
            }

            menu.appendChild(menupopup);

            return menu;
          }
        }]);

        return _default;
      })();

      _export("default", _default);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dG9jb21wbGV0ZS93aW5kb3cuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7O3lCQUVTLEtBQUs7Ozs7QUFHRCwwQkFBQyxRQUFRLEVBQUU7OztBQUNwQixjQUFJLENBQUMsTUFBTSxHQUFHLFFBQVEsQ0FBQyxNQUFNLENBQUM7U0FDL0I7Ozs7aUJBRUcsZ0JBQUc7QUFDTCxnQkFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsR0FBRyxZQUFZLENBQUM7V0FDOUM7OztpQkFFSyxrQkFBRztBQUNQLG1CQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsaUJBQWlCLENBQUM7V0FDdEM7OztpQkFFZSw0QkFBRztBQUNqQixnQkFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLHFCQUFxQixFQUFFLEtBQUssQ0FBQyxFQUFFLE9BQU87O0FBRXhELGdCQUFNLEdBQUcsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVE7Z0JBQzlCLElBQUksR0FBRyxHQUFHLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQztnQkFDaEMsU0FBUyxHQUFHLEdBQUcsQ0FBQyxhQUFhLENBQUMsV0FBVyxDQUFDO2dCQUMxQyxPQUFPLEdBQUcsb0JBQW9CLENBQUMsZ0JBQWdCLEVBQUU7Z0JBQ2pELEdBQUcsR0FBRyxRQUFRLENBQUMsTUFBTSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUM7O0FBRTNDLGdCQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxLQUFLLENBQUMsa0JBQWtCLENBQUMsd0JBQXdCLENBQUMsQ0FBQyxDQUFDOztBQUUvRSxpQkFBSSxJQUFJLENBQUMsSUFBSSxPQUFPLEVBQUM7O0FBRW5CLGtCQUFJLE1BQU0sR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDO2tCQUN2QixJQUFJLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNyQyxrQkFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsR0FBRyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUNyRSxrQkFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLEVBQUUsaUJBQWlCLENBQUMsQ0FBQztBQUM5QyxrQkFBSSxDQUFDLFVBQVUsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDO0FBQzlCLGtCQUFHLE1BQU0sQ0FBQyxJQUFJLElBQUksR0FBRyxFQUFDO0FBQ3BCLG9CQUFJLENBQUMsS0FBSyxDQUFDLGNBQWMsR0FBRyxNQUFNLEdBQUcsS0FBSyxDQUFDLFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQztlQUN6RTs7QUFFRCxrQkFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsRUFBRSxDQUFDLFVBQVMsS0FBSyxFQUFFO0FBQ2hELG9DQUFvQixDQUFDLHNCQUFzQixDQUFDLEtBQUssQ0FBQyxhQUFhLENBQUMsVUFBVSxDQUFDLENBQUM7QUFDNUUscUJBQUssQ0FBQyxTQUFTLENBQUM7QUFDZCxzQkFBSSxFQUFFLFVBQVU7QUFDaEIsd0JBQU0sRUFBRSxtQkFBbUI7QUFDM0IsNkJBQVcsRUFBRSx1QkFBdUIsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLFVBQVU7aUJBQ3RFLENBQUMsQ0FBQztlQUNKLENBQUEsQ0FBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7O0FBRXRCLHVCQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzdCOztBQUVELGdCQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxDQUFDOztBQUU1QixtQkFBTyxJQUFJLENBQUM7V0FDYiIsImZpbGUiOiJhdXRvY29tcGxldGUvd2luZG93LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGF1dG9jb21wbGV0ZSBmcm9tIFwiYXV0b2NvbXBsZXRlL2F1dG9jb21wbGV0ZVwiO1xuaW1wb3J0IENsaXF6UmVzdWx0UHJvdmlkZXJzIGZyb20gXCJhdXRvY29tcGxldGUvcmVzdWx0LXByb3ZpZGVyc1wiO1xuaW1wb3J0IHsgdXRpbHMgfSBmcm9tIFwiY29yZS9jbGlxelwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyB7XG4gIGNvbnN0cnVjdG9yKHNldHRpbmdzKSB7XG4gICAgdGhpcy53aW5kb3cgPSBzZXR0aW5ncy53aW5kb3c7XG4gIH1cblxuICBpbml0KCkge1xuICAgIHRoaXMud2luZG93LkNsaXF6QXV0b2NvbXBsZXRlID0gYXV0b2NvbXBsZXRlO1xuICB9XG5cbiAgdW5sb2FkKCkge1xuICAgIGRlbGV0ZSB0aGlzLndpbmRvdy5DbGlxekF1dG9jb21wbGV0ZTtcbiAgfVxuXG4gIGNyZWF0ZUJ1dHRvbkl0ZW0oKSB7XG4gICAgaWYgKHV0aWxzLmdldFByZWYoXCJjbGlxel9jb3JlX2Rpc2FibGVkXCIsIGZhbHNlKSkgcmV0dXJuO1xuXG4gICAgY29uc3QgZG9jID0gdGhpcy53aW5kb3cuZG9jdW1lbnQsXG4gICAgICBtZW51ID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ21lbnUnKSxcbiAgICAgIG1lbnVwb3B1cCA9IGRvYy5jcmVhdGVFbGVtZW50KCdtZW51cG9wdXAnKSxcbiAgICAgIGVuZ2luZXMgPSBDbGlxelJlc3VsdFByb3ZpZGVycy5nZXRTZWFyY2hFbmdpbmVzKCksXG4gICAgICBkZWYgPSBTZXJ2aWNlcy5zZWFyY2guY3VycmVudEVuZ2luZS5uYW1lO1xuXG4gICAgbWVudS5zZXRBdHRyaWJ1dGUoJ2xhYmVsJywgdXRpbHMuZ2V0TG9jYWxpemVkU3RyaW5nKCdidG5EZWZhdWx0U2VhcmNoRW5naW5lJykpO1xuXG4gICAgZm9yKHZhciBpIGluIGVuZ2luZXMpe1xuXG4gICAgICB2YXIgZW5naW5lID0gZW5naW5lc1tpXSxcbiAgICAgIGl0ZW0gPSBkb2MuY3JlYXRlRWxlbWVudCgnbWVudWl0ZW0nKTtcbiAgICAgIGl0ZW0uc2V0QXR0cmlidXRlKCdsYWJlbCcsICdbJyArIGVuZ2luZS5wcmVmaXggKyAnXSAnICsgZW5naW5lLm5hbWUpO1xuICAgICAgaXRlbS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ21lbnVpdGVtLWljb25pYycpO1xuICAgICAgaXRlbS5lbmdpbmVOYW1lID0gZW5naW5lLm5hbWU7XG4gICAgICBpZihlbmdpbmUubmFtZSA9PSBkZWYpe1xuICAgICAgICBpdGVtLnN0eWxlLmxpc3RTdHlsZUltYWdlID0gJ3VybCgnICsgdXRpbHMuU0tJTl9QQVRIICsgJ2NoZWNrbWFyay5wbmcpJztcbiAgICAgIH1cbiAgICAgIC8vIFRPRE86IFdoZXJlIGlzIHRoaXMgbGlzdGVuZXIgcmVtb3ZlZD9cbiAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY29tbWFuZCcsIChmdW5jdGlvbihldmVudCkge1xuICAgICAgICBDbGlxelJlc3VsdFByb3ZpZGVycy5zZXRDdXJyZW50U2VhcmNoRW5naW5lKGV2ZW50LmN1cnJlbnRUYXJnZXQuZW5naW5lTmFtZSk7XG4gICAgICAgIHV0aWxzLnRlbGVtZXRyeSh7XG4gICAgICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcbiAgICAgICAgICBhY3Rpb246ICdjbGlxel9tZW51X2J1dHRvbicsXG4gICAgICAgICAgYnV0dG9uX25hbWU6ICdzZWFyY2hfZW5naW5lX2NoYW5nZV8nICsgZXZlbnQuY3VycmVudFRhcmdldC5lbmdpbmVOYW1lXG4gICAgICAgIH0pO1xuICAgICAgfSkuYmluZCh0aGlzKSwgZmFsc2UpO1xuXG4gICAgICBtZW51cG9wdXAuYXBwZW5kQ2hpbGQoaXRlbSk7XG4gICAgfVxuXG4gICAgbWVudS5hcHBlbmRDaGlsZChtZW51cG9wdXApO1xuXG4gICAgcmV0dXJuIG1lbnU7XG4gIH1cbn1cbiJdfQ==