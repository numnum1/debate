# Debate Server

Ein Spring Boot Server mit Keycloak-Authentifizierung und MongoDB-Anbindung für eine Debate-Plattform.

## 🚀 Features

- **Spring Boot 4.0.0-M3** mit Java 17
- **Keycloak** für OAuth2/OIDC Authentifizierung und Autorisierung
- **MongoDB** als NoSQL-Datenbank
- **Spring Security OAuth2 Resource Server** mit JWT-Token-Validierung
- **RESTful API** mit vollständigem CRUD für Debates
- **Role-based Access Control (RBAC)** über Keycloak
- **EECC API Integration** für KI-Modelle (Claude, Qwen3)
- **CORS** Support
- **Lombok** für reduzierten Boilerplate-Code
- **Swagger/OpenAPI** Dokumentation

## 📋 Voraussetzungen

- Java 17 oder höher
- Maven 3.6+
- Docker & Docker Compose (für lokale Entwicklung)

## 🛠️ Setup

### 1. Infrastructure starten

Starten Sie MongoDB und Keycloak mit Docker Compose:

```bash
docker-compose up -d
```

Dies startet:
- **MongoDB** auf Port 27017 (mit persistentem Volume)
- **PostgreSQL** für Keycloak (intern, mit persistentem Volume)
- **Keycloak** auf Port 8180 (mit persistenten Einstellungen ✅)
- **Mongo Express** (Web UI) auf Port 8082

**Hinweis:** Ihre Keycloak-Konfiguration bleibt nach Container-Neustarts erhalten!

### 2. Keycloak konfigurieren

1. Öffnen Sie Keycloak Admin Console: http://localhost:8180
2. Login mit: `admin` / `admin`
3. Erstellen Sie einen neuen Realm: `debate`
4. Erstellen Sie einen Client:
   - Client ID: `debate-server`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `*`
   - Service Accounts Enabled: `ON`
5. Kopieren Sie das Client Secret aus dem "Credentials" Tab
6. Erstellen Sie Rollen (optional):
   - `USER` - Standardbenutzer
   - `ADMIN` - Administrator
7. Erstellen Sie Test-Benutzer und weisen Sie Rollen zu

### 3. Umgebungsvariablen konfigurieren

Kopieren Sie `.env.example` zu `.env` und passen Sie die Werte an:

```bash
cp .env.example .env
```

Tragen Sie das Keycloak Client Secret ein:
```
KEYCLOAK_CLIENT_SECRET=ihr-client-secret-aus-keycloak
```

### 4. Anwendung starten

```bash
mvn spring-boot:run
```

Der Server läuft nun auf: http://localhost:8080/api

## 📡 API Endpoints

### Öffentliche Endpoints (keine Authentifizierung erforderlich)

```
GET /api/public/health     - Health Check
GET /api/public/info       - Server Information
```

### Geschützte Endpoints (Authentifizierung erforderlich)

#### Debates

```
GET    /api/debates                    - Alle Debates abrufen
GET    /api/debates/{id}               - Debate nach ID abrufen
GET    /api/debates/status/{status}    - Debates nach Status filtern
GET    /api/debates/my-debates         - Eigene Debates abrufen
GET    /api/debates/participating      - Debates wo man teilnimmt
GET    /api/debates/search?title=...   - Debates suchen
POST   /api/debates                    - Neue Debate erstellen
PUT    /api/debates/{id}               - Debate aktualisieren
POST   /api/debates/{id}/arguments     - Argument hinzufügen
DELETE /api/debates/{id}               - Debate löschen (nur Creator oder Admin)
GET    /api/debates/stats/count        - Statistiken (nur Admin)
```

#### AI Models

```
GET /api/ai/models                     - Alle verfügbaren KI-Modelle abrufen
```

#### EECC API (KI-Modelle)

```
POST /api/eecc/chat/completions        - Chat Completion mit EECC-Modell erstellen
```

**Verfügbare EECC Modelle:**
- `claude-sonnet-4-20250514` - Claude Sonnet 4
- `claude-sonnet-4-5-20250929` - Claude Sonnet 4.5 (empfohlen)
- `qwen3-coder` - Qwen3 Coder (für Code-Aufgaben)
- `qwen3-coder-max` - Qwen3 Coder Max
- `claude-opus-4-1-20250805` - Claude Opus 4.1 (höchste Leistung)

