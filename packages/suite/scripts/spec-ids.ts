import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

export const SPEC_DIR = new URL('../../../docs/spec/', import.meta.url).pathname
export const ID = /`([a-z0-9-]+(?:\.[a-z0-9-]+)?\.\d+)`/

export interface SpecBullet {
  id: string
  file: string
  line: number
  ticked: boolean
}

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

export function readTests(dir: string, includeInactive = true): Map<string, string[]> {
  const out = new Map<string, string[]>()
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
