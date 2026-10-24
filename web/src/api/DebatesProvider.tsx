import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react'

import { fetchDebates } from '@/api/debates'
import { DebatesContext } from '@/api/debates-context'
import { debates as mockDebates } from '@/mock/data'

/** Lädt die Debatten einmal aus dem Backend; ohne Backend bleibt die Mock-Liste, damit die Seiten benutzbar bleiben. */
export function DebatesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState({ debates: mockDebates, loading: true })

  const reload = useCallback(async () => {
    try {
      setState({ debates: await fetchDebates(), loading: false })
    } catch {
      setState((current) => ({ ...current, loading: false }))
    }
  }, [])

  useEffect(() => {
    // Der Lade-Zustand wird erst gesetzt, wenn das Backend geantwortet hat
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [reload])

  const value = useMemo(() => ({ ...state, reload }), [state, reload])
  return <DebatesContext value={value}>{children}</DebatesContext>
}
