import { AlertDialog, Dialog, Popover } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import { Show, createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test } from 'vitest'

import { assertDescriptionReferences } from './accessibility'

// Registration families share this public API. Check each implementation independently.
for (const [family, Overlay] of [
  ['dialog', Dialog],
  ['alert-dialog', AlertDialog],
  ['popover', Popover],
] as const) {
  for (const authorOverride of [false, true]) {
    test(`${family} resolves live multi-description registrations through rename removal and remount authorOverride=${authorOverride}`, async () => {
      const [shown, setShown] = createSignal(true)
      const [id, setId] = createSignal('wave2-first-help')
      const [text, setText] = createSignal('Original help')
      const root = document.createElement('div')
      document.body.append(root)
      const Content = () => (
        <Overlay.Content
          aria-label="Editor"
          {...(authorOverride ? { 'aria-describedby': 'wave2-author-help' } : {})}
        >
          <p id="wave2-author-help">Author help</p>
          <Show when={shown()}>
            <Overlay.Description id={id()}>{text()}</Overlay.Description>
          </Show>
          <Overlay.Description id="wave2-stable-help">Stable help</Overlay.Description>
          <button>Continue</button>
        </Overlay.Content>
      )
      const dispose = render(
        () => (
          <Overlay defaultOpen>
            <Overlay.Trigger>Open editor</Overlay.Trigger>
            {family === 'popover' ? (
              <Popover.Positioner>
                <Content />
              </Popover.Positioner>
            ) : (
              <Content />
            )}
          </Overlay>
        ),
        root
      )
      onTestFinished(() => {
        dispose()
        root.remove()
        flush()
      })
      flush()
      const content = root.querySelector<HTMLElement>('[aria-label="Editor"]')!
      await expect.poll(() => content.checkVisibility()).toBe(true)
      const check = (expected: string[]) => {
        expect(assertDescriptionReferences(content).map((node) => node.textContent)).toEqual(
          expected
        )
        expect(content).toHaveAccessibleDescription(expected.join(' '))
      }
      check(authorOverride ? ['Author help'] : ['Original help', 'Stable help'])
      const original = document.getElementById('wave2-first-help')!
      setId('wave2-renamed-help')
      setText('Updated help')
      flush()
      expect(document.getElementById('wave2-renamed-help')).toBe(original)
      expect(document.getElementById('wave2-first-help')).toBeNull()
      check(authorOverride ? ['Author help'] : ['Updated help', 'Stable help'])
      setShown(false)
      flush()
      expect(original.isConnected).toBe(false)
      check(authorOverride ? ['Author help'] : ['Stable help'])
      setShown(true)
      flush()
      const remounted = document.getElementById('wave2-renamed-help')!
      expect(remounted).not.toBe(original)
      expect(remounted.isConnected).toBe(true)
      // Registration order is mount order, so the remounted description follows the survivor.
      check(authorOverride ? ['Author help'] : ['Stable help', 'Updated help'])
      expect(root.querySelector('[aria-label="Editor"]')).toBe(content)
    })
  }
}
