import { slider } from '@xenon/core/slider'
import type { SliderOptions, SliderResult } from '@xenon/core/slider'
import type { GlobalAttrs } from '@xenon/core'
import { isServer } from '@solidjs/web'
import type { JSX } from '@solidjs/web'
import {
  createContext,
  createEffect,
  createMemo,
  createSignal,
  createUniqueId,
  omit,
  onCleanup,
  onSettled,
  untrack,
  useContext,
} from 'solid-js'
import { useFieldContext, fieldDescribedBy, fieldLabelledBy, tokens } from '../field/context'
import { spread } from '../spread'

/** Slider root options. Values always use arrays, including a single thumb. */
export interface SliderProps
  extends Omit<JSX.IntrinsicElements['div'], 'onChange'>, Omit<SliderOptions, 'direction'> {
  /** Initial uncontrolled values and silent form-reset destination. */
  defaultValue?: readonly number[]
  /** Receives each different requested value; controlled props remain authoritative. */
  onValueChange?: (value: number[]) => void
  /** Receives the final requested value once per changed gesture. */
  onValueCommit?: (value: number[]) => void
  /** Native form name shared by every thumb, producing repeated entries. */
  name?: string
  /** Explicit owning form ID. */
  form?: string
  /** Reading direction; inherits the nearest ancestor when omitted. */
  dir?: 'ltr' | 'rtl'
}
/** Native range input options. Each index refers to a stable value position. */
export interface SliderThumbProps extends Omit<
  JSX.IntrinsicElements['input'],
  'type' | 'value' | 'min' | 'max' | 'step' | 'name' | 'form' | 'disabled'
> {
  /** Zero-based position in the root's array, read once when the part mounts. */
  index?: number
}
/** Layout or decorative slider part attributes. */
export type SliderPartProps = JSX.IntrinsicElements['div']
/** Value output attributes, with optional author-provided content. */
export type SliderValueTextProps = JSX.IntrinsicElements['output']
/** Label attributes. Rendered as a span to avoid native range label bugs. */
export type SliderLabelProps = JSX.IntrinsicElements['span']

/** Shared slider snapshot, native thumb registry, and gesture coordination. */
interface Context {
  /** Current normalized core result. */
  result(): SliderResult
  /** Reactive root configuration. */
  props: SliderProps
  /** Stable fallback base for generated part IDs. */
  id: string
  /** Registered shared label ID. */
  label(): string | undefined
  /** Update the registered label ID. */
  setLabel(value: string | undefined): void
  /** Current field and slider data attributes. */
  flags(): GlobalAttrs
  /** Mounted native thumbs keyed by their initial index. */
  inputs: Map<number, HTMLInputElement>
  /** Live author-aware thumb ID readers. */
  thumbIds: Map<number, () => string>
  /** Request different values and queue DOM synchronization. */
  change(value: number[]): void
  /** Emit the latest pending change once per finished gesture. */
  commit(): void
  /** Restore native input values after reactive updates settle. */
  sync(): void
  /** Start a pointer gesture against the mounted control geometry. */
  start(event: PointerEvent, index?: number): void
  /** Register the element whose bounds define pointer coordinates. */
  setControl(el: HTMLDivElement): void
  /** Record focus for root styling. */
  setFocus(value: boolean): void
  /** Optional enclosing Field. */
  field: ReturnType<typeof useFieldContext>
}
const SliderContext = createContext<Context>()
/** Read the required owning Slider context. */
function useSlider(): Context {
  const context = useContext(SliderContext)
  if (!context) throw new Error('Slider parts must be rendered inside <Slider>')
  return context
}

/** Append author string styles or merge author object styles after defaults. */
function mergeStyle(
  style: SliderPartProps['style'],
  defaults: JSX.CSSProperties
): JSX.CSSProperties | string {
  return typeof style === 'string'
    ? `${Object.entries(defaults)
      .map(([key, value]) => `${key}:${value}`)
      .join(';')};${style}`
    : { ...defaults, ...(typeof style === 'object' ? style : {}) }
}

