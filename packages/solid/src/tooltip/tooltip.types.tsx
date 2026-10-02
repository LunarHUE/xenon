import { Tooltip } from './tooltip'

export function hostTypes() {
  return (
    <>
      <Tooltip disabled="" />
      <Tooltip.Trigger
        ref={[
          (node) => {
            node satisfies HTMLButtonElement
          },
        ]}
      />
      <Tooltip.Trigger
        as="a"
        href="#preview"
        ref={(node) => {
          node satisfies HTMLAnchorElement
        }}
      />
    </>
  )
}
