# Keycloak Integration - Setup Anleitung

Diese Dokumentation beschreibt die Einrichtung und Konfiguration der Keycloak-Integration für die Debate-App.

## 📋 Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Voraussetzungen](#voraussetzungen)
3. [Keycloak Server Setup](#keycloak-server-setup)
4. [Realm Konfiguration](#realm-konfiguration)
5. [Client Konfiguration](#client-konfiguration)
6. [App Konfiguration](#app-konfiguration)
7. [Deployment](#deployment)
8. [Troubleshooting](#troubleshooting)

## 🎯 Überblick

Die Debate-App nutzt Keycloak als Identity und Access Management (IAM) Lösung:

- **OAuth 2.0 / OpenID Connect (OIDC)** für sichere Authentifizierung
- **Browser-basierter Login** über Keycloak-UI
- **Social Login** (z.B. Google) über Keycloak Identity Provider
- **Sichere Token-Speicherung** mit Expo SecureStore
- **Single Sign-On (SSO)** Unterstützung

## ✅ Voraussetzungen

- Keycloak Server (Version 20.0 oder höher empfohlen)
- Node.js und npm/yarn installiert
- Expo CLI installiert (`npm install -g expo-cli`)
- Ein konfigurerter Keycloak Realm

## 🔧 Keycloak Server Setup

### Option 1: Docker (Empfohlen für Entwicklung)

```bash
docker run -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest \
  start-dev
```

Keycloak ist dann erreichbar unter: `http://localhost:8080`

### Option 2: Standalone Installation

1. Download Keycloak von https://www.keycloak.org/downloads
2. Entpacken und starten:
   ```bash
   bin/kc.sh start-dev
   ```

### Option 3: Cloud-Hosting

Sie können auch einen gehosteten Keycloak-Service nutzen, z.B.:
- AWS Cognito
- Auth0 (Keycloak-kompatibel)
- Red Hat SSO
- Eigener Cloud-Server

## 🌐 Realm Konfiguration

1. **Anmelden bei Keycloak Admin Console**
   - URL: `http://localhost:8080/admin`
   - Benutzername: `admin`
   - Passwort: `admin`

2. **Neuen Realm erstellen**
   - Klicken Sie auf den Realm-Dropdown (oben links)
   - Wählen Sie "Create Realm"
   - Name: `debate-app`
   - Enabled: `ON`
   - Klicken Sie auf "Create"

3. **Realm Einstellungen konfigurieren**
   - Gehen Sie zu **Realm Settings** → **General**
   - User Registration: `ON` (falls Selbst-Registrierung gewünscht)
   - Email as username: Optional
   - Login with email: Optional

4. **Email Konfiguration** (für Passwort-Reset)
   - Gehen Sie zu **Realm Settings** → **Email**
   - Konfigurieren Sie SMTP-Einstellungen für E-Mail-Versand

## 🔐 Client Konfiguration

1. **Client erstellen**
   - Gehen Sie zu **Clients** → **Create Client**
   - Client ID: `debate-app-mobile`
   - Client Protocol: `openid-connect`
   - Klicken Sie auf "Next"

2. **Capability config**
   - Client authentication: `OFF` (Public Client für Mobile)
   - Authorization: `OFF`
   - Standard flow: `ON` (Authorization Code Flow)
   - Direct access grants: `OFF` (nicht empfohlen für mobile Apps)
   - Klicken Sie auf "Next"

3. **Login settings**
   - Root URL: Leer lassen
   - Valid Redirect URIs:
     ```
     exp://localhost:8082/*
     debate-app://auth/callback
     http://localhost:8082/*
     ```
   - Valid Post Logout Redirect URIs:
     ```
     exp://localhost:8082/*
     debate-app://*
     http://localhost:8082/*
     ```
   - Web Origins: `*` (für Entwicklung) oder spezifische Origins
   - Klicken Sie auf "Save"

4. **PKCE aktivieren** (Wichtig für mobile Apps!)
   - In den Client Settings
   - Advanced → Proof Key for Code Exchange Code Challenge Method: `S256`
   - Save

## 📱 App Konfiguration

### 1. Umgebungsvariablen erstellen

Erstellen Sie eine `.env` Datei im Projekt-Root:

```env
# Keycloak Server URL
EXPO_PUBLIC_KEYCLOAK_URL=http://localhost:8080/auth

# Realm Name
EXPO_PUBLIC_KEYCLOAK_REALM=debate-app

# Client ID
EXPO_PUBLIC_KEYCLOAK_CLIENT_ID=debate-app-mobile

# Redirect URI (für Entwicklung)
EXPO_PUBLIC_KEYCLOAK_REDIRECT_URI=exp://localhost:8082
```

### 2. Dependencies installieren

```bash
npm install
```

Die benötigten Packages sind bereits in `package.json` enthalten:
- `expo-auth-session`: OAuth 2.0 / OIDC Authentifizierung
- `expo-crypto`: PKCE Code Verifier
- `expo-secure-store`: Sichere Token-Speicherung
- `expo-web-browser`: Browser-Session für OAuth

### 3. app.json konfigurieren

Fügen Sie in `app.json` das URL-Schema hinzu:

```json
{
  "expo": {
    "scheme": "debate-app",
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "autoVerify": true,
          "data": [
            {
              "scheme": "debate-app",
              "host": "auth",
              "pathPrefix": "/callback"
            }
          ],
          "category": ["BROWSABLE", "DEFAULT"]
        }
      ]
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.debateapp",
      "associatedDomains": ["applinks:your-keycloak-domain.com"]
    }
  }
}
```

### 4. Keycloak-Konfiguration anpassen

Bearbeiten Sie `config/keycloak.config.ts` mit Ihren Werten:

```typescript
export const keycloakConfig = {
  url: 'https://your-keycloak-server.com/auth',
  realm: 'debate-app',
  clientId: 'debate-app-mobile',
  redirectUri: 'debate-app://auth/callback',
  scopes: ['openid', 'profile', 'email'],
};
```

## 🚀 Deployment

### Entwicklung

```bash
# Expo Entwicklungsserver starten
npm start

# Oder spezifisch für Platform
npm run ios
npm run android
npm run web
```

### Produktion

1. **Keycloak Production Setup**
   - HTTPS verwenden (SSL/TLS Zertifikat)
   - Produktions-Domain konfigurieren
   - Sicherheitseinstellungen überprüfen

2. **Update Redirect URIs in Keycloak**
   ```
   https://your-app.com/auth/callback
   your-app-scheme://auth/callback
   ```

3. **Update App Konfiguration**
   - `.env.production` erstellen
   - Produktions-URLs eintragen

4. **Build erstellen**
   ```bash
   # iOS
   expo build:ios
   
   # Android
   expo build:android
   ```

## 🔧 Erweiterte Konfiguration

### Social Login (z.B. Google) einrichten

1. **Google Identity Provider in Keycloak**
   - Gehen Sie zu **Identity Providers** → **Add provider** → **Google**
   - Client ID und Client Secret von Google Cloud Console
   - Redirect URI: `http://localhost:8080/realms/debate-app/broker/google/endpoint`

2. **In der App verwenden**
   ```typescript
   await loginWithGoogle(); // Verwendet automatisch Keycloak Identity Provider
   ```

### Rollen und Berechtigungen

1. **Rollen definieren**
   - Gehen Sie zu **Realm Roles** → **Create Role**
   - Beispiele: `admin`, `moderator`, `user`

2. **Rollen zuweisen**
   - Gehen Sie zu **Users** → Benutzer auswählen → **Role Mappings**

3. **In der App abfragen**
   ```typescript
   // Zugriff auf Access Token
   const { accessToken } = useAuth();
   
   // Token dekodieren um Rollen zu lesen
   const decodedToken = JSON.parse(atob(accessToken.split('.')[1]));
   const roles = decodedToken.realm_access?.roles || [];
   ```

### Token Refresh

Der AuthContext verwaltet Tokens automatisch. Für manuellen Refresh:

```typescript
const refreshAccessToken = async (refreshToken: string) => {
  const response = await fetch(discovery.tokenEndpoint!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: keycloakConfig.clientId,
      refresh_token: refreshToken,
    }).toString(),
  });
  
  return await response.json();
};
```

## 🐛 Troubleshooting

### Problem: "Invalid redirect URI"

**Lösung:** 
- Überprüfen Sie, ob die Redirect URI in Keycloak Client Settings korrekt eingetragen ist
- Format muss exakt übereinstimmen (inkl. trailing slashes)

### Problem: "CORS Error"

**Lösung:**
- In Keycloak Client Settings → Web Origins: `*` oder spezifische Origins
- Bei Produktion: Genaue Origins angeben

### Problem: "Token exchange failed"

**Lösung:**
- Überprüfen Sie die Client-Konfiguration (Public Client!)
- PKCE muss aktiviert sein
- Logs in Keycloak Admin Console überprüfen

### Problem: "Cannot connect to Keycloak server"

**Lösung:**
- Server-URL überprüfen
- Bei localhost: Stellen Sie sicher, dass Keycloak läuft
- Bei Android Emulator: Verwenden Sie `10.0.2.2` statt `localhost`
- Bei iOS Simulator: `localhost` sollte funktionieren

### Problem: "App doesn't redirect back after login"

**Lösung:**
- URL-Schema in app.json überprüfen
- Deep Linking konfigurieren
- Redirect URI muss mit Schema übereinstimmen

## 📚 Weitere Ressourcen

- [Keycloak Dokumentation](https://www.keycloak.org/documentation)
- [Expo Auth Session](https://docs.expo.dev/versions/latest/sdk/auth-session/)
- [OAuth 2.0 PKCE](https://oauth.net/2/pkce/)
- [OpenID Connect](https://openid.net/connect/)

## 🆘 Support

Bei Fragen oder Problemen:
1. Überprüfen Sie die Keycloak Server Logs
2. Überprüfen Sie die App Console Logs
3. Konsultieren Sie die offizielle Keycloak Dokumentation

## 📝 Sicherheitshinweise

⚠️ **Wichtig für Produktion:**

1. **HTTPS verwenden** - Niemals HTTP in Produktion
2. **Starke Passwörter** - Für Admin und Benutzer
3. **Token-Lebensdauer** - Angemessen kurz konfigurieren
4. **PKCE** - Immer aktivieren für mobile Apps
5. **Scope Einschränkungen** - Nur benötigte Scopes anfordern
6. **Regelmäßige Updates** - Keycloak aktuell halten
7. **Monitoring** - Login-Versuche und Fehler überwachen

## ✨ Zusätzliche Features

### Selbst-Registrierung aktivieren

In Keycloak Realm Settings:
- Login → User registration: `ON`

### Passwort-Richtlinien

In Keycloak Realm Settings:
- Security Defenses → Password Policy
- Beispiel: `length(8) and upperCase(1) and lowerCase(1) and digit(1)`

### Zwei-Faktor-Authentifizierung (2FA)

1. Realm Settings → Authentication → Required Actions
2. "Configure OTP" aktivieren
3. Benutzer müssen dann beim nächsten Login 2FA einrichten

---

**Stand:** November 2024
**Version:** 1.0.0