/** Own array values, native form reset and pointer gesture cleanup. */
function SliderRoot(props: SliderProps): JSX.Element {
  const field = useFieldContext()
  const id = createUniqueId()
  const [internal, setInternal] = createSignal<readonly number[]>(
    untrack(() => props.defaultValue ?? [props.min ?? 0])
  )
  const [direction, setDirection] = createSignal<'ltr' | 'rtl'>('ltr')
  const [dragging, setDragging] = createSignal(false, { ownedWrite: true })
  const [focused, setFocus] = createSignal(false, { ownedWrite: true })
  const [labelSignal, setLabelSignal] = createSignal<string | undefined>(undefined, {
    ownedWrite: true,
  })
  let registeredLabel: string | undefined
  const label = () => (isServer ? registeredLabel : labelSignal())
  const setLabel = (value: string | undefined) => {
    registeredLabel = value
    if (!isServer) setLabelSignal(value)
  }
  const result = createMemo(() =>
    slider({
      min: props.min,
      max: props.max,
      step: props.step,
      largeStep: props.largeStep,
      minStepsBetweenThumbs: props.minStepsBetweenThumbs,
      orientation: props.orientation,
      format: props.format,
      value: props.value ?? internal(),
      direction: props.dir ?? direction(),
      disabled: props.disabled || field?.disabled(),
      readonly: props.readonly || field?.readonly(),
      invalid: props.invalid || field?.invalid(),
      required: props.required || field?.required(),
    })
  )
  const inputs = new Map<number, HTMLInputElement>()
  const thumbIds = new Map<number, () => string>()
  let root: HTMLDivElement | undefined
  let control: HTMLDivElement | undefined
  let pending: number[] | undefined
  let removeDrag: (() => void) | undefined
  const sync = () =>
    onSettled(() => {
      for (const [index, input] of inputs) {
        input.value = String(result().state.value[index] ?? result().state.min)
        if (input.disabled && input === input.ownerDocument.activeElement) input.blur()
      }
    })
  const change = (next: number[]) => {
    if (next.every((value, index) => value === result().state.value[index])) return
    pending = [...next]
    if (props.value === undefined) setInternal(next)
    props.onValueChange?.([...next])
    sync()
  }
  const commit = () => {
    const value = pending
    pending = undefined
    if (value) props.onValueCommit?.(value)
  }
  const start = (event: PointerEvent, thumb?: number) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      !result().state.interactive ||
      !control ||
      removeDrag
    )
      return
    const rect = control.getBoundingClientRect()
    const numeric = (e: PointerEvent) =>
      result().fromRatio(
        result().state.orientation === 'vertical'
          ? (e.clientY - rect.top) / rect.height
          : (e.clientX - rect.left) / rect.width
      )
    if (!(result().state.orientation === 'vertical' ? rect.height : rect.width)) return
    const position = numeric(event)
    const values = result().state.value
    const index =
      thumb ??
      values.reduce(
        (nearest, value, i) =>
          Math.abs(value - position) < Math.abs(values[nearest]! - position) ||
            (value === values[nearest] && position >= value)
            ? i
            : nearest,
        0
      )
    if (!inputs.has(index)) return
    event.preventDefault()
    inputs.get(index)?.focus()
    pending = undefined
    setDragging(true)
    if (thumb === undefined) change(result().setValue(index, position))
    const doc = control.ownerDocument
    const pointerId = event.pointerId
    const move = (e: PointerEvent) => {
      if (e.pointerId === pointerId && result().state.interactive) {
        e.preventDefault()
        change(result().setValue(index, numeric(e)))
      }
    }
    const end = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return
      removeDrag?.()
      commit()
    }
    // This cleanup runs from pointer events, the state effect, or owner disposal.
    // eslint-disable-next-line solid/reactivity
    removeDrag = () => {
      doc.removeEventListener('pointermove', move)
      doc.removeEventListener('pointerup', end)
      doc.removeEventListener('pointercancel', end)
      removeDrag = undefined
      setDragging(false)
    }
    doc.addEventListener('pointermove', move, { passive: false })
    doc.addEventListener('pointerup', end)
    doc.addEventListener('pointercancel', end)
  }
  onCleanup(() => removeDrag?.())
  onSettled(() => {
    if (!root) return
    setDirection(
      (root.parentElement?.closest('[dir]')?.getAttribute('dir') ?? root.ownerDocument.dir) ===
        'rtl'
        ? 'rtl'
        : 'ltr'
    )
    const doc = root.ownerDocument
    let resetTimer: ReturnType<typeof setTimeout> | undefined
    const reset = (event: Event) => {
      if (event.target !== inputs.values().next().value?.form) return
      resetTimer = setTimeout(() => {
        if (event.defaultPrevented) return
        pending = undefined
        if (props.value === undefined) setInternal(props.defaultValue ?? [props.min ?? 0])
        sync()
      })
    }
    doc.addEventListener('reset', reset)
    return () => {
      doc.removeEventListener('reset', reset)
      clearTimeout(resetTimer)
    }
  })
  createEffect(result, (snapshot) => {
    sync()
    if (!snapshot.state.interactive) {
      removeDrag?.()
      pending = undefined
    }
  })
  const context: Context = {
    result,
    props,
    id,
    label,
    setLabel,
    inputs,
    thumbIds,
    change,
    commit,
    sync,
    start,
    setControl: (el) => {
      control = el
    },
    setFocus,
    field,
    flags: () => ({
      ...result().parts.control.attrs,
      'data-dragging': dragging() ? '' : undefined,
      'data-focus': focused() ? '' : undefined,
    }),
  }
  const rest = omit(
    props,
    'children',
    'value',
    'defaultValue',
    'onValueChange',
    'onValueCommit',
    'min',
    'max',
    'step',
    'largeStep',
    'minStepsBetweenThumbs',
    'orientation',
    'disabled',
    'readonly',
    'invalid',
    'required',
    'format',
    'name',
    'form',
    'ref'
  )
  const content = createMemo(() => <SliderContext value={context}>{props.children}</SliderContext>)
  return (
    <div
      {...spread(result().parts.root, {
        ...context.flags(),
        'aria-labelledby': props['aria-labelledby'] ?? label(),
        ...rest,
      })}
      ref={(el) => {
        root = el
        if (typeof props.ref === 'function') props.ref(el)
      }}
    >
      {content()}
    </div>
  )
}

