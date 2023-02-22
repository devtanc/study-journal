import { type Ace } from "ace-builds"
import { allBookNamesWithoutNumbers, characterNames } from "lib/naming"

export const ScriptureCompleter: Ace.Completer = {
  getCompletions: (editor, session, position, prefix, callback) => {
    if (prefix.length === 0 || prefix.match(/^\d ?$/)) {
      callback(null, [])
      return
    }

    const matches = allBookNamesWithoutNumbers.filter((name) =>
      name.toLowerCase().startsWith(prefix.toLowerCase())
    )
    callback(
      null,
      matches.map(
        (value): Ace.Completion => ({
          value,
          score: 100,
        })
      )
    )
  },
}

export const NameCompleter: Ace.Completer = {
  getCompletions: (editor, session, position, prefix, callback) => {
    if (prefix.length === 0 || prefix.match(/^\d ?$/)) {
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
          score: 100,
        })
      )
    )
  },
}
