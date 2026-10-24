import { useCallback, useEffect, useState } from 'react'

import { api } from '@/api/client'
import { type Debate, type DebateRole, type DebateStatus, type Platform, type Ruleset, debates as mockDebates } from '@/mock/data'

type ApiRole = 'HOST' | 'JUROR' | 'MODERATOR' | 'RESOLVER'

type MyRoles = { debateId: string; roles: ApiRole[] }

// Bei mehreren Rollen zeigt die Home-Seite die strengste: Juroren bekommen immer den Juror-Raum
const priority: ApiRole[] = ['JUROR', 'HOST', 'MODERATOR', 'RESOLVER']

async function fetchMyRoles(token: string) {
  const list = await api<MyRoles[]>('/api/me/debates', { token })
  const roles = new Map<string, DebateRole>()
  for (const { debateId, roles: assigned } of list) {
    const role = priority.find((r) => assigned.includes(r))
    if (role) roles.set(debateId, role.toLowerCase() as DebateRole)
  }
  return roles
}

/**
 * Rollen des angemeldeten Nutzers je Debatte aus dem Backend (GET /api/me/debates).
 * `roles` ist `null`, solange nichts geladen ist oder niemand angemeldet ist; `reload` holt sie neu,
 * z. B. nachdem der Nutzer eine Debatte angelegt hat und damit Host geworden ist.
 */
export function useMyRoles(token: string | undefined) {
  const [loaded, setLoaded] = useState<{ token: string; roles: Map<string, DebateRole> } | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    // Ohne Backend bleibt die Seite benutzbar, dann eben ohne vergebene Rollen
    fetchMyRoles(token)
      .catch(() => new Map<string, DebateRole>())
      .then((roles) => {
        if (!cancelled) setLoaded({ token, roles })
      })
    return () => {
      cancelled = true
    }
  }, [token])

  const reload = useCallback(async () => {
    if (!token) return
    setLoaded({ token, roles: await fetchMyRoles(token) })
  }, [token])

  // Ein erneuertes Token lädt neu, die alten Rollen gelten bis dahin weiter
  return { roles: token && loaded ? loaded.roles : null, reload }
}

type ApiDebate = {
  id: string
  topic: string
  sideA: string
  sideB: string
  category: string
  platform: 'TWITCH' | 'YOUTUBE' | 'X'
  streamUrl?: string | null
  status: 'SCHEDULED' | 'BETTING' | 'LEAD_IN' | 'LIVE' | 'VERDICT' | 'SETTLED' | 'CANCELLED'
  startsAt: string
  bettingClosesAt: string
  ruleset: Ruleset
}

const statusFromApi: Record<ApiDebate['status'], DebateStatus> = {
  SCHEDULED: 'scheduled',
  BETTING: 'betting',
  LEAD_IN: 'leadin',
  LIVE: 'live',
  VERDICT: 'verdict',
  SETTLED: 'settled',
  CANCELLED: 'cancelled',
}

/** Video-ID aus einer YouTube-Adresse (`watch?v=`, `youtu.be/`, `/live/`), sonst `undefined`. */
export function youtubeIdFrom(streamUrl: string | null | undefined) {
  if (!streamUrl) return undefined
  try {
    const url = new URL(streamUrl)
    const host = url.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') return url.pathname.slice(1) || undefined
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      return url.searchParams.get('v') ?? url.pathname.match(/^\/(?:live|embed|shorts)\/([\w-]+)/)?.[1]
    }
  } catch {
    // keine gültige Adresse, dann gibt es kein Embed
  }
  return undefined
}

/**
 * Die Debatte aus dem Backend. Markt, Zuschauer und Promotion gibt es dort noch nicht; sie kommen aus den
 * Mock-Daten, sofern die ID dort vorkommt, sonst mit Vorgaben.
 */
export function debateFromApi(api: ApiDebate): Debate {
  const mock = mockDebates.find((d) => d.id === api.id)
  return {
    marketA: 50,
    volume: 0,
    ...mock,
    id: api.id,
    topic: api.topic,
    sideA: api.sideA,
    sideB: api.sideB,
    category: api.category,
    platform: api.platform.toLowerCase() as Platform,
    status: statusFromApi[api.status],
    startsAt: new Date(api.startsAt),
    bettingClosesAt: new Date(api.bettingClosesAt),
    streamUrl: api.streamUrl ?? undefined,
    ruleset: api.ruleset,
    youtubeId: mock?.youtubeId ?? youtubeIdFrom(api.streamUrl),
  }
}

export async function fetchDebates() {
  return (await api<ApiDebate[]>('/api/debates')).map(debateFromApi)
}

export type NewDebateRequest = {
  topic: string
  sideA: string
  sideB: string
  category: string
  platform: 'TWITCH' | 'YOUTUBE' | 'X'
  streamUrl: string
  startsAt: string
  bettingClosesAt: string
  ruleset: Ruleset
  roles: { userId: string; role: 'JUROR' | 'MODERATOR' | 'RESOLVER' }[]
}

export async function createDebate(request: NewDebateRequest, token: string) {
  return debateFromApi(await api<ApiDebate>('/api/debates', { token, method: 'POST', body: request }))
}

export type FoundUser = { id: string; username: string; displayName: string | null }

export function searchUsers(query: string, token: string) {
  return api<FoundUser[]>(`/api/users?q=${encodeURIComponent(query)}`, { token })
}
