import neo4j from "neo4j-driver"
import lds from "./lds-scriptures.json";
import { v4 as uuidv4 } from "uuid"
import { user, password } from "./creds.ignore"

const uri = "neo4j://localhost:7687"

const driver = neo4j.driver(uri, neo4j.auth.basic(user, password))

type MappedBook = {
    [key: string]: ScriptureVerse[]
}

type MappedVerses = {
    [key: string]: MappedBook
}

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

ldsVerses.forEach(verse => {
    verse.book_short_title = verse.book_short_title.replace(".", "")
    verse.verse_short_title = verse.verse_short_title.replace(".", "")
})

const mappedLdsVerses = ldsVerses.reduce((mapped: MappedVerses, verse: ScriptureVerse): MappedVerses => {
    if (!mapped[verse.volume_title]) {
        mapped[verse.volume_title] = {}
    }
    if (!mapped[verse.volume_title][verse.book_title]) {
        mapped[verse.volume_title][verse.book_title] = []
    }
    mapped[verse.volume_title][verse.book_title].push(verse)
    return mapped
}, {})

const matchNonWordCharacters = new RegExp(/[^\w]/g)

const run = async () => {
    for (const [volumeTitle, mappedBook] of Object.entries(mappedLdsVerses)) {
        for (const [bookTitle, verses] of Object.entries(mappedBook)) {
            const parentCommands = [`MERGE (v:Volume {name: $volumeTitle})`]
            parentCommands.push(`MERGE (b:Book {name: $bookTitle})-[:IN]->(v)`)

            const params: any = {
                volumeTitle,
                bookTitle
            }

            let verseCommands: string[] = []

            for (const [index, verse] of verses.entries()) {
                const paramName = "v" + verse.verse_short_title.replace(matchNonWordCharacters, "")
                const uuid = `v${uuidv4()}`.replace(matchNonWordCharacters, "")
                verseCommands.push(`MERGE (${uuid}:Scripture)-[:IN]->(b) SET ${uuid} = $${paramName}`)
                params[paramName] = verse

                if (index % 50 === 0 || index === verses.length - 1) {
                    const command = [...parentCommands, ...verseCommands].join("\n")
        
                    const session = driver.session({ fetchSize: 100 })
                    try {
                        await session.executeWrite(async tx => {
                            const records = await tx.run(command, params)
                            console.log(records.summary)
                        }, { timeout: 10000 })
                    } catch(error) {
                        console.log(error)
                    } finally {
                        await session.close()
                        verseCommands = []
                    }
                }
            }

        }
    }

    await driver.close();
}

run()