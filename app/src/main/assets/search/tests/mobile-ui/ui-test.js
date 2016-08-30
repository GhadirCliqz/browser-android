System.register('tests/mobile-ui/ui-test', [], function (_export) {
  /* global chai, describeModule */

  'use strict';

  return {
    setters: [],
    execute: function () {
      _export('default', describeModule('mobile-ui/UI', function () {
        return {
          'mobile-ui/webview': {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3RzL21vYmlsZS11aS91aS10ZXN0LmVzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7O3lCQUVlLGNBQWMsQ0FBQyxjQUFjLEVBQzFDLFlBQVk7QUFDVixlQUFPO0FBQ0wsNkJBQW1CLEVBQUU7QUFDbkIsa0JBQU0sRUFBRTtBQUNOLDhCQUFnQixFQUFBLDRCQUFHLEVBQUc7YUFDdkI7V0FDRjtBQUNELDBCQUFnQixFQUFFO0FBQ2hCLHVCQUFTO0FBQ1AsdUJBQVMsRUFBRSxFQUFFO2FBQ2Q7V0FDRjtTQUNGLENBQUM7T0FDSCxFQUNELFlBQVk7QUFDVixZQUFJLG9CQUFvQixHQUFHO0FBQ3pCLGVBQUssRUFBRSxrREFBa0Q7U0FDMUQsQ0FBQztBQUNGLFlBQUksaUJBQWlCLEdBQUc7QUFDdEIsZUFBSyxFQUFFLGtEQUFrRDtBQUN6RCxnQkFBTSxFQUFFO0FBQ04sd0JBQVksRUFBRSxzREFBc0Q7V0FDckU7U0FDRixDQUFDO0FBQ0YsWUFBSSxZQUFZLEdBQUc7QUFDakIsMEJBQWdCLEVBQUUsQ0FDaEI7QUFDRSxtQkFBTyxFQUFFLGlEQUFpRDtBQUMxRCxtQkFBTyxFQUFFLE9BQU87QUFDaEIsaUJBQUssRUFBRSwrQ0FBK0M7V0FDdkQsRUFDRDtBQUNFLG1CQUFPLEVBQUUseUVBQXlFO0FBQ2xGLG1CQUFPLEVBQUUsMEJBQTBCO0FBQ25DLGlCQUFLLEVBQUUsdUVBQXVFO1dBQy9FLEVBQ0Q7QUFDRSxtQkFBTyxFQUFFLHVEQUF1RDtBQUNoRSxtQkFBTyxFQUFFLGFBQWE7QUFDdEIsaUJBQUssRUFBRSxxREFBcUQ7V0FDN0QsRUFDRDtBQUNFLG1CQUFPLEVBQUUsb0RBQW9EO0FBQzdELG1CQUFPLEVBQUUsVUFBVTtBQUNuQixpQkFBSyxFQUFFLGtEQUFrRDtXQUMxRCxFQUNEO0FBQ0UsbUJBQU8sRUFBRSxtREFBbUQ7QUFDNUQsbUJBQU8sRUFBRSxTQUFTO0FBQ2xCLGlCQUFLLEVBQUUsaURBQWlEO1dBQ3pELENBQ0Y7U0FDRixDQUFDO0FBQ0YsZ0JBQVEsQ0FBQyxpQkFBaUIsRUFBRSxZQUFZO0FBQ3RDLFlBQUUsQ0FBQyxtREFBbUQsRUFBRSxZQUFZO0FBQ2xFLGdCQUFJLENBQUMsTUFBTSxFQUFFLFdBQVEsQ0FBQyxrQkFBa0IsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO0FBQy9ELGdCQUFJLENBQUMsTUFBTSxDQUFDLG9CQUFvQixDQUFDLEdBQUcsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsa0RBQWtELENBQUMsQ0FBQztXQUNwRyxDQUFDLENBQUM7QUFDSCxZQUFFLENBQUMsNkJBQTZCLEVBQUUsWUFBWTtBQUM1QyxnQkFBSSxDQUFDLE1BQU0sRUFBRSxXQUFRLENBQUMsa0JBQWtCLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUM1RCxnQkFBSSxDQUFDLE1BQU0sQ0FBQyxpQkFBaUIsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLENBQUMsS0FBSyxDQUFDLHNEQUFzRCxDQUFDLENBQUM7V0FDckcsQ0FBQyxDQUFDO0FBQ0gsWUFBRSxDQUFDLGlDQUFpQyxFQUFFLFlBQVk7QUFDaEQsZ0JBQUksQ0FBQyxNQUFNLEVBQUUsV0FBUSxDQUFDLGtCQUFrQixDQUFDLFlBQVksQ0FBQyxDQUFDO0FBQ3ZELHdCQUFZLENBQUMsY0FBYyxDQUFDLE9BQU8sQ0FBQyxVQUFBLElBQUk7cUJBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDO2FBQUEsQ0FBQyxDQUFDO1dBQ3pGLENBQUMsQ0FBQztTQUNKLENBQUMsQ0FBQztPQUNKLENBQ0YiLCJmaWxlIjoidGVzdHMvbW9iaWxlLXVpL3VpLXRlc3QuZXMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWwgY2hhaSwgZGVzY3JpYmVNb2R1bGUgKi9cblxuZXhwb3J0IGRlZmF1bHQgZGVzY3JpYmVNb2R1bGUoJ21vYmlsZS11aS9VSScsXG4gIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4ge1xuICAgICAgJ21vYmlsZS11aS93ZWJ2aWV3Jzoge1xuICAgICAgICB3aW5kb3c6IHtcbiAgICAgICAgICBhZGRFdmVudExpc3RlbmVyKCkgeyB9XG4gICAgICAgIH1cbiAgICAgIH0sXG4gICAgICAnY29yZS90ZW1wbGF0ZXMnOiB7XG4gICAgICAgIGRlZmF1bHQ6IHtcbiAgICAgICAgICBURU1QTEFURVM6IFtdXG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9O1xuICB9LFxuICBmdW5jdGlvbiAoKSB7XG4gICAgbGV0IE5PX01PQklMRV9VUkxfUkVTVUxUID0ge1xuICAgICAgJ3ZhbCc6ICdodHRwOi8vd3d3Lm9ubWVkYS5kZS9rcmFua2hlaXRlbi9tYWdlcnN1Y2h0Lmh0bWwnXG4gICAgfTtcbiAgICBsZXQgTU9CSUxFX1VSTF9SRVNVTFQgPSB7XG4gICAgICAndmFsJzogJ2h0dHA6Ly93d3cub25tZWRhLmRlL2tyYW5raGVpdGVuL21hZ2Vyc3VjaHQuaHRtbCcsXG4gICAgICAnZGF0YSc6IHtcbiAgICAgICAgJ21vYmlsZV91cmwnOiAnaHR0cDovL3d3dy5vbm1lZGEuZGUvYW1wL2tyYW5raGVpdGVuL21hZ2Vyc3VjaHQuaHRtbCdcbiAgICAgIH1cbiAgICB9O1xuICAgIGxldCBNX1VSTF9SRVNVTFQgPSB7XG4gICAgICAnaW50ZXJuYWxfbGlua3MnOiBbXG4gICAgICAgIHtcbiAgICAgICAgICAnbV91cmwnOiAnaHR0cDovL2RlLm0ud2lraXBlZGlhLm9yZy93aWtpL1Rob21fWW9ya2UjTGViZW4nLFxuICAgICAgICAgICd0aXRsZSc6ICdMZWJlbicsXG4gICAgICAgICAgJ3VybCc6ICdodHRwOi8vZGUud2lraXBlZGlhLm9yZy93aWtpL1Rob21fWW9ya2UjTGViZW4nXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICAnbV91cmwnOiAnaHR0cDovL2RlLm0ud2lraXBlZGlhLm9yZy93aWtpL1Rob21fWW9ya2UjSy5DMy5CQ25zdGxlcmlzY2hlcl9XZXJkZWdhbmcnLFxuICAgICAgICAgICd0aXRsZSc6ICdLw7xuc3RsZXJpc2NoZXIgV2VyZGVnYW5nJyxcbiAgICAgICAgICAndXJsJzogJ2h0dHA6Ly9kZS53aWtpcGVkaWEub3JnL3dpa2kvVGhvbV9Zb3JrZSNLLkMzLkJDbnN0bGVyaXNjaGVyX1dlcmRlZ2FuZydcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICdtX3VybCc6ICdodHRwOi8vZGUubS53aWtpcGVkaWEub3JnL3dpa2kvVGhvbV9Zb3JrZSNEaXNrb2dyYWZpZScsXG4gICAgICAgICAgJ3RpdGxlJzogJ0Rpc2tvZ3JhZmllJyxcbiAgICAgICAgICAndXJsJzogJ2h0dHA6Ly9kZS53aWtpcGVkaWEub3JnL3dpa2kvVGhvbV9Zb3JrZSNEaXNrb2dyYWZpZSdcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICdtX3VybCc6ICdodHRwOi8vZGUubS53aWtpcGVkaWEub3JnL3dpa2kvVGhvbV9Zb3JrZSNXZWJsaW5rcycsXG4gICAgICAgICAgJ3RpdGxlJzogJ1dlYmxpbmtzJyxcbiAgICAgICAgICAndXJsJzogJ2h0dHA6Ly9kZS53aWtpcGVkaWEub3JnL3dpa2kvVGhvbV9Zb3JrZSNXZWJsaW5rcydcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgICdtX3VybCc6ICdodHRwOi8vZGUubS53aWtpcGVkaWEub3JnL3dpa2kvVGhvbV9Zb3JrZSNRdWVsbGVuJyxcbiAgICAgICAgICAndGl0bGUnOiAnUXVlbGxlbicsXG4gICAgICAgICAgJ3VybCc6ICdodHRwOi8vZGUud2lraXBlZGlhLm9yZy93aWtpL1Rob21fWW9ya2UjUXVlbGxlbidcbiAgICAgICAgfVxuICAgICAgXVxuICAgIH07XG4gICAgZGVzY3JpYmUoJ1NldCBNb2JpbGUgdXJscycsIGZ1bmN0aW9uICgpIHtcbiAgICAgIGl0KCdzaG91bGQgbm90IHJlcGxhY2UgdmFsIGlmIG5vIG1vYmlsZSB1cmwgc3VwcG9ydGVkJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuc2V0TW9iaWxlQmFzZWRVcmxzKE5PX01PQklMRV9VUkxfUkVTVUxUKTtcbiAgICAgICAgY2hhaS5leHBlY3QoTk9fTU9CSUxFX1VSTF9SRVNVTFQudmFsKS50by5lcXVhbCgnaHR0cDovL3d3dy5vbm1lZGEuZGUva3JhbmtoZWl0ZW4vbWFnZXJzdWNodC5odG1sJyk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgc2V0IHZhbCB3aXRoIGFtcF91cmwnLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMubW9kdWxlKCkuZGVmYXVsdC5zZXRNb2JpbGVCYXNlZFVybHMoTU9CSUxFX1VSTF9SRVNVTFQpO1xuICAgICAgICBjaGFpLmV4cGVjdChNT0JJTEVfVVJMX1JFU1VMVC52YWwpLnRvLmVxdWFsKCdodHRwOi8vd3d3Lm9ubWVkYS5kZS9hbXAva3JhbmtoZWl0ZW4vbWFnZXJzdWNodC5odG1sJyk7XG4gICAgICB9KTtcbiAgICAgIGl0KCdzaG91bGQgc2V0IGxpbmtzIHVybCB3aXRoIG1fdXJsJywgZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuc2V0TW9iaWxlQmFzZWRVcmxzKE1fVVJMX1JFU1VMVCk7XG4gICAgICAgIE1fVVJMX1JFU1VMVC5pbnRlcm5hbF9saW5rcy5mb3JFYWNoKGxpbmsgPT4gY2hhaS5leHBlY3QobGluay51cmwpLnRvLmVxdWFsKGxpbmsubV91cmwpKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG4pOyJdfQ==