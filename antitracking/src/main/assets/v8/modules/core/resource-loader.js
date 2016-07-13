System.register('core/resource-loader', ['core/fs', 'core/cliqz'], function (_export) {
  'use strict';

  var readFile, writeFile, mkdir, utils, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _toArray(arr) { return Array.isArray(arr) ? arr : Array.from(arr); }

  function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function get(url) {
    return new Promise(function (resolve, reject) {
      utils.httpGet(url, function (res) {
        resolve(res.response);
      }, reject);
    });
  }

  function makeDirRecursive(path) {
    var from = arguments.length <= 1 || arguments[1] === undefined ? [] : arguments[1];

    var _path = _toArray(path);

    var first = _path[0];

    var rest = _path.slice(1);

    if (!first) {
      return Promise.resolve();
    }

    return mkdir(from.concat(first)).then(function () {
      return makeDirRecursive(rest, from.concat(first));
    });
  }
  return {
    setters: [function (_coreFs) {
      readFile = _coreFs.readFile;
      writeFile = _coreFs.writeFile;
      mkdir = _coreFs.mkdir;
    }, function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }],
    execute: function () {
      _default = (function () {
        function _default(resourceName) {
          var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

          _classCallCheck(this, _default);

          if (typeof resourceName === 'string') {
            resourceName = [resourceName];
          }
          this.resourceName = resourceName;
          this.remoteURL = options.remoteURL;
          this.localURL = utils.System.baseURL + this.resourceName.join('/');
          this.dataType = options.dataType || 'json';
          this.filePath = ['cliqz'].concat(_toConsumableArray(this.resourceName));
          this.cron = options.cron || 60 * 60 * 1000; // default one hour

          this.callbacks = [];
          this.updateInterval = utils.setInterval(this.updateFromRemote.bind(this), 5 * 60 * 1000); // check every 5 min
        }

        _createClass(_default, [{
          key: 'load',
          value: function load() {
            var _this = this;

            return readFile(this.filePath).then(function (data) {
              return new TextDecoder().decode(data);
            })['catch'](function (e) {
              // no profile data so fetch from default location
              return get(_this.localURL).then(function (data) {
                return _this.persist(data);
              });
            }).then(function (data) {
              return JSON.parse(data);
            });
          }
        }, {
          key: 'updateFromRemote',
          value: function updateFromRemote() {
            var _this2 = this;

            var pref = 'resource-loader.lastUpdates.' + this.resourceName.join('/');
            var lastUpdate = Number(utils.getPref(pref, 0)),
                currentTime = Date.now();

            if (currentTime < this.cron + lastUpdate) {
              return;
            }

            get(this.remoteURL).then(function (data) {
              return _this2.persist(data);
            }).then(function (data) {
              data = JSON.parse(data);
              _this2.callbacks.map(function (cb) {
                return cb(data);
              });
              utils.setPref(pref, String(currentTime));
            });
          }
        }, {
          key: 'onUpdate',
          value: function onUpdate(callback) {
            this.callbacks.push(callback);
          }
        }, {
          key: 'stop',
          value: function stop() {
            utils.clearInterval(this.updateInterval);
          }
        }, {
          key: 'persist',
          value: function persist(data) {
            var _this3 = this;

            var dirPath = this.filePath.slice(0, -1);
            return makeDirRecursive(dirPath).then(function () {
              return writeFile(_this3.filePath, new TextEncoder().encode(data));
            }).then(function () {
              return data;
            });
          }
        }]);

        return _default;
      })();

      _export('default', _default);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvcmVzb3VyY2UtbG9hZGVyLmVzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFzRUEsV0FBUyxHQUFHLENBQUMsR0FBRyxFQUFFO0FBQ2hCLFdBQU8sSUFBSSxPQUFPLENBQUUsVUFBQyxPQUFPLEVBQUUsTUFBTSxFQUFLO0FBQ3ZDLFdBQUssQ0FBQyxPQUFPLENBQUUsR0FBRyxFQUFHLFVBQUEsR0FBRyxFQUFJO0FBQzFCLGVBQU8sQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUM7T0FDdkIsRUFBRSxNQUFNLENBQUUsQ0FBQztLQUNiLENBQUMsQ0FBQztHQUNKOztBQUVELFdBQVMsZ0JBQWdCLENBQUMsSUFBSSxFQUFhO1FBQVgsSUFBSSx5REFBRyxFQUFFOzt5QkFDZCxJQUFJOztRQUF2QixLQUFLOztRQUFLLElBQUk7O0FBRXBCLFFBQUssQ0FBQyxLQUFLLEVBQUc7QUFDWixhQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztLQUMxQjs7QUFFRCxXQUFPLEtBQUssQ0FBRSxJQUFJLENBQUMsTUFBTSxDQUFFLEtBQUssQ0FBRSxDQUFFLENBQUMsSUFBSSxDQUFFLFlBQU07QUFDL0MsYUFBTyxnQkFBZ0IsQ0FBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBRSxLQUFLLENBQUUsQ0FBRSxDQUFDO0tBQ3ZELENBQUMsQ0FBQztHQUNKOzs7eUJBeEZRLFFBQVE7MEJBQUUsU0FBUztzQkFBRSxLQUFLOzt5QkFDMUIsS0FBSzs7OztBQUlELDBCQUFFLFlBQVksRUFBaUI7Y0FBZixPQUFPLHlEQUFHLEVBQUU7Ozs7QUFDckMsY0FBSyxPQUFPLFlBQVksS0FBSyxRQUFRLEVBQUc7QUFDdEMsd0JBQVksR0FBSSxDQUFFLFlBQVksQ0FBRSxDQUFDO1dBQ2xDO0FBQ0QsY0FBSSxDQUFDLFlBQVksR0FBRyxZQUFZLENBQUM7QUFDakMsY0FBSSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUyxDQUFDO0FBQ25DLGNB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QkFBZ0IsQ0FBRSxPQUFPLENBQUUsQ0FBQyxJQUFJLENBQUUsWUFBTTtBQUM3QyxxQkFBTyxTQUFTLENBQUUsT0FBSyxRQUFRLEVBQUcsQUFBRSxJQUFJLFdBQVcsRUFBRSxDQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBRSxDQUFDO2FBQ3hFLENBQUMsQ0FBQyxJQUFJLENBQUUsWUFBTTtBQUNiLHFCQUFPLElBQUksQ0FBQzthQUNiLENBQUMsQ0FBQztXQUNKIiwiZmlsZSI6ImNvcmUvcmVzb3VyY2UtbG9hZGVyLmVzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgcmVhZEZpbGUsIHdyaXRlRmlsZSwgbWtkaXIgfSBmcm9tICdjb3JlL2ZzJztcbmltcG9ydCB7IHV0aWxzIH0gZnJvbSAnY29yZS9jbGlxeic7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHtcblxuICBjb25zdHJ1Y3RvciggcmVzb3VyY2VOYW1lLCBvcHRpb25zID0ge30gKSB7XG4gICAgaWYgKCB0eXBlb2YgcmVzb3VyY2VOYW1lID09PSAnc3RyaW5nJyApIHtcbiAgICAgIHJlc291cmNlTmFtZSAgPSBbIHJlc291cmNlTmFtZSBdO1xuICAgIH1cbiAgICB0aGlzLnJlc291cmNlTmFtZSA9IHJlc291cmNlTmFtZTtcbiAgICB0aGlzLnJlbW90ZVVSTCA9IG9wdGlvbnMucmVtb3RlVVJMO1xuICAgIHRoaXMubG9jYWxVUkwgPSB1dGlscy5TeXN0ZW0uYmFzZVVSTCArIHRoaXMucmVzb3VyY2VOYW1lLmpvaW4oJy8nKTtcbiAgICB0aGlzLmRhdGFUeXBlID0gb3B0aW9ucy5kYXRhVHlwZSB8fCAnanNvbic7XG4gICAgdGhpcy5maWxlUGF0aCA9IFsgJ2NsaXF6JywgLi4udGhpcy5yZXNvdXJjZU5hbWUgXTtcbiAgICB0aGlzLmNyb24gPSBvcHRpb25zLmNyb24gfHwgNjAgKiA2MCAqIDEwMDA7IC8vIGRlZmF1bHQgb25lIGhvdXJcblxuICAgIHRoaXMuY2FsbGJhY2tzID0gW107XG4gICAgdGhpcy51cGRhdGVJbnRlcnZhbCA9IHV0aWxzLnNldEludGVydmFsKFxuICAgICAgICB0aGlzLnVwZGF0ZUZyb21SZW1vdGUuYmluZCh0aGlzKSwgNSAqIDYwICogMTAwMCApOyAvLyBjaGVjayBldmVyeSA1IG1pblxuICB9XG5cbiAgbG9hZCgpIHtcbiAgICByZXR1cm4gcmVhZEZpbGUoIHRoaXMuZmlsZVBhdGggKS50aGVuKCBkYXRhID0+IHtcbiAgICAgIHJldHVybiAoIG5ldyBUZXh0RGVjb2RlcigpICkuZGVjb2RlKCBkYXRhICk7XG4gICAgfSkuY2F0Y2goIGUgPT4ge1xuICAgICAgLy8gbm8gcHJvZmlsZSBkYXRhIHNvIGZldGNoIGZyb20gZGVmYXVsdCBsb2NhdGlvblxuICAgICAgcmV0dXJuIGdldCggdGhpcy5sb2NhbFVSTCApLnRoZW4oIGRhdGEgPT4ge1xuICAgICAgICByZXR1cm4gdGhpcy5wZXJzaXN0KGRhdGEpO1xuICAgICAgfSk7XG4gICAgfSkudGhlbiggZGF0YSA9PiB7XG4gICAgICByZXR1cm4gSlNPTi5wYXJzZShkYXRhKTtcbiAgICB9KTtcbiAgfVxuXG4gIHVwZGF0ZUZyb21SZW1vdGUoKSB7XG4gICAgY29uc3QgcHJlZiA9IGByZXNvdXJjZS1sb2FkZXIubGFzdFVwZGF0ZXMuJHt0aGlzLnJlc291cmNlTmFtZS5qb2luKCcvJyl9YDtcbiAgICBsZXQgbGFzdFVwZGF0ZSA9IE51bWJlciggdXRpbHMuZ2V0UHJlZiggcHJlZiwgMCApICksXG4gICAgICAgIGN1cnJlbnRUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgIGlmICggY3VycmVudFRpbWUgPCB0aGlzLmNyb24gKyBsYXN0VXBkYXRlICkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIGdldCggdGhpcy5yZW1vdGVVUkwgKS50aGVuKCBkYXRhID0+IHtcbiAgICAgIHJldHVybiB0aGlzLnBlcnNpc3QoZGF0YSk7XG4gICAgfSkudGhlbiggZGF0YSA9PiB7XG4gICAgICBkYXRhID0gSlNPTi5wYXJzZShkYXRhKTtcbiAgICAgIHRoaXMuY2FsbGJhY2tzLm1hcCggY2IgPT4gY2IoZGF0YSkgKTtcbiAgICAgIHV0aWxzLnNldFByZWYoIHByZWYsIFN0cmluZyggY3VycmVudFRpbWUgKSApO1xuICAgIH0pO1xuICB9XG5cbiAgb25VcGRhdGUoIGNhbGxiYWNrICkge1xuICAgIHRoaXMuY2FsbGJhY2tzLnB1c2goY2FsbGJhY2spO1xuICB9XG5cbiAgc3RvcCgpIHtcbiAgICB1dGlscy5jbGVhckludGVydmFsKHRoaXMudXBkYXRlSW50ZXJ2YWwpO1xuICB9XG5cbiAgcGVyc2lzdCggZGF0YSApIHtcbiAgICBsZXQgZGlyUGF0aCA9IHRoaXMuZmlsZVBhdGguc2xpY2UoIDAsIC0xICk7XG4gICAgcmV0dXJuIG1ha2VEaXJSZWN1cnNpdmUoIGRpclBhdGggKS50aGVuKCAoKSA9PiB7XG4gICAgICByZXR1cm4gd3JpdGVGaWxlKCB0aGlzLmZpbGVQYXRoICwgKCBuZXcgVGV4dEVuY29kZXIoKSApLmVuY29kZShkYXRhKSApO1xuICAgIH0pLnRoZW4oICgpID0+IHtcbiAgICAgIHJldHVybiBkYXRhO1xuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGdldCh1cmwpIHtcbiAgcmV0dXJuIG5ldyBQcm9taXNlKCAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgdXRpbHMuaHR0cEdldCggdXJsICwgcmVzID0+IHtcbiAgICAgIHJlc29sdmUocmVzLnJlc3BvbnNlKTtcbiAgICB9LCByZWplY3QgKTtcbiAgfSk7XG59XG5cbmZ1bmN0aW9uIG1ha2VEaXJSZWN1cnNpdmUocGF0aCwgZnJvbSA9IFtdKSB7XG4gIGxldCBbIGZpcnN0LCAuLi5yZXN0IF0gPSBwYXRoO1xuXG4gIGlmICggIWZpcnN0ICkge1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgfVxuXG4gIHJldHVybiBta2RpciggZnJvbS5jb25jYXQoIGZpcnN0ICkgKS50aGVuKCAoKSA9PiB7XG4gICAgcmV0dXJuIG1ha2VEaXJSZWN1cnNpdmUoIHJlc3QsIGZyb20uY29uY2F0KCBmaXJzdCApICk7XG4gIH0pO1xufVxuIl19