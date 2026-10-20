# Jury Evaluation Feature - Dokumentation

## Übersicht

Dieses Feature ermöglicht es Juroren (Judges), Argumente in Debatten zu bewerten und Punkte zu vergeben. Juroren können Bewertungen verfassen, während andere Teilnehmer Chat-Beiträge schreiben. Die Bewertungen werden auf der rechten Seite angezeigt, ähnlich wie Debatten auf der linken Seite gelistet werden.

## Story

> Als Juror möchte ich Punkte für Argumente vergeben können.
> 
> Dafür möchte ich als Juror, da wo andere einen Chat-Beitrag verfassen, einen Button haben, um eine Bewertung zu verfassen.
> 
> Nur meine verfassten Bewertungen möchte ich auf der rechten Seite vom Chat optisch ähnlich wie Debatten gelistet haben.

## Implementierung

### 1. Datenmodell

#### TypeScript (Frontend)

**Neue Schnittstelle: `Evaluation`** (`debate-app/types/index.ts`)

```typescript
export interface Evaluation {
  id: string;
  debateId: string;
  judgeId: string;
  judgeName: string;
  messageId?: string; // Optional: reference to a specific message being evaluated
  title: string; // Short title for the evaluation
  points: number; // Points awarded (e.g., 1-10)
  comment: string; // Detailed evaluation comment
  timestamp: Date | string;
  positionId?: string; // Optional: which position is being evaluated
}
```

**Aktualisierte `Debate`-Schnittstelle:**

```typescript
export interface Debate {
  // ... existing fields ...
  evaluations?: Evaluation[]; // Bewertungen der Juroren
}
```

#### Java (Backend)

**Neue Klasse: `Evaluation`** (`server/src/main/java/info/mm/debate/model/Evaluation.java`)

```java
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Evaluation {
    private String id;
    private String debateId;
    private String judgeId;
    private String judgeName;
    private String messageId; // Optional
    private String title;
    private Integer points; // 1-10
    private String comment;
    private LocalDateTime timestamp;
    private String positionId; // Optional
}
```

**Aktualisierte `Debate`-Klasse:**

```java
@Document(collection = "debates")
public class Debate {
    // ... existing fields ...
    private List<Evaluation> evaluations; // Bewertungen der Juroren
}
```

### 2. Backend API

#### Service: `EvaluationService`

**Datei:** `server/src/main/java/info/mm/debate/service/EvaluationService.java`

**Methoden:**
- `getEvaluationsForDebate(String debateId)` - Alle Bewertungen für eine Debatte abrufen
- `getEvaluationsByJudge(String debateId, String judgeId)` - Bewertungen eines bestimmten Jurors abrufen
- `addEvaluation(String debateId, Evaluation evaluation)` - Neue Bewertung hinzufügen
- `updateEvaluation(String debateId, String evaluationId, Evaluation evaluation)` - Bewertung aktualisieren
- `deleteEvaluation(String debateId, String evaluationId, String judgeId)` - Bewertung löschen

**Validierung:**
- Prüft, ob der Benutzer ein Juror ist
- Verhindert, dass Juroren Bewertungen anderer Juroren bearbeiten
- Generiert automatisch IDs und Zeitstempel

#### Controller: `EvaluationController`

**Datei:** `server/src/main/java/info/mm/debate/controller/EvaluationController.java`

**Endpoints:**

| Methode | Endpoint | Beschreibung |
|---------|----------|--------------|
| GET | `/api/debates/{debateId}/evaluations` | Alle Bewertungen abrufen |
| GET | `/api/debates/{debateId}/evaluations/by-judge/{judgeId}` | Bewertungen eines Jurors |
| POST | `/api/debates/{debateId}/evaluations` | Neue Bewertung erstellen |
| PUT | `/api/debates/{debateId}/evaluations/{evaluationId}` | Bewertung aktualisieren |
| DELETE | `/api/debates/{debateId}/evaluations/{evaluationId}` | Bewertung löschen |

