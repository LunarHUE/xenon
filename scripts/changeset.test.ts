import { describe, expect, test } from 'bun:test'
import {
  changesetPackages,
  checkChangeset,
  isChangeset,
  pendingReleases,
  shippedBy,
  type Package,
} from './changeset.ts'

const packages: Package[] = [
  { name: '@xenon-ui/core', dir: 'packages/core', published: true },
  { name: '@xenon-ui/solid', dir: 'packages/solid', published: true },
  { name: '@xenon/suite', dir: 'packages/suite', published: false },
]

const check = (changed: string[], added: string[] = []) =>
  checkChangeset(changed, added, packages).ok

describe('shippedBy', () => {
  test.each([
    ['packages/core/src/dialog/dialog.ts', '@xenon-ui/core'],
    ['packages/core/package.json', '@xenon-ui/core'],
    ['packages/core/README.md', '@xenon-ui/core'],
    ['packages/solid/src/button/button.tsx', '@xenon-ui/solid'],
    ['packages/solid/tsconfig.build.json', '@xenon-ui/solid'],
  ])('counts %s as shipped by %s', (file, name) => {
    expect(shippedBy(file, packages)?.name).toBe(name)
  })

  test.each([
    'packages/core/src/dialog/dialog.test.ts',
    'packages/solid/src/button/button.host.test.tsx',
    'packages/solid/src/internal/notes.md',
    'packages/core/src/internal/vendor/tabbable/fixtures/basic.html',
    'packages/solid/CHANGELOG.md',
    'packages/solid/vitest.config.ts',
    'packages/solid/vitest-setup.ts',
    'packages/solid/scripts/check-dev.mjs',
    'packages/solid/eslint.config.js',
    'packages/suite/src/button/button.test.tsx',
    'packages/corex/src/index.ts',
    'scripts/build-package.ts',
    'package.json',
  ])('counts %s as shipping nothing', (file) => {
    expect(shippedBy(file, packages)).toBeUndefined()
  })
})

describe('isChangeset', () => {
  test('accepts a changeset file', () => {
    expect(isChangeset('.changeset/solid-2-stable.md')).toBe(true)
  })

  test.each(['.changeset/README.md', '.changeset/config.json', '.changeset/nested/note.md'])(
    'rejects %s',
    (file) => {
      expect(isChangeset(file)).toBe(false)
    }
  )
})

describe('checkChangeset', () => {
  test('passes when nothing shipped changed', () => {
    expect(check(['docs/architecture.md', 'packages/suite/src/a.test.tsx'])).toBe(true)
  })

  test('fails when shipped source changed and no changeset was added', () => {
    const verdict = checkChangeset(['packages/solid/src/button/button.tsx'], [], packages)
    expect(verdict.ok).toBe(false)
    expect(verdict.reasons[0]).toBe(
      '@xenon-ui/solid changed (packages/solid/src/button/button.tsx).'
    )
  })

  test('passes when the pull request adds a changeset', () => {
    expect(check(['packages/solid/src/button/button.tsx'], ['.changeset/quiet-buttons.md'])).toBe(
      true
    )
  })

  test('does not count an edited changeset as a new one', () => {
    expect(check(['packages/solid/src/button/button.tsx', '.changeset/quiet-buttons.md'])).toBe(
      false
    )
  })
})

describe('changesetPackages', () => {
  test('reads quoted and bare names', () => {
    const text = `---\n'@xenon-ui/solid': patch\n"@xenon-ui/dom": minor\n@xenon-ui/core: major\n---\n\nSummary.\n`
    expect(changesetPackages(text)).toEqual(['@xenon-ui/solid', '@xenon-ui/dom', '@xenon-ui/core'])
  })

  test('reads nothing from an empty changeset or plain Markdown', () => {
    expect(changesetPackages('---\n---\n\nNo release.\n')).toEqual([])
    expect(changesetPackages('# Changesets\n')).toEqual([])
  })
})

describe('pendingReleases', () => {
  const dependencies = {
    '@xenon-ui/core': [],
    '@xenon-ui/dom': [],
    '@xenon-ui/solid': ['@xenon-ui/core', '@xenon-ui/dom'],
  }

  test('releases the packages a changeset names', () => {
    expect([...pendingReleases([`---\n'@xenon-ui/solid': patch\n---\n`], dependencies)]).toEqual([
      '@xenon-ui/solid',
    ])
  })

  test('releases a package whose dependency is released', () => {
    const released = pendingReleases([`---\n'@xenon-ui/core': patch\n---\n`], dependencies)
    expect(released.has('@xenon-ui/solid')).toBe(true)
    expect(released.has('@xenon-ui/dom')).toBe(false)
  })

  test('releases nothing without changesets', () => {
    expect(pendingReleases([], dependencies).size).toBe(0)
  })
})
