import { WebStorageStateStore } from 'oidc-client-ts'
import type { AuthProviderProps } from 'react-oidc-context'

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
