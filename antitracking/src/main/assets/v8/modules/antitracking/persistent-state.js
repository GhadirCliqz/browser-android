System.register("antitracking/persistent-state", ["antitracking/pacemaker", "platform/antitracking/storage"], function (_export) {
  "use strict";

  var pacemaker, sto, LOG_KEY, PersistenceHandler, LazyPersistentObject, PersistentObject, AutoPersistentObject;

  var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  _export("create_persistent", create_persistent);

  _export("clear_persistent", clear_persistent);

  _export("getValue", getValue);

  _export("setValue", setValue);

  function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  /** Load data from the attrack sqlite table.
      From CliqzAttrack.loadRecord
   */
  function loadRecord(id, callback) {
    sto.getItem('cliqz.dbattrack.' + id).then(callback);
  }

  /** Save data to the attrack sqlite table.
      From CliqzAttrack.saveRecord
   */
  function saveRecord(id, data) {
    sto.setItem('cliqz.dbattrack.' + id, data);
  }
  function create_persistent(name, setter) {
    loadRecord(name, function (value) {
      var obj = {},
          dirty = false;
      try {
        obj = JSON.parse(value || "{}");
      } catch (e) {
        obj = {};
        dirty = true;
      }
      setter(new Proxy(obj, new PersistenceHandler(name, obj, dirty)));
    });
  }

  function clear_persistent(value) {
    for (var k in value) {
      delete value[k];
    }
  }

  function getValue(key, default_value) {
    var val = CliqzUtils.getPref("attrack." + key, default_value);
    return val;
  }

  function setValue(key, value) {
    CliqzUtils.setPref("attrack." + key, value);
  }

  return {
    setters: [function (_antitrackingPacemaker) {
      pacemaker = _antitrackingPacemaker["default"];
    }, function (_platformAntitrackingStorage) {
      sto = _platformAntitrackingStorage["default"];
    }],
    execute: function () {
      LOG_KEY = "attrack-persist";
      ;;

      PersistenceHandler = (function () {
        function PersistenceHandler(name, target, dirty) {
          _classCallCheck(this, PersistenceHandler);

          this.name = name;
          this.target = target;
          this.dirty = dirty || false;
          // write dirty pages every minute
          pacemaker.register(this.persistState.bind(this), 60000, this.isDirty.bind(this));

          // propegate proxy down object leaves
          for (var k in this.target) {
            this.target[k] = this.proxyBranch(this.target[k]);
          }

          // trap for set operations
          this.set = function (target, property, value, receiver) {
            // propegate proxy down object tree
            target[property] = this.proxyBranch(value);
            this.dirty = true;
            return true;
          };
          // trap for delete operations
          this.deleteProperty = function (target, property) {
            delete target[property];
            this.dirty = true;
            return true;
          };
        }

        _createClass(PersistenceHandler, [{
          key: "persistState",
          value: function persistState() {
            if (this.dirty) {
              saveRecord(this.name, JSON.stringify(this.target));
              this.dirty = false;
            }
          }
        }, {
          key: "proxyBranch",
          value: function proxyBranch(obj) {
            if (typeof obj === 'object') {
              for (var k in obj) {
                obj[k] = this.proxyBranch(obj[k]);
              }
              return new Proxy(obj, this);
            } else {
              return obj;
            }
          }
        }, {
          key: "isDirty",
          value: function isDirty() {
            return this.dirty;
          }
        }]);

        return PersistenceHandler;
      })();

      ;

      ;

      ;

      ;

      ;

      _export("loadRecord", loadRecord);

      _export("saveRecord", saveRecord);

      LazyPersistentObject = (function () {
        function LazyPersistentObject(name) {
          _classCallCheck(this, LazyPersistentObject);

          this.name = name;
          this.value = {};
          this.dirty = false;
        }

        _createClass(LazyPersistentObject, [{
          key: "load",
          value: function load() {
            return new Promise((function (resolve, reject) {
              loadRecord(this.name, (function (value) {
                try {
                  this.value = JSON.parse(value || '{}');
                } catch (e) {
                  this.value = {};
                  this.dirty = true;
                }
                resolve(this.value);
              }).bind(this));
            }).bind(this));
          }
        }, {
          key: "save",
          value: function save() {
            if (this.dirty) {
              saveRecord(this.name, JSON.stringify(this.value));
              this.dirty = false;
            }
          }
        }, {
          key: "setValue",
          value: function setValue(v) {
            this.value = v;
            this.dirty = true;
            this.save();
          }
        }, {
          key: "setDirty",
          value: function setDirty() {
            this.dirty = true;
          }
        }, {
          key: "isDirty",
          value: function isDirty() {
            return this.dirty;
          }
        }, {
          key: "clear",
          value: function clear() {
            this.value = {};
            this.dirty = true;
            this.save();
          }
        }]);

        return LazyPersistentObject;
      })();

      _export("LazyPersistentObject", LazyPersistentObject);

      PersistentObject = (function () {
        function PersistentObject(name, setter) {
          _classCallCheck(this, PersistentObject);

          this.name = name;
          this.value = {};
          this.dirty = false;
          this.setter = setter;
          this.setter(this.value);
          this.load();
        }

        _createClass(PersistentObject, [{
          key: "load",
          value: function load() {
            loadRecord(this.name, (function (value) {
              try {
                this.value = JSON.parse(value || '{}');
              } catch (e) {
                this.value = {};
                this.dirty = true;
              }
              this.setter(this.value);
            }).bind(this));
          }
        }, {
          key: "setValue",
          value: function setValue(v) {
            this.value = v;
            this.dirty = true;
            this.setter(v);
            this.save();
          }
        }, {
          key: "save",
          value: function save() {
            if (this.dirty) {
              saveRecord(this.name, JSON.stringify(this.value));
              this.dirty = false;
            }
          }
        }, {
          key: "setDirty",
          value: function setDirty() {
            this.dirty = true;
          }
        }, {
          key: "isDirty",
          value: function isDirty() {
            return this.dirty;
          }
        }, {
          key: "clear",
          value: function clear() {
            this.value = {};
            this.dirty = true;
            this.save();
            this.setter(this.value);
          }
        }]);

        return PersistentObject;
      })();

      _export("PersistentObject", PersistentObject);

      ;

      AutoPersistentObject = (function (_PersistentObject) {
        _inherits(AutoPersistentObject, _PersistentObject);

        function AutoPersistentObject(name, setter, saveInterval) {
          _classCallCheck(this, AutoPersistentObject);

          _get(Object.getPrototypeOf(AutoPersistentObject.prototype), "constructor", this).call(this, name, setter);
          pacemaker.register(this.save.bind(this), saveInterval, this.isDirty.bind(this));
        }

        return AutoPersistentObject;
      })(PersistentObject);

      _export("AutoPersistentObject", AutoPersistentObject);

      ;
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy9wZXJzaXN0ZW50LXN0YXRlLmVzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztzQkFHTSxPQUFPLEVBZ0JQLGtCQUFrQixFQWtGWCxvQkFBb0IsRUFrRHBCLGdCQUFnQixFQXNEaEIsb0JBQW9COzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFyTWpDLFdBQVMsVUFBVSxDQUFDLEVBQUUsRUFBRSxRQUFRLEVBQUU7QUFDaEMsT0FBRyxDQUFDLE9BQU8sQ0FBQyxrQkFBa0IsR0FBRyxFQUFFLENBQUMsQ0FBQyxJQUFJLENBQUUsUUFBUSxDQUFFLENBQUM7R0FDdkQ7Ozs7O0FBS0QsV0FBUyxVQUFVLENBQUMsRUFBRSxFQUFFLElBQUksRUFBRTtBQUM1QixPQUFHLENBQUMsT0FBTyxDQUFDLGtCQUFrQixHQUFHLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztHQUM1QztBQXFETSxXQUFTLGlCQUFpQixDQUFDLElBQUksRUFBRSxNQUFNLEVBQUU7QUFDOUMsY0FBVSxDQUFDLElBQUksRUFBRSxVQUFTLEtBQUssRUFBRTtBQUMvQixVQUFJLEdBQUcsR0FBRyxFQUFFO1VBQ1IsS0FBSyxHQUFHLEtBQUssQ0FBQztBQUNsQixVQUFJO0FBQ0YsV0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsS0FBSyxJQUFJLElBQUksQ0FBQyxDQUFDO09BQ2pDLENBQUMsT0FBTSxDQUFDLEVBQUU7QUFDVCxXQUFHLEdBQUcsRUFBRSxDQUFDO0FBQ1QsYUFBSyxHQUFHLElBQUksQ0FBQztPQUNkO0FBQ0QsWUFBTSxDQUFDLElBQUksS0FBSyxDQUFDLEdBQUcsRUFBRSxJQUFJLGtCQUFrQixDQUFDLElBQUksRUFBRSxHQUFHLEVBQUUsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQ2xFLENBQUMsQ0FBQztHQUNKOztBQUVNLFdBQVMsZ0JBQWdCLENBQUMsS0FBSyxFQUFFO0FBQ3RDLFNBQUssSUFBSSxDQUFDLElBQUksS0FBSyxFQUFFO0FBQ25CLGFBQU8s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QUUsTUFBTSxFQUFFO0FBQ3BCLG1CQUFTLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLFlBQVksRUFBRSxJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO1NBQ2pGOztlQUxVLG9CQUFvQjtTQUFTLGdCQUFnQjs7OztBQU96RCxPQUFDIiwiZmlsZSI6ImFudGl0cmFja2luZy9wZXJzaXN0ZW50LXN0YXRlLmVzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHBhY2VtYWtlciBmcm9tIFwiYW50aXRyYWNraW5nL3BhY2VtYWtlclwiO1xuaW1wb3J0IHN0byBmcm9tIFwicGxhdGZvcm0vYW50aXRyYWNraW5nL3N0b3JhZ2VcIjtcblxuY29uc3QgTE9HX0tFWSA9IFwiYXR0cmFjay1wZXJzaXN0XCI7XG5cbi8qKiBMb2FkIGRhdGEgZnJvbSB0aGUgYXR0cmFjayBzcWxpdGUgdGFibGUuXG4gICAgRnJvbSBDbGlxekF0dHJhY2subG9hZFJlY29yZFxuICovXG5mdW5jdGlvbiBsb2FkUmVjb3JkKGlkLCBjYWxsYmFjaykge1xuICBzdG8uZ2V0SXRlbSgnY2xpcXouZGJhdHRyYWNrLicgKyBpZCkudGhlbiggY2FsbGJhY2sgKTtcbn07XG5cbi8qKiBTYXZlIGRhdGEgdG8gdGhlIGF0dHJhY2sgc3FsaXRlIHRhYmxlLlxuICAgIEZyb20gQ2xpcXpBdHRyYWNrLnNhdmVSZWNvcmRcbiAqL1xuZnVuY3Rpb24gc2F2ZVJlY29yZChpZCwgZGF0YSkge1xuICBzdG8uc2V0SXRlbSgnY2xpcXouZGJhdHRyYWNrLicgKyBpZCwgZGF0YSk7XG59O1xuXG5jbGFzcyBQZXJzaXN0ZW5jZUhhbmRsZXIge1xuICBjb25zdHJ1Y3RvcihuYW1lLCB0YXJnZXQsIGRpcnR5KSB7XG4gICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB0aGlzLnRhcmdldCA9IHRhcmdldDtcbiAgICB0aGlzLmRpcnR5ID0gZGlydHkgfHwgZmFsc2U7XG4gICAgLy8gd3JpdGUgZGlydHkgcGFnZXMgZXZlcnkgbWludXRlXG4gICAgcGFjZW1ha2VyLnJlZ2lzdGVyKHRoaXMucGVyc2lzdFN0YXRlLmJpbmQodGhpcyksIDYwMDAwLCB0aGlzLmlzRGlydHkuYmluZCh0aGlzKSk7XG5cbiAgICAvLyBwcm9wZWdhdGUgcHJveHkgZG93biBvYmplY3QgbGVhdmVzXG4gICAgZm9yIChsZXQgayBpbiB0aGlzLnRhcmdldCkge1xuICAgICAgdGhpcy50YXJnZXRba10gPSB0aGlzLnByb3h5QnJhbmNoKHRoaXMudGFyZ2V0W2tdKTtcbiAgICB9XG5cbiAgICAvLyB0cmFwIGZvciBzZXQgb3BlcmF0aW9uc1xuICAgIHRoaXMuc2V0ID0gZnVuY3Rpb24odGFyZ2V0LCBwcm9wZXJ0eSwgdmFsdWUsIHJlY2VpdmVyKSB7XG4gICAgICAvLyBwcm9wZWdhdGUgcHJveHkgZG93biBvYmplY3QgdHJlZVxuICAgICAgdGFyZ2V0W3Byb3BlcnR5XSA9IHRoaXMucHJveHlCcmFuY2godmFsdWUpO1xuICAgICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIC8vIHRyYXAgZm9yIGRlbGV0ZSBvcGVyYXRpb25zXG4gICAgdGhpcy5kZWxldGVQcm9wZXJ0eSA9IGZ1bmN0aW9uKHRhcmdldCwgcHJvcGVydHkpIHtcbiAgICAgIGRlbGV0ZSB0YXJnZXRbcHJvcGVydHldO1xuICAgICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICB9XG5cbiAgcGVyc2lzdFN0YXRlKCkge1xuICAgIGlmICh0aGlzLmRpcnR5KSB7XG4gICAgICBzYXZlUmVjb3JkKHRoaXMubmFtZSwgSlNPTi5zdHJpbmdpZnkodGhpcy50YXJnZXQpKTtcbiAgICAgIHRoaXMuZGlydHkgPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBwcm94eUJyYW5jaChvYmopIHtcbiAgICBpZiAodHlwZW9mIG9iaiA9PT0gJ29iamVjdCcpIHtcbiAgICAgIGZvciAobGV0IGsgaW4gb2JqKSB7XG4gICAgICAgIG9ialtrXSA9IHRoaXMucHJveHlCcmFuY2gob2JqW2tdKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBuZXcgUHJveHkob2JqLCB0aGlzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIG9iajtcbiAgICB9XG4gIH1cblxuICBpc0RpcnR5KCkge1xuICAgIHJldHVybiB0aGlzLmRpcnR5O1xuICB9XG59O1xuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlX3BlcnNpc3RlbnQobmFtZSwgc2V0dGVyKSB7XG4gIGxvYWRSZWNvcmQobmFtZSwgZnVuY3Rpb24odmFsdWUpIHtcbiAgICB2YXIgb2JqID0ge30sXG4gICAgICAgIGRpcnR5ID0gZmFsc2U7XG4gICAgdHJ5IHtcbiAgICAgIG9iaiA9IEpTT04ucGFyc2UodmFsdWUgfHwgXCJ7fVwiKTtcbiAgICB9IGNhdGNoKGUpIHtcbiAgICAgIG9iaiA9IHt9O1xuICAgICAgZGlydHkgPSB0cnVlO1xuICAgIH1cbiAgICBzZXR0ZXIobmV3IFByb3h5KG9iaiwgbmV3IFBlcnNpc3RlbmNlSGFuZGxlcihuYW1lLCBvYmosIGRpcnR5KSkpO1xuICB9KTtcbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBjbGVhcl9wZXJzaXN0ZW50KHZhbHVlKSB7XG4gIGZvciAobGV0IGsgaW4gdmFsdWUpIHtcbiAgICBkZWxldGUgdmFsdWVba107XG4gIH1cbn07XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRWYWx1ZShrZXksIGRlZmF1bHRfdmFsdWUpIHtcbiAgbGV0IHZhbCA9IENsaXF6VXRpbHMuZ2V0UHJlZihcImF0dHJhY2suXCIgKyBrZXksIGRlZmF1bHRfdmFsdWUpO1xuICByZXR1cm4gdmFsO1xufTtcblxuZXhwb3J0IGZ1bmN0aW9uIHNldFZhbHVlKGtleSwgdmFsdWUpIHtcbiAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiYXR0cmFjay5cIiArIGtleSwgdmFsdWUpO1xufTtcblxuZXhwb3J0IHsgbG9hZFJlY29yZCwgc2F2ZVJlY29yZCB9O1xuXG5leHBvcnQgY2xhc3MgTGF6eVBlcnNpc3RlbnRPYmplY3Qge1xuXG4gIGNvbnN0cnVjdG9yKG5hbWUpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMudmFsdWUgPSB7fTtcbiAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gIH1cblxuICBsb2FkKCkge1xuICAgIHJldHVybiBuZXcgUHJvbWlzZShmdW5jdGlvbihyZXNvbHZlLCByZWplY3QpIHtcbiAgICAgIGxvYWRSZWNvcmQodGhpcy5uYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICB0cnkge1xuICAgICAgICAgIHRoaXMudmFsdWUgPSBKU09OLnBhcnNlKHZhbHVlIHx8ICd7fScpO1xuICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICB0aGlzLnZhbHVlID0ge307XG4gICAgICAgICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgcmVzb2x2ZSh0aGlzLnZhbHVlKTtcbiAgICAgIH0uYmluZCh0aGlzKSk7XG4gICAgfS5iaW5kKHRoaXMpKTtcbiAgfVxuXG4gIHNhdmUoKSB7XG4gICAgaWYgKHRoaXMuZGlydHkpIHtcbiAgICAgIHNhdmVSZWNvcmQodGhpcy5uYW1lLCBKU09OLnN0cmluZ2lmeSh0aGlzLnZhbHVlKSk7XG4gICAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgc2V0VmFsdWUodikge1xuICAgIHRoaXMudmFsdWUgPSB2O1xuICAgIHRoaXMuZGlydHkgPSB0cnVlO1xuICAgIHRoaXMuc2F2ZSgpO1xuICB9XG5cbiAgc2V0RGlydHkoKSB7XG4gICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gIH1cblxuICBpc0RpcnR5KCkge1xuICAgIHJldHVybiB0aGlzLmRpcnR5O1xuICB9XG5cbiAgY2xlYXIoKSB7XG4gICAgdGhpcy52YWx1ZSA9IHt9O1xuICAgIHRoaXMuZGlydHkgPSB0cnVlO1xuICAgIHRoaXMuc2F2ZSgpO1xuICB9XG59XG5cbmV4cG9ydCBjbGFzcyBQZXJzaXN0ZW50T2JqZWN0IHtcblxuICBjb25zdHJ1Y3RvcihuYW1lLCBzZXR0ZXIpIHtcbiAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIHRoaXMudmFsdWUgPSB7fTtcbiAgICB0aGlzLmRpcnR5ID0gZmFsc2U7XG4gICAgdGhpcy5zZXR0ZXIgPSBzZXR0ZXI7XG4gICAgdGhpcy5zZXR0ZXIodGhpcy52YWx1ZSk7XG4gICAgdGhpcy5sb2FkKCk7XG4gIH1cblxuICBsb2FkKCkge1xuICAgIGxvYWRSZWNvcmQodGhpcy5uYW1lLCBmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IEpTT04ucGFyc2UodmFsdWUgfHwgJ3t9Jyk7XG4gICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgdGhpcy52YWx1ZSA9IHt9O1xuICAgICAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHRoaXMuc2V0dGVyKHRoaXMudmFsdWUpO1xuICAgIH0uYmluZCh0aGlzKSk7XG4gIH1cblxuICBzZXRWYWx1ZSh2KSB7XG4gICAgdGhpcy52YWx1ZSA9IHY7XG4gICAgdGhpcy5kaXJ0eSA9IHRydWU7XG4gICAgdGhpcy5zZXR0ZXIodik7XG4gICAgdGhpcy5zYXZlKCk7XG4gIH1cblxuICBzYXZlKCkge1xuICAgIGlmICh0aGlzLmRpcnR5KSB7XG4gICAgICBzYXZlUmVjb3JkKHRoaXMubmFtZSwgSlNPTi5zdHJpbmdpZnkodGhpcy52YWx1ZSkpO1xuICAgICAgdGhpcy5kaXJ0eSA9IGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHNldERpcnR5KCkge1xuICAgIHRoaXMuZGlydHkgPSB0cnVlO1xuICB9XG5cbiAgaXNEaXJ0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5kaXJ0eTtcbiAgfVxuXG4gIGNsZWFyKCkge1xuICAgIHRoaXMudmFsdWUgPSB7fTtcbiAgICB0aGlzLmRpcnR5ID0gdHJ1ZTtcbiAgICB0aGlzLnNhdmUoKTtcbiAgICB0aGlzLnNldHRlcih0aGlzLnZhbHVlKTtcbiAgfVxuXG59O1xuXG5leHBvcnQgY2xhc3MgQXV0b1BlcnNpc3RlbnRPYmplY3QgZXh0ZW5kcyBQZXJzaXN0ZW50T2JqZWN0IHtcblxuICBjb25zdHJ1Y3RvcihuYW1lLCBzZXR0ZXIsIHNhdmVJbnRlcnZhbCkge1xuICAgIHN1cGVyKG5hbWUsIHNldHRlcik7XG4gICAgcGFjZW1ha2VyLnJlZ2lzdGVyKHRoaXMuc2F2ZS5iaW5kKHRoaXMpLCBzYXZlSW50ZXJ2YWwsIHRoaXMuaXNEaXJ0eS5iaW5kKHRoaXMpKTtcbiAgfVxuXG59O1xuIl19