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

          // set up metadata to be sent with tp_events messages
          CliqzAttrack.tp_events.telemetryAnnotators.push(function (payl) {
            payl.conf = {
              'qs': CliqzAttrack.isQSEnabled(),
              'cookie': CliqzAttrack.isCookieEnabled(),
              'bloomFilter': CliqzAttrack.isBloomFilterEnabled(),
              'trackTxt': CliqzAttrack.isTrackerTxtEnabled(),
              'forceBlock': CliqzAttrack.isForceBlockEnabled(),
              'ui': background.buttonEnabled
            };
            payl.ver = CliqzAttrack.VERSION;
            payl.addons = CliqzAttrack.similarAddon;
            payl.updateInTime = CliqzAttrack.qs_whitelist.isUpToDate();
            return payl;
          });
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

            utils.callWindowAction(utils.getWindow(), 'control-center', 'setBadge', [info.cookies.blocked + info.requests.unsafe]);
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
          "core.tab_state_change": CliqzAttrack.tab_listener.onStateChange.bind(CliqzAttrack.tab_listener),
          "control-center:antitracking-strict": function controlCenterAntitrackingStrict() {
            utils.setPref('attrackForceBlock', !utils.getPref('attrackForceBlock', false));
          },
          "control-center:antitracking-activator": function controlCenterAntitrackingActivator(data) {
            if (data.status == 'active') {
              // when we activate we also remove the current url from whitelist
              utils.setPref('antiTrackTest', true);
              if (CliqzAttrack.isSourceWhitelisted(data.hostname)) {
                CliqzAttrack.removeSourceDomainFromWhitelist(data.hostname);
                this.popupActions.telemetry({ action: 'click', target: 'unwhitelist_domain' });
              }
            } else if (data.status == 'inactive') {
              // inactive means that the current url is whitelisted but the whole mechanism is on
              CliqzAttrack.addSourceDomainToWhitelist(data.hostname);
              if (utils.getPref('antiTrackTest', false) == false) {
                utils.setPref('antiTrackTest', true);
              }
              this.popupActions.telemetry({ action: 'click', target: 'whitelist_domain' });
            } else if (data.status == 'critical') {
              // on critical we disable anti tracking completely so we must also clean the current url from whitelist
              utils.setPref('antiTrackTest', false);
              if (CliqzAttrack.isSourceWhitelisted(data.hostname)) {
                CliqzAttrack.removeSourceDomainFromWhitelist(data.hostname);
                this.popupActions.telemetry({ action: 'click', target: 'unwhitelist_domain' });
              }
            }
          }
        }

      }));
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy9iYWNrZ3JvdW5kLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7OytDQUdRLFlBQVk7Ozs7b0RBRVgsbUJBQW1COzREQUFFLDJCQUEyQjs7eUJBQ2hELEtBQUs7MEJBQUUsTUFBTTs7Ozs7eUJBT1AsVUFBVSxDQUFDOzs7OztBQUt4QixZQUFJLEVBQUEsY0FBQyxRQUFRLEVBQUU7QUFDYixjQUFJLFlBQVksQ0FBQyxzQkFBc0IsRUFBRSxHQUFHLFlBQVksQ0FBQyxtQkFBbUIsRUFBRTtBQUM1RSxtQkFBTztXQUNSOztBQUVELGNBQUksQ0FBQyxhQUFhLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsUUFBUSxDQUFDLGtCQUFrQixDQUFDLENBQUM7OztBQUc3RSxjQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxrQ0FBa0MsQ0FBQyxFQUFFO0FBQ3RELGlCQUFLLENBQUMsT0FBTyxDQUFDLGtDQUFrQyxFQUFFLFFBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO1dBQ2hGOztBQUVELGNBQUksQ0FBQyxPQUFPLEdBQUcsS0FBSyxDQUFDO0FBQ3JCLGNBQUksQ0FBQyxVQUFVLEdBQUcsRUFBRSxDQUFDOztBQUVyQixlQUFLLENBQUMsbUJBQW1CLENBQUUsSUFBSSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUUsQ0FBQzs7QUFFckQsY0FBSSxJQUFJLENBQUMsYUFBYSxFQUFFO0FBQ3RCLGdCQUFJLENBQUMsS0FBSyxHQUFHLElBQUksZ0JBQWdCLENBQUM7QUFDaEMsa0JBQUksRUFBRSxjQUFjO0FBQ3BCLHFCQUFPLEVBQUUsSUFBSSxDQUFDLFlBQVk7YUFDM0IsQ0FBQyxDQUFDO0FBQ0gsZ0JBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxFQUFFLENBQUM7QUFDcEIsZ0JBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxLQUFLLENBQUMsQ0FBQztX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QUMsSUFBSSxLQUFLLEVBQUM7QUFDaEQscUJBQUssQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxDQUFBO2VBQ3JDO0FBQ0Qsa0JBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsa0JBQWtCLEVBQUUsQ0FBQyxDQUFDO2FBQzlFLE1BQU0sSUFBRyxJQUFJLENBQUMsTUFBTSxJQUFJLFVBQVUsRUFBQzs7QUFFbEMsbUJBQUssQ0FBQyxPQUFPLENBQUMsZUFBZSxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ3RDLGtCQUFHLFlBQVksQ0FBQyxtQkFBbUIsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEVBQUM7QUFDakQsNEJBQVksQ0FBQywrQkFBK0IsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUM7QUFDNUQsb0JBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFFLEVBQUUsTUFBTSxFQUFFLE9BQU8sRUFBRSxNQUFNLEVBQUUsb0JBQW9CLEVBQUMsQ0FBRSxDQUFDO2VBQ2pGO2FBQ0Y7V0FDRjtTQUNGOztPQUVGLENBQUMiLCJmaWxlIjoiYW50aXRyYWNraW5nL2JhY2tncm91bmQuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgYmFja2dyb3VuZCBmcm9tIFwiY29yZS9iYXNlL2JhY2tncm91bmRcIjtcbmltcG9ydCBDbGlxelBvcHVwQnV0dG9uIGZyb20gJ2FudGl0cmFja2luZy9wb3B1cC1idXR0b24nO1xuaW1wb3J0IENsaXF6QXR0cmFjayBmcm9tICdhbnRpdHJhY2tpbmcvYXR0cmFjayc7XG5pbXBvcnQge1ByaXZhY3lTY29yZX0gZnJvbSAnYW50aXRyYWNraW5nL3ByaXZhY3ktc2NvcmUnO1xuaW1wb3J0IG1kNSBmcm9tICdhbnRpdHJhY2tpbmcvbWQ1JztcbmltcG9ydCB7IERFRkFVTFRfQUNUSU9OX1BSRUYsIHVwZGF0ZURlZmF1bHRUcmFja2VyVHh0UnVsZSB9IGZyb20gJ2FudGl0cmFja2luZy90cmFja2VyLXR4dCc7XG5pbXBvcnQgeyB1dGlscywgZXZlbnRzIH0gZnJvbSAnY29yZS9jbGlxeic7XG5pbXBvcnQgdGVsZW1ldHJ5IGZyb20gJ2FudGl0cmFja2luZy90ZWxlbWV0cnknO1xuXG4vKipcbiogQG5hbWVzcGFjZSBhbnRpdHJhY2tpbmdcbiogQGNsYXNzIEJhY2tncm91bmRcbiovXG5leHBvcnQgZGVmYXVsdCBiYWNrZ3JvdW5kKHtcbiAgLyoqXG4gICogQG1ldGhvZCBpbml0XG4gICogQHBhcmFtIHNldHRpbmdzXG4gICovXG4gIGluaXQoc2V0dGluZ3MpIHtcbiAgICBpZiAoQ2xpcXpBdHRyYWNrLmdldEJyb3dzZXJNYWpvclZlcnNpb24oKSA8IENsaXF6QXR0cmFjay5NSU5fQlJPV1NFUl9WRVJTSU9OKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5idXR0b25FbmFibGVkID0gdXRpbHMuZ2V0UHJlZignYXR0cmFja1VJJywgc2V0dGluZ3MuYW50aXRyYWNraW5nQnV0dG9uKTtcblxuICAgIC8vIGZpeCBmb3IgdXNlcnMgd2l0aG91dCBwcmVmIHByb3Blcmx5IHNldDogc2V0IHRvIHZhbHVlIGZyb20gYnVpbGQgY29uZmlnXG4gICAgaWYgKCF1dGlscy5oYXNQcmVmKCdhdHRyYWNrUmVtb3ZlUXVlcnlTdHJpbmdUcmFja2luZycpKSB7XG4gICAgICB1dGlscy5zZXRQcmVmKCdhdHRyYWNrUmVtb3ZlUXVlcnlTdHJpbmdUcmFja2luZycsIHNldHRpbmdzLmFudGl0cmFja2luZ0J1dHRvbik7XG4gICAgfVxuXG4gICAgdGhpcy5lbmFibGVkID0gZmFsc2U7XG4gICAgdGhpcy5jbGlja0NhY2hlID0ge307XG5cbiAgICB1dGlscy5iaW5kT2JqZWN0RnVuY3Rpb25zKCB0aGlzLnBvcHVwQWN0aW9ucywgdGhpcyApO1xuXG4gICAgaWYgKHRoaXMuYnV0dG9uRW5hYmxlZCkge1xuICAgICAgdGhpcy5wb3B1cCA9IG5ldyBDbGlxelBvcHVwQnV0dG9uKHtcbiAgICAgICAgbmFtZTogJ2FudGl0cmFja2luZycsXG4gICAgICAgIGFjdGlvbnM6IHRoaXMucG9wdXBBY3Rpb25zXG4gICAgICB9KTtcbiAgICAgIHRoaXMucG9wdXAuYXR0YWNoKCk7XG4gICAgICB0aGlzLnBvcHVwLnVwZGF0ZVN0YXRlKHV0aWxzLmdldFdpbmRvdygpLCBmYWxzZSk7XG4gICAgfVxuXG4gICAgLy8gaW5qZWN0IGNvbmZpZ3VyZWQgdGVsZW1ldHJ5IG1vZHVsZVxuICAgIHRlbGVtZXRyeS5sb2FkRnJvbVByb3ZpZGVyKHNldHRpbmdzLnRlbGVtZXRyeVByb3ZpZGVyIHx8ICdodW1hbi13ZWIvaHVtYW4td2ViJyk7XG5cbiAgICB0aGlzLm9uUHJlZkNoYW5nZSA9IGZ1bmN0aW9uKHByZWYpIHtcbiAgICAgIGlmIChwcmVmID09PSBDbGlxekF0dHJhY2suRU5BQkxFX1BSRUYgJiYgQ2xpcXpBdHRyYWNrLmlzRW5hYmxlZCgpICE9PSB0aGlzLmVuYWJsZWQpIHtcbiAgICAgICAgY29uc3QgaXNFbmFibGVkID0gQ2xpcXpBdHRyYWNrLmlzRW5hYmxlZCgpO1xuXG4gICAgICAgIGlmIChpc0VuYWJsZWQpIHtcbiAgICAgICAgICAvLyBub3cgZW5hYmxlZCwgaW5pdGlhbGlzZSBtb2R1bGVcbiAgICAgICAgICBDbGlxekF0dHJhY2suaW5pdCgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIC8vIGRpc2FibGVkLCB1bmxvYWQgbW9kdWxlXG4gICAgICAgICAgQ2xpcXpBdHRyYWNrLnVubG9hZCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYodGhpcy5wb3B1cCl7XG4gICAgICAgICAgdGhpcy5wb3B1cC51cGRhdGVTdGF0ZSh1dGlscy5nZXRXaW5kb3coKSwgaXNFbmFibGVkKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmVuYWJsZWQgPSBpc0VuYWJsZWQ7XG4gICAgICB9IGVsc2UgaWYgKHByZWYgPT09IERFRkFVTFRfQUNUSU9OX1BSRUYpIHtcbiAgICAgICAgdXBkYXRlRGVmYXVsdFRyYWNrZXJUeHRSdWxlKCk7XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpO1xuXG4gICAgdGhpcy5vblByZWZDaGFuZ2UoQ2xpcXpBdHRyYWNrLkVOQUJMRV9QUkVGKTtcbiAgICBldmVudHMuc3ViKCdwcmVmY2hhbmdlJywgdGhpcy5vblByZWZDaGFuZ2UpO1xuXG4gICAgLy8gc2V0IHVwIG1ldGFkYXRhIHRvIGJlIHNlbnQgd2l0aCB0cF9ldmVudHMgbWVzc2FnZXNcbiAgICBDbGlxekF0dHJhY2sudHBfZXZlbnRzLnRlbGVtZXRyeUFubm90YXRvcnMucHVzaChmdW5jdGlvbihwYXlsKSB7XG4gICAgICBwYXlsLmNvbmYgPSB7XG4gICAgICAgICdxcyc6IENsaXF6QXR0cmFjay5pc1FTRW5hYmxlZCgpLFxuICAgICAgICAnY29va2llJzogQ2xpcXpBdHRyYWNrLmlzQ29va2llRW5hYmxlZCgpLFxuICAgICAgICAnYmxvb21GaWx0ZXInOiBDbGlxekF0dHJhY2suaXNCbG9vbUZpbHRlckVuYWJsZWQoKSxcbiAgICAgICAgJ3RyYWNrVHh0JzogQ2xpcXpBdHRyYWNrLmlzVHJhY2tlclR4dEVuYWJsZWQoKSxcbiAgICAgICAgJ2ZvcmNlQmxvY2snOiBDbGlxekF0dHJhY2suaXNGb3JjZUJsb2NrRW5hYmxlZCgpLFxuICAgICAgICAndWknOiBiYWNrZ3JvdW5kLmJ1dHRvbkVuYWJsZWRcbiAgICAgIH07XG4gICAgICBwYXlsLnZlciA9IENsaXF6QXR0cmFjay5WRVJTSU9OO1xuICAgICAgcGF5bC5hZGRvbnMgPSBDbGlxekF0dHJhY2suc2ltaWxhckFkZG9uO1xuICAgICAgcGF5bC51cGRhdGVJblRpbWUgPSBDbGlxekF0dHJhY2sucXNfd2hpdGVsaXN0LmlzVXBUb0RhdGUoKTtcbiAgICAgIHJldHVybiBwYXlsO1xuICAgIH0pO1xuICB9LFxuXG4gIGVuYWJsZWQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZW5hYmxlZDtcbiAgfSxcblxuICAvKipcbiAgKiBAbWV0aG9kIHVubG9hZFxuICAqL1xuICB1bmxvYWQoKSB7XG4gICAgaWYgKENsaXF6QXR0cmFjay5nZXRCcm93c2VyTWFqb3JWZXJzaW9uKCkgPCBDbGlxekF0dHJhY2suTUlOX0JST1dTRVJfVkVSU0lPTikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGlmICggdGhpcy5wb3B1cCApIHtcbiAgICAgIHRoaXMucG9wdXAuZGVzdHJveSgpO1xuICAgIH1cblxuICAgIGV2ZW50cy51bl9zdWIoJ3ByZWZjaGFuZ2UnLCB0aGlzLm9uUHJlZkNoYW5nZSk7XG5cbiAgICBpZiAoQ2xpcXpBdHRyYWNrLmlzRW5hYmxlZCgpKSB7XG4gICAgICBDbGlxekF0dHJhY2sudW5sb2FkKCk7XG4gICAgICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICB9XG4gIH0sXG5cbiAgcG9wdXBBY3Rpb25zOiB7XG4gICAgLyoqXG4gICAgKiBAbWV0aG9kIHBvcHVwQWN0aW9ucy5nZXRQb3B1cERhdGFcbiAgICAqIEBwYXJhbSBhcmdzXG4gICAgKiBAcGFyYW0gY2IgQ2FsbGJhY2tcbiAgICAqL1xuICAgIGdldFBvcHVwRGF0YShhcmdzLCBjYikge1xuXG4gICAgICB2YXIgaW5mbyA9IENsaXF6QXR0cmFjay5nZXRDdXJyZW50VGFiQmxvY2tpbmdJbmZvKCksXG4gICAgICAgICAgcHMgPSBpbmZvLnBzO1xuICAgICAgLy8gdmFyIHBzID0gUHJpdmFjeVNjb3JlLmdldChtZDUoaW5mby5ob3N0bmFtZSkuc3Vic3RyaW5nKDAsIDE2KSAgJ3NpdGUnKTtcblxuICAgICAgLy8gcHMuZ2V0UHJpdmFjeVNjb3JlKCk7XG5cbiAgICAgIGNiKHtcbiAgICAgICAgdXJsOiBpbmZvLmhvc3RuYW1lLFxuICAgICAgICBjb29raWVzQ291bnQ6IGluZm8uY29va2llcy5ibG9ja2VkLFxuICAgICAgICByZXF1ZXN0c0NvdW50OiBpbmZvLnJlcXVlc3RzLnVuc2FmZSxcbiAgICAgICAgZW5hYmxlZDogdXRpbHMuZ2V0UHJlZignYW50aVRyYWNrVGVzdCcpLFxuICAgICAgICBpc1doaXRlbGlzdGVkOiBDbGlxekF0dHJhY2suaXNTb3VyY2VXaGl0ZWxpc3RlZChpbmZvLmhvc3RuYW1lKSxcbiAgICAgICAgcmVsb2FkOiBpbmZvLnJlbG9hZCB8fCBmYWxzZSxcbiAgICAgICAgdHJha2Vyc0xpc3Q6IGluZm8sXG4gICAgICAgIHBzOiBwc1xuICAgICAgfSk7XG5cbiAgICAgIGlmICh0aGlzLnBvcHVwKSB7XG4gICAgICAgIHRoaXMucG9wdXAuc2V0QmFkZ2UodXRpbHMuZ2V0V2luZG93KCksIGluZm8uY29va2llcy5ibG9ja2VkICsgaW5mby5yZXF1ZXN0cy51bnNhZmUpO1xuICAgICAgfVxuXG4gICAgICB1dGlscy5jYWxsV2luZG93QWN0aW9uKFxuICAgICAgICB1dGlscy5nZXRXaW5kb3coKSxcbiAgICAgICAgJ2NvbnRyb2wtY2VudGVyJyxcbiAgICAgICAgJ3NldEJhZGdlJyxcbiAgICAgICAgW2luZm8uY29va2llcy5ibG9ja2VkICsgaW5mby5yZXF1ZXN0cy51bnNhZmVdXG4gICAgICApO1xuICAgIH0sXG4gICAgLyoqXG4gICAgKiBAbWV0aG9kIHBvcHVwQWN0aW9ucy50b2dnbGVBdHRyYWNrXG4gICAgKiBAcGFyYW0gYXJnc1xuICAgICogQHBhcmFtIGNiIENhbGxiYWNrXG4gICAgKi9cbiAgICB0b2dnbGVBdHRyYWNrKGFyZ3MsIGNiKSB7XG4gICAgICB2YXIgY3VycmVudFN0YXRlID0gdXRpbHMuZ2V0UHJlZignYW50aVRyYWNrVGVzdCcpO1xuXG4gICAgICBpZiAoY3VycmVudFN0YXRlKSB7XG4gICAgICAgIENsaXF6QXR0cmFjay5kaXNhYmxlTW9kdWxlKCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBDbGlxekF0dHJhY2suZW5hYmxlTW9kdWxlKCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMucG9wdXAudXBkYXRlU3RhdGUodXRpbHMuZ2V0V2luZG93KCksICFjdXJyZW50U3RhdGUpO1xuXG4gICAgICBjYigpO1xuXG4gICAgICB0aGlzLnBvcHVwQWN0aW9ucy50ZWxlbWV0cnkoIHthY3Rpb246ICdjbGljaycsICd0YXJnZXQnOiAoY3VycmVudFN0YXRlID8gJ2RlYWN0aXZhdGUnIDogJ2FjdGl2YXRlJyl9IClcbiAgICB9LFxuICAgIC8qKlxuICAgICogQG1ldGhvZCBwb3B1cEFjdGlvbnMuY2xvc2VQb3B1cFxuICAgICovXG4gICAgY2xvc2VQb3B1cChfLCBjYikge1xuICAgICAgdGhpcy5wb3B1cC50YmIuY2xvc2VQb3B1cCgpO1xuICAgICAgY2IoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICogQG1ldGhvZCBwb3B1cEFjdGlvbnMudG9nZ2xlV2hpdGVMaXN0XG4gICAgKiBAcGFyYW0gYXJnc1xuICAgICogQHBhcmFtIGNiIENhbGxiYWNrXG4gICAgKi9cbiAgICB0b2dnbGVXaGl0ZUxpc3QoYXJncywgY2IpIHtcbiAgICAgIHZhciBob3N0bmFtZSA9IGFyZ3MuaG9zdG5hbWU7XG4gICAgICBpZiAoQ2xpcXpBdHRyYWNrLmlzU291cmNlV2hpdGVsaXN0ZWQoaG9zdG5hbWUpKSB7XG4gICAgICAgIENsaXF6QXR0cmFjay5yZW1vdmVTb3VyY2VEb21haW5Gcm9tV2hpdGVsaXN0KGhvc3RuYW1lKTtcbiAgICAgICAgdGhpcy5wb3B1cEFjdGlvbnMudGVsZW1ldHJ5KCB7IGFjdGlvbjogJ2NsaWNrJywgdGFyZ2V0OiAndW53aGl0ZWxpc3RfZG9tYWluJ30gKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIENsaXF6QXR0cmFjay5hZGRTb3VyY2VEb21haW5Ub1doaXRlbGlzdChob3N0bmFtZSk7XG4gICAgICAgIHRoaXMucG9wdXBBY3Rpb25zLnRlbGVtZXRyeSggeyBhY3Rpb246ICdjbGljaycsIHRhcmdldDogJ3doaXRlbGlzdF9kb21haW4nfSApO1xuICAgICAgfVxuICAgICAgY2IoKTtcbiAgICB9LFxuICAgIC8qKlxuICAgICogQG1ldGhvZCBwb3B1cEFjdGlvbnMudXBkYXRlSGVpZ2h0XG4gICAgKiBAcGFyYW0gYXJnc1xuICAgICogQHBhcmFtIGNiIENhbGxiYWNrXG4gICAgKi9cbiAgICB1cGRhdGVIZWlnaHQoYXJncywgY2IpIHtcbiAgICAgIHRoaXMucG9wdXAudXBkYXRlVmlldyh1dGlscy5nZXRXaW5kb3coKSwgYXJnc1swXSk7XG4gICAgfSxcblxuICAgIF9pc0R1cGxpY2F0ZShpbmZvKSB7XG4gICAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgICAgY29uc3Qga2V5ID0gaW5mby50YWIgKyBpbmZvLmhvc3RuYW1lICsgaW5mby5wYXRoO1xuXG4gICAgICAvLyBjbGVhbiBvbGQgZW50cmllc1xuICAgICAgZm9yIChsZXQgayBvZiBPYmplY3Qua2V5cyh0aGlzLmNsaWNrQ2FjaGUpKSB7XG4gICAgICAgIGlmIChub3cgLSB0aGlzLmNsaWNrQ2FjaGVba10gPiA2MDAwMCkge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLmNsaWNrQ2FjaGVba107XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKGtleSBpbiB0aGlzLmNsaWNrQ2FjaGUpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLmNsaWNrQ2FjaGVba2V5XSA9IG5vdztcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH0sXG5cbiAgICB0ZWxlbWV0cnkobXNnKSB7XG4gICAgICBpZiAobXNnLmluY2x1ZGVVbnNhZmVDb3VudCkge1xuICAgICAgICBkZWxldGUgbXNnLmluY2x1ZGVVbnNhZmVDb3VudFxuICAgICAgICBjb25zdCBpbmZvID0gQ2xpcXpBdHRyYWNrLmdldEN1cnJlbnRUYWJCbG9ja2luZ0luZm8oKTtcbiAgICAgICAgLy8gZHJvcCBkdXBsaWNhdGVkIG1lc3NhZ2VzXG4gICAgICAgIGlmIChpbmZvLmVycm9yIHx8IHRoaXMucG9wdXBBY3Rpb25zLl9pc0R1cGxpY2F0ZShpbmZvKSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBtc2cudW5zYWZlX2NvdW50ID0gaW5mby5jb29raWVzLmJsb2NrZWQgKyBpbmZvLnJlcXVlc3RzLnVuc2FmZTtcbiAgICAgICAgbXNnLnNwZWNpYWwgPSBpbmZvLmVycm9yICE9PSB1bmRlZmluZWQ7XG4gICAgICB9XG4gICAgICBtc2cudHlwZSA9ICdhbnRpdHJhY2tpbmcnO1xuICAgICAgdXRpbHMudGVsZW1ldHJ5KG1zZyk7XG4gICAgfVxuICB9LFxuXG4gIGV2ZW50czoge1xuICAgIFwiY29yZS50YWJfbG9jYXRpb25fY2hhbmdlXCI6IENsaXF6QXR0cmFjay5vblRhYkxvY2F0aW9uQ2hhbmdlLFxuICAgIFwiY29yZS50YWJfc3RhdGVfY2hhbmdlXCI6IENsaXF6QXR0cmFjay50YWJfbGlzdGVuZXIub25TdGF0ZUNoYW5nZS5iaW5kKENsaXF6QXR0cmFjay50YWJfbGlzdGVuZXIpLFxuICAgIFwiY29udHJvbC1jZW50ZXI6YW50aXRyYWNraW5nLXN0cmljdFwiOiBmdW5jdGlvbiAoKSB7XG4gICAgICB1dGlscy5zZXRQcmVmKCdhdHRyYWNrRm9yY2VCbG9jaycsICF1dGlscy5nZXRQcmVmKCdhdHRyYWNrRm9yY2VCbG9jaycsIGZhbHNlKSk7XG4gICAgfSxcbiAgICBcImNvbnRyb2wtY2VudGVyOmFudGl0cmFja2luZy1hY3RpdmF0b3JcIjogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgIGlmKGRhdGEuc3RhdHVzID09ICdhY3RpdmUnKXtcbiAgICAgICAgLy8gd2hlbiB3ZSBhY3RpdmF0ZSB3ZSBhbHNvIHJlbW92ZSB0aGUgY3VycmVudCB1cmwgZnJvbSB3aGl0ZWxpc3RcbiAgICAgICAgdXRpbHMuc2V0UHJlZignYW50aVRyYWNrVGVzdCcsIHRydWUpO1xuICAgICAgICBpZihDbGlxekF0dHJhY2suaXNTb3VyY2VXaGl0ZWxpc3RlZChkYXRhLmhvc3RuYW1lKSl7XG4gICAgICAgICAgQ2xpcXpBdHRyYWNrLnJlbW92ZVNvdXJjZURvbWFpbkZyb21XaGl0ZWxpc3QoZGF0YS5ob3N0bmFtZSk7XG4gICAgICAgICAgdGhpcy5wb3B1cEFjdGlvbnMudGVsZW1ldHJ5KCB7IGFjdGlvbjogJ2NsaWNrJywgdGFyZ2V0OiAndW53aGl0ZWxpc3RfZG9tYWluJ30gKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmKGRhdGEuc3RhdHVzID09ICdpbmFjdGl2ZScpe1xuICAgICAgICAvLyBpbmFjdGl2ZSBtZWFucyB0aGF0IHRoZSBjdXJyZW50IHVybCBpcyB3aGl0ZWxpc3RlZCBidXQgdGhlIHdob2xlIG1lY2hhbmlzbSBpcyBvblxuICAgICAgICBDbGlxekF0dHJhY2suYWRkU291cmNlRG9tYWluVG9XaGl0ZWxpc3QoZGF0YS5ob3N0bmFtZSk7XG4gICAgICAgIGlmKHV0aWxzLmdldFByZWYoJ2FudGlUcmFja1Rlc3QnLCBmYWxzZSkgPT0gZmFsc2Upe1xuICAgICAgICAgIHV0aWxzLnNldFByZWYoJ2FudGlUcmFja1Rlc3QnLCB0cnVlKVxuICAgICAgICB9XG4gICAgICAgIHRoaXMucG9wdXBBY3Rpb25zLnRlbGVtZXRyeSh7IGFjdGlvbjogJ2NsaWNrJywgdGFyZ2V0OiAnd2hpdGVsaXN0X2RvbWFpbicgfSk7XG4gICAgICB9IGVsc2UgaWYoZGF0YS5zdGF0dXMgPT0gJ2NyaXRpY2FsJyl7XG4gICAgICAgIC8vIG9uIGNyaXRpY2FsIHdlIGRpc2FibGUgYW50aSB0cmFja2luZyBjb21wbGV0ZWx5IHNvIHdlIG11c3QgYWxzbyBjbGVhbiB0aGUgY3VycmVudCB1cmwgZnJvbSB3aGl0ZWxpc3RcbiAgICAgICAgdXRpbHMuc2V0UHJlZignYW50aVRyYWNrVGVzdCcsIGZhbHNlKTtcbiAgICAgICAgaWYoQ2xpcXpBdHRyYWNrLmlzU291cmNlV2hpdGVsaXN0ZWQoZGF0YS5ob3N0bmFtZSkpe1xuICAgICAgICAgIENsaXF6QXR0cmFjay5yZW1vdmVTb3VyY2VEb21haW5Gcm9tV2hpdGVsaXN0KGRhdGEuaG9zdG5hbWUpO1xuICAgICAgICAgIHRoaXMucG9wdXBBY3Rpb25zLnRlbGVtZXRyeSggeyBhY3Rpb246ICdjbGljaycsIHRhcmdldDogJ3Vud2hpdGVsaXN0X2RvbWFpbid9ICk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0sXG5cbn0pO1xuIl19