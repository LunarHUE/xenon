import { Button, Checkbox, Switch, Toolbar } from '@kit/solid'
import { Dynamic, render } from '@solidjs/web'
import type { JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createSignal, flush, omit, untrack } from 'solid-js'

import type { ComponentName, Components, Harness, Mounted } from '../harness'

const components = { button: Button, checkbox: Checkbox, switch: Switch, toolbar: Toolbar }

const mounted = new Set<() => void>()

function renderChildren(value: unknown): JSX.Element {
  if (typeof value !== 'function') return value as JSX.Element
  return untrack(() => (value as () => JSX.Element)())
}

function raf(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

export const harness: Harness = {
  mount<N extends ComponentName>(name: N, initial: Components[N]): Mounted<Components[N]> {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const [props, setProps] = createSignal<Record<string, unknown>>({ ...(initial as object) })
    const component = components[name] as ValidComponent
    const attrs = createMemo(() => omit(props(), 'children'))
    const children = createMemo(() => props()['children'])
    const dispose = render(
      () => (
        <Dynamic component={component} {...attrs()}>
          {renderChildren(children())}
        </Dynamic>
      ),
      container
    )
    flush()
    const unmount = () => {
      if (!mounted.has(unmount)) return
      mounted.delete(unmount)
      dispose()
      container.remove()
    }
    mounted.add(unmount)
    return {
      container,
      setProps(next) {
        setProps((prev) => ({ ...prev, ...next }))
        flush()
      },
      unmount,
      async settle() {
        flush()
        await Promise.resolve()
        await raf()
        await raf()
        await Promise.resolve()
      },
    }
  },
}

export const mount = harness.mount

export function cleanup() {
  for (const unmount of [...mounted]) unmount()
}
