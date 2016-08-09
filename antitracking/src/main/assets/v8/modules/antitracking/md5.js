System.register('antitracking/md5', ['antitracking/fixed-size-cache', 'core/helpers/md5'], function (_export) {
    'use strict';

    var MapCache, coreMd5, md5, md5Cache;
    return {
        setters: [function (_antitrackingFixedSizeCache) {
            MapCache = _antitrackingFixedSizeCache['default'];
        }, function (_coreHelpersMd5) {
            coreMd5 = _coreHelpersMd5['default'];
        }],
        execute: function () {
            md5 = _md5Native || coreMd5;
            md5Cache = new MapCache(md5, 1000);

            _export('default', function (s) {
                if (!s) return "";
                return md5Cache.get(s);
            });
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy9tZDUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7OzJCQUdNLEdBQUcsRUFFTCxRQUFROzs7Ozs7OztBQUZOLGVBQUcsR0FBRyxVQUFVLElBQUksT0FBTztBQUU3QixvQkFBUSxHQUFHLElBQUksUUFBUSxDQUFDLEdBQUcsRUFBRSxJQUFJLENBQUM7OytCQUV2QixVQUFTLENBQUMsRUFBRTtBQUN2QixvQkFBSSxDQUFDLENBQUMsRUFBRSxPQUFPLEVBQUUsQ0FBQztBQUNsQix1QkFBTyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO2FBQzFCIiwiZmlsZSI6ImFudGl0cmFja2luZy9tZDUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgTWFwQ2FjaGUgZnJvbSAnYW50aXRyYWNraW5nL2ZpeGVkLXNpemUtY2FjaGUnO1xuaW1wb3J0IGNvcmVNZDUgZnJvbSAnY29yZS9oZWxwZXJzL21kNSdcblxuY29uc3QgbWQ1ID0gX21kNU5hdGl2ZSB8fCBjb3JlTWQ1O1xuXG52YXIgbWQ1Q2FjaGUgPSBuZXcgTWFwQ2FjaGUobWQ1LCAxMDAwKTtcblxuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24ocykge1xuICAgIGlmICghcykgcmV0dXJuIFwiXCI7XG4gICAgcmV0dXJuIG1kNUNhY2hlLmdldChzKTtcbn1cbiJdfQ==