# KI Typing-Indikator ("AI denkt...")

Diese Dokumentation beschreibt die "AI denkt..."-Funktion, die anzeigt, wenn eine KI gerade eine Antwort generiert.

## Funktionsweise

Wenn die KI eine Antwort generiert, wird automatisch ein Typing-Indikator an alle Teilnehmer gesendet:

1. **Start**: Wenn die KI anfängt zu "denken" (EECC API-Aufruf startet)
2. **Ende**: Wenn die KI fertig ist (Antwort generiert oder Fehler aufgetreten)

## WebSocket-Events

### AI startet Generierung

```json
{
  "type": "debate:typing:update",
  "payload": {
    "userId": "ai-slot-123",
    "userName": "Claude 4.5 (Pro)",
    "isTyping": true
  },
  "timestamp": "2024-01-15T10:30:00"
}
```

### AI beendet Generierung

```json
{
  "type": "debate:typing:update",
  "payload": {
    "userId": "ai-slot-123",
    "userName": "Claude 4.5 (Pro)",
    "isTyping": false
  },
  "timestamp": "2024-01-15T10:30:05"
}
```

Danach folgt die eigentliche Nachricht:

```json
{
  "type": "debate:message:received",
  "payload": {
    "id": "msg-ai-456",
    "userId": "ai-slot-123",
    "userName": "Claude 4.5 (Pro)",
    "text": "Hier ist meine Antwort...",
    "timestamp": "2024-01-15T10:30:05",
    "positionId": "pos-pro",
    "slotId": "slot-123"
  },
  "timestamp": "2024-01-15T10:30:05"
}
```

## Frontend-Integration

### React/React Native Beispiel

```typescript
// Typing-Status speichern
const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());

// WebSocket-Listener
ws.on('debate:typing:update', (data) => {
  const { userId, userName, isTyping } = data;
  
  setTypingUsers(prev => {
    const newSet = new Set(prev);
    if (isTyping) {
      newSet.add(userId);
    } else {
      newSet.delete(userId);
    }
    return newSet;
  });
});

// UI-Anzeige
{typingUsers.has('ai-slot-123') && (
  <View style={styles.typingIndicator}>
    <Text>🤖 Claude 4.5 denkt gerade...</Text>
    <ActivityIndicator />
  </View>
)}
```

### Vanilla JavaScript Beispiel

```javascript
const typingUsers = new Set();

ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  
  if (message.type === 'debate:typing:update') {
    const { userId, userName, isTyping } = message.payload;
    
    if (isTyping) {
      typingUsers.add(userId);
      showTypingIndicator(userName);
    } else {
      typingUsers.delete(userId);
      hideTypingIndicator(userName);
    }
  }
});

function showTypingIndicator(userName) {
  const indicator = document.createElement('div');
  indicator.id = `typing-${userName}`;
  indicator.className = 'typing-indicator';
  indicator.innerHTML = `
    <span class="ai-icon">🤖</span>
    <span>${userName} denkt gerade...</span>
    <span class="dots">
      <span>.</span><span>.</span><span>.</span>
    </span>
  `;
  document.getElementById('chat').appendChild(indicator);
}
```

## Backend-Architektur

### Flow

```
1. User sendet Nachricht
   ↓
2. DebateWebSocketHandler empfängt Nachricht
   ↓
3. MessageService speichert Nachricht
   ↓
4. AiDebateService.processAiResponses() wird aufgerufen
   ↓
5. broadcastAiTyping(..., true) → "AI denkt..."
   ↓
6. EECC API-Aufruf (1-3 Sekunden)
   ↓
7. broadcastAiTyping(..., false) → "AI fertig"
   ↓
8. broadcastAiMessage(...) → Eigentliche Nachricht
```

### Services

**AiDebateService:**
- `generateAndSaveAiResponse()`: Sendet Typing-Events vor und nach EECC API-Aufruf
- `TypingCallback`: Interface für Typing-Broadcasts

**DebateWebSocketHandler:**
- `broadcastAiTyping()`: Sendet Typing-Update an alle Teilnehmer
- `init()`: Konfiguriert Typing-Callback

## Besonderheiten

### Mehrere KIs

Wenn mehrere KIs gleichzeitig antworten, werden separate Typing-Indikatoren gesendet:

