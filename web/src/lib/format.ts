import type { DebateRole, DebateStatus, Platform } from '@/mock/data'

const relative = new Intl.RelativeTimeFormat('de', { numeric: 'auto' })
const number = new Intl.NumberFormat('de')
const time = new Intl.DateTimeFormat('de', { weekday: 'short', hour: '2-digit', minute: '2-digit' })

export function formatPoints(points: number) {
  return `${number.format(points)} P`
}

export function formatCount(n: number) {
  return number.format(n)
}

export function formatRelative(date: Date) {
  const minutes = Math.round((date.getTime() - Date.now()) / 60_000)
  if (Math.abs(minutes) < 60) return relative.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 24) return relative.format(hours, 'hour')
  return relative.format(Math.round(hours / 24), 'day')
}

/** Kurzform für die Seitenleiste: „3 Min.“, „5 Std.“, „2 T.“ */
export function formatAgo(date: Date) {
  const minutes = Math.max(0, Math.round((Date.now() - date.getTime()) / 60_000))
  if (minutes < 60) return `${minutes} Min.`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} Std.`
  return `${Math.round(hours / 24)} T.`
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export function formatStart(date: Date) {
  return time.format(date)
}

export const statusLabel: Record<DebateStatus, string> = {
  scheduled: 'Demnächst',
  betting: 'Wetten offen',
  live: 'Live',
  verdict: 'Urteil läuft',
  settled: 'Beendet',
  cancelled: 'Abgesagt',
}

export const roleLabel: Record<DebateRole, string> = {
  viewer: 'Zuschauer',
  juror: 'Juror',
  host: 'Host',
  debater: 'Debattierer',
  moderator: 'Moderator',
  resolver: 'Resolver',
}

export const platformLabel: Record<Platform, string> = {
  twitch: 'Twitch',
  youtube: 'YouTube',
  x: 'X',
}
