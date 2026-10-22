/**
 * Verify a package before it is published: every exports target resolves under
 * every condition, every relative import in a shipped module resolves, and
 * README.md, LICENSE and package.json ship.
 *
 *   node scripts/verify-package.mjs packages/solid/dist   # packs it first
 *   node scripts/verify-package.mjs xenon-ui-solid-0.2.2.tgz
 *
 * A directory is packed with `npm pack` into a temporary tarball, so the check
 * sees exactly the bytes npm would upload, not whatever happens to be on disk.
 * 0.2.1 of @xenon-ui/solid shipped 192 of its 433 files because dist/ was being
 * deleted by a second build while npm packed it; this would have rejected it.
 *
 * Exits 1 with one line per problem. Plain Node, so it also runs as the
 * prepublishOnly script of each built package.
 */
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, posix, relative, resolve } from 'node:path'
import process from 'node:process'

const input = process.argv[2]
if (!input) {
  console.error('usage: node scripts/verify-package.mjs <package dir | tarball>')
  process.exit(2)
}

const scratch = mkdtempSync(join(tmpdir(), 'xenon-verify-'))
try {
  let tarball = resolve(input)
  if (statSync(tarball).isDirectory()) {
    const out = execFileSync('npm', ['pack', '--json', '--pack-destination', scratch], {
      cwd: tarball,
      encoding: 'utf8',
      // Running as prepublishOnly must not re-enter npm's lifecycle, and a
      // `publish --dry-run` parent must not stop this pack from writing its tarball.
      env: { ...process.env, npm_config_ignore_scripts: 'true', npm_config_dry_run: 'false' },
    })
    tarball = join(scratch, JSON.parse(out)[0].filename)
  }
  execFileSync('tar', ['-xzf', tarball, '-C', scratch])
  const root = join(scratch, 'package')
  const problems = verify(root)
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const count = walk(root).length
  if (problems.length) {
    console.error(
      `${manifest.name}@${manifest.version}: ${problems.length} problem(s) in ${count} files`
    )
    for (const problem of problems) console.error(`  ${problem}`)
    process.exitCode = 1
  } else
    console.log(`${manifest.name}@${manifest.version}: ${count} files, exports and imports resolve`)
} finally {
  rmSync(scratch, { recursive: true, force: true })
}

/** Every file under a directory, as package-relative POSIX paths. */
function walk(dir, base = dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    return entry.isDirectory() ? walk(path, base) : [relative(base, path).split('\\').join('/')]
  })
}

/** Flatten an exports value to [condition path, target] pairs. */
function targets(value, path = []) {
  if (typeof value === 'string') return [[path.join('.') || 'default', value]]
  if (Array.isArray(value)) return value.flatMap((item) => targets(item, path))
  if (value && typeof value === 'object')
    return Object.entries(value).flatMap(([key, item]) => targets(item, [...path, key]))
  return []
}

