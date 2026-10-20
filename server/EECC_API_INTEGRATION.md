# EECC API Integration

Diese Dokumentation beschreibt die Integration der EECC API in das Debate-Backend.

## Übersicht

Die EECC API-Integration ermöglicht es, verschiedene KI-Modelle über die EECC-Plattform zu nutzen:

- **Claude Sonnet 4** (`claude-sonnet-4-20250514`)
- **Claude Sonnet 4.5** (`claude-sonnet-4-5-20250929`)
- **Qwen3 Coder** (`qwen3-coder`)
- **Qwen3 Coder Max** (`qwen3-coder-max`)
- **Claude Opus 4.1** (`claude-opus-4-1-20250805`)

## Konfiguration

### application.yml

Die EECC API-Konfiguration befindet sich in `application.yml`:

```yaml
eecc:
  api:
    base-url: ${EECC_API_BASE_URL:https://api.eecc.ai/v1}
    key: ${EECC_API_KEY:}
```

### Umgebungsvariablen

Für Production sollten Sie die folgenden Umgebungsvariablen setzen:

```bash
EECC_API_BASE_URL=https://api.eecc.ai/v1
EECC_API_KEY=your-api-key-here
```

## API-Endpunkte

### Verfügbare Modelle abrufen

**GET** `/api/ai/models`

Gibt eine Liste aller verfügbaren KI-Modelle zurück, einschließlich der EECC-Modelle.

**Authentifizierung:** Bearer Token erforderlich

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "claude-sonnet-4-5-20250929",
      "name": "Claude Sonnet 4.5",
      "provider": "EECC",
      "description": "Claude Sonnet 4.5 über EECC API - Neueste Version mit erweiterten Fähigkeiten",
      "available": true
    }
  ],
  "message": "Successfully retrieved 12 available AI models"
}
```

### Chat Completion erstellen

**POST** `/api/eecc/chat/completions`

Erstellt eine Chat Completion mit einem EECC-Modell.

**Authentifizierung:** Bearer Token erforderlich

**Request Body:**
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
      "content": "Erkläre mir die Relativitätstheorie in einfachen Worten."
    }
  ],
  "temperature": 0.7,
  "maxTokens": 2000,
  "stream": false
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "chatcmpl-123",
    "object": "chat.completion",
    "created": 1677652288,
    "model": "claude-sonnet-4-5-20250929",
    "choices": [
      {
        "index": 0,
        "message": {
          "role": "assistant",
          "content": "Die Relativitätstheorie ist eine physikalische Theorie..."
        },
        "finishReason": "stop"
      }
    ],
    "usage": {
      "promptTokens": 56,
      "completionTokens": 234,
      "totalTokens": 290
    }
  },
  "message": "Chat completion successfully created"
}
```

## Verwendungsbeispiel

### Java-Code

```java
@Autowired
private EeccApiService eeccApiService;

public void generateResponse() {
    // Chat-Nachricht erstellen
    EeccChatRequest request = EeccChatRequest.builder()
        .model("claude-sonnet-4-5-20250929")
        .messages(List.of(
            EeccChatRequest.ChatMessage.builder()
                .role("system")
                .content("Du bist ein Experte für Debatten.")
                .build(),
            EeccChatRequest.ChatMessage.builder()
                .role("user")
                .content("Was sind die wichtigsten Argumente für erneuerbare Energien?")
                .build()
        ))
        .temperature(0.7)
        .maxTokens(1000)
        .build();
    
    // API-Aufruf
    EeccChatResponse response = eeccApiService.createChatCompletion(request);
    
    // Antwort verarbeiten
    String assistantMessage = response.getChoices().get(0).getMessage().getContent();
    log.info("Assistant response: {}", assistantMessage);
}
```

### cURL

```bash
# JWT Token abrufen (über Keycloak)
TOKEN="your-jwt-token"

# Chat Completion erstellen
curl -X POST "http://localhost:1933/api/eecc/chat/completions" \
  -H "Authorization: Bearer $TOKEN" \
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
        "content": "Hallo, wie geht es dir?"
      }
    ],
    "temperature": 0.7,
    "maxTokens": 1000
  }'
```

## Modellübersicht

| Modell-ID | Name | Beschreibung | Best Use Case |
|-----------|------|--------------|---------------|
| `claude-sonnet-4-20250514` | Claude Sonnet 4 | Standardversion von Claude Sonnet 4 | Allgemeine Aufgaben und Debatten |
| `claude-sonnet-4-5-20250929` | Claude Sonnet 4.5 | Neueste Version mit erweiterten Fähigkeiten | Komplexe Debatten und Analysen |
| `qwen3-coder` | Qwen3 Coder | Spezialisiert auf Code-Generierung | Technische Diskussionen und Programmierung |
| `qwen3-coder-max` | Qwen3 Coder Max | Erweiterte Version für komplexe Aufgaben | Komplexe Programmieraufgaben |
| `claude-opus-4-1-20250805` | Claude Opus 4.1 | Höchste Leistung | Anspruchsvolle und komplexe Debatten |

## Fehlerbehandlung

Die API gibt bei Fehlern folgendes Format zurück:

```json
{
  "success": false,
  "data": null,
  "message": "Failed to create chat completion: Connection timeout"
}
```

Häufige Fehler:
- **401 Unauthorized**: JWT-Token fehlt oder ist ungültig
- **403 Forbidden**: EECC API-Key ist ungültig
- **429 Too Many Requests**: Rate-Limit überschritten
- **500 Internal Server Error**: Problem bei der EECC API oder Backend

## Integration in Debatten

Die EECC-Modelle können in Debate-Slots verwendet werden:

```json
{
  "slotType": "AI",
  "position": "PRO",
  "aiConfig": {
    "modelId": "claude-sonnet-4-5-20250929",
    "temperature": 0.7,
    "systemPrompt": "Du bist ein Experte für erneuerbare Energien und argumentierst für den Ausbau von Solarenergie."
  }
}
```

## Swagger/OpenAPI

Die vollständige API-Dokumentation ist über Swagger UI verfügbar:

```
http://localhost:1933/api/swagger-ui.html
```

## Weiterentwicklung

Mögliche zukünftige Erweiterungen:

1. **Streaming-Support**: Echtzeit-Streaming von Antworten
2. **Modell-Caching**: Zwischenspeicherung häufig verwendeter Modelle
3. **Erweiterte Parameter**: Unterstützung für weitere EECC API-Parameter
4. **Batch-Verarbeitung**: Mehrere Anfragen gleichzeitig verarbeiten
5. **Fallback-Mechanismus**: Automatischer Wechsel zu einem anderen Modell bei Ausfall

## Support

Bei Fragen zur EECC API-Integration:
- EECC API Dokumentation: https://api.eecc.ai/docs
- Backend-Issues: Siehe GitHub Repository

