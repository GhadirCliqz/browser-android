System.register('antitracking/background', ['core/base/background', 'antitracking/popup-button', 'antitracking/attrack', 'antitracking/privacy-score', 'antitracking/md5', 'antitracking/tracker-txt', 'core/cliqz', 'antitracking/telemetry'], function (_export) {
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
                this.enabled = isEnabled;
              }
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
          },

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

          closePopup: function closePopup(_, cb) {
            this.popup.tbb.closePopup();
            cb();
          },

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
          updateHeight: function updateHeight(args, cb) {
            this.popup.updateView(utils.getWindow(), args[0]);
          },

          telemetry: function telemetry(msg) {
            if (msg.includeUnsafeCount) {
              delete msg.includeUnsafeCount;
              var info = CliqzAttrack.getCurrentTabBlockingInfo();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy9iYWNrZ3JvdW5kLmVzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OzsrQ0FHUSxZQUFZOzs7O29EQUVYLG1CQUFtQjs0REFBRSwyQkFBMkI7O3lCQUNoRCxLQUFLOzBCQUFFLE1BQU07Ozs7O3lCQUdQLFVBQVUsQ0FBQzs7QUFFeEIsWUFBSSxFQUFBLGNBQUMsUUFBUSxFQUFFO0FBQ2IsY0FBSSxZQUFZLENBQUMsc0JBQXNCLEVBQUUsR0FBRyxZQUFZLENBQUMsbUJBQW1CLEVBQUU7QUFDNUUsbUJBQU87V0FDUjs7QUFFRCxjQUFJLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQyxPQUFPLENBQUMsV0FBVyxFQUFFLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDOzs7QUFHN0UsY0FBSyxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsa0NBQWtDLENBQUMsRUFBRztBQUN4RCxpQkFBSyxDQUFDLE9BQU8sQ0FBQyxrQ0FBa0MsRUFBRSxRQUFRLENBQUMsa0JBQWtCLENBQUMsQ0FBQztXQUNoRjs7QUFFRCxjQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssQ0FBQzs7QUFFckIsZUFBSyxDQUFDLG1CQUFtQixDQUFFLElBQUksQ0FBQyxZQUFZLEVBQUUsSUFBSSxDQUFFLENBQUM7O0FBRXJELGNBQUssSUFBSSxDQUFDLGFBQWEsRUFBRztBQUN4QixnQkFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLGdCQUFnQixDQUFDO0FBQ2hDLGtCQUFJLEVBQUUsY0FBYztBQUNwQixxQkFBTyxFQUFFLElBQUksQ0FBQyxZQUFZO2FBQzNCLENBQUMsQ0FBQztBQUNILGdCQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxDQUFDO0FBQ3BCLGdCQUFJLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxLQUFLLENBQUMsU0FBUyxFQUFFLEVBQUUsS0FBSyxDQUFDLENBQUM7V0FDbEQ7OztBQUdELG1CQUFTLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFD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SUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7V0FDbkQ7O0FBRUQsbUJBQVMsRUFBQSxtQkFBQyxHQUFHLEVBQUU7QUFDYixnQkFBSyxHQUFHLENBQUMsa0JBQWtCLEVBQUc7QUFDNUIscUJBQU8sR0FBRyxDQUFDLGtCQUFrQixDQUFBO0FBQzdCLGtCQUFJLElBQUksR0FBRyxZQUFZLENBQUMseUJBQXlCLEVBQUUsQ0FBQztBQUNwRCxpQkFBRyxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQztBQUMvRCxpQkFBRyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsS0FBSyxLQUFLLFNBQVMsQ0FBQzthQUN4QztBQUNELGVBQUcsQ0FBQyxJQUFJLEdBQUcsY0FBYyxDQUFDO0FBQzFCLGlCQUFLLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1dBQ3RCO1NBQ0Y7O0FBRUQsY0FBTSxFQUFFO0FBQ04sb0NBQTBCLEVBQUUsWUFBWSxDQUFDLG1CQUFtQjtBQUM1RCxpQ0FBdUIsRUFBRSxZQUFZLENBQUMsWUFBWSxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFlBQVksQ0FBQztTQUNqRzs7T0FFRixDQUFDIiwiZmlsZSI6ImFudGl0cmFja2luZy9iYWNrZ3JvdW5kLmVzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGJhY2tncm91bmQgZnJvbSBcImNvcmUvYmFzZS9iYWNrZ3JvdW5kXCI7XG5pbXBvcnQgQ2xpcXpQb3B1cEJ1dHRvbiBmcm9tICdhbnRpdHJhY2tpbmcvcG9wdXAtYnV0dG9uJztcbmltcG9ydCBDbGlxekF0dHJhY2sgZnJvbSAnYW50aXRyYWNraW5nL2F0dHJhY2snO1xuaW1wb3J0IHtQcml2YWN5U2NvcmV9IGZyb20gJ2FudGl0cmFja2luZy9wcml2YWN5LXNjb3JlJztcbmltcG9ydCBtZDUgZnJvbSAnYW50aXRyYWNraW5nL21kNSc7XG5pbXBvcnQgeyBERUZBVUxUX0FDVElPTl9QUkVGLCB1cGRhdGVEZWZhdWx0VHJhY2tlclR4dFJ1bGUgfSBmcm9tICdhbnRpdHJhY2tpbmcvdHJhY2tlci10eHQnO1xuaW1wb3J0IHsgdXRpbHMsIGV2ZW50cyB9IGZyb20gJ2NvcmUvY2xpcXonO1xuaW1wb3J0IHRlbGVtZXRyeSBmcm9tICdhbnRpdHJhY2tpbmcvdGVsZW1ldHJ5JztcblxuZXhwb3J0IGRlZmF1bHQgYmFja2dyb3VuZCh7XG5cbiAgaW5pdChzZXR0aW5ncykge1xuICAgIGlmIChDbGlxekF0dHJhY2suZ2V0QnJvd3Nlck1ham9yVmVyc2lvbigpIDwgQ2xpcXpBdHRyYWNrLk1JTl9CUk9XU0VSX1ZFUlNJT04pIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmJ1dHRvbkVuYWJsZWQgPSB1dGlscy5nZXRQcmVmKCdhdHRyYWNrVUknLCBzZXR0aW5ncy5hbnRpdHJhY2tpbmdCdXR0b24pO1xuXG4gICAgLy8gZml4IGZvciB1c2VycyB3aXRob3V0IHByZWYgcHJvcGVybHkgc2V0OiBzZXQgdG8gdmFsdWUgZnJvbSBidWlsZCBjb25maWdcbiAgICBpZiAoICF1dGlscy5oYXNQcmVmKCdhdHRyYWNrUmVtb3ZlUXVlcnlTdHJpbmdUcmFja2luZycpICkge1xuICAgICAgdXRpbHMuc2V0UHJlZignYXR0cmFja1JlbW92ZVF1ZXJ5U3RyaW5nVHJhY2tpbmcnLCBzZXR0aW5ncy5hbnRpdHJhY2tpbmdCdXR0b24pO1xuICAgIH1cblxuICAgIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuXG4gICAgdXRpbHMuYmluZE9iamVjdEZ1bmN0aW9ucyggdGhpcy5wb3B1cEFjdGlvbnMsIHRoaXMgKTtcblxuICAgIGlmICggdGhpcy5idXR0b25FbmFibGVkICkge1xuICAgICAgdGhpcy5wb3B1cCA9IG5ldyBDbGlxelBvcHVwQnV0dG9uKHtcbiAgICAgICAgbmFtZTogJ2FudGl0cmFja2luZycsXG4gICAgICAgIGFjdGlvbnM6IHRoaXMucG9wdXBBY3Rpb25zXG4gICAgICB9KTtcbiAgICAgIHRoaXMucG9wdXAuYXR0YWNoKCk7XG4gICAgICB0aGlzLnBvcHVwLnVwZGF0ZVN0YXRlKHV0aWxzLmdldFdpbmRvdygpLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgLy8gaW5qZWN0IGNvbmZpZ3VyZWQgdGVsZW1ldHJ5IG1vZHVsZVxuICAgIHRlbGVtZXRyeS5sb2FkRnJvbVByb3ZpZGVyKHNldHRpbmdzLnRlbGVtZXRyeVByb3ZpZGVyIHx8ICdodW1hbi13ZWIvaHVtYW4td2ViJyk7XG5cbiAgICB0aGlzLm9uUHJlZkNoYW5nZSA9IGZ1bmN0aW9uKHByZWYpIHtcbiAgICAgIGlmIChwcmVmID09PSBDbGlxekF0dHJhY2suRU5BQkxFX1BSRUYgJiYgQ2xpcXpBdHRyYWNrLmlzRW5hYmxlZCgpICE9PSB0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgbGV0IGlzRW5hYmxlZCA9IENsaXF6QXR0cmFjay5pc0VuYWJsZWQoKTtcblxuICAgICAgICBpZiAoaXNFbmFibGVkKSB7XG4gICAgICAgICAgLy8gbm93IGVuYWJsZWQsIGluaXRpYWxpc2UgbW9kdWxlXG4gICAgICAgICAgQ2xpcXpBdHRyYWNrLmluaXQoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAvLyBkaXNhYmxlZCwgdW5sb2FkIG1vZHVsZVxuICAgICAgICAgIENsaXF6QXR0cmFjay51bmxvYWQoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmKHRoaXMucG9wdXApe1xuICAgICAgICAgIHRoaXMucG9wdXAudXBkYXRlU3RhdGUodXRpbHMuZ2V0V2luZG93KCksIGlzRW5hYmxlZCk7XG4gICAgICAgICAgdGhpcy5lbmFibGVkID0gaXNFbmFibGVkO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKHByZWYgPT09IERFRkFVTFRfQUNUSU9OX1BSRUYpIHtcbiAgICAgICAgdXBkYXRlRGVmYXVsdFRyYWNrZXJUeHRSdWxlKCk7XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5vblByZWZDaGFuZ2UoQ2xpcXpBdHRyYWNrLkVOQUJMRV9QUkVGKTtcbiAgICBldmVudHMuc3ViKCdwcmVmY2hhbmdlJywgdGhpcy5vblByZWZDaGFuZ2UpO1xuICB9LFxuXG4gIGVuYWJsZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW5hYmxlZDtcbiAgfSxcblxuICB1bmxvYWQoKSB7XG4gICAgaWYgKENsaXF6QXR0cmFjay5nZXRCcm93c2VyTWFqb3JWZXJzaW9uKCkgPCBDbGlxekF0dHJhY2suTUlOX0JST1dTRVJfVkVSU0lPTikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICggdGhpcy5wb3B1cCApIHtcbiAgICAgIHRoaXMucG9wdXAuZGVzdHJveSgpO1xuICAgIH1cblxuICAgIGV2ZW50cy51bl9zdWIoJ3ByZWZjaGFuZ2UnLCB0aGlzLm9uUHJlZkNoYW5nZSk7XG5cbiAgICBpZiAoQ2xpcXpBdHRyYWNrLmlzRW5hYmxlZCgpKSB7XG4gICAgICBDbGlxekF0dHJhY2sudW5sb2FkKCk7XG4gICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICB9XG4gIH0sXG5cbiAgcG9wdXBBY3Rpb25zOiB7XG4gICAgZ2V0UG9wdXBEYXRhKGFyZ3MsIGNiKSB7XG5cbiAgICAgIHZhciBpbmZvID0gQ2xpcXpBdHRyYWNrLmdldEN1cnJlbnRUYWJCbG9ja2luZ0luZm8oKSxcbiAgICAgICAgICBwcyA9IGluZm8ucHM7XG4gICAgICAvLyB2YXIgcHMgPSBQcml2YWN5U2NvcmUuZ2V0KG1kNShpbmZvLmhvc3RuYW1lKS5zdWJzdHJpbmcoMCwgMTYpICAnc2l0ZScpO1xuXG4gICAgICAvLyBwcy5nZXRQcml2YWN5U2NvcmUoKTtcblxuICAgICAgY2Ioe1xuICAgICAgICB1cmw6IGluZm8uaG9zdG5hbWUsXG4gICAgICAgIGNvb2tpZXNDb3VudDogaW5mby5jb29raWVzLmJsb2NrZWQsXG4gICAgICAgIHJlcXVlc3RzQ291bnQ6IGluZm8ucmVxdWVzdHMudW5zYWZlLFxuICAgICAgICBlbmFibGVkOiB1dGlscy5nZXRQcmVmKCdhbnRpVHJhY2tUZXN0JyksXG4gICAgICAgIGlzV2hpdGVsaXN0ZWQ6IENsaXF6QXR0cmFjay5pc1NvdXJjZVdoaXRlbGlzdGVkKGluZm8uaG9zdG5hbWUpLFxuICAgICAgICByZWxvYWQ6IGluZm8ucmVsb2FkIHx8IGZhbHNlLFxuICAgICAgICB0cmFrZXJzTGlzdDogaW5mbyxcbiAgICAgICAgcHM6IHBzXG4gICAgICB9KTtcbiAgICB9LFxuXG4gICAgdG9nZ2xlQXR0cmFjayhhcmdzLCBjYikge1xuICAgICAgdmFyIGN1cnJlbnRTdGF0ZSA9IHV0aWxzLmdldFByZWYoJ2FudGlUcmFja1Rlc3QnKTtcblxuICAgICAgaWYgKGN1cnJlbnRTdGF0ZSkge1xuICAgICAgICBDbGlxekF0dHJhY2suZGlzYWJsZU1vZHVsZSgpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgQ2xpcXpBdHRyYWNrLmVuYWJsZU1vZHVsZSgpO1xuICAgICAgfVxuXG4gICAgICB0aGlzLnBvcHVwLnVwZGF0ZVN0YXRlKHV0aWxzLmdldFdpbmRvdygpLCAhY3VycmVudFN0YXRlKTtcblxuICAgICAgY2IoKTtcblxuICAgICAgdGhpcy5wb3B1cEFjdGlvbnMudGVsZW1ldHJ5KCB7YWN0aW9uOiAnY2xpY2snLCAndGFyZ2V0JzogKGN1cnJlbnRTdGF0ZSA/ICdkZWFjdGl2YXRlJyA6ICdhY3RpdmF0ZScpfSApXG4gICAgfSxcblxuICAgIGNsb3NlUG9wdXAoXywgY2IpIHtcbiAgICAgIHRoaXMucG9wdXAudGJiLmNsb3NlUG9wdXAoKTtcbiAgICAgIGNiKCk7XG4gICAgfSxcblxuICAgIHRvZ2dsZVdoaXRlTGlzdChhcmdzLCBjYikge1xuICAgICAgdmFyIGhvc3RuYW1lID0gYXJncy5ob3N0bmFtZTtcbiAgICAgIGlmIChDbGlxekF0dHJhY2suaXNTb3VyY2VXaGl0ZWxpc3RlZChob3N0bmFtZSkpIHtcbiAgICAgICAgQ2xpcXpBdHRyYWNrLnJlbW92ZVNvdXJjZURvbWFpbkZyb21XaGl0ZWxpc3QoaG9zdG5hbWUpO1xuICAgICAgICB0aGlzLnBvcHVwQWN0aW9ucy50ZWxlbWV0cnkoIHsgYWN0aW9uOiAnY2xpY2snLCB0YXJnZXQ6ICd1bndoaXRlbGlzdF9kb21haW4nfSApO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgQ2xpcXpBdHRyYWNrLmFkZFNvdXJjZURvbWFpblRvV2hpdGVsaXN0KGhvc3RuYW1lKTtcbiAgICAgICAgdGhpcy5wb3B1cEFjdGlvbnMudGVsZW1ldHJ5KCB7IGFjdGlvbjogJ2NsaWNrJywgdGFyZ2V0OiAnd2hpdGVsaXN0X2RvbWFpbid9ICk7XG4gICAgICB9XG4gICAgICBjYigpO1xuICAgIH0sXG4gICAgdXBkYXRlSGVpZ2h0KGFyZ3MsIGNiKSB7XG4gICAgICB0aGlzLnBvcHVwLnVwZGF0ZVZpZXcodXRpbHMuZ2V0V2luZG93KCksIGFyZ3NbMF0pO1xuICAgIH0sXG5cbiAgICB0ZWxlbWV0cnkobXNnKSB7XG4gICAgICBpZiAoIG1zZy5pbmNsdWRlVW5zYWZlQ291bnQgKSB7XG4gICAgICAgIGRlbGV0ZSBtc2cuaW5jbHVkZVVuc2FmZUNvdW50XG4gICAgICAgIGxldCBpbmZvID0gQ2xpcXpBdHRyYWNrLmdldEN1cnJlbnRUYWJCbG9ja2luZ0luZm8oKTtcbiAgICAgICAgbXNnLnVuc2FmZV9jb3VudCA9IGluZm8uY29va2llcy5ibG9ja2VkICsgaW5mby5yZXF1ZXN0cy51bnNhZmU7XG4gICAgICAgIG1zZy5zcGVjaWFsID0gaW5mby5lcnJvciAhPT0gdW5kZWZpbmVkO1xuICAgICAgfVxuICAgICAgbXNnLnR5cGUgPSAnYW50aXRyYWNraW5nJztcbiAgICAgIHV0aWxzLnRlbGVtZXRyeShtc2cpO1xuICAgIH1cbiAgfSxcblxuICBldmVudHM6IHtcbiAgICBcImNvcmUudGFiX2xvY2F0aW9uX2NoYW5nZVwiOiBDbGlxekF0dHJhY2sub25UYWJMb2NhdGlvbkNoYW5nZSxcbiAgICBcImNvcmUudGFiX3N0YXRlX2NoYW5nZVwiOiBDbGlxekF0dHJhY2sudGFiX2xpc3RlbmVyLm9uU3RhdGVDaGFuZ2UuYmluZChDbGlxekF0dHJhY2sudGFiX2xpc3RlbmVyKVxuICB9LFxuXG59KTtcbiJdfQ==