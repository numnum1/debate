# Debate

Eine Plattform für strukturierte Debatten: Benutzer erstellen Debatten, laden Teilnehmer ein, diskutieren in Echtzeit mit Pro/Contra-Positionen und lassen Argumente von Juroren bewerten. Optional können KI-Modelle als Debattenteilnehmer mitwirken.

Dieses Repository ist ein Monorepo aus Frontend und Backend:

| Verzeichnis | Inhalt | Stack |
|---|---|---|
| [`debate-app/`](debate-app/) | Client (Web, Android, iOS) | Expo 54, React Native 0.81, React 19, TypeScript, Expo Router |
| [`server/`](server/) | REST- & WebSocket-API | Spring Boot 4, Java 17, MongoDB, Keycloak (OAuth2/JWT), SpringDoc/Swagger |

## Features

- 🔐 Authentifizierung über Keycloak (Login, Registrierung)
- 📝 Debatten erstellen, öffentliche Debatten durchsuchen, Teilnehmer einladen
- 💬 Echtzeit-Chat per WebSocket mit Positionen und Slots
- 🧑‍⚖️ Rollen für Moderatoren und Juroren
- ⭐ Bewertung von Argumenten durch Juroren (siehe [JURY_EVALUATION_FEATURE.md](JURY_EVALUATION_FEATURE.md))
- 🔇 Stummschalten von Teilnehmern, Teilnehmer-Sidebar
- 🤖 KI-Teilnehmer über die EECC-API (inkl. Tipp-Indikator)
- 🎨 Light/Dark Mode

![Formular zum Erstellen einer neuen Debatte](docs/screenshots/create-debate.png)

## Voraussetzungen

- Node.js (LTS) und npm
- Java 17+ und Maven 3.6+
- Docker & Docker Compose (unter Windows: Docker Desktop)

Das Backend hat keinen Maven-Wrapper (`mvnw`), Maven muss also installiert und im `PATH` sein (Windows z. B. `winget install Apache.Maven`). Prüfen mit `java -version`, `mvn -v`, `node -v` und `docker info`.

## Schnellstart

### 1. Infrastruktur starten

Docker Desktop muss laufen, sonst schlägt jeder `docker`-Befehl mit `failed to connect to the docker API ... dockerDesktopLinuxEngine` fehl.

```bash
cd server
docker compose up -d
```

Das startet MongoDB (`27017`), Keycloak (`8180`) samt PostgreSQL sowie Mongo Express (`8081`). Beim ersten Start werden die Images heruntergeladen, das dauert einige Minuten. Keycloak braucht nach dem Start noch etwa eine Minute, bis es bereit ist. Den Status zeigt `docker compose ps`. Die Keycloak-Einrichtung (Realm `debate`, Clients, Rollen) ist in [server/QUICKSTART.md](server/QUICKSTART.md) und [debate-app/docs/KEYCLOAK_SETUP.md](debate-app/docs/KEYCLOAK_SETUP.md) beschrieben.

### 2. Server starten

```bash
cd server
mvn spring-boot:run
```

Die API läuft unter `http://localhost:1933/api`, die Swagger-UI unter `http://localhost:1933/api/swagger-ui.html`.

Konfiguration erfolgt über Umgebungsvariablen (siehe [server/environment-variables.example](server/environment-variables.example)), u. a.:

| Variable | Standard |
|---|---|
| `MONGODB_URI` | `mongodb://admin:password@localhost:27017/debate?authSource=admin` |
| `KEYCLOAK_ISSUER_URI` | `http://localhost:8180/realms/debate` |
| `KEYCLOAK_SERVER_URL` | `http://localhost:8180` |
| `EECC_API_BASE_URL` / `EECC_API_KEY` | für KI-Teilnehmer |

### 3. App starten

```bash
cd debate-app
npm install
npm run web
```

Die Web-App läuft unter `http://localhost:10000`. Für mobile Geräte: `npm run android` bzw. `npm run ios`.

Backend-URLs lassen sich über `EXPO_PUBLIC_API_URL` und `EXPO_PUBLIC_WS_URL` anpassen (siehe [debate-app/config/api.config.ts](debate-app/config/api.config.ts)).

### Stoppen

Server und App mit `Ctrl+C` beenden. Die Infrastruktur stoppt `docker compose down` im Ordner `server/`. Die Daten bleiben in den Docker-Volumes erhalten. `docker compose down -v` löscht sie zusätzlich, also auch die Keycloak-Konfiguration.

## Projektstruktur

```
debate/
├── debate-app/          # Expo/React-Native-Client
│   ├── app/             # Routen (Expo Router)
│   ├── components/      # UI-Komponenten
│   ├── context/         # Auth- und Debate-Context
│   ├── services/        # REST-Client & WebSocket
│   ├── config/          # API- & Keycloak-Konfiguration
│   └── docs/            # Setup-Anleitungen
├── server/              # Spring-Boot-Backend
│   ├── src/main/java/info/mm/debate/
│   │   └── controller/  # Debate, Message, Position, Judge, Moderator, Mute, Evaluation, AI, …
│   ├── docker-compose.yml
│   └── *.md             # Detaildokumentation
└── JURY_EVALUATION_FEATURE.md
```

## Weitere Dokumentation

- Backend: [server/README.md](server/README.md), [server/SWAGGER_DOCUMENTATION.md](server/SWAGGER_DOCUMENTATION.md), [server/AI_DEBATE_INTEGRATION.md](server/AI_DEBATE_INTEGRATION.md), [server/WEBSOCKET_DEBUGGING.md](server/WEBSOCKET_DEBUGGING.md)
- Frontend: [debate-app/README.md](debate-app/README.md), [debate-app/docs/SCHNELLSTART.md](debate-app/docs/SCHNELLSTART.md), [debate-app/docs/BACKEND_INTEGRATION.md](debate-app/docs/BACKEND_INTEGRATION.md)
- Postman-Collection: [server/Debate-Server.postman_collection.json](server/Debate-Server.postman_collection.json)