/** Register pointer geometry and suppress touch scrolling during a gesture. */
function SliderControl(props: SliderPartProps): JSX.Element {
  const context = useSlider()
  const rest = omit(props, 'children', 'ref')
  return (
    <div
      {...spread(
        {
          attrs: context.flags(),
          on: { pointerdown: (event: PointerEvent) => context.start(event) },
        },
        rest
      )}
      ref={(el) => {
        context.setControl(el)
        if (typeof props.ref === 'function') props.ref(el)
      }}
      style={mergeStyle(props.style, { position: 'relative', 'touch-action': 'none' })}
    >
      {props.children}
    </div>
  )
}
/** Render a decorative track with shared styling flags. */
function SliderTrack(props: SliderPartProps): JSX.Element {
  const context = useSlider()
  return (
    <div
      {...spread({ attrs: context.flags(), on: {} }, omit(props, 'children'))}
      aria-hidden="true"
    >
      {props.children}
    </div>
  )
}
/** Expose numeric start and end percentage properties for consumer CSS. */
function SliderRange(props: SliderPartProps): JSX.Element {
  const context = useSlider()
  const style = () => {
    const result = context.result()
    const start = result.state.value.length > 1 ? result.percentage(result.state.value[0]!) : 0
    const end = result.percentage(result.state.value.at(-1)!)
    return mergeStyle(props.style, {
      '--slider-range-start': `${start}%`,
      '--slider-range-end': `${end}%`,
    })
  }
  return (
    <div
      {...spread({ attrs: context.flags(), on: {} }, omit(props, 'children', 'style'))}
      style={style()}
      aria-hidden="true"
    >
      {props.children}
    </div>
  )
}
/** Render a native range input at its initial fixed index with custom keyboard stepping. */
function SliderThumb(props: SliderThumbProps): JSX.Element {
  const context = useSlider()
  const initialIndex = untrack(() => props.index ?? 0)
  const index = () => initialIndex
  const id = () => (typeof props.id === 'string' ? props.id : `${context.id}-thumb-${index()}`)
  let input: HTMLInputElement | undefined
  const rest = omit(
    props,
    'index',
    'ref',
    'style',
    'aria-labelledby',
    'aria-describedby',
    'aria-label'
  )
  untrack(() => context.thumbIds.set(initialIndex, id))
  onCleanup(() => context.thumbIds.delete(index()))
  if (initialIndex === 0 && context.field) {
    const field = context.field
    onCleanup(untrack(() => field.registerControl(id)))
  }
  onSettled(() => {
    if (!input) return
    context.inputs.set(initialIndex, input)
    return () => {
      context.inputs.delete(initialIndex)
    }
  })
  const part = () => {
    const native = context.result().parts.thumb(index())
    return {
      attrs: {
        ...native.attrs,
        ...context.flags(),
        id: id(),
        name: context.props.name ?? context.field?.name(),
        form: context.props.form,
        'aria-label': tokens(props['aria-label'] ?? context.props['aria-label']),
        'aria-labelledby':
          typeof props['aria-label'] === 'string' && !props['aria-labelledby']
            ? undefined
            : context.field
              ? fieldLabelledBy(
                context.field,
                tokens(
                  props['aria-labelledby'],
                  context.props['aria-labelledby'],
                  context.label()
                ),
                false
              )
              : tokens(props['aria-labelledby'], context.props['aria-labelledby'], context.label()),
        'aria-describedby': context.field
          ? fieldDescribedBy(
            context.field,
            tokens(props['aria-describedby'], context.props['aria-describedby'])
          )
          : tokens(props['aria-describedby'], context.props['aria-describedby']),
      },
      on: {
        pointerdown: (event: PointerEvent) => {
          event.stopPropagation()
          context.start(event, index())
        },
        keydown: (event: KeyboardEvent) => {
          const next = context.result().key(index(), event.key, event.shiftKey)
          if (!next) return
          event.preventDefault()
          event.stopPropagation()
          context.change(next)
        },
        keyup: (event: KeyboardEvent) => {
          if (context.result().key(index(), event.key, event.shiftKey)) context.commit()
        },
        input: (event: Event) => {
          context.change(
            context
              .result()
              .setValue(index(), Number((event.currentTarget as HTMLInputElement).value))
          )
          context.sync()
        },
        change: () => context.commit(),
        focus: () => context.setFocus(true),
        blur: () => {
          context.setFocus(false)
          context.commit()
        },
      },
    }
  }
  const bindings = () => {
    const merged = spread(part(), {
      ...rest,
      style: mergeStyle(props.style, {
        '--slider-thumb-position': `${context.result().percentage(context.result().state.value[index()] ?? 0)}%`,
      }),
    })
    const key = Object.keys(merged).find((name) => name.toLowerCase() === 'oninput')!
    const handler = merged[key] as (event: Event) => void
    merged[key] = (event: Event) => {
      try {
        handler(event)
      } finally {
        context.sync()
      }
    }
    return merged
  }
  return (
    <input
      {...bindings()}
      ref={(el) => {
        input = el
        if (typeof props.ref === 'function') props.ref(el)
      }}
    />
  )
}
/** Register a shared label ID and focus the first thumb when the label is clicked. */
function SliderLabel(props: SliderLabelProps): JSX.Element {
  const context = useSlider()
  const id = () => (typeof props.id === 'string' ? props.id : `${context.id}-label`)
  untrack(() => context.setLabel(id()))
  createEffect(id, (value) => {
    context.setLabel(value)
  })
  onCleanup(() => context.setLabel(undefined))
  return (
    <span
      {...spread(
        {
          attrs: context.flags(),
          on: {
            click: () => {
              context.inputs.get(0)?.focus()
            },
          },
        },
        omit(props, 'children')
      )}
      id={id()}
    >
      {props.children}
    </span>
  )
}
/** Render consumer content or the current values separated by a dash. */
function SliderValueText(props: SliderValueTextProps): JSX.Element {
  const context = useSlider()
  const rest = omit(props, 'children')
  return (
    <output
      {...spread({ attrs: context.flags(), on: {} })}
      role="status"
      aria-live="off"
      for={context
        .result()
        .state.value.map((_, index) => {
          const readId = context.thumbIds.get(index)
          return readId ? readId() : `${context.id}-thumb-${index}`
        })
        .join(' ')}
      {...rest}
    >
      {props.children ??
        context
          .result()
          .state.value.map((value, index) => context.props.format?.(value, index) ?? String(value))
          .join(' – ')}
    </output>
  )
}
/** Native range inputs with fixed thumb order, pointer geometry, keyboard steps, and native forms. Style geometry through the published percentage properties. */
export const Slider = Object.assign(SliderRoot, {
  /** Pointer rail. Its rectangle defines the full numeric range. */
  Control: SliderControl,
  /** Decorative rail. */
  Track: SliderTrack,
  /** Decorative selected span with start/end percentage properties. */
  Range: SliderRange,
  /** Focusable native range input at an explicit index. */
  Thumb: SliderThumb,
  /** Shared visible name referenced by each thumb. */
  Label: SliderLabel,
  /** Non-announcing formatted output for all values. */
  ValueText: SliderValueText,
})
