import { AlertDialog, Dialog, Drawer } from '@xenon/solid'

export function Dialogs() {
  return (
    <main>
      <style>{`
        body { margin: 0; min-height: 2500px; }
        dialog { box-sizing: border-box; width: 360px; max-height: 80vh; }
        dialog::backdrop { background: rgb(0 0 0 / 30%); }
        dialog[data-side="bottom"] { margin: auto auto 0; height: 280px;
          transform: translateY(var(--drawer-swipe-offset, 0px)); }
      `}</style>
      <button>Background action</button>
      <Dialog defaultOpen>
        <Dialog.Trigger>Open editor</Dialog.Trigger>
        <Dialog.Content id="editor">
          <Dialog.Title id="editor-title">Edit profile</Dialog.Title>
          <Dialog.Description id="editor-help">Change your public name.</Dialog.Description>
          <div aria-label="Profile history" style={{ height: '80px', overflow: 'auto' }}>
            <div style={{ height: '600px' }}>Previous profile updates</div>
          </div>
          <label>
            Name <input />
          </label>
          <Dialog.Close>Done editing</Dialog.Close>
          <form method="dialog">
            <button value="saved">Native save</button>
          </form>
        </Dialog.Content>
      </Dialog>
      <AlertDialog>
        <AlertDialog.Trigger>Delete profile</AlertDialog.Trigger>
        <AlertDialog.Content>
          <AlertDialog.Title>Delete permanently?</AlertDialog.Title>
          <AlertDialog.Description>This cannot be undone.</AlertDialog.Description>
          <AlertDialog.Action>Confirm deletion</AlertDialog.Action>
          <AlertDialog.Cancel>Keep profile</AlertDialog.Cancel>
        </AlertDialog.Content>
      </AlertDialog>
      <Drawer side="bottom">
        <Drawer.Trigger>Open settings</Drawer.Trigger>
        <Drawer.Content>
          <Drawer.Handle>Drag to close</Drawer.Handle>
          <Drawer.Title>Settings</Drawer.Title>
          <Drawer.Description>Choose your preferences.</Drawer.Description>
          <button>Preference</button>
          <Drawer.Close>Done with settings</Drawer.Close>
        </Drawer.Content>
      </Drawer>
    </main>
  )
}
