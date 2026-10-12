import solid from 'eslint-plugin-solid/configs/typescript'

/**
 * Solid's TypeScript lint preset, appended after the shared base by adapters and
 * component tests. Core and DOM packages do not consume this framework preset.
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  solid,
  {
    rules: {
      // dynamic() from @solidjs/web reads its source in a tracked memo.
      'solid/reactivity': ['warn', { customReactiveFunctions: ['dynamic'] }],
    },
  },
]
