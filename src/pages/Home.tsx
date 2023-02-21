import { useEffect, useRef, useState } from "react"
import { Editor } from "components/Editor"
// @ts-ignore
import type { IMarker, IAnnotation } from "react-ace/types"
import CustomTextMode from "components/customMode"

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
  type: "info",
}

export const Home = () => {
  const [value, setValue] = useState(localStorage.getItem(key) ?? "")
  const [annotations, setAnnotations] = useState<IAnnotation[]>([
    annotationTest,
  ])
  const [markers, setMarkers] = useState<IMarker[]>([])
  const editorComponent = useRef()

  useEffect(() => {
    if (!editorComponent.current) return
    const customMode = new CustomTextMode()
    // @ts-ignore
    editorComponent.current.editor.getSession().setMode(customMode)
  }, [editorComponent])

  const handleChange = (md: string) => {
    localStorage.setItem(key, md)
    setValue(md)
  }

  return (
    <div className="flex flex-row">
      <div className="w-9/12 h-100 my-4">
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
