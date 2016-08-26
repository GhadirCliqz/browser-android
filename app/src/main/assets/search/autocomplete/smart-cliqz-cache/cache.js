System.register('autocomplete/smart-cliqz-cache/cache', ['core/cliqz', 'core/fs'], function (_export) {

  /**
  * this simple cache is a dictionary that addionally stores
  * timestamps for each entry; life is time in seconds before
  * entries are marked stale (if life is not specified entries
  * are good forever); going stale has no immediate consequences
  * @namespace smart-cliqz-cache
  */
  'use strict';

  var utils, readFile, writeFile, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }, function (_coreFs) {
      readFile = _coreFs.readFile;
      writeFile = _coreFs.writeFile;
    }],
    execute: function () {
      _default = (function () {
        /**
        * @class Cache
        * @constructor
        */

        function _default(life) {
          _classCallCheck(this, _default);

          this._cache = {};
          this._life = life ? life * 1000 : false;
        }

        /**
        * stores entry only if it is newer than current entry,
        * current time is used if time is not specified
        * @method store
        * @param key {string}
        * @param value {string}
        * @param time {timestamp}
        */

        _createClass(_default, [{
          key: 'store',
          value: function store(key, value, time) {
            time = time || Date.now();

            if (this.isNew(key, value, time)) {
              this._cache[key] = {
                time: time,
                value: value
              };
            }
          }

          /**
          * deletes entry
          * @method delete
          * @param key {string}
          */
        }, {
          key: 'delete',
          value: function _delete(key) {
            if (this.isCached(key)) {
              delete this._cache[key];
            }
          }

          /**
          * returns cached entry or false if no entry exists for key
          * @method retrieve
          * @param key {string}
          */
        }, {
          key: 'retrieve',
          value: function retrieve(key) {
            if (!this.isCached(key)) {
              return false;
            }
            return this._cache[key].value;
          }

          /**
          * @method isCached
          * @param key {string}
          */
        }, {
          key: 'isCached',
          value: function isCached(key) {
            return this._cache.hasOwnProperty(key);
          }

          /**
          * @method isNew
          * @param key {string}
          * @param value {string}
          * @param time {timestamp}
          * @returns true if there is no newer entry already cached for key
          */
        }, {
          key: 'isNew',
          value: function isNew(key, value, time) {
            return !this.isCached(key) || time > this._cache[key].time;
          }

          /** an entry is stale if it is not cached or has expired
          * (an entry can only expire if life is specified); this
          * has no immediate consequences, but can be used from
          * outside to decide if this entry should be updated
          * @method isStale
          * @param key {string}
          */
        }, {
          key: 'isStale',
          value: function isStale(key) {
            return !this.isCached(key) || this._life && Date.now() - this._cache[key].time > this._life;
          }

          /**
          * updates time without replacing the entry
          * @method refresh
          * @param key {string}
          * @param time {timestamp}
          */
        }, {
          key: 'refresh',
          value: function refresh(key, time) {
            time = time || Date.now();

            if (this.isCached(key)) {
              this._cache[key].time = time;
            }
          }

          /**
          * save cache to file
          * @method save
          * @param filename {string}
          */
        }, {
          key: 'save',
          value: function save(filename) {
            var _this = this;

            var content = new TextEncoder().encode(JSON.stringify(this._cache));
            writeFile(filename, content).then(function () {
              _this.log('save: saved to ' + filename);
            })['catch'](function (e) {
              _this.log('save: failed saving: ' + e);
            });
          }

          /**
          * load cache from file
          * @method load
          * @param filename {string}
          */
        }, {
          key: 'load',
          value: function load(filename) {
            var _this2 = this;

            readFile(filename).then(function (data) {
              _this2._cache = JSON.parse(new TextDecoder().decode(data));
              _this2.log('load: loaded from: ' + filename);
            })['catch'](function (e) {
              _this2.log('load: failed loading: ' + e);
            });
          }
        }, {
          key: 'log',
          value: function log(msg) {
            utils.log(msg, 'Cache');
          }
        }]);

        return _default;
      })();

      _export('default', _default);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dG9jb21wbGV0ZS9zbWFydC1jbGlxei1jYWNoZS9jYWNoZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O3lCQUFTLEtBQUs7O3lCQUNMLFFBQVE7MEJBQUUsU0FBUzs7Ozs7Ozs7O0FBY2YsMEJBQUMsSUFBSSxFQUFFOzs7QUFDakIsY0FBSSxDQUFDLE1BQU0sR0FBRyxFQUFHLENBQUM7QUFDbEIsY0FBSSxDQUFDLEtBQUssR0FBRyxJQUFJLEdBQUcsSUFBSSxHQUFHLElBQUksR0FBRyxLQUFLLENBQUM7U0FDeEM7Ozs7Ozs7Ozs7Ozs7aUJBVUksZUFBQyxHQUFHLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRTtBQUN0QixnQkFBSSxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7O0FBRTFCLGdCQUFJLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLEtBQUssRUFBRSxJQUFJLENBQUMsRUFBRTtBQUNoQyxrQkFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRztBQUNqQixvQkFBSSxFQUFFLElBQUk7QUFDVixxQkFBSyxFQUFFLEtBQUs7ZUFDYixDQUFDO2FBQ0g7V0FDRjs7Ozs7Ozs7O2lCQU9LLGlCQUFDLEdBQUcsRUFBRTtBQUNWLGdCQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDdEIscUJBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQzthQUN6QjtXQUNGOzs7Ozs7Ozs7aUJBT08sa0JBQUMsR0FBRyxFQUFFO0FBQ1osZ0JBQUksQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQ3ZCLHFCQUFPLEtBQUssQ0FBQzthQUNkO0FBQ0QsbUJBQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUM7V0FDL0I7Ozs7Ozs7O2lCQU1PLGtCQUFDLEdBQUcsRUFBRTtBQUNaLG1CQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsY0FBYyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1dBQ3hDOzs7Ozs7Ozs7OztpQkFTSSxlQUFDLEdBQUcsRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFO0FBQ3RCLG1CQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFDdkIsSUFBSSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxBQUFDLENBQUM7V0FDbEM7Ozs7Ozs7Ozs7O2lCQVNNLGlCQUFDLEdBQUcsRUFBRTtBQUNYLG1CQUFPLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHLENBQUMsSUFDdkIsSUFBSSxDQUFDLEtBQUssSUFBSSxBQUFDLElBQUksQ0FBQyxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLElBQUksR0FBSSxJQUFJLENBQUMsS0FBSyxBQUFDLENBQUM7V0FDckU7Ozs7Ozs7Ozs7aUJBUU0saUJBQUMsR0FBRyxFQUFFLElBQUksRUFBRTtBQUNqQixnQkFBSSxHQUFHLElBQUksSUFBSSxJQUFJLENBQUMsR0FBRyxFQUFFLENBQUM7O0FBRTFCLGdCQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDdEIsa0JBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQzthQUM5QjtXQUNGOzs7Ozs7Ozs7aUJBT0csY0FBQyxRQUFRLEVBQUU7OztBQUNiLGdCQUFNLE9BQU8sR0FBRyxBQUFDLElBQUksV0FBVyxFQUFFLENBQUUsTUFBTSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUM7QUFDeEUscUJBQVMsQ0FBQyxRQUFRLEVBQUUsT0FBTyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQU07QUFDdEMsb0JBQUssR0FBRyxDQUFDLGlCQUFpQixHQUFHLFFBQVEsQ0FBQyxDQUFDO2FBQ3hDLENBQUMsU0FBTSxDQUFDLFVBQUMsQ0FBQyxFQUFLO0FBQ2Qsb0JBQUssR0FBRyxDQUFDLHVCQUF1QixHQUFHLENBQUMsQ0FBQyxDQUFDO2FBQ3ZDLENBQUMsQ0FBQztXQUNKOzs7Ozs7Ozs7aUJBT0csY0FBQyxRQUFRLEVBQUU7OztBQUNiLG9CQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsSUFBSSxDQUFDLFVBQUMsSUFBSSxFQUFLO0FBQ2hDLHFCQUFLLE1BQU0sR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEFBQUMsSUFBSSxXQUFXLEVBQUUsQ0FBRSxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztBQUMzRCxxQkFBSyxHQUFHLENBQUMscUJBQXFCLEdBQUcsUUFBUSxDQUFDLENBQUM7YUFDNUMsQ0FBQyxTQUFNLENBQUMsVUFBQyxDQUFDLEVBQUs7QUFDZCxxQkFBSyxHQUFHLENBQUMsd0JBQXdCLEdBQUcsQ0FBQyxDQUFDLENBQUM7YUFDeEMsQ0FBQyxDQUFDO1dBQ0o7OztpQkFFRSxhQUFDLEdBQUcsRUFBRTtBQUNQLGlCQUFLLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxPQUFPLENBQUMsQ0FBQztXQUN6QiIsImZpbGUiOiJhdXRvY29tcGxldGUvc21hcnQtY2xpcXotY2FjaGUvY2FjaGUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1dGlscyB9IGZyb20gJ2NvcmUvY2xpcXonO1xuaW1wb3J0IHsgcmVhZEZpbGUsIHdyaXRlRmlsZSB9IGZyb20gJ2NvcmUvZnMnO1xuXG4vKipcbiogdGhpcyBzaW1wbGUgY2FjaGUgaXMgYSBkaWN0aW9uYXJ5IHRoYXQgYWRkaW9uYWxseSBzdG9yZXNcbiogdGltZXN0YW1wcyBmb3IgZWFjaCBlbnRyeTsgbGlmZSBpcyB0aW1lIGluIHNlY29uZHMgYmVmb3JlXG4qIGVudHJpZXMgYXJlIG1hcmtlZCBzdGFsZSAoaWYgbGlmZSBpcyBub3Qgc3BlY2lmaWVkIGVudHJpZXNcbiogYXJlIGdvb2QgZm9yZXZlcik7IGdvaW5nIHN0YWxlIGhhcyBubyBpbW1lZGlhdGUgY29uc2VxdWVuY2VzXG4qIEBuYW1lc3BhY2Ugc21hcnQtY2xpcXotY2FjaGVcbiovXG5leHBvcnQgZGVmYXVsdCBjbGFzcyB7XG4gIC8qKlxuICAqIEBjbGFzcyBDYWNoZVxuICAqIEBjb25zdHJ1Y3RvclxuICAqL1xuICBjb25zdHJ1Y3RvcihsaWZlKSB7XG4gIFx0dGhpcy5fY2FjaGUgPSB7IH07XG4gIFx0dGhpcy5fbGlmZSA9IGxpZmUgPyBsaWZlICogMTAwMCA6IGZhbHNlO1xuICB9XG5cbiAgLyoqXG4gICogc3RvcmVzIGVudHJ5IG9ubHkgaWYgaXQgaXMgbmV3ZXIgdGhhbiBjdXJyZW50IGVudHJ5LFxuICAqIGN1cnJlbnQgdGltZSBpcyB1c2VkIGlmIHRpbWUgaXMgbm90IHNwZWNpZmllZFxuICAqIEBtZXRob2Qgc3RvcmVcbiAgKiBAcGFyYW0ga2V5IHtzdHJpbmd9XG4gICogQHBhcmFtIHZhbHVlIHtzdHJpbmd9XG4gICogQHBhcmFtIHRpbWUge3RpbWVzdGFtcH1cbiAgKi9cbiAgc3RvcmUoa2V5LCB2YWx1ZSwgdGltZSkge1xuICAgIHRpbWUgPSB0aW1lIHx8IERhdGUubm93KCk7XG5cbiAgICBpZiAodGhpcy5pc05ldyhrZXksIHZhbHVlLCB0aW1lKSkge1xuICAgICAgdGhpcy5fY2FjaGVba2V5XSA9IHtcbiAgICAgICAgdGltZTogdGltZSxcbiAgICAgICAgdmFsdWU6IHZhbHVlXG4gICAgICB9O1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAqIGRlbGV0ZXMgZW50cnlcbiAgKiBAbWV0aG9kIGRlbGV0ZVxuICAqIEBwYXJhbSBrZXkge3N0cmluZ31cbiAgKi9cbiAgZGVsZXRlKGtleSkge1xuICAgIGlmICh0aGlzLmlzQ2FjaGVkKGtleSkpIHtcbiAgICAgIGRlbGV0ZSB0aGlzLl9jYWNoZVtrZXldO1xuICAgIH1cbiAgfVxuXG4gIC8qKlxuICAqIHJldHVybnMgY2FjaGVkIGVudHJ5IG9yIGZhbHNlIGlmIG5vIGVudHJ5IGV4aXN0cyBmb3Iga2V5XG4gICogQG1ldGhvZCByZXRyaWV2ZVxuICAqIEBwYXJhbSBrZXkge3N0cmluZ31cbiAgKi9cbiAgcmV0cmlldmUoa2V5KSB7XG4gICAgaWYgKCF0aGlzLmlzQ2FjaGVkKGtleSkpIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuX2NhY2hlW2tleV0udmFsdWU7XG4gIH1cblxuICAvKipcbiAgKiBAbWV0aG9kIGlzQ2FjaGVkXG4gICogQHBhcmFtIGtleSB7c3RyaW5nfVxuICAqL1xuICBpc0NhY2hlZChrZXkpIHtcbiAgICByZXR1cm4gdGhpcy5fY2FjaGUuaGFzT3duUHJvcGVydHkoa2V5KTtcbiAgfVxuXG4gIC8qKlxuICAqIEBtZXRob2QgaXNOZXdcbiAgKiBAcGFyYW0ga2V5IHtzdHJpbmd9XG4gICogQHBhcmFtIHZhbHVlIHtzdHJpbmd9XG4gICogQHBhcmFtIHRpbWUge3RpbWVzdGFtcH1cbiAgKiBAcmV0dXJucyB0cnVlIGlmIHRoZXJlIGlzIG5vIG5ld2VyIGVudHJ5IGFscmVhZHkgY2FjaGVkIGZvciBrZXlcbiAgKi9cbiAgaXNOZXcoa2V5LCB2YWx1ZSwgdGltZSkge1xuICAgIHJldHVybiAhdGhpcy5pc0NhY2hlZChrZXkpIHx8XG4gICAgICAodGltZSA+IHRoaXMuX2NhY2hlW2tleV0udGltZSk7XG4gIH1cblxuICAvKiogYW4gZW50cnkgaXMgc3RhbGUgaWYgaXQgaXMgbm90IGNhY2hlZCBvciBoYXMgZXhwaXJlZFxuICAqIChhbiBlbnRyeSBjYW4gb25seSBleHBpcmUgaWYgbGlmZSBpcyBzcGVjaWZpZWQpOyB0aGlzXG4gICogaGFzIG5vIGltbWVkaWF0ZSBjb25zZXF1ZW5jZXMsIGJ1dCBjYW4gYmUgdXNlZCBmcm9tXG4gICogb3V0c2lkZSB0byBkZWNpZGUgaWYgdGhpcyBlbnRyeSBzaG91bGQgYmUgdXBkYXRlZFxuICAqIEBtZXRob2QgaXNTdGFsZVxuICAqIEBwYXJhbSBrZXkge3N0cmluZ31cbiAgKi9cbiAgaXNTdGFsZShrZXkpIHtcbiAgICByZXR1cm4gIXRoaXMuaXNDYWNoZWQoa2V5KSB8fFxuICAgICAgKHRoaXMuX2xpZmUgJiYgKERhdGUubm93KCkgLSB0aGlzLl9jYWNoZVtrZXldLnRpbWUpID4gdGhpcy5fbGlmZSk7XG4gIH1cblxuICAvKipcbiAgKiB1cGRhdGVzIHRpbWUgd2l0aG91dCByZXBsYWNpbmcgdGhlIGVudHJ5XG4gICogQG1ldGhvZCByZWZyZXNoXG4gICogQHBhcmFtIGtleSB7c3RyaW5nfVxuICAqIEBwYXJhbSB0aW1lIHt0aW1lc3RhbXB9XG4gICovXG4gIHJlZnJlc2goa2V5LCB0aW1lKSB7XG4gICAgdGltZSA9IHRpbWUgfHwgRGF0ZS5ub3coKTtcblxuICAgIGlmICh0aGlzLmlzQ2FjaGVkKGtleSkpIHtcbiAgICAgIHRoaXMuX2NhY2hlW2tleV0udGltZSA9IHRpbWU7XG4gICAgfVxuICB9XG5cbiAgLyoqXG4gICogc2F2ZSBjYWNoZSB0byBmaWxlXG4gICogQG1ldGhvZCBzYXZlXG4gICogQHBhcmFtIGZpbGVuYW1lIHtzdHJpbmd9XG4gICovXG4gIHNhdmUoZmlsZW5hbWUpIHtcbiAgICBjb25zdCBjb250ZW50ID0gKG5ldyBUZXh0RW5jb2RlcigpKS5lbmNvZGUoSlNPTi5zdHJpbmdpZnkodGhpcy5fY2FjaGUpKTtcbiAgICB3cml0ZUZpbGUoZmlsZW5hbWUsIGNvbnRlbnQpLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5sb2coJ3NhdmU6IHNhdmVkIHRvICcgKyBmaWxlbmFtZSk7XG4gICAgfSkuY2F0Y2goKGUpID0+IHtcbiAgICAgIHRoaXMubG9nKCdzYXZlOiBmYWlsZWQgc2F2aW5nOiAnICsgZSk7XG4gICAgfSk7XG4gIH1cblxuICAvKipcbiAgKiBsb2FkIGNhY2hlIGZyb20gZmlsZVxuICAqIEBtZXRob2QgbG9hZFxuICAqIEBwYXJhbSBmaWxlbmFtZSB7c3RyaW5nfVxuICAqL1xuICBsb2FkKGZpbGVuYW1lKSB7XG4gICAgcmVhZEZpbGUoZmlsZW5hbWUpLnRoZW4oKGRhdGEpID0+IHtcbiAgICAgIHRoaXMuX2NhY2hlID0gSlNPTi5wYXJzZSgobmV3IFRleHREZWNvZGVyKCkpLmRlY29kZShkYXRhKSk7XG4gICAgICB0aGlzLmxvZygnbG9hZDogbG9hZGVkIGZyb206ICcgKyBmaWxlbmFtZSk7XG4gICAgfSkuY2F0Y2goKGUpID0+IHtcbiAgICAgIHRoaXMubG9nKCdsb2FkOiBmYWlsZWQgbG9hZGluZzogJyArIGUpO1xuICAgIH0pO1xuICB9XG5cbiAgbG9nKG1zZykge1xuICAgIHV0aWxzLmxvZyhtc2csICdDYWNoZScpO1xuICB9XG59XG4iXX0=