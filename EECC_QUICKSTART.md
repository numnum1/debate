# EECC API Quickstart Guide

Dieser Guide hilft dir, schnell mit der EECC API-Integration zu starten.

## Voraussetzungen

1. Der Debate Server muss laufen
2. Du benötigst einen gültigen JWT-Token von Keycloak
3. Die EECC API-Konfiguration muss in `application.yml` gesetzt sein

## Schritt 1: EECC API-Key konfigurieren

### Option A: In application.yml (für Entwicklung)

Bearbeite `src/main/resources/application.yml`:

```yaml
eecc:
  api:
    base-url: https://api.eecc.ai/v1
    key: 25m7b22W5Z6dwraEc3waKjVpa7YdKZQVko3pd1L9LLR
```

### Option B: Umgebungsvariablen (für Production)

```bash
export EECC_API_BASE_URL=https://api.eecc.ai/v1
export EECC_API_KEY=25m7b22W5Z6dwraEc3waKjVpa7YdKZQVko3pd1L9LLR
```

## Schritt 2: Server starten

```bash
cd server
mvn spring-boot:run
```

Der Server läuft auf: http://localhost:1933/api

## Schritt 3: JWT-Token abrufen

```bash
# Token von Keycloak holen
curl -X POST http://localhost:8180/realms/debate/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=debate-server" \
  -d "client_secret=YOUR_CLIENT_SECRET" \
  -d "username=testuser" \
  -d "password=password123" \
  -d "grant_type=password"
```

Speichere den `access_token` aus der Response.

## Schritt 4: Verfügbare Modelle anzeigen

```bash
curl -X GET http://localhost:1933/api/ai/models \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Schritt 5: Chat Completion erstellen

### Beispiel 1: Claude Sonnet 4.5 (Allgemein)

```bash
curl -X POST http://localhost:1933/api/eecc/chat/completions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-sonnet-4-5-20250929",
    "messages": [
      {
        "role": "system",
        "content": "Du bist ein hilfreicher Assistent."
      },
      {
        "role": "user",
        "content": "Erkläre die Relativitätstheorie in 3 Sätzen."
      }
    ],
    "temperature": 0.7,
    "maxTokens": 500
  }'
```

### Beispiel 2: Qwen3 Coder (Code-Generierung)

```bash
curl -X POST http://localhost:1933/api/eecc/chat/completions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "qwen3-coder",
    "messages": [
      {
        "role": "user",
        "content": "Schreibe eine Java-Methode, die eine Liste von Strings alphabetisch sortiert."
      }
    ],
    "temperature": 0.5,
    "maxTokens": 1000
  }'
```

### Beispiel 3: Claude Opus 4.1 (Komplexe Debatten)

```bash
curl -X POST http://localhost:1933/api/eecc/chat/completions \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "claude-opus-4-1-20250805",
    "messages": [
      {
        "role": "system",
        "content": "Du bist ein Experte für philosophische Debatten."
      },
      {
        "role": "user",
        "content": "Argumentiere für die These: Künstliche Intelligenz wird niemals echtes Bewusstsein entwickeln können."
      }
    ],
    "temperature": 0.8,
    "maxTokens": 2000
  }'
```

## Schritt 6: Response verarbeiten

Die API gibt folgendes Format zurück:

```json
{
  "success": true,
  "data": {
    "id": "chatcmpl-abc123",
    "object": "chat.completion",
    "created": 1677652288,
    "model": "claude-sonnet-4-5-20250929",
    "choices": [
      {
        "index": 0,
        "message": {
          "role": "assistant",
          "content": "Hier ist die Antwort..."
        },
        "finishReason": "stop"
      }
    ],
    "usage": {
      "promptTokens": 45,
      "completionTokens": 120,
      "totalTokens": 165
    }
  },
  "message": "Chat completion successfully created"
}
```

## Postman Collection

Importiere die Postman Collection für einfachere Tests:

1. Öffne Postman
2. Importiere `Debate-Server.postman_collection.json`
3. Setze die Variablen:
   - `base_url`: http://localhost:1933/api
   - `username`: dein Keycloak Benutzername
   - `password`: dein Keycloak Passwort
4. Führe "Get Access Token" aus
5. Teste die EECC API Requests im "EECC API" Ordner

## Swagger UI

Die API-Dokumentation ist auch über Swagger verfügbar:

```
http://localhost:1933/api/swagger-ui.html
```

Hier kannst du alle Endpunkte interaktiv testen.

## Tipps

### Modellauswahl

- **Claude Sonnet 4.5**: Beste Balance zwischen Qualität und Geschwindigkeit
- **Claude Opus 4.1**: Für maximale Qualität bei komplexen Aufgaben
- **Qwen3 Coder**: Optimal für Code-bezogene Aufgaben
- **Claude Sonnet 4**: Stabil und zuverlässig

### Temperature-Werte

- **0.0 - 0.3**: Deterministisch, präzise (gut für Fakten)
- **0.4 - 0.7**: Ausgewogen (Standard für die meisten Aufgaben)
- **0.8 - 1.0**: Kreativ, variabel (gut für Brainstorming)
- **> 1.0**: Sehr kreativ, aber weniger kontrollierbar

### Max Tokens

- **500**: Kurze Antworten
- **1000**: Mittlere Antworten (Standard)
- **2000+**: Lange, detaillierte Antworten

## Fehlersuche

### "401 Unauthorized"

- Prüfe ob dein JWT-Token noch gültig ist
- Token läuft nach einiger Zeit ab, hole einen neuen

### "500 Internal Server Error"

- Prüfe die Server-Logs: `mvn spring-boot:run`
- Ist der EECC API-Key korrekt?
- Ist die EECC API erreichbar?

### "Connection timeout"

- Prüfe deine Internetverbindung
- Ist `https://api.eecc.ai` erreichbar?

## Weitere Dokumentation

- [Vollständige EECC API Dokumentation](EECC_API_INTEGRATION.md)
- [Backend Integration Guide](BACKEND_INTEGRATION.md)
- [Keycloak Setup](KEYCLOAK_SETUP.md)

## Support

Bei Fragen zur EECC API:
- EECC API Dokumentation: https://api.eecc.ai/docs
- Debate Server Issues: GitHub Repository

