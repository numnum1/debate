import type { ChatAssistant } from '@/api/chat'

// Dasselbe Muster wie ChatAssistant.MENTION im Backend: @ am Anfang oder nach Leerzeichen/Satzzeichen
const MENTION = /(?<![\p{L}\p{N}_@.])@([\p{L}\p{N}_]{1,32})/gu

const find = (assistants: ChatAssistant[], name: string) =>
  assistants.find((a) => a.name === name.toLowerCase())

/** Die KI, die auf die Nachricht antwortet: die erste genannte, wie im Backend */
export function firstMention(text: string, assistants: ChatAssistant[]): ChatAssistant | undefined {
  for (const match of text.matchAll(MENTION)) {
    const assistant = find(assistants, match[1])
    if (assistant) return assistant
  }
  return undefined
}

/** Steht beim Vorschlagen oben, solange sie zum Getippten passt */
export const DEFAULT_ASSISTANT = 'grok'

/** Das @wort, in dem der Cursor gerade steht; `end` schließt den Rest des Wortes hinter dem Cursor ein */
export type ActiveMention = { start: number; end: number; query: string }

export function activeMention(text: string, caret: number): ActiveMention | undefined {
  const match = /(?<![\p{L}\p{N}_@.])@([\p{L}\p{N}_]{0,32})$/u.exec(text.slice(0, caret))
  if (!match) return undefined
  const rest = /^[\p{L}\p{N}_]*/u.exec(text.slice(caret))?.[0] ?? ''
  return { start: match.index, end: caret + rest.length, query: match[1] }
}

/** KIs, deren Name oder Anzeigename mit dem Getippten beginnt; die Standard-KI zuerst */
export function suggestAssistants(query: string, assistants: ChatAssistant[]): ChatAssistant[] {
  const q = query.toLowerCase()
  return assistants
    .filter((a) => a.name.startsWith(q) || a.displayName.toLowerCase().startsWith(q))
    .sort(
      (a, b) =>
        Number(b.name === DEFAULT_ASSISTANT) - Number(a.name === DEFAULT_ASSISTANT) || a.name.localeCompare(b.name),
    )
}

export type TextPart = { text: string; assistant?: ChatAssistant }

/** Zerlegt den Text, damit Erwähnungen von KIs hervorgehoben werden können */
export function splitMentions(text: string, assistants: ChatAssistant[]): TextPart[] {
  const parts: TextPart[] = []
  let last = 0
  for (const match of text.matchAll(MENTION)) {
    const assistant = find(assistants, match[1])
    if (!assistant) continue
    if (match.index > last) parts.push({ text: text.slice(last, match.index) })
    parts.push({ text: match[0], assistant })
    last = match.index + match[0].length
  }
  if (last < text.length) parts.push({ text: text.slice(last) })
  return parts
}
