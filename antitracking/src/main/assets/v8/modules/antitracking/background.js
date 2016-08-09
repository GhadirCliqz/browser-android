System.register('antitracking/background', ['core/base/background', 'antitracking/popup-button', 'antitracking/attrack', 'antitracking/privacy-score', 'antitracking/md5', 'antitracking/tracker-txt', 'core/cliqz', 'antitracking/telemetry'], function (_export) {

  /**
  * @namespace antitracking
  * @class Background
  */
  'use strict';

  var background, CliqzPopupButton, CliqzAttrack, PrivacyScore, md5, DEFAULT_ACTION_PREF, updateDefaultTrackerTxtRule, utils, events, telemetry;
  return {
    setters: [function (_coreBaseBackground) {
      background = _coreBaseBackground['default'];
    }, function (_antitrackingPopupButton) {
      CliqzPopupButton = _antitrackingPopupButton['default'];
    }, function (_antitrackingAttrack) {
      CliqzAttrack = _antitrackingAttrack['default'];
    }, function (_antitrackingPrivacyScore) {
      PrivacyScore = _antitrackingPrivacyScore.PrivacyScore;
    }, function (_antitrackingMd5) {
      md5 = _antitrackingMd5['default'];
    }, function (_antitrackingTrackerTxt) {
      DEFAULT_ACTION_PREF = _antitrackingTrackerTxt.DEFAULT_ACTION_PREF;
      updateDefaultTrackerTxtRule = _antitrackingTrackerTxt.updateDefaultTrackerTxtRule;
    }, function (_coreCliqz) {
      utils = _coreCliqz.utils;
      events = _coreCliqz.events;
    }, function (_antitrackingTelemetry) {
      telemetry = _antitrackingTelemetry['default'];
    }],
    execute: function () {
      _export('default', background({
        /**
        * @method init
        * @param settings
        */
        init: function init(settings) {
          if (CliqzAttrack.getBrowserMajorVersion() < CliqzAttrack.MIN_BROWSER_VERSION) {
            return;
          }

          this.buttonEnabled = utils.getPref('attrackUI', settings.antitrackingButton);

          // fix for users without pref properly set: set to value from build config
          if (!utils.hasPref('attrackRemoveQueryStringTracking')) {
            utils.setPref('attrackRemoveQueryStringTracking', settings.antitrackingButton);
          }

          this.enabled = false;
          this.clickCache = {};

          utils.bindObjectFunctions(this.popupActions, this);

          if (this.buttonEnabled) {
            this.popup = new CliqzPopupButton({
              name: 'antitracking',
              actions: this.popupActions
            });
            this.popup.attach();
            this.popup.updateState(utils.getWindow(), false);
          }

          // inject configured telemetry module
          telemetry.loadFromProvider(settings.telemetryProvider || 'human-web/human-web');

          this.onPrefChange = (function (pref) {
            if (pref === CliqzAttrack.ENABLE_PREF && CliqzAttrack.isEnabled() !== this.enabled) {
              var isEnabled = CliqzAttrack.isEnabled();

              if (isEnabled) {
                // now enabled, initialise module
                CliqzAttrack.init();
              } else {
                // disabled, unload module
                CliqzAttrack.unload();
              }

              if (this.popup) {
                this.popup.updateState(utils.getWindow(), isEnabled);
              }
              this.enabled = isEnabled;
            } else if (pref === DEFAULT_ACTION_PREF) {
              updateDefaultTrackerTxtRule();
            }
          }).bind(this);

          this.onPrefChange(CliqzAttrack.ENABLE_PREF);
          events.sub('prefchange', this.onPrefChange);
        },

        enabled: function enabled() {
          return this.enabled;
        },

        /**
        * @method unload
        */
        unload: function unload() {
          if (CliqzAttrack.getBrowserMajorVersion() < CliqzAttrack.MIN_BROWSER_VERSION) {
            return;
          }

          if (this.popup) {
            this.popup.destroy();
          }

          events.un_sub('prefchange', this.onPrefChange);

          if (CliqzAttrack.isEnabled()) {
            CliqzAttrack.unload();
            this.enabled = false;
          }
        },

        popupActions: {
          /**
          * @method popupActions.getPopupData
          * @param args
          * @param cb Callback
          */
          getPopupData: function getPopupData(args, cb) {

            var info = CliqzAttrack.getCurrentTabBlockingInfo(),
                ps = info.ps;
            // var ps = PrivacyScore.get(md5(info.hostname).substring(0, 16)  'site');

            // ps.getPrivacyScore();

            cb({
              url: info.hostname,
              cookiesCount: info.cookies.blocked,
              requestsCount: info.requests.unsafe,
              enabled: utils.getPref('antiTrackTest'),
              isWhitelisted: CliqzAttrack.isSourceWhitelisted(info.hostname),
              reload: info.reload || false,
              trakersList: info,
              ps: ps
            });

            if (this.popup) {
              this.popup.setBadge(utils.getWindow(), info.cookies.blocked + info.requests.unsafe);
            }
          },
          /**
          * @method popupActions.toggleAttrack
          * @param args
          * @param cb Callback
          */
          toggleAttrack: function toggleAttrack(args, cb) {
            var currentState = utils.getPref('antiTrackTest');

            if (currentState) {
              CliqzAttrack.disableModule();
            } else {
              CliqzAttrack.enableModule();
            }

            this.popup.updateState(utils.getWindow(), !currentState);

            cb();

            this.popupActions.telemetry({ action: 'click', 'target': currentState ? 'deactivate' : 'activate' });
          },
          /**
          * @method popupActions.closePopup
          */
          closePopup: function closePopup(_, cb) {
            this.popup.tbb.closePopup();
            cb();
          },
          /**
          * @method popupActions.toggleWhiteList
          * @param args
          * @param cb Callback
          */
          toggleWhiteList: function toggleWhiteList(args, cb) {
            var hostname = args.hostname;
            if (CliqzAttrack.isSourceWhitelisted(hostname)) {
              CliqzAttrack.removeSourceDomainFromWhitelist(hostname);
              this.popupActions.telemetry({ action: 'click', target: 'unwhitelist_domain' });
            } else {
              CliqzAttrack.addSourceDomainToWhitelist(hostname);
              this.popupActions.telemetry({ action: 'click', target: 'whitelist_domain' });
            }
            cb();
          },
          /**
          * @method popupActions.updateHeight
          * @param args
          * @param cb Callback
          */
          updateHeight: function updateHeight(args, cb) {
            this.popup.updateView(utils.getWindow(), args[0]);
          },

          _isDuplicate: function _isDuplicate(info) {
            var now = Date.now();
            var key = info.tab + info.hostname + info.path;

            // clean old entries
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = Object.keys(this.clickCache)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var k = _step.value;

                if (now - this.clickCache[k] > 60000) {
                  delete this.clickCache[k];
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

            if (key in this.clickCache) {
              return true;
            } else {
              this.clickCache[key] = now;
              return false;
            }
          },

          telemetry: function telemetry(msg) {
            if (msg.includeUnsafeCount) {
              delete msg.includeUnsafeCount;
              var info = CliqzAttrack.getCurrentTabBlockingInfo();
              // drop duplicated messages
              if (info.error || this.popupActions._isDuplicate(info)) {
                return;
              }
              msg.unsafe_count = info.cookies.blocked + info.requests.unsafe;
              msg.special = info.error !== undefined;
            }
            msg.type = 'antitracking';
            utils.telemetry(msg);
          }
        },

        events: {
          "core.tab_location_change": CliqzAttrack.onTabLocationChange,
          "core.tab_state_change": CliqzAttrack.tab_listener.onStateChange.bind(CliqzAttrack.tab_listener)
        }

      }));
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy9iYWNrZ3JvdW5kLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OytDQUdRLFlBQVk7Ozs7b0RBRVgsbUJBQW1COzREQUFFLDJCQUEyQjs7eUJBQ2hELEtBQUs7MEJBQUUsTUFBTTs7Ozs7eUJBT1AsVUFBVSxDQUFDOzs7OztBQUt4QixZQUFJLEVBQUEsY0FBQyxRQUFRLEVBQUU7QUFDYixjQUFJLFlBQVksQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLFlBQVksQ0FBQyxtQkFBbUIsRUFBRTtBQUM1RSxtQkFBTztXQUNSOztBQUVELGNBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUM7OztBQUc3RSxjQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxrQ0FBa0MsQ0FBQyxFQUFFO0FBQ3RELGlCQUFLLENBQUMsT0FBTyxDQUFDLGtDQUFrQyxFQUFFLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1dBQ2hGOztBQUVELGNBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLGNBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDOztBQUVyQixlQUFLLENBQUMsbUJBQW1CLENBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUUsQ0FBQzs7QUFFckQsY0FBSSxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3RCLGdCQUFJLENBQUMsS0FBSyxHQUFHLElBQUksZ0JBQWdCLENBQUM7QUFDaEMsa0JBQUksRUFBRSxjQUFjO0FBQ3BCLHFCQUFPLEVBQUUsSUFBSSxDQUFDLFlBQVk7YUFDM0IsQ0FBQyxDQUFDO0FBQ0gsZ0JBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDcEIsZ0JBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztX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QUE7QUFDN0Isa0JBQU0sSUFBSSxHQUFHLFlBQVksQ0FBQyx5QkFBeUIsRUFBRSxDQUFDOztBQUV0RCxrQkFBSSxJQUFJLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxZQUFZLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3RELHVCQUFPO2VBQ1I7QUFDRCxpQkFBRyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztBQUMvRCxpQkFBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVMsQ0FBQzthQUN4QztBQUNELGVBQUcsQ0FBQyxJQUFJLEdBQUcsY0FBYyxDQUFDO0FBQzFCLGlCQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1dBQ3RCO1NBQ0Y7O0FBRUQsY0FBTSxFQUFFO0FBQ04sb0NBQTBCLEVBQUUsWUFBWSxDQUFDLG1CQUFtQjtBQUM1RCxpQ0FBdUIsRUFBRSxZQUFZLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQztTQUNqRzs7T0FFRixDQUFDIiwiZmlsZSI6ImFudGl0cmFja2luZy9iYWNrZ3JvdW5kLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGJhY2tncm91bmQgZnJvbSBcImNvcmUvYmFzZS9iYWNrZ3JvdW5kXCI7XG5pbXBvcnQgQ2xpcXpQb3B1cEJ1dHRvbiBmcm9tICdhbnRpdHJhY2tpbmcvcG9wdXAtYnV0dG9uJztcbmltcG9ydCBDbGlxekF0dHJhY2sgZnJvbSAnYW50aXRyYWNraW5nL2F0dHJhY2snO1xuaW1wb3J0IHtQcml2YWN5U2NvcmV9IGZyb20gJ2FudGl0cmFja2luZy9wcml2YWN5LXNjb3JlJztcbmltcG9ydCBtZDUgZnJvbSAnYW50aXRyYWNraW5nL21kNSc7XG5pbXBvcnQgeyBERUZBVUxUX0FDVElPTl9QUkVGLCB1cGRhdGVEZWZhdWx0VHJhY2tlclR4dFJ1bGUgfSBmcm9tICdhbnRpdHJhY2tpbmcvdHJhY2tlci10eHQnO1xuaW1wb3J0IHsgdXRpbHMsIGV2ZW50cyB9IGZyb20gJ2NvcmUvY2xpcXonO1xuaW1wb3J0IHRlbGVtZXRyeSBmcm9tICdhbnRpdHJhY2tpbmcvdGVsZW1ldHJ5JztcblxuLyoqXG4qIEBuYW1lc3BhY2UgYW50aXRyYWNraW5nXG4qIEBjbGFzcyBCYWNrZ3JvdW5kXG4qL1xuZXhwb3J0IGRlZmF1bHQgYmFja2dyb3VuZCh7XG4gIC8qKlxuICAqIEBtZXRob2QgaW5pdFxuICAqIEBwYXJhbSBzZXR0aW5nc1xuICAqL1xuICBpbml0KHNldHRpbmdzKSB7XG4gICAgaWYgKENsaXF6QXR0cmFjay5nZXRCcm93c2VyTWFqb3JWZXJzaW9uKCkgPCBDbGlxekF0dHJhY2suTUlOX0JST1dTRVJfVkVSU0lPTikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuYnV0dG9uRW5hYmxlZCA9IHV0aWxzLmdldFByZWYoJ2F0dHJhY2tVSScsIHNldHRpbmdzLmFudGl0cmFja2luZ0J1dHRvbik7XG5cbiAgICAvLyBmaXggZm9yIHVzZXJzIHdpdGhvdXQgcHJlZiBwcm9wZXJseSBzZXQ6IHNldCB0byB2YWx1ZSBmcm9tIGJ1aWxkIGNvbmZpZ1xuICAgIGlmICghdXRpbHMuaGFzUHJlZignYXR0cmFja1JlbW92ZVF1ZXJ5U3RyaW5nVHJhY2tpbmcnKSkge1xuICAgICAgdXRpbHMuc2V0UHJlZignYXR0cmFja1JlbW92ZVF1ZXJ5U3RyaW5nVHJhY2tpbmcnLCBzZXR0aW5ncy5hbnRpdHJhY2tpbmdCdXR0b24pO1xuICAgIH1cblxuICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuICAgIHRoaXMuY2xpY2tDYWNoZSA9IHt9O1xuXG4gICAgdXRpbHMuYmluZE9iamVjdEZ1bmN0aW9ucyggdGhpcy5wb3B1cEFjdGlvbnMsIHRoaXMgKTtcblxuICAgIGlmICh0aGlzLmJ1dHRvbkVuYWJsZWQpIHtcbiAgICAgIHRoaXMucG9wdXAgPSBuZXcgQ2xpcXpQb3B1cEJ1dHRvbih7XG4gICAgICAgIG5hbWU6ICdhbnRpdHJhY2tpbmcnLFxuICAgICAgICBhY3Rpb25zOiB0aGlzLnBvcHVwQWN0aW9uc1xuICAgICAgfSk7XG4gICAgICB0aGlzLnBvcHVwLmF0dGFjaCgpO1xuICAgICAgdGhpcy5wb3B1cC51cGRhdGVTdGF0ZSh1dGlscy5nZXRXaW5kb3coKSwgZmFsc2UpO1xuICAgIH1cblxuICAgIC8vIGluamVjdCBjb25maWd1cmVkIHRlbGVtZXRyeSBtb2R1bGVcbiAgICB0ZWxlbWV0cnkubG9hZEZyb21Qcm92aWRlcihzZXR0aW5ncy50ZWxlbWV0cnlQcm92aWRlciB8fCAnaHVtYW4td2ViL2h1bWFuLXdlYicpO1xuXG4gICAgdGhpcy5vblByZWZDaGFuZ2UgPSBmdW5jdGlvbihwcmVmKSB7XG4gICAgICBpZiAocHJlZiA9PT0gQ2xpcXpBdHRyYWNrLkVOQUJMRV9QUkVGICYmIENsaXF6QXR0cmFjay5pc0VuYWJsZWQoKSAhPT0gdGhpcy5lbmFibGVkKSB7XG4gICAgICAgIGNvbnN0IGlzRW5hYmxlZCA9IENsaXF6QXR0cmFjay5pc0VuYWJsZWQoKTtcblxuICAgICAgICBpZiAoaXNFbmFibGVkKSB7XG4gICAgICAgICAgLy8gbm93IGVuYWJsZWQsIGluaXRpYWxpc2UgbW9kdWxlXG4gICAgICAgICAgQ2xpcXpBdHRyYWNrLmluaXQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBkaXNhYmxlZCwgdW5sb2FkIG1vZHVsZVxuICAgICAgICAgIENsaXF6QXR0cmFjay51bmxvYWQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHRoaXMucG9wdXApe1xuICAgICAgICAgIHRoaXMucG9wdXAudXBkYXRlU3RhdGUodXRpbHMuZ2V0V2luZG93KCksIGlzRW5hYmxlZCk7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5lbmFibGVkID0gaXNFbmFibGVkO1xuICAgICAgfSBlbHNlIGlmIChwcmVmID09PSBERUZBVUxUX0FDVElPTl9QUkVGKSB7XG4gICAgICAgIHVwZGF0ZURlZmF1bHRUcmFja2VyVHh0UnVsZSgpO1xuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIHRoaXMub25QcmVmQ2hhbmdlKENsaXF6QXR0cmFjay5FTkFCTEVfUFJFRik7XG4gICAgZXZlbnRzLnN1YigncHJlZmNoYW5nZScsIHRoaXMub25QcmVmQ2hhbmdlKTtcbiAgfSxcblxuICBlbmFibGVkKCkge1xuICAgIHJldHVybiB0aGlzLmVuYWJsZWQ7XG4gIH0sXG5cbiAgLyoqXG4gICogQG1ldGhvZCB1bmxvYWRcbiAgKi9cbiAgdW5sb2FkKCkge1xuICAgIGlmIChDbGlxekF0dHJhY2suZ2V0QnJvd3Nlck1ham9yVmVyc2lvbigpIDwgQ2xpcXpBdHRyYWNrLk1JTl9CUk9XU0VSX1ZFUlNJT04pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICBpZiAoIHRoaXMucG9wdXAgKSB7XG4gICAgICB0aGlzLnBvcHVwLmRlc3Ryb3koKTtcbiAgICB9XG5cbiAgICBldmVudHMudW5fc3ViKCdwcmVmY2hhbmdlJywgdGhpcy5vblByZWZDaGFuZ2UpO1xuXG4gICAgaWYgKENsaXF6QXR0cmFjay5pc0VuYWJsZWQoKSkge1xuICAgICAgQ2xpcXpBdHRyYWNrLnVubG9hZCgpO1xuICAgICAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG4gICAgfVxuICB9LFxuXG4gIHBvcHVwQWN0aW9uczoge1xuICAgIC8qKlxuICAgICogQG1ldGhvZCBwb3B1cEFjdGlvbnMuZ2V0UG9wdXBEYXRhXG4gICAgKiBAcGFyYW0gYXJnc1xuICAgICogQHBhcmFtIGNiIENhbGxiYWNrXG4gICAgKi9cbiAgICBnZXRQb3B1cERhdGEoYXJncywgY2IpIHtcblxuICAgICAgdmFyIGluZm8gPSBDbGlxekF0dHJhY2suZ2V0Q3VycmVudFRhYkJsb2NraW5nSW5mbygpLFxuICAgICAgICAgIHBzID0gaW5mby5wcztcbiAgICAgIC8vIHZhciBwcyA9IFByaXZhY3lTY29yZS5nZXQobWQ1KGluZm8uaG9zdG5hbWUpLnN1YnN0cmluZygwLCAxNikgICdzaXRlJyk7XG5cbiAgICAgIC8vIHBzLmdldFByaXZhY3lTY29yZSgpO1xuXG4gICAgICBjYih7XG4gICAgICAgIHVybDogaW5mby5ob3N0bmFtZSxcbiAgICAgICAgY29va2llc0NvdW50OiBpbmZvLmNvb2tpZXMuYmxvY2tlZCxcbiAgICAgICAgcmVxdWVzdHNDb3VudDogaW5mby5yZXF1ZXN0cy51bnNhZmUsXG4gICAgICAgIGVuYWJsZWQ6IHV0aWxzLmdldFByZWYoJ2FudGlUcmFja1Rlc3QnKSxcbiAgICAgICAgaXNXaGl0ZWxpc3RlZDogQ2xpcXpBdHRyYWNrLmlzU291cmNlV2hpdGVsaXN0ZWQoaW5mby5ob3N0bmFtZSksXG4gICAgICAgIHJlbG9hZDogaW5mby5yZWxvYWQgfHwgZmFsc2UsXG4gICAgICAgIHRyYWtlcnNMaXN0OiBpbmZvLFxuICAgICAgICBwczogcHNcbiAgICAgIH0pO1xuXG4gICAgICBpZiAodGhpcy5wb3B1cCkge1xuICAgICAgICB0aGlzLnBvcHVwLnNldEJhZGdlKHV0aWxzLmdldFdpbmRvdygpLCBpbmZvLmNvb2tpZXMuYmxvY2tlZCArIGluZm8ucmVxdWVzdHMudW5zYWZlKTtcbiAgICAgIH1cbiAgICB9LFxuICAgIC8qKlxuICAgICogQG1ldGhvZCBwb3B1cEFjdGlvbnMudG9nZ2xlQXR0cmFja1xuICAgICogQHBhcmFtIGFyZ3NcbiAgICAqIEBwYXJhbSBjYiBDYWxsYmFja1xuICAgICovXG4gICAgdG9nZ2xlQXR0cmFjayhhcmdzLCBjYikge1xuICAgICAgdmFyIGN1cnJlbnRTdGF0ZSA9IHV0aWxzLmdldFByZWYoJ2FudGlUcmFja1Rlc3QnKTtcblxuICAgICAgaWYgKGN1cnJlbnRTdGF0ZSkge1xuICAgICAgICBDbGlxekF0dHJhY2suZGlzYWJsZU1vZHVsZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgQ2xpcXpBdHRyYWNrLmVuYWJsZU1vZHVsZSgpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnBvcHVwLnVwZGF0ZVN0YXRlKHV0aWxzLmdldFdpbmRvdygpLCAhY3VycmVudFN0YXRlKTtcblxuICAgICAgY2IoKTtcblxuICAgICAgdGhpcy5wb3B1cEFjdGlvbnMudGVsZW1ldHJ5KCB7YWN0aW9uOiAnY2xpY2snLCAndGFyZ2V0JzogKGN1cnJlbnRTdGF0ZSA/ICdkZWFjdGl2YXRlJyA6ICdhY3RpdmF0ZScpfSApXG4gICAgfSxcbiAgICAvKipcbiAgICAqIEBtZXRob2QgcG9wdXBBY3Rpb25zLmNsb3NlUG9wdXBcbiAgICAqL1xuICAgIGNsb3NlUG9wdXAoXywgY2IpIHtcbiAgICAgIHRoaXMucG9wdXAudGJiLmNsb3NlUG9wdXAoKTtcbiAgICAgIGNiKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAqIEBtZXRob2QgcG9wdXBBY3Rpb25zLnRvZ2dsZVdoaXRlTGlzdFxuICAgICogQHBhcmFtIGFyZ3NcbiAgICAqIEBwYXJhbSBjYiBDYWxsYmFja1xuICAgICovXG4gICAgdG9nZ2xlV2hpdGVMaXN0KGFyZ3MsIGNiKSB7XG4gICAgICB2YXIgaG9zdG5hbWUgPSBhcmdzLmhvc3RuYW1lO1xuICAgICAgaWYgKENsaXF6QXR0cmFjay5pc1NvdXJjZVdoaXRlbGlzdGVkKGhvc3RuYW1lKSkge1xuICAgICAgICBDbGlxekF0dHJhY2sucmVtb3ZlU291cmNlRG9tYWluRnJvbVdoaXRlbGlzdChob3N0bmFtZSk7XG4gICAgICAgIHRoaXMucG9wdXBBY3Rpb25zLnRlbGVtZXRyeSggeyBhY3Rpb246ICdjbGljaycsIHRhcmdldDogJ3Vud2hpdGVsaXN0X2RvbWFpbid9ICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBDbGlxekF0dHJhY2suYWRkU291cmNlRG9tYWluVG9XaGl0ZWxpc3QoaG9zdG5hbWUpO1xuICAgICAgICB0aGlzLnBvcHVwQWN0aW9ucy50ZWxlbWV0cnkoIHsgYWN0aW9uOiAnY2xpY2snLCB0YXJnZXQ6ICd3aGl0ZWxpc3RfZG9tYWluJ30gKTtcbiAgICAgIH1cbiAgICAgIGNiKCk7XG4gICAgfSxcbiAgICAvKipcbiAgICAqIEBtZXRob2QgcG9wdXBBY3Rpb25zLnVwZGF0ZUhlaWdodFxuICAgICogQHBhcmFtIGFyZ3NcbiAgICAqIEBwYXJhbSBjYiBDYWxsYmFja1xuICAgICovXG4gICAgdXBkYXRlSGVpZ2h0KGFyZ3MsIGNiKSB7XG4gICAgICB0aGlzLnBvcHVwLnVwZGF0ZVZpZXcodXRpbHMuZ2V0V2luZG93KCksIGFyZ3NbMF0pO1xuICAgIH0sXG5cbiAgICBfaXNEdXBsaWNhdGUoaW5mbykge1xuICAgICAgY29uc3Qgbm93ID0gRGF0ZS5ub3coKTtcbiAgICAgIGNvbnN0IGtleSA9IGluZm8udGFiICsgaW5mby5ob3N0bmFtZSArIGluZm8ucGF0aDtcblxuICAgICAgLy8gY2xlYW4gb2xkIGVudHJpZXNcbiAgICAgIGZvciAobGV0IGsgb2YgT2JqZWN0LmtleXModGhpcy5jbGlja0NhY2hlKSkge1xuICAgICAgICBpZiAobm93IC0gdGhpcy5jbGlja0NhY2hlW2tdID4gNjAwMDApIHtcbiAgICAgICAgICBkZWxldGUgdGhpcy5jbGlja0NhY2hlW2tdO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmIChrZXkgaW4gdGhpcy5jbGlja0NhY2hlKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgdGhpcy5jbGlja0NhY2hlW2tleV0gPSBub3c7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICB9LFxuXG4gICAgdGVsZW1ldHJ5KG1zZykge1xuICAgICAgaWYgKG1zZy5pbmNsdWRlVW5zYWZlQ291bnQpIHtcbiAgICAgICAgZGVsZXRlIG1zZy5pbmNsdWRlVW5zYWZlQ291bnRcbiAgICAgICAgY29uc3QgaW5mbyA9IENsaXF6QXR0cmFjay5nZXRDdXJyZW50VGFiQmxvY2tpbmdJbmZvKCk7XG4gICAgICAgIC8vIGRyb3AgZHVwbGljYXRlZCBtZXNzYWdlc1xuICAgICAgICBpZiAoaW5mby5lcnJvciB8fCB0aGlzLnBvcHVwQWN0aW9ucy5faXNEdXBsaWNhdGUoaW5mbykpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICAgICAgbXNnLnVuc2FmZV9jb3VudCA9IGluZm8uY29va2llcy5ibG9ja2VkICsgaW5mby5yZXF1ZXN0cy51bnNhZmU7XG4gICAgICAgIG1zZy5zcGVjaWFsID0gaW5mby5lcnJvciAhPT0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgbXNnLnR5cGUgPSAnYW50aXRyYWNraW5nJztcbiAgICAgIHV0aWxzLnRlbGVtZXRyeShtc2cpO1xuICAgIH1cbiAgfSxcblxuICBldmVudHM6IHtcbiAgICBcImNvcmUudGFiX2xvY2F0aW9uX2NoYW5nZVwiOiBDbGlxekF0dHJhY2sub25UYWJMb2NhdGlvbkNoYW5nZSxcbiAgICBcImNvcmUudGFiX3N0YXRlX2NoYW5nZVwiOiBDbGlxekF0dHJhY2sudGFiX2xpc3RlbmVyLm9uU3RhdGVDaGFuZ2UuYmluZChDbGlxekF0dHJhY2sudGFiX2xpc3RlbmVyKVxuICB9LFxuXG59KTtcbiJdfQ==