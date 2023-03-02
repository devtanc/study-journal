import { Neo4JQuery, runQuery } from "../driver"
import uniq from "lodash.uniq"

type ScriptureQueryReturnFields = ("reference" | "text")[]

interface ScriptureResult {
  reference: string
  text: string
}

export type ScriptureQueryResultArray = [ScriptureResult]

const matchBook = /([1-4] )?[\w& ]+(?= )/

export class ScriptureQuery implements Neo4JQuery {
  query = `
    MATCH (s:Scripture)-[:IN]->(b:Book)
    WHERE b.title IN $titles AND s.verse_title IN $references
    RETURN s.verse_title AS reference, s.scripture_text AS text
  `
  params: { titles?: string[]; references: string[] }
  returnFields: ScriptureQueryReturnFields | undefined

  constructor(references: string[], returnFields?: ScriptureQueryReturnFields) {
    this.returnFields = returnFields
    this.params = {
      references,
    }
  }

  preRun() {
    const titles = uniq(
      this.params.references.map((reference) => {
        const [match] = reference.match(matchBook) ?? []
        return match ?? ""
      })
    ).filter((match) => Boolean(match))
    this.params.titles = titles
  }

  run(returnFields?: ScriptureQueryReturnFields): Promise<ScriptureQueryResultArray> {
    this.preRun()

    return runQuery<ScriptureQueryResultArray>({
      params: this.params,
      query: this.query,
      returnFields: returnFields ?? this.returnFields,
    })
  }
}
