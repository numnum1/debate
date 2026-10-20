# Keycloak Selbstregistrierung aktivieren

## 🎯 Problem
Die App zeigt die Fehlermeldung "Registrierung nicht erlaubt" oder die Registrierungsseite wird nicht angezeigt.

## ✅ Lösung: Selbstregistrierung in Keycloak aktivieren

### Schritt 1: Keycloak Admin Console öffnen

```
http://localhost:8180/admin
```

### Schritt 2: Zum Realm "debate" wechseln

1. Klicken Sie oben links auf den Realm-Dropdown
2. Wählen Sie **"debate"**

### Schritt 3: Selbstregistrierung aktivieren

1. Gehen Sie zu **Realm Settings** (linkes Menü)
2. Klicken Sie auf den Tab **"Login"**
3. Aktivieren Sie folgende Optionen:

```
┌─────────────────────────────────────────────┐
│ User registration:        [ON]  ✓           │  ← WICHTIG!
│ Forgot password:          [ON]  ✓           │  (Optional)
│ Remember me:              [ON]  ✓           │  (Optional)
│ Verify email:             [OFF]             │  (Nur mit E-Mail)
│ Login with email:         [ON]  ✓           │  (Empfohlen)
│ Duplicate emails:         [OFF]             │
└─────────────────────────────────────────────┘
```

4. Klicken Sie auf **"Save"** am unteren Rand

### Schritt 4: (Optional) E-Mail-Verifizierung einrichten

Falls Sie E-Mail-Verifizierung aktivieren möchten:

1. Gehen Sie zu **Realm Settings** → **Email** Tab
2. Konfigurieren Sie Ihren SMTP-Server:

```
Host: smtp.gmail.com  (Beispiel für Gmail)
Port: 587
From: noreply@yourdomain.com
Enable SSL: OFF
Enable StartTLS: ON
Enable Authentication: ON
Username: your-email@gmail.com
Password: your-app-password
```

3. Testen Sie die Konfiguration mit **"Test connection"**
4. Aktivieren Sie dann **"Verify email"** im Login Tab

## 🧪 Testen

### In der App:

1. Starten Sie die App: `npm start`
2. Klicken Sie auf **"Jetzt registrieren"**
3. Sie sollten zur Keycloak-Registrierungsseite weitergeleitet werden
4. Füllen Sie das Formular aus
5. Nach erfolgreicher Registrierung werden Sie automatisch eingeloggt

### Manuell in Keycloak testen:

Öffnen Sie direkt die Registrierungsseite:
```
http://localhost:8180/realms/debate/protocol/openid-connect/registrations?client_id=debate-client&response_type=code&scope=openid%20profile%20email&redirect_uri=http://localhost:8082
```

## 🔒 Sicherheitseinstellungen (Optional)

### Passwort-Richtlinien setzen

1. **Realm Settings** → **Authentication** → **Policies** Tab
2. **Password Policy**: Wählen Sie Richtlinien aus:
   - Minimum Length (z.B. 8)
   - At least one uppercase character
   - At least one lowercase character
   - At least one digit
   - At least one special character

Beispiel-Policy:
```
length(8) and upperCase(1) and lowerCase(1) and digits(1) and specialChars(1)
```

### Brute-Force-Schutz aktivieren

1. **Realm Settings** → **Security Defenses** → **Brute Force Detection** Tab
2. **Enabled**: ON
3. Konfigurieren Sie:
   - Max Login Failures: 5
   - Wait Increment: 60 seconds
   - Max Wait: 15 minutes
   - Failure Reset Time: 12 hours

## 📋 Registrierungsfelder anpassen

Falls Sie zusätzliche Felder bei der Registrierung benötigen:

1. **User Federation** → **User Registration**
2. Oder verwenden Sie **Required Actions** für zusätzliche Profile-Updates nach der Registrierung

## 🚫 Häufige Probleme

### Problem: "User registration is not allowed"

**Lösung:** 
- Überprüfen Sie, ob **User registration** auf **ON** steht
- Klicken Sie auf **Save** nach der Änderung
- Versuchen Sie es erneut

### Problem: Registrierungsseite zeigt Fehler

**Lösung:**
- Überprüfen Sie die **Valid Redirect URIs** im Client:
  ```
  exp://localhost:8082/*
  http://localhost:8082/*
  ```
- Stellen Sie sicher, dass der Client **Public** ist (Client authentication: OFF)

### Problem: E-Mail-Verifizierung funktioniert nicht

**Lösung:**
- SMTP muss korrekt konfiguriert sein
- Testen Sie die Verbindung in Realm Settings → Email
- Für Gmail: Verwenden Sie ein App-Passwort, nicht Ihr normales Passwort

## ✨ Erweiterte Optionen

### Selbst-Registrierung mit zusätzlichen Attributen

Sie können benutzerdefinierte Attribute zur Registrierung hinzufügen:

1. **Realm Settings** → **User Profile** (Keycloak 21+)
2. Fügen Sie benutzerdefinierte Attribute hinzu
3. Markieren Sie sie als "Required" oder "Optional"

### Registrierung nur für bestimmte Domains

Verwenden Sie **Authentication** → **Flows** um Custom Authenticators zu erstellen, die nur bestimmte E-Mail-Domains erlauben.

## 🎉 Fertig!

Nach diesen Schritten sollte die Selbstregistrierung in Ihrer App funktionieren!

## 📞 Support

Falls Probleme auftreten:
1. Überprüfen Sie die Keycloak Server Logs
2. Überprüfen Sie die Browser Developer Console
3. Testen Sie die Registrierung direkt in Keycloak (ohne App)

