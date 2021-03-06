System.register("mobile-ui/views/local-data-sc", [], function (_export) {
  "use strict";

  var _default;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  return {
    setters: [],
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

            data.distance = CliqzUtils.distance(data.lon, data.lat) * 1000;

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