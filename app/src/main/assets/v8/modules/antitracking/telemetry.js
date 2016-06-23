System.register("antitracking/telemetry", ["core/cliqz"], function (_export) {
  "use strict";

  var utils;
  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }],
    execute: function () {
      _export("default", {
        telemetry: function telemetry(payl) {
          utils.log("No telemetry provider loaded", "attrack");
        },

        msgType: 'humanweb',

        loadFromProvider: function loadFromProvider(provider) {
          var _this = this;

          utils.log("Load telemetry provider: " + provider, "attrack");
          System["import"](provider).then((function (mod) {
            _this.telemetry = mod["default"].telemetry.bind(mod);
            _this.msgType = mod["default"].msgType;
          }).bind(this));
        }
      });
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy90ZWxlbWV0cnkuZXMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O3lCQUFTLEtBQUs7Ozt5QkFFQztBQUNiLGlCQUFTLEVBQUUsbUJBQVMsSUFBSSxFQUFFO0FBQ3hCLGVBQUssQ0FBQyxHQUFHLENBQUMsOEJBQThCLEVBQUUsU0FBUyxDQUFDLENBQUM7U0FDdEQ7O0FBRUQsZUFBTyxFQUFFLFVBQVU7O0FBRW5CLHdCQUFnQixFQUFFLDBCQUFTLFFBQVEsRUFBRTs7O0FBQ25DLGVBQUssQ0FBQyxHQUFHLENBQUMsMkJBQTJCLEdBQUUsUUFBUSxFQUFFLFNBQVMsQ0FBQyxDQUFDO0FBQzVELGdCQUFNLFVBQU8sQ0FBQyxRQUFRLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQSxVQUFDLEdBQUcsRUFBSztBQUNwQyxrQkFBSyxTQUFTLEdBQUcsR0FBRyxXQUFRLENBQUMsU0FBUyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNqRCxrQkFBSyxPQUFPLEdBQUcsR0FBRyxXQUFRLENBQUMsT0FBTyxDQUFDO1dBQ3BDLENBQUEsQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUNmO09BQ0YiLCJmaWxlIjoiYW50aXRyYWNraW5nL3RlbGVtZXRyeS5lcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHV0aWxzIH0gZnJvbSAnY29yZS9jbGlxeic7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgdGVsZW1ldHJ5OiBmdW5jdGlvbihwYXlsKSB7XG4gICAgdXRpbHMubG9nKFwiTm8gdGVsZW1ldHJ5IHByb3ZpZGVyIGxvYWRlZFwiLCBcImF0dHJhY2tcIik7XG4gIH0sXG5cbiAgbXNnVHlwZTogJ2h1bWFud2ViJyxcblxuICBsb2FkRnJvbVByb3ZpZGVyOiBmdW5jdGlvbihwcm92aWRlcikge1xuICAgIHV0aWxzLmxvZyhcIkxvYWQgdGVsZW1ldHJ5IHByb3ZpZGVyOiBcIisgcHJvdmlkZXIsIFwiYXR0cmFja1wiKTtcbiAgICBTeXN0ZW0uaW1wb3J0KHByb3ZpZGVyKS50aGVuKChtb2QpID0+IHtcbiAgICAgIHRoaXMudGVsZW1ldHJ5ID0gbW9kLmRlZmF1bHQudGVsZW1ldHJ5LmJpbmQobW9kKTtcbiAgICAgIHRoaXMubXNnVHlwZSA9IG1vZC5kZWZhdWx0Lm1zZ1R5cGU7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfVxufTtcbiJdfQ==