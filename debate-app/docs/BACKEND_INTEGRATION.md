# Backend-Integration für Debate App

Diese Dokumentation beschreibt die Backend-Integration mit Real-time Chat-Synchronisierung.

## Übersicht

Die App nutzt jetzt:
- **REST API** für CRUD-Operationen (Debatten, Positionen, Slots, Nachrichten)
- **WebSocket** für Real-time Chat-Updates
- **Keycloak OAuth2** für Authentifizierung

## Backend-URL

Das Backend läuft standardmäßig auf:
```
HTTP API: http://localhost:1933
WebSocket: ws://localhost:1933
```

Diese URLs können über Umgebungsvariablen angepasst werden:
```bash
EXPO_PUBLIC_API_URL=http://localhost:1933
EXPO_PUBLIC_WS_URL=ws://localhost:1933
```

## Architektur

### 1. API Service (`services/api.ts`)

Der API Service verwaltet alle HTTP-Requests zum Backend:

- **Automatische Token-Verwaltung**: JWT Token aus Keycloak wird automatisch in alle Requests eingefügt
- **Error-Handling**: Strukturiertes Error-Handling mit Timeout-Detection
- **Optimistic Updates**: UI wird sofort aktualisiert, bevor Server antwortet

#### Verfügbare API-Endpunkte:

**Debates:**
- `GET /api/debates` - Alle Debatten laden
- `GET /api/debates/:id` - Einzelne Debatte laden
- `POST /api/debates` - Neue Debatte erstellen
- `PUT /api/debates/:id` - Debatte aktualisieren
- `DELETE /api/debates/:id` - Debatte löschen

**Messages:**
- `GET /api/debates/:id/messages` - Nachrichten laden
- `POST /api/debates/:id/messages` - Nachricht senden

**Positions:**
- `POST /api/debates/:debateId/positions` - Position hinzufügen
- `PUT /api/debates/:debateId/positions/:positionId` - Position aktualisieren
- `DELETE /api/debates/:debateId/positions/:positionId` - Position löschen

**Slots:**
- `POST /api/debates/:debateId/positions/:positionId/slots` - Slot hinzufügen
- `PUT /api/debates/:debateId/positions/:positionId/slots/:slotId` - Slot aktualisieren
- `DELETE /api/debates/:debateId/positions/:positionId/slots/:slotId` - Slot löschen

### 2. WebSocket Service (`services/websocket.ts`)

Der WebSocket Service ermöglicht Real-time Chat-Funktionalität:

- **Auto-Reconnect**: Automatische Wiederverbindung bei Verbindungsabbruch
- **Room-Management**: Join/Leave für Debate-Räume
- **Event-basiert**: Callback-System für Messages, Errors, Connect/Disconnect

#### WebSocket Events:

**Client → Server:**
- `debate:join` - Debate-Raum beitreten
- `debate:leave` - Debate-Raum verlassen
- `debate:message` - Nachricht senden

**Server → Client:**
- `debate:message:received` - Neue Nachricht empfangen
- `error` - Fehler vom Server

### 3. Debate Context (`context/DebateContext.tsx`)

Der Debate Context koordiniert API und WebSocket:

- **State Management**: Zentrale Verwaltung aller Debatten und Nachrichten
- **Loading States**: `isLoading` und `error` für UI-Feedback
- **Real-time Sync**: Automatisches Hinzufügen empfangener Nachrichten
- **Optimistic Updates**: Sofortiges UI-Feedback vor Server-Response

## Backend-Anforderungen

### API Response Format

Alle API-Endpunkte sollten folgendes Format verwenden:

```typescript
{
  "success": true,
  "data": { /* Ihre Daten */ },
  "message": "Optional: Erfolgsmeldung"
}
```

Bei Fehlern:
```typescript
{
  "success": false,
  "message": "Fehlerbeschreibung",
  "details": { /* Optional: Zusätzliche Fehlerinfos */ }
}
```

### Authentifizierung

Alle Requests enthalten den Keycloak Access Token:
```
Authorization: Bearer <access_token>
```

Ihr Backend sollte:
1. Token validieren (gegen Keycloak)
2. User-ID aus Token extrahieren
3. Autorisierung basierend auf User durchführen

### WebSocket Authentifizierung

WebSocket-Verbindung wird mit Token authentifiziert:
```
ws://localhost:1933?token=<access_token>
```

### WebSocket Message Format

**Client → Server:**
```json
{
  "type": "debate:join",
  "payload": {
    "debateId": "debate-123"
  },
  "timestamp": "2024-11-20T10:00:00.000Z"
}
```

**Server → Client:**
```json
{
  "type": "debate:message:received",
  "payload": {
    "id": "msg-456",
    "userId": "user-123",
    "userName": "Max Mustermann",
    "text": "Hallo Welt",
    "timestamp": "2024-11-20T10:00:00.000Z",
    "positionId": "pos-1",
    "slotId": "slot-1"
  }
}
```

## Datenmodelle

### Debate
```typescript
{
  id: string;
  title: string;
  description: string;
  createdBy: User;
  positions: Position[];
  createdAt: Date;
  status: 'active' | 'completed' | 'pending';
  messages: DebateMessage[];
}
```

