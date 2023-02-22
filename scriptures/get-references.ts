import lds from "./lds-scriptures.json" assert { type: "json" }
import { appendFileSync, writeFileSync } from "fs"

const file = "./references.txt"

type ScriptureVerse = {
  volume_title: string
  book_title: string
  book_short_title: string
  chapter_number: number
  verse_number: number
  verse_title: string
  verse_short_title: string
  scripture_text: string
}

const ldsVerses = lds as ScriptureVerse[]
writeFileSync(file, "")

ldsVerses.reduce((prev, verse) => {
  if (prev !== verse.book_title) {
    verse.book_short_title = verse.book_short_title.replace(".", "")
    verse.verse_short_title = verse.verse_short_title.replace(".", "")

    appendFileSync(file, `${verse.book_title}\n`)
    return verse.book_title
  }
  return prev
}, "")
