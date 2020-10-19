# Confluence 2 mkdocs tools
This is the tools for import from Atlassian Confluence 6.2.0 to mkdocs

## Based on
1. turndown
1. turndown-gfm
1. node-html-parser

## Why build the wheel
1. turndown/turndown-gfm did not translate very well
   * Table
   * Code block
   * Reference for relavtive link
2. exported html contain serval unnessarry elements
3. mkdocs did not check the anchor of relative link

## Usage
### Install
```
    npm install
```
### translate to markdown
```
    node turndown.js <SRC_HTML_DIR> <DST_MKDOCS_DIR>
```
 * All the html from \<SRC_HTML_DIR> would be translated into \<DST_MKDOCS_DIR>
 * All the non-html file would be copied into \<DST_MKDOCS_DIR>
 * file rename convension
   * \<somefilename>_\<numbere>.html would be \<somefilename>.md

### reference check for markdown
```
    node anchorChecker.js <MKDOCS_DIR>
```
   * All the relative link would be check existence of file
   * All the anchor of relative link would be check
   * All the http link would be shown

## Customize
### Remove element from html
* Edit _removeElement_ in the _turndown.js_
  * by \<element>, #id, .class

### Replacement after markdown generated
* Edit _replacement_ in the _turndown.js_
  *  add key to match, and the value to replace

## SPEC of reference link
### Anchor
* Confluence would use CamelCase and PageName and using dash to connect
  * ex: #SomePage-SomeAnchor
* mkdocs use lower case with '-'
  * ex: Some-Page.md#some-anchor
### URL for page
* Confluence would use Upper case with '+'
  * ex: http://some.confluencesite/display/Some+Other+Page


## My step for import confluence to mkdocs
1. Export html from confluence, download and extract it.
2. execute _turndown.js_ to the mkdocs/docs
3. execute _anchorChecker.js_ to correct the reference
4. config for nav for config.yaml
   1. I found the tree-like structure in the index.md
   2. Note when using yaml to config nav, the parent entity cannot have any page.
5. Setup theme or other config
6. And it's done