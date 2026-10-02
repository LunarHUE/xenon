import { ref as solidRef } from '@solidjs/web'
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

/** Forward callback refs and nested callback arrays through Solid's native ref lifecycle. */
export function setRef(value: unknown, element: Element): void {
  if (typeof value === 'function' || Array.isArray(value)) {
    solidRef(() => value as ReturnType<Parameters<typeof solidRef>[0]>, element)
  }
}
