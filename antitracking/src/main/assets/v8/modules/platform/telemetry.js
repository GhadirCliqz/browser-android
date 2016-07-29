System.register(["core/cliqz"], function (_export) {
  "use strict";

  var utils;
  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }],
    execute: function () {
      _export("default", {
        telemetry: function telemetry(payload) {
          utils.log("Dropping telemetry", "xxx");
          sendTelemetry(JSON.stringify(payload));
        },
        msgType: 'humanweb'
      });
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRlbGVtZXRyeS5lcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7eUJBQVMsS0FBSzs7O3lCQUVDO0FBQ2IsaUJBQVMsRUFBQSxtQkFBQyxPQUFPLEVBQUU7QUFDakIsZUFBSyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN2Qyx1QkFBYSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQTtTQUN2QztBQUNELGVBQU8sRUFBRSxVQUFVO09BQ3BCIiwiZmlsZSI6InRlbGVtZXRyeS5lcyIsInNvdXJjZVJvb3QiOiJwbGF0Zm9ybSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHV0aWxzIH0gZnJvbSAnY29yZS9jbGlxeic7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgdGVsZW1ldHJ5KHBheWxvYWQpIHtcbiAgICB1dGlscy5sb2coXCJEcm9wcGluZyB0ZWxlbWV0cnlcIiwgXCJ4eHhcIik7XG4gICAgc2VuZFRlbGVtZXRyeShKU09OLnN0cmluZ2lmeShwYXlsb2FkKSlcbiAgfSxcbiAgbXNnVHlwZTogJ2h1bWFud2ViJ1xufVxuIl19