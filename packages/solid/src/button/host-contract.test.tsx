import { render } from '@solidjs/testing-library'
import { createSignal, flush } from 'solid-js'
import { expect, expectTypeOf, test, vi } from 'vitest'
import { Button } from './index'

test('Button preserves native ref arrays and empty boolean attributes', () => {
  const first = vi.fn()
  const second = vi.fn()
  const refs = [first, second]
  const [disabled, setDisabled] = createSignal<boolean | '' | undefined>('')
  const { container } = render(() => (
    <Button ref={refs} disabled={disabled()} aria-label="Action" />
  ))
  const host = first.mock.calls[0]?.[0]
  expect(host).toBeInstanceOf(HTMLElement)
  expect(second).toHaveBeenCalledWith(host)
  const button = container.querySelector('button')!
  expect(button).toBeDisabled()
  setDisabled(undefined)
  flush()
  expect(button).not.toBeDisabled()
})

test('Button infers the selected native host ref', () => {
  const [disabled] = createSignal<boolean>(false)
  render(() => (
    <Button
      ref={(node) => {
        expectTypeOf(node).toEqualTypeOf<HTMLButtonElement>()
      }}
      disabled={disabled()}
      aria-label="Action"
    />
  ))
})

// The selected native host retains its own type meaning.
import type { ButtonProps } from './button'
import type { JSX } from '@solidjs/web'
import { fireEvent } from '@solidjs/testing-library'

test('button types distinguish omitted defaults from explicit removal on both native hosts', () => {
  const [type, setType] = createSignal<'button' | 'submit' | 'reset' | undefined>('submit')
  const { container } = render(() => (
    <>
      <Button data-default="" />
      <Button type={undefined} data-removed="" />
      <Button type={type()} />
      <Button as="input" type={type()} />
      <Button as="a" href="/file" type="application/pdf" />
    </>
  ))
  expect(container.querySelector('[data-default]')).toHaveAttribute('type', 'button')
  expect(container.querySelector('[data-removed]')).not.toHaveAttribute('type')
  const native = [
    ...container.querySelectorAll('button:not([data-default]):not([data-removed]), input'),
  ]
  for (const node of native) expect(node).toHaveAttribute('type', 'submit')
  setType(undefined)
  flush()
  for (const node of native) expect(node).not.toHaveAttribute('type')
  setType('reset')
  flush()
  for (const node of native) expect(node).toHaveAttribute('type', 'reset')
  expect(container.querySelector('a')).toHaveAttribute('type', 'application/pdf')
  expectTypeOf<ButtonProps<'button'>['type']>().toEqualTypeOf<
    'button' | 'submit' | 'reset' | undefined
  >()
  expectTypeOf<ButtonProps<'input'>['type']>().toEqualTypeOf<
    'button' | 'submit' | 'reset' | undefined
  >()
  expectTypeOf<ButtonProps<'a'>['type']>().toEqualTypeOf<
    JSX.AnchorHTMLAttributes<HTMLAnchorElement>['type']
  >()
})

test('Button accepts compiled JSX tuples, optional handlers and native class values', () => {
  const calls: string[] = []
  const tuple: JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> = [
    (value: string, event: MouseEvent) => {
      calls.push(value)
      event.preventDefault()
    },
    'bound',
  ]
  const [handler, setHandler] = createSignal<
    JSX.EventHandlerUnion<HTMLButtonElement, MouseEvent> | undefined
  >(tuple)
  const [classes, setClasses] = createSignal<JSX.ClassValue | undefined>([
    'one',
    { two: true, hidden: false },
  ])
  const { container } = render(() => (
    <>
      <button class={classes()} />
      <Button onClick={handler()} class={classes()} />
    </>
  ))
  const [native, adapted] = [...container.querySelectorAll('button')]
  expect(adapted?.className).toBe(native?.className)
  fireEvent.click(adapted!)
  expect(calls).toEqual(['bound'])
  setHandler(undefined)
  setClasses({ three: true, one: false })
  flush()
  fireEvent.click(adapted!)
  expect(calls).toEqual(['bound'])
  expect(adapted?.className).toBe(native?.className)
  setClasses(undefined)
  flush()
  expect(adapted).not.toHaveAttribute('class')
  expect(native).not.toHaveAttribute('class')
})

test('Button preserves compiled element assignment refs and empty autofocus', () => {
  let assigned!: HTMLButtonElement
  const { container } = render(() => <Button ref={assigned} autofocus="" />)
  expect(assigned).toBe(container.querySelector('button'))
  expect(assigned).toHaveAttribute('autofocus')
  expect(assigned.ownerDocument.activeElement).toBe(assigned)
})

test('Button keeps host-specific ref inference and custom type props', () => {
  const Custom = (props: { type?: 'custom'; ref?: JSX.Ref<HTMLDivElement> }) => (
    <div ref={props.ref} data-type={props.type} />
  )
  const { container } = render(() => (
    <>
      <Button
        as="input"
        type="button"
        ref={(node) => {
          expectTypeOf(node).toEqualTypeOf<HTMLInputElement>()
        }}
      />
      <Button
        as="a"
        href="/file"
        ref={(node) => {
          expectTypeOf(node).toEqualTypeOf<HTMLAnchorElement>()
        }}
      />
      <Button as={Custom} type="custom" />
    </>
  ))
  expect(container.querySelector('div')).toHaveAttribute('data-type', 'custom')
  expectTypeOf<Extract<ButtonProps<'button'>['type'], 'menu' | 'image'>>().toEqualTypeOf<never>()
  expectTypeOf<Extract<ButtonProps<'input'>['type'], 'menu' | 'image'>>().toEqualTypeOf<never>()
})
