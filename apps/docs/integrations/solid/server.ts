import type { NamedSSRLoadedRendererValue } from 'astro'
import { createComponent, generateHydrationScript, renderToString } from '@solidjs/web'

let nextId = 0

const renderer: NamedSSRLoadedRendererValue = {
  name: 'xenon/solid',
  async check(Component) {
    return typeof Component === 'function'
  },
  async renderToStaticMarkup(Component, props, slots, metadata) {
    if (Object.keys(slots).length > 0) {
      throw new Error(
        'The local Solid 2 renderer supports props only; Astro slots are not wired up.'
      )
    }
    const renderId = `solid-${nextId++}-`
    return {
      attrs: { 'data-solid-render-id': renderId },
      html: renderToString(() => createComponent(Component, props), {
        renderId,
        noScripts: !metadata?.hydrate,
      }),
    }
  },
  renderHydrationScript: () => generateHydrationScript(),
}

export default renderer
