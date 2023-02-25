import { longBookNames, shortBookNames } from "./naming"

// export const referenceRegEx = new RegExp(
//   `([1-4] )?${bookMatch}\\.? \\d{1,3}(:\\d{1,3})?(-([1-4] )?${bookMatch}\\.? \\d{1,3}:\\d{1,3}|(-\\d{1,3})?[, (]+\\d{1,3}(:\\d{1,3})?(-\\d{1,3})?|-\\d{1,3}:\\d{1,3}|-\\d{1,3})*(; \\d{1,3}(:\\d{1,3})?(-\\d{1,3})?)?`,
//   "gm"
// )

const bookMatch = `${longBookNames.join("|")}|${shortBookNames.join("|")}`
export const matchVerseGlobal = /\d{1,3}/g
export const matchReference = new RegExp(
  `^(?<book>${bookMatch})[. ]+(?<chapter>\\d{1,3}):(?<verseString>[\\d, -]+)`,
  "i"
)
