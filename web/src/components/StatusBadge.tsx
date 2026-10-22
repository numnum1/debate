import { Badge } from '@/components/ui/badge'
import { statusLabel } from '@/lib/format'
import type { DebateStatus } from '@/mock/data'

export function LiveDot({ className = '' }: { className?: string }) {
  return (
    <span className={`relative inline-flex size-2 ${className}`}>
      <span className="absolute inline-flex size-full animate-ping rounded-full bg-live opacity-60" />
      <span className="relative inline-flex size-2 rounded-full bg-live" />
    </span>
  )
}

export function StatusBadge({ status }: { status: DebateStatus }) {
  if (status === 'live') {
    return (
      <Badge variant="outline" className="gap-1.5 border-live/40 text-live">
        <LiveDot />
        {statusLabel.live}
      </Badge>
    )
  }
  return (
    <Badge variant={status === 'betting' ? 'secondary' : 'outline'} className="text-muted-foreground">
      {statusLabel[status]}
    </Badge>
  )
}
