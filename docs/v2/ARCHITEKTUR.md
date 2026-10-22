# v2 – Architektur (Entwurf)

Stand 2026-10-22 · Status: **Entwurf zur Diskussion, noch kein Code.**

Grundlage: [PRODUKT.md](PRODUKT.md). Lehren aus dem ersten Versuch: [../KERN.md](../KERN.md). Der alte Code (`debate-app/`, `server/`) bleibt als Referenz, v2 wird neu aufgesetzt.

## Entscheidungen

| Datum | Entscheidung |
|---|---|
| 2026-10-22 | **KI-Aufgaben laufen über das Backend von [Onyx](https://github.com/onyx-dot-app/onyx)** (selbst gehostet, MIT Community Edition). Die Onyx-UI wird nicht verwendet. Unser Backend ruft Onyx headless per API-Key auf. Siehe [Onyx als KI-Backend](#onyx-als-ki-backend). |
| 2026-10-22 | **Keycloak** für Identität und Login, **MongoDB** für Nutzerprofile (Vorschlag von Marc, Bewertung siehe [Identität und Nutzerdaten](#identität-und-nutzerdaten)). |
| 2026-10-22 | **Backend in Java**, **Frontend in React**. |
| 2026-10-22 | **Zunächst nur eine Webseite**, keine native App. |
| 2026-10-22 | **MongoDB** für Nutzer, Debatten, Regelwerke und Zeitachse, **PostgreSQL** für Ledger, Märkte und Pools. Eine kurz erwogene Variante „alles in Mongo" ist verworfen. Begründung siehe [Ledger und Markt in PostgreSQL](#ledger-und-markt-in-postgresql). |
| 2026-10-22 | **Der POC arbeitet nur mit Punkten, kein echtes Geld.** Damit entfallen im POC Zahlungsanbieter, Ein- und Auszahlung, KYC, Geofencing und Einsatzlimits nach Glücksspielrecht. Das Ledger hat trotzdem ein Währungsfeld (`POINTS`), damit Phase 2 kein Umbau wird. |

## Was sich gegenüber dem ersten Versuch grundlegend ändert

Im ersten Versuch *fand die Debatte in der App statt* (Chat mit Positionen und Slots). In v2 findet die Debatte **woanders** statt (Twitch, YouTube, X). Die Plattform ist ein **Second Screen**: Sie hört mit, protokolliert, prüft, lässt wetten, lässt urteilen und rechnet ab. Daraus folgt: Der Kern ist nicht mehr ein Chat, sondern

1. eine **Zeitachse der Debatte** (was wurde wann gesagt, was ist passiert),
2. ein **Markt** mit **Ledger** (wer hält was, wer bekommt was),
3. eine **Jury** als Orakel (versiegelte Slider, Median),
4. ein fixiertes **Regelwerk**, das alle drei steuert.

Alles andere (Faktencheck, Spotlight, Profile, Bias-Check, Watch-along) sind Anreicherungen an der Zeitachse.

## Lebenszyklus (vermutet, Diagramm fehlt)

```
1 Setup ──▶ 2 Betting open ──▶ 3 Live ──▶ 4 Verdict ──▶ 5 Settlement
   │        (Regelwerk gesperrt)                          (Geld/Punkte fließen)
   └──────────── Ausnahme: No-show / Walkout ──▶ Refund (+ Deposit verfällt)
```

Zu klären: Ist „Betting open" vor dem Live-Start, und läuft der Hauptmarkt *während* der Debatte weiter (Live-Handel)? Die Produktbeschreibung („one bar shows where the market stands during the stream") spricht für ja.

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
                 │   Claims · Einordnung Ereignis/Meinung│◀────│ Agents, Websuche, RAG,  │
                 │   Faktencheck · Point-Bet-Erkennung  │      │ Ingestion, Connectors   │
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
- **Stream-Delay:** Zuschauer sehen den Stream mit Verzögerung, unser Ingest ebenfalls (anders). Vorschlag für den POC: Regelwerk definiert ein Delay-Fenster *D*. Wird ein Punkt bei Medienzeit *t* erkannt, schließt die Point Bet sofort, und alle Wetten mit Zeitstempel > *t − D* (in Wanduhrzeit umgerechnet) werden storniert. Genauer wird es später, wenn der Client seine Abspielposition mitsendet.
- **X-Textdebatten:** gleiche Zeitachse, nur ohne STT; Beiträge kommen per X-API-Polling. Kosten pro gelesenem Post beachten.

### Markt

- **Hauptmarkt (Slider-Markt):** A- und B-Anteile, A + B zahlen zusammen immer 100. Für Phase 1 (Punkte) ein **automatischer Market Maker** (LMSR oder Constant-Product), damit es immer einen Preis gibt, auch mit wenigen Nutzern. Die Plattform stellt die Liquidität (begrenzter, berechenbarer Verlust). Auszahlung: A = Slider, B = 100 − Slider.
- **Point Bets:** Parimutuel-Pools (Ja/Nein, Gewinner teilen den Topf minus Gebühr). Einfach, kein Market Maker nötig.
- **Konsistenz:** pro Markt ein einziger Schreiber (serialisierte Trades pro Markt, siehe [Ledger und Markt in PostgreSQL](#ledger-und-markt-in-postgresql)). Jeder Trade = Ledger-Buchung in derselben Transaktion.
- **Integritätsprüfung vor jedem Trade:** Rolle in dieser Debatte (Debattierer, Team, Juror, Host → gesperrt), Einsatzlimits, Regelwerk-Status.

### Jury

- Juror-Room ist eine eigene Ansicht mit eigener, gefilterter Ereignis-Projektion.
- **Versiegelte Votes:** Für den POC reicht serverseitig versiegelt (nicht abrufbar, bis alle abgegeben haben oder die Frist abläuft). Optional später Commit-Reveal mit Hash, damit auch wir nachweislich nicht nachträglich ändern.
- Verdict = Median der Slider, als Ereignis protokolliert, löst Settlement aus.

### Ledger

- Konten: Nutzer-Wallet, Markt-Escrow je Markt, Pool-Escrow je Point Bet, Plattform-Gebühren, Market-Maker-Subvention, Deposits der Debattierer.
- Jede Buchung hat eine Idempotenz-Kennung (doppelte Requests buchen nicht doppelt).
- Refund-Pfade (No-show, Walkout, stornierte Delay-Wetten) sind normale Gegenbuchungen, nie Löschungen.

### Onyx als KI-Backend

Onyx (Python, eigener Stack aus Postgres, Such-Index, Redis, MinIO, Model-Servern und Celery-Workern) läuft als eigenständiger Dienst neben uns. Endnutzer melden sich **nie** bei Onyx an; nur unser Backend spricht mit Onyx, über einen API-Key (in Onyx ist jeder API-Key ein eigener Nutzer). Damit stellt sich die Frage nach OIDC/SSO in Onyx nicht, die laut Doku teils Enterprise-Funktion ist.

**Was Onyx uns abnimmt:**
- **Agents (Personas)** mit eigenem Prompt und eigenen Tools, je Aufgabe einer: Claim-Extraktor, Faktenchecker, Zuschauer-Assistent, Juror-Assistent, Point-Bet-Vorschläge, Spotlight-Zusammenfassung, Profil-Autor. Das Sprachmodell (z. B. Claude) wird in Onyx konfiguriert.
- **Websuche** (Serper, Brave, Google PSE, SearXNG, Exa …) und Crawler für Faktenchecks und Profile.
- **RAG mit Quellenangaben:** Antworten kommen mit Zitaten auf Dokumente. Das passt zur Regel „every line is sourced".
- **Ingestion-API:** Wir schieben das Live-Protokoll und Quellen über Debattierer (frühere Aussagen, Interviews) als Dokumente hinein. Assistent und Profile arbeiten dann darauf.
- **Connectors mit Refresh-Intervall:** Quellen über Debattierer werden regelmäßig neu eingelesen. Das ist die einzige Zeitplanung, die Onyx selbst übernimmt.

**Was bei uns bleibt:**
- **Zeitplanung und Queue der KI-Aufgaben.** Onyx hat keinen allgemeinen Job-Scheduler für externe Aufrufer. Unser Worker entscheidet, *wann* welche Aufgabe läuft (z. B. „neues Transkript-Segment → Claim-Extraktion", „Claim als Ereignis eingestuft → Faktencheck"), ruft Onyx auf (`/chat/send-chat-message`, Streaming-Pakete bis `OverallStop`) und schreibt das Ergebnis als Ereignis auf unsere Zeitachse.
- **Strukturierte Ausgabe:** Onyx liefert Text mit Zitaten. Wir fordern im Agent-Prompt JSON an und validieren es auf unserer Seite gegen ein Schema; bei Fehlern Retry, dann „Unverified".
- **Sichtbarkeit:** Quoten, Votes, Wetten und Chat kommen **nie** nach Onyx. Was ein Agent sehen darf, steuern wir über Document Sets je Agent (z. B. Juror-Assistent bei *closed evidence* ohne Faktenchecks und Notes).
- **Transkription:** Onyx macht kein Audio, STT bleibt ein eigener Dienst.
- **Protokollierung:** Zu jeder KI-Ausgabe speichern wir Agent-ID, Prompt-Version, Onyx-Version und Quellen (Nachvollziehbarkeit, Haftung für eigene „Speech").

**Risiken und Gegenmaßnahmen:**
- **Latenz:** Ein Agent-Lauf mit Suche und Reasoning dauert Sekunden. Für Point-Bet-Erkennung („closes the instant the AI detects") ist das kritisch. Für zeitkritische Aufgaben einen Agent ohne Tools verwenden und messen; notfalls diese eine Aufgabe direkt gegen das Sprachmodell.
- **API-Stabilität:** Onyx hat Chat-Endpunkte bereits einmal ersetzt (`send-message` → `send-chat-message`, Frist Anfang 2026). Deshalb: Onyx-Version pinnen und hinter einer eigenen Schnittstelle (`AiGateway`) kapseln, die nur unsere Aufgabenarten kennt.
- **Betriebsgewicht:** Onyx Standard braucht mehrere Container und einiges an RAM. Onyx Lite ist leicht, kann aber nicht indexieren, fällt also für RAG weg.

### Identität und Nutzerdaten

**Keycloak: passt.** Es ist aus dem ersten Versuch bekannt, spricht OIDC und kann Login über Twitch, Google, X usw. vorschalten. Das ist für ein Publikum, das von Streamern kommt, sehr nützlich. Das Problem aus dem PoC war das Realm-Setup von Hand. Lösung: Realm als JSON im Repo versionieren und beim Start importieren (`--import-realm`), damit jede Umgebung reproduzierbar ist.

**Aufteilung zwischen Keycloak und MongoDB:**

| Wo | Was |
|---|---|
| Keycloak | Login, Passwort, E-Mail, Social Logins, **globale** Rollen (`admin`, `platform_moderator`, `resolver`) |
| MongoDB `users` | Profil, verknüpft über Keycloak-`sub`: Anzeigename, Avatar, verknüpfte Twitch/X-Konten, Trusted Rank, Juror-Reputation, Show-up-Rate, Einstellungen |
| MongoDB, je Debatte | **Debattenbezogene** Rollen (Host, Juror, Debattierer, Team) – nicht in Keycloak, weil die Integritätsregeln („wer darf in *dieser* Debatte wetten") daran hängen und sie sich pro Debatte ändern |

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
| Frontend | **React** (entschieden) mit Vite und TypeScript, als Single-Page-App; Routing z. B. React Router, Server-State mit TanStack Query | Kein Next.js nötig, weil das Backend in Java läuft; Vite ist schlank |
| Vertrag Client ↔ Server | **OpenAPI aus Spring** (springdoc) → TypeScript-Client und -Typen generiert (z. B. orval oder openapi-typescript). Ereignis-Typen für WebSocket ebenfalls als Schemas in der OpenAPI-Spec | Ersetzt die geteilten Typen, die TypeScript auf beiden Seiten gegeben hätte. Kein Handabgleich von DTOs |
| Datenbank | **MongoDB** (Spring Data MongoDB) für Nutzer, Debatten, Regelwerke, Zeitachse · **PostgreSQL** (Flyway, Spring Data JDBC oder jOOQ) für Ledger, Märkte, Pools (entschieden) | Dokumente dort, wo sie passen; Transaktionen und Constraints dort, wo Punkte bzw. Geld fließen |
| Jobs (KI-Aufgaben) | **JobRunr** mit Postgres oder MongoDB als Speicher, im selben Prozess oder als zweite Instanz mit Worker-Profil | Persistente Queue mit Retries ohne zusätzlichen Broker |
| Echtzeit | Spring WebSocket nur **Server → Client** (Ereignisse, nach Audience gefiltert); Token beim Verbindungsaufbau prüfen. Befehle immer per HTTP | Leitprinzip 6. SSE wäre einfacher, aber der Browser-`EventSource` kann keinen Bearer-Token mitschicken |
| Fan-out bei mehreren Instanzen | Für den POC eine Instanz; später Redis Pub/Sub | Erst einführen, wenn nötig |
| Client | **Nur Web** (entschieden), responsiv | Embeds (Twitch verlangt `parent`-Domain) und Second Screen funktionieren im Web am einfachsten; App-Store-Regeln erst später relevant |
| Auth | **Keycloak** (entschieden), Realm als JSON im Repo | Bekannt, OIDC, Social Logins; KYC in Phase 2 über Spezialanbieter |
| STT | Deepgram oder AssemblyAI (Streaming + Diarization) | Echtzeit mit Sprechertrennung |
| KI | **Onyx headless** (entschieden), Sprachmodell darin z. B. Claude | Agents, Websuche, RAG mit Quellen, Ingestion |

Onyx legt die Sprache nicht fest, es wird nur per HTTP angesprochen. Den `AiGateway` bauen wir in Java im Modul `ai`.

### Repo-Struktur auf `v2`

```
backend/          Spring Boot, Maven Wrapper; ein Paket je Modul unter info.mm.debate (bisher: identity)
web/              React + Vite + TypeScript; später generierter API-Client unter src/api/generated
infra/            docker-compose.yml: Postgres (DBs keycloak, ledger), MongoDB, Keycloak, Mongo Express, Adminer
infra/onyx/       eigene Compose-Datei, bindet onyx-main/deployment/docker_compose ein (Version in onyx.env)
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
3. **Live-Handel:** Läuft der Hauptmarkt während der Debatte weiter oder schließt er beim Start?
4. **Market Maker:** Ist die Plattform Gegenpartei (AMM, Subvention), oder Orderbuch/Pool auch im Hauptmarkt? Für Phase 2 auch eine rechtliche Frage.
5. **Ingest:** Dürfen wir Streams mitschneiden, oder verlangen wir vom Host einen zusätzlichen Push an uns?
6. **Jurys:** Wer wählt sie aus, und brauchen wir im POC schon einen Juror-Pool mit Reputation?
7. **Hosting:** Wo läuft es (Fly.io, Railway, AWS …)? Muss es von Anfang an in den USA laufen? Onyx Standard braucht spürbar Ressourcen.
8. **Alter Code:** Bleibt er auf `v2` liegen (z. B. unter `legacy/`) oder wird er dort entfernt und lebt nur noch auf `main`?
9. ~~Ledger~~ → PostgreSQL, Rest in MongoDB (entschieden).
10. **Onyx-Latenz:** Reicht sie für Point-Bet-Erkennung, oder läuft diese eine Aufgabe direkt gegen das Sprachmodell? Früh messen.
