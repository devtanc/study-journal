import AceEditor from "react-ace"
import "ace-builds/webpack-resolver"
import "ace-builds/src-noconflict/mode-markdown"
import "ace-builds/src-noconflict/theme-idle_fingers"
// @ts-ignore
global.ace = require("ace-builds/src-min-noconflict/ace")

const Editor = ({ onChange, value }: { onChange: any, value: string }) => {
  // TODO: Use the editor session to save the information
  return (
    <AceEditor
      mode="html"
      theme="idle_fingers"
      name="ace-editor"
      onChange={onChange}
      editorProps={{ $blockScrolling: true }}
      enableBasicAutocompletion={false}
      enableLiveAutocompletion={false}
      enableSnippets={false}
      wrapEnabled={true}
      value={value}
    />
  )
}

export default Editor
