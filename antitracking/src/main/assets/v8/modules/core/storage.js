System.register("core/storage", ["platform/storage"], function (_export) {
	"use strict";

	var storage, _default;

	var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

	return {
		setters: [function (_platformStorage) {
			storage = _platformStorage["default"];
		}],
		execute: function () {
			_default = (function () {
				function _default() {
					_classCallCheck(this, _default);

					this.storage = storage;
					this.getItem = this.storage.getItem.bind(this.storage);
					this.setItem = this.storage.setItem.bind(this.storage);
					this.removeItem = this.storage.removeItem.bind(this.storage);
					this.clear = this.storage.clear.bind(this.storage);
				}

				_createClass(_default, [{
					key: "setObject",
					value: function setObject(key, object) {
						this.storage.setItem(key, JSON.stringify(object));
					}
				}, {
					key: "getObject",
					value: function getObject(key) {
						var notFound = arguments.length <= 1 || arguments[1] === undefined ? false : arguments[1];

						var o = storage.getItem(key);
						if (o) {
							return JSON.parse(o);
						}
						return notFound;
					}
				}]);

				return _default;
			})();

			_export("default", _default);
		}
	};
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvc3RvcmFnZS5lcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7QUFHWSx3QkFBRzs7O0FBQ2IsU0FBSSxDQUFDLE9BQU8sR0FBRyxPQUFPLENBQUM7QUFDdkIsU0FBSSxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0FBQ3ZELFNBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztBQUN2RCxTQUFJLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUM7QUFDN0QsU0FBSSxDQUFDLEtBQUssR0FBRyxJQUFJLENBQUMsT0FBTyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO0tBQ25EOzs7O1lBRVEsbUJBQUMsR0FBRyxFQUFFLE1BQU0sRUFBRTtBQUN0QixVQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDO01BQ2xEOzs7WUFFUSxtQkFBQyxHQUFHLEVBQW9CO1VBQWxCLFFBQVEseURBQUcsS0FBSzs7QUFDN0IsVUFBTSxDQUFDLEdBQUcsT0FBTyxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUMvQixVQUFJLENBQUMsRUFBRTtBQUNOLGNBQU8sSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztPQUNyQjtBQUNELGFBQU8sUUFBUSxDQUFDO01BQ2pCIiwiZmlsZSI6ImNvcmUvc3RvcmFnZS5lcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBzdG9yYWdlIGZyb20gXCJwbGF0Zm9ybS9zdG9yYWdlXCI7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHtcblx0Y29uc3RydWN0b3IoKSB7XG5cdFx0dGhpcy5zdG9yYWdlID0gc3RvcmFnZTtcblx0XHR0aGlzLmdldEl0ZW0gPSB0aGlzLnN0b3JhZ2UuZ2V0SXRlbS5iaW5kKHRoaXMuc3RvcmFnZSk7XG5cdFx0dGhpcy5zZXRJdGVtID0gdGhpcy5zdG9yYWdlLnNldEl0ZW0uYmluZCh0aGlzLnN0b3JhZ2UpO1xuXHRcdHRoaXMucmVtb3ZlSXRlbSA9IHRoaXMuc3RvcmFnZS5yZW1vdmVJdGVtLmJpbmQodGhpcy5zdG9yYWdlKTtcblx0XHR0aGlzLmNsZWFyID0gdGhpcy5zdG9yYWdlLmNsZWFyLmJpbmQodGhpcy5zdG9yYWdlKTtcblx0fVxuXG5cdHNldE9iamVjdChrZXksIG9iamVjdCkge1xuXHRcdHRoaXMuc3RvcmFnZS5zZXRJdGVtKGtleSwgSlNPTi5zdHJpbmdpZnkob2JqZWN0KSk7XG5cdH1cblxuXHRnZXRPYmplY3Qoa2V5LCBub3RGb3VuZCA9IGZhbHNlKSB7XG5cdCAgY29uc3QgbyA9IHN0b3JhZ2UuZ2V0SXRlbShrZXkpO1xuXHQgIGlmIChvKSB7XG5cdCAgXHRyZXR1cm4gSlNPTi5wYXJzZShvKTtcblx0ICB9XG5cdCAgcmV0dXJuIG5vdEZvdW5kO1xuXHR9XG59XG4iXX0=