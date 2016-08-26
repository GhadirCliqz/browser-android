System.register("mobile-ui/views/local-data-sc", ["platform/environment"], function (_export) {
  "use strict";

  var environment, _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  return {
    setters: [function (_platformEnvironment) {
      environment = _platformEnvironment["default"];
    }],
    execute: function () {
      _default = (function () {
        function _default() {
          _classCallCheck(this, _default);
        }

        _createClass(_default, [{
          key: "enhanceResults",
          value: function enhanceResults(data) {

            function parseTime(timeStr) {
              // e.g. timeStr: 10.30
              var time = timeStr.split(".");
              return {
                hours: parseInt(time[0]) || 0,
                minutes: parseInt(time[1]) || 0
              };
            }

            function twoDigit(num) {
              return [num < 10 ? "0" : "", num].join("");
            }

            var isBigSnippet = Boolean(data.phonenumber || data.address || data.opening_hours || data.no_location),
                rating_img = null,
                t = new Date(),
                current_t = [twoDigit(t.getHours()), twoDigit(t.getMinutes())].join("."),
                open_stt,
                timeInfos = [],
                openingColors = {
              open: "#74d463",
              closed: "#E92207",
              open_soon: "#FFC802",
              close_soon: "#FFC802"
            };

            data.phone_address = data.phonenumber || data.address;

            if (data.opening_hours) {

              data.opening_hours.forEach(function (el) {
                if (!el.open || !el.close) {
                  return;
                }
                timeInfos.push(el.open.time + " - " + el.close.time);
                if (open_stt && open_stt !== "closed") {
                  return;
                }

                var openTime = parseTime(el.open.time),
                    closeTime = parseTime(el.close.time),
                    closesNextDay = el.close.day !== el.open.day,

                /** Difference in minutes from opening/closing times to current time **/
                minutesFrom = {
                  opening: 60 * (t.getHours() - openTime.hours) + (t.getMinutes() - openTime.minutes),
                  /* If it closes the next day, we need to subtract 24 hours from the hour difference */
                  closing: 60 * (t.getHours() - closeTime.hours - (closesNextDay ? 24 : 0)) + (t.getMinutes() - closeTime.minutes)
                };

                if (minutesFrom.opening > 0 && minutesFrom.closing < 0) {
                  open_stt = "open";
                  if (minutesFrom.closing > -60) {
                    open_stt = "close_soon";
                  }
                } else {
                  open_stt = "closed";
                  if (minutesFrom.opening > -60 && minutesFrom.opening < 0) {
                    open_stt = "open_soon";
                  }
                }
              });

              data.opening_status = {
                color: openingColors[open_stt],
                stt_text: open_stt && CliqzUtils.getLocalizedString(open_stt),
                time_info_til: CliqzUtils.getLocalizedString("open_hour"),
                time_info_str: timeInfos.join(", ")
              };
            }

            if (!data.rating) {
              data.rating = 0;
            }

            rating_img = "http://cdn.cliqz.com/extension/EZ/richresult/stars" + Math.max(0, Math.min(Math.round(data.rating), 5)) + ".svg";

            if (!isBigSnippet) {
              data.richData = {
                image: data.image,
                url_ratingimg: rating_img,
                name: data.t,
                des: data.desc
              };
            } else {
              data.url_ratingimg = rating_img;
            }

            data.big_rs_size = isBigSnippet;

            data.distance = CliqzUtils.distance(data.lon, data.lat, environment.USER_LNG, environment.USER_LAT) * 1000;

            data.deepLinks = ((data.deepResults || []).find(function (res) {
              return res.type === 'buttons';
            }) || {}).links;
          }
        }]);

        return _default;
      })();

      _export("default", _default);

      ;
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vYmlsZS11aS92aWV3cy9sb2NhbC1kYXRhLXNjLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztpQkFHZ0Isd0JBQUMsSUFBSSxFQUFFOztBQUVuQixxQkFBUyxTQUFTLENBQUMsT0FBTyxFQUFFOztBQUMxQixrQkFBSSxJQUFJLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUM5QixxQkFBTztBQUNMLHFCQUFLLEVBQUUsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUM7QUFDN0IsdUJBQU8sRUFBRSxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQztlQUNoQyxDQUFDO2FBQ0g7O0FBRUQscUJBQVMsUUFBUSxDQUFDLEdBQUcsRUFBRTtBQUNyQixxQkFBTyxDQUNMLEdBQUcsR0FBRyxFQUFFLEdBQUcsR0FBRyxHQUFHLEVBQUUsRUFDbkIsR0FBRyxDQUNKLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO2FBQ1o7O0FBRUQsZ0JBQUksWUFBWSxHQUFHLE9BQU8sQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLElBQUksQ0FBQyxPQUFPLElBQUksSUFBSSxDQUFDLGFBQWEsSUFBSSxJQUFJLENBQUMsV0FBVyxDQUFDO2dCQUNsRyxVQUFVLEdBQUcsSUFBSTtnQkFDakIsQ0FBQyxHQUFHLElBQUksSUFBSSxFQUFFO2dCQUNkLFNBQVMsR0FBRyxDQUNWLFFBQVEsQ0FBQyxDQUFDLENBQUMsUUFBUSxFQUFFLENBQUMsRUFDdEIsUUFBUSxDQUFDLENBQUMsQ0FBQyxVQUFVLEVBQUUsQ0FBQyxDQUN6QixDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7Z0JBQ1gsUUFBUTtnQkFBRSxTQUFTLEdBQUcsRUFBRTtnQkFDeEIsYUFBYSxHQUFJO0FBQ2Ysa0JBQUksRUFBRSxTQUFTO0FBQ2Ysb0JBQU0sRUFBRSxTQUFTO0FBQ2pCLHVCQUFT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QUFFO0FBQ2pCLGtCQUFJLENBQUMsUUFBUSxHQUFHO0FBQ2QscUJBQUssRUFBRSxJQUFJLENBQUMsS0FBSztBQUNqQiw2QkFBYSxFQUFFLFVBQVU7QUFDekIsb0JBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztBQUNaLG1CQUFHLEVBQUUsSUFBSSxDQUFDLElBQUk7ZUFDZixDQUFDO2FBQ0gsTUFBTTtBQUNMLGtCQUFJLENBQUMsYUFBYSxHQUFHLFVBQVUsQ0FBQzthQUNqQzs7QUFHRCxnQkFBSSxDQUFDLFdBQVcsR0FBRyxZQUFZLENBQUM7O0FBRWhDLGdCQUFJLENBQUMsUUFBUSxHQUFHLFVBQVUsQ0FBQyxRQUFRLENBQ2YsSUFBSSxDQUFDLEdBQUcsRUFDUixJQUFJLENBQUMsR0FBRyxFQUNWLFdBQVcsQ0FBQyxRQUFRLEVBQ3BCLFdBQVcsQ0FBQyxRQUFRLENBQUMsR0FBQyxJQUFJLENBQUM7O0FBRTdDLGdCQUFJLENBQUMsU0FBUyxHQUFHLENBQUMsQ0FBQyxJQUFJLENBQUMsV0FBVyxJQUFJLEVBQUUsQ0FBQSxDQUFFLElBQUksQ0FBQyxVQUFBLEdBQUc7cUJBQUksR0FBRyxDQUFDLElBQUksS0FBSyxTQUFTO2FBQUEsQ0FBQyxJQUFJLEVBQUUsQ0FBQSxDQUFFLEtBQUssQ0FBQTtXQUM1Rjs7Ozs7Ozs7QUFDRixPQUFDIiwiZmlsZSI6Im1vYmlsZS11aS92aWV3cy9sb2NhbC1kYXRhLXNjLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGVudmlyb25tZW50IGZyb20gXCJwbGF0Zm9ybS9lbnZpcm9ubWVudFwiO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyB7XG4gIGVuaGFuY2VSZXN1bHRzKGRhdGEpIHtcblxuICAgIGZ1bmN0aW9uIHBhcnNlVGltZSh0aW1lU3RyKSB7ICAvLyBlLmcuIHRpbWVTdHI6IDEwLjMwXG4gICAgICB2YXIgdGltZSA9IHRpbWVTdHIuc3BsaXQoXCIuXCIpO1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgaG91cnM6IHBhcnNlSW50KHRpbWVbMF0pIHx8IDAsXG4gICAgICAgIG1pbnV0ZXM6IHBhcnNlSW50KHRpbWVbMV0pIHx8IDBcbiAgICAgIH07XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdHdvRGlnaXQobnVtKSB7XG4gICAgICByZXR1cm4gW1xuICAgICAgICBudW0gPCAxMCA/IFwiMFwiIDogXCJcIixcbiAgICAgICAgbnVtXG4gICAgICBdLmpvaW4oXCJcIik7XG4gICAgfVxuXG4gICAgdmFyIGlzQmlnU25pcHBldCA9IEJvb2xlYW4oZGF0YS5waG9uZW51bWJlciB8fCBkYXRhLmFkZHJlc3MgfHwgZGF0YS5vcGVuaW5nX2hvdXJzIHx8IGRhdGEubm9fbG9jYXRpb24pLFxuICAgICAgICByYXRpbmdfaW1nID0gbnVsbCxcbiAgICAgICAgdCA9IG5ldyBEYXRlKCksXG4gICAgICAgIGN1cnJlbnRfdCA9IFtcbiAgICAgICAgICB0d29EaWdpdCh0LmdldEhvdXJzKCkpLFxuICAgICAgICAgIHR3b0RpZ2l0KHQuZ2V0TWludXRlcygpKVxuICAgICAgICBdLmpvaW4oXCIuXCIpLFxuICAgICAgICBvcGVuX3N0dCwgdGltZUluZm9zID0gW10sXG4gICAgICAgIG9wZW5pbmdDb2xvcnMgPSAge1xuICAgICAgICAgIG9wZW46IFwiIzc0ZDQ2M1wiLFxuICAgICAgICAgIGNsb3NlZDogXCIjRTkyMjA3XCIsXG4gICAgICAgICAgb3Blbl9zb29uOiBcIiNGRkM4MDJcIixcbiAgICAgICAgICBjbG9zZV9zb29uOiBcIiNGRkM4MDJcIlxuICAgICAgICB9O1xuXG4gICAgZGF0YS5waG9uZV9hZGRyZXNzID0gZGF0YS5waG9uZW51bWJlciB8fCBkYXRhLmFkZHJlc3M7XG5cbiAgICBpZiAoZGF0YS5vcGVuaW5nX2hvdXJzKSB7XG5cbiAgICAgIGRhdGEub3BlbmluZ19ob3Vycy5mb3JFYWNoKGZ1bmN0aW9uIChlbCkge1xuICAgICAgICBpZiAoIWVsLm9wZW4gfHwgIWVsLmNsb3NlKSB7IHJldHVybjsgfVxuICAgICAgICB0aW1lSW5mb3MucHVzaChlbC5vcGVuLnRpbWUgKyBcIiAtIFwiICsgZWwuY2xvc2UudGltZSk7XG4gICAgICAgIGlmKG9wZW5fc3R0ICYmIG9wZW5fc3R0ICE9PSBcImNsb3NlZFwiKSB7IHJldHVybjsgfVxuXG5cbiAgICAgICAgdmFyIG9wZW5UaW1lICA9IHBhcnNlVGltZShlbC5vcGVuLnRpbWUpLFxuICAgICAgICBjbG9zZVRpbWUgPSBwYXJzZVRpbWUoZWwuY2xvc2UudGltZSksXG4gICAgICAgIGNsb3Nlc05leHREYXkgPSBlbC5jbG9zZS5kYXkgIT09IGVsLm9wZW4uZGF5LFxuICAgICAgICAvKiogRGlmZmVyZW5jZSBpbiBtaW51dGVzIGZyb20gb3BlbmluZy9jbG9zaW5nIHRpbWVzIHRvIGN1cnJlbnQgdGltZSAqKi9cbiAgICAgICAgbWludXRlc0Zyb20gPSB7XG4gICAgICAgICAgb3BlbmluZzogIDYwICogKHQuZ2V0SG91cnMoKSAtIG9wZW5UaW1lLmhvdXJzKSArICh0LmdldE1pbnV0ZXMoKSAtIG9wZW5UaW1lLm1pbnV0ZXMpLFxuICAgICAgICAgIC8qIElmIGl0IGNsb3NlcyB0aGUgbmV4dCBkYXksIHdlIG5lZWQgdG8gc3VidHJhY3QgMjQgaG91cnMgZnJvbSB0aGUgaG91ciBkaWZmZXJlbmNlICovXG4gICAgICAgICAgY2xvc2luZzogNjAgKiAodC5nZXRIb3VycygpIC0gY2xvc2VUaW1lLmhvdXJzIC0gKCBjbG9zZXNOZXh0RGF5ID8gMjQgOiAwKSApICsgKHQuZ2V0TWludXRlcygpIC0gY2xvc2VUaW1lLm1pbnV0ZXMpXG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKG1pbnV0ZXNGcm9tLm9wZW5pbmcgPiAwICYmIG1pbnV0ZXNGcm9tLmNsb3NpbmcgPCAwKSB7XG4gICAgICAgICAgb3Blbl9zdHQgPSBcIm9wZW5cIjtcbiAgICAgICAgICBpZiAobWludXRlc0Zyb20uY2xvc2luZyA+IC02MCl7XG4gICAgICAgICAgICBvcGVuX3N0dCA9ICBcImNsb3NlX3Nvb25cIjtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgb3Blbl9zdHQgPSBcImNsb3NlZFwiO1xuICAgICAgICAgIGlmIChtaW51dGVzRnJvbS5vcGVuaW5nID4gLTYwICYmIG1pbnV0ZXNGcm9tLm9wZW5pbmcgPCAwKSB7XG4gICAgICAgICAgICBvcGVuX3N0dCA9IFwib3Blbl9zb29uXCI7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuXG4gICAgICBkYXRhLm9wZW5pbmdfc3RhdHVzID0ge1xuICAgICAgICBjb2xvcjogb3BlbmluZ0NvbG9yc1tvcGVuX3N0dF0sXG4gICAgICAgIHN0dF90ZXh0OiBvcGVuX3N0dCAmJiBDbGlxelV0aWxzLmdldExvY2FsaXplZFN0cmluZyhvcGVuX3N0dCksXG4gICAgICAgIHRpbWVfaW5mb190aWw6IENsaXF6VXRpbHMuZ2V0TG9jYWxpemVkU3RyaW5nKFwib3Blbl9ob3VyXCIpLFxuICAgICAgICB0aW1lX2luZm9fc3RyOiB0aW1lSW5mb3Muam9pbihcIiwgXCIpXG4gICAgICB9O1xuICAgIH1cblxuICAgIGlmICghZGF0YS5yYXRpbmcpIHsgZGF0YS5yYXRpbmcgPSAwOyB9XG5cbiAgICByYXRpbmdfaW1nID0gXCJodHRwOi8vY2RuLmNsaXF6LmNvbS9leHRlbnNpb24vRVovcmljaHJlc3VsdC9zdGFyc1wiICsgTWF0aC5tYXgoMCwgTWF0aC5taW4oTWF0aC5yb3VuZChkYXRhLnJhdGluZyksIDUpKSArIFwiLnN2Z1wiO1xuXG4gICAgaWYgKCFpc0JpZ1NuaXBwZXQpIHtcbiAgICAgIGRhdGEucmljaERhdGEgPSB7XG4gICAgICAgIGltYWdlOiBkYXRhLmltYWdlLFxuICAgICAgICB1cmxfcmF0aW5naW1nOiByYXRpbmdfaW1nLFxuICAgICAgICBuYW1lOiBkYXRhLnQsXG4gICAgICAgIGRlczogZGF0YS5kZXNjXG4gICAgICB9O1xuICAgIH0gZWxzZSB7XG4gICAgICBkYXRhLnVybF9yYXRpbmdpbWcgPSByYXRpbmdfaW1nO1xuICAgIH1cblxuXG4gICAgZGF0YS5iaWdfcnNfc2l6ZSA9IGlzQmlnU25pcHBldDtcblxuICAgIGRhdGEuZGlzdGFuY2UgPSBDbGlxelV0aWxzLmRpc3RhbmNlKFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YS5sb24sXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhLmxhdCxcbiAgICAgICAgICAgICAgICAgICAgICBlbnZpcm9ubWVudC5VU0VSX0xORyxcbiAgICAgICAgICAgICAgICAgICAgICBlbnZpcm9ubWVudC5VU0VSX0xBVCkqMTAwMDtcblxuICAgIGRhdGEuZGVlcExpbmtzID0gKChkYXRhLmRlZXBSZXN1bHRzIHx8IFtdKS5maW5kKHJlcyA9PiByZXMudHlwZSA9PT0gJ2J1dHRvbnMnKSB8fCB7fSkubGlua3NcbiAgfVxufTtcbiJdfQ==