**Beispiel Request:**
```json
{
  "model": "claude-sonnet-4-5-20250929",
  "messages": [
    {
      "role": "system",
      "content": "Du bist ein hilfreicher Assistent."
    },
    {
      "role": "user",
      "content": "Erkläre die Relativitätstheorie."
    }
  ],
  "temperature": 0.7,
  "maxTokens": 2000
}
```

Weitere Details siehe [EECC API Integration Dokumentation](EECC_API_INTEGRATION.md)

### Status-Werte

- `DRAFT` - Entwurf
- `OPEN` - Offen für Teilnahme
- `CLOSED` - Geschlossen
- `ARCHIVED` - Archiviert

### Argument-Typen

- `PRO` - Pro-Argument
- `CONTRA` - Contra-Argument
- `NEUTRAL` - Neutrales Argument

## 🔐 Authentifizierung

### Token abrufen

Verwenden Sie die Keycloak Token-Endpoint:

```bash
curl -X POST http://localhost:8180/realms/debate/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=debate-server" \
  -d "client_secret=IHR-CLIENT-SECRET" \
  -d "username=IHR-USERNAME" \
  -d "password=IHR-PASSWORD" \
  -d "grant_type=password"
```

### API aufrufen mit Token

```bash
curl -X GET http://localhost:8080/api/debates \
  -H "Authorization: Bearer IHR-ACCESS-TOKEN"
```

## 📦 Beispiel Request: Debate erstellen

```bash
curl -X POST http://localhost:8080/api/debates \
  -H "Authorization: Bearer IHR-ACCESS-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sollte KI reguliert werden?",
    "description": "Eine Debatte über die Notwendigkeit von KI-Regulierung",
    "status": "OPEN",
    "participantIds": [],
    "arguments": []
  }'
```

## 🗄️ Datenbank

### MongoDB Connection

- Host: `localhost`
- Port: `27017`
- Database: `debate`
- Username: `admin`
- Password: `password`

### Mongo Express (Web UI)

Zugriff auf http://localhost:8082

- Username: `admin`
- Password: `admin`

## 🧪 Testing

```bash
# Unit Tests ausführen
mvn test

# Integration Tests ausführen
mvn verify
```

## 📝 Projekt-Struktur

```
src/main/java/info/mm/debate/
├── config/              # Konfigurationsklassen (Security, etc.)
├── controller/          # REST Controller
├── model/              # Domain Models (Entities)
├── repository/         # MongoDB Repositories
├── service/            # Business Logic
└── DebateServerApplication.java  # Main Application Class
```

## 🔧 Konfiguration

Die Hauptkonfiguration befindet sich in `src/main/resources/application.yml`.

Wichtige Konfigurationsparameter:
- `server.port` - Server Port (default: 8080)
- `spring.data.mongodb.uri` - MongoDB Connection String
- `spring.security.oauth2.resourceserver.jwt.issuer-uri` - Keycloak Issuer URI
- `keycloak.*` - Keycloak-spezifische Konfiguration

## 🐛 Troubleshooting

### MongoDB Connection Fehler

Stellen Sie sicher, dass MongoDB läuft:
```bash
docker-compose ps
```

### Keycloak Token Validation Fehler

1. Überprüfen Sie, ob Keycloak läuft
2. Verifizieren Sie die Realm- und Client-Konfiguration
3. Stellen Sie sicher, dass das Client Secret korrekt ist
4. Prüfen Sie die Issuer URI in der application.yml

### Port bereits in Verwendung

Ändern Sie die Ports in `docker-compose.yml` oder `application.yml` falls nötig.

## 📚 Weitere Ressourcen

- [Spring Boot Documentation](https://docs.spring.io/spring-boot/docs/current/reference/html/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Spring Security OAuth2 Resource Server](https://docs.spring.io/spring-security/reference/servlet/oauth2/resource-server/index.html)

## 📄 Lizenz

Dieses Projekt ist für Lernzwecke und Entwicklung.

## 👥 Kontakt

Bei Fragen oder Problemen, erstellen Sie bitte ein Issue im Repository.

