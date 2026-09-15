import { render } from '@solidjs/web'
import { Avatar } from '../../../solid/src/avatar'
import { createSignal, flush } from 'solid-js'
import { within, waitFor } from '@testing-library/dom'
import { expect, test } from 'vitest'

const source = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20" fill="red"/></svg>')}`

test('native image loads, then changing to broken bytes restores fallback', async () => {
  const root = document.createElement('div')
  document.body.append(root)
  const [src, setSrc] = createSignal(source)
  const dispose = render(
    () => (
      <Avatar>
        <Avatar.Image src={src()} alt="Ada" />
        <Avatar.Fallback>Ada</Avatar.Fallback>
      </Avatar>
    ),
    root
  )
  try {
    flush()
    await waitFor(() => expect(within(root).getByRole('img')).toHaveAccessibleName('Ada'))
    expect(root.firstElementChild).toHaveAttribute('data-state', 'loaded')
    setSrc('data:image/png;base64,AAAA')
    flush()
    await waitFor(() => expect(root.firstElementChild).toHaveAttribute('data-state', 'error'))
    expect(within(root).queryByRole('img')).toBeNull()
    expect(within(root).getByText('Ada')).toBeInTheDocument()
  } finally {
    dispose()
    root.remove()
  }
})
