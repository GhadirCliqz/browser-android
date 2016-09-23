System.register('antitracking/bloom-filter', ['antitracking/md5', 'antitracking/time', 'antitracking/pacemaker', 'antitracking/qs-whitelist-base', 'core/cliqz', 'core/resource-loader'], function (_export) {
  'use strict';

  var md5, datetime, pacemaker, QSWhitelistBase, utils, Promise, Resource, BLOOMFILTER_BASE_URL, BLOOMFILTER_CONFIG, UPDATE_EXPIRY_HOURS, AttrackBloomFilter;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var _get = function get(_x3, _x4, _x5) { var _again = true; _function: while (_again) { var object = _x3, property = _x4, receiver = _x5; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x3 = parent; _x4 = property; _x5 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

  _export('BloomFilter', BloomFilter);

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  function BloomFilter(a, k) {
    // a the array, k the number of hash function
    var m = a.length * 32,
        // 32 bits for each element in a
    n = a.length,
        i = -1;
    this.m = m = n * 32;
    this.k = k;
    // choose data type
    var kbytes = 1 << Math.ceil(Math.log(Math.ceil(Math.log(m) / Math.LN2 / 8)) / Math.LN2),
        array = kbytes === 1 ? Uint8Array : kbytes === 2 ? Uint16Array : Uint32Array,
        kbuffer = new ArrayBuffer(kbytes * k),
        buckets = this.buckets = new Int32Array(n);
    while (++i < n) {
      buckets[i] = a[i]; // put the elements into their bucket
    }
    this._locations = new array(kbuffer); // stores location for each hash function
  }

  return {
    setters: [function (_antitrackingMd5) {
      md5 = _antitrackingMd5['default'];
    }, function (_antitrackingTime) {
      datetime = _antitrackingTime;
    }, function (_antitrackingPacemaker) {
      pacemaker = _antitrackingPacemaker['default'];
    }, function (_antitrackingQsWhitelistBase) {
      QSWhitelistBase = _antitrackingQsWhitelistBase['default'];
    }, function (_coreCliqz) {
      utils = _coreCliqz.utils;
      Promise = _coreCliqz.Promise;
    }, function (_coreResourceLoader) {
      Resource = _coreResourceLoader.Resource;
    }],
    execute: function () {

      BloomFilter.prototype.locations = function (a, b) {
        // we use 2 hash values to generate k hash values
        var k = this.k,
            m = this.m,
            r = this._locations;
        a = parseInt(a, 16);
        b = parseInt(b, 16);
        var x = a % m;

        for (var i = 0; i < k; ++i) {
          r[i] = x < 0 ? x + m : x;
          x = (x + b) % m;
        }
        return r;
      };

      BloomFilter.prototype.test = function (a, b) {
        // since MD5 will be calculated before hand,
        // we allow using hash value as input to

        var l = this.locations(a, b),
            k = this.k,
            buckets = this.buckets;
        for (var i = 0; i < k; ++i) {
          var bk = l[i];
          if ((buckets[Math.floor(bk / 32)] & 1 << bk % 32) === 0) {
            return false;
          }
        }
        return true;
      };

      BloomFilter.prototype.testSingle = function (x) {
        var md5Hex = md5(x);
        var a = md5Hex.substring(0, 8),
            b = md5Hex.substring(8, 16);
        return this.test(a, b);
      };

      BloomFilter.prototype.add = function (a, b) {
        // Maybe used to add local safeKey to bloom filter
        var l = this.locations(a, b),
            k = this.k,
            buckets = this.buckets;
        for (var i = 0; i < k; ++i) {
          buckets[Math.floor(l[i] / 32)] |= 1 << l[i] % 32;
        }
      };

      BloomFilter.prototype.addSingle = function (x) {
        var md5Hex = md5(x);
        var a = md5Hex.substring(0, 8),
            b = md5Hex.substring(8, 16);
        return this.add(a, b);
      };

      BloomFilter.prototype.update = function (a) {
        // update the bloom filter, used in minor revison for every 10 min
        var m = a.length * 32,
            // 32 bit for each element
        n = a.length,
            i = -1;
        m = n * 32;
        if (this.m !== m) {
          throw 'Bloom filter can only be updated with same length';
        }
        while (++i < n) {
          this.buckets[i] |= a[i];
        }
      };

      BLOOMFILTER_BASE_URL = 'https://cdn.cliqz.com/anti-tracking/bloom_filter/';
      BLOOMFILTER_CONFIG = 'https://cdn.cliqz.com/anti-tracking/bloom_filter/config';
      UPDATE_EXPIRY_HOURS = 48;

      AttrackBloomFilter = (function (_QSWhitelistBase) {
        _inherits(AttrackBloomFilter, _QSWhitelistBase);

        function AttrackBloomFilter() {
          var configURL = arguments.length <= 0 || arguments[0] === undefined ? BLOOMFILTER_CONFIG : arguments[0];
          var baseURL = arguments.length <= 1 || arguments[1] === undefined ? BLOOMFILTER_BASE_URL : arguments[1];

          _classCallCheck(this, AttrackBloomFilter);

          _get(Object.getPrototypeOf(AttrackBloomFilter.prototype), 'constructor', this).call(this);
          this.lastUpdate = '0';
          this.bloomFilter = null;
          this.version = null;
          this.configURL = configURL;
          this.baseURL = baseURL;
          this._config = new Resource(['antitracking', 'bloom_config.json'], {
            remoteURL: configURL
          });
        }

        _createClass(AttrackBloomFilter, [{
          key: 'init',
          value: function init() {
            var _this = this;

            _get(Object.getPrototypeOf(AttrackBloomFilter.prototype), 'init', this).call(this);
            // try remote update before local
            this._config.updateFromRemote()['catch'](function () {
              return _this._config.load();
            }).then(this.checkUpdate.bind(this)).then(function () {
              _this.lastUpdate = datetime.getTime();
            });
            // check every 10s
            pacemaker.register(this.update.bind(this), 10 * 60 * 1000);
          }
        }, {
          key: 'destroy',
          value: function destroy() {
            _get(Object.getPrototypeOf(AttrackBloomFilter.prototype), 'destroy', this).call(this);
          }
        }, {
          key: 'isUpToDate',
          value: function isUpToDate() {
            var delay = UPDATE_EXPIRY_HOURS,
                hour = datetime.newUTCDate();
            hour.setHours(hour.getHours() - delay);
            var hourCutoff = datetime.hourString(hour);
            return this.lastUpdate > hourCutoff;
          }
        }, {
          key: 'isReady',
          value: function isReady() {
            return this.bloomFilter !== null;
          }
        }, {
          key: 'isTrackerDomain',
          value: function isTrackerDomain(domain) {
            return this.bloomFilter.testSingle('d' + domain);
          }
        }, {
          key: 'isSafeKey',
          value: function isSafeKey(domain, key) {
            return !this.isUnsafeKey(domain, key) && (this.bloomFilter.testSingle('k' + domain + key) || _get(Object.getPrototypeOf(AttrackBloomFilter.prototype), 'isSafeKey', this).call(this, domain, key));
          }
        }, {
          key: 'isSafeToken',
          value: function isSafeToken(domain, token) {
            return this.bloomFilter.testSingle('t' + domain + token);
          }
        }, {
          key: 'isUnsafeKey',
          value: function isUnsafeKey(domain, token) {
            return this.bloomFilter.testSingle('u' + domain + token);
          }
        }, {
          key: 'addDomain',
          value: function addDomain(domain) {
            this.bloomFilter.addSingle('d' + domain);
          }
        }, {
          key: 'addSafeKey',
          value: function addSafeKey(domain, key, valueCount) {
            if (this.isUnsafeKey(domain, key)) {
              return;
            }
            this.bloomFilter.addSingle('k' + domain + key);
            _get(Object.getPrototypeOf(AttrackBloomFilter.prototype), 'addSafeKey', this).call(this, domain, key, valueCount);
          }
        }, {
          key: 'addUnsafeKey',
          value: function addUnsafeKey(domain, token) {
            this.bloomFilter.addSingle('u' + domain + token);
          }
        }, {
          key: 'addSafeToken',
          value: function addSafeToken(domain, token) {
            utils.log([domain, token]);
            if (token === '') {
              utils.log('add domain ' + domain);
              this.addDomain(domain);
            } else {
              this.bloomFilter.addSingle('t' + domain + token);
            }
          }
        }, {
          key: 'getVersion',
          value: function getVersion() {
            return {
              bloomFilterversion: this.bloomFilter ? this.bloomFilter.version : null
            };
          }
        }, {
          key: 'update',
          value: function update() {
            var _this2 = this;

            this._config.updateFromRemote().then(this.checkUpdate.bind(this)).then(function () {
              _this2.lastUpdate = datetime.getTime();
            });
          }
        }, {
          key: 'remoteUpdate',
          value: function remoteUpdate(major, minor) {
            var _this3 = this;

            var url = this.baseURL + major + '/' + minor + '.gz',
                self = this;

            var updateFilter = function updateFilter(bf) {
              if (minor !== 0) {
                self.bloomFilter.update(bf.bkt);
              } else {
                self.bloomFilter = new BloomFilter(bf.bkt, bf.k);
              }
              self.version.major = major;
              self.version.minor = minor;
              return Promise.resolve();
            };

            // load the filter, if possible from the CDN, otherwise grab a cached local version
            if (major === 'local') {
              return this.loadFromLocal().then(updateFilter);
            } else if (minor === 0) {
              var bloomFile = new Resource(['antitracking', 'bloom_filter.json'], {
                remoteURL: url
              });
              return bloomFile.updateFromRemote()['catch'](function () {
                return _this3.loadFromLocal();
              }).then(updateFilter);
            } else {
              return utils.promiseHttpHandler('GET', url, undefined, 10000).then(function (req) {
                return JSON.parse(req.response);
              })['catch'](function () {
                return _this3.loadFromLocal();
              }).then(updateFilter);
            }
          }
        }, {
          key: 'loadFromLocal',
          value: function loadFromLocal() {
            var bloomFile = new Resource(['antitracking', 'bloom_filter.json']);
            return bloomFile.load();
          }
        }, {
          key: 'checkUpdate',
          value: function checkUpdate(version) {
            var self = this;
            if (self.version === null || self.bloomFilter === null) {
              // load the first time
              self.version = { 'major': null, 'minor': null };
              return self.remoteUpdate(version.major, 0); // load the major version and update later
            }
            if (self.version.major === version.major && self.version.minor === version.minor) {
              // already at the latest version
              return Promise.resolve();
            }
            if (self.version.major !== version.major) {
              return self.remoteUpdate(version.major, 0);
            } else {
              return self.remoteUpdate(version.major, version.minor);
            }
          }
        }]);

        return AttrackBloomFilter;
      })(QSWhitelistBase);

      _export('AttrackBloomFilter', AttrackBloomFilter);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy9ibG9vbS1maWx0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OzJFQThGSSxvQkFBb0IsRUFDcEIsa0JBQWtCLEVBRWhCLG1CQUFtQixFQUVaLGtCQUFrQjs7Ozs7Ozs7Ozs7O0FBNUZ4QixXQUFTLFdBQVcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFOztBQUNoQyxRQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLEVBQUU7O0FBQ2pCLEtBQUMsR0FBRyxDQUFDLENBQUMsTUFBTTtRQUNaLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNYLFFBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLENBQUM7QUFDcEIsUUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUM7O0FBRVgsUUFBSSxNQUFNLEdBQUcsQ0FBQyxJQUFJLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUM7UUFDbkYsS0FBSyxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsVUFBVSxHQUFHLE1BQU0sS0FBSyxDQUFDLEdBQUcsV0FBVyxHQUFHLFdBQVc7UUFDNUUsT0FBTyxHQUFHLElBQUksV0FBVyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUM7UUFDckMsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxVQUFVLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDL0MsV0FBTyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUU7QUFDZCxhQUFPLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ25CO0FBQ0QsUUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLEtBQUssQ0FBQyxPQUFPLENBQUMsQ0FBQztHQUN0Qzs7Ozs7Ozs7Ozs7O3lCQWxCUSxLQUFLOzJCQUFFLE9BQU87O3FDQUNkLFFBQVE7Ozs7QUFtQmpCLGlCQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxVQUFTLENBQUMsRUFBRSxDQUFDLEVBQUU7O0FBQy9DLFlBQUksQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQ1YsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQ1YsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7QUFDeEIsU0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDcEIsU0FBQyxHQUFHLFFBQVEsQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7QUFDcEIsWUFBSSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQzs7QUFFZCxhQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxFQUFFO0FBQzFCLFdBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxHQUFJLENBQUMsR0FBRyxDQUFDLEdBQUksQ0FBQyxDQUFDO0FBQzNCLFdBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLENBQUEsR0FBSSxDQUFDLENBQUM7U0FDakI7QUFDRCxlQUFPLENBQUMsQ0FBQztPQUNWLENBQUM7O0FBRUYsaUJBQVcsQ0FBQyxTQUFTLENBQUMsSUFBSSxHQUFHLFVBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRTs7OztBQUkxQyxZQUFJLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDeEIsQ0FBQyxHQUFHLElBQUksQ0FBQyxDQUFDO1lBQ1YsT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUM7QUFDM0IsYUFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRTtBQUMxQixjQUFJLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDZCxjQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUksQ0FBQyxJQUFLLEVBQUUsR0FBRyxFQUFFLEFBQUMsQ0FBQyxLQUFNLENBQUMsRUFBRTtBQUMzRCxtQkFBTyxLQUFLLENBQUM7V0FDZDtTQUNGO0FBQ0QsZUFBTyxJQUFJLENBQUM7T0FDYixDQUFDOztBQUVGLGlCQUFXLENBQUMsU0FBUyxDQUFDLFVBQVUsR0FBRyxVQUFTLENBQUMsRUFBRTtBQUM3QyxZQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEIsWUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFCLENBQUMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNoQyxlQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO09BQ3hCLENBQUM7O0FBRUYsaUJBQVcsQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLFVBQVMsQ0FBQyxFQUFFLENBQUMsRUFBRTs7QUFFekMsWUFBSSxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQ3hCLENBQUMsR0FBRyxJQUFJLENBQUMsQ0FBQztZQUNWLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDO0FBQzNCLGFBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxDQUFDLEVBQUU7QUFDMUIsaUJBQU8sQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEdBQUcsRUFBRSxBQUFDLENBQUM7U0FDcEQ7T0FDRixDQUFDOztBQUVGLGlCQUFXLENBQUMsU0FBUyxDQUFDLFNBQVMsR0FBRyxVQUFTLENBQUMsRUFBRTtBQUM1QyxZQUFJLE1BQU0sR0FBRyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDcEIsWUFBSSxDQUFDLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzFCLENBQUMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztBQUNoQyxlQUFPLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDO09BQ3ZCLENBQUM7O0FBRUYsaUJBQVcsQ0FBQyxTQUFTLENBQUMsTUFBTSxHQUFHLFVBQVMsQ0FBQyxFQUFFOztBQUV6QyxZQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsTUFBTSxHQUFHLEVBQUU7O0FBQ2pCLFNBQUMsR0FBRyxDQUFDLENBQUMsTUFBTTtZQUNaLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUNYLFNBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQ1gsWUFBSSxJQUFJLENBQUMsQ0FBQyxLQUFLLENBQUMsRUFBRTtBQUNoQixnQkFBTSxtREFBbUQsQ0FBQztTQUMzRDtBQUNELGVBQU8sRUFBRSxDQUFDLEdBQUcsQ0FBQyxFQUFFO0FBQ2QsY0FBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7U0FDekI7T0FDRixDQUFDOztBQUdFLDBCQUFvQixHQUFHLG1EQUFtRDtBQUMxRSx3QkFBa0IsR0FBRyx5REFBeUQ7QUFFNUUseUJBQW1CLEdBQUcsRUFBRTs7QUFFakIsd0JBQWtCO2tCQUFsQixrQkFBa0I7O0FBRWxCLGlCQUZBLGtCQUFrQixHQUUrQztjQUFoRSxTQUFTLHlEQUFHLGtCQUFrQjtjQUFFLE9BQU8seURBQUcsb0JBQW9COztnQ0FGL0Qsa0JBQWtCOztBQUczQixxQ0FIUyxrQkFBa0IsNkNBR25CO0FBQ1IsY0FBSSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7QUFDdEIsY0FBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7QUFDeEIsY0FBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUM7QUFDcEIsY0FBSSxDQUFDLFNBQVMsR0FBRyxTQUFTLENBQUM7QUFDM0IsY0FBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFDdkIsY0FBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLFFBQVEsQ0FBQyxDQUFDLGNBQWMsRUFBRSxtQkFBbUIsQ0FBQyxFQUFFO0FBQ2pFLHFCQUFTLEVBQUUsU0FBUztXQUNyQixDQUFDLENBQUM7U0FDSjs7cUJBWlUsa0JBQWtCOztpQkFjekIsZ0JBQUc7OztBQUNMLHVDQWZTLGtCQUFrQixzQ0FlZDs7QUFFYixnQkFBSSxDQUFDLE9BQU8sQ0FBQyxnQkFBZ0IsRUFBRSxTQUFNLENBQUMsWUFBTTtBQUMxQyxxQkFBTyxNQUFLLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQzthQUM1QixDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLFlBQU07QUFDOUMsb0JBQUssVUFBVSxHQUFHLFFBQVEsQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUN0QyxDQUFDLENBQUM7O0FBRUgscUJBQVMsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsRUFBRSxHQUFHLEVBQUUsR0FBRyxJQUFJLENBQUMsQ0FBQztXQUM1RDs7O2lCQUVNLG1CQUFHO0FBQ1IsdUNBM0JTLGtCQUFrQix5Q0EyQlg7V0FDakI7OztpQkFFUyxzQkFBRztBQUNYLGdCQUFJLEtBQUssR0FBRyxtQkFBbUI7Z0JBQzNCLElBQUksR0FBRyxRQUFRLENBQUMsVUFBVSxFQUFFLENBQUM7QUFDakMsZ0JBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLEtBQUssQ0FBQyxDQUFDO0FBQ3ZDLGdCQUFJLFVBQVUsR0FBRyxRQUFRLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQzNDLG1CQUFPLElBQUksQ0FBQyxVQUFVLEdBQUcsVUFBVSxDQUFDO1dBQ3JDOzs7aUJBRU0sbUJBQUc7QUFDUixtQkFBTyxJQUFJLENBQUMsV0FBVyxLQUFLLElBQUksQ0FBQztXQUNsQzs7O2lCQUVjLHlCQUFDLE1BQU0sRUFBRTtBQUN0QixtQkFBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUM7V0FDbEQ7OztpQkFFUSxtQkFBQyxNQUFNLEVBQUUsR0FBRyxFQUFFO0FBQ3JCLG1CQUFPLEFBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsS0FBTSxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEdBQUcsTUFBTSxHQUFHLEdBQUcsQ0FBQywrQkEvQ2xGLGtCQUFrQiwyQ0ErQ29GLE1BQU0sRUFBRSxHQUFHLEVBQUMsQUFBQyxDQUFDO1dBQzlIOzs7aUJBRVUscUJBQUMsTUFBTSxFQUFFLEtBQUssRUFBRTtBQUN6QixtQkFBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEdBQUcsTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFDO1dBQzFEOzs7aUJBRVUscUJBQUMsTUFBTSxFQUFFLEtBQUssRUFBRTtBQUN6QixtQkFBTyxJQUFJLENBQUMsV0FBVyxDQUFDLFVBQVUsQ0FBQyxHQUFHLEdBQUcsTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFDO1dBQzFEOzs7aUJBRVEsbUJBQUMsTUFBTSxFQUFFO0FBQ2hCLGdCQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLENBQUM7V0FDMUM7OztpQkFFUyxvQkFBQyxNQUFNLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRTtBQUNsQyxnQkFBSSxJQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sRUFBRSxHQUFHLENBQUMsRUFBRTtBQUNqQyxxQkFBTzthQUNSO0FBQ0QsZ0JBQUksQ0FBQyxXQUFXLENBQUMsU0FBUyxDQUFDLEdBQUcsR0FBRyxNQUFNLEdBQUcsR0FBRyxDQUFDLENBQUM7QUFDL0MsdUNBbkVTLGtCQUFrQiw0Q0FtRVYsTUFBTSxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUU7V0FDM0M7OztpQkFFVyxzQkFBQyxNQUFNLEVBQUUsS0FBSyxFQUFFO0FBQzFCLGdCQUFJLENBQUMsV0FBVyxDQUFDLFNBQVMsQ0FBQyxHQUFHLEdBQUcsTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFDO1dBQ2xEOzs7aUJBRVcsc0JBQUMsTUFBTSxFQUFFLEtBQUssRUFBRTtBQUMxQixpQkFBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQzNCLGdCQUFJLEtBQUssS0FBSyxFQUFFLEVBQUU7QUFDaEIsbUJBQUssQ0FBQyxHQUFHLENBQUMsYUFBYSxHQUFHLE1BQU0sQ0FBQyxDQUFDO0FBQ2xDLGtCQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDO2FBQ3hCLE1BQU07QUFDTCxrQkFBSSxDQUFDLFdBQVcsQ0FBQyxTQUFTLENBQUMsR0FBRyxHQUFHLE1BQU0sR0FBRyxLQUFLLENBQUMsQ0FBQzthQUNsRDtXQUNGOzs7aUJBRVMsc0JBQUc7QUFDWCxtQkFBTztBQUNMLGdDQUFrQixFQUFFLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQyxPQUFPLEdBQUcsSUFBSTthQUN2RSxDQUFDO1dBQ0g7OztpQkFFSyxrQkFBRzs7O0FBQ1AsZ0JBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLEVBQUUsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsWUFBTTtBQUMzRSxxQkFBSyxVQUFVLEdBQUcsUUFBUSxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ3RDLENBQUMsQ0FBQztXQUNKOzs7aUJBRVcsc0JBQUMsS0FBSyxFQUFFLEtBQUssRUFBRTs7O0FBQ3pCLGdCQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsT0FBTyxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsS0FBSyxHQUFHLEtBQUs7Z0JBQ2hELElBQUksR0FBRyxJQUFJLENBQUM7O0FBRWhCLGdCQUFJLFlBQVksR0FBRyxTQUFmLFlBQVksQ0FBWSxFQUFFLEVBQUU7QUFDOUIsa0JBQUksS0FBSyxLQUFLLENBQUMsRUFBRTtBQUNiLG9CQUFJLENBQUMsV0FBVyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsR0FBRyxDQUFDLENBQUM7ZUFDbkMsTUFBTTtBQUNILG9CQUFJLENBQUMsV0FBVyxHQUFHLElBQUksV0FBVyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEVBQUUsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO2VBQ3BEO0FBQ0Qsa0JBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUMzQixrQkFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEdBQUcsS0FBSyxDQUFDO0FBQzNCLHFCQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQzthQUMxQixDQUFDOzs7QUFHRixnQkFBSSxLQUFLLEtBQUssT0FBTyxFQUFFO0FBQ3JCLHFCQUFPLElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLENBQUM7YUFDaEQsTUFBTSxJQUFJLEtBQUssS0FBSyxDQUFDLEVBQUU7QUFDdEIsa0JBQU0sU0FBUyxHQUFHLElBQUksUUFBUSxDQUFDLENBQUMsY0FBYyxFQUFFLG1CQUFtQixDQUFDLEVBQUU7QUFDcEUseUJBQVMsRUFBRSxHQUFHO2VBQ2YsQ0FBQyxDQUFDO0FBQ0gscUJBQU8sU0FBUyxDQUFDLGdCQUFnQixFQUFFLFNBQzNCLENBQUM7dUJBQU0sT0FBSyxhQUFhLEVBQUU7ZUFBQSxDQUFDLENBQ2pDLElBQUksQ0FBQyxZQUFZLENBQUMsQ0FBQzthQUN2QixNQUFNO0FBQ0wscUJBQU8sS0FBSyxDQUFDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsU0FBUyxFQUFFLEtBQUssQ0FBQyxDQUMxRCxJQUFJLENBQUMsVUFBQyxHQUFHO3VCQUFLLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQztlQUFBLENBQUMsU0FDbEMsQ0FBQzt1QkFBTSxPQUFLLGFBQWEsRUFBRTtlQUFBLENBQUMsQ0FDakMsSUFBSSxDQUFDLFlBQVksQ0FBQyxDQUFDO2FBQ3ZCO1dBQ0Y7OztpQkFFWSx5QkFBRztBQUNkLGdCQUFNLFNBQVMsR0FBRyxJQUFJLFFBQVEsQ0FBQyxDQUFDLGNBQWMsRUFBRSxtQkFBbUIsQ0FBQyxDQUFDLENBQUM7QUFDdEUsbUJBQU8sU0FBUyxDQUFDLElBQUksRUFBRSxDQUFBO1dBQ3hCOzs7aUJBRVUscUJBQUMsT0FBTyxFQUFFO0FBQ25CLGdCQUFJLElBQUksR0FBRyxJQUFJLENBQUM7QUFDaEIsZ0JBQUksSUFBSSxDQUFDLE9BQU8sS0FBSyxJQUFJLElBQUksSUFBSSxDQUFDLFdBQVcsS0FBSyxJQUFJLEVBQUU7O0FBQ3RELGtCQUFJLENBQUMsT0FBTyxHQUFHLEVBQUMsT0FBTyxFQUFFLElBQUksRUFBRSxPQUFPLEVBQUUsSUFBSSxFQUFDLENBQUM7QUFDOUMscUJBQU8sSUFBSSxDQUFDLFlBQVksQ0FBQyxPQUFPLENBQUMsS0FBSyxFQUFFLENBQUMsQ0FBQyxDQUFDO2FBQzVDO0FBQ0QsZ0JBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssT0FBTyxDQUFDLEtBQUssSUFDdEMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssT0FBTyxDQUFDLEtBQUssRUFBRTs7QUFDdEMscUJBQU8sT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQzFCO0FBQ0QsZ0JBQUksSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEtBQUssT0FBTyxDQUFDLEtBQUssRUFBRTtBQUN4QyxxQkFBTyxJQUFJLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDLENBQUM7YUFDNUMsTUFBTTtBQUNMLHFCQUFPLElBQUksQ0FBQyxZQUFZLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRSxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7YUFDeEQ7V0FDRjs7O2VBckpVLGtCQUFrQjtTQUFTLGVBQWUiLCJmaWxlIjoiYW50aXRyYWNraW5nL2Jsb29tLWZpbHRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBtZDUgZnJvbSAnYW50aXRyYWNraW5nL21kNSc7XG5pbXBvcnQgKiBhcyBkYXRldGltZSBmcm9tICdhbnRpdHJhY2tpbmcvdGltZSc7XG5pbXBvcnQgcGFjZW1ha2VyIGZyb20gJ2FudGl0cmFja2luZy9wYWNlbWFrZXInO1xuaW1wb3J0IFFTV2hpdGVsaXN0QmFzZSBmcm9tICdhbnRpdHJhY2tpbmcvcXMtd2hpdGVsaXN0LWJhc2UnO1xuaW1wb3J0IHsgdXRpbHMsIFByb21pc2UgfSBmcm9tICdjb3JlL2NsaXF6JztcbmltcG9ydCB7IFJlc291cmNlIH0gZnJvbSAnY29yZS9yZXNvdXJjZS1sb2FkZXInO1xuXG5leHBvcnQgZnVuY3Rpb24gQmxvb21GaWx0ZXIoYSwgaykgeyAgLy8gYSB0aGUgYXJyYXksIGsgdGhlIG51bWJlciBvZiBoYXNoIGZ1bmN0aW9uXG4gIHZhciBtID0gYS5sZW5ndGggKiAzMiwgIC8vIDMyIGJpdHMgZm9yIGVhY2ggZWxlbWVudCBpbiBhXG4gICAgICBuID0gYS5sZW5ndGgsXG4gICAgICBpID0gLTE7XG4gIHRoaXMubSA9IG0gPSBuICogMzI7XG4gIHRoaXMuayA9IGs7XG4gIC8vIGNob29zZSBkYXRhIHR5cGVcbiAgdmFyIGtieXRlcyA9IDEgPDwgTWF0aC5jZWlsKE1hdGgubG9nKE1hdGguY2VpbChNYXRoLmxvZyhtKSAvIE1hdGguTE4yIC8gOCkpIC8gTWF0aC5MTjIpLFxuICAgICAgYXJyYXkgPSBrYnl0ZXMgPT09IDEgPyBVaW50OEFycmF5IDoga2J5dGVzID09PSAyID8gVWludDE2QXJyYXkgOiBVaW50MzJBcnJheSxcbiAgICAgIGtidWZmZXIgPSBuZXcgQXJyYXlCdWZmZXIoa2J5dGVzICogayksXG4gICAgICBidWNrZXRzID0gdGhpcy5idWNrZXRzID0gbmV3IEludDMyQXJyYXkobik7XG4gIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgYnVja2V0c1tpXSA9IGFbaV07ICAvLyBwdXQgdGhlIGVsZW1lbnRzIGludG8gdGhlaXIgYnVja2V0XG4gIH1cbiAgdGhpcy5fbG9jYXRpb25zID0gbmV3IGFycmF5KGtidWZmZXIpOyAgLy8gc3RvcmVzIGxvY2F0aW9uIGZvciBlYWNoIGhhc2ggZnVuY3Rpb25cbn1cblxuQmxvb21GaWx0ZXIucHJvdG90eXBlLmxvY2F0aW9ucyA9IGZ1bmN0aW9uKGEsIGIpIHsgIC8vIHdlIHVzZSAyIGhhc2ggdmFsdWVzIHRvIGdlbmVyYXRlIGsgaGFzaCB2YWx1ZXNcbiAgdmFyIGsgPSB0aGlzLmssXG4gICAgICBtID0gdGhpcy5tLFxuICAgICAgciA9IHRoaXMuX2xvY2F0aW9ucztcbiAgYSA9IHBhcnNlSW50KGEsIDE2KTtcbiAgYiA9IHBhcnNlSW50KGIsIDE2KTtcbiAgdmFyIHggPSBhICUgbTtcblxuICBmb3IgKHZhciBpID0gMDsgaSA8IGs7ICsraSkge1xuICAgIHJbaV0gPSB4IDwgMCA/ICh4ICsgbSkgOiB4O1xuICAgIHggPSAoeCArIGIpICUgbTtcbiAgfVxuICByZXR1cm4gcjtcbn07XG5cbkJsb29tRmlsdGVyLnByb3RvdHlwZS50ZXN0ID0gZnVuY3Rpb24oYSwgYikge1xuICAvLyBzaW5jZSBNRDUgd2lsbCBiZSBjYWxjdWxhdGVkIGJlZm9yZSBoYW5kLFxuICAvLyB3ZSBhbGxvdyB1c2luZyBoYXNoIHZhbHVlIGFzIGlucHV0IHRvXG5cbiAgdmFyIGwgPSB0aGlzLmxvY2F0aW9ucyhhLCBiKSxcbiAgICAgIGsgPSB0aGlzLmssXG4gICAgICBidWNrZXRzID0gdGhpcy5idWNrZXRzO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGs7ICsraSkge1xuICAgIHZhciBiayA9IGxbaV07XG4gICAgaWYgKChidWNrZXRzW01hdGguZmxvb3IoYmsgLyAzMildICYgKDEgPDwgKGJrICUgMzIpKSkgPT09IDApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHRydWU7XG59O1xuXG5CbG9vbUZpbHRlci5wcm90b3R5cGUudGVzdFNpbmdsZSA9IGZ1bmN0aW9uKHgpIHtcbiAgdmFyIG1kNUhleCA9IG1kNSh4KTtcbiAgdmFyIGEgPSBtZDVIZXguc3Vic3RyaW5nKDAsIDgpLFxuICAgICAgYiA9IG1kNUhleC5zdWJzdHJpbmcoOCwgMTYpO1xuICByZXR1cm4gdGhpcy50ZXN0KGEsIGIpO1xufTtcblxuQmxvb21GaWx0ZXIucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgLy8gTWF5YmUgdXNlZCB0byBhZGQgbG9jYWwgc2FmZUtleSB0byBibG9vbSBmaWx0ZXJcbiAgdmFyIGwgPSB0aGlzLmxvY2F0aW9ucyhhLCBiKSxcbiAgICAgIGsgPSB0aGlzLmssXG4gICAgICBidWNrZXRzID0gdGhpcy5idWNrZXRzO1xuICBmb3IgKHZhciBpID0gMDsgaSA8IGs7ICsraSkge1xuICAgIGJ1Y2tldHNbTWF0aC5mbG9vcihsW2ldIC8gMzIpXSB8PSAxIDw8IChsW2ldICUgMzIpO1xuICB9XG59O1xuXG5CbG9vbUZpbHRlci5wcm90b3R5cGUuYWRkU2luZ2xlID0gZnVuY3Rpb24oeCkge1xuICB2YXIgbWQ1SGV4ID0gbWQ1KHgpO1xuICB2YXIgYSA9IG1kNUhleC5zdWJzdHJpbmcoMCwgOCksXG4gICAgICBiID0gbWQ1SGV4LnN1YnN0cmluZyg4LCAxNik7XG4gIHJldHVybiB0aGlzLmFkZChhLCBiKTtcbn07XG5cbkJsb29tRmlsdGVyLnByb3RvdHlwZS51cGRhdGUgPSBmdW5jdGlvbihhKSB7XG4gIC8vIHVwZGF0ZSB0aGUgYmxvb20gZmlsdGVyLCB1c2VkIGluIG1pbm9yIHJldmlzb24gZm9yIGV2ZXJ5IDEwIG1pblxuICB2YXIgbSA9IGEubGVuZ3RoICogMzIsICAvLyAzMiBiaXQgZm9yIGVhY2ggZWxlbWVudFxuICAgICAgbiA9IGEubGVuZ3RoLFxuICAgICAgaSA9IC0xO1xuICBtID0gbiAqIDMyO1xuICBpZiAodGhpcy5tICE9PSBtKSB7XG4gICAgdGhyb3cgJ0Jsb29tIGZpbHRlciBjYW4gb25seSBiZSB1cGRhdGVkIHdpdGggc2FtZSBsZW5ndGgnO1xuICB9XG4gIHdoaWxlICgrK2kgPCBuKSB7XG4gICAgdGhpcy5idWNrZXRzW2ldIHw9IGFbaV07XG4gIH1cbn07XG5cblxudmFyIEJMT09NRklMVEVSX0JBU0VfVVJMID0gJ2h0dHBzOi8vY2RuLmNsaXF6LmNvbS9hbnRpLXRyYWNraW5nL2Jsb29tX2ZpbHRlci8nLFxuICAgIEJMT09NRklMVEVSX0NPTkZJRyA9ICdodHRwczovL2Nkbi5jbGlxei5jb20vYW50aS10cmFja2luZy9ibG9vbV9maWx0ZXIvY29uZmlnJztcblxuY29uc3QgVVBEQVRFX0VYUElSWV9IT1VSUyA9IDQ4O1xuXG5leHBvcnQgY2xhc3MgQXR0cmFja0Jsb29tRmlsdGVyIGV4dGVuZHMgUVNXaGl0ZWxpc3RCYXNlIHtcblxuICBjb25zdHJ1Y3Rvcihjb25maWdVUkwgPSBCTE9PTUZJTFRFUl9DT05GSUcsIGJhc2VVUkwgPSBCTE9PTUZJTFRFUl9CQVNFX1VSTCkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5sYXN0VXBkYXRlID0gJzAnO1xuICAgIHRoaXMuYmxvb21GaWx0ZXIgPSBudWxsO1xuICAgIHRoaXMudmVyc2lvbiA9IG51bGw7XG4gICAgdGhpcy5jb25maWdVUkwgPSBjb25maWdVUkw7XG4gICAgdGhpcy5iYXNlVVJMID0gYmFzZVVSTDtcbiAgICB0aGlzLl9jb25maWcgPSBuZXcgUmVzb3VyY2UoWydhbnRpdHJhY2tpbmcnLCAnYmxvb21fY29uZmlnLmpzb24nXSwge1xuICAgICAgcmVtb3RlVVJMOiBjb25maWdVUkxcbiAgICB9KTtcbiAgfVxuXG4gIGluaXQoKSB7XG4gICAgc3VwZXIuaW5pdCgpO1xuICAgIC8vIHRyeSByZW1vdGUgdXBkYXRlIGJlZm9yZSBsb2NhbFxuICAgIHRoaXMuX2NvbmZpZy51cGRhdGVGcm9tUmVtb3RlKCkuY2F0Y2goKCkgPT4ge1xuICAgICAgcmV0dXJuIHRoaXMuX2NvbmZpZy5sb2FkKCk7XG4gICAgfSkudGhlbih0aGlzLmNoZWNrVXBkYXRlLmJpbmQodGhpcykpLnRoZW4oKCkgPT4ge1xuICAgICAgdGhpcy5sYXN0VXBkYXRlID0gZGF0ZXRpbWUuZ2V0VGltZSgpO1xuICAgIH0pO1xuICAgIC8vIGNoZWNrIGV2ZXJ5IDEwc1xuICAgIHBhY2VtYWtlci5yZWdpc3Rlcih0aGlzLnVwZGF0ZS5iaW5kKHRoaXMpLCAxMCAqIDYwICogMTAwMCk7XG4gIH1cblxuICBkZXN0cm95KCkge1xuICAgIHN1cGVyLmRlc3Ryb3koKTtcbiAgfVxuXG4gIGlzVXBUb0RhdGUoKSB7XG4gICAgdmFyIGRlbGF5ID0gVVBEQVRFX0VYUElSWV9IT1VSUyxcbiAgICAgICAgaG91ciA9IGRhdGV0aW1lLm5ld1VUQ0RhdGUoKTtcbiAgICBob3VyLnNldEhvdXJzKGhvdXIuZ2V0SG91cnMoKSAtIGRlbGF5KTtcbiAgICB2YXIgaG91ckN1dG9mZiA9IGRhdGV0aW1lLmhvdXJTdHJpbmcoaG91cik7XG4gICAgcmV0dXJuIHRoaXMubGFzdFVwZGF0ZSA+IGhvdXJDdXRvZmY7XG4gIH1cblxuICBpc1JlYWR5KCkge1xuICAgIHJldHVybiB0aGlzLmJsb29tRmlsdGVyICE9PSBudWxsO1xuICB9XG5cbiAgaXNUcmFja2VyRG9tYWluKGRvbWFpbikge1xuICAgIHJldHVybiB0aGlzLmJsb29tRmlsdGVyLnRlc3RTaW5nbGUoJ2QnICsgZG9tYWluKTtcbiAgfVxuXG4gIGlzU2FmZUtleShkb21haW4sIGtleSkge1xuICAgIHJldHVybiAoIXRoaXMuaXNVbnNhZmVLZXkoZG9tYWluLCBrZXkpKSAmJiAodGhpcy5ibG9vbUZpbHRlci50ZXN0U2luZ2xlKCdrJyArIGRvbWFpbiArIGtleSkgfHwgc3VwZXIuaXNTYWZlS2V5KGRvbWFpbiwga2V5KSk7XG4gIH1cblxuICBpc1NhZmVUb2tlbihkb21haW4sIHRva2VuKSB7XG4gICAgcmV0dXJuIHRoaXMuYmxvb21GaWx0ZXIudGVzdFNpbmdsZSgndCcgKyBkb21haW4gKyB0b2tlbik7XG4gIH1cblxuICBpc1Vuc2FmZUtleShkb21haW4sIHRva2VuKSB7XG4gICAgcmV0dXJuIHRoaXMuYmxvb21GaWx0ZXIudGVzdFNpbmdsZSgndScgKyBkb21haW4gKyB0b2tlbik7XG4gIH1cblxuICBhZGREb21haW4oZG9tYWluKSB7XG4gICAgdGhpcy5ibG9vbUZpbHRlci5hZGRTaW5nbGUoJ2QnICsgZG9tYWluKTtcbiAgfVxuXG4gIGFkZFNhZmVLZXkoZG9tYWluLCBrZXksIHZhbHVlQ291bnQpIHtcbiAgICBpZiAodGhpcy5pc1Vuc2FmZUtleShkb21haW4sIGtleSkpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdGhpcy5ibG9vbUZpbHRlci5hZGRTaW5nbGUoJ2snICsgZG9tYWluICsga2V5KTtcbiAgICBzdXBlci5hZGRTYWZlS2V5KGRvbWFpbiwga2V5LCB2YWx1ZUNvdW50KTtcbiAgfVxuXG4gIGFkZFVuc2FmZUtleShkb21haW4sIHRva2VuKSB7XG4gICAgdGhpcy5ibG9vbUZpbHRlci5hZGRTaW5nbGUoJ3UnICsgZG9tYWluICsgdG9rZW4pO1xuICB9XG5cbiAgYWRkU2FmZVRva2VuKGRvbWFpbiwgdG9rZW4pIHtcbiAgICB1dGlscy5sb2coW2RvbWFpbiwgdG9rZW5dKTtcbiAgICBpZiAodG9rZW4gPT09ICcnKSB7XG4gICAgICB1dGlscy5sb2coJ2FkZCBkb21haW4gJyArIGRvbWFpbik7XG4gICAgICB0aGlzLmFkZERvbWFpbihkb21haW4pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLmJsb29tRmlsdGVyLmFkZFNpbmdsZSgndCcgKyBkb21haW4gKyB0b2tlbik7XG4gICAgfVxuICB9XG5cbiAgZ2V0VmVyc2lvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgYmxvb21GaWx0ZXJ2ZXJzaW9uOiB0aGlzLmJsb29tRmlsdGVyID8gdGhpcy5ibG9vbUZpbHRlci52ZXJzaW9uIDogbnVsbFxuICAgIH07XG4gIH1cblxuICB1cGRhdGUoKSB7XG4gICAgdGhpcy5fY29uZmlnLnVwZGF0ZUZyb21SZW1vdGUoKS50aGVuKHRoaXMuY2hlY2tVcGRhdGUuYmluZCh0aGlzKSkudGhlbigoKSA9PiB7XG4gICAgICB0aGlzLmxhc3RVcGRhdGUgPSBkYXRldGltZS5nZXRUaW1lKCk7XG4gICAgfSk7XG4gIH1cblxuICByZW1vdGVVcGRhdGUobWFqb3IsIG1pbm9yKSB7XG4gICAgdmFyIHVybCA9IHRoaXMuYmFzZVVSTCArIG1ham9yICsgJy8nICsgbWlub3IgKyAnLmd6JyxcbiAgICAgICAgc2VsZiA9IHRoaXM7XG5cbiAgICBsZXQgdXBkYXRlRmlsdGVyID0gZnVuY3Rpb24oYmYpIHtcbiAgICAgIGlmIChtaW5vciAhPT0gMCkge1xuICAgICAgICAgIHNlbGYuYmxvb21GaWx0ZXIudXBkYXRlKGJmLmJrdCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYuYmxvb21GaWx0ZXIgPSBuZXcgQmxvb21GaWx0ZXIoYmYuYmt0LCBiZi5rKTtcbiAgICAgIH1cbiAgICAgIHNlbGYudmVyc2lvbi5tYWpvciA9IG1ham9yO1xuICAgICAgc2VsZi52ZXJzaW9uLm1pbm9yID0gbWlub3I7XG4gICAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG4gICAgfTtcblxuICAgIC8vIGxvYWQgdGhlIGZpbHRlciwgaWYgcG9zc2libGUgZnJvbSB0aGUgQ0ROLCBvdGhlcndpc2UgZ3JhYiBhIGNhY2hlZCBsb2NhbCB2ZXJzaW9uXG4gICAgaWYgKG1ham9yID09PSAnbG9jYWwnKSB7XG4gICAgICByZXR1cm4gdGhpcy5sb2FkRnJvbUxvY2FsKCkudGhlbih1cGRhdGVGaWx0ZXIpO1xuICAgIH0gZWxzZSBpZiAobWlub3IgPT09IDApIHtcbiAgICAgIGNvbnN0IGJsb29tRmlsZSA9IG5ldyBSZXNvdXJjZShbJ2FudGl0cmFja2luZycsICdibG9vbV9maWx0ZXIuanNvbiddLCB7XG4gICAgICAgIHJlbW90ZVVSTDogdXJsXG4gICAgICB9KTtcbiAgICAgIHJldHVybiBibG9vbUZpbGUudXBkYXRlRnJvbVJlbW90ZSgpXG4gICAgICAgIC5jYXRjaCgoKSA9PiB0aGlzLmxvYWRGcm9tTG9jYWwoKSlcbiAgICAgICAgLnRoZW4odXBkYXRlRmlsdGVyKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIHV0aWxzLnByb21pc2VIdHRwSGFuZGxlcignR0VUJywgdXJsLCB1bmRlZmluZWQsIDEwMDAwKVxuICAgICAgICAudGhlbigocmVxKSA9PiBKU09OLnBhcnNlKHJlcS5yZXNwb25zZSkpXG4gICAgICAgIC5jYXRjaCgoKSA9PiB0aGlzLmxvYWRGcm9tTG9jYWwoKSlcbiAgICAgICAgLnRoZW4odXBkYXRlRmlsdGVyKTtcbiAgICB9XG4gIH1cblxuICBsb2FkRnJvbUxvY2FsKCkge1xuICAgIGNvbnN0IGJsb29tRmlsZSA9IG5ldyBSZXNvdXJjZShbJ2FudGl0cmFja2luZycsICdibG9vbV9maWx0ZXIuanNvbiddKTtcbiAgICByZXR1cm4gYmxvb21GaWxlLmxvYWQoKVxuICB9XG5cbiAgY2hlY2tVcGRhdGUodmVyc2lvbikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBpZiAoc2VsZi52ZXJzaW9uID09PSBudWxsIHx8IHNlbGYuYmxvb21GaWx0ZXIgPT09IG51bGwpIHsgIC8vIGxvYWQgdGhlIGZpcnN0IHRpbWVcbiAgICAgIHNlbGYudmVyc2lvbiA9IHsnbWFqb3InOiBudWxsLCAnbWlub3InOiBudWxsfTtcbiAgICAgIHJldHVybiBzZWxmLnJlbW90ZVVwZGF0ZSh2ZXJzaW9uLm1ham9yLCAwKTsgLy8gbG9hZCB0aGUgbWFqb3IgdmVyc2lvbiBhbmQgdXBkYXRlIGxhdGVyXG4gICAgfVxuICAgIGlmIChzZWxmLnZlcnNpb24ubWFqb3IgPT09IHZlcnNpb24ubWFqb3IgJiZcbiAgICAgIHNlbGYudmVyc2lvbi5taW5vciA9PT0gdmVyc2lvbi5taW5vcikgeyAgLy8gYWxyZWFkeSBhdCB0aGUgbGF0ZXN0IHZlcnNpb25cbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbiAgICB9XG4gICAgaWYgKHNlbGYudmVyc2lvbi5tYWpvciAhPT0gdmVyc2lvbi5tYWpvcikge1xuICAgICAgcmV0dXJuIHNlbGYucmVtb3RlVXBkYXRlKHZlcnNpb24ubWFqb3IsIDApO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gc2VsZi5yZW1vdGVVcGRhdGUodmVyc2lvbi5tYWpvciwgdmVyc2lvbi5taW5vcik7XG4gICAgfVxuICB9XG59XG4iXX0=