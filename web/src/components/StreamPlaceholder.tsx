import { PlayIcon } from 'lucide-react'

import { LiveDot } from '@/components/StatusBadge'
import { formatCount, platformLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Debate } from '@/mock/data'

/** Platzhalter für das Stream-Embed (Twitch/YouTube/X), bis echte Embeds eingebaut sind. */
export function StreamPlaceholder({ debate, className }: { debate: Debate; className?: string }) {
  return (
    <div
      className={cn(
        'relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-neutral-200 text-neutral-500',
        className,
      )}
      data-testid="stream-placeholder"
    >
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
