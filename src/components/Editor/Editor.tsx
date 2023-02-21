import React from "react"
import AceEditor from "react-ace"
import "./editor.css"

import "ace-builds/webpack-resolver"
import "ace-builds/src-noconflict/mode-text"
import "ace-builds/src-noconflict/worker-base"
import "ace-builds/src-noconflict/theme-solarized_light"

interface EditorProps {
  onChange: any
  value: string
  annotations?: Annotation[]
  markers?: any[]
}

export interface Annotation {
  row: number
  column: number
  text: string
  type: "error" | "warning" | "info"
}

export interface Marker {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
  type: "text" | "fullLine" | "screenLine"
  className: string
}

export const Editor = React.forwardRef(
  ({ onChange, value, annotations, markers }: EditorProps, ref) => {
    // TODO: Use the editor session to save the information
    return (
      <AceEditor
        mode="text"
        theme="solarized_light"
        name="ace-editor"
        onChange={onChange}
        editorProps={{ $blockScrolling: true }}
        enableBasicAutocompletion={false}
        enableLiveAutocompletion={false}
        enableSnippets={false}
        wrapEnabled={true}
        value={value}
        style={{ width: "100%", height: "100%" }}
        fontSize={14}
        annotations={annotations}
        markers={markers}
        focus
        // @ts-ignore
        ref={ref}
      />
    )
  }
)
