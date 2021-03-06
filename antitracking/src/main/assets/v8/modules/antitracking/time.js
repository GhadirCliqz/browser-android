System.register('antitracking/time', ['core/cliqz'], function (_export) {
  /** Get datetime string of the current hour in the format YYYYMMDDHH
   */
  'use strict';

  var utils;

  _export('getTime', getTime);

  _export('newUTCDate', newUTCDate);

  _export('hourString', hourString);

  _export('dateString', dateString);

  _export('getHourTimestamp', getHourTimestamp);

  function getTime() {
    var ts = utils.getPref('config_ts', null);
    if (!ts) {
      var d = null;
      var m = null;
      var y = null;
      var h = null;
      var hr = null;
      var _ts = null;
      d = (new Date().getDate() < 10 ? "0" : "") + new Date().getDate();
      m = (new Date().getMonth() < 10 ? "0" : "") + parseInt(new Date().getMonth() + 1);
      h = (new Date().getUTCHours() < 10 ? "0" : "") + new Date().getUTCHours();
      y = new Date().getFullYear();
      _ts = y + "" + m + "" + d + "" + h;
    } else {
      h = (new Date().getUTCHours() < 10 ? "0" : "") + new Date().getUTCHours();
      _ts = ts + "" + h;
    }
    return _ts;
  }

  function newUTCDate() {
    var dayHour = getTime();
    return new Date(Date.UTC(dayHour.substring(0, 4), parseInt(dayHour.substring(4, 6)) - 1, dayHour.substring(6, 8), dayHour.substring(8, 10)));
  }

  function hourString(date) {
    var hour = date.getUTCHours().toString();
    return dateString(date) + (hour[1] ? hour : '0' + hour[0]);
  }

  function dateString(date) {
    var yyyy = date.getFullYear().toString();
    var mm = (date.getMonth() + 1).toString(); // getMonth() is zero-based
    var dd = date.getDate().toString();
    return yyyy + (mm[1] ? mm : "0" + mm[0]) + (dd[1] ? dd : "0" + dd[0]); // padding
  }

  function getHourTimestamp() {
    return getTime().slice(0, 10);
  }

  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }],
    execute: function () {
      ;

      ;

      ;

      ;
    }
  };
});
//# sourceMappingURL=data:application/json;base64,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LENBQUMsUUFBUSxFQUFFLEdBQUMsQ0FBQyxDQUFBLENBQUUsUUFBUSxFQUFFLENBQUM7QUFDeEMsUUFBSSxFQUFFLEdBQUksSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDLFFBQVEsRUFBRSxDQUFDO0FBQ3BDLFdBQU8sSUFBSSxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLEdBQUMsR0FBRyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFDLEVBQUUsR0FBQyxHQUFHLEdBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFBLEFBQUMsQ0FBQztHQUMzRDs7QUFFTSxXQUFTLGdCQUFnQixHQUFHO0FBQ2pDLFdBQU8sT0FBTyxFQUFFLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztHQUMvQjs7Ozt5QkEvQ1EsS0FBSzs7O0FBdUJiLE9BQUM7O0FBUUQsT0FBQzs7QUFLRCxPQUFDOztBQU9ELE9BQUMiLCJmaWxlIjoiYW50aXRyYWNraW5nL3RpbWUuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1dGlscyB9IGZyb20gJ2NvcmUvY2xpcXonO1xuLyoqIEdldCBkYXRldGltZSBzdHJpbmcgb2YgdGhlIGN1cnJlbnQgaG91ciBpbiB0aGUgZm9ybWF0IFlZWVlNTURESEhcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldFRpbWUoKSB7XG4gIHZhciB0cyA9IHV0aWxzLmdldFByZWYoJ2NvbmZpZ190cycsIG51bGwpO1xuICBpZighdHMpe1xuICAgIHZhciBkID0gbnVsbDtcbiAgICB2YXIgbSA9IG51bGw7XG4gICAgdmFyIHkgPSBudWxsO1xuICAgIHZhciBoID0gbnVsbDtcbiAgICB2YXIgaHIgPSBudWxsO1xuICAgIHZhciBfdHMgPSBudWxsO1xuICAgIGQgPSAobmV3IERhdGUoKS5nZXREYXRlKCkgIDwgMTAgPyBcIjBcIiA6IFwiXCIgKSArIG5ldyBEYXRlKCkuZ2V0RGF0ZSgpO1xuICAgIG0gPSAobmV3IERhdGUoKS5nZXRNb250aCgpIDwgMTAgPyBcIjBcIiA6IFwiXCIgKSArIHBhcnNlSW50KChuZXcgRGF0ZSgpLmdldE1vbnRoKCkpICsgMSk7XG4gICAgaCA9IChuZXcgRGF0ZSgpLmdldFVUQ0hvdXJzKCkgPCAxMCA/IFwiMFwiIDogXCJcIiApICsgbmV3IERhdGUoKS5nZXRVVENIb3VycygpO1xuICAgIHkgPSBuZXcgRGF0ZSgpLmdldEZ1bGxZZWFyKCk7XG4gICAgX3RzID0geSArIFwiXCIgKyBtICsgXCJcIiArIGQgKyBcIlwiICsgaDtcbiAgfVxuICBlbHNle1xuICAgIGggPSAobmV3IERhdGUoKS5nZXRVVENIb3VycygpIDwgMTAgPyBcIjBcIiA6IFwiXCIgKSArIG5ldyBEYXRlKCkuZ2V0VVRDSG91cnMoKTtcbiAgICBfdHMgPSB0cyArIFwiXCIgKyBoO1xuICB9XG4gIHJldHVybiBfdHM7XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gbmV3VVRDRGF0ZSgpIHtcbiAgdmFyIGRheUhvdXIgPSBnZXRUaW1lKCk7XG4gIHJldHVybiBuZXcgRGF0ZShEYXRlLlVUQyhkYXlIb3VyLnN1YnN0cmluZygwLCA0KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHBhcnNlSW50KGRheUhvdXIuc3Vic3RyaW5nKDQsIDYpKSAtIDEsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBkYXlIb3VyLnN1YnN0cmluZyg2LCA4KSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIGRheUhvdXIuc3Vic3RyaW5nKDgsIDEwKSkpO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGhvdXJTdHJpbmcoZGF0ZSkge1xuICB2YXIgaG91ciA9IGRhdGUuZ2V0VVRDSG91cnMoKS50b1N0cmluZygpO1xuICByZXR1cm4gZGF0ZVN0cmluZyhkYXRlKSArIChob3VyWzFdP2hvdXI6JzAnK2hvdXJbMF0pO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGRhdGVTdHJpbmcoZGF0ZSkge1xuICB2YXIgeXl5eSA9IGRhdGUuZ2V0RnVsbFllYXIoKS50b1N0cmluZygpO1xuICB2YXIgbW0gPSAoZGF0ZS5nZXRNb250aCgpKzEpLnRvU3RyaW5nKCk7IC8vIGdldE1vbnRoKCkgaXMgemVyby1iYXNlZFxuICB2YXIgZGQgID0gZGF0ZS5nZXREYXRlKCkudG9TdHJpbmcoKTtcbiAgcmV0dXJuIHl5eXkgKyAobW1bMV0/bW06XCIwXCIrbW1bMF0pICsgKGRkWzFdP2RkOlwiMFwiK2RkWzBdKTsgLy8gcGFkZGluZ1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIGdldEhvdXJUaW1lc3RhbXAoKSB7XG4gIHJldHVybiBnZXRUaW1lKCkuc2xpY2UoMCwgMTApO1xufVxuIl19