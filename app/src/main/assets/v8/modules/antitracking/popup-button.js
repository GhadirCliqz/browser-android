System.register('antitracking/popup-button', ['core/cliqz'], function (_export) {
  'use strict';

  var utils;

  function CliqzPopupButton(options) {
    this.CustomizableUI = Components.utils['import']('resource:///modules/CustomizableUI.jsm', null).CustomizableUI;

    this.name = options.name;
    this.actions = options.actions;

    var tbb = this.tbb = {
      id: this.name + '-button',
      type: 'view',
      viewId: this.name + '-panel',
      label: this.name,
      tooltiptext: this.name,
      tabs: {/*tabId: {badge: 0, img: boolean}*/},
      init: null,
      codePath: ''
    };

    function populatePanel(doc, panel) {
      panel.setAttribute('id', tbb.viewId);

      var iframe = doc.createElement('iframe');
      iframe.setAttribute('type', 'content');
      iframe.setAttribute('src', 'chrome://cliqz/content/antitracking/popup.html');
      panel.appendChild(iframe);

      function toPx(pixels) {
        return pixels.toString() + 'px';
      }

      function onPopupReady() {
        if (!iframe || !iframe.contentDocument) {
          return;
        }

        var body = iframe.contentDocument.body;
        var clientHeight = body.scrollHeight;

        iframe.style.height = toPx(clientHeight);
        panel.style.height = toPx(clientHeight + panel.boxObject.height - panel.clientHeight);

        // triggered when popup is opened
        options.actions.telemetry({ action: 'click', target: 'popup', includeUnsafeCount: true });
      }
      iframe.addEventListener('load', onPopupReady, true);
    }

    tbb.codePath = 'australis';
    tbb.CustomizableUI = this.CustomizableUI;
    tbb.defaultArea = this.CustomizableUI.AREA_NAVBAR;

    var styleURI = null;

    tbb.onBeforeCreated = function (doc) {
      var panel = doc.createElement('panelview');

      populatePanel(doc, panel);

      doc.getElementById('PanelUI-multiView').appendChild(panel);

      doc.defaultView.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIDOMWindowUtils).loadSheet(styleURI, 1);
    };

    var style = ['#' + tbb.id + '.off {', 'list-style-image: url(', 'chrome://cliqz/content/static/skin/images/atrack/anti-tracking-off.svg', ');', '}', '#' + tbb.id + ' {', 'list-style-image: url(', 'chrome://cliqz/content/static/skin/images/atrack/anti-tracking-on.svg', ');', '}', '#' + tbb.viewId + ',', '#' + tbb.viewId + ' > iframe {', 'width: 400px;', 'overflow: hidden !important;', '}'];

    styleURI = Services.io.newURI('data:text/css,' + encodeURIComponent(style.join('')), null, null);

    tbb.closePopup = (function (tabBrowser) {
      this.CustomizableUI.hidePanelForNode(utils.getWindow().gBrowser.ownerDocument.getElementById(tbb.viewId));
    }).bind(this);
  }

  return {
    setters: [function (_coreCliqz) {
      utils = _coreCliqz.utils;
    }],
    execute: function () {
      _export('default', CliqzPopupButton);

      CliqzPopupButton.prototype.updateView = function (win, clientHeight) {
        var panel = win.document.getElementById(this.tbb.viewId);
        var iframe = panel.querySelector("iframe");

        function toPx(pixels) {
          return pixels.toString() + 'px';
        }

        function onPopupReady() {
          if (!iframe || !iframe.contentDocument) {
            return;
          }

          var body = iframe.contentDocument.body;

          iframe.style.height = toPx(clientHeight);
          panel.style.height = toPx(clientHeight + panel.boxObject.height - panel.clientHeight);
        }

        onPopupReady();
      };

      CliqzPopupButton.prototype.updateState = function (win, turnOn) {
        if (!win) return;

        var button = win.document.getElementById(this.tbb.id);

        if (turnOn) {
          button.classList.remove("off");
        } else {
          button.classList.add("off");
        }
      };

      CliqzPopupButton.prototype.setBadge = function (win, badgeText) {
        var button = win.document.getElementById(this.tbb.id);

        if (badgeText) {
          button.setAttribute('badge', String(badgeText));
        } else {
          button.setAttribute('badge', '');
        }

        if (!button.classList.contains('badged-button')) {
          button.classList.add('badged-button');
        }

        CliqzUtils.setTimeout(function () {
          var badge = button.ownerDocument.getAnonymousElementByAttribute(button, 'class', 'toolbarbutton-badge');

          // when window is too small to display all icons, the anti-tracking badge
          // may be hidden behind a '>>' button. In this case, badge will be null.
          if (badge) {
            badge.style.cssText = 'background-color: #666; color: #fff;';
          }
        }, 250);
      };

      CliqzPopupButton.prototype.attach = function () {
        this.CustomizableUI.createWidget(this.tbb);
        this.setupCommunicationChannel();
      };

      CliqzPopupButton.prototype.destroy = function () {
        this.CustomizableUI.destroyWidget(this.tbb.id);
      };

      CliqzPopupButton.prototype.setupCommunicationChannel = function () {
        Components.utils['import']('chrome://cliqzmodules/content/CliqzEvents.jsm');

        var channelName = this.name,
            actions = this.actions;

        function popupMessageHandler(msg) {
          var functionName = msg.message.functionName,
              functionArgs = msg.message.args,
              handler = actions[functionName];

          function callback(res) {
            CliqzEvents.pub(channelName + "-background", {
              id: msg.id,
              message: res
            });
          }

          if (!handler) {
            return;
          }

          handler(functionArgs, callback);
        }

        CliqzEvents.sub(channelName + "-popup", popupMessageHandler);
      };
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFudGl0cmFja2luZy9wb3B1cC1idXR0b24uZXMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7QUFLQSxXQUFTLGdCQUFnQixDQUFDLE9BQU8sRUFBRTtBQUNqQyxRQUFJLENBQUMsY0FBYyxHQUFHLFVBQVUsQ0FBQyxLQUFLLFVBQU8sQ0FBQyx3Q0FBd0MsRUFBRSxJQUFJLENBQUMsQ0FBQyxjQUFjLENBQUM7O0FBRTdHLFFBQUksQ0FBQyxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQztBQUN6QixRQUFJLENBQUMsT0FBTyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUM7O0FBRS9CLFFBQUksR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUc7QUFDbkIsUUFBRSxFQUFFLElBQUksQ0FBQyxJQUFJLEdBQUMsU0FBUztBQUN2QixVQUFJLEVBQUUsTUFBTTtBQUNaLFlBQU0sRUFBRSxJQUFJLENBQUMsSUFBSSxHQUFDLFFBQVE7QUFDMUIsV0FBSyxFQUFFLElBQUksQ0FBQyxJQUFJO0FBQ2hCLGlCQUFXLEVBQUUsSUFBSSxDQUFDLElBQUk7QUFDdEIsVUFBSSxFQUFFLHFDQUFxQztBQUMzQyxVQUFJLEVBQUUsSUFBSTtBQUNWLGNBQVEsRUFBRSxFQUFFO0tBQ2IsQ0FBQzs7QUFFRixhQUFTLGFBQWEsQ0FBQyxHQUFHLEVBQUUsS0FBSyxFQUFFO0FBQ2pDLFdBQUssQ0FBQyxZQUFZLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQzs7QUFFckMsVUFBSSxNQUFNLEdBQUcsR0FBRyxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUN6QyxZQUFNLENBQUMsWUFBWSxDQUFDLE1BQU0sRUFBRSxTQUFTLENBQUMsQ0FBQztBQUN2QyxZQUFNLENBQUMsWUFBWSxDQUFDLEtBQUssRUFBRSxnREFBZ0QsQ0FBQyxDQUFDO0FBQzdFLFdBQUssQ0FBQyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUM7O0FBRTFCLGVBQVMsSUFBSSxD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eUJBQXlCLEVBQUUsQ0FBQztPQUNsQyxDQUFDOztBQUVGLHNCQUFnQixDQUFDLFNBQVMsQ0FBQyxPQUFPLEdBQUcsWUFBWTtBQUMvQyxZQUFJLENBQUMsY0FBYyxDQUFDLGFBQWEsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxDQUFDO09BQ2hELENBQUM7O0FBRUYsc0JBQWdCLENBQUMsU0FBUyxDQUFDLHlCQUF5QixHQUFHLFlBQVk7QUFDakUsa0JBQVUsQ0FBQyxLQUFLLFVBQU8sQ0FBQywrQ0FBK0MsQ0FBQyxDQUFDOztBQUV6RSxZQUFJLFdBQVcsR0FBRyxJQUFJLENBQUMsSUFBSTtZQUN2QixPQUFPLEdBQUcsSUFBSSxDQUFDLE9BQU8sQ0FBQzs7QUFFM0IsaUJBQVMsbUJBQW1CLENBQUMsR0FBRyxFQUFFO0FBQ2hDLGNBQUksWUFBWSxHQUFHLEdBQUcsQ0FBQyxPQUFPLENBQUMsWUFBWTtjQUN2QyxZQUFZLEdBQUcsR0FBRyxDQUFDLE9BQU8sQ0FBQyxJQUFJO2NBQy9CLE9BQU8sR0FBRyxPQUFPLENBQUMsWUFBWSxDQUFDLENBQUM7O0FBRXBDLG1CQUFTLFFBQVEsQ0FBQyxHQUFHLEVBQUU7QUFDckIsdUJBQVcsQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFDLGFBQWEsRUFBRTtBQUN6QyxnQkFBRSxFQUFFLEdBQUcsQ0FBQyxFQUFFO0FBQ1YscUJBQU8sRUFBRSxHQUFHO2FBQ2IsQ0FBQyxDQUFDO1dBQ0o7O0FBRUQsY0FBSSxDQUFDLE9BQU8sRUFBRTtBQUFFLG1CQUFPO1dBQUU7O0FBRXpCLGlCQUFPLENBQUMsWUFBWSxFQUFFLFFBQVEsQ0FBQyxDQUFDO1NBQ2pDOztBQUVELG1CQUFXLENBQUMsR0FBRyxDQUFDLFdBQVcsR0FBQyxRQUFRLEVBQUUsbUJBQW1CLENBQUMsQ0FBQztPQUM1RCxDQUFDIiwiZmlsZSI6ImFudGl0cmFja2luZy9wb3B1cC1idXR0b24uZXMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyB1dGlscyB9IGZyb20gXCJjb3JlL2NsaXF6XCI7XG5cblxuZXhwb3J0IGRlZmF1bHQgQ2xpcXpQb3B1cEJ1dHRvbjtcblxuZnVuY3Rpb24gQ2xpcXpQb3B1cEJ1dHRvbihvcHRpb25zKSB7XG4gIHRoaXMuQ3VzdG9taXphYmxlVUkgPSBDb21wb25lbnRzLnV0aWxzLmltcG9ydCgncmVzb3VyY2U6Ly8vbW9kdWxlcy9DdXN0b21pemFibGVVSS5qc20nLCBudWxsKS5DdXN0b21pemFibGVVSTtcblxuICB0aGlzLm5hbWUgPSBvcHRpb25zLm5hbWU7XG4gIHRoaXMuYWN0aW9ucyA9IG9wdGlvbnMuYWN0aW9ucztcblxuICB2YXIgdGJiID0gdGhpcy50YmIgPSB7XG4gICAgaWQ6IHRoaXMubmFtZSsnLWJ1dHRvbicsXG4gICAgdHlwZTogJ3ZpZXcnLFxuICAgIHZpZXdJZDogdGhpcy5uYW1lKyctcGFuZWwnLFxuICAgIGxhYmVsOiB0aGlzLm5hbWUsXG4gICAgdG9vbHRpcHRleHQ6IHRoaXMubmFtZSxcbiAgICB0YWJzOiB7Lyp0YWJJZDoge2JhZGdlOiAwLCBpbWc6IGJvb2xlYW59Ki99LFxuICAgIGluaXQ6IG51bGwsXG4gICAgY29kZVBhdGg6ICcnXG4gIH07XG5cbiAgZnVuY3Rpb24gcG9wdWxhdGVQYW5lbChkb2MsIHBhbmVsKSB7XG4gICAgcGFuZWwuc2V0QXR0cmlidXRlKCdpZCcsIHRiYi52aWV3SWQpO1xuXG4gICAgdmFyIGlmcmFtZSA9IGRvYy5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCd0eXBlJywgJ2NvbnRlbnQnKTtcbiAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdzcmMnLCAnY2hyb21lOi8vY2xpcXovY29udGVudC9hbnRpdHJhY2tpbmcvcG9wdXAuaHRtbCcpO1xuICAgIHBhbmVsLmFwcGVuZENoaWxkKGlmcmFtZSk7XG5cbiAgICBmdW5jdGlvbiB0b1B4KHBpeGVscykge1xuICAgICAgcmV0dXJuIHBpeGVscy50b1N0cmluZygpICsgJ3B4JztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBvblBvcHVwUmVhZHkoKSB7XG4gICAgICBpZiAoIWlmcmFtZSB8fCAhaWZyYW1lLmNvbnRlbnREb2N1bWVudCkgeyByZXR1cm47IH1cblxuICAgICAgdmFyIGJvZHkgPSBpZnJhbWUuY29udGVudERvY3VtZW50LmJvZHk7XG4gICAgICB2YXIgY2xpZW50SGVpZ2h0ID0gYm9keS5zY3JvbGxIZWlnaHQ7XG5cbiAgICAgIGlmcmFtZS5zdHlsZS5oZWlnaHQgPSB0b1B4KGNsaWVudEhlaWdodCk7XG4gICAgICBwYW5lbC5zdHlsZS5oZWlnaHQgPSB0b1B4KGNsaWVudEhlaWdodCArIHBhbmVsLmJveE9iamVjdC5oZWlnaHQgLSBwYW5lbC5jbGllbnRIZWlnaHQgKTtcblxuICAgICAgLy8gdHJpZ2dlcmVkIHdoZW4gcG9wdXAgaXMgb3BlbmVkXG4gICAgICBvcHRpb25zLmFjdGlvbnMudGVsZW1ldHJ5KHsgYWN0aW9uOiAnY2xpY2snLCB0YXJnZXQ6ICdwb3B1cCcsIGluY2x1ZGVVbnNhZmVDb3VudDogdHJ1ZSB9KTtcbiAgICB9XG4gICAgaWZyYW1lLmFkZEV2ZW50TGlzdGVuZXIoJ2xvYWQnLCBvblBvcHVwUmVhZHksIHRydWUpO1xuICB9XG5cbiAgdGJiLmNvZGVQYXRoID0gJ2F1c3RyYWxpcyc7XG4gIHRiYi5DdXN0b21pemFibGVVSSA9IHRoaXMuQ3VzdG9taXphYmxlVUk7XG4gIHRiYi5kZWZhdWx0QXJlYSA9IHRoaXMuQ3VzdG9taXphYmxlVUkuQVJFQV9OQVZCQVI7XG5cbiAgdmFyIHN0eWxlVVJJID0gbnVsbDtcblxuICB0YmIub25CZWZvcmVDcmVhdGVkID0gZnVuY3Rpb24oZG9jKSB7XG4gICAgdmFyIHBhbmVsID0gZG9jLmNyZWF0ZUVsZW1lbnQoJ3BhbmVsdmlldycpO1xuXG4gICAgcG9wdWxhdGVQYW5lbChkb2MsIHBhbmVsKTtcblxuICAgIGRvYy5nZXRFbGVtZW50QnlJZCgnUGFuZWxVSS1tdWx0aVZpZXcnKS5hcHBlbmRDaGlsZChwYW5lbCk7XG5cbiAgICBkb2MuZGVmYXVsdFZpZXcuUXVlcnlJbnRlcmZhY2UoQ2kubnNJSW50ZXJmYWNlUmVxdWVzdG9yKVxuICAgICAgLmdldEludGVyZmFjZShDaS5uc0lET01XaW5kb3dVdGlscylcbiAgICAgIC5sb2FkU2hlZXQoc3R5bGVVUkksIDEpO1xuICB9O1xuXG4gIHZhciBzdHlsZSA9IFtcbiAgICAnIycgKyB0YmIuaWQgKyAnLm9mZiB7JyxcbiAgICAgICdsaXN0LXN0eWxlLWltYWdlOiB1cmwoJyxcbiAgICAgICAgJ2Nocm9tZTovL2NsaXF6L2NvbnRlbnQvc3RhdGljL3NraW4vaW1hZ2VzL2F0cmFjay9hbnRpLXRyYWNraW5nLW9mZi5zdmcnLFxuICAgICAgJyk7JyxcbiAgICAnfScsXG4gICAgJyMnICsgdGJiLmlkICsgJyB7JyxcbiAgICAgICdsaXN0LXN0eWxlLWltYWdlOiB1cmwoJyxcbiAgICAgICAgJ2Nocm9tZTovL2NsaXF6L2NvbnRlbnQvc3RhdGljL3NraW4vaW1hZ2VzL2F0cmFjay9hbnRpLXRyYWNraW5nLW9uLnN2ZycsXG4gICAgICAnKTsnLFxuICAgICd9JyxcbiAgICAnIycgKyB0YmIudmlld0lkICsgJywnLFxuICAgICcjJyArIHRiYi52aWV3SWQgKyAnID4gaWZyYW1lIHsnLFxuICAgICAgJ3dpZHRoOiA0MDBweDsnLFxuICAgICAgJ292ZXJmbG93OiBoaWRkZW4gIWltcG9ydGFudDsnLFxuICAgICd9J1xuICBdO1xuXG4gIHN0eWxlVVJJID0gU2VydmljZXMuaW8ubmV3VVJJKFxuICAgICAgJ2RhdGE6dGV4dC9jc3MsJyArIGVuY29kZVVSSUNvbXBvbmVudChzdHlsZS5qb2luKCcnKSksXG4gICAgICBudWxsLFxuICAgICAgbnVsbFxuICApO1xuXG4gIHRiYi5jbG9zZVBvcHVwID0gZnVuY3Rpb24gKHRhYkJyb3dzZXIpIHtcbiAgICB0aGlzLkN1c3RvbWl6YWJsZVVJLmhpZGVQYW5lbEZvck5vZGUoXG4gICAgICAgIHV0aWxzLmdldFdpbmRvdygpLmdCcm93c2VyLm93bmVyRG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGJiLnZpZXdJZClcbiAgICApO1xuICB9LmJpbmQodGhpcyk7XG59XG5cbkNsaXF6UG9wdXBCdXR0b24ucHJvdG90eXBlLnVwZGF0ZVZpZXcgPSBmdW5jdGlvbiAod2luLCBjbGllbnRIZWlnaHQpIHtcbiAgdmFyIHBhbmVsID0gd2luLmRvY3VtZW50LmdldEVsZW1lbnRCeUlkKHRoaXMudGJiLnZpZXdJZCk7XG4gIHZhciBpZnJhbWUgPSBwYW5lbC5xdWVyeVNlbGVjdG9yKFwiaWZyYW1lXCIpO1xuXG4gICAgZnVuY3Rpb24gdG9QeChwaXhlbHMpIHtcbiAgICAgIHJldHVybiBwaXhlbHMudG9TdHJpbmcoKSArICdweCc7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gb25Qb3B1cFJlYWR5KCkge1xuICAgICAgaWYgKCFpZnJhbWUgfHwgIWlmcmFtZS5jb250ZW50RG9jdW1lbnQpIHsgcmV0dXJuOyB9XG5cbiAgICAgIHZhciBib2R5ID0gaWZyYW1lLmNvbnRlbnREb2N1bWVudC5ib2R5O1xuXG4gICAgICBpZnJhbWUuc3R5bGUuaGVpZ2h0ID0gdG9QeChjbGllbnRIZWlnaHQpO1xuICAgICAgcGFuZWwuc3R5bGUuaGVpZ2h0ID0gdG9QeChjbGllbnRIZWlnaHQgKyBwYW5lbC5ib3hPYmplY3QuaGVpZ2h0IC0gcGFuZWwuY2xpZW50SGVpZ2h0ICk7XG4gICAgfVxuXG4gIG9uUG9wdXBSZWFkeSgpO1xufVxuXG5DbGlxelBvcHVwQnV0dG9uLnByb3RvdHlwZS51cGRhdGVTdGF0ZSA9IGZ1bmN0aW9uICh3aW4sIHR1cm5Pbikge1xuICBpZighd2luKSByZXR1cm47XG5cbiAgdmFyIGJ1dHRvbiA9IHdpbi5kb2N1bWVudC5nZXRFbGVtZW50QnlJZCh0aGlzLnRiYi5pZCk7XG5cbiAgaWYgKHR1cm5Pbikge1xuICAgIGJ1dHRvbi5jbGFzc0xpc3QucmVtb3ZlKFwib2ZmXCIpO1xuICB9IGVsc2Uge1xuICAgIGJ1dHRvbi5jbGFzc0xpc3QuYWRkKFwib2ZmXCIpO1xuICB9XG59XG5cbkNsaXF6UG9wdXBCdXR0b24ucHJvdG90eXBlLnNldEJhZGdlID0gZnVuY3Rpb24gKHdpbiwgYmFkZ2VUZXh0KSB7XG4gIHZhciBidXR0b24gPSB3aW4uZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQodGhpcy50YmIuaWQpO1xuXG4gIGlmICggYmFkZ2VUZXh0ICkge1xuICAgIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2JhZGdlJywgU3RyaW5nKGJhZGdlVGV4dCkpO1xuICB9IGVsc2Uge1xuICAgIGJ1dHRvbi5zZXRBdHRyaWJ1dGUoJ2JhZGdlJywgJycpO1xuICB9XG5cblxuICBpZiAoICFidXR0b24uY2xhc3NMaXN0LmNvbnRhaW5zKCdiYWRnZWQtYnV0dG9uJykgKSB7XG4gICAgYnV0dG9uLmNsYXNzTGlzdC5hZGQoJ2JhZGdlZC1idXR0b24nKTtcbiAgfVxuXG4gIENsaXF6VXRpbHMuc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgdmFyIGJhZGdlID0gYnV0dG9uLm93bmVyRG9jdW1lbnQuZ2V0QW5vbnltb3VzRWxlbWVudEJ5QXR0cmlidXRlKFxuICAgICAgYnV0dG9uLFxuICAgICAgJ2NsYXNzJyxcbiAgICAgICd0b29sYmFyYnV0dG9uLWJhZGdlJ1xuICAgICk7XG5cbiAgICAvLyB3aGVuIHdpbmRvdyBpcyB0b28gc21hbGwgdG8gZGlzcGxheSBhbGwgaWNvbnMsIHRoZSBhbnRpLXRyYWNraW5nIGJhZGdlXG4gICAgLy8gbWF5IGJlIGhpZGRlbiBiZWhpbmQgYSAnPj4nIGJ1dHRvbi4gSW4gdGhpcyBjYXNlLCBiYWRnZSB3aWxsIGJlIG51bGwuXG4gICAgaWYoYmFkZ2UpIHtcbiAgICAgIGJhZGdlLnN0eWxlLmNzc1RleHQgPSAnYmFja2dyb3VuZC1jb2xvcjogIzY2NjsgY29sb3I6ICNmZmY7JztcbiAgICB9XG4gIH0sIDI1MCk7XG59O1xuXG5DbGlxelBvcHVwQnV0dG9uLnByb3RvdHlwZS5hdHRhY2ggPSBmdW5jdGlvbiAoKSB7XG4gIHRoaXMuQ3VzdG9taXphYmxlVUkuY3JlYXRlV2lkZ2V0KHRoaXMudGJiKTtcbiAgdGhpcy5zZXR1cENvbW11bmljYXRpb25DaGFubmVsKCk7XG59O1xuXG5DbGlxelBvcHVwQnV0dG9uLnByb3RvdHlwZS5kZXN0cm95ID0gZnVuY3Rpb24gKCkge1xuICB0aGlzLkN1c3RvbWl6YWJsZVVJLmRlc3Ryb3lXaWRnZXQodGhpcy50YmIuaWQpO1xufTtcblxuQ2xpcXpQb3B1cEJ1dHRvbi5wcm90b3R5cGUuc2V0dXBDb21tdW5pY2F0aW9uQ2hhbm5lbCA9IGZ1bmN0aW9uICgpIHtcbiAgQ29tcG9uZW50cy51dGlscy5pbXBvcnQoJ2Nocm9tZTovL2NsaXF6bW9kdWxlcy9jb250ZW50L0NsaXF6RXZlbnRzLmpzbScpO1xuXG4gIHZhciBjaGFubmVsTmFtZSA9IHRoaXMubmFtZSxcbiAgICAgIGFjdGlvbnMgPSB0aGlzLmFjdGlvbnM7XG5cbiAgZnVuY3Rpb24gcG9wdXBNZXNzYWdlSGFuZGxlcihtc2cpIHtcbiAgICB2YXIgZnVuY3Rpb25OYW1lID0gbXNnLm1lc3NhZ2UuZnVuY3Rpb25OYW1lLFxuICAgICAgICBmdW5jdGlvbkFyZ3MgPSBtc2cubWVzc2FnZS5hcmdzLFxuICAgICAgICBoYW5kbGVyID0gYWN0aW9uc1tmdW5jdGlvbk5hbWVdO1xuXG4gICAgZnVuY3Rpb24gY2FsbGJhY2socmVzKSB7XG4gICAgICBDbGlxekV2ZW50cy5wdWIoY2hhbm5lbE5hbWUrXCItYmFja2dyb3VuZFwiLCB7XG4gICAgICAgIGlkOiBtc2cuaWQsXG4gICAgICAgIG1lc3NhZ2U6IHJlc1xuICAgICAgfSk7XG4gICAgfVxuXG4gICAgaWYgKCFoYW5kbGVyKSB7IHJldHVybjsgfVxuXG4gICAgaGFuZGxlcihmdW5jdGlvbkFyZ3MsIGNhbGxiYWNrKTtcbiAgfVxuXG4gIENsaXF6RXZlbnRzLnN1YihjaGFubmVsTmFtZStcIi1wb3B1cFwiLCBwb3B1cE1lc3NhZ2VIYW5kbGVyKTtcbn07XG4iXX0=