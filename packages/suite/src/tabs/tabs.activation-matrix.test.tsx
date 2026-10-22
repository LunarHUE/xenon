import { Tabs } from '@xenon-ui/solid'
import { fireEvent, within } from '@testing-library/dom'
import { describe, expect, test, vi } from 'vitest'
import { mount } from '../harness/solid'

describe('tabs activation with sparse enabled items', () => {
  for (const activationMode of ['automatic', 'manual'] as const) {
    for (const orientation of ['horizontal', 'vertical'] as const) {
      for (const dir of ['ltr', 'rtl'] as const) {
        test(`${activationMode} ${orientation} ${dir} navigates enabled items without activating disabled content`, async () => {
          const changed = vi.fn()
          const m = mount('tabs', {
            activationMode,
            orientation,
            dir,
            defaultValue: 'a',
            onValueChange: changed,
            children: () => (
              <>
                <Tabs.List aria-label="Sections">
                  <Tabs.Tab value="a">First</Tabs.Tab>
                  <Tabs.Tab value="b" disabled>
                    Unavailable
                  </Tabs.Tab>
                  <Tabs.Tab value="c">Last</Tabs.Tab>
                </Tabs.List>
                <Tabs.Panel value="a">First content</Tabs.Panel>
                <Tabs.Panel value="b">Unavailable content</Tabs.Panel>
                <Tabs.Panel value="c">Last content</Tabs.Panel>
              </>
            ),
          })
          const scope = within(m.container)
          const first = scope.getByRole('tab', { name: 'First' })
          const last = scope.getByRole('tab', { name: 'Last' })
          const unavailable = scope.getByRole('tab', { name: 'Unavailable' })
          first.focus()
          await m.settle()
          const forward =
            orientation === 'vertical' ? 'ArrowDown' : dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
          fireEvent.keyDown(first, { key: forward })
          await m.settle()
          expect(last).toHaveFocus()
          expect(unavailable).toHaveAttribute('aria-selected', 'false')
          expect(unavailable).toHaveAttribute('tabindex', '-1')
          const selected = activationMode === 'automatic' ? last : first
          expect(selected).toHaveAttribute('aria-selected', 'true')
          expect(scope.getByRole('tabpanel')).toHaveAccessibleName(
            activationMode === 'automatic' ? 'Last' : 'First'
          )
          expect(changed.mock.calls).toEqual(activationMode === 'automatic' ? [['c']] : [])
          if (activationMode === 'manual') {
            fireEvent.click(last)
            await m.settle()
            expect(last).toHaveAttribute('aria-selected', 'true')
            expect(scope.getByRole('tabpanel')).toHaveAccessibleName('Last')
            expect(changed.mock.calls).toEqual([['c']])
          }
          changed.mockClear()
          // A key from the other axis must neither move focus nor select a tab.
          fireEvent.keyDown(last, { key: orientation === 'vertical' ? 'ArrowRight' : 'ArrowUp' })
          await m.settle()
          expect(last).toHaveFocus()
          expect(last).toHaveAttribute('aria-selected', 'true')
          expect(changed).not.toHaveBeenCalled()
          fireEvent.keyDown(last, { key: 'Home' })
          await m.settle()
          expect(first).toHaveFocus()
          expect(activationMode === 'automatic' ? first : last).toHaveAttribute(
            'aria-selected',
            'true'
          )
        })
      }
    }
  }
})
