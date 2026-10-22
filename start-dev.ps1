<#
.SYNOPSIS
  Startet die lokale Docker-Umgebung: Infrastruktur (Postgres, MongoDB, Keycloak, DB-Oberflächen) und Onyx Lite.
  Was schon läuft, bleibt unangetastet; nur fehlende oder gestoppte Dienste werden gestartet.
  Backend und Frontend startest du danach selbst (siehe Ausgabe am Ende).

.PARAMETER Rebuild
  Container neu aufsetzen: stoppt und entfernt alle Container, holt die Images neu und erstellt alles frisch.
  Daten in den Volumes bleiben erhalten. Standard: aus.

.PARAMETER Admin
  Startet zusätzlich die Onyx-Admin-Oberfläche (web_server + nginx) unter http://localhost:3000,
  z. B. zum Einrichten von LLM-Anbieter, API-Key und Agents. Ohne -Admin wird sie nicht gestartet,
  läuft sie bereits, bleibt sie aber laufen. Standard: aus.

.EXAMPLE
  .\start-dev.ps1
  .\start-dev.ps1 -Admin
  .\start-dev.ps1 -Rebuild -Admin
#>
param(
	[switch]$Rebuild,
	[switch]$Admin
)

$ErrorActionPreference = 'Stop'

$infraCompose = Join-Path $PSScriptRoot 'infra\docker-compose.yml'
$onyxCompose = Join-Path $PSScriptRoot 'infra\onyx\docker-compose.yml'
$onyxSource = Join-Path $PSScriptRoot 'onyx-main\deployment\docker_compose\docker-compose.yml'

function Invoke-Compose([string]$File, [string[]]$Arguments) {
	& docker compose -f $File @Arguments
	if ($LASTEXITCODE -ne 0) {
		throw "docker compose $($Arguments -join ' ') ist fehlgeschlagen ($File)"
	}
}

function Test-AllServicesRunning([string]$File, [string[]]$ProfileArgs) {
	$ErrorActionPreference = 'Continue'
	$services = @(& docker compose -f $File @ProfileArgs config --services 2> $null)
	$running = @(& docker compose -f $File ps --status running --services 2> $null)
	$missing = @($services | Where-Object { $running -notcontains $_ })
	return $services.Count -gt 0 -and $missing.Count -eq 0
}

function Start-Compose([string]$Name, [string]$File, [string[]]$UpArgs, [string[]]$ProfileArgs = @()) {
	if (-not $Rebuild -and (Test-AllServicesRunning $File $ProfileArgs)) {
		Write-Host "$Name läuft bereits, nichts zu tun." -ForegroundColor Green
		return
	}
	Write-Host "Starte $Name ..." -ForegroundColor Cyan
	Invoke-Compose $File ($ProfileArgs + $UpArgs)
}

function Test-DockerRunning {
	# Native stderr umleiten erzeugt in Windows PowerShell sonst einen Fehler, deshalb lokal 'Continue'
	$ErrorActionPreference = 'Continue'
	docker info *> $null
	return $LASTEXITCODE -eq 0
}

function Wait-Http([string]$Name, [string]$Url, [int]$TimeoutSeconds = 180) {
	$deadline = (Get-Date).AddSeconds($TimeoutSeconds)
	while ((Get-Date) -lt $deadline) {
		try {
			$response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
			if ($response.StatusCode -eq 200) {
				Write-Host "  $Name ist bereit." -ForegroundColor Green
				return
			}
		} catch {
			# noch nicht erreichbar
		}
		Start-Sleep -Seconds 3
	}
	throw "$Name antwortet nach $TimeoutSeconds s nicht unter $Url"
}

# --- Docker Desktop -----------------------------------------------------------
if (-not (Test-DockerRunning)) {
	Write-Host 'Docker Desktop läuft nicht, starte es ...' -ForegroundColor Yellow
	Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
	$deadline = (Get-Date).AddMinutes(3)
	while (-not (Test-DockerRunning)) {
		if ((Get-Date) -gt $deadline) { throw 'Docker Desktop ist nach 3 Minuten nicht bereit.' }
		Start-Sleep -Seconds 5
	}
	Write-Host '  Docker ist bereit.' -ForegroundColor Green
}

$withOnyx = Test-Path $onyxSource
if (-not $withOnyx) {
	Write-Warning "onyx-main/ fehlt, Onyx wird übersprungen (siehe README, Abschnitt Onyx)."
}

# --- Neu aufsetzen ------------------------------------------------------------
if ($Rebuild) {
	$upArgs = @('up', '-d', '--wait', '--pull', 'always', '--force-recreate')
} else {
	# Laufende Container nie neu erstellen, auch wenn sich die Compose-Datei geändert hat
	$upArgs = @('up', '-d', '--wait', '--no-recreate')
}

if ($Rebuild) {
	Write-Host 'Rebuild: entferne alle Container (Volumes bleiben) ...' -ForegroundColor Yellow
	Invoke-Compose $infraCompose @('down', '--remove-orphans')
	if ($withOnyx) {
		# --profile * erfasst auch die in Lite abgeschalteten Onyx-Dienste
		Invoke-Compose $onyxCompose @('--profile', '*', 'down', '--remove-orphans')
	}
}

# --- Starten ------------------------------------------------------------------
Start-Compose 'Infrastruktur (Postgres, MongoDB, Keycloak)' $infraCompose $upArgs
if ($withOnyx) {
	if ($Admin) {
		Start-Compose 'Onyx Lite mit Admin-Oberfläche' $onyxCompose $upArgs @('--profile', 'admin-ui')
	} else {
		Start-Compose 'Onyx Lite' $onyxCompose $upArgs
	}
}

Write-Host 'Warte auf Dienste ...' -ForegroundColor Cyan
Wait-Http 'Keycloak' 'http://localhost:8180/realms/debate/.well-known/openid-configuration'
if ($withOnyx) {
	Wait-Http 'Onyx-API' 'http://localhost:3001/health'
	if ($Admin) {
		Wait-Http 'Onyx-Admin-Oberfläche' 'http://localhost:3000/'
	}
}

Write-Host ''
Write-Host 'Docker-Umgebung läuft:' -ForegroundColor Green
Write-Host '  Keycloak       http://localhost:8180   (Admin: admin / admin, Testnutzer: admin, alice, bob, carol, dave, erin, frank, grace / dev)'
Write-Host '  PostgreSQL     localhost:5433          (debate / debate, DB ledger)'
Write-Host '  MongoDB        localhost:27017         (debate / debate)'
Write-Host '  Mongo Express  http://localhost:8081'
Write-Host '  Adminer        http://localhost:8082'
if ($withOnyx) {
	Write-Host '  Onyx-API       http://localhost:3001'
	if ($Admin) {
		Write-Host '  Onyx-Admin     http://localhost:3000'
	}
}
Write-Host ''
Write-Host 'Jetzt Backend und Frontend starten, je in einem eigenen Terminal:'
Write-Host '  cd backend; .\mvnw.cmd spring-boot:run'
Write-Host '  cd web; npm run dev                      -> http://localhost:5173'
