// {
//   "book": "1 Nephi",
//   "chapter": 1,
//   "verses": 20
// }
const fs = require("fs")
const scriptures = require("./lds-scriptures.json")
const obj = {}

scriptures.forEach((scripture) => {
  const { verse_title } = scripture
  obj[verse_title] = scripture
})

fs.writeFileSync("./indexByVerse.json", JSON.stringify(obj))
