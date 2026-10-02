import { fireEvent, render } from '@solidjs/testing-library'
import { createRoot, createSignal, flush } from 'solid-js'
import { describe, expect, test, vi } from 'vitest'

import { RadioGroup } from './radio-group'

function settle(): Promise<void> {
  flush()
  return Promise.resolve()
}

function press(el: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true })
  el.dispatchEvent(event)
  flush()
  return event
}

function tabstops(container: HTMLElement): string[] {
  return [...container.querySelectorAll('[role="radiogroup"] [role="radio"], [type="radio"]')]
    .filter((el) => !el.hasAttribute('aria-hidden'))
    .map((el) => `${el.getAttribute('value') ?? el.textContent}=${el.getAttribute('tabindex')}`)
}

function colors(extra: Record<string, unknown> = {}) {
  return (
    <>
      <RadioGroup.Item value="red" aria-label="red" {...extra} />
      <RadioGroup.Item value="green" aria-label="green" />
      <RadioGroup.Item value="blue" aria-label="blue" />
    </>
  )
}

function buttons() {
  return (
    <>
      <RadioGroup.Item as="button" value="red">
        red
      </RadioGroup.Item>
      <RadioGroup.Item as="button" value="green">
        green
      </RadioGroup.Item>
      <RadioGroup.Item as="button" value="blue">
        blue
      </RadioGroup.Item>
    </>
  )
}

