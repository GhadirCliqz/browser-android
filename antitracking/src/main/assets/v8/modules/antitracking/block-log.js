System.register('antitracking/block-log', ['antitracking/persistent-state', 'antitracking/pacemaker', 'antitracking/md5', 'core/cliqz', 'antitracking/time', 'antitracking/attrack', 'antitracking/telemetry', 'core/resource-loader'], function (_export) {
  'use strict';

  var persist, pacemaker, md5, events, datetime, CliqzAttrack, telemetry, ResourceLoader, DAYS_EXPIRE, TokenDomain, BlockLog, _default;

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
      events = _coreCliqz.events;
    }, function (_antitrackingTime) {
      datetime = _antitrackingTime;
    }, function (_antitrackingAttrack) {
      CliqzAttrack = _antitrackingAttrack['default'];
    }, function (_antitrackingTelemetry) {
      telemetry = _antitrackingTelemetry['default'];
    }, function (_coreResourceLoader) {
      ResourceLoader = _coreResourceLoader['default'];
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
            var dayCutoff = datetime.dateString(day);
            var td = this._tokenDomain.value;
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
          this._blockReportListLoader = new ResourceLoader(['antitracking', 'anti-tracking-report-list.json'], {
            remoteURL: 'https://cdn.cliqz.com/anti-tracking/whitelist/anti-tracking-report-list.json',
            cron: 24 * 60 * 60 * 1000
          });
        }

        _createClass(BlockLog, [{
          key: 'init',
          value: function init() {
            this.blocked.load();
            this.localBlocked.load();
            this._blockReportListLoader.load().then(this._loadReportList.bind(this));
            this._blockReportListLoader.onUpdate(this._loadReportList.bind(this));
          }
        }, {
          key: 'destroy',
          value: function destroy() {
            this._blockReportListLoader.stop();
          }

          // blocked + localBlocked
        }, {
          key: 'add',
          value: function add(sourceUrl, tracker, key, value, type) {
            var s = tracker;
            var k = md5(key);
            var v = md5(value);
            var hour = datetime.getTime();
            var source = md5(sourceUrl);

            if (this.isInBlockReportList(s, k, v)) {
              this._addBlocked(s, k, v, type);
            }
            // local logging of blocked tokens
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
          value: function _loadReportList(list) {
            this.blockReportList = list;
          }
        }, {
          key: 'isInBlockReportList',
          value: function isInBlockReportList(s, k, v) {
            if ('*' in this.blockReportList) {
              return true;
            } else if (s in this.blockReportList) {
              var keyList = this.blockReportList[s];
              if (keyList === '*') {
                return true;
              } else if (k in keyList) {
                var valueList = keyList[k];
                if (valueList === '*') {
                  return true;
                } else if (v in valueList) {
                  return true;
                }
              }
            }
            return false;
          }
        }, {
          key: 'sendTelemetry',
          value: function sendTelemetry() {
            if (Object.keys(this.blocked.value).length > 0) {
              var payl = CliqzAttrack.generateAttrackPayload(this.blocked.value);
              telemetry.telemetry({
                type: telemetry.msgType,
                action: 'attrack.blocked',
                payload: payl
              });
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

            events.sub('attrack:hour_changed', function () {
              _this.currentHour = datetime.getTime();
              _this._clean();
              _this.sendTelemetry();
            });
            events.sub('attrack:token_whitelist_updated', function () {
              _this.checkWrongToken('token');
            });
            events.sub('attrack:safekeys_updated', function () {
              _this.checkWrongToken('safeKey');
            });

            this.checkedToken.load();
            this.blockedToken.load();
            this.loadedPage.load();

            this.saveBlocklog = function () {
              _this.checkedToken.save();
              _this.blockedToken.save();
              _this.loadedPage.save();
              _this.tokenDomain._tokenDomain.save();
              _this.blockLog.blocked.save();
              _this.blockLog.localBlocked.save();
            };
            this._pmTask = pacemaker.register(this.saveBlocklog, 1000 * 60 * 5);
          }
        }, {
          key: 'destroy',
          value: function destroy() {
            pacemaker.deregister(this._pmTask);
            this.blockLog.destroy();
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
            var day = datetime.getTime().slice(0, 8);
            var wrongTokenLastSent = persist.getValue('wrongTokenLastSent', datetime.getTime().slice(0, 8));
            if (wrongTokenLastSent === day) {
              return; // max one signal per day
            }
            this._updated[key] = true;
            if (!('safeKey' in this._updated) || !('token' in this._updated)) {
              return; // wait until both lists are updated
            }
            var countLoadedPage = 0;
            var countCheckedToken = 0;
            var countBlockedToken = 0;
            var countWrongToken = 0;
            var countWrongPage = 0;

            var localBlocked = this.blockLog.localBlocked.value;
            for (var source in localBlocked) {
              var wrongSource = true;
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
                      wrongSource = false;
                    }
                  }
                }
              }
              if (wrongSource) {
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
              wrongToken: countWrongPage,
              checkedToken: countCheckedToken,
              blockedToken: countBlockedToken,
              wrongPage: countWrongPage,
              loadedPage: countLoadedPage
            };
            var payl = CliqzAttrack.generateAttrackPayload(data, wrongTokenLastSent);
            telemetry.telemetry({
              type: telemetry.msgType,
              action: 'attrack.FP',
              payload: payl
            });
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
            var delay = 24;
            var hour = datetime.newUTCDate();
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy9ibG9jay1sb2cuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OzBGQVNNLFdBQVcsRUFFWCxXQUFXLEVBOENYLFFBQVE7Ozs7Ozs7Ozs7Ozs7OzBCQXRETCxNQUFNOzs7Ozs7Ozs7OztBQU1ULGlCQUFXLEdBQUcsQ0FBQzs7QUFFZixpQkFBVztBQUVKLGlCQUZQLFdBQVcsR0FFRDtnQ0FGVixXQUFXOztBQUdiLGNBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxPQUFPLENBQUMsb0JBQW9CLENBQUMsYUFBYSxDQUFDLENBQUM7U0FDckU7O3FCQUpHLFdBQVc7O2lCQU1YLGdCQUFHO0FBQ0wsZ0JBQUksQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLENBQUM7V0FDMUI7OztpQkFFbUIsOEJBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRTtBQUN0QyxnQkFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxFQUFFO0FBQ25DLGtCQUFJLENBQUMsWUFBWSxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLENBQUM7YUFDckM7QUFDRCxnQkFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUM7QUFDN0UsZ0JBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7V0FDOUI7OztpQkFFdUIsa0NBQUMsS0FBSyxFQUFFO0FBQzlCLG1CQUFPLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsTUFBTSxDQUFDO1dBQ2pFOzs7aUJBRUksaUJBQUc7QUFDTixnQkFBTSxHQUFHLEdBQUcsUUFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDO0FBQ2xDLGVBQUcs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QUFDO2VBQ25DO2FBQ0Y7QUFDRCxpQkFBSyxJQUFNLENBQUMsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDLEtBQUssRUFBRTtBQUNyQyxrQkFBSSxDQUFDLEdBQUcsVUFBVSxFQUFFO0FBQ2xCLHVCQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO2VBQ2pDO2FBQ0Y7O0FBRUQsZ0JBQUksQ0FBQyxZQUFZLENBQUMsUUFBUSxFQUFFLENBQUM7QUFDN0IsZ0JBQUksQ0FBQyxVQUFVLENBQUMsUUFBUSxFQUFFLENBQUM7O0FBRTNCLGdCQUFJLENBQUMsV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1dBQzFCIiwiZmlsZSI6ImFudGl0cmFja2luZy9ibG9jay1sb2cuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwZXJzaXN0IGZyb20gJ2FudGl0cmFja2luZy9wZXJzaXN0ZW50LXN0YXRlJztcbmltcG9ydCBwYWNlbWFrZXIgZnJvbSAnYW50aXRyYWNraW5nL3BhY2VtYWtlcic7XG5pbXBvcnQgbWQ1IGZyb20gJ2FudGl0cmFja2luZy9tZDUnO1xuaW1wb3J0IHsgZXZlbnRzIH0gZnJvbSAnY29yZS9jbGlxeic7XG5pbXBvcnQgKiBhcyBkYXRldGltZSBmcm9tICdhbnRpdHJhY2tpbmcvdGltZSc7XG5pbXBvcnQgQ2xpcXpBdHRyYWNrIGZyb20gJ2FudGl0cmFja2luZy9hdHRyYWNrJztcbmltcG9ydCB0ZWxlbWV0cnkgZnJvbSAnYW50aXRyYWNraW5nL3RlbGVtZXRyeSc7XG5pbXBvcnQgUmVzb3VyY2VMb2FkZXIgZnJvbSAnY29yZS9yZXNvdXJjZS1sb2FkZXInO1xuXG5jb25zdCBEQVlTX0VYUElSRSA9IDc7XG5cbmNsYXNzIFRva2VuRG9tYWluIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl90b2tlbkRvbWFpbiA9IG5ldyBwZXJzaXN0LkxhenlQZXJzaXN0ZW50T2JqZWN0KCd0b2tlbkRvbWFpbicpO1xuICB9XG5cbiAgaW5pdCgpIHtcbiAgICB0aGlzLl90b2tlbkRvbWFpbi5sb2FkKCk7XG4gIH1cblxuICBhZGRUb2tlbk9uRmlyc3RQYXJ0eSh0b2tlbiwgZmlyc3RQYXJ0eSkge1xuICAgIGlmICghdGhpcy5fdG9rZW5Eb21haW4udmFsdWVbdG9rZW5dKSB7XG4gICAgICB0aGlzLl90b2tlbkRvbWFpbi52YWx1ZVt0b2tlbl0gPSB7fTtcbiAgICB9XG4gICAgdGhpcy5fdG9rZW5Eb21haW4udmFsdWVbdG9rZW5dW2ZpcnN0UGFydHldID0gZGF0ZXRpbWUuZ2V0VGltZSgpLnN1YnN0cigwLCA4KTtcbiAgICB0aGlzLl90b2tlbkRvbWFpbi5zZXREaXJ0eSgpO1xuICB9XG5cbiAgZ2V0TkZpcnN0UGFydGllc0ZvclRva2VuKHRva2VuKSB7XG4gICAgcmV0dXJuIE9iamVjdC5rZXlzKHRoaXMuX3Rva2VuRG9tYWluLnZhbHVlW3Rva2VuXSB8fCB7fSkubGVuZ3RoO1xuICB9XG5cbiAgY2xlYW4oKSB7XG4gICAgY29uc3QgZGF5ID0gZGF0ZXRpbWUubmV3VVRDRGF0ZSgpO1xuICAgIGRheS5zZXREYXRlKGRheS5nZXREYXRlKCkgLSBEQVlTX0VYUElSRSk7XG4gICAgY29uc3QgZGF5Q3V0b2ZmID0gZGF0ZXRpbWUuZGF0ZVN0cmluZyhkYXkpO1xuICAgIGNvbnN0IHRkID0gdGhpcy5fdG9rZW5Eb21haW4udmFsdWU7XG4gICAgZm9yIChjb25zdCB0b2sgaW4gdGQpIHtcbiAgICAgIGZvciAoY29uc3QgcyBpbiB0ZFt0b2tdKSB7XG4gICAgICAgIGlmICh0ZFt0b2tdW3NdIDwgZGF5Q3V0b2ZmKSB7XG4gICAgICAgICAgZGVsZXRlIHRkW3Rva11bc107XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChPYmplY3Qua2V5cyh0ZFt0b2tdKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgZGVsZXRlIHRkW3Rva107XG4gICAgICB9XG4gICAgfVxuICAgIHRoaXMuX3Rva2VuRG9tYWluLnNldERpcnR5KCk7XG4gICAgdGhpcy5fdG9rZW5Eb21haW4uc2F2ZSgpO1xuICB9XG5cbiAgY2xlYXIoKSB7XG4gICAgdGhpcy5fdG9rZW5Eb21haW4uY2xlYXIoKTtcbiAgfVxufVxuXG5jbGFzcyBCbG9ja0xvZyB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuVVJMX0JMT0NLX1JFUE9SVF9MSVNUID0gJ2h0dHBzOi8vY2RuLmNsaXF6LmNvbS9hbnRpLXRyYWNraW5nL3doaXRlbGlzdC9hbnRpLXRyYWNraW5nLXJlcG9ydC1saXN0Lmpzb24nO1xuICAgIHRoaXMuYmxvY2tSZXBvcnRMaXN0ID0ge307XG4gICAgdGhpcy5ibG9ja2VkID0gbmV3IHBlcnNpc3QuTGF6eVBlcnNpc3RlbnRPYmplY3QoJ2Jsb2NrZWQnKTtcbiAgICB0aGlzLmxvY2FsQmxvY2tlZCA9IG5ldyBwZXJzaXN0LkxhenlQZXJzaXN0ZW50T2JqZWN0KCdsb2NhbEJsb2NrZWQnKTtcbiAgICB0aGlzLl9ibG9ja1JlcG9ydExpc3RMb2FkZXIgPSBuZXcgUmVzb3VyY2VMb2FkZXIoXG4gICAgICBbJ2FudGl0cmFja2luZycsICdhbnRpLXRyYWNraW5nLXJlcG9ydC1saXN0Lmpzb24nXSwge1xuICAgICAgICByZW1vdGVVUkw6ICdodHRwczovL2Nkbi5jbGlxei5jb20vYW50aS10cmFja2luZy93aGl0ZWxpc3QvYW50aS10cmFja2luZy1yZXBvcnQtbGlzdC5qc29uJyxcbiAgICAgICAgY3JvbjogMjQgKiA2MCAqIDYwICogMTAwMCxcbiAgICAgIH0pO1xuICB9XG5cbiAgaW5pdCgpIHtcbiAgICB0aGlzLmJsb2NrZWQubG9hZCgpO1xuICAgIHRoaXMubG9jYWxCbG9ja2VkLmxvYWQoKTtcbiAgICB0aGlzLl9ibG9ja1JlcG9ydExpc3RMb2FkZXIubG9hZCgpLnRoZW4odGhpcy5fbG9hZFJlcG9ydExpc3QuYmluZCh0aGlzKSk7XG4gICAgdGhpcy5fYmxvY2tSZXBvcnRMaXN0TG9hZGVyLm9uVXBkYXRlKHRoaXMuX2xvYWRSZXBvcnRMaXN0LmJpbmQodGhpcykpO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICB0aGlzLl9ibG9ja1JlcG9ydExpc3RMb2FkZXIuc3RvcCgpO1xuICB9XG5cbiAgLy8gYmxvY2tlZCArIGxvY2FsQmxvY2tlZFxuICBhZGQoc291cmNlVXJsLCB0cmFja2VyLCBrZXksIHZhbHVlLCB0eXBlKSB7XG4gICAgY29uc3QgcyA9IHRyYWNrZXI7XG4gICAgY29uc3QgayA9IG1kNShrZXkpO1xuICAgIGNvbnN0IHYgPSBtZDUodmFsdWUpO1xuICAgIGNvbnN0IGhvdXIgPSBkYXRldGltZS5nZXRUaW1lKCk7XG4gICAgY29uc3Qgc291cmNlID0gbWQ1KHNvdXJjZVVybCk7XG5cbiAgICBpZiAodGhpcy5pc0luQmxvY2tSZXBvcnRMaXN0KHMsIGssIHYpKSB7XG4gICAgICB0aGlzLl9hZGRCbG9ja2VkKHMsIGssIHYsIHR5cGUpO1xuICAgIH1cbiAgICAvLyBsb2NhbCBsb2dnaW5nIG9mIGJsb2NrZWQgdG9rZW5zXG4gICAgdGhpcy5fYWRkTG9jYWxCbG9ja2VkKHNvdXJjZSwgdHJhY2tlciwga2V5LCB2YWx1ZSwgaG91cik7XG4gIH1cblxuICBjbGVhcigpIHtcbiAgICB0aGlzLmJsb2NrUmVwb3J0TGlzdCA9IHt9O1xuICAgIHRoaXMuYmxvY2tlZC5jbGVhcigpO1xuICAgIHRoaXMubG9jYWxCbG9ja2VkLmNsZWFyKCk7XG4gIH1cblxuICBfYWRkQmxvY2tlZCh0cmFja2VyLCBrZXksIHZhbHVlLCB0eXBlKSB7XG4gICAgY29uc3QgYmwgPSB0aGlzLmJsb2NrZWQudmFsdWU7XG4gICAgaWYgKCEodHJhY2tlciBpbiBibCkpIHtcbiAgICAgIGJsW3RyYWNrZXJdID0ge307XG4gICAgfVxuICAgIGlmICghKGtleSBpbiBibFt0cmFja2VyXSkpIHtcbiAgICAgIGJsW3RyYWNrZXJdW2tleV0gPSB7fTtcbiAgICB9XG4gICAgaWYgKCEodmFsdWUgaW4gYmxbdHJhY2tlcl1ba2V5XSkpIHtcbiAgICAgIGJsW3RyYWNrZXJdW2tleV1bdmFsdWVdID0ge307XG4gICAgfVxuICAgIGlmICghKHR5cGUgaW4gYmxbdHJhY2tlcl1ba2V5XVt2YWx1ZV0pKSB7XG4gICAgICBibFt0cmFja2VyXVtrZXldW3ZhbHVlXVt0eXBlXSA9IDA7XG4gICAgfVxuICAgIGJsW3RyYWNrZXJdW2tleV1bdmFsdWVdW3R5cGVdKys7XG4gICAgdGhpcy5ibG9ja2VkLnNldERpcnR5KCk7XG4gIH1cblxuICBfYWRkTG9jYWxCbG9ja2VkKHNvdXJjZSwgcywgaywgdiwgaG91cikge1xuICAgIGNvbnN0IGxiID0gdGhpcy5sb2NhbEJsb2NrZWQudmFsdWU7XG4gICAgaWYgKCEoc291cmNlIGluIGxiKSkge1xuICAgICAgbGJbc291cmNlXSA9IHt9O1xuICAgIH1cbiAgICBpZiAoIShzIGluIGxiW3NvdXJjZV0pKSB7XG4gICAgICBsYltzb3VyY2VdW3NdID0ge307XG4gICAgfVxuICAgIGlmICghKGsgaW4gbGJbc291cmNlXVtzXSkpIHtcbiAgICAgIGxiW3NvdXJjZV1bc11ba10gPSB7fTtcbiAgICB9XG4gICAgaWYgKCEodiBpbiBsYltzb3VyY2VdW3NdW2tdKSkge1xuICAgICAgbGJbc291cmNlXVtzXVtrXVt2XSA9IHt9O1xuICAgIH1cbiAgICBpZiAoIShob3VyIGluIGxiW3NvdXJjZV1bc11ba11bdl0pKSB7XG4gICAgICBsYltzb3VyY2VdW3NdW2tdW3ZdW2hvdXJdID0gMDtcbiAgICB9XG4gICAgbGJbc291cmNlXVtzXVtrXVt2XVtob3VyXSsrO1xuICAgIHRoaXMubG9jYWxCbG9ja2VkLnNldERpcnR5KCk7XG4gIH1cblxuICBfY2xlYW5Mb2NhbEJsb2NrZWQoaG91ckN1dG9mZikge1xuICAgIC8vIGxvY2FsQmxvY2tlZFxuICAgIGZvciAoY29uc3Qgc291cmNlIGluIHRoaXMubG9jYWxCbG9ja2VkLnZhbHVlKSB7XG4gICAgICBmb3IgKGNvbnN0IHMgaW4gdGhpcy5sb2NhbEJsb2NrZWQudmFsdWVbc291cmNlXSkge1xuICAgICAgICBmb3IgKGNvbnN0IGsgaW4gdGhpcy5sb2NhbEJsb2NrZWQudmFsdWVbc291cmNlXVtzXSkge1xuICAgICAgICAgIGZvciAoY29uc3QgdiBpbiB0aGlzLmxvY2FsQmxvY2tlZC52YWx1ZVtzb3VyY2VdW3NdW2tdKSB7XG4gICAgICAgICAgICBmb3IgKGNvbnN0IGggaW4gdGhpcy5sb2NhbEJsb2NrZWQudmFsdWVbc291cmNlXVtzXVtrXVt2XSkge1xuICAgICAgICAgICAgICBpZiAoaCA8IGhvdXJDdXRvZmYpIHtcbiAgICAgICAgICAgICAgICBkZWxldGUgdGhpcy5sb2NhbEJsb2NrZWQudmFsdWVbc291cmNlXVtzXVtrXVt2XVtoXTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMubG9jYWxCbG9ja2VkLnZhbHVlW3NvdXJjZV1bc11ba11bdl0pLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgICBkZWxldGUgdGhpcy5sb2NhbEJsb2NrZWQudmFsdWVbc291cmNlXVtzXVtrXVt2XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMubG9jYWxCbG9ja2VkLnZhbHVlW3NvdXJjZV1bc11ba10pLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgZGVsZXRlIHRoaXMubG9jYWxCbG9ja2VkLnZhbHVlW3NvdXJjZV1bc11ba107XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGlmIChPYmplY3Qua2V5cyh0aGlzLmxvY2FsQmxvY2tlZC52YWx1ZVtzb3VyY2VdW3NdKS5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICBkZWxldGUgdGhpcy5sb2NhbEJsb2NrZWQudmFsdWVbc291cmNlXVtzXTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgaWYgKE9iamVjdC5rZXlzKHRoaXMubG9jYWxCbG9ja2VkLnZhbHVlW3NvdXJjZV0pLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICBkZWxldGUgdGhpcy5sb2NhbEJsb2NrZWQudmFsdWVbc291cmNlXTtcbiAgICAgIH1cbiAgICB9XG4gICAgdGhpcy5sb2NhbEJsb2NrZWQuc2V0RGlydHkodHJ1ZSk7XG4gICAgdGhpcy5sb2NhbEJsb2NrZWQuc2F2ZSgpO1xuICB9XG5cbiAgX2xvYWRSZXBvcnRMaXN0KGxpc3QpIHtcbiAgICB0aGlzLmJsb2NrUmVwb3J0TGlzdCA9IGxpc3Q7XG4gIH1cblxuICBpc0luQmxvY2tSZXBvcnRMaXN0KHMsIGssIHYpIHtcbiAgICBpZiAoJyonIGluIHRoaXMuYmxvY2tSZXBvcnRMaXN0KSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKHMgaW4gdGhpcy5ibG9ja1JlcG9ydExpc3QpIHtcbiAgICAgIGNvbnN0IGtleUxpc3QgPSB0aGlzLmJsb2NrUmVwb3J0TGlzdFtzXTtcbiAgICAgIGlmIChrZXlMaXN0ID09PSAnKicpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGsgaW4ga2V5TGlzdCkge1xuICAgICAgICBjb25zdCB2YWx1ZUxpc3QgPSBrZXlMaXN0W2tdO1xuICAgICAgICBpZiAodmFsdWVMaXN0ID09PSAnKicpIHtcbiAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIGlmICh2IGluIHZhbHVlTGlzdCkge1xuICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIHNlbmRUZWxlbWV0cnkoKSB7XG4gICAgaWYgKE9iamVjdC5rZXlzKHRoaXMuYmxvY2tlZC52YWx1ZSkubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgcGF5bCA9IENsaXF6QXR0cmFjay5nZW5lcmF0ZUF0dHJhY2tQYXlsb2FkKHRoaXMuYmxvY2tlZC52YWx1ZSk7XG4gICAgICB0ZWxlbWV0cnkudGVsZW1ldHJ5KHtcbiAgICAgICAgdHlwZTogdGVsZW1ldHJ5Lm1zZ1R5cGUsXG4gICAgICAgIGFjdGlvbjogJ2F0dHJhY2suYmxvY2tlZCcsXG4gICAgICAgIHBheWxvYWQ6IHBheWwsXG4gICAgICB9KTtcbiAgICAgIC8vIHJlc2V0IHRoZSBzdGF0ZVxuICAgICAgdGhpcy5ibG9ja2VkLmNsZWFyKCk7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHtcbiAgY29uc3RydWN0b3IocXNXaGl0ZWxpc3QpIHtcbiAgICB0aGlzLmJsb2NrTG9nID0gbmV3IEJsb2NrTG9nKCk7XG4gICAgdGhpcy50b2tlbkRvbWFpbiA9IG5ldyBUb2tlbkRvbWFpbigpO1xuICAgIHRoaXMuY2hlY2tlZFRva2VuID0gbmV3IHBlcnNpc3QuTGF6eVBlcnNpc3RlbnRPYmplY3QoJ2NoZWNrZWRUb2tlbicpO1xuICAgIHRoaXMuYmxvY2tlZFRva2VuID0gbmV3IHBlcnNpc3QuTGF6eVBlcnNpc3RlbnRPYmplY3QoJ2Jsb2NrZWRUb2tlbicpO1xuICAgIHRoaXMubG9hZGVkUGFnZSA9IG5ldyBwZXJzaXN0LkxhenlQZXJzaXN0ZW50T2JqZWN0KCdsb2FkZWRQYWdlJyk7XG4gICAgdGhpcy5jdXJyZW50SG91ciA9IGRhdGV0aW1lLmdldFRpbWUoKTtcbiAgICB0aGlzLl91cGRhdGVkID0ge307XG4gICAgdGhpcy5xc1doaXRlbGlzdCA9IHFzV2hpdGVsaXN0O1xuICB9XG5cbiAgaW5pdCgpIHtcbiAgICB0aGlzLmJsb2NrTG9nLmluaXQoKTtcbiAgICB0aGlzLnRva2VuRG9tYWluLmluaXQoKTtcblxuICAgIGV2ZW50cy5zdWIoJ2F0dHJhY2s6aG91cl9jaGFuZ2VkJywgKCkgPT4ge1xuICAgICAgdGhpcy5jdXJyZW50SG91ciA9IGRhdGV0aW1lLmdldFRpbWUoKTtcbiAgICAgIHRoaXMuX2NsZWFuKCk7XG4gICAgICB0aGlzLnNlbmRUZWxlbWV0cnkoKTtcbiAgICB9KTtcbiAgICBldmVudHMuc3ViKCdhdHRyYWNrOnRva2VuX3doaXRlbGlzdF91cGRhdGVkJywgKCkgPT4ge1xuICAgICAgdGhpcy5jaGVja1dyb25nVG9rZW4oJ3Rva2VuJyk7XG4gICAgfSk7XG4gICAgZXZlbnRzLnN1YignYXR0cmFjazpzYWZla2V5c191cGRhdGVkJywgKCkgPT4ge1xuICAgICAgdGhpcy5jaGVja1dyb25nVG9rZW4oJ3NhZmVLZXknKTtcbiAgICB9KTtcblxuICAgIHRoaXMuY2hlY2tlZFRva2VuLmxvYWQoKTtcbiAgICB0aGlzLmJsb2NrZWRUb2tlbi5sb2FkKCk7XG4gICAgdGhpcy5sb2FkZWRQYWdlLmxvYWQoKTtcblxuICAgIHRoaXMuc2F2ZUJsb2NrbG9nID0gKCkgPT4ge1xuICAgICAgdGhpcy5jaGVja2VkVG9rZW4uc2F2ZSgpO1xuICAgICAgdGhpcy5ibG9ja2VkVG9rZW4uc2F2ZSgpO1xuICAgICAgdGhpcy5sb2FkZWRQYWdlLnNhdmUoKTtcbiAgICAgIHRoaXMudG9rZW5Eb21haW4uX3Rva2VuRG9tYWluLnNhdmUoKTtcbiAgICAgIHRoaXMuYmxvY2tMb2cuYmxvY2tlZC5zYXZlKCk7XG4gICAgICB0aGlzLmJsb2NrTG9nLmxvY2FsQmxvY2tlZC5zYXZlKCk7XG4gICAgfTtcbiAgICB0aGlzLl9wbVRhc2sgPSBwYWNlbWFrZXIucmVnaXN0ZXIodGhpcy5zYXZlQmxvY2tsb2csIDEwMDAgKiA2MCAqIDUpO1xuICB9XG5cbiAgZGVzdHJveSgpIHtcbiAgICBwYWNlbWFrZXIuZGVyZWdpc3Rlcih0aGlzLl9wbVRhc2spO1xuICAgIHRoaXMuYmxvY2tMb2cuZGVzdHJveSgpO1xuICB9XG5cbiAgaW5jcmVtZW50Q2hlY2tlZFRva2VucygpIHtcbiAgICB0aGlzLl9pbmNyZW1lbnRQZXJzaXN0ZW50VmFsdWUodGhpcy5jaGVja2VkVG9rZW4sIDEpO1xuICB9XG5cbiAgaW5jcmVtZW50QmxvY2tlZFRva2VucyhuQmxvY2tlZCkge1xuICAgIHRoaXMuX2luY3JlbWVudFBlcnNpc3RlbnRWYWx1ZSh0aGlzLmJsb2NrZWRUb2tlbiwgbkJsb2NrZWQpO1xuICB9XG5cbiAgaW5jcmVtZW50TG9hZGVkUGFnZXMoKSB7XG4gICAgdGhpcy5faW5jcmVtZW50UGVyc2lzdGVudFZhbHVlKHRoaXMubG9hZGVkUGFnZSwgMSk7XG4gIH1cblxuICBfaW5jcmVtZW50UGVyc2lzdGVudFZhbHVlKHYsIG4pIHtcbiAgICBjb25zdCBob3VyID0gdGhpcy5jdXJyZW50SG91cjtcbiAgICBpZiAoIShob3VyIGluIHYudmFsdWUpKSB7XG4gICAgICB2LnZhbHVlW2hvdXJdID0gMDtcbiAgICB9XG4gICAgdi52YWx1ZVtob3VyXSArPSBuO1xuICAgIHYuc2V0RGlydHkoKTtcbiAgfVxuXG4gIHNlbmRUZWxlbWV0cnkoKSB7XG4gICAgdGhpcy5ibG9ja0xvZy5zZW5kVGVsZW1ldHJ5KCk7XG4gIH1cblxuICBjaGVja1dyb25nVG9rZW4oa2V5KSB7XG4gICAgdGhpcy5fY2xlYW4oKTtcbiAgICAvLyBzZW5kIG1heCBvbmUgdGltZSBhIGRheVxuICAgIGNvbnN0IGRheSA9IGRhdGV0aW1lLmdldFRpbWUoKS5zbGljZSgwLCA4KTtcbiAgICBjb25zdCB3cm9uZ1Rva2VuTGFzdFNlbnQgPSBwZXJzaXN0LmdldFZhbHVlKCd3cm9uZ1Rva2VuTGFzdFNlbnQnLCBkYXRldGltZS5nZXRUaW1lKCkuc2xpY2UoMCwgOCkpO1xuICAgIGlmICh3cm9uZ1Rva2VuTGFzdFNlbnQgPT09IGRheSkge1xuICAgICAgcmV0dXJuOyAgLy8gbWF4IG9uZSBzaWduYWwgcGVyIGRheVxuICAgIH1cbiAgICB0aGlzLl91cGRhdGVkW2tleV0gPSB0cnVlO1xuICAgIGlmICghKCdzYWZlS2V5JyBpbiB0aGlzLl91cGRhdGVkKSB8fCAoISgndG9rZW4nIGluIHRoaXMuX3VwZGF0ZWQpKSkge1xuICAgICAgcmV0dXJuOyAgLy8gd2FpdCB1bnRpbCBib3RoIGxpc3RzIGFyZSB1cGRhdGVkXG4gICAgfVxuICAgIGxldCBjb3VudExvYWRlZFBhZ2UgPSAwO1xuICAgIGxldCBjb3VudENoZWNrZWRUb2tlbiA9IDA7XG4gICAgbGV0IGNvdW50QmxvY2tlZFRva2VuID0gMDtcbiAgICBsZXQgY291bnRXcm9uZ1Rva2VuID0gMDtcbiAgICBsZXQgY291bnRXcm9uZ1BhZ2UgPSAwO1xuXG4gICAgY29uc3QgbG9jYWxCbG9ja2VkID0gdGhpcy5ibG9ja0xvZy5sb2NhbEJsb2NrZWQudmFsdWU7XG4gICAgZm9yIChjb25zdCBzb3VyY2UgaW4gbG9jYWxCbG9ja2VkKSB7XG4gICAgICBsZXQgd3JvbmdTb3VyY2UgPSB0cnVlO1xuICAgICAgZm9yIChjb25zdCBzIGluIGxvY2FsQmxvY2tlZFtzb3VyY2VdKSB7XG4gICAgICAgIGZvciAoY29uc3QgayBpbiBsb2NhbEJsb2NrZWRbc291cmNlXVtzXSkge1xuICAgICAgICAgIGZvciAoY29uc3QgdiBpbiBsb2NhbEJsb2NrZWRbc291cmNlXVtzXVtrXSkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLnFzV2hpdGVsaXN0LmlzVHJhY2tlckRvbWFpbihzKSB8fFxuICAgICAgICAgICAgICB0aGlzLnFzV2hpdGVsaXN0LmlzU2FmZUtleShzLCBrKSB8fFxuICAgICAgICAgICAgICB0aGlzLnFzV2hpdGVsaXN0LmlzU2FmZVRva2VuKHMsIHYpKSB7XG4gICAgICAgICAgICAgIGZvciAoY29uc3QgaCBpbiBsb2NhbEJsb2NrZWRbc291cmNlXVtzXVtrXVt2XSkge1xuICAgICAgICAgICAgICAgIGNvdW50V3JvbmdUb2tlbiArPSBsb2NhbEJsb2NrZWRbc291cmNlXVtzXVtrXVt2XVtoXTtcbiAgICAgICAgICAgICAgICBsb2NhbEJsb2NrZWRbc291cmNlXVtzXVtrXVt2XVtoXSA9IDA7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgdGhpcy5ibG9ja0xvZy5sb2NhbEJsb2NrZWQuc2V0RGlydHkoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHdyb25nU291cmNlID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICBpZiAod3JvbmdTb3VyY2UpIHtcbiAgICAgICAgY291bnRXcm9uZ1BhZ2UrKztcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBzZW5kIHNpZ25hbFxuICAgIC8vIHN1bSBjaGVja2VkVG9rZW4gJiBibG9ja2VkVG9rZW5cbiAgICBmb3IgKGNvbnN0IGggaW4gdGhpcy5jaGVja2VkVG9rZW4udmFsdWUpIHtcbiAgICAgIGNvdW50Q2hlY2tlZFRva2VuICs9IHRoaXMuY2hlY2tlZFRva2VuLnZhbHVlW2hdO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGggaW4gdGhpcy5ibG9ja2VkVG9rZW4udmFsdWUpIHtcbiAgICAgIGNvdW50QmxvY2tlZFRva2VuICs9IHRoaXMuYmxvY2tlZFRva2VuLnZhbHVlW2hdO1xuICAgIH1cbiAgICBmb3IgKGNvbnN0IGggaW4gdGhpcy5sb2FkZWRQYWdlLnZhbHVlKSB7XG4gICAgICBjb3VudExvYWRlZFBhZ2UgKz0gdGhpcy5sb2FkZWRQYWdlLnZhbHVlW2hdO1xuICAgIH1cblxuICAgIGNvbnN0IGRhdGEgPSB7XG4gICAgICB3cm9uZ1Rva2VuOiBjb3VudFdyb25nUGFnZSxcbiAgICAgIGNoZWNrZWRUb2tlbjogY291bnRDaGVja2VkVG9rZW4sXG4gICAgICBibG9ja2VkVG9rZW46IGNvdW50QmxvY2tlZFRva2VuLFxuICAgICAgd3JvbmdQYWdlOiBjb3VudFdyb25nUGFnZSxcbiAgICAgIGxvYWRlZFBhZ2U6IGNvdW50TG9hZGVkUGFnZSxcbiAgICB9O1xuICAgIGNvbnN0IHBheWwgPSBDbGlxekF0dHJhY2suZ2VuZXJhdGVBdHRyYWNrUGF5bG9hZChkYXRhLCB3cm9uZ1Rva2VuTGFzdFNlbnQpO1xuICAgIHRlbGVtZXRyeS50ZWxlbWV0cnkoe1xuICAgICAgdHlwZTogdGVsZW1ldHJ5Lm1zZ1R5cGUsXG4gICAgICBhY3Rpb246ICdhdHRyYWNrLkZQJyxcbiAgICAgIHBheWxvYWQ6IHBheWwsXG4gICAgfSk7XG4gICAgcGVyc2lzdC5zZXRWYWx1ZSgnd3JvbmdUb2tlbkxhc3RTZW50JywgZGF5KTtcbiAgICB0aGlzLl91cGRhdGVkID0ge307XG4gIH1cblxuICBjbGVhcigpIHtcbiAgICB0aGlzLmJsb2NrTG9nLmNsZWFyKCk7XG4gICAgdGhpcy50b2tlbkRvbWFpbi5jbGVhcigpO1xuICAgIHRoaXMuY2hlY2tlZFRva2VuLmNsZWFyKCk7XG4gICAgdGhpcy5ibG9ja2VkVG9rZW4uY2xlYXIoKTtcbiAgICB0aGlzLmxvYWRlZFBhZ2UuY2xlYXIoKTtcbiAgfVxuXG4gIF9jbGVhbigpIHtcbiAgICBjb25zdCBkZWxheSA9IDI0O1xuICAgIGNvbnN0IGhvdXIgPSBkYXRldGltZS5uZXdVVENEYXRlKCk7XG4gICAgaG91ci5zZXRIb3Vycyhob3VyLmdldEhvdXJzKCkgLSBkZWxheSk7XG4gICAgY29uc3QgaG91ckN1dG9mZiA9IGRhdGV0aW1lLmhvdXJTdHJpbmcoaG91cik7XG5cbiAgICB0aGlzLmJsb2NrTG9nLl9jbGVhbkxvY2FsQmxvY2tlZChob3VyQ3V0b2ZmKTtcbiAgICAvLyBjaGVja2VkVG9rZW5cbiAgICBmb3IgKGNvbnN0IGggaW4gdGhpcy5jaGVja2VkVG9rZW4udmFsdWUpIHtcbiAgICAgIGlmIChoIDwgaG91ckN1dG9mZikge1xuICAgICAgICBkZWxldGUgdGhpcy5jaGVja2VkVG9rZW4udmFsdWVbaF07XG4gICAgICB9XG4gICAgfVxuICAgIGZvciAoY29uc3QgaCBpbiB0aGlzLmxvYWRlZFBhZ2UudmFsdWUpIHtcbiAgICAgIGlmIChoIDwgaG91ckN1dG9mZikge1xuICAgICAgICBkZWxldGUgdGhpcy5sb2FkZWRQYWdlLnZhbHVlW2hdO1xuICAgICAgfVxuICAgIH1cblxuICAgIHRoaXMuY2hlY2tlZFRva2VuLnNldERpcnR5KCk7XG4gICAgdGhpcy5sb2FkZWRQYWdlLnNldERpcnR5KCk7XG5cbiAgICB0aGlzLnRva2VuRG9tYWluLmNsZWFuKCk7XG4gIH1cblxufVxuIl19