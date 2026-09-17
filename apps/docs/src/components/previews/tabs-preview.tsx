import { createSignal } from 'solid-js'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs'

export default function TabsPreview() {
  const [value, setValue] = createSignal('overview')

  return (
    <div>
      <Tabs value={value()} onValueChange={setValue}>
        <TabsList aria-label={'Documentation sections'}>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="api" disabled>
            API
          </TabsTrigger>
          <TabsTrigger value="accessibility">Accessibility</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          Choose a tab or use the arrow keys to change panels.
        </TabsContent>
        <TabsContent value="usage">
          <label class="flex max-w-xs flex-col gap-2">
            Preserved panel state
            <input
              class="border border-foreground px-3 py-2"
              placeholder="Type, then switch tabs"
            />
          </label>
        </TabsContent>
        <TabsContent value="api">The API tab is disabled.</TabsContent>
        <TabsContent value="accessibility">
          Arrow keys skip disabled tabs. Home and End move to the first and last enabled tabs.
        </TabsContent>
      </Tabs>
      <p class="mt-6 text-sm text-muted-foreground" role="status">
        Selected: {value()}
      </p>

      <h3 class="mt-10 mb-6 text-sm text-muted-foreground">Vertical / manual activation</h3>
      <Tabs defaultValue="preview" orientation="vertical" activationMode="manual">
        <TabsList aria-label={'Example views'}>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="code">Code</TabsTrigger>
        </TabsList>
        <TabsContent value="preview">
          Move with Up and Down. Press Enter or Space to select.
        </TabsContent>
        <TabsContent value="code">
          Manual activation keeps the current panel open while focus moves.
        </TabsContent>
      </Tabs>
    </div>
  )
}
