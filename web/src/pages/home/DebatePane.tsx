import type { ReactNode } from 'react'

import { MarketBar } from '@/components/MarketBar'
import { StreamPlaceholder } from '@/components/StreamPlaceholder'
import { formatPoints } from '@/lib/format'
import type { Debate, DebateRole } from '@/mock/data'

/** Grauer Kasten für Bereiche, die noch nicht entworfen sind. */
function Slot({
  title,
  note,
  className = '',
  testId,
}: {
  title: string
  note?: ReactNode
  className?: string
  testId: string
}) {
  return (
    <div
      data-testid={testId}
      className={`flex flex-col gap-1 rounded-lg border border-dashed bg-muted/40 p-4 text-sm ${className}`}
    >
      <span className="font-medium">{title}</span>
      {note && <span className="text-muted-foreground">{note}</span>}
    </div>
  )
}

function ViewerPane({ debate, signedIn }: { debate: Debate; signedIn: boolean }) {
  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_22rem] gap-4" data-testid="viewer-pane">
      <div className="flex min-h-0 flex-col gap-4">
        <StreamPlaceholder debate={debate} />
        <div className="rounded-lg p-4 ring-1 ring-foreground/10">
          <MarketBar a={debate.marketA} sideA={debate.sideA} sideB={debate.sideB} verdict={debate.verdict} />
          <p className="mt-2 text-xs text-muted-foreground">{formatPoints(debate.volume)} im Markt</p>
        </div>
        <Slot
          testId="viewer-protocol"
          title="Protokoll"
          note="Live-Transkript nach Sprechern, wird später entworfen"
          className="flex-1"
        />
      </div>
      <div className="flex min-h-0 flex-col gap-4">
        <Slot
          testId="viewer-bet-panel"
          title="Wett-Panel"
          note={signedIn ? 'Punktestand, A oder B kaufen' : 'Zum Wetten anmelden'}
          className="h-48"
        />
        <Slot testId="viewer-chat" title="Chat" note="Öffentlicher Chat" className="flex-1" />
      </div>
    </div>
  )
}

function JurorPane() {
  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_22rem] gap-4" data-testid="juror-pane">
      <Slot testId="juror-protocol" title="Protokoll" note="Ohne Quoten und ohne Chat" className="h-full" />
      <div className="flex flex-col gap-4">
        <Slot testId="juror-criteria" title="Kriterien" note="Aus dem gesperrten Regelwerk" className="h-40" />
        <Slot testId="juror-verdict" title="Urteil" note="Slider A ↔ B, versiegelte Abgabe, Frist" className="flex-1" />
      </div>
    </div>
  )
}

function HostPane() {
  return (
    <div className="grid h-full grid-cols-2 gap-4" data-testid="host-pane">
      <div className="flex flex-col gap-4">
        <Slot
          testId="host-debate"
          title="Debatte"
          note="Thema, Regelwerk, Stream-URL"
          className="flex-1"
        />
        <Slot
          testId="host-roles"
          title="Rollen vergeben"
          note="Debattierer und Team, Jury, Moderatoren, Resolver"
          className="h-40"
        />
      </div>
      <div className="flex flex-col gap-4">
        <Slot
          testId="host-status-control"
          title="Status steuern"
          note="Wetten öffnen, live, Urteil, No-show/Walkout"
          className="h-48"
        />
        <Slot testId="host-preview" title="Vorschau" note="Was Zuschauer gerade sehen" className="flex-1" />
      </div>
    </div>
  )
}

function ModeratorPane({ debate }: { debate: Debate }) {
  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_22rem] gap-4" data-testid="moderator-pane">
      <div className="flex min-h-0 flex-col gap-4">
        <StreamPlaceholder debate={debate} />
        <Slot
          testId="moderator-chat"
          title="Chat moderieren"
          note="Öffentlicher Chat mit Aktionen: ausblenden, stummschalten"
          className="flex-1"
        />
      </div>
      <Slot testId="moderator-reports" title="Gemeldete Nachrichten" note="Warteschlange zum Prüfen" className="h-full" />
    </div>
  )
}

function ResolverPane() {
  return (
    <div className="grid h-full grid-cols-[minmax(0,1fr)_22rem] gap-4" data-testid="resolver-pane">
      <Slot testId="resolver-protocol" title="Protokoll" note="Mit den Stellen, die die KI markiert hat" className="h-full" />
      <Slot
        testId="resolver-cases"
        title="Grenzfälle"
        note="Point Bets bestätigen oder verwerfen (nach dem POC)"
        className="h-full"
      />
    </div>
  )
}

/** Inhalt der aktuellen Debatte auf der Home-Seite, je nach Rolle des Nutzers in dieser Debatte. */
export function DebatePane({ debate, role, signedIn }: { debate: Debate; role: DebateRole; signedIn: boolean }) {
  if (role === 'juror') return <JurorPane />
  if (role === 'host') return <HostPane />
  if (role === 'moderator') return <ModeratorPane debate={debate} />
  if (role === 'resolver') return <ResolverPane />
  return <ViewerPane debate={debate} signedIn={signedIn} />
}
