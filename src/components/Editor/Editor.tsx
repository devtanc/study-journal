import React from "react"
import ReactAce from "react-ace/lib/ace"
import AceEditor, { type IAnnotation, type IMarker } from "react-ace"
import "./editor.css"

import "ace-builds/webpack-resolver"
import "ace-builds/src-noconflict/mode-text"
import "ace-builds/src-noconflict/worker-base"
import "ace-builds/src-noconflict/theme-solarized_light"

interface EditorProps {
  onChange: any
  value: string
  annotations?: IAnnotation[]
  markers?: IMarker[]
}

export const Editor = React.forwardRef<ReactAce, EditorProps>(
  ({ onChange, value, annotations, markers }, ref) => {
    return (
      <AceEditor
        annotations={annotations}
        editorProps={{ $blockScrolling: true }}
        enableBasicAutocompletion={false}
        enableLiveAutocompletion={false}
        enableSnippets={false}
        focus
        fontSize={14}
        highlightActiveLine={false}
        markers={markers}
        mode="text"
        name="ace-editor"
        onChange={onChange}
        ref={ref}
        showGutter={false}
        style={{ width: "100%", height: "100%" }}
        theme="solarized_light"
        value={value}
        wrapEnabled={true}
      />
    )
  }
)
