System.register("tests/autocomplete/unit/mixer-test", [], function (_export) {
  "use strict";

  var expect;
  return {
    setters: [],
    execute: function () {
      expect = chai.expect;

      _export("default", describeModule("autocomplete/mixer", function () {
        return {
          "autocomplete/url-complete": { "default": {} },
          "core/cliqz": {
            utils: {
              setTimeout: setTimeout,
              log: console.log.bind(console),
              encodeSources: function encodeSources() {
                return [];
              },
              getDetailsFromUrl: function getDetailsFromUrl(url) {
                return { extra: "", path: "", host: "" };
              },
              encodeResultType: function encodeResultType() {
                return "";
              },
              isCompleteUrl: function isCompleteUrl() {
                return true;
              },
              generalizeUrl: function generalizeUrl() {},
              MIN_QUERY_LENGHT_FOR_EZ: 3
            }
          }
        };
      }, function () {
        beforeEach(function () {
          // Disable cleaning of smartCLIQZ trigger URLs during testing
          this.module()["default"]._cleanTriggerUrls = function () {};
        });

        describe('prepareExtraResults', function () {
          it('should discard bad EZs', function () {
            var input = [{
              data: { garbage: 'useless' }
            }];
            this.module()["default"]._prepareExtraResults(input);
            expect(this.module()["default"]._prepareExtraResults(input)).to.be.empty;
          });

          it('should add trigger_method to each result', function () {
            var input = [{
              style: 'cliqz-extra',
              val: 'https://cliqz.com/',
              comment: 'Cliqz',
              label: 'https://cliqz.com/',
              query: 'cliqz.c',
              data: {
                answer: '15:16',
                expression: 'Mittwoch - 30 September 2015',
                ez_type: 'time',
                friendly_url: 'worldtime.io/current/WzUxLCA5XXw5fDUx',
                is_calculus: true,
                line3: 'Central European Summer Time (UTC/GMT +2:00)',
                location: 'Deutschland',
                mapped_location: 'DE',
                meta: {
                  lazyRH_: '0.00108695030212'
                },
                prefix_answer: '',
                support_copy_ans: null,
                template: 'calculator',
                subType: '{"ez": "-6262111850032132334"}',
                ts: 1443619006,
                kind: ['X|{"ez": "-6262111850032132334"}']
              }
            }];

            var expected = 'X|{"ez":"-6262111850032132334","trigger_method":"rh_query"}';

            var results = this.module()["default"]._prepareExtraResults(input);

            results.forEach(function (result) {
              expect(result).to.contain.all.keys(input[0]);
              expect(result.data.kind[0]).to.equal(expected);
            });
          });
        });

        describe('prepareCliqzResults', function () {

          it('should add i to each subtype', function () {
            var input = [{
              q: 'cinema',
              url: 'http://www.cinema.de/',
              source: 'bm',
              snippet: {
                desc: 'Das Kinoprogramm in Deutschland mit allen Neustarts, Filmen, DVDs, dem Filmquiz und vielen Stars, News, Fotos und Insider-Infos: alles rund ums Kino bei CINEMA Online.',
                title: 'Kino bei CINEMA: Kinoprogramm, Filme, DVDs, Stars, Trailer und mehr - Cinema.de'
              }
            }, {
              q: 'cinema',
              url: 'http://www.cinemaxx.de/',
              source: 'bm',
              snippet: {
                desc: 'Aktuelles Kinoprogramm und Filmstarts. Kinotickets gleich online kaufen oder reservieren. Kino in bester Qualität - Willkommen bei CinemaxX',
                title: 'Kino in bester Qualität - Herzlich willkommen in Ihrem CinemaxX.'
              }
            }, {
              q: 'cinema',
              url: 'http://www.cinema-muenchen.de/',
              source: 'bm',
              snippet: {
                desc: 'Startseite',
                title: 'Willkommen bei Cinema München - Cinema München'
              }
            }];

            var results = this.module()["default"]._prepareCliqzResults(input);

            results.forEach(function (result, i) {
              var parts = result.data.kind[0].split('|'),
                  params = JSON.parse(parts[1] || '{}');
              expect(params).to.contain.key('i');
              expect(params.i).to.equal(i);
            });
          });
        });

        describe('isValidQueryForEZ', function () {

          var subject = undefined,
              blacklist = undefined;

          beforeEach(function () {
            subject = this.module()["default"]._isValidQueryForEZ, blacklist;

            blacklist = this.module()["default"].EZ_QUERY_BLACKLIST;
            this.module()["default"].EZ_QUERY_BLACKLIST = ['xxx', 'yyy', 'ggg'];
          });

          afterEach(function () {
            this.module()["default"].EZ_QUERY_BLACKLIST = blacklist;
          });

          it('rejects queries in blacklist', function () {
            this.module()["default"].EZ_QUERY_BLACKLIST.forEach(function (query) {
              expect(subject(query)).to.be["false"];
            });
          });

          it('ignores capitalization', function () {
            this.module()["default"].EZ_QUERY_BLACKLIST.map(function (q) {
              return q.toUpperCase();
            }).forEach(function (query) {
              expect(subject(query)).to.be["false"];
            });

            expect(subject('A')).to.be["false"];
            expect(subject('AA')).to.be["false"];
          });

          it('ignores whitespace', function () {
            this.module()["default"].EZ_QUERY_BLACKLIST.map(function (q) {
              return ' ' + q + ' ';
            }).forEach(function (query) {
              expect(subject(query)).to.be["false"];
            });

            expect(subject(' ')).to.be["false"];
            expect(subject('a ')).to.be["false"];
            expect(subject(' aa ')).to.be["false"];
          });

          it('rejects short queries', function () {
            expect(subject('')).to.be["false"];
            expect(subject('a')).to.be["false"];
            expect(subject('aa')).to.be["false"];
          });

          it('accepts queries not in blacklist longer than 2 chars', function () {
            expect(subject('wwww')).to.be["true"];
            expect(subject('http://www.fac')).to.be["true"];
            expect(subject('wmag')).to.be["true"];
            expect(subject(' www.f')).to.be["true"];
          });
        });

        describe('addEZfromBM', function () {
          var result = {
            url: 'http://www.bild.de/',
            snippet: {
              title: 'Bild',
              desc: 'Bild News'
            },
            extra: {
              data: {
                domain: 'bild.de',
                friendly_url: 'bild.de',
                name: 'Bild',
                template: 'entity-news-1'
              },
              url: 'http://www.bild.de',
              subType: '{"ez": "4573617661040092857"}',
              trigger_urls: ['bild.de']
            }
          };

          beforeEach(function () {
            this.deps("core/cliqz").utils.isCompleteUrl = function () {
              return true;
            };
            this.deps("core/cliqz").utils.getDetailsFromUrl = function () {
              return { name: 'bild' };
            };
          });

          it('should add EZ to empty list', function () {

            var extra = [];

            this.module()["default"]._addEZfromBM(extra, result);

            expect(extra).to.have.length(1);
            expect(extra[0].data.subType).to.equal(result.extra.subType);
            expect(extra[0].comment).to.equal(result.snippet.title);
          });

          it('should add EZ to end of existing list', function () {
            var extra = [{ test: 'abc' }];

            this.module()["default"]._addEZfromBM(extra, result);

            expect(extra).to.have.length(2);
            expect(extra[extra.length - 1].data.subType).to.equal(result.extra.subType);
            expect(extra[extra.length - 1].comment).to.equal(result.snippet.title);
          });
        });

        describe('collectSublinks', function () {
          it('should find nothing', function () {
            var data = {
              dsf: 'Asfd',
              afds: {
                sdfa: {
                  fds: 'fdsa'
                }
              }
            };
            var sublinks = this.module()["default"]._collectSublinks(data);

            expect(sublinks).to.be.empty;
          });

          it('should find with key url', function () {
            var data = {
              dsf: 'Asfd',
              afds: {
                adfs: ['ff', 'ff'],
                sdfa: {
                  url: 'http://www.test.com'
                }
              }
            };
            var sublinks = this.module()["default"]._collectSublinks(data);

            expect(sublinks).to.contain('http://www.test.com');
          });

          it('should find with key href', function () {
            var data = {
              dsf: 'Asfd',
              afds: {
                adfs: ['ff', 'ff'],
                sdfa: {
                  href: 'http://www.test.com'
                }
              }
            };
            var sublinks = this.module()["default"]._collectSublinks(data);

            expect(sublinks).to.contain('http://www.test.com');
          });

          it('should find three', function () {
            var data = {
              dsf: 'Asfd',
              url: 'http://bbb.com',
              afds: {
                adfs: ['ff', 'ff'],
                sdfa: [{
                  href: 'http://www.test.com'
                }, {
                  href: 'http://aaa.com'
                }]
              }
            };
            var sublinks = this.module()["default"]._collectSublinks(data);

            expect(sublinks).to.contain('http://www.test.com');
            expect(sublinks).to.contain('http://aaa.com');
            expect(sublinks).to.contain('http://bbb.com');
          });
        });

        describe('getDuplicates', function () {
          var results, cliqz;
          beforeEach(function () {
            results = [{
              style: 'favicon',
              val: 'https://www.facebook.com/',
              comment: 'Facebook (history generic)!',
              label: 'https://www.facebook.com/',
              query: 'f',
              data: {
                kind: ['H'],
                description: 'Facebook is a social utility.'
              }
            }, {
              style: 'favicon',
              val: 'http://www.fasd-hh.rosenke.de/',
              comment: 'FASD-Hamburg - Startseite (history generic)!',
              label: 'http://www.fasd-hh.rosenke.de/',
              query: 'f',
              data: {
                kind: ['H'],
                description: 'FASD-Hamburg'
              }
            }];

            cliqz = [{
              style: 'cliqz-results sources-m',
              val: 'https://mail.facebook.com/',
              comment: 'Facebook',
              label: 'https://mail.facebook.com/',
              query: 'bm f undefined',
              data: {
                description: 'Facebook ist ein soziales.',
                title: 'Facebook',
                kind: ['m|{"i":0}']
              }
            }, {
              style: 'cliqz-results sources-m',
              val: 'https://fxyz.com/',
              comment: 'FXYZ',
              label: 'https://fxyz.com/',
              query: 'bm f undefined',
              data: {
                description: 'FXYZ is cool',
                title: 'FXYZ',
                kind: ['m|{"i":1}']
              }
            }];
          });

          it('should find no duplicates', function () {
            var duplicates = this.module()["default"]._getDuplicates(results, cliqz);
            expect(duplicates).to.be.empty;
          });

          it('should find one duplicate - main link', function () {
            cliqz[0].label = cliqz[0].val = results[0].label;
            var duplicates = this.module()["default"]._getDuplicates(results, cliqz);
            expect(duplicates).to.have.length(1);
            expect(duplicates[0]).to.be.deep.equal(cliqz[0]);
          });

          it('should find one duplicate - sub link', function () {
            results[0].style = 'cliqz-pattern';
            results[0].data.urls = [{ href: 'https://mail.facebook.com/' }];
            var duplicates = this.module()["default"]._getDuplicates(results, cliqz);
            expect(duplicates).to.have.length(1);
            expect(duplicates[0]).to.be.deep.equal(cliqz[0]);
          });

          it('should find one duplicate - main link different country', function () {
            cliqz[0].label = cliqz[0].val = 'https://de-de.facebook.com/';
            var duplicates = this.module()["default"]._getDuplicates(results, cliqz);
            expect(duplicates).to.have.length(1);
            expect(duplicates[0]).to.be.deep.equal(cliqz[0]);
          });
        });

        describe('deduplicateResults', function () {
          var results, cliqz;
          beforeEach(function () {
            results = [{
              style: 'favicon',
              val: 'https://www.facebook.com/',
              comment: 'Facebook (history generic)!',
              label: 'https://www.facebook.com/',
              query: 'f',
              data: {
                kind: ['H'],
                description: 'Facebook is a social utility.'
              }
            }, {
              style: 'favicon',
              val: 'http://www.fasd-hh.rosenke.de/',
              comment: 'FASD-Hamburg - Startseite (history generic)!',
              label: 'http://www.fasd-hh.rosenke.de/',
              query: 'f',
              data: {
                kind: ['H'],
                description: 'FASD-Hamburg'
              }
            }];

            cliqz = [{
              style: 'cliqz-results sources-m',
              val: 'https://mail.facebook.com/',
              comment: 'Facebook',
              label: 'https://mail.facebook.com/',
              query: 'bm f undefined',
              data: {
                description: 'Facebook ist ein soziales.',
                title: 'Facebook',
                kind: ['m|{"i":0}']
              }
            }, {
              style: 'cliqz-results sources-m',
              val: 'https://fxyz.com/',
              comment: 'FXYZ',
              label: 'https://fxyz.com/',
              query: 'bm f undefined',
              data: {
                description: 'FXYZ is cool',
                title: 'FXYZ',
                kind: ['m|{"i":1}']
              }
            }];
          });

          it('should leave both lists alone', function () {
            var r = this.module()["default"]._deduplicateResults(results, cliqz);

            expect(r.first).to.have.length(2);
            expect(r.second).to.have.length(2);
          });

          it('should remove facebook from cliqz', function () {
            cliqz[0].label = cliqz[0].val = results[0].label;

            var r = this.module()["default"]._deduplicateResults(results, cliqz);

            expect(r.first).to.have.length(2);
            expect(r.second).to.have.length(1);

            // Check kinds are combined properly
            expect(r.first[0].data.kind).to.contain(cliqz[0].data.kind[0]);
          });

          it('should remove facebook from cliqz because of matching sublink', function () {
            results[0].style = 'cliqz-pattern';
            results[0].data.urls = [{ href: 'https://mail.facebook.com/' }];

            var r = this.module()["default"]._deduplicateResults(results, cliqz);

            expect(r.first).to.have.length(2);
            expect(r.second).to.have.length(1);
          });

          it('should remove facebook from cliqz because only different by country', function () {
            cliqz[0].label = cliqz[0].val = 'https://de-de.facebook.com/';

            var r = this.module()["default"]._deduplicateResults(results, cliqz);

            expect(r.first).to.have.length(2);
            expect(r.second).to.have.length(1);

            // Check kinds are combined properly
            expect(r.first[0].data.kind).to.contain(cliqz[0].data.kind[0]);
          });
        });

        describe('isValidEZ', function () {
          var result;

          beforeEach(function () {
            result = {
              style: 'cliqz-extra',
              val: 'https://cliqz.com/',
              comment: 'Cliqz',
              label: 'https://cliqz.com/',
              query: 'cliqz.c',
              data: {
                friendly_url: 'cliqz.com',
                template: 'Cliqz',
                subType: '{"class": "CliqzEZ", "ez": "deprecated"}',
                trigger_urls: ['cliqz.com'],
                ts: 1447772162,
                kind: ['X|{"ez":"-7290289273393613729","trigger_method":"rh_query"}'],
                __subType__: {
                  "class": "CliqzEZ",
                  id: "2700150093133398460",
                  name: "Cliqz 1"
                }
              }
            };
          });

          it('should accept good ez', function () {
            expect(this.module()["default"]._isValidEZ(result)).to.be["true"];
          });

          it('should discard if url is missing', function () {
            delete result.val;
            expect(this.module()["default"]._isValidEZ(result)).to.be["false"];
          });

          it('should discard if data is missing', function () {
            delete result.data;
            expect(this.module()["default"]._isValidEZ(result)).to.be["false"];
          });

          it('should discard if subType is missing or unparsable', function () {
            result.data.subType = 'afsdfdasfdsfds{';
            expect(this.module()["default"]._isValidEZ(result)).to.be["false"];
            delete result.subType;
            expect(this.module()["default"]._isValidEZ(result)).to.be["false"];
          });

          it('should discard if __subType__ is missing or ID is missing', function () {
            delete result.data.__subType__.id;
            expect(this.module()["default"]._isValidEZ(result)).to.be["false"];
            delete result.data.__subType__;
            expect(this.module()["default"]._isValidEZ(result)).to.be["false"];
          });
        });

        describe('cacheEZs', function () {

          function getUrlfunction(smartCliqz) {
            //return CliqzUtils.generalizeUrl(smartCliqz.val, true);
          }

          var saved = false,
              results = {},
              urls = {},
              ezs = {},
              smartCliqzCache = {},
              triggerUrlCache = {},
              ezstore,
              test;

          // Mock CliqzSmartCliqzCache
          beforeEach(function () {
            results = [{
              style: 'cliqz-extra',
              val: 'https://cliqz.com/',
              comment: 'Cliqz',
              label: 'https://cliqz.com/',
              query: 'cliqz.c',
              data: {
                friendly_url: 'cliqz.com',
                template: 'Cliqz',
                subType: '{"class": "CliqzEZ", "ez": "deprecated"}',
                trigger_urls: ['cliqz.com'],
                ts: 1447772162,
                kind: ['X|{"ez":"-7290289273393613729","trigger_method":"rh_query"}'],
                __subType__: {
                  "class": "CliqzEZ",
                  id: "2700150093133398460",
                  name: "Cliqz 1"
                }
              }
            }];

            saved = false;
            urls = {};
            ezs = {};

            triggerUrlCache.retrieve = function (url) {
              if (!(url in urls)) {
                return urls[url];
              } else {
                return false;
              }
            };
            triggerUrlCache.store = function (url, eztype) {
              urls[url] = eztype;
              saved = false;
            };
            triggerUrlCache.save = function () {
              saved = true;
            };

            smartCliqzCache.store = function (ezData) {
              ezs[getUrlfunction(ezData)] = ezData;
            };
            triggerUrlCache.isCached = function () {
              return false;
            };

            this.module()["default"].init({
              smartCliqzCache: smartCliqzCache,
              triggerUrlCache: triggerUrlCache
            });
          });

          it('should cache 1 entry given 1', function () {
            this.module()["default"]._cacheEZs([results[0]]);

            expect(saved).to.be["true"];
            expect(Object.keys(urls)).length.to.be(1);
            expect(urls[results[0].data.trigger_urls[0]]).to.be["true"];
            expect(ezs[getUrlfunction(results[0])]).to.equal(results[0]);
          });

          it('should cache 1 entry given 2 with same URL', function () {
            results.push(JSON.parse(JSON.stringify(results[0])));
            results[1].comment = 'Second entry';
            this.module()["default"]._cacheEZs(results);

            expect(saved).to.be["true"];
            expect(Object.keys(urls)).length.to.be(1);
            expect(urls[results[0].data.trigger_urls[0]]).to.be["true"];

            // require first entry to have priority over the second
            expect(ezs[getUrlfunction(results[0])]).to.equal(results[0]);
          });

          it('should cache 2 entries given 2', function () {
            results.push(JSON.parse(JSON.stringify(results[0])));
            results[1].val = 'http://test.com';
            results[1].data.trigger_urls[0] = 'test.com';
            results[1].data.__subType__ = { id: "1111111111" };

            this.module()["default"]._cacheEZs(results);

            expect(saved).to.be["true"];
            expect(Object.keys(urls)).length.to.be(2);
            results.forEach(function (result) {
              expect(urls[result.data.trigger_urls[0]]).to.be["true"];
              // expect(ezs[getUrlfunction(result)]).to.equal(result);
            });
          });
        });

        describe('historyTriggerEZ', function () {
          var fetching,
              result = {},
              urls = {},
              ezs = {},
              smartCliqzCache = {},
              triggerUrlCache = {};

          // Mock CliqzSmartCliqzCache
          beforeEach(function () {
            result = {
              style: 'cliqz-pattern',
              val: 'https://cliqz.com/',
              comment: 'Cliqz',
              label: 'https://cliqz.com/',
              query: 'cliqz.c',
              data: {
                cluster: true,
                urls: []
              }
            };

            ezs = {
              '-7290289273393613729': {
                style: 'cliqz-extra',
                val: 'https://cliqz.com/',
                comment: 'Cliqz',
                label: 'https://cliqz.com/',
                query: 'cliqz.c',
                data: {
                  friendly_url: 'cliqz.com',
                  template: 'Cliqz',
                  subType: '{"class": "CliqzEZ", "ez": "deprecated"}',
                  trigger_urls: ['cliqz.com'],
                  ts: 1447772162,
                  kind: ['X|{"ez":"-7290289273393613729","trigger_method":"rh_query"}'],
                  __subType__: {
                    "class": "CliqzEZ",
                    id: "2700150093133398460",
                    name: "Cliqz 1"
                  }
                }
              }
            };

            urls = {
              'cliqz.com': true
            };

            fetching = undefined;

            triggerUrlCache.isCached = function (url) {
              return urls[url] ? true : false;
            };

            triggerUrlCache.retrieve = function (url) {
              return urls[url];
            };

            triggerUrlCache.isStale = function () {
              return false;
            };

            smartCliqzCache.fetchAndStore = function (url) {
              fetching = url;
            };

            smartCliqzCache.retrieve = function (url) {
              return ezs[url];
            };

            smartCliqzCache.retrieveAndUpdate = smartCliqzCache.retrieve;

            this.deps("core/cliqz").utils.generalizeUrl = function () {
              return "cliqz.com";
            };
            this.module()["default"].init({
              smartCliqzCache: smartCliqzCache,
              triggerUrlCache: triggerUrlCache
            });
          });

          it('should trigger ez', function () {
            var ez = this.module()["default"]._historyTriggerEZ(result);
            expect(ez).to.equal(ezs[urls['cliqz.com']]);
          });

          it('should not trigger ez but fetch', function () {
            ezs = {};
            var ez = this.module()["default"]._historyTriggerEZ(result);
            expect(ez).to.be.undefined;
            expect(fetching).to.equal('cliqz.com');
          });

          it('should trigger ez because no cluster', function () {
            result.data.cluster = false;
            var ez = this.module()["default"]._historyTriggerEZ(result);
            expect(ez).to.be.undefined;
          });

          it('should trigger ez because cluster base domain inferred', function () {
            result.data.autoAdd = true;
            var ez = this.module()["default"]._historyTriggerEZ(result);
            expect(ez).to.be.undefined;
          });
        });

        describe('filterConflictingEZ', function () {

          var firstResult, ezs;

          beforeEach(function () {
            firstResult = {
              style: 'cliqz-pattern',
              val: 'https://cliqz.com/',
              comment: 'Cliqz',
              label: 'https://cliqz.com/',
              query: 'cliqz.c',
              data: {
                cluster: true,
                urls: []
              }
            };

            ezs = [{
              style: 'cliqz-extra',
              val: 'https://cliqz.com/',
              comment: 'Cliqz',
              label: 'https://cliqz.com/',
              query: 'cliqz.c',
              data: {
                friendly_url: 'cliqz.com',
                template: 'Cliqz',
                subType: '{"class": "CliqzEZ", "ez": "deprecated"}',
                trigger_urls: ['cliqz.com'],
                ts: 1447772162,
                kind: ['X|{"ez":"-7290289273393613729","trigger_method":"rh_query"}'],
                __subType__: {
                  "class": "CliqzEZ",
                  id: "2700150093133398460",
                  name: "Cliqz 1"
                }
              }
            }];
          });

          it('should not conflict if history matches', function () {
            var finalExtra = this.module()["default"]._filterConflictingEZ(ezs, firstResult);
            expect(finalExtra).to.deep.equal(ezs);
          });

          it('should not conflict if no bet', function () {
            firstResult.val = 'http://facebook.com';
            firstResult.data.cluster = false;
            var finalExtra = this.module()["default"]._filterConflictingEZ(ezs, firstResult);
            expect(finalExtra).to.deep.equal(ezs);
          });

          it('should conflict if history bet does not match', function () {
            firstResult.val = 'http://facebook.com';
            var finalExtra = this.module()["default"]._filterConflictingEZ(ezs, firstResult);
            expect(finalExtra).to.have.length(0);
          });

          // Will the autocomplete change if we use this EZ?
          it('should conflict if autocomplete does not match', function () {
            firstResult.val = 'http://facebook.com';
            firstResult.cluster = false;
            firstResult.autocompleted = true;
            var finalExtra = this.module()["default"]._filterConflictingEZ(ezs, firstResult);
            expect(finalExtra).to.have.length(0);
          });
        });
      }));
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlc3RzL2F1dG9jb21wbGV0ZS91bml0L21peGVyLXRlc3QuZXMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O01BQU0sTUFBTTs7OztBQUFOLFlBQU0sR0FBRyxJQUFJLENBQUMsTUFBTTs7eUJBRVgsY0FBYyxDQUFDLG9CQUFvQixFQUNoRCxZQUFZO0FBQ1YsZUFBTztBQUNMLHFDQUEyQixFQUFFLEVBQUUsV0FBUyxFQUFFLEVBQUU7QUFDNUMsc0JBQVksRUFBRTtBQUNaLGlCQUFLLEVBQUU7QUFDTCx3QkFBVSxFQUFWLFVBQVU7QUFDVixpQkFBRyxFQUFFLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQztBQUM5QiwyQkFBYSxFQUFBLHlCQUFHO0FBQUUsdUJBQU8sRUFBRSxDQUFDO2VBQUU7QUFDOUIsK0JBQWlCLEVBQUUsMkJBQVUsR0FBRyxFQUFFO0FBQUUsdUJBQU8sRUFBRSxLQUFLLEVBQUUsRUFBRSxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxDQUFDO2VBQUU7QUFDL0UsOEJBQWdCLEVBQUEsNEJBQUc7QUFBRSx1QkFBTyxFQUFFLENBQUM7ZUFBRTtBQUNqQywyQkFBYSxFQUFBLHlCQUFHO0FBQUUsdUJBQU8sSUFBSSxDQUFDO2VBQUU7QUFDaEMsMkJBQWEsRUFBQSx5QkFBRyxFQUFHO0FBQ25CLHFDQUF1QixFQUFFLENBQUM7YUFDM0I7V0FDRjtTQUNGLENBQUE7T0FDRixFQUNELFlBQVk7QUFDVixrQkFBVSxDQUFDLFlBQVc7O0FBRXBCLGNBQUksQ0FBQyxNQUFNLEVBQUUsV0FBUSxDQUFDLGlCQUFpQixHQUFHLFlBQVcsRUFBRSxDQUFDO1NBQ3pELENBQUMsQ0FBQzs7QUFFSCxnQkFBUSxDQUFDLHFCQUFxQixFQUFFLFlBQVc7QUFDekMsWUFBRSxDQUFDLHdCQUF3QixFQUFFLFlBQVc7QUFDdEMsZ0JBQUksS0FBSyxHQUFHLENBQ1Y7QUFDRSxrQkFBSSxFQUFFLEVBQUUsT0FB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RyxJQUFJLENBQUMsTUFBTSxFQUFFLFdBQVEsQ0FBQyxvQkFBb0IsQ0FBQyxHQUFHLEVBQUUsV0FBVyxDQUFDLENBQUM7QUFDOUUsa0JBQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztXQUN0QyxDQUFDLENBQUM7U0FFSixDQUFDLENBQUM7T0FDSixDQUNGIiwiZmlsZSI6InRlc3RzL2F1dG9jb21wbGV0ZS91bml0L21peGVyLXRlc3QuZXMiLCJzb3VyY2VzQ29udGVudCI6WyJjb25zdCBleHBlY3QgPSBjaGFpLmV4cGVjdDtcblxuZXhwb3J0IGRlZmF1bHQgZGVzY3JpYmVNb2R1bGUoXCJhdXRvY29tcGxldGUvbWl4ZXJcIixcbiAgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB7XG4gICAgICBcImF1dG9jb21wbGV0ZS91cmwtY29tcGxldGVcIjogeyBkZWZhdWx0OiB7fSB9LFxuICAgICAgXCJjb3JlL2NsaXF6XCI6IHtcbiAgICAgICAgdXRpbHM6IHtcbiAgICAgICAgICBzZXRUaW1lb3V0LFxuICAgICAgICAgIGxvZzogY29uc29sZS5sb2cuYmluZChjb25zb2xlKSxcbiAgICAgICAgICBlbmNvZGVTb3VyY2VzKCkgeyByZXR1cm4gW107IH0sXG4gICAgICAgICAgZ2V0RGV0YWlsc0Zyb21Vcmw6IGZ1bmN0aW9uICh1cmwpIHsgcmV0dXJuIHsgZXh0cmE6IFwiXCIsIHBhdGg6IFwiXCIsIGhvc3Q6IFwiXCIgfTsgfSxcbiAgICAgICAgICBlbmNvZGVSZXN1bHRUeXBlKCkgeyByZXR1cm4gXCJcIjsgfSxcbiAgICAgICAgICBpc0NvbXBsZXRlVXJsKCkgeyByZXR1cm4gdHJ1ZTsgfSxcbiAgICAgICAgICBnZW5lcmFsaXplVXJsKCkgeyB9LFxuICAgICAgICAgIE1JTl9RVUVSWV9MRU5HSFRfRk9SX0VaOiAzXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH1cbiAgfSxcbiAgZnVuY3Rpb24gKCkge1xuICAgIGJlZm9yZUVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAvLyBEaXNhYmxlIGNsZWFuaW5nIG9mIHNtYXJ0Q0xJUVogdHJpZ2dlciBVUkxzIGR1cmluZyB0ZXN0aW5nXG4gICAgICB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuX2NsZWFuVHJpZ2dlclVybHMgPSBmdW5jdGlvbigpIHt9O1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ3ByZXBhcmVFeHRyYVJlc3VsdHMnLCBmdW5jdGlvbigpIHtcbiAgICAgIGl0KCdzaG91bGQgZGlzY2FyZCBiYWQgRVpzJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbnB1dCA9IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBkYXRhOiB7IGdhcmJhZ2U6ICd1c2VsZXNzJyB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF07XG4gICAgICAgIHRoaXMubW9kdWxlKCkuZGVmYXVsdC5fcHJlcGFyZUV4dHJhUmVzdWx0cyhpbnB1dCk7XG4gICAgICAgIGV4cGVjdCh0aGlzLm1vZHVsZSgpLmRlZmF1bHQuX3ByZXBhcmVFeHRyYVJlc3VsdHMoaW5wdXQpKS50by5iZS5lbXB0eTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGFkZCB0cmlnZ2VyX21ldGhvZCB0byBlYWNoIHJlc3VsdCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaW5wdXQgPSBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgc3R5bGU6ICdjbGlxei1leHRyYScsXG4gICAgICAgICAgICB2YWw6ICdodHRwczovL2NsaXF6LmNvbS8nLFxuICAgICAgICAgICAgY29tbWVudDogJ0NsaXF6JyxcbiAgICAgICAgICAgIGxhYmVsOiAnaHR0cHM6Ly9jbGlxei5jb20vJyxcbiAgICAgICAgICAgIHF1ZXJ5OiAnY2xpcXouYycsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIGFuc3dlcjogJzE1OjE2JyxcbiAgICAgICAgICAgICAgZXhwcmVzc2lvbjogJ01pdHR3b2NoIC0gMzAgU2VwdGVtYmVyIDIwMTUnLFxuICAgICAgICAgICAgICBlel90eXBlOiAndGltZScsXG4gICAgICAgICAgICAgIGZyaWVuZGx5X3VybDogJ3dvcmxkdGltZS5pby9jdXJyZW50L1d6VXhMQ0E1WFh3NWZEVXgnLFxuICAgICAgICAgICAgICBpc19jYWxjdWx1czogdHJ1ZSxcbiAgICAgICAgICAgICAgbGluZTM6ICdDZW50cmFsIEV1cm9wZWFuIFN1bW1lciBUaW1lIChVVEMvR01UICsyOjAwKScsXG4gICAgICAgICAgICAgIGxvY2F0aW9uOiAnRGV1dHNjaGxhbmQnLFxuICAgICAgICAgICAgICBtYXBwZWRfbG9jYXRpb246ICdERScsXG4gICAgICAgICAgICAgIG1ldGE6IHtcbiAgICAgICAgICAgICAgICBsYXp5UkhfOiAnMC4wMDEwODY5NTAzMDIxMidcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgcHJlZml4X2Fuc3dlcjogJycsXG4gICAgICAgICAgICAgIHN1cHBvcnRfY29weV9hbnM6IG51bGwsXG4gICAgICAgICAgICAgIHRlbXBsYXRlOiAnY2FsY3VsYXRvcicsXG4gICAgICAgICAgICAgIHN1YlR5cGU6ICd7XCJlelwiOiBcIi02MjYyMTExODUwMDMyMTMyMzM0XCJ9JyxcbiAgICAgICAgICAgICAgdHM6IDE0NDM2MTkwMDYsXG4gICAgICAgICAgICAgIGtpbmQ6IFsnWHx7XCJlelwiOiBcIi02MjYyMTExODUwMDMyMTMyMzM0XCJ9J10sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF07XG5cbiAgICAgICAgdmFyIGV4cGVjdGVkID0gJ1h8e1wiZXpcIjpcIi02MjYyMTExODUwMDMyMTMyMzM0XCIsXCJ0cmlnZ2VyX21ldGhvZFwiOlwicmhfcXVlcnlcIn0nO1xuXG4gICAgICAgIHZhciByZXN1bHRzID0gdGhpcy5tb2R1bGUoKS5kZWZhdWx0Ll9wcmVwYXJlRXh0cmFSZXN1bHRzKGlucHV0KTtcblxuICAgICAgICByZXN1bHRzLmZvckVhY2goZnVuY3Rpb24ocmVzdWx0KSB7XG4gICAgICAgICAgZXhwZWN0KHJlc3VsdCkudG8uY29udGFpbi5hbGwua2V5cyhpbnB1dFswXSk7XG4gICAgICAgICAgZXhwZWN0KHJlc3VsdC5kYXRhLmtpbmRbMF0pLnRvLmVxdWFsKGV4cGVjdGVkKTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdwcmVwYXJlQ2xpcXpSZXN1bHRzJywgZnVuY3Rpb24oKSB7XG5cbiAgICAgIGl0KCdzaG91bGQgYWRkIGkgdG8gZWFjaCBzdWJ0eXBlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpbnB1dCA9IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBxOiAnY2luZW1hJyxcbiAgICAgICAgICAgIHVybDogJ2h0dHA6Ly93d3cuY2luZW1hLmRlLycsXG4gICAgICAgICAgICBzb3VyY2U6ICdibScsXG4gICAgICAgICAgICBzbmlwcGV0OiB7XG4gICAgICAgICAgICAgIGRlc2M6ICdEYXMgS2lub3Byb2dyYW1tIGluIERldXRzY2hsYW5kIG1pdCBhbGxlbiBOZXVzdGFydHMsIEZpbG1lbiwgRFZEcywgZGVtIEZpbG1xdWl6IHVuZCB2aWVsZW4gU3RhcnMsIE5ld3MsIEZvdG9zIHVuZCBJbnNpZGVyLUluZm9zOiBhbGxlcyBydW5kIHVtcyBLaW5vIGJlaSBDSU5FTUEgT25saW5lLicsXG4gICAgICAgICAgICAgIHRpdGxlOiAnS2lubyBiZWkgQ0lORU1BOiBLaW5vcHJvZ3JhbW0sIEZpbG1lLCBEVkRzLCBTdGFycywgVHJhaWxlciB1bmQgbWVociAtIENpbmVtYS5kZScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgcTogJ2NpbmVtYScsXG4gICAgICAgICAgICB1cmw6ICdodHRwOi8vd3d3LmNpbmVtYXh4LmRlLycsXG4gICAgICAgICAgICBzb3VyY2U6ICdibScsXG4gICAgICAgICAgICBzbmlwcGV0OiB7XG4gICAgICAgICAgICAgIGRlc2M6ICdBa3R1ZWxsZXMgS2lub3Byb2dyYW1tIHVuZCBGaWxtc3RhcnRzLiBLaW5vdGlja2V0cyBnbGVpY2ggb25saW5lIGthdWZlbiBvZGVyIHJlc2VydmllcmVuLiBLaW5vIGluIGJlc3RlciBRdWFsaXTDpHQgLSBXaWxsa29tbWVuIGJlaSBDaW5lbWF4WCcsXG4gICAgICAgICAgICAgIHRpdGxlOiAnS2lubyBpbiBiZXN0ZXIgUXVhbGl0w6R0IC0gSGVyemxpY2ggd2lsbGtvbW1lbiBpbiBJaHJlbSBDaW5lbWF4WC4nLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHE6ICdjaW5lbWEnLFxuICAgICAgICAgICAgdXJsOiAnaHR0cDovL3d3dy5jaW5lbWEtbXVlbmNoZW4uZGUvJyxcbiAgICAgICAgICAgIHNvdXJjZTogJ2JtJyxcbiAgICAgICAgICAgIHNuaXBwZXQ6IHtcbiAgICAgICAgICAgICAgZGVzYzogJ1N0YXJ0c2VpdGUnLFxuICAgICAgICAgICAgICB0aXRsZTogJ1dpbGxrb21tZW4gYmVpIENpbmVtYSBNw7xuY2hlbiAtIENpbmVtYSBNw7xuY2hlbicsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF07XG5cbiAgICAgICAgdmFyIHJlc3VsdHMgPSB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuX3ByZXBhcmVDbGlxelJlc3VsdHMoaW5wdXQpO1xuXG4gICAgICAgIHJlc3VsdHMuZm9yRWFjaChmdW5jdGlvbihyZXN1bHQsIGkpIHtcbiAgICAgICAgICB2YXIgcGFydHMgPSByZXN1bHQuZGF0YS5raW5kWzBdLnNwbGl0KCd8JyksXG4gICAgICAgICAgICAgIHBhcmFtcyA9IEpTT04ucGFyc2UocGFydHNbMV0gfHwgJ3t9Jyk7XG4gICAgICAgICAgZXhwZWN0KHBhcmFtcykudG8uY29udGFpbi5rZXkoJ2knKTtcbiAgICAgICAgICBleHBlY3QocGFyYW1zLmkpLnRvLmVxdWFsKGkpO1xuICAgICAgICB9KTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ2lzVmFsaWRRdWVyeUZvckVaJywgZnVuY3Rpb24oKSB7XG5cbiAgICAgIGxldCBzdWJqZWN0LCBibGFja2xpc3Q7XG5cbiAgICAgIGJlZm9yZUVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHN1YmplY3QgPSB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuX2lzVmFsaWRRdWVyeUZvckVaLFxuICAgICAgICAgICAgICAgICAgICBibGFja2xpc3Q7XG5cbiAgICAgICAgYmxhY2tsaXN0ID0gdGhpcy5tb2R1bGUoKS5kZWZhdWx0LkVaX1FVRVJZX0JMQUNLTElTVDtcbiAgICAgICAgdGhpcy5tb2R1bGUoKS5kZWZhdWx0LkVaX1FVRVJZX0JMQUNLTElTVCA9IFsneHh4JywgJ3l5eScsICdnZ2cnXTtcbiAgICAgIH0pO1xuXG4gICAgICBhZnRlckVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMubW9kdWxlKCkuZGVmYXVsdC5FWl9RVUVSWV9CTEFDS0xJU1QgPSBibGFja2xpc3Q7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3JlamVjdHMgcXVlcmllcyBpbiBibGFja2xpc3QnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5tb2R1bGUoKS5kZWZhdWx0LkVaX1FVRVJZX0JMQUNLTElTVC5mb3JFYWNoKGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgICAgICAgZXhwZWN0KHN1YmplY3QocXVlcnkpKS50by5iZS5mYWxzZTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ2lnbm9yZXMgY2FwaXRhbGl6YXRpb24nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5tb2R1bGUoKS5kZWZhdWx0LkVaX1FVRVJZX0JMQUNLTElTVC5tYXAoZnVuY3Rpb24ocSkge3JldHVybiBxLnRvVXBwZXJDYXNlKCk7fSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5mb3JFYWNoKGZ1bmN0aW9uKHF1ZXJ5KSB7XG4gICAgICAgICAgZXhwZWN0KHN1YmplY3QocXVlcnkpKS50by5iZS5mYWxzZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgZXhwZWN0KHN1YmplY3QoJ0EnKSkudG8uYmUuZmFsc2U7XG4gICAgICAgIGV4cGVjdChzdWJqZWN0KCdBQScpKS50by5iZS5mYWxzZTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnaWdub3JlcyB3aGl0ZXNwYWNlJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHRoaXMubW9kdWxlKCkuZGVmYXVsdC5FWl9RVUVSWV9CTEFDS0xJU1QubWFwKGZ1bmN0aW9uKHEpIHtyZXR1cm4gJyAnICsgcSArICcgJzt9KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAuZm9yRWFjaChmdW5jdGlvbihxdWVyeSkge1xuICAgICAgICAgIGV4cGVjdChzdWJqZWN0KHF1ZXJ5KSkudG8uYmUuZmFsc2U7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGV4cGVjdChzdWJqZWN0KCcgJykpLnRvLmJlLmZhbHNlO1xuICAgICAgICBleHBlY3Qoc3ViamVjdCgnYSAnKSkudG8uYmUuZmFsc2U7XG4gICAgICAgIGV4cGVjdChzdWJqZWN0KCcgYWEgJykpLnRvLmJlLmZhbHNlO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdyZWplY3RzIHNob3J0IHF1ZXJpZXMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZXhwZWN0KHN1YmplY3QoJycpKS50by5iZS5mYWxzZTtcbiAgICAgICAgZXhwZWN0KHN1YmplY3QoJ2EnKSkudG8uYmUuZmFsc2U7XG4gICAgICAgIGV4cGVjdChzdWJqZWN0KCdhYScpKS50by5iZS5mYWxzZTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnYWNjZXB0cyBxdWVyaWVzIG5vdCBpbiBibGFja2xpc3QgbG9uZ2VyIHRoYW4gMiBjaGFycycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBleHBlY3Qoc3ViamVjdCgnd3d3dycpKS50by5iZS50cnVlO1xuICAgICAgICBleHBlY3Qoc3ViamVjdCgnaHR0cDovL3d3dy5mYWMnKSkudG8uYmUudHJ1ZTtcbiAgICAgICAgZXhwZWN0KHN1YmplY3QoJ3dtYWcnKSkudG8uYmUudHJ1ZTtcbiAgICAgICAgZXhwZWN0KHN1YmplY3QoJyB3d3cuZicpKS50by5iZS50cnVlO1xuICAgICAgfSk7XG5cbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdhZGRFWmZyb21CTScsIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJlc3VsdCA9IHtcbiAgICAgICAgdXJsOiAnaHR0cDovL3d3dy5iaWxkLmRlLycsXG4gICAgICAgIHNuaXBwZXQ6IHtcbiAgICAgICAgICB0aXRsZTogJ0JpbGQnLFxuICAgICAgICAgIGRlc2M6ICdCaWxkIE5ld3MnLFxuICAgICAgICB9LFxuICAgICAgICBleHRyYToge1xuICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGRvbWFpbjogJ2JpbGQuZGUnLFxuICAgICAgICAgICAgZnJpZW5kbHlfdXJsOiAnYmlsZC5kZScsXG4gICAgICAgICAgICBuYW1lOiAnQmlsZCcsXG4gICAgICAgICAgICB0ZW1wbGF0ZTogJ2VudGl0eS1uZXdzLTEnLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgdXJsOiAnaHR0cDovL3d3dy5iaWxkLmRlJyxcbiAgICAgICAgICBzdWJUeXBlOiAne1wiZXpcIjogXCI0NTczNjE3NjYxMDQwMDkyODU3XCJ9JyxcbiAgICAgICAgICB0cmlnZ2VyX3VybHM6IFtcbiAgICAgICAgICAgICdiaWxkLmRlJyxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgfTtcblxuICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMuZGVwcyhcImNvcmUvY2xpcXpcIikudXRpbHMuaXNDb21wbGV0ZVVybCA9ICgpID0+IHRydWU7XG4gICAgICAgIHRoaXMuZGVwcyhcImNvcmUvY2xpcXpcIikudXRpbHMuZ2V0RGV0YWlsc0Zyb21VcmwgPSAoKSA9PiAoeyBuYW1lOiAnYmlsZCcgfSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBhZGQgRVogdG8gZW1wdHkgbGlzdCcsIGZ1bmN0aW9uKCkge1xuXG4gICAgICAgIHZhciBleHRyYSA9IFtdO1xuXG4gICAgICAgIHRoaXMubW9kdWxlKCkuZGVmYXVsdC5fYWRkRVpmcm9tQk0oZXh0cmEsIHJlc3VsdCk7XG5cbiAgICAgICAgZXhwZWN0KGV4dHJhKS50by5oYXZlLmxlbmd0aCgxKTtcbiAgICAgICAgZXhwZWN0KGV4dHJhWzBdLmRhdGEuc3ViVHlwZSkudG8uZXF1YWwocmVzdWx0LmV4dHJhLnN1YlR5cGUpO1xuICAgICAgICBleHBlY3QoZXh0cmFbMF0uY29tbWVudCkudG8uZXF1YWwocmVzdWx0LnNuaXBwZXQudGl0bGUpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgYWRkIEVaIHRvIGVuZCBvZiBleGlzdGluZyBsaXN0JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBleHRyYSA9IFt7dGVzdDogJ2FiYyd9XTtcblxuICAgICAgICB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuX2FkZEVaZnJvbUJNKGV4dHJhLCByZXN1bHQpO1xuXG4gICAgICAgIGV4cGVjdChleHRyYSkudG8uaGF2ZS5sZW5ndGgoMik7XG4gICAgICAgIGV4cGVjdChleHRyYVtleHRyYS5sZW5ndGggLSAxXS5kYXRhLnN1YlR5cGUpLnRvLmVxdWFsKHJlc3VsdC5leHRyYS5zdWJUeXBlKTtcbiAgICAgICAgZXhwZWN0KGV4dHJhW2V4dHJhLmxlbmd0aCAtIDFdLmNvbW1lbnQpLnRvLmVxdWFsKHJlc3VsdC5zbmlwcGV0LnRpdGxlKTtcbiAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnY29sbGVjdFN1YmxpbmtzJywgZnVuY3Rpb24oKSB7XG4gICAgICBpdCgnc2hvdWxkIGZpbmQgbm90aGluZycsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICBkc2Y6ICdBc2ZkJyxcbiAgICAgICAgICBhZmRzOiB7XG4gICAgICAgICAgICBzZGZhOiB7XG4gICAgICAgICAgICAgIGZkczogJ2Zkc2EnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuICAgICAgICB2YXIgc3VibGlua3MgPSB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuX2NvbGxlY3RTdWJsaW5rcyhkYXRhKTtcblxuICAgICAgICBleHBlY3Qoc3VibGlua3MpLnRvLmJlLmVtcHR5O1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgZmluZCB3aXRoIGtleSB1cmwnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgZHNmOiAnQXNmZCcsXG4gICAgICAgICAgYWZkczoge1xuICAgICAgICAgICAgYWRmczogWydmZicsICdmZiddLFxuICAgICAgICAgICAgc2RmYToge1xuICAgICAgICAgICAgICB1cmw6ICdodHRwOi8vd3d3LnRlc3QuY29tJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHN1YmxpbmtzID0gdGhpcy5tb2R1bGUoKS5kZWZhdWx0Ll9jb2xsZWN0U3VibGlua3MoZGF0YSk7XG5cbiAgICAgICAgZXhwZWN0KHN1YmxpbmtzKS50by5jb250YWluKCdodHRwOi8vd3d3LnRlc3QuY29tJyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBmaW5kIHdpdGgga2V5IGhyZWYnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGRhdGEgPSB7XG4gICAgICAgICAgZHNmOiAnQXNmZCcsXG4gICAgICAgICAgYWZkczoge1xuICAgICAgICAgICAgYWRmczogWydmZicsICdmZiddLFxuICAgICAgICAgICAgc2RmYToge1xuICAgICAgICAgICAgICBocmVmOiAnaHR0cDovL3d3dy50ZXN0LmNvbScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICAgIHZhciBzdWJsaW5rcyA9IHRoaXMubW9kdWxlKCkuZGVmYXVsdC5fY29sbGVjdFN1YmxpbmtzKGRhdGEpO1xuXG4gICAgICAgIGV4cGVjdChzdWJsaW5rcykudG8uY29udGFpbignaHR0cDovL3d3dy50ZXN0LmNvbScpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgZmluZCB0aHJlZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZGF0YSA9IHtcbiAgICAgICAgICBkc2Y6ICdBc2ZkJyxcbiAgICAgICAgICB1cmw6ICdodHRwOi8vYmJiLmNvbScsXG4gICAgICAgICAgYWZkczoge1xuICAgICAgICAgICAgYWRmczogWydmZicsICdmZiddLFxuICAgICAgICAgICAgc2RmYTogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaHJlZjogJ2h0dHA6Ly93d3cudGVzdC5jb20nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaHJlZjogJ2h0dHA6Ly9hYWEuY29tJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIHN1YmxpbmtzID0gdGhpcy5tb2R1bGUoKS5kZWZhdWx0Ll9jb2xsZWN0U3VibGlua3MoZGF0YSk7XG5cbiAgICAgICAgZXhwZWN0KHN1YmxpbmtzKS50by5jb250YWluKCdodHRwOi8vd3d3LnRlc3QuY29tJyk7XG4gICAgICAgIGV4cGVjdChzdWJsaW5rcykudG8uY29udGFpbignaHR0cDovL2FhYS5jb20nKTtcbiAgICAgICAgZXhwZWN0KHN1YmxpbmtzKS50by5jb250YWluKCdodHRwOi8vYmJiLmNvbScpO1xuICAgICAgfSk7XG5cbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdnZXREdXBsaWNhdGVzJywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcmVzdWx0cywgY2xpcXo7XG4gICAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXN1bHRzID0gW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0eWxlOiAnZmF2aWNvbicsXG4gICAgICAgICAgICB2YWw6ICdodHRwczovL3d3dy5mYWNlYm9vay5jb20vJyxcbiAgICAgICAgICAgIGNvbW1lbnQ6ICdGYWNlYm9vayAoaGlzdG9yeSBnZW5lcmljKSEnLFxuICAgICAgICAgICAgbGFiZWw6ICdodHRwczovL3d3dy5mYWNlYm9vay5jb20vJyxcbiAgICAgICAgICAgIHF1ZXJ5OiAnZicsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIGtpbmQ6IFsnSCddLFxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZhY2Vib29rIGlzIGEgc29jaWFsIHV0aWxpdHkuJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdHlsZTogJ2Zhdmljb24nLFxuICAgICAgICAgICAgdmFsOiAnaHR0cDovL3d3dy5mYXNkLWhoLnJvc2Vua2UuZGUvJyxcbiAgICAgICAgICAgIGNvbW1lbnQ6ICdGQVNELUhhbWJ1cmcgLSBTdGFydHNlaXRlIChoaXN0b3J5IGdlbmVyaWMpIScsXG4gICAgICAgICAgICBsYWJlbDogJ2h0dHA6Ly93d3cuZmFzZC1oaC5yb3NlbmtlLmRlLycsXG4gICAgICAgICAgICBxdWVyeTogJ2YnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICBraW5kOiBbJ0gnXSxcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGQVNELUhhbWJ1cmcnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdO1xuXG4gICAgICAgIGNsaXF6ID0gW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0eWxlOiAnY2xpcXotcmVzdWx0cyBzb3VyY2VzLW0nLFxuICAgICAgICAgICAgdmFsOiAnaHR0cHM6Ly9tYWlsLmZhY2Vib29rLmNvbS8nLFxuICAgICAgICAgICAgY29tbWVudDogJ0ZhY2Vib29rJyxcbiAgICAgICAgICAgIGxhYmVsOiAnaHR0cHM6Ly9tYWlsLmZhY2Vib29rLmNvbS8nLFxuICAgICAgICAgICAgcXVlcnk6ICdibSBmIHVuZGVmaW5lZCcsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRmFjZWJvb2sgaXN0IGVpbiBzb3ppYWxlcy4nLFxuICAgICAgICAgICAgICB0aXRsZTogJ0ZhY2Vib29rJyxcbiAgICAgICAgICAgICAga2luZDogWydtfHtcImlcIjowfSddLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0eWxlOiAnY2xpcXotcmVzdWx0cyBzb3VyY2VzLW0nLFxuICAgICAgICAgICAgdmFsOiAnaHR0cHM6Ly9meHl6LmNvbS8nLFxuICAgICAgICAgICAgY29tbWVudDogJ0ZYWVonLFxuICAgICAgICAgICAgbGFiZWw6ICdodHRwczovL2Z4eXouY29tLycsXG4gICAgICAgICAgICBxdWVyeTogJ2JtIGYgdW5kZWZpbmVkJyxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGWFlaIGlzIGNvb2wnLFxuICAgICAgICAgICAgICB0aXRsZTogJ0ZYWVonLFxuICAgICAgICAgICAgICBraW5kOiBbJ218e1wiaVwiOjF9J10sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF07XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBmaW5kIG5vIGR1cGxpY2F0ZXMnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGR1cGxpY2F0ZXMgPSB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuX2dldER1cGxpY2F0ZXMocmVzdWx0cywgY2xpcXopO1xuICAgICAgICBleHBlY3QoZHVwbGljYXRlcykudG8uYmUuZW1wdHk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBmaW5kIG9uZSBkdXBsaWNhdGUgLSBtYWluIGxpbmsnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgY2xpcXpbMF0ubGFiZWwgPSBjbGlxelswXS52YWwgPSByZXN1bHRzWzBdLmxhYmVsO1xuICAgICAgICB2YXIgZHVwbGljYXRlcyA9IHRoaXMubW9kdWxlKCkuZGVmYXVsdC5fZ2V0RHVwbGljYXRlcyhyZXN1bHRzLCBjbGlxeik7XG4gICAgICAgIGV4cGVjdChkdXBsaWNhdGVzKS50by5oYXZlLmxlbmd0aCgxKTtcbiAgICAgICAgZXhwZWN0KGR1cGxpY2F0ZXNbMF0pLnRvLmJlLmRlZXAuZXF1YWwoY2xpcXpbMF0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgZmluZCBvbmUgZHVwbGljYXRlIC0gc3ViIGxpbmsnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzdWx0c1swXS5zdHlsZSA9ICdjbGlxei1wYXR0ZXJuJztcbiAgICAgICAgcmVzdWx0c1swXS5kYXRhLnVybHMgPSBbe2hyZWY6ICdodHRwczovL21haWwuZmFjZWJvb2suY29tLyd9XTtcbiAgICAgICAgdmFyIGR1cGxpY2F0ZXMgPSB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuX2dldER1cGxpY2F0ZXMocmVzdWx0cywgY2xpcXopO1xuICAgICAgICBleHBlY3QoZHVwbGljYXRlcykudG8uaGF2ZS5sZW5ndGgoMSk7XG4gICAgICAgIGV4cGVjdChkdXBsaWNhdGVzWzBdKS50by5iZS5kZWVwLmVxdWFsKGNsaXF6WzBdKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGZpbmQgb25lIGR1cGxpY2F0ZSAtIG1haW4gbGluayBkaWZmZXJlbnQgY291bnRyeScsIGZ1bmN0aW9uKCkge1xuICAgICAgICBjbGlxelswXS5sYWJlbCA9IGNsaXF6WzBdLnZhbCA9ICdodHRwczovL2RlLWRlLmZhY2Vib29rLmNvbS8nO1xuICAgICAgICB2YXIgZHVwbGljYXRlcyA9IHRoaXMubW9kdWxlKCkuZGVmYXVsdC5fZ2V0RHVwbGljYXRlcyhyZXN1bHRzLCBjbGlxeik7XG4gICAgICAgIGV4cGVjdChkdXBsaWNhdGVzKS50by5oYXZlLmxlbmd0aCgxKTtcbiAgICAgICAgZXhwZWN0KGR1cGxpY2F0ZXNbMF0pLnRvLmJlLmRlZXAuZXF1YWwoY2xpcXpbMF0pO1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBkZXNjcmliZSgnZGVkdXBsaWNhdGVSZXN1bHRzJywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgcmVzdWx0cywgY2xpcXo7XG4gICAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXN1bHRzID0gW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0eWxlOiAnZmF2aWNvbicsXG4gICAgICAgICAgICB2YWw6ICdodHRwczovL3d3dy5mYWNlYm9vay5jb20vJyxcbiAgICAgICAgICAgIGNvbW1lbnQ6ICdGYWNlYm9vayAoaGlzdG9yeSBnZW5lcmljKSEnLFxuICAgICAgICAgICAgbGFiZWw6ICdodHRwczovL3d3dy5mYWNlYm9vay5jb20vJyxcbiAgICAgICAgICAgIHF1ZXJ5OiAnZicsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIGtpbmQ6IFsnSCddLFxuICAgICAgICAgICAgICBkZXNjcmlwdGlvbjogJ0ZhY2Vib29rIGlzIGEgc29jaWFsIHV0aWxpdHkuJyxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBzdHlsZTogJ2Zhdmljb24nLFxuICAgICAgICAgICAgdmFsOiAnaHR0cDovL3d3dy5mYXNkLWhoLnJvc2Vua2UuZGUvJyxcbiAgICAgICAgICAgIGNvbW1lbnQ6ICdGQVNELUhhbWJ1cmcgLSBTdGFydHNlaXRlIChoaXN0b3J5IGdlbmVyaWMpIScsXG4gICAgICAgICAgICBsYWJlbDogJ2h0dHA6Ly93d3cuZmFzZC1oaC5yb3NlbmtlLmRlLycsXG4gICAgICAgICAgICBxdWVyeTogJ2YnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICBraW5kOiBbJ0gnXSxcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGQVNELUhhbWJ1cmcnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdO1xuXG4gICAgICAgIGNsaXF6ID0gW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0eWxlOiAnY2xpcXotcmVzdWx0cyBzb3VyY2VzLW0nLFxuICAgICAgICAgICAgdmFsOiAnaHR0cHM6Ly9tYWlsLmZhY2Vib29rLmNvbS8nLFxuICAgICAgICAgICAgY29tbWVudDogJ0ZhY2Vib29rJyxcbiAgICAgICAgICAgIGxhYmVsOiAnaHR0cHM6Ly9tYWlsLmZhY2Vib29rLmNvbS8nLFxuICAgICAgICAgICAgcXVlcnk6ICdibSBmIHVuZGVmaW5lZCcsXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIGRlc2NyaXB0aW9uOiAnRmFjZWJvb2sgaXN0IGVpbiBzb3ppYWxlcy4nLFxuICAgICAgICAgICAgICB0aXRsZTogJ0ZhY2Vib29rJyxcbiAgICAgICAgICAgICAga2luZDogWydtfHtcImlcIjowfSddLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIHN0eWxlOiAnY2xpcXotcmVzdWx0cyBzb3VyY2VzLW0nLFxuICAgICAgICAgICAgdmFsOiAnaHR0cHM6Ly9meHl6LmNvbS8nLFxuICAgICAgICAgICAgY29tbWVudDogJ0ZYWVonLFxuICAgICAgICAgICAgbGFiZWw6ICdodHRwczovL2Z4eXouY29tLycsXG4gICAgICAgICAgICBxdWVyeTogJ2JtIGYgdW5kZWZpbmVkJyxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgZGVzY3JpcHRpb246ICdGWFlaIGlzIGNvb2wnLFxuICAgICAgICAgICAgICB0aXRsZTogJ0ZYWVonLFxuICAgICAgICAgICAgICBraW5kOiBbJ218e1wiaVwiOjF9J10sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIF07XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBsZWF2ZSBib3RoIGxpc3RzIGFsb25lJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciByID0gdGhpcy5tb2R1bGUoKS5kZWZhdWx0Ll9kZWR1cGxpY2F0ZVJlc3VsdHMocmVzdWx0cywgY2xpcXopO1xuXG4gICAgICAgIGV4cGVjdChyLmZpcnN0KS50by5oYXZlLmxlbmd0aCgyKTtcbiAgICAgICAgZXhwZWN0KHIuc2Vjb25kKS50by5oYXZlLmxlbmd0aCgyKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHJlbW92ZSBmYWNlYm9vayBmcm9tIGNsaXF6JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsaXF6WzBdLmxhYmVsID0gY2xpcXpbMF0udmFsID0gcmVzdWx0c1swXS5sYWJlbDtcblxuICAgICAgICB2YXIgciA9IHRoaXMubW9kdWxlKCkuZGVmYXVsdC5fZGVkdXBsaWNhdGVSZXN1bHRzKHJlc3VsdHMsIGNsaXF6KTtcblxuICAgICAgICBleHBlY3Qoci5maXJzdCkudG8uaGF2ZS5sZW5ndGgoMik7XG4gICAgICAgIGV4cGVjdChyLnNlY29uZCkudG8uaGF2ZS5sZW5ndGgoMSk7XG5cbiAgICAgICAgLy8gQ2hlY2sga2luZHMgYXJlIGNvbWJpbmVkIHByb3Blcmx5XG4gICAgICAgIGV4cGVjdChyLmZpcnN0WzBdLmRhdGEua2luZCkudG8uY29udGFpbihjbGlxelswXS5kYXRhLmtpbmRbMF0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgcmVtb3ZlIGZhY2Vib29rIGZyb20gY2xpcXogYmVjYXVzZSBvZiBtYXRjaGluZyBzdWJsaW5rJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc3VsdHNbMF0uc3R5bGUgPSAnY2xpcXotcGF0dGVybic7XG4gICAgICAgIHJlc3VsdHNbMF0uZGF0YS51cmxzID0gW3tocmVmOiAnaHR0cHM6Ly9tYWlsLmZhY2Vib29rLmNvbS8nfV07XG5cbiAgICAgICAgdmFyIHIgPSB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuX2RlZHVwbGljYXRlUmVzdWx0cyhyZXN1bHRzLCBjbGlxeik7XG5cbiAgICAgICAgZXhwZWN0KHIuZmlyc3QpLnRvLmhhdmUubGVuZ3RoKDIpO1xuICAgICAgICBleHBlY3Qoci5zZWNvbmQpLnRvLmhhdmUubGVuZ3RoKDEpO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgcmVtb3ZlIGZhY2Vib29rIGZyb20gY2xpcXogYmVjYXVzZSBvbmx5IGRpZmZlcmVudCBieSBjb3VudHJ5JywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGNsaXF6WzBdLmxhYmVsID0gY2xpcXpbMF0udmFsID0gJ2h0dHBzOi8vZGUtZGUuZmFjZWJvb2suY29tLyc7XG5cbiAgICAgICAgdmFyIHIgPSB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuX2RlZHVwbGljYXRlUmVzdWx0cyhyZXN1bHRzLCBjbGlxeik7XG5cbiAgICAgICAgZXhwZWN0KHIuZmlyc3QpLnRvLmhhdmUubGVuZ3RoKDIpO1xuICAgICAgICBleHBlY3Qoci5zZWNvbmQpLnRvLmhhdmUubGVuZ3RoKDEpO1xuXG4gICAgICAgIC8vIENoZWNrIGtpbmRzIGFyZSBjb21iaW5lZCBwcm9wZXJseVxuICAgICAgICBleHBlY3Qoci5maXJzdFswXS5kYXRhLmtpbmQpLnRvLmNvbnRhaW4oY2xpcXpbMF0uZGF0YS5raW5kWzBdKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ2lzVmFsaWRFWicsIGZ1bmN0aW9uKCkge1xuICAgICAgdmFyIHJlc3VsdDtcblxuICAgICAgYmVmb3JlRWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzdWx0ID0ge1xuICAgICAgICAgIHN0eWxlOiAnY2xpcXotZXh0cmEnLFxuICAgICAgICAgIHZhbDogJ2h0dHBzOi8vY2xpcXouY29tLycsXG4gICAgICAgICAgY29tbWVudDogJ0NsaXF6JyxcbiAgICAgICAgICBsYWJlbDogJ2h0dHBzOi8vY2xpcXouY29tLycsXG4gICAgICAgICAgcXVlcnk6ICdjbGlxei5jJyxcbiAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICBmcmllbmRseV91cmw6ICdjbGlxei5jb20nLFxuICAgICAgICAgICAgdGVtcGxhdGU6ICdDbGlxeicsXG4gICAgICAgICAgICBzdWJUeXBlOiAne1wiY2xhc3NcIjogXCJDbGlxekVaXCIsIFwiZXpcIjogXCJkZXByZWNhdGVkXCJ9JyxcbiAgICAgICAgICAgIHRyaWdnZXJfdXJsczogWydjbGlxei5jb20nXSxcbiAgICAgICAgICAgIHRzOiAxNDQ3NzcyMTYyLFxuICAgICAgICAgICAga2luZDogWydYfHtcImV6XCI6XCItNzI5MDI4OTI3MzM5MzYxMzcyOVwiLFwidHJpZ2dlcl9tZXRob2RcIjpcInJoX3F1ZXJ5XCJ9J10sXG4gICAgICAgICAgICBfX3N1YlR5cGVfXzoge1xuICAgICAgICAgICAgICBjbGFzczogXCJDbGlxekVaXCIsXG4gICAgICAgICAgICAgIGlkOiBcIjI3MDAxNTAwOTMxMzMzOTg0NjBcIixcbiAgICAgICAgICAgICAgbmFtZTogXCJDbGlxeiAxXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBhY2NlcHQgZ29vZCBleicsIGZ1bmN0aW9uKCkge1xuICAgICAgICBleHBlY3QodGhpcy5tb2R1bGUoKS5kZWZhdWx0Ll9pc1ZhbGlkRVoocmVzdWx0KSkudG8uYmUudHJ1ZTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGRpc2NhcmQgaWYgdXJsIGlzIG1pc3NpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZGVsZXRlIHJlc3VsdC52YWw7XG4gICAgICAgIGV4cGVjdCh0aGlzLm1vZHVsZSgpLmRlZmF1bHQuX2lzVmFsaWRFWihyZXN1bHQpKS50by5iZS5mYWxzZTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGRpc2NhcmQgaWYgZGF0YSBpcyBtaXNzaW5nJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGRlbGV0ZSByZXN1bHQuZGF0YTtcbiAgICAgICAgZXhwZWN0KHRoaXMubW9kdWxlKCkuZGVmYXVsdC5faXNWYWxpZEVaKHJlc3VsdCkpLnRvLmJlLmZhbHNlO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgZGlzY2FyZCBpZiBzdWJUeXBlIGlzIG1pc3Npbmcgb3IgdW5wYXJzYWJsZScsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXN1bHQuZGF0YS5zdWJUeXBlID0gJ2Fmc2RmZGFzZmRzZmRzeyc7XG4gICAgICAgIGV4cGVjdCh0aGlzLm1vZHVsZSgpLmRlZmF1bHQuX2lzVmFsaWRFWihyZXN1bHQpKS50by5iZS5mYWxzZTtcbiAgICAgICAgZGVsZXRlIHJlc3VsdC5zdWJUeXBlO1xuICAgICAgICBleHBlY3QodGhpcy5tb2R1bGUoKS5kZWZhdWx0Ll9pc1ZhbGlkRVoocmVzdWx0KSkudG8uYmUuZmFsc2U7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBkaXNjYXJkIGlmIF9fc3ViVHlwZV9fIGlzIG1pc3Npbmcgb3IgSUQgaXMgbWlzc2luZycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBkZWxldGUgcmVzdWx0LmRhdGEuX19zdWJUeXBlX18uaWQ7XG4gICAgICAgIGV4cGVjdCh0aGlzLm1vZHVsZSgpLmRlZmF1bHQuX2lzVmFsaWRFWihyZXN1bHQpKS50by5iZS5mYWxzZTtcbiAgICAgICAgZGVsZXRlIHJlc3VsdC5kYXRhLl9fc3ViVHlwZV9fO1xuICAgICAgICBleHBlY3QodGhpcy5tb2R1bGUoKS5kZWZhdWx0Ll9pc1ZhbGlkRVoocmVzdWx0KSkudG8uYmUuZmFsc2U7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdjYWNoZUVacycsIGZ1bmN0aW9uKCkge1xuXG4gICAgICBmdW5jdGlvbiBnZXRVcmxmdW5jdGlvbihzbWFydENsaXF6KSB7XG4gICAgICAgIC8vcmV0dXJuIENsaXF6VXRpbHMuZ2VuZXJhbGl6ZVVybChzbWFydENsaXF6LnZhbCwgdHJ1ZSk7XG4gICAgICB9XG5cbiAgICAgIHZhciBzYXZlZCA9IGZhbHNlLFxuICAgICAgICAgIHJlc3VsdHMgPSB7fSxcbiAgICAgICAgICB1cmxzID0ge30sXG4gICAgICAgICAgZXpzID0ge30sXG4gICAgICAgICAgc21hcnRDbGlxekNhY2hlID0ge30sXG4gICAgICAgICAgdHJpZ2dlclVybENhY2hlID0ge30sXG4gICAgICAgICAgZXpzdG9yZSxcbiAgICAgICAgICB0ZXN0O1xuXG4gICAgICAvLyBNb2NrIENsaXF6U21hcnRDbGlxekNhY2hlXG4gICAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXN1bHRzID0gW3tcbiAgICAgICAgICBzdHlsZTogJ2NsaXF6LWV4dHJhJyxcbiAgICAgICAgICB2YWw6ICdodHRwczovL2NsaXF6LmNvbS8nLFxuICAgICAgICAgIGNvbW1lbnQ6ICdDbGlxeicsXG4gICAgICAgICAgbGFiZWw6ICdodHRwczovL2NsaXF6LmNvbS8nLFxuICAgICAgICAgIHF1ZXJ5OiAnY2xpcXouYycsXG4gICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgZnJpZW5kbHlfdXJsOiAnY2xpcXouY29tJyxcbiAgICAgICAgICAgIHRlbXBsYXRlOiAnQ2xpcXonLFxuICAgICAgICAgICAgc3ViVHlwZTogJ3tcImNsYXNzXCI6IFwiQ2xpcXpFWlwiLCBcImV6XCI6IFwiZGVwcmVjYXRlZFwifScsXG4gICAgICAgICAgICB0cmlnZ2VyX3VybHM6IFsnY2xpcXouY29tJ10sXG4gICAgICAgICAgICB0czogMTQ0Nzc3MjE2MixcbiAgICAgICAgICAgIGtpbmQ6IFsnWHx7XCJlelwiOlwiLTcyOTAyODkyNzMzOTM2MTM3MjlcIixcInRyaWdnZXJfbWV0aG9kXCI6XCJyaF9xdWVyeVwifSddLFxuICAgICAgICAgICAgX19zdWJUeXBlX186IHtcbiAgICAgICAgICAgICAgY2xhc3M6IFwiQ2xpcXpFWlwiLFxuICAgICAgICAgICAgICBpZDogXCIyNzAwMTUwMDkzMTMzMzk4NDYwXCIsXG4gICAgICAgICAgICAgIG5hbWU6IFwiQ2xpcXogMVwiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9XTtcblxuICAgICAgICBzYXZlZCA9IGZhbHNlO1xuICAgICAgICB1cmxzID0ge307XG4gICAgICAgIGV6cyA9IHt9O1xuXG4gICAgICAgIHRyaWdnZXJVcmxDYWNoZS5yZXRyaWV2ZSA9IGZ1bmN0aW9uICh1cmwpIHtcbiAgICAgICAgICBpZiAoISh1cmwgaW4gdXJscykpIHtcbiAgICAgICAgICAgIHJldHVybiB1cmxzW3VybF07XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHRyaWdnZXJVcmxDYWNoZS5zdG9yZSA9IGZ1bmN0aW9uICh1cmwsIGV6dHlwZSkge1xuICAgICAgICAgIHVybHNbdXJsXSA9IGV6dHlwZTtcbiAgICAgICAgICBzYXZlZCA9IGZhbHNlO1xuICAgICAgICB9O1xuICAgICAgICB0cmlnZ2VyVXJsQ2FjaGUuc2F2ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICBzYXZlZCA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgc21hcnRDbGlxekNhY2hlLnN0b3JlID0gZnVuY3Rpb24oZXpEYXRhKSB7XG4gICAgICAgICAgZXpzW2dldFVybGZ1bmN0aW9uKGV6RGF0YSldID0gZXpEYXRhO1xuICAgICAgICB9O1xuICAgICAgICB0cmlnZ2VyVXJsQ2FjaGUuaXNDYWNoZWQgPSAoKSA9PiBmYWxzZTtcblxuICAgICAgICB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuaW5pdCh7XG4gICAgICAgICAgc21hcnRDbGlxekNhY2hlLFxuICAgICAgICAgIHRyaWdnZXJVcmxDYWNoZSxcbiAgICAgICAgfSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBjYWNoZSAxIGVudHJ5IGdpdmVuIDEnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgdGhpcy5tb2R1bGUoKS5kZWZhdWx0Ll9jYWNoZUVacyhbcmVzdWx0c1swXV0pO1xuXG4gICAgICAgIGV4cGVjdChzYXZlZCkudG8uYmUudHJ1ZTtcbiAgICAgICAgZXhwZWN0KE9iamVjdC5rZXlzKHVybHMpKS5sZW5ndGgudG8uYmUoMSk7XG4gICAgICAgIGV4cGVjdCh1cmxzW3Jlc3VsdHNbMF0uZGF0YS50cmlnZ2VyX3VybHNbMF1dKS50by5iZS50cnVlO1xuICAgICAgICBleHBlY3QoZXpzW2dldFVybGZ1bmN0aW9uKHJlc3VsdHNbMF0pXSkudG8uZXF1YWwocmVzdWx0c1swXSk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBjYWNoZSAxIGVudHJ5IGdpdmVuIDIgd2l0aCBzYW1lIFVSTCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICByZXN1bHRzLnB1c2goSlNPTi5wYXJzZShKU09OLnN0cmluZ2lmeShyZXN1bHRzWzBdKSkpO1xuICAgICAgICByZXN1bHRzWzFdLmNvbW1lbnQgPSAnU2Vjb25kIGVudHJ5JztcbiAgICAgICAgdGhpcy5tb2R1bGUoKS5kZWZhdWx0Ll9jYWNoZUVacyhyZXN1bHRzKTtcblxuICAgICAgICBleHBlY3Qoc2F2ZWQpLnRvLmJlLnRydWU7XG4gICAgICAgIGV4cGVjdChPYmplY3Qua2V5cyh1cmxzKSkubGVuZ3RoLnRvLmJlKDEpO1xuICAgICAgICBleHBlY3QodXJsc1tyZXN1bHRzWzBdLmRhdGEudHJpZ2dlcl91cmxzWzBdXSkudG8uYmUudHJ1ZTtcblxuICAgICAgICAvLyByZXF1aXJlIGZpcnN0IGVudHJ5IHRvIGhhdmUgcHJpb3JpdHkgb3ZlciB0aGUgc2Vjb25kXG4gICAgICAgIGV4cGVjdChlenNbZ2V0VXJsZnVuY3Rpb24ocmVzdWx0c1swXSldKS50by5lcXVhbChyZXN1bHRzWzBdKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIGNhY2hlIDIgZW50cmllcyBnaXZlbiAyJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc3VsdHMucHVzaChKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KHJlc3VsdHNbMF0pKSk7XG4gICAgICAgIHJlc3VsdHNbMV0udmFsID0gJ2h0dHA6Ly90ZXN0LmNvbSc7XG4gICAgICAgIHJlc3VsdHNbMV0uZGF0YS50cmlnZ2VyX3VybHNbMF0gPSAndGVzdC5jb20nO1xuICAgICAgICByZXN1bHRzWzFdLmRhdGEuX19zdWJUeXBlX18gPSB7IGlkOiBcIjExMTExMTExMTFcIiB9O1xuXG4gICAgICAgIHRoaXMubW9kdWxlKCkuZGVmYXVsdC5fY2FjaGVFWnMocmVzdWx0cyk7XG5cbiAgICAgICAgZXhwZWN0KHNhdmVkKS50by5iZS50cnVlO1xuICAgICAgICBleHBlY3QoT2JqZWN0LmtleXModXJscykpLmxlbmd0aC50by5iZSgyKTtcbiAgICAgICAgcmVzdWx0cy5mb3JFYWNoKGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgIGV4cGVjdCh1cmxzW3Jlc3VsdC5kYXRhLnRyaWdnZXJfdXJsc1swXV0pLnRvLmJlLnRydWU7XG4gICAgICAgICAgLy8gZXhwZWN0KGV6c1tnZXRVcmxmdW5jdGlvbihyZXN1bHQpXSkudG8uZXF1YWwocmVzdWx0KTtcbiAgICAgICAgfSk7XG4gICAgICB9KTtcbiAgICB9KTtcblxuICAgIGRlc2NyaWJlKCdoaXN0b3J5VHJpZ2dlckVaJywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIgZmV0Y2hpbmcsXG4gICAgICAgICAgcmVzdWx0ID0ge30sXG4gICAgICAgICAgdXJscyA9IHt9LFxuICAgICAgICAgIGV6cyA9IHt9LFxuICAgICAgICAgIHNtYXJ0Q2xpcXpDYWNoZSA9IHt9LFxuICAgICAgICAgIHRyaWdnZXJVcmxDYWNoZSA9IHt9O1xuXG4gICAgICAvLyBNb2NrIENsaXF6U21hcnRDbGlxekNhY2hlXG4gICAgICBiZWZvcmVFYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICByZXN1bHQgPSB7XG4gICAgICAgICAgc3R5bGU6ICdjbGlxei1wYXR0ZXJuJyxcbiAgICAgICAgICB2YWw6ICdodHRwczovL2NsaXF6LmNvbS8nLFxuICAgICAgICAgIGNvbW1lbnQ6ICdDbGlxeicsXG4gICAgICAgICAgbGFiZWw6ICdodHRwczovL2NsaXF6LmNvbS8nLFxuICAgICAgICAgIHF1ZXJ5OiAnY2xpcXouYycsXG4gICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgY2x1c3RlcjogdHJ1ZSxcbiAgICAgICAgICAgIHVybHM6IFtdLFxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG5cbiAgICAgICAgZXpzID0ge1xuICAgICAgICAgICctNzI5MDI4OTI3MzM5MzYxMzcyOSc6IHtcbiAgICAgICAgICAgIHN0eWxlOiAnY2xpcXotZXh0cmEnLFxuICAgICAgICAgICAgdmFsOiAnaHR0cHM6Ly9jbGlxei5jb20vJyxcbiAgICAgICAgICAgIGNvbW1lbnQ6ICdDbGlxeicsXG4gICAgICAgICAgICBsYWJlbDogJ2h0dHBzOi8vY2xpcXouY29tLycsXG4gICAgICAgICAgICBxdWVyeTogJ2NsaXF6LmMnLFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICBmcmllbmRseV91cmw6ICdjbGlxei5jb20nLFxuICAgICAgICAgICAgICB0ZW1wbGF0ZTogJ0NsaXF6JyxcbiAgICAgICAgICAgICAgc3ViVHlwZTogJ3tcImNsYXNzXCI6IFwiQ2xpcXpFWlwiLCBcImV6XCI6IFwiZGVwcmVjYXRlZFwifScsXG4gICAgICAgICAgICAgIHRyaWdnZXJfdXJsczogWydjbGlxei5jb20nXSxcbiAgICAgICAgICAgICAgdHM6IDE0NDc3NzIxNjIsXG4gICAgICAgICAgICAgIGtpbmQ6IFsnWHx7XCJlelwiOlwiLTcyOTAyODkyNzMzOTM2MTM3MjlcIixcInRyaWdnZXJfbWV0aG9kXCI6XCJyaF9xdWVyeVwifSddLFxuICAgICAgICAgICAgICBfX3N1YlR5cGVfXzoge1xuICAgICAgICAgICAgICAgIGNsYXNzOiBcIkNsaXF6RVpcIixcbiAgICAgICAgICAgICAgICBpZDogXCIyNzAwMTUwMDkzMTMzMzk4NDYwXCIsXG4gICAgICAgICAgICAgICAgbmFtZTogXCJDbGlxeiAxXCIsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIH0sXG4gICAgICAgIH07XG5cbiAgICAgICAgdXJscyA9IHtcbiAgICAgICAgICAnY2xpcXouY29tJzogdHJ1ZSxcbiAgICAgICAgfTtcblxuICAgICAgICBmZXRjaGluZyA9IHVuZGVmaW5lZDtcblxuICAgICAgICB0cmlnZ2VyVXJsQ2FjaGUuaXNDYWNoZWQgPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgICAgcmV0dXJuIHVybHNbdXJsXSA/IHRydWUgOiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICB0cmlnZ2VyVXJsQ2FjaGUucmV0cmlldmUgPSBmdW5jdGlvbiAodXJsKSB7XG4gICAgICAgICAgcmV0dXJuIHVybHNbdXJsXTtcbiAgICAgICAgfTtcblxuICAgICAgICB0cmlnZ2VyVXJsQ2FjaGUuaXNTdGFsZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfTtcblxuICAgICAgICBzbWFydENsaXF6Q2FjaGUuZmV0Y2hBbmRTdG9yZSA9IGZ1bmN0aW9uKHVybCkge1xuICAgICAgICAgIGZldGNoaW5nID0gdXJsO1xuICAgICAgICB9O1xuXG4gICAgICAgIHNtYXJ0Q2xpcXpDYWNoZS5yZXRyaWV2ZSA9IGZ1bmN0aW9uKHVybCkge1xuICAgICAgICAgIHJldHVybiBlenNbdXJsXTtcbiAgICAgICAgfTtcblxuICAgICAgICBzbWFydENsaXF6Q2FjaGUucmV0cmlldmVBbmRVcGRhdGUgPSBzbWFydENsaXF6Q2FjaGUucmV0cmlldmU7XG5cbiAgICAgICAgdGhpcy5kZXBzKFwiY29yZS9jbGlxelwiKS51dGlscy5nZW5lcmFsaXplVXJsID0gKCkgPT4gXCJjbGlxei5jb21cIjtcbiAgICAgICAgdGhpcy5tb2R1bGUoKS5kZWZhdWx0LmluaXQoe1xuICAgICAgICAgIHNtYXJ0Q2xpcXpDYWNoZSxcbiAgICAgICAgICB0cmlnZ2VyVXJsQ2FjaGUsXG4gICAgICAgIH0pO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgdHJpZ2dlciBleicsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZXogPSB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuX2hpc3RvcnlUcmlnZ2VyRVoocmVzdWx0KTtcbiAgICAgICAgZXhwZWN0KGV6KS50by5lcXVhbChlenNbdXJsc1snY2xpcXouY29tJ11dKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIG5vdCB0cmlnZ2VyIGV6IGJ1dCBmZXRjaCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBlenMgPSB7fTtcbiAgICAgICAgdmFyIGV6ID0gdGhpcy5tb2R1bGUoKS5kZWZhdWx0Ll9oaXN0b3J5VHJpZ2dlckVaKHJlc3VsdCk7XG4gICAgICAgIGV4cGVjdChleikudG8uYmUudW5kZWZpbmVkO1xuICAgICAgICBleHBlY3QoZmV0Y2hpbmcpLnRvLmVxdWFsKCdjbGlxei5jb20nKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIHRyaWdnZXIgZXogYmVjYXVzZSBubyBjbHVzdGVyJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIHJlc3VsdC5kYXRhLmNsdXN0ZXIgPSBmYWxzZTtcbiAgICAgICAgdmFyIGV6ID0gdGhpcy5tb2R1bGUoKS5kZWZhdWx0Ll9oaXN0b3J5VHJpZ2dlckVaKHJlc3VsdCk7XG4gICAgICAgIGV4cGVjdChleikudG8uYmUudW5kZWZpbmVkO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgdHJpZ2dlciBleiBiZWNhdXNlIGNsdXN0ZXIgYmFzZSBkb21haW4gaW5mZXJyZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcmVzdWx0LmRhdGEuYXV0b0FkZCA9IHRydWU7XG4gICAgICAgIHZhciBleiA9IHRoaXMubW9kdWxlKCkuZGVmYXVsdC5faGlzdG9yeVRyaWdnZXJFWihyZXN1bHQpO1xuICAgICAgICBleHBlY3QoZXopLnRvLmJlLnVuZGVmaW5lZDtcbiAgICAgIH0pO1xuICAgIH0pO1xuXG4gICAgZGVzY3JpYmUoJ2ZpbHRlckNvbmZsaWN0aW5nRVonLCBmdW5jdGlvbigpIHtcblxuICAgICAgdmFyIGZpcnN0UmVzdWx0LCBlenM7XG5cbiAgICAgIGJlZm9yZUVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgIGZpcnN0UmVzdWx0ID0ge1xuICAgICAgICAgIHN0eWxlOiAnY2xpcXotcGF0dGVybicsXG4gICAgICAgICAgdmFsOiAnaHR0cHM6Ly9jbGlxei5jb20vJyxcbiAgICAgICAgICBjb21tZW50OiAnQ2xpcXonLFxuICAgICAgICAgIGxhYmVsOiAnaHR0cHM6Ly9jbGlxei5jb20vJyxcbiAgICAgICAgICBxdWVyeTogJ2NsaXF6LmMnLFxuICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgIGNsdXN0ZXI6IHRydWUsXG4gICAgICAgICAgICB1cmxzOiBbXSxcbiAgICAgICAgICB9LFxuICAgICAgICB9O1xuXG4gICAgICAgIGV6cyA9IFtcbiAgICAgICAge1xuICAgICAgICAgIHN0eWxlOiAnY2xpcXotZXh0cmEnLFxuICAgICAgICAgIHZhbDogJ2h0dHBzOi8vY2xpcXouY29tLycsXG4gICAgICAgICAgY29tbWVudDogJ0NsaXF6JyxcbiAgICAgICAgICBsYWJlbDogJ2h0dHBzOi8vY2xpcXouY29tLycsXG4gICAgICAgICAgcXVlcnk6ICdjbGlxei5jJyxcbiAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgIGZyaWVuZGx5X3VybDogJ2NsaXF6LmNvbScsXG4gICAgICAgICAgICAgIHRlbXBsYXRlOiAnQ2xpcXonLFxuICAgICAgICAgICAgICBzdWJUeXBlOiAne1wiY2xhc3NcIjogXCJDbGlxekVaXCIsIFwiZXpcIjogXCJkZXByZWNhdGVkXCJ9JyxcbiAgICAgICAgICAgICAgdHJpZ2dlcl91cmxzOiBbJ2NsaXF6LmNvbSddLFxuICAgICAgICAgICAgICB0czogMTQ0Nzc3MjE2MixcbiAgICAgICAgICAgICAga2luZDogWydYfHtcImV6XCI6XCItNzI5MDI4OTI3MzM5MzYxMzcyOVwiLFwidHJpZ2dlcl9tZXRob2RcIjpcInJoX3F1ZXJ5XCJ9J10sXG4gICAgICAgICAgICAgIF9fc3ViVHlwZV9fOiB7XG4gICAgICAgICAgICAgICAgY2xhc3M6IFwiQ2xpcXpFWlwiLFxuICAgICAgICAgICAgICAgIGlkOiBcIjI3MDAxNTAwOTMxMzMzOTg0NjBcIixcbiAgICAgICAgICAgICAgICBuYW1lOiBcIkNsaXF6IDFcIixcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdO1xuICAgICAgfSk7XG5cbiAgICAgIGl0KCdzaG91bGQgbm90IGNvbmZsaWN0IGlmIGhpc3RvcnkgbWF0Y2hlcycsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZmluYWxFeHRyYSA9IHRoaXMubW9kdWxlKCkuZGVmYXVsdC5fZmlsdGVyQ29uZmxpY3RpbmdFWihlenMsIGZpcnN0UmVzdWx0KTtcbiAgICAgICAgZXhwZWN0KGZpbmFsRXh0cmEpLnRvLmRlZXAuZXF1YWwoZXpzKTtcbiAgICAgIH0pO1xuXG4gICAgICBpdCgnc2hvdWxkIG5vdCBjb25mbGljdCBpZiBubyBiZXQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZmlyc3RSZXN1bHQudmFsID0gJ2h0dHA6Ly9mYWNlYm9vay5jb20nO1xuICAgICAgICBmaXJzdFJlc3VsdC5kYXRhLmNsdXN0ZXIgPSBmYWxzZTtcbiAgICAgICAgdmFyIGZpbmFsRXh0cmEgPSB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuX2ZpbHRlckNvbmZsaWN0aW5nRVooZXpzLCBmaXJzdFJlc3VsdCk7XG4gICAgICAgIGV4cGVjdChmaW5hbEV4dHJhKS50by5kZWVwLmVxdWFsKGV6cyk7XG4gICAgICB9KTtcblxuICAgICAgaXQoJ3Nob3VsZCBjb25mbGljdCBpZiBoaXN0b3J5IGJldCBkb2VzIG5vdCBtYXRjaCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICBmaXJzdFJlc3VsdC52YWwgPSAnaHR0cDovL2ZhY2Vib29rLmNvbSc7XG4gICAgICAgIHZhciBmaW5hbEV4dHJhID0gdGhpcy5tb2R1bGUoKS5kZWZhdWx0Ll9maWx0ZXJDb25mbGljdGluZ0VaKGV6cywgZmlyc3RSZXN1bHQpO1xuICAgICAgICBleHBlY3QoZmluYWxFeHRyYSkudG8uaGF2ZS5sZW5ndGgoMCk7XG4gICAgICB9KTtcblxuICAgICAgLy8gV2lsbCB0aGUgYXV0b2NvbXBsZXRlIGNoYW5nZSBpZiB3ZSB1c2UgdGhpcyBFWj9cbiAgICAgIGl0KCdzaG91bGQgY29uZmxpY3QgaWYgYXV0b2NvbXBsZXRlIGRvZXMgbm90IG1hdGNoJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGZpcnN0UmVzdWx0LnZhbCA9ICdodHRwOi8vZmFjZWJvb2suY29tJztcbiAgICAgICAgZmlyc3RSZXN1bHQuY2x1c3RlciA9IGZhbHNlO1xuICAgICAgICBmaXJzdFJlc3VsdC5hdXRvY29tcGxldGVkID0gdHJ1ZTtcbiAgICAgICAgdmFyIGZpbmFsRXh0cmEgPSB0aGlzLm1vZHVsZSgpLmRlZmF1bHQuX2ZpbHRlckNvbmZsaWN0aW5nRVooZXpzLCBmaXJzdFJlc3VsdCk7XG4gICAgICAgIGV4cGVjdChmaW5hbEV4dHJhKS50by5oYXZlLmxlbmd0aCgwKTtcbiAgICAgIH0pO1xuXG4gICAgfSk7XG4gIH1cbik7XG4iXX0=