describe('<RadioGroup />', () => {
  test('renders a radiogroup of native radios and names its orientation once', () => {
    const { getByRole, getAllByRole, unmount } = render(() => (
      <RadioGroup aria-label="Color">{colors()}</RadioGroup>
    ))
    const root = getByRole('radiogroup')
    expect(root).toHaveAttribute('data-orientation', 'vertical')
    expect(root).not.toHaveAttribute('aria-orientation')

    const radios = getAllByRole('radio')
    expect(radios).toHaveLength(3)
    expect(radios[0]?.tagName).toBe('INPUT')
    expect(radios[0]).toHaveAttribute('type', 'radio')
    expect(radios[0]).not.toHaveAttribute('aria-checked')
    expect(radios[0]).toHaveAttribute('data-state', 'unchecked')
    unmount()

    const horizontal = render(() => (
      <RadioGroup aria-label="Color" orientation="horizontal">
        {colors()}
      </RadioGroup>
    ))
    expect(horizontal.getByRole('radiogroup')).toHaveAttribute('aria-orientation', 'horizontal')
  })

  test.each([undefined, 'input'] as const)(
    'native host %s omits author aria-checked as selection and author props change',
    async (as) => {
      const [value, setValue] = createSignal('red')
      const [authorChecked, setAuthorChecked] = createSignal<'true' | 'false'>('false')
      const { getByRole } = render(() => (
        <RadioGroup aria-label="Color" value={value()}>
          <RadioGroup.Item
            as={as}
            value="red"
            aria-label="Red"
            aria-checked={authorChecked()}
            title="Author title"
          />
          <RadioGroup.Item value="green" aria-label="Green" aria-checked="true" />
        </RadioGroup>
      ))
      const red = getByRole('radio', { name: 'Red' })
      const green = getByRole('radio', { name: 'Green' })
      expect(red).toBeChecked()
      expect(green).not.toBeChecked()
      expect(red).not.toHaveAttribute('aria-checked')
      expect(green).not.toHaveAttribute('aria-checked')
      expect(red).toHaveAttribute('title', 'Author title')

      setValue('green')
      setAuthorChecked('true')
      await settle()
      expect(red).not.toBeChecked()
      expect(green).toBeChecked()
      expect(red).not.toHaveAttribute('aria-checked')
      expect(green).not.toHaveAttribute('aria-checked')
      expect(red).toHaveAttribute('title', 'Author title')
    }
  )

  test.each(['button', 'div'] as const)(
    'custom host %s keeps computed aria-checked as selection changes',
    async (as) => {
      const [value, setValue] = createSignal('red')
      const { getByRole } = render(() => (
        <RadioGroup aria-label="Color" value={value()}>
          <RadioGroup.Item as={as} value="red" aria-label="Red" />
          <RadioGroup.Item as={as} value="green" aria-label="Green" />
        </RadioGroup>
      ))
      const red = getByRole('radio', { name: 'Red' })
      const green = getByRole('radio', { name: 'Green' })
      expect(red).toHaveAttribute('aria-checked', 'true')
      expect(green).toHaveAttribute('aria-checked', 'false')

      setValue('green')
      await settle()
      expect(red).toHaveAttribute('aria-checked', 'false')
      expect(green).toHaveAttribute('aria-checked', 'true')
    }
  )

  test('the tab stop starts on the checked radio, else on the first one', () => {
    const { container, unmount } = render(() => (
      <RadioGroup aria-label="Color">{colors()}</RadioGroup>
    ))
    expect(tabstops(container)).toEqual(['red=0', 'green=-1', 'blue=-1'])
    unmount()

    const picked = render(() => (
      <RadioGroup aria-label="Color" defaultValue="green">
        {colors()}
      </RadioGroup>
    ))
    expect(tabstops(picked.container)).toEqual(['red=-1', 'green=0', 'blue=-1'])
  })

  test('a click selects, reports once and moves the tab stop', async () => {
    const onValueChange = vi.fn()
    const { container, getByLabelText } = render(() => (
      <RadioGroup aria-label="Color" onValueChange={onValueChange}>
        {colors()}
      </RadioGroup>
    ))
    const green = getByLabelText('green') as HTMLInputElement

    fireEvent.click(green)
    await settle()
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenCalledWith('green')
    expect(green.checked).toBe(true)
    expect(green).toHaveAttribute('data-state', 'checked')
    expect(tabstops(container)).toEqual(['red=-1', 'green=0', 'blue=-1'])

    fireEvent.click(green)
    await settle()
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })

  test('a fixed controlled value snaps every input back', async () => {
    const onValueChange = vi.fn()
    const { getByLabelText } = render(() => (
      <RadioGroup aria-label="Color" value="red" onValueChange={onValueChange}>
        {colors()}
      </RadioGroup>
    ))
    const red = getByLabelText('red') as HTMLInputElement
    const green = getByLabelText('green') as HTMLInputElement
    expect(red.checked).toBe(true)

    fireEvent.click(green)
    expect(onValueChange).toHaveBeenCalledWith('green')
    await settle()
    expect(green.checked).toBe(false)
    expect(red.checked).toBe(true)
  })

  test('every input carries the shared name and the real required attribute', () => {
    const { getAllByRole } = render(() => (
      <RadioGroup aria-label="Color" name="color" required>
        {colors()}
      </RadioGroup>
    ))
    const radios = getAllByRole('radio') as HTMLInputElement[]
    expect(radios.map((el) => el.name)).toEqual(['color', 'color', 'color'])
    expect(radios.every((el) => el.required)).toBe(true)
  })

  test('a nameless group still shares one generated name so the browser groups it', () => {
    const { getAllByRole } = render(() => <RadioGroup aria-label="Color">{colors()}</RadioGroup>)
    const names = (getAllByRole('radio') as HTMLInputElement[]).map((el) => el.name)
    expect(names[0]).not.toBe('')
    expect(new Set(names).size).toBe(1)
  })

  test('a hidden input per radio appears only off the native host and only with a name', () => {
    const native = render(() => (
      <RadioGroup aria-label="Color" name="color">
        {colors()}
      </RadioGroup>
    ))
    expect(native.container.querySelectorAll('input')).toHaveLength(3)
    native.unmount()

    const nameless = render(() => <RadioGroup aria-label="Color">{buttons()}</RadioGroup>)
    expect(nameless.container.querySelector('input')).toBe(null)
    nameless.unmount()

    const named = render(() => (
      <RadioGroup aria-label="Color" name="color" required defaultValue="green">
        {buttons()}
      </RadioGroup>
    ))
    const hidden = [...named.container.querySelectorAll('input')] as HTMLInputElement[]
    expect(hidden).toHaveLength(3)
    expect(hidden.map((el) => el.value)).toEqual(['red', 'green', 'blue'])
    expect(hidden.every((el) => el.name === 'color' && el.required)).toBe(true)
    expect(hidden.map((el) => el.checked)).toEqual([false, true, false])
    expect(hidden[0]).toHaveAttribute('aria-hidden', 'true')
  })

  test('off the native host an arrow moves focus and selection follows it', async () => {
    const onValueChange = vi.fn()
    const { getByText, container } = render(() => (
      <RadioGroup aria-label="Color" defaultValue="red" onValueChange={onValueChange}>
        {buttons()}
      </RadioGroup>
    ))
    const red = getByText('red')
    red.focus()

    expect(press(red, 'ArrowDown').defaultPrevented).toBe(true)
    await settle()
    expect(getByText('green')).toHaveFocus()
    expect(onValueChange).toHaveBeenCalledWith('green')
    expect(getByText('green')).toHaveAttribute('aria-checked', 'true')
    expect(tabstops(container)).toEqual(['red=-1', 'green=0', 'blue=-1'])

    press(getByText('green'), 'ArrowUp')
    await settle()
    expect(getByText('red')).toHaveFocus()
    expect(onValueChange).toHaveBeenLastCalledWith('red')

    press(getByText('red'), 'ArrowUp')
    await settle()
    expect(getByText('blue')).toHaveFocus()
  })

  test('off the native host Enter selects nothing and Space selects', async () => {
    const onValueChange = vi.fn()
    const { getByText } = render(() => (
      <RadioGroup aria-label="Color" onValueChange={onValueChange}>
        {buttons()}
      </RadioGroup>
    ))
    const green = getByText('green')

    expect(press(green, 'Enter').defaultPrevented).toBe(true)
    await settle()
    expect(onValueChange).not.toHaveBeenCalled()

    press(green, ' ')
    fireEvent.keyUp(green, { key: ' ' })
    await settle()
    expect(onValueChange).toHaveBeenCalledWith('green')
    expect(green).toHaveAttribute('aria-checked', 'true')
  })

  test('the native host leaves the arrow keys to the browser', () => {
    const { getByLabelText } = render(() => (
      <RadioGroup aria-label="Color" defaultValue="red">
        {colors()}
      </RadioGroup>
    ))
    expect(press(getByLabelText('red'), 'ArrowDown').defaultPrevented).toBe(false)
  })

  test('a disabled item leaves the ring, a disabled group takes no clicks', async () => {
    const onValueChange = vi.fn()
    const { getByText } = render(() => (
      <RadioGroup aria-label="Color" defaultValue="red" onValueChange={onValueChange}>
        <RadioGroup.Item as="button" value="red">
          red
        </RadioGroup.Item>
        <RadioGroup.Item as="button" value="green" disabled>
          green
        </RadioGroup.Item>
        <RadioGroup.Item as="button" value="blue">
          blue
        </RadioGroup.Item>
      </RadioGroup>
    ))
    expect(getByText('green')).toBeDisabled()
    expect(getByText('green')).toHaveAttribute('tabindex', '-1')

    getByText('red').focus()
    press(getByText('red'), 'ArrowDown')
    await settle()
    expect(getByText('blue')).toHaveFocus()
    expect(onValueChange).toHaveBeenLastCalledWith('blue')
  })

  test('a disabled group disables every radio and reports nothing', async () => {
    const onValueChange = vi.fn()
    const { getAllByRole, getByLabelText } = render(() => (
      <RadioGroup aria-label="Color" disabled onValueChange={onValueChange}>
        {colors()}
      </RadioGroup>
    ))
    expect(getByLabelText('red')).toBeDisabled()
    expect(getAllByRole('radiogroup')[0]).toHaveAttribute('aria-disabled', 'true')

    fireEvent.click(getByLabelText('green'))
    await settle()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('a readonly group keeps the arrows but commits nothing', async () => {
    const onValueChange = vi.fn()
    const { getByText, getByRole } = render(() => (
      <RadioGroup aria-label="Color" readonly defaultValue="red" onValueChange={onValueChange}>
        {buttons()}
      </RadioGroup>
    ))
    expect(getByRole('radiogroup')).toHaveAttribute('aria-readonly', 'true')

    getByText('red').focus()
    press(getByText('red'), 'ArrowDown')
    await settle()
    expect(getByText('green')).toHaveFocus()
    expect(onValueChange).not.toHaveBeenCalled()
    expect(getByText('red')).toHaveAttribute('aria-checked', 'true')
  })

  test('an item describes itself first, then the group', () => {
    const { getByLabelText } = render(() => (
      <RadioGroup aria-label="Color" aria-describedby="group-hint">
        {colors({ 'aria-describedby': 'own-hint' })}
      </RadioGroup>
    ))
    expect(getByLabelText('red')).toHaveAttribute('aria-describedby', 'own-hint group-hint')
    expect(getByLabelText('green')).toHaveAttribute('aria-describedby', 'group-hint')
  })

  test('a form reset restores the default value', async () => {
    const { container, getByLabelText } = render(() => (
      <form>
        <RadioGroup aria-label="Color" name="color" defaultValue="red">
          {colors()}
        </RadioGroup>
      </form>
    ))
    const green = getByLabelText('green') as HTMLInputElement
    fireEvent.click(green)
    await settle()
    expect(green.checked).toBe(true)

    ;(container.querySelector('form') as HTMLFormElement).reset()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await settle()
    expect(green.checked).toBe(false)
    expect((getByLabelText('red') as HTMLInputElement).checked).toBe(true)
  })

  test('user handlers run first and can cancel the core handler', async () => {
    const onValueChange = vi.fn()
    const { getByText } = render(() => (
      <RadioGroup aria-label="Color" defaultValue="red" onValueChange={onValueChange}>
        <RadioGroup.Item
          as="button"
          value="red"
          onKeyDown={(event: KeyboardEvent) => event.preventDefault()}
        >
          red
        </RadioGroup.Item>
        <RadioGroup.Item as="button" value="green">
          green
        </RadioGroup.Item>
      </RadioGroup>
    ))
    getByText('red').focus()
    press(getByText('red'), 'ArrowDown')
    await settle()
    expect(getByText('red')).toHaveFocus()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  test('items outside a group throw', () => {
    expect(() =>
      createRoot((dispose) => {
        try {
          return RadioGroup.Item({ value: 'red' })
        } finally {
          dispose()
        }
      })
    ).toThrow(/RadioGroup/)
  })
})
