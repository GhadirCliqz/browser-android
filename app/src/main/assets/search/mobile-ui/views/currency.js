System.register("mobile-ui/views/currency", ["core/templates"], function (_export) {
    "use strict";

    var CliqzHandlebars, _default;

    var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    function getNumValue(value) {
        return isNaN(value) || value <= 0 ? 0 : value - 0; // rounding value
    }

    function updateCurrencyTpl(data) {
        document.getElementById("currency-tpl").innerHTML = CliqzHandlebars.tplCache.currency({ data: data });
    }

    return {
        setters: [function (_coreTemplates) {
            CliqzHandlebars = _coreTemplates["default"];
        }],
        execute: function () {
            _default = (function () {
                function _default() {
                    _classCallCheck(this, _default);
                }

                _createClass(_default, [{
                    key: "enhanceResults",
                    value: function enhanceResults(data) {}
                }, {
                    key: "switchCurrency",
                    value: function switchCurrency(data) {
                        var fromInput = document.getElementById("fromInput");

                        var convRate = 1 / data.mConversionRate;
                        data.mConversionRate = convRate + "";
                        convRate *= data.multiplyer;
                        var fromValue = getNumValue(parseFloat(fromInput.value));
                        data.toAmount.main = getNumValue(fromValue * convRate);
                        data.fromAmount = fromValue;

                        var temp = data.fromCurrency;
                        data.fromCurrency = data.toCurrency;
                        data.toCurrency = temp;

                        temp = data.formSymbol;
                        data.formSymbol = data.toSymbol;
                        data.toSymbol = temp;

                        data.multiplyer = 1 / data.multiplyer;

                        updateCurrencyTpl(data);
                    }
                }, {
                    key: "updateFromValue",
                    value: function updateFromValue(data) {
                        var fromInput = document.getElementById("fromInput");
                        var toInput = document.getElementById("toInput");
                        var toAmount = document.getElementById("calc-answer");
                        var toValue = getNumValue(fromInput.value / data.multiplyer * data.mConversionRate).toFixed(2) - 0;
                        toAmount.innerText = toValue.toLocaleString(CliqzUtils.PREFERRED_LANGUAGE);
                        toInput.value = toValue;
                    }
                }, {
                    key: "updateToValue",
                    value: function updateToValue(data) {
                        var fromInput = document.getElementById("fromInput");
                        var toInput = document.getElementById("toInput");
                        var toAmount = document.getElementById("calc-answer");
                        var toValue = getNumValue(toInput.value);
                        var fromValue = getNumValue(toValue * data.multiplyer / data.mConversionRate).toFixed(2);
                        toAmount.innerText = toValue.toLocaleString(CliqzUtils.PREFERRED_LANGUAGE);
                        fromInput.value = fromValue;
                    }
                }]);

                return _default;
            })();

            _export("default", _default);

            ;
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm1vYmlsZS11aS92aWV3cy9jdXJyZW5jeS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7QUFFQSxhQUFTLFdBQVcsQ0FBQyxLQUFLLEVBQUU7QUFDeEIsZUFBUSxLQUFLLENBQUMsS0FBSyxDQUFDLElBQUksS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsQ0FBRTtLQUN2RDs7QUFFRCxhQUFTLGlCQUFpQixDQUFDLElBQUksRUFBRTtBQUM3QixnQkFBUSxDQUFDLGNBQWMsQ0FBQyxjQUFjLENBQUMsQ0FBQyxTQUFTLEdBQUcsZUFBZSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsRUFBQyxJQUFJLEVBQUUsSUFBSSxFQUFDLENBQUMsQ0FBQztLQUN2Rzs7Ozs7Ozs7Ozs7Ozs7MkJBR2lCLHdCQUFDLElBQUksRUFBRSxFQUNwQjs7OzJCQUVhLHdCQUFDLElBQUksRUFBRTtBQUNqQiw0QkFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQzs7QUFFckQsNEJBQUksUUFBUSxHQUFHLENBQUMsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDO0FBQ3hDLDRCQUFJLENBQUMsZUFBZSxHQUFHLFFBQVEsR0FBRyxFQUFFLENBQUM7QUFDckMsZ0NBQVEsSUFBSSxJQUFJLENBQUMsVUFBVSxDQUFDO0FBQzVCLDRCQUFJLFNBQVMsR0FBRyxXQUFXLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDO0FBQ3pELDRCQUFJLENBQUMsUUFBUSxDQUFDLElBQUksR0FBRyxXQUFXLENBQUMsU0FBUyxHQUFHLFFBQVEsQ0FBQyxDQUFDO0FBQ3ZELDRCQUFJLENBQUMsVUFBVSxHQUFHLFNBQVMsQ0FBQzs7QUFFNUIsNEJBQUksSUFBSSxHQUFHLElBQUksQ0FBQyxZQUFZLENBQUM7QUFDN0IsNEJBQUksQ0FBQyxZQUFZLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztBQUNwQyw0QkFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUM7O0FBRXZCLDRCQUFJLEdBQUcsSUFBSSxDQUFDLFVBQVUsQ0FBQztBQUN2Qiw0QkFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO0FBQ2hDLDRCQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQzs7QUFFckIsNEJBQUksQ0FBQyxVQUFVLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxVQUFVLENBQUM7O0FBRXRDLHlDQUFpQixDQUFDLElBQUksQ0FBQyxDQUFDO3FCQUMzQjs7OzJCQUVjLHlCQUFDLElBQUksRUFBRTtBQUNsQiw0QkFBSSxTQUFTLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxXQUFXLENBQUMsQ0FBQztBQUNyRCw0QkFBSSxPQUFPLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxTQUFTLENBQUMsQ0FBQztBQUNqRCw0QkFBSSxRQUFRLEdBQUcsUUFBUSxDQUFDLGNBQWMsQ0FBQyxhQUFhLENBQUMsQ0FBQztBQUN0RCw0QkFBSSxPQUFPLEdBQUcsV0FBVyxDQUFDLFNBQVMsQ0FBQyxLQUFLLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQztBQUNuRyxnQ0FBUSxDQUFDLFNBQVMsR0FBRyxPQUFPLENBQUMsY0FBYyxDQUFDLFVBQVUsQ0FBQyxrQkFBa0IsQ0FBQyxDQUFDO0FBQzNFLCtCQUFPLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQztxQkFDM0I7OzsyQkFFWSx1QkFBQyxJQUFJLEVBQUU7QUFDaEIsNEJBQUksU0FBUyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsV0FBVyxDQUFDLENBQUM7QUFDckQsNEJBQUksT0FBTyxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsU0FBUyxDQUFDLENBQUM7QUFDakQsNEJBQUksUUFBUSxHQUFHLFFBQVEsQ0FBQyxjQUFjLENBQUMsYUFBYSxDQUFDLENBQUM7QUFDdEQsNEJBQUksT0FBTyxHQUFHLFdBQVcsQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDLENBQUM7QUFDekMsNEJBQUksU0FBUyxHQUFHLFdBQVcsQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ3pGLGdDQUFRLENBQUMsU0FBUyxHQUFHLE9BQU8sQ0FBQyxjQUFjLENBQUMsVUFBVSxDQUFDLGtCQUFrQixDQUFDLENBQUM7QUFDM0UsaUNBQVMsQ0FBQyxLQUFLLEdBQUcsU0FBUyxDQUFDO3FCQUMvQjs7Ozs7Ozs7QUFDSixhQUFDIiwiZmlsZSI6Im1vYmlsZS11aS92aWV3cy9jdXJyZW5jeS5qcyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBDbGlxekhhbmRsZWJhcnMgZnJvbSBcImNvcmUvdGVtcGxhdGVzXCI7XG5cbmZ1bmN0aW9uIGdldE51bVZhbHVlKHZhbHVlKSB7XG4gICAgcmV0dXJuIChpc05hTih2YWx1ZSkgfHwgdmFsdWUgPD0gMCA/IDAgOiB2YWx1ZSAtIDApOyAvLyByb3VuZGluZyB2YWx1ZVxufVxuXG5mdW5jdGlvbiB1cGRhdGVDdXJyZW5jeVRwbChkYXRhKSB7XG4gICAgZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjdXJyZW5jeS10cGxcIikuaW5uZXJIVE1MID0gQ2xpcXpIYW5kbGViYXJzLnRwbENhY2hlLmN1cnJlbmN5KHtkYXRhOiBkYXRhfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIHtcbiAgICBlbmhhbmNlUmVzdWx0cyhkYXRhKSB7XG4gICAgfVxuXG4gICAgc3dpdGNoQ3VycmVuY3koZGF0YSkge1xuICAgICAgICB2YXIgZnJvbUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmcm9tSW5wdXRcIik7XG5cbiAgICAgICAgdmFyIGNvbnZSYXRlID0gMSAvIGRhdGEubUNvbnZlcnNpb25SYXRlO1xuICAgICAgICBkYXRhLm1Db252ZXJzaW9uUmF0ZSA9IGNvbnZSYXRlICsgXCJcIjtcbiAgICAgICAgY29udlJhdGUgKj0gZGF0YS5tdWx0aXBseWVyO1xuICAgICAgICB2YXIgZnJvbVZhbHVlID0gZ2V0TnVtVmFsdWUocGFyc2VGbG9hdChmcm9tSW5wdXQudmFsdWUpKTtcbiAgICAgICAgZGF0YS50b0Ftb3VudC5tYWluID0gZ2V0TnVtVmFsdWUoZnJvbVZhbHVlICogY29udlJhdGUpO1xuICAgICAgICBkYXRhLmZyb21BbW91bnQgPSBmcm9tVmFsdWU7XG5cbiAgICAgICAgdmFyIHRlbXAgPSBkYXRhLmZyb21DdXJyZW5jeTtcbiAgICAgICAgZGF0YS5mcm9tQ3VycmVuY3kgPSBkYXRhLnRvQ3VycmVuY3k7XG4gICAgICAgIGRhdGEudG9DdXJyZW5jeSA9IHRlbXA7XG5cbiAgICAgICAgdGVtcCA9IGRhdGEuZm9ybVN5bWJvbDtcbiAgICAgICAgZGF0YS5mb3JtU3ltYm9sID0gZGF0YS50b1N5bWJvbDtcbiAgICAgICAgZGF0YS50b1N5bWJvbCA9IHRlbXA7XG5cbiAgICAgICAgZGF0YS5tdWx0aXBseWVyID0gMSAvIGRhdGEubXVsdGlwbHllcjtcblxuICAgICAgICB1cGRhdGVDdXJyZW5jeVRwbChkYXRhKTtcbiAgICB9XG5cbiAgICB1cGRhdGVGcm9tVmFsdWUoZGF0YSkge1xuICAgICAgICB2YXIgZnJvbUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmcm9tSW5wdXRcIik7XG4gICAgICAgIHZhciB0b0lucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0b0lucHV0XCIpO1xuICAgICAgICB2YXIgdG9BbW91bnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbGMtYW5zd2VyXCIpO1xuICAgICAgICB2YXIgdG9WYWx1ZSA9IGdldE51bVZhbHVlKGZyb21JbnB1dC52YWx1ZSAvIGRhdGEubXVsdGlwbHllciAqIGRhdGEubUNvbnZlcnNpb25SYXRlKS50b0ZpeGVkKDIpIC0gMDtcbiAgICAgICAgdG9BbW91bnQuaW5uZXJUZXh0ID0gdG9WYWx1ZS50b0xvY2FsZVN0cmluZyhDbGlxelV0aWxzLlBSRUZFUlJFRF9MQU5HVUFHRSk7XG4gICAgICAgIHRvSW5wdXQudmFsdWUgPSB0b1ZhbHVlO1xuICAgIH1cblxuICAgIHVwZGF0ZVRvVmFsdWUoZGF0YSkge1xuICAgICAgICB2YXIgZnJvbUlucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJmcm9tSW5wdXRcIik7XG4gICAgICAgIHZhciB0b0lucHV0ID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJ0b0lucHV0XCIpO1xuICAgICAgICB2YXIgdG9BbW91bnQgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNhbGMtYW5zd2VyXCIpO1xuICAgICAgICB2YXIgdG9WYWx1ZSA9IGdldE51bVZhbHVlKHRvSW5wdXQudmFsdWUpO1xuICAgICAgICB2YXIgZnJvbVZhbHVlID0gZ2V0TnVtVmFsdWUodG9WYWx1ZSAqIGRhdGEubXVsdGlwbHllciAvIGRhdGEubUNvbnZlcnNpb25SYXRlKS50b0ZpeGVkKDIpO1xuICAgICAgICB0b0Ftb3VudC5pbm5lclRleHQgPSB0b1ZhbHVlLnRvTG9jYWxlU3RyaW5nKENsaXF6VXRpbHMuUFJFRkVSUkVEX0xBTkdVQUdFKTtcbiAgICAgICAgZnJvbUlucHV0LnZhbHVlID0gZnJvbVZhbHVlO1xuICAgIH1cbn07XG4iXX0=