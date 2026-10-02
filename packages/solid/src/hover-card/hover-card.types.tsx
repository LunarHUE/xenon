import { HoverCard } from './hover-card'

export function hostTypes() {
  return (
    <>
      <HoverCard disabled="" />
      <HoverCard.Trigger
        href="#preview"
        ref={[
          (node) => {
            node satisfies HTMLAnchorElement
          },
        ]}
      />
      <HoverCard.Trigger
        as="button"
        ref={(node) => {
          node satisfies HTMLButtonElement
        }}
      />
    </>
  )
}
