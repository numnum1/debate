# 🚀 Schnellstart - Debate App mit Keycloak

## In 3 Minuten einsatzbereit!

### Schritt 1: Keycloak Client konfigurieren ⚙️

1. Öffnen Sie: `http://localhost:8180/admin`
2. Gehen Sie zu **Clients** → **debate-client**
3. **Aktivieren Sie:** ✅ **Direct access grants**
4. Klicken Sie auf **Save**

### Schritt 2: Test-Benutzer anlegen 👤

1. Gehen Sie zu **Users** → **Add user**
2. Füllen Sie aus:
   - Username: `test`
   - Email: `test@example.com`
   - Email verified: `ON`
   - Enabled: `ON`
3. **Create** → Dann Tab **"Credentials"**
4. **Set password:**
   - Password: `test123`
   - Temporary: `OFF`
5. **Save**

### Schritt 3: App starten 🎉

```bash
npm start
```

### Schritt 4: Anmelden ✓

- Email: `test@example.com`
- Passwort: `test123`

**Fertig!** Sie sollten jetzt in der App sein.

---

## 🐛 Probleme?

### "Unauthorized" Error
→ **Direct access grants** in Client aktivieren!

### "Invalid grant"
→ Passwort falsch oder Benutzer nicht enabled

### CORS Error
→ **Web Origins** in Client auf `*` setzen

---

## 📚 Weitere Dokumentation

- **Vollständige Anleitung:** `docs/KEYCLOAK_DIRECT_ACCESS.md`
- **Keycloak Setup:** `docs/KEYCLOAK_SETUP.md`

---

**Viel Erfolg! 🎉**

