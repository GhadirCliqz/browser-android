System.register('adblocker/adb-stats', ['antitracking/domain', 'antitracking/attrack', 'adblocker/adblocker', 'antitracking/url'], function (_export) {
  'use strict';

  var getGeneralDomain, attrack, CliqzADB, URLInfo, PageStats, AdbStats;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_antitrackingDomain) {
      getGeneralDomain = _antitrackingDomain.getGeneralDomain;
    }, function (_antitrackingAttrack) {
      attrack = _antitrackingAttrack['default'];
    }, function (_adblockerAdblocker) {
      CliqzADB = _adblockerAdblocker['default'];
    }, function (_antitrackingUrl) {
      URLInfo = _antitrackingUrl.URLInfo;
    }],
    execute: function () {
      PageStats = (function () {
        function PageStats(url) {
          _classCallCheck(this, PageStats);

          this.pageUrl = url;
          this.count = 0;
          this.blocked = new Map();
        }

        _createClass(PageStats, [{
          key: 'addBlockedUrl',
          value: function addBlockedUrl(url) {
            // retrieve company
            this.count++;
            var domain = getGeneralDomain(URLInfo.get(url).hostname);
            var company = undefined;
            // Re-use anti tracking company list for the moment.
            // TODO: Replace it with a proper ads company list later
            if (domain in attrack.tracker_companies) {
              company = attrack.tracker_companies[domain];
            } else if (domain === getGeneralDomain(URLInfo.get(this.pageUrl).hostname)) {
              company = 'First party';
            } else {
              company = '_Unknown';
            }
            if (this.blocked.get(company)) {
              this.blocked.get(company).add(url);
            } else {
              this.blocked.set(company, new Set([url]));
            }
          }
        }, {
          key: 'report',
          value: function report() {
            var advertisersList = {};
            this.blocked.forEach(function (v, k) {
              return advertisersList[k] = [].concat(_toConsumableArray(v));
            });
            return {
              totalCount: this.count,
              advertisersList: advertisersList
            };
          }
        }]);

        return PageStats;
      })();

      AdbStats = (function () {
        function AdbStats() {
          _classCallCheck(this, AdbStats);

          this.pages = new Map();
        }

        _createClass(AdbStats, [{
          key: 'addBlockedUrl',
          value: function addBlockedUrl(sourceUrl, url) {
            if (!this.pages.get(sourceUrl)) {
              this.addNewPage(sourceUrl);
            }
            this.pages.get(sourceUrl).addBlockedUrl(url);
          }
        }, {
          key: 'addNewPage',
          value: function addNewPage(sourceUrl) {
            this.pages.set(sourceUrl, new PageStats(sourceUrl));
          }
        }, {
          key: 'report',
          value: function report(url) {
            if (this.pages.get(url)) {
              return this.pages.get(url).report();
            } else {
              return {
                totalCount: 0,
                advertisersList: {}
              };
            }
          }
        }, {
          key: 'clearStats',
          value: function clearStats() {
            var _this = this;

            this.pages.forEach(function (value, key) {
              if (!CliqzADB.isTabURL(key)) {
                _this.pages['delete'](key);
              }
            });
          }
        }]);

        return AdbStats;
      })();

      _export('default', AdbStats);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,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SSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxFQUFFLENBQUM7YUFDckMsTUFBTTtBQUNMLHFCQUFPO0FBQ0wsMEJBQVUsRUFBRSxDQUFDO0FBQ2IsK0JBQWUsRUFBRSxFQUFFO2VBQ3BCLENBQUM7YUFDSDtXQUNGOzs7aUJBRVMsc0JBQUc7OztBQUNYLGdCQUFJLENBQUMsS0FBSyxDQUFDLE9BQU8sQ0FBQyxVQUFDLEtBQUssRUFBRSxHQUFHLEVBQUs7QUFDakMsa0JBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQzNCLHNCQUFLLEtBQUssVUFBTyxDQUFDLEdBQUcsQ0FBQyxDQUFDO2VBQ3hCO2FBQ0YsQ0FBQyxDQUFDO1dBQ0o7OztlQWpDRyxRQUFROzs7eUJBb0NDLFFBQVEiLCJmaWxlIjoiYWRibG9ja2VyL2FkYi1zdGF0cy5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGdldEdlbmVyYWxEb21haW4gfSBmcm9tICdhbnRpdHJhY2tpbmcvZG9tYWluJztcbmltcG9ydCBhdHRyYWNrIGZyb20gJ2FudGl0cmFja2luZy9hdHRyYWNrJztcbmltcG9ydCBDbGlxekFEQiBmcm9tICdhZGJsb2NrZXIvYWRibG9ja2VyJztcbmltcG9ydCB7IFVSTEluZm8gfSBmcm9tICdhbnRpdHJhY2tpbmcvdXJsJztcblxuXG5jbGFzcyBQYWdlU3RhdHMge1xuICBjb25zdHJ1Y3Rvcih1cmwpIHtcbiAgICB0aGlzLnBhZ2VVcmwgPSB1cmw7XG4gICAgdGhpcy5jb3VudCA9IDA7XG4gICAgdGhpcy5ibG9ja2VkID0gbmV3IE1hcCgpO1xuICB9XG5cbiAgYWRkQmxvY2tlZFVybCh1cmwpIHtcbiAgICAvLyByZXRyaWV2ZSBjb21wYW55XG4gICAgdGhpcy5jb3VudCsrO1xuICAgIGNvbnN0IGRvbWFpbiA9IGdldEdlbmVyYWxEb21haW4oVVJMSW5mby5nZXQodXJsKS5ob3N0bmFtZSk7XG4gICAgbGV0IGNvbXBhbnk7XG4gICAgLy8gUmUtdXNlIGFudGkgdHJhY2tpbmcgY29tcGFueSBsaXN0IGZvciB0aGUgbW9tZW50LlxuICAgIC8vIFRPRE86IFJlcGxhY2UgaXQgd2l0aCBhIHByb3BlciBhZHMgY29tcGFueSBsaXN0IGxhdGVyXG4gICAgaWYgKGRvbWFpbiBpbiBhdHRyYWNrLnRyYWNrZXJfY29tcGFuaWVzKSB7XG4gICAgICBjb21wYW55ID0gYXR0cmFjay50cmFja2VyX2NvbXBhbmllc1tkb21haW5dO1xuICAgIH0gZWxzZSBpZiAoZG9tYWluID09PSBnZXRHZW5lcmFsRG9tYWluKFVSTEluZm8uZ2V0KHRoaXMucGFnZVVybCkuaG9zdG5hbWUpKSB7XG4gICAgICBjb21wYW55ID0gJ0ZpcnN0IHBhcnR5JztcbiAgICB9IGVsc2Uge1xuICAgICAgY29tcGFueSA9ICdfVW5rbm93bic7XG4gICAgfVxuICAgIGlmICh0aGlzLmJsb2NrZWQuZ2V0KGNvbXBhbnkpKSB7XG4gICAgICB0aGlzLmJsb2NrZWQuZ2V0KGNvbXBhbnkpLmFkZCh1cmwpO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmJsb2NrZWQuc2V0KGNvbXBhbnksIG5ldyBTZXQoW3VybF0pKTtcbiAgICB9XG4gIH1cblxuICByZXBvcnQoKSB7XG4gICAgY29uc3QgYWR2ZXJ0aXNlcnNMaXN0ID0ge307XG4gICAgdGhpcy5ibG9ja2VkLmZvckVhY2goKHYsIGspID0+IGFkdmVydGlzZXJzTGlzdFtrXSA9IFsuLi52XSk7XG4gICAgcmV0dXJuIHtcbiAgICAgIHRvdGFsQ291bnQ6IHRoaXMuY291bnQsXG4gICAgICBhZHZlcnRpc2Vyc0xpc3Q6IGFkdmVydGlzZXJzTGlzdCxcbiAgICB9O1xuICB9XG59XG5cblxuY2xhc3MgQWRiU3RhdHMge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLnBhZ2VzID0gbmV3IE1hcCgpO1xuICB9XG5cbiAgYWRkQmxvY2tlZFVybChzb3VyY2VVcmwsIHVybCkge1xuICAgIGlmICghdGhpcy5wYWdlcy5nZXQoc291cmNlVXJsKSkge1xuICAgICAgdGhpcy5hZGROZXdQYWdlKHNvdXJjZVVybCk7XG4gICAgfVxuICAgIHRoaXMucGFnZXMuZ2V0KHNvdXJjZVVybCkuYWRkQmxvY2tlZFVybCh1cmwpO1xuICB9XG5cbiAgYWRkTmV3UGFnZShzb3VyY2VVcmwpIHtcbiAgICB0aGlzLnBhZ2VzLnNldChzb3VyY2VVcmwsIG5ldyBQYWdlU3RhdHMoc291cmNlVXJsKSk7XG4gIH1cblxuICByZXBvcnQodXJsKSB7XG4gICAgaWYgKHRoaXMucGFnZXMuZ2V0KHVybCkpIHtcbiAgICAgIHJldHVybiB0aGlzLnBhZ2VzLmdldCh1cmwpLnJlcG9ydCgpO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4ge1xuICAgICAgICB0b3RhbENvdW50OiAwLFxuICAgICAgICBhZHZlcnRpc2Vyc0xpc3Q6IHt9LFxuICAgICAgfTtcbiAgICB9XG4gIH1cblxuICBjbGVhclN0YXRzKCkge1xuICAgIHRoaXMucGFnZXMuZm9yRWFjaCgodmFsdWUsIGtleSkgPT4ge1xuICAgICAgaWYgKCFDbGlxekFEQi5pc1RhYlVSTChrZXkpKSB7XG4gICAgICAgIHRoaXMucGFnZXMuZGVsZXRlKGtleSk7XG4gICAgICB9XG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgQWRiU3RhdHM7XG4iXX0=