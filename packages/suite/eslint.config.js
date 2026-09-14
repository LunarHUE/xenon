import base from '@kit/eslint-config/base'
import solid from '@kit/eslint-config/solid'

export default [{ ignores: ['playwright-report/**', 'test-results/**'] }, ...base, ...solid]
