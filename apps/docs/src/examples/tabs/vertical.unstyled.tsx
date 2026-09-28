import { Tabs } from '@xenon-ui/solid/tabs'

export default function Vertical() {
  return (
    <Tabs orientation="vertical">
      <Tabs.List aria-label="Account">
        <Tabs.Tab value="profile">Profile</Tabs.Tab>
        <Tabs.Tab value="security">Security</Tabs.Tab>
        <Tabs.Tab value="notifications">Notifications</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="profile">
        Your name and photo appear on comments and commits.
      </Tabs.Panel>
      <Tabs.Panel value="security">
        Change your password and manage two-factor sign-in.
      </Tabs.Panel>
      <Tabs.Panel value="notifications">
        Pick which events send you an email.
      </Tabs.Panel>
    </Tabs>
  )
}
