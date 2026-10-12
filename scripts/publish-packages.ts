/**
 * Publish the built packages from their dist/ directories, in dependency
 * order. Run `bun run publish:packages` (builds first). Flags pass through to
 * npm, so `--dry-run` shows the tarball contents without uploading and
 * `--tag next` publishes under a dist-tag. `--pack` writes tarballs to
 * ./packages/*.tgz instead of publishing, for installing into a scratch app.
 *
 * Each package is packed once, checked with verify-package.mjs, and that same
 * tarball is published, so nothing that changes dist/ afterwards can reach npm.
 * Versions already on the registry are skipped, so a release can bump one package.
 */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const order = ['core', 'dom', 'solid']
const args = process.argv.slice(2)
const pack = args.includes('--pack')
const npmArgs = args.filter((arg) => arg !== '--pack')

function run(command: string, commandArgs: string[], cwd = root) {
  const result = spawnSync(command, commandArgs, { cwd, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}

for (const name of order) {
  const dist = join(root, 'packages', name, 'dist')
  if (!existsSync(join(dist, 'package.json'))) {
    console.error(`packages/${name}/dist is missing; run the build first`)
    process.exit(1)
  }
  const manifest = JSON.parse(readFileSync(join(dist, 'package.json'), 'utf8'))
  const id = `${manifest.name}@${manifest.version}`
  if (!pack) {
    const published = spawnSync('npm', ['view', id, 'version'], { encoding: 'utf8' })
    if (published.status === 0 && published.stdout.trim() === manifest.version) {
      console.log(`${id} is already published; skipping`)
      continue
    }
  }
  const scratch = mkdtempSync(join(tmpdir(), 'xenon-publish-'))
  try {
    const destination = pack ? join(root, 'packages') : scratch
    const packed = spawnSync(
      'npm',
      ['pack', '--json', '--ignore-scripts', '--pack-destination', destination],
      { cwd: dist, encoding: 'utf8' }
    )
    if (packed.status !== 0) {
      process.stderr.write(packed.stderr)
      process.exit(packed.status ?? 1)
    }
    const tarball = join(destination, JSON.parse(packed.stdout)[0].filename)
    run('node', [join(root, 'scripts/verify-package.mjs'), tarball])
    if (!pack) run('npm', ['publish', tarball, ...npmArgs])
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}
