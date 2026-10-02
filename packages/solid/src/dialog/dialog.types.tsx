import { Dialog } from './dialog'

export function hostTypes() {
  return (
    <>
      <Dialog
        ref={(node) => {
          node satisfies HTMLDivElement
        }}
      />
      <Dialog
        as="section"
        ref={(node) => {
          node satisfies HTMLElement
        }}
      />
      <Dialog.Viewport
        ref={(node) => {
          node satisfies HTMLDialogElement
        }}
      />
      <Dialog.Content
        ref={(node) => {
          node satisfies HTMLDivElement | HTMLDialogElement
        }}
      />
      <Dialog.Title
        as="a"
        href="#title"
        ref={(node) => {
          node satisfies HTMLAnchorElement
        }}
      />
      <Dialog.Description
        ref={[
          (node) => {
            node satisfies HTMLParagraphElement
          },
        ]}
      />
    </>
  )
}

export function rejectedHostTypes() {
  return (
    <Dialog.Content
      // @ts-expect-error Content may be a div and cannot promise an HTMLDialogElement.
      ref={(node: HTMLDialogElement) => {
        void node
      }}
    />
  )
}
