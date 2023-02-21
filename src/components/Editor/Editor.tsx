import React from "react"
// @ts-ignore
import AceEditor from "react-ace"
// @ts-ignore
import type { IMarker, IAnnotation } from "react-ace/types"
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

export const Editor = React.forwardRef(
  ({ onChange, value, annotations, markers }: EditorProps, ref) => {
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
