System.register('antitracking/window', ['antitracking/background', 'antitracking/attrack', 'core/cliqz'], function (_export) {
  'use strict';

  var background, CliqzAttrack, utils, events, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function onLocationChange(ev) {
    if (this.interval) {
      CliqzUtils.clearInterval(this.interval);
    }

    var counter = 8;

    this.updateBadge();

    this.interval = CliqzUtils.setInterval((function () {
      this.updateBadge();

      counter -= 1;
      if (counter <= 0) {
        CliqzUtils.clearInterval(this.interval);
      }
    }).bind(this), 2000);
  }

  function onPrefChange(pref) {
    if (pref == CliqzAttrack.ENABLE_PREF && CliqzAttrack.isEnabled() != this.enabled) {
      if (CliqzAttrack.isEnabled()) {
        CliqzAttrack.initWindow(this.window);
      } else {
        CliqzAttrack.unloadWindow(this.window);
      }
      this.enabled = CliqzAttrack.isEnabled();
    }
  }return {
    setters: [function (_antitrackingBackground) {
      background = _antitrackingBackground['default'];
    }, function (_antitrackingAttrack) {
      CliqzAttrack = _antitrackingAttrack['default'];
    }, function (_coreCliqz) {
      utils = _coreCliqz.utils;
      events = _coreCliqz.events;
    }],
    execute: function () {
      ;

      _default = (function () {
        function _default(config) {
          _classCallCheck(this, _default);

          this.window = config.window;

          this.popup = background.popup;

          if (this.popup) {
            this.onLocationChange = onLocationChange.bind(this);
          }
          this.onPrefChange = onPrefChange.bind(this);
          this.enabled = false;
        }

        _createClass(_default, [{
          key: 'init',
          value: function init() {
            if (this.popup) {
              CliqzEvents.sub("core.location_change", this.onLocationChange);
              // Better to wait for first window to set the state of the button
              // otherways button may not be initialized yet
              this.popup.updateState(utils.getWindow(), CliqzAttrack.isEnabled());
            }
            this.onPrefChange(CliqzAttrack.ENABLE_PREF);
            CliqzEvents.sub("prefchange", this.onPrefChange);
          }
        }, {
          key: 'unload',
          value: function unload() {
            if (this.popup) {
              CliqzEvents.un_sub("core.location_change", this.onLocationChange);
              CliqzUtils.clearInterval(this.interval);
            }
            if (CliqzAttrack.isEnabled()) {
              CliqzAttrack.unloadWindow(this.window);
            }
            CliqzEvents.un_sub("prefchange", this.onPrefChange);
          }
        }, {
          key: 'updateBadge',
          value: function updateBadge() {
            if (this.window !== CliqzUtils.getWindow()) {
              return;
            }

            var info = CliqzAttrack.getCurrentTabBlockingInfo(),
                count;

            try {
              count = info.cookies.blocked + info.requests.unsafe;
            } catch (e) {
              count = 0;
            }

            // do not display number if site is whitelisted
            if (CliqzAttrack.isSourceWhitelisted(info.hostname)) {
              count = 0;
            }

            this.popup.setBadge(this.window, count);
          }
        }, {
          key: 'createButtonItem',
          value: function createButtonItem() {
            if (!background.buttonEnabled) return;

            var win = this.window,
                doc = win.document,
                menu = doc.createElement('menu'),
                menupopup = doc.createElement('menupopup');

            menu.setAttribute('label', utils.getLocalizedString('attrack-force-block-setting'));

            var filter_levels = {
              'false': {
                name: utils.getLocalizedString('attrack-force-block-off'),
                selected: false
              },
              'true': {
                name: utils.getLocalizedString('attrack-force-block-on'),
                selected: false
              }
            };
            filter_levels[utils.getPref('attrackForceBlock', false).toString()].selected = true;

            for (var level in filter_levels) {
              var item = doc.createElement('menuitem');
              item.setAttribute('label', filter_levels[level].name);
              item.setAttribute('class', 'menuitem-iconic');

              if (filter_levels[level].selected) {
                item.style.listStyleImage = 'url(chrome://cliqz/content/static/skin/checkmark.png)';
              }

              item.filter_level = level;
              item.addEventListener('command', function (event) {
                if (this.filter_level === 'true') {
                  utils.setPref('attrackForceBlock', true);
                  utils.telemetry({ type: 'antitracking', action: 'click', target: 'attrack_qbutton_strict' });
                } else {
                  utils.clearPref('attrackForceBlock');
                  utils.telemetry({ type: 'antitracking', action: 'click', target: 'attrack_qbutton_default' });
                }
                utils.setTimeout(win.CLIQZ.Core.refreshButtons, 0);
              }, false);

              menupopup.appendChild(item);
            };

            var learnMore = this.window.CLIQZ.Core.createSimpleBtn(doc, utils.getLocalizedString('learnMore'), (function () {
              CLIQZEnvironment.openTabInWindow(this.window, 'https://cliqz.com/whycliqz/anti-tracking');
            }).bind(this), 'attrack_learn_more');
            learnMore.setAttribute('class', 'menuitem-iconic');
            menupopup.appendChild(doc.createElement('menuseparator'));
            menupopup.appendChild(learnMore);

            menu.appendChild(menupopup);
            return menu;
          }
        }]);

        return _default;
      })();

      _export('default', _default);

      ;
    }
  };
});
//# sourceMappingURL=data:application/json;base64,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RixNQUFNO0FBQ0wsdUJBQUssQ0FBQyxTQUFTLENBQUMsbUJBQW1CLENBQUMsQ0FBQztBQUNyQyx1QkFBSyxDQUFDLFNBQVMsQ0FBRSxFQUFFLElBQUksRUFBRSxjQUFjLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUseUJBQXlCLEVBQUMsQ0FBRSxDQUFDO2lCQUNoRztBQUNELHFCQUFLLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLGNBQWMsRUFBRSxDQUFDLENBQUMsQ0FBQztlQUNwRCxFQUFFLEtBQUssQ0FBQyxDQUFDOztBQUVWLHVCQUFTLENBQUMsV0FBVyxDQUFDLElBQUksQ0FBQyxDQUFDO2FBQzdCLENBQUM7O0FBRUYsZ0JBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxlQUFlLENBQ2xELEdBQUcsRUFDSCxLQUFLLENBQUMsa0JBQWtCLENBQUMsV0FBVyxDQUFDLEVBQ3JDLENBQUEsWUFBVztBQUNULDhCQUFnQixDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLDBDQUEwQyxDQUFDLENBQUM7YUFDM0YsQ0FBQSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFDWixvQkFBb0IsQ0FDdkIsQ0FBQztBQUNGLHFCQUFTLENBQUMsWUFBWSxDQUFDLE9BQU8sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO0FBQ25ELHFCQUFTLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQztBQUMxRCxxQkFBUyxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsQ0FBQzs7QUFFakMsZ0JBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDNUIsbUJBQU8sSUFBSSxDQUFDO1dBRWI7Ozs7Ozs7O0FBRUYsT0FBQyIsImZpbGUiOiJhbnRpdHJhY2tpbmcvd2luZG93LmVzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGJhY2tncm91bmQgZnJvbSAnYW50aXRyYWNraW5nL2JhY2tncm91bmQnO1xuaW1wb3J0IENsaXF6QXR0cmFjayBmcm9tICdhbnRpdHJhY2tpbmcvYXR0cmFjayc7XG5pbXBvcnQgeyB1dGlscywgZXZlbnRzIH0gZnJvbSAnY29yZS9jbGlxeic7XG5cbmZ1bmN0aW9uIG9uTG9jYXRpb25DaGFuZ2UoZXYpIHtcbiAgaWYodGhpcy5pbnRlcnZhbCkgeyBDbGlxelV0aWxzLmNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbCk7IH1cblxuICB2YXIgY291bnRlciA9IDg7XG5cbiAgdGhpcy51cGRhdGVCYWRnZSgpO1xuXG4gIHRoaXMuaW50ZXJ2YWwgPSBDbGlxelV0aWxzLnNldEludGVydmFsKGZ1bmN0aW9uICgpIHtcbiAgICB0aGlzLnVwZGF0ZUJhZGdlKCk7XG5cbiAgICBjb3VudGVyIC09IDE7XG4gICAgaWYgKGNvdW50ZXIgPD0gMCkge1xuICAgICAgQ2xpcXpVdGlscy5jbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xuICAgIH1cbiAgfS5iaW5kKHRoaXMpLCAyMDAwKTtcbn1cblxuZnVuY3Rpb24gb25QcmVmQ2hhbmdlKHByZWYpIHtcbiAgaWYgKHByZWYgPT0gQ2xpcXpBdHRyYWNrLkVOQUJMRV9QUkVGICYmIENsaXF6QXR0cmFjay5pc0VuYWJsZWQoKSAhPSB0aGlzLmVuYWJsZWQpIHtcbiAgICBpZiAoQ2xpcXpBdHRyYWNrLmlzRW5hYmxlZCgpKSB7XG4gICAgICBDbGlxekF0dHJhY2suaW5pdFdpbmRvdyh0aGlzLndpbmRvdyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIENsaXF6QXR0cmFjay51bmxvYWRXaW5kb3codGhpcy53aW5kb3cpO1xuICAgIH1cbiAgICB0aGlzLmVuYWJsZWQgPSBDbGlxekF0dHJhY2suaXNFbmFibGVkKCk7XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHtcblxuICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICB0aGlzLndpbmRvdyA9IGNvbmZpZy53aW5kb3c7XG5cbiAgICB0aGlzLnBvcHVwID0gYmFja2dyb3VuZC5wb3B1cDtcblxuICAgIGlmICggdGhpcy5wb3B1cCApIHtcbiAgICAgIHRoaXMub25Mb2NhdGlvbkNoYW5nZSA9IG9uTG9jYXRpb25DaGFuZ2UuYmluZCh0aGlzKTtcbiAgICB9XG4gICAgdGhpcy5vblByZWZDaGFuZ2UgPSBvblByZWZDaGFuZ2UuYmluZCh0aGlzKTtcbiAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgfVxuXG4gIGluaXQoKSB7XG4gICAgaWYgKCB0aGlzLnBvcHVwICkge1xuICAgICAgQ2xpcXpFdmVudHMuc3ViKFwiY29yZS5sb2NhdGlvbl9jaGFuZ2VcIiwgdGhpcy5vbkxvY2F0aW9uQ2hhbmdlKTtcbiAgICAgIC8vIEJldHRlciB0byB3YWl0IGZvciBmaXJzdCB3aW5kb3cgdG8gc2V0IHRoZSBzdGF0ZSBvZiB0aGUgYnV0dG9uXG4gICAgICAvLyBvdGhlcndheXMgYnV0dG9uIG1heSBub3QgYmUgaW5pdGlhbGl6ZWQgeWV0XG4gICAgICB0aGlzLnBvcHVwLnVwZGF0ZVN0YXRlKHV0aWxzLmdldFdpbmRvdygpLCBDbGlxekF0dHJhY2suaXNFbmFibGVkKCkpO1xuICAgIH1cbiAgICB0aGlzLm9uUHJlZkNoYW5nZShDbGlxekF0dHJhY2suRU5BQkxFX1BSRUYpO1xuICAgIENsaXF6RXZlbnRzLnN1YihcInByZWZjaGFuZ2VcIiwgdGhpcy5vblByZWZDaGFuZ2UpO1xuICB9XG5cbiAgdW5sb2FkKCkge1xuICAgIGlmICggdGhpcy5wb3B1cCApIHtcbiAgICAgIENsaXF6RXZlbnRzLnVuX3N1YihcImNvcmUubG9jYXRpb25fY2hhbmdlXCIsIHRoaXMub25Mb2NhdGlvbkNoYW5nZSk7XG4gICAgICBDbGlxelV0aWxzLmNsZWFySW50ZXJ2YWwodGhpcy5pbnRlcnZhbCk7XG4gICAgfVxuICAgIGlmIChDbGlxekF0dHJhY2suaXNFbmFibGVkKCkpIHtcbiAgICAgIENsaXF6QXR0cmFjay51bmxvYWRXaW5kb3codGhpcy53aW5kb3cpO1xuICAgIH1cbiAgICBDbGlxekV2ZW50cy51bl9zdWIoXCJwcmVmY2hhbmdlXCIsIHRoaXMub25QcmVmQ2hhbmdlKTtcbiAgfVxuXG4gIHVwZGF0ZUJhZGdlKCkge1xuICAgIGlmICh0aGlzLndpbmRvdyAhPT0gQ2xpcXpVdGlscy5nZXRXaW5kb3coKSkgeyByZXR1cm47IH1cblxuICAgIHZhciBpbmZvID0gQ2xpcXpBdHRyYWNrLmdldEN1cnJlbnRUYWJCbG9ja2luZ0luZm8oKSwgY291bnQ7XG5cbiAgICB0cnkge1xuICAgICAgY291bnQgPSBpbmZvLmNvb2tpZXMuYmxvY2tlZCArIGluZm8ucmVxdWVzdHMudW5zYWZlO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgY291bnQgPSAwO1xuICAgIH1cblxuICAgIC8vIGRvIG5vdCBkaXNwbGF5IG51bWJlciBpZiBzaXRlIGlzIHdoaXRlbGlzdGVkXG4gICAgaWYgKENsaXF6QXR0cmFjay5pc1NvdXJjZVdoaXRlbGlzdGVkKGluZm8uaG9zdG5hbWUpKSB7XG4gICAgICBjb3VudCA9IDA7XG4gICAgfVxuXG4gICAgdGhpcy5wb3B1cC5zZXRCYWRnZSh0aGlzLndpbmRvdywgY291bnQpO1xuICB9XG5cbiAgY3JlYXRlQnV0dG9uSXRlbSgpIHtcbiAgICBpZiAoIWJhY2tncm91bmQuYnV0dG9uRW5hYmxlZCkgcmV0dXJuO1xuXG4gICAgdmFyIHdpbiA9IHRoaXMud2luZG93LFxuICAgICAgICBkb2MgPSB3aW4uZG9jdW1lbnQsXG4gICAgICAgIG1lbnUgPSBkb2MuY3JlYXRlRWxlbWVudCgnbWVudScpLFxuICAgICAgICBtZW51cG9wdXAgPSBkb2MuY3JlYXRlRWxlbWVudCgnbWVudXBvcHVwJyk7XG5cbiAgICBtZW51LnNldEF0dHJpYnV0ZSgnbGFiZWwnLCB1dGlscy5nZXRMb2NhbGl6ZWRTdHJpbmcoJ2F0dHJhY2stZm9yY2UtYmxvY2stc2V0dGluZycpKTtcblxuICAgIHZhciBmaWx0ZXJfbGV2ZWxzID0ge1xuICAgICAgZmFsc2U6IHtcbiAgICAgICAgbmFtZTogdXRpbHMuZ2V0TG9jYWxpemVkU3RyaW5nKCdhdHRyYWNrLWZvcmNlLWJsb2NrLW9mZicpLFxuICAgICAgICBzZWxlY3RlZDogZmFsc2VcbiAgICAgIH0sXG4gICAgICB0cnVlOiB7XG4gICAgICAgIG5hbWU6IHV0aWxzLmdldExvY2FsaXplZFN0cmluZygnYXR0cmFjay1mb3JjZS1ibG9jay1vbicpLFxuICAgICAgICBzZWxlY3RlZDogZmFsc2VcbiAgICAgIH1cbiAgICB9O1xuICAgIGZpbHRlcl9sZXZlbHNbdXRpbHMuZ2V0UHJlZignYXR0cmFja0ZvcmNlQmxvY2snLCBmYWxzZSkudG9TdHJpbmcoKV0uc2VsZWN0ZWQgPSB0cnVlO1xuXG4gICAgZm9yKHZhciBsZXZlbCBpbiBmaWx0ZXJfbGV2ZWxzKSB7XG4gICAgICB2YXIgaXRlbSA9IGRvYy5jcmVhdGVFbGVtZW50KCdtZW51aXRlbScpO1xuICAgICAgaXRlbS5zZXRBdHRyaWJ1dGUoJ2xhYmVsJywgZmlsdGVyX2xldmVsc1tsZXZlbF0ubmFtZSk7XG4gICAgICBpdGVtLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnbWVudWl0ZW0taWNvbmljJyk7XG5cbiAgICAgIGlmKGZpbHRlcl9sZXZlbHNbbGV2ZWxdLnNlbGVjdGVkKXtcbiAgICAgICAgaXRlbS5zdHlsZS5saXN0U3R5bGVJbWFnZSA9ICd1cmwoY2hyb21lOi8vY2xpcXovY29udGVudC9zdGF0aWMvc2tpbi9jaGVja21hcmsucG5nKSc7XG4gICAgICB9XG5cbiAgICAgIGl0ZW0uZmlsdGVyX2xldmVsID0gbGV2ZWw7XG4gICAgICBpdGVtLmFkZEV2ZW50TGlzdGVuZXIoJ2NvbW1hbmQnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICBpZiAoIHRoaXMuZmlsdGVyX2xldmVsID09PSAndHJ1ZScgKSB7XG4gICAgICAgICAgdXRpbHMuc2V0UHJlZignYXR0cmFja0ZvcmNlQmxvY2snLCB0cnVlKTtcbiAgICAgICAgICB1dGlscy50ZWxlbWV0cnkoIHsgdHlwZTogJ2FudGl0cmFja2luZycsIGFjdGlvbjogJ2NsaWNrJywgdGFyZ2V0OiAnYXR0cmFja19xYnV0dG9uX3N0cmljdCd9ICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdXRpbHMuY2xlYXJQcmVmKCdhdHRyYWNrRm9yY2VCbG9jaycpO1xuICAgICAgICAgIHV0aWxzLnRlbGVtZXRyeSggeyB0eXBlOiAnYW50aXRyYWNraW5nJywgYWN0aW9uOiAnY2xpY2snLCB0YXJnZXQ6ICdhdHRyYWNrX3FidXR0b25fZGVmYXVsdCd9ICk7XG4gICAgICAgIH1cbiAgICAgICAgdXRpbHMuc2V0VGltZW91dCh3aW4uQ0xJUVouQ29yZS5yZWZyZXNoQnV0dG9ucywgMCk7XG4gICAgICB9LCBmYWxzZSk7XG5cbiAgICAgIG1lbnVwb3B1cC5hcHBlbmRDaGlsZChpdGVtKTtcbiAgICB9O1xuXG4gICAgdmFyIGxlYXJuTW9yZSA9IHRoaXMud2luZG93LkNMSVFaLkNvcmUuY3JlYXRlU2ltcGxlQnRuKFxuICAgICAgICBkb2MsXG4gICAgICAgIHV0aWxzLmdldExvY2FsaXplZFN0cmluZygnbGVhcm5Nb3JlJyksXG4gICAgICAgIGZ1bmN0aW9uKCkge1xuICAgICAgICAgIENMSVFaRW52aXJvbm1lbnQub3BlblRhYkluV2luZG93KHRoaXMud2luZG93LCAnaHR0cHM6Ly9jbGlxei5jb20vd2h5Y2xpcXovYW50aS10cmFja2luZycpO1xuICAgICAgICB9LmJpbmQodGhpcyksXG4gICAgICAgICdhdHRyYWNrX2xlYXJuX21vcmUnXG4gICAgKTtcbiAgICBsZWFybk1vcmUuc2V0QXR0cmlidXRlKCdjbGFzcycsICdtZW51aXRlbS1pY29uaWMnKTtcbiAgICBtZW51cG9wdXAuYXBwZW5kQ2hpbGQoZG9jLmNyZWF0ZUVsZW1lbnQoJ21lbnVzZXBhcmF0b3InKSk7XG4gICAgbWVudXBvcHVwLmFwcGVuZENoaWxkKGxlYXJuTW9yZSk7XG5cbiAgICBtZW51LmFwcGVuZENoaWxkKG1lbnVwb3B1cCk7XG4gICAgcmV0dXJuIG1lbnU7XG5cbiAgfVxuXG59O1xuIl19