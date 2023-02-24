// {
//   "book": "1 Nephi",
//   "chapter": 1,
//   "verses": 20
// }
const fs = require("fs")
const versesPerChapterJson = require("./verses-per-chapter-neo4j.json")
const obj = {}

versesPerChapterJson.forEach((data) => {
  const { book, chapter, verses } = data

  if (!obj[book]) {
    obj[book] = {
      [chapter]: verses,
    }
  } else {
    obj[book][chapter] = verses
  }
})

fs.writeFileSync("./verses-per-chapter.json", JSON.stringify(obj))
