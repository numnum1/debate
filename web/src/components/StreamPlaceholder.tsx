import { Maximize2Icon, Minimize2Icon, PlayIcon } from 'lucide-react'
import { useState } from 'react'

import { LiveDot } from '@/components/StatusBadge'
import { formatCount, platformLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Debate } from '@/mock/data'

/**
 * Platzhalter für das Stream-Embed (Twitch/YouTube/X), bis echte Embeds eingebaut sind.
 * Mit `expandable` ist er klein und lässt sich über den Button unten rechts auf die volle Breite vergrößern.
 */
export function StreamPlaceholder({
  debate,
  className,
  expandable = false,
}: {
  debate: Debate
  className?: string
  expandable?: boolean
}) {
  const [expanded, setExpanded] = useState(false)
  const small = expandable && !expanded

  return (
    <div
      className={cn(
        'group relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-neutral-200 text-neutral-500',
        small && 'w-80 shrink-0',
        className,
      )}
      data-testid="stream-placeholder"
    >
      {expandable && (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
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
