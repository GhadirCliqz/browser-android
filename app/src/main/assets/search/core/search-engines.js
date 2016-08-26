System.register('core/search-engines', [], function (_export) {
  'use strict';

  _export('setSearchEngine', setSearchEngine);

  function setSearchEngine(engine) {
    Services.search.currentEngine = engine;
  }

  return {
    setters: [],
    execute: function () {
      Components.utils['import']('resource://gre/modules/Services.jsm');
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvcmUvc2VhcmNoLWVuZ2luZXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFFTyxXQUFTLGVBQWUsQ0FBQyxNQUFNLEVBQUU7QUFDdEMsWUFBUSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDO0dBQ3hDOzs7OztBQUpELGdCQUFVLENBQUMsS0FBSyxVQUFPLENBQUMscUNBQXFDLENBQUMsQ0FBQyIsImZpbGUiOiJjb3JlL3NlYXJjaC1lbmdpbmVzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiQ29tcG9uZW50cy51dGlscy5pbXBvcnQoJ3Jlc291cmNlOi8vZ3JlL21vZHVsZXMvU2VydmljZXMuanNtJyk7XG5cbmV4cG9ydCBmdW5jdGlvbiBzZXRTZWFyY2hFbmdpbmUoZW5naW5lKSB7XG4gIFNlcnZpY2VzLnNlYXJjaC5jdXJyZW50RW5naW5lID0gZW5naW5lO1xufVxuIl19