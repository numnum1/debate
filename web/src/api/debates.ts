import { useEffect, useState } from 'react'

import { api } from '@/api/client'
import type { DebateRole } from '@/mock/data'

type ApiRole = 'HOST' | 'JUROR' | 'MODERATOR' | 'RESOLVER'

type MyRoles = { debateId: string; roles: ApiRole[] }

// Bei mehreren Rollen zeigt die Home-Seite die strengste: Juroren bekommen immer den Juror-Raum
const priority: ApiRole[] = ['JUROR', 'HOST', 'MODERATOR', 'RESOLVER']

/**
 * Rollen des angemeldeten Nutzers je Debatte aus dem Backend (GET /api/me/debates).
 * `null`, solange nichts geladen ist oder niemand angemeldet ist.
 */
export function useMyRoles(token: string | undefined) {
  const [loaded, setLoaded] = useState<{ token: string; roles: Map<string, DebateRole> } | null>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false
    api<MyRoles[]>('/api/me/debates', { token })
      .then((list) => {
        if (cancelled) return
        const roles = new Map<string, DebateRole>()
        for (const { debateId, roles: assigned } of list) {
          const role = priority.find((r) => assigned.includes(r))
          if (role) roles.set(debateId, role.toLowerCase() as DebateRole)
        }
        setLoaded({ token, roles })
      })
      .catch(() => {
        // Ohne Backend bleibt die Seite benutzbar, dann eben ohne vergebene Rollen
        if (!cancelled) setLoaded({ token, roles: new Map() })
      })
    return () => {
      cancelled = true
    }
  }, [token])

  // Ein erneuertes Token lädt neu, die alten Rollen gelten bis dahin weiter
  return token && loaded ? loaded.roles : null
}
