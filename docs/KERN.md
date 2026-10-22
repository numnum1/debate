# Der Kern des Debate-Konzepts

Destillat aus dem PoC (`debate-app/`, `server/`), als Grundlage für das echte Projekt. Was hier steht, ist aus dem Code abgeleitet, nicht aus der PoC-Doku.

## Die Idee in einem Satz

Eine Debatte ist ein **Raum mit festen Positionen**, deren **Plätze (Slots)** von Menschen oder KI besetzt werden; sie argumentieren in Echtzeit gegeneinander, **Moderatoren** steuern, **Juroren** bewerten.

## Entscheidungen (Stand 2026-10-21)

- **Neu aufsetzen.** Der PoC bleibt als Referenz.
- **Format: freier Chat**, wie im PoC.
- **Zweck: auf Debatten wetten.** Das verschiebt den Kern, siehe nächster Abschnitt.
- **Plattform:** noch offen, es gibt einen Vorschlag.

## Wetten als Kern: was sich dadurch ändert

Die Debatte ist nicht mehr selbst das Produkt, sondern das **Ereignis, auf das gewettet wird**. Daraus folgen Anforderungen, die der PoC nicht kennt:

1. **Ein eindeutiges, überprüfbares Ergebnis.** Jede Debatte braucht einen festgelegten Ausgang (Sieger-Position, evtl. Unentschieden), eine im Voraus feststehende Regel, wie er ermittelt wird, und einen Abschlusszeitpunkt. Die Juroren werden damit zum **Orakel**, ihre Bewertung entscheidet über Gewinne.
2. **Integrität.** Wer das Ergebnis beeinflussen kann (Teilnehmer, Juroren, Moderatoren, Owner), darf nicht wetten. Absprachen zwischen Juroren und Teilnehmern müssen erkennbar und unterbindbar sein. Hier bekommt der Trusted Rank erstmals einen Zweck, z. B. dass nur `trusted` Juror sein darf.
3. **Der Wettmarkt.** Wann wird gewettet (nur vor dem Start, oder live)? Welches Modell: Pool/Totalisator (Quoten ergeben sich aus den Einsätzen) oder feste Quoten? Was passiert bei Abbruch (Rückerstattung)?
4. **Echtgeld oder Spielwährung.** Das ist die folgenreichste Entscheidung. Echtgeld-Wetten sind in Deutschland lizenzpflichtiges Glücksspiel (Glücksspielstaatsvertrag). Dazu kämen Altersprüfung, Identifikation, Einsatzlimits und Spielerschutz. Eine reine Spielwährung ohne Auszahlung umgeht das weitgehend. Bevor es um Echtgeld geht, sollte eine rechtliche Prüfung stattfinden.
5. **KI-Teilnehmer.** KI macht Debatten jederzeit verfügbar (KI gegen KI als Dauerprogramm), aber auch vorhersagbarer. Das Modell und der Prompt beeinflussen den Ausgang und müssten gegenüber Wettenden offengelegt oder fixiert werden.
6. **Nachvollziehbarkeit.** Wetten, Quoten, Ergebnis und Auszahlung brauchen ein unveränderliches Protokoll (Ledger). Das Datenmodell muss das von Anfang an tragen, nicht erst nachträglich.

## Begriffe

| Begriff | Bedeutung im PoC |
|---|---|
| **Debatte** | Titel, Beschreibung, Tags, öffentlich/privat, Ersteller (Owner), Status |
| **Position** | Eine Seite der Debatte (z. B. Pro/Contra), mit Name, Beschreibung, eindeutiger Farbe. Nicht auf zwei begrenzt. |
| **Slot** | Ein Sprecherplatz innerhalb einer Position. Typ `open` (frei), `invited` (eingeladene Person, muss annehmen) oder `ai` (Modell + Persönlichkeit) |
| **Teilnehmer** | Wer einen Slot besetzt |
| **Moderator** | Vom Owner ernannt, schreibt ohne Position, darf stummschalten |
| **Juror** | Vom Owner ernannt, schreibt Bewertungen statt Beiträgen |
| **Beitrag** | Chat-Nachricht, gehört zu Position + Slot (oder ist Moderatoren-Nachricht) |
| **Thread** | Antwortstrang zu einem Beitrag |
| **Bewertung** | Juror vergibt Punkte + Kommentar, optional bezogen auf Position und/oder Beiträge |
| **Stummschaltung** | Moderator/Owner sperrt einen Teilnehmer für die Debatte |
| **Trusted Rank** | Globale Vertrauensstufe eines Nutzers (`unknown`/`trusted`), im PoC ohne Wirkung |

