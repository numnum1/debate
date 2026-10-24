import type { FoundUser, NewDebateRequest } from '@/api/debates'
import type { Platform, Ruleset } from '@/mock/data'

export type AssignableRole = 'JUROR' | 'MODERATOR' | 'RESOLVER'

export type Form = {
  topic: string
  sideA: string
  sideB: string
  category: string
  platform: Platform
  streamUrl: string
  /** Wert eines `datetime-local`-Feldes, in der Zeitzone des Browsers */
  startsAt: string
  bettingClosesAt: string
  /** Solange der Wettschluss nicht angefasst wurde, folgt er dem Start */
  closesTouched: boolean
  jurors: Ruleset['jurors']
  evidence: Ruleset['evidence']
  pointBets: Ruleset['pointBets']
  roles: Record<AssignableRole, FoundUser[]>
}

export type Errors = Partial<Record<string, string>>

/** Die Schritte des Assistenten; `fields` sagt, welcher Schritt einen Fehler des Backends anzeigt. */
export const steps = [
  { key: 'topic', label: 'Thema', fields: ['topic', 'sideA', 'sideB', 'category'] },
  { key: 'stream', label: 'Stream & Zeiten', fields: ['platform', 'streamUrl', 'startsAt', 'bettingClosesAt'] },
  { key: 'ruleset', label: 'Regelwerk', fields: ['ruleset'] },
  { key: 'roles', label: 'Rollen', fields: ['roles'] },
  { key: 'summary', label: 'Zusammenfassung', fields: [] },
] as const

export const stepOfField = (field: string | undefined) => {
  const index = steps.findIndex((step) => (step.fields as readonly string[]).includes(field ?? ''))
  return index < 0 ? steps.length - 1 : index
}

/** Vorschlag laut ARCHITEKTUR.md: Wettschluss 30 Minuten vor dem Start */
export const CLOSE_BEFORE_START_MINUTES = 30

const pad = (n: number) => String(n).padStart(2, '0')

export function toLocalInput(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Wettschluss zu einem Start, oder leer, solange der Start fehlt oder ungültig ist */
export function closeFor(startsAt: string) {
  const start = new Date(startsAt)
  if (Number.isNaN(start.getTime())) return ''
  return toLocalInput(new Date(start.getTime() - CLOSE_BEFORE_START_MINUTES * 60_000))
}

export function emptyForm(now: Date): Form {
  const start = new Date(now)
  start.setDate(start.getDate() + 1)
  start.setHours(20, 0, 0, 0)
  const startsAt = toLocalInput(start)
  return {
    topic: '',
    sideA: '',
    sideB: '',
    category: '',
    platform: 'youtube',
    streamUrl: '',
    startsAt,
    bettingClosesAt: closeFor(startsAt),
    closesTouched: false,
    jurors: 3,
    evidence: 'CLOSED',
    pointBets: 'OFF',
    roles: { JUROR: [], MODERATOR: [], RESOLVER: [] },
  }
}

const platformHosts: Record<Platform, string[]> = {
  youtube: ['youtube.com', 'm.youtube.com', 'youtu.be'],
  twitch: ['twitch.tv'],
  x: ['x.com', 'twitter.com'],
}

function streamUrlMatches(platform: Platform, value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && platformHosts[platform].includes(url.hostname.replace(/^www\./, ''))
  } catch {
    return false
  }
}

/** Fehler eines Schritts, in denselben Grenzen wie im Backend; leer heißt: weiter. */
export function validateStep(step: number, form: Form, now: Date): Errors {
  const errors: Errors = {}
  if (step === 0) {
    if (!form.topic.trim()) errors.topic = 'Bitte ein Thema eingeben.'
    else if (form.topic.trim().length > 200) errors.topic = 'Höchstens 200 Zeichen.'
    if (!form.sideA.trim()) errors.sideA = 'Bitte einen Namen eingeben.'
    if (!form.sideB.trim()) errors.sideB = 'Bitte einen Namen eingeben.'
    else if (form.sideA.trim().toLowerCase() === form.sideB.trim().toLowerCase()) {
      errors.sideB = 'Die beiden Seiten brauchen verschiedene Namen.'
    }
    if (!form.category.trim()) errors.category = 'Bitte eine Kategorie eingeben.'
    else if (form.category.trim().length > 40) errors.category = 'Höchstens 40 Zeichen.'
  }
  if (step === 1) {
    if (!streamUrlMatches(form.platform, form.streamUrl.trim())) {
      errors.streamUrl = 'Bitte eine https-Adresse dieser Plattform eingeben.'
    }
    const start = new Date(form.startsAt)
    const close = new Date(form.bettingClosesAt)
    if (Number.isNaN(start.getTime()) || start <= now) errors.startsAt = 'Der Start muss in der Zukunft liegen.'
    if (Number.isNaN(close.getTime()) || close <= now || close >= start) {
      errors.bettingClosesAt = 'Der Wettschluss muss in der Zukunft und vor dem Start liegen.'
    }
  }
  if (step === 3 && form.roles.JUROR.length > form.jurors) {
    errors.roles = `Die Jury hat ${form.jurors} Plätze, es sind ${form.roles.JUROR.length} Juroren gewählt.`
  }
  return errors
}

export function toRequest(form: Form): NewDebateRequest {
  return {
    topic: form.topic.trim(),
    sideA: form.sideA.trim(),
    sideB: form.sideB.trim(),
    category: form.category.trim(),
    platform: form.platform.toUpperCase() as NewDebateRequest['platform'],
    streamUrl: form.streamUrl.trim(),
    startsAt: new Date(form.startsAt).toISOString(),
    bettingClosesAt: new Date(form.bettingClosesAt).toISOString(),
    ruleset: { template: 'standard', jurors: form.jurors, evidence: form.evidence, pointBets: form.pointBets, locked: false },
    roles: (Object.keys(form.roles) as AssignableRole[]).flatMap((role) =>
      form.roles[role].map((user) => ({ userId: user.id, role })),
    ),
  }
}
