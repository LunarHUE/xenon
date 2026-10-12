import { ref as solidRef } from '@solidjs/web'
import { untrack } from 'solid-js'
import type { JSX } from '@solidjs/web'

/** Native boolean attributes consumed by adapter behavior, rather than forwarded unchanged. */
export type NativeBooleanAttributes<T> = {
  [K in keyof T]: K extends 'disabled' | 'readonly' | 'required' | 'autofocus'
    ? JSX.BooleanAttribute | undefined
    : T[K]
}

/** Empty native boolean attributes enable the behavior just like true. */
export function booleanAttribute(value: JSX.BooleanAttribute | undefined): boolean {
  return value === true || value === ''
}

/**
 * Forward callback refs and nested callback arrays through Solid's native ref lifecycle.
 * Takes a getter so the ref prop is read untracked; refs run in an effect callback.
 */
export function setRef(read: () => unknown, element: Element): void {
  const value = untrack(read)
  if (typeof value === 'function' || Array.isArray(value)) {
    solidRef(() => value as ReturnType<Parameters<typeof solidRef>[0]>, element)
  }
}
