import js from '@eslint/js'
import tseslint from 'typescript-eslint'

/**
 * Shared JavaScript/TypeScript recommended rules. Underscore-prefixed unused
 * bindings are allowed; dist and node_modules are ignored. Consumers append
 * package-specific rules after this config.
 * @type {import("eslint").Linter.Config[]}
 */
export default tseslint.config(
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  }
)