**Authentifizierung:**
- Alle Endpoints erfordern JWT-Token
- Juror-ID und Name werden automatisch aus dem JWT extrahiert

#### WebSocket-Unterstützung

**Datei:** `server/src/main/java/info/mm/debate/websocket/DebateWebSocketHandler.java`

**Neue Broadcast-Methoden:**
- `broadcastEvaluationAdded(String debateId, Object evaluation)` - Neue Bewertung
- `broadcastEvaluationUpdated(String debateId, Object evaluation)` - Aktualisierte Bewertung
- `broadcastEvaluationDeleted(String debateId, String evaluationId)` - Gelöschte Bewertung

**WebSocket-Events:**
- `debate:evaluation:added` - Wird gesendet, wenn eine neue Bewertung erstellt wird
- `debate:evaluation:updated` - Wird gesendet, wenn eine Bewertung aktualisiert wird
- `debate:evaluation:deleted` - Wird gesendet, wenn eine Bewertung gelöscht wird

### 3. Frontend

#### API Service

**Datei:** `debate-app/services/api.ts`

**Neue Methoden:**
- `getEvaluations(debateId)` - Alle Bewertungen abrufen
- `getEvaluationsByJudge(debateId, judgeId)` - Bewertungen eines Jurors
- `addEvaluation(debateId, evaluation)` - Neue Bewertung erstellen
- `updateEvaluation(debateId, evaluationId, evaluation)` - Bewertung aktualisieren
- `deleteEvaluation(debateId, evaluationId)` - Bewertung löschen

#### Context: DebateContext

**Datei:** `debate-app/context/DebateContext.tsx`

**Neue Funktionen:**
- `addEvaluation(debateId, evaluation)` - Bewertung hinzufügen
- `updateEvaluation(debateId, evaluationId, evaluation)` - Bewertung aktualisieren
- `deleteEvaluation(debateId, evaluationId)` - Bewertung löschen
- `getEvaluationsByJudge(debateId, judgeId)` - Bewertungen eines Jurors abrufen

**WebSocket-Listener:**
- Hört auf `debate:evaluation:added`, `debate:evaluation:updated`, `debate:evaluation:deleted`
- Aktualisiert automatisch den lokalen State bei Echtzeit-Updates

#### Komponente: EvaluationForm

**Datei:** `debate-app/components/EvaluationForm.tsx`

**Funktionalität:**
- Formular zum Erstellen von Bewertungen
- Felder:
  - Titel (Text)
  - Punkte (1-10)
  - Position (optional, Auswahl)
  - Kommentar (Mehrzeiliger Text)
- Validierung:
  - Alle Pflichtfelder müssen ausgefüllt sein
  - Punkte müssen zwischen 1 und 10 liegen
