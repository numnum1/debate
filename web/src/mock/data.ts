// Mock-Daten für die ersten Wireframes, solange es im Backend noch keine Debatten gibt.
// Zeiten sind relativ zu jetzt, damit die Ansichten immer aktuell wirken.

export type DebateStatus = 'scheduled' | 'betting' | 'live' | 'verdict' | 'settled' | 'cancelled'

export type Platform = 'twitch' | 'youtube' | 'x'

export type Debate = {
  id: string
  topic: string
  sideA: string
  sideB: string
  category: string
  platform: Platform
  status: DebateStatus
  startsAt: Date
  /** Preis der A-Anteile im Hauptmarkt, 0–100; B = 100 − A */
  marketA: number
  /** Gesamteinsatz im Hauptmarkt in Punkten */
  volume: number
  viewers?: number
  /** Jury-Urteil (Median), nur bei beendeten Debatten */
  verdict?: number
  /** Position auf der Landing Page, kleiner = prominenter; fehlt = nicht promotet */
  promoted?: number
}

/**
 * Rolle in einer bestimmten Debatte; Nutzer haben keine festen Rollen. Der Host vergibt die übrigen Rollen,
 * Zuschauer ist der Normalfall ohne Vergabe.
 */
export type DebateRole = 'viewer' | 'juror' | 'host' | 'debater' | 'moderator' | 'resolver'

export type Membership = {
  debateId: string
  role: DebateRole
  lastActivity: Date
  pinned?: boolean
  /** Etwas wartet auf den Nutzer, z. B. eine Juror-Frist */
  attention?: string
  unread?: boolean
}

const minutes = (n: number) => new Date(Date.now() + n * 60_000)

export const debates: Debate[] = [
  {
    id: 'grundeinkommen',
    topic: 'Bedingungsloses Grundeinkommen: Ist Deutschland bereit?',
    sideA: 'Lena Hartmann',
    sideB: 'Jonas Weber',
    category: 'Politik',
    platform: 'youtube',
    status: 'live',
    startsAt: minutes(-34),
    marketA: 58,
    volume: 184_200,
    viewers: 12_480,
    promoted: 1,
  },
  {
    id: 'kernkraft',
    topic: 'Kernkraft zurück ins Netz?',
    sideA: 'Dr. Sven Krüger',
    sideB: 'Aylin Demir',
    category: 'Energie',
    platform: 'twitch',
    status: 'betting',
    startsAt: minutes(95),
    marketA: 44,
    volume: 61_900,
    promoted: 2,
  },
  {
    id: 'ki-urheberrecht',
    topic: 'Darf KI mit urheberrechtlich geschützten Werken trainiert werden?',
    sideA: 'Mara Lindqvist',
    sideB: 'Felix Brandt',
    category: 'Technologie',
    platform: 'youtube',
    status: 'scheduled',
    startsAt: minutes(60 * 26),
    marketA: 50,
    volume: 0,
    promoted: 3,
  },
  {
    id: 'tempolimit',
    topic: 'Tempolimit 130 auf Autobahnen',
    sideA: 'Thomas Albrecht',
    sideB: 'Nora Schulz',
    category: 'Verkehr',
    platform: 'twitch',
    status: 'live',
    startsAt: minutes(-12),
    marketA: 63,
    volume: 42_300,
    viewers: 3_210,
  },
  {
    id: 'vier-tage-woche',
    topic: 'Vier-Tage-Woche für alle',
    sideA: 'Clara Neumann',
    sideB: 'Peter Haas',
    category: 'Wirtschaft',
    platform: 'youtube',
    status: 'live',
    startsAt: minutes(-71),
    marketA: 37,
    volume: 28_750,
    viewers: 1_890,
  },
  {
    id: 'schach-ki',
    topic: 'Ist Schach durch KI tot?',
    sideA: 'GM Daniel Roth',
    sideB: 'Lisa Kowalski',
    category: 'Sport',
    platform: 'x',
    status: 'live',
    startsAt: minutes(-5),
    marketA: 29,
    volume: 9_400,
    viewers: 640,
  },
  {
    id: 'wehrpflicht',
    topic: 'Rückkehr der Wehrpflicht',
    sideA: 'Martin Vogel',
    sideB: 'Sophie Richter',
    category: 'Politik',
    platform: 'youtube',
    status: 'verdict',
    startsAt: minutes(-110),
    marketA: 52,
    volume: 97_100,
  },
  {
    id: 'homeoffice',
    topic: 'Homeoffice-Pflicht für Bürojobs',
    sideA: 'Katrin Lehmann',
    sideB: 'Ben Fischer',
    category: 'Wirtschaft',
    platform: 'twitch',
    status: 'betting',
    startsAt: minutes(60 * 5),
    marketA: 55,
    volume: 12_800,
  },
  {
    id: 'mietendeckel',
    topic: 'Bundesweiter Mietendeckel',
    sideA: 'Hannah Meier',
    sideB: 'Oliver Schmitt',
    category: 'Politik',
    platform: 'youtube',
    status: 'scheduled',
    startsAt: minutes(60 * 50),
    marketA: 50,
    volume: 0,
  },
  {
    id: 'mars',
    topic: 'Sollten wir zuerst den Mars besiedeln oder die Erde retten?',
    sideA: 'Elias Wolf',
    sideB: 'Miriam Koch',
    category: 'Wissenschaft',
    platform: 'twitch',
    status: 'settled',
    startsAt: minutes(-60 * 27),
    marketA: 41,
    volume: 73_600,
    verdict: 35,
  },
  {
    id: 'social-media-alter',
    topic: 'Social Media erst ab 16',
    sideA: 'Julia Becker',
    sideB: 'Tim Hoffmann',
    category: 'Gesellschaft',
    platform: 'youtube',
    status: 'settled',
    startsAt: minutes(-60 * 52),
    marketA: 66,
    volume: 55_200,
    verdict: 71,
  },
  {
    id: 'fleischsteuer',
    topic: 'Steuer auf Fleisch',
    sideA: 'Anna Schäfer',
    sideB: 'Lukas Zimmermann',
    category: 'Gesellschaft',
    platform: 'twitch',
    status: 'cancelled',
    startsAt: minutes(-60 * 30),
    marketA: 48,
    volume: 18_300,
  },
]

export const memberships: Membership[] = [
  { debateId: 'grundeinkommen', role: 'viewer', lastActivity: minutes(-1), pinned: true, unread: true },
  { debateId: 'wehrpflicht', role: 'juror', lastActivity: minutes(-8), attention: 'Urteil abgeben, Frist in 22 Min.' },
  { debateId: 'homeoffice', role: 'host', lastActivity: minutes(-45), attention: 'Regelwerk noch nicht gesperrt' },
  { debateId: 'tempolimit', role: 'moderator', lastActivity: minutes(-3), attention: '2 gemeldete Nachrichten' },
  { debateId: 'schach-ki', role: 'resolver', lastActivity: minutes(-6) },
  { debateId: 'kernkraft', role: 'viewer', lastActivity: minutes(-60 * 3) },
  { debateId: 'mietendeckel', role: 'juror', lastActivity: minutes(-60 * 20) },
  { debateId: 'mars', role: 'viewer', lastActivity: minutes(-60 * 25) },
  { debateId: 'social-media-alter', role: 'host', lastActivity: minutes(-60 * 49) },
  { debateId: 'fleischsteuer', role: 'viewer', lastActivity: minutes(-60 * 29) },
]

/** Punktestand des angemeldeten Nutzers */
export const balance = 8_450

export function findDebate(id: string | undefined) {
  return debates.find((d) => d.id === id)
}
