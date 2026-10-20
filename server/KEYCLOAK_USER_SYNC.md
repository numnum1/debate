# Keycloak User Synchronization

Diese Dokumentation beschreibt, wie die Synchronisierung von Benutzern zwischen Keycloak und MongoDB funktioniert.

## 🎯 Übersicht

Das System synchronisiert Benutzer aus Keycloak in eine lokale MongoDB-Datenbank, um schnelle Suchen und Einladungen zu ermöglichen.

## 📋 Voraussetzungen

### Keycloak Admin Account

Sie benötigen einen Keycloak Admin-Account für die User-Synchronisation. Es gibt zwei Optionen:

#### Option 1: Master Realm Admin (Empfohlen für Development)

Der Standard Keycloak Admin-Account:
- **Username**: `admin`
- **Password**: Ihr Keycloak Admin-Passwort
- **Client**: `admin-cli`
- **Realm**: `master`

#### Option 2: Realm-spezifischer Admin

Erstellen Sie einen speziellen Service-Account im `debate` Realm:

1. In Keycloak Admin Console:
   - Navigieren Sie zu **Clients** → **Create Client**
   - **Client ID**: `debate-admin`
   - **Client type**: `confidential`
   - **Direct access grants**: ✅ ON
   
2. Unter **Service Account Roles**:
   - Fügen Sie `realm-admin` oder `view-users` Role hinzu

3. Notieren Sie sich:
   - Client ID
   - Client Secret (unter Credentials Tab)

## ⚙️ Konfiguration

### application.yml

```yaml
keycloak:
  server-url: http://localhost:8180
  realm: debate
  admin-client-id: admin-cli
  admin-username: admin
  admin-password: admin
```

### Umgebungsvariablen (.env für Produktion)

```bash
KEYCLOAK_SERVER_URL=http://localhost:8180
KEYCLOAK_REALM=debate
KEYCLOAK_ADMIN_CLIENT_ID=admin-cli
KEYCLOAK_ADMIN_USERNAME=admin
KEYCLOAK_ADMIN_PASSWORD=your-admin-password
```

### Docker Compose

Wenn Sie Keycloak mit Docker Compose verwenden:

```yaml
environment:
  KEYCLOAK_SERVER_URL: http://keycloak:8080
  KEYCLOAK_REALM: debate
  KEYCLOAK_ADMIN_CLIENT_ID: admin-cli
  KEYCLOAK_ADMIN_USERNAME: admin
  KEYCLOAK_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
```

## 🚀 Verwendung

### Automatische Synchronisation beim Start

Die User-Synchronisation erfolgt automatisch beim Serverstart:

```
==========================================================
Application ready - starting automatic user synchronization...
==========================================================
Fetching all users from Keycloak realm: debate
✓ Fetched 5 users from Keycloak
✓ Successfully synced 5 users from Keycloak
==========================================================
✓ User synchronization completed: 5 users synced
==========================================================
```

### Manuelle Synchronisation via API

#### POST /api/users/sync

Synchronisiert alle Benutzer aus Keycloak in die Datenbank.

**Request:**
```bash
curl -X POST http://localhost:1933/api/users/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": 5,
  "message": "5 users synchronized from Keycloak"
}
```

### Synchronisation über das Frontend

Im InviteParticipantModal gibt es einen "Benutzer synchronisieren" Button:

1. Öffnen Sie das Invite-Modal
2. Klicken Sie auf "Benutzer synchronisieren"
3. Alle Keycloak-User werden in die Datenbank synchronisiert
4. Die Suche wird automatisch aktualisiert

## 📊 User-Datenmodell

### Keycloak → MongoDB Mapping

| Keycloak Field | MongoDB Field | Fallback |
|---------------|---------------|----------|
| `id` | `id` | - |
| `firstName + lastName` | `name` | `firstName` → `lastName` → `username` → `email` |
| `email` | `email` | - |

### Beispiel User

```json
{
  "_id": "abc-123-xyz",
  "name": "Max Mustermann",
  "email": "max@example.com"
}
```

## 🔍 User-Suche

### GET /api/users/search?query=...

Sucht Benutzer in der MongoDB-Datenbank (case-insensitive):

**Request:**
```bash
curl http://localhost:1933/api/users/search?query=max \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "abc-123-xyz",
      "name": "Max Mustermann",
      "email": "max@example.com"
    }
  ]
}
```

## 🔧 Architektur

