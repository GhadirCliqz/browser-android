System.register('tests/mobile-history/history-test', [], function (_export) {
  'use strict';

  return {
    setters: [],
    execute: function () {
      _export('default', describeModule('mobile-history/history', function () {
        return {
          'core/utils': { 'default': {} },
          'core/templates': { 'default': { tplCache: {} } },
          'mobile-history/webview': {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3RzL21vYmlsZS1oaXN0b3J5L2hpc3RvcnktdGVzdC5lcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7eUJBQWUsY0FBYyxDQUFDLHdCQUF3QixFQUNwRCxZQUFZO0FBQ1YsZUFBTztBQUNMLHNCQUFZLEVBQUUsRUFBRSxXQUFTLEVBQUcsRUFBRTtBQUM5QiwwQkFBZ0IsRUFBRSxFQUFFLFdBQVMsRUFBRSxRQUFRLEVBQUUsRUFBRyxFQUFFLEVBQUU7QUFDaEQsa0NBQXdCLEVBQUU7QUFDeEIsb0JBQVEsRUFBRTtBQUNSLGtCQUFJLEVBQUUsRUFBRztBQUNULDZCQUFlLEVBQUUsRUFBRztBQUNwQiw0QkFBYyxFQUFBLDBCQUFHO0FBQUUsdUJBQU8sRUFBRSxnQkFBZ0IsRUFBQSw0QkFBRyxFQUFHLEVBQUUsQ0FBQztlQUFFO2FBQ3hEO1dBQ0Y7QUFDRCxrQ0FBd0IsRUFBRSxFQUFFLFdBQU8sb0JBQUcsRUFBRyxFQUFFO1NBQzVDLENBQUM7T0FDSCxFQUNELFlBQVk7QUFDVixZQUFJLEtBQUssWUFBQSxDQUFDO0FBQ1Ysa0JBQVUsQ0FBQyxZQUFZOzs7QUFDckIsY0FBSSxDQUFDLE1BQU0sRUFBRSxXQUFRLENBQUMsV0FBVyxHQUFHLFVBQUEsSUFBSTttQkFBSSxNQUFLLE1BQU0sRUFBRSxXQUFRLENBQUMsaUJBQWlCLENBQUMsSUFBSSxDQUFDO1dBQUEsQ0FBQztBQUMxRixjQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFRLENBQUMsZUFBZSxHQUFHLFVBQUEsQ0FBQyxFQUFLO0FBQ3RELG1CQUFPLEVBQUUsU0FBUyxFQUFBLHFCQUFHO0FBQUUsdUJBQU8sRUFBRSxDQUFDO2VBQUUsRUFBRSxDQUFDO1dBQ3ZDLENBQUM7QUFDRixjQUFJLENBQUMsSUFBSSxDQUFDLFlBQVksQ0FBQyxXQUFRLENBQUMsU0FBUyxHQUFHLFVBQUEsR0FBRyxFQUFJO0FBQ2pELGdCQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDO0FBQzFCLGdCQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0FBQ3pDLGlCQUFLLEVBQUUsQ0FBQztXQUNULENBQUM7QUFDRixjQUFJLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLFdBQVEsQ0FBQyxRQUFRLENBQUMsYUFBYSxHQUFHLFVBQUEsQ0FBQyxFQUFJLEVBQUUsQ0FBQTtTQUNyRSxDQUFDLENBQUM7QUFDSCxnQkFBUSxDQUFDLFdBQVcsRUFBRSxZQUFZO0FBQ2hDLFlBQUUsQ0FBQywrQ0FBK0MsRUFBRSxVQUFVLElBQUksRUFBRTtBQUNsRSxpQkFBSyxHQUFHLElBQUksQ0FBQztBQUNiLGdCQUFJLENBQUMsTUFBTSxFQUFFLFdBQVEsQ0FBQyxXQUFXLENBQUMsRUFBRSxDQUFDLENBQUM7V0FDdkMsQ0FBQyxDQUFDO0FBQ0gsWUFBRSxDQUFDLGlEQUFpRCxFQUFFLFVBQVUsSUFBSSxFQUFFO0FBQ3BFLGlCQUFLLEdBQUcsSUFBSSxDQUFDO0FBQ2IsZ0JBQUksQ0FBQyxNQUFNLEVBQUUsV0FBUSxDQUFDLGFBQWEsQ0FBQyxFQUFFLENBQUMsQ0FBQztXQUN6QyxDQUFDLENBQUM7U0FDSixDQUFDLENBQUM7T0FDSixDQUNGIiwiZmlsZSI6InRlc3RzL21vYmlsZS1oaXN0b3J5L2hpc3RvcnktdGVzdC5lcyIsInNvdXJjZXNDb250ZW50IjpbImV4cG9ydCBkZWZhdWx0IGRlc2NyaWJlTW9kdWxlKCdtb2JpbGUtaGlzdG9yeS9oaXN0b3J5JyxcbiAgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICAnY29yZS91dGlscyc6IHsgZGVmYXVsdDogeyB9IH0sXG4gICAgICAnY29yZS90ZW1wbGF0ZXMnOiB7IGRlZmF1bHQ6IHsgdHBsQ2FjaGU6IHsgfSB9IH0sXG4gICAgICAnbW9iaWxlLWhpc3Rvcnkvd2Vidmlldyc6IHsgXG4gICAgICAgIGRvY3VtZW50OiB7IFxuICAgICAgICAgIGJvZHk6IHsgfSwgXG4gICAgICAgICAgZG9jdW1lbnRFbGVtZW50OiB7IH0sIFxuICAgICAgICAgIGdldEVsZW1lbnRCeUlkKCkgeyByZXR1cm4geyBhZGRFdmVudExpc3RlbmVyKCkgeyB9IH07IH0gXG4gICAgICAgIH0gXG4gICAgICB9LFxuICAgICAgJ21vYmlsZS10b3VjaC9sb25ncHJlc3MnOiB7IGRlZmF1bHQoKSB7IH0gfVxuICAgIH07XG4gIH0sXG4gIGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgX2RvbmU7XG4gICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuZGlzcGxheURhdGEgPSBkYXRhID0+IHRoaXMubW9kdWxlKCkuZGVmYXVsdC5zZW5kU2hvd1RlbGVtZXRyeShkYXRhKTsgXG4gICAgICB0aGlzLmRlcHMoJ2NvcmUvdXRpbHMnKS5kZWZhdWx0LmdldExvY2FsU3RvcmFnZSA9IF8gID0+IHsgXG4gICAgICAgIHJldHVybiB7IGdldE9iamVjdCgpIHsgcmV0dXJuIFtdOyB9IH07XG4gICAgICB9O1xuICAgICAgdGhpcy5kZXBzKCdjb3JlL3V0aWxzJykuZGVmYXVsdC50ZWxlbWV0cnkgPSBtc2cgPT4ge1xuICAgICAgICBjaGFpLmV4cGVjdChtc2cpLnRvLmJlLm9rO1xuICAgICAgICBjaGFpLmV4cGVjdChtc2cuYWN0aW9uKS50by5lcXVhbCgnc2hvdycpO1xuICAgICAgICBfZG9uZSgpO1xuICAgICAgfTtcbiAgICAgIHRoaXMuZGVwcygnY29yZS90ZW1wbGF0ZXMnKS5kZWZhdWx0LnRwbENhY2hlLmNvbnZlcnNhdGlvbnMgPSBfID0+IHt9XG4gICAgfSk7XG4gICAgZGVzY3JpYmUoJ1RlbGVtZXRyeScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdTaG91bGQgc2VuZCBzaG93IHRlbGVtZXRyeSBzaWduYWwgZm9yIGhpc3RvcnknLCBmdW5jdGlvbiAoZG9uZSkge1xuICAgICAgICBfZG9uZSA9IGRvbmU7XG4gICAgICAgIHRoaXMubW9kdWxlKCkuZGVmYXVsdC5zaG93SGlzdG9yeShbXSk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdTaG91bGQgc2VuZCBzaG93IHRlbGVtZXRyeSBzaWduYWwgZm9yIGZhdm9yaXRlcycsIGZ1bmN0aW9uIChkb25lKSB7XG4gICAgICAgIF9kb25lID0gZG9uZTtcbiAgICAgICAgdGhpcy5tb2R1bGUoKS5kZWZhdWx0LnNob3dGYXZvcml0ZXMoW10pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbik7Il19