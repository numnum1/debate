import * as SecureStore from 'expo-secure-store';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { getKeycloakEndpoints, keycloakConfig } from '../config/keycloak.config';
import { User } from '../types';

// Sichere Storage-Wrapper mit Fallback für Web
const secureStorage = {
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Fallback für Web: localStorage
      localStorage.setItem(key, value);
    } else {
      // Native: SecureStore
      await SecureStore.setItemAsync(key, value);
    }
  },
  
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      // Fallback für Web: localStorage
      return localStorage.getItem(key);
    } else {
      // Native: SecureStore
      return await SecureStore.getItemAsync(key);
    }
  },
  
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      // Fallback für Web: localStorage
      localStorage.removeItem(key);
    } else {
      // Native: SecureStore
      await SecureStore.deleteItemAsync(key);
    }
  },
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email?: string, password?: string) => Promise<void>;
  register: (name?: string, email?: string, password?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  accessToken: string | null;
  refreshToken: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Secure Store Keys
const STORAGE_KEYS = {
  ACCESS_TOKEN: 'keycloak_access_token',
  REFRESH_TOKEN: 'keycloak_refresh_token',
  ID_TOKEN: 'keycloak_id_token',
  USER_INFO: 'keycloak_user_info',
};

/**
 * Keycloak Token Response
 */
interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in: number;
  token_type: string;
}

/**
 * Keycloak UserInfo Response
 */
interface KeycloakUserInfo {
  sub: string;
  email?: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const endpoints = getKeycloakEndpoints();

