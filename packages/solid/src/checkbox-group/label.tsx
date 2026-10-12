import { isServer } from '@solidjs/web'
import type { ComponentProps, JSX } from '@solidjs/web'
import { omit, onSettled } from 'solid-js'
import { setRef } from '../internal/host'
import { spread } from '../spread'
import { useField, fieldFlags } from '../field/context'

/** Native span props for a group name. An author ID overrides the generated ID. */
export type CheckboxGroupLabelProps = ComponentProps<'span'>

/** Names the group without labeling or activating an individual checkbox. */
export function CheckboxGroupLabel(props: CheckboxGroupLabelProps): JSX.Element {
  const context = useField('CheckboxGroup.Label')
  const rest = omit(props, 'children', 'id', 'ref')
  const id = () => (typeof props.id === 'string' ? props.id : context.ids.label)
  let el: HTMLSpanElement | undefined
  // eslint-disable-next-line solid/reactivity -- server registry stores the live ID accessor
  if (isServer) context.registerLabel(() => id())
  onSettled(() => context.registerLabel(id, el))
  return (
    <span
      {...spread({ attrs: fieldFlags(context), on: {} }, { ...rest })}
      id={id()}
      ref={(node) => {
        el = node
        setRef(() => props.ref, node)
      }}
    >
      {props.children}
    </span>
  )
}
