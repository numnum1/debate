/**
 * Keycloak Konfiguration für OAuth 2.0 / OpenID Connect
 * 
 * WICHTIG: Passen Sie diese Werte an Ihre Keycloak-Installation an!
 */

export const keycloakConfig = {
  // Keycloak Server URL (ohne /auth Suffix für neuere Keycloak-Versionen)
  // Beispiel: 'https://your-keycloak-server.com'
  url: process.env.EXPO_PUBLIC_KEYCLOAK_URL || 'http://localhost:8180',
  
  // Realm Name
  // Der Name des Realms in Ihrer Keycloak-Installation
  realm: process.env.EXPO_PUBLIC_KEYCLOAK_REALM || 'debate',
  
  // Client ID
  // Die Client-ID, die Sie in Keycloak für diese App konfiguriert haben
  clientId: process.env.EXPO_PUBLIC_KEYCLOAK_CLIENT_ID || 'debate-server',
  
  // Redirect URI (für OAuth Callback)
  // Dies muss in Keycloak als "Valid Redirect URIs" konfiguriert sein
  redirectUri: process.env.EXPO_PUBLIC_KEYCLOAK_REDIRECT_URI || 'exp://localhost:8082',
  
  // Scopes
  // Die OAuth Scopes, die angefordert werden sollen
  scopes: ['openid', 'profile', 'email'],
};

/**
 * Keycloak Endpoints
 */
export const getKeycloakEndpoints = () => {
  const baseUrl = `${keycloakConfig.url}/realms/${keycloakConfig.realm}`;
  
  return {
    // Authorization Endpoint (für Login)
    authorization: `${baseUrl}/protocol/openid-connect/auth`,
    
    // Token Endpoint (für Token-Austausch)
    token: `${baseUrl}/protocol/openid-connect/token`,
    
    // UserInfo Endpoint (für Benutzerdaten)
    userInfo: `${baseUrl}/protocol/openid-connect/userinfo`,
    
    // Logout Endpoint
    logout: `${baseUrl}/protocol/openid-connect/logout`,
    
    // Registration (optional, falls aktiviert)
    registration: `${baseUrl}/protocol/openid-connect/registrations`,
    
    // Account Management UI
    accountManagement: `${baseUrl}/account`,
  };
};

/**
 * Discovery Endpoint für automatische Konfiguration
 */
export const getDiscoveryEndpoint = () => {
  return `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-configuration`;
};

