import { Menu } from '@tenon/solid/menu'
import { createSignal } from 'solid-js'
import { Bench, Keys, Readout, Section } from '../ui'

export function MenuDemo() {
  const [action, setAction] = createSignal('none')
  const [details, setDetails] = createSignal(true)
  const [density, setDensity] = createSignal('comfortable')
  return (
    <Section
      index="19"
      title="Menu"
      blurb="Actions and choices in one keyboard path. Arrow through the items, type to find one, or open the export submenu."
    >
      <Bench caption="Project actions" note="typeahead · checkbox · radio · submenu">
        <Menu>
          <Menu.Trigger class="btn">
            Project actions <span aria-hidden="true">↓</span>
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner sideOffset={8} collisionPadding={16}>
              <Menu.Content class="demo-menu">
                <Menu.Viewport>
                  <Menu.Group>
                    <Menu.GroupLabel class="demo-menu__label">Field notes</Menu.GroupLabel>
                    <Menu.Item class="demo-menu__item" onSelect={() => setAction('duplicated')}>
                      Duplicate project
                    </Menu.Item>
                    <Menu.Item class="demo-menu__item" disabled>
                      Transfer ownership
                    </Menu.Item>
                  </Menu.Group>
                  <Menu.Separator class="demo-menu__separator" />
                  <Menu.CheckboxItem
                    class="demo-menu__item"
                    checked={details()}
                    onCheckedChange={setDetails}
                  >
                    <span class="demo-menu__indicator">
                      <Menu.ItemIndicator>✓</Menu.ItemIndicator>
                    </span>
                    Show details
                  </Menu.CheckboxItem>
                  <Menu.RadioGroup value={density()} onValueChange={setDensity}>
                    <Menu.GroupLabel class="demo-menu__label">Row density</Menu.GroupLabel>
                    <Menu.RadioItem class="demo-menu__item" value="comfortable">
                      <span class="demo-menu__indicator">
                        <Menu.ItemIndicator>●</Menu.ItemIndicator>
                      </span>
                      Comfortable
                    </Menu.RadioItem>
                    <Menu.RadioItem class="demo-menu__item" value="compact">
                      <span class="demo-menu__indicator">
                        <Menu.ItemIndicator>●</Menu.ItemIndicator>
                      </span>
                      Compact
                    </Menu.RadioItem>
                  </Menu.RadioGroup>
                  <Menu.Separator class="demo-menu__separator" />
                  <Menu.Sub>
                    <Menu.SubTrigger class="demo-menu__item">
                      Export{' '}
                      <span class="demo-menu__end" aria-hidden="true">
                        →
                      </span>
                    </Menu.SubTrigger>
                    <Menu.Portal>
                      <Menu.Positioner sideOffset={6} collisionPadding={16}>
                        <Menu.Content class="demo-menu">
                          <Menu.Viewport>
                            <Menu.Item
                              class="demo-menu__item"
                              onSelect={() => setAction('PDF export selected')}
                            >
                              PDF document
                            </Menu.Item>
                            <Menu.Item
                              class="demo-menu__item"
                              onSelect={() => setAction('CSV export selected')}
                            >
                              CSV spreadsheet
                            </Menu.Item>
                          </Menu.Viewport>
                        </Menu.Content>
                      </Menu.Positioner>
                    </Menu.Portal>
                  </Menu.Sub>
                </Menu.Viewport>
              </Menu.Content>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu>
        <p class="prose">
          <Keys>↑</Keys> <Keys>↓</Keys> move between items. <Keys>→</Keys> opens Export. Choices
          stay open; actions close the menu and update the readout.
        </p>
        <Readout
          rows={[
            ['last action', action()],
            ['show details', String(details())],
            ['density', density()],
          ]}
        />
      </Bench>
    </Section>
  )
}
