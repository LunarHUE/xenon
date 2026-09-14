import solid from 'eslint-plugin-solid/configs/typescript'

/**
 * Solid's TypeScript lint preset, appended after the shared base by adapters and
 * component tests. Core and DOM packages do not consume this framework preset.
 * @type {import("eslint").Linter.Config[]}
 */
export default [solid]
