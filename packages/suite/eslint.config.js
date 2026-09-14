import base from '@tenon/eslint-config/base'
import solid from '@tenon/eslint-config/solid'

export default [{ ignores: ['playwright-report/**', 'test-results/**'] }, ...base, ...solid]
