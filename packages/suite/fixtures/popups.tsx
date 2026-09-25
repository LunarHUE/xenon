import { Menu } from '@xenon-ui/solid/menu'
import { Popover } from '@xenon-ui/solid/popover'
import { createSignal } from 'solid-js'

export function Popups(props: { menuOpen?: boolean } = {}) {
  const [selected, setSelected] = createSignal('None')
  return (
    <main>
      <style>{`
        body { margin: 32px; }
        [role="dialog"], [role="menu"] { background: white; color: black; padding: 12px;
          border: 1px solid; min-width: 180px; }
        [role^="menuitem"] { display: block; }
      `}</style>
      <Popover defaultOpen={!props.menuOpen}>
        <Popover.Trigger id="profile-trigger">Edit profile</Popover.Trigger>
        <Popover.Positioner side="bottom" align="start" sideOffset={8}>
          <Popover.Content id="profile-popup">
            <Popover.Title id="profile-title">Profile</Popover.Title>
            <Popover.Description id="profile-help">Update your display name.</Popover.Description>
            <label>
              Name <input id="profile-name" />
            </label>
            <Popover.Close aria-label="Save profile">Save profile</Popover.Close>
          </Popover.Content>
        </Popover.Positioner>
      </Popover>
      <Menu forceMount defaultOpen={props.menuOpen}>
        <Menu.Trigger id="actions-trigger">Actions</Menu.Trigger>
        <Menu.Positioner side="bottom" align="start">
          <Menu.Content id="actions-menu">
            <Menu.Item onSelect={() => setSelected('Duplicate')}>Duplicate</Menu.Item>
            <Menu.CheckboxItem>Show details</Menu.CheckboxItem>
            <Menu.Sub>
              <Menu.SubTrigger>Export</Menu.SubTrigger>
              <Menu.Positioner>
                <Menu.Content>
                  <Menu.Item onSelect={() => setSelected('PDF')}>PDF</Menu.Item>
                  <Menu.Item onSelect={() => setSelected('CSV')}>CSV</Menu.Item>
                </Menu.Content>
              </Menu.Positioner>
            </Menu.Sub>
          </Menu.Content>
        </Menu.Positioner>
      </Menu>
      <button>After actions</button>
      <output aria-label="Selected action">{selected()}</output>
    </main>
  )
}
