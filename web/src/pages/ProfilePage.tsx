import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'
import { Link } from 'react-router'

import { signIn } from '@/auth'
import { Button } from '@/components/ui/button'

type Me = {
  id: string
  username: string
  displayName: string | null
  email: string | null
  roles: string[]
}

/** Profildaten aus dem Backend (GET /api/me), zugleich Prüfung, dass Login und Backend zusammenspielen. */
export function ProfilePage() {
  const auth = useAuth()
  const [me, setMe] = useState<Me | null>(null)
  const [error, setError] = useState<string | null>(null)

  const token = auth.user?.access_token

  useEffect(() => {
    if (!token) return
    fetch('/api/me', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error(`Backend antwortet mit ${res.status}`)
        return res.json() as Promise<Me>
      })
      .then(setMe)
      .catch((e: Error) => setError(e.message))
  }, [token])

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 py-8">
      <Link to="/" className="text-sm text-muted-foreground hover:underline">
        ← Zurück
      </Link>
      <h1 className="text-2xl font-semibold">Profil</h1>
      {auth.isLoading && <p>Lade …</p>}
      {auth.error && <p className="text-destructive">Login-Fehler: {auth.error.message}</p>}
      {!auth.isLoading && !auth.isAuthenticated && (
        <Button className="w-fit" onClick={() => void signIn(auth)}>
          Anmelden
        </Button>
      )}
      {me && (
        <dl className="grid grid-cols-[8rem_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="font-medium">Nutzer</dt>
          <dd>{me.displayName ?? me.username}</dd>
          <dt className="font-medium">Keycloak-ID</dt>
          <dd>
            <code>{me.id}</code>
          </dd>
          <dt className="font-medium">Rollen</dt>
          <dd>{me.roles.length ? me.roles.join(', ') : '–'}</dd>
        </dl>
      )}
      {error && <p className="text-destructive">{error}</p>}
    </main>
  )
}