- Design: Violett (#8b5cf6) passend zur Juror-Farbe

**Eigenschaften:**
```typescript
interface EvaluationFormProps {
  debateId: string;
  judgeId: string;
  judgeName: string;
  positions: Position[];
  onSubmit: (evaluation: Evaluation) => void;
}
```

#### Komponente: EvaluationSidebar

**Datei:** `debate-app/components/EvaluationSidebar.tsx`

**Funktionalität:**
- Zeigt alle Bewertungen des aktuellen Jurors an
- Design ähnlich der Debatten-Sidebar
- Features:
  - Badge mit Anzahl der Bewertungen
  - Bewertungskarten mit:
    - Punkte-Badge
    - Titel
    - Position (falls vorhanden)
    - Kommentar (gekürzt auf 3 Zeilen)
    - Zeitstempel
  - Löschen-Button für jede Bewertung
- Leerer Zustand: Informative Nachricht, wenn noch keine Bewertungen vorhanden sind

**Eigenschaften:**
```typescript
interface EvaluationSidebarProps {
  evaluations: Evaluation[];
  positions: Position[];
  onDeleteEvaluation?: (evaluationId: string) => void;
}
```

#### Integration in DebateView

**Datei:** `debate-app/components/DebateView.tsx`

**Änderungen:**

1. **Import der neuen Komponenten:**
   ```typescript
   import { EvaluationForm } from './EvaluationForm';
   import { EvaluationSidebar } from './EvaluationSidebar';
   ```

2. **Neue Handler:**
   - `handleAddEvaluation` - Fügt neue Bewertung hinzu
   - `handleDeleteEvaluation` - Löscht Bewertung

3. **Konditionelles Rendering:**
   - Für Juroren: `EvaluationForm` statt normalem Message-Input
   - Für Juroren: `EvaluationSidebar` auf der rechten Seite

4. **Layout-Änderung:**
   - Hauptcontainer verwendet `flexDirection: 'row'`
   - Linke Seite: Debate-Inhalt (flex: 1)
   - Rechte Seite: Evaluation-Spalte (320px breit, nur für Juroren)
     - Oben: EvaluationSidebar (scrollbar, zeigt Bewertungen)
     - Unten: EvaluationForm (fixiert am unteren Rand)

## Benutzerfluss

### Als Juror

1. **Debatte betreten:**
   - Juror öffnet eine aktive Debatte
   - Sieht normale Chat-Nachrichten in der Mitte
   - Unten: Hinweis, dass Juroren keine Nachrichten schreiben können
   - Rechte Spalte zeigt:
     - Oben: "Meine Bewertungen" (anfangs leer)
     - Unten: Formular "Neue Bewertung"

2. **Bewertung erstellen:**
   - In der rechten Spalte unten sieht der Juror das Bewertungsformular
   - Füllt aus:
     - Titel der Bewertung
     - Punkte (1-10)
     - Optional: Zuordnung zu einer Position
     - Ausführlicher Kommentar
   - Klickt auf "Bewertung speichern"

3. **Bewertung erscheint:**
   - Bewertung wird sofort auf der rechten Seite angezeigt
   - Andere Teilnehmer sehen die Bewertung ebenfalls (in Echtzeit via WebSocket)
   - Bewertungskarte zeigt:
     - Punkte in violettem Badge
     - Titel
     - Zugeordnete Position (falls vorhanden)
     - Kommentar
     - Zeitstempel

4. **Bewertung löschen:**
   - Juror kann eigene Bewertungen über das Papierkorb-Icon löschen
   - Bewertung verschwindet sofort bei allen Teilnehmern

### Als Nicht-Juror

- Sieht normale Chat-Ansicht
- Normaler Message-Input unten
- Keine Evaluations-Spalte auf der rechten Seite
- Kann Bewertungen anderer Juroren sehen (zukünftige Erweiterung)

## Design-Entscheidungen

### Farben

- **Juror-Farbe:** Violett (#8b5cf6)
- Konsistent mit anderen Rollen:
  - Moderator: Rot-Orange (#ff6347)
  - Positionen: Verschiedene Farben

### Layout

- **Sidebar-Breite:** 320px (gleich wie Debate-Sidebar links)
- **Card-Design:** Ähnlich wie Debate-Cards für Konsistenz
- **Violett-Schema:** Badges, Buttons und Akzente in Violett

### UX-Patterns

1. **Sofortige Aktualisierung:** WebSocket-Events sorgen für Echtzeit-Synchronisation
2. **Optimistic Updates:** Lokaler State wird sofort aktualisiert
3. **Fehlerbehandlung:** API-Fehler werden als Alerts angezeigt
4. **Validierung:** Client- und serverseitig

## Zukünftige Erweiterungen

### Mögliche Features

1. **Bewertungen für alle sichtbar machen:**
   - Liste aller Bewertungen für nicht-Juroren
   - Filter nach Juror oder Position

2. **Aggregierte Statistiken:**
   - Durchschnittliche Punkte pro Position
   - Gesamtübersicht der Bewertungen
   - Visualisierung (Charts)

3. **Bewertungen zu spezifischen Nachrichten:**
   - Button "Bewerten" bei jeder Nachricht
   - Verknüpfung von Bewertung und Nachricht

4. **Bewertungskategorien:**
   - Verschiedene Aspekte bewerten (Logik, Rhetorik, Fakten, etc.)
   - Multi-dimensionale Bewertungen

5. **Export-Funktion:**
   - Bewertungen als PDF exportieren
   - Zusammenfassung der Debatte mit Bewertungen

## Testing

### Manuelle Tests

1. **Als Juror:**
   - ✓ Bewertung erstellen
   - ✓ Bewertung erscheint auf der rechten Seite
   - ✓ Bewertung löschen
   - ✓ Formular validiert Eingaben
   - ✓ Punkte zwischen 1-10

2. **Als Nicht-Juror:**
   - ✓ Normale Chat-Ansicht
   - ✓ Kein Bewertungsformular
   - ✓ Keine Bewertungs-Sidebar

3. **Echtzeit-Synchronisation:**
   - ✓ Bewertung erscheint bei allen Teilnehmern
   - ✓ Löschen wird propagiert
   - ✓ WebSocket-Events funktionieren

### Backend-Tests

Empfohlene Unit-Tests für `EvaluationService`:

```java
@Test
void shouldAddEvaluation() { ... }

@Test
void shouldValidateJudgeRole() { ... }

@Test
void shouldPreventEditingOthersEvaluations() { ... }

@Test
void shouldDeleteOwnEvaluationOnly() { ... }
```

## Technische Details

### Datenbank (MongoDB)

Bewertungen werden in der `debates`-Collection als Array gespeichert:

```json
{
  "_id": "debate-id",
  "title": "Debate Title",
  // ... other fields ...
  "evaluations": [
    {
      "id": "eval-id",
      "debateId": "debate-id",
      "judgeId": "judge-user-id",
      "judgeName": "Judge Name",
      "title": "Gutes Argument",
      "points": 8,
      "comment": "Sehr überzeugende Argumentation...",
      "timestamp": "2024-01-01T12:00:00",
      "positionId": "position-id"
    }
  ]
}
```

### Sicherheit

1. **Authentifizierung:** JWT-Token erforderlich
2. **Autorisierung:** 
   - Nur Juroren können Bewertungen erstellen
   - Nur eigene Bewertungen können bearbeitet/gelöscht werden
3. **Validierung:**
   - Server validiert alle Eingaben
   - Punkte-Range wird geprüft
   - Juror-Status wird verifiziert

### Performance

- **Optimistic Updates:** UI reagiert sofort
- **WebSocket:** Echtzeitkommunikation mit geringer Latenz
- **Indexierung:** MongoDB-Index auf `debateId` empfohlen

## Dateien-Übersicht

### Backend

```
server/src/main/java/info/mm/debate/
├── model/
│   ├── Evaluation.java ✨ NEU
│   └── Debate.java ✏️ AKTUALISIERT
├── service/
│   └── EvaluationService.java ✨ NEU
├── controller/
│   └── EvaluationController.java ✨ NEU
└── websocket/
    └── DebateWebSocketHandler.java ✏️ AKTUALISIERT
```

### Frontend

```
debate-app/
├── types/
│   └── index.ts ✏️ AKTUALISIERT
├── services/
│   └── api.ts ✏️ AKTUALISIERT
├── context/
│   └── DebateContext.tsx ✏️ AKTUALISIERT
└── components/
    ├── EvaluationForm.tsx ✨ NEU
    ├── EvaluationSidebar.tsx ✨ NEU
    └── DebateView.tsx ✏️ AKTUALISIERT
```

## Zusammenfassung

Diese Implementierung erfüllt alle Anforderungen der User Story:

✅ Juroren können Punkte für Argumente vergeben  
✅ Bewertungsformular an der Stelle des Chat-Inputs  
✅ Eigene Bewertungen auf der rechten Seite ähnlich wie Debatten-Liste  
✅ Echtzeit-Synchronisation via WebSocket  
✅ Saubere Trennung zwischen Backend und Frontend  
✅ Konsistentes Design mit dem Rest der App  

Das Feature ist vollständig funktionsfähig und bereit für den Einsatz!

