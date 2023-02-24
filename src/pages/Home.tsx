import type { IMarker, IAnnotation } from "react-ace"
import { useCallback, useEffect, useRef, useState } from "react"
import ReactAce from "react-ace/lib/ace"
import ace, { type Ace } from "ace-builds"

import { Editor } from "components/Editor"
import StudyJournalMode, { TokenNames } from "components/customMode"
import { NameCompleter, ScriptureCompleter } from "components/customCompletions"
import { allBookNames, shortToLongNameMap } from "lib/naming"
import { matchReference, matchVerse } from "lib/regex"
import { bookChapterVersesMap } from "lib/bookStatistics"

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
}

interface TokenError {
  message: string
  row: number
  col: number
  length: number
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

const processVerseString = (str: string): { verses: number[]; matches: Reference["matches"] } => {
  let inRange = false
  let matchStr: string | undefined | null = null
  let lastMatch: number | null = null

  const result: Reference["verses"] = []
  const matches: Reference["matches"] = []

  do {
    ;[matchStr] = matchVerse.exec(str) ?? []
    if (!matchStr) continue
    const match = parseInt(matchStr)

    if (inRange && lastMatch) {
      for (let i = lastMatch; i <= match; i++) {
        result.push(i)
      }
      matches.push([lastMatch, match])
      lastMatch = null
    } else {
      inRange = str[matchVerse.lastIndex] === "-"
      if (!inRange) {
        result.push(match)
        matches.push(match)
      }
      lastMatch = match
    }
  } while (matchStr)

  matchVerse.lastIndex = 0
  return { verses: result, matches }
}

const processReferenceString = (reference: string): Reference => {
  const result = matchReference.exec(reference) as AdjustedRegex
  const { book, chapter, verseString } = result.groups ?? {}

  const { verses, matches } = processVerseString(verseString)

  return {
    book: shortToLongNameMap[book] ?? book,
    chapter: parseInt(chapter),
    verseString,
    verses,
    matches,
  }
}

export const Home = () => {
  const editorComponent = useRef<ReactAce>(null)

  const [editorText, setEditorText] = useState("")
  const [annotations, setAnnotations] = useState<IAnnotation[]>([annotationTest])
  const [markers, setMarkers] = useState<IMarker[]>([markerTest])
  const [scriptureTokenRows, setScriptureTokenRows] = useState<Token[][]>([])
  const [currentlyHoveredToken, setCurrentlyHoveredToken] = useState<Token | null>(null)
  const [tokenErrors, setTokenErrors] = useState<TokenError[]>([])
  const [normalizedReferences, setNormalizedReferences] = useState<Reference[]>([])

  const handleChange = useCallback(
    (text: string, actionInfo: ActionInfo) => {
      localStorage.setItem(key, text)
      setEditorText(text.includes("–") ? text.replace(/–/g, "-") : text)

      if (editorComponent.current) {
        const session = editorComponent.current.editor.getSession()
        const { start, end, lines } = actionInfo

        if (start.row === end.row && lines.length === 1) {
          const tokens = session.getTokens(start.row) as Token[]
          return setScriptureTokenRows((current) => {
            current[0 + start.row] = tokens
            return [...current]
          })
        }

        let tokenRows: Token[][] = []
        const endRow = session.getLength()
        // Process everything after the starting row
        for (let row = start.row; row <= endRow; row++) {
          tokenRows.push(processTokens(session.getTokens(row) as Token[]))
        }

        return setScriptureTokenRows((current) => [...current.slice(0, start.row), ...tokenRows])
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
    const errors: TokenError[] = []
    scriptureTokenRows.forEach((tokens, row) => {
      let col = 0
      tokens.forEach((token) => {
        if (token.type !== TokenNames.ScriptureReferenceWithbook) {
          col += token.value.length
          return
        }
        const { value, valueWithBook } = token
        const reference = processReferenceString(valueWithBook ?? value)

        let errorMessage = null

        if (!reference.book) {
          // This should never happen due to regex matching for tokens
          errorMessage = "Missing or invalid book name"
        }
        if (!reference.chapter) {
          // This should never happen due to regex matching for tokens
          errorMessage = "Missing chapter"
        }
        if (!reference.verseString) {
          // This should never happen due to regex matching for tokens
          errorMessage = "Missing or invalid verse selection"
        }

        if (!bookChapterVersesMap[reference.book][reference.chapter]) {
          errorMessage = "Invalid chapter or chapter out of range"
        }

        // Is there a way to optimize this?
        reference.matches?.forEach((match) => {
          if (
            Array.isArray(match) &&
            (match[0] > match[1] ||
              match.length !== 2 ||
              match[1] > bookChapterVersesMap[reference.book][reference.chapter])
          ) {
            return (errorMessage = "Invalid range of verses")
          }
          if (match <= 0 || match > bookChapterVersesMap[reference.book][reference.chapter]) {
            return (errorMessage = "Specified verse out of range for specified chapter")
          }
        })

        if (errorMessage) {
          errors.push({
            message: errorMessage,
            col,
            row,
            length: token.value.length,
          })
        }

        references.push(reference)
        col += token.value.length
      })
    })
    // console.log(references)
    setTokenErrors(errors)
  }, [scriptureTokenRows])

  // useEffect(() => {
  //   console.log(currentlyHoveredToken)
  // }, [currentlyHoveredToken])

  useEffect(() => {
    setMarkers(
      tokenErrors.map((error) => ({
        type: "text",
        startCol: error.col,
        endCol: error.col + error.length,
        startRow: error.row,
        endRow: error.row,
        className: "reference_error",
      }))
    )
  }, [tokenErrors])

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
