import ace from "ace-builds"
import { allBookNames, allNouns, namesForChrist } from "../lib/naming"

const books = allBookNames.join("|")
const names = allNouns.join("|")
const christNames = namesForChrist.join("|")

export enum TokenNames {
  ScriptureReferenceWithbook = "scripture.reference.withbook",
  ScriptureReferenceNobook = "scripture.reference.nobook",
  KeywordNamechrist = "keyword.namechrist",
  KeywordName = "keyword.name",
}

const noBookRegex =
  /\d{1,3}:\d{1,3}(-\d{1,3})?(, \d{1,3}(?:(?!:\d))(-\d{1,3})?)*(?:(?!\d))/
const noBookString = noBookRegex.toString().slice(1, -1)
export class CustomHighlightRules extends ace.require(
  "ace/mode/text_highlight_rules"
).TextHighlightRules {
  constructor() {
    super()
    this.$rules = {
      start: [
        {
          token: TokenNames.ScriptureReferenceWithbook,
          regex: `(?<=^|\\s|\\W)(${books})\\.? ${noBookString}`,
        },
        {
          token: TokenNames.ScriptureReferenceNobook,
          regex: noBookRegex,
        },
        {
          token: TokenNames.KeywordNamechrist,
          regex: `(?<=^|\\s|\\W)(${christNames})(?=$|\\W|\\s[^\\d]|\\d)`,
          caseInsensitive: true,
        },
        {
          token: TokenNames.KeywordName,
          regex: `(?<=^|\\s|\\W)(${names})(?=$|\\W|\\s[^\\d]|\\d)`,
          caseInsensitive: true,
        },
      ],
    }
  }
}

export default class CustomTextMode extends ace.require("ace/mode/text").Mode {
  constructor() {
    super()
    this.HighlightRules = CustomHighlightRules
  }
}
