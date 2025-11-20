# Integration Quickstart

Schnellstart-Anleitung zur Verwendung des aktualisierten Backends mit dem Frontend.

## Voraussetzungen

1. ✅ MongoDB läuft auf `localhost:27017`
2. ✅ Keycloak läuft auf `localhost:8180`
3. ✅ Realm `debate` ist in Keycloak konfiguriert
4. ✅ Client `debate-server` ist konfiguriert

## Backend starten

```bash
cd server
mvn clean install
mvn spring-boot:run
```

Das Backend läuft dann auf: `http://localhost:1933`

## API testen

### 1. Token holen (von Keycloak)

```bash
curl -X POST http://localhost:8180/realms/debate/protocol/openid-connect/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=debate-app" \
  -d "username=YOUR_USERNAME" \
  -d "password=YOUR_PASSWORD" \
  -d "grant_type=password"
```

### 2. Debate erstellen

```bash
curl -X POST http://localhost:1933/api/debates \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Debate",
    "description": "Eine Test-Debatte",
    "status": "active",
    "positions": [
      {
        "name": "Pro",
        "description": "Dafür",
        "color": "#10b981",
        "slots": []
      },
      {
        "name": "Contra",
        "description": "Dagegen",
        "color": "#ef4444",
        "slots": []
      }
    ]
  }'
```

### 3. Nachricht senden

```bash
curl -X POST http://localhost:1933/api/debates/DEBATE_ID/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hallo Welt!",
    "positionId": "pos-1",
    "slotId": "slot-1"
  }'
```

## WebSocket testen

### Mit Browser JavaScript

```javascript
// Token holen (siehe oben)
const token = 'YOUR_JWT_TOKEN';

// WebSocket verbinden
const ws = new WebSocket(`ws://localhost:1933/ws?token=${token}`);

ws.onopen = () => {
  console.log('Connected');
  
  // Debate-Raum beitreten
  ws.send(JSON.stringify({
    type: 'debate:join',
    payload: { debateId: 'YOUR_DEBATE_ID' },
    timestamp: new Date().toISOString()
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message);
};

// Nachricht senden
function sendMessage(text, positionId, slotId) {
  ws.send(JSON.stringify({
    type: 'debate:message',
    payload: {
      text: text,
      positionId: positionId,
      slotId: slotId
    },
    timestamp: new Date().toISOString()
  }));
}

// Beispiel: Nachricht senden
sendMessage('Test Message', 'pos-1', 'slot-1');
```

## Frontend verbinden

### 1. Umgebungsvariablen setzen

```bash
# Im debate-app Verzeichnis
export EXPO_PUBLIC_API_URL=http://localhost:1933
export EXPO_PUBLIC_WS_URL=ws://localhost:1933
```

### 2. Frontend starten

```bash
cd debate-app
npm install
npm start
```

### 3. Testen

1. Login im Frontend
2. Debate erstellen
3. Nachricht senden
4. Real-time Updates beobachten

## Typische Probleme

### Problem: "401 Unauthorized"
**Lösung:** Token ist abgelaufen oder ungültig. Neuen Token holen.

### Problem: "WebSocket connection failed"
**Lösung:** 
- Prüfen, ob Backend läuft
- Prüfen, ob Token im Query-Parameter übergeben wird
- Browser-Console auf Fehler prüfen

### Problem: "Debate not found"
**Lösung:** Debate-ID prüfen, eventuell neue Debate erstellen

### Problem: "Messages come twice"
**Lösung:** Normal, wenn Sie sowohl REST-Response als auch WebSocket-Broadcast erhalten. Frontend filtert Duplikate.

## API Response Format

Alle Responses haben folgendes Format:

**Erfolg:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Fehler:**
```json
{
  "success": false,
  "message": "Error description",
  "details": { ... }
}
```

## Debugging

### Logs ansehen

```bash
# Backend-Logs (im Terminal wo mvn spring-boot:run läuft)
# Level kann in application.yml angepasst werden
```

### MongoDB prüfen

```bash
mongosh
use debate
db.debates.find().pretty()
```

### Keycloak prüfen

1. Admin-Console: http://localhost:8180/admin
2. Realm: `debate`
3. Users prüfen
4. Clients prüfen

## Datenmodelle

### Debate
```typescript
{
  id: string;
  title: string;
  description: string;
  createdBy: User;
  positions: Position[];
  messages: DebateMessage[];
  status: 'pending' | 'active' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}
```

### Position
```typescript
{
  id: string;
  name: string;
  description: string;
  color: string;  // Hex: '#3b82f6'
  slots: Slot[];
}
```

### Slot
```typescript
{
  id: string;
  type: 'open' | 'invited' | 'ai';
  participant?: User;
  aiConfig?: {
    model: string;
    personality: string;
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
  id: string;        // Keycloak sub
  name: string;
  email: string;
  avatar?: string;
}
```

## Weitere Informationen

- **Backend-Änderungen:** `./BACKEND_CHANGES.md`
- **Frontend-Integration:** `../debate-app/docs/BACKEND_INTEGRATION.md`
- **Keycloak-Setup:** `./KEYCLOAK_PERSISTENCE.md`
- **Application Config:** `./src/main/resources/application.yml`

## Support

Bei Problemen:
1. Logs prüfen (Backend, MongoDB, Keycloak)
2. Browser-Console prüfen (Frontend)
3. Network-Tab prüfen (API-Calls)
4. BACKEND_CHANGES.md lesen

