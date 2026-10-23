// Typen passend zu info.mm.debate.chat im Backend, bis der Client aus der OpenAPI-Spec generiert wird.

export type ChatBadge = 'HOST' | 'MODERATOR' | 'RESOLVER' | 'ADMIN' | 'AI'

/** Warum man gerade nicht schreiben kann */
export type WriteBlock = 'SIGN_IN' | 'JUROR' | 'NOT_OPEN_YET' | 'CLOSED' | 'MUTED'

/** Bei KI-Antworten: die Frage, auf die sie antwortet */
export type ChatReplyTo = { messageId: string; userName: string; excerpt: string }

export type ChatSource = { title: string; url: string }

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
  replyTo: ChatReplyTo | null
  sources: ChatSource[]
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

/** Eine KI, die sich mit `@name` rufen lässt; `name` ist klein geschrieben */
export type ChatAssistant = { name: string; displayName: string }

export type ChatSnapshot = {
  debateId: string
  tick: number
  messages: ChatMessage[]
  permissions: ChatPermissions
  assistants: ChatAssistant[]
}

/** Hinweis nur für den eigenen Nutzer, z. B. wenn eine KI nicht antworten konnte; wird nicht gespeichert */
export type ChatNotice = { debateId: string; text: string; messageId: string | null; sentAt: string }

/** Eigene Hinweise aus allen Debatten; der Client filtert nach `debateId` */
export const chatNoticeQueue = '/user/queue/chat'

export const chatPath =(debateId: string) => `/api/debates/${encodeURIComponent(debateId)}/chat`

export const chatTopic = (debateId: string) => `/topic/debates/${debateId}/chat`
