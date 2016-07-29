System.register("antitracking/time", [], function (_export) {
  /** Get datetime string of the current hour in the format YYYYMMDDHH
   */
  "use strict";

  _export("getTime", getTime);

  _export("newUTCDate", newUTCDate);

  _export("hourString", hourString);

  _export("dateString", dateString);

  _export("getHourTimestamp", getHourTimestamp);

  function getTime() {
    var ts = CliqzUtils.getPref('config_ts', null);
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
    setters: [],
    execute: function () {
      ;

      ;

      ;

      ;
    }
  };
});
//# sourceMappingURL=data:application/json;base64,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QUFDLFFBQVEsRUFBRSxHQUFDLENBQUMsQ0FBQSxDQUFFLFFBQVEsRUFBRSxDQUFDO0FBQ3hDLFFBQUksRUFBRSxHQUFJLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLEVBQUUsQ0FBQztBQUNwQyxXQUFPLElBQUksSUFBSSxFQUFFLENBQUMsQ0FBQyxDQUFDLEdBQUMsRUFBRSxHQUFDLEdBQUcsR0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUEsQUFBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBQyxFQUFFLEdBQUMsR0FBRyxHQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQSxBQUFDLENBQUM7R0FDM0Q7O0FBRU0sV0FBUyxnQkFBZ0IsR0FBRztBQUNqQyxXQUFPLE9BQU8sRUFBRSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsRUFBRSxDQUFDLENBQUM7R0FDL0I7Ozs7O0FBeEJBLE9BQUM7O0FBUUQsT0FBQzs7QUFLRCxPQUFDOztBQU9ELE9BQUMiLCJmaWxlIjoiYW50aXRyYWNraW5nL3RpbWUuZXMiLCJzb3VyY2VzQ29udGVudCI6WyIvKiogR2V0IGRhdGV0aW1lIHN0cmluZyBvZiB0aGUgY3VycmVudCBob3VyIGluIHRoZSBmb3JtYXQgWVlZWU1NRERISFxuICovXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGltZSgpIHtcbiAgdmFyIHRzID0gQ2xpcXpVdGlscy5nZXRQcmVmKCdjb25maWdfdHMnLCBudWxsKTtcbiAgaWYoIXRzKXtcbiAgICB2YXIgZCA9IG51bGw7XG4gICAgdmFyIG0gPSBudWxsO1xuICAgIHZhciB5ID0gbnVsbDtcbiAgICB2YXIgaCA9IG51bGw7XG4gICAgdmFyIGhyID0gbnVsbDtcbiAgICB2YXIgX3RzID0gbnVsbDtcbiAgICBkID0gKG5ldyBEYXRlKCkuZ2V0RGF0ZSgpICA8IDEwID8gXCIwXCIgOiBcIlwiICkgKyBuZXcgRGF0ZSgpLmdldERhdGUoKTtcbiAgICBtID0gKG5ldyBEYXRlKCkuZ2V0TW9udGgoKSA8IDEwID8gXCIwXCIgOiBcIlwiICkgKyBwYXJzZUludCgobmV3IERhdGUoKS5nZXRNb250aCgpKSArIDEpO1xuICAgIGggPSAobmV3IERhdGUoKS5nZXRVVENIb3VycygpIDwgMTAgPyBcIjBcIiA6IFwiXCIgKSArIG5ldyBEYXRlKCkuZ2V0VVRDSG91cnMoKTtcbiAgICB5ID0gbmV3IERhdGUoKS5nZXRGdWxsWWVhcigpO1xuICAgIF90cyA9IHkgKyBcIlwiICsgbSArIFwiXCIgKyBkICsgXCJcIiArIGg7XG4gIH1cbiAgZWxzZXtcbiAgICBoID0gKG5ldyBEYXRlKCkuZ2V0VVRDSG91cnMoKSA8IDEwID8gXCIwXCIgOiBcIlwiICkgKyBuZXcgRGF0ZSgpLmdldFVUQ0hvdXJzKCk7XG4gICAgX3RzID0gdHMgKyBcIlwiICsgaDtcbiAgfVxuICByZXR1cm4gX3RzO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIG5ld1VUQ0RhdGUoKSB7XG4gIHZhciBkYXlIb3VyID0gZ2V0VGltZSgpO1xuICByZXR1cm4gbmV3IERhdGUoRGF0ZS5VVEMoZGF5SG91ci5zdWJzdHJpbmcoMCwgNCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBwYXJzZUludChkYXlIb3VyLnN1YnN0cmluZyg0LCA2KSkgLSAxLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF5SG91ci5zdWJzdHJpbmcoNiwgOCksXG4gICAgICAgICAgICAgICAgICAgICAgICAgICBkYXlIb3VyLnN1YnN0cmluZyg4LCAxMCkpKTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBob3VyU3RyaW5nKGRhdGUpIHtcbiAgdmFyIGhvdXIgPSBkYXRlLmdldFVUQ0hvdXJzKCkudG9TdHJpbmcoKTtcbiAgcmV0dXJuIGRhdGVTdHJpbmcoZGF0ZSkgKyAoaG91clsxXT9ob3VyOicwJytob3VyWzBdKTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBkYXRlU3RyaW5nKGRhdGUpIHtcbiAgdmFyIHl5eXkgPSBkYXRlLmdldEZ1bGxZZWFyKCkudG9TdHJpbmcoKTtcbiAgdmFyIG1tID0gKGRhdGUuZ2V0TW9udGgoKSsxKS50b1N0cmluZygpOyAvLyBnZXRNb250aCgpIGlzIHplcm8tYmFzZWRcbiAgdmFyIGRkICA9IGRhdGUuZ2V0RGF0ZSgpLnRvU3RyaW5nKCk7XG4gIHJldHVybiB5eXl5ICsgKG1tWzFdP21tOlwiMFwiK21tWzBdKSArIChkZFsxXT9kZDpcIjBcIitkZFswXSk7IC8vIHBhZGRpbmdcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRIb3VyVGltZXN0YW1wKCkge1xuICByZXR1cm4gZ2V0VGltZSgpLnNsaWNlKDAsIDEwKTtcbn1cbiJdfQ==