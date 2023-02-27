import ace from "ace-builds"
import { allBookNames, allNouns, namesForChrist } from "../lib/naming"

const books = allBookNames.join("|")
const names = allNouns.join("|")
const christNames = namesForChrist.join("|")

export enum TokenNames {
  ConferenceTalk = "url.conference.talk",
  UrlYoutube = "url.youtube",
  UrlGeneral = "url.general",
  ScriptureReferenceWithbook = "scripture.reference.withbook",
  ScriptureReferenceNobook = "scripture.reference.nobook",
  KeywordNamechrist = "keyword.namechrist",
  KeywordName = "keyword.name",
}

const noBookRegex = /\d{1,3}:\d{1,3}(-\d{1,3})?(, ?\d{1,3}(?:(?!:\d| ))(-\d{1,3})?)*(?:(?!\d))/
const noBookRegexString = noBookRegex.toString().slice(1, -1)
export class StudyJournalHighlightRules extends ace.require("ace/mode/text_highlight_rules")
  .TextHighlightRules {
  constructor() {
    super()
    this.$rules = {
      start: [
        {
          token: TokenNames.ScriptureReferenceWithbook,
          regex: `(?<=^|\\s|\\W)(${books})\\.? ${noBookRegexString}`,
        },
        {
          token: TokenNames.ScriptureReferenceNobook,
          regex: noBookRegex,
        },
        {
          token: TokenNames.ConferenceTalk,
          regex:
            /https?:\/\/(www\.)?churchofjesuschrist.org\/study\/(general-conference|ensign)[-a-zA-Z0-9()@:%_+.~#?&/=]*/,
        },
        {
          token: TokenNames.UrlYoutube,
          regex: /https?:\/\/(www\.)?youtube.com\/watch\?[-a-zA-Z0-9()@:%_+.~#?&/=]*/,
        },
        {
          token: TokenNames.UrlGeneral,
          regex:
            /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}(\.[a-zA-Z0-9()]{1,6}\b)?[-a-zA-Z0-9()@:%_+.~#?&/=]*/,
        },
        // {
        //   token: TokenNames.KeywordNamechrist,
        //   regex: `(?<=^|\\s|\\W)(${christNames})(?=$|\\W|\\s[^\\d]|\\d)`,
        //   caseInsensitive: true,
        // },
        // {
        //   token: TokenNames.KeywordName,
        //   regex: `(?<=^|\\s|\\W)(${names})(?=$|\\W|\\s[^\\d]|\\d)`,
        //   caseInsensitive: true,
        // },
      ],
    }
  }
}

export default class StudyJournalMode extends ace.require("ace/mode/text").Mode {
  constructor() {
    super()
    this.HighlightRules = StudyJournalHighlightRules
  }
}
