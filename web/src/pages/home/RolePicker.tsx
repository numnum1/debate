import { SearchIcon, XIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { type FoundUser, searchUsers } from '@/api/debates'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const MIN_QUERY_LENGTH = 2

const name = (user: FoundUser) => user.displayName || user.username

type Props = {
  role: string
  label: string
  hint?: string
  selected: FoundUser[]
  /** Höchstzahl der Personen in dieser Rolle; ohne Angabe unbegrenzt */
  max?: number
  /** Nutzer, die nicht gewählt werden dürfen, z. B. der Host selbst */
  excludeId?: string
  onChange: (users: FoundUser[]) => void
}

/** Sucht angemeldete Nutzer per Name und sammelt die gewählten als Chips. */
export function RolePicker({ role, label, hint, selected, max, excludeId, onChange }: Props) {
  const auth = useAuth()
  const token = auth.user?.access_token
  const [query, setQuery] = useState('')
  const [found, setFound] = useState<{ query: string; users: FoundUser[] } | null>(null)

  const term = query.trim()
  useEffect(() => {
    if (!token || term.length < MIN_QUERY_LENGTH) return
    let cancelled = false
    // Erst nach einer kurzen Pause suchen, nicht bei jedem Tastendruck
    const timer = setTimeout(() => {
      searchUsers(term, token)
        .then((users) => !cancelled && setFound({ query: term, users }))
        .catch(() => !cancelled && setFound({ query: term, users: [] }))
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [term, token])

  const full = max !== undefined && selected.length >= max
  const searched = found?.query === term && term.length >= MIN_QUERY_LENGTH
  const results = searched
    ? found.users.filter((user) => user.id !== excludeId && !selected.some((s) => s.id === user.id))
    : []

  const add = (user: FoundUser) => {
    onChange([...selected, user])
    setQuery('')
  }

  return (
    <div className="flex flex-col gap-2" data-testid={`role-picker-${role}`}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={`role-picker-${role}-input`}>{label}</Label>
        {max !== undefined && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {selected.length} von {max}
          </span>
        )}
      </div>
      {selected.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {selected.map((user) => (
            <li key={user.id}>
              <Badge variant="secondary" className="gap-1 pr-1" data-testid={`role-picker-${role}-chip-${user.username}`}>
                {name(user)}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  aria-label={`${name(user)} entfernen`}
                  onClick={() => onChange(selected.filter((s) => s.id !== user.id))}
                  data-testid={`role-picker-${role}-remove-${user.username}`}
                >
                  <XIcon />
                </Button>
              </Badge>
            </li>
          ))}
        </ul>
      )}
      {!full && (
        <div className="relative">
          <SearchIcon className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id={`role-picker-${role}-input`}
            className="pl-8"
            placeholder="Nutzername oder Name suchen"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            data-testid={`role-picker-${role}-input`}
          />
        </div>
      )}
      {!full && results.length > 0 && (
        <ul className="divide-y rounded-lg ring-1 ring-foreground/10" data-testid={`role-picker-${role}-results`}>
          {results.map((user) => (
            <li key={user.id}>
              <button
                type="button"
                className="flex w-full items-baseline gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50"
                onClick={() => add(user)}
                data-testid={`role-picker-${role}-result-${user.username}`}
              >
                <span className="font-medium">{name(user)}</span>
                <span className="text-xs text-muted-foreground">@{user.username}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {!full && searched && results.length === 0 && (
        <p className="text-xs text-muted-foreground" data-testid={`role-picker-${role}-empty`}>
          Niemand gefunden. Gefunden werden nur Nutzer, die sich schon einmal angemeldet haben.
        </p>
      )}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
