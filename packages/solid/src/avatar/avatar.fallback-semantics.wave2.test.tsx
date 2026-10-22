import { render } from '@solidjs/testing-library'
import type { ComponentProps } from '@solidjs/web'
import { createSignal, flush } from 'solid-js'
import { expect, test } from 'vitest'
import { Avatar } from './index'

const ForwardedRoot = (props: ComponentProps<'div'>) => <div {...props} />
const ForwardedFallback = (props: ComponentProps<'span'>) => <span {...props} />

test('a fallback-only avatar keeps plain text readable without inventing image semantics', () => {
  const view = render(() => (
    <Avatar>
      <Avatar.Fallback>Ada Lovelace</Avatar.Fallback>
    </Avatar>
  ))
  const fallback = view.getByText('Ada Lovelace')
  expect(fallback).not.toHaveAttribute('aria-hidden')
  expect(fallback).not.toHaveAttribute('role')
  expect(fallback).not.toHaveAttribute('tabindex')
  expect(fallback).toHaveAttribute('data-state', 'idle')
  expect(view.queryByRole('img')).toBeNull()
  expect(view.container.firstElementChild).not.toHaveAttribute('role')
})

test('forwarding root and fallback components preserve refs and reactive author naming', () => {
  const [name, setName] = createSignal('Ada Lovelace')
  const [initials, setInitials] = createSignal('AL')
  let rootRef: HTMLDivElement | undefined
  let fallbackRef: HTMLSpanElement | undefined
  const view = render(() => (
    <Avatar
      as={ForwardedRoot}
      ref={(node) => {
        rootRef = node
      }}
      data-owner="person"
    >
      <Avatar.Fallback
        as={ForwardedFallback}
        ref={(node) => {
          fallbackRef = node
        }}
        role="img"
        aria-label={name()}
      >
        {initials()}
      </Avatar.Fallback>
    </Avatar>
  ))
  const image = view.getByRole('img', { name: 'Ada Lovelace' })
  expect(image).toBe(fallbackRef)
  expect(image.parentElement).toBe(rootRef)
  expect(rootRef).toHaveAttribute('data-owner', 'person')
  setName('Grace Hopper')
  setInitials('GH')
  flush()
  expect(view.getByRole('img', { name: 'Grace Hopper' })).toBe(image)
  expect(image).toHaveTextContent('GH')
  expect(rootRef).toHaveAttribute('data-state', 'idle')
})

test('fallback external label and description preserve their references through text updates', () => {
  const [description, setDescription] = createSignal('Offline')
  const view = render(() => (
    <>
      <span id="person-name">Ada Lovelace</span>
      <span id="person-state">{description()}</span>
      <Avatar>
        <Avatar.Fallback role="img" aria-labelledby="person-name" aria-describedby="person-state">
          AL
        </Avatar.Fallback>
      </Avatar>
    </>
  ))
  const fallback = view.getByRole('img', { name: 'Ada Lovelace' })
  expect(fallback).toHaveAccessibleDescription('Offline')
  setDescription('Available')
  flush()
  expect(fallback).toHaveAccessibleDescription('Available')
  expect(fallback).toHaveAttribute('aria-labelledby', 'person-name')
})
