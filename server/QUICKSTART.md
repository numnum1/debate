# 🚀 Quickstart Guide

Eine schnelle Anleitung, um den Debate Server in wenigen Minuten zu starten.

## Schritt 1: Docker Services starten (2 Minuten)

```bash
docker-compose up -d
```

Warten Sie ca. 30-60 Sekunden, bis alle Services laufen.

Überprüfen Sie den Status:
```bash
docker-compose ps
```

**✅ Wichtig:** Ihre Keycloak-Einstellungen werden jetzt **persistent gespeichert**! 
Nach einem Neustart bleiben alle Realms, Clients und User erhalten.

## Schritt 2: Keycloak konfigurieren (5 Minuten)

### Schnellkonfiguration:

1. Öffnen Sie: http://localhost:8180
2. Login: `admin` / `admin`
3. **Realm erstellen:**
   - Dropdown oben links → "Create Realm"
   - Name: `debate`
   - "Create" klicken

4. **Client erstellen:**
   - Menü: "Clients" → "Create client"
   - Client ID: `debate-server`
   - "Next" → Client authentication: **ON**
   - "Next" → Valid redirect URIs: `*`
   - "Save"

5. **Client Secret kopieren:**
   - Tab "Credentials" → Secret kopieren (wird für Ihre Client-Anwendung benötigt)
   - Der Server validiert nur JWT-Tokens, benötigt kein Client Secret

6. **Test-User erstellen:**
   - Menü: "Users" → "Add user"
   - Username: `testuser`
   - Email verified: **ON**
   - "Create"
   - Tab "Credentials" → "Set password"
   - Password: `password123`
   - Temporary: **OFF**
   - "Save"

✅ Keycloak ist fertig!

Detaillierte Anleitung: siehe [KEYCLOAK_SETUP.md](KEYCLOAK_SETUP.md)

## Schritt 3: Server starten (1 Minute)

```bash
mvn spring-boot:run
```

Server läuft auf: http://localhost:8080/api

## Schritt 4: Testen (2 Minuten)

### Option A: Mit cURL

1. **Token abrufen:**
```bash
curl -X POST http://localhost:8180/realms/debate/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=debate-server" \
  -d "client_secret=IHR-SECRET" \
  -d "username=testuser" \
  -d "password=password123" \
  -d "grant_type=password"
```

2. **Debate erstellen:**
```bash
curl -X POST http://localhost:8080/api/debates \
  -H "Authorization: Bearer IHR-TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Debate",
    "description": "Meine erste Debate",
    "status": "OPEN"
  }'
```

3. **Debates abrufen:**
```bash
curl -X GET http://localhost:8080/api/debates \
  -H "Authorization: Bearer IHR-TOKEN"
```

### Option B: Mit Postman

1. Importieren Sie `Debate-Server.postman_collection.json`
2. Setzen Sie die Variable `client_secret` in der Collection
3. Führen Sie "Get Access Token" aus
4. Testen Sie die anderen Endpoints

## Schneller Check der Services

### MongoDB
- **Connection:** mongodb://localhost:27017
- **UI:** http://localhost:8082 (login: admin/admin)

### Keycloak
- **Admin:** http://localhost:8180 (login: admin/admin)
- **Token URL:** http://localhost:8180/realms/debate/protocol/openid-connect/token

### Spring Boot Server
- **Base URL:** http://localhost:8080/api
- **Health:** http://localhost:8080/api/public/health
- **Info:** http://localhost:8080/api/public/info

## Troubleshooting

### MongoDB startet nicht
```bash
docker-compose down
docker volume rm server_mongodb_data
docker-compose up -d mongodb
```

### Keycloak startet nicht
```bash
docker-compose restart keycloak
docker-compose logs keycloak
```

### Server startet nicht
1. Überprüfen Sie, ob MongoDB läuft: `docker-compose ps`
2. Überprüfen Sie das Client Secret in `application.yml`
3. Prüfen Sie die Logs: `mvn spring-boot:run`

### Token wird abgelehnt
1. Prüfen Sie, ob das Client Secret korrekt ist
2. Stellen Sie sicher, dass Keycloak läuft
3. Überprüfen Sie den Username/Password

## Nächste Schritte

1. ✅ Server läuft → Erkunden Sie die API
2. 📖 Lesen Sie das [README.md](README.md) für Details
3. 🔐 Erweiterte Keycloak-Konfiguration: [KEYCLOAK_SETUP.md](KEYCLOAK_SETUP.md)
4. 🧪 Testen Sie mit Postman
5. 🚀 Entwickeln Sie Ihre Anwendung!

## Alles stoppen

```bash
docker-compose down
```

Optional: Daten löschen
```bash
docker-compose down -v
```

---

**Geschätzte Gesamtzeit:** ~10 Minuten

Bei Problemen: Erstellen Sie ein Issue oder kontaktieren Sie den Support.

