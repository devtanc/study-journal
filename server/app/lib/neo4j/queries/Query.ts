import { runQuery } from "../driver"

interface GenericParams {
  [key: string]: any
}

export type ReturnFields = string[] | undefined

export abstract class Query<T> {
  abstract returnFields: ReturnFields
  abstract params: GenericParams
  abstract query: string

  abstract preRun(): any | void
  abstract postRun<T>(result: any): T

  async run(returnFields?: ReturnFields): Promise<T> {
    this.preRun()

    const result = await runQuery({
      params: this.params,
      query: this.query,
      returnFields: returnFields ?? this.returnFields,
    })

    return this.postRun ? this.postRun<T>(result) : (result as T)
  }
}
