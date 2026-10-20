# MongoDB Konfiguration

## ✅ Standardkonfiguration

Die Anwendung verwendet standardmäßig folgende MongoDB-Konfiguration:

```yaml
mongodb:
  uri: mongodb://admin:password@localhost:27017/debate?authSource=admin
  database: debate
```

Diese Werte sind in `application.yml` konfiguriert und funktionieren mit dem Docker Compose Setup.

## 🔧 Konfiguration anpassen

### Option 1: Umgebungsvariablen (empfohlen für Produktion)

**Windows PowerShell:**
```powershell
$env:MONGODB_URI="mongodb://benutzername:passwort@localhost:27017/debate?authSource=admin"
$env:MONGODB_DATABASE="debate"
```

**Linux/Mac:**
```bash
export MONGODB_URI="mongodb://benutzername:passwort@localhost:27017/debate?authSource=admin"
export MONGODB_DATABASE="debate"
```

### Option 2: application.yml direkt bearbeiten

Öffnen Sie `server/src/main/resources/application.yml` und ändern Sie:

```yaml
mongodb:
  uri: mongodb://IHR_BENUTZER:IHR_PASSWORT@localhost:27017/IHRE_DB?authSource=admin
  database: IHRE_DB
```

### Option 3: .env Datei (für lokale Entwicklung)

Erstellen Sie eine `.env` Datei im `server` Verzeichnis:

```env
MONGODB_URI=mongodb://admin:password@localhost:27017/debate?authSource=admin
MONGODB_DATABASE=debate
```

## 🌐 Verbindung zu Remote MongoDB

Für Remote-Server (z.B. MongoDB Atlas):

```yaml
mongodb:
  uri: mongodb+srv://username:password@cluster.mongodb.net/debate?retryWrites=true&w=majority
  database: debate
```

## 🔒 Verschiedene MongoDB-Benutzer

### Admin-Benutzer (Standard)
```
URI: mongodb://admin:password@localhost:27017/debate?authSource=admin
Auth DB: admin
```

### Dedizierter Benutzer (debateuser)
```
URI: mongodb://debateuser:debatepass@localhost:27017/debate?authSource=debate
Auth DB: debate
```

Wechseln Sie einfach die URI in der Konfiguration.

## 📝 Wichtige Parameter

| Parameter | Beschreibung | Beispiel |
|-----------|--------------|----------|
| `username:password` | Zugangsdaten | `admin:password` |
| `host:port` | MongoDB Server | `localhost:27017` |
| `database` | Datenbankname | `debate` |
| `authSource` | Auth-Datenbank | `admin` oder `debate` |

## 🐳 Docker Compose Standardwerte

```yaml
MONGO_INITDB_ROOT_USERNAME: admin
MONGO_INITDB_ROOT_PASSWORD: password
MONGO_INITDB_DATABASE: debate
```

Diese werden in `docker-compose.yml` definiert.

## 🧪 Verbindung testen

```bash
# Mit Admin-Benutzer
docker exec debate-mongodb mongosh -u admin -p password --authenticationDatabase admin debate --eval "db.debates.find()"

# Mit dediziertem Benutzer
docker exec debate-mongodb mongosh -u debateuser -p debatepass --authenticationDatabase debate debate --eval "db.debates.find()"
```

## ✅ Nach Änderungen

Server neu starten:
```bash
mvn spring-boot:run
```

---

**Stand:** November 2025

