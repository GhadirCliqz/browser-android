System.register("core/ab-tests", ["core/utils"], function (_export) {
    /*
     * This module implements a mechanism which enables/disables AB tests
     *
     */

    "use strict";

    var CliqzUtils, timer, ONE_HOUR, CliqzABTests;

    function log(msg) {
        CliqzUtils.log(msg, "CliqzABTests.jsm");
    }

    return {
        setters: [function (_coreUtils) {
            CliqzUtils = _coreUtils["default"];
        }],
        execute: function () {
            timer = null;
            ONE_HOUR = 60 * 60 * 1000;
            CliqzABTests = {
                PREF: 'ABTests',
                PREF_OVERRIDE: 'ABTestsOverride',
                URL: 'https://logging.cliqz.com/abtests/check?session=',
                init: function init() {
                    CliqzABTests.check();
                },
                // Accessors to list of tests this user is current in
                getCurrent: function getCurrent() {
                    if (CliqzUtils.hasPref(CliqzABTests.PREF)) return JSON.parse(CliqzUtils.getPref(CliqzABTests.PREF));
                    return undefined;
                },
                setCurrent: function setCurrent(tests) {
                    CliqzUtils.setPref(CliqzABTests.PREF, JSON.stringify(tests));
                },

                // Accessors to list of tests in override list
                getOverride: function getOverride() {
                    if (CliqzUtils.hasPref(CliqzABTests.PREF_OVERRIDE)) {
                        var ABtests = JSON.parse(CliqzUtils.getPref(CliqzABTests.PREF_OVERRIDE));
                        return ABtests;
                    }
                    return undefined;
                },
                setOverride: function setOverride(tests) {
                    if (tests) CliqzUtils.setPref(CliqzABTests.PREF_OVERRIDE, JSON.stringify(tests));else CliqzUtils.clearPref(CliqzABTests.PREF_OVERRIDE);
                },

                // Check for newest list of AB tests from server
                check: function check() {
                    log('AB checking');
                    // clear the last timer
                    CliqzUtils.clearTimeout(timer);
                    // set a new timer to be triggered after 1 hour
                    timer = CliqzUtils.setTimeout(CliqzABTests.check, ONE_HOUR);

                    CliqzABTests.retrieve(function (response) {
                        try {
                            var prevABtests = {};
                            if (CliqzUtils.hasPref(CliqzABTests.PREF)) prevABtests = JSON.parse(CliqzUtils.getPref(CliqzABTests.PREF));

                            var respABtests = JSON.parse(response.responseText);

                            // Override the backend response - for local testing
                            var overrideABtests = CliqzABTests.getOverride();
                            if (overrideABtests) respABtests = overrideABtests;

                            var newABtests = {};

                            var changes = false; // any changes?

                            // find old AB tests to leave
                            for (var o in prevABtests) {
                                if (!respABtests[o]) {
                                    if (CliqzABTests.leave(o)) changes = true;
                                } else {
                                    // keep this old test in the list of current tests
                                    newABtests[o] = prevABtests[o];
                                }
                            }

                            // find new AB tests to enter
                            for (var n in respABtests) {
                                if (!prevABtests[n]) {
                                    if (CliqzABTests.enter(n, respABtests[n])) {
                                        changes = true;
                                        newABtests[n] = respABtests[n];
                                    }
                                }
                            }

                            if (changes) {
                                CliqzUtils.setPref(CliqzABTests.PREF, JSON.stringify(newABtests));
                            }
                        } catch (e) {
                            log('retrieve error: ' + e.message);
                        }
                    });
                },
                retrieve: function retrieve(callback) {
                    var url = CliqzABTests.URL + encodeURIComponent(CliqzUtils.getPref('session', ''));

                    var onerror = function onerror() {
                        log("failed to retrieve AB test data");
                    };

                    CliqzUtils.httpGet(url, callback, onerror, 15000);
                },
                enter: function enter(abtest, payload) {
                    // Add new AB tests here.
                    // It is safe to remove them as soon as the test is over.
                    var rule_executed = true;
                    switch (abtest) {
                        case "1024_B":
                            CliqzUtils.setPref("categoryAssessment", true);
                            break;
                        case "1028_A":
                            CliqzUtils.setPref("humanWeb", false);
                            break;
                        case "1028_B":
                            CliqzUtils.setPref("humanWeb", true);
                            break;
                        case "1032_A":
                            CliqzUtils.setPref("spellCorrMessage", false);
                            break;
                        case "1032_B":
                            CliqzUtils.setPref("spellCorrMessage", true);
                            break;
                        case "1036_B":
                            CliqzUtils.setPref("extended_onboarding_same_result", true);
                            break;
                        case "1045_A":
                            break;
                        case "1045_B":
                            CliqzUtils.setPref("antiTrackTest", true);
                            break;
                        case "1046_B":
                            CliqzUtils.setPref("attrackBlockCookieTracking", true);
                            break;
                        case "1047_B":
                            CliqzUtils.setPref("attrackRemoveQueryStringTracking", true);
                            break;
                        case "1048_B":
                            CliqzUtils.setPref("attrackAlterPostdataTracking", true);
                            break;
                        case "1049_B":
                            CliqzUtils.setPref("attrackCanvasFingerprintTracking", true);
                            break;
                        case "1050_B":
                            CliqzUtils.setPref("attrackRefererTracking", true);
                            break;
                        case "1051_B":
                            CliqzUtils.setPref("antiTrackTest", true);
                            break;
                        case "1052_A":
                            CliqzUtils.setPref("attrackBlockCookieTracking", false);
                            break;
                        case "1052_B":
                            CliqzUtils.setPref("attrackBlockCookieTracking", true);
                            break;
                        case "1053_A":
                            CliqzUtils.setPref("attrackRemoveQueryStringTracking", false);
                            break;
                        case "1053_B":
                            CliqzUtils.setPref("attrackRemoveQueryStringTracking", true);
                            break;
                        case "1055_B":
                            CliqzUtils.setPref("unblockMode", "always");
                            break;
                        case "1057_A":
                            CliqzUtils.setPref("trackerTxt", false);
                            break;
                        case "1057_B":
                            CliqzUtils.setPref("trackerTxt", true);
                            break;
                        case "1058_A":
                            CliqzUtils.setPref("unblockMode", "never");
                            break;
                        case "1058_B":
                            CliqzUtils.setPref("unblockMode", "always");
                            break;
                        case "1059_A":
                            CliqzUtils.setPref("attrack.local_tracking", false);
                            break;
                        case "1059_B":
                            CliqzUtils.setPref("attrack.local_tracking", true);
                            break;
                        case "1060_A":
                            CliqzUtils.setPref("attrackBloomFilter", false);
                            break;
                        case "1060_B":
                            CliqzUtils.setPref("attrackBloomFilter", true);
                            break;
                        case "1061_A":
                            CliqzUtils.setPref("attrackUI", false);
                            break;
                        case "1061_B":
                            CliqzUtils.setPref("attrackUI", true);
                            break;
                        case "1063_A":
                            CliqzUtils.setPref("double-enter2", false);
                            break;
                        case "1063_B":
                            CliqzUtils.setPref("double-enter2", true);
                            break;
                        case "1064_A":
                            CliqzUtils.setPref("attrackDefaultAction", "same");
                            break;
                        case "1064_B":
                            CliqzUtils.setPref("attrackDefaultAction", "placeholder");
                            break;
                        case "1064_C":
                            CliqzUtils.setPref("attrackDefaultAction", "block");
                            break;
                        case "1064_D":
                            CliqzUtils.setPref("attrackDefaultAction", "empty");
                            break;
                        case "1064_E":
                            CliqzUtils.setPref("attrackDefaultAction", "replace");
                            break;
                        case "1065_A":
                            CliqzUtils.setPref("freshTabNewsEmail", false);
                            break;
                        case "1065_B":
                            CliqzUtils.setPref("freshTabNewsEmail", true);
                            break;
                        case "1066_A":
                            CliqzUtils.setPref("proxyNetwork", false);
                            break;
                        case "1066_B":
                            CliqzUtils.setPref("proxyNetwork", true);
                            break;
                        case "1067_B":
                            CliqzUtils.setPref("attrackProxyTrackers", true);
                            break;
                        case "1069_A":
                            CliqzUtils.setPref("grOfferSwitchFlag", false);
                            break;
                        case "1069_B":
                            CliqzUtils.setPref("grOfferSwitchFlag", true);
                            break;
                        case "1070_A":
                            CliqzUtils.setPref("cliqz-anti-phishing", false);
                            CliqzUtils.setPref("cliqz-anti-phishing-enabled", false);
                            break;
                        case "1070_B":
                            CliqzUtils.setPref("cliqz-anti-phishing", true);
                            CliqzUtils.setPref("cliqz-anti-phishing-enabled", true);
                            break;
                        case "1071_A":
                            CliqzUtils.setPref("browser.privatebrowsing.apt", false, '');
                            break;
                        case "1071_B":
                            CliqzUtils.setPref("browser.privatebrowsing.apt", true, '');
                            break;
                        case "1072_A":
                            CliqzUtils.setPref("grFeatureEnabled", false);
                            break;
                        case "1072_B":
                            CliqzUtils.setPref("grFeatureEnabled", true);
                            break;
                        case "1074_A":
                            CliqzUtils.setPref("cliqz-adb-abtest", false);
                            break;
                        case "1074_B":
                            CliqzUtils.setPref("cliqz-adb-abtest", true);
                            break;
                        case "1075_A":
                            CliqzUtils.setPref("freshtabFeedback", false);
                            break;
                        case "1075_B":
                            CliqzUtils.setPref("freshtabFeedback", true);
                            break;
                        case "1076_A":
                            CliqzUtils.setPref("history.timeouts", false);
                            break;
                        case "1076_B":
                            CliqzUtils.setPref("history.timeouts", true);
                            break;
                        case "1077_A":
                            CliqzUtils.setPref("languageDedup", false);
                            break;
                        case "1077_B":
                            CliqzUtils.setPref("languageDedup", true);
                            break;
                        default:
                            rule_executed = false;
                    }
                    if (rule_executed) {
                        var action = {
                            type: 'abtest',
                            action: 'enter',
                            name: abtest
                        };
                        CliqzUtils.telemetry(action);

                        return true;
                    } else {
                        return false;
                    }
                },
                leave: function leave(abtest, disable) {
                    // Restore defaults after an AB test is finished.
                    // DO NOT remove test cleanup code too quickly, a user
                    // might not start the browser for a long time and
                    // get stuck in a test if we remove cases too early.
                    var rule_executed = true;
                    switch (abtest) {
                        case "1024_B":
                            CliqzUtils.clearPref("categoryAssessment");
                            break;
                        case "1028_A":
                        case "1028_B":
                            CliqzUtils.clearPref("humanWeb");
                            break;
                        case "1032_A":
                        case "1032_B":
                            CliqzUtils.clearPref("spellCorrMessage");
                            break;
                        case "1036_A":
                        case "1036_B":
                            CliqzUtils.clearPref("extended_onboarding_same_result");
                            CliqzUtils.clearPref("extended_onboarding");
                            break;
                        case "1045_A":
                        case "1045_B":
                            CliqzUtils.clearPref("antiTrackTest");
                            break;
                        case "1046_A":
                        case "1047_A":
                        case "1048_A":
                        case "1049_A":
                        case "1050_A":
                            break;
                        case "1046_B":
                            CliqzUtils.clearPref("attrackBlockCookieTracking");
                            break;
                        case "1047_B":
                            CliqzUtils.clearPref("attrackRemoveQueryStringTracking");
                            break;
                        case "1048_B":
                            CliqzUtils.clearPref("attrackAlterPostdataTracking");
                            break;
                        case "1049_B":
                            CliqzUtils.clearPref("attrackCanvasFingerprintTracking");
                            break;
                        case "1050_B":
                            CliqzUtils.clearPref("attrackRefererTracking");
                            break;
                        case "1051_B":
                            CliqzUtils.clearPref("antiTrackTest");
                            break;
                        case "1052_B":
                            CliqzUtils.clearPref("attrackBlockCookieTracking");
                            break;
                        case "1053_B":
                            CliqzUtils.clearPref("attrackRemoveQueryStringTracking");
                            break;
                        case "1055_A":
                        case "1055_B":
                            CliqzUtils.clearPref("unblockEnabled");
                            break;
                        case "1056_A":
                        case "1056_B":
                            CliqzUtils.clearPref("freshTabAB");
                            break;
                        case "1057_B":
                            CliqzUtils.clearPref("trackerTxt");
                            break;
                        case "1058_A":
                        case "1058_B":
                            CliqzUtils.clearPref("unblockMode");
                            break;
                        case "1059_A":
                        case "1059_B":
                            CliqzUtils.clearPref("attrack.local_tracking");
                            break;
                        case "1060_A":
                        case "1060_B":
                            CliqzUtils.clearPref("attrackBloomFilter");
                            break;
                        case "1061_A":
                        case "1061_B":
                            CliqzUtils.clearPref("attrackUI");
                            break;
                        case "1063_A":
                        case "1063_B":
                            CliqzUtils.clearPref("double-enter2");
                            break;
                        case "1064_A":
                        case "1064_B":
                        case "1064_C":
                        case "1064_D":
                        case "1064_E":
                            CliqzUtils.clearPref("attrackDefaultAction");
                            break;
                        case "1066_A":
                        case "1066_B":
                            CliqzUtils.clearPref("proxyNetwork");
                            break;
                        case "1065_A":
                        case "1065_B":
                            CliqzUtils.clearPref("freshTabNewsEmail");
                            break;
                        case "1067_B":
                            CliqzUtils.clearPref("attrackProxyTrackers");
                            break;
                        case "1068_A":
                        case "1068_B":
                            CliqzUtils.clearPref("languageDedup");
                            break;
                        case "1069_A":
                        case "1069_B":
                            CliqzUtils.clearPref("grOfferSwitchFlag");
                            break;
                        case "1070_A":
                        case "1070_B":
                            CliqzUtils.clearPref('cliqz-anti-phishing');
                            CliqzUtils.clearPref('cliqz-anti-phishing-enabled');
                            break;
                        case "1071_A":
                        case "1071_B":
                            CliqzUtils.clearPref('browser.privatebrowsing.apt', '');
                            break;
                        case "1072_A":
                        case "1072_B":
                            CliqzUtils.clearPref('grFeatureEnabled');
                            break;
                        case "1074_A":
                        case "1074_B":
                            CliqzUtils.clearPref('cliqz-adb-abtest');
                            break;
                        case "1075_A":
                        case "1075_B":
                            CliqzUtils.clearPref('freshtabFeedback');
                            break;
                        case "1076_A":
                        case "1076_B":
                            CliqzUtils.clearPref('history.timeouts');
                            break;
                        case "1077_A":
                        case "1077_B":
                            CliqzUtils.clearPref("languageDedup");
                            break;

                        default:
                            rule_executed = false;
                    }
                    if (rule_executed) {
                        var action = {
                            type: 'abtest',
                            action: 'leave',
                            name: abtest,
                            disable: disable
                        };
                        CliqzUtils.telemetry(action);
                        return true;
                    } else {
                        return false;
                    }
                },
                disable: function disable(abtest) {
                    // Disable an AB test but do not remove it from list of active AB tests,
                    // this is intended to be used by the extension itself when it experiences
                    // an error associated with this AB test.
                    if (CliqzUtils.hasPref(CliqzABTests.PREF)) {
                        var curABtests = JSON.parse(CliqzUtils.getPref(CliqzABTests.PREF));

                        if (curABtests[abtest] && CliqzABTests.leave(abtest, true)) {
                            // mark as disabled and save back to preferences
                            curABtests[abtest].disabled = true;
                            CliqzUtils.setPref(CliqzABTests.PREF, JSON.stringify(curABtests));
                        }
                    }
                }
            };

            _export("default", CliqzABTests);
        }
    };
});
//# sourceMappingURL=data:application/json;base64,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QUMsTUFBTSxDQUFDLENBQUM7QUFDN0IsK0JBQU8sSUFBSSxDQUFDO3FCQUNoQixNQUFNO0FBQ0YsK0JBQU8sS0FBSyxDQUFDO3FCQUNqQjtpQkFDSDtBQUNELHVCQUFPLEVBQUUsaUJBQVMsTUFBTSxFQUFFOzs7O0FBSXRCLHdCQUFHLFVBQVUsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxFQUFFO0FBQ3JDLDRCQUFJLFVBQVUsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLFVBQVUsQ0FBQyxPQUFPLENBQUMsWUFBWSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUM7O0FBRXBFLDRCQUFHLFVBQVUsQ0FBQyxNQUFNLENBQUMsSUFBSSxZQUFZLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsRUFBRTs7QUFFdkQsc0NBQVUsQ0FBQyxNQUFNLENBQUMsQ0FBQyxRQUFRLEdBQUcsSUFBSSxDQUFDO0FBQ25DLHNDQUFVLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVMsQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFBO3lCQUNwRTtxQkFDSjtpQkFDSjthQUNKOzsrQkFFYyxZQUFZIiwiZmlsZSI6ImNvcmUvYWItdGVzdHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogVGhpcyBtb2R1bGUgaW1wbGVtZW50cyBhIG1lY2hhbmlzbSB3aGljaCBlbmFibGVzL2Rpc2FibGVzIEFCIHRlc3RzXG4gKlxuICovXG5cblxuaW1wb3J0IENsaXF6VXRpbHMgZnJvbSBcImNvcmUvdXRpbHNcIjtcblxudmFyIHRpbWVyPW51bGwsIE9ORV9IT1VSID0gNjAgKiA2MCAqIDEwMDA7XG5cbmZ1bmN0aW9uIGxvZyhtc2cpe1xuICBDbGlxelV0aWxzLmxvZyhtc2csIFwiQ2xpcXpBQlRlc3RzLmpzbVwiKTtcbn1cblxudmFyIENsaXF6QUJUZXN0cyA9IHtcbiAgICBQUkVGOiAnQUJUZXN0cycsXG4gICAgUFJFRl9PVkVSUklERTogJ0FCVGVzdHNPdmVycmlkZScsXG4gICAgVVJMOiAnaHR0cHM6Ly9sb2dnaW5nLmNsaXF6LmNvbS9hYnRlc3RzL2NoZWNrP3Nlc3Npb249JyxcbiAgICBpbml0OiBmdW5jdGlvbigpe1xuICAgICAgICBDbGlxekFCVGVzdHMuY2hlY2soKTtcbiAgICB9LFxuICAgIC8vIEFjY2Vzc29ycyB0byBsaXN0IG9mIHRlc3RzIHRoaXMgdXNlciBpcyBjdXJyZW50IGluXG4gICAgZ2V0Q3VycmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmKENsaXF6VXRpbHMuaGFzUHJlZihDbGlxekFCVGVzdHMuUFJFRikpXG4gICAgICAgICAgICByZXR1cm4gSlNPTi5wYXJzZShDbGlxelV0aWxzLmdldFByZWYoQ2xpcXpBQlRlc3RzLlBSRUYpKTtcbiAgICAgICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgICB9LFxuICAgIHNldEN1cnJlbnQ6IGZ1bmN0aW9uKHRlc3RzKSB7XG4gICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihDbGlxekFCVGVzdHMuUFJFRiwgSlNPTi5zdHJpbmdpZnkodGVzdHMpKVxuICAgIH0sXG5cbiAgICAvLyBBY2Nlc3NvcnMgdG8gbGlzdCBvZiB0ZXN0cyBpbiBvdmVycmlkZSBsaXN0XG4gICAgZ2V0T3ZlcnJpZGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZihDbGlxelV0aWxzLmhhc1ByZWYoQ2xpcXpBQlRlc3RzLlBSRUZfT1ZFUlJJREUpKSB7XG4gICAgICAgICAgICB2YXIgQUJ0ZXN0cyA9IEpTT04ucGFyc2UoQ2xpcXpVdGlscy5nZXRQcmVmKENsaXF6QUJUZXN0cy5QUkVGX09WRVJSSURFKSk7XG4gICAgICAgICAgICByZXR1cm4gQUJ0ZXN0cztcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0sXG4gICAgc2V0T3ZlcnJpZGU6IGZ1bmN0aW9uKHRlc3RzKSB7XG4gICAgICAgIGlmKHRlc3RzKVxuICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKENsaXF6QUJUZXN0cy5QUkVGX09WRVJSSURFLCBKU09OLnN0cmluZ2lmeSh0ZXN0cykpO1xuICAgICAgICBlbHNlXG4gICAgICAgICAgICBDbGlxelV0aWxzLmNsZWFyUHJlZihDbGlxekFCVGVzdHMuUFJFRl9PVkVSUklERSk7XG4gICAgfSxcblxuICAgIC8vIENoZWNrIGZvciBuZXdlc3QgbGlzdCBvZiBBQiB0ZXN0cyBmcm9tIHNlcnZlclxuICAgIGNoZWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgbG9nKCdBQiBjaGVja2luZycpO1xuICAgICAgICAvLyBjbGVhciB0aGUgbGFzdCB0aW1lclxuICAgICAgICBDbGlxelV0aWxzLmNsZWFyVGltZW91dCh0aW1lcik7XG4gICAgICAgIC8vIHNldCBhIG5ldyB0aW1lciB0byBiZSB0cmlnZ2VyZWQgYWZ0ZXIgMSBob3VyXG4gICAgICAgIHRpbWVyID0gQ2xpcXpVdGlscy5zZXRUaW1lb3V0KENsaXF6QUJUZXN0cy5jaGVjaywgT05FX0hPVVIpO1xuXG4gICAgICAgIENsaXF6QUJUZXN0cy5yZXRyaWV2ZShcbiAgICAgICAgICAgIGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICB0cnl7XG4gICAgICAgICAgICAgICAgICAgIHZhciBwcmV2QUJ0ZXN0cyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICBpZihDbGlxelV0aWxzLmhhc1ByZWYoQ2xpcXpBQlRlc3RzLlBSRUYpKVxuICAgICAgICAgICAgICAgICAgICAgICAgcHJldkFCdGVzdHMgPSBKU09OLnBhcnNlKENsaXF6VXRpbHMuZ2V0UHJlZihDbGlxekFCVGVzdHMuUFJFRikpO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciByZXNwQUJ0ZXN0cyA9IEpTT04ucGFyc2UocmVzcG9uc2UucmVzcG9uc2VUZXh0KTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBPdmVycmlkZSB0aGUgYmFja2VuZCByZXNwb25zZSAtIGZvciBsb2NhbCB0ZXN0aW5nXG4gICAgICAgICAgICAgICAgICAgIHZhciBvdmVycmlkZUFCdGVzdHMgPSBDbGlxekFCVGVzdHMuZ2V0T3ZlcnJpZGUoKTtcbiAgICAgICAgICAgICAgICAgICAgaWYob3ZlcnJpZGVBQnRlc3RzKVxuICAgICAgICAgICAgICAgICAgICAgICAgcmVzcEFCdGVzdHMgPSBvdmVycmlkZUFCdGVzdHM7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIG5ld0FCdGVzdHMgPSB7fTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgY2hhbmdlcyA9IGZhbHNlOyAvLyBhbnkgY2hhbmdlcz9cblxuICAgICAgICAgICAgICAgICAgICAvLyBmaW5kIG9sZCBBQiB0ZXN0cyB0byBsZWF2ZVxuICAgICAgICAgICAgICAgICAgICBmb3IodmFyIG8gaW4gcHJldkFCdGVzdHMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCFyZXNwQUJ0ZXN0c1tvXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKENsaXF6QUJUZXN0cy5sZWF2ZShvKSlcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBrZWVwIHRoaXMgb2xkIHRlc3QgaW4gdGhlIGxpc3Qgb2YgY3VycmVudCB0ZXN0c1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0FCdGVzdHNbb10gPSBwcmV2QUJ0ZXN0c1tvXVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gZmluZCBuZXcgQUIgdGVzdHMgdG8gZW50ZXJcbiAgICAgICAgICAgICAgICAgICAgZm9yKHZhciBuIGluIHJlc3BBQnRlc3RzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZighKHByZXZBQnRlc3RzW25dKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKENsaXF6QUJUZXN0cy5lbnRlcihuLCByZXNwQUJ0ZXN0c1tuXSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2hhbmdlcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5ld0FCdGVzdHNbbl0gPSByZXNwQUJ0ZXN0c1tuXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBpZihjaGFuZ2VzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoQ2xpcXpBQlRlc3RzLlBSRUYsIEpTT04uc3RyaW5naWZ5KG5ld0FCdGVzdHMpKVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSBjYXRjaChlKXtcbiAgICAgICAgICAgICAgICAgIGxvZygncmV0cmlldmUgZXJyb3I6ICcgKyBlLm1lc3NhZ2UpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfSxcbiAgICByZXRyaWV2ZTogZnVuY3Rpb24oY2FsbGJhY2spIHtcbiAgICAgICAgdmFyIHVybCA9IENsaXF6QUJUZXN0cy5VUkwgKyBlbmNvZGVVUklDb21wb25lbnQoQ2xpcXpVdGlscy5nZXRQcmVmKCdzZXNzaW9uJywnJykpO1xuXG4gICAgICAgIHZhciBvbmVycm9yID0gZnVuY3Rpb24oKXsgbG9nKFwiZmFpbGVkIHRvIHJldHJpZXZlIEFCIHRlc3QgZGF0YVwiKTsgfVxuXG4gICAgICAgIENsaXF6VXRpbHMuaHR0cEdldCh1cmwsIGNhbGxiYWNrLCBvbmVycm9yLCAxNTAwMCk7XG4gICAgfSxcbiAgICBlbnRlcjogZnVuY3Rpb24oYWJ0ZXN0LCBwYXlsb2FkKSB7XG4gICAgICAgIC8vIEFkZCBuZXcgQUIgdGVzdHMgaGVyZS5cbiAgICAgICAgLy8gSXQgaXMgc2FmZSB0byByZW1vdmUgdGhlbSBhcyBzb29uIGFzIHRoZSB0ZXN0IGlzIG92ZXIuXG4gICAgICAgIHZhciBydWxlX2V4ZWN1dGVkID0gdHJ1ZVxuICAgICAgICBzd2l0Y2goYWJ0ZXN0KSB7XG4gICAgICAgICAgICBjYXNlIFwiMTAyNF9CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiY2F0ZWdvcnlBc3Nlc3NtZW50XCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwMjhfQVwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImh1bWFuV2ViXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDI4X0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJodW1hbldlYlwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDMyX0FcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJzcGVsbENvcnJNZXNzYWdlXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDMyX0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJzcGVsbENvcnJNZXNzYWdlXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwMzZfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImV4dGVuZGVkX29uYm9hcmRpbmdfc2FtZV9yZXN1bHRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA0NV9BXCI6XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA0NV9CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiYW50aVRyYWNrVGVzdFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDQ2X0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJhdHRyYWNrQmxvY2tDb29raWVUcmFja2luZ1wiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDQ3X0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJhdHRyYWNrUmVtb3ZlUXVlcnlTdHJpbmdUcmFja2luZ1wiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDQ4X0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJhdHRyYWNrQWx0ZXJQb3N0ZGF0YVRyYWNraW5nXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNDlfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImF0dHJhY2tDYW52YXNGaW5nZXJwcmludFRyYWNraW5nXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNTBfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImF0dHJhY2tSZWZlcmVyVHJhY2tpbmdcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA1MV9CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiYW50aVRyYWNrVGVzdFwiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDUyX0FcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJhdHRyYWNrQmxvY2tDb29raWVUcmFja2luZ1wiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA1Ml9CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiYXR0cmFja0Jsb2NrQ29va2llVHJhY2tpbmdcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA1M19BXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiYXR0cmFja1JlbW92ZVF1ZXJ5U3RyaW5nVHJhY2tpbmdcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNTNfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImF0dHJhY2tSZW1vdmVRdWVyeVN0cmluZ1RyYWNraW5nXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNTVfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcInVuYmxvY2tNb2RlXCIsIFwiYWx3YXlzXCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNTdfQVwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcInRyYWNrZXJUeHRcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNTdfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcInRyYWNrZXJUeHRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA1OF9BXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwidW5ibG9ja01vZGVcIiwgXCJuZXZlclwiKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDU4X0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJ1bmJsb2NrTW9kZVwiLCBcImFsd2F5c1wiKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDU5X0FcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJhdHRyYWNrLmxvY2FsX3RyYWNraW5nXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDU5X0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJhdHRyYWNrLmxvY2FsX3RyYWNraW5nXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNjBfQVwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImF0dHJhY2tCbG9vbUZpbHRlclwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA2MF9CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiYXR0cmFja0Jsb29tRmlsdGVyXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNjFfQVwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImF0dHJhY2tVSVwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA2MV9CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiYXR0cmFja1VJXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNjNfQVwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImRvdWJsZS1lbnRlcjJcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNjNfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImRvdWJsZS1lbnRlcjJcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA2NF9BXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiYXR0cmFja0RlZmF1bHRBY3Rpb25cIiwgXCJzYW1lXCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNjRfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImF0dHJhY2tEZWZhdWx0QWN0aW9uXCIsIFwicGxhY2Vob2xkZXJcIik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA2NF9DXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiYXR0cmFja0RlZmF1bHRBY3Rpb25cIiwgXCJibG9ja1wiKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDY0X0RcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJhdHRyYWNrRGVmYXVsdEFjdGlvblwiLCBcImVtcHR5XCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNjRfRVwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImF0dHJhY2tEZWZhdWx0QWN0aW9uXCIsIFwicmVwbGFjZVwiKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDY1X0FcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJmcmVzaFRhYk5ld3NFbWFpbFwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA2NV9CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiZnJlc2hUYWJOZXdzRW1haWxcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA2Nl9BXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwicHJveHlOZXR3b3JrXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDY2X0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJwcm94eU5ldHdvcmtcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA2N19CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiYXR0cmFja1Byb3h5VHJhY2tlcnNcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA2OV9BXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiZ3JPZmZlclN3aXRjaEZsYWdcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNjlfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImdyT2ZmZXJTd2l0Y2hGbGFnXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNzBfQVwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImNsaXF6LWFudGktcGhpc2hpbmdcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImNsaXF6LWFudGktcGhpc2hpbmctZW5hYmxlZFwiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA3MF9CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiY2xpcXotYW50aS1waGlzaGluZ1wiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJjbGlxei1hbnRpLXBoaXNoaW5nLWVuYWJsZWRcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA3MV9BXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiYnJvd3Nlci5wcml2YXRlYnJvd3NpbmcuYXB0XCIsIGZhbHNlLCAnJyk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA3MV9CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiYnJvd3Nlci5wcml2YXRlYnJvd3NpbmcuYXB0XCIsIHRydWUsICcnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDcyX0FcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJnckZlYXR1cmVFbmFibGVkXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDcyX0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJnckZlYXR1cmVFbmFibGVkXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNzRfQVwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImNsaXF6LWFkYi1hYnRlc3RcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNzRfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImNsaXF6LWFkYi1hYnRlc3RcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA3NV9BXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiZnJlc2h0YWJGZWVkYmFja1wiLCBmYWxzZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA3NV9CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKFwiZnJlc2h0YWJGZWVkYmFja1wiLCB0cnVlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDc2X0FcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJoaXN0b3J5LnRpbWVvdXRzXCIsIGZhbHNlKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDc2X0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLnNldFByZWYoXCJoaXN0b3J5LnRpbWVvdXRzXCIsIHRydWUpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNzdfQVwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImxhbmd1YWdlRGVkdXBcIiwgZmFsc2UpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNzdfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuc2V0UHJlZihcImxhbmd1YWdlRGVkdXBcIiwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgICAgIHJ1bGVfZXhlY3V0ZWQgPSBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZihydWxlX2V4ZWN1dGVkKSB7XG4gICAgICAgICAgICB2YXIgYWN0aW9uID0ge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdhYnRlc3QnLFxuICAgICAgICAgICAgICAgIGFjdGlvbjogJ2VudGVyJyxcbiAgICAgICAgICAgICAgICBuYW1lOiBhYnRlc3RcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBDbGlxelV0aWxzLnRlbGVtZXRyeShhY3Rpb24pO1xuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgIH1cbiAgICB9LFxuICAgIGxlYXZlOiBmdW5jdGlvbihhYnRlc3QsIGRpc2FibGUpIHtcbiAgICAgICAgLy8gUmVzdG9yZSBkZWZhdWx0cyBhZnRlciBhbiBBQiB0ZXN0IGlzIGZpbmlzaGVkLlxuICAgICAgICAvLyBETyBOT1QgcmVtb3ZlIHRlc3QgY2xlYW51cCBjb2RlIHRvbyBxdWlja2x5LCBhIHVzZXJcbiAgICAgICAgLy8gbWlnaHQgbm90IHN0YXJ0IHRoZSBicm93c2VyIGZvciBhIGxvbmcgdGltZSBhbmRcbiAgICAgICAgLy8gZ2V0IHN0dWNrIGluIGEgdGVzdCBpZiB3ZSByZW1vdmUgY2FzZXMgdG9vIGVhcmx5LlxuICAgICAgICB2YXIgcnVsZV9leGVjdXRlZCA9IHRydWU7XG4gICAgICAgIHN3aXRjaChhYnRlc3QpIHtcbiAgICAgICAgICAgIGNhc2UgXCIxMDI0X0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLmNsZWFyUHJlZihcImNhdGVnb3J5QXNzZXNzbWVudFwiKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDI4X0FcIjpcbiAgICAgICAgICAgIGNhc2UgXCIxMDI4X0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLmNsZWFyUHJlZihcImh1bWFuV2ViXCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwMzJfQVwiOlxuICAgICAgICAgICAgY2FzZSBcIjEwMzJfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuY2xlYXJQcmVmKFwic3BlbGxDb3JyTWVzc2FnZVwiKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDM2X0FcIjpcbiAgICAgICAgICAgIGNhc2UgXCIxMDM2X0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLmNsZWFyUHJlZihcImV4dGVuZGVkX29uYm9hcmRpbmdfc2FtZV9yZXN1bHRcIik7XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5jbGVhclByZWYoXCJleHRlbmRlZF9vbmJvYXJkaW5nXCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNDVfQVwiOlxuICAgICAgICAgICAgY2FzZSBcIjEwNDVfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuY2xlYXJQcmVmKFwiYW50aVRyYWNrVGVzdFwiKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDQ2X0FcIjpcbiAgICAgICAgICAgIGNhc2UgXCIxMDQ3X0FcIjpcbiAgICAgICAgICAgIGNhc2UgXCIxMDQ4X0FcIjpcbiAgICAgICAgICAgIGNhc2UgXCIxMDQ5X0FcIjpcbiAgICAgICAgICAgIGNhc2UgXCIxMDUwX0FcIjpcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDQ2X0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLmNsZWFyUHJlZihcImF0dHJhY2tCbG9ja0Nvb2tpZVRyYWNraW5nXCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNDdfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuY2xlYXJQcmVmKFwiYXR0cmFja1JlbW92ZVF1ZXJ5U3RyaW5nVHJhY2tpbmdcIik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA0OF9CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5jbGVhclByZWYoXCJhdHRyYWNrQWx0ZXJQb3N0ZGF0YVRyYWNraW5nXCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNDlfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuY2xlYXJQcmVmKFwiYXR0cmFja0NhbnZhc0ZpbmdlcnByaW50VHJhY2tpbmdcIik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA1MF9CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5jbGVhclByZWYoXCJhdHRyYWNrUmVmZXJlclRyYWNraW5nXCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNTFfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuY2xlYXJQcmVmKFwiYW50aVRyYWNrVGVzdFwiKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDUyX0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLmNsZWFyUHJlZihcImF0dHJhY2tCbG9ja0Nvb2tpZVRyYWNraW5nXCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNTNfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuY2xlYXJQcmVmKFwiYXR0cmFja1JlbW92ZVF1ZXJ5U3RyaW5nVHJhY2tpbmdcIik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA1NV9BXCI6XG4gICAgICAgICAgICBjYXNlIFwiMTA1NV9CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5jbGVhclByZWYoXCJ1bmJsb2NrRW5hYmxlZFwiKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDU2X0FcIjpcbiAgICAgICAgICAgIGNhc2UgXCIxMDU2X0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLmNsZWFyUHJlZihcImZyZXNoVGFiQUJcIik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA1N19CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5jbGVhclByZWYoXCJ0cmFja2VyVHh0XCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNThfQVwiOlxuICAgICAgICAgICAgY2FzZSBcIjEwNThfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuY2xlYXJQcmVmKFwidW5ibG9ja01vZGVcIik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA1OV9BXCI6XG4gICAgICAgICAgICBjYXNlIFwiMTA1OV9CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5jbGVhclByZWYoXCJhdHRyYWNrLmxvY2FsX3RyYWNraW5nXCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNjBfQVwiOlxuICAgICAgICAgICAgY2FzZSBcIjEwNjBfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuY2xlYXJQcmVmKFwiYXR0cmFja0Jsb29tRmlsdGVyXCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNjFfQVwiOlxuICAgICAgICAgICAgY2FzZSBcIjEwNjFfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuY2xlYXJQcmVmKFwiYXR0cmFja1VJXCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNjNfQVwiOlxuICAgICAgICAgICAgY2FzZSBcIjEwNjNfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuY2xlYXJQcmVmKFwiZG91YmxlLWVudGVyMlwiKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDY0X0FcIjpcbiAgICAgICAgICAgIGNhc2UgXCIxMDY0X0JcIjpcbiAgICAgICAgICAgIGNhc2UgXCIxMDY0X0NcIjpcbiAgICAgICAgICAgIGNhc2UgXCIxMDY0X0RcIjpcbiAgICAgICAgICAgIGNhc2UgXCIxMDY0X0VcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLmNsZWFyUHJlZihcImF0dHJhY2tEZWZhdWx0QWN0aW9uXCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNjZfQVwiOlxuICAgICAgICAgICAgY2FzZSBcIjEwNjZfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuY2xlYXJQcmVmKFwicHJveHlOZXR3b3JrXCIpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNjVfQVwiOlxuICAgICAgICAgICAgY2FzZSBcIjEwNjVfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuY2xlYXJQcmVmKFwiZnJlc2hUYWJOZXdzRW1haWxcIik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA2N19CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5jbGVhclByZWYoXCJhdHRyYWNrUHJveHlUcmFja2Vyc1wiKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDY4X0FcIjpcbiAgICAgICAgICAgIGNhc2UgXCIxMDY4X0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLmNsZWFyUHJlZihcImxhbmd1YWdlRGVkdXBcIik7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA2OV9BXCI6XG4gICAgICAgICAgICBjYXNlIFwiMTA2OV9CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5jbGVhclByZWYoXCJnck9mZmVyU3dpdGNoRmxhZ1wiKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNzBfQVwiOlxuICAgICAgICAgICAgY2FzZSBcIjEwNzBfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuY2xlYXJQcmVmKCdjbGlxei1hbnRpLXBoaXNoaW5nJyk7XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5jbGVhclByZWYoJ2NsaXF6LWFudGktcGhpc2hpbmctZW5hYmxlZCcpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNzFfQVwiOlxuICAgICAgICAgICAgY2FzZSBcIjEwNzFfQlwiOlxuICAgICAgICAgICAgICAgIENsaXF6VXRpbHMuY2xlYXJQcmVmKCdicm93c2VyLnByaXZhdGVicm93c2luZy5hcHQnLCAnJyk7XG4gICAgICAgICAgICAgICAgYnJlYWtcbiAgICAgICAgICAgIGNhc2UgXCIxMDcyX0FcIjpcbiAgICAgICAgICAgIGNhc2UgXCIxMDcyX0JcIjpcbiAgICAgICAgICAgICAgQ2xpcXpVdGlscy5jbGVhclByZWYoJ2dyRmVhdHVyZUVuYWJsZWQnKTtcbiAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlIFwiMTA3NF9BXCI6XG4gICAgICAgICAgICBjYXNlIFwiMTA3NF9CXCI6XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5jbGVhclByZWYoJ2NsaXF6LWFkYi1hYnRlc3QnKTtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDc1X0FcIjpcbiAgICAgICAgICAgIGNhc2UgXCIxMDc1X0JcIjpcbiAgICAgICAgICAgICAgICBDbGlxelV0aWxzLmNsZWFyUHJlZignZnJlc2h0YWJGZWVkYmFjaycpO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSBcIjEwNzZfQVwiOlxuICAgICAgICAgICAgY2FzZSBcIjEwNzZfQlwiOlxuICAgICAgICAgICAgICBDbGlxelV0aWxzLmNsZWFyUHJlZignaGlzdG9yeS50aW1lb3V0cycpO1xuICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgXCIxMDc3X0FcIjpcbiAgICAgICAgICAgIGNhc2UgXCIxMDc3X0JcIjpcbiAgICAgICAgICAgICAgQ2xpcXpVdGlscy5jbGVhclByZWYoXCJsYW5ndWFnZURlZHVwXCIpO1xuICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgICAgICBydWxlX2V4ZWN1dGVkID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYocnVsZV9leGVjdXRlZCkge1xuICAgICAgICAgICAgdmFyIGFjdGlvbiA9IHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnYWJ0ZXN0JyxcbiAgICAgICAgICAgICAgICBhY3Rpb246ICdsZWF2ZScsXG4gICAgICAgICAgICAgICAgbmFtZTogYWJ0ZXN0LFxuICAgICAgICAgICAgICAgIGRpc2FibGU6IGRpc2FibGVcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBDbGlxelV0aWxzLnRlbGVtZXRyeShhY3Rpb24pO1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICB9XG4gICAgfSxcbiAgICBkaXNhYmxlOiBmdW5jdGlvbihhYnRlc3QpIHtcbiAgICAgICAgLy8gRGlzYWJsZSBhbiBBQiB0ZXN0IGJ1dCBkbyBub3QgcmVtb3ZlIGl0IGZyb20gbGlzdCBvZiBhY3RpdmUgQUIgdGVzdHMsXG4gICAgICAgIC8vIHRoaXMgaXMgaW50ZW5kZWQgdG8gYmUgdXNlZCBieSB0aGUgZXh0ZW5zaW9uIGl0c2VsZiB3aGVuIGl0IGV4cGVyaWVuY2VzXG4gICAgICAgIC8vIGFuIGVycm9yIGFzc29jaWF0ZWQgd2l0aCB0aGlzIEFCIHRlc3QuXG4gICAgICAgIGlmKENsaXF6VXRpbHMuaGFzUHJlZihDbGlxekFCVGVzdHMuUFJFRikpIHtcbiAgICAgICAgICAgICB2YXIgY3VyQUJ0ZXN0cyA9IEpTT04ucGFyc2UoQ2xpcXpVdGlscy5nZXRQcmVmKENsaXF6QUJUZXN0cy5QUkVGKSk7XG5cbiAgICAgICAgICAgIGlmKGN1ckFCdGVzdHNbYWJ0ZXN0XSAmJiBDbGlxekFCVGVzdHMubGVhdmUoYWJ0ZXN0LCB0cnVlKSkge1xuICAgICAgICAgICAgICAgIC8vIG1hcmsgYXMgZGlzYWJsZWQgYW5kIHNhdmUgYmFjayB0byBwcmVmZXJlbmNlc1xuICAgICAgICAgICAgICAgIGN1ckFCdGVzdHNbYWJ0ZXN0XS5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgQ2xpcXpVdGlscy5zZXRQcmVmKENsaXF6QUJUZXN0cy5QUkVGLCBKU09OLnN0cmluZ2lmeShjdXJBQnRlc3RzKSlcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0sXG59XG5cbmV4cG9ydCBkZWZhdWx0IENsaXF6QUJUZXN0cztcbiJdfQ==