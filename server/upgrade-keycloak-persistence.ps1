# PowerShell Script zum Upgrade auf persistente Keycloak-Konfiguration

Write-Host "`n=== Keycloak Persistence Upgrade ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "Dieses Script aktualisiert Ihre Keycloak-Installation von"
Write-Host "In-Memory (dev-mem) auf PostgreSQL mit persistenten Daten."
Write-Host ""

# Warnung
Write-Host "⚠️  WICHTIG:" -ForegroundColor Red
Write-Host "- Alle bestehenden Keycloak-Einstellungen gehen verloren!"
Write-Host "- Realm, Clients, User müssen neu erstellt werden"
Write-Host "- Oder Sie exportieren vorher Ihre Konfiguration"
Write-Host ""

$confirm = Read-Host "Möchten Sie fortfahren? (ja/nein)"

if ($confirm -ne "ja") {
    Write-Host "Abgebrochen." -ForegroundColor Yellow
    exit 0
}

Write-Host "`nSchritt 1: Container stoppen..." -ForegroundColor Cyan
docker-compose down

Write-Host "`nSchritt 2: Alte Keycloak-Daten entfernen (falls vorhanden)..." -ForegroundColor Cyan
docker volume rm debate_server_keycloak_data 2>$null

Write-Host "`nSchritt 3: Neue Container mit PostgreSQL starten..." -ForegroundColor Cyan
docker-compose up -d

Write-Host "`nSchritt 4: Warten bis Services bereit sind..." -ForegroundColor Cyan
Write-Host "Dies kann 1-2 Minuten dauern..."

# Warte auf PostgreSQL
Write-Host "PostgreSQL wird gestartet" -NoNewline
for ($i = 1; $i -le 30; $i++) {
    try {
        $result = docker exec debate-keycloak-db pg_isready -U keycloak 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✅" -ForegroundColor Green
            break
        }
    } catch {}
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
}

# Warte auf Keycloak
Write-Host "`nKeycloak wird gestartet" -NoNewline
for ($i = 1; $i -le 60; $i++) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8180/health/ready" -TimeoutSec 1 -UseBasicParsing 2>$null
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅" -ForegroundColor Green
            break
        }
    } catch {}
    Write-Host "." -NoNewline
    Start-Sleep -Seconds 2
}

Write-Host "`n`n=== Upgrade abgeschlossen! ===" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Keycloak läuft jetzt mit PostgreSQL" -ForegroundColor Green
Write-Host "✅ Alle zukünftigen Einstellungen bleiben erhalten" -ForegroundColor Green
Write-Host ""
Write-Host "Nächste Schritte:" -ForegroundColor Yellow
Write-Host "1. Keycloak Admin Console öffnen: http://localhost:8180"
Write-Host "2. Login: admin / admin"
Write-Host "3. Realm 'debate' erstellen"
Write-Host "4. Client 'debate-server' konfigurieren"
Write-Host "5. Test-User erstellen"
Write-Host ""
Write-Host "Siehe QUICKSTART.md für detaillierte Anleitung."
Write-Host ""
Write-Host "Services:" -ForegroundColor Cyan
docker-compose ps

