System.register('autocomplete/smart-cliqz-cache/rich-header', ['core/cliqz', 'autocomplete/result'], function (_export) {
  'use strict';

  var utils, Result;

  _export('getSmartCliqz', getSmartCliqz);

  function getSmartCliqz(url) {
    var _this = this;

    utils.log('getSmartCliqz: start fetching for ' + url);

    return new Promise(function (resolve, reject) {
      var endpointUrl = 'https://newbeta.cliqz.com/api/v1/rich-header?path=/map&bmresult=' + url;

      utils.httpGet(endpointUrl, (function success(req) {
        try {
          var smartCliqzData = JSON.parse(req.response).results[0];
          var smartCliqzExists = typeof smartCliqzData !== 'undefined';
          var smartCliqz = undefined;

          if (!smartCliqzExists) {
            reject({
              type: 'URL_NOT_FOUND',
              message: url + ' not found on server'
            });
          } else {
            smartCliqz = Result.cliqzExtra(smartCliqzData);
            utils.log('getSmartCliqz: done fetching for ' + url);
            resolve(smartCliqz);
          }
        } catch (e) {
          reject({
            type: 'UNKNOWN_ERROR',
            message: e
          });
        }
      }).bind(_this), function error() {
        reject({
          type: 'HTTP_REQUEST_ERROR',
          message: ''
        });
      });
    });
  }

  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }, function (_autocompleteResult) {
      Result = _autocompleteResult['default'];
    }],
    execute: function () {}
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dG9jb21wbGV0ZS9zbWFydC1jbGlxei1jYWNoZS9yaWNoLWhlYWRlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7O0FBR08sV0FBUyxhQUFhLENBQUMsR0FBRyxFQUFFOzs7QUFDakMsU0FBSyxDQUFDLEdBQUcsQ0FBQyxvQ0FBb0MsR0FBRyxHQUFHLENBQUMsQ0FBQzs7QUFFdEQsV0FBTyxJQUFJLE9BQU8sQ0FBQyxVQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUs7QUFDdEMsVUFBTSxXQUFXLEdBQUcsa0VBQWtFLEdBQUcsR0FBRyxDQUFDOztBQUU3RixXQUFLLENBQUMsT0FBTyxDQUFDLFdBQVcsRUFBRSxDQUFDLFNBQVMsT0FBTyxDQUFDLEdBQUcsRUFBRTtBQUNoRCxZQUFJO0FBQ0YsY0FBTSxjQUFjLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUFDLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQzNELGNBQU0sZ0JBQWdCLEdBQUksT0FBTyxjQUFjLEtBQUssV0FBVyxBQUFDLENBQUM7QUFDakUsY0FBSSxVQUFVLFlBQUEsQ0FBQzs7QUFFZixjQUFJLENBQUMsZ0JBQWdCLEVBQUU7QUFDckIsa0JBQU0sQ0FBQztBQUNMLGtCQUFJLEVBQUUsZUFBZTtBQUNyQixxQkFBTyxFQUFFLEdBQUcsR0FBRyxzQkFBc0I7YUFDdEMsQ0FBQyxDQUFDO1dBQ0osTUFBTTtBQUNMLHNCQUFVLEdBQUcsTUFBTSxDQUFDLFVBQVUsQ0FBQyxjQUFjLENBQUMsQ0FBQztBQUMvQyxpQkFBSyxDQUFDLEdBQUcsQ0FBQyxtQ0FBbUMsR0FBRyxHQUFHLENBQUMsQ0FBQztBQUNyRCxtQkFBTyxDQUFDLFVBQVUsQ0FBQyxDQUFDO1dBQ3JCO1NBQ0YsQ0FBQyxPQUFPLENBQUMsRUFBRTtBQUNWLGdCQUFNLENBQUM7QUFDTCxnQkFBSSxFQUFFLGVBQWU7QUFDckIsbUJBQU8sRUFBRSxDQUFDO1dBQ1gsQ0FBQyxDQUFDO1NBQ0o7T0FDRixDQUFBLENBQUUsSUFBSSxPQUFNLEVBQUUsU0FBUyxLQUFLLEdBQUc7QUFDOUIsY0FBTSxDQUFDO0FBQ0wsY0FBSSxFQUFFLG9CQUFvQjtBQUMxQixpQkFBTyxFQUFFLEVBQUU7U0FDWixDQUFDLENBQUM7T0FDSixDQUFDLENBQUM7S0FDSixDQUFDLENBQUM7R0FDSjs7Ozt5QkF0Q1EsS0FBSyIsImZpbGUiOiJhdXRvY29tcGxldGUvc21hcnQtY2xpcXotY2FjaGUvcmljaC1oZWFkZXIuanMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1dGlscyB9IGZyb20gJ2NvcmUvY2xpcXonO1xuaW1wb3J0IFJlc3VsdCBmcm9tIFwiYXV0b2NvbXBsZXRlL3Jlc3VsdFwiO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0U21hcnRDbGlxeih1cmwpIHtcbiAgdXRpbHMubG9nKCdnZXRTbWFydENsaXF6OiBzdGFydCBmZXRjaGluZyBmb3IgJyArIHVybCk7XG5cbiAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlLCByZWplY3QpID0+IHtcbiAgICBjb25zdCBlbmRwb2ludFVybCA9ICdodHRwczovL25ld2JldGEuY2xpcXouY29tL2FwaS92MS9yaWNoLWhlYWRlcj9wYXRoPS9tYXAmYm1yZXN1bHQ9JyArIHVybDtcblxuICAgIHV0aWxzLmh0dHBHZXQoZW5kcG9pbnRVcmwsIChmdW5jdGlvbiBzdWNjZXNzKHJlcSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3Qgc21hcnRDbGlxekRhdGEgPSBKU09OLnBhcnNlKHJlcS5yZXNwb25zZSkucmVzdWx0c1swXTtcbiAgICAgICAgY29uc3Qgc21hcnRDbGlxekV4aXN0cyA9ICh0eXBlb2Ygc21hcnRDbGlxekRhdGEgIT09ICd1bmRlZmluZWQnKTtcbiAgICAgICAgbGV0IHNtYXJ0Q2xpcXo7XG5cbiAgICAgICAgaWYgKCFzbWFydENsaXF6RXhpc3RzKSB7XG4gICAgICAgICAgcmVqZWN0KHtcbiAgICAgICAgICAgIHR5cGU6ICdVUkxfTk9UX0ZPVU5EJyxcbiAgICAgICAgICAgIG1lc3NhZ2U6IHVybCArICcgbm90IGZvdW5kIG9uIHNlcnZlcidcbiAgICAgICAgICB9KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzbWFydENsaXF6ID0gUmVzdWx0LmNsaXF6RXh0cmEoc21hcnRDbGlxekRhdGEpO1xuICAgICAgICAgIHV0aWxzLmxvZygnZ2V0U21hcnRDbGlxejogZG9uZSBmZXRjaGluZyBmb3IgJyArIHVybCk7XG4gICAgICAgICAgcmVzb2x2ZShzbWFydENsaXF6KTtcbiAgICAgICAgfVxuICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICByZWplY3Qoe1xuICAgICAgICAgIHR5cGU6ICdVTktOT1dOX0VSUk9SJyxcbiAgICAgICAgICBtZXNzYWdlOiBlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH0pLmJpbmQodGhpcyksIGZ1bmN0aW9uIGVycm9yKCkge1xuICAgICAgcmVqZWN0KHtcbiAgICAgICAgdHlwZTogJ0hUVFBfUkVRVUVTVF9FUlJPUicsXG4gICAgICAgIG1lc3NhZ2U6ICcnXG4gICAgICB9KTtcbiAgICB9KTtcbiAgfSk7XG59XG4iXX0=