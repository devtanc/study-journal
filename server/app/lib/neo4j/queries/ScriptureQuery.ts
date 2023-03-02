import { Neo4JQuery, runQuery } from "../driver"

type ScriptureQueryReturnFields = ("reference" | "text")[]

interface ScriptureResult {
  reference: string
  text: string
}

export type ScriptureQueryResultArray = [ScriptureResult]

export class ScriptureQuery implements Neo4JQuery {
  query = `
    MATCH (s:Scripture)-[:IN]->(b:Book)
    WHERE b.title IN $titles AND s.verse_title IN $references
    RETURN s.verse_title AS reference, s.scripture_text AS text
  `
  params
  returnFields: ScriptureQueryReturnFields | undefined

  constructor(titles: string[], references: string[], returnFields?: ScriptureQueryReturnFields) {
    this.returnFields = returnFields
    this.params = {
      titles,
      references,
    }
  }

  run(returnFields?: ScriptureQueryReturnFields): Promise<ScriptureQueryResultArray> {
    return runQuery<ScriptureQueryResultArray>({
      params: this.params,
      query: this.query,
      returnFields: returnFields ?? this.returnFields,
    })
  }
}