## Lebenszyklus

```
pending ──start──▶ awaiting_acceptance ──alle angenommen──▶ active ──schließen──▶ archived
   ▲                      │
   └──Einladung abgelehnt/Slot geändert┘
```

`completed` existiert im Enum, wird aber nirgends gesetzt.

## Regeln, die der PoC bereits kennt

- Starten erst mit **≥ 2 Positionen**, jede mit **≥ 1 Slot**.
- `active` erst, wenn **alle Einladungen angenommen** sind.
- Positionsfarben sind innerhalb einer Debatte eindeutig.
- **Rollen schließen sich aus:** Owner, Teilnehmer, Moderator und Juror sind jeweils verschiedene Personen. KI darf weder Moderator noch Juror sein.
- Nur der **Owner** bearbeitet, startet, schließt und löscht die Debatte und vergibt Rollen.
- Juroren bewerten nur in Debatten, in denen sie Juror sind, und ändern nur eigene Bewertungen.
- Bei jedem menschlichen Beitrag antworten **alle KI-Slots der anderen Positionen**. KI antwortet nicht auf KI.

## Was der PoC offenlässt

Das sind die eigentlichen Konzeptfragen, nicht Bugs:

1. **Debattenformat.** Heute ist es freier Chat: jeder schreibt jederzeit. Gibt es Runden, eine Rednerreihenfolge, Redezeit, Zeichenlimits, Eröffnungs- und Schlussplädoyers?
2. **Ergebnis.** Bewertungen werden gesammelt, aber nie ausgewertet. Gibt es einen Sieger, wie wird aggregiert, wann endet eine Debatte (`completed` vs. `archived`)?
3. **Offene Slots.** Man kann sie anlegen, aber es gibt keinen Weg, einen offenen Slot zu besetzen.
4. **Öffentlich vs. privat.** Was dürfen Zuschauer? Mitlesen, live oder erst danach, reagieren, abstimmen?
5. **Rolle der KI.** Vollwertiger Debattierer, Sparringspartner zum Üben, oder auch Hilfsrolle (Zusammenfassung, Faktencheck, Bewertung)? Wann antwortet sie (jede Nachricht vs. in ihrem Zug)?
6. **Threads.** Rein im Frontend zusammengesetzt. Fachlich nötig, oder Ablenkung vom Debattenfluss?
7. **Trusted Rank.** Wozu? Etwa: nur `trusted` darf öffentliche Debatten anlegen oder Juror sein.
8. **Zielgruppe und Plattform.** Schule/Uni, Debattierclubs, Öffentlichkeit? Muss es nativ auf Mobilgeräten laufen, oder reicht Web?

## Was der PoC über die Umsetzung lehrt

- **Alles in einem Mongo-Dokument** (Debatte inkl. aller Nachrichten und Bewertungen) wächst unbegrenzt und führt bei parallelen Schreibzugriffen zu verlorenen Updates. Beiträge und Bewertungen gehören in eigene Sammlungen bzw. Tabellen.
- **Regeln liegen verstreut** in Services, Controllern und dem Frontend und werden teils nicht durchgesetzt (Stummschaltung, Raum-Beitritt, wer in welchem Slot schreiben darf). Im echten Projekt gehören sie an eine Stelle im Domänenmodell, mit Tests.
- **Zwei Wege für dieselbe Aktion** (REST und WebSocket für Nachrichten) erzeugen doppelte Logik. Ein Kanal für Befehle, einer für Events.
- **Ein großer Frontend-Context** (`DebateContext`, ~1.500 Zeilen) und eine Riesen-Komponente (`DebateView`, ~2.500 Zeilen) sind das Hauptwartungsproblem auf Client-Seite.
- **Keycloak** funktioniert, ist aber für den Betrieb schwergewichtig (eigene Postgres-Instanz, Realm-Setup von Hand).
