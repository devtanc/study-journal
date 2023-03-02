import { runQuery } from "../driver"
import uniq from "lodash.uniq"
import { Query, ReturnFields } from "./Query"

interface ScriptureResult {
  reference: string
  text: string
}

type ScriptureQueryReturnFields = ("reference" | "text")[]
type ScriptureQueryResultArray = [ScriptureResult]
type ScriptureParams = { titles?: string[]; references: string[] }

const matchBook = /([1-4] )?[\w& ]+(?= )/

export class ScriptureQuery extends Query<ScriptureQueryResultArray> {
  query = `
    MATCH (s:Scripture)-[:IN]->(b:Book)
    WHERE b.title IN $titles AND s.verse_title IN $references
    RETURN s.verse_title AS reference, s.scripture_text AS text
  `
  params: ScriptureParams
  returnFields: ScriptureQueryReturnFields | undefined

  constructor(references: string[], returnFields?: ScriptureQueryReturnFields) {
    super()
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

  postRun<ScriptureQueryResultArray>(result: ScriptureQueryResultArray): ScriptureQueryResultArray {
    return result
  }
}
