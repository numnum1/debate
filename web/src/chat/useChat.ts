import { Client } from '@stomp/stompjs'
import { useCallback, useEffect, useRef, useState } from 'react'

import { ApiError, api } from '@/api/client'
import {
  chatPath,
  chatTopic,
  type ChatAssistant,
  type ChatMessage,
  type ChatPermissions,
  type ChatSnapshot,
  type ChatTick,
} from '@/api/chat'

/** So viele Nachrichten bleiben im Speicher und auf dem Bildschirm, ältere fallen weg */
const KEEP = 300

export type Connection = 'connecting' | 'live' | 'offline'

export type PendingMessage = { clientNonce: string; text: string }

const wsUrl = () => `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}/api/ws`

/**
 * Live-Chat einer Debatte. Ablauf: WebSocket verbinden und abonnieren, Ticks puffern, Stand laden, dann die
 * gepufferten Ticks anwenden. Springt die Tick-Nummer, fehlt etwas; das wird per HTTP nachgeholt, ebenso nach
 * einem Verbindungsabbruch. Beim Wechsel von Debatte oder Nutzer die Komponente neu mounten (key).
 */
export function useChat(debateId: string, token: string | undefined, userId: string | undefined) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [permissions, setPermissions] = useState<ChatPermissions | null>(null)
  const [assistants, setAssistants] = useState<ChatAssistant[]>([])
  const [pending, setPending] = useState<PendingMessage[]>([])
  const [connection, setConnection] = useState<Connection>('connecting')
  const [error, setError] = useState<string | null>(null)

  // Das Token wird regelmäßig erneuert; dafür soll die Verbindung nicht neu aufgebaut werden
  const tokenRef = useRef(token)
  useEffect(() => {
    tokenRef.current = token
  }, [token])
  const canModerateRef = useRef(false)

  useEffect(() => {
    let lastTick: number | null = null
    let syncing = false
    let stopped = false
    const buffer: ChatTick[] = []

    const apply = (tick: ChatTick) => {
      const mine: string[] = []
      setMessages((previous) => {
        let next = previous
        for (const event of tick.events) {
          if (event.type === 'message') {
            if (next.some((m) => m.id === event.id)) continue
            const { type: _type, ...message } = event
            next = [...next, { ...message, tick: tick.tick, hidden: false }]
          } else {
            next = canModerateRef.current
              ? next.map((m) => (m.id === event.messageId ? { ...m, hidden: true } : m))
              : next.filter((m) => m.id !== event.messageId)
          }
        }
        return next.length > KEEP ? next.slice(-KEEP) : next
      })
      for (const event of tick.events) {
        if (event.type === 'message' && event.userId === userId && event.clientNonce) mine.push(event.clientNonce)
      }
      if (mine.length) setPending((previous) => previous.filter((p) => !mine.includes(p.clientNonce)))
      lastTick = tick.tick
    }

    const fetchTicksAfter = (after: number) =>
      api<ChatTick[]>(`${chatPath(debateId)}/ticks?after=${after}`, { token: tokenRef.current })

    /** Bringt den Stand auf den neuesten Tick: erst Stand oder verpasste Ticks laden, dann den Puffer abarbeiten. */
    const sync = async () => {
      if (syncing) return
      syncing = true
      try {
        if (lastTick === null) {
          const snapshot = await api<ChatSnapshot>(chatPath(debateId), { token: tokenRef.current })
          if (stopped) return
          canModerateRef.current = snapshot.permissions.canModerate
          setPermissions(snapshot.permissions)
          setAssistants(snapshot.assistants)
          setMessages(snapshot.messages)
          lastTick = snapshot.tick
        } else {
          for (const tick of await fetchTicksAfter(lastTick)) {
            if (stopped) return
            if (tick.tick > lastTick) apply(tick)
          }
        }
        for (;;) {
          buffer.sort((a, b) => a.tick - b.tick)
          const next = buffer.shift()
          if (!next) break
          if (next.tick <= lastTick) continue
          if (next.tick === lastTick + 1) {
            apply(next)
            continue
          }
          // Lücke: was dazwischen fehlt, liefert das Backend
          for (const tick of await fetchTicksAfter(lastTick)) {
            if (stopped) return
            if (tick.tick > lastTick) apply(tick)
          }
        }
        setConnection('live')
        setError(null)
      } catch (e) {
        if (stopped) return
        setError(e instanceof Error ? e.message : String(e))
        if (e instanceof ApiError && (e.code === 'JUROR' || e.code === 'NOT_FOUND')) void client.deactivate()
      } finally {
        syncing = false
      }
    }

    const onTick = (tick: ChatTick) => {
      if (!syncing && lastTick !== null && tick.tick === lastTick + 1) {
        apply(tick)
      } else if (lastTick === null || tick.tick > lastTick) {
        buffer.push(tick)
        void sync()
      }
    }

    const client = new Client({
      brokerURL: wsUrl(),
      reconnectDelay: 2_000,
      heartbeatIncoming: 10_000,
      heartbeatOutgoing: 10_000,
      beforeConnect: () => {
        client.connectHeaders = tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}
      },
      onConnect: () => {
        client.subscribe(chatTopic(debateId), (frame) => onTick(JSON.parse(frame.body) as ChatTick))
        // Nach einem Abbruch ist lastTick gesetzt, dann werden nur die verpassten Ticks nachgeholt
        void sync()
      },
      onWebSocketClose: () => {
        if (!stopped) setConnection('offline')
      },
      onStompError: (frame) => {
        if (!stopped) setError(frame.headers.message ?? 'Verbindungsfehler')
      },
    })
    // Erst im nächsten Tick verbinden: StrictMode baut den Effekt sofort wieder ab, sonst würde der Browser einen
    // Socket schließen, der noch im Aufbau ist ("closed before the connection is established")
    const start = window.setTimeout(() => client.activate(), 0)

    return () => {
      stopped = true
      window.clearTimeout(start)
      void client.deactivate()
    }
  }, [debateId, userId])

  // Wenn der Chat öffnet oder die Stummschaltung endet, die Rechte neu laden
  useEffect(() => {
    if (!permissions) return
    const until =
      permissions.writeBlock === 'NOT_OPEN_YET'
        ? permissions.opensAt
        : permissions.writeBlock === 'MUTED'
          ? permissions.mutedUntil
          : null
    if (!until) return
    const delay = new Date(until).getTime() - Date.now() + 500
    if (delay > 24 * 60 * 60 * 1000) return
    const timer = window.setTimeout(() => {
      api<ChatSnapshot>(chatPath(debateId), { token: tokenRef.current })
        .then((snapshot) => {
          canModerateRef.current = snapshot.permissions.canModerate
          setPermissions(snapshot.permissions)
        })
        .catch(() => {})
    }, Math.max(0, delay))
    return () => window.clearTimeout(timer)
  }, [debateId, permissions])

  /** @returns Fehlermeldung oder `null`, wenn das Backend die Nachricht angenommen hat */
  const send = useCallback(
    async (text: string): Promise<string | null> => {
      const clientNonce = crypto.randomUUID()
      setPending((previous) => [...previous, { clientNonce, text }])
      try {
        await api(`${chatPath(debateId)}/messages`, {
          token: tokenRef.current,
          method: 'POST',
          body: { text, clientNonce },
        })
        return null
      } catch (e) {
        setPending((previous) => previous.filter((p) => p.clientNonce !== clientNonce))
        if (e instanceof ApiError && e.code === 'MUTED') {
          const mutedUntil = typeof e.body.mutedUntil === 'string' ? e.body.mutedUntil : null
          setPermissions((p) => p && { ...p, canWrite: false, writeBlock: 'MUTED', mutedUntil })
        }
        return e instanceof Error ? e.message : 'Senden fehlgeschlagen'
      }
    },
    [debateId],
  )

  const hide = useCallback(
    (messageId: string) =>
      api(`${chatPath(debateId)}/messages/${encodeURIComponent(messageId)}/hide`, {
        token: tokenRef.current,
        method: 'POST',
      }).catch((e: Error) => setError(e.message)),
    [debateId],
  )

  const mute = useCallback(
    (targetUserId: string, minutes: number) =>
      api(`${chatPath(debateId)}/mutes`, {
        token: tokenRef.current,
        method: 'POST',
        body: { userId: targetUserId, minutes },
      }).catch((e: Error) => setError(e.message)),
    [debateId],
  )

  return { messages, pending, permissions, assistants, connection, error, send, hide, mute }
}
