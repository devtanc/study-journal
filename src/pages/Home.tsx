import type { IMarker, IAnnotation } from "react-ace"
import { useEffect, useRef, useState } from "react"
import ReactAce from "react-ace/lib/ace"
import { Ace } from "ace-builds"

import { Editor } from "components/Editor"
import CustomTextMode, { TokenNames } from "components/customMode"

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

type Token = {
  index: number
  start: number
  type: TokenNames
  value: string
}

type TokenWithRow = Token & {
  row: number
}

export const Home = () => {
  const [value, setValue] = useState(localStorage.getItem(key) ?? "")
  const [annotations, setAnnotations] = useState<IAnnotation[]>([
    annotationTest,
  ])
  const [markers, setMarkers] = useState<IMarker[]>([markerTest])
  const editorComponent = useRef<ReactAce>(null)
  const [scriptures, setScriptures] = useState<string[]>([])

  useEffect(() => {
    if (!editorComponent.current) return
    const editor = editorComponent.current.editor
    const session = editor.getSession()
    const customMode = new CustomTextMode() as any as Ace.SyntaxMode
    session.setMode(customMode)

    const handleMouseMove = (test: any) => {
      const position = editor.renderer.pixelToScreenCoordinates(test.x, test.y)
      console.log(position)
      const token = session.getTokenAt(position.row, position.column)
      console.log(token)
    }

    editor.on("mousemove", handleMouseMove)
    return () => editor.removeEventListener("mousemove", handleMouseMove)
  }, [editorComponent])

  const handleChange = (text: string, actionInfo: ActionInfo) => {
    localStorage.setItem(key, text)
    setValue(text.includes("–") ? text.replace(/–/g, "-") : text)
    console.log(actionInfo)
    if (editorComponent.current) {
      const session = editorComponent.current.editor.getSession()
      let scriptures: TokenWithRow[] = []
      switch (actionInfo.action) {
        case "insert": {
          const { start, end } = actionInfo
          for (let row = start.row; row <= end.row; row++) {
            scriptures = [
              ...scriptures,
              ...(session.getTokens(row) as Token[])
                .filter((token) => token.type.startsWith("scripture.reference"))
                .map((token, index, tokens) => {
                  if (token.type === TokenNames.ScriptureReferenceNobook) {
                    for (let i = index; i >= 0; i--) {
                      if (
                        tokens[i]?.type ===
                        TokenNames.ScriptureReferenceWithbook
                      ) {
                        const [book] =
                          tokens[i].value.match(
                            /([1-4] )?[a-zA-Z&]+(?=[. ]{1,2})/
                          ) ?? []
                        if (!book) continue

                        const newToken = {
                          ...token,
                          row,
                          value: `${book} ${token.value}`,
                          type: TokenNames.ScriptureReferenceWithbook,
                        }
                        console.log(newToken)
                        return newToken
                      }
                    }
                    return { ...token, row }
                  }
                  return { ...token, row }
                }),
            ]
          }
          break
        }
        case "remove": {
          const { start } = actionInfo
          scriptures = (session.getTokens(start.row) as Token[])
            .filter((token) => token.type.startsWith("scripture.reference"))
            .map((token) => ({ ...token, row: start.row }))
          break
        }
      }

      setScriptures((current) => [
        ...new Set([
          ...current,
          ...scriptures
            .filter(
              (scripture) =>
                scripture.type === TokenNames.ScriptureReferenceWithbook
            )
            .map((scripture) => scripture.value),
        ]),
      ])
    }
  }

  useEffect(() => {
    console.log(scriptures)
  }, [scriptures])

  return (
    <div className="flex flex-row">
      <div className="w-9/12 px-4 pt-4 h-100 ace-solarized-light">
        <Editor
          onChange={handleChange}
          value={value}
          annotations={annotations}
          markers={markers}
          ref={editorComponent}
        />
      </div>
      <div className="w-3/12 h-screen p-4">
        {/* <ReactMarkdown
          className="markdown"
          children={value}
          remarkPlugins={[remarkGfm]}
        /> */}
      </div>
    </div>
  )
}
