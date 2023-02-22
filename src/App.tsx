import "./App.css"
import { Home } from "./pages/Home"

function App() {
  return (
    <>
      <Home />
      <div className="m-16 text-xs text-slate-400">
        <i>
          The products (services) offered on this site are neither made, provided, approved nor
          endorsed by Intellectual Reserve, Inc. or The Church of Jesus Christ of Latter-day Saints.
          Any content or opinions expressed, implied or included in or with the goods (services)
          offered on this site are solely those of the author and not those of Intellectual Reserve,
          Inc. or The Church of Jesus Christ of Latter-day Saints.
        </i>
      </div>
    </>
  )
}

export default App
