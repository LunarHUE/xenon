import { renderToString } from '@solidjs/web'
import { Avatar } from './index'
import { VisuallyHidden } from '../visually-hidden'
import { AccessibleIcon } from '../accessible-icon'

/** Serialize utility content with a pending avatar source. */
export function renderFixture() {
  return renderToString(() => (
    <>
      <Avatar>
        <Avatar.Image src="https://example.invalid/avatar.png" alt="Ada" />
        <Avatar.Fallback>Ada</Avatar.Fallback>
      </Avatar>
      <button>
        <VisuallyHidden>Save</VisuallyHidden>
      </button>
      <AccessibleIcon label="Close">
        <svg />
      </AccessibleIcon>
    </>
  ))
}
