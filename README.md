# Debattierungs-App

Eine moderne Debattierungs-App, die es Benutzern ermöglicht, Debatten zu erstellen, andere einzuladen und strukturierte Diskussionen zu führen.

## Features

✨ **Hauptfunktionen:**
- 🔐 **Authentifizierung:** Login mit Username/Passwort oder Google Account
- 🔑 Passwort vergessen Funktion
- 📝 Debatten erstellen mit Titel und Beschreibung
- 👥 Andere Benutzer zu Debatten einladen
- 💬 Nachrichten mit Pro/Contra/Neutral-Positionierung
- 📊 Übersicht aller laufenden Debatten in der Sidebar
- 👤 Benutzerprofil mit Logout-Funktion
- 🎨 Modernes, responsives Design mit Light/Dark Mode
- 📱 Vorbereitet für spätere Backend-Integration

## Projektstruktur

```
debate-app/
├── app/                      # Expo Router App-Verzeichnis
│   ├── _layout.tsx          # Root Layout mit Auth & Debate Provider
│   └── index.tsx            # Hauptseite (Login oder Debatten)
├── components/              # React-Komponenten
│   ├── LoginScreen.tsx     # Login-Seite mit Auth-Optionen
│   ├── DebateSidebar.tsx   # Sidebar mit Debattenliste & Profil
│   ├── DebateView.tsx      # Hauptansicht für Debatten
│   └── CreateDebateModal.tsx # Modal zum Erstellen neuer Debatten
├── context/                 # React Context
│   ├── AuthContext.tsx     # Authentication State Management
│   └── DebateContext.tsx   # State Management für Debatten
├── types/                   # TypeScript-Typen
│   └── index.ts            # Interface-Definitionen
├── constants/               # Konstanten
│   └── Colors.ts           # Farbschema
└── hooks/                   # Custom Hooks
    └── useColorScheme.ts   # Theme Hook

```

## Installation & Start

```bash
# Abhängigkeiten installieren
npm install

# App starten
npm start

# Für Web
npm run web

# Für Android
npm run android

# Für iOS
npm run ios
```

## Verwendung

### Anmeldung
**Demo-Zugang:**
- E-Mail: `max@example.com`
- Passwort: `password123`

Oder:
- E-Mail: `anna@example.com`
- Passwort: `password123`

**Optionen:**
- Mit Username/Passwort anmelden
- Mit Google-Account anmelden (simuliert)
- Passwort vergessen? Link zum Zurücksetzen

### Eine neue Debatte erstellen
1. Klicken Sie auf den "+" Button in der Sidebar
2. Geben Sie Titel und Beschreibung ein
3. Optional: Laden Sie Teilnehmer per E-Mail ein
4. Klicken Sie auf "Erstellen"

### An einer Debatte teilnehmen
1. Wählen Sie eine Debatte aus der Sidebar
2. Wählen Sie Ihre Position (Pro/Contra/Neutral)
3. Geben Sie Ihren Beitrag ein
4. Senden Sie die Nachricht

### Abmelden
- Klicken Sie auf den "Abmelden" Button am unteren Rand der Sidebar

## Design-Highlights

- 🎨 Modernes UI mit Indigo/Pink Farbschema
- 🌓 Automatischer Light/Dark Mode Support
- 📱 Responsive Layout
- 🔐 Schöne Login-Seite mit Logo und Animationen
- 🔔 Status-Badges für Debatten (Aktiv/Ausstehend/Beendet)
- 💭 Chat-ähnliche Nachrichtenansicht mit Stance-Indikatoren
- 👤 Benutzerprofil-Bereich mit Avatar in der Sidebar

## Backend-Integration (Vorbereitet)

Die App ist für die spätere Backend-Integration vorbereitet:

**Zu implementierende API-Endpunkte:**

```typescript
// Authentifizierung
POST   /api/auth/login        // Login mit Email/Passwort
POST   /api/auth/google       // Login mit Google OAuth
POST   /api/auth/logout       // Logout
POST   /api/auth/reset-password // Passwort zurücksetzen
GET    /api/auth/me           // Aktuellen User abrufen

// Debatten
GET    /api/debates           // Alle Debatten abrufen
POST   /api/debates           // Neue Debatte erstellen
GET    /api/debates/:id       // Einzelne Debatte abrufen
PUT    /api/debates/:id       // Debatte aktualisieren
DELETE /api/debates/:id       // Debatte löschen

// Teilnehmer
POST   /api/debates/:id/invite  // Teilnehmer einladen
DELETE /api/debates/:id/participants/:userId

// Nachrichten
GET    /api/debates/:id/messages  // Nachrichten abrufen
POST   /api/debates/:id/messages  // Nachricht senden

// Benutzer
GET    /api/users/me          // Aktuellen Benutzer abrufen
GET    /api/users             // Benutzer suchen
```

**Integration in Context-Dateien:**

1. **`context/AuthContext.tsx`:**
   - Ersetzen Sie Mock-User durch echte API-Aufrufe
   - Implementieren Sie OAuth mit Google/Apple
   - Token-Management (JWT, Refresh Tokens)
   - Persistierung (AsyncStorage/SecureStore)

2. **`context/DebateContext.tsx`:**
   - Ersetzen Sie Mock-Daten durch API-Aufrufe
   - Implementieren Sie Echtzeit-Updates (WebSockets)
   - Synchronisierung mit Backend

## Technologie-Stack

- **Framework:** React Native mit Expo
- **Navigation:** Expo Router
- **Sprache:** TypeScript
- **State Management:** React Context API
- **Icons:** @expo/vector-icons (Ionicons)
- **UI:** Native Components mit custom Styling

## Nächste Schritte

- [x] ✅ Authentifizierung implementieren
- [x] ✅ Login-Screen mit Passwort vergessen
- [x] ✅ Logout-Funktionalität
- [ ] Backend-API anbinden
- [ ] Echte OAuth-Integration (Google, Apple)
- [ ] Token-Persistierung (AsyncStorage)
- [ ] WebSocket für Echtzeit-Updates
- [ ] Push-Benachrichtigungen
- [ ] Profilbilder hochladen
- [ ] Debattenverlauf und Statistiken
- [ ] Export-Funktion für Debatten
- [ ] Suche und Filter in der Sidebar
- [ ] Registrierung neuer Benutzer

## Lizenz

Private Projekt
