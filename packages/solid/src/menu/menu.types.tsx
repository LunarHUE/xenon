import { Menu } from './index'

export function hostTypes() {
  return (
    <>
      <Menu.Trigger
        disabled=""
        ref={(node) => {
          node satisfies HTMLButtonElement
        }}
      />
      <Menu.Item
        disabled=""
        ref={[
          (node) => {
            node satisfies HTMLButtonElement
          },
        ]}
      />
      <Menu.Item
        as="a"
        href="#item"
        ref={(node) => {
          node satisfies HTMLAnchorElement
        }}
      />
      <Menu.Content
        ref={(node) => {
          node satisfies HTMLDivElement
        }}
      />
      <Menu.Positioner
        ref={[
          (node) => {
            node satisfies HTMLDivElement
          },
        ]}
      />
    </>
  )
}
