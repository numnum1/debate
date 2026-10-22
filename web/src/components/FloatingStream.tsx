import { XIcon } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { MarketBar } from '@/components/MarketBar'
import { StreamPlaceholder } from '@/components/StreamPlaceholder'
import { Button } from '@/components/ui/button'
import type { Debate } from '@/mock/data'

/** Schwebender Mini-Player unten links mit dem Stream einer wichtigen Live-Debatte. */
export function FloatingStream({ debate }: { debate: Debate }) {
  const [closed, setClosed] = useState(false)
  if (closed) return null

  return (
    <div className="fixed bottom-4 left-4 z-30 w-80 rounded-xl bg-background p-2 shadow-lg ring-1 ring-foreground/10">
      <Button
        variant="secondary"
        size="icon-sm"
        className="absolute top-3 right-3 z-10 rounded-full"
        onClick={() => setClosed(true)}
        aria-label="Mini-Player schließen"
      >
        <XIcon />
      </Button>
      <Link to={`/home/${debate.id}`} className="block">
        <StreamPlaceholder debate={debate} />
        <div className="flex flex-col gap-2 px-1 pt-2 pb-1">
          <span className="line-clamp-1 text-sm font-medium">{debate.topic}</span>
          <MarketBar a={debate.marketA} size="sm" />
        </div>
      </Link>
    </div>
  )
}
