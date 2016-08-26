System.register("core/templates", ["core/utils", "core/platform"], function (_export) {
    /*
        handlebars wrapper which adds all the needed helpers
    */

    "use strict";

    var CliqzUtils, isFirefox, CliqzHandlebars, TEMPLATES, MESSAGE_TEMPLATES, PARTIALS, AGO_CEILINGS, ZERO_CLICK_INFO_PRIO;

    function compileTemplates() {
        Object.keys(TEMPLATES).forEach(fetchTemplate);
        MESSAGE_TEMPLATES.forEach(fetchTemplate);
        PARTIALS.forEach(function (tName) {
            fetchTemplate(tName, true);
        });
    }

    function fetchTemplate(tName, isPartial) {
        try {
            CliqzUtils.httpGet(CliqzUtils.TEMPLATES_PATH + tName + '.tpl', function (res) {
                if (isPartial === true) {
                    Handlebars.registerPartial(tName, res.response);
                    CliqzHandlebars.tplCache[tName] = Handlebars.compile(res.response);
                } else CliqzHandlebars.tplCache[tName] = Handlebars.compile(res.response);
            });
        } catch (e) {
            CliqzUtils.log('ERROR loading template ' + tName);
        }
    }

    function registerHelpers() {
        Handlebars.registerHelper('partial', function (name, options) {
            var template = CliqzHandlebars.tplCache[name] || CliqzHandlebars.tplCache["partials/" + name] || CliqzHandlebars.tplCache.empty;
            return new Handlebars.SafeString(template(this));
        });

        Handlebars.registerHelper('get_array_element', function (arr, idx, subelement) {
            if (typeof subelement == undefined) return arr && arr[idx];else return arr && arr[idx] && arr[idx][subelement];
        });

        Handlebars.registerHelper('agoline', function (ts, options) {
            if (!ts) return '';
            var now = new Date().getTime() / 1000,
                seconds = parseInt(now - ts),
                i = 0,
                slot;

            while (slot = AGO_CEILINGS[i++]) if (seconds < slot[0]) return CliqzUtils.getLocalizedString(slot[1], parseInt(seconds / slot[2]));
            return '';
        });

        Handlebars.registerHelper('sec_to_duration', function (seconds) {
            if (!seconds) return null;
            try {
                var s = parseInt(seconds);
                return Math.floor(s / 60) + ':' + ("0" + s % 60).slice(-2);
            } catch (e) {
                return null;
            }
        });

        Handlebars.registerHelper('distance', function (meters) {
            if (meters < 1000) {
                return meters.toFixed(0) + " m";
            }
            return (meters / 1000).toFixed(1) + " km";
        });

        Handlebars.registerHelper('shopping_stars_width', function (rating) {
            return rating * 14;
        });

        Handlebars.registerHelper('even', function (value, options) {
            if (value % 2) {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        });

        Handlebars.registerHelper('local', function (key) {
            var args = Array.prototype.slice.call(arguments);
            var name = args.shift();
            return CliqzUtils.getLocalizedString.apply(null, [name, args]);
        });

        Handlebars.registerHelper('views_helper', function (val) {
            if (!val || val == '-1') return '';

            try {
                return parseFloat(val).toLocaleString() + ' ' + CliqzUtils.getLocalizedString('views');
            } catch (e) {
                return '';
            }
        });

        Handlebars.registerHelper('wikiEZ_height', function (data_richData) {
            if (data_richData && data_richData.hasOwnProperty('images') && data_richData.images.length > 0) {
                if (this.type === 'cliqz-extra' || this.data === CliqzUtils.autocomplete.lastResult._results[0].data) // is the first result in the show list
                    return 'cqz-result-h2';
                // BM hq result, but not the 1st result -> remove images
                data_richData.images = [];
            }

            return 'cqz-result-h3';
        });

        Handlebars.registerHelper('recipe_rd_template', function (data_richData) {
            var minimalData = data_richData && typeof data_richData["cook_time"] !== "undefined" && typeof data_richData["numportion"] !== "undefined" && typeof data_richData["total_review"] !== "undefined";

            // is the only result in the show list
            return CliqzUtils.autocomplete.lastResult._results.length === 1 && minimalData;
        });

        Handlebars.registerHelper('cpgame_movie_rd_template', function (data_richData) {
            if (!CliqzUtils.autocomplete.lastResult) return false;

            var minimalData_pcgame = data_richData && (typeof data_richData["image"] !== "undefined" || typeof data_richData["game_cat"] !== "undefined" && typeof data_richData["rating"] !== "undefined" && typeof data_richData["categories"] !== "undefined");
            var minimalData_movie = data_richData && (typeof data_richData["image"] !== "undefined" || data_richData["director"] && data_richData["director"]["title"] || data_richData["length"] && data_richData["length"] !== "_" || data_richData["categories"]);

            return CliqzUtils.autocomplete.lastResult._results.length == 1 && (minimalData_pcgame || minimalData_movie); // is the only result in the show list
        });

        Handlebars.registerHelper('image_rd_specification', function (richData) {
            return richData['superType'] === "movie" ? "50px" : "76px";
        });

        Handlebars.registerHelper('localizeNumbers', function (num) {
            /*
            * USE only when you really understand your data (see below)!
            * this function supports localization for:
            *   + normal number strings (e.g. 1.2, 3...),
            *   + standardized abrv. strings: 12e-4, and
            *   + extended forms, e.g. 1.2B, 1M etc.
            * In general, any string in the form of xxxyyy where xxx is a standardized number string (recognized by isFinite())
            * and yyy is an arbitrary string (called postfix) that does not start with a number will be localized
            * WARNING: numbers in the form such as: 12e3M, which might be seen as 12000 Million, will be parsed incorrectly
            */
            try {
                var parsedNum = parseFloat(num),
                    postfix,
                    dummy = "-";
                if (!isNaN(parsedNum) && isFinite(parsedNum)) {
                    postfix = isFinite(num) ? "" : (num + "").substring((parsedNum + "").length);
                    return parsedNum.toLocaleString(CliqzUtils.getLocalizedString('locale_lang_code')) + postfix;
                }
                return dummy;
            } catch (e) {
                return num;
            }
        });

        Handlebars.registerHelper('limit', function (idx, max_idx) {
            return idx < max_idx;
        });

        Handlebars.registerHelper('json', function (value, options) {
            return JSON.stringify(value);
        });

        Handlebars.registerHelper('log', function (value, key) {
            CliqzUtils.log(value, 'TEMPLATE LOG HELPER');
        });

        Handlebars.registerHelper('toLowerCase', function (str) {
            return str.toLowerCase();
        });

        Handlebars.registerHelper('toUpperCase', function (str) {
            return str.toUpperCase();
        });

        Handlebars.registerHelper('emphasis', function (text, q, minQueryLength, cleanControlChars) {
            // lucian: questionable solution performance wise
            // strip out all the control chars
            // eg :text = "... \u001a"
            if (!q) return text;
            q = q.trim();
            if (text && cleanControlChars) text = text.replace(/[\u0000-\u001F]/g, ' ');

            if (!text || !q || q.length < (minQueryLength || 2)) return text;

            var map = Array(text.length),
                tokens = q.toLowerCase().split(/\s+|\.+/).filter(function (t) {
                return t && t.length > 1;
            }),
                lowerText = text.toLowerCase(),
                out,
                high = false;

            tokens.forEach(function (token) {
                var poz = lowerText.indexOf(token);
                while (poz !== -1) {
                    for (var i = poz; i < poz + token.length; i++) map[i] = true;
                    poz = lowerText.indexOf(token, poz + 1);
                }
            });
            out = [];
            var current = '';
            for (var i = 0; i < text.length; i++) {
                if (map[i] && !high) {
                    out.push(current);
                    current = '';
                    current += text[i];
                    high = true;
                } else if (!map[i] && high) {
                    out.push(current);
                    current = '';
                    current += text[i];
                    high = false;
                } else current += text[i];
            }
            out.push(current);

            return new Handlebars.SafeString(CliqzHandlebars.tplCache.emphasis(out));
        });

        Handlebars.registerHelper('hasimage', function (image) {
            if (image && image.src && !(image.src.indexOf('xing') !== -1 && image.src.indexOf('nobody_') !== -1)) return true;else return false;
        });

        Handlebars.registerHelper('date', function (_date) {
            var d = new Date(_date);
            var date = d.getDate();
            var month = d.getMonth();
            month++;
            var year = d.getFullYear();
            var formatedDate = date + '/' + month + '/' + year;
            return formatedDate;
        });

        Handlebars.registerHelper("math", function (lvalue, operator, rvalue, options) {
            lvalue = parseFloat(lvalue);
            rvalue = parseFloat(rvalue);

            switch (operator) {
                case "+":
                    return lvalue + rvalue;
                case "-":
                    return lvalue - rvalue;
                case "*":
                    return lvalue * rvalue;
                case "/":
                    return lvalue / rvalue;
                case "%":
                    return lvalue % rvalue;
            }
        });

        Handlebars.registerHelper("logic", function (lvalue, operator, rvalue, options) {
            switch (operator) {
                case "|":
                    return lvalue | rvalue;
                case "||":
                    return lvalue || rvalue;
                case "&":
                    return lvalue & rvalue;
                case "&&":
                    return lvalue && rvalue;
                case "^":
                    return lvalue ^ rvalue;
                case "is":
                    return lvalue == rvalue;
                case "starts_with":
                    return lvalue.indexOf(rvalue) == 0;
                case "===":
                    return lvalue === rvalue;
                case "!=":
                    return lvalue != rvalue;
                case "<":
                    return lvalue < rvalue;
                case ">":
                    return lvalue > rvalue;
            }
        });

        Handlebars.registerHelper('is_not_dummy', function (s) {
            return s && s !== "_";
        });

        Handlebars.registerHelper('nameify', function (str) {
            if (str.length == 0) return "";else return str[0].toUpperCase() + str.slice(1);
        });

        Handlebars.registerHelper('kind_printer', function (kind) {
            //we need to join with semicolon to avoid conflicting with the comma from json objects
            return kind ? kind.join(';') : '';
        });

        Handlebars.registerHelper('links_or_sources', function (richData) {
            return richData ? richData.internal_links && richData.internal_links.length > 0 ? richData.internal_links : richData.additional_sources ? richData.additional_sources : [] : 0;
        });

        Handlebars.registerHelper('pref', function (key) {
            return CliqzUtils.getPref(key, false);
        });

        Handlebars.registerHelper('repeat', function (num, block) {
            var accum = '';
            for (var i = 0; i < num; i++) {
                accum += block.fn(i);
            }
            return accum;
        });

        /* If conditions on preferences */
        Handlebars.registerHelper('ifpref', function (name, val, options) {
            if (val == undefined) return CliqzUtils.getPref(name) ? options.fn(this) : options.inverse(this);else return CliqzUtils.getPref(name) == val ? options.fn(this) : options.inverse(this);
        });

        Handlebars.registerHelper('unlesspref', function (name, val, options) {
            if (val == undefined) return CliqzUtils.getPref(name) ? options.inverse(this) : options.fn(this);else return CliqzUtils.getPref(name) == val ? options.inverse(this) : options.fn(this);
        });
        /* End If conditions on preferences */

        Handlebars.registerHelper('zeroclick_prep', function (zeroInfo_raw) {
            var n,
                name,
                item,
                zeroInfo = [];
            for (n = 0; n < ZERO_CLICK_INFO_PRIO.length; n++) {
                item = ZERO_CLICK_INFO_PRIO[n];
                name = item[0];
                if (zeroInfo_raw[name]) {
                    zeroInfo.push({
                        'name': name,
                        'val': zeroInfo_raw[name],
                        'img': item[1]
                    });
                }
            }
            zeroInfo_raw = zeroInfo;
            return zeroInfo_raw;
        });

        Handlebars.registerHelper('convRateDigitSplit', function (rate) {
            var result = "<span class='cqz-conv-rate'>" + rate.substr(0, rate.length - 2) + "<span class='cqz-rate-last-digits'>" + rate.substr(-2) + "</span>" + "</span>";

            return new Handlebars.SafeString(result);
        });

        Handlebars.registerHelper('numberFormat', function (number) {
            try {
                //just in case this helper is used on unsanitezed data from backend
                number = parseFloat(number);
                number = number.toFixed(2);
                return parseFloat(number).toLocaleString(CliqzUtils.PREFERRED_LANGUAGE);
            } catch (e) {
                return '';
            }
        });

        /* mobile helpers */
        Handlebars.registerHelper("debug", function (optionalValue) {
            console.log("%c Template Data " + this.vertical + " ", "color:#fff;background:green", this);
        });

        Handlebars.registerHelper("trimNumbers", function (number) {
            return Math.round(number);
        });

        Handlebars.registerHelper('conversationsTime', function (time) {
            var d = new Date(time);
            var hours = d.getHours();
            hours = hours > 9 ? hours : '0' + hours;
            var minutes = d.getMinutes();
            minutes = minutes > 9 ? minutes : '0' + minutes;
            var formatedDate = hours + ':' + minutes;
            return formatedDate;
        });

        Handlebars.registerHelper('uriEncode', function (uriComponent) {
            return encodeURIComponent(uriComponent);
        });

        Handlebars.registerHelper('timeOrCalculator', function (ezType) {
            if (ezType == "time") {
                return Handlebars.helpers.local("time");
            } else {
                return Handlebars.helpers.local("calculator");
            }
        });

        Handlebars.registerHelper('ifShowSearch', function (results, options) {
            // if equal
            if (!results[0] || results[0].data.template !== "noResult") {
                return options.fn(this);
            } else {
                return options.inverse(this);
            }
        });

        Handlebars.registerHelper('mobileWikipediaUrls', function (url) {
            return url.replace("http://de.wikipedia.org/wiki", "https://de.m.wikipedia.org/wiki");
        });

        Handlebars.registerHelper('eachIncludeParent', function (context, options) {
            var fn = options.fn,
                inverse = options.inverse,
                ret = "",
                _context = [];

            $.each(context, function (index, object) {
                var _object = $.extend({}, object);
                _context.push(_object);
            });

            if (_context && _context.length > 0) {
                for (var i = 0, j = _context.length; i < j; i++) {
                    _context[i]["parentContext"] = options.hash.parent;
                    ret = ret + fn(_context[i]);
                }
            } else {
                ret = inverse(this);
            }
            return ret;
        });

        Handlebars.registerHelper('conversationsTime', function (time) {
            var d = new Date(time);
            var hours = d.getHours();
            hours = hours > 9 ? hours : '0' + hours;
            var minutes = d.getMinutes();
            minutes = minutes > 9 ? minutes : '0' + minutes;
            var formatedDate = hours + ':' + minutes;
            return formatedDate;
        });

        Handlebars.registerHelper('sendTelemetry', function (nResults) {
            CliqzUtils.telemetry({
                type: 'Results Rendered',
                nResults: nResults
            });
        });

        Handlebars.registerHelper('generate_background_color', function (url) {
            var urlDetails = CliqzUtils.getDetailsFromUrl(url);
            var logoDetails = CliqzUtils.getLogoDetails(urlDetails);
            return "#" + logoDetails.backgroundColor;
        });
    }

    return {
        setters: [function (_coreUtils) {
            CliqzUtils = _coreUtils["default"];
        }, function (_corePlatform) {
            isFirefox = _corePlatform.isFirefox;
        }],
        execute: function () {

            if (isFirefox) {
                Services.scriptloader.loadSubScript('chrome://cliqz/content/bower_components/handlebars/handlebars.js', undefined);
            }

            CliqzHandlebars = Handlebars || undefined.Handlebars;
            TEMPLATES = CliqzUtils.TEMPLATES;
            MESSAGE_TEMPLATES = CliqzUtils.MESSAGE_TEMPLATES || [];
            PARTIALS = CliqzUtils.PARTIALS;
            AGO_CEILINGS = [[0, '', 1], [120, 'ago1Minute', 1], [3600, 'agoXMinutes', 60], [7200, 'ago1Hour', 1], [86400, 'agoXHours', 3600], [172800, 'agoYesterday', 1], [604800, 'agoXDays', 86400], [4838400, 'ago1Month', 1], [29030400, 'agoXMonths', 2419200], [58060800, 'ago1year', 1], [2903040000, 'agoXYears', 29030400]];
            ZERO_CLICK_INFO_PRIO = [["Phone", "http://cdn.cliqz.com/extension/EZ/generic/zeroclick/phone.svg"], ["BIC", "http://cdn.cliqz.com/extension/EZ/generic/zeroclick/BIC.svg"], ["E-Mail", "http://cdn.cliqz.com/extension/EZ/generic/zeroclick/emaill.svg"]];

            CliqzHandlebars.tplCache = {};

            /* Needed by the view layer */
            CliqzHandlebars.TEMPLATES = TEMPLATES;
            CliqzHandlebars.MESSAGE_TEMPLATES = MESSAGE_TEMPLATES;
            CliqzHandlebars.PARTIALS = PARTIALS;

            compileTemplates();
            registerHelpers();
            _export("default", CliqzHandlebars);
        }
    };
});
//# sourceMappingURL=data:application/json;base64,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QUssQ0FBQyxFQUN2QyxDQUFDLE9BQU8sRUFBUSxXQUFXLEVBQUksQ0FBQyxDQUFDLEVBQ2pDLENBQUMsUUFBUSxFQUFPLFlBQVksRUFBSyxPQUFPLENBQUMsRUFDekMsQ0FBQyxRQUFRLEVBQU8sVUFBVSxFQUFLLENBQUMsQ0FBQyxFQUNqQyxDQUFDLFVBQVUsRUFBSyxXQUFXLEVBQU8sUUFBUSxDQUFDLENBQzlDO0FBQ0QsZ0NBQW9CLEdBQUcsQ0FBQyxDQUFDLE9BQU8sRUFBRSwrREFBK0QsQ0FBQyxFQUMxRSxDQUFDLEtBQUssRUFBRSw2REFBNkQsQ0FBQyxFQUN0RSxDQUFDLFFBQVEsRUFBRSxnRUFBZ0UsQ0FBQyxDQUM1RTs7QUFJNUIsMkJBQWUsQ0FBQyxRQUFRLEdBQUcsRUFBRSxDQUFDOzs7QUFHOUIsMkJBQWUsQ0FBQyxTQUFTLEdBQUcsU0FBUyxDQUFDO0FBQ3RDLDJCQUFlLENBQUMsaUJBQWlCLEdBQUcsaUJBQWlCLENBQUM7QUFDdEQsMkJBQWUsQ0FBQyxRQUFRLEdBQUcsUUFBUSxDQUFDOztBQUVwQyw0QkFBZ0IsRUFBRSxDQUFDO0FBQ25CLDJCQUFlLEVBQUUsQ0FBQzsrQkFzYkgsZUFBZSIsImZpbGUiOiJjb3JlL3RlbXBsYXRlcy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gICAgaGFuZGxlYmFycyB3cmFwcGVyIHdoaWNoIGFkZHMgYWxsIHRoZSBuZWVkZWQgaGVscGVyc1xuKi9cblxuaW1wb3J0IENsaXF6VXRpbHMgZnJvbSBcImNvcmUvdXRpbHNcIjtcbmltcG9ydCB7IGlzRmlyZWZveCB9IGZyb20gXCJjb3JlL3BsYXRmb3JtXCI7XG5cbmlmIChpc0ZpcmVmb3gpIHtcbiAgU2VydmljZXMuc2NyaXB0bG9hZGVyLmxvYWRTdWJTY3JpcHQoJ2Nocm9tZTovL2NsaXF6L2NvbnRlbnQvYm93ZXJfY29tcG9uZW50cy9oYW5kbGViYXJzL2hhbmRsZWJhcnMuanMnLCB0aGlzKTtcbn1cblxudmFyIENsaXF6SGFuZGxlYmFycyA9IEhhbmRsZWJhcnMgfHwgdGhpcy5IYW5kbGViYXJzO1xuXG52YXIgVEVNUExBVEVTID0gQ2xpcXpVdGlscy5URU1QTEFURVMsXG4gICAgTUVTU0FHRV9URU1QTEFURVMgPSBDbGlxelV0aWxzLk1FU1NBR0VfVEVNUExBVEVTIHx8IFtdLFxuICAgIFBBUlRJQUxTID0gQ2xpcXpVdGlscy5QQVJUSUFMUyxcbiAgICBBR09fQ0VJTElOR1MgPSBbXG4gICAgICAgIFswICAgICAgICAgICAgLCAnJywxXSxcbiAgICAgICAgWzEyMCAgICAgICAgICAsICdhZ28xTWludXRlJyAsIDFdLFxuICAgICAgICBbMzYwMCAgICAgICAgICwgJ2Fnb1hNaW51dGVzJyAgICwgNjBdLFxuICAgICAgICBbNzIwMCAgICAgICAgICwgJ2FnbzFIb3VyJyAsIDFdLFxuICAgICAgICBbODY0MDAgICAgICAgICwgJ2Fnb1hIb3VycycgICAsIDM2MDBdLFxuICAgICAgICBbMTcyODAwICAgICAgICwgJ2Fnb1llc3RlcmRheScgICAgICAgICAgLCAxXSxcbiAgICAgICAgWzYwNDgwMCAgICAgICAsICdhZ29YRGF5cycgICAgICwgODY0MDBdLFxuICAgICAgICBbNDgzODQwMCAgICAgICwgJ2FnbzFNb250aCcgICwgMV0sXG4gICAgICAgIFsyOTAzMDQwMCAgICAgLCAnYWdvWE1vbnRocycgICAsIDI0MTkyMDBdLFxuICAgICAgICBbNTgwNjA4MDAgICAgICwgJ2FnbzF5ZWFyJyAgICwgMV0sXG4gICAgICAgIFsyOTAzMDQwMDAwICAgLCAnYWdvWFllYXJzJyAgICAgLCAyOTAzMDQwMF1cbiAgICBdLFxuICAgIFpFUk9fQ0xJQ0tfSU5GT19QUklPID0gW1tcIlBob25lXCIsIFwiaHR0cDovL2Nkbi5jbGlxei5jb20vZXh0ZW5zaW9uL0VaL2dlbmVyaWMvemVyb2NsaWNrL3Bob25lLnN2Z1wiXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXCJCSUNcIiwgXCJodHRwOi8vY2RuLmNsaXF6LmNvbS9leHRlbnNpb24vRVovZ2VuZXJpYy96ZXJvY2xpY2svQklDLnN2Z1wiXSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBbXCJFLU1haWxcIiwgXCJodHRwOi8vY2RuLmNsaXF6LmNvbS9leHRlbnNpb24vRVovZ2VuZXJpYy96ZXJvY2xpY2svZW1haWxsLnN2Z1wiXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgXTtcblxuXG5cbkNsaXF6SGFuZGxlYmFycy50cGxDYWNoZSA9IHt9O1xuXG4vKiBOZWVkZWQgYnkgdGhlIHZpZXcgbGF5ZXIgKi9cbkNsaXF6SGFuZGxlYmFycy5URU1QTEFURVMgPSBURU1QTEFURVM7XG5DbGlxekhhbmRsZWJhcnMuTUVTU0FHRV9URU1QTEFURVMgPSBNRVNTQUdFX1RFTVBMQVRFUztcbkNsaXF6SGFuZGxlYmFycy5QQVJUSUFMUyA9IFBBUlRJQUxTO1xuXG5jb21waWxlVGVtcGxhdGVzKCk7XG5yZWdpc3RlckhlbHBlcnMoKTtcbmZ1bmN0aW9uIGNvbXBpbGVUZW1wbGF0ZXMoKXtcbiAgICBPYmplY3Qua2V5cyhURU1QTEFURVMpLmZvckVhY2goZmV0Y2hUZW1wbGF0ZSk7XG4gICAgTUVTU0FHRV9URU1QTEFURVMuZm9yRWFjaChmZXRjaFRlbXBsYXRlKTtcbiAgICBQQVJUSUFMUy5mb3JFYWNoKGZ1bmN0aW9uKHROYW1lKXsgZmV0Y2hUZW1wbGF0ZSh0TmFtZSwgdHJ1ZSk7IH0pO1xufVxuXG5mdW5jdGlvbiBmZXRjaFRlbXBsYXRlKHROYW1lLCBpc1BhcnRpYWwpIHtcbiAgICB0cnkge1xuICAgICAgICBDbGlxelV0aWxzLmh0dHBHZXQoQ2xpcXpVdGlscy5URU1QTEFURVNfUEFUSCArIHROYW1lICsgJy50cGwnLCBmdW5jdGlvbihyZXMpe1xuICAgICAgICAgICAgaWYoaXNQYXJ0aWFsID09PSB0cnVlKSB7XG4gICAgICAgICAgICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJQYXJ0aWFsKHROYW1lLCByZXMucmVzcG9uc2UpO1xuICAgICAgICAgICAgICBDbGlxekhhbmRsZWJhcnMudHBsQ2FjaGVbdE5hbWVdID0gSGFuZGxlYmFycy5jb21waWxlKHJlcy5yZXNwb25zZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlXG4gICAgICAgICAgICAgICAgQ2xpcXpIYW5kbGViYXJzLnRwbENhY2hlW3ROYW1lXSA9IEhhbmRsZWJhcnMuY29tcGlsZShyZXMucmVzcG9uc2UpO1xuICAgICAgICB9KTtcbiAgICB9IGNhdGNoKGUpe1xuICAgICAgICBDbGlxelV0aWxzLmxvZygnRVJST1IgbG9hZGluZyB0ZW1wbGF0ZSAnICsgdE5hbWUpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcmVnaXN0ZXJIZWxwZXJzKCl7XG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcigncGFydGlhbCcsIGZ1bmN0aW9uKG5hbWUsIG9wdGlvbnMpIHtcbiAgICAgICAgdmFyIHRlbXBsYXRlID0gQ2xpcXpIYW5kbGViYXJzLnRwbENhY2hlW25hbWVdIHx8IENsaXF6SGFuZGxlYmFycy50cGxDYWNoZVtcInBhcnRpYWxzL1wiK25hbWVdIHx8IENsaXF6SGFuZGxlYmFycy50cGxDYWNoZS5lbXB0eTtcbiAgICAgICAgcmV0dXJuIG5ldyBIYW5kbGViYXJzLlNhZmVTdHJpbmcodGVtcGxhdGUodGhpcykpO1xuICAgIH0pO1xuXG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignZ2V0X2FycmF5X2VsZW1lbnQnLCBmdW5jdGlvbihhcnIsIGlkeCwgc3ViZWxlbWVudCkge1xuICAgICAgaWYgKHR5cGVvZihzdWJlbGVtZW50KSA9PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBhcnIgJiYgYXJyW2lkeF07XG4gICAgICBlbHNlXG4gICAgICAgIHJldHVybiBhcnIgJiYgYXJyW2lkeF0gJiYgYXJyW2lkeF1bc3ViZWxlbWVudF07XG4gICAgfSk7XG5cbiAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdhZ29saW5lJywgZnVuY3Rpb24odHMsIG9wdGlvbnMpIHtcbiAgICAgICAgaWYoIXRzKSByZXR1cm4gJyc7XG4gICAgICAgIHZhciBub3cgPSAobmV3IERhdGUoKS5nZXRUaW1lKCkgLyAxMDAwKSxcbiAgICAgICAgICAgIHNlY29uZHMgPSBwYXJzZUludChub3cgLSB0cyksXG4gICAgICAgICAgICBpPTAsIHNsb3Q7XG5cbiAgICAgICAgd2hpbGUgKHNsb3QgPSBBR09fQ0VJTElOR1NbaSsrXSlcbiAgICAgICAgICAgIGlmIChzZWNvbmRzIDwgc2xvdFswXSlcbiAgICAgICAgICAgICAgICByZXR1cm4gQ2xpcXpVdGlscy5nZXRMb2NhbGl6ZWRTdHJpbmcoc2xvdFsxXSwgcGFyc2VJbnQoc2Vjb25kcyAvIHNsb3RbMl0pKVxuICAgICAgICByZXR1cm4gJyc7XG4gICAgfSk7XG5cbiAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdzZWNfdG9fZHVyYXRpb24nLCBmdW5jdGlvbihzZWNvbmRzKSB7XG4gICAgICAgIGlmKCFzZWNvbmRzKXJldHVybiBudWxsO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHMgPSBwYXJzZUludChzZWNvbmRzKTtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKHMvNjApICsgJzonICsgKFwiMFwiICsgKHMlNjApKS5zbGljZSgtMik7XG4gICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ2Rpc3RhbmNlJywgZnVuY3Rpb24obWV0ZXJzKSB7XG4gICAgICAgIGlmKG1ldGVycyA8IDEwMDApIHtcbiAgICAgICAgICAgIHJldHVybiBtZXRlcnMudG9GaXhlZCgwKSArIFwiIG1cIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gKG1ldGVycy8xMDAwKS50b0ZpeGVkKDEpICsgXCIga21cIjtcbiAgICB9KTtcblxuICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ3Nob3BwaW5nX3N0YXJzX3dpZHRoJywgZnVuY3Rpb24ocmF0aW5nKSB7XG4gICAgICAgIHJldHVybiByYXRpbmcgKiAxNDtcbiAgICB9KTtcblxuICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ2V2ZW4nLCBmdW5jdGlvbih2YWx1ZSwgb3B0aW9ucykge1xuICAgICAgICBpZiAodmFsdWUlMikge1xuICAgICAgICAgICAgcmV0dXJuIG9wdGlvbnMuZm4odGhpcyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlKHRoaXMpO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdsb2NhbCcsIGZ1bmN0aW9uKGtleSkge1xuICAgICAgICB2YXIgYXJncyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyk7XG4gICAgICAgIHZhciBuYW1lID0gYXJncy5zaGlmdCgpO1xuICAgICAgICByZXR1cm4gQ2xpcXpVdGlscy5nZXRMb2NhbGl6ZWRTdHJpbmcuYXBwbHkobnVsbCwgW25hbWUsIGFyZ3NdKTtcbiAgICB9KTtcblxuICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ3ZpZXdzX2hlbHBlcicsIGZ1bmN0aW9uKHZhbCkge1xuICAgICAgICBpZighdmFsIHx8IHZhbCA9PSAnLTEnKXJldHVybiAnJztcblxuICAgICAgICB0cnkge1xuICAgICAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodmFsKS50b0xvY2FsZVN0cmluZygpICsgJyAnICsgQ2xpcXpVdGlscy5nZXRMb2NhbGl6ZWRTdHJpbmcoJ3ZpZXdzJyk7XG4gICAgICAgIH0gY2F0Y2goZSkge1xuICAgICAgICAgICAgcmV0dXJuICcnXG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ3dpa2lFWl9oZWlnaHQnLCBmdW5jdGlvbihkYXRhX3JpY2hEYXRhKXtcbiAgICAgICAgaWYgKGRhdGFfcmljaERhdGEgJiYgZGF0YV9yaWNoRGF0YS5oYXNPd25Qcm9wZXJ0eSgnaW1hZ2VzJykgJiYgZGF0YV9yaWNoRGF0YS5pbWFnZXMubGVuZ3RoID4gMCl7XG4gICAgICAgICAgICBpZiAoICh0aGlzLnR5cGUgPT09ICdjbGlxei1leHRyYScpIHx8ICh0aGlzLmRhdGEgPT09IENsaXF6VXRpbHMuYXV0b2NvbXBsZXRlLmxhc3RSZXN1bHQuX3Jlc3VsdHNbMF0uZGF0YSkpICAvLyBpcyB0aGUgZmlyc3QgcmVzdWx0IGluIHRoZSBzaG93IGxpc3RcbiAgICAgICAgICAgICAgICByZXR1cm4gJ2Nxei1yZXN1bHQtaDInO1xuICAgICAgICAgICAgLy8gQk0gaHEgcmVzdWx0LCBidXQgbm90IHRoZSAxc3QgcmVzdWx0IC0+IHJlbW92ZSBpbWFnZXNcbiAgICAgICAgICAgIGRhdGFfcmljaERhdGEuaW1hZ2VzID0gW107XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gJ2Nxei1yZXN1bHQtaDMnO1xuICAgIH0pO1xuXG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcigncmVjaXBlX3JkX3RlbXBsYXRlJywgZnVuY3Rpb24oZGF0YV9yaWNoRGF0YSkge1xuICAgICAgICB2YXIgbWluaW1hbERhdGEgPSBkYXRhX3JpY2hEYXRhXG4gICAgICAgICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZihkYXRhX3JpY2hEYXRhW1wiY29va190aW1lXCJdKSAhPT0gXCJ1bmRlZmluZWRcIlxuICAgICAgICAgICAgICAgICAgICAgICAgICAmJiB0eXBlb2YoZGF0YV9yaWNoRGF0YVtcIm51bXBvcnRpb25cIl0pICE9PSBcInVuZGVmaW5lZFwiXG4gICAgICAgICAgICAgICAgICAgICAgICAgICYmIHR5cGVvZihkYXRhX3JpY2hEYXRhW1widG90YWxfcmV2aWV3XCJdKSAhPT0gXCJ1bmRlZmluZWRcIjtcblxuICAgICAgICAvLyBpcyB0aGUgb25seSByZXN1bHQgaW4gdGhlIHNob3cgbGlzdFxuICAgICAgICByZXR1cm4gKENsaXF6VXRpbHMuYXV0b2NvbXBsZXRlLmxhc3RSZXN1bHQuX3Jlc3VsdHMubGVuZ3RoID09PSAxICYmIG1pbmltYWxEYXRhKTtcbiAgICB9KTtcblxuICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ2NwZ2FtZV9tb3ZpZV9yZF90ZW1wbGF0ZScsIGZ1bmN0aW9uKGRhdGFfcmljaERhdGEpIHtcbiAgICAgICAgaWYoIUNsaXF6VXRpbHMuYXV0b2NvbXBsZXRlLmxhc3RSZXN1bHQpIHJldHVybiBmYWxzZTtcblxuICAgICAgICB2YXIgbWluaW1hbERhdGFfcGNnYW1lID0gZGF0YV9yaWNoRGF0YSAmJiAoKHR5cGVvZihkYXRhX3JpY2hEYXRhW1wiaW1hZ2VcIl0pICE9PSBcInVuZGVmaW5lZFwiICkgfHwgKHR5cGVvZihkYXRhX3JpY2hEYXRhW1wiZ2FtZV9jYXRcIl0pICE9PSBcInVuZGVmaW5lZFwiICYmIHR5cGVvZihkYXRhX3JpY2hEYXRhW1wicmF0aW5nXCJdKSAhPT0gXCJ1bmRlZmluZWRcIiAmJiB0eXBlb2YoZGF0YV9yaWNoRGF0YVtcImNhdGVnb3JpZXNcIl0pICE9PSBcInVuZGVmaW5lZFwiICkpO1xuICAgICAgICB2YXIgbWluaW1hbERhdGFfbW92aWUgPSBkYXRhX3JpY2hEYXRhICYmICgodHlwZW9mKGRhdGFfcmljaERhdGFbXCJpbWFnZVwiXSkgIT09IFwidW5kZWZpbmVkXCIgKSB8fCAoZGF0YV9yaWNoRGF0YVtcImRpcmVjdG9yXCJdICYmIGRhdGFfcmljaERhdGFbXCJkaXJlY3RvclwiXVtcInRpdGxlXCJdKSB8fCAoZGF0YV9yaWNoRGF0YVtcImxlbmd0aFwiXSAmJiAgZGF0YV9yaWNoRGF0YVtcImxlbmd0aFwiXSAhPT0gXCJfXCIpIHx8IChkYXRhX3JpY2hEYXRhW1wiY2F0ZWdvcmllc1wiXSkpO1xuXG4gICAgICAgIHJldHVybiAoQ2xpcXpVdGlscy5hdXRvY29tcGxldGUubGFzdFJlc3VsdC5fcmVzdWx0cy5sZW5ndGggPT0gMSAmJiAobWluaW1hbERhdGFfcGNnYW1lIHx8IG1pbmltYWxEYXRhX21vdmllKSk7IC8vIGlzIHRoZSBvbmx5IHJlc3VsdCBpbiB0aGUgc2hvdyBsaXN0XG4gICAgfSk7XG5cbiAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdpbWFnZV9yZF9zcGVjaWZpY2F0aW9uJywgZnVuY3Rpb24ocmljaERhdGEpe1xuICAgICAgICByZXR1cm4gcmljaERhdGFbJ3N1cGVyVHlwZSddID09PSBcIm1vdmllXCIgPyBcIjUwcHhcIiA6IFwiNzZweFwiO1xuICAgIH0pO1xuXG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignbG9jYWxpemVOdW1iZXJzJywgZnVuY3Rpb24obnVtKSB7XG4gICAgICAgIC8qXG4gICAgICAgICogVVNFIG9ubHkgd2hlbiB5b3UgcmVhbGx5IHVuZGVyc3RhbmQgeW91ciBkYXRhIChzZWUgYmVsb3cpIVxuICAgICAgICAqIHRoaXMgZnVuY3Rpb24gc3VwcG9ydHMgbG9jYWxpemF0aW9uIGZvcjpcbiAgICAgICAgKiAgICsgbm9ybWFsIG51bWJlciBzdHJpbmdzIChlLmcuIDEuMiwgMy4uLiksXG4gICAgICAgICogICArIHN0YW5kYXJkaXplZCBhYnJ2LiBzdHJpbmdzOiAxMmUtNCwgYW5kXG4gICAgICAgICogICArIGV4dGVuZGVkIGZvcm1zLCBlLmcuIDEuMkIsIDFNIGV0Yy5cbiAgICAgICAgKiBJbiBnZW5lcmFsLCBhbnkgc3RyaW5nIGluIHRoZSBmb3JtIG9mIHh4eHl5eSB3aGVyZSB4eHggaXMgYSBzdGFuZGFyZGl6ZWQgbnVtYmVyIHN0cmluZyAocmVjb2duaXplZCBieSBpc0Zpbml0ZSgpKVxuICAgICAgICAqIGFuZCB5eXkgaXMgYW4gYXJiaXRyYXJ5IHN0cmluZyAoY2FsbGVkIHBvc3RmaXgpIHRoYXQgZG9lcyBub3Qgc3RhcnQgd2l0aCBhIG51bWJlciB3aWxsIGJlIGxvY2FsaXplZFxuICAgICAgICAqIFdBUk5JTkc6IG51bWJlcnMgaW4gdGhlIGZvcm0gc3VjaCBhczogMTJlM00sIHdoaWNoIG1pZ2h0IGJlIHNlZW4gYXMgMTIwMDAgTWlsbGlvbiwgd2lsbCBiZSBwYXJzZWQgaW5jb3JyZWN0bHlcbiAgICAgICAgKi9cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgIHZhciBwYXJzZWROdW0gPSBwYXJzZUZsb2F0KG51bSksIHBvc3RmaXgsIGR1bW15ID0gXCItXCI7XG4gICAgICAgICAgICBpZiAoIWlzTmFOKHBhcnNlZE51bSkgJiYgaXNGaW5pdGUocGFyc2VkTnVtKSkge1xuICAgICAgICAgICAgICAgIHBvc3RmaXggPSBpc0Zpbml0ZShudW0pID8gXCJcIiA6IChudW0gKyBcIlwiKS5zdWJzdHJpbmcoKHBhcnNlZE51bSArIFwiXCIpLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhcnNlZE51bS50b0xvY2FsZVN0cmluZyhDbGlxelV0aWxzLmdldExvY2FsaXplZFN0cmluZygnbG9jYWxlX2xhbmdfY29kZScpKSArIHBvc3RmaXg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZHVtbXk7XG4gICAgICAgIH1cbiAgICAgICAgY2F0Y2goZSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdsaW1pdCcsIGZ1bmN0aW9uKGlkeCwgbWF4X2lkeCl7XG4gICAgICAgIHJldHVybiBpZHggPCBtYXhfaWR4O1xuICAgIH0pO1xuXG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignanNvbicsIGZ1bmN0aW9uKHZhbHVlLCBvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeSh2YWx1ZSk7XG4gICAgfSk7XG5cbiAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdsb2cnLCBmdW5jdGlvbih2YWx1ZSwga2V5KSB7XG4gICAgICAgIENsaXF6VXRpbHMubG9nKHZhbHVlLCAnVEVNUExBVEUgTE9HIEhFTFBFUicpO1xuICAgIH0pO1xuXG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcigndG9Mb3dlckNhc2UnLCBmdW5jdGlvbihzdHIpIHtcbiAgICAgICByZXR1cm4gc3RyLnRvTG93ZXJDYXNlKCk7XG4gICAgfSk7XG5cbiAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCd0b1VwcGVyQ2FzZScsIGZ1bmN0aW9uKHN0cikge1xuICAgICAgIHJldHVybiBzdHIudG9VcHBlckNhc2UoKTtcbiAgICB9KTtcblxuICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ2VtcGhhc2lzJywgZnVuY3Rpb24odGV4dCwgcSwgbWluUXVlcnlMZW5ndGgsIGNsZWFuQ29udHJvbENoYXJzKSB7XG4gICAgICAgIC8vIGx1Y2lhbjogcXVlc3Rpb25hYmxlIHNvbHV0aW9uIHBlcmZvcm1hbmNlIHdpc2VcbiAgICAgICAgLy8gc3RyaXAgb3V0IGFsbCB0aGUgY29udHJvbCBjaGFyc1xuICAgICAgICAvLyBlZyA6dGV4dCA9IFwiLi4uIFxcdTAwMWFcIlxuICAgICAgICBpZighcSkgcmV0dXJuIHRleHQ7XG4gICAgICAgIHEgPSBxLnRyaW0oKTtcbiAgICAgICAgaWYodGV4dCAmJiBjbGVhbkNvbnRyb2xDaGFycykgdGV4dCA9IHRleHQucmVwbGFjZSgvW1xcdTAwMDAtXFx1MDAxRl0vZywgJyAnKVxuXG4gICAgICAgIGlmKCF0ZXh0IHx8ICFxIHx8IHEubGVuZ3RoIDwgKG1pblF1ZXJ5TGVuZ3RoIHx8IDIpKSByZXR1cm4gdGV4dDtcblxuICAgICAgICB2YXIgbWFwID0gQXJyYXkodGV4dC5sZW5ndGgpLFxuICAgICAgICAgICAgdG9rZW5zID0gcS50b0xvd2VyQ2FzZSgpLnNwbGl0KC9cXHMrfFxcLisvKS5maWx0ZXIoZnVuY3Rpb24odCl7IHJldHVybiB0ICYmIHQubGVuZ3RoPjE7IH0pLFxuICAgICAgICAgICAgbG93ZXJUZXh0ID0gdGV4dC50b0xvd2VyQ2FzZSgpLFxuICAgICAgICAgICAgb3V0LCBoaWdoID0gZmFsc2U7XG5cbiAgICAgICAgdG9rZW5zLmZvckVhY2goZnVuY3Rpb24odG9rZW4pe1xuICAgICAgICAgICAgdmFyIHBveiA9IGxvd2VyVGV4dC5pbmRleE9mKHRva2VuKTtcbiAgICAgICAgICAgIHdoaWxlKHBveiAhPT0gLTEpe1xuICAgICAgICAgICAgICAgIGZvcih2YXIgaT1wb3o7IGk8cG96K3Rva2VuLmxlbmd0aDsgaSsrKVxuICAgICAgICAgICAgICAgICAgICBtYXBbaV0gPSB0cnVlO1xuICAgICAgICAgICAgICAgIHBveiA9IGxvd2VyVGV4dC5pbmRleE9mKHRva2VuLCBwb3orMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgICBvdXQ9W107XG4gICAgICAgIHZhciBjdXJyZW50ID0gJydcbiAgICAgICAgZm9yKHZhciBpPTA7IGk8dGV4dC5sZW5ndGg7IGkrKyl7XG4gICAgICAgICAgICBpZihtYXBbaV0gJiYgIWhpZ2gpe1xuICAgICAgICAgICAgICAgIG91dC5wdXNoKGN1cnJlbnQpO1xuICAgICAgICAgICAgICAgIGN1cnJlbnQ9Jyc7XG4gICAgICAgICAgICAgICAgY3VycmVudCArPSB0ZXh0W2ldO1xuICAgICAgICAgICAgICAgIGhpZ2ggPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZighbWFwW2ldICYmIGhpZ2gpe1xuICAgICAgICAgICAgICAgIG91dC5wdXNoKGN1cnJlbnQpO1xuICAgICAgICAgICAgICAgIGN1cnJlbnQ9Jyc7XG4gICAgICAgICAgICAgICAgY3VycmVudCArPXRleHRbaV07XG4gICAgICAgICAgICAgICAgaGlnaCA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBjdXJyZW50ICs9IHRleHRbaV07XG4gICAgICAgIH1cbiAgICAgICAgb3V0LnB1c2goY3VycmVudCk7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBIYW5kbGViYXJzLlNhZmVTdHJpbmcoQ2xpcXpIYW5kbGViYXJzLnRwbENhY2hlLmVtcGhhc2lzKG91dCkpO1xuICAgIH0pO1xuXG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignaGFzaW1hZ2UnLCBmdW5jdGlvbihpbWFnZSkge1xuICAgICAgICBpZihpbWFnZSAmJiBpbWFnZS5zcmMgJiZcbiAgICAgICAgICAgICEoaW1hZ2Uuc3JjLmluZGV4T2YoJ3hpbmcnKSAhPT0gLTEgJiYgaW1hZ2Uuc3JjLmluZGV4T2YoJ25vYm9keV8nKSAhPT0tMSkpXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgZWxzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlXG4gICAgfSk7XG5cbiAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdkYXRlJywgZnVuY3Rpb24oX2RhdGUpIHtcbiAgICAgICAgdmFyIGQgPSBuZXcgRGF0ZShfZGF0ZSk7XG4gICAgICAgIHZhciBkYXRlID0gZC5nZXREYXRlKCk7XG4gICAgICAgIHZhciBtb250aCA9IGQuZ2V0TW9udGgoKTtcbiAgICAgICAgbW9udGgrKztcbiAgICAgICAgdmFyIHllYXIgPSBkLmdldEZ1bGxZZWFyKCk7XG4gICAgICAgIHZhciBmb3JtYXRlZERhdGUgPSBkYXRlICsgJy8nICsgbW9udGggKyAnLycgKyB5ZWFyO1xuICAgICAgICByZXR1cm4gZm9ybWF0ZWREYXRlO1xuICAgIH0pO1xuXG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcihcIm1hdGhcIiwgZnVuY3Rpb24obHZhbHVlLCBvcGVyYXRvciwgcnZhbHVlLCBvcHRpb25zKSB7XG4gICAgICAgIGx2YWx1ZSA9IHBhcnNlRmxvYXQobHZhbHVlKTtcbiAgICAgICAgcnZhbHVlID0gcGFyc2VGbG9hdChydmFsdWUpO1xuXG4gICAgICAgIHN3aXRjaChvcGVyYXRvcikge1xuICAgICAgICAgICAgY2FzZSBcIitcIjogcmV0dXJuIGx2YWx1ZSArIHJ2YWx1ZTtcbiAgICAgICAgICAgIGNhc2UgXCItXCI6IHJldHVybiBsdmFsdWUgLSBydmFsdWU7XG4gICAgICAgICAgICBjYXNlIFwiKlwiOiByZXR1cm4gbHZhbHVlICogcnZhbHVlO1xuICAgICAgICAgICAgY2FzZSBcIi9cIjogcmV0dXJuIGx2YWx1ZSAvIHJ2YWx1ZTtcbiAgICAgICAgICAgIGNhc2UgXCIlXCI6IHJldHVybiBsdmFsdWUgJSBydmFsdWU7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoXCJsb2dpY1wiLCBmdW5jdGlvbihsdmFsdWUsIG9wZXJhdG9yLCBydmFsdWUsIG9wdGlvbnMpIHtcbiAgICAgICAgc3dpdGNoKG9wZXJhdG9yKSB7XG4gICAgICAgICAgICBjYXNlIFwifFwiOiAgICAgICAgICAgcmV0dXJuIGx2YWx1ZSB8IHJ2YWx1ZTtcbiAgICAgICAgICAgIGNhc2UgXCJ8fFwiOiAgICAgICAgICByZXR1cm4gbHZhbHVlIHx8IHJ2YWx1ZTtcbiAgICAgICAgICAgIGNhc2UgXCImXCI6ICAgICAgICAgICByZXR1cm4gbHZhbHVlICYgcnZhbHVlO1xuICAgICAgICAgICAgY2FzZSBcIiYmXCI6ICAgICAgICAgIHJldHVybiBsdmFsdWUgJiYgcnZhbHVlO1xuICAgICAgICAgICAgY2FzZSBcIl5cIjogICAgICAgICAgIHJldHVybiBsdmFsdWUgXiBydmFsdWU7XG4gICAgICAgICAgICBjYXNlIFwiaXNcIjogICAgICAgICAgcmV0dXJuIGx2YWx1ZSA9PSBydmFsdWU7XG4gICAgICAgICAgICBjYXNlIFwic3RhcnRzX3dpdGhcIjogcmV0dXJuIGx2YWx1ZS5pbmRleE9mKHJ2YWx1ZSkgPT0gMDtcbiAgICAgICAgICAgIGNhc2UgXCI9PT1cIjogICAgICAgICByZXR1cm4gbHZhbHVlID09PSBydmFsdWU7XG4gICAgICAgICAgICBjYXNlIFwiIT1cIjogICAgICAgICAgcmV0dXJuIGx2YWx1ZSAhPSBydmFsdWU7XG4gICAgICAgICAgICBjYXNlIFwiPFwiOiAgICAgICAgICAgcmV0dXJuIGx2YWx1ZSA8IHJ2YWx1ZTtcbiAgICAgICAgICAgIGNhc2UgXCI+XCI6ICAgICAgICAgICByZXR1cm4gbHZhbHVlID4gcnZhbHVlO1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdpc19ub3RfZHVtbXknLCBmdW5jdGlvbihzKXtcbiAgICAgICAgcmV0dXJuIHMgJiYgcyE9PVwiX1wiO1xuICAgIH0pO1xuXG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignbmFtZWlmeScsIGZ1bmN0aW9uKHN0cikge1xuICAgICAgICBpZiAoc3RyLmxlbmd0aCA9PSAwKSByZXR1cm4gXCJcIjtcbiAgICAgICAgZWxzZSByZXR1cm4gc3RyWzBdLnRvVXBwZXJDYXNlKCkgKyBzdHIuc2xpY2UoMSk7XG4gICAgfSk7XG5cbiAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdraW5kX3ByaW50ZXInLCBmdW5jdGlvbihraW5kKSB7XG4gICAgICAgIC8vd2UgbmVlZCB0byBqb2luIHdpdGggc2VtaWNvbG9uIHRvIGF2b2lkIGNvbmZsaWN0aW5nIHdpdGggdGhlIGNvbW1hIGZyb20ganNvbiBvYmplY3RzXG4gICAgICAgIHJldHVybiBraW5kID8ga2luZC5qb2luKCc7Jyk6ICcnO1xuICAgIH0pO1xuXG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignbGlua3Nfb3Jfc291cmNlcycsIGZ1bmN0aW9uKHJpY2hEYXRhKSB7XG4gICAgICAgIHJldHVybiByaWNoRGF0YSA/ICgocmljaERhdGEuaW50ZXJuYWxfbGlua3MgJiYgcmljaERhdGEuaW50ZXJuYWxfbGlua3MubGVuZ3RoID4gMCkgPyByaWNoRGF0YS5pbnRlcm5hbF9saW5rcyA6IChyaWNoRGF0YS5hZGRpdGlvbmFsX3NvdXJjZXMgPyByaWNoRGF0YS5hZGRpdGlvbmFsX3NvdXJjZXMgOiBbXSkpIDogMDtcbiAgICB9KTtcblxuICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ3ByZWYnLCBmdW5jdGlvbihrZXkpIHtcbiAgICAgICAgcmV0dXJuIENsaXF6VXRpbHMuZ2V0UHJlZihrZXksIGZhbHNlKTtcbiAgICB9KTtcblxuICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ3JlcGVhdCcsIGZ1bmN0aW9uKG51bSwgYmxvY2spIHtcbiAgICAgIHZhciBhY2N1bSA9ICcnO1xuICAgICAgZm9yKHZhciBpID0gMDsgaSA8IG51bTsgaSsrKSB7XG4gICAgICAgIGFjY3VtICs9IGJsb2NrLmZuKGkpO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGFjY3VtO1xuICAgIH0pO1xuXG4gICAgLyogSWYgY29uZGl0aW9ucyBvbiBwcmVmZXJlbmNlcyAqL1xuICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ2lmcHJlZicsIGZ1bmN0aW9uKG5hbWUsIHZhbCwgb3B0aW9ucykge1xuICAgICAgaWYgKHZhbCA9PSB1bmRlZmluZWQpXG4gICAgICAgIHJldHVybiBDbGlxelV0aWxzLmdldFByZWYobmFtZSkgPyBvcHRpb25zLmZuKHRoaXMpIDogb3B0aW9ucy5pbnZlcnNlKHRoaXMpIDtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIENsaXF6VXRpbHMuZ2V0UHJlZihuYW1lKSA9PSB2YWwgPyBvcHRpb25zLmZuKHRoaXMpIDogb3B0aW9ucy5pbnZlcnNlKHRoaXMpIDtcbiAgICB9KTtcblxuICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ3VubGVzc3ByZWYnLCBmdW5jdGlvbihuYW1lLCB2YWwsIG9wdGlvbnMpIHtcbiAgICAgIGlmICh2YWwgPT0gdW5kZWZpbmVkKVxuICAgICAgICByZXR1cm4gQ2xpcXpVdGlscy5nZXRQcmVmKG5hbWUpID8gb3B0aW9ucy5pbnZlcnNlKHRoaXMpIDogb3B0aW9ucy5mbih0aGlzKTtcbiAgICAgIGVsc2VcbiAgICAgICAgcmV0dXJuIENsaXF6VXRpbHMuZ2V0UHJlZihuYW1lKSA9PSB2YWwgPyBvcHRpb25zLmludmVyc2UodGhpcykgOiBvcHRpb25zLmZuKHRoaXMpO1xuICAgIH0pO1xuICAgIC8qIEVuZCBJZiBjb25kaXRpb25zIG9uIHByZWZlcmVuY2VzICovXG5cbiAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCd6ZXJvY2xpY2tfcHJlcCcsIGZ1bmN0aW9uKHplcm9JbmZvX3Jhdykge1xuICAgICAgICB2YXIgbiwgbmFtZSwgaXRlbSwgemVyb0luZm8gPSBbXTtcbiAgICAgICAgZm9yIChuID0gMDsgbiA8IFpFUk9fQ0xJQ0tfSU5GT19QUklPLmxlbmd0aDsgbisrKSB7XG4gICAgICAgICAgICBpdGVtID0gWkVST19DTElDS19JTkZPX1BSSU9bbl07XG4gICAgICAgICAgICBuYW1lID0gaXRlbVswXTtcbiAgICAgICAgICAgIGlmICh6ZXJvSW5mb19yYXdbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICB6ZXJvSW5mby5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgJ25hbWUnOiBuYW1lLFxuICAgICAgICAgICAgICAgICAgICAndmFsJzogemVyb0luZm9fcmF3W25hbWVdLFxuICAgICAgICAgICAgICAgICAgICAnaW1nJzogaXRlbVsxXVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHplcm9JbmZvX3JhdyA9IHplcm9JbmZvO1xuICAgICAgICByZXR1cm4gemVyb0luZm9fcmF3O1xuICAgIH0pO1xuXG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignY29udlJhdGVEaWdpdFNwbGl0JywgZnVuY3Rpb24gKHJhdGUpIHtcbiAgICAgICAgdmFyIHJlc3VsdCA9IFwiPHNwYW4gY2xhc3M9J2Nxei1jb252LXJhdGUnPlwiICtcbiAgICAgICAgICAgIHJhdGUuc3Vic3RyKDAsIHJhdGUubGVuZ3RoIC0gMikgK1xuICAgICAgICAgICAgXCI8c3BhbiBjbGFzcz0nY3F6LXJhdGUtbGFzdC1kaWdpdHMnPlwiICsgcmF0ZS5zdWJzdHIoLTIpICsgXCI8L3NwYW4+XCIgK1xuICAgICAgICAgICAgXCI8L3NwYW4+XCI7XG5cbiAgICAgICAgcmV0dXJuIG5ldyBIYW5kbGViYXJzLlNhZmVTdHJpbmcocmVzdWx0KTtcbiAgICB9KTtcblxuICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ251bWJlckZvcm1hdCcsIGZ1bmN0aW9uIChudW1iZXIpIHtcbiAgICAgICAgdHJ5IHsgLy9qdXN0IGluIGNhc2UgdGhpcyBoZWxwZXIgaXMgdXNlZCBvbiB1bnNhbml0ZXplZCBkYXRhIGZyb20gYmFja2VuZFxuICAgICAgICAgIG51bWJlciA9IHBhcnNlRmxvYXQobnVtYmVyKTtcbiAgICAgICAgICBudW1iZXIgPSBudW1iZXIudG9GaXhlZCgyKTtcbiAgICAgICAgICByZXR1cm4gcGFyc2VGbG9hdChudW1iZXIpLnRvTG9jYWxlU3RyaW5nKENsaXF6VXRpbHMuUFJFRkVSUkVEX0xBTkdVQUdFKTtcbiAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICByZXR1cm4gJydcbiAgICAgICAgfVxuICAgIH0pO1xuXG5cbiAgICAvKiBtb2JpbGUgaGVscGVycyAqL1xuICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoXCJkZWJ1Z1wiLCBmdW5jdGlvbihvcHRpb25hbFZhbHVlKSB7XG4gICAgICBjb25zb2xlLmxvZyhcIiVjIFRlbXBsYXRlIERhdGEgXCIgKyB0aGlzLnZlcnRpY2FsICsgXCIgXCIsXCJjb2xvcjojZmZmO2JhY2tncm91bmQ6Z3JlZW5cIix0aGlzKTtcbiAgICB9KTtcblxuXG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcihcInRyaW1OdW1iZXJzXCIsIGZ1bmN0aW9uKG51bWJlcikge1xuICAgICAgcmV0dXJuIE1hdGgucm91bmQobnVtYmVyKTtcbiAgICB9KTtcblxuXG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignY29udmVyc2F0aW9uc1RpbWUnLCBmdW5jdGlvbih0aW1lKSB7XG4gICAgICAgIHZhciBkID0gbmV3IERhdGUodGltZSk7XG4gICAgICAgIHZhciBob3VycyA9IGQuZ2V0SG91cnMoKTtcbiAgICAgICAgaG91cnMgPSBob3VycyA+IDkgPyBob3VycyA6ICcwJyArIGhvdXJzXG4gICAgICAgIHZhciBtaW51dGVzID0gZC5nZXRNaW51dGVzKCk7XG4gICAgICAgIG1pbnV0ZXMgPSBtaW51dGVzID4gOSA/IG1pbnV0ZXMgOiAnMCcgKyBtaW51dGVzXG4gICAgICAgIHZhciBmb3JtYXRlZERhdGUgPSBob3VycyArICc6JyArIG1pbnV0ZXM7XG4gICAgICAgIHJldHVybiBmb3JtYXRlZERhdGU7XG4gICAgfSk7XG5cbiAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCd1cmlFbmNvZGUnLCBmdW5jdGlvbih1cmlDb21wb25lbnQpIHtcbiAgICAgICAgcmV0dXJuIGVuY29kZVVSSUNvbXBvbmVudCh1cmlDb21wb25lbnQpO1xuICAgIH0pO1xuXG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcigndGltZU9yQ2FsY3VsYXRvcicsIGZ1bmN0aW9uKGV6VHlwZSkge1xuICAgICAgICBpZihlelR5cGU9PVwidGltZVwiKSB7XG4gICAgICAgICAgcmV0dXJuIEhhbmRsZWJhcnMuaGVscGVycy5sb2NhbChcInRpbWVcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIEhhbmRsZWJhcnMuaGVscGVycy5sb2NhbChcImNhbGN1bGF0b3JcIik7XG4gICAgICAgIH1cbiAgICB9KTtcblxuXG4gICAgSGFuZGxlYmFycy5yZWdpc3RlckhlbHBlcignaWZTaG93U2VhcmNoJywgZnVuY3Rpb24ocmVzdWx0cywgb3B0aW9ucykgeyAvLyBpZiBlcXVhbFxuICAgICAgaWYoIXJlc3VsdHNbMF0gfHwgcmVzdWx0c1swXS5kYXRhLnRlbXBsYXRlICE9PSBcIm5vUmVzdWx0XCIpIHtcbiAgICAgICAgcmV0dXJuIG9wdGlvbnMuZm4odGhpcyk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gb3B0aW9ucy5pbnZlcnNlKHRoaXMpO1xuICAgICAgfVxuICAgIH0pO1xuXG5cbiAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdtb2JpbGVXaWtpcGVkaWFVcmxzJywgZnVuY3Rpb24odXJsKSB7XG4gICAgICAgIHJldHVybiB1cmwucmVwbGFjZShcImh0dHA6Ly9kZS53aWtpcGVkaWEub3JnL3dpa2lcIixcImh0dHBzOi8vZGUubS53aWtpcGVkaWEub3JnL3dpa2lcIik7XG4gICAgfSk7XG5cbiAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdlYWNoSW5jbHVkZVBhcmVudCcsIGZ1bmN0aW9uICggY29udGV4dCwgb3B0aW9ucyApIHtcbiAgICAgICAgdmFyIGZuID0gb3B0aW9ucy5mbixcbiAgICAgICAgICAgIGludmVyc2UgPSBvcHRpb25zLmludmVyc2UsXG4gICAgICAgICAgICByZXQgPSBcIlwiLFxuICAgICAgICAgICAgX2NvbnRleHQgPSBbXTtcblxuICAgICAgICAkLmVhY2goY29udGV4dCwgZnVuY3Rpb24gKGluZGV4LCBvYmplY3QpIHtcbiAgICAgICAgICAgIHZhciBfb2JqZWN0ID0gJC5leHRlbmQoe30sIG9iamVjdCk7XG4gICAgICAgICAgICBfY29udGV4dC5wdXNoKF9vYmplY3QpO1xuICAgICAgICB9KTtcblxuICAgICAgICBpZiAoIF9jb250ZXh0ICYmIF9jb250ZXh0Lmxlbmd0aCA+IDAgKSB7XG4gICAgICAgICAgICBmb3IgKCB2YXIgaSA9IDAsIGogPSBfY29udGV4dC5sZW5ndGg7IGkgPCBqOyBpKysgKSB7XG4gICAgICAgICAgICAgICAgX2NvbnRleHRbaV1bXCJwYXJlbnRDb250ZXh0XCJdID0gb3B0aW9ucy5oYXNoLnBhcmVudDtcbiAgICAgICAgICAgICAgICByZXQgPSByZXQgKyBmbihfY29udGV4dFtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXQgPSBpbnZlcnNlKHRoaXMpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXQ7XG4gICAgfSk7XG5cbiAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdjb252ZXJzYXRpb25zVGltZScsIGZ1bmN0aW9uKHRpbWUpIHtcbiAgICAgICAgdmFyIGQgPSBuZXcgRGF0ZSh0aW1lKTtcbiAgICAgICAgdmFyIGhvdXJzID0gZC5nZXRIb3VycygpO1xuICAgICAgICBob3VycyA9IGhvdXJzID4gOSA/IGhvdXJzIDogJzAnICsgaG91cnNcbiAgICAgICAgdmFyIG1pbnV0ZXMgPSBkLmdldE1pbnV0ZXMoKTtcbiAgICAgICAgbWludXRlcyA9IG1pbnV0ZXMgPiA5ID8gbWludXRlcyA6ICcwJyArIG1pbnV0ZXNcbiAgICAgICAgdmFyIGZvcm1hdGVkRGF0ZSA9IGhvdXJzICsgJzonICsgbWludXRlcztcbiAgICAgICAgcmV0dXJuIGZvcm1hdGVkRGF0ZTtcbiAgICB9KTtcblxuICAgIEhhbmRsZWJhcnMucmVnaXN0ZXJIZWxwZXIoJ3NlbmRUZWxlbWV0cnknLCBmdW5jdGlvbihuUmVzdWx0cykge1xuICAgICAgQ2xpcXpVdGlscy50ZWxlbWV0cnkoe1xuICAgICAgICB0eXBlOiAnUmVzdWx0cyBSZW5kZXJlZCcsXG4gICAgICAgIG5SZXN1bHRzOiBuUmVzdWx0c1xuICAgICAgfSk7XG4gICAgfSk7XG5cbiAgICBIYW5kbGViYXJzLnJlZ2lzdGVySGVscGVyKCdnZW5lcmF0ZV9iYWNrZ3JvdW5kX2NvbG9yJywgZnVuY3Rpb24odXJsKSB7XG4gICAgICAgIHZhciB1cmxEZXRhaWxzID0gQ2xpcXpVdGlscy5nZXREZXRhaWxzRnJvbVVybCh1cmwpO1xuICAgICAgICB2YXIgbG9nb0RldGFpbHMgPSBDbGlxelV0aWxzLmdldExvZ29EZXRhaWxzKHVybERldGFpbHMpO1xuICAgICAgICByZXR1cm4gXCIjXCIgKyBsb2dvRGV0YWlscy5iYWNrZ3JvdW5kQ29sb3I7XG4gICAgfSk7XG59XG5cbmV4cG9ydCBkZWZhdWx0IENsaXF6SGFuZGxlYmFycztcbiJdfQ==