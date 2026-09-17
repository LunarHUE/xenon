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
function IconRow() {
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
          <TooltipContent>
            <TooltipViewport>{state.payload}</TooltipViewport>
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  )
}

export default function TooltipPreview() {
  return (
    <div class="space-y-10">
      <div class="space-y-3">
        <h3 class="text-sm text-muted-foreground">
          Icon controls share one tooltip: hover pauses once, then the label glides between them
        </h3>
        <IconRow />
      </div>

      <div class="space-y-3">
        <h3 class="text-sm text-muted-foreground">Sides</h3>
        <div class="flex flex-wrap items-center gap-6">
          {sides.map((side) => (
            <Tooltip>
              <TooltipTrigger as={Button} variant="outline" class="capitalize">
                {side}
              </TooltipTrigger>
              <TooltipContent side={side}>Opens on the {side}</TooltipContent>
            </Tooltip>
          ))}
        </div>
      </div>

      <div class="space-y-3">
        <h3 class="text-sm text-muted-foreground">Longer copy wraps at 20rem</h3>
        <Tooltip openDelay={0}>
          <TooltipTrigger as={Button}>Save changes</TooltipTrigger>
          <TooltipContent>
            Writes the draft to disk and republishes the page. Undo is available for five minutes
            afterwards.
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}