  /**
   * Prüft ob ein JWT Token abgelaufen ist
   */
  const isTokenExpired = (token: string): boolean => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      // Token als abgelaufen betrachten wenn es in weniger als 60 Sekunden abläuft
      return exp < (now + 60000);
    } catch (error) {
      console.error('[AUTH] Fehler beim Dekodieren des Tokens:', error);
      return true; // Im Zweifelsfall als abgelaufen betrachten
    }
  };

  /**
   * Initialisierung: Gespeicherte Tokens laden
   */
  useEffect(() => {
    loadStoredAuth();
  }, []);

  /**
   * Gespeicherte Authentifizierung laden
   */
  const loadStoredAuth = async () => {
    try {
      setIsLoading(true);
      const storedAccessToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
      const storedRefreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const storedUserInfo = await secureStorage.getItem(STORAGE_KEYS.USER_INFO);

      if (storedAccessToken && storedUserInfo) {
        console.log('[AUTH] Gespeicherte Session gefunden');
        
        // Prüfen ob Token abgelaufen ist
        if (isTokenExpired(storedAccessToken)) {
          console.log('[AUTH] Token abgelaufen, versuche zu erneuern...');
          
          // Refresh Token setzen damit refreshAccessToken es verwenden kann
          setRefreshToken(storedRefreshToken);
          
          if (storedRefreshToken) {
            // Token erneuern
            const tokenResponse = await fetch(endpoints.token, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: new URLSearchParams({
                grant_type: 'refresh_token',
                client_id: keycloakConfig.clientId,
                refresh_token: storedRefreshToken,
              }).toString(),
            });

            if (tokenResponse.ok) {
              const tokens: KeycloakTokenResponse = await tokenResponse.json();
              console.log('[AUTH] ✓ Token erfolgreich erneuert');

              // Neue Tokens speichern
              await storeTokens(
                tokens.access_token,
                tokens.refresh_token,
                tokens.id_token
              );

              setAccessToken(tokens.access_token);
              setRefreshToken(tokens.refresh_token);
              setUser(JSON.parse(storedUserInfo));
            } else {
              console.log('[AUTH] Token-Refresh fehlgeschlagen, Logout erforderlich');
              await logout();
            }
          } else {
            console.log('[AUTH] Kein Refresh Token vorhanden, Logout erforderlich');
            await logout();
          }
        } else {
          // Token noch gültig
          setAccessToken(storedAccessToken);
          setRefreshToken(storedRefreshToken);
          setUser(JSON.parse(storedUserInfo));
        }
      } else {
        console.log('[AUTH] Keine gespeicherte Session');
      }
    } catch (error) {
      console.error('[AUTH] Fehler beim Laden der gespeicherten Authentifizierung:', error);
      // Bei Fehler Logout durchführen
      await logout();
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Tokens sicher speichern
   */
  const storeTokens = async (
    accessToken: string,
    refreshToken: string,
    idToken?: string
  ) => {
    try {
      await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      if (idToken) {
        await secureStorage.setItem(STORAGE_KEYS.ID_TOKEN, idToken);
      }
    } catch (error) {
      console.error('[AUTH] Fehler beim Speichern der Tokens:', error);
    }
  };

  /**
   * Benutzerdaten von Keycloak abrufen
   */
  const fetchUserInfo = async (token: string): Promise<User> => {
    const response = await fetch(endpoints.userInfo, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Fehler beim Abrufen der Benutzerdaten');
    }

    const userInfo: KeycloakUserInfo = await response.json();

    const user: User = {
      id: userInfo.sub,
      name: userInfo.name || userInfo.preferred_username || 'Benutzer',
      email: userInfo.email || '',
    };

    // Benutzerdaten speichern
    await secureStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));

    return user;
  };

  /**
   * Login mit Email und Passwort (Direct Access Grants)
   * Einfacher und zuverlässiger für Mobile Apps
   */
  const login = async (email: string, password: string) => {
    try {
      console.log('[AUTH] Login gestartet für:', email);
      setIsLoading(true);

      if (!email || !password) {
        throw new Error('E-Mail und Passwort sind erforderlich');
      }

      // Direct Access Grants: Username/Password direkt an Keycloak
      const tokenResponse = await fetch(endpoints.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: keycloakConfig.clientId,
          username: email,
          password: password,
          scope: keycloakConfig.scopes.join(' '),
        }).toString(),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json().catch(() => ({ error: 'unknown' }));
        console.error('[AUTH] Token-Fehler:', errorData);
        
        if (errorData.error === 'invalid_grant') {
          throw new Error('Ungültige E-Mail oder Passwort');
        }
        throw new Error('Anmeldung fehlgeschlagen');
      }

      const tokens: KeycloakTokenResponse = await tokenResponse.json();
      console.log('[AUTH] ✓ Tokens erhalten');

      // Tokens speichern
      await storeTokens(
        tokens.access_token,
        tokens.refresh_token,
        tokens.id_token
      );

      setAccessToken(tokens.access_token);
      setRefreshToken(tokens.refresh_token);

      // Benutzerdaten abrufen
      const userData = await fetchUserInfo(tokens.access_token);
      console.log('[AUTH] ✓ Benutzer angemeldet:', userData.email);
      
      setUser(userData);
    } catch (error) {
      console.error('[AUTH] ✗ Login-Fehler:', error);
      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Token mit Refresh Token erneuern
   */
  const refreshAccessToken = async (): Promise<string | null> => {
    try {
      if (!refreshToken) {
        console.log('[AUTH] Kein Refresh Token verfügbar');
        return null;
      }

      console.log('[AUTH] Token-Refresh gestartet');

      const tokenResponse = await fetch(endpoints.token, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          client_id: keycloakConfig.clientId,
          refresh_token: refreshToken,
        }).toString(),
      });

      if (!tokenResponse.ok) {
        console.error('[AUTH] Token-Refresh fehlgeschlagen');
        // Bei Fehler Logout durchführen
        await logout();
        return null;
      }

      const tokens: KeycloakTokenResponse = await tokenResponse.json();
      console.log('[AUTH] ✓ Token erfolgreich erneuert');

      // Neue Tokens speichern
      await storeTokens(
        tokens.access_token,
        tokens.refresh_token,
        tokens.id_token
      );

      setAccessToken(tokens.access_token);
      setRefreshToken(tokens.refresh_token);

      return tokens.access_token;
    } catch (error) {
      console.error('[AUTH] ✗ Token-Refresh-Fehler:', error);
      await logout();
      return null;
    }
  };

  /**
   * Registrierung über Keycloak Admin API
   * Hinweis: In Produktion sollte dies über ein Backend erfolgen!
   * Für Entwicklung: Nutzen Sie die Keycloak Admin Console zur Benutzeranlage
   */
  const register = async (name: string, email: string, password: string) => {
    try {
      console.log('[AUTH] Registrierung gestartet für:', email);
      setIsLoading(true);

      if (!name || !email || !password) {
        throw new Error('Alle Felder sind erforderlich');
      }

      // Für die Registrierung gibt es mehrere Optionen:
      // 1. Keycloak Admin API (benötigt Admin-Token)
      // 2. Keycloak selbst-Registrierung via Browser (bereits implementiert)
      // 3. Backend-Service der die Registrierung durchführt

      // Einfachste Lösung: Benutzer manuell in Keycloak anlegen
      // Oder: Self-Registration in Keycloak aktivieren
      
      throw new Error(
        'Bitte registrieren Sie sich direkt in Keycloak:\n' +
        `${keycloakConfig.url}/realms/${keycloakConfig.realm}/account\n\n` +
        'Oder kontaktieren Sie den Administrator zur Benutzeranlage.'
      );
    } catch (error) {
      console.error('[AUTH] ✗ Registrierungs-Fehler:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Social Login (z.B. Google)
   * Hinweis: Keycloak muss Identity Provider konfiguriert haben
   * Nicht implementiert für Direct Access Flow
   */
  const loginWithGoogle = async () => {
    throw new Error(
      'Social Login ist mit Direct Access Grants nicht verfügbar.\n' +
      'Bitte verwenden Sie Email und Passwort.'
    );
  };

  /**
   * Logout - Lokale Daten löschen
   */
  const logout = async () => {
    try {
      console.log('[AUTH] Logout gestartet');
      setIsLoading(true);

      // Optional: Keycloak Logout-Endpoint aufrufen
      if (accessToken && refreshToken) {
        try {
          await fetch(endpoints.logout, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: new URLSearchParams({
              client_id: keycloakConfig.clientId,
              refresh_token: refreshToken,
            }).toString(),
          });
        } catch (error) {
          console.warn('[AUTH] Keycloak Logout fehlgeschlagen:', error);
        }
      }

      // Tokens und Benutzerdaten löschen
      await secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      await secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await secureStorage.removeItem(STORAGE_KEYS.ID_TOKEN);
      await secureStorage.removeItem(STORAGE_KEYS.USER_INFO);

      setUser(null);
      setAccessToken(null);
      setRefreshToken(null);
      
      console.log('[AUTH] ✓ Logout erfolgreich');
    } catch (error) {
      console.error('[AUTH] ✗ Logout-Fehler:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Passwort zurücksetzen
   * Hinweis: Muss über Keycloak Admin Console oder Email erfolgen
   */
  const resetPassword = async (email: string) => {
    throw new Error(
      'Passwort-Reset bitte über Ihren Administrator oder:\n' +
      `${keycloakConfig.url}/realms/${keycloakConfig.realm}/account`
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        loginWithGoogle,
        logout,
        resetPassword,
        refreshAccessToken,
        accessToken,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

