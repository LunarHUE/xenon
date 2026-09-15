import base from '@xenon/eslint-config/base'
import solid from '@xenon/eslint-config/solid'

export default [{ ignores: ['playwright-report/**', 'test-results/**'] }, ...base, ...solid]
