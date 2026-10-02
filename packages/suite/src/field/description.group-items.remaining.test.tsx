import { CheckboxGroup, Field } from '@xenon-ui/solid'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { createSignal, Show, flush } from 'solid-js'
import { expect, onTestFinished, test } from 'vitest'

function mount(itemAuthor = false) {
  const container = document.createElement('div')
  document.body.append(container)
  const [showAlpha, setShowAlpha] = createSignal(true)
  const [showGroup, setShowGroup] = createSignal(true)
  const [alphaId, setAlphaId] = createSignal('alpha-help')
  const [groupId, setGroupId] = createSignal('group-help')
  const [authorId, setAuthorId] = createSignal('group-author')
  const dispose = render(
    () => (
      <>
        <p id="group-author">Group introduction.</p>
        <p id="group-author-next">Updated group introduction.</p>
        <p id="alpha-author">Author advice for Alpha.</p>
        <CheckboxGroup aria-label="Preferences" aria-describedby={authorId()}>
          <Show when={showGroup()}>
            <CheckboxGroup.Description id={groupId()}>
              Shared group advice.
            </CheckboxGroup.Description>
          </Show>
          <Field>
            <CheckboxGroup.Item
              value="alpha"
              aria-label="Alpha"
              aria-describedby={itemAuthor ? 'alpha-author' : undefined}
            />
            <Show when={showAlpha()}>
              <Field.Description id={alphaId()}>Advice only for Alpha.</Field.Description>
            </Show>
          </Field>
          <Field>
            <CheckboxGroup.Item value="beta" aria-label="Beta" />
            <Field.Description id="beta-help">Advice only for Beta.</Field.Description>
          </Field>
        </CheckboxGroup>
      </>
    ),
    container
  )
  onTestFinished(() => {
    dispose()
    container.remove()
    flush()
  })
  flush()
  const scope = within(container)
  return {
    container,
    scope,
    setShowAlpha,
    setShowGroup,
    setAlphaId,
    setGroupId,
    setAuthorId,
    group: scope.getByRole('group', { name: 'Preferences' }),
    alpha: scope.getByRole('checkbox', { name: 'Alpha' }),
    beta: scope.getByRole('checkbox', { name: 'Beta' }),
  }
}

async function settle() {
  flush()
  await Promise.resolve()
  flush()
}

function expectReferences(control: HTMLElement, ids: string[]) {
  expect(control).toHaveAttribute('aria-describedby', ids.join(' '))
  for (const id of ids) expect(document.getElementById(id)).not.toBeNull()
}

test('description.roles.8 each item describes itself before shared group references while the group preserves author-first order', async () => {
  const view = mount()
  await settle()
  expectReferences(view.group, ['group-author', 'group-help'])
  expectReferences(view.alpha, ['alpha-help', 'group-author', 'group-help'])
  expectReferences(view.beta, ['beta-help', 'group-author', 'group-help'])
  expect(view.group).toHaveAccessibleDescription('Group introduction. Shared group advice.')
  expect(view.alpha).toHaveAccessibleDescription(
    'Advice only for Alpha. Group introduction. Shared group advice.'
  )
  expect(view.beta).toHaveAccessibleDescription(
    'Advice only for Beta. Group introduction. Shared group advice.'
  )
  expect(view.alpha.getAttribute('aria-describedby')).not.toContain('beta-help')
  expect(view.beta.getAttribute('aria-describedby')).not.toContain('alpha-help')
})

test('description.roles.8 an item author reference precedes its registered description without leaking to sibling or group', async () => {
  const view = mount(true)
  await settle()
  expectReferences(view.alpha, ['alpha-author', 'alpha-help', 'group-author', 'group-help'])
  expectReferences(view.beta, ['beta-help', 'group-author', 'group-help'])
  expectReferences(view.group, ['group-author', 'group-help'])
  expect(view.alpha).toHaveAccessibleDescription(
    'Author advice for Alpha. Advice only for Alpha. Group introduction. Shared group advice.'
  )
  expect(view.beta).toHaveAccessibleDescription(
    'Advice only for Beta. Group introduction. Shared group advice.'
  )
})

test('description.roles.8 reactive ID changes and description removal update only the appropriate item and shared references', async () => {
  const view = mount()
  await settle()
  view.setAlphaId('alpha-help-next')
  view.setGroupId('group-help-next')
  view.setAuthorId('group-author-next')
  await settle()
  expectReferences(view.alpha, ['alpha-help-next', 'group-author-next', 'group-help-next'])
  expectReferences(view.beta, ['beta-help', 'group-author-next', 'group-help-next'])
  expectReferences(view.group, ['group-author-next', 'group-help-next'])
  expect(document.getElementById('alpha-help')).toBeNull()
  expect(document.getElementById('group-help')).toBeNull()
  view.setShowAlpha(false)
  await settle()
  expectReferences(view.alpha, ['group-author-next', 'group-help-next'])
  expectReferences(view.beta, ['beta-help', 'group-author-next', 'group-help-next'])
  expect(view.alpha).toHaveAccessibleDescription('Updated group introduction. Shared group advice.')
  view.setShowGroup(false)
  await settle()
  expectReferences(view.group, ['group-author-next'])
  expectReferences(view.alpha, ['group-author-next'])
  expectReferences(view.beta, ['beta-help', 'group-author-next'])
  view.setShowAlpha(true)
  view.setShowGroup(true)
  await settle()
  expectReferences(view.alpha, ['alpha-help-next', 'group-author-next', 'group-help-next'])
  expectReferences(view.beta, ['beta-help', 'group-author-next', 'group-help-next'])
  expect(view.alpha).toHaveAccessibleDescription(
    'Advice only for Alpha. Updated group introduction. Shared group advice.'
  )
})
