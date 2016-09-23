System.register('adblocker/window', ['core/cliqz', 'q-button/buttons', 'adblocker/adblocker'], function (_export) {
  'use strict';

  var utils, simpleBtn, checkBox, CliqzADB, adbEnabled, adbABTestEnabled, ADB_PREF_VALUES, ADB_PREF_OPTIMIZED, ADB_PREF, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }, function (_qButtonButtons) {
      simpleBtn = _qButtonButtons.simpleBtn;
      checkBox = _qButtonButtons.checkBox;
    }, function (_adblockerAdblocker) {
      CliqzADB = _adblockerAdblocker['default'];
      adbEnabled = _adblockerAdblocker.adbEnabled;
      adbABTestEnabled = _adblockerAdblocker.adbABTestEnabled;
      ADB_PREF_VALUES = _adblockerAdblocker.ADB_PREF_VALUES;
      ADB_PREF_OPTIMIZED = _adblockerAdblocker.ADB_PREF_OPTIMIZED;
      ADB_PREF = _adblockerAdblocker.ADB_PREF;
    }],
    execute: function () {
      _default = (function () {
        function _default(settings) {
          _classCallCheck(this, _default);

          this.window = settings.window;
        }

        _createClass(_default, [{
          key: 'init',
          value: function init() {
            if (adbEnabled()) {
              CliqzADB.initWindow(this.window);
              this.window.adbinit = true;
            }
          }
        }, {
          key: 'unload',
          value: function unload() {
            if (adbEnabled()) {
              CliqzADB.unloadWindow(this.window);
              this.window.adbinit = false;
            }
          }
        }, {
          key: 'createAdbButton',
          value: function createAdbButton() {
            var win = this.window;
            var doc = win.document;
            var adbBtn = doc.createElement('menu');
            var adbPopup = doc.createElement('menupopup');

            adbBtn.setAttribute('label', utils.getLocalizedString('adb-menu-option'));

            // we must create the whole ADB popup every time we show it
            // because parts of it depend on the current URL
            adbPopup.addEventListener('popupshowing', function () {
              // clean the whole popup
              while (adbPopup.lastChild) {
                adbPopup.removeChild(adbPopup.lastChild);
              }

              var currentURL = win.gBrowser.currentURI.spec;
              var adbDisabled = !adbEnabled();

              var isCorrectUrl = utils.isUrl(currentURL);
              var disabledForUrl = false;
              var disabledForDomain = false;

              // Check if adblocker is disabled on this page
              if (isCorrectUrl) {
                disabledForDomain = CliqzADB.adBlocker.isDomainInBlacklist(currentURL);
                disabledForUrl = CliqzADB.adBlocker.isUrlInBlacklist(currentURL);
              }

              var disableUrl = checkBox(doc, 'cliqz-adb-url', utils.getLocalizedString('adb-menu-disable-url'), true, function () {
                CliqzADB.adBlocker.toggleUrl(currentURL);
              }, disabledForUrl);

              var disableDomain = checkBox(doc, 'cliqz-adb-domain', utils.getLocalizedString('adb-menu-disable-domain'), true, function () {
                CliqzADB.adBlocker.toggleUrl(currentURL, true);
              }, disabledForDomain);

              // We disabled the option of adding a custom rule for URL
              // in case the whole domain is disabled
              disableUrl.setAttribute('disabled', adbDisabled || disabledForDomain || !isCorrectUrl);
              disableDomain.setAttribute('disabled', adbDisabled || !isCorrectUrl);

              adbPopup.appendChild(disableUrl);
              adbPopup.appendChild(disableDomain);
              adbPopup.appendChild(doc.createElement('menuseparator'));

              Object.keys(ADB_PREF_VALUES).forEach(function (name) {
                var item = doc.createElement('menuitem');

                item.setAttribute('label', utils.getLocalizedString('adb-menu-option-' + name.toLowerCase()));
                item.setAttribute('class', 'menuitem-iconic');
                item.option = ADB_PREF_VALUES[name];

                if (utils.getPref(ADB_PREF, ADB_PREF_VALUES.Disabled) === item.option) {
                  item.style.listStyleImage = 'url(' + utils.SKIN_PATH + 'checkmark.png)';
                }

                item.addEventListener('command', function () {
                  utils.setPref(ADB_PREF, item.option);
                  if (adbEnabled() && !win.adbinit) {
                    CliqzADB.initWindow(win);
                    win.adbinit = true;
                  }
                  if (!adbEnabled() && win.adbinit) {
                    CliqzADB.unloadWindow(win);
                    win.adbinit = false;
                  }
                  utils.telemetry({
                    type: 'activity',
                    action: 'cliqz_menu_button',
                    button_name: 'adb_option_' + item.option
                  });
                }, false);

                adbPopup.appendChild(item);
              });

              adbPopup.appendChild(doc.createElement('menuseparator'));

              adbPopup.appendChild(simpleBtn(doc, CliqzUtils.getLocalizedString('adb-menu-more'), function () {
                utils.openTabInWindow(win, 'https://cliqz.com/whycliqz/adblocking');
              }, 'cliqz-adb-more'));
            });

            adbBtn.appendChild(adbPopup);

            return adbBtn;
          }
        }, {
          key: 'createButtonItem',
          value: function createButtonItem() {
            if (adbABTestEnabled()) {
              return [this.createAdbButton()];
            }
            return [];
          }
        }, {
          key: 'status',
          value: function status() {
            if (!adbABTestEnabled()) {
              return;
            }

            var currentURL = this.window.gBrowser.currentURI.spec;
            var adbDisabled = !adbEnabled();

            var isCorrectUrl = utils.isUrl(currentURL);
            var disabledForUrl = false;
            var disabledForDomain = false;
            var disabledEverywhere = false;

            // Check if adblocker is disabled on this page
            if (isCorrectUrl) {
              disabledForDomain = CliqzADB.adBlocker.isDomainInBlacklist(currentURL);
              disabledForUrl = CliqzADB.adBlocker.isUrlInBlacklist(currentURL);
            }

            var state = Object.keys(ADB_PREF_VALUES).map(function (name) {
              return {
                name: name.toLowerCase(),
                selected: utils.getPref(ADB_PREF, ADB_PREF_VALUES.Disabled) == ADB_PREF_VALUES[name]
              };
            });

            var report = CliqzADB.adbStats.report(currentURL);
            var enabled = CliqzUtils.getPref(ADB_PREF, false) !== ADB_PREF_VALUES.Disabled;

            if (isCorrectUrl) {
              disabledForDomain = CliqzADB.adBlocker.isDomainInBlacklist(currentURL);
              disabledForUrl = CliqzADB.adBlocker.isUrlInBlacklist(currentURL);
            }
            disabledEverywhere = !enabled && !disabledForUrl && !disabledForDomain;

            return {
              visible: true,
              enabled: enabled && !disabledForDomain && !disabledForUrl,
              optimized: CliqzUtils.getPref(ADB_PREF_OPTIMIZED, false) == true,
              disabledForUrl: disabledForUrl,
              disabledForDomain: disabledForDomain,
              disabledEverywhere: disabledEverywhere,
              totalCount: report.totalCount,
              advertisersList: report.advertisersList,
              state: !enabled ? 'off' : disabledForUrl || disabledForDomain ? 'off' : 'active',
              off_state: disabledForUrl ? 'off_website' : disabledForDomain ? 'off_domain' : disabledEverywhere ? 'off_all' : 'off_website'
            };
          }
        }]);

        return _default;
      })();

      _export('default', _default);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,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QUFDaEIsK0JBQWlCLEdBQUcsUUFBUSxDQUFDLFNBQVMsQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUN2RSw0QkFBYyxHQUFHLFFBQVEsQ0FBQyxTQUFTLENBQUMsZ0JBQWdCLENBQUMsVUFBVSxDQUFDLENBQUM7YUFDbEU7QUFDRCw4QkFBa0IsR0FBRyxDQUFDLE9BQU8sSUFBSSxDQUFDLGNBQWMsSUFBSSxDQUFDLGlCQUFpQixDQUFBOztBQUV0RSxtQkFBTztBQUNMLHFCQUFPLEVBQUUsSUFBSTtBQUNiLHFCQUFPLEVBQUUsT0FBTyxJQUFJLENBQUMsaUJBQWlCLElBQUksQ0FBQyxjQUFjO0FBQ3pELHVCQUFTLEVBQUUsVUFBVSxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsRUFBRSxLQUFLLENBQUMsSUFBSSxJQUFJO0FBQ2hFLDRCQUFjLEVBQUUsY0FBYztBQUM5QiwrQkFBaUIsRUFBRSxpQkFBaUI7QUFDcEMsZ0NBQWtCLEVBQUUsa0JBQWtCO0FBQ3RDLHdCQUFVLEVBQUUsTUFBTSxDQUFDLFVBQVU7QUFDN0IsNkJBQWUsRUFBRSxNQUFNLENBQUMsZUFBZTtBQUN2QyxtQkFBSyxFQUFFLEFBQUMsQ0FBQyxPQUFPLEdBQUksS0FBSyxHQUFJLGNBQWMsSUFBSSxpQkFBaUIsR0FBRyxLQUFLLEdBQUcsUUFBUSxBQUFDO0FBQ3BGLHVCQUFTLEVBQUUsY0FBYyxHQUFHLGFBQWEsR0FBSSxpQkFBaUIsR0FBRyxZQUFZLEdBQUksa0JBQWtCLEdBQUcsU0FBUyxHQUFHLGFBQWEsQUFBQyxBQUFDO2FBQ2xJLENBQUE7V0FDRiIsImZpbGUiOiJhZGJsb2NrZXIvd2luZG93LmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgdXRpbHMgfSBmcm9tICdjb3JlL2NsaXF6JztcbmltcG9ydCB7IHNpbXBsZUJ0biwgY2hlY2tCb3ggfSBmcm9tICdxLWJ1dHRvbi9idXR0b25zJztcbmltcG9ydCBDbGlxekFEQixcbiAgICAgeyBhZGJFbmFibGVkLFxuICAgICAgIGFkYkFCVGVzdEVuYWJsZWQsXG4gICAgICAgQURCX1BSRUZfVkFMVUVTLFxuICAgICAgIEFEQl9QUkVGX09QVElNSVpFRCxcbiAgICAgICBBREJfUFJFRiB9IGZyb20gJ2FkYmxvY2tlci9hZGJsb2NrZXInO1xuXG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHtcbiAgY29uc3RydWN0b3Ioc2V0dGluZ3MpIHtcbiAgICB0aGlzLndpbmRvdyA9IHNldHRpbmdzLndpbmRvdztcbiAgfVxuXG4gIGluaXQoKSB7XG4gICAgaWYgKGFkYkVuYWJsZWQoKSkge1xuICAgICAgQ2xpcXpBREIuaW5pdFdpbmRvdyh0aGlzLndpbmRvdyk7XG4gICAgICB0aGlzLndpbmRvdy5hZGJpbml0ID0gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICB1bmxvYWQoKSB7XG4gICAgaWYgKGFkYkVuYWJsZWQoKSkge1xuICAgICAgQ2xpcXpBREIudW5sb2FkV2luZG93KHRoaXMud2luZG93KTtcbiAgICAgIHRoaXMud2luZG93LmFkYmluaXQgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBjcmVhdGVBZGJCdXR0b24oKSB7XG4gICAgY29uc3Qgd2luID0gdGhpcy53aW5kb3c7XG4gICAgY29uc3QgZG9jID0gd2luLmRvY3VtZW50O1xuICAgIGNvbnN0IGFkYkJ0biA9IGRvYy5jcmVhdGVFbGVtZW50KCdtZW51Jyk7XG4gICAgY29uc3QgYWRiUG9wdXAgPSBkb2MuY3JlYXRlRWxlbWVudCgnbWVudXBvcHVwJyk7XG5cbiAgICBhZGJCdG4uc2V0QXR0cmlidXRlKCdsYWJlbCcsIHV0aWxzLmdldExvY2FsaXplZFN0cmluZygnYWRiLW1lbnUtb3B0aW9uJykpO1xuXG4gICAgLy8gd2UgbXVzdCBjcmVhdGUgdGhlIHdob2xlIEFEQiBwb3B1cCBldmVyeSB0aW1lIHdlIHNob3cgaXRcbiAgICAvLyBiZWNhdXNlIHBhcnRzIG9mIGl0IGRlcGVuZCBvbiB0aGUgY3VycmVudCBVUkxcbiAgICBhZGJQb3B1cC5hZGRFdmVudExpc3RlbmVyKCdwb3B1cHNob3dpbmcnLCAoKSA9PiB7XG4gICAgICAvLyBjbGVhbiB0aGUgd2hvbGUgcG9wdXBcbiAgICAgIHdoaWxlIChhZGJQb3B1cC5sYXN0Q2hpbGQpIHtcbiAgICAgICAgYWRiUG9wdXAucmVtb3ZlQ2hpbGQoYWRiUG9wdXAubGFzdENoaWxkKTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY3VycmVudFVSTCA9IHdpbi5nQnJvd3Nlci5jdXJyZW50VVJJLnNwZWM7XG4gICAgICBjb25zdCBhZGJEaXNhYmxlZCA9ICFhZGJFbmFibGVkKCk7XG5cbiAgICAgIGNvbnN0IGlzQ29ycmVjdFVybCA9IHV0aWxzLmlzVXJsKGN1cnJlbnRVUkwpO1xuICAgICAgbGV0IGRpc2FibGVkRm9yVXJsID0gZmFsc2U7XG4gICAgICBsZXQgZGlzYWJsZWRGb3JEb21haW4gPSBmYWxzZTtcblxuICAgICAgLy8gQ2hlY2sgaWYgYWRibG9ja2VyIGlzIGRpc2FibGVkIG9uIHRoaXMgcGFnZVxuICAgICAgaWYgKGlzQ29ycmVjdFVybCkge1xuICAgICAgICBkaXNhYmxlZEZvckRvbWFpbiA9IENsaXF6QURCLmFkQmxvY2tlci5pc0RvbWFpbkluQmxhY2tsaXN0KGN1cnJlbnRVUkwpO1xuICAgICAgICBkaXNhYmxlZEZvclVybCA9IENsaXF6QURCLmFkQmxvY2tlci5pc1VybEluQmxhY2tsaXN0KGN1cnJlbnRVUkwpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBkaXNhYmxlVXJsID0gY2hlY2tCb3goXG4gICAgICAgIGRvYyxcbiAgICAgICAgJ2NsaXF6LWFkYi11cmwnLFxuICAgICAgICB1dGlscy5nZXRMb2NhbGl6ZWRTdHJpbmcoJ2FkYi1tZW51LWRpc2FibGUtdXJsJyksXG4gICAgICAgIHRydWUsXG4gICAgICAgICgpID0+IHsgQ2xpcXpBREIuYWRCbG9ja2VyLnRvZ2dsZVVybChjdXJyZW50VVJMKTsgfSxcbiAgICAgICAgZGlzYWJsZWRGb3JVcmxcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0IGRpc2FibGVEb21haW4gPSBjaGVja0JveChcbiAgICAgICAgZG9jLFxuICAgICAgICAnY2xpcXotYWRiLWRvbWFpbicsXG4gICAgICAgIHV0aWxzLmdldExvY2FsaXplZFN0cmluZygnYWRiLW1lbnUtZGlzYWJsZS1kb21haW4nKSxcbiAgICAgICAgdHJ1ZSxcbiAgICAgICAgKCkgPT4geyBDbGlxekFEQi5hZEJsb2NrZXIudG9nZ2xlVXJsKGN1cnJlbnRVUkwsIHRydWUpOyB9LFxuICAgICAgICBkaXNhYmxlZEZvckRvbWFpblxuICAgICAgKTtcblxuICAgICAgLy8gV2UgZGlzYWJsZWQgdGhlIG9wdGlvbiBvZiBhZGRpbmcgYSBjdXN0b20gcnVsZSBmb3IgVVJMXG4gICAgICAvLyBpbiBjYXNlIHRoZSB3aG9sZSBkb21haW4gaXMgZGlzYWJsZWRcbiAgICAgIGRpc2FibGVVcmwuc2V0QXR0cmlidXRlKCdkaXNhYmxlZCcsIGFkYkRpc2FibGVkIHx8IGRpc2FibGVkRm9yRG9tYWluIHx8ICFpc0NvcnJlY3RVcmwpO1xuICAgICAgZGlzYWJsZURvbWFpbi5zZXRBdHRyaWJ1dGUoJ2Rpc2FibGVkJywgYWRiRGlzYWJsZWQgfHwgIWlzQ29ycmVjdFVybCk7XG5cbiAgICAgIGFkYlBvcHVwLmFwcGVuZENoaWxkKGRpc2FibGVVcmwpO1xuICAgICAgYWRiUG9wdXAuYXBwZW5kQ2hpbGQoZGlzYWJsZURvbWFpbik7XG4gICAgICBhZGJQb3B1cC5hcHBlbmRDaGlsZChkb2MuY3JlYXRlRWxlbWVudCgnbWVudXNlcGFyYXRvcicpKTtcblxuICAgICAgT2JqZWN0LmtleXMoQURCX1BSRUZfVkFMVUVTKS5mb3JFYWNoKG5hbWUgPT4ge1xuICAgICAgICBjb25zdCBpdGVtID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ21lbnVpdGVtJyk7XG5cbiAgICAgICAgaXRlbS5zZXRBdHRyaWJ1dGUoXG4gICAgICAgICAgJ2xhYmVsJyxcbiAgICAgICAgICB1dGlscy5nZXRMb2NhbGl6ZWRTdHJpbmcoYGFkYi1tZW51LW9wdGlvbi0ke25hbWUudG9Mb3dlckNhc2UoKX1gKSk7XG4gICAgICAgIGl0ZW0uc2V0QXR0cmlidXRlKCdjbGFzcycsICdtZW51aXRlbS1pY29uaWMnKTtcbiAgICAgICAgaXRlbS5vcHRpb24gPSBBREJfUFJFRl9WQUxVRVNbbmFtZV07XG5cbiAgICAgICAgaWYgKHV0aWxzLmdldFByZWYoQURCX1BSRUYsIEFEQl9QUkVGX1ZBTFVFUy5EaXNhYmxlZCkgPT09IGl0ZW0ub3B0aW9uKSB7XG4gICAgICAgICAgaXRlbS5zdHlsZS5saXN0U3R5bGVJbWFnZSA9IGB1cmwoJHt1dGlscy5TS0lOX1BBVEh9Y2hlY2ttYXJrLnBuZylgO1xuICAgICAgICB9XG5cbiAgICAgICAgaXRlbS5hZGRFdmVudExpc3RlbmVyKCdjb21tYW5kJywgKCkgPT4ge1xuICAgICAgICAgIHV0aWxzLnNldFByZWYoQURCX1BSRUYsIGl0ZW0ub3B0aW9uKTtcbiAgICAgICAgICBpZiAoYWRiRW5hYmxlZCgpICYmICF3aW4uYWRiaW5pdCkge1xuICAgICAgICAgICAgQ2xpcXpBREIuaW5pdFdpbmRvdyh3aW4pO1xuICAgICAgICAgICAgd2luLmFkYmluaXQgPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoIWFkYkVuYWJsZWQoKSAmJiB3aW4uYWRiaW5pdCkge1xuICAgICAgICAgICAgQ2xpcXpBREIudW5sb2FkV2luZG93KHdpbik7XG4gICAgICAgICAgICB3aW4uYWRiaW5pdCA9IGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgICB1dGlscy50ZWxlbWV0cnkoe1xuICAgICAgICAgICAgdHlwZTogJ2FjdGl2aXR5JyxcbiAgICAgICAgICAgIGFjdGlvbjogJ2NsaXF6X21lbnVfYnV0dG9uJyxcbiAgICAgICAgICAgIGJ1dHRvbl9uYW1lOiBgYWRiX29wdGlvbl8ke2l0ZW0ub3B0aW9ufWAsXG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sIGZhbHNlKTtcblxuICAgICAgICBhZGJQb3B1cC5hcHBlbmRDaGlsZChpdGVtKTtcbiAgICAgIH0pO1xuXG4gICAgICBhZGJQb3B1cC5hcHBlbmRDaGlsZChkb2MuY3JlYXRlRWxlbWVudCgnbWVudXNlcGFyYXRvcicpKTtcblxuICAgICAgYWRiUG9wdXAuYXBwZW5kQ2hpbGQoXG4gICAgICAgIHNpbXBsZUJ0bihcbiAgICAgICAgICBkb2MsXG4gICAgICAgICAgQ2xpcXpVdGlscy5nZXRMb2NhbGl6ZWRTdHJpbmcoJ2FkYi1tZW51LW1vcmUnKSxcbiAgICAgICAgICAoKSA9PiB7IHV0aWxzLm9wZW5UYWJJbldpbmRvdyh3aW4sICdodHRwczovL2NsaXF6LmNvbS93aHljbGlxei9hZGJsb2NraW5nJyk7IH0sXG4gICAgICAgICAgJ2NsaXF6LWFkYi1tb3JlJ1xuICAgICAgICApXG4gICAgICApO1xuICAgIH0pO1xuXG4gICAgYWRiQnRuLmFwcGVuZENoaWxkKGFkYlBvcHVwKTtcblxuICAgIHJldHVybiBhZGJCdG47XG4gIH1cblxuICBjcmVhdGVCdXR0b25JdGVtKCkge1xuICAgIGlmIChhZGJBQlRlc3RFbmFibGVkKCkpIHtcbiAgICAgIHJldHVybiBbdGhpcy5jcmVhdGVBZGJCdXR0b24oKV07XG4gICAgfVxuICAgIHJldHVybiBbXTtcbiAgfVxuXG4gIHN0YXR1cygpIHtcbiAgICBpZiAoIWFkYkFCVGVzdEVuYWJsZWQoKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGNvbnN0IGN1cnJlbnRVUkwgPSB0aGlzLndpbmRvdy5nQnJvd3Nlci5jdXJyZW50VVJJLnNwZWM7XG4gICAgY29uc3QgYWRiRGlzYWJsZWQgPSAhYWRiRW5hYmxlZCgpO1xuXG4gICAgY29uc3QgaXNDb3JyZWN0VXJsID0gdXRpbHMuaXNVcmwoY3VycmVudFVSTCk7XG4gICAgbGV0IGRpc2FibGVkRm9yVXJsID0gZmFsc2U7XG4gICAgbGV0IGRpc2FibGVkRm9yRG9tYWluID0gZmFsc2U7XG4gICAgbGV0IGRpc2FibGVkRXZlcnl3aGVyZSA9IGZhbHNlO1xuXG4gICAgLy8gQ2hlY2sgaWYgYWRibG9ja2VyIGlzIGRpc2FibGVkIG9uIHRoaXMgcGFnZVxuICAgIGlmIChpc0NvcnJlY3RVcmwpIHtcbiAgICAgIGRpc2FibGVkRm9yRG9tYWluID0gQ2xpcXpBREIuYWRCbG9ja2VyLmlzRG9tYWluSW5CbGFja2xpc3QoY3VycmVudFVSTCk7XG4gICAgICBkaXNhYmxlZEZvclVybCA9IENsaXF6QURCLmFkQmxvY2tlci5pc1VybEluQmxhY2tsaXN0KGN1cnJlbnRVUkwpO1xuICAgIH1cblxuICAgIGNvbnN0IHN0YXRlID0gT2JqZWN0LmtleXMoQURCX1BSRUZfVkFMVUVTKS5tYXAobmFtZSA9PiAoe1xuICAgICAgbmFtZTogbmFtZS50b0xvd2VyQ2FzZSgpLFxuICAgICAgc2VsZWN0ZWQ6IHV0aWxzLmdldFByZWYoQURCX1BSRUYsIEFEQl9QUkVGX1ZBTFVFUy5EaXNhYmxlZCkgPT0gQURCX1BSRUZfVkFMVUVTW25hbWVdLFxuICAgIH0pKTtcblxuICAgIGNvbnN0IHJlcG9ydCA9IENsaXF6QURCLmFkYlN0YXRzLnJlcG9ydChjdXJyZW50VVJMKTtcbiAgICBjb25zdCBlbmFibGVkID0gQ2xpcXpVdGlscy5nZXRQcmVmKEFEQl9QUkVGLCBmYWxzZSkgIT09IEFEQl9QUkVGX1ZBTFVFUy5EaXNhYmxlZDtcblxuICAgIGlmIChpc0NvcnJlY3RVcmwpIHtcbiAgICAgIGRpc2FibGVkRm9yRG9tYWluID0gQ2xpcXpBREIuYWRCbG9ja2VyLmlzRG9tYWluSW5CbGFja2xpc3QoY3VycmVudFVSTCk7XG4gICAgICBkaXNhYmxlZEZvclVybCA9IENsaXF6QURCLmFkQmxvY2tlci5pc1VybEluQmxhY2tsaXN0KGN1cnJlbnRVUkwpO1xuICAgIH1cbiAgICBkaXNhYmxlZEV2ZXJ5d2hlcmUgPSAhZW5hYmxlZCAmJiAhZGlzYWJsZWRGb3JVcmwgJiYgIWRpc2FibGVkRm9yRG9tYWluXG5cbiAgICByZXR1cm4ge1xuICAgICAgdmlzaWJsZTogdHJ1ZSxcbiAgICAgIGVuYWJsZWQ6IGVuYWJsZWQgJiYgIWRpc2FibGVkRm9yRG9tYWluICYmICFkaXNhYmxlZEZvclVybCxcbiAgICAgIG9wdGltaXplZDogQ2xpcXpVdGlscy5nZXRQcmVmKEFEQl9QUkVGX09QVElNSVpFRCwgZmFsc2UpID09IHRydWUsXG4gICAgICBkaXNhYmxlZEZvclVybDogZGlzYWJsZWRGb3JVcmwsXG4gICAgICBkaXNhYmxlZEZvckRvbWFpbjogZGlzYWJsZWRGb3JEb21haW4sXG4gICAgICBkaXNhYmxlZEV2ZXJ5d2hlcmU6IGRpc2FibGVkRXZlcnl3aGVyZSxcbiAgICAgIHRvdGFsQ291bnQ6IHJlcG9ydC50b3RhbENvdW50LFxuICAgICAgYWR2ZXJ0aXNlcnNMaXN0OiByZXBvcnQuYWR2ZXJ0aXNlcnNMaXN0LFxuICAgICAgc3RhdGU6ICghZW5hYmxlZCkgPyAnb2ZmJyA6IChkaXNhYmxlZEZvclVybCB8fCBkaXNhYmxlZEZvckRvbWFpbiA/ICdvZmYnIDogJ2FjdGl2ZScpLFxuICAgICAgb2ZmX3N0YXRlOiBkaXNhYmxlZEZvclVybCA/ICdvZmZfd2Vic2l0ZScgOiAoZGlzYWJsZWRGb3JEb21haW4gPyAnb2ZmX2RvbWFpbicgOiAoZGlzYWJsZWRFdmVyeXdoZXJlID8gJ29mZl9hbGwnIDogJ29mZl93ZWJzaXRlJykpXG4gICAgfVxuICB9XG59XG4iXX0=