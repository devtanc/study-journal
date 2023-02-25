import type { IMarker, IAnnotation } from "react-ace"
import { useCallback, useEffect, useRef, useState } from "react"
import ReactAce from "react-ace/lib/ace"
import ace, { type Ace } from "ace-builds"

import { Editor } from "components/Editor"
import StudyJournalMode, { TokenNames } from "components/customMode"
import { NameCompleter, ScriptureCompleter } from "components/customCompletions"
import { allBookNames, shortToLongNameMap } from "lib/naming"
import { matchReference, matchVerseGlobal } from "lib/regex"
import { bookChapterVersesMap } from "lib/bookStatistics"
import { v4 } from "uuid"

type AdjustedRegex = RegExpExecArray & { groups: { [key: string]: string } }

const key = "journal"
const markerTest: IMarker = {
  startRow: 0,
  endRow: 0,
  startCol: 0,
  endCol: 4,
  type: "text",
  className: "test-marker",
}

const annotationTest: IAnnotation = {
  row: 0,
  column: 4,
  text: "reference",
  type: "warning",
}

type Range = {
  row: number
  column: number
}

type Action = "insert" | "remove"
interface ActionInfo {
  action: Action
  id: number
  start: Range
  end: Range
  lines: string[]
}

interface Token extends Ace.Token {
  type: TokenNames
  valueWithBook: string
}

interface Reference {
  book: typeof allBookNames[number]
  chapter: number
  verseString: string
  verses?: number[]
  matches?: (number | number[])[]
  error?: string
}

interface TokenError {
  message: string
  row: number
  col: number
  length: number
}

interface TokenErrorsByRow {
  [key: string]: TokenError[]
}

interface NormalizedReferences {
  [key: string]: { [key: string]: number[] }
}

const bookNameMatch = `/^${allBookNames.join("|")}(?=\\. )/`
const processTokens = (tokens: Token[]): Token[] =>
  tokens.map((token, index, tokens) => {
    if (token.type === TokenNames.ScriptureReferenceNobook) {
      for (let i = index; i >= 0; i--) {
        if (tokens[i]?.type === TokenNames.ScriptureReferenceWithbook) {
          const [book] = tokens[i].value.match(bookNameMatch) ?? []
          if (!book) continue

          return {
            ...token,
            valueWithBook: `${book} ${token.value}`,
            type: TokenNames.ScriptureReferenceWithbook,
          }
        }
      }
    }
    return token
  })

const processVerseString = (
  str: string,
  book: string,
  chapter: number
): { verses: number[]; matches: Reference["matches"]; error?: Reference["error"] } => {
  let inRange = false
  let matchStr: string | undefined | null = null
  let lastMatch: number | null = null
  const maxVerseCount = bookChapterVersesMap?.[book]?.[chapter]

  const result: Reference["verses"] = []
  const matches: Reference["matches"] = []
  if (!maxVerseCount) {
    return bookChapterVersesMap?.[book]
      ? { verses: result, matches, error: "Invalid book name" }
      : { verses: result, matches, error: "Invalid chapter specified" }
  }

  matchVerseGlobal.lastIndex = 0

  do {
    ;[matchStr] = matchVerseGlobal.exec(str) ?? []
    if (!matchStr) continue
    const match = parseInt(matchStr)
    if (match > maxVerseCount) {
      return {
        verses: result,
        matches,
        error: "Invalid verse selection or verse selection out of range",
      }
    }

    if (inRange && lastMatch) {
      for (let i = lastMatch; i <= match; i++) {
        result.push(i)
      }
      matches.push([lastMatch, match])
      if (match <= lastMatch) {
        return { verses: result, matches, error: "Invalid range of verses" }
      }
      lastMatch = null
    } else {
      inRange = str[matchVerseGlobal.lastIndex] === "-"
      if (!inRange) {
        result.push(match)
        matches.push(match)
      }
      lastMatch = match
    }
  } while (matchStr)

  if (!result || result.length === 0) {
    return {
      verses: result,
      matches,
      error: "Invalid verse selection or verse selection out of range",
    }
  }

  return { verses: result, matches }
}

const processReferenceString = (reference: string): Reference => {
  const result = matchReference.exec(reference) as AdjustedRegex
  const { book: dirtyBook, chapter: chapterStr, verseString } = result.groups ?? {}
  const book = shortToLongNameMap?.[dirtyBook] ?? dirtyBook
  const chapter = parseInt(chapterStr)

  const { verses, matches, error } = processVerseString(verseString, book, chapter)

  return {
    book,
    chapter,
    verseString,
    verses,
    matches,
    error,
  }
}

