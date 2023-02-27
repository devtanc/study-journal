import { type Ace } from "ace-builds"
import { longBookNamesWithoutNumbers, characterNames } from "lib/naming"

// Leaving this here to document how the actual "prefix" is determined
// If you want to have '.' or some other special character, then it needs to be added to the `identifierRegexps` prop
// along with this ID_REGEX value. It's a character list based reverse search

// var ID_REGEX = /[a-zA-Z_0-9\$\-\u00A2-\u2000\u2070-\uFFFF]/;
// exports.retrievePrecedingIdentifier = function (text, pos, regex) {
//     regex = regex || ID_REGEX;
//     var buf = [];
//     for (var i = pos - 1; i >= 0; i--) {
//         if (regex.test(text[i]))
//             buf.push(text[i]);
//         else
//             break;
//     }
//     return buf.reverse().join("");
// };

export const ScriptureCompleter: Ace.Completer = {
  getCompletions: (editor, session, position, prefix, callback) => {
    if (prefix.length <= 2) {
      callback(null, [])
      return
    }

    const lowerPrefix = prefix.toLowerCase()
    const matches = longBookNamesWithoutNumbers.filter((name) =>
      name.toLowerCase().startsWith(lowerPrefix)
    )

    callback(
      null,
      matches.map(
        (value): Ace.Completion => ({
          value,
          score: 100,
          meta: "Book Title",
        })
      )
    )
  },
}

export const NameCompleter: Ace.Completer = {
  getCompletions: (editor, session, position, prefix, callback) => {
    if (prefix.length <= 2 || prefix.match(/^\d ?$/)) {
      callback(null, [])
      return
    }

    const matches = characterNames.filter((name) =>
      name.toLowerCase().startsWith(prefix.toLowerCase())
    )
    callback(
      null,
      matches.map(
        (value): Ace.Completion => ({
          value,
          score: 90,
          meta: "Person",
        })
      )
    )
  },
}
