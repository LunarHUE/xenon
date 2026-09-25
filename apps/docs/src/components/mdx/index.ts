import Code from '../codeblock/Code.astro'
import Example from '../example/Example.astro'
import Section from '../section/Section.astro'

/** Everything MDX pages can use without importing it. Pass to `<Content components>`. */
export const mdxComponents = { Code, Example, Section }
