import { describe, test } from 'vitest'

import { fieldAdapterContract } from './contract'

describe('field.notes.6 shared entry adapters', () => {
  test('field.notes.6 PinInput adapter', async () => {
    await fieldAdapterContract('pin')
  })

  test('field.notes.6 Editable adapter', async () => {
    await fieldAdapterContract('editable')
  })
})
