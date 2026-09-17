import { Bold, Italic, Underline, type IconNode } from 'lucide'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipViewport,
  createTooltipHandle,
} from '../ui/tooltip'
import { Button } from '../ui/button'
import { Icon } from '../ui/icon'

const sides = ['top', 'right', 'bottom', 'left'] as const

const tools: { label: string; icon: IconNode }[] = [
  { label: 'Bold', icon: Bold },
  { label: 'Italic', icon: Italic },
  { label: 'Underline', icon: Underline },
]

/**
 * One tooltip root for the whole row. Moving between icons keeps it open, so the
 * label glides to the next control and its text cross-fades instead of reopening.
 */
function IconRow(props: { theme: 'light' | 'dark' }) {
  const hints = createTooltipHandle<string>()
  return (
    <div class="flex items-center gap-2">
      {tools.map((tool) => (
        <TooltipTrigger
          as={Button}
          variant="outline"
          size="icon-sm"
          aria-label={tool.label}
          handle={hints}
          payload={tool.label}
        >
          <Icon icon={tool.icon} />
        </TooltipTrigger>
      ))}
      <Tooltip handle={hints}>
        {(state) => (
          <TooltipContent data-theme={props.theme}>
            <TooltipViewport>{state.payload}</TooltipViewport>
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  )
}

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
            Icon controls share one tooltip: hover pauses once, then the label glides between them
          </h3>
          <IconRow theme={props.theme} />
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
