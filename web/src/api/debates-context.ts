import { createContext, useContext } from 'react'

import type { Debate } from '@/mock/data'

export type DebatesState = {
  debates: Debate[]
  /** Solange das Backend noch nicht geantwortet hat, gelten die Mock-Daten */
  loading: boolean
  /** Lädt die Liste neu, z. B. nach dem Anlegen einer Debatte */
  reload: () => Promise<void>
}

export const DebatesContext = createContext<DebatesState | null>(null)

export function useDebates() {
  const state = useContext(DebatesContext)
  if (!state) throw new Error('useDebates braucht den DebatesProvider')
  return state
}
