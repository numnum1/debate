import { CompassIcon } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { Link, useNavigate, useParams } from 'react-router'

import { StatusBadge } from '@/components/StatusBadge'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { roleLabel } from '@/lib/format'
import { useMyRoles } from '@/api/debates'
import { useDebates } from '@/api/debates-context'
import { memberships, type Membership } from '@/mock/data'
import { DebatePane } from './DebatePane'
import { HomeSidebar, type SidebarEntry } from './HomeSidebar'
import { NewDebateWizard } from './NewDebateWizard'

/** Pfad zum Assistenten; eine Debatte kann nicht so heißen, siehe Debates.RESERVED_IDS im Backend */
const NEW_DEBATE = 'neu'

export function HomePage() {
  const auth = useAuth()
  const { debateId } = useParams()
  const navigate = useNavigate()
  const creating = debateId === NEW_DEBATE
  const { debates, loading: debatesLoading, reload: reloadDebates } = useDebates()
  const [pins, setPins] = useState(() => new Set(memberships.filter((m) => m.pinned).map((m) => m.debateId)))
  const [openedAt] = useState(() => new Date())

  const { roles: myRoles, reload: reloadRoles } = useMyRoles(auth.user?.access_token)
  // Solange Login oder Rollen laden, ist die Ansicht noch unklar (Juror-Raum oder Zuschauer mit Chat)
  const rolesLoading = auth.isLoading || (auth.isAuthenticated && myRoles === null)

  // Die Rollen kommen aus dem Backend; Aktivität, Anheften und Hinweise sind vorerst noch Mock-Daten
  const ids = new Set([...memberships.map((m) => m.debateId), ...(myRoles?.keys() ?? [])])
  const mine: Membership[] = [...ids].map((id) => {
    const mock = memberships.find((m) => m.debateId === id)
    const role = myRoles?.get(id) ?? 'viewer'
    return {
      debateId: id,
      role,
      lastActivity: mock?.lastActivity ?? openedAt,
      pinned: mock?.pinned,
      unread: mock?.unread,
      // Hinweise wie „Urteil abgeben“ passen nur zur Rolle, für die sie geschrieben sind
      attention: mock?.role === role ? mock.attention : undefined,
    }
  })

  const debate = creating ? undefined : debates.find((d) => d.id === debateId)
  const membership = mine.find((m) => m.debateId === debateId)

  // Annahme fürs Wireframe: Wer eine Debatte öffnet, hat sie danach in der Leiste, wie einen neuen Chat
  const opened = debate && !membership ? [{ debateId: debate.id, role: 'viewer' as const, lastActivity: openedAt }] : []
  const entries: SidebarEntry[] = auth.isAuthenticated
    ? [...mine, ...opened].flatMap((m) => {
        const entryDebate = debates.find((d) => d.id === m.debateId)
        return entryDebate ? [{ ...m, pinned: pins.has(m.debateId), debate: entryDebate }] : []
      })
    : []

  const togglePin = (id: string) =>
    setPins((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const role = (auth.isAuthenticated && membership?.role) || 'viewer'

  return (
    <SidebarProvider style={{ '--sidebar-width': '20rem' } as React.CSSProperties}>
      <HomeSidebar entries={entries} activeId={debateId} onTogglePin={togglePin} />
      <SidebarInset className="h-svh">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b px-4" data-testid="home-header">
          <SidebarTrigger />
          <Separator orientation="vertical" className="h-5" />
          {debate ? (
            <>
              <h1 className="truncate font-semibold" data-testid="home-debate-title">{debate.topic}</h1>
              <StatusBadge status={debate.status} />
              {role !== 'viewer' && (
                <Badge variant="secondary" data-testid="home-role-badge">
                  {roleLabel[role]}
                </Badge>
              )}
              {auth.isAuthenticated && membership?.attention && (
                <span className="flex shrink-0 items-center gap-1.5 text-sm text-amber-700" data-testid="home-attention">
                  <span className="size-2 rounded-full bg-amber-500" />
                  {membership.attention}
                </span>
              )}
              <span className="ml-auto shrink-0 text-sm text-muted-foreground">
                {debate.sideA} vs. {debate.sideB}
              </span>
            </>
          ) : (
            <h1 className="font-semibold" data-testid="home-page-title">{creating ? 'Neue Debatte' : 'Meine Debatten'}</h1>
          )}
        </header>
        <div className="min-h-0 flex-1 overflow-auto p-4">
          {debate && rolesLoading ? (
            // Erst die Rolle kennen, sonst blitzt z. B. für Juroren kurz die Zuschauer-Ansicht mit Chat auf
            <p className="text-sm text-muted-foreground" data-testid="home-roles-loading">
              Lade …
            </p>
          ) : creating ? (
            <NewDebateWizard
              onCreated={async (created) => {
                // Erst Debatten und Rollen neu laden, sonst sähe der neue Host seine Debatte kurz als Zuschauer
                await Promise.all([reloadDebates(), reloadRoles()])
                void navigate(`/home/${created.id}`)
              }}
            />
          ) : debate ? (
            <DebatePane debate={debate} role={role} signedIn={auth.isAuthenticated} />
          ) : debateId && debatesLoading ? (
            <p className="text-sm text-muted-foreground" data-testid="home-debate-loading">
              Lade …
            </p>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center" data-testid="home-empty-state">
              <p className="text-lg font-medium">{debateId ? 'Diese Debatte gibt es nicht.' : 'Wähle links eine Debatte.'}</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Hier erscheinen alle Debatten, an denen du teilnimmst, ob als Zuschauer, Juror oder Host.
              </p>
              <Button asChild variant="outline" data-testid="home-discover-link">
                <Link to="/">
                  <CompassIcon />
                  Debatten entdecken
                </Link>
              </Button>
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
