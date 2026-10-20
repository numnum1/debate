# KI-Integration in Debatten

Diese Dokumentation beschreibt die automatische KI-Antwortfunktion in Debatten.

## Funktionsweise

Wenn ein Teilnehmer eine Nachricht in einer Debatte sendet, wird automatisch geprüft, ob KI-Teilnehmer antworten sollten. Die KI antwortet nur, wenn:

1. Die Nachricht **nicht** aus der eigenen Position kommt
2. Der Slot als **KI-Slot** (`type: "ai"`) konfiguriert ist
3. Eine gültige **AI-Config** mit Modell vorhanden ist

## Architektur

### 1. Services

#### AiDebateService
Hauptservice für KI-gesteuerte Antworten:
- **`processAiResponses()`**: Verarbeitet neue Nachrichten und generiert KI-Antworten
- **`findAiSlotsToRespond()`**: Findet KI-Slots, die antworten sollten
- **`generateAndSaveAiResponse()`**: Generiert und speichert KI-Antworten
- **`buildChatHistory()`**: Baut den Chat-Verlauf für die KI auf

### 2. WebSocket Integration

Der `DebateWebSocketHandler` triggert nach jeder neuen Nachricht automatisch:
```java
aiDebateService.processAiResponses(debateId, savedMessage);
```

Die KI-Antworten werden dann über den gleichen WebSocket-Mechanismus gebroadcastet.

## Slot-Konfiguration

### Beispiel: KI-Slot erstellen

```json
{
  "id": "slot-ai-1",
  "type": "ai",
  "aiConfig": {
    "model": "claude-sonnet-4-5-20250929",
    "personality": "Du bist ein Experte für erneuerbare Energien und argumentierst faktenbasiert."
  }
}
```

### Verfügbare Modelle

- `claude-sonnet-4-20250514` - Claude Sonnet 4
- `claude-sonnet-4-5-20250929` - Claude Sonnet 4.5 (empfohlen)
- `qwen3-coder` - Qwen3 Coder (für technische Themen)
- `qwen3-coder-max` - Qwen3 Coder Max
- `claude-opus-4-1-20250805` - Claude Opus 4.1 (höchste Qualität)

## Chat-Verlauf

Die KI erhält den kompletten Chat-Verlauf im folgenden Format:

### System-Prompt
```
Du bist ein KI-Teilnehmer in einer Debatte.

Debatte: Sollen erneuerbare Energien stärker gefördert werden?
Beschreibung: Eine Diskussion über Energiepolitik...

Deine Position: Pro
Beschreibung deiner Position: Befürworter erneuerbarer Energien

Deine Persönlichkeit/Rolle: Du bist ein Experte für Umwelttechnik...

Anweisungen:
- Argumentiere aus der Perspektive deiner Position
- Antworte auf die Argumente der anderen Teilnehmer
- Bleibe sachlich und respektvoll
- Halte deine Antworten prägnant (2-4 Sätze)
- Verwende überzeugende Argumente und Beispiele
```

### Nachrichten-Format
```
[Position - Username]: Nachrichtentext
```

Beispiel:
```
[Pro - Alice]: Erneuerbare Energien sind die Zukunft!
[Contra - Bob]: Aber sie sind zu teuer.
[Pro - Claude 4.5 (Pro)]: Die Kosten für Solar- und Windenergie sind in den letzten Jahren drastisch gesunken...
```

## Antwort-Logik

### Wann antwortet die KI?

```java
// Eine KI in Position "Pro" antwortet, wenn eine neue Nachricht kommt von:
- Position "Contra"
- Position "Neutral"
- Jeder anderen Position außer "Pro"

// Die KI antwortet NICHT, wenn:
- Die Nachricht aus der eigenen Position kommt
- Kein AI-Config vorhanden ist
- Der Slot nicht vom Typ "ai" ist
```

### Ablauf

1. **Neue Nachricht wird empfangen**
   ```
   User schreibt: "Atomkraft ist besser!"
   ```

2. **System prüft KI-Slots**
   ```
   Finde alle AI-Slots in anderen Positionen
   ```

3. **"AI denkt..." Indikator**
   ```
   WebSocket: debate:typing:update (isTyping: true)
   ```