export const Home = () => {
  const editorComponent = useRef<ReactAce>(null)

  // const [currentlyHoveredToken, setCurrentlyHoveredToken] = useState<Token | null>(null)
  const [editorText, setEditorText] = useState<string>("")
  const [annotations, setAnnotations] = useState<IAnnotation[]>([annotationTest])
  const [markers, setMarkers] = useState<IMarker[]>([markerTest])
  const [actionInfo, setActionInfo] = useState<ActionInfo>()

  const [scriptureTokenRows, setScriptureTokenRows] = useState<Token[][]>([])
  const [tokenErrors, setTokenErrors] = useState<TokenErrorsByRow>({})
  const [normalizedReferences, setNormalizedReferences] = useState<NormalizedReferences>({})

  const handleChange = useCallback(
    (text: string, actionInfo: ActionInfo) => {
      localStorage.setItem(key, text)
      setEditorText(text.includes("–") ? text.replace(/–/g, "-") : text)
      setActionInfo(actionInfo)

      if (editorComponent.current) {
        const session = editorComponent.current.editor.getSession()
        const { start, end, lines } = actionInfo

        if (start.row === end.row && lines.length === 1) {
          const tokens = processTokens(session.getTokens(start.row) as Token[])
          return setScriptureTokenRows((current) => {
            current[start.row] = tokens
            return [...current]
          })
        }

        let tokenRows: Token[][] = []
        const endRow = session.getLength()
        // Process everything after the starting row
        for (let row = start.row; row <= endRow; row++) {
          tokenRows.push(processTokens(session.getTokens(row) as Token[]))
        }
        setScriptureTokenRows((current) => [...current.slice(0, start.row), ...tokenRows])
      }
    },
    [editorComponent]
  )

  useEffect(() => {
    if (!editorComponent.current) return
    const editor = editorComponent.current.editor
    const session = editor.getSession()
    const customMode = new StudyJournalMode() as any as Ace.SyntaxMode
    session.setMode(customMode)
    session.setOption("indentedSoftWrap", false)

    const text = localStorage.getItem(key)
    session.setValue(text ?? "")

    const languageTools = ace.require("ace/ext/language_tools")
    languageTools.setCompleters([ScriptureCompleter, NameCompleter])

    // // This isn't giving the correct position when the text is wrapped... :|
    // // Turning off for now
    // const handleMouseMove = (event: any) => {
    //   const position = editor.renderer.pixelToScreenCoordinates(event.x, event.y)
    //   const token = session.getTokenAt(position.row, position.column) as Token | null
    //   setCurrentlyHoveredToken((current) => {
    //     if (current === null && token === null) return current
    //     if (current?.type === token?.type && current?.value === token?.value) {
    //       return current
    //     }
    //     return token
    //   })
    // }

    // editor.on("mousemove", handleMouseMove)
    // return () => editor.removeEventListener("mousemove", handleMouseMove)
  }, [editorComponent])

  useEffect(() => {
    const references: Reference[] = []
    let normalized: NormalizedReferences = {}
    if (!actionInfo) return

    const endRow =
      actionInfo.start.row === actionInfo.end.row
        ? actionInfo.end.row
        : scriptureTokenRows.length - 1
    const processedRowErrors: TokenErrorsByRow = {}
    for (let row = actionInfo.start.row; row <= endRow; row++) {
      processedRowErrors[row] = []
      const tokens = scriptureTokenRows[row]
      let col = 0

      tokens.forEach((token) => {
        const currentCol = col
        col += token.value.length
        if (token.type !== TokenNames.ScriptureReferenceWithbook) return
        const { value, valueWithBook } = token
        const reference = processReferenceString(valueWithBook ?? value)

        if (reference.error) {
          processedRowErrors[row].push({
            message: reference.error,
            col: currentCol,
            row,
            length: token.value.length,
          })
        } else {
          references.push(reference)
          if (!reference.verses) return
          if (!normalized[reference.book]) {
            return (normalized[reference.book] = { [reference.chapter]: reference.verses ?? [] })
          }
          if (!normalized[reference.book][reference.chapter]) {
            return (normalized[reference.book][reference.chapter] = reference.verses ?? [])
          }

          for (const verse of reference.verses) {
            if (!normalized[reference.book][reference.chapter].includes(verse)) {
              normalized[reference.book][reference.chapter].push(verse)
            }
          }
        }
      })
    }
    setNormalizedReferences(normalized)
    setTokenErrors((old) => ({ ...old, ...processedRowErrors }))
  }, [scriptureTokenRows, actionInfo])

  // useEffect(() => {
  //   console.log(currentlyHoveredToken)
  // }, [currentlyHoveredToken])

  useEffect(() => {
    // This set of verses willl change every time, but I think that's okay
    // because we'll fetch that data and put in in local storage and pull whenever we need it
    console.log(normalizedReferences)
  }, [normalizedReferences])

  useEffect(() => {
    const newMarkers: IMarker[] = []

    // TODO: Maybe we can move to arrays for marginally better performance here?
    // Also, removing lines from the document will not remove props from this object
    // But with an array, we could cut it to the length of session.getLines()
    for (const [, errors] of Object.entries(tokenErrors)) {
      for (const error of errors) {
        newMarkers.push({
          type: "text",
          startCol: error.col,
          endCol: error.col + error.length,
          startRow: error.row,
          endRow: error.row,
          className: "reference_error",
        })
      }
    }

    setMarkers(newMarkers)
  }, [tokenErrors, actionInfo])

  return (
    <div className="flex flex-row h-full">
      <div className="w-9/12 ace-solarized-light">
        <Editor
          onChange={handleChange}
          value={editorText}
          annotations={annotations}
          markers={markers}
          ref={editorComponent}
        />
      </div>
      <div className="w-3/12"></div>
    </div>
  )
}
