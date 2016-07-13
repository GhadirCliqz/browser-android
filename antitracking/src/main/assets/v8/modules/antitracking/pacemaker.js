System.register("antitracking/pacemaker", [], function (_export) {
  "use strict";

  var default_tpace, Pacemaker, pm;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  return {
    setters: [],
    execute: function () {
      default_tpace = 10 * 1000;

      Pacemaker = (function () {
        function Pacemaker(tpace, twait) {
          _classCallCheck(this, Pacemaker);

          this.tpace = tpace || default_tpace;
          this.twait = new Date().getTime() + (twait || 0);
          this._id = null;
          this._tasks = new Set();
        }

        // export singleton pacemaker

        _createClass(Pacemaker, [{
          key: "start",
          value: function start() {
            if (this._id) {
              this.stop();
            }
            this._id = CliqzUtils.setInterval(this._tick.bind(this), this.tpace, null);
          }
        }, {
          key: "stop",
          value: function stop() {
            CliqzUtils.clearTimeout(this._id);
            this._id = null;
          }
        }, {
          key: "_tick",
          value: function _tick() {
            var now = new Date().getTime();
            // initial waiting period
            if (this.twait > now) {
              CliqzUtils.log("tick wait", "pacemaker");
              return;
            }

            // run registered tasks
            this._tasks.forEach(function (task) {
              if (now > task.last + task.freq) {
                CliqzUtils.setTimeout(function () {
                  var task_name = task.fn.name || "<anon>";
                  try {
                    // if task constraint is set, test it before running
                    if (!task.when || task.when(task)) {
                      CliqzUtils.log("run task: " + task_name, "pacemaker");
                      task.fn(now);
                    }
                    task.last = now;
                  } catch (e) {
                    CliqzUtils.log("Error executing task " + task_name + ": " + e, "pacemaker");
                  }
                }, 0);
              }
            });
          }

          /** Register a function to be run periodically by the pacemaker.
                @param fn function to call
                @param frequency minimum interval between calls, in ms.
                @returns task object, which can be used with deregister to stop this task.
           */
        }, {
          key: "register",
          value: function register(fn, frequency, constraint) {
            if (!fn) {
              throw "fn cannot be undefined";
            }
            var task = {
              fn: fn,
              freq: frequency || 0,
              last: 0,
              when: constraint
            };
            this._tasks.add(task);
            return task;
          }
        }, {
          key: "deregister",
          value: function deregister(task) {
            this._tasks["delete"](task);
          }
        }]);

        return Pacemaker;
      })();

      pm = new Pacemaker(30000, 30000);

      _export("default", pm);
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy9wYWNlbWFrZXIuZXMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O01BQ00sYUFBYSxFQUViLFNBQVMsRUEwRVgsRUFBRTs7Ozs7Ozs7O0FBNUVBLG1CQUFhLEdBQUcsRUFBRSxHQUFHLElBQUk7O0FBRXpCLGVBQVM7QUFFRixpQkFGUCxTQUFTLENBRUQsS0FBSyxFQUFFLEtBQUssRUFBRTtnQ0FGdEIsU0FBUzs7QUFHWCxjQUFJLENBQUMsS0FBSyxHQUFHLEtBQUssSUFBSSxhQUFhLENBQUM7QUFDcEMsY0FBSSxDQUFDLEtBQUssR0FBRyxBQUFDLElBQUksSUFBSSxFQUFFLENBQUUsT0FBTyxFQUFFLElBQUksS0FBSyxJQUFJLENBQUMsQ0FBQSxBQUFDLENBQUM7QUFDbkQsY0FBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUM7QUFDaEIsY0FBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLEdBQUcsRUFBRSxDQUFDO1NBQ3pCOzs7O3FCQVBHLFNBQVM7O2lCQVNSLGlCQUFHO0FBQ04sZ0JBQUksSUFBSSxDQUFDLEdBQUcsRUFBRTtBQUNaLGtCQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7YUFDYjtBQUNELGdCQUFJLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQyxXQUFXLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsSUFBSSxDQUFDLEtBQUssRUFBRSxJQUFJLENBQUMsQ0FBQztXQUM1RTs7O2lCQUVHLGdCQUFHO0FBQ0wsc0JBQVUsQ0FBQyxZQUFZLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO0FBQ2xDLGdCQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQztXQUNqQjs7O2lCQUVJLGlCQUFHO0FBQ04sZ0JBQUksR0FBRyxHQUFHLEFBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBRSxPQUFPLEVBQUUsQ0FBQzs7QUFFakMsZ0JBQUksSUFBSSxDQUFDLEtBQUssR0FBRyxHQUFHLEVBQUU7QUFDcEIsd0JBQVUsQ0FBQyxHQUFHLENBQUMsV0FBVyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ3pDLHFCQUFPO2FBQ1I7OztBQUdELGdCQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxVQUFTLElBQUksRUFBRTtBQUNqQyxrQkFBSSxHQUFHLEdBQUcsSUFBSSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFO0FBQy9CLDBCQUFVLENBQUMsVUFBVSxDQUFDLFlBQVc7QUFDL0Isc0JBQUksU0FBUyxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxJQUFJLFFBQVEsQ0FBQztBQUN6QyxzQkFBSTs7QUFFRix3QkFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLElBQUksSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUNqQyxnQ0FBVSxDQUFDLEdBQUcsQ0FBQyxZQUFZLEdBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQyxDQUFDO0FBQ3JELDBCQUFJLENBQUMsRUFBRSxDQUFDLEdBQUcsQ0FBQyxDQUFDO3FCQUNkO0FBQ0Qsd0JBQUksQ0FBQyxJQUFJLEdBQUcsR0FBRyxDQUFDO21CQUNqQixDQUFDLE9BQU0sQ0FBQyxFQUFFO0FBQ1QsOEJBQVUsQ0FBQyxHQUFHLENBQUMsdUJBQXVCLEdBQUUsU0FBUyxHQUFFLElBQUksR0FBRSxDQUFDLEVBQUUsV0FBVyxDQUFDLENBQUM7bUJBQzFFO2lCQUNGLEVBQUUsQ0FBQyxDQUFDLENBQUM7ZUFDUDthQUNGLENBQUMsQ0FBQztXQUNKOzs7Ozs7Ozs7aUJBT08sa0JBQUMsRUFBRSxFQUFFLFNBQVMsRUFBRSxVQUFVLEVBQUU7QUFDbEMsZ0JBQUksQ0FBQyxFQUFFLEVBQUU7QUFDUCxvQkFBTSx3QkFBd0IsQ0FBQzthQUNoQztBQUNELGdCQUFJLElBQUksR0FBRztBQUNULGdCQUFFLEVBQUUsRUFBRTtBQUNOLGtCQUFJLEVBQUUsU0FBUyxJQUFJLENBQUM7QUFDcEIsa0JBQUksRUFBRSxDQUFDO0FBQ1Asa0JBQUksRUFBRSxVQUFVO2FBQ2pCLENBQUM7QUFDRixnQkFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdEIsbUJBQU8sSUFBSSxDQUFDO1dBQ2I7OztpQkFFUyxvQkFBQyxJQUFJLEVBQUU7QUFDZixnQkFBSSxDQUFDLE1BQU0sVUFBTyxDQUFDLElBQUksQ0FBQyxDQUFDO1dBQzFCOzs7ZUF0RUcsU0FBUzs7O0FBMEVYLFFBQUUsR0FBRyxJQUFJLFNBQVMsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDOzt5QkFDckIsRUFBRSIsImZpbGUiOiJhbnRpdHJhY2tpbmcvcGFjZW1ha2VyLmVzIiwic291cmNlc0NvbnRlbnQiOlsiXG5jb25zdCBkZWZhdWx0X3RwYWNlID0gMTAgKiAxMDAwO1xuXG5jbGFzcyBQYWNlbWFrZXIge1xuXG4gIGNvbnN0cnVjdG9yKHRwYWNlLCB0d2FpdCkge1xuICAgIHRoaXMudHBhY2UgPSB0cGFjZSB8fCBkZWZhdWx0X3RwYWNlO1xuICAgIHRoaXMudHdhaXQgPSAobmV3IERhdGUoKSkuZ2V0VGltZSgpICsgKHR3YWl0IHx8IDApO1xuICAgIHRoaXMuX2lkID0gbnVsbDtcbiAgICB0aGlzLl90YXNrcyA9IG5ldyBTZXQoKTtcbiAgfVxuXG4gIHN0YXJ0KCkge1xuICAgIGlmICh0aGlzLl9pZCkge1xuICAgICAgdGhpcy5zdG9wKCk7XG4gICAgfVxuICAgIHRoaXMuX2lkID0gQ2xpcXpVdGlscy5zZXRJbnRlcnZhbCh0aGlzLl90aWNrLmJpbmQodGhpcyksIHRoaXMudHBhY2UsIG51bGwpO1xuICB9XG5cbiAgc3RvcCgpIHtcbiAgICBDbGlxelV0aWxzLmNsZWFyVGltZW91dCh0aGlzLl9pZCk7XG4gICAgdGhpcy5faWQgPSBudWxsO1xuICB9XG5cbiAgX3RpY2soKSB7XG4gICAgdmFyIG5vdyA9IChuZXcgRGF0ZSgpKS5nZXRUaW1lKCk7XG4gICAgLy8gaW5pdGlhbCB3YWl0aW5nIHBlcmlvZFxuICAgIGlmICh0aGlzLnR3YWl0ID4gbm93KSB7XG4gICAgICBDbGlxelV0aWxzLmxvZyhcInRpY2sgd2FpdFwiLCBcInBhY2VtYWtlclwiKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICAvLyBydW4gcmVnaXN0ZXJlZCB0YXNrc1xuICAgIHRoaXMuX3Rhc2tzLmZvckVhY2goZnVuY3Rpb24odGFzaykge1xuICAgICAgaWYgKG5vdyA+IHRhc2subGFzdCArIHRhc2suZnJlcSkge1xuICAgICAgICBDbGlxelV0aWxzLnNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgbGV0IHRhc2tfbmFtZSA9IHRhc2suZm4ubmFtZSB8fCBcIjxhbm9uPlwiO1xuICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAvLyBpZiB0YXNrIGNvbnN0cmFpbnQgaXMgc2V0LCB0ZXN0IGl0IGJlZm9yZSBydW5uaW5nXG4gICAgICAgICAgICBpZiAoIXRhc2sud2hlbiB8fCB0YXNrLndoZW4odGFzaykpIHtcbiAgICAgICAgICAgICAgQ2xpcXpVdGlscy5sb2coXCJydW4gdGFzazogXCIrIHRhc2tfbmFtZSwgXCJwYWNlbWFrZXJcIik7XG4gICAgICAgICAgICAgIHRhc2suZm4obm93KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRhc2subGFzdCA9IG5vdztcbiAgICAgICAgICB9IGNhdGNoKGUpIHtcbiAgICAgICAgICAgIENsaXF6VXRpbHMubG9nKFwiRXJyb3IgZXhlY3V0aW5nIHRhc2sgXCIrIHRhc2tfbmFtZSArXCI6IFwiKyBlLCBcInBhY2VtYWtlclwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0sIDApO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgLyoqIFJlZ2lzdGVyIGEgZnVuY3Rpb24gdG8gYmUgcnVuIHBlcmlvZGljYWxseSBieSB0aGUgcGFjZW1ha2VyLlxuICAgICAgICBAcGFyYW0gZm4gZnVuY3Rpb24gdG8gY2FsbFxuICAgICAgICBAcGFyYW0gZnJlcXVlbmN5IG1pbmltdW0gaW50ZXJ2YWwgYmV0d2VlbiBjYWxscywgaW4gbXMuXG4gICAgICAgIEByZXR1cm5zIHRhc2sgb2JqZWN0LCB3aGljaCBjYW4gYmUgdXNlZCB3aXRoIGRlcmVnaXN0ZXIgdG8gc3RvcCB0aGlzIHRhc2suXG4gICAqL1xuICByZWdpc3RlcihmbiwgZnJlcXVlbmN5LCBjb25zdHJhaW50KSB7XG4gICAgaWYgKCFmbikge1xuICAgICAgdGhyb3cgXCJmbiBjYW5ub3QgYmUgdW5kZWZpbmVkXCI7XG4gICAgfVxuICAgIHZhciB0YXNrID0ge1xuICAgICAgZm46IGZuLFxuICAgICAgZnJlcTogZnJlcXVlbmN5IHx8IDAsXG4gICAgICBsYXN0OiAwLFxuICAgICAgd2hlbjogY29uc3RyYWludFxuICAgIH07XG4gICAgdGhpcy5fdGFza3MuYWRkKHRhc2spO1xuICAgIHJldHVybiB0YXNrO1xuICB9XG5cbiAgZGVyZWdpc3Rlcih0YXNrKSB7XG4gICAgdGhpcy5fdGFza3MuZGVsZXRlKHRhc2spO1xuICB9XG59XG5cbi8vIGV4cG9ydCBzaW5nbGV0b24gcGFjZW1ha2VyXG52YXIgcG0gPSBuZXcgUGFjZW1ha2VyKDMwMDAwLCAzMDAwMCk7XG5leHBvcnQgZGVmYXVsdCBwbTtcbiJdfQ==