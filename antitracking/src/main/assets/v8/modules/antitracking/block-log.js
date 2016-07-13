System.register('antitracking/block-log', ['antitracking/persistent-state', 'antitracking/pacemaker', 'antitracking/md5', 'core/cliqz', 'antitracking/time', 'antitracking/attrack', 'antitracking/telemetry'], function (_export) {
  'use strict';

  var persist, pacemaker, md5, utils, events, datetime, CliqzAttrack, telemetry, DAYS_EXPIRE, TokenDomain, BlockLog, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_antitrackingPersistentState) {
      persist = _antitrackingPersistentState;
    }, function (_antitrackingPacemaker) {
      pacemaker = _antitrackingPacemaker['default'];
    }, function (_antitrackingMd5) {
      md5 = _antitrackingMd5['default'];
    }, function (_coreCliqz) {
      utils = _coreCliqz.utils;
      events = _coreCliqz.events;
    }, function (_antitrackingTime) {
      datetime = _antitrackingTime;
    }, function (_antitrackingAttrack) {
      CliqzAttrack = _antitrackingAttrack['default'];
    }, function (_antitrackingTelemetry) {
      telemetry = _antitrackingTelemetry['default'];
    }],
    execute: function () {
      DAYS_EXPIRE = 7;

      TokenDomain = (function () {
        function TokenDomain() {
          _classCallCheck(this, TokenDomain);

          this._tokenDomain = new persist.LazyPersistentObject('tokenDomain');
        }

        _createClass(TokenDomain, [{
          key: 'init',
          value: function init() {
            this._tokenDomain.load();
          }
        }, {
          key: 'addTokenOnFirstParty',
          value: function addTokenOnFirstParty(token, firstParty) {
            if (!this._tokenDomain.value[token]) {
              this._tokenDomain.value[token] = {};
            }
            this._tokenDomain.value[token][firstParty] = datetime.getTime().substr(0, 8);
            this._tokenDomain.setDirty();
          }
        }, {
          key: 'getNFirstPartiesForToken',
          value: function getNFirstPartiesForToken(token) {
            return Object.keys(this._tokenDomain.value[token] || {}).length;
          }
        }, {
          key: 'clean',
          value: function clean() {
            var day = datetime.newUTCDate();
            day.setDate(day.getDate() - DAYS_EXPIRE);
            var dayCutoff = datetime.dateString(day),
                td = this._tokenDomain.value;
            for (var tok in td) {
              for (var s in td[tok]) {
                if (td[tok][s] < dayCutoff) {
                  delete td[tok][s];
                }
              }
              if (Object.keys(td[tok]).length === 0) {
                delete td[tok];
              }
            }
            this._tokenDomain.setDirty();
            this._tokenDomain.save();
          }
        }, {
          key: 'clear',
          value: function clear() {
            this._tokenDomain.clear();
          }
        }]);

        return TokenDomain;
      })();

      BlockLog = (function () {
        function BlockLog() {
          _classCallCheck(this, BlockLog);

          this.URL_BLOCK_REPORT_LIST = 'https://cdn.cliqz.com/anti-tracking/whitelist/anti-tracking-report-list.json';
          this.blockReportList = {};
          this.blocked = new persist.LazyPersistentObject('blocked');
          this.localBlocked = new persist.LazyPersistentObject('localBlocked');
        }

        _createClass(BlockLog, [{
          key: 'init',
          value: function init() {
            this.blocked.load();
            this.localBlocked.load();
            this._loadReportList();
          }

          // blocked + localBlocked
        }, {
          key: 'add',
          value: function add(sourceUrl, tracker, key, value, type) {
            var s = tracker,
                k = md5(key),
                v = md5(value);
            if (this.isInBlockReportList(s, k, v)) {
              this._addBlocked(s, k, v, type);
            }
            // local logging of blocked tokens
            var hour = datetime.getTime(),
                source = md5(sourceUrl);

            this._addLocalBlocked(source, tracker, key, value, hour);
          }
        }, {
          key: 'clear',
          value: function clear() {
            this.blockReportList = {};
            this.blocked.clear();
            this.localBlocked.clear();
          }
        }, {
          key: '_addBlocked',
          value: function _addBlocked(tracker, key, value, type) {
            var bl = this.blocked.value;
            if (!(tracker in bl)) {
              bl[tracker] = {};
            }
            if (!(key in bl[tracker])) {
              bl[tracker][key] = {};
            }
            if (!(value in bl[tracker][key])) {
              bl[tracker][key][value] = {};
            }
            if (!(type in bl[tracker][key][value])) {
              bl[tracker][key][value][type] = 0;
            }
            bl[tracker][key][value][type]++;
            this.blocked.setDirty();
          }
        }, {
          key: '_addLocalBlocked',
          value: function _addLocalBlocked(source, s, k, v, hour) {
            var lb = this.localBlocked.value;
            if (!(source in lb)) {
              lb[source] = {};
            }
            if (!(s in lb[source])) {
              lb[source][s] = {};
            }
            if (!(k in lb[source][s])) {
              lb[source][s][k] = {};
            }
            if (!(v in lb[source][s][k])) {
              lb[source][s][k][v] = {};
            }
            if (!(hour in lb[source][s][k][v])) {
              lb[source][s][k][v][hour] = 0;
            }
            lb[source][s][k][v][hour]++;
            this.localBlocked.setDirty();
          }
        }, {
          key: '_cleanLocalBlocked',
          value: function _cleanLocalBlocked(hourCutoff) {
            // localBlocked
            for (var source in this.localBlocked.value) {
              for (var s in this.localBlocked.value[source]) {
                for (var k in this.localBlocked.value[source][s]) {
                  for (var v in this.localBlocked.value[source][s][k]) {
                    for (var h in this.localBlocked.value[source][s][k][v]) {
                      if (h < hourCutoff) {
                        delete this.localBlocked.value[source][s][k][v][h];
                      }
                    }
                    if (Object.keys(this.localBlocked.value[source][s][k][v]).length === 0) {
                      delete this.localBlocked.value[source][s][k][v];
                    }
                  }
                  if (Object.keys(this.localBlocked.value[source][s][k]).length === 0) {
                    delete this.localBlocked.value[source][s][k];
                  }
                }
                if (Object.keys(this.localBlocked.value[source][s]).length === 0) {
                  delete this.localBlocked.value[source][s];
                }
              }
              if (Object.keys(this.localBlocked.value[source]).length === 0) {
                delete this.localBlocked.value[source];
              }
            }
            this.localBlocked.setDirty(true);
            this.localBlocked.save();
          }
        }, {
          key: '_loadReportList',
          value: function _loadReportList() {
            utils.loadResource(this.URL_BLOCK_REPORT_LIST, (function (req) {
              try {
                this.blockReportList = JSON.parse(req.response);
              } catch (e) {
                this.blockReportList = {};
              }
            }).bind(this));
          }
        }, {
          key: 'isInBlockReportList',
          value: function isInBlockReportList(s, k, v) {
            return s in this.blockReportList && k in this.blockReportList[s] && v in this.blockReportList[s][k] || '*' in this.blockReportList || s in this.blockReportList && '*' in this.blockReportList[s] || s in this.blockReportList && k in this.blockReportList[s] && '*' in this.blockReportList[s][k];
          }
        }, {
          key: 'sendTelemetry',
          value: function sendTelemetry() {
            if (Object.keys(this.blocked.value).length > 0) {
              var payl = CliqzAttrack.generateAttrackPayload(this.blocked.value);
              telemetry.telemetry({ 'type': telemetry.msgType, 'action': 'attrack.blocked', 'payload': payl });
              // reset the state
              this.blocked.clear();
            }
          }
        }]);

        return BlockLog;
      })();

      _default = (function () {
        function _default(qsWhitelist) {
          _classCallCheck(this, _default);

          this.blockLog = new BlockLog();
          this.tokenDomain = new TokenDomain();
          this.checkedToken = new persist.LazyPersistentObject('checkedToken');
          this.blockedToken = new persist.LazyPersistentObject('blockedToken');
          this.loadedPage = new persist.LazyPersistentObject('loadedPage');
          this.currentHour = datetime.getTime();
          this._updated = {};
          this.qsWhitelist = qsWhitelist;
        }

        _createClass(_default, [{
          key: 'init',
          value: function init() {
            var _this = this;

            this.blockLog.init();
            this.tokenDomain.init();

            events.sub('attrack:hour_changed', (function () {
              _this.currentHour = datetime.getTime();
              _this._clean();
              _this.sendTelemetry();
            }).bind(this));
            events.sub('attrack:token_whitelist_updated', (function () {
              _this.checkWrongToken('token');
            }).bind(this));
            events.sub('attrack:safekeys_updated', (function () {
              _this.checkWrongToken('safeKey');
            }).bind(this));

            this.checkedToken.load();
            this.blockedToken.load();
            this.loadedPage.load();

            this.saveBlocklog = (function () {
              this.checkedToken.save();
              this.blockedToken.save();
              this.loadedPage.save();
              this.tokenDomain._tokenDomain.save();
              this.blockLog.blocked.save();
              this.blockLog.localBlocked.save();
            }).bind(this);
            this._pmTask = pacemaker.register(this.saveBlocklog, 1000 * 60 * 5);
          }
        }, {
          key: 'destroy',
          value: function destroy() {
            pacemaker.deregister(this._pmTask);
          }
        }, {
          key: 'incrementCheckedTokens',
          value: function incrementCheckedTokens() {
            this._incrementPersistentValue(this.checkedToken, 1);
          }
        }, {
          key: 'incrementBlockedTokens',
          value: function incrementBlockedTokens(nBlocked) {
            this._incrementPersistentValue(this.blockedToken, nBlocked);
          }
        }, {
          key: 'incrementLoadedPages',
          value: function incrementLoadedPages() {
            this._incrementPersistentValue(this.loadedPage, 1);
          }
        }, {
          key: '_incrementPersistentValue',
          value: function _incrementPersistentValue(v, n) {
            var hour = this.currentHour;
            if (!(hour in v.value)) {
              v.value[hour] = 0;
            }
            v.value[hour] += n;
            v.setDirty();
          }
        }, {
          key: 'sendTelemetry',
          value: function sendTelemetry() {
            this.blockLog.sendTelemetry();
          }
        }, {
          key: 'checkWrongToken',
          value: function checkWrongToken(key) {
            this._clean();
            // send max one time a day
            var day = datetime.getTime().slice(0, 8),
                wrongTokenLastSent = persist.getValue('wrongTokenLastSent', datetime.getTime().slice(0, 8));
            if (wrongTokenLastSent === day) {
              return; // max one signal per day
            }
            this._updated[key] = true;
            if (!('safeKey' in this._updated) || !('token' in this._updated)) {
              return; // wait until both lists are updated
            }
            var countLoadedPage = 0,
                countCheckedToken = 0,
                countBlockedToken = 0,
                countWrongToken = 0,
                countWrongPage = 0;

            var localBlocked = this.blockLog.localBlocked.value;
            for (var source in localBlocked) {
              var _wrongSource = true;
              for (var s in localBlocked[source]) {
                for (var k in localBlocked[source][s]) {
                  for (var v in localBlocked[source][s][k]) {
                    if (!this.qsWhitelist.isTrackerDomain(s) || this.qsWhitelist.isSafeKey(s, k) || this.qsWhitelist.isSafeToken(s, v)) {
                      for (var h in localBlocked[source][s][k][v]) {
                        countWrongToken += localBlocked[source][s][k][v][h];
                        localBlocked[source][s][k][v][h] = 0;
                      }
                      this.blockLog.localBlocked.setDirty();
                    } else {
                      _wrongSource = false;
                    }
                  }
                }
              }
              if (_wrongSource) {
                countWrongPage++;
              }
            }

            // send signal
            // sum checkedToken & blockedToken
            for (var h in this.checkedToken.value) {
              countCheckedToken += this.checkedToken.value[h];
            }
            for (var h in this.blockedToken.value) {
              countBlockedToken += this.blockedToken.value[h];
            }
            for (var h in this.loadedPage.value) {
              countLoadedPage += this.loadedPage.value[h];
            }

            var data = {
              'wrongToken': countWrongPage,
              'checkedToken': countCheckedToken,
              'blockedToken': countBlockedToken,
              'wrongPage': countWrongPage,
              'loadedPage': countLoadedPage
            };
            var payl = CliqzAttrack.generateAttrackPayload(data, wrongTokenLastSent);
            telemetry.telemetry({ 'type': telemetry.msgType, 'action': 'attrack.FP', 'payload': payl });
            persist.setValue('wrongTokenLastSent', day);
            this._updated = {};
          }
        }, {
          key: 'clear',
          value: function clear() {
            this.blockLog.clear();
            this.tokenDomain.clear();
            this.checkedToken.clear();
            this.blockedToken.clear();
            this.loadedPage.clear();
          }
        }, {
          key: '_clean',
          value: function _clean() {
            var delay = 24,
                hour = datetime.newUTCDate();
            hour.setHours(hour.getHours() - delay);
            var hourCutoff = datetime.hourString(hour);

            this.blockLog._cleanLocalBlocked(hourCutoff);
            // checkedToken
            for (var h in this.checkedToken.value) {
              if (h < hourCutoff) {
                delete this.checkedToken.value[h];
              }
            }
            for (var h in this.loadedPage.value) {
              if (h < hourCutoff) {
                delete this.loadedPage.value[h];
              }
            }

            this.checkedToken.setDirty();
            this.loadedPage.setDirty();

            this.tokenDomain.clean();
          }
        }]);

        return _default;
      })();

      _export('default', _default);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy9ibG9jay1sb2cuZXMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O2lGQVFNLFdBQVcsRUFFWCxXQUFXLEVBOENYLFFBQVE7Ozs7Ozs7Ozs7Ozs7O3lCQXJETCxLQUFLOzBCQUFFLE1BQU07Ozs7Ozs7OztBQUtoQixpQkFBVyxHQUFHLENBQUM7O0FBRWYsaUJBQVc7QUFFSixpQkFGUCxXQUFXLEdBRUQ7Z0NBRlYsV0FBVzs7QUFHYixjQUFJLENBQUMsWUFBWSxHQUFHLElBQUksT0FBTyxDQUFDLG9CQUFvQixDQUFDLGFBQWEsQ0FBQyxDQUFDO1NBQ3JFOztxQkFKRyxXQUFXOztpQkFNWCxnQkFBRztBQUNMLGdCQUFJLENBQUMsWUFBWSxDQUFDLElBQUksRUFBRSxDQUFDO1dBQzFCOzs7aUJBRW1CLDhCQUFDLEtBQUssRUFBRSxVQUFVLEVBQUU7QUFDdEMsZ0JBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNuQyxrQkFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFDO2FBQ3JDO0FBQ0QsZ0JBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDLFVBQVUsQ0FBQyxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO0FBQzdFLGdCQUFJLENBQUMsWUFBWSxDQUFDLFFBQVEsRUFBRSxDQUFDO1dBQzlCOzs7aUJBRXVCLGtDQUFDLEtBQUssRUFBRTtBQUM5QixtQkFBTyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQztXQUNqRTs7O2lCQUVJLGlCQUFHO0FBQ04sZ0JBQUksR0FBRyxHQUFHLFFBQVEsQ0FBQyxVQUFVLEVBQUUsQ0FBQztB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Q0FBQyxLQUFLLEVBQUU7QUFDMUMsbUJBQUssSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQUU7QUFDN0MscUJBQUssSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDaEQsdUJBQUssSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDbkQseUJBQUssSUFBSSxDQUFDLElBQUksSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDdEQsMEJBQUksQ0FBQyxHQUFHLFVBQVUsRUFBRTtBQUNsQiwrQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQzt1QkFDcEQ7cUJBQ0Y7QUFDRCx3QkFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRTtBQUN0RSw2QkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztxQkFDakQ7bUJBQ0Y7QUFDRCxzQkFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FB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RSxDQUFDO0FBQzdCLGdCQUFJLENBQUMsVUFBVSxDQUFDLFFBQVEsRUFBRSxDQUFDOztBQUUzQixnQkFBSSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEVBQUUsQ0FBQztXQUMxQiIsImZpbGUiOiJhbnRpdHJhY2tpbmcvYmxvY2stbG9nLmVzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgcGVyc2lzdCBmcm9tICdhbnRpdHJhY2tpbmcvcGVyc2lzdGVudC1zdGF0ZSc7XG5pbXBvcnQgcGFjZW1ha2VyIGZyb20gJ2FudGl0cmFja2luZy9wYWNlbWFrZXInO1xuaW1wb3J0IG1kNSBmcm9tICdhbnRpdHJhY2tpbmcvbWQ1JztcbmltcG9ydCB7IHV0aWxzLCBldmVudHMgfSBmcm9tICdjb3JlL2NsaXF6JztcbmltcG9ydCAqIGFzIGRhdGV0aW1lIGZyb20gJ2FudGl0cmFja2luZy90aW1lJztcbmltcG9ydCBDbGlxekF0dHJhY2sgZnJvbSAnYW50aXRyYWNraW5nL2F0dHJhY2snO1xuaW1wb3J0IHRlbGVtZXRyeSBmcm9tICdhbnRpdHJhY2tpbmcvdGVsZW1ldHJ5JztcblxuY29uc3QgREFZU19FWFBJUkUgPSA3O1xuXG5jbGFzcyBUb2tlbkRvbWFpbiB7XG5cbiAgY29uc3RydWN0b3IoKSB7XG4gICAgdGhpcy5fdG9rZW5Eb21haW4gPSBuZXcgcGVyc2lzdC5MYXp5UGVyc2lzdGVudE9iamVjdCgndG9rZW5Eb21haW4nKTtcbiAgfVxuXG4gIGluaXQoKSB7XG4gICAgdGhpcy5fdG9rZW5Eb21haW4ubG9hZCgpO1xuICB9XG5cbiAgYWRkVG9rZW5PbkZpcnN0UGFydHkodG9rZW4sIGZpcnN0UGFydHkpIHtcbiAgICBpZiAoIXRoaXMuX3Rva2VuRG9tYWluLnZhbHVlW3Rva2VuXSkge1xuICAgICAgdGhpcy5fdG9rZW5Eb21haW4udmFsdWVbdG9rZW5dID0ge307XG4gICAgfVxuICAgIHRoaXMuX3Rva2VuRG9tYWluLnZhbHVlW3Rva2VuXVtmaXJzdFBhcnR5XSA9IGRhdGV0aW1lLmdldFRpbWUoKS5zdWJzdHIoMCwgOCk7XG4gICAgdGhpcy5fdG9rZW5Eb21haW4uc2V0RGlydHkoKTtcbiAgfVxuXG4gIGdldE5GaXJzdFBhcnRpZXNGb3JUb2tlbih0b2tlbikge1xuICAgIHJldHVybiBPYmplY3Qua2V5cyh0aGlzLl90b2tlbkRvbWFpbi52YWx1ZVt0b2tlbl0gfHwge30pLmxlbmd0aDtcbiAgfVxuXG4gIGNsZWFuKCkge1xuICAgIHZhciBkYXkgPSBkYXRldGltZS5uZXdVVENEYXRlKCk7XG4gICAgICAgIGRheS5zZXREYXRlKGRheS5nZXREYXRlKCkgLSBEQVlTX0VYUElSRSk7XG4gICAgdmFyIGRheUN1dG9mZiA9IGRhdGV0aW1lLmRhdGVTdHJpbmcoZGF5KSxcbiAgICAgICAgdGQgPSB0aGlzLl90b2tlbkRvbWFpbi52YWx1ZTtcbiAgICBmb3IgKHZhciB0b2sgaW4gdGQpIHtcbiAgICAgIGZvciAodmFyIHMgaW4gdGRbdG9rXSkge1xuICAgICAgICBpZiAodGRbdG9rXVtzXSA8IGRheUN1dG9mZikge1xuICAgICAgICAgIGRlbGV0ZSB0ZFt0b2tdW3NdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoT2JqZWN0LmtleXModGRbdG9rXSkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGRlbGV0ZSB0ZFt0b2tdO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLl90b2tlbkRvbWFpbi5zZXREaXJ0eSgpO1xuICAgIHRoaXMuX3Rva2VuRG9tYWluLnNhdmUoKTtcbiAgfVxuXG4gIGNsZWFyKCkge1xuICAgIHRoaXMuX3Rva2VuRG9tYWluLmNsZWFyKCk7XG4gIH1cbn1cblxuY2xhc3MgQmxvY2tMb2cge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLlVSTF9CTE9DS19SRVBPUlRfTElTVCA9ICdodHRwczovL2Nkbi5jbGlxei5jb20vYW50aS10cmFja2luZy93aGl0ZWxpc3QvYW50aS10cmFja2luZy1yZXBvcnQtbGlzdC5qc29uJztcbiAgICB0aGlzLmJsb2NrUmVwb3J0TGlzdCA9IHt9O1xuICAgIHRoaXMuYmxvY2tlZCA9IG5ldyBwZXJzaXN0LkxhenlQZXJzaXN0ZW50T2JqZWN0KCdibG9ja2VkJyk7XG4gICAgdGhpcy5sb2NhbEJsb2NrZWQgPSBuZXcgcGVyc2lzdC5MYXp5UGVyc2lzdGVudE9iamVjdCgnbG9jYWxCbG9ja2VkJyk7XG4gIH1cblxuICBpbml0KCkge1xuICAgIHRoaXMuYmxvY2tlZC5sb2FkKCk7XG4gICAgdGhpcy5sb2NhbEJsb2NrZWQubG9hZCgpO1xuICAgIHRoaXMuX2xvYWRSZXBvcnRMaXN0KCk7XG4gIH1cblxuICAvLyBibG9ja2VkICsgbG9jYWxCbG9ja2VkXG4gIGFkZChzb3VyY2VVcmwsIHRyYWNrZXIsIGtleSwgdmFsdWUsIHR5cGUpIHtcbiAgICB2YXIgcyA9IHRyYWNrZXIsXG4gICAgICAgIGsgPSBtZDUoa2V5KSxcbiAgICAgICAgdiA9IG1kNSh2YWx1ZSk7XG4gICAgaWYgKHRoaXMuaXNJbkJsb2NrUmVwb3J0TGlzdChzLCBrLCB2KSkge1xuICAgICAgICB0aGlzLl9hZGRCbG9ja2VkKHMsIGssIHYsIHR5cGUpO1xuICAgIH1cbiAgICAvLyBsb2NhbCBsb2dnaW5nIG9mIGJsb2NrZWQgdG9rZW5zXG4gICAgdmFyIGhvdXIgPSBkYXRldGltZS5nZXRUaW1lKCksXG4gICAgICAgIHNvdXJjZSA9IG1kNShzb3VyY2VVcmwpO1xuXG4gICAgdGhpcy5fYWRkTG9jYWxCbG9ja2VkKHNvdXJjZSwgdHJhY2tlciwga2V5LCB2YWx1ZSwgaG91cik7XG4gIH1cblxuICBjbGVhcigpIHtcbiAgICB0aGlzLmJsb2NrUmVwb3J0TGlzdCA9IHt9O1xuICAgIHRoaXMuYmxvY2tlZC5jbGVhcigpO1xuICAgIHRoaXMubG9jYWxCbG9ja2VkLmNsZWFyKCk7XG4gIH1cblxuICBfYWRkQmxvY2tlZCh0cmFja2VyLCBrZXksIHZhbHVlLCB0eXBlKSB7XG4gICAgdmFyIGJsID0gdGhpcy5ibG9ja2VkLnZhbHVlO1xuICAgIGlmICghKHRyYWNrZXIgaW4gYmwpKSB7XG4gICAgICAgICAgYmxbdHJhY2tlcl0gPSB7fTtcbiAgICB9XG4gICAgaWYgKCEoa2V5IGluIGJsW3RyYWNrZXJdKSkge1xuICAgICAgYmxbdHJhY2tlcl1ba2V5XSA9IHt9O1xuICAgIH1cbiAgICBpZiAoISh2YWx1ZSBpbiBibFt0cmFja2VyXVtrZXldKSkge1xuICAgICAgYmxbdHJhY2tlcl1ba2V5XVt2YWx1ZV0gPSB7fTtcbiAgICB9XG4gICAgaWYgKCEodHlwZSBpbiBibFt0cmFja2VyXVtrZXldW3ZhbHVlXSkpIHtcbiAgICAgIGJsW3RyYWNrZXJdW2tleV1bdmFsdWVdW3R5cGVdID0gMDtcbiAgICB9XG4gICAgYmxbdHJhY2tlcl1ba2V5XVt2YWx1ZV1bdHlwZV0rKztcbiAgICB0aGlzLmJsb2NrZWQuc2V0RGlydHkoKTtcbiAgfVxuXG4gIF9hZGRMb2NhbEJsb2NrZWQoc291cmNlLCBzLCBrLCB2LCBob3VyKSB7XG4gICAgdmFyIGxiID0gdGhpcy5sb2NhbEJsb2NrZWQudmFsdWU7XG4gICAgaWYgKCEoc291cmNlIGluIGxiKSkge1xuICAgICAgbGJbc291cmNlXSA9IHt9O1xuICAgIH1cbiAgICBpZiAoIShzIGluIGxiW3NvdXJjZV0pKSB7XG4gICAgICBsYltzb3VyY2VdW3NdID0ge307XG4gICAgfVxuICAgIGlmICghKGsgaW4gbGJbc291cmNlXVtzXSkpIHtcbiAgICAgIGxiW3NvdXJjZV1bc11ba10gPSB7fTtcbiAgICB9XG4gICAgaWYgKCEodiBpbiBsYltzb3VyY2VdW3NdW2tdKSkge1xuICAgICAgbGJbc291cmNlXVtzXVtrXVt2XSA9IHt9O1xuICAgIH1cbiAgICBpZiAoIShob3VyIGluIGxiW3NvdXJjZV1bc11ba11bdl0pKSB7XG4gICAgICBsYltzb3VyY2VdW3NdW2tdW3ZdW2hvdXJdID0gMDtcbiAgICB9XG4gICAgbGJbc291cmNlXVtzXVtrXVt2XVtob3VyXSsrO1xuICAgIHRoaXMubG9jYWxCbG9ja2VkLnNldERpcnR5KCk7XG4gIH1cblxuICBfY2xlYW5Mb2NhbEJsb2NrZWQoaG91ckN1dG9mZikge1xuICAgIC8vIGxvY2FsQmxvY2tlZFxuICAgIGZvciAodmFyIHNvdXJjZSBpbiB0aGlzLmxvY2FsQmxvY2tlZC52YWx1ZSkge1xuICAgICAgZm9yICh2YXIgcyBpbiB0aGlzLmxvY2FsQmxvY2tlZC52YWx1ZVtzb3VyY2VdKSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4gdGhpcy5sb2NhbEJsb2NrZWQudmFsdWVbc291cmNlXVtzXSkge1xuICAgICAgICAgIGZvciAodmFyIHYgaW4gdGhpcy5sb2NhbEJsb2NrZWQudmFsdWVbc291cmNlXVtzXVtrXSkge1xuICAgICAgICAgICAgZm9yICh2YXIgaCBpbiB0aGlzLmxvY2FsQmxvY2tlZC52YWx1ZVtzb3VyY2VdW3NdW2tdW3ZdKSB7XG4gICAgICAgICAgICAgIGlmIChoIDwgaG91ckN1dG9mZikge1xuICAgICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmxvY2FsQmxvY2tlZC52YWx1ZVtzb3VyY2VdW3NdW2tdW3ZdW2hdO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoT2JqZWN0LmtleXModGhpcy5sb2NhbEJsb2NrZWQudmFsdWVbc291cmNlXVtzXVtrXVt2XSkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgIGRlbGV0ZSB0aGlzLmxvY2FsQmxvY2tlZC52YWx1ZVtzb3VyY2VdW3NdW2tdW3ZdO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoT2JqZWN0LmtleXModGhpcy5sb2NhbEJsb2NrZWQudmFsdWVbc291cmNlXVtzXVtrXSkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICBkZWxldGUgdGhpcy5sb2NhbEJsb2NrZWQudmFsdWVbc291cmNlXVtzXVtrXTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMubG9jYWxCbG9ja2VkLnZhbHVlW3NvdXJjZV1bc10pLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgIGRlbGV0ZSB0aGlzLmxvY2FsQmxvY2tlZC52YWx1ZVtzb3VyY2VdW3NdO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAoT2JqZWN0LmtleXModGhpcy5sb2NhbEJsb2NrZWQudmFsdWVbc291cmNlXSkubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmxvY2FsQmxvY2tlZC52YWx1ZVtzb3VyY2VdO1xuICAgICAgfVxuICAgIH1cbiAgICB0aGlzLmxvY2FsQmxvY2tlZC5zZXREaXJ0eSh0cnVlKTtcbiAgICB0aGlzLmxvY2FsQmxvY2tlZC5zYXZlKCk7XG4gIH1cblxuICBfbG9hZFJlcG9ydExpc3QoKSB7XG4gICAgdXRpbHMubG9hZFJlc291cmNlKHRoaXMuVVJMX0JMT0NLX1JFUE9SVF9MSVNULCBmdW5jdGlvbihyZXEpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIHRoaXMuYmxvY2tSZXBvcnRMaXN0ID0gSlNPTi5wYXJzZShyZXEucmVzcG9uc2UpO1xuICAgICAgfSBjYXRjaChlKSB7XG4gICAgICAgIHRoaXMuYmxvY2tSZXBvcnRMaXN0ID0ge307XG4gICAgICB9XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIGlzSW5CbG9ja1JlcG9ydExpc3Qocywgaywgdikge1xuICAgIHJldHVybiBzIGluIHRoaXMuYmxvY2tSZXBvcnRMaXN0ICYmXG4gICAgICAgIGsgaW4gdGhpcy5ibG9ja1JlcG9ydExpc3Rbc10gJiZcbiAgICAgICAgdiBpbiB0aGlzLmJsb2NrUmVwb3J0TGlzdFtzXVtrXSB8fFxuICAgICAgICAnKicgaW4gdGhpcy5ibG9ja1JlcG9ydExpc3QgfHxcbiAgICAgICAgcyBpbiB0aGlzLmJsb2NrUmVwb3J0TGlzdCAmJiAnKicgaW4gdGhpcy5ibG9ja1JlcG9ydExpc3Rbc10gfHxcbiAgICAgICAgcyBpbiB0aGlzLmJsb2NrUmVwb3J0TGlzdCAmJiBrIGluIHRoaXMuYmxvY2tSZXBvcnRMaXN0W3NdICYmICcqJyBpbiB0aGlzLmJsb2NrUmVwb3J0TGlzdFtzXVtrXTtcbiAgfVxuXG4gIHNlbmRUZWxlbWV0cnkoKSB7XG4gICAgaWYgKE9iamVjdC5rZXlzKHRoaXMuYmxvY2tlZC52YWx1ZSkubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIHBheWwgPSBDbGlxekF0dHJhY2suZ2VuZXJhdGVBdHRyYWNrUGF5bG9hZCh0aGlzLmJsb2NrZWQudmFsdWUpO1xuICAgICAgdGVsZW1ldHJ5LnRlbGVtZXRyeSh7J3R5cGUnOiB0ZWxlbWV0cnkubXNnVHlwZSwgJ2FjdGlvbic6ICdhdHRyYWNrLmJsb2NrZWQnLCAncGF5bG9hZCc6IHBheWx9KTtcbiAgICAgIC8vIHJlc2V0IHRoZSBzdGF0ZVxuICAgICAgdGhpcy5ibG9ja2VkLmNsZWFyKCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHtcbiAgY29uc3RydWN0b3IocXNXaGl0ZWxpc3QpIHtcbiAgICB0aGlzLmJsb2NrTG9nID0gbmV3IEJsb2NrTG9nKCk7XG4gICAgdGhpcy50b2tlbkRvbWFpbiA9IG5ldyBUb2tlbkRvbWFpbigpO1xuICAgIHRoaXMuY2hlY2tlZFRva2VuID0gbmV3IHBlcnNpc3QuTGF6eVBlcnNpc3RlbnRPYmplY3QoJ2NoZWNrZWRUb2tlbicpO1xuICAgIHRoaXMuYmxvY2tlZFRva2VuID0gbmV3IHBlcnNpc3QuTGF6eVBlcnNpc3RlbnRPYmplY3QoJ2Jsb2NrZWRUb2tlbicpO1xuICAgIHRoaXMubG9hZGVkUGFnZSA9IG5ldyBwZXJzaXN0LkxhenlQZXJzaXN0ZW50T2JqZWN0KCdsb2FkZWRQYWdlJyk7XG4gICAgdGhpcy5jdXJyZW50SG91ciA9IGRhdGV0aW1lLmdldFRpbWUoKTtcbiAgICB0aGlzLl91cGRhdGVkID0ge307XG4gICAgdGhpcy5xc1doaXRlbGlzdCA9IHFzV2hpdGVsaXN0O1xuICB9XG5cbiAgaW5pdCgpIHtcbiAgICB0aGlzLmJsb2NrTG9nLmluaXQoKTtcbiAgICB0aGlzLnRva2VuRG9tYWluLmluaXQoKTtcblxuICAgIGV2ZW50cy5zdWIoJ2F0dHJhY2s6aG91cl9jaGFuZ2VkJywgKCkgPT4ge1xuICAgICAgdGhpcy5jdXJyZW50SG91ciA9IGRhdGV0aW1lLmdldFRpbWUoKTtcbiAgICAgIHRoaXMuX2NsZWFuKCk7XG4gICAgICB0aGlzLnNlbmRUZWxlbWV0cnkoKTtcbiAgICB9LmJpbmQodGhpcykpO1xuICAgIGV2ZW50cy5zdWIoJ2F0dHJhY2s6dG9rZW5fd2hpdGVsaXN0X3VwZGF0ZWQnLCAoKSA9PiB7XG4gICAgICB0aGlzLmNoZWNrV3JvbmdUb2tlbigndG9rZW4nKTtcbiAgICB9LmJpbmQodGhpcykpO1xuICAgIGV2ZW50cy5zdWIoJ2F0dHJhY2s6c2FmZWtleXNfdXBkYXRlZCcsICgpID0+IHtcbiAgICAgIHRoaXMuY2hlY2tXcm9uZ1Rva2VuKCdzYWZlS2V5Jyk7XG4gICAgfS5iaW5kKHRoaXMpKTtcblxuICAgIHRoaXMuY2hlY2tlZFRva2VuLmxvYWQoKTtcbiAgICB0aGlzLmJsb2NrZWRUb2tlbi5sb2FkKCk7XG4gICAgdGhpcy5sb2FkZWRQYWdlLmxvYWQoKTtcblxuICAgIHRoaXMuc2F2ZUJsb2NrbG9nID0gZnVuY3Rpb24oKSB7XG4gICAgICB0aGlzLmNoZWNrZWRUb2tlbi5zYXZlKCk7XG4gICAgICB0aGlzLmJsb2NrZWRUb2tlbi5zYXZlKCk7XG4gICAgICB0aGlzLmxvYWRlZFBhZ2Uuc2F2ZSgpO1xuICAgICAgdGhpcy50b2tlbkRvbWFpbi5fdG9rZW5Eb21haW4uc2F2ZSgpO1xuICAgICAgdGhpcy5ibG9ja0xvZy5ibG9ja2VkLnNhdmUoKTtcbiAgICAgIHRoaXMuYmxvY2tMb2cubG9jYWxCbG9ja2VkLnNhdmUoKTtcbiAgICB9LmJpbmQodGhpcyk7XG4gICAgdGhpcy5fcG1UYXNrID0gcGFjZW1ha2VyLnJlZ2lzdGVyKHRoaXMuc2F2ZUJsb2NrbG9nLCAxMDAwICogNjAgKiA1KTtcbiAgfVxuXG4gIGRlc3Ryb3koKSB7XG4gICAgcGFjZW1ha2VyLmRlcmVnaXN0ZXIodGhpcy5fcG1UYXNrKTtcbiAgfVxuXG4gIGluY3JlbWVudENoZWNrZWRUb2tlbnMoKSB7XG4gICAgdGhpcy5faW5jcmVtZW50UGVyc2lzdGVudFZhbHVlKHRoaXMuY2hlY2tlZFRva2VuLCAxKTtcbiAgfVxuXG4gIGluY3JlbWVudEJsb2NrZWRUb2tlbnMobkJsb2NrZWQpIHtcbiAgICB0aGlzLl9pbmNyZW1lbnRQZXJzaXN0ZW50VmFsdWUodGhpcy5ibG9ja2VkVG9rZW4sIG5CbG9ja2VkKTtcbiAgfVxuXG4gIGluY3JlbWVudExvYWRlZFBhZ2VzKCkge1xuICAgIHRoaXMuX2luY3JlbWVudFBlcnNpc3RlbnRWYWx1ZSh0aGlzLmxvYWRlZFBhZ2UsIDEpO1xuICB9XG5cbiAgX2luY3JlbWVudFBlcnNpc3RlbnRWYWx1ZSh2LCBuKSB7XG4gICAgdmFyIGhvdXIgPSB0aGlzLmN1cnJlbnRIb3VyO1xuICAgIGlmICghKGhvdXIgaW4gdi52YWx1ZSkpIHtcbiAgICAgIHYudmFsdWVbaG91cl0gPSAwO1xuICAgIH1cbiAgICB2LnZhbHVlW2hvdXJdICs9IG47XG4gICAgdi5zZXREaXJ0eSgpO1xuICB9XG5cbiAgc2VuZFRlbGVtZXRyeSgpIHtcbiAgICB0aGlzLmJsb2NrTG9nLnNlbmRUZWxlbWV0cnkoKTtcbiAgfVxuXG4gIGNoZWNrV3JvbmdUb2tlbihrZXkpIHtcbiAgICB0aGlzLl9jbGVhbigpO1xuICAgIC8vIHNlbmQgbWF4IG9uZSB0aW1lIGEgZGF5XG4gICAgdmFyIGRheSA9IGRhdGV0aW1lLmdldFRpbWUoKS5zbGljZSgwLCA4KSxcbiAgICAgIHdyb25nVG9rZW5MYXN0U2VudCA9IHBlcnNpc3QuZ2V0VmFsdWUoJ3dyb25nVG9rZW5MYXN0U2VudCcsIGRhdGV0aW1lLmdldFRpbWUoKS5zbGljZSgwLCA4KSk7XG4gICAgaWYgKHdyb25nVG9rZW5MYXN0U2VudCA9PT0gZGF5KSB7XG4gICAgICByZXR1cm47ICAvLyBtYXggb25lIHNpZ25hbCBwZXIgZGF5XG4gICAgfVxuICAgIHRoaXMuX3VwZGF0ZWRba2V5XSA9IHRydWU7XG4gICAgaWYgKCEoJ3NhZmVLZXknIGluIHRoaXMuX3VwZGF0ZWQpIHx8ICghKCd0b2tlbicgaW4gdGhpcy5fdXBkYXRlZCkpKSB7XG4gICAgICByZXR1cm47ICAvLyB3YWl0IHVudGlsIGJvdGggbGlzdHMgYXJlIHVwZGF0ZWRcbiAgICB9XG4gICAgdmFyIGNvdW50TG9hZGVkUGFnZSA9IDAsXG4gICAgICAgIGNvdW50Q2hlY2tlZFRva2VuID0gMCxcbiAgICAgICAgY291bnRCbG9ja2VkVG9rZW4gPSAwLFxuICAgICAgICBjb3VudFdyb25nVG9rZW4gPSAwLFxuICAgICAgICBjb3VudFdyb25nUGFnZSA9IDA7XG5cbiAgICB2YXIgbG9jYWxCbG9ja2VkID0gdGhpcy5ibG9ja0xvZy5sb2NhbEJsb2NrZWQudmFsdWU7XG4gICAgZm9yICh2YXIgc291cmNlIGluIGxvY2FsQmxvY2tlZCkge1xuICAgICAgdmFyIF93cm9uZ1NvdXJjZSA9IHRydWU7XG4gICAgICBmb3IgKHZhciBzIGluIGxvY2FsQmxvY2tlZFtzb3VyY2VdKSB7XG4gICAgICAgIGZvciAodmFyIGsgaW4gbG9jYWxCbG9ja2VkW3NvdXJjZV1bc10pIHtcbiAgICAgICAgICBmb3IgKHZhciB2IGluIGxvY2FsQmxvY2tlZFtzb3VyY2VdW3NdW2tdKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMucXNXaGl0ZWxpc3QuaXNUcmFja2VyRG9tYWluKHMpIHx8XG4gICAgICAgICAgICAgIHRoaXMucXNXaGl0ZWxpc3QuaXNTYWZlS2V5KHMsIGspIHx8XG4gICAgICAgICAgICAgIHRoaXMucXNXaGl0ZWxpc3QuaXNTYWZlVG9rZW4ocywgdikpIHtcbiAgICAgICAgICAgICAgZm9yIChsZXQgaCBpbiBsb2NhbEJsb2NrZWRbc291cmNlXVtzXVtrXVt2XSkge1xuICAgICAgICAgICAgICAgIGNvdW50V3JvbmdUb2tlbiArPSBsb2NhbEJsb2NrZWRbc291cmNlXVtzXVtrXVt2XVtoXTtcbiAgICAgICAgICAgICAgICBsb2NhbEJsb2NrZWRbc291cmNlXVtzXVtrXVt2XVtoXSA9IDA7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhpcy5ibG9ja0xvZy5sb2NhbEJsb2NrZWQuc2V0RGlydHkoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICBfd3JvbmdTb3VyY2UgPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChfd3JvbmdTb3VyY2UpIHtcbiAgICAgICAgY291bnRXcm9uZ1BhZ2UrKztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBzZW5kIHNpZ25hbFxuICAgIC8vIHN1bSBjaGVja2VkVG9rZW4gJiBibG9ja2VkVG9rZW5cbiAgICBmb3IgKGxldCBoIGluIHRoaXMuY2hlY2tlZFRva2VuLnZhbHVlKSB7XG4gICAgICBjb3VudENoZWNrZWRUb2tlbiArPSB0aGlzLmNoZWNrZWRUb2tlbi52YWx1ZVtoXTtcbiAgICB9XG4gICAgZm9yIChsZXQgaCBpbiB0aGlzLmJsb2NrZWRUb2tlbi52YWx1ZSkge1xuICAgICAgY291bnRCbG9ja2VkVG9rZW4gKz0gdGhpcy5ibG9ja2VkVG9rZW4udmFsdWVbaF07XG4gICAgfVxuICAgIGZvciAobGV0IGggaW4gdGhpcy5sb2FkZWRQYWdlLnZhbHVlKSB7XG4gICAgICBjb3VudExvYWRlZFBhZ2UgKz0gdGhpcy5sb2FkZWRQYWdlLnZhbHVlW2hdO1xuICAgIH1cblxuICAgIHZhciBkYXRhID0ge1xuICAgICAgJ3dyb25nVG9rZW4nOiBjb3VudFdyb25nUGFnZSxcbiAgICAgICdjaGVja2VkVG9rZW4nOiBjb3VudENoZWNrZWRUb2tlbixcbiAgICAgICdibG9ja2VkVG9rZW4nOiBjb3VudEJsb2NrZWRUb2tlbixcbiAgICAgICd3cm9uZ1BhZ2UnOiBjb3VudFdyb25nUGFnZSxcbiAgICAgICdsb2FkZWRQYWdlJzogY291bnRMb2FkZWRQYWdlXG4gICAgfTtcbiAgICB2YXIgcGF5bCA9IENsaXF6QXR0cmFjay5nZW5lcmF0ZUF0dHJhY2tQYXlsb2FkKGRhdGEsIHdyb25nVG9rZW5MYXN0U2VudCk7XG4gICAgdGVsZW1ldHJ5LnRlbGVtZXRyeSh7J3R5cGUnOiB0ZWxlbWV0cnkubXNnVHlwZSwgJ2FjdGlvbic6ICdhdHRyYWNrLkZQJywgJ3BheWxvYWQnOiBwYXlsfSk7XG4gICAgcGVyc2lzdC5zZXRWYWx1ZSgnd3JvbmdUb2tlbkxhc3RTZW50JywgZGF5KTtcbiAgICB0aGlzLl91cGRhdGVkID0ge307XG4gIH1cblxuICBjbGVhcigpIHtcbiAgICB0aGlzLmJsb2NrTG9nLmNsZWFyKCk7XG4gICAgdGhpcy50b2tlbkRvbWFpbi5jbGVhcigpO1xuICAgIHRoaXMuY2hlY2tlZFRva2VuLmNsZWFyKCk7XG4gICAgdGhpcy5ibG9ja2VkVG9rZW4uY2xlYXIoKTtcbiAgICB0aGlzLmxvYWRlZFBhZ2UuY2xlYXIoKTtcbiAgfVxuXG4gIF9jbGVhbigpIHtcbiAgICB2YXIgZGVsYXkgPSAyNCxcbiAgICAgICAgaG91ciA9IGRhdGV0aW1lLm5ld1VUQ0RhdGUoKTtcbiAgICBob3VyLnNldEhvdXJzKGhvdXIuZ2V0SG91cnMoKSAtIGRlbGF5KTtcbiAgICB2YXIgaG91ckN1dG9mZiA9IGRhdGV0aW1lLmhvdXJTdHJpbmcoaG91cik7XG5cbiAgICB0aGlzLmJsb2NrTG9nLl9jbGVhbkxvY2FsQmxvY2tlZChob3VyQ3V0b2ZmKTtcbiAgICAvLyBjaGVja2VkVG9rZW5cbiAgICBmb3IgKGxldCBoIGluIHRoaXMuY2hlY2tlZFRva2VuLnZhbHVlKSB7XG4gICAgICBpZiAoaCA8IGhvdXJDdXRvZmYpIHtcbiAgICAgICAgZGVsZXRlIHRoaXMuY2hlY2tlZFRva2VuLnZhbHVlW2hdO1xuICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGxldCBoIGluIHRoaXMubG9hZGVkUGFnZS52YWx1ZSkge1xuICAgICAgaWYgKGggPCBob3VyQ3V0b2ZmKSB7XG4gICAgICAgIGRlbGV0ZSB0aGlzLmxvYWRlZFBhZ2UudmFsdWVbaF07XG4gICAgICB9XG4gICAgfVxuXG4gICAgdGhpcy5jaGVja2VkVG9rZW4uc2V0RGlydHkoKTtcbiAgICB0aGlzLmxvYWRlZFBhZ2Uuc2V0RGlydHkoKTtcblxuICAgIHRoaXMudG9rZW5Eb21haW4uY2xlYW4oKTtcbiAgfVxuXG59XG4iXX0=