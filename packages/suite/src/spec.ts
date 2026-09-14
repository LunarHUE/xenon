import { test } from 'vitest'

/** Test body invoked by Vitest, which awaits a returned promise and reports failures. */
type Fn = () => void | Promise<void>

/** One or two lowercase alphanumeric/hyphen segments followed by a numeric requirement suffix. */
const ID = /^[a-z0-9-]+(?:\.[a-z0-9-]+)?\.\d+$/

/**
 * Validates only ID syntax, without checking the specification files or uniqueness.
 * @throws If the ID does not match the supported requirement-name format.
 */
function check(id: string) {
  if (!ID.test(id)) throw new Error(`not a spec id: ${id}`)
}

/**
 * Registers a Vitest test named by its requirement ID, such as button.1 or button.keyboard.1.
 * The body runs later under Vitest; this wrapper does not invoke it or return a test handle.
 * @param id - Syntactically valid requirement ID; existence and coverage are checked elsewhere.
 * @param fn - Synchronous or asynchronous test body owned by Vitest.
 * @throws If ID validation fails during registration.
 */
export function spec(id: string, fn: Fn) {
  check(id)
  test(id, fn)
}

/** Registers a bodyless pending requirement after syntax validation; does not execute a test body. */
spec.todo = (id: string) => {
  check(id)
  test.todo(id)
}

/**
 * Registers a skipped requirement as id (reason). The supplied body is retained by
 * Vitest but is not executed by the skipped test; the reason is not validated.
 * @throws If the requirement ID is malformed.
 */
spec.skip = (id: string, reason: string, fn: Fn) => {
  check(id)
  test.skip(`${id} (${reason})`, fn)
}
