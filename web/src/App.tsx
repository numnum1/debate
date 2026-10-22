import { useEffect, useState } from 'react'
import { useAuth } from 'react-oidc-context'

type Me = {
  id: string
  username: string
  displayName: string | null
  email: string | null
  roles: string[]
}

function App() {
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

  if (auth.isLoading) return <main>Lade …</main>
  if (auth.error) return <main>Login-Fehler: {auth.error.message}</main>

  return (
    <main>
      <h1>Debate</h1>
      {auth.isAuthenticated ? (
        <>
          {me && (
            <dl>
              <dt>Nutzer</dt>
              <dd>{me.displayName ?? me.username}</dd>
              <dt>Keycloak-ID</dt>
              <dd><code>{me.id}</code></dd>
              <dt>Rollen</dt>
              <dd>{me.roles.length ? me.roles.join(', ') : '–'}</dd>
            </dl>
          )}
          {error && <p className="error">{error}</p>}
          <button onClick={() => void auth.signoutRedirect()}>Abmelden</button>
        </>
      ) : (
        <button onClick={() => void auth.signinRedirect()}>Anmelden</button>
      )}
    </main>
  )
}

export default App
