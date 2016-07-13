System.register("antitracking/fixed-size-cache", [], function (_export) {
  /** Fixed length lookup cache. Allows expensive operations to be cached for later lookup. Once
      the cache limit is exceeded, least recently used values are removed.
  */
  "use strict";

  var _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  return {
    setters: [],
    execute: function () {
      _default = (function () {
        function _default(item_ctor, size) {
          _classCallCheck(this, _default);

          this._cache_limit = size;
          this._cache = {};
          this._lru = [];
          this._item_ctor = item_ctor;
          this._hit_ctr = 0;
          this._miss_ctr = 0;
          this._keysize_limit = 1000;
        }

        _createClass(_default, [{
          key: "get",
          value: function get(key) {
            if (key in this._cache) {
              // cache hit, remove key from lru list
              var ind = this._lru.indexOf(key);
              if (ind != -1) {
                this._lru.splice(ind, 1);
              }
              this._hit_ctr++;
            } else {
              // cache miss, generate value for key
              if (!key || key.length > this._keysize_limit) {
                // if key is large, don't cache
                return this._item_ctor(key);
              }
              this._cache[key] = this._item_ctor(key);
              // prune cache - take from tail of list until short enough
              while (this._lru.length > this._cache_limit) {
                var lru = this._lru.pop();
                delete this._cache[lru];
              }
              this._miss_ctr++;
            }
            // add key to head of list
            this._lru.unshift(key);
            return this._cache[key];
          }
        }]);

        return _default;
      })();

      _export("default", _default);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy9maXhlZC1zaXplLWNhY2hlLmVzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7QUFLYSwwQkFBQyxTQUFTLEVBQUUsSUFBSSxFQUFFOzs7QUFDM0IsY0FBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUM7QUFDekIsY0FBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7QUFDakIsY0FBSSxDQUFDLElBQUksR0FBRyxFQUFFLENBQUM7QUFDZixjQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQztBQUM1QixjQUFJLENBQUMsUUFBUSxHQUFHLENBQUMsQ0FBQztBQUNsQixjQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQztBQUNuQixjQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQztTQUM1Qjs7OztpQkFFRSxhQUFDLEdBQUcsRUFBRTtBQUNQLGdCQUFJLEdBQUcsSUFBSSxJQUFJLENBQUMsTUFBTSxFQUFFOztBQUV0QixrQkFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDakMsa0JBQUksR0FBRyxJQUFJLENBQUMsQ0FBQyxFQUFFO0FBQ1gsb0JBQUksQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsRUFBRSxDQUFDLENBQUMsQ0FBQztlQUM1QjtBQUNELGtCQUFJLENBQUMsUUFBUSxFQUFFLENBQUM7YUFDakIsTUFBTTs7QUFFTCxrQkFBSSxDQUFDLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUU7O0FBRTFDLHVCQUFPLElBQUksQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDLENBQUM7ZUFDL0I7QUFDRCxrQkFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDOztBQUV4QyxxQkFBTyxJQUFJLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsWUFBWSxFQUFFO0FBQ3pDLG9CQUFJLEdBQUcsR0FBRyxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsRUFBRSxDQUFDO0FBQzFCLHVCQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUM7ZUFDM0I7QUFDRCxrQkFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2FBQ2xCOztBQUVELGdCQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUN2QixtQkFBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1dBQ3pCIiwiZmlsZSI6ImFudGl0cmFja2luZy9maXhlZC1zaXplLWNhY2hlLmVzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIEZpeGVkIGxlbmd0aCBsb29rdXAgY2FjaGUuIEFsbG93cyBleHBlbnNpdmUgb3BlcmF0aW9ucyB0byBiZSBjYWNoZWQgZm9yIGxhdGVyIGxvb2t1cC4gT25jZVxuICAgIHRoZSBjYWNoZSBsaW1pdCBpcyBleGNlZWRlZCwgbGVhc3QgcmVjZW50bHkgdXNlZCB2YWx1ZXMgYXJlIHJlbW92ZWQuXG4qL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3Mge1xuXG4gIGNvbnN0cnVjdG9yKGl0ZW1fY3Rvciwgc2l6ZSkge1xuICAgIHRoaXMuX2NhY2hlX2xpbWl0ID0gc2l6ZTtcbiAgICB0aGlzLl9jYWNoZSA9IHt9O1xuICAgIHRoaXMuX2xydSA9IFtdO1xuICAgIHRoaXMuX2l0ZW1fY3RvciA9IGl0ZW1fY3RvcjtcbiAgICB0aGlzLl9oaXRfY3RyID0gMDtcbiAgICB0aGlzLl9taXNzX2N0ciA9IDA7XG4gICAgdGhpcy5fa2V5c2l6ZV9saW1pdCA9IDEwMDA7XG4gIH1cblxuICBnZXQoa2V5KSB7XG4gICAgaWYgKGtleSBpbiB0aGlzLl9jYWNoZSkge1xuICAgICAgLy8gY2FjaGUgaGl0LCByZW1vdmUga2V5IGZyb20gbHJ1IGxpc3RcbiAgICAgIGxldCBpbmQgPSB0aGlzLl9scnUuaW5kZXhPZihrZXkpO1xuICAgICAgaWYgKGluZCAhPSAtMSkge1xuICAgICAgICAgIHRoaXMuX2xydS5zcGxpY2UoaW5kLCAxKTtcbiAgICAgIH1cbiAgICAgIHRoaXMuX2hpdF9jdHIrKztcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gY2FjaGUgbWlzcywgZ2VuZXJhdGUgdmFsdWUgZm9yIGtleVxuICAgICAgaWYgKCFrZXkgfHwga2V5Lmxlbmd0aCA+IHRoaXMuX2tleXNpemVfbGltaXQpIHtcbiAgICAgICAgICAvLyBpZiBrZXkgaXMgbGFyZ2UsIGRvbid0IGNhY2hlXG4gICAgICAgICAgcmV0dXJuIHRoaXMuX2l0ZW1fY3RvcihrZXkpO1xuICAgICAgfVxuICAgICAgdGhpcy5fY2FjaGVba2V5XSA9IHRoaXMuX2l0ZW1fY3RvcihrZXkpO1xuICAgICAgLy8gcHJ1bmUgY2FjaGUgLSB0YWtlIGZyb20gdGFpbCBvZiBsaXN0IHVudGlsIHNob3J0IGVub3VnaFxuICAgICAgd2hpbGUgKHRoaXMuX2xydS5sZW5ndGggPiB0aGlzLl9jYWNoZV9saW1pdCkge1xuICAgICAgICAgIGxldCBscnUgPSB0aGlzLl9scnUucG9wKCk7XG4gICAgICAgICAgZGVsZXRlIHRoaXMuX2NhY2hlW2xydV07XG4gICAgICB9XG4gICAgICB0aGlzLl9taXNzX2N0cisrO1xuICAgIH1cbiAgICAvLyBhZGQga2V5IHRvIGhlYWQgb2YgbGlzdFxuICAgIHRoaXMuX2xydS51bnNoaWZ0KGtleSk7XG4gICAgcmV0dXJuIHRoaXMuX2NhY2hlW2tleV07XG4gIH1cblxufVxuIl19