/** List problems with an extracted package rooted at `root`. */
function verify(root) {
  const problems = []
  const files = new Set(walk(root))
  for (const required of ['package.json', 'README.md', 'LICENSE'])
    if (!files.has(required)) problems.push(`missing ${required}`)
  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const exportsField = manifest.exports ?? {}
  const entries = typeof exportsField === 'string' ? { '.': exportsField } : exportsField
  for (const [subpath, value] of Object.entries(entries)) {
    const pairs = targets(value)
    if (!pairs.length) problems.push(`exports["${subpath}"] has no targets`)
    // Wildcards must match the same names under every condition.
    const stems = new Map()
    for (const [condition, target] of pairs) {
      const path = posix.normalize(target.replace(/^\.\//, ''))
      if (!path.includes('*')) {
        if (!files.has(path))
          problems.push(`exports["${subpath}"] ${condition} -> ${target} is missing`)
        continue
      }
      const [before, after] = path.split('*')
      const matched = [...files]
        .filter((file) => file.startsWith(before) && file.endsWith(after))
        .map((file) => file.slice(before.length, file.length - after.length))
      if (!matched.length)
        problems.push(`exports["${subpath}"] ${condition} -> ${target} matches nothing`)
      stems.set(`${condition} -> ${target}`, new Set(matched))
    }
    const all = new Set([...stems.values()].flatMap((set) => [...set]))
    for (const [label, set] of stems)
      for (const stem of all)
        if (!set.has(stem)) problems.push(`exports["${subpath}"] ${label} has no "${stem}"`)
  }
  // A partial tree can keep every entry while losing modules they import.
  for (const file of files) {
    if (!/\.(m?js|jsx|d\.ts)$/.test(file)) continue
    const source = readFileSync(join(root, file), 'utf8')
    for (const spec of moduleSpecifiers(source)) {
      if (!/^\.{1,2}\//.test(spec)) continue
      const target = posix.normalize(posix.join(posix.dirname(file), spec))
      const candidates = file.endsWith('.d.ts')
        ? [
            target,
            target.replace(/\.(m?js|jsx)$/, '.d.ts'),
            `${target}.d.ts`,
            `${target}/index.d.ts`,
          ]
        : [target, `${target}.js`, `${target}/index.js`]
      if (!candidates.some((candidate) => files.has(candidate)))
        problems.push(`${file} imports ${spec}, which is missing`)
    }
  }
  return problems
}

/**
 * Split JavaScript or a declaration file into tokens, dropping comments and
 * whitespace. Strings come back with their unquoted text so a specifier can be
 * read off them; template and regex literals come back whole and opaque.
 */
function tokenize(source) {
  const tokens = []
  // One entry per open brace: 'template' for a `${`, 'block' or 'object' otherwise.
  const braces = []
  const word = /[\p{ID_Continue}$\u200c\u200d\\#]+/uy
  const punctuator =
    /\.\.\.|\?\.(?!\d)|>>>=?|<<=|>>=|\*\*=?|\?\?=?|&&=?|\|\|=?|[=!]==?|=>|\+\+|--|<<|>>|[<>+\-*%&|^/]=|[^\s]/y
  // Keywords after which an expression starts, and those that can also open a block.
  const expressionKeywords = new Set(
    'await case delete in instanceof new of return throw typeof void yield'.split(' ')
  )
  const blockKeywords = new Set(['do', 'else'])
  let i = source.startsWith('#!') ? source.indexOf('\n') >>> 0 : 0

  // Whether a `/` here starts a regex rather than dividing.
  const regexAllowed = () => {
    const last = tokens.at(-1)
    if (!last) return true
    if (last.type === 'word')
      return last.keyword && (expressionKeywords.has(last.value) || blockKeywords.has(last.value))
    if (last.type !== 'punctuator') return false
    if (last.value === '}') return last.closed === 'block'
    return ![')', ']', '++', '--'].includes(last.value)
  }
  // Whether a `{` here opens an object literal rather than a block.
  const objectAllowed = () => {
    const last = tokens.at(-1)
    if (!last) return false
    if (last.type === 'word') return last.keyword && expressionKeywords.has(last.value)
    if (last.type !== 'punctuator') return false
    return !['=>', ')', ';', '{', '}'].includes(last.value)
  }
  // Scan template text from i up to its closing backtick or the next `${`.
  const template = () => {
    while (i < source.length) {
      const char = source[i++]
      if (char === '\\') i++
      else if (char === '`') return
      else if (char === '$' && source[i] === '{') {
        i++
        braces.push('template')
        return
      }
    }
  }

  while (i < source.length) {
    const char = source[i]
    if (/\s/.test(char)) {
      i++
    } else if (source.startsWith('//', i)) {
      const end = source.slice(i).search(/[\n\r\u2028\u2029]/)
      i = end < 0 ? source.length : i + end
    } else if (source.startsWith('/*', i)) {
      const end = source.indexOf('*/', i + 2)
      i = end < 0 ? source.length : end + 2
    } else if (char === '"' || char === "'") {
      let value = ''
      // A raw line break ends an unterminated string, as it would a real one.
      for (i++; i < source.length && source[i] !== char && source[i] !== '\n'; i++)
        value += source[i] === '\\' ? source[i] + source[++i] : source[i]
      i++
      tokens.push({ type: 'string', value })
    } else if (char === '`') {
      i++
      template()
      tokens.push({ type: 'template' })
    } else if (char === '}' && braces.at(-1) === 'template') {
      braces.pop()
      i++
      template()
      tokens.push({ type: 'template' })
    } else if (char === '/' && regexAllowed()) {
      let inClass = false
      for (i++; i < source.length; i++) {
        const next = source[i]
        if (next === '\\') i++
        else if (next === '[') inClass = true
        else if (next === ']') inClass = false
        else if (next === '/' && !inClass) break
        else if (next === '\n') break
      }
      i++
      word.lastIndex = i
      if (word.test(source)) i = word.lastIndex
      tokens.push({ type: 'regex' })
    } else {
      word.lastIndex = i
      if (word.test(source)) {
        const value = source.slice(i, word.lastIndex)
        i = word.lastIndex
        // After `.` or `?.` a keyword is just a property name.
        const last = tokens.at(-1)
        const keyword = !(
          last?.type === 'punctuator' &&
          (last.value === '.' || last.value === '?.')
        )
        tokens.push({ type: 'word', value, keyword })
        continue
      }
      punctuator.lastIndex = i
      punctuator.test(source)
      const value = source.slice(i, punctuator.lastIndex)
      i = punctuator.lastIndex
      const token = { type: 'punctuator', value }
      if (value === '{') braces.push(objectAllowed() ? 'object' : 'block')
      else if (value === '}') token.closed = braces.pop()
      tokens.push(token)
    }
  }
  return tokens
}

/**
 * Module specifiers a source file depends on: `import 'x'`, `import ... from 'x'`,
 * `export ... from 'x'` and `import('x')`, the last also covering declaration
 * files' `import('x').Type`. Text in comments, strings and templates is ignored.
 */
function moduleSpecifiers(source) {
  const tokens = tokenize(source)
  const specifiers = []
  const is = (token, type, value) =>
    token?.type === type && (value === undefined || token.value === value)
  for (let index = 0; index < tokens.length; index++) {
    const token = tokens[index]
    if (!token.keyword || (token.value !== 'import' && token.value !== 'export')) continue
    const next = tokens[index + 1]
    if (token.value === 'import' && is(next, 'string')) {
      specifiers.push(next.value)
      continue
    }
    if (token.value === 'import' && is(next, 'punctuator', '(')) {
      if (is(tokens[index + 2], 'string')) specifiers.push(tokens[index + 2].value)
      continue
    }
    // An import or export clause holds only names, braces, commas, `*` and
    // string names, and ends at `from 'x'` or at its closing brace.
    for (let ahead = index + 1; ahead < tokens.length; ahead++) {
      const clause = tokens[ahead]
      if (is(clause, 'word', 'from') && is(tokens[ahead + 1], 'string')) {
        specifiers.push(tokens[ahead + 1].value)
        break
      }
      const inClause =
        (clause.type === 'word' && !(clause.value === 'import' || clause.value === 'export')) ||
        clause.type === 'string' ||
        (clause.type === 'punctuator' && ['{', '}', ',', '*'].includes(clause.value))
      if (!inClause || (clause.value === '}' && !is(tokens[ahead + 1], 'word', 'from'))) break
    }
  }
  return specifiers
}
