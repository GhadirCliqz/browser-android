System.register(['core/cliqz'], function (_export) {
  'use strict';

  var utils;

  _export('readFile', readFile);

  _export('writeFile', writeFile);

  _export('mkdir', mkdir);

  function getFullPath(filePath) {
    if (typeof filePath === 'string') {
      filePath = [filePath];
    }
    return filePath.join('/');
  }

  function readFile(filePath) {
    return new Promise(function (resolve, reject) {
      utils.log('readFile: ' + getFullPath(filePath), 'xxx');
      readTempFile(getFullPath(filePath), function (data) {
        if (!data) {
          reject();
        } else {
          resolve(data);
        }
      });
    });
  }

  function writeFile(filePath, data) {
    utils.log('writeFile: ' + getFullPath(filePath), 'xxx');
    utils.log('data: ' + data, 'xxx');
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }
    writeTempFile(getFullPath(filePath), data);
    return Promise.resolve();
  }

  function mkdir(dirPath) {
    utils.log('mkdir: ' + getFullPath(dirPath), 'xxx');
    mkTempDir(getFullPath(dirPath));
    return Promise.resolve();
  }

  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }],
    execute: function () {}
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImZzLmVzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7O0FBRUEsV0FBUyxXQUFXLENBQUMsUUFBUSxFQUFFO0FBQzdCLFFBQUssT0FBTyxRQUFRLEtBQUssUUFBUSxFQUFHO0FBQ2xDLGNBQVEsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0tBQ3ZCO0FBQ0QsV0FBTyxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0dBQzNCOztBQUVNLFdBQVMsUUFBUSxDQUFDLFFBQVEsRUFBRTtBQUNqQyxXQUFPLElBQUksT0FBTyxDQUFFLFVBQUMsT0FBTyxFQUFFLE1BQU0sRUFBSztBQUN2QyxXQUFLLENBQUMsR0FBRyxDQUFDLFlBQVksR0FBRSxXQUFXLENBQUMsUUFBUSxDQUFDLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDdEQsa0JBQVksQ0FBQyxXQUFXLENBQUMsUUFBUSxDQUFDLEVBQUUsVUFBQyxJQUFJLEVBQUs7QUFDNUMsWUFBSSxDQUFDLElBQUksRUFBRTtBQUNULGdCQUFNLEVBQUUsQ0FBQztTQUNWLE1BQU07QUFDTCxpQkFBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1NBQ2Y7T0FDRixDQUFDLENBQUM7S0FDSixDQUFDLENBQUM7R0FDSjs7QUFFTSxXQUFTLFNBQVMsQ0FBQyxRQUFRLEVBQUUsSUFBSSxFQUFFO0FBQ3hDLFNBQUssQ0FBQyxHQUFHLENBQUMsYUFBYSxHQUFFLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRSxLQUFLLENBQUMsQ0FBQztBQUN2RCxTQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsR0FBRyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7QUFDbEMsUUFBSyxPQUFPLElBQUksS0FBSyxRQUFRLEVBQUU7QUFDN0IsVUFBSSxHQUFHLElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7S0FDN0I7QUFDRCxpQkFBYSxDQUFDLFdBQVcsQ0FBQyxRQUFRLENBQUMsRUFBRSxJQUFJLENBQUMsQ0FBQztBQUMzQyxXQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztHQUMxQjs7QUFFTSxXQUFTLEtBQUssQ0FBQyxPQUFPLEVBQUU7QUFDN0IsU0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLEdBQUUsV0FBVyxDQUFDLE9BQU8sQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0FBQ2xELGFBQVMsQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQztBQUNoQyxXQUFPLE9BQU8sQ0FBQyxPQUFPLEVBQUUsQ0FBQztHQUMxQjs7Ozt5QkFwQ1EsS0FBSyIsImZpbGUiOiJmcy5lcyIsInNvdXJjZVJvb3QiOiJwbGF0Zm9ybSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IHV0aWxzIH0gZnJvbSAnY29yZS9jbGlxeic7XG5cbmZ1bmN0aW9uIGdldEZ1bGxQYXRoKGZpbGVQYXRoKSB7XG4gIGlmICggdHlwZW9mIGZpbGVQYXRoID09PSAnc3RyaW5nJyApIHtcbiAgICBmaWxlUGF0aCA9IFtmaWxlUGF0aF07XG4gIH1cbiAgcmV0dXJuIGZpbGVQYXRoLmpvaW4oJy8nKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHJlYWRGaWxlKGZpbGVQYXRoKSB7XG4gIHJldHVybiBuZXcgUHJvbWlzZSggKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgIHV0aWxzLmxvZygncmVhZEZpbGU6ICcrIGdldEZ1bGxQYXRoKGZpbGVQYXRoKSwgJ3h4eCcpO1xuICAgIHJlYWRUZW1wRmlsZShnZXRGdWxsUGF0aChmaWxlUGF0aCksIChkYXRhKSA9PiB7XG4gICAgICBpZiAoIWRhdGEpIHtcbiAgICAgICAgcmVqZWN0KCk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXNvbHZlKGRhdGEpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIHdyaXRlRmlsZShmaWxlUGF0aCwgZGF0YSkge1xuICB1dGlscy5sb2coJ3dyaXRlRmlsZTogJysgZ2V0RnVsbFBhdGgoZmlsZVBhdGgpLCAneHh4Jyk7XG4gIHV0aWxzLmxvZygnZGF0YTogJyArIGRhdGEsICd4eHgnKTtcbiAgaWYgKCB0eXBlb2YgZGF0YSAhPT0gJ3N0cmluZycpIHtcbiAgICBkYXRhID0gSlNPTi5zdHJpbmdpZnkoZGF0YSk7XG4gIH1cbiAgd3JpdGVUZW1wRmlsZShnZXRGdWxsUGF0aChmaWxlUGF0aCksIGRhdGEpO1xuICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBta2RpcihkaXJQYXRoKSB7XG4gIHV0aWxzLmxvZygnbWtkaXI6ICcrIGdldEZ1bGxQYXRoKGRpclBhdGgpLCAneHh4Jyk7XG4gIG1rVGVtcERpcihnZXRGdWxsUGF0aChkaXJQYXRoKSk7XG4gIHJldHVybiBQcm9taXNlLnJlc29sdmUoKTtcbn1cbiJdfQ==