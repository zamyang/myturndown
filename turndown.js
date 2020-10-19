const fs = require('fs')
const TurndownService = require('turndown')
const htmlParser = require('node-html-parser')
const turndownPluginGfm = require('turndown-plugin-gfm')
// Remove html element, by <element>, #id, .class
const removeElement = ['#footer', '#breadcrumb-section', '#attachments', 'head', '.greybox', 'style', 'hr']
const baseURL = 'http://172.16.254.204:8090/display/GEN'
// Replacement afrer tranfer to md
const replacements = [
  {
    key:'_<',
    replace: '<_'
  },
  {
    key:'>_',
    replace: '_\\>'
  },
  {
    key:'AnalyticsIngestor',
    replace:'Analytics, Ingestor'
  },
  {
    key:new RegExp('Created by.*'),
    replace:''
  },
  {
    key: 'GenieAnalytics 1.1 : ',
    replace:''
  }
]
function splitUppercase(str) {
  return str.split(/(?=[A-Z])/)
}
// create an instance of Turndown service
var gfm = turndownPluginGfm.gfm
var turndownService = new TurndownService()
turndownService = turndownService.use(gfm)
function transfer(src, dst) {
  // convert HTML to Markdown
  let htmlString = fs.readFileSync(src.toString())
  let root = htmlParser.parse(htmlString)
  // Hardcode logic, remove all them .html for a.href
  /*
Case 1
  [\]][(]http://172.16.254.204\S+#\S+[)]
  from (http://172.16.254.204:8090/display/GEN/System+Debug+Setting#SystemDebugSetting-Configuration)
  to Systeme-Debug-Setting.md#configuration

Case 2
  [\]][(]http://172.16.254.204\S+[?]\S+[)]
  http://172.16.254.204:8090/pages/viewpage.action?pageId=19497123
  Need Fix manually
Case 3
  [\]][(]http://172.16.254.204\S+[)]
  (http://172.16.254.204:8090/display/GEN/System+Node+Setting), (http://172.16.254.204:8090/display/GEN/show+logging)
  to show-logging.md

  */
  let aNodes = root.querySelectorAll('a')
  aNodes.forEach((a) => {
    let href = a.getAttribute('href')
    if (href.includes('.html') && !href.includes('http')){
      newHref = href.replace(/[_]\d+.html/, '.md')
      if (href.includes('#')) {
        let newHrefArr = newHref.split('#')
        newHrefArr[1] = splitUppercase(newHrefArr[1].split('-')[1]).map(x => x.toLowerCase()).join('-')
        newHref = newHrefArr.join('#')
        // console.log([href, newHref])
      }
      // newHref = newHref.replace('.html', '.md')
      a.setAttribute('href', newHref)
      // console.log([href, newHref])
    } else if (href.match('#[A-Z].*-.+') && !href.includes('http')) { //#AggregatePanel-AggregatePanes --> Aggragate-Panel.md#aggregate-panes
      let upper = `${splitUppercase(href.split('-')[0].replace('#', '')).join('-')}.md`
      let lower = splitUppercase(href.split('-')[1]).map(x => x.toLowerCase()).join('-')
      a.setAttribute('href', `${upper}#${lower}`)
      // console.log([href, `${upper}#${lower}`])
    } else if (href.includes(baseURL)) {
      let newHref = href.split('/').pop()
      if (newHref.includes('#')) { //(http://172.16.254.204:8090/display/GEN/System+Debug+Setting#SystemDebugSetting-Configuration)
        newHref = newHref.split('#').pop()
        let upper = `${splitUppercase(newHref.split('-')[0].replace('#', '')).join('-')}.md`
        let lower = splitUppercase(newHref.split('-')[1]).map(x => x.toLowerCase()).join('-')
        newHref = `${upper}#${lower}`
      } else { // http://172.16.254.204:8090/display/GEN/show+logging
        newHref = newHref.split('+').join('-') + '.md'
      }
      a.setAttribute('href', newHref)
      // console.log([href, newHref])
    } else {
      // console.log(href)
    }
  })
  // Remove elements
  removeElement.forEach((i) => {
    let nodes = root.querySelectorAll(i)
    if (nodes) {
      nodes.forEach((i) => { i.parentNode.removeChild(i) })
    }
  })
  const rootString = root.toString()
  turndownService.addRule('codeblock', {
    filter: ['pre'],
    replacement: function (content) {
      return '```\n' + content + '\n```'
    }
  })

  turndownService.addRule('table', {
    filter: (node, options) => { return node.nodeName == 'TABLE' },
    replacement: function (content) {
      let arr = content.split('\n').filter(i => i != '').join('').split('||')
      let first = arr.shift()
      let nbCol = (first.match(/\|/g) || []).length
      let output = first + '|\n|'
      for (let i = 0; i < nbCol; i++) {
        output += ' --- |'
      }
      output += '\n'
      arr.forEach((i) => {
        output += '| ' + i + ' |\n'
      })
      return output
    }
  })
  const markdown = turndownService.turndown(rootString).split('\n')
  markdown.forEach((m, index) => {
    replacements.forEach((r) => {
      m = m.replace(r.key, r.replace)
    })
    markdown[index] = m
  })
  // output Markdown
  if (dst) {
    fs.writeFileSync(dst, markdown.join('\n'))
  } else {
    console.log(markdown)
  }
}
function printUsage() {
  console.log('node trundown.js <SRC_DIR> <DST_DIR>')
}
function tranferDir(src, dst) {
  let files = fs.readdirSync(src, {withFileTypes:true})
  files.forEach((f) => {
    let srcFilePath = `${src}/${f.name}`
    let dstFilePath = `${dst}/${f.name}`
    if (f.isDirectory()) {
      if (!fs.existsSync(dstFilePath)) {
        fs.mkdirSync(dstFilePath)
        console.log(`mkdir ${dstFilePath}`)
      }
      tranferDir(srcFilePath, dstFilePath)
      return
    }
    if (f.isFile()) {
      if (f.name.includes('.html')) {
        if (f.name.match(/_\d+.html/)) {
          dstFilePath = `${dst}/${f.name.replace(/_\d+.html/, '.md')}`
        } else {
          dstFilePath = dstFilePath.replace('.html', '.md')
        }
        transfer(srcFilePath, dstFilePath)
        console.log(`Transfer ${srcFilePath} to ${dstFilePath}`)
      } else {
        fs.copyFileSync(srcFilePath, dstFilePath)
        console.log(`Copy ${srcFilePath} to ${dstFilePath}`)
      }
    }
  })
}
if (process.argv.length < 4) {
  printUsage()
  process.exit(0)
}
const src = process.argv[2]
const dst = process.argv[3]
if (!fs.existsSync(src)) {
  console.error(`Src ${src} not exist`)
  process.exit(0)
}
if(!fs.lstatSync(src).isDirectory()) {
  console.error(`Src ${src} is not a directory`)
  process.exit(0)
}
if(fs.existsSync(dst) && !fs.lstatSync(dst).isDirectory()) {
 console.error(`Dst ${dst} is not a directory`)
 process.exit(0)
}
if(!fs.existsSync(dst)) {
 fs.mkdirSync(dst)
}
tranferDir(src, dst)
