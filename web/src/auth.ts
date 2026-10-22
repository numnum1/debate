import { WebStorageStateStore } from 'oidc-client-ts'
import type { AuthContextProps, AuthProviderProps } from 'react-oidc-context'

// Keycloak-Realm und Client aus infra/keycloak/debate-realm.json
export const oidcConfig: AuthProviderProps = {
  authority: import.meta.env.VITE_KEYCLOAK_URL ?? 'http://localhost:8180/realms/debate',
  client_id: 'debate-web',
  redirect_uri: window.location.origin,
  post_logout_redirect_uri: window.location.origin,
  scope: 'openid profile email',
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  // Nach dem Login die Parameter ?code=…&state=… aus der Adresszeile entfernen
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname)
  },
}

// Nach dem Login auf die Seite zurück, von der aus man sich angemeldet hat (Keycloak erlaubt localhost:5173/*)
const here = () => window.location.origin + window.location.pathname

export function signIn(auth: AuthContextProps) {
  return auth.signinRedirect({ redirect_uri: here() })
}

export function register(auth: AuthContextProps) {
  return auth.signinRedirect({ redirect_uri: here(), prompt: 'create' })
}

export function displayName(auth: AuthContextProps) {
  const profile = auth.user?.profile
  return profile?.name ?? profile?.preferred_username ?? ''
}
