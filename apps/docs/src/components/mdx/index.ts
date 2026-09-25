import Anatomy from '../anatomy/Anatomy.astro'
import Code from '../codeblock/Code.astro'
import Example from '../example/Example.astro'
import Section from '../section/Section.astro'
import Callout from './Callout.astro'
import Definition from './Definition.astro'
import Definitions from './Definitions.astro'
import Kbd from './Kbd.astro'
import Prop from './Prop.astro'
import Props from './Props.astro'

/** Everything MDX pages can use without importing it. Pass to `<Content components>`. */
export const mdxComponents = {
  Anatomy,
  Callout,
  Code,
  Definition,
  Definitions,
  Example,
  Kbd,
  Prop,
  Props,
  Section,
}
