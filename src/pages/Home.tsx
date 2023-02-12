import Editor from "../components/Editor"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useState } from "react"

export const Home = () => {
  const [value, setValue] = useState("")

  const handleChange = (md: string) => setValue(md)

  return (
    <div className="flex flex-row">
      <div className="w-6/12 h-screen">
        <Editor onChange={handleChange} value={value} />
      </div>
      <div className="w-6/12 h-screen p-4">
        <ReactMarkdown
          className="markdown"
          children={value}
          remarkPlugins={[remarkGfm]}
        />
      </div>
    </div>
  )
}
