System.register('platform/fs', [], function (_export) {
  'use strict';

  _export('readFile', readFile);

  _export('writeFile', writeFile);

  _export('mkdir', mkdir);

  function readFile(filePath) {
    return Promise.reject('not implemented');
  }

  function writeFile(filePath, data, options) {
    return Promise.reject('not implemented');
  }

  function mkdir(dirPath, options) {
    return Promise.reject('not implemented');
  }

  return {
    setters: [],
    execute: function () {}
  };
});