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
    <div className="fixed bottom-4 left-4 z-30 w-80 rounded-xl bg-background p-2 shadow-lg ring-1 ring-foreground/10" data-testid="floating-stream">
      <Button
        variant="secondary"
        size="icon-sm"
        className="absolute top-3 right-3 z-10 rounded-full"
        onClick={() => setClosed(true)}
        aria-label="Mini-Player schließen"
        data-testid="floating-stream-close"
      >
        <XIcon />
      </Button>
      {/* Der Player liegt außerhalb des Links, damit Klicks im Video den Player bedienen und nicht navigieren */}
      <StreamPlaceholder debate={debate} embed />
      <Link to={`/home/${debate.id}`} className="flex flex-col gap-2 px-1 pt-2 pb-1" data-testid="floating-stream-link">
        <span className="line-clamp-1 text-sm font-medium hover:underline">{debate.topic}</span>
        <MarketBar a={debate.marketA} size="sm" />
      </Link>
    </div>
  )
}