4. **Chat-Verlauf wird aufgebaut**
   ```
   System-Prompt + alle bisherigen Nachrichten
   ```

5. **EECC API-Aufruf**
   ```
   POST /chat/completions mit Chat-Verlauf (1-3 Sekunden)
   ```

6. **"AI fertig" Indikator**
   ```
   WebSocket: debate:typing:update (isTyping: false)
   ```

7. **Antwort speichern & broadcasen**
   ```
   Nachricht wird in DB gespeichert
   WebSocket broadcast an alle Teilnehmer
   ```

## Asynchrone Verarbeitung

KI-Antworten werden **asynchron** generiert, um die WebSocket-Verbindung nicht zu blockieren:

```java
new Thread(() -> {
    aiDebateService.processAiResponses(debateId, savedMessage);
}).start();
```

Das bedeutet:
- Der User sieht seine Nachricht sofort
- Die KI-Antwort erscheint kurz danach (1-3 Sekunden)
- Mehrere KI-Teilnehmer können gleichzeitig antworten

## API-Parameter

Die KI-Anfragen verwenden folgende Standard-Parameter:

```java
EeccChatRequest.builder()
    .model(slot.getAiConfig().getModel())
    .messages(chatMessages)
    .temperature(0.7)      // Ausgewogen kreativ/deterministisch
    .maxTokens(1500)       // Mittellange Antworten
    .build();
```

### Anpassungsmöglichkeiten

In zukünftigen Versionen könnten diese Parameter in der `AiConfig` konfigurierbar sein:

```json
{
  "model": "claude-sonnet-4-5-20250929",
  "personality": "Experte für...",
  "temperature": 0.8,
  "maxTokens": 2000,
  "systemPromptOverride": "Optional: Eigener System-Prompt"
}
```

## Beispiel-Szenario

### Debatte: "Soll KI in der Bildung eingesetzt werden?"

**Positionen:**
- Pro (KI: Claude Sonnet 4.5)
- Contra (Mensch: Alice)
- Neutral (KI: Qwen3 Coder)

**Ablauf:**

1. Alice (Contra): "KI kann Lehrer nicht ersetzen!"
2. → Claude 4.5 (Pro) antwortet automatisch
3. → Qwen3 (Neutral) antwortet automatisch
4. Alice liest beide Antworten
5. Alice antwortet auf Claude 4.5
6. → Nur Qwen3 (Neutral) antwortet, da Claude 4.5 in der gleichen Position wie die vorherige Nachricht ist

## WebSocket-Nachrichten

### KI-Typing-Indikator ("AI denkt...")

**Wenn die KI anfängt zu denken:**
```json
{
  "type": "debate:typing:update",
  "payload": {
    "userId": "ai-slot-1",
    "userName": "Claude 4.5 (Pro)",
    "isTyping": true
  },
  "timestamp": "2024-01-15T10:29:58"
}
```

**Wenn die KI fertig ist:**
```json
{
  "type": "debate:typing:update",
  "payload": {
    "userId": "ai-slot-1",
    "userName": "Claude 4.5 (Pro)",
    "isTyping": false
  },
  "timestamp": "2024-01-15T10:30:00"
}
```

Siehe [AI Typing Indicator Dokumentation](AI_TYPING_INDICATOR.md) für Details.

### KI-Antwort wird empfangen

```json
{
  "type": "debate:message:received",
  "payload": {
    "id": "msg-ai-123",
    "userId": "ai-slot-1",
    "userName": "Claude 4.5 (Pro)",
    "text": "Künstliche Intelligenz kann Lehrer unterstützen, nicht ersetzen. Studien zeigen...",
    "timestamp": "2024-01-15T10:30:00",
    "positionId": "pos-pro",
    "slotId": "slot-ai-1"
  },
  "timestamp": "2024-01-15T10:30:00"
}
```

## Debugging

### Logs

Die KI-Integration loggt ausführlich:

```
DEBUG - Processing AI responses for debate: debate-123
INFO  - Found 2 AI slot(s) that should respond
DEBUG - AI slot slot-1 in position Pro should respond
INFO  - Generating AI response for slot slot-1 in position Pro
INFO  - ✓ AI response generated and saved for slot slot-1 in position Pro
INFO  - Broadcasting AI message from Claude 4.5 (Pro) to debate room: debate-123
```

