import express from "express"
import bodyParser from "body-parser"
import { ScriptureQuery } from "./app/lib/neo4j/queries"

const app = express()
app.use(bodyParser.json())

const port = process.env.PORT ?? 8080

app.get("/", (req, res) => {
  res.send("Hello World!")
})

app.post("/scriptures", async (req, res) => {
  const body = req.body
  const { references } = body ?? {}
  if (!Array.isArray(references) || !references.length) {
    return res.sendStatus(400)
  }

  try {
    const results = await new ScriptureQuery(references as string[]).run()

    res.json(
      results.reduce((acc: any, result) => {
        acc[result.reference] = result.text
        return acc
      }, {})
    )
  } catch (err: any) {
    return res.status(500).send(err.message)
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
