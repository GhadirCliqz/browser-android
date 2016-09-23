System.register('antitracking/window', ['antitracking/background', 'antitracking/attrack', 'core/cliqz', 'q-button/buttons', 'antitracking/url'], function (_export) {
  'use strict';

  var background, CliqzAttrack, utils, events, simpleBtn, URLInfo, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function onLocationChange(ev) {
    if (this.interval) {
      utils.clearInterval(this.interval);
    }

    var counter = 8;

    this.updateBadge();

    this.interval = utils.setInterval((function () {
      this.updateBadge();

      counter -= 1;
      if (counter <= 0) {
        utils.clearInterval(this.interval);
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
    }, function (_qButtonButtons) {
      simpleBtn = _qButtonButtons.simpleBtn;
    }, function (_antitrackingUrl) {
      URLInfo = _antitrackingUrl.URLInfo;
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
              events.sub("core.location_change", this.onLocationChange);
              // Better to wait for first window to set the state of the button
              // otherways button may not be initialized yet
              this.popup.updateState(utils.getWindow(), CliqzAttrack.isEnabled());
            }
            this.onPrefChange(CliqzAttrack.ENABLE_PREF);
            events.sub("prefchange", this.onPrefChange);
          }
        }, {
          key: 'unload',
          value: function unload() {
            if (this.popup) {
              events.un_sub("core.location_change", this.onLocationChange);
              utils.clearInterval(this.interval);
            }
            if (CliqzAttrack.isEnabled()) {
              CliqzAttrack.unloadWindow(this.window);
            }
            events.un_sub("prefchange", this.onPrefChange);
          }
        }, {
          key: 'updateBadge',
          value: function updateBadge() {
            if (this.window !== utils.getWindow()) {
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

            utils.callWindowAction(this.window, 'control-center', 'setBadge', [count]);
          }
        }, {
          key: 'createAttrackButton',
          value: function createAttrackButton() {
            var win = this.window,
                doc = win.document,
                attrackBtn = doc.createElement('menu'),
                attrackPopup = doc.createElement('menupopup');

            attrackBtn.setAttribute('label', utils.getLocalizedString('attrack-force-block-setting'));

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
              }, false);

              attrackPopup.appendChild(item);
            };

            var learnMore = simpleBtn(doc, utils.getLocalizedString('learnMore'), (function () {
              utils.openTabInWindow(this.window, 'https://cliqz.com/whycliqz/anti-tracking');
            }).bind(this), 'attrack_learn_more');
            learnMore.setAttribute('class', 'menuitem-iconic');
            attrackPopup.appendChild(doc.createElement('menuseparator'));
            attrackPopup.appendChild(learnMore);

            attrackBtn.appendChild(attrackPopup);

            return attrackBtn;
          }
        }, {
          key: 'createButtonItem',
          value: function createButtonItem() {
            if (!background.buttonEnabled) return [];

            return [this.createAttrackButton()];
          }
        }, {
          key: 'status',
          value: function status() {
            if (background.buttonEnabled) {
              var info = CliqzAttrack.getCurrentTabBlockingInfo(this.window.gBrowser),
                  ps = info.ps,
                  hostname = URLInfo.get(this.window.gBrowser.currentURI.spec).hostname,
                  isWhitelisted = CliqzAttrack.isSourceWhitelisted(hostname),
                  enabled = utils.getPref('antiTrackTest', true) && !isWhitelisted;

              return {
                visible: true,
                strict: utils.getPref('attrackForceBlock', false),
                hostname: hostname,
                cookiesCount: info.cookies.blocked,
                requestsCount: info.requests.unsafe,
                totalCount: info.cookies.blocked + info.requests.unsafe,
                enabled: enabled,
                isWhitelisted: isWhitelisted || enabled,
                reload: info.reload || false,
                trackersList: info,
                ps: ps,
                state: enabled ? 'active' : isWhitelisted ? 'inactive' : 'critical'
              };
            }
          }
        }]);

        return _default;
      })();

      _export('default', _default);

      ;
    }
  };
});
//# sourceMappingURL=data:application/json;base64,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InNvdXJjZXNDb250ZW50IjpbImltcG9ydCBiYWNrZ3JvdW5kIGZyb20gJ2FudGl0cmFja2luZy9iYWNrZ3JvdW5kJztcbmltcG9ydCBDbGlxekF0dHJhY2sgZnJvbSAnYW50aXRyYWNraW5nL2F0dHJhY2snO1xuaW1wb3J0IHsgdXRpbHMsIGV2ZW50cyB9IGZyb20gJ2NvcmUvY2xpcXonO1xuaW1wb3J0IHsgc2ltcGxlQnRuIH0gZnJvbSAncS1idXR0b24vYnV0dG9ucyc7XG5pbXBvcnQgeyBVUkxJbmZvIH0gZnJvbSAnYW50aXRyYWNraW5nL3VybCc7XG5cbmZ1bmN0aW9uIG9uTG9jYXRpb25DaGFuZ2UoZXYpIHtcbiAgaWYodGhpcy5pbnRlcnZhbCkgeyB1dGlscy5jbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpOyB9XG5cbiAgdmFyIGNvdW50ZXIgPSA4O1xuXG4gIHRoaXMudXBkYXRlQmFkZ2UoKTtcblxuICB0aGlzLmludGVydmFsID0gdXRpbHMuc2V0SW50ZXJ2YWwoZnVuY3Rpb24gKCkge1xuICAgIHRoaXMudXBkYXRlQmFkZ2UoKTtcblxuICAgIGNvdW50ZXIgLT0gMTtcbiAgICBpZiAoY291bnRlciA8PSAwKSB7XG4gICAgICB1dGlscy5jbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xuICAgIH1cbiAgfS5iaW5kKHRoaXMpLCAyMDAwKTtcbn1cblxuZnVuY3Rpb24gb25QcmVmQ2hhbmdlKHByZWYpIHtcbiAgaWYgKHByZWYgPT0gQ2xpcXpBdHRyYWNrLkVOQUJMRV9QUkVGICYmIENsaXF6QXR0cmFjay5pc0VuYWJsZWQoKSAhPSB0aGlzLmVuYWJsZWQpIHtcbiAgICBpZiAoQ2xpcXpBdHRyYWNrLmlzRW5hYmxlZCgpKSB7XG4gICAgICBDbGlxekF0dHJhY2suaW5pdFdpbmRvdyh0aGlzLndpbmRvdyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIENsaXF6QXR0cmFjay51bmxvYWRXaW5kb3codGhpcy53aW5kb3cpO1xuICAgIH1cbiAgICB0aGlzLmVuYWJsZWQgPSBDbGlxekF0dHJhY2suaXNFbmFibGVkKCk7XG4gIH1cbn07XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHtcblxuICBjb25zdHJ1Y3Rvcihjb25maWcpIHtcbiAgICB0aGlzLndpbmRvdyA9IGNvbmZpZy53aW5kb3c7XG5cbiAgICB0aGlzLnBvcHVwID0gYmFja2dyb3VuZC5wb3B1cDtcblxuICAgIGlmICggdGhpcy5wb3B1cCApIHtcbiAgICAgIHRoaXMub25Mb2NhdGlvbkNoYW5nZSA9IG9uTG9jYXRpb25DaGFuZ2UuYmluZCh0aGlzKTtcbiAgICB9XG4gICAgdGhpcy5vblByZWZDaGFuZ2UgPSBvblByZWZDaGFuZ2UuYmluZCh0aGlzKTtcbiAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgfVxuXG4gIGluaXQoKSB7XG4gICAgaWYgKCB0aGlzLnBvcHVwICkge1xuICAgICAgZXZlbnRzLnN1YihcImNvcmUubG9jYXRpb25fY2hhbmdlXCIsIHRoaXMub25Mb2NhdGlvbkNoYW5nZSk7XG4gICAgICAvLyBCZXR0ZXIgdG8gd2FpdCBmb3IgZmlyc3Qgd2luZG93IHRvIHNldCB0aGUgc3RhdGUgb2YgdGhlIGJ1dHRvblxuICAgICAgLy8gb3RoZXJ3YXlzIGJ1dHRvbiBtYXkgbm90IGJlIGluaXRpYWxpemVkIHlldFxuICAgICAgdGhpcy5wb3B1cC51cGRhdGVTdGF0ZSh1dGlscy5nZXRXaW5kb3coKSwgQ2xpcXpBdHRyYWNrLmlzRW5hYmxlZCgpKTtcbiAgICB9XG4gICAgdGhpcy5vblByZWZDaGFuZ2UoQ2xpcXpBdHRyYWNrLkVOQUJMRV9QUkVGKTtcbiAgICBldmVudHMuc3ViKFwicHJlZmNoYW5nZVwiLCB0aGlzLm9uUHJlZkNoYW5nZSk7XG4gIH1cblxuICB1bmxvYWQoKSB7XG4gICAgaWYgKCB0aGlzLnBvcHVwICkge1xuICAgICAgZXZlbnRzLnVuX3N1YihcImNvcmUubG9jYXRpb25fY2hhbmdlXCIsIHRoaXMub25Mb2NhdGlvbkNoYW5nZSk7XG4gICAgICB1dGlscy5jbGVhckludGVydmFsKHRoaXMuaW50ZXJ2YWwpO1xuICAgIH1cbiAgICBpZiAoQ2xpcXpBdHRyYWNrLmlzRW5hYmxlZCgpKSB7XG4gICAgICBDbGlxekF0dHJhY2sudW5sb2FkV2luZG93KHRoaXMud2luZG93KTtcbiAgICB9XG4gICAgZXZlbnRzLnVuX3N1YihcInByZWZjaGFuZ2VcIiwgdGhpcy5vblByZWZDaGFuZ2UpO1xuICB9XG5cbiAgdXBkYXRlQmFkZ2UoKSB7XG4gICAgaWYgKHRoaXMud2luZG93ICE9PSB1dGlscy5nZXRXaW5kb3coKSkgeyByZXR1cm47IH1cblxuICAgIHZhciBpbmZvID0gQ2xpcXpBdHRyYWNrLmdldEN1cnJlbnRUYWJCbG9ja2luZ0luZm8oKSwgY291bnQ7XG5cbiAgICB0cnkge1xuICAgICAgY291bnQgPSBpbmZvLmNvb2tpZXMuYmxvY2tlZCArIGluZm8ucmVxdWVzdHMudW5zYWZlO1xuICAgIH0gY2F0Y2goZSkge1xuICAgICAgY291bnQgPSAwO1xuICAgIH1cblxuICAgIC8vIGRvIG5vdCBkaXNwbGF5IG51bWJlciBpZiBzaXRlIGlzIHdoaXRlbGlzdGVkXG4gICAgaWYgKENsaXF6QXR0cmFjay5pc1NvdXJjZVdoaXRlbGlzdGVkKGluZm8uaG9zdG5hbWUpKSB7XG4gICAgICBjb3VudCA9IDA7XG4gICAgfVxuXG4gICAgdGhpcy5wb3B1cC5zZXRCYWRnZSh0aGlzLndpbmRvdywgY291bnQpO1xuXG4gICAgdXRpbHMuY2FsbFdpbmRvd0FjdGlvbihcbiAgICAgIHRoaXMud2luZG93LFxuICAgICAgJ2NvbnRyb2wtY2VudGVyJyxcbiAgICAgICdzZXRCYWRnZScsXG4gICAgICBbIGNvdW50IF1cbiAgICApO1xuICB9XG5cbiAgY3JlYXRlQXR0cmFja0J1dHRvbigpIHtcbiAgICBsZXQgd2luID0gdGhpcy53aW5kb3csXG4gICAgICAgIGRvYyA9IHdpbi5kb2N1bWVudCxcbiAgICAgICAgYXR0cmFja0J0biA9IGRvYy5jcmVhdGVFbGVtZW50KCdtZW51JyksXG4gICAgICAgIGF0dHJhY2tQb3B1cCA9IGRvYy5jcmVhdGVFbGVtZW50KCdtZW51cG9wdXAnKTtcblxuICAgIGF0dHJhY2tCdG4uc2V0QXR0cmlidXRlKCdsYWJlbCcsIHV0aWxzLmdldExvY2FsaXplZFN0cmluZygnYXR0cmFjay1mb3JjZS1ibG9jay1zZXR0aW5nJykpO1xuXG4gICAgdmFyIGZpbHRlcl9sZXZlbHMgPSB7XG4gICAgICBmYWxzZToge1xuICAgICAgICBuYW1lOiB1dGlscy5nZXRMb2NhbGl6ZWRTdHJpbmcoJ2F0dHJhY2stZm9yY2UtYmxvY2stb2ZmJyksXG4gICAgICAgIHNlbGVjdGVkOiBmYWxzZVxuICAgICAgfSxcbiAgICAgIHRydWU6IHtcbiAgICAgICAgbmFtZTogdXRpbHMuZ2V0TG9jYWxpemVkU3RyaW5nKCdhdHRyYWNrLWZvcmNlLWJsb2NrLW9uJyksXG4gICAgICAgIHNlbGVjdGVkOiBmYWxzZVxuICAgICAgfVxuICAgIH07XG4gICAgZmlsdGVyX2xldmVsc1t1dGlscy5nZXRQcmVmKCdhdHRyYWNrRm9yY2VCbG9jaycsIGZhbHNlKS50b1N0cmluZygpXS5zZWxlY3RlZCA9IHRydWU7XG5cbiAgICBmb3IodmFyIGxldmVsIGluIGZpbHRlcl9sZXZlbHMpIHtcbiAgICAgIHZhciBpdGVtID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ21lbnVpdGVtJyk7XG4gICAgICBpdGVtLnNldEF0dHJpYnV0ZSgnbGFiZWwnLCBmaWx0ZXJfbGV2ZWxzW2xldmVsXS5uYW1lKTtcbiAgICAgIGl0ZW0uc2V0QXR0cmlidXRlKCdjbGFzcycsICdtZW51aXRlbS1pY29uaWMnKTtcblxuICAgICAgaWYoZmlsdGVyX2xldmVsc1tsZXZlbF0uc2VsZWN0ZWQpe1xuICAgICAgICBpdGVtLnN0eWxlLmxpc3RTdHlsZUltYWdlID0gJ3VybChjaHJvbWU6Ly9jbGlxei9jb250ZW50L3N0YXRpYy9za2luL2NoZWNrbWFyay5wbmcpJztcbiAgICAgIH1cblxuICAgICAgaXRlbS5maWx0ZXJfbGV2ZWwgPSBsZXZlbDtcbiAgICAgIGl0ZW0uYWRkRXZlbnRMaXN0ZW5lcignY29tbWFuZCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIGlmICggdGhpcy5maWx0ZXJfbGV2ZWwgPT09ICd0cnVlJyApIHtcbiAgICAgICAgICB1dGlscy5zZXRQcmVmKCdhdHRyYWNrRm9yY2VCbG9jaycsIHRydWUpO1xuICAgICAgICAgIHV0aWxzLnRlbGVtZXRyeSggeyB0eXBlOiAnYW50aXRyYWNraW5nJywgYWN0aW9uOiAnY2xpY2snLCB0YXJnZXQ6ICdhdHRyYWNrX3FidXR0b25fc3RyaWN0J30gKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB1dGlscy5jbGVhclByZWYoJ2F0dHJhY2tGb3JjZUJsb2NrJyk7XG4gICAgICAgICAgdXRpbHMudGVsZW1ldHJ5KCB7IHR5cGU6ICdhbnRpdHJhY2tpbmcnLCBhY3Rpb246ICdjbGljaycsIHRhcmdldDogJ2F0dHJhY2tfcWJ1dHRvbl9kZWZhdWx0J30gKTtcbiAgICAgICAgfVxuICAgICAgfSwgZmFsc2UpO1xuXG4gICAgICBhdHRyYWNrUG9wdXAuYXBwZW5kQ2hpbGQoaXRlbSk7XG4gICAgfTtcblxuICAgIHZhciBsZWFybk1vcmUgPSBzaW1wbGVCdG4oXG4gICAgICAgIGRvYyxcbiAgICAgICAgdXRpbHMuZ2V0TG9jYWxpemVkU3RyaW5nKCdsZWFybk1vcmUnKSxcbiAgICAgICAgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdXRpbHMub3BlblRhYkluV2luZG93KHRoaXMud2luZG93LCAnaHR0cHM6Ly9jbGlxei5jb20vd2h5Y2xpcXovYW50aS10cmFja2luZycpO1xuICAgICAgICB9LmJpbmQodGhpcyksXG4gICAgICAgICdhdHRyYWNrX2xlYXJuX21vcmUnXG4gICAgKTtcbiAgICBsZWFybk1vcmUuc2V0QXR0cmlidXRlKCdjbGFzcycsICdtZW51aXRlbS1pY29uaWMnKTtcbiAgICBhdHRyYWNrUG9wdXAuYXBwZW5kQ2hpbGQoZG9jLmNyZWF0ZUVsZW1lbnQoJ21lbnVzZXBhcmF0b3InKSk7XG4gICAgYXR0cmFja1BvcHVwLmFwcGVuZENoaWxkKGxlYXJuTW9yZSk7XG5cbiAgICBhdHRyYWNrQnRuLmFwcGVuZENoaWxkKGF0dHJhY2tQb3B1cCk7XG5cbiAgICByZXR1cm4gYXR0cmFja0J0bjtcbiAgfVxuXG4gIGNyZWF0ZUJ1dHRvbkl0ZW0oKSB7XG4gICAgaWYgKCFiYWNrZ3JvdW5kLmJ1dHRvbkVuYWJsZWQpIHJldHVybiBbXTtcblxuICAgIHJldHVybiBbXG4gICAgICB0aGlzLmNyZWF0ZUF0dHJhY2tCdXR0b24oKVxuICAgIF07XG4gIH1cblxuICBzdGF0dXMoKSB7XG4gICAgaWYgKGJhY2tncm91bmQuYnV0dG9uRW5hYmxlZCkge1xuICAgICAgdmFyIGluZm8gPSBDbGlxekF0dHJhY2suZ2V0Q3VycmVudFRhYkJsb2NraW5nSW5mbyh0aGlzLndpbmRvdy5nQnJvd3NlciksXG4gICAgICAgICAgcHMgPSBpbmZvLnBzLFxuICAgICAgICAgIGhvc3RuYW1lID0gVVJMSW5mby5nZXQodGhpcy53aW5kb3cuZ0Jyb3dzZXIuY3VycmVudFVSSS5zcGVjKS5ob3N0bmFtZSxcbiAgICAgICAgICBpc1doaXRlbGlzdGVkID0gQ2xpcXpBdHRyYWNrLmlzU291cmNlV2hpdGVsaXN0ZWQoaG9zdG5hbWUpLFxuICAgICAgICAgIGVuYWJsZWQgPSB1dGlscy5nZXRQcmVmKCdhbnRpVHJhY2tUZXN0JywgdHJ1ZSkgJiYgIWlzV2hpdGVsaXN0ZWQ7XG5cbiAgICAgIHJldHVybiB7XG4gICAgICAgIHZpc2libGU6IHRydWUsXG4gICAgICAgIHN0cmljdDogdXRpbHMuZ2V0UHJlZignYXR0cmFja0ZvcmNlQmxvY2snLCBmYWxzZSksXG4gICAgICAgIGhvc3RuYW1lOiBob3N0bmFtZSxcbiAgICAgICAgY29va2llc0NvdW50OiBpbmZvLmNvb2tpZXMuYmxvY2tlZCxcbiAgICAgICAgcmVxdWVzdHNDb3VudDogaW5mby5yZXF1ZXN0cy51bnNhZmUsXG4gICAgICAgIHRvdGFsQ291bnQ6IGluZm8uY29va2llcy5ibG9ja2VkICsgaW5mby5yZXF1ZXN0cy51bnNhZmUsXG4gICAgICAgIGVuYWJsZWQ6IGVuYWJsZWQsXG4gICAgICAgIGlzV2hpdGVsaXN0ZWQ6IGlzV2hpdGVsaXN0ZWQgfHwgZW5hYmxlZCxcbiAgICAgICAgcmVsb2FkOiBpbmZvLnJlbG9hZCB8fCBmYWxzZSxcbiAgICAgICAgdHJhY2tlcnNMaXN0OiBpbmZvLFxuICAgICAgICBwczogcHMsXG4gICAgICAgIHN0YXRlOiBlbmFibGVkID8gJ2FjdGl2ZScgOiBpc1doaXRlbGlzdGVkID8gJ2luYWN0aXZlJyA6ICdjcml0aWNhbCdcbiAgICAgIH1cbiAgICB9XG4gIH1cbn07XG4iXX0=