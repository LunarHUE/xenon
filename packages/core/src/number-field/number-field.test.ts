import { describe, expect, test, vi } from 'vitest'
import { createNumberFieldFormat, numberField } from './number-field'
describe('numberField', () => {
  test('parses localized decimals, currency, Arabic digits, and percentages strictly', () => {
    expect(createNumberFieldFormat('de-DE').parse('1.234,5')).toBe(1234.5)
    expect(
      createNumberFieldFormat('en-US', { style: 'currency', currency: 'USD' }).parse('$1,234.50')
    ).toBe(1234.5)
    expect(createNumberFieldFormat('ar-EG').parse('١٢٫٥')).toBe(12.5)
    expect(createNumberFieldFormat('en-US', { style: 'percent' }).parse('25%')).toBe(0.25)
    expect(createNumberFieldFormat().parse('12cats')).toBeNaN()
    expect(createNumberFieldFormat().parse('')).toBeNull()
  })
  test('commits drafts, clamps bounds and restores invalid text', () => {
    const onValueChange = vi.fn(),
      onInputValueChange = vi.fn()
    numberField({ value: 2, inputValue: '12', max: 10, onValueChange }).commit()
    expect(onValueChange).toHaveBeenCalledWith(10)
    numberField({ value: 2, inputValue: '-', onValueChange, onInputValueChange }).commit()
    expect(onInputValueChange).toHaveBeenCalledWith('2')
    expect(onValueChange).toHaveBeenCalledTimes(1)
  })
  test.each([
    ['en-US-u-nu-fullwide', '１，２３４．５', 1234.5],
    ['en-US-u-nu-fullwide', '－１，２３４．５', -1234.5],
    ['de-DE-u-nu-fullwide', '１．２３４，５', 1234.5],
    ['de-DE-u-nu-fullwide', '＋１．２３４，５', 1234.5],
    ['fr-FR-u-nu-fullwide', '１\u202f２３４，５', 1234.5],
    ['en-US', '1，234．5', 1234.5],
    ['de-DE', '1．234，5', 1234.5],
  ] as const)('parses fullwidth punctuation using %s separators: %s', (locale, text, value) => {
    expect(createNumberFieldFormat(locale).parse(text)).toBe(value)
  })
  test.each([
    ['en-US-u-nu-fullwide', '１．２．３'],
    ['de-DE-u-nu-fullwide', '１，２，３'],
    ['fr-FR-u-nu-fullwide', '１．２３４，５'],
    ['en-US-u-nu-fullwide', '－＋１．５'],
    ['en-US-u-nu-fullwide', '１．５ｃａｔｓ'],
    ['en-US-u-nu-fullwide', '²．５'],
    ['en-US-u-nu-fullwide', '①．５'],
  ] as const)('rejects malformed fullwidth drafts in %s: %s', (locale, text) => {
    expect(createNumberFieldFormat(locale).parse(text)).toBeNaN()
  })
  test('decimal grid steps avoid floating-point accumulation and bounds are no-ops', () => {
    const change = vi.fn()
    const input = numberField({ value: 0.2, step: 0.1, onValueChange: change }).parts.input
    input.on.keydown?.({ key: 'ArrowUp', preventDefault() {} } as never)
    expect(change).toHaveBeenCalledWith(0.3)
    numberField({ value: 10, max: 10, onValueChange: change }).parts.incrementTrigger.on.click?.(
      {} as never
    )
    expect(change).toHaveBeenCalledTimes(1)
  })
  test('empty, malformed, and bounded semantics stay finite', () => {
    expect(numberField().parts.input.attrs['aria-valuenow']).toBeUndefined()
    expect(numberField({ inputValue: '-' }).parts.input.attrs['aria-invalid']).toBe('true')
    expect(numberField({ value: 3 }).parts.input.attrs['aria-invalid']).toBeUndefined()
  })
  test.each([1, -1] as const)(
    'decimal grid steps keep moving with a minimum offset in direction %i',
    (direction) => {
      let value = direction > 0 ? 0.7 : 24
      for (let index = 0; index < (direction > 0 ? 233 : 239); index++) {
        const previous = value
        const engine = numberField({
          value,
          min: 0.1,
          max: 24,
          step: 0.1,
          onValueChange(next) {
            value = next!
          },
        })
        engine.parts.input.on.keydown?.({
          key: direction > 0 ? 'ArrowUp' : 'ArrowDown',
          preventDefault() {},
        } as never)
        expect((value - previous) * direction).toBeGreaterThan(0)
        expect(value).toBeCloseTo(direction > 0 ? (8 + index) / 10 : (239 - index) / 10, 12)
      }
      const bounded = numberField({ value, min: 0.1, max: 24, step: 0.1 })
      expect(
        direction > 0 ? bounded.state.incrementDisabled : bounded.state.decrementDisabled
      ).toBe(true)
    }
  )
  test.each([
    [0.7 - 1e-10, 'ArrowUp', 0.7],
    [0.7 + 1e-10, 'ArrowDown', 0.7],
    [-0.7 - 1e-10, 'ArrowUp', -0.7],
    [-0.7 + 1e-10, 'ArrowDown', -0.7],
  ])('preserves off-grid movement from %s with %s', (value, key, expected) => {
    const change = vi.fn()
    numberField({
      value: value as number,
      min: -1.1,
      step: 0.1,
      onValueChange: change,
    }).parts.input.on.keydown?.({
      key,
      preventDefault() {},
    } as never)
    expect(change).toHaveBeenCalledTimes(1)
    expect(change.mock.calls[0]![0]).toBeCloseTo(expected as number, 14)
  })
  test.each([
    [1e12 - 0.0001, 'ArrowUp'],
    [1e12 + 0.0001, 'ArrowDown'],
  ] as const)('preserves fractional steps at large grid indices from %s', (value, key) => {
    const change = vi.fn()
    numberField({ value, step: 1, onValueChange: change }).parts.input.on.keydown?.({
      key,
      preventDefault() {},
    } as never)
    expect(change).toHaveBeenCalledExactlyOnceWith(1e12)
  })
  test('canceled and composing keys preserve draft; no-edit blur preserves full precision', () => {
    const change = vi.fn(),
      text = vi.fn()
    const engine = numberField({ value: 1.23456, onValueChange: change, onInputValueChange: text })
    engine.commit()
    expect(text).not.toHaveBeenCalled()
    engine.parts.input.on.keydown?.({ key: 'ArrowUp', isComposing: true } as never)
    engine.parts.input.on.keydown?.({ key: 'ArrowUp', defaultPrevented: true } as never)
    expect(change).not.toHaveBeenCalled()
  })
})

