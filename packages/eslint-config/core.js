/**
 * For @xenon-ui/core: the controllers must run in Node and on the server, so they
 * may use DOM *types* but never touch DOM globals. Anything that needs a live
 * document belongs in @xenon-ui/dom or a framework adapter.
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  {
    rules: {
      'no-restricted-globals': [
        'error',
        ...['window', 'document', 'navigator', 'location', 'requestAnimationFrame'].map((name) => ({
          name,
          message: `${name} is a DOM global. Core stays DOM-free; move this to @xenon-ui/dom.`,
        })),
      ],
    },
  },
]
