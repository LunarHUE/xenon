import { Editable } from '@xenon-ui/solid/editable'
import { render } from '@solidjs/web'
import { within } from '@testing-library/dom'
import { flush } from 'solid-js'
import { expect, onTestFinished, test } from 'vitest'
import { userEvent } from 'vitest/browser'

for (const controlled of [false, true])
  test(`real reset keeps ${controlled ? 'controlled' : 'default'} editor form value`, async () => {
    const container = document.createElement('div')
    document.body.append(container)
    const dispose = render(
      () => (
        <form>
          <Editable name="title" defaultValue="Original" value={controlled ? 'Fixed' : undefined}>
            <Editable.Preview />
            <Editable.Input aria-label="Title" />
          </Editable>
          <button type="reset">Reset</button>
        </form>
      ),
      container
    )
    onTestFinished(() => {
      dispose()
      container.remove()
      flush()
    })
    flush()
    const form = container.querySelector('form')!
    expect(new FormData(form).get('title')).toBe(controlled ? 'Fixed' : 'Original')
    await userEvent.click(within(container).getByRole('button', { name: 'Reset' }))
    flush()
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
    flush()
    expect(new FormData(form).get('title')).toBe(controlled ? 'Fixed' : 'Original')
  })