**Beispiel JSON:**
```json
{
  "id": "debate-123",
  "title": "Künstliche Intelligenz in der Bildung",
  "description": "Sollte KI stärker in Schulen eingesetzt werden?",
  "createdBy": {
    "id": "user-456",
    "name": "Max Mustermann",
    "email": "max@example.com",
    "avatar": "https://example.com/avatar.jpg"
  },
  "positions": [
    {
      "id": "pos-1",
      "name": "Pro",
      "description": "Argumente für den Einsatz von KI in der Bildung",
      "color": "#10b981",
      "slots": [
        {
          "id": "slot-1",
          "type": "invited",
          "participant": {
            "id": "user-456",
            "name": "Max Mustermann",
            "email": "max@example.com"
          }
        },
        {
          "id": "slot-2",
          "type": "open"
        }
      ]
    },
    {
      "id": "pos-2",
      "name": "Contra",
      "description": "Kritische Bedenken zum KI-Einsatz in Schulen",
      "color": "#ef4444",
      "slots": [
        {
          "id": "slot-3",
          "type": "invited",
          "participant": {
            "id": "user-789",
            "name": "Anna Schmidt",
            "email": "anna@example.com"
          }
        },
        {
          "id": "slot-4",
          "type": "ai",
          "participant": {
            "id": "ai-1",
            "name": "KI Assistent",
            "email": "ai@debate.app"
          },
          "aiConfig": {
            "model": "gpt-4",
            "personality": "neutral and analytical"
          }
        }
      ]
    }
  ],
  "createdAt": "2024-11-20T10:00:00.000Z",
  "status": "active",
  "messages": [
    {
      "id": "msg-1",
      "userId": "user-456",
      "userName": "Max Mustermann",
      "text": "KI kann personalisiertes Lernen ermöglichen und Lehrer entlasten.",
      "timestamp": "2024-11-20T10:15:00.000Z",
      "positionId": "pos-1",
      "slotId": "slot-1"
    },
    {
      "id": "msg-2",
      "userId": "user-789",
      "userName": "Anna Schmidt",
      "text": "Aber es besteht die Gefahr, dass soziale Kompetenzen vernachlässigt werden.",
      "timestamp": "2024-11-20T10:20:00.000Z",
      "positionId": "pos-2",
      "slotId": "slot-3"
    }
  ]
}
```

### Position
```typescript
{
  id: string;
  name: string;
  description: string;
  color: string; // Hex-Farbe, z.B. '#3b82f6'
  slots: Slot[];
}
```

### Slot
```typescript
{
  id: string;
  type: 'open' | 'invited' | 'ai';
  participant?: User; // Bei 'invited' oder 'ai'
  aiConfig?: {
    model: string;
    personality?: string;
  };
}
```

### DebateMessage
```typescript
{
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: Date;
  positionId?: string;
  slotId?: string;
}
```

### User
```typescript
{
  id: string; // Keycloak User-ID (sub claim)
  name: string;
  email: string;
  avatar?: string;
}
```

## Verwendung im Frontend

### Debates laden
```typescript
const { debates, isLoading, error, refreshDebates } = useDebate();

// Automatisch geladen beim Login
// Manuelles Refresh:
await refreshDebates();
```

### Nachricht senden
```typescript
const { addMessageToDebate } = useDebate();

const message: DebateMessage = {
  id: '', // Wird vom Server gesetzt
  userId: currentUser.id,
  userName: currentUser.name,
  text: 'Meine Nachricht',
  timestamp: new Date(),
  positionId: 'pos-1',
  slotId: 'slot-1',
};

await addMessageToDebate(debateId, message);
```

### Real-time Messages
Real-time Messages werden automatisch empfangen und dem aktuellen Debate hinzugefügt. Keine zusätzliche Logik erforderlich!

## Testing ohne Backend

Für Tests ohne Backend können Sie Mock-Daten verwenden:

1. Kommentieren Sie die API-Calls aus
2. Verwenden Sie die alten Mock-Daten aus dem Git-History

Oder starten Sie ein einfaches Mock-Backend mit json-server:
```bash
npm install -g json-server
json-server --watch db.json --port 1933
```

## Troubleshooting

### "Backend nicht erreichbar"
- Prüfen Sie, ob Backend läuft: `curl http://localhost:1933/api/debates`
- Prüfen Sie die Backend-URL in `config/api.config.ts`
- Prüfen Sie Firewall-Einstellungen

### WebSocket-Verbindung schlägt fehl
- Prüfen Sie WebSocket-Unterstützung im Backend
- Prüfen Sie, ob CORS korrekt konfiguriert ist
- Prüfen Sie Browser-Console für Fehler

### Token-Fehler (401 Unauthorized)
- Prüfen Sie Keycloak-Konfiguration
- Prüfen Sie Token-Validierung im Backend
- Token könnte abgelaufen sein (automatisches Refresh noch nicht implementiert)

### Messages kommen doppelt an
- Backend sollte prüfen, ob Message-ID bereits existiert
- Frontend filtert Duplikate basierend auf Message-ID

## Nächste Schritte

Empfohlene Erweiterungen:

1. **Token Refresh**: Automatisches Erneuern abgelaufener Tokens
2. **Offline-Support**: Queuing von Messages bei fehlender Verbindung
3. **Pagination**: Laden alter Nachrichten in Chunks
4. **Typing Indicators**: Anzeige, wer gerade tippt
5. **Read Receipts**: Markierung gelesener Nachrichten
6. **File Uploads**: Bilder/Dateien in Nachrichten
7. **Notifications**: Push-Notifications für neue Nachrichten

## Weitere Informationen

- [Keycloak Integration](./KEYCLOAK_SETUP.md)
- [API Config](../config/api.config.ts)
- [Type Definitions](../types/index.ts)

