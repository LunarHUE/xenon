import { ToggleGroup } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { For, createSignal, flush } from 'solid-js'
import { expect, onTestFinished, test, vi } from 'vitest'
import { userEvent } from 'vitest/browser'

async function focused(node: HTMLElement) {
  await expect
    .poll(() => {
      flush()
      return document.activeElement
    })
    .toBe(node)
}
// Adopted contract (#44): keyboard navigation re-reads DOM order after keyed moves
// that keep item hosts mounted, without touching pressed state.
for (const mode of ['single', 'multiple'] as const) {
  test(`candidate: ${mode} keyed reordering preserves pressed state and native traversal uses the new order`, async () => {
    const [items, setItems] = createSignal(['a', 'b', 'c'])
    const changed = vi.fn()
    const container = document.createElement('div')
    document.body.append(container)
    const dispose = render(
      () => (
        <>
          <button>Before</button>
          <ToggleGroup
            {...(mode === 'multiple' ? { mode, defaultValue: ['b'] } : { mode, defaultValue: 'b' })}
            aria-label="Styles"
            onValueChange={changed}
          >
            <For each={items()}>
              {(value) => <ToggleGroup.Item value={value}>{value}</ToggleGroup.Item>}
            </For>
          </ToggleGroup>
          <button>After</button>
        </>
      ),
      container
    )
    onTestFinished(() => {
      dispose()
      container.remove()
      flush()
    })
    flush()
    const m = within(container)
    const selected = m.getByRole('button', { name: 'b' })
    setItems(['c', 'b', 'a'])
    flush()
    await expect.poll(() => m.getByRole('group').textContent).toBe('cba')
    expect(m.getByRole('button', { name: 'b' })).toBe(selected)
    expect(selected).toHaveAttribute('aria-pressed', 'true')
    selected.focus()
    await userEvent.keyboard('{ArrowRight}')
    const a = m.getByRole('button', { name: 'a' })
    await focused(a)
    expect(a).toHaveAttribute('aria-pressed', 'false')
    expect(selected).toHaveAttribute('aria-pressed', 'true')
    expect(changed).not.toHaveBeenCalled()
    await userEvent.keyboard('{Tab}')
    await focused(m.getByRole('button', { name: 'After' }))
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}')
    await focused(a)
    setItems(['c', 'a'])
    flush()
    await expect.poll(() => m.queryByRole('button', { name: 'b' })).toBeNull()
    await userEvent.keyboard('{ArrowLeft}')
    const c = m.getByRole('button', { name: 'c' })
    await focused(c)
    await userEvent.keyboard(' ')
    await expect
      .poll(() => {
        flush()
        return c.getAttribute('aria-pressed')
      })
      .toBe('true')
    expect(changed).toHaveBeenCalledOnce()
    expect(changed).toHaveBeenLastCalledWith(mode === 'multiple' ? ['b', 'c'] : 'c')
  })
}

// With no selection the first host is a fallback stop, not an explicit active value.
for (const mode of ['single', 'multiple'] as const) {
  for (const key of ['ArrowRight', 'Home'] as const) {
    test(`${mode} reorder keeps the focused fallback item as the ${key} origin`, async () => {
      const [items, setItems] = createSignal(['a', 'b', 'c'])
      const changed = vi.fn()
      const container = document.createElement('div')
      document.body.append(container)
      const dispose = render(
        () => (
          <ToggleGroup mode={mode} aria-label="Styles" onValueChange={changed}>
            <For each={items()}>
              {(value) => <ToggleGroup.Item value={value}>{value}</ToggleGroup.Item>}
            </For>
          </ToggleGroup>
        ),
        container
      )
      onTestFinished(() => {
        dispose()
        container.remove()
        flush()
      })
      flush()
      const m = within(container)
      const a = m.getByRole('button', { name: 'a' })
      expect(a).toHaveAttribute('tabindex', '0')
      setItems(['c', 'b', 'a'])
      flush()
      await expect.poll(() => m.getByRole('group').textContent).toBe('cba')
      a.focus()
      await userEvent.keyboard(`{${key}}`)
      const c = m.getByRole('button', { name: 'c' })
      await focused(c)
      await expect
        .poll(() => {
          flush()
          return c.getAttribute('tabindex')
        })
        .toBe('0')
      expect(a).toHaveAttribute('tabindex', '-1')
      expect(changed).not.toHaveBeenCalled()
    })
  }
}

for (const orientation of ['horizontal', 'vertical'] as const) {
  for (const dir of ['ltr', 'rtl'] as const) {
    test(`${orientation} ${dir} disabled items retain native navigation while activation stays blocked`, async () => {
      const [disabled, setDisabled] = createSignal(false)
      const changed = vi.fn()
      const container = document.createElement('div')
      document.body.append(container)
      const dispose = render(
        () => (
          <ToggleGroup
            orientation={orientation}
            dir={dir}
            defaultValue="b"
            onValueChange={changed}
            aria-label="Styles"
          >
            <ToggleGroup.Item value="a">First</ToggleGroup.Item>
            <ToggleGroup.Item value="b" disabled={disabled()}>
              Middle
            </ToggleGroup.Item>
            <ToggleGroup.Item value="c">Last</ToggleGroup.Item>
          </ToggleGroup>
        ),
        container
      )
      onTestFinished(() => {
        dispose()
        container.remove()
        flush()
      })
      flush()
      const m = within(container)
      const first = m.getByRole('button', { name: 'First' }),
        middle = m.getByRole('button', { name: 'Middle' }),
        last = m.getByRole('button', { name: 'Last' })
      const forward =
        orientation === 'vertical' ? 'ArrowDown' : dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
      const backward =
        orientation === 'vertical' ? 'ArrowUp' : dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
      first.focus()
      await userEvent.keyboard(`{${forward}}`)
      await focused(middle)
      setDisabled(true)
      flush()
      first.focus()
      await userEvent.keyboard(`{${forward}}`)
      await focused(middle)
      expect(middle).toHaveAttribute('aria-pressed', 'true')
      await userEvent.keyboard(' ')
      expect(changed).not.toHaveBeenCalled()
      expect(middle).toHaveAttribute('aria-pressed', 'true')
      await userEvent.keyboard(`{${forward}}`)
      await focused(last)
      await userEvent.keyboard(`{${backward}}`)
      await focused(middle)
      await userEvent.keyboard(`{${backward}}`)
      await focused(first)
      setDisabled(false)
      flush()
      await userEvent.keyboard(`{${forward}}`)
      await focused(middle)
      expect(middle).toHaveAttribute('aria-pressed', 'true')
      expect(changed).not.toHaveBeenCalled()
      await userEvent.keyboard(' ')
      await expect
        .poll(() => {
          flush()
          return middle.getAttribute('aria-pressed')
        })
        .toBe('false')
      expect(changed).toHaveBeenCalledExactlyOnceWith(undefined)
    })
  }
}
