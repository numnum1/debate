import { Maximize2Icon, Minimize2Icon, PlayIcon } from 'lucide-react'

import { LiveDot } from '@/components/StatusBadge'
import { formatCount, platformLabel } from '@/lib/format'
import { cn } from '@/lib/utils'
import type { Debate } from '@/mock/data'

/** Stumm, damit der Browser das Autoplay erlaubt; den Ton schaltet man im Player ein. */
const youtubeEmbedUrl = (id: string) => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&rel=0`

/**
 * Stream einer Debatte. Mit `embed` und einer YouTube-ID läuft der echte Player, sonst steht hier ein Platzhalter
 * (Twitch und X sind noch nicht eingebaut).
 * Mit `onToggleExpanded` zeigt er beim Hover einen Button zum Vergrößern; die Größe steuert der Aufrufer über `expanded`.
 */
export function StreamPlaceholder({
  debate,
  className,
  embed = false,
  expanded = false,
  onToggleExpanded,
}: {
  debate: Debate
  className?: string
  embed?: boolean
  expanded?: boolean
  onToggleExpanded?: () => void
}) {
  const youtubeId = embed && debate.platform === 'youtube' ? debate.youtubeId : undefined

  return (
    <div
      className={cn(
        'group relative flex aspect-video items-center justify-center overflow-hidden rounded-lg bg-neutral-200 text-neutral-500',
        youtubeId && 'bg-black',
        className,
      )}
      data-testid="stream-placeholder"
    >
      {youtubeId ? (
        <iframe
          src={youtubeEmbedUrl(youtubeId)}
          title={debate.topic}
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 size-full"
          data-testid="stream-youtube-embed"
        />
      ) : (
        <>
          <PlayIcon className="size-8" />
          <span className="absolute bottom-2 left-2 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
            {platformLabel[debate.platform]}
          </span>
        </>
      )}
      {onToggleExpanded && (
        <button
          type="button"
          onClick={onToggleExpanded}
          aria-label={expanded ? 'Verkleinern' : 'Vergrößern'}
          className={cn(
            'absolute right-2 rounded bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-black/80 focus-visible:opacity-100',
            // Unten rechts liegt im YouTube-Player der Vollbild-Button
            youtubeId ? 'top-2' : 'bottom-2',
          )}
          data-testid="stream-expand-button"
        >
          {expanded ? <Minimize2Icon className="size-4" /> : <Maximize2Icon className="size-4" />}
        </button>
      )}
      {debate.status === 'live' && (
        <span className="pointer-events-none absolute top-2 left-2 flex items-center gap-1.5 rounded bg-black/60 px-1.5 py-0.5 text-xs text-white">
          <LiveDot />
          {debate.viewers !== undefined ? `${formatCount(debate.viewers)} Zuschauer` : 'Live'}
        </span>
      )}
    </div>
  )
}
