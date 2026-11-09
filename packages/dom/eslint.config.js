import base from '@xenon/eslint-config/base'

export default [
  ...base,
  {
    // Vendored Floating UI keeps upstream's `any` types and `a && b()` calls so
    // it still diffs cleanly against its source; see each PROVENANCE.md.
    files: ['src/internal/vendor/floating-ui-*/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-expressions': ['error', { allowShortCircuit: true }],
    },
  },
]
