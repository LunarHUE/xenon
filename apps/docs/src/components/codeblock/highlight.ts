import { codeToHtml, type BundledLanguage } from 'shiki'

export type { BundledLanguage }

/**
 * Highlight source at build time. Runs in Astro frontmatter or a rehype step, never
 * inside a Solid island. Emits both palettes as `--shiki-light` and `--shiki-dark`
 * variables so `data-theme` switching needs no rerender; `global.css` picks one.
 */
export function highlight(code: string, lang: BundledLanguage): Promise<string> {
  return codeToHtml(code, {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  })
}
