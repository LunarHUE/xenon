import { Popover } from './popover'

export function hostTypes() {
  return (
    <>
      <Popover
        ref={(node) => {
          node satisfies HTMLDivElement
        }}
      />
      <Popover.Content
        as="section"
        ref={(node) => {
          node satisfies HTMLElement
        }}
      />
      <Popover.Positioner
        ref={[
          (node) => {
            node satisfies HTMLDivElement
          },
        ]}
      />
      <Popover.Title
        as="a"
        href="#title"
        ref={(node) => {
          node satisfies HTMLAnchorElement
        }}
      />
      <Popover.Description
        ref={(node) => {
          node satisfies HTMLParagraphElement
        }}
      />
      <Popover.Anchor
        as="button"
        ref={(node) => {
          node satisfies HTMLButtonElement
        }}
      />
    </>
  )
}

function AnchorHost(props: { ref?: (node: HTMLAnchorElement) => void; href: string }) {
  return <a {...props} />
}
export function customHostTypes() {
  return (
    <Popover.Content
      as={AnchorHost}
      href="#custom"
      ref={(node) => {
        node satisfies HTMLAnchorElement
      }}
    />
  )
}
export function rejectedHostTypes() {
  return (
    <Popover.Description
      // @ts-expect-error A paragraph host cannot supply a button ref.
      ref={(node: HTMLButtonElement) => {
        void node
      }}
    />
  )
}
