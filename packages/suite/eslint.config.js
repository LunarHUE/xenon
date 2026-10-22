import base from '@xenon/eslint-config/base'
import solid from '@xenon/eslint-config/solid'

/** Generated output: Playwright reports, the e2e fixture build and Vitest blob reports in .vitest. */
export default [
  { ignores: ['playwright-report/**', 'test-results/**', 'blob-report/**', '.vitest/**'] },
  ...base,
  ...solid,
]
