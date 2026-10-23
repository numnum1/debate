# Debate v2

Second-Screen-Plattform für Live-Debatten: Zuschauer wetten (im POC nur mit Punkten) auf den Ausgang, eine Jury entscheidet per Slider. Produkt: [docs/v2/PRODUKT.md](docs/v2/PRODUKT.md), Architektur und Entscheidungen: [docs/v2/ARCHITEKTUR.md](docs/v2/ARCHITEKTUR.md).

| Verzeichnis | Inhalt |
|---|---|
| [`backend/`](backend/) | Spring Boot 4.1, Java 21, Maven Wrapper – **manuell gestartet** |
| [`web/`](web/) | React 19, Vite, TypeScript – **manuell gestartet** |
| [`infra/`](infra/) | Docker Compose: Postgres, MongoDB, Keycloak (+ Datenbank-Oberflächen) und separat Onyx |
| [`docs/v2/`](docs/v2/) | Produkt, Architektur, Entscheidungen |

## Voraussetzungen

- Docker Desktop (muss laufen)
- JDK 21 (`JAVA_HOME` zeigt darauf); Maven ist nicht nötig, das Backend bringt `mvnw` mit
- Node.js 24 und npm
- Für Onyx: der Onyx-Quellcode unter `onyx-main/` (wird nicht versioniert, siehe unten)

## Starten

### Kurzweg: Startskript

```bash
start-dev.cmd
```

Startet Docker Desktop, falls nötig, dann Infrastruktur und Onyx Lite, und wartet, bis Keycloak und Onyx antworten. Was schon läuft, bleibt unangetastet; nur fehlende oder gestoppte Dienste werden gestartet. `start-dev.cmd -Rebuild` setzt dagegen alle Container neu auf und holt die Images neu, die Daten in den Volumes bleiben. `start-dev.cmd -Admin` startet zusätzlich die Onyx-Admin-Oberfläche; ohne `-Admin` wird sie nicht gestartet. In PowerShell geht auch `.\start-dev.ps1 [-Rebuild] [-Admin]`. Backend und Frontend startest du danach wie unten in Schritt 3 und 4.

Die Schritte einzeln:

### 1. Infrastruktur

```bash
docker compose -f infra/docker-compose.yml up -d --wait
```

### 2. Onyx (optional, nur für KI-Aufgaben)

`onyx-main/` muss den Onyx-Quellcode enthalten, z. B. per `git clone https://github.com/onyx-dot-app/onyx.git onyx-main`. Genutzt werden nur dessen Compose-Dateien; die Image-Version ist in [infra/onyx/onyx.env](infra/onyx/onyx.env) fest eingestellt.

```bash
docker compose -f infra/onyx/docker-compose.yml up -d --wait
```

Mit Admin-Oberfläche:

```bash
docker compose -f infra/onyx/docker-compose.yml --profile admin-ui up -d --wait
```

Es läuft **Onyx Lite**: standardmäßig nur API-Server und Onyx-Postgres, die API ist direkt unter http://localhost:3001 erreichbar (ohne `/api`-Präfix). Die Admin-Oberfläche (`web_server` + nginx) läuft nur mit dem Profil `admin-ui`. Zusammen unter 1 GB RAM. Chat, Agents und Websuche funktionieren; ein Suchindex über eigene Dokumente ist bewusst nicht dabei (siehe [Architektur](docs/v2/ARCHITEKTUR.md#onyx-als-ki-backend)). Abgeschaltet sind außerdem MCP-Server und Code-Interpreter, siehe [onyx.override.yml](infra/onyx/onyx.override.yml).

Zum Einrichten mit Admin-Oberfläche starten und unter http://localhost:3000 einmalig einrichten: Das erste Konto, das sich dort registriert, wird Onyx-Admin. Dann LLM-Anbieter und Agents anlegen und ein Access Token für unser Backend erzeugen, siehe [backend/README.md](backend/README.md#ki-im-chat-onyx). Endnutzer melden sich nie bei Onyx an. `USER_AUTH_SECRET` in [onyx.env](infra/onyx/onyx.env) hat einen festen Dev-Wert.

### 3. Backend

```bash
cd backend
./mvnw spring-boot:run
```

Unter Windows ohne Git Bash: `mvnw.cmd spring-boot:run`. Konfiguration in [application.yml](backend/src/main/resources/application.yml), überschreibbar per Umgebungsvariable oder lokal in `application-local.yml`, die nicht ins Git kommt (siehe [backend/README.md](backend/README.md#lokale-einstellungen)).

Ohne gesetztes Profil läuft das Profil `dev`. Darin legt der Dev-Seed beim Start Beispieldebatten mit Rollen für die Testnutzer an (`backend/.../debate/DevSeed.java`), soweit sie noch fehlen. Die Rollen hängen an den festen Keycloak-IDs der Testnutzer aus dem Realm-JSON. Stammt dein Realm aus der Zeit vor diesen festen IDs, importiere ihn einmal neu (siehe [Stoppen](#stoppen)).

### 4. Frontend

```bash
cd web
npm install
npm run dev
```

Dann http://localhost:5173 öffnen und anmelden.

## Lokale Dienste

| Dienst | Adresse | Zugang |
|---|---|---|
| Frontend | http://localhost:5173 | Testnutzer `admin` (globale Rolle admin), `alice`, `bob`, `carol`, `dave`, `erin`, `frank`, `grace` (ohne feste Rolle, Rollen gelten pro Debatte), Passwort jeweils `dev` |
| Backend | http://localhost:8080 | Swagger-UI: http://localhost:8080/swagger-ui.html · Health: http://localhost:8080/actuator/health |
| Keycloak | http://localhost:8180 | Admin-Konsole: `admin` / `admin`; Realm `debate` aus [infra/keycloak/debate-realm.json](infra/keycloak/debate-realm.json) |
| PostgreSQL | `localhost:5433` | `debate` / `debate`, Datenbank `ledger` (Port 5433, damit es nicht mit einem lokalen Postgres kollidiert) |
| MongoDB | `localhost:27017` | `debate` / `debate`, Datenbank `debate`, `authSource=admin` |
| Mongo Express | http://localhost:8081 | Mongo im Browser |
| Adminer | http://localhost:8082 | Postgres im Browser (Server `postgres`, Nutzer `debate`) |
| Onyx-API | http://localhost:3001 | Für unser Backend, Access Token als Bearer-Token |
| Onyx-Admin | http://localhost:3000 | Nur mit `-Admin` bzw. Profil `admin-ui` |

Alle Zugangsdaten sind reine Entwicklungswerte.

Ein Token zum Testen der API per curl liefert der Dev-Client `debate-dev`:

```bash
curl -s -d client_id=debate-dev -d grant_type=password -d username=alice -d password=dev http://localhost:8180/realms/debate/protocol/openid-connect/token
```

## Stoppen

```bash
docker compose -f infra/docker-compose.yml down
```

`down -v` löscht zusätzlich alle Daten. Den Realm importiert Keycloak dann beim nächsten Start neu; Änderungen am Realm-JSON greifen nur so, weil ein bestehender Realm nicht überschrieben wird.

Der Code des ersten Versuchs liegt weiterhin auf `main`.
