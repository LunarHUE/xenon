import { Toast } from './index'

export function hostTypes() {
  return (
    <>
      <Toast.Viewport
        ref={[
          (node) => {
            node satisfies HTMLDivElement
          },
        ]}
      />
      <Toast.Title
        as="h2"
        ref={(node) => {
          node satisfies HTMLHeadingElement
        }}
      />
      <Toast.Description
        as="p"
        ref={(node) => {
          node satisfies HTMLParagraphElement
        }}
      />
    </>
  )
}
