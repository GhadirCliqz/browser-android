System.register('adblocker/filters-matching', [], function (_export) {
  // Some content policy types used in filters
  'use strict';

  var CPT;

  var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i['return']) _i['return'](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError('Invalid attempt to destructure non-iterable instance'); } }; })();

  _export('default', match);

  function checkContentPolicy(filter, cpt) {
    // Check content policy type only if at least one content policy has
    // been specified in the options.
    if (!filter.fromAny) {
      var options = [[filter.fromSubdocument, CPT.TYPE_SUBDOCUMENT], [filter.fromImage, CPT.TYPE_IMAGE], [filter.fromMedia, CPT.TYPE_MEDIA], [filter.fromObject, CPT.TYPE_OBJECT], [filter.fromObjectSubrequest, CPT.TYPE_OBJECT_SUBREQUEST], [filter.fromOther, CPT.TYPE_OTHER], [filter.fromPing, CPT.TYPE_PING], [filter.fromScript, CPT.TYPE_SCRIPT], [filter.fromStylesheet, CPT.TYPE_STYLESHEET], [filter.fromXmlHttpRequest, CPT.TYPE_XMLHTTPREQUEST]];

      // If content policy type `option` is specified in filter filter,
      // then the policy type of the request must match.
      // - If more than one policy type is valid, we must find at least one
      // - If we found a blacklisted policy type we can return `false`
      var foundValidCP = null;
      for (var i = 0; i < options.length; i++) {
        var _options$i = _slicedToArray(options[i], 2);

        var option = _options$i[0];
        var policyType = _options$i[1];

        // Found a fromX matching the origin policy of the request
        if (option === true) {
          if (cpt === policyType) {
            foundValidCP = true;
            break;
          } else {
            foundValidCP = false;
          }
        }

        // This rule can't be used with filter policy type
        if (option === false && cpt === policyType) {
          return false;
        }
      }

      // Couldn't find any policy origin matching the request
      if (foundValidCP === false) {
        return false;
      }
    }

    return true;
  }

  function checkOptions(filter, request) {
    // Source
    var sHost = request.sourceHostname;
    var sHostGD = request.sourceGD;

    // Url endpoint
    var hostGD = request.hostGD;

    // Check option $third-party
    // source domain and requested domain must be different
    if ((filter.firstParty === false || filter.thirdParty === true) && sHostGD === hostGD) {
      return false;
    }

    // $~third-party
    // source domain and requested domain must be the same
    if ((filter.firstParty === true || filter.thirdParty === false) && sHostGD !== hostGD) {
      return false;
    }

    // URL must be among these domains to match
    if (filter.optDomains !== null && !(filter.optDomains.has(sHostGD) || filter.optDomains.has(sHost))) {
      return false;
    }

    // URL must not be among these domains to match
    if (filter.optNotDomains !== null && (filter.optNotDomains.has(sHostGD) || filter.optNotDomains.has(sHost))) {
      return false;
    }

    if (!checkContentPolicy(filter, request.cpt)) {
      return false;
    }

    return true;
  }

  function checkPattern(filter, request) {
    var url = request.url;
    var host = request.hostname;

    // Try to match url with pattern
    if (filter.isHostnameAnchor) {
      var matchIndex = host.indexOf(filter.hostname);
      // Either start at beginning of hostname or be preceded by a '.'
      if (matchIndex > 0 && host[matchIndex - 1] === '.' || matchIndex === 0) {
        // Extract only the part after the hostname
        var urlPattern = url.substring(url.indexOf(filter.hostname) + filter.hostname.length);
        if (filter.isRegex) {
          return filter.regex.test(urlPattern);
        }
        // TODO: Should startWith instead of includes?
        return urlPattern.startsWith(filter.filterStr);
      }
    } else {
      if (filter.isRegex) {
        return filter.regex.test(url);
      } else if (filter.isLeftAnchor) {
        return url.startsWith(filter.filterStr);
      } else if (filter.isRightAnchor) {
        return url.endsWith(filter.filterStr);
      }

      return url.includes(filter.filterStr);
    }

    return false;
  }

  function match(filter, request) {
    if (filter.supported) {
      if (!checkOptions(filter, request)) {
        return false;
      }

      return checkPattern(filter, request);
    }

    return false;
  }

  return {
    setters: [],
    execute: function () {
      CPT = {
        TYPE_OTHER: 1,
        TYPE_SCRIPT: 2,
        TYPE_IMAGE: 3,
        TYPE_STYLESHEET: 4,
        TYPE_OBJECT: 5,
        TYPE_SUBDOCUMENT: 7,
        TYPE_PING: 10,
        TYPE_XMLHTTPREQUEST: 11,
        TYPE_OBJECT_SUBREQUEST: 12,
        TYPE_MEDIA: 15
      };
    }
  };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFkYmxvY2tlci9maWx0ZXJzLW1hdGNoaW5nLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7TUFDTSxHQUFHOzs7O3FCQTRJZSxLQUFLOztBQTlIN0IsV0FBUyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsR0FBRyxFQUFFOzs7QUFHdkMsUUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEVBQUU7QUFDbkIsVUFBTSxPQUFPLEdBQUcsQ0FDZCxDQUFDLE1BQU0sQ0FBQyxlQUFlLEVBQUUsR0FBRyxDQUFDLGdCQUFnQixDQUFDLEVBQzlDLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQ2xDLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLEVBQ2xDLENBQUMsTUFBTSxDQUFDLFVBQVUsRUFBRSxHQUFHLENBQUMsV0FBVyxDQUFDLEVBQ3BDLENBQUMsTUFBTSxDQUFDLG9CQUFvQixFQUFFLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxFQUN6RCxDQUFDLE1BQU0sQ0FBQyxTQUFTLEVBQUUsR0FBRyxDQUFDLFVBQVUsQ0FBQyxFQUNsQyxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLFNBQVMsQ0FBQyxFQUNoQyxDQUFDLE1BQU0sQ0FBQyxVQUFVLEVBQUUsR0FBRyxDQUFDLFdBQVcsQ0FBQyxFQUNwQyxDQUFDLE1BQU0sQ0FBQyxjQUFjLEVBQUUsR0FBRyxDQUFDLGVBQWUsQ0FBQyxFQUM1QyxDQUFDLE1BQU0sQ0FBQyxrQkFBa0IsRUFBRSxHQUFHLENBQUMsbUJBQW1CLENBQUMsQ0FDckQsQ0FBQzs7Ozs7O0FBTUYsVUFBSSxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQ3hCLFdBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO3dDQUNWLE9BQU8sQ0FBQyxDQUFDLENBQUM7O1lBQWhDLE1BQU07WUFB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cyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFNvbWUgY29udGVudCBwb2xpY3kgdHlwZXMgdXNlZCBpbiBmaWx0ZXJzXG5jb25zdCBDUFQgPSB7XG4gIFRZUEVfT1RIRVI6IDEsXG4gIFRZUEVfU0NSSVBUOiAyLFxuICBUWVBFX0lNQUdFOiAzLFxuICBUWVBFX1NUWUxFU0hFRVQ6IDQsXG4gIFRZUEVfT0JKRUNUOiA1LFxuICBUWVBFX1NVQkRPQ1VNRU5UOiA3LFxuICBUWVBFX1BJTkc6IDEwLFxuICBUWVBFX1hNTEhUVFBSRVFVRVNUOiAxMSxcbiAgVFlQRV9PQkpFQ1RfU1VCUkVRVUVTVDogMTIsXG4gIFRZUEVfTUVESUE6IDE1LFxufTtcblxuXG5mdW5jdGlvbiBjaGVja0NvbnRlbnRQb2xpY3koZmlsdGVyLCBjcHQpIHtcbiAgLy8gQ2hlY2sgY29udGVudCBwb2xpY3kgdHlwZSBvbmx5IGlmIGF0IGxlYXN0IG9uZSBjb250ZW50IHBvbGljeSBoYXNcbiAgLy8gYmVlbiBzcGVjaWZpZWQgaW4gdGhlIG9wdGlvbnMuXG4gIGlmICghZmlsdGVyLmZyb21BbnkpIHtcbiAgICBjb25zdCBvcHRpb25zID0gW1xuICAgICAgW2ZpbHRlci5mcm9tU3ViZG9jdW1lbnQsIENQVC5UWVBFX1NVQkRPQ1VNRU5UXSxcbiAgICAgIFtmaWx0ZXIuZnJvbUltYWdlLCBDUFQuVFlQRV9JTUFHRV0sXG4gICAgICBbZmlsdGVyLmZyb21NZWRpYSwgQ1BULlRZUEVfTUVESUFdLFxuICAgICAgW2ZpbHRlci5mcm9tT2JqZWN0LCBDUFQuVFlQRV9PQkpFQ1RdLFxuICAgICAgW2ZpbHRlci5mcm9tT2JqZWN0U3VicmVxdWVzdCwgQ1BULlRZUEVfT0JKRUNUX1NVQlJFUVVFU1RdLFxuICAgICAgW2ZpbHRlci5mcm9tT3RoZXIsIENQVC5UWVBFX09USEVSXSxcbiAgICAgIFtmaWx0ZXIuZnJvbVBpbmcsIENQVC5UWVBFX1BJTkddLFxuICAgICAgW2ZpbHRlci5mcm9tU2NyaXB0LCBDUFQuVFlQRV9TQ1JJUFRdLFxuICAgICAgW2ZpbHRlci5mcm9tU3R5bGVzaGVldCwgQ1BULlRZUEVfU1RZTEVTSEVFVF0sXG4gICAgICBbZmlsdGVyLmZyb21YbWxIdHRwUmVxdWVzdCwgQ1BULlRZUEVfWE1MSFRUUFJFUVVFU1RdLFxuICAgIF07XG5cbiAgICAvLyBJZiBjb250ZW50IHBvbGljeSB0eXBlIGBvcHRpb25gIGlzIHNwZWNpZmllZCBpbiBmaWx0ZXIgZmlsdGVyLFxuICAgIC8vIHRoZW4gdGhlIHBvbGljeSB0eXBlIG9mIHRoZSByZXF1ZXN0IG11c3QgbWF0Y2guXG4gICAgLy8gLSBJZiBtb3JlIHRoYW4gb25lIHBvbGljeSB0eXBlIGlzIHZhbGlkLCB3ZSBtdXN0IGZpbmQgYXQgbGVhc3Qgb25lXG4gICAgLy8gLSBJZiB3ZSBmb3VuZCBhIGJsYWNrbGlzdGVkIHBvbGljeSB0eXBlIHdlIGNhbiByZXR1cm4gYGZhbHNlYFxuICAgIGxldCBmb3VuZFZhbGlkQ1AgPSBudWxsO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgb3B0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgW29wdGlvbiwgcG9saWN5VHlwZV0gPSBvcHRpb25zW2ldO1xuXG4gICAgICAvLyBGb3VuZCBhIGZyb21YIG1hdGNoaW5nIHRoZSBvcmlnaW4gcG9saWN5IG9mIHRoZSByZXF1ZXN0XG4gICAgICBpZiAob3B0aW9uID09PSB0cnVlKSB7XG4gICAgICAgIGlmIChjcHQgPT09IHBvbGljeVR5cGUpIHtcbiAgICAgICAgICBmb3VuZFZhbGlkQ1AgPSB0cnVlO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGZvdW5kVmFsaWRDUCA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFRoaXMgcnVsZSBjYW4ndCBiZSB1c2VkIHdpdGggZmlsdGVyIHBvbGljeSB0eXBlXG4gICAgICBpZiAob3B0aW9uID09PSBmYWxzZSAmJiBjcHQgPT09IHBvbGljeVR5cGUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENvdWxkbid0IGZpbmQgYW55IHBvbGljeSBvcmlnaW4gbWF0Y2hpbmcgdGhlIHJlcXVlc3RcbiAgICBpZiAoZm91bmRWYWxpZENQID09PSBmYWxzZSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5cbmZ1bmN0aW9uIGNoZWNrT3B0aW9ucyhmaWx0ZXIsIHJlcXVlc3QpIHtcbiAgLy8gU291cmNlXG4gIGNvbnN0IHNIb3N0ID0gcmVxdWVzdC5zb3VyY2VIb3N0bmFtZTtcbiAgY29uc3Qgc0hvc3RHRCA9IHJlcXVlc3Quc291cmNlR0Q7XG5cbiAgLy8gVXJsIGVuZHBvaW50XG4gIGNvbnN0IGhvc3RHRCA9IHJlcXVlc3QuaG9zdEdEO1xuXG4gIC8vIENoZWNrIG9wdGlvbiAkdGhpcmQtcGFydHlcbiAgLy8gc291cmNlIGRvbWFpbiBhbmQgcmVxdWVzdGVkIGRvbWFpbiBtdXN0IGJlIGRpZmZlcmVudFxuICBpZiAoKGZpbHRlci5maXJzdFBhcnR5ID09PSBmYWxzZSB8fCBmaWx0ZXIudGhpcmRQYXJ0eSA9PT0gdHJ1ZSkgJiYgc0hvc3RHRCA9PT0gaG9zdEdEKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgLy8gJH50aGlyZC1wYXJ0eVxuICAvLyBzb3VyY2UgZG9tYWluIGFuZCByZXF1ZXN0ZWQgZG9tYWluIG11c3QgYmUgdGhlIHNhbWVcbiAgaWYgKChmaWx0ZXIuZmlyc3RQYXJ0eSA9PT0gdHJ1ZSB8fCBmaWx0ZXIudGhpcmRQYXJ0eSA9PT0gZmFsc2UpICYmIHNIb3N0R0QgIT09IGhvc3RHRCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIC8vIFVSTCBtdXN0IGJlIGFtb25nIHRoZXNlIGRvbWFpbnMgdG8gbWF0Y2hcbiAgaWYgKGZpbHRlci5vcHREb21haW5zICE9PSBudWxsICYmXG4gICAgICEoZmlsdGVyLm9wdERvbWFpbnMuaGFzKHNIb3N0R0QpIHx8XG4gICAgICAgZmlsdGVyLm9wdERvbWFpbnMuaGFzKHNIb3N0KSkpIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICAvLyBVUkwgbXVzdCBub3QgYmUgYW1vbmcgdGhlc2UgZG9tYWlucyB0byBtYXRjaFxuICBpZiAoZmlsdGVyLm9wdE5vdERvbWFpbnMgIT09IG51bGwgJiZcbiAgICAgIChmaWx0ZXIub3B0Tm90RG9tYWlucy5oYXMoc0hvc3RHRCkgfHxcbiAgICAgICBmaWx0ZXIub3B0Tm90RG9tYWlucy5oYXMoc0hvc3QpKSkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfVxuXG4gIGlmICghY2hlY2tDb250ZW50UG9saWN5KGZpbHRlciwgcmVxdWVzdC5jcHQpKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cblxuZnVuY3Rpb24gY2hlY2tQYXR0ZXJuKGZpbHRlciwgcmVxdWVzdCkge1xuICBjb25zdCB1cmwgPSByZXF1ZXN0LnVybDtcbiAgY29uc3QgaG9zdCA9IHJlcXVlc3QuaG9zdG5hbWU7XG5cbiAgLy8gVHJ5IHRvIG1hdGNoIHVybCB3aXRoIHBhdHRlcm5cbiAgaWYgKGZpbHRlci5pc0hvc3RuYW1lQW5jaG9yKSB7XG4gICAgY29uc3QgbWF0Y2hJbmRleCA9IGhvc3QuaW5kZXhPZihmaWx0ZXIuaG9zdG5hbWUpO1xuICAgIC8vIEVpdGhlciBzdGFydCBhdCBiZWdpbm5pbmcgb2YgaG9zdG5hbWUgb3IgYmUgcHJlY2VkZWQgYnkgYSAnLidcbiAgICBpZiAoKG1hdGNoSW5kZXggPiAwICYmIGhvc3RbbWF0Y2hJbmRleCAtIDFdID09PSAnLicpIHx8IG1hdGNoSW5kZXggPT09IDApIHtcbiAgICAgIC8vIEV4dHJhY3Qgb25seSB0aGUgcGFydCBhZnRlciB0aGUgaG9zdG5hbWVcbiAgICAgIGNvbnN0IHVybFBhdHRlcm4gPSB1cmwuc3Vic3RyaW5nKHVybC5pbmRleE9mKGZpbHRlci5ob3N0bmFtZSkgKyBmaWx0ZXIuaG9zdG5hbWUubGVuZ3RoKTtcbiAgICAgIGlmIChmaWx0ZXIuaXNSZWdleCkge1xuICAgICAgICByZXR1cm4gZmlsdGVyLnJlZ2V4LnRlc3QodXJsUGF0dGVybik7XG4gICAgICB9XG4gICAgICAvLyBUT0RPOiBTaG91bGQgc3RhcnRXaXRoIGluc3RlYWQgb2YgaW5jbHVkZXM/XG4gICAgICByZXR1cm4gdXJsUGF0dGVybi5zdGFydHNXaXRoKGZpbHRlci5maWx0ZXJTdHIpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoZmlsdGVyLmlzUmVnZXgpIHtcbiAgICAgIHJldHVybiBmaWx0ZXIucmVnZXgudGVzdCh1cmwpO1xuICAgIH0gZWxzZSBpZiAoZmlsdGVyLmlzTGVmdEFuY2hvcikge1xuICAgICAgcmV0dXJuIHVybC5zdGFydHNXaXRoKGZpbHRlci5maWx0ZXJTdHIpO1xuICAgIH0gZWxzZSBpZiAoZmlsdGVyLmlzUmlnaHRBbmNob3IpIHtcbiAgICAgIHJldHVybiB1cmwuZW5kc1dpdGgoZmlsdGVyLmZpbHRlclN0cik7XG4gICAgfVxuXG4gICAgcmV0dXJuIHVybC5pbmNsdWRlcyhmaWx0ZXIuZmlsdGVyU3RyKTtcbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuXG5leHBvcnQgZGVmYXVsdCBmdW5jdGlvbiBtYXRjaChmaWx0ZXIsIHJlcXVlc3QpIHtcbiAgaWYgKGZpbHRlci5zdXBwb3J0ZWQpIHtcbiAgICBpZiAoIWNoZWNrT3B0aW9ucyhmaWx0ZXIsIHJlcXVlc3QpKSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuXG4gICAgcmV0dXJuIGNoZWNrUGF0dGVybihmaWx0ZXIsIHJlcXVlc3QpO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuIl19