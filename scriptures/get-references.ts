import lds from "./lds-scriptures.json";
import { appendFileSync, writeFileSync } from "fs";
// import fs from "fs/promises";

const file = "./references.txt";

type ScriptureVerse = {
  volume_title: string;
  book_title: string;
  book_short_title: string;
  chapter_number: number;
  verse_number: number;
  verse_title: string;
  verse_short_title: string;
  scripture_text: string;
};

const ldsVerses = lds as ScriptureVerse[];
writeFileSync(file, "");

const nonWord = /^\d /

ldsVerses.reduce((prev, verse) => {
  if (prev !== verse.book_title) {
    verse.book_short_title = verse.book_short_title.replace(".", "");
    verse.verse_short_title = verse.verse_short_title.replace(".", "");
  
    appendFileSync(file, `${verse.book_short_title.replace(nonWord, "")}\n`)
    return verse.book_title
  }
  return prev
}, "");
