#!/bin/bash

# Script zum Upgrade auf persistente Keycloak-Konfiguration

echo "=== Keycloak Persistence Upgrade ==="
echo ""
echo "Dieses Script aktualisiert Ihre Keycloak-Installation von"
echo "In-Memory (dev-mem) auf PostgreSQL mit persistenten Daten."
echo ""

# Warnung
echo "⚠️  WICHTIG:"
echo "- Alle bestehenden Keycloak-Einstellungen gehen verloren!"
echo "- Realm, Clients, User müssen neu erstellt werden"
echo "- Oder Sie exportieren vorher Ihre Konfiguration"
echo ""

read -p "Möchten Sie fortfahren? (ja/nein): " confirm

if [ "$confirm" != "ja" ]; then
    echo "Abgebrochen."
    exit 0
fi

echo ""
echo "Schritt 1: Container stoppen..."
docker-compose down

echo ""
echo "Schritt 2: Alte Keycloak-Daten entfernen (falls vorhanden)..."
docker volume rm debate_server_keycloak_data 2>/dev/null || true

echo ""
echo "Schritt 3: Neue Container mit PostgreSQL starten..."
docker-compose up -d

echo ""
echo "Schritt 4: Warten bis Services bereit sind..."
echo "Dies kann 1-2 Minuten dauern..."

# Warte auf PostgreSQL
echo -n "PostgreSQL wird gestartet"
for i in {1..30}; do
    if docker exec debate-keycloak-db pg_isready -U keycloak >/dev/null 2>&1; then
        echo " ✅"
        break
    fi
    echo -n "."
    sleep 2
done

# Warte auf Keycloak
echo -n "Keycloak wird gestartet"
for i in {1..60}; do
    if curl -s http://localhost:8180/health/ready >/dev/null 2>&1; then
        echo " ✅"
        break
    fi
    echo -n "."
    sleep 2
done

echo ""
echo "=== Upgrade abgeschlossen! ==="
echo ""
echo "✅ Keycloak läuft jetzt mit PostgreSQL"
echo "✅ Alle zukünftigen Einstellungen bleiben erhalten"
echo ""
echo "Nächste Schritte:"
echo "1. Keycloak Admin Console öffnen: http://localhost:8180"
echo "2. Login: admin / admin"
echo "3. Realm 'debate' erstellen"
echo "4. Client 'debate-server' konfigurieren"
echo "5. Test-User erstellen"
echo ""
echo "Siehe QUICKSTART.md für detaillierte Anleitung."
echo ""
echo "Services:"
docker-compose ps

