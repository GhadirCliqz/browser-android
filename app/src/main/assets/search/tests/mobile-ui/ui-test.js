System.register('tests/mobile-ui/ui-test', [], function (_export) {
  /* global chai, describeModule */

  'use strict';

  return {
    setters: [],
    execute: function () {
      _export('default', describeModule('mobile-ui/UI', function () {
        return {
          'core/mobile-webview': {
            window: {
              addEventListener: function addEventListener() {}
            }
          },
          'core/templates': {
            'default': {
              TEMPLATES: []
            }
          }
        };
      }, function () {
        var NO_MOBILE_URL_RESULT = {
          'val': 'http://www.onmeda.de/krankheiten/magersucht.html'
        };
        var MOBILE_URL_RESULT = {
          'val': 'http://www.onmeda.de/krankheiten/magersucht.html',
          'data': {
            'mobile_url': 'http://www.onmeda.de/amp/krankheiten/magersucht.html'
          }
        };
        var M_URL_RESULT = {
          'internal_links': [{
            'm_url': 'http://de.m.wikipedia.org/wiki/Thom_Yorke#Leben',
            'title': 'Leben',
            'url': 'http://de.wikipedia.org/wiki/Thom_Yorke#Leben'
          }, {
            'm_url': 'http://de.m.wikipedia.org/wiki/Thom_Yorke#K.C3.BCnstlerischer_Werdegang',
            'title': 'Künstlerischer Werdegang',
            'url': 'http://de.wikipedia.org/wiki/Thom_Yorke#K.C3.BCnstlerischer_Werdegang'
          }, {
            'm_url': 'http://de.m.wikipedia.org/wiki/Thom_Yorke#Diskografie',
            'title': 'Diskografie',
            'url': 'http://de.wikipedia.org/wiki/Thom_Yorke#Diskografie'
          }, {
            'm_url': 'http://de.m.wikipedia.org/wiki/Thom_Yorke#Weblinks',
            'title': 'Weblinks',
            'url': 'http://de.wikipedia.org/wiki/Thom_Yorke#Weblinks'
          }, {
            'm_url': 'http://de.m.wikipedia.org/wiki/Thom_Yorke#Quellen',
            'title': 'Quellen',
            'url': 'http://de.wikipedia.org/wiki/Thom_Yorke#Quellen'
          }]
        };
        describe('Set Mobile urls', function () {
          it('should not replace val if no mobile url supported', function () {
            this.module()['default'].setMobileBasedUrls(NO_MOBILE_URL_RESULT);
            chai.expect(NO_MOBILE_URL_RESULT.val).to.equal('http://www.onmeda.de/krankheiten/magersucht.html');
          });
          it('should set val with amp_url', function () {
            this.module()['default'].setMobileBasedUrls(MOBILE_URL_RESULT);
            chai.expect(MOBILE_URL_RESULT.val).to.equal('http://www.onmeda.de/amp/krankheiten/magersucht.html');
          });
          it('should set links url with m_url', function () {
            this.module()['default'].setMobileBasedUrls(M_URL_RESULT);
            M_URL_RESULT.internal_links.forEach(function (link) {
              return chai.expect(link.url).to.equal(link.m_url);
            });
          });
        });
      }));
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3RzL21vYmlsZS11aS91aS10ZXN0LmVzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O3lCQUVlLGNBQWMsQ0FBQyxjQUFjLEVBQzFDLFlBQVk7QUFDVixlQUFPO0FBQ0wsK0JBQXFCLEVBQUU7QUFDckIsa0JBQU0sRUFBRTtBQUNOLDhCQUFnQixFQUFBLDRCQUFHLEVBQUc7YUFDdkI7V0FDRjtBQUNELDBCQUFnQixFQUFFO0FBQ2hCLHVCQUFTO0FBQ1AsdUJBQVMsRUFBRSxFQUFFO2FBQ2Q7V0FDRjtTQUNGLENBQUM7T0FDSCxFQUNELFlBQVk7QUFDVixZQUFJLG9CQUFvQixHQUFHO0FBQ3pCLGVBQUssRUFBRSxrREFBa0Q7U0FDMUQsQ0FBQztBQUNGLFlBQUksaUJBQWlCLEdBQUc7QUFDdEIsZUFBSyxFQUFFLGtEQUFrRDtBQUN6RCxnQkFBTSxFQUFFO0FBQ04sd0JBQVksRUFBRSxzREFBc0Q7V0FDckU7U0FDRixDQUFDO0FBQ0YsWUFBSSxZQUFZLEdBQUc7QUFDakIsMEJBQWdCLEVBQUUsQ0FDaEI7QUFDRSxtQkFBTyxFQUFFLGlEQUFpRDtBQUMxRCxtQkFBTyxFQUFFLE9BQU87QUFDaEIsaUJBQUssRUFBRSwrQ0FBK0M7V0FDdkQsRUFDRDtBQUNFLG1CQUFPLEVBQUUseUVBQXlFO0FBQ2xGLG1CQUFPLEVBQUUsMEJBQTBCO0FBQ25DLGlCQUFLLEVBQUUsdUVBQXVFO1dBQy9FLEVBQ0Q7QUFDRSxtQkFBTyxFQUFFLHVEQUF1RDtBQUNoRSxtQkFBTyxFQUFFLGFBQWE7QUFDdEIsaUJBQUssRUFBRSxxREFBcUQ7V0FDN0QsRUFDRDtBQUNFLG1CQUFPLEVBQUUsb0RBQW9EO0FBQzdELG1CQUFPLEVBQUUsVUFBVTtBQUNuQixpQkFBSyxFQUFFLGtEQUFrRDtXQUMxRCxFQUNEO0FBQ0UsbUJBQU8sRUFBRSxtREFBbUQ7QUFDNUQsbUJBQU8sRUFBRSxTQUFTO0FBQ2xCLGlCQUFLLEVBQUUsaURBQWlEO1dBQ3pELENBQ0Y7U0FDRixDQUFDO0FBQ0YsZ0JBQVEsQ0FBQyxpQkFBaUIsRUFBRSxZQUFZO0FBQ3RDLFlBQUUsQ0FBQyxtREFBbUQsRUFBRSxZQUFZO0FBQ2xFLGdCQUFJLENBQUMsTUFBTSxFQUFFLFdBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBQy9ELGdCQUFJLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsa0RBQWtELENBQUMsQ0FBQztXQUNwRyxDQUFDLENBQUM7QUFDSCxZQUFFLENBQUMsNkJBQTZCLEVBQUUsWUFBWTtBQUM1QyxnQkFBSSxDQUFDLE1BQU0sRUFBRSxXQUFRLENBQUMsa0JBQWtCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUM1RCxnQkFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7V0FDckcsQ0FBQyxDQUFDO0FBQ0gsWUFBRSxDQUFDLGlDQUFpQyxFQUFFLFlBQVk7QUFDaEQsZ0JBQUksQ0FBQyxNQUFNLEVBQUUsV0FBUSxDQUFDLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3ZELHdCQUFZLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxVQUFBLElBQUk7cUJBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO2FBQUEsQ0FBQyxDQUFDO1dBQ3pGLENBQUMsQ0FBQztTQUNKLENBQUMsQ0FBQztPQUNKLENBQ0YiLCJmaWxlIjoidGVzdHMvbW9iaWxlLXVpL3VpLXRlc3QuZXMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgY2hhaSwgZGVzY3JpYmVNb2R1bGUgKi9cblxuZXhwb3J0IGRlZmF1bHQgZGVzY3JpYmVNb2R1bGUoJ21vYmlsZS11aS9VSScsXG4gIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgJ2NvcmUvbW9iaWxlLXdlYnZpZXcnOiB7XG4gICAgICAgIHdpbmRvdzoge1xuICAgICAgICAgIGFkZEV2ZW50TGlzdGVuZXIoKSB7IH1cbiAgICAgICAgfVxuICAgICAgfSxcbiAgICAgICdjb3JlL3RlbXBsYXRlcyc6IHtcbiAgICAgICAgZGVmYXVsdDoge1xuICAgICAgICAgIFRFTVBMQVRFUzogW11cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH0sXG4gIGZ1bmN0aW9uICgpIHtcbiAgICBsZXQgTk9fTU9CSUxFX1VSTF9SRVNVTFQgPSB7XG4gICAgICAndmFsJzogJ2h0dHA6Ly93d3cub25tZWRhLmRlL2tyYW5raGVpdGVuL21hZ2Vyc3VjaHQuaHRtbCdcbiAgICB9O1xuICAgIGxldCBNT0JJTEVfVVJMX1JFU1VMVCA9IHtcbiAgICAgICd2YWwnOiAnaHR0cDovL3d3dy5vbm1lZGEuZGUva3JhbmtoZWl0ZW4vbWFnZXJzdWNodC5odG1sJyxcbiAgICAgICdkYXRhJzoge1xuICAgICAgICAnbW9iaWxlX3VybCc6ICdodHRwOi8vd3d3Lm9ubWVkYS5kZS9hbXAva3JhbmtoZWl0ZW4vbWFnZXJzdWNodC5odG1sJ1xuICAgICAgfVxuICAgIH07XG4gICAgbGV0IE1fVVJMX1JFU1VMVCA9IHtcbiAgICAgICdpbnRlcm5hbF9saW5rcyc6IFtcbiAgICAgICAge1xuICAgICAgICAgICdtX3VybCc6ICdodHRwOi8vZGUubS53aWtpcGVkaWEub3JnL3dpa2kvVGhvbV9Zb3JrZSNMZWJlbicsXG4gICAgICAgICAgJ3RpdGxlJzogJ0xlYmVuJyxcbiAgICAgICAgICAndXJsJzogJ2h0dHA6Ly9kZS53aWtpcGVkaWEub3JnL3dpa2kvVGhvbV9Zb3JrZSNMZWJlbidcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICdtX3VybCc6ICdodHRwOi8vZGUubS53aWtpcGVkaWEub3JnL3dpa2kvVGhvbV9Zb3JrZSNLLkMzLkJDbnN0bGVyaXNjaGVyX1dlcmRlZ2FuZycsXG4gICAgICAgICAgJ3RpdGxlJzogJ0vDvG5zdGxlcmlzY2hlciBXZXJkZWdhbmcnLFxuICAgICAgICAgICd1cmwnOiAnaHR0cDovL2RlLndpa2lwZWRpYS5vcmcvd2lraS9UaG9tX1lvcmtlI0suQzMuQkNuc3RsZXJpc2NoZXJfV2VyZGVnYW5nJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgJ21fdXJsJzogJ2h0dHA6Ly9kZS5tLndpa2lwZWRpYS5vcmcvd2lraS9UaG9tX1lvcmtlI0Rpc2tvZ3JhZmllJyxcbiAgICAgICAgICAndGl0bGUnOiAnRGlza29ncmFmaWUnLFxuICAgICAgICAgICd1cmwnOiAnaHR0cDovL2RlLndpa2lwZWRpYS5vcmcvd2lraS9UaG9tX1lvcmtlI0Rpc2tvZ3JhZmllJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgJ21fdXJsJzogJ2h0dHA6Ly9kZS5tLndpa2lwZWRpYS5vcmcvd2lraS9UaG9tX1lvcmtlI1dlYmxpbmtzJyxcbiAgICAgICAgICAndGl0bGUnOiAnV2VibGlua3MnLFxuICAgICAgICAgICd1cmwnOiAnaHR0cDovL2RlLndpa2lwZWRpYS5vcmcvd2lraS9UaG9tX1lvcmtlI1dlYmxpbmtzJ1xuICAgICAgICB9LFxuICAgICAgICB7XG4gICAgICAgICAgJ21fdXJsJzogJ2h0dHA6Ly9kZS5tLndpa2lwZWRpYS5vcmcvd2lraS9UaG9tX1lvcmtlI1F1ZWxsZW4nLFxuICAgICAgICAgICd0aXRsZSc6ICdRdWVsbGVuJyxcbiAgICAgICAgICAndXJsJzogJ2h0dHA6Ly9kZS53aWtpcGVkaWEub3JnL3dpa2kvVGhvbV9Zb3JrZSNRdWVsbGVuJ1xuICAgICAgICB9XG4gICAgICBdXG4gICAgfTtcbiAgICBkZXNjcmliZSgnU2V0IE1vYmlsZSB1cmxzJywgZnVuY3Rpb24gKCkge1xuICAgICAgaXQoJ3Nob3VsZCBub3QgcmVwbGFjZSB2YWwgaWYgbm8gbW9iaWxlIHVybCBzdXBwb3J0ZWQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMubW9kdWxlKCkuZGVmYXVsdC5zZXRNb2JpbGVCYXNlZFVybHMoTk9fTU9CSUxFX1VSTF9SRVNVTFQpO1xuICAgICAgICBjaGFpLmV4cGVjdChOT19NT0JJTEVfVVJMX1JFU1VMVC52YWwpLnRvLmVxdWFsKCdodHRwOi8vd3d3Lm9ubWVkYS5kZS9rcmFua2hlaXRlbi9tYWdlcnN1Y2h0Lmh0bWwnKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBzZXQgdmFsIHdpdGggYW1wX3VybCcsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5tb2R1bGUoKS5kZWZhdWx0LnNldE1vYmlsZUJhc2VkVXJscyhNT0JJTEVfVVJMX1JFU1VMVCk7XG4gICAgICAgIGNoYWkuZXhwZWN0KE1PQklMRV9VUkxfUkVTVUxULnZhbCkudG8uZXF1YWwoJ2h0dHA6Ly93d3cub25tZWRhLmRlL2FtcC9rcmFua2hlaXRlbi9tYWdlcnN1Y2h0Lmh0bWwnKTtcbiAgICAgIH0pO1xuICAgICAgaXQoJ3Nob3VsZCBzZXQgbGlua3MgdXJsIHdpdGggbV91cmwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMubW9kdWxlKCkuZGVmYXVsdC5zZXRNb2JpbGVCYXNlZFVybHMoTV9VUkxfUkVTVUxUKTtcbiAgICAgICAgTV9VUkxfUkVTVUxULmludGVybmFsX2xpbmtzLmZvckVhY2gobGluayA9PiBjaGFpLmV4cGVjdChsaW5rLnVybCkudG8uZXF1YWwobGluay5tX3VybCkpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cbik7Il19