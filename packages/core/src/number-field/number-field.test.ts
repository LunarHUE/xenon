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
