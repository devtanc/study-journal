import express from "express"
import bodyParser from "body-parser"
import { runQuery, ScriptureQuery } from "./app/neo4j"

const app = express()
app.use(bodyParser.json())

const port = process.env.PORT ?? 8080

app.get("/", (req, res) => {
  res.send("Hello World!")
})

app.post("/scriptures", async (req, res) => {
  const body = req.body
  const { titles, references } = body ?? {}
  if (
    !(Array.isArray(titles) && Array.isArray(references)) ||
    !(titles.length || references.length)
  ) {
    return res.sendStatus(400)
  }

  try {
    const result = await runQuery(ScriptureQuery(titles, references))
    res.json(result)
  } catch (err: any) {
    return res.status(500).send(err.message)
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
