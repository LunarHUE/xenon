import type { Component } from 'solid-js'
import { createComponent, hydrate, render } from '@solidjs/web'

const renderer =
  (element: HTMLElement) =>
  (
    Component: Component<Record<string, unknown>>,
    props: Record<string, unknown>,
    slots: Record<string, string>,
    { client }: { client: string }
  ) => {
    if (!element.hasAttribute('ssr')) return
    if (Object.keys(slots).length > 0) {
      throw new Error(
        'The local Solid 2 renderer supports props only; Astro slots are not wired up.'
      )
    }

    const component = () => createComponent(Component, props)
    let dispose: () => void
    if (client === 'only') {
      element.replaceChildren()
      dispose = render(component, element)
    } else {
      dispose = hydrate(component, element, { renderId: element.dataset.solidRenderId })
    }
    element.addEventListener('astro:unmount', () => dispose(), { once: true })
  }

export default renderer
