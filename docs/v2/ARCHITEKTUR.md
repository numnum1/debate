# v2 – Architektur (Entwurf)

Stand 2026-10-22 · Status: **Entwurf zur Diskussion, noch kein Code.**

Grundlage: [PRODUKT.md](PRODUKT.md). Lehren aus dem ersten Versuch: [../KERN.md](../KERN.md). Der alte Code (`debate-app/`, `server/`) bleibt als Referenz, v2 wird neu aufgesetzt.

## Entscheidungen

| Datum | Entscheidung |
|---|---|
| 2026-10-22 | **KI-Aufgaben laufen über das Backend von [Onyx](https://github.com/onyx-dot-app/onyx)** (selbst gehostet, MIT Community Edition). Die Onyx-UI wird nicht verwendet. Unser Backend ruft Onyx headless mit einem Token auf (seit 2026-10-23 ein persönliches Access Token, siehe dort). Siehe [Onyx als KI-Backend](#onyx-als-ki-backend). |
| 2026-10-22 | **Keycloak** für Identität und Login, **MongoDB** für Nutzerprofile (Vorschlag von Marc, Bewertung siehe [Identität und Nutzerdaten](#identität-und-nutzerdaten)). |
| 2026-10-22 | **Backend in Java**, **Frontend in React**. |
| 2026-10-22 | **Zunächst nur eine Webseite**, keine native App. |
| 2026-10-22 | **MongoDB** für Nutzer, Debatten, Regelwerke und Zeitachse, **PostgreSQL** für Ledger, Märkte und Pools. Eine kurz erwogene Variante „alles in Mongo" ist verworfen. Begründung siehe [Ledger und Markt in PostgreSQL](#ledger-und-markt-in-postgresql). |
| 2026-10-22 | **Der POC arbeitet nur mit Punkten, kein echtes Geld.** Damit entfallen im POC Zahlungsanbieter, Ein- und Auszahlung, KYC, Geofencing und Einsatzlimits nach Glücksspielrecht. Das Ledger hat trotzdem ein Währungsfeld (`POINTS`), damit Phase 2 kein Umbau wird. |
| 2026-10-22 | **UI mit Tailwind CSS + shadcn/ui.** Die Komponenten liegen als eigener Code im Repo, so lassen sich Sonderelemente wie Marktbalken und Jury-Slider frei bauen. Mantine und MUI sind verworfen. |
| 2026-10-22 | **Der POC wird nur für Desktop gestaltet.** Ein Mobile-Layout ist für den POC nicht nötig. |
| 2026-10-22 | **Stil: hell und sachlich**, wie eine Nachrichtenseite. |
| 2026-10-22 | **Die klickbaren Wireframes entstehen direkt in `web/`** (Router, Mock-Daten, ungestylte Platzhalter), damit Layout und Routen in die Umsetzung übergehen. |
| 2026-10-22 | **Zwei Einstiege:** Die **Landing Page** (`/`, auch ohne Anmeldung) ist ein Explorer mit wenigen promoteten Debatten, laufenden Debatten, einer Liste weiterer Debatten und einem schwebenden Mini-Player unten links; Anmelden/Registrieren oben rechts. Die **Home-Seite** (`/home/:debatte`) hat links eine Leiste wie in Claude Code mit allen Debatten, an denen man teilnimmt (egal in welcher Rolle); rechts steht die aktuelle Debatte, je nach Rolle als Zuschauer-Ansicht, Juror-Raum oder Host-Konsole. Erster Stand mit Mock-Daten, noch offen: wer promotet, ab wann eine Debatte „meine“ ist. |
| 2026-10-22 | **Nutzer haben keine festen Rollen.** Rollen gelten pro Debatte: Host, Debattierer (mit Team), Juror, Moderator, Resolver. Wer eine Debatte anlegt, ist ihr Host und vergibt die übrigen Rollen. Zuschauer ist keine vergebene Rolle, sondern der Normalfall. Global in Keycloak bleibt nur `admin` für den Plattformbetrieb; `platform_moderator` und `resolver` sind entfallen. |
| 2026-10-23 | **Debattierer sind nicht in der App.** Die Debatte findet ausschließlich auf Twitch, YouTube oder X statt; Debattierer stehen nur als Namen (Seite A, Seite B) in der Debatte und sind keine Nutzer. Die Rolle Debattierer (mit Team) entfällt. Vergebene Rollen pro Debatte sind damit Host, Juror, Moderator und Resolver. |
| 2026-10-23 | **Keine Wetten während der Debatte.** Hauptmarkt und Point Bets schließen zum **Wettschluss**, einer festen Zeit, die der Host beim Anlegen angibt (Vorschlag: Start − 30 Minuten). Sie gehört zum gesperrten Regelwerk und lässt sich danach weder vorziehen noch verlängern. Zwischen Wettschluss und Live-Start liegt die Phase **Vorlauf**; „Live“ setzt der Host per Hand. Point Bets werden während der Debatte nur noch aufgelöst. Damit ist offene Frage 3 beantwortet, und das Stornieren von Wetten im Stream-Delay entfällt. Weicht von PRODUKT.md ab („bets placed in the stream-delay window are voided“). |
| 2026-10-23 | **Chat:** eigener Live-Chat pro Debatte. **Senden per HTTP-POST, Empfangen per WebSocket** (STOMP, ein Topic pro Debatte). Der Server sammelt Nachrichten und verschickt sie im **Tick von 250 ms** als Paket; jeder nicht leere Tick bekommt pro Debatte die nächste Nummer, leere Ticks werden nicht gesendet. Clients erkennen Lücken an der Nummer und holen fehlende Ticks per HTTP nach. Moderationsaktionen laufen im selben Strom. Der Tick gilt vorerst nur für den Chat. Nachrichten werden **dauerhaft** in MongoDB (`chat_messages`) gespeichert. |
| 2026-10-23 | **Wer chattet:** Lesen darf jeder, auch ohne Anmeldung, außer Juroren der Debatte. Schreiben dürfen alle Angemeldeten außer Juroren und Stummgeschalteten, und zwar vom Wettschluss bis zum Ende von „Urteil läuft“; danach ist der Chat nur noch lesbar. Ausblenden und Stummschalten dürfen Host, Moderatoren und globale Admins. Hat jemand mehrere Rollen, gilt die strengste (Juror). Weil Chat und offener Markt sich zeitlich nie überschneiden und die Jury den Chat nicht sieht, hat der Chat keinen Einfluss auf Wetten oder Urteil. Keine automatischen Systemzeilen. Später geplant: Faktenchecks in Nachrichten verweisen, Farben je Rolle; ein Abzeichen mit der Seite der eigenen Wette kommt frühestens mit dem Markt. |
| 2026-10-23 | **Debatten und Rollen im Backend:** Collection `debates`, Rollen als Liste `{userId, role}` im Debatten-Dokument (wenige, wächst nicht unbegrenzt). Ein **Dev-Seed** im Profil `dev` legt Beispieldebatten mit Rollen und die Profile der Testnutzer an; die Testnutzer haben dafür feste IDs im Realm-JSON. |
| 2026-10-23 | **Debatte anlegen: Assistent in fünf Schritten** (Thema und Seiten, Stream und Zeiten, Regelwerk, Rollen, Zusammenfassung) unter `/home/neu`, erreichbar über „Neue Debatte“ in der Seitenleiste und „Debatte anlegen“ oben rechts; `POST /api/debates`. Wer anlegt, ist **Host** und kann in derselben Debatte **keine weitere Rolle** haben (Juror, Moderator, Resolver sind andere Personen). Die Debatte startet als `SCHEDULED`, die Adresse ergibt sich aus dem Thema (`neu` ist reserviert). Pflichtangaben sind Thema, beide Seiten (verschieden), Kategorie, Plattform samt passender https-Stream-Adresse, Start und Wettschluss (beide in der Zukunft, Wettschluss vor dem Start; Vorschlag Start − 30 Minuten). |
| 2026-10-23 | **Regelwerk im POC nur mit wenigen Einstellungen:** Template „Standard“ mit **Jurygröße** (3, 5 oder 7), **Evidenz** (geschlossen/offen) und **Point Bets** (aus/vorgegeben). Alles Übrige aus der Tabelle in PRODUKT.md steht fest im Template und wird noch nicht gespeichert. Das Regelwerk wird ungesperrt am Debatten-Dokument gespeichert (`ruleset.locked = false`); gesperrt wird es erst beim Öffnen der Wetten. Beim Anlegen dürfen weniger Juroren benannt sein als die Jury groß ist, vor dem Öffnen der Wetten müssen alle Plätze besetzt sein. |
| 2026-10-23 | **Rollen vergibt der Host per Nutzersuche** (`GET /api/users?q=`, Nutzername oder Anzeigename, ab zwei Zeichen, höchstens zehn Treffer, ohne E-Mail). Gesucht wird in den Profilen in MongoDB, also finden sich nur Nutzer, die sich schon einmal angemeldet haben. Eine Person kann mehrere Rollen haben (dann gilt im Chat die strengste); dieselbe Rolle doppelt ist nicht möglich. |
| 2026-10-23 | **KI im Chat, wie Grok auf X:** Wer `@name …` schreibt (irgendwo in der Nachricht, Groß-/Kleinschreibung egal), bekommt eine **öffentliche Antwort im Chat** als eigene Nachricht mit Abzeichen „KI“, Bezug auf die Frage und Quellen. Der Name wählt das Modell: `@grok` ist die Basis im POC (kostenlos nutzbar und bekannt), daneben z. B. `@gpt` und `@claude`; welche Version dahinter steht, legen wir in `debate.ai.models` fest. Pro Nachricht antwortet nur die erste genannte KI. Die KI bekommt **nur die Frage und die Eckdaten der Debatte** (Thema, Seiten, Plattform, Phase) und darf im Web suchen; den übrigen Chat und Nutzernamen bekommt sie nicht, die Regel „Chat geht nie an Onyx“ bleibt. Sie ergreift keine Partei und gibt keine Wetttipps. Grenzen: eine Frage an die KI je Nutzer und Debatte alle 30 Sekunden (auch für Host und Moderatoren), höchstens 4 Aufrufe gleichzeitig und 32 in der Warteschlange. Moderatoren können KI-Antworten ausblenden. Ohne Onyx-Token antwortet eine Attrappe. **Kann die KI nicht antworten** (Fehler oder Rate-Limit beim Anbieter, zu viele offene Fragen), verschwindet die Frage aus dem Chat (ausgeblendet mit `hiddenBy = system:ai-unavailable`, nicht gelöscht, damit sich Ticks nachholen lassen), und nur der Fragende sieht „Grok ist gerade nicht verfügbar“. Solche Hinweise an einzelne Nutzer laufen per WebSocket über `/user/queue/chat`, außerhalb der Ticks, und werden nicht gespeichert. |
| 2026-10-23 | **Zugang des Backends zu Onyx: persönliches Access Token** eines Onyx-Kontos mit dem Recht `write:chat`, angelegt über die Onyx-API (`/api/user/pats`), weil die Oberfläche es bei selbst gehostetem Onyx ausblendet. Service-Account-Keys bräuchten die Business-Stufe. Das Token darf nur Fragen stellen, nichts verwalten. Geheimnisse liegen lokal in `application-local.yml`, die `application.yml` optional einbindet und die nicht ins Git kommt. Ersetzt die Annahme „ein API-Key ist ein eigener Nutzer in Onyx“. |

## Was sich gegenüber dem ersten Versuch grundlegend ändert

Im ersten Versuch *fand die Debatte in der App statt* (Chat mit Positionen und Slots). In v2 findet die Debatte **woanders** statt (Twitch, YouTube, X). Die Plattform ist ein **Second Screen**: Sie hört mit, protokolliert, prüft, lässt wetten, lässt urteilen und rechnet ab. Daraus folgt: Der Kern ist nicht mehr ein Chat, sondern

1. eine **Zeitachse der Debatte** (was wurde wann gesagt, was ist passiert),
2. ein **Markt** mit **Ledger** (wer hält was, wer bekommt was),
3. eine **Jury** als Orakel (versiegelte Slider, Median),
4. ein fixiertes **Regelwerk**, das alle drei steuert.

Alles andere (Faktencheck, Spotlight, Profile, Bias-Check, Watch-along) sind Anreicherungen an der Zeitachse.

## Lebenszyklus

```
1 Setup ──▶ 2 Betting open ──▶ Vorlauf ──▶ 3 Live ──▶ 4 Verdict ──▶ 5 Settlement
   │        (Regelwerk gesperrt) (ab Wettschluss)                    (Geld/Punkte fließen)
   └──────────── Ausnahme: No-show / Walkout ──▶ Refund (+ Deposit verfällt)

Markt:  offen in 2, geschlossen ab Wettschluss
Chat:   schreibbar in Vorlauf, 3 und 4; danach nur lesbar
```

Entschieden (2026-10-23): Gewettet wird nur vor dem Wettschluss, einer festen Zeit vor dem Start. Der Hauptmarkt läuft während der Debatte nicht weiter; der Balken zeigt während des Streams den Stand beim Wettschluss. Den Übergang in den Vorlauf löst die Zeit aus, den Übergang zu „Live“ der Host.

## Leitprinzipien

1. **Ereignisbasierte Zeitachse.** Transkript-Segmente, Claims, Faktenchecks, Wetten, Votes, Moderationsaktionen sind unveränderliche Ereignisse mit *Medienzeit* (Position im Stream) und *Wanduhrzeit*. Protokoll, Quoten-Verlauf und Audit sind Projektionen daraus. Das macht Streitfälle nachvollziehbar und Replays möglich.
2. **Regelwerk als unveränderliches, versioniertes Dokument.** Template → Instanz → beim Öffnen der Wetten gesperrt (Hash gespeichert, öffentlich einsehbar). Jede Komponente liest nur das gesperrte Regelwerk, nie Einzel-Flags aus der Debatte.
3. **Sichtbarkeit (Audience) ist ein Datenfeld, kein UI-Detail.** Jedes Ereignis trägt, wer es sehen darf (`public`, `jurors`, `host`, `mods`, `resolver`). Durchgesetzt wird das serverseitig beim Ausliefern. Beispiele: Jurys sehen keine Quoten und keinen Chat; bei *closed evidence* sehen sie keine Faktenchecks, Notes und Spotlight; im *Blind-Jury-Modus* bekommen sie eine anonymisierte Projektion des Protokolls.
4. **KI ist beratend, nie auszahlungsentscheidend.** KI-Ausgaben sind Vorschläge mit Quellen. Was Geld bewegt (Point-Bet-Auflösung, Verdict), ist eine menschliche oder regelbasierte Entscheidung, die als eigenes Ereignis protokolliert wird.
5. **Ledger von Tag 1.** Doppelte Buchführung, nur anhängend, idempotent, mit Währungsfeld (`POINTS` jetzt, `USD` in Phase 2). Phase 1 nutzt exakt dieselbe Buchungslogik wie später Echtgeld, nur mit anderer Währung.
6. **Ein Kanal für Befehle, einer für Ereignisse.** Befehle per HTTP (Wette platzieren, Vote abgeben), Ereignisse per WebSocket/SSE an die Clients. Keine doppelten Wege (Lehre aus dem PoC).
7. **Domänenregeln an einer Stelle,** testbar ohne Infrastruktur (Lebenszyklus, Markt, Jury, Regelwerk als reine Domänenmodule).

## Komponenten

```
                ┌──────────────── externe Quellen ────────────────┐
                │ Twitch/YouTube (HLS)   X API   Web/Quellen      │
                └──────┬─────────────────┬──────────┬─────────────┘
                       │                 │          │
                 ┌─────▼─────┐     ┌─────▼────┐     │
                 │  Ingest   │     │ X-Ingest │     │
                 │ Audio→STT │     │ Threads, │     │
                 │ +Sprecher │     │ Spotlight│     │
                 └─────┬─────┘     └─────┬────┘     │
                       ▼                 ▼          ▼
                 ┌──────────────────────────────────────┐      ┌─────────────────────────┐
                 │   KI-Jobs (unser Worker + Queue)     │─API─▶│ Onyx (headless)         │
                 │   Claims · Einordnung Ereignis/Meinung│◀────│ Lite: Agents, Websuche, │
                 │   Faktencheck · Point-Bet-Erkennung  │      │ Quellenangaben          │
                 │   Bias-Metriken · Zusammenfassungen  │      └─────────────────────────┘
                 └──────────────────┬───────────────────┘
                                    ▼
  ┌────────────────────────── Kern (modularer Monolith) ───────────────────────────┐
  │ Debatte/Lebenszyklus · Regelwerk · Zeitachse · Markt · Pools · Jury · Ledger    │
  │ Chat/Moderation · Identität/Rollen · Integritätsregeln (wer darf wetten)       │
  └───────────────┬───────────────────────────────────────────┬────────────────────┘
                  │ HTTP (Befehle)                           │ WS/SSE (Ereignisse, nach Audience gefiltert)
           ┌──────▼──────┐  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐
           │ Viewer-App  │  │ Juror-Room  │  │ Host-Konsole│  │ Resolver/Mod │
           └─────────────┘  └─────────────┘  └─────────────┘  └──────────────┘
```

### Ingest und Zeit

- **Audio aus Livestreams:** HLS des Streams abgreifen (z. B. streamlink/yt-dlp → ffmpeg) und an einen Streaming-STT mit Sprechertrennung schicken (Deepgram, AssemblyAI o. ä.). Claude selbst verarbeitet kein Audio. *Risiko:* Plattform-ToS beim Mitschneiden; Alternative ist ein zusätzlicher RTMP-Push vom Host an uns.
- **Sprecherzuordnung:** STT liefert „Speaker 1/2/3", der Host (oder ein Resolver) ordnet zu Beginn einmal zu. Später ggf. automatisch per Stimmprofil.
- **Stream-Delay:** Zuschauer sehen den Stream mit Verzögerung, unser Ingest ebenfalls (anders). Für Wetten spielt das keine Rolle mehr, weil alle Wetten vor dem Start schließen (entschieden 2026-10-23). Für das Protokoll und das Auflösen von Point Bets bleibt die Medienzeit wichtig.
- **X-Textdebatten:** gleiche Zeitachse, nur ohne STT; Beiträge kommen per X-API-Polling. Kosten pro gelesenem Post beachten.

### Markt

- **Hauptmarkt (Slider-Markt):** A- und B-Anteile, A + B zahlen zusammen immer 100. Für Phase 1 (Punkte) ein **automatischer Market Maker** (LMSR oder Constant-Product), damit es immer einen Preis gibt, auch mit wenigen Nutzern. Die Plattform stellt die Liquidität (begrenzter, berechenbarer Verlust). Auszahlung: A = Slider, B = 100 − Slider.
- **Point Bets:** Parimutuel-Pools (Ja/Nein, Gewinner teilen den Topf minus Gebühr). Einfach, kein Market Maker nötig.
- **Konsistenz:** pro Markt ein einziger Schreiber (serialisierte Trades pro Markt, siehe [Ledger und Markt in PostgreSQL](#ledger-und-markt-in-postgresql)). Jeder Trade = Ledger-Buchung in derselben Transaktion.
- **Integritätsprüfung vor jedem Trade:** Rolle in dieser Debatte (Juror, Host, Resolver → gesperrt), Wettschluss, Einsatzlimits, Regelwerk-Status. Debattierer und ihre Teams haben keine Konten in der App; die Regel „Debattierer wetten nicht gegen sich selbst" lässt sich erst mit KYC (Phase 2) durchsetzen.

### Jury

- Juror-Room ist eine eigene Ansicht mit eigener, gefilterter Ereignis-Projektion.
- **Versiegelte Votes:** Für den POC reicht serverseitig versiegelt (nicht abrufbar, bis alle abgegeben haben oder die Frist abläuft). Optional später Commit-Reveal mit Hash, damit auch wir nachweislich nicht nachträglich ändern.
- Verdict = Median der Slider, als Ereignis protokolliert, löst Settlement aus.

### Ledger

- Konten: Nutzer-Wallet, Markt-Escrow je Markt, Pool-Escrow je Point Bet, Plattform-Gebühren, Market-Maker-Subvention, Deposits der Debattierer.
- Jede Buchung hat eine Idempotenz-Kennung (doppelte Requests buchen nicht doppelt).
- Refund-Pfade (No-show, Walkout, stornierte Delay-Wetten) sind normale Gegenbuchungen, nie Löschungen.

### Onyx als KI-Backend

Onyx läuft als **Onyx Lite** (entschieden 2026-10-22) eigenständig neben uns: nur API-Server, Onyx-Postgres, Admin-Oberfläche und nginx, zusammen unter 1 GB RAM. Ohne Suchindex, Model-Server, Redis und Hintergrund-Worker; MCP-Server und Code-Interpreter sind ebenfalls abgeschaltet. Chat, Agents und Tools wie die Websuche funktionieren in Lite vollständig. Endnutzer melden sich **nie** bei Onyx an; nur unser Backend spricht mit Onyx, über ein **persönliches Access Token** eines Onyx-Kontos, beschränkt auf das Recht `write:chat` (entschieden 2026-10-23). Service-Account-Keys, bei denen jeder Key ein eigener Nutzer in Onyx wäre, gibt es erst ab der Business-Stufe; Onyx sperrt `/admin/api-key` in der Community Edition. Das Token liegt lokal in `backend/src/main/resources/application-local.yml` (nicht im Git) oder in `ONYX_API_KEY`; Anleitung in [backend/README.md](../../backend/README.md#ki-im-chat-onyx). Den Key des LLM-Anbieters kennt nur Onyx, unser Backend nie. Damit stellt sich die Frage nach OIDC/SSO in Onyx nicht, die laut Doku teils Enterprise-Funktion ist.

**Was Onyx uns abnimmt:**
- **Agents (Personas)** mit eigenem Prompt und eigenen Tools, je Aufgabe einer: Claim-Extraktor, Faktenchecker, Zuschauer-Assistent, Juror-Assistent, Point-Bet-Vorschläge, Spotlight-Zusammenfassung, Profil-Autor. Das Sprachmodell (z. B. Claude) wird in Onyx konfiguriert.
- **Websuche** (Serper, Brave, Google PSE, SearXNG, Exa …) und Crawler für Faktenchecks und Profile.
- **Quellenangaben:** Antworten aus der Websuche kommen mit Zitaten. Das passt zur Regel „every line is sourced".

**Kontext ohne Suchindex:** Das Live-Protokoll einer Debatte (ein bis zwei Stunden) passt direkt in den Prompt. Unser Backend gibt dem Agenten bei jedem Aufruf den passenden Ausschnitt der Zeitachse mit, statt ihn in Onyx zu indexieren.

**Später, falls nötig (volles Onyx):** Für Profile und Quellen über viele frühere Debatten kann eine Suche über eigene Dokumente nützlich werden (Ingestion-API, Connectors mit Refresh-Intervall, Antworten mit Zitaten auf Dokumente). Dafür das Lite-Overlay aus `infra/onyx/docker-compose.yml` entfernen. Das ist auch in der Community Edition enthalten, eine Lizenz braucht es dafür nicht.

**Was bei uns bleibt:**
- **Zeitplanung und Queue der KI-Aufgaben.** Onyx hat keinen allgemeinen Job-Scheduler für externe Aufrufer. Unser Worker entscheidet, *wann* welche Aufgabe läuft (z. B. „neues Transkript-Segment → Claim-Extraktion", „Claim als Ereignis eingestuft → Faktencheck"), ruft Onyx auf (`/chat/send-chat-message`, Streaming-Pakete bis `OverallStop`) und schreibt das Ergebnis als Ereignis auf unsere Zeitachse.
- **Strukturierte Ausgabe:** Onyx liefert Text mit Zitaten. Wir fordern im Agent-Prompt JSON an und validieren es auf unserer Seite gegen ein Schema; bei Fehlern Retry, dann „Unverified".
- **Sichtbarkeit:** Quoten, Votes, Wetten und Chat kommen **nie** nach Onyx. Was ein Agent sehen darf, steuern wir beim Aufruf über den mitgegebenen Kontext (z. B. Juror-Assistent bei *closed evidence* ohne Faktenchecks und Notes).
- **Transkription:** Onyx macht kein Audio, STT bleibt ein eigener Dienst.
- **Protokollierung:** Zu jeder KI-Ausgabe speichern wir Agent-ID, Prompt-Version, Onyx-Version und Quellen (Nachvollziehbarkeit, Haftung für eigene „Speech").

**Risiken und Gegenmaßnahmen:**
- **Latenz:** Ein Agent-Lauf mit Suche und Reasoning dauert Sekunden. Für Point-Bet-Erkennung („closes the instant the AI detects") ist das kritisch. Für zeitkritische Aufgaben einen Agent ohne Tools verwenden und messen; notfalls diese eine Aufgabe direkt gegen das Sprachmodell.
- **API-Stabilität:** Onyx hat Chat-Endpunkte bereits einmal ersetzt (`send-message` → `send-chat-message`, Frist Anfang 2026). Deshalb: Onyx-Version pinnen und hinter einer eigenen Schnittstelle (`AiGateway`) kapseln, die nur unsere Aufgabenarten kennt.
- **Prompt-Größe:** Ohne Suchindex wächst der mitgegebene Kontext mit der Debatte. Für lange Debatten nur den relevanten Ausschnitt plus eine laufende Zusammenfassung mitgeben.

### Identität und Nutzerdaten

**Keycloak: passt.** Es ist aus dem ersten Versuch bekannt, spricht OIDC und kann Login über Twitch, Google, X usw. vorschalten. Das ist für ein Publikum, das von Streamern kommt, sehr nützlich. Das Problem aus dem PoC war das Realm-Setup von Hand. Lösung: Realm als JSON im Repo versionieren und beim Start importieren (`--import-realm`), damit jede Umgebung reproduzierbar ist.

**Aufteilung zwischen Keycloak und MongoDB:**

| Wo | Was |
|---|---|
| Keycloak | Login, Passwort, E-Mail, Social Logins; als **globale** Rolle nur `admin` (Plattformbetrieb) |
| MongoDB `users` | Profil, verknüpft über Keycloak-`sub`: Anzeigename, Avatar, verknüpfte Twitch/X-Konten, Trusted Rank, Juror-Reputation, Show-up-Rate, Einstellungen |
| MongoDB, je Debatte | **Debattenbezogene** Rollen (Host, Juror, Moderator, Resolver), vom Host vergeben – nicht in Keycloak, weil die Integritätsregeln („wer darf in *dieser* Debatte wetten") daran hängen und sie sich pro Debatte ändern |

Passwörter oder Tokens liegen nie in Mongo. Für Phase 2 kommt KYC über einen spezialisierten Anbieter dazu, dessen Prüfstatus am Profil gespeichert wird; das kann Keycloak nicht.

**MongoDB für Nutzer: passt.** Profile sind dokumentförmig und ändern sich oft. Das passt auch für Debatten, Regelwerke und die Ereignisse der Zeitachse, solange sie in **eigenen Collections** liegen und nicht in einem wachsenden Debatten-Dokument (Lehre aus dem PoC).

### Ledger und Markt in PostgreSQL

Entschieden: Ledger, Märkte und Pools liegen in Postgres, alles andere in Mongo.

**Warum:** Ein Ledger darf nie Punkte verlieren (Nutzer belastet, Topf nicht gutgeschrieben), nie Punkte erzeugen (zwei gleichzeitige Wetten geben mehr aus, als da ist), nie doppelt buchen und nie auf ein Konto buchen, das es nicht gibt. In Postgres garantiert das **die Datenbank**: Jede Änderung läuft in einer Transaktion, und Regeln stehen einmal im Schema und gelten für jeden, der schreibt, auch für neuen Code und Skripte von Hand. In Mongo ginge das auch, aber die Garantien lägen größtenteils in unserem Code, in jedem Pfad, der Punkte bewegt. Für Phase 2 mit echtem Geld ist eine relationale Datenbank für Buchungen außerdem das, was Prüfer erwarten.

**Regeln:**

1. **Buchungen werden nur angehängt** (`ledger_entry`): Soll- und Haben-Konto, Betrag, Währung, Bezug (Trade, Settlement, Refund). Nie ändern, nie löschen; Korrekturen sind Gegenbuchungen. Optional per Rechtevergabe absichern (die Anwendung darf auf `ledger_entry` kein `UPDATE`/`DELETE`).
2. **Salden** stehen in `account.balance` und werden in derselben Transaktion wie die Buchung fortgeschrieben, mit `CHECK (balance >= 0)` (außer bei Systemkonten wie der Market-Maker-Subvention). Ein Abgleich-Job rechnet sie regelmäßig aus den Buchungen nach.
3. **Idempotenz:** `UNIQUE (idempotency_key)` auf `ledger_entry`.
4. **Fremdschlüssel** von Buchungen auf Konten, von Trades auf Märkte.
5. **Ein Schreiber pro Markt:** Trade sperrt die Markt-Zeile (`SELECT … FOR UPDATE`), rechnet den Preis, bucht, gibt frei.
6. **Beträge als Ganzzahlen** (`bigint`, kleinste Einheit), Preise des Market Makers als `numeric` bzw. `BigDecimal`.
7. **Schema-Migrationen mit Flyway**, Zugriff über Spring Data JDBC oder jOOQ (kein schwergewichtiges ORM nötig).
8. **Hinter einer Schnittstelle:** Das Modul `ledger` bietet nur fachliche Operationen an (`reserve`, `transfer`, `settle`, `refund`). Kein anderes Modul greift direkt auf die Tabellen zu.

**Verbindung zu Mongo:** Buchungen verweisen auf Nutzer und Debatten nur per ID (Keycloak-`sub`, Debatten-ID). Es gibt keine Transaktion über beide Datenbanken. Was in Mongo passieren muss, nachdem in Postgres gebucht wurde (z. B. Ereignis „Wette platziert" auf der Zeitachse), läuft über ein Outbox-Muster: Das Ereignis wird in Postgres in derselben Transaktion vorgemerkt und danach zuverlässig nach Mongo bzw. an die Clients weitergegeben.

**Betrieb:** Für den POC ein Postgres-Container mit getrennten Datenbanken für `keycloak` und `ledger`. Onyx bringt seine eigene Postgres mit.

## Technologie-Vorschlag

| Bereich | Vorschlag | Begründung |
|---|---|---|
| Backend | **Java** (entschieden): Spring Boot 4.1, Java 21 (LTS, lokal installiert), Maven **mit Wrapper** (`mvnw`) | Bekannt aus dem ersten Versuch; Spring Security (Keycloak) und Spring Data (Mongo, JPA) liefen dort schon. Der fehlende Wrapper war im PoC eine Hürde |
| Modulgrenzen | Modularer Monolith mit **Spring Modulith**: Module `debate`, `ruleset`, `timeline`, `market`, `ledger`, `jury`, `chat`, `identity`, `ai` | Kein Microservice-Overhead im POC; Modulith prüft in Tests, dass Module nur über ihre öffentliche API und Events miteinander reden |
| Domäne | Reine Java-Klassen ohne Spring-Abhängigkeit (Lebenszyklus, Markt-Mathematik, Median, Regelwerk-Prüfung) | Ohne Infrastruktur testbar (Leitprinzip 7) |
| Frontend | **React** (entschieden) mit Vite und TypeScript, als Single-Page-App; **Tailwind CSS + shadcn/ui** (entschieden); Routing z. B. React Router, Server-State mit TanStack Query | Kein Next.js nötig, weil das Backend in Java läuft; Vite ist schlank |
| Vertrag Client ↔ Server | **OpenAPI aus Spring** (springdoc) → TypeScript-Client und -Typen generiert (z. B. orval oder openapi-typescript). Ereignis-Typen für WebSocket ebenfalls als Schemas in der OpenAPI-Spec | Ersetzt die geteilten Typen, die TypeScript auf beiden Seiten gegeben hätte. Kein Handabgleich von DTOs |
| Datenbank | **MongoDB** (Spring Data MongoDB) für Nutzer, Debatten, Regelwerke, Zeitachse · **PostgreSQL** (Flyway, Spring Data JDBC oder jOOQ) für Ledger, Märkte, Pools (entschieden) | Dokumente dort, wo sie passen; Transaktionen und Constraints dort, wo Punkte bzw. Geld fließen |
| Jobs (KI-Aufgaben) | **JobRunr** mit Postgres oder MongoDB als Speicher, im selben Prozess oder als zweite Instanz mit Worker-Profil | Persistente Queue mit Retries ohne zusätzlichen Broker |
| Echtzeit | Spring WebSocket mit STOMP und eingebautem Broker, nur **Server → Client** (Ereignisse, nach Audience gefiltert); Endpunkt `/api/ws`, Token optional im STOMP-`CONNECT`, Rechte beim Abonnieren prüfen. Befehle immer per HTTP | Leitprinzip 6. SSE wäre einfacher, aber der Browser-`EventSource` kann keinen Bearer-Token mitschicken |
| Fan-out bei mehreren Instanzen | Für den POC eine Instanz; später Redis Pub/Sub | Erst einführen, wenn nötig |
| Client | **Nur Web** (entschieden), im POC nur Desktop (entschieden) | Embeds (Twitch verlangt `parent`-Domain) und Second Screen funktionieren im Web am einfachsten; App-Store-Regeln erst später relevant |
| Auth | **Keycloak** (entschieden), Realm als JSON im Repo | Bekannt, OIDC, Social Logins; KYC in Phase 2 über Spezialanbieter |
| STT | Deepgram oder AssemblyAI (Streaming + Diarization) | Echtzeit mit Sprechertrennung |
| KI | **Onyx Lite headless** (entschieden), Sprachmodell darin z. B. Claude | Agents, Websuche mit Quellen; unter 1 GB RAM |

Onyx legt die Sprache nicht fest, es wird nur per HTTP angesprochen. Den `AiGateway` bauen wir in Java im Modul `ai`.

### Repo-Struktur auf `v2`

```
backend/          Spring Boot, Maven Wrapper; ein Paket je Modul unter info.mm.debate (bisher: identity, debate, chat, ai)
web/              React + Vite + TypeScript; später generierter API-Client unter src/api/generated
infra/            docker-compose.yml: Postgres (DBs keycloak, ledger), MongoDB, Keycloak, Mongo Express, Adminer
infra/onyx/       eigene Compose-Datei, bindet Onyx-Standard + Lite-Overlay aus onyx-main/ ein (Version in onyx.env)
onyx-main/        Onyx-Quellcode, nicht versioniert
docs/v2/          Produkt, Architektur, Entscheidungen
```

**Entwicklung (entschieden 2026-10-22):** Backend und Frontend laufen **nicht** in Docker, sondern werden manuell gestartet (`./mvnw spring-boot:run`, `npm run dev`). Docker liefert nur die Infrastruktur. Das Frontend leitet `/api` per Vite-Proxy an `localhost:8080` weiter, dadurch braucht es lokal kein CORS. Ports und Zugänge stehen im [README](../../README.md).

## Vorgeschlagener POC-Schnitt (vertikal, Phase 1, nur Punkte)

**Drin:**
1. Host legt Debatte an: Thema, Regelwerk aus Template, Stream-URL (YouTube/Twitch), Debattierer A/B, Jurys.
2. Wetten öffnen → Regelwerk gesperrt und angezeigt.
3. Viewer-Ansicht: Stream-Embed + Marktbalken + Wett-Panel (Punkte) + Chat.
4. Live-Protokoll aus STT, nach Sprechern getrennt.
5. Juror-Room: Protokoll ohne Quoten/Chat, Slider, versiegelte Abgabe.
6. Verdict (Median) → Settlement im Ledger → Ergebnis auf demselben Balken.
7. Ausnahmepfad: Host markiert No-show/Walkout → Refund.

**Nicht im POC:** echtes Geld und alles, was daran hängt (Zahlungen, KYC, Geofencing, Glücksspiel-Compliance).

**Danach, in dieser Reihenfolge (Vorschlag):** Point Bets mit Resolver · Faktencheck · KI-Assistent · Moderation · People's Verdict · Spotlight · Bias-Check · Profile · Community Notes · Watch-along · Anonymizer/Blind-Jury.

## Offene Fragen

1. ~~Stack~~ → Java + React (entschieden).
2. ~~Client~~ → nur Web (entschieden).
3. ~~Live-Handel~~ → Keine Wetten während der Debatte, Wettschluss als feste Zeit vor dem Start (entschieden).
4. **Market Maker:** Ist die Plattform Gegenpartei (AMM, Subvention), oder Orderbuch/Pool auch im Hauptmarkt? Für Phase 2 auch eine rechtliche Frage.
5. **Ingest:** Dürfen wir Streams mitschneiden, oder verlangen wir vom Host einen zusätzlichen Push an uns?
6. **Jurys:** Wer wählt sie aus, und brauchen wir im POC schon einen Juror-Pool mit Reputation?
7. **Hosting:** Wo läuft es (Fly.io, Railway, AWS …)? Muss es von Anfang an in den USA laufen? Onyx Standard braucht spürbar Ressourcen.
8. **Alter Code:** Bleibt er auf `v2` liegen (z. B. unter `legacy/`) oder wird er dort entfernt und lebt nur noch auf `main`?
9. ~~Ledger~~ → PostgreSQL, Rest in MongoDB (entschieden).
10. **Onyx-Latenz:** Reicht sie für Point-Bet-Erkennung, oder läuft diese eine Aufgabe direkt gegen das Sprachmodell? Früh messen.
