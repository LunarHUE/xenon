import { Field } from '@kit/solid'
import { screen } from '@testing-library/dom'
import { describe, expect, vi } from 'vitest'

import { mount } from '../harness/solid'
import { spec } from '../spec'
import { fieldContract } from './contract'

describe('native text controls in fields', () => {
  for (const kind of ['input', 'textarea'] as const) {
    spec(`${kind}.roles.1`, async () => {
      const m = mount('field', { children: () => <Field.Control as={kind} /> })
      await m.settle()
      expect(screen.getByRole('textbox').tagName.toLowerCase()).toBe(kind)
      expect(screen.getByRole('textbox').id).not.toBe('')
      m.unmount()
      mount('field', { children: () => <Field.Control as={kind} id="author" /> })
      expect(screen.getByRole('textbox')).toHaveAttribute('id', 'author')
    })
    spec(`${kind}.roles.2`, () => fieldContract(kind))
  }

  spec('text-field.roles.1', () => {
    const m = mount('field', { children: () => <Field.Control /> })
    expect((screen.getByRole('textbox') as HTMLInputElement).type).toBe('text')
    m.unmount()
    const search = mount('field', { children: () => <Field.Control type="search" /> })
    expect(screen.getByRole('searchbox')).toHaveAttribute('type', 'search')
    search.unmount()
    mount('field', { children: () => <Field.Control as="textarea" /> })
    expect(screen.getByRole('textbox')).not.toHaveAttribute('type')
  })

  spec('text-field.roles.2', () => {
    mount('field', { children: () => <Field.Control /> })
    const control = screen.getByRole('textbox')
    for (const attr of [
      'required',
      'disabled',
      'readonly',
      'data-valid',
      'data-invalid',
      'data-required',
      'data-disabled',
      'data-readonly',
    ])
      expect(control).not.toHaveAttribute(attr)
  })

  spec('text-field.roles.3', () => {
    mount('field', {
      invalid: true,
      children: () => <Field.Control aria-errormessage="author-error" />,
    })
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-errormessage', 'author-error')
  })

  spec('text-field.roles.5', () => {
    mount('field', {
      children: () => (
        <Field.Control
          autocapitalize="words"
          aria-activedescendant="item"
          aria-autocomplete="list"
          aria-haspopup="listbox"
        />
      ),
    })
    const control = screen.getByRole('textbox')
    expect(control).toHaveAttribute('autocapitalize', 'words')
    expect(control).toHaveAttribute('aria-activedescendant', 'item')
    expect(control).toHaveAttribute('aria-autocomplete', 'list')
    expect(control).toHaveAttribute('aria-haspopup', 'listbox')
  })

  spec('text-field.roles.8', () => {
    mount('field', {
      children: () => (
        <>
          <form id="external" />
          <Field.Control form="external" />
        </>
      ),
    })
    expect((screen.getByRole('textbox') as HTMLInputElement).form).toBe(
      document.getElementById('external')
    )
  })

  spec('text-field.state.3', () => {
    const ref = vi.fn()
    mount('field', { children: () => <Field.Control ref={ref} /> })
    expect(ref).toHaveBeenCalledWith(screen.getByRole('textbox'))
  })

  spec('text-field.forms.1', () => {
    const m = mount('field', { name: 'account', children: () => <Field.Control /> })
    expect(screen.getByRole('textbox')).toHaveAttribute('name', 'account')
    expect(m.container.querySelectorAll('input')).toHaveLength(1)
    expect(m.container.querySelector('input[type="hidden"]')).toBeNull()
  })
})
