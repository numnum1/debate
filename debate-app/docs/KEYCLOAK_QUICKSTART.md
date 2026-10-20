# Keycloak Quick Start Guide

Schnellstart-Anleitung für die Keycloak-Integration in 5 Minuten.

## 🚀 Schnellstart (Entwicklung)

### Schritt 1: Keycloak Server starten

```bash
docker run -p 8080:8080 \
  -e KEYCLOAK_ADMIN=admin \
  -e KEYCLOAK_ADMIN_PASSWORD=admin \
  quay.io/keycloak/keycloak:latest \
  start-dev
```

### Schritt 2: Realm und Client erstellen

1. Öffnen Sie `http://localhost:8080/admin`
2. Login mit `admin` / `admin`
3. Erstellen Sie einen neuen Realm: **debate-app**
4. Erstellen Sie einen neuen Client:
   - Client ID: `debate-app-mobile`
   - Client authentication: `OFF` (Public Client)
   - Standard flow: `ON`
   - Valid Redirect URIs: `exp://localhost:8082/*`

### Schritt 3: App konfigurieren

```bash
# .env Datei erstellen
cp .env.example .env

# Dependencies installieren
npm install

# App starten
npm start
```

### Schritt 4: Testen

1. Öffnen Sie die App in Expo Go oder einem Simulator
2. Klicken Sie auf "Anmelden"
3. Sie werden zu Keycloak weitergeleitet
4. Registrieren Sie einen neuen Benutzer oder melden Sie sich an

## ✅ Fertig!

Die App ist jetzt mit Keycloak verbunden. Für detaillierte Konfiguration siehe [KEYCLOAK_SETUP.md](./KEYCLOAK_SETUP.md)

## 🔧 Wichtige URLs

- **Keycloak Admin Console:** http://localhost:8080/admin
- **Keycloak Account Console:** http://localhost:8080/realms/debate-app/account
- **OpenID Configuration:** http://localhost:8080/realms/debate-app/.well-known/openid-configuration

## 🐛 Häufige Probleme

**App öffnet Keycloak, aber kehrt nicht zurück:**
- Redirect URI in Keycloak überprüfen
- Muss exakt `exp://localhost:8082/*` sein

**"Cannot connect to server":**
- Ist Keycloak Server gestartet?
- Für Android Emulator: `10.0.2.2` statt `localhost` verwenden

**"Invalid client":**
- Client ID in `.env` muss mit Keycloak übereinstimmen
- Client muss als Public Client konfiguriert sein

## 📚 Weitere Dokumentation

- [Vollständige Setup-Anleitung](./KEYCLOAK_SETUP.md)
- [Keycloak Dokumentation](https://www.keycloak.org/documentation)
- [Expo Auth Session](https://docs.expo.dev/versions/latest/sdk/auth-session/)

