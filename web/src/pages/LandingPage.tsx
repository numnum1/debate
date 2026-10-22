import { SearchIcon } from 'lucide-react'
import { type Ref, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'

import { AccountControls } from '@/components/AccountControls'
import { FloatingStream } from '@/components/FloatingStream'
import { MarketBar } from '@/components/MarketBar'
import { StatusBadge } from '@/components/StatusBadge'
import { StreamPlaceholder } from '@/components/StreamPlaceholder'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCount, formatPoints, formatRelative, formatStart, platformLabel } from '@/lib/format'
import { type Debate, type DebateStatus, debates } from '@/mock/data'

const debateLink = (d: Debate) => `/home/${d.id}`

const promoted = debates
  .filter((d) => d.promoted !== undefined)
  .sort((x, y) => x.promoted! - y.promoted!)
const live = debates
  .filter((d) => d.status === 'live' && d.promoted === undefined)
  .sort((x, y) => (y.viewers ?? 0) - (x.viewers ?? 0))
const others = debates.filter((d) => d.promoted === undefined)

function When({ debate }: { debate: Debate }) {
  if (debate.status === 'live') return <>seit {formatRelative(debate.startsAt).replace('vor ', '')}</>
  if (debate.status === 'scheduled' || debate.status === 'betting') return <>{formatStart(debate.startsAt)}</>
  return <>{formatRelative(debate.startsAt)}</>
}

function FeaturedCard({ debate, ref }: { debate: Debate; ref?: Ref<HTMLDivElement> }) {
  return (
    <Card ref={ref} className="grid h-full grid-cols-[3fr_2fr] gap-0 py-0">
      <Link to={debateLink(debate)} className="block self-center p-4 pr-0">
        <StreamPlaceholder debate={debate} />
      </Link>
      <CardContent className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <StatusBadge status={debate.status} />
          <span>{debate.category}</span>
          <span>·</span>
          <When debate={debate} />
        </div>
        <Link to={debateLink(debate)} className="text-xl leading-snug font-semibold hover:underline">
          {debate.topic}
        </Link>
        <MarketBar a={debate.marketA} sideA={debate.sideA} sideB={debate.sideB} />
        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-sm text-muted-foreground">{formatPoints(debate.volume)} im Markt</span>
          <Button asChild>
            <Link to={debateLink(debate)}>Zur Debatte</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function PromotedCard({ debate }: { debate: Debate }) {
  return (
    <Card className="gap-3">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <StatusBadge status={debate.status} />
          <span>{debate.category}</span>
          <span>·</span>
          <When debate={debate} />
        </div>
        <Link to={debateLink(debate)} className="text-base leading-snug font-semibold hover:underline">
          {debate.topic}
        </Link>
        <MarketBar a={debate.marketA} sideA={debate.sideA} sideB={debate.sideB} />
        <span className="text-xs text-muted-foreground">
          {debate.volume > 0 ? `${formatPoints(debate.volume)} im Markt` : 'Wetten öffnen bald'}
        </span>
      </CardContent>
    </Card>
  )
}

function LiveCard({ debate }: { debate: Debate }) {
  return (
    <Link to={debateLink(debate)} className="group flex flex-col gap-2">
      <StreamPlaceholder debate={debate} />
      <span className="line-clamp-2 text-sm leading-snug font-medium group-hover:underline">{debate.topic}</span>
      <MarketBar a={debate.marketA} size="sm" />
      <span className="text-xs text-muted-foreground">
        {debate.sideA} vs. {debate.sideB}
      </span>
    </Link>
  )
}

type Filter = 'all' | 'open' | 'live' | 'done'

const filterMatches: Record<Filter, (s: DebateStatus) => boolean> = {
  all: () => true,
  open: (s) => s === 'scheduled' || s === 'betting',
  live: (s) => s === 'live' || s === 'verdict',
  done: (s) => s === 'settled' || s === 'cancelled',
}

function DebateList() {
  const [filter, setFilter] = useState<Filter>('all')
  const shown = others.filter((d) => filterMatches[filter](d.status))

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Weitere Debatten</h2>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as Filter)}>
          <TabsList>
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="open">Demnächst</TabsTrigger>
            <TabsTrigger value="live">Laufend</TabsTrigger>
            <TabsTrigger value="done">Beendet</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <ul className="divide-y rounded-xl ring-1 ring-foreground/10">
        {shown.map((d) => (
          <li key={d.id}>
            <Link
              to={debateLink(d)}
              className="grid grid-cols-[7rem_minmax(0,1fr)_10rem_8rem_7rem] items-center gap-4 px-4 py-3 hover:bg-muted/50"
            >
              <span>
                <StatusBadge status={d.status} />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-medium">{d.topic}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {d.sideA} vs. {d.sideB} · {d.category} · {platformLabel[d.platform]}
                </span>
              </span>
              <MarketBar a={d.marketA} verdict={d.verdict} size="sm" />
              <span className="text-right text-sm text-muted-foreground tabular-nums">
                {d.volume > 0 ? formatPoints(d.volume) : '–'}
              </span>
              <span className="text-right text-xs text-muted-foreground">
                <When debate={d} />
              </span>
            </Link>
          </li>
        ))}
        {shown.length === 0 && <li className="px-4 py-6 text-sm text-muted-foreground">Keine Debatten in dieser Auswahl.</li>}
      </ul>
    </section>
  )
}

export function LandingPage() {
  const [featured, ...morePromoted] = promoted
  const floating = promoted.find((d) => d.status === 'live')

  // Der Mini-Player erscheint erst, wenn die große Karte aus dem Bild gescrollt ist (wie Bild-im-Bild)
  const featuredRef = useRef<HTMLDivElement>(null)
  const [featuredVisible, setFeaturedVisible] = useState(true)
  useEffect(() => {
    const el = featuredRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setFeaturedVisible(entry.isIntersecting), {
      threshold: 0.3,
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-6">
          <Link to="/" className="text-lg font-semibold tracking-tight">
            Debate
          </Link>
          <div className="relative max-w-sm flex-1">
            <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Debatten, Themen, Personen suchen" className="pl-8" />
          </div>
          <div className="ml-auto">
            <AccountControls />
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-8 pb-40">
        <section className="grid grid-cols-3 gap-4">
          <div className="col-span-2">{featured && <FeaturedCard debate={featured} ref={featuredRef} />}</div>
          <div className="flex flex-col gap-4">
            {morePromoted.map((d) => (
              <PromotedCard key={d.id} debate={d} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 text-lg font-semibold">Jetzt live</h2>
          <div className="grid grid-cols-4 gap-4">
            {live.map((d) => (
              <LiveCard key={d.id} debate={d} />
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            {formatCount(live.reduce((sum, d) => sum + (d.viewers ?? 0), 0))} Zuschauer in {live.length} weiteren Live-Debatten
          </p>
        </section>

        <DebateList />
      </main>

      {floating && !featuredVisible && <FloatingStream debate={floating} />}
    </div>
  )
}
