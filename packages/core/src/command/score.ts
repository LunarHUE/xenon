/** Score for a query character that continues the previous match. */
const CONTINUE = 1
/** Query character matching the start of a word after a space. */
const SPACE_WORD = 0.9
/** Query character matching the start of a word after other punctuation. */
const WORD = 0.8
/** Query character matching mid-word, after skipped characters. */
const JUMP = 0.17
/** Factor per skipped character. Earlier matches score higher. */
const SKIP = 0.999
/** Factor for a match that differs only by case. */
const CASE = 0.9999
/** Factor per unmatched trailing character, so shorter values win ties. */
const TAIL = 0.99
/** Factor for two adjacent query characters matched in swapped order. */
const SWAP = 0.1

const SPACE = /[\s-]/
const PUNCTUATION = /[\\/_+.#"@[({&]/

/**
 * Fuzzy match score in `[0, 1]` for a query against text, in the style of cmdk.
 *
 * @remarks
 * Every query character must appear in order. Matches score higher when they
 * continue the previous match, start a word, sit early in the text and match
 * case. 0 means no match; 1 means the text equals the query. Matching is
 * case-insensitive.
 */
export function commandScore(text: string, query: string): number {
  if (!query) return 1
  const lower = text.toLowerCase()
  const needle = query.toLowerCase()
  const memo = new Map<number, number>()
  const score = (textIndex: number, queryIndex: number): number => {
    const key = textIndex * (needle.length + 1) + queryIndex
    const cached = memo.get(key)
    if (cached !== undefined) return cached
    if (queryIndex === needle.length)
      return textIndex === lower.length ? CONTINUE : TAIL ** (lower.length - textIndex)
    let best = 0
    const char = needle[queryIndex]!
    for (
      let index = lower.indexOf(char, textIndex);
      index !== -1;
      index = lower.indexOf(char, index + 1)
    ) {
      let value = score(index + 1, queryIndex + 1)
      if (index === textIndex) value *= CONTINUE
      else if (SPACE.test(lower[index - 1]!)) value *= SPACE_WORD * SKIP ** (index - textIndex - 1)
      else if (PUNCTUATION.test(lower[index - 1]!)) value *= WORD * SKIP ** (index - textIndex - 1)
      else value *= JUMP * SKIP ** (index - textIndex)
      if (text[index] !== query[queryIndex]) value *= CASE
      // A swapped pair like "teh" for "the" keeps a small score instead of none.
      if (
        value < SWAP &&
        queryIndex + 1 < needle.length &&
        lower[index - 1] === needle[queryIndex + 1] &&
        lower[index - 1] !== char
      ) {
        const swapped = SWAP * score(index + 1, queryIndex + 2)
        if (swapped > value) value = swapped
      }
      if (value > best) best = value
    }
    memo.set(key, best)
    return best
  }
  return score(0, 0)
}
