import Code from '../codeblock/Code.astro'
import Example from '../example/Example.astro'
import Section from '../section/Section.astro'
import Definition from './Definition.astro'
import Definitions from './Definitions.astro'
import Kbd from './Kbd.astro'

/** Everything MDX pages can use without importing it. Pass to `<Content components>`. */
export const mdxComponents = { Code, Definition, Definitions, Example, Kbd, Section }