test('long unit formatting parses singular and plural forms', () => {
  const codec = createNumberFieldFormat('en-US', {
    style: 'unit',
    unit: 'hour',
    unitDisplay: 'long',
  })
  expect(codec.parse(codec.format(1))).toBe(1)
  expect(codec.parse(codec.format(2))).toBe(2)
  expect(codec.parse(codec.format(-1))).toBe(-1)
})

test('unsupported exponential and compact display modes fail explicitly', () => {
  expect(() => createNumberFieldFormat('en-US', { notation: 'compact' })).toThrow(RangeError)
  expect(() => createNumberFieldFormat('en-US', { notation: 'scientific' })).toThrow(RangeError)
  expect(() => createNumberFieldFormat('en-US', { notation: 'engineering' })).toThrow(RangeError)
})

test('unit-only singular and dual Arabic phrases retain their numeric meaning', () => {
  const codec = createNumberFieldFormat('ar-EG', {
    style: 'unit',
    unit: 'hour',
    unitDisplay: 'long',
  })
  for (const value of [-2, -1, 1, 2, 5]) expect(codec.parse(codec.format(value))).toBe(value)
})

test('accounting currency formatting accepts parenthesized negative values', () => {
  const codec = createNumberFieldFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    currencySign: 'accounting',
  })
  expect(codec.format(-1234.5)).toContain('(')
  expect(codec.parse(codec.format(-1234.5))).toBe(-1234.5)
})
