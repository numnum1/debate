# Backend

Spring Boot 4.1, Java 21. Starten und die übrigen Dienste: siehe [README im Repo-Root](../README.md#3-backend).

## Lokale Einstellungen

Geheimnisse wie das Onyx-Token gehören nicht in [application.yml](src/main/resources/application.yml), sondern in `src/main/resources/application-local.yml`. Die Datei steht in [.gitignore](.gitignore) und kommt nicht ins Git. `application.yml` bindet sie per `spring.config.import` ein, wenn es sie gibt, und ihre Werte überschreiben die aus `application.yml`. Weil sie über den Klassenpfad geladen wird, ist es egal, aus welchem Verzeichnis das Backend startet (IntelliJ oder `mvnw spring-boot:run`).

Gibt es die Datei noch nicht, lege sie so an:

```yaml
debate:
  ai:
    onyx:
      api-key: hier-das-token
```

Statt der Datei geht auch die Umgebungsvariable `ONYX_API_KEY`. Steht der Wert in beiden, gewinnt die Datei.

## KI im Chat (Onyx)

Wer im Chat `@grok …`, `@gpt …`, `@claude …` oder `@gemma …` schreibt, bekommt eine öffentliche Antwort der KI (Entscheidung in [ARCHITEKTUR.md](../docs/v2/ARCHITEKTUR.md)). Unser Backend ruft dafür Onyx headless unter http://localhost:3001 auf. Welcher Name welches Modell meint, steht unter `debate.ai.models` in [application.yml](src/main/resources/application.yml); Anbieter und Modellname müssen zu der Einrichtung in Onyx passen.

**Ohne Token antwortet eine Attrappe** mit einem festen Testtext. Für echte Antworten braucht das Backend ein Token von Onyx:

- **Nicht der Key des LLM-Anbieters.** Den Anbieter-Key (z. B. von EECC) trägst du in der Onyx-Admin-Oberfläche beim Anbieter ein; er bleibt in Onyx. Das Token hier ist der Zugang unseres Backends zu Onyx.
- **Kein Service-Account-Key.** Die gibt es in der kostenlosen Community Edition nicht (Business-Stufe). Wir nehmen ein **persönliches Access Token**, beschränkt auf das Recht `write:chat`: Es darf nur Fragen stellen, nichts verwalten.

### Token anlegen

Die Onyx-Oberfläche blendet Access Tokens bei selbst gehostetem Onyx aus, die API dafür funktioniert aber.

1. Onyx mit Admin-Oberfläche starten (`start-dev.cmd -Admin`), http://localhost:3000 öffnen und anmelden.
2. Mit F12 die Entwicklertools öffnen und in den Tab „Console“ wechseln. Chrome verlangt beim ersten Einfügen, dass du `allow pasting` tippst.
3. Einfügen und Enter drücken:

   ```js
   await fetch('/api/user/pats', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ name: 'debate-backend', expiration_days: 365, scopes: ['write:chat'] }),
   }).then((r) => r.json())
   ```

4. Das Feld `token` aus der Antwort kopieren; Onyx zeigt es nur dieses eine Mal.
5. Das Token in `application-local.yml` eintragen (siehe [Lokale Einstellungen](#lokale-einstellungen)) und das Backend neu starten. Beim Start ohne Token steht im Log die Warnung „Kein Onyx-API-Key gesetzt“.

### Was Onyx außerdem braucht

- **LLM-Anbieter mit den Modellen** aus `debate.ai.models`, eingerichtet in der Admin-Oberfläche.
- **Websuche (optional):** Ohne einen Websuche-Anbieter in Onyx (z. B. Brave oder Serper) antwortet die KI ohne Quellen. Welche Tools sie nutzen darf, legt `debate.ai.onyx.tool-ids` fest (IDs aus der Onyx-Tabelle `tool`, im Moment Websuche und „URL öffnen“).
