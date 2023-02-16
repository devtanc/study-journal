import neo4j from "neo4j-driver";
import lds from "./lds-scriptures.json";
import { v4 as uuidv4 } from "uuid";
import { user, password } from "./creds.ignore";
import { appendFileSync, writeFileSync } from "fs";
import fs from "fs/promises";

const logFile = "./logs.txt";
const errorFile = "./error.txt";
// const uri = "neo4j://localhost:7687";
const uri = "neo4j://192.168.1.3:7687"

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));

type MappedBook = {
  [key: string]: ScriptureVerse[];
};

type MappedVerses = {
  [key: string]: MappedBook;
};

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

type VerseCommand = {
  paramName: string;
  uuid: string;
  verseTitle: string;
  command: string;
};

const volumeShortTitles: { [key: string]: string } = {
  "Old Testament": "OT",
  "New Testament": "NT",
  "Book of Mormon": "BoM",
  "Pearl of Great Price": "PoGP",
  "Doctrine and Covenants": "D&C",
};

const ldsVerses = lds as ScriptureVerse[];

ldsVerses.forEach((verse) => {
  verse.book_short_title = verse.book_short_title.replace(".", "");
  verse.verse_short_title = verse.verse_short_title.replace(".", "");
});

let volumeCount = 0;
let bookCount = 0;
let verseCount = 0;

const mappedLdsVerses = ldsVerses.reduce(
  (mapped: MappedVerses, verse: ScriptureVerse): MappedVerses => {
    if (!mapped[verse.volume_title]) {
      volumeCount++;
      mapped[verse.volume_title] = {};
    }
    if (!mapped[verse.volume_title][verse.book_title]) {
      bookCount++;
      mapped[verse.volume_title][verse.book_title] = [];
    }
    verseCount++;
    mapped[verse.volume_title][verse.book_title].push(verse);
    return mapped;
  },
  {}
);

writeFileSync(logFile, "");
writeFileSync(errorFile, "");

appendFileSync(
  logFile,
  `Processed ${volumeCount} volumes, containing a total of ${bookCount} books, and ${verseCount} verses\n\n`
);

const matchNonWordCharacters = new RegExp(/[^\w]/g);

const writeChapter = async (
  commands: { parentCommands: string[]; verseCommands: VerseCommand[] },
  params: any,
  prevVerseTitle?: string
) => {
  const { parentCommands, verseCommands } = commands;
  const verseConnectionCommands = verseCommands
    .map((verseCommand, index) => {
      if (index < verseCommands.length - 1) {
        return `MERGE (${verseCommand.uuid})-[:NEXT]->(${
          verseCommands[index + 1].uuid
        })`;
      }
      return null;
    })
    .filter((command) => Boolean(command));

  if (prevVerseTitle) {
    verseConnectionCommands.push(
      `MERGE (prevVerse:Scripture {verse_title: $prevVerseTitle})`
    );
    verseConnectionCommands.push(
      `MERGE (prevVerse)-[:NEXT]->(${verseCommands[0].uuid})`
    );
    params.prevVerseTitle = prevVerseTitle;
  }

  const commandList = [
    ...parentCommands,
    ...verseCommands.map((verse) => verse.command),
    ...verseConnectionCommands,
  ].join("\n");

  const session = driver.session();
  try {
    await session.executeWrite(async (tx) => {
      await tx.run(commandList, params);
      await fs.appendFile(
        logFile,
        `***** QUERY ${verseCommands[0].verseTitle} -> ${
          verseCommands[verseCommands.length - 1].verseTitle
        } [${verseCommands.length} verses] *****\n`
      );
      console.log(
        verseCommands[0].verseTitle,
        " -> ",
        verseCommands[verseCommands.length - 1].verseTitle
      );
    });
  } catch (error: any) {
    await fs.appendFile(
      errorFile,
      `***** ERROR ${verseCommands[0].verseTitle} -> ${
        verseCommands[verseCommands.length - 1].verseTitle
      } *****\n${
        error.message
      }\n\nCOMMAND\n${commandList}\n\nPARAMS\n${JSON.stringify(params)}\n\n\n`
    );
    console.error(error);
  } finally {
    await session.close();
  }
};

const run = async () => {
  let prevVerseTitle: string = "";
  for (const [volumeTitle, mappedBook] of Object.entries(mappedLdsVerses)) {
    let volumeVerseCount = 0;
    for (const [bookTitle, verses] of Object.entries(mappedBook)) {
      let bookVerseActual = 0;
      volumeVerseCount += verses.length;
      const parentCommands = [
        `MERGE (v:Volume {title: $volumeTitle, short_title: $volumeShortTitle})`,
      ];
      parentCommands.push(
        `MERGE (b:Book {title: $bookTitle, short_title: $bookShortTitle})-[:IN]->(v)`
      );
      const { book_short_title } = verses[0];
      let params: any = {
        volumeTitle,
        bookTitle,
        volumeShortTitle: volumeShortTitles[volumeTitle],
        bookShortTitle: book_short_title,
      };

      let verseCommands: VerseCommand[] = [];
      let lastChapterNumber = 0;

      for (const verse of verses) {
        const isSameChapter = lastChapterNumber === verse.chapter_number;
        if (!isSameChapter && lastChapterNumber !== 0) {
          try {
            await writeChapter(
              { verseCommands, parentCommands },
              params,
              prevVerseTitle
            );
            bookVerseActual += verseCommands.length;
          } finally {
            prevVerseTitle = verseCommands[verseCommands.length - 1].verseTitle;
            verseCommands = [];
            params = {
              volumeTitle,
              bookTitle,
              volumeShortTitle: volumeShortTitles[volumeTitle],
              bookShortTitle: book_short_title,
            };
          }
        }

        const paramName =
          "v" + verse.verse_short_title.replace(matchNonWordCharacters, "");
        const uuid = `v${uuidv4()}`.replace(matchNonWordCharacters, "");

        verseCommands.push({
          paramName,
          uuid,
          verseTitle: verse.verse_title,
          command: `CREATE (${uuid}:Scripture)-[:IN]->(b) SET ${uuid} = $${paramName}`,
          // command: `MERGE (${uuid}:Scripture)-[:IN]->(b) ON CREATE SET ${uuid} = $${paramName}`
        });

        const {
          chapter_number,
          scripture_text,
          verse_number,
          verse_short_title,
          verse_title,
        } = verse;
        params[paramName] = {
          chapter_number,
          scripture_text,
          verse_number,
          verse_short_title,
          verse_title,
        };

        lastChapterNumber = verse.chapter_number;
      }

      // Write last chapter
      await writeChapter(
        { verseCommands, parentCommands },
        params,
        prevVerseTitle
      );
      bookVerseActual += verseCommands.length;

      await fs.appendFile(
        logFile,
        `***** BOOK VERSE COUNT: ${verses.length} *****\n***** ACTUAL VERSE COUNT: ${bookVerseActual} *****\n\n`
      );
    }
    await fs.appendFile(
      logFile,
      `***** VOLUME VERSE COUNT: ${volumeVerseCount} *****\n\n`
    );
  }

  await driver.close();
};

run();