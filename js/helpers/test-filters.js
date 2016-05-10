'use strict';

let filters = {
  min_api_level: function(min_api_level) {
    return function(api_level) {
        return api_level >= min_api_level;
    };
  },

  selected_api_level: function() {
    let desired_api_levels = args;
    return function(api_level) {
      return desired_api_levels.contains(api_level);
    };
  }
};

module.exports = filters;
