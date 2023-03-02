import neo4j from "neo4j-driver"

const uri = process.env.NEO4J_URI ?? ""
const username = process.env.NEO4J_USERNAME ?? ""
const password = process.env.NEO4J_PASSWORD ?? ""

interface Neo4JQuery {
  query: string
  params: { [key: string]: any }
  returnFields: string[] | undefined
}

const driver = neo4j.driver(uri, neo4j.auth.basic(username, password))

export const runQuery = async <T>(query: Neo4JQuery): Promise<T> => {
  const session = driver.session()
  let response: any = null
  try {
    await session.executeRead(async (tx) => {
      const result = await tx.run(query.query, query.params)

      response = result.records.map((record) =>
        (query.returnFields ?? record.keys).reduce((acc: any, key) => {
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
