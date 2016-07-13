
var CliqzEvents = {
  cache: {},
  pub: function (id) {
    var args = Array.prototype.slice.call(arguments, 1);
    (CliqzEvents.cache[id] || []).forEach(function (ev) {
      CliqzUtils.setTimeout(function () {
        try {
          ev.apply(null, args);
        } catch(e) {
          CliqzUtils.log(e.toString()+" -- "+e.stack, "CliqzEvents error: "+id);
        }
      }, 0);
    });
  },

  sub: function (id, fn) {
    CliqzEvents.cache[id] = CliqzEvents.cache[id] || [];
    CliqzEvents.cache[id].push(fn);
  },

  un_sub: function (id, fn) {
    var index;
    if (!CliqzEvents.cache[id]) {
      return;
    }
    if (!fn) {
      CliqzEvents.cache[id] = [];
    } else {
      index = CliqzEvents.cache[id].indexOf(fn);
      if (index > -1) {
        CliqzEvents.cache[id].splice(index);
      }
    }
  },

  nextId: function nextId() {
    nextId.id = nextId.id || 0;
    nextId.id += 1;
    return nextId.id;
  }
}
