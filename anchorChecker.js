const fs = require('fs')
const readline = require('readline')
// const util = require('util')
// const matchRules [
//   /[(].+.md.+[)]/,
//   /[(]http.+[)]/,
//   /[(].+.md#.+[)]/
// ]
function includeString(filename, stringArr) {
  const f = fs.readFileSync(filename).toString()
  let match = 0
  stringArr.forEach((s) => {
    if(f.includes(s)) {
      match = true
    }
  })
  return match
}
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

function printUsage() {
    console.log('node anchorChecker.js <DIR_OF_MKDOC>')
}
if (process.argv.length < 3) {
  printUsage()
  process.exit(0)
}
const src = process.argv[2]
if (!fs.existsSync(src)) {
  console.error(`Src ${src} not exist`)
  process.exit(0)
}
if(!fs.lstatSync(src).isDirectory()) {
  console.error(`Src ${src} is not a directory`)
  process.exit(0)
}
let files = fs.readdirSync(src, {withFileTypes:true}).forEach((f) => {
  if(!f.name.includes('md') || !f.isFile()) {
    return
  }
  let inputStream = fs.createReadStream(`${src}/${f.name}`)
  let lineReader = readline.createInterface({ input: inputStream })
  let lineCount = 0
  lineReader.on('line', function(line) {
    lineCount ++
    if (line.match(/[(]http\S+[)]/g)) {
      console.log(`${src}/${f.name}:${lineCount} contains http link ${line.match(/[(]http\S+[)]/g)}`)
    }
    if (line.match(/[(]\S+.md[)]/g)) { // (***.md)
      line.match(/[(]\S+.md[)]/g).forEach((refFile) => {
        if (!fs.existsSync(`${src}/${refFile.replace('(', '').replace(')', '')}`)) {
          console.log(`${src}/${f.name}:${lineCount} ref file ${refFile} not exists`)
        }
      })
    }
    if (line.match(/[(]\S+.md#\S+[)]/g)) {// (***.md#anchor)
      line.match(/[(]\S+.md#\S+[)]/g).forEach((r) => {
        let arr = r.replace('(', '').replace(')', '').split('#')
        arr[1] = `${arr[1].split('-').map(capitalizeFirstLetter).join(' ')}`
        if (!fs.existsSync(`${src}/${arr[0]}`)) {
          console.log(`${src}/${f.name}:${lineCount} ref ${r} file not exists`)
          return
        }
        if (!includeString(`${src}/${arr[0]}`, [`# ${arr[1]}`, `${arr[1]}\n===`, `${arr[1]}\n---`])) {
          console.log(`${src}/${f.name}:${lineCount} ref ${r} anchor not exists`)
        }
      })
    }
  })
})
