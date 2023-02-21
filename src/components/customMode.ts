import "ace-builds/src-noconflict/mode-text"
import { allBookNames, allNouns } from "../lib/naming"

const books = allBookNames.join("|")
const names = allNouns.join("|")

export class CustomHighlightRules extends globalThis.ace.acequire(
  "ace/mode/text_highlight_rules"
).TextHighlightRules {
  constructor() {
    super()
    this.$rules = {
      start: [
        {
          token: "scripture",
          regex: `(?<=^|\\s|\\W)([1-4] )?(${books})\\.? [\\d\\-(:,; ]+(?=$|\\s|\\W)`,
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
