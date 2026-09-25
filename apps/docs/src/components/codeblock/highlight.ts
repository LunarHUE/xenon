import { bundledLanguages, codeToHtml, type BundledLanguage } from 'shiki'

export type { BundledLanguage }

/**
 * Highlight source at build time. Runs in Astro frontmatter or a rehype step, never
 * inside a Solid island. Emits both palettes as `--shiki-light` and `--shiki-dark`
 * variables so `data-theme` switching needs no rerender; `global.css` picks one.
 * A language shiki doesn't bundle renders as plain text instead of throwing.
 */
export function highlight(code: string, lang: string): Promise<string> {
  return codeToHtml(code, {
    lang: lang in bundledLanguages ? lang : 'text',
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  })
}
