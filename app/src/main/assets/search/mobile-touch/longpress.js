System.register('mobile-touch/longpress', [], function (_export) {
	/* global CliqzUtils */
	/**
 * @namespace mobile-touch
 */
	'use strict';

	var _default;

	function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

	return {
		setters: [],
		execute: function () {
			_default =
			/**
   * @class Longpress
   * @constructor
   * @param settings
   * @param longpressCallback
   * @param tapCallback
   */
			function _default(elements, longpressCallback, tapCallback) {
				_classCallCheck(this, _default);

				var self = this;
				this.touchTimer = undefined;
				this.isTapBlocked = false;

				function clearTimer() {
					clearTimeout(self.touchTimer);
					self.touchTimer = null;
				}

				CliqzUtils.addEventListenerToElements(elements, 'touchstart', function () {
					self.touchTimer = setTimeout(function (context) {
						clearTimer();
						longpressCallback(context);
					}, 500, this);
				});

				CliqzUtils.addEventListenerToElements(elements, 'touchend', function () {
					if (self.touchTimer) {
						clearTimer();
						tapCallback(this);
					} else if (self.isTapBlocked) {
						self.isTapBlocked = false;
					}
				});

				CliqzUtils.addEventListenerToElements(elements, 'touchmove', function () {
					self.isTapBlocked = true;
					clearTimer();
				});
			};

			_export('default', _default);
		}
	};
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vYmlsZS10b3VjaC9sb25ncHJlc3MuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVlZLHFCQUFDLFFBQVEsRUFBRSxpQkFBaUIsRUFBRSxXQUFXLEVBQUU7OztBQUNyRCxRQUFNLElBQUksR0FBRyxJQUFJLENBQUM7QUFDbEIsUUFBSSxDQUFDLFVBQVUsR0FBRyxTQUFTLENBQUM7QUFDNUIsUUFBSSxDQUFDLFlBQVksR0FBRyxLQUFLLENBQUM7O0FBRTFCLGFBQVMsVUFBVSxHQUFJO0FBQ3JCLGlCQUFZLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDO0FBQzlCLFNBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxDQUFDO0tBQ3hCOztBQUlELGNBQVUsQ0FBQywwQkFBMEIsQ0FBQyxRQUFRLEVBQUUsWUFBWSxFQUFFLFlBQVk7QUFDekUsU0FBSSxDQUFDLFVBQVUsR0FBRyxVQUFVLENBQUMsVUFBUyxPQUFPLEVBQUU7QUFDN0MsZ0JBQVUsRUFBRSxDQUFDO0FBQ2IsdUJBQWlCLENBQUMsT0FBTyxDQUFDLENBQUM7TUFDNUIsRUFBRSxHQUFHLEVBQUUsSUFBSSxDQUFDLENBQUM7S0FDZCxDQUFDLENBQUM7O0FBRUgsY0FBVSxDQUFDLDBCQUEwQixDQUFDLFFBQVEsRUFBRSxVQUFVLEVBQUUsWUFBWTtBQUNwRSxTQUFHLElBQUksQ0FBQyxVQUFVLEVBQUU7QUFDbEIsZ0JBQVUsRUFBRSxDQUFDO0FBQ2IsaUJBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztNQUNuQixNQUFNLElBQUcsSUFBSSxDQUFDLFlBQVksRUFBRTtBQUMzQixVQUFJLENBQUMsWUFBWSxHQUFHLEtBQUssQ0FBQztNQUMzQjtLQUNKLENBQUMsQ0FBQzs7QUFFSCxjQUFVLENBQUMsMEJBQTBCLENBQUMsUUFBUSxFQUFFLFdBQVcsRUFBRSxZQUFZO0FBQ3hFLFNBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ3RCLGVBQVUsRUFBRSxDQUFDO0tBQ2hCLENBQUMsQ0FBQztJQUNIIiwiZmlsZSI6Im1vYmlsZS10b3VjaC9sb25ncHJlc3MuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgQ2xpcXpVdGlscyAqL1xuLyoqXG4qIEBuYW1lc3BhY2UgbW9iaWxlLXRvdWNoXG4qL1xuZXhwb3J0IGRlZmF1bHQgY2xhc3Mge1xuICAvKipcbiAgKiBAY2xhc3MgTG9uZ3ByZXNzXG4gICogQGNvbnN0cnVjdG9yXG4gICogQHBhcmFtIHNldHRpbmdzXG4gICogQHBhcmFtIGxvbmdwcmVzc0NhbGxiYWNrXG4gICogQHBhcmFtIHRhcENhbGxiYWNrXG4gICovXG5cdGNvbnN0cnVjdG9yKGVsZW1lbnRzLCBsb25ncHJlc3NDYWxsYmFjaywgdGFwQ2FsbGJhY2spIHtcblx0XHRjb25zdCBzZWxmID0gdGhpcztcblx0XHR0aGlzLnRvdWNoVGltZXIgPSB1bmRlZmluZWQ7XG5cdFx0dGhpcy5pc1RhcEJsb2NrZWQgPSBmYWxzZTtcblxuXHRcdGZ1bmN0aW9uIGNsZWFyVGltZXIgKCkge1xuXHRcdCAgY2xlYXJUaW1lb3V0KHNlbGYudG91Y2hUaW1lcik7XG5cdFx0ICBzZWxmLnRvdWNoVGltZXIgPSBudWxsO1xuXHRcdH1cblxuXG5cblx0XHRDbGlxelV0aWxzLmFkZEV2ZW50TGlzdGVuZXJUb0VsZW1lbnRzKGVsZW1lbnRzLCAndG91Y2hzdGFydCcsIGZ1bmN0aW9uICgpIHtcblx0XHRcdHNlbGYudG91Y2hUaW1lciA9IHNldFRpbWVvdXQoZnVuY3Rpb24oY29udGV4dCkge1xuXHRcdFx0ICBjbGVhclRpbWVyKCk7XG5cdFx0XHQgIGxvbmdwcmVzc0NhbGxiYWNrKGNvbnRleHQpO1xuXHRcdFx0fSwgNTAwLCB0aGlzKTtcblx0XHR9KTtcblxuXHRcdENsaXF6VXRpbHMuYWRkRXZlbnRMaXN0ZW5lclRvRWxlbWVudHMoZWxlbWVudHMsICd0b3VjaGVuZCcsIGZ1bmN0aW9uICgpIHtcblx0XHQgICAgaWYoc2VsZi50b3VjaFRpbWVyKSB7XG5cdFx0ICAgICAgY2xlYXJUaW1lcigpO1xuXHRcdCAgICAgIHRhcENhbGxiYWNrKHRoaXMpO1xuXHRcdCAgICB9IGVsc2UgaWYoc2VsZi5pc1RhcEJsb2NrZWQpIHtcblx0XHQgICAgICBzZWxmLmlzVGFwQmxvY2tlZCA9IGZhbHNlO1xuXHRcdCAgICB9XG5cdFx0fSk7XG5cblx0XHRDbGlxelV0aWxzLmFkZEV2ZW50TGlzdGVuZXJUb0VsZW1lbnRzKGVsZW1lbnRzLCAndG91Y2htb3ZlJywgZnVuY3Rpb24gKCkge1xuXHRcdFx0c2VsZi5pc1RhcEJsb2NrZWQgPSB0cnVlO1xuXHRcdCAgICBjbGVhclRpbWVyKCk7XG5cdFx0fSk7XG5cdH1cbn1cbiJdfQ==