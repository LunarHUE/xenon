export type SelectionMode = 'single' | 'multiple' | 'none'

export type SelectionValue<T> = T | readonly T[] | undefined

export interface SelectionOptions<T> {
  mode?: SelectionMode
  value?: T | readonly T[]
  allowEmpty?: boolean
}

export interface SelectionResult<T> {
  mode: SelectionMode
  values: readonly T[]
  isSelected(item: T): boolean
  toggle(item: T): SelectionValue<T>
  select(item: T): SelectionValue<T>
  clear(): SelectionValue<T>
}

function toValues<T>(value: T | readonly T[] | undefined, mode: SelectionMode): readonly T[] {
  if (value === undefined) return []
  if (!Array.isArray(value)) return [value as T]
  const list = value as readonly T[]
  return mode === 'multiple' ? list : list.slice(0, 1)
}

export function selection<T>(options: SelectionOptions<T> = {}): SelectionResult<T> {
  const mode = options.mode ?? 'single'
  const allowEmpty = options.allowEmpty ?? true
  const given = options.value
  const values = toValues(given, mode)

  const payload = (next: readonly T[]): SelectionValue<T> => (mode === 'multiple' ? next : next[0])

  const commit = (next: readonly T[]): SelectionValue<T> =>
    !allowEmpty && next.length === 0 ? payload(values) : payload(next)

  const isSelected = (item: T) => mode !== 'none' && values.includes(item)

  return {
    mode,
    values,
    isSelected,
    toggle(item) {
      if (mode === 'none') return given
      if (!isSelected(item)) return payload(mode === 'multiple' ? [...values, item] : [item])
      return commit(values.filter((other) => other !== item))
    },
    select(item) {
      if (mode === 'none') return given
      if (mode === 'single') return payload([item])
      return payload(isSelected(item) ? values : [...values, item])
    },
    clear() {
      if (mode === 'none') return given
      return commit([])
    },
  }
}
