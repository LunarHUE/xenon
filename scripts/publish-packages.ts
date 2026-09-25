/**
 * Publish the built packages from their dist/ directories, in dependency
 * order. Run `bun run publish:packages` (builds first). Flags pass through to
 * npm, so `--dry-run` shows the tarball contents without uploading and
 * `--tag next` publishes under a dist-tag. `--pack` writes tarballs to
 * ./packages/*.tgz instead of publishing, for installing into a scratch app.
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const order = ['core', 'dom', 'solid']
const args = process.argv.slice(2)
const pack = args.includes('--pack')
const npmArgs = args.filter((arg) => arg !== '--pack')

for (const name of order) {
  const dist = join(root, 'packages', name, 'dist')
  if (!existsSync(join(dist, 'package.json'))) {
    console.error(`packages/${name}/dist is missing; run the build first`)
    process.exit(1)
  }
  const command = pack
    ? ['pack', '--pack-destination', join(root, 'packages'), ...npmArgs]
    : ['publish', ...npmArgs]
  const result = spawnSync('npm', command, { cwd: dist, stdio: 'inherit' })
  if (result.status !== 0) process.exit(result.status ?? 1)
}
