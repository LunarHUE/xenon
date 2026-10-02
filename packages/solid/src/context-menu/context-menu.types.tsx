import { ContextMenu } from './index'

export function hostTypes() {
  return (
    <>
      <ContextMenu.Trigger
        disabled=""
        ref={[
          (node) => {
            node satisfies HTMLDivElement
          },
        ]}
      />
      <ContextMenu.Trigger
        as="button"
        disabled=""
        ref={(node) => {
          node satisfies HTMLButtonElement
        }}
      />
    </>
  )
}
