'use strict';

let fs = require('fs');

var tests = [];

fs.readdirSync('./tests').some((src) => {
  let test = require('../tests/' + src);
  if (test.only) {
    tests = [ test ];
    return true;
  } else {
    tests.push(test);
    return false;
  }
});

module.exports = tests;
