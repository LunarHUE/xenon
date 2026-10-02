import { Menubar } from './index'

export function hostTypes() {
  return (
    <>
      <Menubar.Trigger
        disabled=""
        ref={[
          (node) => {
            node satisfies HTMLButtonElement
          },
        ]}
      />
      <Menubar.Trigger
        as="a"
        href="#menu"
        ref={(node) => {
          node satisfies HTMLAnchorElement
        }}
      />
    </>
  )
}
