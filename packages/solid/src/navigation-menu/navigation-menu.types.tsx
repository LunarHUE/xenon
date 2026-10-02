import { NavigationMenu } from './navigation-menu'

export function hostTypes() {
  return (
    <>
      <NavigationMenu
        ref={(node) => {
          node satisfies HTMLElement
        }}
      />
      <NavigationMenu.Trigger
        disabled=""
        ref={[
          (node) => {
            node satisfies HTMLButtonElement
          },
        ]}
      />
      <NavigationMenu.Link
        href="#menu"
        ref={(node) => {
          node satisfies HTMLAnchorElement
        }}
      />
      <NavigationMenu.Content
        value="panel"
        ref={(node) => {
          node satisfies HTMLDivElement
        }}
      />
    </>
  )
}
