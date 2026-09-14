import { test } from 'vitest'

type Fn = () => void | Promise<void>

const ID = /^[a-z0-9-]+(?:\.[a-z0-9-]+)?\.\d+$/

function check(id: string) {
  if (!ID.test(id)) throw new Error(`not a spec id: ${id}`)
}

export function spec(id: string, fn: Fn) {
  check(id)
  test(id, fn)
}

spec.todo = (id: string) => {
  check(id)
  test.todo(id)
}

spec.skip = (id: string, reason: string, fn: Fn) => {
  check(id)
  test.skip(`${id} (${reason})`, fn)
}
