import { useEffect, useRef, useState } from "react"
import { Editor, Annotation, Marker } from "components/Editor"
import CustomTextMode from "components/customMode"

const key = "journal"
const markerTest = {
  startRow: 0,
  endRow: 0,
  startCol: 0,
  endCol: 4,
  type: "text",
  className: "test-marker",
}

export const Home = () => {
  const [value, setValue] = useState(localStorage.getItem(key) ?? "")
  const [annotations, setAnnotations] = useState<Annotation[]>([
    { row: 0, column: 4, text: "reference", type: "info" },
  ])
  const [markers, setMarkers] = useState<Marker[]>([])
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
