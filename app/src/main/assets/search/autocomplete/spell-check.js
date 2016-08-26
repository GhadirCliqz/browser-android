System.register("autocomplete/spell-check", ["autocomplete/autocomplete", "core/cliqz"], function (_export) {
    "use strict";

    var autocomplete, utils, CliqzSpellCheck;
    return {
        setters: [function (_autocompleteAutocomplete) {
            autocomplete = _autocompleteAutocomplete["default"];
        }, function (_coreCliqz) {
            utils = _coreCliqz.utils;
        }],
        execute: function () {
            CliqzSpellCheck = {
                check: function check(q) {
                    var words = q.split(" ");
                    var correctBack = {};
                    for (var i = 0; i < words.length; i++) {
                        if (words[i] == "") continue;
                        if (autocomplete.spellCorrectionDict.hasOwnProperty(words[i])) {
                            var correct = autocomplete.spellCorrectionDict[words[i]];
                            if (correct.length > words[i].length && correct.slice(0, words[i].length) == words[i] && i == words.length - 1) continue;
                            if (correct.length < words[i].length && words[i].slice(0, correct.length) == correct && i == words.length - 1) continue;
                            if (i == words.length - 1 && words[i].length <= 10) // long enough to correct the last word
                                continue;
                            correctBack[correct] = words[i];
                            words[i] = correct;
                        }
                    }
                    return [words.join(" "), correctBack];
                },
                loadRecords: function loadRecords(req) {
                    var content = req.response.split("\n");
                    for (var i = 0; i < content.length; i++) {
                        var words = content[i].split("\t");
                        var wrong = words[0];
                        var right = words[1];
                        autocomplete.spellCorrectionDict[wrong] = right;
                    }
                },
                init: function init() {
                    if (utils.getPref("config_location", "") == "de" && Object.keys(autocomplete.spellCorrectionDict).length == 0) {
                        utils.log('loading dict', 'spellcorr');
                        utils.loadResource('chrome://cliqz/content/spell_check.list', CliqzSpellCheck.loadRecords);
                    }
                }
            };

            _export("default", CliqzSpellCheck);
        }
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImF1dG9jb21wbGV0ZS9zcGVsbC1jaGVjay5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7NkJBR0ksZUFBZTs7Ozs7K0JBRlYsS0FBSzs7O0FBRVYsMkJBQWUsR0FBRztBQUNsQixxQkFBSyxFQUFFLGVBQVMsQ0FBQyxFQUFFO0FBQ2Ysd0JBQUksS0FBSyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7QUFDekIsd0JBQUksV0FBVyxHQUFHLEVBQUUsQ0FBQTtBQUNwQix5QkFBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLEtBQUssQ0FBQyxNQUFNLEVBQUUsQ0FBQyxFQUFFLEVBQUU7QUFDbkMsNEJBQUksS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUUsRUFBRSxTQUFTO0FBQzdCLDRCQUFJLFlBQVksQ0FBQyxtQkFBbUIsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7QUFDM0QsZ0NBQUksT0FBTyxHQUFHLFlBQVksQ0FBQyxtQkFBbUIsQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUN6RCxnQ0FBSSxPQUFPLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQ2hDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQyxDQUFDLElBQzdDLENBQUMsSUFBSSxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxTQUFTO0FBQ3BDLGdDQUFJLE9BQU8sQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLE1BQU0sSUFDaEMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsT0FBTyxDQUFDLE1BQU0sQ0FBQyxJQUFJLE9BQU8sSUFDNUMsQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLFNBQVM7QUFDcEMsZ0NBQUksQ0FBQyxJQUFJLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLElBQUksRUFBRTtBQUM5Qyx5Q0FBUTtBQUNaLHVDQUFXLENBQUMsT0FBTyxDQUFDLEdBQUcsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0FBQ2hDLGlDQUFLLENBQUMsQ0FBQyxDQUFDLEdBQUcsT0FBTyxDQUFDO3lCQUN0QjtxQkFDSjtBQUNELDJCQUFPLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxXQUFXLENBQUMsQ0FBQztpQkFDekM7QUFDRCwyQkFBVyxFQUFFLHFCQUFTLEdBQUcsRUFBRTtBQUN2Qix3QkFBSSxPQUFPLEdBQUcsR0FBRyxDQUFDLFFBQVEsQ0FBQyxLQUFLLENBQUMsSUFBSSxDQUFDLENBQUM7QUFDdkMseUJBQUssSUFBSSxDQUFDLEdBQUMsQ0FBQyxFQUFFLENBQUMsR0FBRyxPQUFPLENBQUMsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFO0FBQ25DLDRCQUFJLEtBQUssR0FBRyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDO0FBQ25DLDRCQUFJLEtBQUssR0FBRyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDckIsNEJBQUksS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsQ0FBQztBQUNyQixvQ0FBWSxDQUFDLG1CQUFtQixDQUFDLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQztxQkFDbkQ7aUJBQ0o7QUFDRCxvQkFBSSxFQUFFLGdCQUFXO0FBQ2Isd0JBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxpQkFBaUIsRUFBRSxFQUFFLENBQUMsSUFBSSxJQUFJLElBQUksTUFBTSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsbUJBQW1CLENBQUMsQ0FBQyxNQUFNLElBQUksQ0FBQyxFQUFFO0FBQzNHLDZCQUFLLENBQUMsR0FBRyxDQUFDLGNBQWMsRUFBRSxXQUFXLENBQUMsQ0FBQztBQUN2Qyw2QkFBSyxDQUFDLFlBQVksQ0FBQyx5Q0FBeUMsRUFBRSxlQUFlLENBQUMsV0FBVyxDQUFDLENBQUM7cUJBQzlGO2lCQUNKO2FBQ0o7OytCQUVjLGVBQWUiLCJmaWxlIjoiYXV0b2NvbXBsZXRlL3NwZWxsLWNoZWNrLmpzIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IGF1dG9jb21wbGV0ZSBmcm9tIFwiYXV0b2NvbXBsZXRlL2F1dG9jb21wbGV0ZVwiO1xuaW1wb3J0IHsgdXRpbHMgfSBmcm9tIFwiY29yZS9jbGlxelwiO1xuXG52YXIgQ2xpcXpTcGVsbENoZWNrID0ge1xuICAgIGNoZWNrOiBmdW5jdGlvbihxKSB7XG4gICAgICAgIHZhciB3b3JkcyA9IHEuc3BsaXQoXCIgXCIpO1xuICAgICAgICB2YXIgY29ycmVjdEJhY2sgPSB7fVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHdvcmRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAod29yZHNbaV0gPT0gXCJcIikgY29udGludWU7XG4gICAgICAgICAgICBpZiAoYXV0b2NvbXBsZXRlLnNwZWxsQ29ycmVjdGlvbkRpY3QuaGFzT3duUHJvcGVydHkod29yZHNbaV0pKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvcnJlY3QgPSBhdXRvY29tcGxldGUuc3BlbGxDb3JyZWN0aW9uRGljdFt3b3Jkc1tpXV07XG4gICAgICAgICAgICAgICAgaWYgKGNvcnJlY3QubGVuZ3RoID4gd29yZHNbaV0ubGVuZ3RoICYmXG4gICAgICAgICAgICAgICAgICAgIGNvcnJlY3Quc2xpY2UoMCwgd29yZHNbaV0ubGVuZ3RoKSA9PSB3b3Jkc1tpXSAmJlxuICAgICAgICAgICAgICAgICAgICBpID09IHdvcmRzLmxlbmd0aCAtIDEpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGlmIChjb3JyZWN0Lmxlbmd0aCA8IHdvcmRzW2ldLmxlbmd0aCAmJlxuICAgICAgICAgICAgICAgICAgICB3b3Jkc1tpXS5zbGljZSgwLCBjb3JyZWN0Lmxlbmd0aCkgPT0gY29ycmVjdCAmJlxuICAgICAgICAgICAgICAgICAgICBpID09IHdvcmRzLmxlbmd0aCAtIDEpIGNvbnRpbnVlO1xuICAgICAgICAgICAgICAgIGlmIChpID09IHdvcmRzLmxlbmd0aCAtIDEgJiYgd29yZHNbaV0ubGVuZ3RoIDw9IDEwKSAgLy8gbG9uZyBlbm91Z2ggdG8gY29ycmVjdCB0aGUgbGFzdCB3b3JkXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlXG4gICAgICAgICAgICAgICAgY29ycmVjdEJhY2tbY29ycmVjdF0gPSB3b3Jkc1tpXTtcbiAgICAgICAgICAgICAgICB3b3Jkc1tpXSA9IGNvcnJlY3Q7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIFt3b3Jkcy5qb2luKFwiIFwiKSwgY29ycmVjdEJhY2tdO1xuICAgIH0sXG4gICAgbG9hZFJlY29yZHM6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgY29udGVudCA9IHJlcS5yZXNwb25zZS5zcGxpdChcIlxcblwiKTtcbiAgICAgICAgZm9yICh2YXIgaT0wOyBpIDwgY29udGVudC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHdvcmRzID0gY29udGVudFtpXS5zcGxpdChcIlxcdFwiKTtcbiAgICAgICAgICAgIHZhciB3cm9uZyA9IHdvcmRzWzBdO1xuICAgICAgICAgICAgdmFyIHJpZ2h0ID0gd29yZHNbMV07XG4gICAgICAgICAgICBhdXRvY29tcGxldGUuc3BlbGxDb3JyZWN0aW9uRGljdFt3cm9uZ10gPSByaWdodDtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh1dGlscy5nZXRQcmVmKFwiY29uZmlnX2xvY2F0aW9uXCIsIFwiXCIpID09IFwiZGVcIiAmJiBPYmplY3Qua2V5cyhhdXRvY29tcGxldGUuc3BlbGxDb3JyZWN0aW9uRGljdCkubGVuZ3RoID09IDApIHtcbiAgICAgICAgICAgIHV0aWxzLmxvZygnbG9hZGluZyBkaWN0JywgJ3NwZWxsY29ycicpO1xuICAgICAgICAgICAgdXRpbHMubG9hZFJlc291cmNlKCdjaHJvbWU6Ly9jbGlxei9jb250ZW50L3NwZWxsX2NoZWNrLmxpc3QnLCBDbGlxelNwZWxsQ2hlY2subG9hZFJlY29yZHMpO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBDbGlxelNwZWxsQ2hlY2s7XG4iXX0=