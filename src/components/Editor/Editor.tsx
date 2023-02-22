import React from "react"
import ReactAce from "react-ace/lib/ace"
import AceEditor, { type IAnnotation, type IMarker } from "react-ace"
import "./editor.css"

import "ace-builds/webpack-resolver"
import "ace-builds/src-noconflict/ext-language_tools"
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
        ref={ref}
        style={{ width: "100%", height: "100%" }}
        mode="text"
        name="ace-editor"
        theme="solarized_light"
        annotations={annotations}
        editorProps={{ $blockScrolling: true }}
        fontSize={14}
        markers={markers}
        onChange={onChange}
        value={value}
        highlightActiveLine={false}
        // enableBasicAutocompletion
        enableLiveAutocompletion
        wrapEnabled={true}
        enableSnippets
        focus
      />
    )
  }
)
