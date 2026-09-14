import { screen } from '@testing-library/dom'
import { describe, expect } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'

describe('button roles', () => {
  spec('button.roles.13', () => {
    mount('button', { children: 'Go' })
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')
  })

  spec('button.roles.16', () => {
    mount('button', { children: 'Go', disabled: true })
    const el = screen.getByRole('button')
    expect(el).toBeDisabled()
    expect(el).not.toHaveAttribute('aria-disabled')
  })

  spec('button.roles.17', () => {
    mount('button', { children: 'Go', as: 'div', disabled: true })
    const el = screen.getByRole('button')
    expect(el).toHaveAttribute('aria-disabled', 'true')
    expect(el).not.toHaveAttribute('disabled')
  })

  spec('button.roles.18', () => {
    const m = mount('button', { children: 'Go' })
    expect(screen.getByRole('button')).not.toHaveAttribute('data-disabled')
    m.setProps({ disabled: true })
    expect(screen.getByRole('button')).toHaveAttribute('data-disabled', '')
  })
})
