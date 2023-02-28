import neo4j from "neo4j-driver"
import express from "express"
import bodyParser from "body-parser"

const app = express()
app.use(bodyParser.json())

const port = process.env.PORT ?? 8080

const uri = process.env.NEO4J_URI ?? ""
const username = process.env.NEO4J_USERNAME ?? ""
const password = process.env.NEO4J_PASSWORD ?? ""

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password))

const scriptureQuery = `
MATCH (s:Scripture)-[:IN]->(b:Book)
WHERE b.title IN $titles AND s.verse_title IN $references
RETURN s.verse_title AS reference, s.scripture_text AS text
`

app.get("/", (req, res) => {
  res.send("Hello World!")
})

app.post("/scriptures", async (req, res) => {
  const body = req.body
  const { titles, references } = body ?? {}
  if (
    !(Array.isArray(titles) && Array.isArray(references)) ||
    !(titles.length || references.length)
  )
    return res.sendStatus(400)

  const session = driver.session()
  let error: Error | null = null
  try {
    await session.executeWrite(async (tx) => {
      const result = await tx.run(scriptureQuery, {
        titles,
        references,
      })
      res.json(
        result.records.reduce((acc: { [key: string]: string }, record) => {
          acc[record.get("reference")] = record.get("text")
          return acc
        }, {})
      )
    })
  } catch (err: any) {
    error = err
  } finally {
    await session.close()
  }

  if (error) {
    res.status(500)
    res.send(error.message)
  }
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