```
┌─────────────────┐
│   Keycloak      │
│   (Master DB)   │
└────────┬────────┘
         │
         │ Keycloak Admin Client
         │ (Fetch Users)
         ▼
┌─────────────────────────┐
│  KeycloakService        │
│  - fetchAllUsers()      │
│  - searchUsers()        │
└────────┬────────────────┘
         │
         │ Convert & Cache
         ▼
┌─────────────────────────┐
│  MongoDB                │
│  (User Cache)           │
│  - Fast Search          │
│  - Offline Available    │
└────────┬────────────────┘
         │
         │ Search API
         ▼
┌─────────────────────────┐
│  Frontend               │
│  InviteParticipantModal │
└─────────────────────────┘
```

## 🛡️ Sicherheit

### Best Practices

1. **Niemals Admin-Credentials in Git committen**
   ```bash
   # .gitignore
   .env
   application-local.yml
   ```

2. **Umgebungsvariablen in Produktion**
   ```bash
   export KEYCLOAK_ADMIN_PASSWORD="secure-password"
   ```

3. **Service Account verwenden**
   - Erstellen Sie einen dedizierten Service-Account
   - Minimale Rechte (nur `view-users`)

4. **Passwort-Rotation**
   - Ändern Sie Admin-Passwörter regelmäßig
   - Aktualisieren Sie die Konfiguration

### Berechtigungen

Der Admin-Client benötigt nur **minimale Rechte**:
- `realm:view-users` (Keycloak >= 21)
- Oder `realm-management:view-users` (ältere Versionen)

## 🐛 Troubleshooting

### Problem: "Failed to initialize Keycloak Admin Client"

**Ursachen:**
- Keycloak nicht erreichbar
- Falsche Server-URL
- Falsches Admin-Passwort

**Lösung:**
```bash
# Prüfen Sie die Keycloak-Verbindung
curl http://localhost:8180/realms/debate

# Prüfen Sie die Admin-Credentials
curl -X POST http://localhost:8180/realms/master/protocol/openid-connect/token \
  -d "client_id=admin-cli" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password"
```

### Problem: "No users fetched from Keycloak"

**Ursachen:**
- Keine User im Keycloak Realm
- Fehlende Berechtigungen
- Falscher Realm-Name

**Lösung:**
1. Prüfen Sie, ob User im Keycloak existieren
2. Prüfen Sie die Realm-Konfiguration in `application.yml`
3. Prüfen Sie die Logs für detaillierte Fehlermeldungen

### Problem: "Keycloak Admin Client not initialized"

**Ursache:**
- KeycloakService konnte nicht initialisiert werden

**Lösung:**
1. Server-Logs prüfen
2. Keycloak-Konfiguration überprüfen
3. Netzwerk-Verbindung testen

## 📈 Monitoring

### Logs

Der Service gibt detaillierte Logs aus:

```
INFO  [KeycloakService] Initializing Keycloak Admin Client...
DEBUG [KeycloakService] Server URL: http://localhost:8180, Realm: debate
INFO  [KeycloakService] ✓ Keycloak Admin Client successfully connected
INFO  [UserSyncService] Starting automatic user synchronization...
INFO  [KeycloakService] Fetching all users from Keycloak realm: debate
INFO  [KeycloakService] ✓ Fetched 5 users from Keycloak
INFO  [UserService] ✓ Successfully synced 5 users from Keycloak
```

### Health Check

Prüfen Sie den Status via Actuator:

```bash
curl http://localhost:1933/api/actuator/health
```

## 🔄 Update-Strategie

### Wann werden User synchronisiert?

1. **Beim Serverstart** (automatisch)
2. **Manuell via API** (POST /api/users/sync)
3. **Über das Frontend** (Sync-Button im Modal)
4. **Bei jedem Login** (einzelner User wird gecacht)

### Cache-Invalidierung

User-Daten werden **nicht automatisch gelöscht**. Wenn ein User in Keycloak gelöscht wird, bleibt er im Cache.

**Manuelle Cache-Bereinigung:**
```bash
# MongoDB Shell
use debate
db.users.deleteMany({})
```

Danach erneut synchronisieren.

## 📝 Zusammenfassung

✅ **Automatische Sync beim Start**  
✅ **Manuelle Sync via API**  
✅ **Frontend Sync-Button**  
✅ **Schnelle User-Suche**  
✅ **Offline-fähig**  
✅ **Sicher konfigurierbar**

Die User-Synchronisation stellt sicher, dass alle Keycloak-Benutzer in der App für Einladungen verfügbar sind, ohne jedes Mal die Keycloak-API abfragen zu müssen.

