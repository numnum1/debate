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
