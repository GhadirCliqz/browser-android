System.register([], function (_export) {
  "use strict";

  return {
    setters: [],
    execute: function () {
      _export("default", {

        getItem: function getItem(id) {
          return new Promise(function (resolve, reject) {
            readFile(id, function (data) {
              resolve(data);
            });
          });
        },

        setItem: function setItem(id, value) {
          writeFile(id, value);
        },

        removeItem: function removeItem(id) {
          writeFile(id, "");
        },

        clear: function clear() {}
      });
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInN0b3JhZ2UuZXMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7O3lCQUVlOztBQUViLGVBQU8sRUFBQSxpQkFBQyxFQUFFLEVBQUU7QUFDVixpQkFBTyxJQUFJLE9BQU8sQ0FBRSxVQUFDLE9BQU8sRUFBRSxNQUFNLEVBQUs7QUFDdkMsb0JBQVEsQ0FBQyxFQUFFLEVBQUUsVUFBQyxJQUFJLEVBQUs7QUFDckIscUJBQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNmLENBQUMsQ0FBQztXQUNKLENBQUMsQ0FBQztTQUNKOztBQUVELGVBQU8sRUFBQSxpQkFBQyxFQUFFLEVBQUUsS0FBSyxFQUFFO0FBQ2pCLG1CQUFTLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQ3RCOztBQUVELGtCQUFVLEVBQUEsb0JBQUMsRUFBRSxFQUFFO0FBQ2IsbUJBQVMsQ0FBQyxFQUFFLEVBQUUsRUFBRSxDQUFDLENBQUM7U0FDbkI7O0FBRUQsYUFBSyxFQUFBLGlCQUFHLEVBQ1A7T0FDRiIsImZpbGUiOiJzdG9yYWdlLmVzIiwic291cmNlUm9vdCI6InBsYXRmb3JtIiwic291cmNlc0NvbnRlbnQiOlsiXG5cbmV4cG9ydCBkZWZhdWx0IHtcblxuICBnZXRJdGVtKGlkKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKCAocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICByZWFkRmlsZShpZCwgKGRhdGEpID0+IHtcbiAgICAgICAgcmVzb2x2ZShkYXRhKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9LFxuXG4gIHNldEl0ZW0oaWQsIHZhbHVlKSB7XG4gICAgd3JpdGVGaWxlKGlkLCB2YWx1ZSk7XG4gIH0sXG5cbiAgcmVtb3ZlSXRlbShpZCkge1xuICAgIHdyaXRlRmlsZShpZCwgXCJcIik7XG4gIH0sXG5cbiAgY2xlYXIoKSB7XG4gIH1cbn07XG4iXX0=