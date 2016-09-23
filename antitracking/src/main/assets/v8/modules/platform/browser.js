System.register("platform/browser", [], function (_export) {
  "use strict";

  _export("currentURI", currentURI);

  _export("contextFromEvent", contextFromEvent);

  _export("isWindowActive", isWindowActive);

  _export("forEachWindow", forEachWindow);

  function currentURI() {}

  function contextFromEvent() {
    return null;
  }

  function isWindowActive(windowID) {
    return _nativeIsWindowActive(windowID);
  }

  function forEachWindow(fn) {
    return;
  }

  return {
    setters: [],
    execute: function () {
      ;
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImJyb3dzZXIuZXMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7QUFDTyxXQUFTLFVBQVUsR0FBRyxFQUFFOztBQUV4QixXQUFTLGdCQUFnQixHQUFHO0FBQ2pDLFdBQU8sSUFBSSxDQUFBO0dBQ1o7O0FBRU0sV0FBUyxjQUFjLENBQUMsUUFBUSxFQUFFO0FBQ3ZDLFdBQU8scUJBQXFCLENBQUMsUUFBUSxDQUFDLENBQUM7R0FDeEM7O0FBRU0sV0FBUyxhQUFhLENBQUMsRUFBRSxFQUFFO0FBQ2hDLFdBQU07R0FDUDs7Ozs7QUFaOEIsT0FBQyIsImZpbGUiOiJicm93c2VyLmVzIiwic291cmNlc0NvbnRlbnQiOlsiXG5leHBvcnQgZnVuY3Rpb24gY3VycmVudFVSSSgpIHt9O1xuXG5leHBvcnQgZnVuY3Rpb24gY29udGV4dEZyb21FdmVudCgpIHtcbiAgcmV0dXJuIG51bGxcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzV2luZG93QWN0aXZlKHdpbmRvd0lEKSB7XG4gIHJldHVybiBfbmF0aXZlSXNXaW5kb3dBY3RpdmUod2luZG93SUQpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZm9yRWFjaFdpbmRvdyhmbikge1xuICByZXR1cm5cbn1cbiJdfQ==