System.register('tests/autocomplete/unit/url-compare-test', [], function (_export) {
  'use strict';

  var expect;
  return {
    setters: [],
    execute: function () {
      expect = chai.expect;

      _export('default', describeModule("autocomplete/url-compare", function () {
        return {};
      }, function () {
        describe('sameUrls', function () {
          it('returns same if identical', function () {
            var url = 'http://www.facebook.com/';
            expect(this.module()['default'].sameUrls(url, url)).to.be['true'];
          });

          it('returns same if identical except www', function () {
            var url1 = 'http://facebook.com/';
            var url2 = 'http://www.facebook.com/';
            expect(this.module()['default'].sameUrls(url1, url2)).to.be['true'];
          });

          it('returns same if identical except http', function () {
            var url1 = 'http://www.facebook.com/';
            var url2 = 'https://www.facebook.com/';
            expect(this.module()['default'].sameUrls(url1, url2)).to.be['true'];
          });

          it('returns same if identical except no scheme', function () {
            var url1 = 'www.facebook.com/';
            var url2 = 'https://www.facebook.com/';
            expect(this.module()['default'].sameUrls(url1, url2)).to.be['true'];
          });

          it('returns same if identical except no scheme and no www', function () {
            var url1 = 'facebook.com/';
            var url2 = 'https://www.facebook.com/';
            expect(this.module()['default'].sameUrls(url1, url2)).to.be['true'];
          });

          it('returns same if identical except country code in domain', function () {
            var url1 = 'de.facebook.com/';
            var url2 = 'www.facebook.com/';
            expect(this.module()['default'].sameUrls(url1, url2)).to.be['true'];
          });

          it('returns same if identical except country code in path', function () {
            var url1 = 'www.facebook.com/de';
            var url2 = 'www.facebook.com/';
            expect(this.module()['default'].sameUrls(url1, url2)).to.be['true'];
          });

          it('returns same if identical except country code in domain facebook-style', function () {
            var url1 = 'de-de.facebook.com/';
            var url2 = 'www.facebook.com/';
            expect(this.module()['default'].sameUrls(url1, url2)).to.be['true'];
          });

          it('returns same if identical except trailing slash', function () {
            var url1 = 'http://www.facebook.com';
            var url2 = 'http://www.facebook.com/';
            expect(this.module()['default'].sameUrls(url1, url2)).to.be['true'];
          });

          it('returns not same if different domain', function () {
            var url1 = 'http://www.facebook.com/';
            var url2 = 'http://www.google.com/';
            expect(this.module()['default'].sameUrls(url1, url2)).to.be['false'];
          });
        });
      }));
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3RzL2F1dG9jb21wbGV0ZS91bml0L3VybC1jb21wYXJlLXRlc3QuZXMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O01BQUksTUFBTTs7OztBQUFOLFlBQU0sR0FBRyxJQUFJLENBQUMsTUFBTTs7eUJBRVQsY0FBYyxDQUFDLDBCQUEwQixFQUN0RCxZQUFZO0FBQ1YsZUFBTyxFQUNOLENBQUE7T0FDRixFQUNELFlBQVk7QUFDVixnQkFBUSxDQUFDLFVBQVUsRUFBRSxZQUFZO0FBQy9CLFlBQUUsQ0FBQywyQkFBMkIsRUFBRSxZQUFZO0FBQzFDLGdCQUFJLEdBQUcsR0FBRywwQkFBMEIsQ0FBQztBQUNyQyxrQkFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsV0FBUSxDQUFDLFFBQVEsQ0FBQyxHQUFHLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFLLENBQUM7V0FDN0QsQ0FBQyxDQUFDOztBQUVILFlBQUUsQ0FBQyxzQ0FBc0MsRUFBRSxZQUFZO0FBQ3JELGdCQUFJLElBQUksR0FBRyxzQkFBc0IsQ0FBQztBQUNsQyxnQkFBSSxJQUFJLEdBQUcsMEJBQTBCLENBQUM7QUFDdEMsa0JBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFdBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsUUFBSyxDQUFDO1dBQy9ELENBQUMsQ0FBQzs7QUFFSCxZQUFFLENBQUMsdUNBQXVDLEVBQUUsWUFBWTtBQUN0RCxnQkFBSSxJQUFJLEdBQUcsMEJBQTBCLENBQUM7QUFDdEMsZ0JBQUksSUFBSSxHQUFHLDJCQUEyQixDQUFDO0FBQ3ZDLGtCQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxXQUFRLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQUssQ0FBQztXQUMvRCxDQUFDLENBQUM7O0FBRUgsWUFBRSxDQUFDLDRDQUE0QyxFQUFFLFlBQVk7QUFDM0QsZ0JBQUksSUFBSSxHQUFHLG1CQUFtQixDQUFDO0FBQy9CLGdCQUFJLElBQUksR0FBRywyQkFBMkIsQ0FBQztBQUN2QyxrQkFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsV0FBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFLLENBQUM7V0FDL0QsQ0FBQyxDQUFDOztBQUVILFlBQUUsQ0FBQyx1REFBdUQsRUFBRSxZQUFZO0FBQ3RFLGdCQUFJLElBQUksR0FBRyxlQUFlLENBQUM7QUFDM0IsZ0JBQUksSUFBSSxHQUFHLDJCQUEyQixDQUFDO0FBQ3ZDLGtCQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxXQUFRLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQUssQ0FBQztXQUMvRCxDQUFDLENBQUM7O0FBRUgsWUFBRSxDQUFDLHlEQUF5RCxFQUFFLFlBQVk7QUFDeEUsZ0JBQUksSUFBSSxHQUFHLGtCQUFrQixDQUFDO0FBQzlCLGdCQUFJLElBQUksR0FBRyxtQkFBbUIsQ0FBQztBQUMvQixrQkFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsV0FBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFLLENBQUM7V0FDL0QsQ0FBQyxDQUFDOztBQUVILFlBQUUsQ0FBQyx1REFBdUQsRUFBRSxZQUFZO0FBQ3RFLGdCQUFJLElBQUksR0FBRyxxQkFBcUIsQ0FBQztBQUNqQyxnQkFBSSxJQUFJLEdBQUcsbUJBQW1CLENBQUM7QUFDL0Isa0JBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFdBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsUUFBSyxDQUFDO1dBQy9ELENBQUMsQ0FBQzs7QUFFSCxZQUFFLENBQUMsd0VBQXdFLEVBQUUsWUFBWTtBQUN2RixnQkFBSSxJQUFJLEdBQUcscUJBQXFCLENBQUM7QUFDakMsZ0JBQUksSUFBSSxHQUFHLG1CQUFtQixDQUFDO0FBQy9CLGtCQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sRUFBRSxXQUFRLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLFFBQUssQ0FBQztXQUMvRCxDQUFDLENBQUM7O0FBRUgsWUFBRSxDQUFDLGlEQUFpRCxFQUFFLFlBQVk7QUFDaEUsZ0JBQUksSUFBSSxHQUFHLHlCQUF5QixDQUFDO0FBQ3JDLGdCQUFJLElBQUksR0FBRywwQkFBMEIsQ0FBQztBQUN0QyxrQkFBTSxDQUFDLElBQUksQ0FBQyxNQUFNLEVBQUUsV0FBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxRQUFLLENBQUM7V0FDL0QsQ0FBQyxDQUFDOztBQUVILFlBQUUsQ0FBQyxzQ0FBc0MsRUFBRSxZQUFZO0FBQ3JELGdCQUFJLElBQUksR0FBRywwQkFBMEIsQ0FBQztBQUN0QyxnQkFBSSxJQUFJLEdBQUcsd0JBQXdCLENBQUM7QUFDcEMsa0JBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFFLFdBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUUsU0FBTSxDQUFDO1dBQ2hFLENBQUMsQ0FBQztTQUNKLENBQUMsQ0FBQztPQUNKLENBQ0YiLCJmaWxlIjoidGVzdHMvYXV0b2NvbXBsZXRlL3VuaXQvdXJsLWNvbXBhcmUtdGVzdC5lcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuZXhwb3J0IGRlZmF1bHQgZGVzY3JpYmVNb2R1bGUoXCJhdXRvY29tcGxldGUvdXJsLWNvbXBhcmVcIixcbiAgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgfVxuICB9LFxuICBmdW5jdGlvbiAoKSB7XG4gICAgZGVzY3JpYmUoJ3NhbWVVcmxzJywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3JldHVybnMgc2FtZSBpZiBpZGVudGljYWwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1cmwgPSAnaHR0cDovL3d3dy5mYWNlYm9vay5jb20vJztcbiAgICAgICAgZXhwZWN0KHRoaXMubW9kdWxlKCkuZGVmYXVsdC5zYW1lVXJscyh1cmwsIHVybCkpLnRvLmJlLnRydWU7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3JldHVybnMgc2FtZSBpZiBpZGVudGljYWwgZXhjZXB0IHd3dycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHVybDEgPSAnaHR0cDovL2ZhY2Vib29rLmNvbS8nO1xuICAgICAgICB2YXIgdXJsMiA9ICdodHRwOi8vd3d3LmZhY2Vib29rLmNvbS8nO1xuICAgICAgICBleHBlY3QodGhpcy5tb2R1bGUoKS5kZWZhdWx0LnNhbWVVcmxzKHVybDEsIHVybDIpKS50by5iZS50cnVlO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdyZXR1cm5zIHNhbWUgaWYgaWRlbnRpY2FsIGV4Y2VwdCBodHRwJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdXJsMSA9ICdodHRwOi8vd3d3LmZhY2Vib29rLmNvbS8nO1xuICAgICAgICB2YXIgdXJsMiA9ICdodHRwczovL3d3dy5mYWNlYm9vay5jb20vJztcbiAgICAgICAgZXhwZWN0KHRoaXMubW9kdWxlKCkuZGVmYXVsdC5zYW1lVXJscyh1cmwxLCB1cmwyKSkudG8uYmUudHJ1ZTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgncmV0dXJucyBzYW1lIGlmIGlkZW50aWNhbCBleGNlcHQgbm8gc2NoZW1lJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdXJsMSA9ICd3d3cuZmFjZWJvb2suY29tLyc7XG4gICAgICAgIHZhciB1cmwyID0gJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS8nO1xuICAgICAgICBleHBlY3QodGhpcy5tb2R1bGUoKS5kZWZhdWx0LnNhbWVVcmxzKHVybDEsIHVybDIpKS50by5iZS50cnVlO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdyZXR1cm5zIHNhbWUgaWYgaWRlbnRpY2FsIGV4Y2VwdCBubyBzY2hlbWUgYW5kIG5vIHd3dycsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHVybDEgPSAnZmFjZWJvb2suY29tLyc7XG4gICAgICAgIHZhciB1cmwyID0gJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS8nO1xuICAgICAgICBleHBlY3QodGhpcy5tb2R1bGUoKS5kZWZhdWx0LnNhbWVVcmxzKHVybDEsIHVybDIpKS50by5iZS50cnVlO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdyZXR1cm5zIHNhbWUgaWYgaWRlbnRpY2FsIGV4Y2VwdCBjb3VudHJ5IGNvZGUgaW4gZG9tYWluJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdXJsMSA9ICdkZS5mYWNlYm9vay5jb20vJztcbiAgICAgICAgdmFyIHVybDIgPSAnd3d3LmZhY2Vib29rLmNvbS8nO1xuICAgICAgICBleHBlY3QodGhpcy5tb2R1bGUoKS5kZWZhdWx0LnNhbWVVcmxzKHVybDEsIHVybDIpKS50by5iZS50cnVlO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdyZXR1cm5zIHNhbWUgaWYgaWRlbnRpY2FsIGV4Y2VwdCBjb3VudHJ5IGNvZGUgaW4gcGF0aCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHVybDEgPSAnd3d3LmZhY2Vib29rLmNvbS9kZSc7XG4gICAgICAgIHZhciB1cmwyID0gJ3d3dy5mYWNlYm9vay5jb20vJztcbiAgICAgICAgZXhwZWN0KHRoaXMubW9kdWxlKCkuZGVmYXVsdC5zYW1lVXJscyh1cmwxLCB1cmwyKSkudG8uYmUudHJ1ZTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgncmV0dXJucyBzYW1lIGlmIGlkZW50aWNhbCBleGNlcHQgY291bnRyeSBjb2RlIGluIGRvbWFpbiBmYWNlYm9vay1zdHlsZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHVybDEgPSAnZGUtZGUuZmFjZWJvb2suY29tLyc7XG4gICAgICAgIHZhciB1cmwyID0gJ3d3dy5mYWNlYm9vay5jb20vJztcbiAgICAgICAgZXhwZWN0KHRoaXMubW9kdWxlKCkuZGVmYXVsdC5zYW1lVXJscyh1cmwxLCB1cmwyKSkudG8uYmUudHJ1ZTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgncmV0dXJucyBzYW1lIGlmIGlkZW50aWNhbCBleGNlcHQgdHJhaWxpbmcgc2xhc2gnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1cmwxID0gJ2h0dHA6Ly93d3cuZmFjZWJvb2suY29tJztcbiAgICAgICAgdmFyIHVybDIgPSAnaHR0cDovL3d3dy5mYWNlYm9vay5jb20vJztcbiAgICAgICAgZXhwZWN0KHRoaXMubW9kdWxlKCkuZGVmYXVsdC5zYW1lVXJscyh1cmwxLCB1cmwyKSkudG8uYmUudHJ1ZTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgncmV0dXJucyBub3Qgc2FtZSBpZiBkaWZmZXJlbnQgZG9tYWluJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdXJsMSA9ICdodHRwOi8vd3d3LmZhY2Vib29rLmNvbS8nO1xuICAgICAgICB2YXIgdXJsMiA9ICdodHRwOi8vd3d3Lmdvb2dsZS5jb20vJztcbiAgICAgICAgZXhwZWN0KHRoaXMubW9kdWxlKCkuZGVmYXVsdC5zYW1lVXJscyh1cmwxLCB1cmwyKSkudG8uYmUuZmFsc2U7XG4gICAgICB9KTtcbiAgICB9KTtcbiAgfVxuKTtcbiJdfQ==