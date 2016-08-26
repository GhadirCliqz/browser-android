System.register('autocomplete/result', ['core/cliqz'], function (_export) {
    /*
     * This module acts as a result factory
     *
     */

    'use strict';

    var utils, Result;

    function log(msg) {}
    //utils.log(msg, 'Result.jsm');

    // returns the super type of a result - type to be consider for UI creation
    function getSuperType(result) {
        if (result.source == 'bm' && result.snippet && result.snippet.rich_data) {
            return utils.getKnownType(result.snippet.rich_data.superType) || // superType used for custom templates
            utils.getKnownType(result.snippet.rich_data.type) || // fallback result type
            'bm'; // backwards compatibility (most generic type, requires only url)
        }
        return null;
    }

    function combineSources(internal, cliqz) {
        // do not add extra sources to end of EZs
        if (internal == "cliqz-extra") return internal;

        var cliqz_sources = cliqz.substr(cliqz.indexOf('sources-'));
        return internal + " " + cliqz_sources;
    }

    return {
        setters: [function (_coreCliqz) {
            utils = _coreCliqz.utils;
        }],
        execute: function () {
            Result = {
                CLIQZR: 'cliqz-results',
                CLIQZC: 'cliqz-custom',
                CLIQZE: 'cliqz-extra',
                CLIQZCLUSTER: 'cliqz-cluster',
                CLIQZSERIES: 'cliqz-series',
                CLIQZICON: 'http://cliqz.com/favicon.ico',
                RULES: {
                    'video': [{ 'domain': 'youtube.com', 'ogtypes': ['video', 'youtube'] }, { 'domain': 'vimeo.com', 'ogtypes': ['video'] }, { 'domain': 'myvideo.de', 'ogtypes': ['video.tv_show', 'video.episode', 'video.other'] }, { 'domain': 'dailymotion.com', 'ogtypes': ['video'] }, { 'vertical': 'video' }],
                    'poster': [{ 'domain': 'imdb.com', 'ogtypes': ['video.tv_show', 'tv_show', 'movie', 'video.movie', 'game', 'video.episode', 'actor', 'public_figure'] }],
                    'person': [{ 'domain': 'xing.com', 'ogtypes': ['profile'] }, { 'vertical': 'people' }],
                    'hq': [{ 'vertical': 'hq' }],
                    'news': [{ 'vertical': 'news' }],
                    'shopping': [{ 'vertical': 'shopping' }]
                },
                generic: function generic(style, value, image, comment, label, query, data, subtype) {
                    //try to show host name if no title (comment) is provided
                    if (style.indexOf(Result.CLIQZC) === -1 // is not a custom search
                     && (!comment || value == comment) // no comment(page title) or comment is exactly the url
                     && utils.isCompleteUrl(value)) {
                        // looks like an url
                        var host = utils.getDetailsFromUrl(value).name;
                        if (host && host.length > 0) {
                            comment = host[0].toUpperCase() + host.slice(1);
                        }
                    }
                    if (!comment) {
                        comment = value;
                    }

                    data = data || {};
                    data.kind = [utils.encodeResultType(style) + (subtype ? '|' + subtype : '')];

                    var item = {
                        style: style,
                        val: value,
                        comment: comment,
                        label: label || value,
                        query: query,
                        data: data
                    };
                    return item;
                },
                cliqz: function cliqz(result) {
                    var resStyle = Result.CLIQZR + ' sources-' + utils.encodeSources(getSuperType(result) || result.source).join('');

                    if (result.snippet) {
                        return Result.generic(resStyle, //style
                        result.url, //value
                        null, //image -> favico
                        result.snippet.title, null, //label
                        result.q, //query
                        Result.getData(result), result.subType);
                    } else {
                        return Result.generic(resStyle, result.url, null, null, null, result.q, null, result.subType);
                    }
                },
                cliqzExtra: function cliqzExtra(result, snippet) {
                    result.data.subType = result.subType;
                    result.data.trigger_urls = result.trigger_urls;
                    result.data.ts = result.ts;

                    return Result.generic(Result.CLIQZE, //style
                    result.url, //value
                    null, //image -> favico
                    result.data.title, null, //label
                    result.q, //query
                    result.data, result.subType);
                },
                // Combine two results into a new result
                combine: function combine(first, second) {
                    var ret = Result.clone(first);
                    ret.style = combineSources(ret.style, second.style);
                    ret.data.kind = (ret.data.kind || []).concat(second.data.kind || []);

                    // copy over description, title and url list, if needed
                    if (second.data.description && !ret.data.description) ret.data.description = second.data.description;
                    if (second.data.title && !ret.data.title) // title
                        ret.data.title = second.data.title;
                    if (second.data.urls && !ret.data.urls) // history url list
                        ret.data.urls = second.data.urls;

                    return ret;
                },
                // not really cloning the object !!!
                clone: function clone(entry) {
                    var ret = Result.generic(entry.style, entry.val, null, entry.comment, entry.label, entry.query, null);
                    ret.data = JSON.parse(JSON.stringify(entry.data)); // nasty way of cloning an object
                    if (entry.autocompleted) ret.autocompleted = true;
                    return ret;
                },
                // check if a result should be kept in final result list
                isValid: function isValid(url, urlparts) {

                    // Google Filters
                    if (urlparts.name.toLowerCase() == "google" && urlparts.subdomains.length > 0 && urlparts.subdomains[0].toLowerCase() == "www" && (urlparts.extra.indexOf("/search") != -1 || // "/search?" for regular SERPS and ".*/search/.*" for maps
                    urlparts.extra.indexOf("/url?") == 0 || // www.google.*/url? - for redirects
                    urlparts.extra.indexOf("q=") != -1)) {
                        // for instant search results
                        log("Discarding result page from history: " + url);
                        return false;
                    }
                    // Bing Filters
                    // Filter all like:
                    //    www.bing.com/search?
                    if (urlparts.name.toLowerCase() == "bing" && urlparts.extra.indexOf("q=") != -1) {
                        log("Discarding result page from history: " + url);
                        return false;
                    }
                    // Yahoo filters
                    // Filter all like:
                    //   search.yahoo.com/search
                    //   *.search.yahooo.com/search - for international 'de.search.yahoo.com'
                    //   r.search.yahoo.com - for redirects 'r.search.yahoo.com'
                    if (urlparts.name.toLowerCase() == "yahoo" && (urlparts.subdomains.length == 1 && urlparts.subdomains[0].toLowerCase() == "search" && urlparts.path.indexOf("/search") == 0 || urlparts.subdomains.length == 2 && urlparts.subdomains[1].toLowerCase() == "search" && urlparts.path.indexOf("/search") == 0 || urlparts.subdomains.length == 2 && urlparts.subdomains[0].toLowerCase() == "r" && urlparts.subdomains[1].toLowerCase() == "search")) {
                        log("Discarding result page from history: " + url);
                        return false;
                    }

                    // Ignore bitly redirections
                    if (url.search(/http(s?):\/\/bit\.ly\/.*/i) === 0) {
                        log("Discarding result page from history: " + url);
                        return false;
                    }

                    // Ignore Twitter redirections
                    if (url.search(/http(s?):\/\/t\.co\/.*/i) === 0) {
                        log("Discarding result page from history: " + url);
                        return false;
                    }

                    return true;
                },
                // rich data and image
                getData: function getData(result) {
                    //TODO: rethink the whole image filtering
                    if (!result.snippet) return;

                    var urlparts = utils.getDetailsFromUrl(result.url),
                        resp = {
                        richData: result.snippet.rich_data,
                        adult: result.snippet.adult || false,
                        media: result.snippet.media
                    },
                        source = getSuperType(result) || result.source;

                    resp.type = "other";
                    for (var type in Result.RULES) {
                        var rules = Result.RULES[type];

                        for (var rule_i in rules) {
                            var rule = rules[rule_i];
                            if (rule.domain && urlparts.host.indexOf(rule.domain) != -1) for (var ogtype in rule.ogtypes || []) if (result.snippet && result.snippet.og && result.snippet.og.type == rule.ogtypes[ogtype]) resp.type = type;

                            var verticals = source.split(',');
                            for (var v in verticals) {
                                if (verticals[v].trim() == rule.vertical) resp.type = type;
                            }
                        }

                        var snip = result.snippet;
                        resp.description = snip && (snip.desc || snip.snippet || snip.og && snip.og.description);
                        resp.title = result.snippet.title;
                        // mobile specific url
                        resp.mobile_url = snip.amp_url || snip.m_url;

                        var ogT = snip && snip.og ? snip.og.type : null,
                            imgT = snip && snip.image ? snip.image.type : null;

                        if (resp.type != 'other' || ogT == 'cliqz' || imgT == 'cliqz') resp.image = Result.getVerticalImage(result.snippet.image, result.snippet.rich_data) || Result.getOgImage(result.snippet.og);
                    }

                    return resp;
                },
                getOgImage: function getOgImage(og) {
                    if (og && og.image) {
                        var image = { src: og.image };

                        if (og.duration && parseInt(og.duration)) {
                            var parsedDuration = Result.tryGetImageDuration(og.duration);
                            if (parsedDuration) image.duration = parsedDuration;
                        }

                        return image;
                    }
                },
                getVerticalImage: function getVerticalImage(imageData, richData) {
                    if (imageData == undefined || imageData.src == undefined) return;

                    var image = {
                        src: imageData.src
                    };

                    if (imageData.width) image.width = imageData.width;
                    if (imageData.height) image.height = imageData.height;
                    if (imageData.ratio) image.ratio = imageData.ratio;

                    // add duration from rich data
                    if (richData && richData.duration) {
                        var parsedDuration = Result.tryGetImageDuration(richData.duration);
                        if (parsedDuration) image.duration = parsedDuration;
                    }

                    return image;
                },
                tryGetImageDuration: function tryGetImageDuration(duration) {
                    try {
                        var totalSeconds = parseInt(duration),
                            min = Math.floor(totalSeconds / 60),
                            seconds = totalSeconds % 60;
                        return min + ':' + (seconds < 10 ? '0' + seconds : seconds);
                    } catch (e) {}

                    return undefined;
                }
            };

            _export('default', Result);
        }
    };
});
//# sourceMappingURL=data:application/json;base64,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QWMsRUFBRSxLQUFLLENBQUMsUUFBUSxHQUFHLGNBQWMsQ0FBQztxQkFDdEQ7O0FBRUQsMkJBQU8sS0FBSyxDQUFBO2lCQUNmO0FBQ0QsbUNBQW1CLEVBQUUsNkJBQVMsUUFBUSxFQUFDO0FBQ25DLHdCQUFJO0FBQ0EsNEJBQUksWUFBWSxHQUFHLFFBQVEsQ0FBQyxRQUFRLENBQUM7NEJBQ2pDLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFlBQVksR0FBQyxFQUFFLENBQUM7NEJBQ2pDLE9BQU8sR0FBRyxZQUFZLEdBQUMsRUFBRSxDQUFDO0FBQzlCLCtCQUFPLEdBQUcsR0FBRyxHQUFHLElBQUksT0FBTyxHQUFHLEVBQUUsR0FBRyxHQUFHLEdBQUcsT0FBTyxHQUFHLE9BQU8sQ0FBQSxBQUFDLENBQUM7cUJBQy9ELENBQ0QsT0FBTSxDQUFDLEVBQUMsRUFBRTs7QUFFViwyQkFBTyxTQUFTLENBQUM7aUJBQ3BCO2FBQ0o7OytCQUVjLE1BQU0iLCJmaWxlIjoiYXV0b2NvbXBsZXRlL3Jlc3VsdC5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBUaGlzIG1vZHVsZSBhY3RzIGFzIGEgcmVzdWx0IGZhY3RvcnlcbiAqXG4gKi9cblxuaW1wb3J0IHsgdXRpbHMgfSBmcm9tIFwiY29yZS9jbGlxelwiO1xuXG5mdW5jdGlvbiBsb2cobXNnKXtcbiAgICAvL3V0aWxzLmxvZyhtc2csICdSZXN1bHQuanNtJyk7XG59XG5cbi8vIHJldHVybnMgdGhlIHN1cGVyIHR5cGUgb2YgYSByZXN1bHQgLSB0eXBlIHRvIGJlIGNvbnNpZGVyIGZvciBVSSBjcmVhdGlvblxuZnVuY3Rpb24gZ2V0U3VwZXJUeXBlKHJlc3VsdCl7XG4gICAgaWYocmVzdWx0LnNvdXJjZSA9PSAnYm0nICYmIHJlc3VsdC5zbmlwcGV0ICYmIHJlc3VsdC5zbmlwcGV0LnJpY2hfZGF0YSl7XG4gICAgICAgIHJldHVybiB1dGlscy5nZXRLbm93blR5cGUocmVzdWx0LnNuaXBwZXQucmljaF9kYXRhLnN1cGVyVHlwZSkgfHwgLy8gc3VwZXJUeXBlIHVzZWQgZm9yIGN1c3RvbSB0ZW1wbGF0ZXNcbiAgICAgICAgICAgICAgIHV0aWxzLmdldEtub3duVHlwZShyZXN1bHQuc25pcHBldC5yaWNoX2RhdGEudHlwZSkgICAgICB8fCAvLyBmYWxsYmFjayByZXN1bHQgdHlwZVxuICAgICAgICAgICAgICAgJ2JtJzsgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGJhY2t3YXJkcyBjb21wYXRpYmlsaXR5IChtb3N0IGdlbmVyaWMgdHlwZSwgcmVxdWlyZXMgb25seSB1cmwpXG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuXG5mdW5jdGlvbiBjb21iaW5lU291cmNlcyhpbnRlcm5hbCwgY2xpcXope1xuICAvLyBkbyBub3QgYWRkIGV4dHJhIHNvdXJjZXMgdG8gZW5kIG9mIEVac1xuICBpZihpbnRlcm5hbCA9PSBcImNsaXF6LWV4dHJhXCIpXG4gICAgcmV0dXJuIGludGVybmFsO1xuXG4gIHZhciBjbGlxel9zb3VyY2VzID0gY2xpcXouc3Vic3RyKGNsaXF6LmluZGV4T2YoJ3NvdXJjZXMtJykpXG4gIHJldHVybiBpbnRlcm5hbCArIFwiIFwiICsgY2xpcXpfc291cmNlc1xufVxuXG52YXIgUmVzdWx0ID0ge1xuICAgIENMSVFaUjogJ2NsaXF6LXJlc3VsdHMnLFxuICAgIENMSVFaQzogJ2NsaXF6LWN1c3RvbScsXG4gICAgQ0xJUVpFOiAnY2xpcXotZXh0cmEnLFxuICAgIENMSVFaQ0xVU1RFUjogJ2NsaXF6LWNsdXN0ZXInLFxuICAgIENMSVFaU0VSSUVTOiAnY2xpcXotc2VyaWVzJyxcbiAgICBDTElRWklDT046ICdodHRwOi8vY2xpcXouY29tL2Zhdmljb24uaWNvJyxcbiAgICBSVUxFUzoge1xuICAgICAgICAndmlkZW8nOiBbXG4gICAgICAgICAgICB7ICdkb21haW4nOiAneW91dHViZS5jb20nLCAnb2d0eXBlcyc6IFsndmlkZW8nLCAneW91dHViZSddIH0sXG4gICAgICAgICAgICB7ICdkb21haW4nOiAndmltZW8uY29tJywgJ29ndHlwZXMnOiBbJ3ZpZGVvJ10gfSxcbiAgICAgICAgICAgIHsgJ2RvbWFpbic6ICdteXZpZGVvLmRlJywgJ29ndHlwZXMnOiBbJ3ZpZGVvLnR2X3Nob3cnLCAndmlkZW8uZXBpc29kZScsICd2aWRlby5vdGhlciddIH0sXG4gICAgICAgICAgICB7ICdkb21haW4nOiAnZGFpbHltb3Rpb24uY29tJywgJ29ndHlwZXMnOiBbJ3ZpZGVvJ10gfSxcbiAgICAgICAgICAgIHsgJ3ZlcnRpY2FsJzogJ3ZpZGVvJyB9XG4gICAgICAgIF0sXG4gICAgICAgICdwb3N0ZXInOiBbXG4gICAgICAgICAgICB7ICdkb21haW4nOiAnaW1kYi5jb20nLCAnb2d0eXBlcyc6IFsndmlkZW8udHZfc2hvdycsICd0dl9zaG93JywgJ21vdmllJywgJ3ZpZGVvLm1vdmllJywgJ2dhbWUnLCAndmlkZW8uZXBpc29kZScsICdhY3RvcicsICdwdWJsaWNfZmlndXJlJ10gfVxuICAgICAgICBdLFxuICAgICAgICAncGVyc29uJzogW1xuICAgICAgICAgICAgeyAnZG9tYWluJzogJ3hpbmcuY29tJywgJ29ndHlwZXMnOiBbICdwcm9maWxlJ10gfSxcbiAgICAgICAgICAgIHsgJ3ZlcnRpY2FsJzogJ3Blb3BsZScgfVxuICAgICAgICBdLFxuICAgICAgICAnaHEnOiBbXG4gICAgICAgICAgICB7ICd2ZXJ0aWNhbCc6ICdocSd9XG4gICAgICAgIF0sXG4gICAgICAgICduZXdzJzogW1xuICAgICAgICAgICAgeyAndmVydGljYWwnOiAnbmV3cyd9XG4gICAgICAgIF0sXG4gICAgICAgICdzaG9wcGluZyc6IFtcbiAgICAgICAgICAgIHsgJ3ZlcnRpY2FsJzogJ3Nob3BwaW5nJ31cbiAgICAgICAgXVxuICAgIH0sXG5cdGdlbmVyaWM6IGZ1bmN0aW9uKHN0eWxlLCB2YWx1ZSwgaW1hZ2UsIGNvbW1lbnQsIGxhYmVsLCBxdWVyeSwgZGF0YSwgc3VidHlwZSl7XG4gICAgICAgIC8vdHJ5IHRvIHNob3cgaG9zdCBuYW1lIGlmIG5vIHRpdGxlIChjb21tZW50KSBpcyBwcm92aWRlZFxuICAgICAgICBpZihzdHlsZS5pbmRleE9mKFJlc3VsdC5DTElRWkMpID09PSAtMSAgICAgICAvLyBpcyBub3QgYSBjdXN0b20gc2VhcmNoXG4gICAgICAgICAgICYmICghY29tbWVudCB8fCB2YWx1ZSA9PSBjb21tZW50KSAgIC8vIG5vIGNvbW1lbnQocGFnZSB0aXRsZSkgb3IgY29tbWVudCBpcyBleGFjdGx5IHRoZSB1cmxcbiAgICAgICAgICAgJiYgdXRpbHMuaXNDb21wbGV0ZVVybCh2YWx1ZSkpeyAgICAgICAvLyBsb29rcyBsaWtlIGFuIHVybFxuICAgICAgICAgICAgdmFyIGhvc3QgPSB1dGlscy5nZXREZXRhaWxzRnJvbVVybCh2YWx1ZSkubmFtZTtcbiAgICAgICAgICAgIGlmKGhvc3QgJiYgaG9zdC5sZW5ndGg+MCl7XG4gICAgICAgICAgICAgICAgY29tbWVudCA9IGhvc3RbMF0udG9VcHBlckNhc2UoKSArIGhvc3Quc2xpY2UoMSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgaWYoIWNvbW1lbnQpe1xuICAgICAgICAgICAgY29tbWVudCA9IHZhbHVlO1xuICAgICAgICB9XG5cbiAgICAgICAgZGF0YSA9IGRhdGEgfHwge307XG4gICAgICAgIGRhdGEua2luZCA9IFt1dGlscy5lbmNvZGVSZXN1bHRUeXBlKHN0eWxlKSArIChzdWJ0eXBlPyAnfCcgKyBzdWJ0eXBlIDogJycpXTtcblxuICAgICAgICB2YXIgaXRlbSA9IHtcbiAgICAgICAgICAgIHN0eWxlOiBzdHlsZSxcbiAgICAgICAgICAgIHZhbDogdmFsdWUsXG4gICAgICAgICAgICBjb21tZW50OiBjb21tZW50LFxuICAgICAgICAgICAgbGFiZWw6IGxhYmVsIHx8IHZhbHVlLFxuICAgICAgICAgICAgcXVlcnk6IHF1ZXJ5LFxuICAgICAgICAgICAgZGF0YTogZGF0YVxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gaXRlbTtcbiAgICB9LFxuICAgIGNsaXF6OiBmdW5jdGlvbihyZXN1bHQpe1xuICAgICAgICB2YXIgcmVzU3R5bGUgPSBSZXN1bHQuQ0xJUVpSICsgJyBzb3VyY2VzLScgKyB1dGlscy5lbmNvZGVTb3VyY2VzKGdldFN1cGVyVHlwZShyZXN1bHQpIHx8IHJlc3VsdC5zb3VyY2UpLmpvaW4oJycpO1xuXG4gICAgICAgIGlmKHJlc3VsdC5zbmlwcGV0KXtcbiAgICAgICAgICAgIHJldHVybiBSZXN1bHQuZ2VuZXJpYyhcbiAgICAgICAgICAgICAgICByZXNTdHlsZSwgLy9zdHlsZVxuICAgICAgICAgICAgICAgIHJlc3VsdC51cmwsIC8vdmFsdWVcbiAgICAgICAgICAgICAgICBudWxsLCAvL2ltYWdlIC0+IGZhdmljb1xuICAgICAgICAgICAgICAgIHJlc3VsdC5zbmlwcGV0LnRpdGxlLFxuICAgICAgICAgICAgICAgIG51bGwsIC8vbGFiZWxcbiAgICAgICAgICAgICAgICByZXN1bHQucSwgLy9xdWVyeVxuICAgICAgICAgICAgICAgIFJlc3VsdC5nZXREYXRhKHJlc3VsdCksXG4gICAgICAgICAgICAgICAgcmVzdWx0LnN1YlR5cGVcbiAgICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gUmVzdWx0LmdlbmVyaWMocmVzU3R5bGUsIHJlc3VsdC51cmwsIG51bGwsIG51bGwsIG51bGwsIHJlc3VsdC5xLCBudWxsLCByZXN1bHQuc3ViVHlwZSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNsaXF6RXh0cmE6IGZ1bmN0aW9uKHJlc3VsdCwgc25pcHBldCl7XG4gICAgICAgIHJlc3VsdC5kYXRhLnN1YlR5cGUgPSByZXN1bHQuc3ViVHlwZTtcbiAgICAgICAgcmVzdWx0LmRhdGEudHJpZ2dlcl91cmxzID0gcmVzdWx0LnRyaWdnZXJfdXJscztcbiAgICAgICAgcmVzdWx0LmRhdGEudHMgPSByZXN1bHQudHM7XG5cbiAgICAgICAgcmV0dXJuIFJlc3VsdC5nZW5lcmljKFxuICAgICAgICAgICAgUmVzdWx0LkNMSVFaRSwgLy9zdHlsZVxuICAgICAgICAgICAgcmVzdWx0LnVybCwgLy92YWx1ZVxuICAgICAgICAgICAgbnVsbCwgLy9pbWFnZSAtPiBmYXZpY29cbiAgICAgICAgICAgIHJlc3VsdC5kYXRhLnRpdGxlLFxuICAgICAgICAgICAgbnVsbCwgLy9sYWJlbFxuICAgICAgICAgICAgcmVzdWx0LnEsIC8vcXVlcnlcbiAgICAgICAgICAgIHJlc3VsdC5kYXRhLFxuICAgICAgICAgICAgcmVzdWx0LnN1YlR5cGVcbiAgICAgICAgKTtcbiAgICB9LFxuICAgIC8vIENvbWJpbmUgdHdvIHJlc3VsdHMgaW50byBhIG5ldyByZXN1bHRcbiAgICBjb21iaW5lOiBmdW5jdGlvbihmaXJzdCwgc2Vjb25kKSB7XG4gICAgICAgIHZhciByZXQgPSBSZXN1bHQuY2xvbmUoZmlyc3QpO1xuICAgICAgICByZXQuc3R5bGUgPSBjb21iaW5lU291cmNlcyhyZXQuc3R5bGUsIHNlY29uZC5zdHlsZSk7XG4gICAgICAgIHJldC5kYXRhLmtpbmQgPSAocmV0LmRhdGEua2luZCB8fCBbXSkuY29uY2F0KHNlY29uZC5kYXRhLmtpbmQgfHwgW10pO1xuXG4gICAgICAgIC8vIGNvcHkgb3ZlciBkZXNjcmlwdGlvbiwgdGl0bGUgYW5kIHVybCBsaXN0LCBpZiBuZWVkZWRcbiAgICAgICAgaWYoc2Vjb25kLmRhdGEuZGVzY3JpcHRpb24gJiYgIXJldC5kYXRhLmRlc2NyaXB0aW9uKVxuICAgICAgICAgICAgcmV0LmRhdGEuZGVzY3JpcHRpb24gPSBzZWNvbmQuZGF0YS5kZXNjcmlwdGlvbjtcbiAgICAgICAgaWYoc2Vjb25kLmRhdGEudGl0bGUgJiYgIXJldC5kYXRhLnRpdGxlKSAvLyB0aXRsZVxuICAgICAgICAgICAgcmV0LmRhdGEudGl0bGUgPSBzZWNvbmQuZGF0YS50aXRsZTtcbiAgICAgICAgaWYoc2Vjb25kLmRhdGEudXJscyAmJiAhcmV0LmRhdGEudXJscykgLy8gaGlzdG9yeSB1cmwgbGlzdFxuICAgICAgICAgICAgcmV0LmRhdGEudXJscyA9IHNlY29uZC5kYXRhLnVybHM7XG5cbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuICAgIC8vIG5vdCByZWFsbHkgY2xvbmluZyB0aGUgb2JqZWN0ICEhIVxuICAgIGNsb25lOiBmdW5jdGlvbihlbnRyeSkge1xuICAgICAgICB2YXIgcmV0ID0gUmVzdWx0LmdlbmVyaWMoZW50cnkuc3R5bGUsIGVudHJ5LnZhbCwgbnVsbCwgZW50cnkuY29tbWVudCwgZW50cnkubGFiZWwsIGVudHJ5LnF1ZXJ5LCBudWxsKTtcbiAgICAgICAgcmV0LmRhdGEgPSBKU09OLnBhcnNlKEpTT04uc3RyaW5naWZ5KGVudHJ5LmRhdGEpKTsgLy8gbmFzdHkgd2F5IG9mIGNsb25pbmcgYW4gb2JqZWN0XG4gICAgICAgIGlmKGVudHJ5LmF1dG9jb21wbGV0ZWQpIHJldC5hdXRvY29tcGxldGVkID0gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIHJldDtcbiAgICB9LFxuICAgIC8vIGNoZWNrIGlmIGEgcmVzdWx0IHNob3VsZCBiZSBrZXB0IGluIGZpbmFsIHJlc3VsdCBsaXN0XG4gICAgaXNWYWxpZDogZnVuY3Rpb24gKHVybCwgdXJscGFydHMpIHtcblxuICAgICAgICAvLyBHb29nbGUgRmlsdGVyc1xuICAgICAgICBpZih1cmxwYXJ0cy5uYW1lLnRvTG93ZXJDYXNlKCkgPT0gXCJnb29nbGVcIiAmJlxuICAgICAgICAgICB1cmxwYXJ0cy5zdWJkb21haW5zLmxlbmd0aCA+IDAgJiYgdXJscGFydHMuc3ViZG9tYWluc1swXS50b0xvd2VyQ2FzZSgpID09IFwid3d3XCIgJiZcbiAgICAgICAgICAgKHVybHBhcnRzLmV4dHJhLmluZGV4T2YoXCIvc2VhcmNoXCIpICE9IC0xIHx8IC8vIFwiL3NlYXJjaD9cIiBmb3IgcmVndWxhciBTRVJQUyBhbmQgXCIuKi9zZWFyY2gvLipcIiBmb3IgbWFwc1xuICAgICAgICAgICAgdXJscGFydHMuZXh0cmEuaW5kZXhPZihcIi91cmw/XCIpID09IDAgfHwgICAgLy8gd3d3Lmdvb2dsZS4qL3VybD8gLSBmb3IgcmVkaXJlY3RzXG4gICAgICAgICAgICB1cmxwYXJ0cy5leHRyYS5pbmRleE9mKFwicT1cIikgIT0gLTEgKSkgeyAgICAvLyBmb3IgaW5zdGFudCBzZWFyY2ggcmVzdWx0c1xuICAgICAgICAgICAgbG9nKFwiRGlzY2FyZGluZyByZXN1bHQgcGFnZSBmcm9tIGhpc3Rvcnk6IFwiICsgdXJsKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIC8vIEJpbmcgRmlsdGVyc1xuICAgICAgICAvLyBGaWx0ZXIgYWxsIGxpa2U6XG4gICAgICAgIC8vICAgIHd3dy5iaW5nLmNvbS9zZWFyY2g/XG4gICAgICAgIGlmKHVybHBhcnRzLm5hbWUudG9Mb3dlckNhc2UoKSA9PSBcImJpbmdcIiAmJiB1cmxwYXJ0cy5leHRyYS5pbmRleE9mKFwicT1cIikgIT0gLTEpIHtcbiAgICAgICAgICAgIGxvZyhcIkRpc2NhcmRpbmcgcmVzdWx0IHBhZ2UgZnJvbSBoaXN0b3J5OiBcIiArIHVybClcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBZYWhvbyBmaWx0ZXJzXG4gICAgICAgIC8vIEZpbHRlciBhbGwgbGlrZTpcbiAgICAgICAgLy8gICBzZWFyY2gueWFob28uY29tL3NlYXJjaFxuICAgICAgICAvLyAgICouc2VhcmNoLnlhaG9vby5jb20vc2VhcmNoIC0gZm9yIGludGVybmF0aW9uYWwgJ2RlLnNlYXJjaC55YWhvby5jb20nXG4gICAgICAgIC8vICAgci5zZWFyY2gueWFob28uY29tIC0gZm9yIHJlZGlyZWN0cyAnci5zZWFyY2gueWFob28uY29tJ1xuICAgICAgICBpZih1cmxwYXJ0cy5uYW1lLnRvTG93ZXJDYXNlKCkgPT0gXCJ5YWhvb1wiICYmXG4gICAgICAgICAgICgodXJscGFydHMuc3ViZG9tYWlucy5sZW5ndGggPT0gMSAmJiB1cmxwYXJ0cy5zdWJkb21haW5zWzBdLnRvTG93ZXJDYXNlKCkgPT0gXCJzZWFyY2hcIiAmJiB1cmxwYXJ0cy5wYXRoLmluZGV4T2YoXCIvc2VhcmNoXCIpID09IDApIHx8XG4gICAgICAgICAgICAodXJscGFydHMuc3ViZG9tYWlucy5sZW5ndGggPT0gMiAmJiB1cmxwYXJ0cy5zdWJkb21haW5zWzFdLnRvTG93ZXJDYXNlKCkgPT0gXCJzZWFyY2hcIiAmJiB1cmxwYXJ0cy5wYXRoLmluZGV4T2YoXCIvc2VhcmNoXCIpID09IDApIHx8XG4gICAgICAgICAgICAodXJscGFydHMuc3ViZG9tYWlucy5sZW5ndGggPT0gMiAmJiB1cmxwYXJ0cy5zdWJkb21haW5zWzBdLnRvTG93ZXJDYXNlKCkgPT0gXCJyXCIgJiYgdXJscGFydHMuc3ViZG9tYWluc1sxXS50b0xvd2VyQ2FzZSgpID09IFwic2VhcmNoXCIpKSkge1xuICAgICAgICAgICAgbG9nKFwiRGlzY2FyZGluZyByZXN1bHQgcGFnZSBmcm9tIGhpc3Rvcnk6IFwiICsgdXJsKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWdub3JlIGJpdGx5IHJlZGlyZWN0aW9uc1xuICAgICAgICBpZiAodXJsLnNlYXJjaCgvaHR0cChzPyk6XFwvXFwvYml0XFwubHlcXC8uKi9pKSA9PT0gMCkge1xuICAgICAgICAgICAgbG9nKFwiRGlzY2FyZGluZyByZXN1bHQgcGFnZSBmcm9tIGhpc3Rvcnk6IFwiICsgdXJsKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSWdub3JlIFR3aXR0ZXIgcmVkaXJlY3Rpb25zXG4gICAgICAgIGlmICh1cmwuc2VhcmNoKC9odHRwKHM/KTpcXC9cXC90XFwuY29cXC8uKi9pKSA9PT0gMCkge1xuICAgICAgICAgICAgbG9nKFwiRGlzY2FyZGluZyByZXN1bHQgcGFnZSBmcm9tIGhpc3Rvcnk6IFwiICsgdXJsKVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfSxcbiAgICAvLyByaWNoIGRhdGEgYW5kIGltYWdlXG4gICAgZ2V0RGF0YTogZnVuY3Rpb24ocmVzdWx0KXtcbiAgICAgICAgLy9UT0RPOiByZXRoaW5rIHRoZSB3aG9sZSBpbWFnZSBmaWx0ZXJpbmdcbiAgICAgICAgaWYoIXJlc3VsdC5zbmlwcGV0KVxuICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgIHZhciB1cmxwYXJ0cyA9IHV0aWxzLmdldERldGFpbHNGcm9tVXJsKHJlc3VsdC51cmwpLFxuICAgICAgICAgICAgcmVzcCA9IHtcbiAgICAgICAgICAgICAgICByaWNoRGF0YTogcmVzdWx0LnNuaXBwZXQucmljaF9kYXRhLFxuICAgICAgICAgICAgICAgIGFkdWx0OiByZXN1bHQuc25pcHBldC5hZHVsdCB8fCBmYWxzZSxcbiAgICAgICAgICAgICAgICBtZWRpYTogcmVzdWx0LnNuaXBwZXQubWVkaWFcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzb3VyY2UgPSBnZXRTdXBlclR5cGUocmVzdWx0KSB8fCByZXN1bHQuc291cmNlO1xuXG4gICAgICAgIHJlc3AudHlwZSA9IFwib3RoZXJcIjtcbiAgICAgICAgZm9yKHZhciB0eXBlIGluIFJlc3VsdC5SVUxFUyl7XG4gICAgICAgICAgICB2YXIgcnVsZXMgPSBSZXN1bHQuUlVMRVNbdHlwZV07XG5cbiAgICAgICAgICAgIGZvcih2YXIgcnVsZV9pIGluIHJ1bGVzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHJ1bGUgPSBydWxlc1tydWxlX2ldO1xuICAgICAgICAgICAgICAgIGlmKHJ1bGUuZG9tYWluICYmIHVybHBhcnRzLmhvc3QuaW5kZXhPZihydWxlLmRvbWFpbikgIT0gLTEpXG4gICAgICAgICAgICAgICAgICAgIGZvcih2YXIgb2d0eXBlIGluIChydWxlLm9ndHlwZXMgfHwgW10pKVxuICAgICAgICAgICAgICAgICAgICAgICAgaWYocmVzdWx0LnNuaXBwZXQgJiYgcmVzdWx0LnNuaXBwZXQub2cgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3VsdC5zbmlwcGV0Lm9nLnR5cGUgPT0gcnVsZS5vZ3R5cGVzW29ndHlwZV0pXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlc3AudHlwZSA9IHR5cGU7XG5cbiAgICAgICAgICAgICAgICB2YXIgdmVydGljYWxzID0gc291cmNlLnNwbGl0KCcsJyk7XG4gICAgICAgICAgICAgICAgZm9yKHZhciB2IGluIHZlcnRpY2Fscyl7XG4gICAgICAgICAgICAgICAgICAgIGlmKHZlcnRpY2Fsc1t2XS50cmltKCkgPT0gcnVsZS52ZXJ0aWNhbClcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlc3AudHlwZSA9IHR5cGU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG5cbiAgICAgICAgdmFyIHNuaXAgPSByZXN1bHQuc25pcHBldDtcbiAgICAgICAgcmVzcC5kZXNjcmlwdGlvbiA9IHNuaXAgJiYgKHNuaXAuZGVzYyB8fCBzbmlwLnNuaXBwZXQgfHwgKHNuaXAub2cgJiYgc25pcC5vZy5kZXNjcmlwdGlvbikpO1xuICAgICAgICByZXNwLnRpdGxlID0gcmVzdWx0LnNuaXBwZXQudGl0bGU7XG4gICAgICAgIC8vIG1vYmlsZSBzcGVjaWZpYyB1cmxcbiAgICAgICAgcmVzcC5tb2JpbGVfdXJsID0gc25pcC5hbXBfdXJsIHx8IHNuaXAubV91cmw7XG5cbiAgICAgICAgdmFyIG9nVCA9IHNuaXAgJiYgc25pcC5vZz8gc25pcC5vZy50eXBlOiBudWxsLFxuICAgICAgICAgICAgaW1nVCA9IHNuaXAgJiYgc25pcC5pbWFnZT8gc25pcC5pbWFnZS50eXBlOiBudWxsO1xuXG4gICAgICAgIGlmKHJlc3AudHlwZSAhPSAnb3RoZXInIHx8IG9nVCA9PSAnY2xpcXonIHx8IGltZ1QgPT0gJ2NsaXF6JylcbiAgICAgICAgICAgIHJlc3AuaW1hZ2UgPSBSZXN1bHQuZ2V0VmVydGljYWxJbWFnZShyZXN1bHQuc25pcHBldC5pbWFnZSwgcmVzdWx0LnNuaXBwZXQucmljaF9kYXRhKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgIFJlc3VsdC5nZXRPZ0ltYWdlKHJlc3VsdC5zbmlwcGV0Lm9nKVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHJlc3A7XG4gICAgfSxcbiAgICBnZXRPZ0ltYWdlOiBmdW5jdGlvbihvZykge1xuICAgICAgICBpZihvZyAmJiBvZy5pbWFnZSl7XG4gICAgICAgICAgICB2YXIgaW1hZ2UgPSB7IHNyYzogb2cuaW1hZ2UgfTtcblxuICAgICAgICAgICAgaWYob2cuZHVyYXRpb24gJiYgcGFyc2VJbnQob2cuZHVyYXRpb24pKXtcbiAgICAgICAgICAgICAgICB2YXIgcGFyc2VkRHVyYXRpb24gPSBSZXN1bHQudHJ5R2V0SW1hZ2VEdXJhdGlvbihvZy5kdXJhdGlvbilcbiAgICAgICAgICAgICAgICBpZihwYXJzZWREdXJhdGlvbikgaW1hZ2UuZHVyYXRpb24gPSBwYXJzZWREdXJhdGlvbjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIGltYWdlO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBnZXRWZXJ0aWNhbEltYWdlOiBmdW5jdGlvbihpbWFnZURhdGEsIHJpY2hEYXRhKXtcbiAgICAgICAgaWYoaW1hZ2VEYXRhID09IHVuZGVmaW5lZCB8fCBpbWFnZURhdGEuc3JjID09IHVuZGVmaW5lZCkgcmV0dXJuO1xuXG4gICAgICAgIHZhciBpbWFnZSA9IHtcbiAgICAgICAgICAgIHNyYzogaW1hZ2VEYXRhLnNyY1xuICAgICAgICB9O1xuXG5cbiAgICAgICAgaWYoaW1hZ2VEYXRhLndpZHRoKSBpbWFnZS53aWR0aCA9IGltYWdlRGF0YS53aWR0aDtcbiAgICAgICAgaWYoaW1hZ2VEYXRhLmhlaWdodCkgaW1hZ2UuaGVpZ2h0ID0gaW1hZ2VEYXRhLmhlaWdodDtcbiAgICAgICAgaWYoaW1hZ2VEYXRhLnJhdGlvKSBpbWFnZS5yYXRpbyA9IGltYWdlRGF0YS5yYXRpbztcblxuICAgICAgICAvLyBhZGQgZHVyYXRpb24gZnJvbSByaWNoIGRhdGFcbiAgICAgICAgaWYocmljaERhdGEgJiYgcmljaERhdGEuZHVyYXRpb24pe1xuICAgICAgICAgICAgdmFyIHBhcnNlZER1cmF0aW9uID0gUmVzdWx0LnRyeUdldEltYWdlRHVyYXRpb24ocmljaERhdGEuZHVyYXRpb24pXG4gICAgICAgICAgICBpZihwYXJzZWREdXJhdGlvbikgaW1hZ2UuZHVyYXRpb24gPSBwYXJzZWREdXJhdGlvbjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBpbWFnZVxuICAgIH0sXG4gICAgdHJ5R2V0SW1hZ2VEdXJhdGlvbjogZnVuY3Rpb24oZHVyYXRpb24pe1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgdmFyIHRvdGFsU2Vjb25kcyA9IHBhcnNlSW50KGR1cmF0aW9uKSxcbiAgICAgICAgICAgICAgICBtaW4gPSBNYXRoLmZsb29yKHRvdGFsU2Vjb25kcy82MCksXG4gICAgICAgICAgICAgICAgc2Vjb25kcyA9IHRvdGFsU2Vjb25kcyU2MDtcbiAgICAgICAgICAgIHJldHVybiBtaW4gKyAnOicgKyAoc2Vjb25kcyA8IDEwID8gJzAnICsgc2Vjb25kcyA6IHNlY29uZHMpO1xuICAgICAgICB9XG4gICAgICAgIGNhdGNoKGUpe31cblxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgUmVzdWx0O1xuIl19