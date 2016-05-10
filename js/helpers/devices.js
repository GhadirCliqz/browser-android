'use strict';

let fs = require('fs');

// let devices = [];
// let api_level = process.env.APPIUM_API_LEVEL || '21';
// let api_level_to_version = require('./api-levels');
// let dictMap = function(fun) {
//   let result = [];
//   for (var k in this) {
//     if (this.hasOwnProperty(k) && typeof this[k] !== 'function') {
//       let m = fun(this[k]);
//       if (m) {
//         result = result.concat(m);
//       }
//     }
//   }
//   return result;
// };
//
// Array.prototype.groupBy = function(prop) {
//   let result = this.reduce(function(result, value) {
//     let k = value[prop];
//     if (k) {
//       let group = result[k] || [];
//       group.push(value);
//       result[k] = group;
//     }
//     return result;
//   }, {});
//   result.map = dictMap.bind(result);
//   return result;
// };
//
// let deviceFilter = function(device) {
//   return device.groups.indexOf("Android devices") > -1 &&
//     15 < device.api_level;
// };
//
// let loadDevices = function() {
//   let str = fs.readFileSync('./gen/devices.json', { encoding: 'utf-8' });
//   let rawDevices = JSON.parse(str);
//   return rawDevices;
// };
//
// let pickDevices = function(group, no) {
//   let indexes = [];
//   no = no || 2;
//   var index;
//   do {
//     index = Math.floor(Math.random() * group.length);
//     if (indexes.indexOf(index) < 0) {
//       indexes.push(index);
//     }
//   } while(indexes.length < no && indexes.length < group.length);
//   return indexes.map((i) => {
//     return group[i];
//   });
// };
//
// if (process.env.TESTDROID) {
//   devices = loadDevices()
//     .filter(deviceFilter)
//     .groupBy('api_level')
//     .map(pickDevices);
// } else {
//   devices.push({
//     name: "Android Device",
//     groups: [ "Android devices" ],
//     android_version: api_level_to_version[api_level].version,
//     api_level: api_level
//   });
// }
//
// module.exports = devices;

let rest = require('node-rest-client'),
  Promise = require('promise'),
  _ = require('underscore');

let auth = { user: process.env.TESTDROID_API_KEY, password: '' };
let client = new rest.Client(auth);

exports.loadDevices = function(callback) {
  console.log("Devices");

  function performReq(url, args) {
    console.log(url);
    return new Promise(function (resolv, reject) {
      console.log("Promise");
      args = args || {};
      _.extend(args, { headers: { "Accept": "application/json" } });
      client.get(url, args, function(data, response) {
        if (data) {
          console.log("REceived");
          resolv(data);
        } else {
          console.log(response);
          reject(response);
        }
      });
    });
  }

  function getDeviceProperties(device) {
    let url = "https://cloud.testdroid.com/api/v2/devices/${id}/properties";
    let args = {
      path: {
        id: device.id
      },
      headers: {
        "Accept": "application/json"
      }
    };
    return new Promise(function (resolv, reject) {
      client.get(url, args, function(data, response) {
        if (data) {
          let result = data.data.reduce((result, prop) => {
            let name = prop.propertyGroupName.toLowerCase().replace(/ /g, '_');
            let value = prop.displayName
            result[name] = value;
            return result;
          }, {
            id: device.id,
            name: device.displayName
          });
          resolv(result);
        } else {
          reject(response);
        }
      });
    });
  }

  performReq("https://cloud.testdroid.com/api/v2/devices?limit=100")
    .then((data) => {
      let devices = data.data;
      console.log('Oppp');
      return Promise.all(devices.filter((device) => {
        return device.osType === 'ANDROID' &&
          !device.locked &&
          device.online &&
          device.enabled &&
          device.softwareVersion.apiLevel >= 16;
      }).map((device) => {
        return getDeviceProperties(device);
      }));
    })
    .then((devices) => {
      callback(devices);
    });
};
