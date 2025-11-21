# WebSocket Debugging Guide

## Problem: UI aktualisiert sich nicht nach Slot-Änderungen

### Wie WebSocket-Updates funktionieren sollten

```
1. Frontend öffnet Debatte
   ↓
2. Frontend joinT WebSocket-Room für diese Debatte
   ↓
3. User fügt Slot hinzu (z.B. invited Slot mit User)
   ↓
4. Backend speichert Änderung in MongoDB
   ↓
5. Backend broadcasted "debate:updated" Event
   ↓
6. Alle Clients im WebSocket-Room empfangen Update
   ↓
7. Frontend aktualisiert State automatisch
   ↓
8. UI zeigt neue Daten
```

### Debugging-Logs prüfen

#### Backend-Logs (Server Console)

Wenn ein Slot hinzugefügt wird, sollten Sie sehen:

```
POST /debates/{debateId}/positions/{positionId}/slots - Adding slot
============================================================
Broadcasting debate update to room: {debateId}
Active sessions in this room: 1
============================================================
✓ Debate update broadcast completed for room: {debateId}
```

#### Frontend-Logs (Browser/App Console)

Beim Öffnen einer Debatte:

```
[DebateContext] Joining debate room: {debateId}
[WebSocket] Sending: debate:join
```

Beim Hinzufügen eines Slots:

```
[DebateContext] handleAddSlot called: { positionId: '...', type: 'invited' }
[DebateContext] Opening invite modal for position: ...
[InviteModal] User selected for invite: { name: 'Max', ... }
[DebateContext] Creating invited slot: ...
[API] POST http://localhost:1933/api/debates/{debateId}/positions/{positionId}/slots
```

Beim Empfangen des Updates:

```
[WebSocket] Message received: debate:updated
============================================================
[DebateContext] ✓ Debate updated via WebSocket: {debateId}
[DebateContext] Updated debate has 2 positions
[DebateContext] Current debate ID: {debateId}
============================================================
[DebateContext] ✓ Updating current debate with new data
```

### Häufige Probleme

#### Problem 1: "Active sessions in this room: 0"

**Symptom**: Backend sagt, es gibt keine aktiven Sessions im Room.

**Ursache**: Frontend hat nicht zur Debatte "joined".

**Lösung**:
1. Prüfen Sie, ob WebSocket verbunden ist
2. Prüfen Sie Frontend-Logs für "Joining debate room"
3. Prüfen Sie Backend-Logs für "Session joined debate room"

#### Problem 2: Frontend empfängt keine Updates

**Symptom**: Backend broadcasted, aber Frontend zeigt `[WebSocket] Message received: debate:updated` nicht.

**Ursache**: WebSocket nicht verbunden oder falscher Room.

**Lösung**:
1. Prüfen Sie WebSocket-Verbindung: `[WebSocket] ✓ Connected`
2. Prüfen Sie, ob zur richtigen Debatte joined wurde
3. Prüfen Sie, ob Token gültig ist

#### Problem 3: Update wird empfangen, aber UI ändert sich nicht

**Symptom**: Logs zeigen "Debate updated via WebSocket", aber UI bleibt gleich.

**Ursache**: State-Update funktioniert nicht.

**Lösung**:
1. Prüfen Sie React DevTools
2. Prüfen Sie, ob `currentDebate.id === updatedDebate.id`
3. App neu laden (r im Terminal)

### Manueller Test

1. **Backend starten**:
   ```bash
   cd server
   mvn spring-boot:run
   ```

2. **Frontend starten** (in neuem Terminal):
   ```bash
   cd debate-app
   npx expo start
   ```

3. **Browser Console öffnen** (F12)

4. **Debatte öffnen** und Logs prüfen:
   - Sollte sehen: `[DebateContext] Joining debate room`
   - Backend sollte sehen: `Session ... joined debate room`

5. **Slot hinzufügen** (Teilnehmer einladen):
   - User auswählen
   - Logs prüfen:
     - Frontend: `[API] POST /api/debates/.../slots`
     - Backend: `Broadcasting debate update to room`
     - Frontend: `[WebSocket] Message received: debate:updated`
     - Frontend: `[DebateContext] ✓ Updating current debate`

6. **UI sollte sich automatisch aktualisieren** 🎉

### Erweiterte Debugging-Befehle

#### WebSocket-Status im Frontend prüfen

In Browser Console:
```javascript
// Aktuellen WebSocket-Status prüfen
websocket.isConnected()

// Aktuelle Debatte-ID prüfen
websocket.getCurrentDebateId()
```

#### Backend: Aktive WebSocket-Räume

Fügen Sie temporär einen Endpoint hinzu:

```java
@GetMapping("/debug/websocket/rooms")
public Map<String, Integer> getActiveRooms() {
    // Zeigt alle aktiven Räume und Session-Counts
}
```

### Performance-Tipps

- WebSocket-Broadcasts sind sehr schnell (<50ms)
- Bei vielen Teilnehmern (>100) kann es zu Verzögerungen kommen
- MongoDB-Updates sind schnell (~10ms)

### Zusammenfassung

✅ **Backend** broadcasted korrekt wenn Slots geändert werden  
✅ **Frontend** hat Listener für `debate:updated` Events  
✅ **Frontend** joined automatisch zur Debatte beim Öffnen  
✅ **State-Management** aktualisiert `currentDebate` und `debates` Liste  

Wenn es trotzdem nicht funktioniert:
1. Prüfen Sie Logs
2. Prüfen Sie WebSocket-Verbindung
3. Prüfen Sie, ob zur richtigen Debatte joined wurde
4. App/Server neu starten

