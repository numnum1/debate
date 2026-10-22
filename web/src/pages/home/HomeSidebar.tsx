import {
  BanIcon,
  CheckIcon,
  ChevronRightIcon,
  ClockIcon,
  CompassIcon,
  GavelIcon,
  LogOutIcon,
  MoreHorizontalIcon,
  PinIcon,
  PinOffIcon,
  UserIcon,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { Link } from 'react-router'

import { LiveDot } from '@/components/StatusBadge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'
import { displayName, register, signIn } from '@/auth'
import { formatAgo, formatPoints, initials, roleLabel, statusLabel } from '@/lib/format'
import { type Debate, type DebateStatus, type Membership, balance } from '@/mock/data'

export type SidebarEntry = Membership & { debate: Debate }

type Props = {
  entries: SidebarEntry[]
  activeId?: string
  onTogglePin: (debateId: string) => void
}

const groups: { label: string; statuses: DebateStatus[] }[] = [
  { label: 'Laufend', statuses: ['live', 'verdict'] },
  { label: 'Demnächst', statuses: ['scheduled', 'betting'] },
  { label: 'Beendet', statuses: ['settled', 'cancelled'] },
]

function StatusIcon({ status }: { status: DebateStatus }) {
  switch (status) {
    case 'live':
      return <LiveDot className="mx-1" />
    case 'verdict':
      return <GavelIcon className="text-muted-foreground" />
    case 'scheduled':
    case 'betting':
      return <ClockIcon className="text-muted-foreground" />
    case 'settled':
      return <CheckIcon className="text-muted-foreground" />
    case 'cancelled':
      return <BanIcon className="text-muted-foreground" />
  }
}

function EntryRow({ entry, active, onTogglePin }: { entry: SidebarEntry; active: boolean; onTogglePin: () => void }) {
  const { debate } = entry
  const hint = [statusLabel[debate.status], roleLabel[entry.role], entry.attention].filter(Boolean).join(' · ')

  return (
    <SidebarMenuItem>
      <SidebarMenuButton asChild isActive={active} title={hint} data-testid={`sidebar-entry-${debate.id}`}>
        <Link to={`/home/${debate.id}`}>
          <StatusIcon status={debate.status} />
          <span className="flex-1 truncate">{debate.topic}</span>
          {entry.role !== 'viewer' && (
            <span className="shrink-0 rounded bg-sidebar-accent px-1 text-[10px] font-medium text-muted-foreground uppercase group-hover/menu-item:hidden">
              {roleLabel[entry.role]}
            </span>
          )}
          {entry.attention ? (
            <span className="size-2 shrink-0 rounded-full bg-amber-500 group-hover/menu-item:hidden" />
          ) : entry.unread ? (
            <span className="size-2 shrink-0 rounded-full bg-side-a group-hover/menu-item:hidden" />
          ) : (
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums group-hover/menu-item:hidden">
              {formatAgo(entry.lastActivity)}
            </span>
          )}
        </Link>
      </SidebarMenuButton>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover data-testid={`sidebar-entry-menu-${debate.id}`}>
            <MoreHorizontalIcon />
            <span className="sr-only">Mehr</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem onSelect={onTogglePin} data-testid={`sidebar-entry-pin-${debate.id}`}>
            {entry.pinned ? <PinOffIcon /> : <PinIcon />}
            {entry.pinned ? 'Lösen' : 'Anpinnen'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  )
}

function EntryGroup({
  label,
  entries,
  activeId,
  onTogglePin,
}: { label: string; entries: SidebarEntry[] } & Omit<Props, 'entries'>) {
  if (entries.length === 0) return null
  return (
    <Collapsible defaultOpen className="group/collapsible">
      <SidebarGroup className="py-1">
        <SidebarGroupLabel asChild>
          <CollapsibleTrigger className="w-full hover:bg-sidebar-accent">
            {label}
            <ChevronRightIcon className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
          </CollapsibleTrigger>
        </SidebarGroupLabel>
        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {entries.map((e) => (
                <EntryRow
                  key={e.debateId}
                  entry={e}
                  active={e.debateId === activeId}
                  onTogglePin={() => onTogglePin(e.debateId)}
                />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  )
}

function UserFooter() {
  const auth = useAuth()

  if (!auth.isAuthenticated) {
    return (
      <div className="flex flex-col gap-2 rounded-lg bg-sidebar-accent p-3 text-sm" data-testid="sidebar-sign-in-prompt">
        <span>Melde dich an, um deine Debatten hier zu sehen.</span>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => void signIn(auth)} data-testid="sidebar-sign-in-button">
            Anmelden
          </Button>
          <Button size="sm" variant="outline" onClick={() => void register(auth)} data-testid="sidebar-register-button">
            Registrieren
          </Button>
        </div>
      </div>
    )
  }

  const name = displayName(auth)
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton size="lg" data-testid="sidebar-user-menu-trigger">
              <Avatar className="size-8">
                <AvatarFallback>{initials(name)}</AvatarFallback>
              </Avatar>
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-medium">{name}</span>
                <span className="text-xs text-muted-foreground tabular-nums">{formatPoints(balance)}</span>
              </span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width)">
            <DropdownMenuItem asChild>
              <Link to="/profil" data-testid="sidebar-user-menu-profile">
                <UserIcon />
                Profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => void auth.signoutRedirect()} data-testid="sidebar-user-menu-sign-out">
              <LogOutIcon />
              Abmelden
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

/** Seitenleiste der Home-Seite: Debatten, an denen man teilnimmt, wie Sitzungen in Claude Code. */
export function HomeSidebar({ entries, activeId, onTogglePin }: Props) {
  const auth = useAuth()
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const filtered = entries
    .filter((e) => !q || e.debate.topic.toLowerCase().includes(q))
    .sort((x, y) => y.lastActivity.getTime() - x.lastActivity.getTime())
  const pinned = filtered.filter((e) => e.pinned)
  const rest = filtered.filter((e) => !e.pinned)

  return (
    <Sidebar data-testid="home-sidebar">
      <SidebarHeader className="gap-1">
        <Link to="/" className="px-2 py-1.5 text-lg font-semibold tracking-tight">
          Debate
        </Link>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild data-testid="sidebar-discover-link">
              <Link to="/">
                <CompassIcon />
                <span>Debatten entdecken</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        {auth.isAuthenticated && (
          <SidebarInput placeholder="Meine Debatten filtern" data-testid="sidebar-filter-input" value={query} onChange={(e) => setQuery(e.target.value)} />
        )}
      </SidebarHeader>

      <SidebarContent>
        <EntryGroup label="Angepinnt" entries={pinned} activeId={activeId} onTogglePin={onTogglePin} />
        {groups.map((g) => (
          <EntryGroup
            key={g.label}
            label={g.label}
            entries={rest.filter((e) => g.statuses.includes(e.debate.status))}
            activeId={activeId}
            onTogglePin={onTogglePin}
          />
        ))}
        {auth.isAuthenticated && filtered.length === 0 && (
          <p className="px-4 py-2 text-sm text-muted-foreground" data-testid="sidebar-empty-state">Keine Debatten gefunden.</p>
        )}
      </SidebarContent>

      <SidebarFooter>
        <UserFooter />
      </SidebarFooter>
    </Sidebar>
  )
}
