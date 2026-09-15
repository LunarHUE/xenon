import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readCases } from './test-cases'

/** Filesystem path for docs/spec, resolved relative to this module. */
export const SPEC_DIR = fileURLToPath(new URL('../../../docs/spec/', import.meta.url))
/** Matches one backtick-delimited requirement ID; capture 1 contains its lowercase name segments and numeric suffix. */
export const ID = /`([a-z0-9-]+(?:\.[a-z0-9-]+)?\.\d+)`/

/** Unique checklist requirement outside fenced examples. */
export interface SpecBullet {
  /** Literal text inside the bullet backticks; readSpec does not validate it against ID. */
  id: string
  /** Markdown filename relative to SPEC_DIR. */
  file: string
  /** One-based line number of the matched checklist bullet. */
  line: number
  /** True for a lowercase x marker, false for a space marker. */
  ticked: boolean
  /** Requirement wording, retained for evidence review and reporting. */
  text: string
}

/**
 * Reads immediate Markdown files, excluding fenced examples and rejecting duplicate IDs.
 * @returns Parsed bullets, including checked and unchecked entries.
 * @throws If directory listing or file reading fails.
 */
export function readSpec(directory = SPEC_DIR): Map<string, SpecBullet> {
  const out = new Map<string, SpecBullet>()
  for (const name of readdirSync(directory).sort()) {
    if (!name.endsWith('.md')) continue
    const lines = readFileSync(join(directory, name), 'utf8').split('\n')
    let fence: string | undefined
    lines.forEach((text, i) => {
      const marker = /^\s*(`{3,}|~{3,})/.exec(text)?.[1]
      if (marker) {
        if (!fence) fence = marker
        else if (marker[0] === fence[0] && marker.length >= fence.length) fence = undefined
        return
      }
      if (fence) return
      const m = /^- \[( |x)\] `([^`]+)`/.exec(text)
      if (m) {
        if (out.has(m[2]!)) throw new Error(`Duplicate requirement ID: ${m[2]}`)
        out.set(m[2]!, {
          id: m[2]!,
          file: name,
          line: i + 1,
          ticked: m[1] === 'x',
          text: text.slice(m[0].length).trim(),
        })
      }
    })
  }
  return out
}

/**
 * Recursively reads static test registrations using the TypeScript parser.
 *
 * @param dir - Root directory; returned paths retain the supplied relative/absolute basis.
 * @param includeInactive - Include direct .todo and .skip registrations, defaulting to true.
 * Includes it/test/spec, compound titles, static table loops and inherited skips.
 * Arbitrary generated registrations are not evaluated. Conditional registrations
 * are excluded alongside skipped cases when includeInactive is false.
 * @returns ID-to-source-path lists; inactive filtering does not establish runnable or passing tests.
 * @throws If directory traversal or source reading fails.
 */
export function readTests(dir: string, includeInactive = true): Map<string, string[]> {
  const out = new Map<string, string[]>()
  for (const test of readCases(dir)) {
    if (!includeInactive && (test.inactive || test.conditional)) continue
    for (const id of test.ids) out.set(id, [...(out.get(id) ?? []), test.file])
  }
  return out
}
