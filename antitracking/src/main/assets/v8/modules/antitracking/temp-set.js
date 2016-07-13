System.register("antitracking/temp-set", [], function (_export) {
  /** Set like class whose members are removed after a specifie
  */
  "use strict";

  var _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  return {
    setters: [],
    execute: function () {
      _default = (function () {
        function _default() {
          _classCallCheck(this, _default);

          this._items = new Set();
          this._timeouts = new Set();
        }

        _createClass(_default, [{
          key: "contains",
          value: function contains(item) {
            return this._items.has(item);
          }
        }, {
          key: "has",
          value: function has(item) {
            return this.contains(item);
          }
        }, {
          key: "add",
          value: function add(item, ttl) {
            this._items.add(item);
            var timeout = CliqzUtils.setTimeout((function () {
              this["delete"](item);
              this._timeouts["delete"](timeout);
            }).bind(this), ttl || 0);
            this._timeouts.add(timeout);
          }
        }, {
          key: "delete",
          value: function _delete(item) {
            this._items["delete"](item);
          }
        }, {
          key: "clear",
          value: function clear() {
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
              for (var _iterator = this._timeouts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                var t = _step.value;

                CliqzUtils.clearTimeout(t);
              }
            } catch (err) {
              _didIteratorError = true;
              _iteratorError = err;
            } finally {
              try {
                if (!_iteratorNormalCompletion && _iterator["return"]) {
                  _iterator["return"]();
                }
              } finally {
                if (_didIteratorError) {
                  throw _iteratorError;
                }
              }
            }

            this._timeouts.clear();
            this._items.clear();
          }
        }]);

        return _default;
      })();

      _export("default", _default);

      ;
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy90ZW1wLXNldC5lcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFJYSw0QkFBRzs7O0FBQ1osY0FBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBQ3hCLGNBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxHQUFHLEVBQUUsQ0FBQztTQUM1Qjs7OztpQkFFTyxrQkFBQyxJQUFJLEVBQUU7QUFDYixtQkFBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztXQUM5Qjs7O2lCQUVFLGFBQUMsSUFBSSxFQUFFO0FBQ1IsbUJBQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQztXQUM1Qjs7O2lCQUVFLGFBQUMsSUFBSSxFQUFFLEdBQUcsRUFBRTtBQUNiLGdCQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztBQUN0QixnQkFBSSxPQUFPLEdBQUcsVUFBVSxDQUFDLFVBQVUsQ0FBQyxDQUFBLFlBQVc7QUFDM0Msa0JBQUksVUFBTyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ2xCLGtCQUFJLENBQUMsU0FBUyxVQUFPLENBQUMsT0FBTyxDQUFDLENBQUM7YUFDbEMsQ0FBQSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLElBQUksQ0FBQyxDQUFDLENBQUM7QUFDeEIsZ0JBQUksQ0FBQyxTQUFTLENBQUMsR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1dBQzdCOzs7aUJBRUssaUJBQUMsSUFBSSxFQUFFO0FBQ1gsZ0JBQUksQ0FBQyxNQUFNLFVBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQztXQUMxQjs7O2lCQUVJLGlCQUFHOzs7Ozs7QUFDTixtQ0FBYyxJQUFJLENBQUMsU0FBUyw4SEFBRTtvQkFBckIsQ0FBQzs7QUFDUiwwQkFBVSxDQUFDLFlBQVksQ0FBQyxDQUFDLENBQUMsQ0FBQztlQUM1Qjs7Ozs7Ozs7Ozs7Ozs7OztBQUNELGdCQUFJLENBQUMsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDO0FBQ3ZCLGdCQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssRUFBRSxDQUFDO1dBQ3JCOzs7Ozs7OztBQUVGLE9BQUMiLCJmaWxlIjoiYW50aXRyYWNraW5nL3RlbXAtc2V0LmVzIiwic291cmNlc0NvbnRlbnQiOlsiLyoqIFNldCBsaWtlIGNsYXNzIHdob3NlIG1lbWJlcnMgYXJlIHJlbW92ZWQgYWZ0ZXIgYSBzcGVjaWZpZVxuKi9cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHtcblxuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9pdGVtcyA9IG5ldyBTZXQoKTtcbiAgICB0aGlzLl90aW1lb3V0cyA9IG5ldyBTZXQoKTtcbiAgfVxuXG4gIGNvbnRhaW5zKGl0ZW0pIHtcbiAgICByZXR1cm4gdGhpcy5faXRlbXMuaGFzKGl0ZW0pO1xuICB9XG5cbiAgaGFzKGl0ZW0pIHtcbiAgICByZXR1cm4gdGhpcy5jb250YWlucyhpdGVtKTtcbiAgfVxuXG4gIGFkZChpdGVtLCB0dGwpIHtcbiAgICB0aGlzLl9pdGVtcy5hZGQoaXRlbSk7XG4gICAgdmFyIHRpbWVvdXQgPSBDbGlxelV0aWxzLnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMuZGVsZXRlKGl0ZW0pO1xuICAgICAgICB0aGlzLl90aW1lb3V0cy5kZWxldGUodGltZW91dCk7XG4gICAgfS5iaW5kKHRoaXMpLCB0dGwgfHwgMCk7XG4gICAgdGhpcy5fdGltZW91dHMuYWRkKHRpbWVvdXQpO1xuICB9XG5cbiAgZGVsZXRlKGl0ZW0pIHtcbiAgICB0aGlzLl9pdGVtcy5kZWxldGUoaXRlbSk7XG4gIH1cblxuICBjbGVhcigpIHtcbiAgICBmb3IgKGxldCB0IG9mIHRoaXMuX3RpbWVvdXRzKSB7XG4gICAgICBDbGlxelV0aWxzLmNsZWFyVGltZW91dCh0KTtcbiAgICB9XG4gICAgdGhpcy5fdGltZW91dHMuY2xlYXIoKTtcbiAgICB0aGlzLl9pdGVtcy5jbGVhcigpO1xuICB9XG5cbn07XG4iXX0=