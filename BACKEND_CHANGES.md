# Backend-Änderungen für Frontend-Integration

## Übersicht

Das Backend wurde vollständig an die Frontend-Anforderungen angepasst, wie in `debate-app/docs/BACKEND_INTEGRATION.md` spezifiziert.

## Neue Datenmodelle

### 1. User (`model/User.java`)
```java
{
  id: String,        // Keycloak User-ID (sub claim)
  name: String,
  email: String,
  avatar: String     // Optional
}
```

### 2. Position (`model/Position.java`)
```java
{
  id: String,
  name: String,
  description: String,
  color: String,     // Hex-Farbe
  slots: List<Slot>
}
```

### 3. Slot (`model/Slot.java`)
```java
{
  id: String,
  type: SlotType,    // open, invited, ai
  participant: User,
  aiConfig: AiConfig // Optional
}
```

### 4. DebateMessage (`model/DebateMessage.java`)
```java
{
  id: String,
  userId: String,
  userName: String,
  text: String,
  timestamp: LocalDateTime,
  positionId: String,
  slotId: String
}
```

### 5. Debate (aktualisiert)
**Geändert:**
- `creatorId` → `createdBy: User`
- `arguments` → `positions: List<Position>`
- Neu: `messages: List<DebateMessage>`
- Status-Enum: `DRAFT/OPEN/CLOSED/ARCHIVED` → `pending/active/completed`

## Neue API-Endpunkte

### Messages (`controller/MessageController.java`)
- `GET /api/debates/:id/messages` - Nachrichten abrufen
- `POST /api/debates/:id/messages` - Nachricht senden

### Positions & Slots (`controller/PositionController.java`)
- `POST /api/debates/:debateId/positions` - Position hinzufügen
- `PUT /api/debates/:debateId/positions/:positionId` - Position aktualisieren
- `DELETE /api/debates/:debateId/positions/:positionId` - Position löschen
- `POST /api/debates/:debateId/positions/:positionId/slots` - Slot hinzufügen
- `PUT /api/debates/:debateId/positions/:positionId/slots/:slotId` - Slot aktualisieren
- `DELETE /api/debates/:debateId/positions/:positionId/slots/:slotId` - Slot löschen

### Debates (aktualisiert)
Alle Endpunkte nutzen jetzt `ApiResponse<T>` Wrapper:
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional message"
}
```

## WebSocket-Support

### Konfiguration
- **Endpoint:** `ws://localhost:1933/ws?token=<access_token>`
- **Authentifizierung:** JWT Token als Query-Parameter

### WebSocket-Handler (`websocket/DebateWebSocketHandler.java`)
- Room-Management für Debate-Räume
- Automatische Broadcast-Funktionalität
- Error-Handling

### Events

**Client → Server:**
```json
{
  "type": "debate:join",
  "payload": { "debateId": "..." },
  "timestamp": "2024-11-20T10:00:00"
}
```

**Server → Client:**
```json
{
  "type": "debate:message:received",
  "payload": { 
    "id": "...",
    "userId": "...",
    "userName": "...",
    "text": "...",
    "timestamp": "...",
    "positionId": "...",
    "slotId": "..."
  }
}
```

## Services

### UserService
- `getUserFromJwt(Jwt)` - Extrahiert User-Info aus Keycloak Token
- `createUser(...)` - Erstellt User-Objekt

### MessageService
- `getMessagesByDebateId(String)` - Lädt Nachrichten
- `addMessageToDebate(String, DebateMessage)` - Fügt Nachricht hinzu

### PositionService
- CRUD-Operationen für Positions
- CRUD-Operationen für Slots

### DebateService (aktualisiert)
- Verwendet jetzt `User` statt `String creatorId`
- Arbeitet mit neuen Datenmodellen

## Konfiguration

### Dependencies (`pom.xml`)
Neu hinzugefügt:
- `spring-boot-starter-websocket`

### Security (`config/SecurityConfig.java`)
- WebSocket-Endpunkt `/ws/**` erlaubt (Authentifizierung via Interceptor)
- CORS für alle Origins aktiviert

### WebSocket (`config/WebSocketConfig.java`)
- Handler-Registry für `/ws`
- Auth-Interceptor für Token-Validierung

### Application (`config/AppConfig.java`)
- ObjectMapper mit JavaTimeModule für JSON-Serialisierung

## API Response Format

Alle Controller-Endpunkte verwenden jetzt `ApiResponse<T>`:

**Erfolg:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}
```

**Fehler:**
```json
{
  "success": false,
  "message": "Error message",
  "details": { ... }
}
```

## Kompatibilität mit Frontend

✅ Port 1933  
✅ Context-Path `/api`  
✅ Keycloak OAuth2 (JWT)  
✅ REST API mit strukturierten Responses  
✅ WebSocket für Real-time Chat  
✅ Alle erwarteten Datenmodelle  
✅ Alle erwarteten API-Endpunkte  

## Migration von alten Daten

Falls Sie alte Debates in der Datenbank haben:

1. **Status-Migration:**
   - `DRAFT` → `pending`
   - `OPEN` → `active`
   - `CLOSED` → `completed`
   - `ARCHIVED` → `completed`

2. **Creator-Migration:**
   - `creatorId` (String) → `createdBy` (User-Objekt)

3. **Arguments-Migration:**
   - `arguments` → Können gelöscht werden, werden durch `positions` und `messages` ersetzt

Empfehlung: Starten Sie mit einer leeren Datenbank für die neue Version.

## Testing

### Backend starten
```bash
mvn clean install
mvn spring-boot:run
```

### WebSocket testen
```javascript
const ws = new WebSocket('ws://localhost:1933/ws?token=YOUR_JWT_TOKEN');

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'debate:join',
    payload: { debateId: 'debate-123' },
    timestamp: new Date().toISOString()
  }));
};
```

### REST API testen
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     http://localhost:1933/api/debates
```

## Bekannte Einschränkungen

1. **Token Refresh:** Noch nicht implementiert (Frontend und Backend)
2. **Offline-Support:** Keine Queue für Messages bei Verbindungsabbruch
3. **Pagination:** Alle Messages werden auf einmal geladen
4. **File Uploads:** Nicht implementiert

## Nächste Schritte

1. Frontend mit Backend verbinden und testen
2. Token-Refresh implementieren
3. Error-Handling verbessern
4. Pagination für Messages hinzufügen
5. Typing-Indicators über WebSocket
6. Read-Receipts für Nachrichten
7. Push-Notifications

## Weitere Informationen

- Frontend-Dokumentation: `../debate-app/docs/BACKEND_INTEGRATION.md`
- Keycloak-Setup: `./KEYCLOAK_PERSISTENCE.md`
- API-Konfiguration: `./src/main/resources/application.yml`

