import { renderToString } from '@solidjs/web'
import { Resizable } from './resizable'
/** Server layout with explicit sizing and stable author IDs. */
export function renderResizable(): string {
  return renderToString(() => (
    <Resizable defaultSizes={[30, 40, 30]}>
      <Resizable.Panel index={0} id="files" aria-label="Files">
        Files
      </Resizable.Panel>
      <Resizable.Handle index={0} />
      <Resizable.Panel index={1} minSize={20}>
        Editor
      </Resizable.Panel>
      <Resizable.Handle index={1} aria-label="Editor" />
      <Resizable.Panel index={2}>Preview</Resizable.Panel>
    </Resizable>
  ))
}
/** Later constraints must update earlier server panel styles and separator values. */
export function renderConstrained(): string {
  return renderToString(() => (
    <Resizable>
      <Resizable.Panel index={0} aria-label="Files" />
      <Resizable.Handle index={0} />
      <Resizable.Panel index={1} minSize={70} />
    </Resizable>
  ))
}
