# Keycloak Direct Access Grants Setup

## ✅ Vereinfachte Login-Implementierung

Die Debate-App nutzt jetzt **Direct Access Grants** (Resource Owner Password Credentials Flow) für die Authentifizierung. Dies ist deutlich einfacher und zuverlässiger für Mobile Apps in der Entwicklung.

## 🔧 Keycloak Konfiguration

### WICHTIG: Direct Access Grants aktivieren

1. **Öffnen Sie Keycloak Admin Console:**
   ```
   http://localhost:8180/admin
   ```

2. **Gehen Sie zu Ihrem Client** (`debate-client`):
   - **Clients** → **debate-client**

3. **Aktivieren Sie Direct Access Grants:**
   - Gehen Sie zum Tab **"Settings"** oder **"Capability config"**
   - Aktivieren Sie: ✅ **Direct access grants**
   - Klicken Sie auf **"Save"**

### Vollständige Client-Einstellungen:

```
┌─────────────────────────────────────────────┐
│ Client ID: debate-client                    │
│                                              │
│ Client authentication:     [OFF]             │
│ Authorization:             [OFF]             │
│                                              │
│ Authentication flow:                         │
│ ☑ Standard flow                              │
│ ☑ Direct access grants         ← WICHTIG!   │
│ ☐ Implicit flow                              │
│ ☐ Service accounts roles                     │
└─────────────────────────────────────────────┘
```

## 🚀 Verwendung in der App

### Login mit Email/Passwort

```typescript
// Benutzer gibt Email und Passwort ein
await login('user@example.com', 'password123');

// Das wars! Kein Browser-Redirect, keine komplexe OAuth-Flows
```

### Was passiert im Hintergrund:

1. App sendet Email + Passwort direkt an Keycloak Token-Endpoint
2. Keycloak validiert die Credentials
3. Keycloak gibt Access Token und Refresh Token zurück
4. App speichert Tokens sicher (SecureStore)
5. App ruft User-Info ab
6. Benutzer ist angemeldet ✓

## 👤 Benutzer in Keycloak anlegen

Da die App keine Selbst-Registrierung implementiert, müssen Benutzer in Keycloak angelegt werden:

### Methode 1: Über Keycloak Admin Console

1. **Users** → **Add user**
2. Füllen Sie aus:
   - **Username:** `testuser`
   - **Email:** `test@example.com`
   - **First name:** `Test`
   - **Last name:** `User`
   - **Email verified:** `ON`
   - **Enabled:** `ON`
3. Klicken Sie auf **Create**
4. Gehen Sie zum Tab **"Credentials"**
5. Klicken Sie auf **"Set password"**
   - **Password:** Ihr Passwort
   - **Temporary:** `OFF` (sonst muss Passwort beim ersten Login geändert werden)
6. Klicken Sie auf **Save**

### Methode 2: Selbst-Registrierung aktivieren

1. **Realm Settings** → **Login** Tab
2. **User registration:** `ON`
3. Benutzer können sich dann selbst registrieren unter:
   ```
   http://localhost:8180/realms/debate/account
   ```

## 🧪 Testen

### 1. App starten
```bash
npm start
```

### 2. Test-Login durchführen
- Öffnen Sie die App
- Geben Sie Email und Passwort ein
- Klicken Sie auf "Anmelden"
- Sie sollten zur Haupt-App weitergeleitet werden

### 3. Console-Logs überprüfen
Sie sollten folgendes sehen:
```
[AUTH] Login gestartet für: test@example.com
[AUTH] ✓ Tokens erhalten
[AUTH] ✓ Benutzer angemeldet: test@example.com
[INDEX] Render - isAuthenticated: true
[INDEX] Zeige Haupt-App
```

## 🔒 Sicherheitshinweise

### ⚠️ Direct Access Grants in Produktion

**Wichtig:** Direct Access Grants gilt als **weniger sicher** als Authorization Code Flow mit PKCE!

**Warum?**
- App hat direkten Zugriff auf Passwort
- Kein Browser-basierter Flow
- Weniger Schutz gegen Phishing

**Empfehlungen:**
- ✅ Für Entwicklung und Testing: PERFEKT
- ✅ Für interne Apps: OK
- ⚠️ Für öffentliche Apps: Überlegen Sie Authorization Code Flow
- ✅ Verwenden Sie HTTPS in Produktion
- ✅ Implementieren Sie Token Refresh
- ✅ Setzen Sie angemessene Token-Lebensdauern

### Token-Lebensdauer konfigurieren

In Keycloak:
1. **Realm Settings** → **Tokens** Tab
2. Setzen Sie angemessene Werte:
   - **Access Token Lifespan:** 5-15 Minuten
   - **Refresh Token Lifespan:** 30 Tage
   - **SSO Session Idle:** 30 Minuten
   - **SSO Session Max:** 10 Stunden

## 🐛 Troubleshooting

### Problem: "Unauthorized" oder 401-Fehler

**Lösung:**
1. Überprüfen Sie, ob **Direct access grants** aktiviert ist
2. Prüfen Sie Email/Passwort des Benutzers
3. Stellen Sie sicher, dass Benutzer **Enabled** ist
4. Prüfen Sie, ob **Email verified** `ON` ist (falls erforderlich)

### Problem: "Invalid grant"

**Lösung:**
- Falsches Passwort
- Benutzer existiert nicht
- Benutzer ist deaktiviert
- Realm stimmt nicht überein

### Problem: App zeigt Login-Screen trotz erfolgreicher Anmeldung

**Lösung:**
- Prüfen Sie Console-Logs
- Token wird möglicherweise nicht korrekt gespeichert
- `isAuthenticated` State wird nicht aktualisiert

**Debug:**
```typescript
// In AuthContext.tsx sind Debug-Logs aktiviert
// Überprüfen Sie die Console-Ausgabe
```

### Problem: "CORS Error"

**Lösung:**
- In Keycloak Client Settings:
  - **Web Origins:** `*` (für Entwicklung)
  - Oder: Spezifische Origin `http://localhost:8082`

## 📱 App-Konfiguration

### Umgebungsvariablen (.env)

```env
EXPO_PUBLIC_KEYCLOAK_URL=http://localhost:8180
EXPO_PUBLIC_KEYCLOAK_REALM=debate
EXPO_PUBLIC_KEYCLOAK_CLIENT_ID=debate-client
```

### Für Android Emulator:

```env
EXPO_PUBLIC_KEYCLOAK_URL=http://10.0.2.2:8180
```

### Für iOS Simulator:

```env
EXPO_PUBLIC_KEYCLOAK_URL=http://localhost:8180
```

## 🎯 Vorteile des Direct Access Flows

✅ **Einfach:** Keine komplexen OAuth-Redirects
✅ **Schnell:** Direkte Authentifizierung
✅ **Zuverlässig:** Weniger Fehlerquellen
✅ **Native UX:** Email/Password-Felder in der App
✅ **Offline-fähig:** Mit gespeicherten Tokens

## 🔄 Token Refresh

Die App speichert das Refresh Token und kann damit neue Access Tokens anfordern, wenn diese ablaufen.

```typescript
// Wird automatisch durchgeführt wenn Token abläuft
// Token Refresh Implementierung in AuthContext.tsx
```

## ✨ Fertig!

Ihre App ist jetzt bereit für die Entwicklung mit Keycloak Direct Access Grants!

---

**Stand:** November 2024
**Version:** 2.0.0 (Vereinfachte Implementierung)

