System.register('tests/mobile-history/history-test', [], function (_export) {
  'use strict';

  return {
    setters: [],
    execute: function () {
      _export('default', describeModule('mobile-history/history', function () {
        return {
          'mobile-touch/longpress': {
            'default': { onTap: function onTap() {}, onLongPress: function onLongPress() {} }
          },
          'core/utils': { 'default': {} },
          'core/templates': { 'default': { tplCache: {} } },
          'core/mobile-webview': {
            document: {
              body: {},
              documentElement: {},
              getElementById: function getElementById() {
                return { addEventListener: function addEventListener() {} };
              }
            }
          },
          'mobile-touch/longpress': { 'default': function _default() {} }
        };
      }, function () {
        var _done = undefined;
        beforeEach(function () {
          var _this = this;

          this.module()['default'].displayData = function (data) {
            return _this.module()['default'].sendShowTelemetry(data);
          };
          this.deps('core/utils')['default'].getLocalStorage = function (_) {
            return { getObject: function getObject() {
                return [];
              } };
          };
          this.deps('core/utils')['default'].telemetry = function (msg) {
            chai.expect(msg).to.be.ok;
            chai.expect(msg.action).to.equal('show');
            _done();
          };
          this.deps('core/templates')['default'].tplCache.conversations = function (_) {};
        });
        describe('Telemetry', function () {
          it('Should send show telemetry signal for history', function (done) {
            _done = done;
            this.module()['default'].showHistory([]);
          });
          it('Should send show telemetry signal for favorites', function (done) {
            _done = done;
            this.module()['default'].showFavorites([]);
          });
        });
      }));
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3RzL21vYmlsZS1oaXN0b3J5L2hpc3RvcnktdGVzdC5lcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7eUJBQWUsY0FBYyxDQUFDLHdCQUF3QixFQUNwRCxZQUFZO0FBQ1YsZUFBTztBQUNMLGtDQUF3QixFQUFFO0FBQ3hCLHVCQUFTLEVBQUUsS0FBSyxFQUFBLGlCQUFHLEVBQUcsRUFBRSxXQUFXLEVBQUEsdUJBQUcsRUFBRyxFQUFFO1dBQzVDO0FBQ0Qsc0JBQVksRUFBRSxFQUFFLFdBQVMsRUFBRyxFQUFFO0FBQzlCLDBCQUFnQixFQUFFLEVBQUUsV0FBUyxFQUFFLFFBQVEsRUFBRSxFQUFHLEVBQUUsRUFBRTtBQUNoRCwrQkFBcUIsRUFBRTtBQUNyQixvQkFBUSxFQUFFO0FBQ1Isa0JBQUksRUFBRSxFQUFHO0FBQ1QsNkJBQWUsRUFBRSxFQUFHO0FBQ3BCLDRCQUFjLEVBQUEsMEJBQUc7QUFBRSx1QkFBTyxFQUFFLGdCQUFnQixFQUFBLDRCQUFHLEVBQUcsRUFBRSxDQUFDO2VBQUU7YUFDeEQ7V0FDRjtBQUNELGtDQUF3QixFQUFFLEVBQUUsV0FBTyxvQkFBRyxFQUFHLEVBQUU7U0FDNUMsQ0FBQztPQUNILEVBQ0QsWUFBWTtBQUNWLFlBQUksS0FBSyxZQUFBLENBQUM7QUFDVixrQkFBVSxDQUFDLFlBQVk7OztBQUNyQixjQUFJLENBQUMsTUFBTSxFQUFFLFdBQVEsQ0FBQyxXQUFXLEdBQUcsVUFBQSxJQUFJO21CQUFJLE1BQUssTUFBTSxFQUFFLFdBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxJQUFJLENBQUM7V0FBQSxDQUFDO0FBQzFGLGNBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVEsQ0FBQyxlQUFlLEdBQUcsVUFBQSxDQUFDLEVBQUs7QUFDdEQsbUJBQU8sRUFBRSxTQUFTLEVBQUEscUJBQUc7QUFBRSx1QkFBTyxFQUFFLENBQUM7ZUFBRSxFQUFFLENBQUM7V0FDdkMsQ0FBQztBQUNGLGNBQUksQ0FBQyxJQUFJLENBQUMsWUFBWSxDQUFDLFdBQVEsQ0FBQyxTQUFTLEdBQUcsVUFBQSxHQUFHLEVBQUk7QUFDakQsZ0JBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUM7QUFDMUIsZ0JBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7QUFDekMsaUJBQUssRUFBRSxDQUFDO1dBQ1QsQ0FBQztBQUNGLGNBQUksQ0FBQyxJQUFJLENBQUMsZ0JBQWdCLENBQUMsV0FBUSxDQUFDLFFBQVEsQ0FBQyxhQUFhLEdBQUcsVUFBQSxDQUFDLEVBQUksRUFBRSxDQUFBO1NBQ3JFLENBQUMsQ0FBQztBQUNILGdCQUFRLENBQUMsV0FBVyxFQUFFLFlBQVk7QUFDaEMsWUFBRSxDQUFDLCtDQUErQyxFQUFFLFVBQVUsSUFBSSxFQUFFO0FBQ2xFLGlCQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2IsZ0JBQUksQ0FBQyxNQUFNLEVBQUUsV0FBUSxDQUFDLFdBQVcsQ0FBQyxFQUFFLENBQUMsQ0FBQztXQUN2QyxDQUFDLENBQUM7QUFDSCxZQUFFLENBQUMsaURBQWlELEVBQUUsVUFBVSxJQUFJLEVBQUU7QUFDcEUsaUJBQUssR0FBRyxJQUFJLENBQUM7QUFDYixnQkFBSSxDQUFDLE1BQU0sRUFBRSxXQUFRLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1dBQ3pDLENBQUMsQ0FBQztTQUNKLENBQUMsQ0FBQztPQUNKLENBQ0YiLCJmaWxlIjoidGVzdHMvbW9iaWxlLWhpc3RvcnkvaGlzdG9yeS10ZXN0LmVzIiwic291cmNlc0NvbnRlbnQiOlsiZXhwb3J0IGRlZmF1bHQgZGVzY3JpYmVNb2R1bGUoJ21vYmlsZS1oaXN0b3J5L2hpc3RvcnknLFxuICBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICdtb2JpbGUtdG91Y2gvbG9uZ3ByZXNzJzoge1xuICAgICAgICBkZWZhdWx0OiB7IG9uVGFwKCkgeyB9LCBvbkxvbmdQcmVzcygpIHsgfSB9XG4gICAgICB9LFxuICAgICAgJ2NvcmUvdXRpbHMnOiB7IGRlZmF1bHQ6IHsgfSB9LFxuICAgICAgJ2NvcmUvdGVtcGxhdGVzJzogeyBkZWZhdWx0OiB7IHRwbENhY2hlOiB7IH0gfSB9LFxuICAgICAgJ2NvcmUvbW9iaWxlLXdlYnZpZXcnOiB7IFxuICAgICAgICBkb2N1bWVudDogeyBcbiAgICAgICAgICBib2R5OiB7IH0sIFxuICAgICAgICAgIGRvY3VtZW50RWxlbWVudDogeyB9LCBcbiAgICAgICAgICBnZXRFbGVtZW50QnlJZCgpIHsgcmV0dXJuIHsgYWRkRXZlbnRMaXN0ZW5lcigpIHsgfSB9OyB9IFxuICAgICAgICB9IFxuICAgICAgfSxcbiAgICAgICdtb2JpbGUtdG91Y2gvbG9uZ3ByZXNzJzogeyBkZWZhdWx0KCkgeyB9IH1cbiAgICB9O1xuICB9LFxuICBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IF9kb25lO1xuICAgIGJlZm9yZUVhY2goZnVuY3Rpb24gKCkge1xuICAgICAgdGhpcy5tb2R1bGUoKS5kZWZhdWx0LmRpc3BsYXlEYXRhID0gZGF0YSA9PiB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuc2VuZFNob3dUZWxlbWV0cnkoZGF0YSk7IFxuICAgICAgdGhpcy5kZXBzKCdjb3JlL3V0aWxzJykuZGVmYXVsdC5nZXRMb2NhbFN0b3JhZ2UgPSBfICA9PiB7IFxuICAgICAgICByZXR1cm4geyBnZXRPYmplY3QoKSB7IHJldHVybiBbXTsgfSB9O1xuICAgICAgfTtcbiAgICAgIHRoaXMuZGVwcygnY29yZS91dGlscycpLmRlZmF1bHQudGVsZW1ldHJ5ID0gbXNnID0+IHtcbiAgICAgICAgY2hhaS5leHBlY3QobXNnKS50by5iZS5vaztcbiAgICAgICAgY2hhaS5leHBlY3QobXNnLmFjdGlvbikudG8uZXF1YWwoJ3Nob3cnKTtcbiAgICAgICAgX2RvbmUoKTtcbiAgICAgIH07XG4gICAgICB0aGlzLmRlcHMoJ2NvcmUvdGVtcGxhdGVzJykuZGVmYXVsdC50cGxDYWNoZS5jb252ZXJzYXRpb25zID0gXyA9PiB7fVxuICAgIH0pO1xuICAgIGRlc2NyaWJlKCdUZWxlbWV0cnknLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpdCgnU2hvdWxkIHNlbmQgc2hvdyB0ZWxlbWV0cnkgc2lnbmFsIGZvciBoaXN0b3J5JywgZnVuY3Rpb24gKGRvbmUpIHtcbiAgICAgICAgX2RvbmUgPSBkb25lO1xuICAgICAgICB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuc2hvd0hpc3RvcnkoW10pO1xuICAgICAgfSk7XG4gICAgICBpdCgnU2hvdWxkIHNlbmQgc2hvdyB0ZWxlbWV0cnkgc2lnbmFsIGZvciBmYXZvcml0ZXMnLCBmdW5jdGlvbiAoZG9uZSkge1xuICAgICAgICBfZG9uZSA9IGRvbmU7XG4gICAgICAgIHRoaXMubW9kdWxlKCkuZGVmYXVsdC5zaG93RmF2b3JpdGVzKFtdKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4pOyJdfQ==