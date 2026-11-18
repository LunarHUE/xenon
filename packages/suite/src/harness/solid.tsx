import {
  Accordion,
  Button,
  Checkbox,
  Collapsible,
  Field,
  Progress,
  RadioGroup,
  Separator,
  Switch,
  Tabs,
  Toggle,
  ToggleGroup,
  Toolbar,
} from '@xenon-ui/solid'
import { dynamic, render } from '@solidjs/web'
import type { JSX, ValidComponent } from '@solidjs/web'
import { createMemo, createSignal, flush, omit, untrack } from 'solid-js'

import type { ComponentName, Components, Harness, Mounted } from '../harness'

/** Maps harness names to Solid component roots. */
const components = {
  button: Button,
  checkbox: Checkbox,
  switch: Switch,
  toolbar: Toolbar,
  field: Field,
  toggle: Toggle,
  'toggle-group': ToggleGroup,
  'radio-group': RadioGroup,
  collapsible: Collapsible,
  accordion: Accordion,
  tabs: Tabs,
  progress: Progress,
  separator: Separator,
}

/** Tracks live fixture disposers for shared test cleanup. */
const mounted = new Set<() => void>()

/** Passes through child content or invokes its zero-argument factory without tracking reads. */
function renderChildren(value: unknown): JSX.Element {
  if (typeof value !== 'function') return value as JSX.Element
  return untrack(() => (value as () => JSX.Element)())
}

/** Resolves on the next global animation frame. */
function raf(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()))
}

/** Solid test adapter that renders into document.body and tracks fixtures for cleanup. */
export const harness: Harness = {
  /**
   * Appends a div to document.body, renders a component with copied inputs, and flushes Solid.
   * Child factories are invoked without arguments and without tracking their reads.
   */
  mount<N extends ComponentName>(name: N, initial: Components[N]): Mounted<Components[N]> {
    const container = document.createElement('div')
    document.body.appendChild(container)
    const [props, setProps] = createSignal<Record<string, unknown>>({ ...(initial as object) })
    const Component = dynamic(() => components[name] as ValidComponent)
    const attrs = createMemo(() => omit(props(), 'children'))
    const children = createMemo(() => props()['children'])
    const dispose = render(
      () => <Component {...attrs()}>{renderChildren(children())}</Component>,
      container
    )
    flush()
    /** Removes this fixture from cleanup tracking before disposing it and removing its wrapper. */
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

/** Convenience alias for the Solid harness mount method. */
export const mount = harness.mount

/** Unmounts a snapshot of all fixtures currently tracked by this module. */
export function cleanup() {
  for (const unmount of [...mounted]) unmount()
}
