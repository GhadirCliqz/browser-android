System.register("platform/startup", ["core/config"], function (_export) {
  /* global System */
  "use strict";

  var config;

  function loadModule(moduleName) {
    return System["import"](moduleName + "/background").then(function (module) {
      return module["default"].init(config);
    }).then(function () {
      return System["import"](moduleName + "/window");
    }).then(function (module) {
      return new module["default"]({ window: window }).init();
    })["catch"](function (e) {
      CliqzUtils.log("Error on loading module: " + moduleName + " - " + e.toString() + " -- " + e.stack, "Extension");
    });
  }

  return {
    setters: [function (_coreConfig) {
      config = _coreConfig["default"];
    }],
    execute: function () {
      _export("default", function (window) {
        var modules = arguments.length <= 1 || arguments[1] === undefined ? config.modules : arguments[1];

        // intersent config file with
        var modulesToLoad = modules.filter(function (n) {
          return config.modules.indexOf(n) != -1;
        });

        return loadModule("core").then(function () {
          return Promise.all(modulesToLoad.map(loadModule));
        });
      });

      ;
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0YXJ0dXAuZXMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O0FBR0EsV0FBUyxVQUFVLENBQUMsVUFBVSxFQUFFO0FBQzlCLFdBQU8sTUFBTSxVQUFPLENBQUMsVUFBVSxHQUFDLGFBQWEsQ0FBQyxDQUMzQyxJQUFJLENBQUUsVUFBQSxNQUFNO2FBQUksTUFBTSxXQUFRLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztLQUFBLENBQUUsQ0FDN0MsSUFBSSxDQUFFO2FBQU0sTUFBTSxVQUFPLENBQUMsVUFBVSxHQUFDLFNBQVMsQ0FBQztLQUFBLENBQUUsQ0FDakQsSUFBSSxDQUFFLFVBQUEsTUFBTTthQUFJLEFBQUMsSUFBSSxNQUFNLFdBQVEsQ0FBQyxFQUFFLE1BQU0sRUFBTixNQUFNLEVBQUUsQ0FBQyxDQUFFLElBQUksRUFBRTtLQUFBLENBQUUsU0FDcEQsQ0FBRSxVQUFBLENBQUMsRUFBSTtBQUNYLGdCQUFVLENBQUMsR0FBRyxDQUFDLDJCQUEyQixHQUFDLFVBQVUsR0FBQyxLQUFLLEdBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFDLE1BQU0sR0FBQyxDQUFDLENBQUMsS0FBSyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0tBQ3ZHLENBQUMsQ0FBQztHQUNOOzs7Ozs7O3lCQUVjLFVBQVUsTUFBTSxFQUE0QjtZQUExQixPQUFPLHlEQUFHLE1BQU0sQ0FBQyxPQUFPOzs7QUFFdkQsWUFBTSxhQUFhLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQyxVQUFTLENBQUMsRUFBRTtBQUMvQyxpQkFBTyxNQUFNLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztTQUN4QyxDQUFDLENBQUM7O0FBRUosZUFBTyxVQUFVLENBQUMsTUFBTSxDQUFDLENBQUMsSUFBSSxDQUFFLFlBQU07QUFDbkMsaUJBQU8sT0FBTyxDQUFDLEdBQUcsQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FDbkQsQ0FBQyxDQUFDO09BQ0o7O0FBQUEsT0FBQyIsImZpbGUiOiJzdGFydHVwLmVzIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFsIFN5c3RlbSAqL1xuaW1wb3J0IGNvbmZpZyBmcm9tIFwiY29yZS9jb25maWdcIjtcblxuZnVuY3Rpb24gbG9hZE1vZHVsZShtb2R1bGVOYW1lKSB7XG4gIHJldHVybiBTeXN0ZW0uaW1wb3J0KG1vZHVsZU5hbWUrXCIvYmFja2dyb3VuZFwiKVxuICAgIC50aGVuKCBtb2R1bGUgPT4gbW9kdWxlLmRlZmF1bHQuaW5pdChjb25maWcpIClcbiAgICAudGhlbiggKCkgPT4gU3lzdGVtLmltcG9ydChtb2R1bGVOYW1lK1wiL3dpbmRvd1wiKSApXG4gICAgLnRoZW4oIG1vZHVsZSA9PiAobmV3IG1vZHVsZS5kZWZhdWx0KHsgd2luZG93IH0pKS5pbml0KCkgKVxuICAgIC5jYXRjaCggZSA9PiB7XG4gICAgICBDbGlxelV0aWxzLmxvZyhcIkVycm9yIG9uIGxvYWRpbmcgbW9kdWxlOiBcIittb2R1bGVOYW1lK1wiIC0gXCIrZS50b1N0cmluZygpK1wiIC0tIFwiK2Uuc3RhY2ssIFwiRXh0ZW5zaW9uXCIpO1xuICAgIH0pO1xufVxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiAod2luZG93LCBtb2R1bGVzID0gY29uZmlnLm1vZHVsZXMpIHtcbiAgLy8gaW50ZXJzZW50IGNvbmZpZyBmaWxlIHdpdGhcbiAgY29uc3QgbW9kdWxlc1RvTG9hZCA9IG1vZHVsZXMuZmlsdGVyKGZ1bmN0aW9uKG4pIHtcbiAgICByZXR1cm4gY29uZmlnLm1vZHVsZXMuaW5kZXhPZihuKSAhPSAtMTtcbiAgfSk7XG5cblx0cmV0dXJuIGxvYWRNb2R1bGUoXCJjb3JlXCIpLnRoZW4oICgpID0+IHtcbiAgICByZXR1cm4gUHJvbWlzZS5hbGwobW9kdWxlc1RvTG9hZC5tYXAobG9hZE1vZHVsZSkpO1xuICB9KTtcbn07XG4iXX0=