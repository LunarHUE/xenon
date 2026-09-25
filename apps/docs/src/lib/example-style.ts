/** localStorage key for the reader's Tailwind On/Off choice on examples. */
export const EXAMPLE_STYLE_KEY = 'example-style'

let count = 0

/** Unique id for an example's code region. Counts across the whole build. */
export function exampleId(name: string): string {
  return `example-${name.replaceAll('/', '-')}-${++count}`
}
