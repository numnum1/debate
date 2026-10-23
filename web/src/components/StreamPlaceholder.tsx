import { Maximize2Icon, Minimize2Icon, PlayIcon } from 'lucide-react'

import { LiveDot } from '@/components/StatusBadge'
import { formatCount, platformLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Debate } from '@/mock/data'

/**
 * Platzhalter für das Stream-Embed (Twitch/YouTube/X), bis echte Embeds eingebaut sind.
 * Mit `onToggleExpanded` zeigt er beim Hover einen Button unten rechts; die Größe steuert der Aufrufer über `expanded`.
 */
export function StreamPlaceholder({
  debate,
  className,
  expanded = false,
  onToggleExpanded,
}: {
  debate: Debate
  className?: string
  expanded?: boolean
  onToggleExpanded?: () => void
}) {
  return (
    <div
      className={cn(
        'group relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-neutral-200 text-neutral-500',
        className,
      )}
      data-testid="stream-placeholder"
    >
      {onToggleExpanded && (
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-label={expanded ? 'Verkleinern' : 'Vergrößern'}
          className="absolute right-2 bottom-2 rounded bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 focus-visible:opacity-100"
          data-testid="stream-expand-button"
        >
          {expanded ? <Minimize2Icon className="size-4" /> : <Maximize2Icon className="size-4" />}
        </button>
      )}
      <PlayIcon className="size-8" />
      <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
        {platformLabel[debate.platform]}
      </span>
      {debate.status === 'live' && (
        <span className="absolute top-2 left-2 flex items-center gap-1.5 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
          <LiveDot />
          {debate.viewers !== undefined ? `${formatCount(debate.viewers)} Zuschauer` : 'Live'}
        </span>
      )}
    </div>
  )
}
