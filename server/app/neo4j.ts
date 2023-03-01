import neo4j from "neo4j-driver"

const uri = process.env.NEO4J_URI ?? ""
const username = process.env.NEO4J_USERNAME ?? ""
const password = process.env.NEO4J_PASSWORD ?? ""

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password))

interface Neo4JQuery {
  query: string
  params: { [key: string]: any }
}

export const ScriptureQuery = (titles: string[], references: string[]): Neo4JQuery => ({
  query: `
  MATCH (s:Scripture)-[:IN]->(b:Book)
  WHERE b.title IN $titles AND s.verse_title IN $references
  RETURN s.verse_title AS reference, s.scripture_text AS text
`,
  params: {
    titles,
    references,
  },
})

export const runQuery = async (data: Neo4JQuery) => {
  const session = driver.session()
  let response: any = null
  try {
    await session.executeWrite(async (tx) => {
      const result = await tx.run(data.query, data.params)

      response = result.records.reduce((acc: { [key: string]: string }, record) => {
        acc[record.get("reference")] = record.get("text")
        return acc
      }, {})
    })
  } finally {
    await session.close()
  }

  return response
}
