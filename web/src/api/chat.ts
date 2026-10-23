// Typen passend zu info.mm.debate.chat im Backend, bis der Client aus der OpenAPI-Spec generiert wird.

export type ChatBadge = 'HOST' | 'MODERATOR' | 'RESOLVER' | 'ADMIN'

/** Warum man gerade nicht schreiben kann */
export type WriteBlock = 'SIGN_IN' | 'JUROR' | 'NOT_OPEN_YET' | 'CLOSED' | 'MUTED'

export type ChatMessage = {
  id: string
  tick: number
  userId: string
  userName: string
  badge: ChatBadge | null
  text: string
  clientNonce: string | null
  sentAt: string
  /** Kommt nur bei Moderatoren vor; alle anderen bekommen ausgeblendete Nachrichten nicht */
  hidden: boolean
}

export type ChatEvent =
  | ({ type: 'message' } & Omit<ChatMessage, 'tick' | 'hidden'>)
  | { type: 'hidden'; messageId: string }

/** Alles aus einem Tick (250 ms). Nummern sind pro Debatte lückenlos. */
export type ChatTick = { debateId: string; tick: number; events: ChatEvent[] }

export type ChatPermissions = {
  canWrite: boolean
  canModerate: boolean
  writeBlock: WriteBlock | null
  /** Wettschluss: ab hier ist der Chat offen */
  opensAt: string
  mutedUntil: string | null
  maxLength: number
}

export type ChatSnapshot = { debateId: string; tick: number; messages: ChatMessage[]; permissions: ChatPermissions }

export const chatPath = (debateId: string) => `/api/debates/${encodeURIComponent(debateId)}/chat`

export const chatTopic = (debateId: string) => `/topic/debates/${debateId}/chat`
