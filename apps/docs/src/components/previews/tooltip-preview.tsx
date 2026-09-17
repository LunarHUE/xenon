import { Bold, Italic, Underline } from 'lucide'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip'
import { Button } from '../ui/button'
import { Icon } from '../icon'

const sides = ['top', 'right', 'bottom', 'left'] as const

function Specimens(props: { theme: 'light' | 'dark' }) {
  return (
    <section
      data-theme={props.theme}
      class="border border-border bg-background p-6 text-foreground sm:p-8"
    >
      <h2 class="mb-8 text-sm capitalize text-muted-foreground">{props.theme}</h2>
      <div class="space-y-10">
        <div class="space-y-3">
          <h3 class="text-sm text-muted-foreground">
            Icon controls: hover pauses, keyboard focus opens at once, neighbours skip the delay
          </h3>
          <TooltipProvider>
            <div class="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger as={Button} variant="outline" size="icon-sm" aria-label="Bold">
                  <Icon icon={Bold} />
                </TooltipTrigger>
                <TooltipContent data-theme={props.theme}>Bold</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger as={Button} variant="outline" size="icon-sm" aria-label="Italic">
                  <Icon icon={Italic} />
                </TooltipTrigger>
                <TooltipContent data-theme={props.theme}>Italic</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger as={Button} variant="outline" size="icon-sm" aria-label="Underline">
                  <Icon icon={Underline} />
                </TooltipTrigger>
                <TooltipContent data-theme={props.theme}>Underline</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </div>

        <div class="space-y-3">
          <h3 class="text-sm text-muted-foreground">Sides</h3>
          <div class="flex flex-wrap items-center gap-6">
            {sides.map((side) => (
              <Tooltip>
                <TooltipTrigger as={Button} variant="outline" class="capitalize">
                  {side}
                </TooltipTrigger>
                <TooltipContent side={side} data-theme={props.theme}>
                  Opens on the {side}
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>

        <div class="space-y-3">
          <h3 class="text-sm text-muted-foreground">Longer copy wraps at 20rem</h3>
          <Tooltip openDelay={0}>
            <TooltipTrigger as={Button}>Save changes</TooltipTrigger>
            <TooltipContent data-theme={props.theme}>
              Writes the draft to disk and republishes the page. Undo is available for five minutes
              afterwards.
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    </section>
  )
}

export default function TooltipPreview() {
  return (
    <div class="space-y-8">
      <Specimens theme="light" />
      <Specimens theme="dark" />
    </div>
  )
}
