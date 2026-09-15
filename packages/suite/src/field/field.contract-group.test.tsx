import { describe, test } from 'vitest'

import { fieldAdapterContract } from './contract'

describe('field.notes.6 final Field-compatible groups', () => {
  test('field.notes.6 Slider adapter', async () => {
    await fieldAdapterContract('slider')
  })

  test('field.notes.6 CheckboxGroup adapter', async () => {
    await fieldAdapterContract('checkbox-group')
  })
})
