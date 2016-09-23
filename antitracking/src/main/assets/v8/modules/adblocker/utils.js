System.register('adblocker/utils', ['adblocker/adblocker'], function (_export) {
  'use strict';

  var CliqzADB;

  _export('log', log);

  function log(msg) {
    var message = '[adblock] ' + msg;
    if (CliqzADB.adbDebug) {
      logDebug(message + '\n', 'xxx');
    }
  }

  return {
    setters: [function (_adblockerAdblocker) {
      CliqzADB = _adblockerAdblocker['default'];
    }],
    execute: function () {}
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFkYmxvY2tlci91dGlscy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBRU8sV0FBUyxHQUFHLENBQUMsR0FBRyxFQUFFO0FBQ3ZCLFFBQU0sT0FBTyxrQkFBZ0IsR0FBRyxBQUFFLENBQUM7QUFDbkMsUUFBSSxRQUFRLENBQUMsUUFBUSxFQUFFO0FBQ3JCLGNBQVEsQ0FBSSxPQUFPLFNBQU0sS0FBSyxDQUFDLENBQUM7S0FDakM7R0FDRiIsImZpbGUiOiJhZGJsb2NrZXIvdXRpbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgQ2xpcXpBREIgZnJvbSAnYWRibG9ja2VyL2FkYmxvY2tlcic7XG5cbmV4cG9ydCBmdW5jdGlvbiBsb2cobXNnKSB7XG4gIGNvbnN0IG1lc3NhZ2UgPSBgW2FkYmxvY2tdICR7bXNnfWA7XG4gIGlmIChDbGlxekFEQi5hZGJEZWJ1Zykge1xuICAgIGxvZ0RlYnVnKGAke21lc3NhZ2V9XFxuYCwgJ3h4eCcpO1xuICB9XG59XG4iXX0=