```json
// KI 1 startet
{"type": "debate:typing:update", "payload": {"userId": "ai-slot-1", "isTyping": true}}

// KI 2 startet  
{"type": "debate:typing:update", "payload": {"userId": "ai-slot-2", "isTyping": true}}

// KI 1 fertig
{"type": "debate:typing:update", "payload": {"userId": "ai-slot-1", "isTyping": false}}
{"type": "debate:message:received", "payload": {...}} // Nachricht von KI 1

// KI 2 fertig
{"type": "debate:typing:update", "payload": {"userId": "ai-slot-2", "isTyping": false}}
{"type": "debate:message:received", "payload": {...}} // Nachricht von KI 2
```

### Fehlerbehandlung

Bei Fehlern wird der Typing-Indikator automatisch gestoppt:

```java
try {
    // EECC API-Aufruf
} catch (Exception e) {
    // Stoppe Typing-Indikator
    typingCallback.broadcastTyping(..., false);
}
```

### Timeout

Der Typing-Indikator hat keinen automatischen Timeout. Er wird immer explizit gestoppt:
- Nach erfolgreicher Antwort
- Bei EECC API-Fehler
- Bei Exception

## Styling-Vorschläge

### CSS Animation

```css
.typing-indicator {
  display: flex;
  align-items: center;
  padding: 12px;
  background: #f0f0f0;
  border-radius: 8px;
  margin: 8px 0;
}

.typing-indicator .dots {
  display: inline-flex;
  margin-left: 4px;
}

.typing-indicator .dots span {
  animation: blink 1.4s infinite;
  animation-fill-mode: both;
}

.typing-indicator .dots span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator .dots span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes blink {
  0%, 80%, 100% { opacity: 0; }
  40% { opacity: 1; }
}
```

### React Native

```typescript
const TypingIndicator = ({ userName }: { userName: string }) => (
  <View style={styles.typingContainer}>
    <Text style={styles.aiIcon}>🤖</Text>
    <Text style={styles.typingText}>{userName} denkt gerade</Text>
    <View style={styles.dots}>
      <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
      <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
      <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
    </View>
  </View>
);
```

## Testing

### Manueller Test

1. Starte eine Debatte mit KI-Teilnehmer
2. Sende eine Nachricht
3. Beobachte:
   - "AI denkt..." erscheint sofort
   - Nach 1-3 Sekunden verschwindet der Indikator
   - Die KI-Antwort erscheint

### Log-Output

```
DEBUG - Broadcasting AI typing status: debate-123 - Claude 4.5 (Pro) is typing
INFO  - Generating AI response for slot slot-1 in position Pro
INFO  - Successfully received response from EECC API. Tokens used: 245
DEBUG - Broadcasting AI typing status: debate-123 - Claude 4.5 (Pro) is stopped
INFO  - ✓ AI response generated and saved
INFO  - Broadcasting AI message from Claude 4.5 (Pro)
```

## Performance

- **Overhead**: Minimal (~10ms pro Typing-Event)
- **Netzwerk**: ~200 Bytes pro Event
- **Gleichzeitige KIs**: Unbegrenzt (async)

## Zukünftige Erweiterungen

1. **Konfigurierbare Verzögerung**: Typing-Indikator erst nach X Sekunden anzeigen
2. **Progress-Indikator**: Token-Count während der Generierung
3. **Geschätzte Dauer**: Basierend auf Modell und Nachrichtenlänge
4. **Streaming**: Chunked-Response für Echtzeit-Anzeige

## Troubleshooting

### Indikator verschwindet nicht

**Ursache**: Exception vor dem Stopp-Aufruf

**Lösung**: Prüfe Server-Logs auf Exceptions

### Indikator erscheint nicht

**Ursache**: WebSocket-Verbindung unterbrochen

**Lösung**: Prüfe WebSocket-Connection im Frontend

### Mehrfache Indikatoren

**Ursache**: Mehrere KIs antworten gleichzeitig

**Lösung**: Das ist normal und gewünscht!

## Support

Bei Fragen:
- Server-Logs: `mvn spring-boot:run`
- WebSocket-Debug: Browser DevTools → Network → WS
- Frontend-State: React DevTools / Console Logs