### Häufige Probleme

#### KI antwortet nicht

**Prüfen:**
1. Ist der Slot als `type: "ai"` konfiguriert?
2. Ist `aiConfig` mit einem gültigen Modell vorhanden?
3. Kommt die letzte Nachricht aus einer anderen Position?
4. Ist der EECC API-Key korrekt konfiguriert?
5. Prüfe die Server-Logs auf Fehler

#### KI antwortet zu langsam

- Normal: 1-3 Sekunden für Claude Sonnet 4.5
- Länger bei Opus 4.1 oder bei langen Chat-Verläufen
- Prüfe die EECC API-Verfügbarkeit

#### KI antwortet doppelt

- Das sollte nicht passieren
- Prüfe ob der Slot mehrfach in der Position existiert

## Best Practices

### 1. Modellauswahl

- **Claude Sonnet 4.5**: Standard für die meisten Debatten
- **Claude Opus 4.1**: Für komplexe, anspruchsvolle Themen
- **Qwen3 Coder**: Für technische/Code-bezogene Diskussionen

### 2. Personality-Prompts

Gute Beispiele:
```
"Du bist ein Umweltexperte mit 20 Jahren Erfahrung in der Energiewirtschaft."
"Du argumentierst aus wirtschaftlicher Perspektive und betonst Kosteneffizienz."
"Du bist ein neutraler Moderator, der beide Seiten objektiv beleuchtet."
```

Schlechte Beispiele:
```
"Sei nett."  (zu vage)
"Du hast immer Recht."  (kontraproduktiv)
```

### 3. Positions-Design

- Pro/Contra-Positionen sollten klare, gegensätzliche Standpunkte haben
- Neutral-Position kann als Moderator oder Faktenchecker dienen
- Beschreibungen der Positionen helfen der KI, konsistent zu argumentieren

## Erweiterungsmöglichkeiten

### Zukünftige Features

1. **Antwort-Verzögerung**
   - Konfigurierbare Delay (z.B. 2-5 Sekunden)
   - "Typing"-Indikator während KI antwortet

2. **Selektive Antworten**
   - KI antwortet nicht auf jede Nachricht
   - Nur wenn direkt angesprochen oder alle X Nachrichten

3. **Erweiterte AI-Config**
   ```json
   {
     "model": "claude-sonnet-4-5-20250929",
     "personality": "...",
     "temperature": 0.8,
     "maxTokens": 2000,
     "responseDelay": 3000,
     "responseFrequency": "always" | "sometimes" | "when_mentioned"
   }
   ```

4. **Multi-Model-Support**
   - Verschiedene Modelle in einer Position
   - Fallback bei Ausfall eines Modells

5. **Kontextfenster-Management**
   - Automatisches Zusammenfassen langer Chat-Verläufe
   - Fokus auf die letzten N Nachrichten

## Testing

### Unit-Tests

```java
@Test
void shouldRespondToMessageFromOtherPosition() {
    // Given: AI in Pro position
    // When: Message from Contra position
    // Then: AI should respond
}

@Test
void shouldNotRespondToMessageFromSamePosition() {
    // Given: AI in Pro position
    // When: Message from Pro position
    // Then: AI should NOT respond
}
```

### Integration-Tests

1. Erstelle Debatte mit KI-Slot
2. Sende Nachricht über WebSocket
3. Warte auf KI-Antwort
4. Verifiziere Antwort

## Performance

### Optimierungen

- Asynchrone Verarbeitung verhindert Blockierung
- Nur betroffene KI-Slots werden getriggert
- Chat-Verlauf wird effizient aufgebaut

### Metriken

- Durchschnittliche Antwortzeit: 1-3 Sekunden
- Token-Verbrauch: ~500-2000 Tokens pro Antwort
- Gleichzeitige Anfragen: Unbegrenzt (async)

## Support

Bei Fragen oder Problemen:
- Server-Logs prüfen: `mvn spring-boot:run`
- EECC API Status: https://api.eecc.ai/status
- GitHub Issues für Bug-Reports

