System.register('antitracking/qs-whitelists', ['antitracking/persistent-state', 'antitracking/time', 'core/cliqz', 'antitracking/md5', 'antitracking/qs-whitelist-base'], function (_export) {
  'use strict';

  var persist, datetime, utils, events, md5, QSWhitelistBase, updateExpire, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  return {
    setters: [function (_antitrackingPersistentState) {
      persist = _antitrackingPersistentState;
    }, function (_antitrackingTime) {
      datetime = _antitrackingTime;
    }, function (_coreCliqz) {
      utils = _coreCliqz.utils;
      events = _coreCliqz.events;
    }, function (_antitrackingMd5) {
      md5 = _antitrackingMd5['default'];
    }, function (_antitrackingQsWhitelistBase) {
      QSWhitelistBase = _antitrackingQsWhitelistBase['default'];
    }],
    execute: function () {
      updateExpire = 48;

      _default = (function (_QSWhitelistBase) {
        _inherits(_default, _QSWhitelistBase);

        function _default() {
          _classCallCheck(this, _default);

          _get(Object.getPrototypeOf(_default.prototype), 'constructor', this).call(this);
          this.safeTokens = new persist.LazyPersistentObject('tokenExtWhitelist');
          this.trackerDomains = new persist.LazyPersistentObject('trackerDomains');
          this.unsafeKeys = new persist.LazyPersistentObject('unsafeKey');
          this.lastUpdate = ['0', '0', '0', '0'];

          this.TOKEN_WHITELIST_URL = 'https://cdn.cliqz.com/anti-tracking/whitelist/whitelist_tokens.json';
          this.TRACKER_DM_URL = 'https://cdn.cliqz.com/anti-tracking/whitelist/tracker_domains.json';
          this.SAFE_KEY_URL = 'https://cdn.cliqz.com/anti-tracking/whitelist/domain_safe_key.json';
          this.UNSAFE_KEY_URL = 'https://cdn.cliqz.com/anti-tracking/whitelist/domain_unsafe_key.json';
        }

        _createClass(_default, [{
          key: 'init',
          value: function init() {
            var _this = this;

            _get(Object.getPrototypeOf(_default.prototype), 'init', this).call(this);
            this.safeTokens.load();
            this.unsafeKeys.load();
            this.trackerDomains.load();
            try {
              this.lastUpdate = JSON.parse(persist.getValue('lastUpdate'));
              if (this.lastUpdate.length !== 4) {
                throw 'invalid lastUpdate value';
              }
            } catch (e) {
              this.lastUpdate = ['0', '0', '0', '0'];
            }

            // list update events
            this.onConfigUpdate = (function (config) {
              var currentSafeKey = persist.getValue('safeKeyExtVersion', ''),
                  currentToken = persist.getValue('tokenWhitelistVersion', ''),
                  currentUnsafeKey = persist.getValue('unsafeKeyExtVersion', ''),
                  currentTracker = persist.getValue('trackerDomainsversion', '');
              // check safekey
              utils.log('Safe keys: ' + config.safekey_version + ' vs ' + currentSafeKey, 'attrack');
              if (config.safekey_version && currentSafeKey !== config.safekey_version) {
                _this._loadRemoteSafeKey(config.force_clean === true);
              }
              utils.log('Token whitelist: ' + config.whitelist_token_version + ' vs ' + currentToken, 'attrack');
              if (config.token_whitelist_version && currentToken !== config.whitelist_token_version) {
                _this._loadRemoteTokenWhitelist();
              }
              utils.log('Tracker Domain: ' + config.tracker_domain_version + ' vs ' + currentTracker, 'attrack');
              if (config.tracker_domain_version && currentTracker !== config.tracker_domain_version) {
                _this._loadRemoteTrackerDomainList();
              }
              utils.log('Unsafe keys: ' + config.unsafekey_version + ' vs ' + currentUnsafeKey, 'attrack');
              if (config.token_whitelist_version && currentToken !== config.token_whitelist_version) {
                _this._loadRemoteUnsafeKey();
              }
            }).bind(this);

            events.sub('attrack:updated_config', this.onConfigUpdate);
          }
        }, {
          key: 'destroy',
          value: function destroy() {
            _get(Object.getPrototypeOf(_default.prototype), 'destroy', this).call(this);
            events.un_sub('attrack:updated_config', this.onConfigUpdate);
          }
        }, {
          key: 'isUpToDate',
          value: function isUpToDate() {
            var delay = updateExpire,
                hour = datetime.newUTCDate();
            hour.setHours(hour.getHours() - delay);
            var hourCutoff = datetime.hourString(hour);
            return this.lastUpdate.every(function (t) {
              return t > hourCutoff;
            });
          }
        }, {
          key: 'isReady',
          value: function isReady() {
            // just check they're not null
            return this.safeTokens.value && this.safeKeys.value && this.unsafeKeys.value && this.trackerDomains.value;
          }
        }, {
          key: 'isSafeKey',
          value: function isSafeKey(domain, key) {
            return !this.isUnsafeKey(domain, key) && domain in this.safeKeys.value && key in this.safeKeys.value[domain];
          }
        }, {
          key: 'isUnsafeKey',
          value: function isUnsafeKey(domain, key) {
            return this.isTrackerDomain(domain) && domain in this.unsafeKeys.value && key in this.unsafeKeys.value[domain];
          }
        }, {
          key: 'addSafeKey',
          value: function addSafeKey(domain, key, valueCount) {
            if (this.isUnsafeKey(domain, key)) {
              return; // keys in the unsafekey list should not be added to safekey list
            }
            var today = datetime.dateString(datetime.newUTCDate());
            if (!(domain in this.safeKeys.value)) {
              this.safeKeys.value[domain] = {};
            }
            this.safeKeys.value[domain][key] = [today, 'l', valueCount];
            this.safeKeys.setDirty();
          }
        }, {
          key: 'isTrackerDomain',
          value: function isTrackerDomain(domain) {
            return domain in this.trackerDomains.value;
          }
        }, {
          key: 'isSafeToken',
          value: function isSafeToken(domain, token) {
            return this.isTrackerDomain(domain) && token in this.safeTokens.value;
          }
        }, {
          key: 'addSafeToken',
          value: function addSafeToken(domain, token) {
            this.trackerDomains.value[domain] = true;
            if (token && token !== '') {
              this.safeTokens.value[token] = true;
            }
          }
        }, {
          key: 'addUnsafeKey',
          value: function addUnsafeKey(domain, key) {
            if (!(domain in this.unsafeKeys.value)) {
              this.unsafeKeys.value[domain] = {};
            }
            this.unsafeKeys.value[domain][key] = true;
          }
        }, {
          key: 'getVersion',
          value: function getVersion() {
            return {
              whitelist: persist.getValue('tokenWhitelistVersion', ''),
              safeKey: persist.getValue('safeKeyExtVersion', ''),
              unsafeKey: persist.getValue('unsafeKeyExtVersion', ''),
              trackerDomains: persist.getValue('trackerDomainsVersion', '')
            };
          }
        }, {
          key: '_loadRemoteTokenWhitelist',
          value: function _loadRemoteTokenWhitelist() {
            var today = datetime.getTime().substring(0, 10);
            utils.httpGet(this.TOKEN_WHITELIST_URL + '?' + today, (function (req) {
              var rList = JSON.parse(req.response),
                  rListMd5 = md5(req.response);
              this.safeTokens.setValue(rList);
              persist.setValue('tokenWhitelistVersion', rListMd5);
              this.lastUpdate[1] = datetime.getTime();
              persist.setValue('lastUpdate', JSON.stringify(this.lastUpdate));
              events.pub('attrack:token_whitelist_updated', rListMd5);
            }).bind(this), function () {}, 100000);
          }
        }, {
          key: '_loadRemoteTrackerDomainList',
          value: function _loadRemoteTrackerDomainList() {
            var today = datetime.getTime().substring(0, 10);
            utils.httpGet(this.TRACKER_DM_URL + '?' + today, (function (req) {
              var rList = JSON.parse(req.response),
                  rListMd5 = md5(req.response);
              this.trackerDomains.setValue(rList);
              persist.setValue('trackerDomainsversion', rListMd5);
              this.lastUpdate[3] = datetime.getTime();
              persist.setValue('lastUpdate', JSON.stringify(this.lastUpdate));
            }).bind(this), function () {}, 100000);
          }
        }, {
          key: '_loadRemoteSafeKey',
          value: function _loadRemoteSafeKey(forceClean) {
            var today = datetime.getTime().substring(0, 10);
            if (forceClean) {
              this.safeKeys.clear();
            }
            utils.httpGet(this.SAFE_KEY_URL + '?' + today, (function (req) {
              var safeKey = JSON.parse(req.response),
                  s,
                  k,
                  safeKeyExtVersion = md5(req.response);
              for (s in safeKey) {
                for (k in safeKey[s]) {
                  // r for remote keys
                  safeKey[s][k] = [safeKey[s][k], 'r'];
                }
              }
              for (s in safeKey) {
                if (!(s in this.safeKeys.value)) {
                  this.safeKeys.value[s] = safeKey[s];
                } else {
                  for (var key in safeKey[s]) {
                    if (this.safeKeys.value[s][key] == null || this.safeKeys.value[s][key][0] < safeKey[s][key][0]) {
                      this.safeKeys.value[s][key] = safeKey[s][key];
                    }
                  }
                }
              }
              this._pruneSafeKeys();
              this.lastUpdate[0] = datetime.getTime();
              persist.setValue('lastUpdate', JSON.stringify(this.lastUpdate));
              this.safeKeys.setDirty();
              this.safeKeys.save();
              persist.setValue('safeKeyExtVersion', safeKeyExtVersion);
              events.pub('attrack:safekeys_updated', safeKeyExtVersion, forceClean);
            }).bind(this), function () {
              // on error
            }, 60000);
          }
        }, {
          key: '_loadRemoteUnsafeKey',
          value: function _loadRemoteUnsafeKey() {
            var today = datetime.getTime().substring(0, 10);
            utils.log(this.UNSAFE_KEY_URL);
            utils.httpGet(this.UNSAFE_KEY_URL + '?' + today, (function (req) {
              var unsafeKeys = JSON.parse(req.response),
                  unsafeKeyExtVersion = md5(req.response);
              this.unsafeKeys.setValue(unsafeKeys);
              this.lastUpdate[2] = datetime.getTime();
              persist.setValue('lastUpdate', JSON.stringify(this.lastUpdate));
              persist.setValue('unsafeKeyExtVesion', unsafeKeyExtVersion);
              this.unsafeKeys.setDirty();
              this.unsafeKeys.save();
            }).bind(this), function () {}, 100000);
          }
        }]);

        return _default;
      })(QSWhitelistBase);

      _export('default', _default);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy9xcy13aGl0ZWxpc3RzLmVzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs4REFNTSxZQUFZOzs7Ozs7Ozs7Ozs7Ozs7O3lCQUpULEtBQUs7MEJBQUUsTUFBTTs7Ozs7OztBQUloQixrQkFBWSxHQUFHLEVBQUU7Ozs7O0FBSVYsNEJBQUc7OztBQUNaLDBGQUFRO0FBQ1IsY0FBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLE9BQU8sQ0FBQyxvQkFBb0IsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO0FBQ3hFLGNBQUksQ0FBQyxjQUFjLEdBQUcsSUFBSSxPQUFPLENBQUMsb0JBQW9CLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztBQUN6RSxjQUFJLENBQUMsVUFBVSxHQUFHLElBQUksT0FBTyxDQUFDLG9CQUFvQixDQUFDLFdBQVcsQ0FBQyxDQUFDO0FBQ2hFLGNBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLENBQUMsQ0FBQzs7QUFFdkMsY0FBSSxDQUFDLG1CQUFtQixHQUFHLHFFQUFxRSxDQUFDO0FBQ2pHLGNBQUksQ0FBQyxjQUFjLEdBQUcsb0VBQW9FLENBQUM7QUFDM0YsY0FBSSxDQUFDLFlBQVksR0FBRyxvRUFBb0UsQ0FBQztBQUN6RixjQUFJLENBQUMsY0FBYyxHQUFHLHNFQUFzRSxDQUFDO1NBQzlGOzs7O2lCQUVHLGdCQUFHOzs7QUFDTCxxRkFBYTtBQUNiLGdCQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3ZCLGdCQUFJLENBQUMsVUFBVSxDQUFDLElBQUksRUFBRSxDQUFDO0FBQ3ZCLGdCQUFJLENBQUMsY0FBYyxDQUFDLElBQUksRUFBRSxDQUFDO0FBQzNCLGdCQUFJO0FBQ0Ysa0JBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxPQUFPLENBQUMsUUFBUSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUM7QUFDN0Qsa0JBQUksSUFBSSxD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O0FBQ3hDLHFCQUFPLENBQUMsUUFBUSxDQUFDLFlBQVksRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDO0FBQ2hFLHFCQUFPLENBQUMsUUFBUSxDQUFDLG9CQUFvQixFQUFFLG1CQUFtQixDQUFDLENBQUM7QUFDNUQsa0JBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDM0Isa0JBQUksQ0FBQyxVQUFVLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDeEIsQ0FBQSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxZQUFXLEVBQUUsRUFBRSxNQUFNLENBQUMsQ0FBQztXQUN0Qzs7OztTQWpOMEIsZUFBZSIsImZpbGUiOiJhbnRpdHJhY2tpbmcvcXMtd2hpdGVsaXN0cy5lcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHBlcnNpc3QgZnJvbSAnYW50aXRyYWNraW5nL3BlcnNpc3RlbnQtc3RhdGUnO1xuaW1wb3J0ICogYXMgZGF0ZXRpbWUgZnJvbSAnYW50aXRyYWNraW5nL3RpbWUnO1xuaW1wb3J0IHsgdXRpbHMsIGV2ZW50cyB9IGZyb20gJ2NvcmUvY2xpcXonO1xuaW1wb3J0IG1kNSBmcm9tICdhbnRpdHJhY2tpbmcvbWQ1JztcbmltcG9ydCBRU1doaXRlbGlzdEJhc2UgZnJvbSAnYW50aXRyYWNraW5nL3FzLXdoaXRlbGlzdC1iYXNlJztcblxuY29uc3QgdXBkYXRlRXhwaXJlID0gNDg7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIGV4dGVuZHMgUVNXaGl0ZWxpc3RCYXNlIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICBzdXBlcigpO1xuICAgIHRoaXMuc2FmZVRva2VucyA9IG5ldyBwZXJzaXN0LkxhenlQZXJzaXN0ZW50T2JqZWN0KCd0b2tlbkV4dFdoaXRlbGlzdCcpO1xuICAgIHRoaXMudHJhY2tlckRvbWFpbnMgPSBuZXcgcGVyc2lzdC5MYXp5UGVyc2lzdGVudE9iamVjdCgndHJhY2tlckRvbWFpbnMnKTtcbiAgICB0aGlzLnVuc2FmZUtleXMgPSBuZXcgcGVyc2lzdC5MYXp5UGVyc2lzdGVudE9iamVjdCgndW5zYWZlS2V5Jyk7XG4gICAgdGhpcy5sYXN0VXBkYXRlID0gWycwJywgJzAnLCAnMCcsICcwJ107XG5cbiAgICB0aGlzLlRPS0VOX1dISVRFTElTVF9VUkwgPSAnaHR0cHM6Ly9jZG4uY2xpcXouY29tL2FudGktdHJhY2tpbmcvd2hpdGVsaXN0L3doaXRlbGlzdF90b2tlbnMuanNvbic7XG4gICAgdGhpcy5UUkFDS0VSX0RNX1VSTCA9ICdodHRwczovL2Nkbi5jbGlxei5jb20vYW50aS10cmFja2luZy93aGl0ZWxpc3QvdHJhY2tlcl9kb21haW5zLmpzb24nO1xuICAgIHRoaXMuU0FGRV9LRVlfVVJMID0gJ2h0dHBzOi8vY2RuLmNsaXF6LmNvbS9hbnRpLXRyYWNraW5nL3doaXRlbGlzdC9kb21haW5fc2FmZV9rZXkuanNvbic7XG4gICAgdGhpcy5VTlNBRkVfS0VZX1VSTCA9ICdodHRwczovL2Nkbi5jbGlxei5jb20vYW50aS10cmFja2luZy93aGl0ZWxpc3QvZG9tYWluX3Vuc2FmZV9rZXkuanNvbic7XG4gIH1cblxuICBpbml0KCkge1xuICAgIHN1cGVyLmluaXQoKTtcbiAgICB0aGlzLnNhZmVUb2tlbnMubG9hZCgpO1xuICAgIHRoaXMudW5zYWZlS2V5cy5sb2FkKCk7XG4gICAgdGhpcy50cmFja2VyRG9tYWlucy5sb2FkKCk7XG4gICAgdHJ5IHtcbiAgICAgIHRoaXMubGFzdFVwZGF0ZSA9IEpTT04ucGFyc2UocGVyc2lzdC5nZXRWYWx1ZSgnbGFzdFVwZGF0ZScpKTtcbiAgICAgIGlmICh0aGlzLmxhc3RVcGRhdGUubGVuZ3RoICE9PSA0KSB7XG4gICAgICAgICAgdGhyb3cgJ2ludmFsaWQgbGFzdFVwZGF0ZSB2YWx1ZSc7XG4gICAgICB9XG4gICAgfSBjYXRjaChlKSB7XG4gICAgICB0aGlzLmxhc3RVcGRhdGUgPSBbJzAnLCAnMCcsICcwJywgJzAnXTtcbiAgICB9XG5cbiAgICAvLyBsaXN0IHVwZGF0ZSBldmVudHNcbiAgICB0aGlzLm9uQ29uZmlnVXBkYXRlID0gKGNvbmZpZykgPT4ge1xuICAgICAgdmFyIGN1cnJlbnRTYWZlS2V5ID0gcGVyc2lzdC5nZXRWYWx1ZSgnc2FmZUtleUV4dFZlcnNpb24nLCAnJyksXG4gICAgICAgICAgY3VycmVudFRva2VuID0gcGVyc2lzdC5nZXRWYWx1ZSgndG9rZW5XaGl0ZWxpc3RWZXJzaW9uJywgJycpLFxuICAgICAgICAgIGN1cnJlbnRVbnNhZmVLZXkgPSBwZXJzaXN0LmdldFZhbHVlKCd1bnNhZmVLZXlFeHRWZXJzaW9uJywgJycpLFxuICAgICAgICAgIGN1cnJlbnRUcmFja2VyID0gcGVyc2lzdC5nZXRWYWx1ZSgndHJhY2tlckRvbWFpbnN2ZXJzaW9uJywgJycpO1xuICAgICAgLy8gY2hlY2sgc2FmZWtleVxuICAgICAgdXRpbHMubG9nKCdTYWZlIGtleXM6ICcrIGNvbmZpZy5zYWZla2V5X3ZlcnNpb24gKyAnIHZzICcgKyBjdXJyZW50U2FmZUtleSwgJ2F0dHJhY2snKTtcbiAgICAgIGlmIChjb25maWcuc2FmZWtleV92ZXJzaW9uICYmIGN1cnJlbnRTYWZlS2V5ICE9PSBjb25maWcuc2FmZWtleV92ZXJzaW9uKSB7XG4gICAgICAgIHRoaXMuX2xvYWRSZW1vdGVTYWZlS2V5KGNvbmZpZy5mb3JjZV9jbGVhbiA9PT0gdHJ1ZSk7XG4gICAgICB9XG4gICAgICB1dGlscy5sb2coJ1Rva2VuIHdoaXRlbGlzdDogJysgY29uZmlnLndoaXRlbGlzdF90b2tlbl92ZXJzaW9uICsgJyB2cyAnICsgY3VycmVudFRva2VuLCAnYXR0cmFjaycpO1xuICAgICAgaWYgKGNvbmZpZy50b2tlbl93aGl0ZWxpc3RfdmVyc2lvbiAmJiBjdXJyZW50VG9rZW4gIT09IGNvbmZpZy53aGl0ZWxpc3RfdG9rZW5fdmVyc2lvbikge1xuICAgICAgICB0aGlzLl9sb2FkUmVtb3RlVG9rZW5XaGl0ZWxpc3QoKTtcbiAgICAgIH1cbiAgICAgIHV0aWxzLmxvZygnVHJhY2tlciBEb21haW46ICcrIGNvbmZpZy50cmFja2VyX2RvbWFpbl92ZXJzaW9uICsgJyB2cyAnICsgY3VycmVudFRyYWNrZXIsICdhdHRyYWNrJyk7XG4gICAgICBpZiAoY29uZmlnLnRyYWNrZXJfZG9tYWluX3ZlcnNpb24gJiYgY3VycmVudFRyYWNrZXIgIT09IGNvbmZpZy50cmFja2VyX2RvbWFpbl92ZXJzaW9uKSB7XG4gICAgICAgIHRoaXMuX2xvYWRSZW1vdGVUcmFja2VyRG9tYWluTGlzdCgpO1xuICAgICAgfVxuICAgICAgdXRpbHMubG9nKCdVbnNhZmUga2V5czogJysgY29uZmlnLnVuc2FmZWtleV92ZXJzaW9uICsgJyB2cyAnICsgY3VycmVudFVuc2FmZUtleSwgJ2F0dHJhY2snKTtcbiAgICAgIGlmIChjb25maWcudG9rZW5fd2hpdGVsaXN0X3ZlcnNpb24gJiYgY3VycmVudFRva2VuICE9PSBjb25maWcudG9rZW5fd2hpdGVsaXN0X3ZlcnNpb24pIHtcbiAgICAgICAgdGhpcy5fbG9hZFJlbW90ZVVuc2FmZUtleSgpO1xuICAgICAgfVxuICAgIH0uYmluZCh0aGlzKTtcblxuICAgIGV2ZW50cy5zdWIoJ2F0dHJhY2s6dXBkYXRlZF9jb25maWcnLCB0aGlzLm9uQ29uZmlnVXBkYXRlKTtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG4gICAgc3VwZXIuZGVzdHJveSgpO1xuICAgIGV2ZW50cy51bl9zdWIoJ2F0dHJhY2s6dXBkYXRlZF9jb25maWcnLCB0aGlzLm9uQ29uZmlnVXBkYXRlKTtcbiAgfVxuXG4gIGlzVXBUb0RhdGUoKSB7XG4gICAgdmFyIGRlbGF5ID0gdXBkYXRlRXhwaXJlLFxuICAgICAgICBob3VyID0gZGF0ZXRpbWUubmV3VVRDRGF0ZSgpO1xuICAgIGhvdXIuc2V0SG91cnMoaG91ci5nZXRIb3VycygpIC0gZGVsYXkpO1xuICAgIHZhciBob3VyQ3V0b2ZmID0gZGF0ZXRpbWUuaG91clN0cmluZyhob3VyKTtcbiAgICByZXR1cm4gdGhpcy5sYXN0VXBkYXRlLmV2ZXJ5KCh0KSA9PiB7cmV0dXJuIHQgPiBob3VyQ3V0b2ZmO30pO1xuICB9XG5cbiAgaXNSZWFkeSgpIHtcbiAgICAvLyBqdXN0IGNoZWNrIHRoZXkncmUgbm90IG51bGxcbiAgICByZXR1cm4gdGhpcy5zYWZlVG9rZW5zLnZhbHVlICYmIHRoaXMuc2FmZUtleXMudmFsdWUgJiYgdGhpcy51bnNhZmVLZXlzLnZhbHVlICYmIHRoaXMudHJhY2tlckRvbWFpbnMudmFsdWU7XG4gIH1cblxuICBpc1NhZmVLZXkoZG9tYWluLCBrZXkpIHtcbiAgICByZXR1cm4gKCF0aGlzLmlzVW5zYWZlS2V5KGRvbWFpbiwga2V5KSkgJiYgZG9tYWluIGluIHRoaXMuc2FmZUtleXMudmFsdWUgJiYga2V5IGluIHRoaXMuc2FmZUtleXMudmFsdWVbZG9tYWluXTtcbiAgfVxuXG4gIGlzVW5zYWZlS2V5KGRvbWFpbiwga2V5KSB7XG4gICAgcmV0dXJuIHRoaXMuaXNUcmFja2VyRG9tYWluKGRvbWFpbikgJiYgZG9tYWluIGluIHRoaXMudW5zYWZlS2V5cy52YWx1ZSAmJiBrZXkgaW4gdGhpcy51bnNhZmVLZXlzLnZhbHVlW2RvbWFpbl07XG4gIH1cblxuICBhZGRTYWZlS2V5KGRvbWFpbiwga2V5LCB2YWx1ZUNvdW50KSB7XG4gICAgaWYgKHRoaXMuaXNVbnNhZmVLZXkoZG9tYWluLCBrZXkpKSB7XG4gICAgICByZXR1cm47ICAvLyBrZXlzIGluIHRoZSB1bnNhZmVrZXkgbGlzdCBzaG91bGQgbm90IGJlIGFkZGVkIHRvIHNhZmVrZXkgbGlzdFxuICAgIH1cbiAgICBsZXQgdG9kYXkgPSBkYXRldGltZS5kYXRlU3RyaW5nKGRhdGV0aW1lLm5ld1VUQ0RhdGUoKSk7XG4gICAgaWYgKCEoZG9tYWluIGluIHRoaXMuc2FmZUtleXMudmFsdWUpKSB7XG4gICAgICB0aGlzLnNhZmVLZXlzLnZhbHVlW2RvbWFpbl0gPSB7fTtcbiAgICB9XG4gICAgdGhpcy5zYWZlS2V5cy52YWx1ZVtkb21haW5dW2tleV0gPSBbdG9kYXksICdsJywgdmFsdWVDb3VudF07XG4gICAgdGhpcy5zYWZlS2V5cy5zZXREaXJ0eSgpO1xuICB9XG5cbiAgaXNUcmFja2VyRG9tYWluKGRvbWFpbikge1xuICAgIHJldHVybiBkb21haW4gaW4gdGhpcy50cmFja2VyRG9tYWlucy52YWx1ZTtcbiAgfVxuXG4gIGlzU2FmZVRva2VuKGRvbWFpbiwgdG9rZW4pIHtcbiAgICByZXR1cm4gdGhpcy5pc1RyYWNrZXJEb21haW4oZG9tYWluKSAmJiB0b2tlbiBpbiB0aGlzLnNhZmVUb2tlbnMudmFsdWU7XG4gIH1cblxuICBhZGRTYWZlVG9rZW4oZG9tYWluLCB0b2tlbikge1xuICAgIHRoaXMudHJhY2tlckRvbWFpbnMudmFsdWVbZG9tYWluXSA9IHRydWU7XG4gICAgaWYgKHRva2VuICYmIHRva2VuICE9PSAnJykge1xuICAgICAgdGhpcy5zYWZlVG9rZW5zLnZhbHVlW3Rva2VuXSA9IHRydWU7XG4gICAgfVxuICB9XG5cbiAgYWRkVW5zYWZlS2V5KGRvbWFpbiwga2V5KSB7XG4gICAgaWYgKCEoZG9tYWluIGluIHRoaXMudW5zYWZlS2V5cy52YWx1ZSkpIHtcbiAgICAgIHRoaXMudW5zYWZlS2V5cy52YWx1ZVtkb21haW5dID0ge307XG4gICAgfVxuICAgIHRoaXMudW5zYWZlS2V5cy52YWx1ZVtkb21haW5dW2tleV0gPSB0cnVlO1xuICB9XG5cbiAgZ2V0VmVyc2lvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgd2hpdGVsaXN0OiBwZXJzaXN0LmdldFZhbHVlKCd0b2tlbldoaXRlbGlzdFZlcnNpb24nLCAnJyksXG4gICAgICBzYWZlS2V5OiBwZXJzaXN0LmdldFZhbHVlKCdzYWZlS2V5RXh0VmVyc2lvbicsICcnKSxcbiAgICAgIHVuc2FmZUtleTogcGVyc2lzdC5nZXRWYWx1ZSgndW5zYWZlS2V5RXh0VmVyc2lvbicsICcnKSxcbiAgICAgIHRyYWNrZXJEb21haW5zOiBwZXJzaXN0LmdldFZhbHVlKCd0cmFja2VyRG9tYWluc1ZlcnNpb24nLCAnJylcbiAgICB9O1xuICB9XG5cbiAgX2xvYWRSZW1vdGVUb2tlbldoaXRlbGlzdCgpIHtcbiAgICB2YXIgdG9kYXkgPSBkYXRldGltZS5nZXRUaW1lKCkuc3Vic3RyaW5nKDAsIDEwKTtcbiAgICB1dGlscy5odHRwR2V0KHRoaXMuVE9LRU5fV0hJVEVMSVNUX1VSTCArJz8nKyB0b2RheSwgZnVuY3Rpb24ocmVxKSB7XG4gICAgICB2YXIgckxpc3QgPSBKU09OLnBhcnNlKHJlcS5yZXNwb25zZSksXG4gICAgICAgICAgckxpc3RNZDUgPSBtZDUocmVxLnJlc3BvbnNlKTtcbiAgICAgIHRoaXMuc2FmZVRva2Vucy5zZXRWYWx1ZShyTGlzdCk7XG4gICAgICBwZXJzaXN0LnNldFZhbHVlKCd0b2tlbldoaXRlbGlzdFZlcnNpb24nLCByTGlzdE1kNSk7XG4gICAgICB0aGlzLmxhc3RVcGRhdGVbMV0gPSBkYXRldGltZS5nZXRUaW1lKCk7XG4gICAgICBwZXJzaXN0LnNldFZhbHVlKCdsYXN0VXBkYXRlJywgSlNPTi5zdHJpbmdpZnkodGhpcy5sYXN0VXBkYXRlKSk7XG4gICAgICBldmVudHMucHViKCdhdHRyYWNrOnRva2VuX3doaXRlbGlzdF91cGRhdGVkJywgckxpc3RNZDUpO1xuICAgIH0uYmluZCh0aGlzKSxcbiAgICBmdW5jdGlvbigpIHt9LFxuICAgIDEwMDAwMCk7XG4gIH1cblxuICBfbG9hZFJlbW90ZVRyYWNrZXJEb21haW5MaXN0KCkge1xuICAgIHZhciB0b2RheSA9IGRhdGV0aW1lLmdldFRpbWUoKS5zdWJzdHJpbmcoMCwgMTApO1xuICAgIHV0aWxzLmh0dHBHZXQodGhpcy5UUkFDS0VSX0RNX1VSTCArJz8nKyB0b2RheSwgZnVuY3Rpb24ocmVxKSB7XG4gICAgICB2YXIgckxpc3QgPSBKU09OLnBhcnNlKHJlcS5yZXNwb25zZSksXG4gICAgICAgICAgckxpc3RNZDUgPSBtZDUocmVxLnJlc3BvbnNlKTtcbiAgICAgIHRoaXMudHJhY2tlckRvbWFpbnMuc2V0VmFsdWUockxpc3QpO1xuICAgICAgcGVyc2lzdC5zZXRWYWx1ZSgndHJhY2tlckRvbWFpbnN2ZXJzaW9uJywgckxpc3RNZDUpO1xuICAgICAgdGhpcy5sYXN0VXBkYXRlWzNdID0gZGF0ZXRpbWUuZ2V0VGltZSgpO1xuICAgICAgcGVyc2lzdC5zZXRWYWx1ZSgnbGFzdFVwZGF0ZScsIEpTT04uc3RyaW5naWZ5KHRoaXMubGFzdFVwZGF0ZSkpO1xuICAgIH0uYmluZCh0aGlzKSxcbiAgICBmdW5jdGlvbigpIHt9LFxuICAgIDEwMDAwMCk7XG4gIH1cblxuICBfbG9hZFJlbW90ZVNhZmVLZXkoZm9yY2VDbGVhbikge1xuICAgIHZhciB0b2RheSA9IGRhdGV0aW1lLmdldFRpbWUoKS5zdWJzdHJpbmcoMCwgMTApO1xuICAgIGlmIChmb3JjZUNsZWFuKSB7XG4gICAgICB0aGlzLnNhZmVLZXlzLmNsZWFyKCk7XG4gICAgfVxuICAgIHV0aWxzLmh0dHBHZXQodGhpcy5TQUZFX0tFWV9VUkwgKyc/JysgdG9kYXksIGZ1bmN0aW9uKHJlcSkge1xuICAgICAgdmFyIHNhZmVLZXkgPSBKU09OLnBhcnNlKHJlcS5yZXNwb25zZSksXG4gICAgICAgICAgcywgayxcbiAgICAgICAgICBzYWZlS2V5RXh0VmVyc2lvbiA9IG1kNShyZXEucmVzcG9uc2UpO1xuICAgICAgZm9yIChzIGluIHNhZmVLZXkpIHtcbiAgICAgICAgZm9yIChrIGluIHNhZmVLZXlbc10pIHtcbiAgICAgICAgICAvLyByIGZvciByZW1vdGUga2V5c1xuICAgICAgICAgIHNhZmVLZXlbc11ba10gPSBbc2FmZUtleVtzXVtrXSwgJ3InXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgZm9yIChzIGluIHNhZmVLZXkpIHtcbiAgICAgICAgaWYgKCEocyBpbiB0aGlzLnNhZmVLZXlzLnZhbHVlKSkge1xuICAgICAgICAgIHRoaXMuc2FmZUtleXMudmFsdWVbc10gPSBzYWZlS2V5W3NdO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvciAodmFyIGtleSBpbiBzYWZlS2V5W3NdKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5zYWZlS2V5cy52YWx1ZVtzXVtrZXldID09IG51bGwgfHxcbiAgICAgICAgICAgICAgICB0aGlzLnNhZmVLZXlzLnZhbHVlW3NdW2tleV1bMF0gPCBzYWZlS2V5W3NdW2tleV1bMF0pIHtcbiAgICAgICAgICAgICAgdGhpcy5zYWZlS2V5cy52YWx1ZVtzXVtrZXldID0gc2FmZUtleVtzXVtrZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgdGhpcy5fcHJ1bmVTYWZlS2V5cygpO1xuICAgICAgdGhpcy5sYXN0VXBkYXRlWzBdID0gZGF0ZXRpbWUuZ2V0VGltZSgpO1xuICAgICAgcGVyc2lzdC5zZXRWYWx1ZSgnbGFzdFVwZGF0ZScsIEpTT04uc3RyaW5naWZ5KHRoaXMubGFzdFVwZGF0ZSkpO1xuICAgICAgdGhpcy5zYWZlS2V5cy5zZXREaXJ0eSgpO1xuICAgICAgdGhpcy5zYWZlS2V5cy5zYXZlKCk7XG4gICAgICBwZXJzaXN0LnNldFZhbHVlKCdzYWZlS2V5RXh0VmVyc2lvbicsIHNhZmVLZXlFeHRWZXJzaW9uKTtcbiAgICAgIGV2ZW50cy5wdWIoJ2F0dHJhY2s6c2FmZWtleXNfdXBkYXRlZCcsIHNhZmVLZXlFeHRWZXJzaW9uLCBmb3JjZUNsZWFuKTtcbiAgICB9LmJpbmQodGhpcyksXG4gICAgICBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gb24gZXJyb3JcbiAgICAgIH0sIDYwMDAwXG4gICAgKTtcbiAgfVxuXG4gIF9sb2FkUmVtb3RlVW5zYWZlS2V5KCkge1xuICAgIGxldCB0b2RheSA9IGRhdGV0aW1lLmdldFRpbWUoKS5zdWJzdHJpbmcoMCwgMTApO1xuICAgIHV0aWxzLmxvZyh0aGlzLlVOU0FGRV9LRVlfVVJMKTtcbiAgICB1dGlscy5odHRwR2V0KHRoaXMuVU5TQUZFX0tFWV9VUkwgKyc/JysgdG9kYXksIGZ1bmN0aW9uKHJlcSkge1xuICAgICAgbGV0IHVuc2FmZUtleXMgPSBKU09OLnBhcnNlKHJlcS5yZXNwb25zZSksXG4gICAgICAgICAgdW5zYWZlS2V5RXh0VmVyc2lvbiA9IG1kNShyZXEucmVzcG9uc2UpO1xuICAgICAgdGhpcy51bnNhZmVLZXlzLnNldFZhbHVlKHVuc2FmZUtleXMpO1xuICAgICAgdGhpcy5sYXN0VXBkYXRlWzJdID0gZGF0ZXRpbWUuZ2V0VGltZSgpO1xuICAgICAgcGVyc2lzdC5zZXRWYWx1ZSgnbGFzdFVwZGF0ZScsIEpTT04uc3RyaW5naWZ5KHRoaXMubGFzdFVwZGF0ZSkpO1xuICAgICAgcGVyc2lzdC5zZXRWYWx1ZSgndW5zYWZlS2V5RXh0VmVzaW9uJywgdW5zYWZlS2V5RXh0VmVyc2lvbik7XG4gICAgICB0aGlzLnVuc2FmZUtleXMuc2V0RGlydHkoKTtcbiAgICAgIHRoaXMudW5zYWZlS2V5cy5zYXZlKCk7XG4gICAgfS5iaW5kKHRoaXMpLCBmdW5jdGlvbigpIHt9LCAxMDAwMDApO1xuICB9XG5cbn1cbiJdfQ==