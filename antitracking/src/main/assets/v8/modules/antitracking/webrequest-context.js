System.register('antitracking/webrequest-context', [], function (_export) {
  'use strict';

  var _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  return {
    setters: [],
    execute: function () {
      _default = (function () {
        function _default(requestDetails) {
          _classCallCheck(this, _default);

          this.details = requestDetails;
          this.url = requestDetails.url;
          this.method = requestDetails.method;
          this.channel = {
            responseStatus: requestDetails.responseStatus
          };
          this.isCached = requestDetails.isCached;
        }

        _createClass(_default, [{
          key: 'getInnerWindowID',
          value: function getInnerWindowID() {
            return this.details.frameId;
          }
        }, {
          key: 'getOuterWindowID',
          value: function getOuterWindowID() {
            return this.details.tabId;
          }
        }, {
          key: 'getParentWindowID',
          value: function getParentWindowID() {
            return this.details.parentFrameId || this.getOuterWindowID();
          }
        }, {
          key: 'getLoadingDocument',
          value: function getLoadingDocument() {
            return this.details.originUrl;
          }
        }, {
          key: 'getContentPolicyType',
          value: function getContentPolicyType() {
            return this.details.type;
          }
        }, {
          key: 'isFullPage',
          value: function isFullPage() {
            return this.getContentPolicyType() === 6;
          }
        }, {
          key: 'getCookieData',
          value: function getCookieData() {
            return this.getRequestHeader('Cookie');
          }
        }, {
          key: 'getReferrer',
          value: function getReferrer() {
            return this.getRequestHeader('Referer');
          }
        }, {
          key: 'getRequestHeader',
          value: function getRequestHeader(header) {
            return this.details.getRequestHeader(header);
          }
        }, {
          key: 'getResponseHeader',
          value: function getResponseHeader(header) {
            return this.details.getResponseHeader(header);
          }
        }, {
          key: 'getOriginWindowID',
          value: function getOriginWindowID() {
            return this.details.tabId;
          }
        }, {
          key: 'isChannelPrivate',
          value: function isChannelPrivate() {
            return this.details.isPrivate;
          }
        }, {
          key: 'getPostData',
          value: function getPostData() {
            return this.details.getPostData();
          }
        }]);

        return _default;
      })();

      _export('default', _default);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy93ZWJyZXF1ZXN0LWNvbnRleHQuZXMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUdhLDBCQUFDLGNBQWMsRUFBRTs7O0FBQzFCLGNBQUksQ0FBQyxPQUFPLEdBQUcsY0FBYyxDQUFDO0FBQzlCLGNBQUksQ0FBQyxHQUFHLEdBQUcsY0FBYyxDQUFDLEdBQUcsQ0FBQztBQUM5QixjQUFJLENBQUMsTUFBTSxHQUFHLGNBQWMsQ0FBQyxNQUFNLENBQUM7QUFDcEMsY0FBSSxDQUFDLE9BQU8sR0FBRztBQUNiLDBCQUFjLEVBQUUsY0FBYyxDQUFDLGNBQWM7V0FDOUMsQ0FBQztBQUNGLGNBQUksQ0FBQyxRQUFRLEdBQUcsY0FBYyxDQUFDLFFBQVEsQ0FBQztTQUN6Qzs7OztpQkFFZSw0QkFBRztBQUNqQixtQkFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQztXQUM3Qjs7O2lCQUVlLDRCQUFHO0FBQ2pCLG1CQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1dBQzNCOzs7aUJBRWdCLDZCQUFHO0FBQ2xCLG1CQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsYUFBYSxJQUFJLElBQUksQ0FBQyxnQkFBZ0IsRUFBRSxDQUFDO1dBQzlEOzs7aUJBRWlCLDhCQUFHO0FBQ25CLG1CQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsU0FBUyxDQUFDO1dBQy9COzs7aUJBRW1CLGdDQUFHO0FBQ3JCLG1CQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDO1dBQzFCOzs7aUJBRVMsc0JBQUc7QUFDWCxtQkFBTyxJQUFJLENBQUMsb0JBQW9CLEVBQUUsS0FBSyxDQUFDLENBQUM7V0FDMUM7OztpQkFFWSx5QkFBRztBQUNkLG1CQUFPLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRLENBQUMsQ0FBQztXQUN4Qzs7O2lCQUVVLHVCQUFHO0FBQ1osbUJBQU8sSUFBSSxDQUFDLGdCQUFnQixDQUFDLFNBQVMsQ0FBQyxDQUFDO1dBQ3pDOzs7aUJBRWUsMEJBQUMsTUFBTSxFQUFFO0FBQ3ZCLG1CQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLENBQUM7V0FDOUM7OztpQkFFZ0IsMkJBQUMsTUFBTSxFQUFFO0FBQ3hCLG1CQUFPLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsTUFBTSxDQUFDLENBQUM7V0FDL0M7OztpQkFFZ0IsNkJBQUc7QUFDbEIsbUJBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUM7V0FDM0I7OztpQkFFZSw0QkFBRztBQUNqQixtQkFBTyxJQUFJLENBQUMsT0FBTyxDQUFDLFNBQVMsQ0FBQztXQUMvQjs7O2lCQUVVLHVCQUFHO0FBQ1osbUJBQU8sSUFBSSxDQUFDLE9BQU8sQ0FBQyxXQUFXLEVBQUUsQ0FBQztXQUNuQyIsImZpbGUiOiJhbnRpdHJhY2tpbmcvd2VicmVxdWVzdC1jb250ZXh0LmVzIiwic291cmNlc0NvbnRlbnQiOlsiXG5leHBvcnQgZGVmYXVsdCBjbGFzcyB7XG5cbiAgY29uc3RydWN0b3IocmVxdWVzdERldGFpbHMpIHtcbiAgICB0aGlzLmRldGFpbHMgPSByZXF1ZXN0RGV0YWlscztcbiAgICB0aGlzLnVybCA9IHJlcXVlc3REZXRhaWxzLnVybDtcbiAgICB0aGlzLm1ldGhvZCA9IHJlcXVlc3REZXRhaWxzLm1ldGhvZDtcbiAgICB0aGlzLmNoYW5uZWwgPSB7XG4gICAgICByZXNwb25zZVN0YXR1czogcmVxdWVzdERldGFpbHMucmVzcG9uc2VTdGF0dXNcbiAgICB9O1xuICAgIHRoaXMuaXNDYWNoZWQgPSByZXF1ZXN0RGV0YWlscy5pc0NhY2hlZDtcbiAgfVxuXG4gIGdldElubmVyV2luZG93SUQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGV0YWlscy5mcmFtZUlkO1xuICB9XG5cbiAgZ2V0T3V0ZXJXaW5kb3dJRCgpIHtcbiAgICByZXR1cm4gdGhpcy5kZXRhaWxzLnRhYklkO1xuICB9XG5cbiAgZ2V0UGFyZW50V2luZG93SUQoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGV0YWlscy5wYXJlbnRGcmFtZUlkIHx8IHRoaXMuZ2V0T3V0ZXJXaW5kb3dJRCgpO1xuICB9XG5cbiAgZ2V0TG9hZGluZ0RvY3VtZW50KCkge1xuICAgIHJldHVybiB0aGlzLmRldGFpbHMub3JpZ2luVXJsO1xuICB9XG5cbiAgZ2V0Q29udGVudFBvbGljeVR5cGUoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGV0YWlscy50eXBlO1xuICB9XG5cbiAgaXNGdWxsUGFnZSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRDb250ZW50UG9saWN5VHlwZSgpID09PSA2O1xuICB9XG5cbiAgZ2V0Q29va2llRGF0YSgpIHtcbiAgICByZXR1cm4gdGhpcy5nZXRSZXF1ZXN0SGVhZGVyKCdDb29raWUnKTtcbiAgfVxuXG4gIGdldFJlZmVycmVyKCkge1xuICAgIHJldHVybiB0aGlzLmdldFJlcXVlc3RIZWFkZXIoJ1JlZmVyZXInKTtcbiAgfVxuXG4gIGdldFJlcXVlc3RIZWFkZXIoaGVhZGVyKSB7XG4gICAgcmV0dXJuIHRoaXMuZGV0YWlscy5nZXRSZXF1ZXN0SGVhZGVyKGhlYWRlcik7XG4gIH1cblxuICBnZXRSZXNwb25zZUhlYWRlcihoZWFkZXIpIHtcbiAgICByZXR1cm4gdGhpcy5kZXRhaWxzLmdldFJlc3BvbnNlSGVhZGVyKGhlYWRlcik7XG4gIH1cblxuICBnZXRPcmlnaW5XaW5kb3dJRCgpIHtcbiAgICByZXR1cm4gdGhpcy5kZXRhaWxzLnRhYklkO1xuICB9XG5cbiAgaXNDaGFubmVsUHJpdmF0ZSgpIHtcbiAgICByZXR1cm4gdGhpcy5kZXRhaWxzLmlzUHJpdmF0ZTtcbiAgfVxuXG4gIGdldFBvc3REYXRhKCkge1xuICAgIHJldHVybiB0aGlzLmRldGFpbHMuZ2V0UG9zdERhdGEoKTtcbiAgfVxuXG59XG4iXX0=