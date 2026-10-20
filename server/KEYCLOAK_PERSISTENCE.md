# Keycloak Persistente Daten

## ✅ Problem gelöst!

Ihre Keycloak-Konfiguration wird jetzt **persistent gespeichert** und bleibt nach Container-Neustarts erhalten!

## 🔧 Was wurde geändert?

### Vorher:
```yaml
KC_DB: dev-mem  # In-Memory Datenbank ❌
```
- Alle Einstellungen gehen beim Neustart verloren

### Jetzt:
```yaml
KC_DB: postgres  # PostgreSQL Datenbank ✅
```
- Alle Einstellungen bleiben erhalten
- Realm-Konfigurationen persistent
- Clients bleiben gespeichert
- User bleiben gespeichert

## 🚀 Neue Container starten

### Schritt 1: Alte Container stoppen und entfernen

```bash
docker-compose down
```

### Schritt 2: Neue Container starten

```bash
docker-compose up -d
```

**Wichtig:** Der erste Start dauert etwas länger (~1-2 Minuten), da:
1. PostgreSQL initialisiert wird
2. Keycloak die Datenbank-Schema erstellt
3. Keycloak initialisiert wird

### Schritt 3: Warten bis alles bereit ist

```bash
# Status prüfen
docker-compose ps

# Logs verfolgen
docker-compose logs -f keycloak
```

Warten Sie, bis Sie sehen:
```
Keycloak ... Running in development mode.
```

## 📦 Was ist jetzt persistent?

Nach dem Neustart bleiben erhalten:

✅ **Realms** - Alle erstellten Realms (z.B. "debate")  
✅ **Clients** - Alle Client-Konfigurationen (z.B. "debate-server")  
✅ **Users** - Alle erstellten Benutzer mit Passwörtern  
✅ **Roles** - Alle Rollen und Rollenzuweisungen  
✅ **Client Secrets** - Bleiben unverändert  
✅ **Gruppen** - Alle Gruppen und deren Mitglieder  
✅ **Identity Providers** - Externe Login-Anbieter  
✅ **Themes** - Angepasste Themes  

## 🧪 Testen der Persistenz

### Test 1: Konfiguration erstellen

```bash
# 1. Keycloak starten
docker-compose up -d

# 2. Realm + Client + User erstellen (über Admin Console)
# http://localhost:8180

# 3. Container neu starten
docker-compose restart keycloak

# 4. Prüfen: Alle Einstellungen noch da? ✅
```

### Test 2: Kompletter Neustart

```bash
# 1. Alles stoppen
docker-compose down

# 2. Alles neu starten
docker-compose up -d

# 3. Prüfen: Alle Einstellungen noch da? ✅
```

## 💾 Backup erstellen

### Datenbank-Backup

```bash
# Backup erstellen
docker exec debate-keycloak-db pg_dump -U keycloak keycloak > keycloak-backup-$(date +%Y%m%d).sql

# Backup wiederherstellen
docker exec -i debate-keycloak-db psql -U keycloak keycloak < keycloak-backup-20241120.sql
```

### Volume-Backup (komplettes Backup)

```bash
# Volume sichern
docker run --rm \
  -v debate_server_keycloak_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/keycloak-data-backup.tar.gz -C /data .

# Volume wiederherstellen
docker run --rm \
  -v debate_server_keycloak_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/keycloak-data-backup.tar.gz -C /data
```

## 🗑️ Daten komplett löschen (Fresh Start)

Falls Sie von vorne anfangen möchten:

```bash
# Container stoppen
docker-compose down

# Volumes löschen
docker volume rm debate_server_keycloak_data

# Neu starten (mit leerer Datenbank)
docker-compose up -d
```

**Achtung:** Dies löscht ALLE Keycloak-Daten!

## 📊 Datenbank-Details

- **Image:** PostgreSQL 16
- **Datenbank:** keycloak
- **User:** keycloak
- **Password:** keycloak
- **Port:** 5432 (intern, nicht exposed)
- **Volume:** keycloak_data

### Direkter Zugriff auf die Datenbank

```bash
# PostgreSQL Shell öffnen
docker exec -it debate-keycloak-db psql -U keycloak -d keycloak

# Tabellen anzeigen
\dt

# Realms anzeigen
SELECT id, name, enabled FROM realm;

# Clients anzeigen
SELECT client_id, name, enabled FROM client;

# Users anzeigen
SELECT username, email, enabled FROM user_entity;

# Beenden
\q
```

## 🔄 Migration von dev-mem zu PostgreSQL

Falls Sie bereits Konfigurationen haben:

### Option 1: Export/Import (empfohlen)

```bash
# 1. Export von der alten Keycloak-Instanz
docker exec -it debate-keycloak /opt/keycloak/bin/kc.sh export \
  --dir /tmp/keycloak-export \
  --realm debate

# 2. Export-Dateien kopieren
docker cp debate-keycloak:/tmp/keycloak-export ./keycloak-export

# 3. Container mit neuer Konfiguration starten
docker-compose down
docker-compose up -d

# 4. Warten bis Keycloak bereit ist
sleep 60

# 5. Import in neue Instanz
docker cp ./keycloak-export debate-keycloak:/tmp/
docker exec -it debate-keycloak /opt/keycloak/bin/kc.sh import \
  --dir /tmp/keycloak-export
```

### Option 2: Manuell neu konfigurieren

Folgen Sie einfach der QUICKSTART.md erneut.

## 🏗️ Production Hinweise

Für Production empfehlen wir:

1. **Externe PostgreSQL-Datenbank** verwenden
2. **Regelmäßige Backups** einrichten
3. **Starke Passwörter** für DB verwenden
4. **SSL/TLS** für Keycloak aktivieren
5. **Ressourcen-Limits** setzen:

```yaml
keycloak:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G
```

## 📈 Monitoring

### Container-Status überwachen

```bash
# Alle Services prüfen
docker-compose ps

# Logs ansehen
docker-compose logs keycloak
docker-compose logs keycloak-db

# Ressourcen-Nutzung
docker stats debate-keycloak debate-keycloak-db
```

### Datenbank-Größe prüfen

```bash
docker exec debate-keycloak-db psql -U keycloak -c "
  SELECT pg_size_pretty(pg_database_size('keycloak')) as database_size;
"
```

## ❓ Troubleshooting

### Problem: Keycloak startet nicht

**Lösung:**
```bash
# Logs prüfen
docker-compose logs keycloak

# PostgreSQL läuft?
docker-compose ps keycloak-db

# PostgreSQL Logs
docker-compose logs keycloak-db
```

### Problem: "Waiting for database connection"

**Lösung:** PostgreSQL braucht noch etwas Zeit
```bash
# Warten Sie 30-60 Sekunden
# Oder prüfen Sie manuell:
docker exec debate-keycloak-db pg_isready -U keycloak
```

### Problem: Port 5432 bereits belegt

**Lösung:** Sie haben bereits PostgreSQL lokal laufen
```bash
# Entweder lokales PostgreSQL stoppen
# Oder Port in docker-compose.yml ändern (nicht nötig, Port ist intern)
```

## ✅ Zusammenfassung

- ✅ Keycloak Daten sind jetzt **persistent**
- ✅ PostgreSQL 16 als Datenbank
- ✅ Automatische Health Checks
- ✅ Volume-basierte Datenspeicherung
- ✅ Einfache Backups möglich
- ✅ Production-ready Setup

**Ihre Einstellungen bleiben jetzt erhalten! 🎉**

