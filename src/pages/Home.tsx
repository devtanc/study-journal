import type { IMarker, IAnnotation } from "react-ace"
import { useCallback, useEffect, useRef, useState } from "react"
import ReactAce from "react-ace/lib/ace"
import ace, { type Ace } from "ace-builds"

import { Editor } from "components/Editor"
import StudyJournalMode, { TokenNames } from "components/customMode"
import { NameCompleter, ScriptureCompleter } from "components/customCompletions"
import { allBookNames } from "lib/naming"

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

type ActionInfo = {
  action: "insert" | "remove"
  id: number
  start: Range
  end: Range
  lines: string[]
}

interface Token extends Ace.Token {
  type: TokenNames
}

const bookNameMatch = `/^${allBookNames.join("|")}(?=\\. )/`
const processTokens = (tokens: Token[]): Token[] =>
  tokens
    .filter((token) => token.type.startsWith("scripture.reference"))
    .map((token, index, tokens) => {
      if (token.type === TokenNames.ScriptureReferenceNobook) {
        for (let i = index; i >= 0; i--) {
          if (tokens[i]?.type === TokenNames.ScriptureReferenceWithbook) {
            const [book] = tokens[i].value.match(bookNameMatch) ?? []
            if (!book) continue

            return {
              ...token,
              value: `${book} ${token.value}`,
              type: TokenNames.ScriptureReferenceWithbook,
            }
          }
        }
      }
      return token
    })

export const Home = () => {
  const editorComponent = useRef<ReactAce>(null)

  const [editorText, setEditorText] = useState("")
  const [annotations, setAnnotations] = useState<IAnnotation[]>([annotationTest])
  const [markers, setMarkers] = useState<IMarker[]>([markerTest])
  const [scriptures, setScriptures] = useState<Token[][]>([])
  const [currentlyHoveredToken, setCurrentlyHoveredToken] = useState<Token | null>(null)

  const handleChange = useCallback(
    (text: string, actionInfo: ActionInfo) => {
      localStorage.setItem(key, text)
      setEditorText(text.includes("–") ? text.replace(/–/g, "-") : text)

      if (editorComponent.current) {
        const session = editorComponent.current.editor.getSession()
        const { start, end, lines } = actionInfo

        if (start.row === end.row && lines.length === 1) {
          const tokens = session.getTokens(start.row) as Token[]
          return setScriptures((current) => {
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

        return setScriptures((current) => [...current.slice(0, start.row), ...tokenRows])
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

    const handleMouseMove = (event: any) => {
      // This isn't giving the correct position when the text is wrapped... :|
      const position = editor.renderer.pixelToScreenCoordinates(event.x, event.y)
      const token = session.getTokenAt(position.row, position.column) as Token | null
      setCurrentlyHoveredToken((current) => {
        if (current === null && token === null) return current
        if (current?.type === token?.type && current?.value === token?.value) {
          return current
        }
        return token
      })
    }

    editor.on("mousemove", handleMouseMove)
    return () => editor.removeEventListener("mousemove", handleMouseMove)
  }, [editorComponent])

  // useEffect(() => {
  //   console.log(scriptures.slice(0, 25))
  // }, [scriptures])

  // useEffect(() => {
  //   console.log(currentlyHoveredToken)
  // }, [currentlyHoveredToken])

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
