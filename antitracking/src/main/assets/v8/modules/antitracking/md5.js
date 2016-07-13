System.register('antitracking/md5', ['antitracking/fixed-size-cache', 'core/crypto'], function (_export) {
    'use strict';

    var MapCache, md5, md5Cache;
    return {
        setters: [function (_antitrackingFixedSizeCache) {
            MapCache = _antitrackingFixedSizeCache['default'];
        }, function (_coreCrypto) {
            md5 = _coreCrypto.md5;
        }],
        execute: function () {
            md5Cache = new MapCache(md5, 1000);

            _export('default', function (s) {
                if (!s) return "";
                return md5Cache.get(s);
            });
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy9tZDUuZXMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O3VCQUdJLFFBQVE7Ozs7OzhCQUZILEdBQUc7OztBQUVSLG9CQUFRLEdBQUcsSUFBSSxRQUFRLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQzs7K0JBRXZCLFVBQVMsQ0FBQyxFQUFFO0FBQ3ZCLG9CQUFJLENBQUMsQ0FBQyxFQUFFLE9BQU8sRUFBRSxDQUFDO0FBQ2xCLHVCQUFPLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7YUFDMUIiLCJmaWxlIjoiYW50aXRyYWNraW5nL21kNS5lcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBNYXBDYWNoZSBmcm9tICdhbnRpdHJhY2tpbmcvZml4ZWQtc2l6ZS1jYWNoZSc7XG5pbXBvcnQgeyBtZDUgfSBmcm9tICdjb3JlL2NyeXB0bydcblxudmFyIG1kNUNhY2hlID0gbmV3IE1hcENhY2hlKG1kNSwgMTAwMCk7XG5cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uKHMpIHtcbiAgICBpZiAoIXMpIHJldHVybiBcIlwiO1xuICAgIHJldHVybiBtZDVDYWNoZS5nZXQocyk7XG59XG4iXX0=