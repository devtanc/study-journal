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

interface ScriptureResult {
  reference: string
  text: string
}

export type ScriptureQueryResultArray = [ScriptureResult]

export const runQuery = async <T>(data: Neo4JQuery): Promise<T> => {
  const session = driver.session()
  let response: any = null
  try {
    await session.executeWrite(async (tx) => {
      const result = await tx.run(data.query, data.params)

      response = result.records.map((record) =>
        record.keys.reduce((acc: any, key) => {
          acc[key] = record.get(key)
          return acc
        }, {})
      )
    })
  } finally {
    await session.close()
  }

  return response as T
}