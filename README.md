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
- Für Onyx: der Onyx-Quellcode unter `onyx-main/` (wird nicht versioniert, siehe unten) und ausreichend Speicher für Docker (Onyx empfiehlt 16 GB)

## Starten

### 1. Infrastruktur

```bash
docker compose -f infra/docker-compose.yml up -d --wait
```

### 2. Onyx (optional, nur für KI-Aufgaben)

`onyx-main/` muss den Onyx-Quellcode enthalten, z. B. per `git clone https://github.com/onyx-dot-app/onyx.git onyx-main`. Genutzt wird nur dessen Compose-Datei; die Image-Version ist in [infra/onyx/onyx.env](infra/onyx/onyx.env) fest eingestellt.

```bash
docker compose -f infra/onyx/docker-compose.yml up -d
```

Der erste Start lädt rund 20 GB an Images, danach braucht der Stack etwa 4–5 GB RAM. Danach unter http://localhost:3000 einmalig einrichten: Das erste Konto, das sich dort registriert, wird Onyx-Admin. Dann LLM-Anbieter, API-Key für unser Backend und Agents anlegen. Endnutzer melden sich nie bei Onyx an.

Abweichungen vom Onyx-Standard (in [onyx.env](infra/onyx/onyx.env) und [onyx.override.yml](infra/onyx/onyx.override.yml)): Dateien liegen in Onyx' Postgres statt in einem S3-Objektspeicher, und `USER_AUTH_SECRET` hat einen festen Dev-Wert. Fehler `Failed to load Kubernetes configuration` im `background`-Log sind harmlos (Aufräum-Job der abgeschalteten Craft-Funktion).

### 3. Backend

```bash
cd backend
./mvnw spring-boot:run
```

Unter Windows ohne Git Bash: `mvnw.cmd spring-boot:run`. Konfiguration in [application.yml](backend/src/main/resources/application.yml), überschreibbar per Umgebungsvariable.

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
| Frontend | http://localhost:5173 | Testnutzer `admin`, `alice`, `bob`, Passwort jeweils `dev` |
| Backend | http://localhost:8080 | Swagger-UI: http://localhost:8080/swagger-ui.html · Health: http://localhost:8080/actuator/health |
| Keycloak | http://localhost:8180 | Admin-Konsole: `admin` / `admin`; Realm `debate` aus [infra/keycloak/debate-realm.json](infra/keycloak/debate-realm.json) |
| PostgreSQL | `localhost:5433` | `debate` / `debate`, Datenbank `ledger` (Port 5433, damit es nicht mit einem lokalen Postgres kollidiert) |
| MongoDB | `localhost:27017` | `debate` / `debate`, Datenbank `debate`, `authSource=admin` |
| Mongo Express | http://localhost:8081 | Mongo im Browser |
| Adminer | http://localhost:8082 | Postgres im Browser (Server `postgres`, Nutzer `debate`) |
| Onyx | http://localhost:3000 | Admin-Oberfläche, API unter `/api` |

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
