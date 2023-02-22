import "ace-builds/src-noconflict/mode-text"
import { allBookNames, allNouns, namesForChrist } from "../lib/naming"

const books = allBookNames.join("|")
const names = allNouns.join("|")
const christNames = namesForChrist.join("|")

export class CustomHighlightRules extends globalThis.ace.acequire(
  "ace/mode/text_highlight_rules"
).TextHighlightRules {
  constructor() {
    super()
    this.$rules = {
      start: [
        {
          token: "scripture.reference.withbook",
          regex: `(?<=^|\\s|\\W)(${books})\\.? [\\d:–-]+(, \\d{1,3}([–-]\\d{1,3})?(?:(?!:)))*(?=$|\\s|\\W)`,
        },
        {
          token: "scripture.reference.nobook",
          regex:
            /\d{1,3}:\d{1,3}([–-]\d{1,3}(?:(?!:))|(, \d{1,3}([–-]\d{1,3})?(?:(?!:))))*(?=$|\s|\W)/,
        },
        {
          token: "keyword.namechrist",
          regex: `(?<=^|\\s|\\W)(${christNames})(?=$|\\W|\\s[^\\d]|\\d)`,
          caseInsensitive: true,
        },
        {
          token: "keyword.name",
          regex: `(?<=^|\\s|\\W)(${names})(?=$|\\W|\\s[^\\d]|\\d)`,
          caseInsensitive: true,
        },
      ],
    }
  }
}

export default class CustomTextMode extends globalThis.ace.acequire(
  "ace/mode/text"
).Mode {
  constructor() {
    super()
    this.HighlightRules = CustomHighlightRules
  }
}
