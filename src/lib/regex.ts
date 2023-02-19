import { longBookNames, shortBookNames } from "./naming"

const bookMatch = `((${longBookNames.join("|")}|${shortBookNames.join("|")}))`
export const referenceRegEx = new RegExp(`([1-4] )?${bookMatch}\\.? \\d{1,3}(:\\d{1,3})?(-([1-4] )?${bookMatch}\\.? \\d{1,3}:\\d{1,3}|(-\\d{1,3})?[, (]+\\d{1,3}(:\\d{1,3})?(-\\d{1,3})?|-\\d{1,3}:\\d{1,3}|-\\d{1,3})*(; \\d{1,3}(:\\d{1,3})?(-\\d{1,3})?)?`, "gm")
