import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

/** URL pathname for the repository docs/spec directory, resolved relative to this module. */
export const SPEC_DIR = new URL('../../../docs/spec/', import.meta.url).pathname
/** Matches one backtick-delimited requirement ID; capture 1 contains its lowercase name segments and numeric suffix. */
export const ID = /`([a-z0-9-]+(?:\.[a-z0-9-]+)?\.\d+)`/

/** Last parsed checklist bullet for a requirement ID. */
export interface SpecBullet {
  /** Literal text inside the bullet backticks; readSpec does not validate it against ID. */
  id: string
  /** Markdown filename relative to SPEC_DIR. */
  file: string
  /** One-based line number of the matched checklist bullet. */
  line: number
  /** True for a lowercase x marker, false for a space marker. */
  ticked: boolean
}

/**
 * Reads immediate .md files in SPEC_DIR into a map keyed by checklist ID.
 *
 * @remarks
 * Recognizes only unindented lines starting with - [ ] or - [x], a space, and a
 * nonempty backtick-delimited value. Trailing prose is ignored. IDs are not syntax
 * validated. Later duplicate IDs replace prior entries in filesystem/line traversal
 * order; files are not sorted and subdirectories are not traversed.
 * @returns Parsed bullets, including checked and unchecked entries.
 * @throws If directory listing or file reading fails.
 */
export function readSpec(): Map<string, SpecBullet> {
  const out = new Map<string, SpecBullet>()
  for (const name of readdirSync(SPEC_DIR)) {
    if (!name.endsWith('.md')) continue
    const lines = readFileSync(join(SPEC_DIR, name), 'utf8').split('\n')
    lines.forEach((text, i) => {
      const m = /^- \[( |x)\] `([^`]+)`/.exec(text)
      if (m) out.set(m[2]!, { id: m[2]!, file: name, line: i + 1, ticked: m[1] === 'x' })
    })
  }
  return out
}

/**
 * Recursively scans test source text for literal requirement registrations.
 *
 * @param dir - Root directory; returned paths retain the supplied relative/absolute basis.
 * @param includeInactive - Include direct .todo and .skip registrations, defaulting to true.
 * @remarks
 * Reads .test.ts/.tsx, .test-browser.ts/.tsx, and .spec.ts/.tsx suffixes. Matches
 * spec/test calls with optional .todo/.skip and a single-quoted ID, optionally
 * followed by a colon and title. This is a regex scan, not AST parsing or test
 * execution: comments can match, dynamic/template/double-quoted IDs are missed,
 * and nested skip/conditional execution is not understood. Every match appends
 * its file path, including repeated occurrences in the same file.
 * @returns ID-to-source-path lists; inactive filtering does not establish runnable or passing tests.
 * @throws If directory traversal or source reading fails.
 */
export function readTests(dir: string, includeInactive = true): Map<string, string[]> {
  const out = new Map<string, string[]>()
  /** Visits directories recursively in filesystem order and scans matching file suffixes as plain text. */
  const walk = (d: string) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name)
      if (entry.isDirectory()) walk(p)
      else if (/(?:\.test(-browser)?|\.spec)\.tsx?$/.test(entry.name)) {
        const src = readFileSync(p, 'utf8')
        for (const m of src.matchAll(
          /(?:spec|test)(?:\.todo|\.skip)?\(\s*'([a-z0-9-]+(?:\.[a-z0-9-]+)?\.\d+)(?::[^']*)?'/g
        )) {
          if (!includeInactive && /^(spec|test)\.(todo|skip)/.test(m[0])) continue
          const list = out.get(m[1]!) ?? []
          list.push(p)
          out.set(m[1]!, list)
        }
      }
    }
  }
  walk(dir)
  return out
}
