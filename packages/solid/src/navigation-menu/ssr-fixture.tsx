import { renderToString } from '@solidjs/web'
import { NavigationMenu as Nav } from './navigation-menu'
export function renderNavigation(open: boolean) {
  return renderToString(() => (
    <Nav value={open ? 'a' : null}>
      <Nav.List>
        <Nav.Item value="a">
          <Nav.Trigger id="trigger">Products</Nav.Trigger>
        </Nav.Item>
      </Nav.List>
      <Nav.Positioner>
        <Nav.Content value="a" id="panel">
          <Nav.Link href="/products">Products page</Nav.Link>
        </Nav.Content>
      </Nav.Positioner>
    </Nav>
  ))
}
