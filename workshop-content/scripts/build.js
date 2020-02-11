const { execSync } = require('child_process')
const { readFileSync, writeFileSync, mkdirSync } = require('fs')
const uuid = require('uuid/v4')
const glob = require("glob")
const path = require('path');
const rimraf = require("rimraf");


const getUnifiedDiff = (sha, path) => {
    const output = execSync(`git show --unified ${sha} -- ${path}`, {
        cwd: `${__dirname}/../..`
    })
    return output.toString()
}

const showFileAtSha = (sha, path) => {
    const output = execSync(`git show ${sha}:${path}`, {
        cwd: `${__dirname}/../..`
    })
    return output.toString()
}

const templatize = (str, match) => {
    const CLIPBOARD_BUTTON_TAG_TEMPLATE = '<span class="clipBtn clipboard" data-clipboard-target="#__TARGET_ID__">this content</span> (click the gray button to copy to clipboard). ' // trailing space important
    const CLIPBOARD_PRE_TAG_TEMPLATE = '{{< safehtml >}}\n<textarea id="__TARGET_ID__" style="position: relative; left: -1000px; width: 1px; height: 1px;">__FILE_CONTENT__</textarea>\n{{< /safehtml >}}'
    const DIFF_HTML_TEMPLATE = '{{< expand "Click to view diff" >}} {{< safehtml >}}\n<div id="diff-__TARGET_ID__"></div> <script type="text/template" data-diff-for="diff-__TARGET_ID__">__DIFF_CONTENT__</script>\n{{< /safehtml >}} {{< /expand >}}'

    const diffContent = getUnifiedDiff(match.groups.sha, match.groups.file)
    const fileContent = showFileAtSha(match.groups.sha, match.groups.file)
    // Use a deterministic ID based on sha + file path (must start with 'id' to prevent SHAs starting with 0 from causing invalid ID values) to simplify diffs
    const id = 'id'+(match.groups.sha + match.groups.file).replace(/[-\/\.]+/g,"")
    
    // Amazing, since JS treats '$' as a special character when doing replacements, we need to pass a function to replace to ignore escaping issues
    // See https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace#Specifying_a_string_as_a_parameter
    const buttonHtml = CLIPBOARD_BUTTON_TAG_TEMPLATE.replace('__TARGET_ID__', id)
    const preHtml = CLIPBOARD_PRE_TAG_TEMPLATE.replace('__TARGET_ID__', id).replace('__FILE_CONTENT__', () => (fileContent + "\n"))
    const diffHtml = DIFF_HTML_TEMPLATE.replace(/__TARGET_ID__/g, id).replace('__DIFF_CONTENT__', () => (diffContent))

    const startOfMatch = match.index
    const endOfMatch = startOfMatch + match[0].length
    const compiledTemplate = str.slice(0, startOfMatch) + buttonHtml + match.groups.rest + "\n" + diffHtml + "\n" + preHtml + "\n" + str.substr(endOfMatch + 1)
    return compiledTemplate
}

const nextMatch = (str) => {
    const buttonRegex = /___CLIPBOARD_BUTTON (?<sha>.+):(?<file>.+)\|(?<rest>.*)/gm
    const buttonMatches = Array.from(str.matchAll(buttonRegex))
    return buttonMatches[0]
}

const main = () => {
    // templatePath="../source_content/test_index.md"
    templateRootPath="../source_content"
    compiledPath="../content"

    console.log(`Recursively deleting ${compiledPath}`)
    rimraf.sync(compiledPath)

    console.log(`Pre-procssing clipboard buttons from ${templateRootPath} into ${compiledPath}`)
    glob(templateRootPath + "/**/*.md", {}, function (er, files) {
        files.forEach( f => {
            console.log(`Reading ${f}`)

            let templateBufferStr = readFileSync(f).toString()
            let match = nextMatch(templateBufferStr)
            while (match) {
                templateBufferStr = templatize(templateBufferStr, match)
                match = nextMatch(templateBufferStr)
            }

            const destination = compiledPath + f.substr(templateRootPath.length)
            const destinationDir = path.dirname(destination)
            mkdirSync(destinationDir, { recursive: true }, (err) => { if (err) throw err; });
            writeFileSync(destination, templateBufferStr)    
            console.log(`Wrote ${destination}`)
        })
    })
    console.log('Done inserting clipboard buttons.')
}

main()