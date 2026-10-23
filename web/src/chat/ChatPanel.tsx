import { ArrowDownIcon, EyeOffIcon, MoreHorizontalIcon, SendIcon, VolumeXIcon } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from 'react-oidc-context'

import type { ChatAssistant, ChatBadge, ChatMessage, ChatPermissions } from '@/api/chat'
import { signIn } from '@/auth'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { formatStart } from '@/lib/format'
import { cn } from '@/lib/utils'
import { firstMention, splitMentions } from './mentions'
import { useChat, type Connection } from './useChat'

const badgeStyle: Record<ChatBadge, { label: string; className: string }> = {
  HOST: { label: 'Host', className: 'bg-violet-600 text-white' },
  MODERATOR: { label: 'Mod', className: 'bg-emerald-600 text-white' },
  RESOLVER: { label: 'Resolver', className: 'bg-sky-700 text-white' },
  ADMIN: { label: 'Admin', className: 'bg-red-600 text-white' },
  AI: { label: 'KI', className: 'bg-foreground text-background' },
}

const time = new Intl.DateTimeFormat('de', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

/** So lange zeigt der Chat „schreibt …“, falls die Antwort der KI ausbleibt */
const THINKING_MS = 90_000

type Thinking = { messageId: string; assistant: ChatAssistant; userName: string }

/** Fragen an eine KI, auf die noch keine Antwort im Chat steht */
function openQuestions(messages: ChatMessage[], assistants: ChatAssistant[], now: number): Thinking[] {
  const answered = new Set(messages.flatMap((m) => (m.replyTo ? [m.replyTo.messageId] : [])))
  return messages.flatMap((m) => {
    if (m.badge === 'AI' || m.hidden || answered.has(m.id)) return []
    if (now - new Date(m.sentAt).getTime() > THINKING_MS) return []
    const assistant = firstMention(m.text, assistants)
    return assistant ? [{ messageId: m.id, assistant, userName: m.userName }] : []
  })
}

/** Öffentlicher Live-Chat einer Debatte, wie bei Twitch: unten schreiben, die Liste läuft mit. */
export function ChatPanel({ debateId }: { debateId: string }) {
  const auth = useAuth()
  const userId = auth.user?.profile.sub
  // Erst verbinden, wenn feststeht, wer angemeldet ist. Sonst baut der Chat beim Laden erst eine anonyme
  // Verbindung auf und bricht sie beim Remount ab, was Browser als Verbindungsfehler melden
  if (auth.isLoading) {
    return <section className="flex min-h-0 flex-1 flex-col rounded-lg border bg-card" data-testid="chat-panel" />
  }
  // Neu mounten, wenn sich Debatte oder Nutzer ändern, damit kein alter Stand stehen bleibt
  return <Chat key={`${debateId}:${userId ?? ''}`} debateId={debateId} userId={userId} />
}

function Chat({ debateId, userId }: { debateId: string; userId: string | undefined }) {
  const auth = useAuth()
  const chat = useChat(debateId, auth.user?.access_token, userId)
  const listRef = useRef<HTMLDivElement>(null)
  // Wie bei Twitch: unten bleiben, solange man unten ist; wer hochscrollt, bekommt einen Hinweis auf Neues
  const [atBottom, setAtBottom] = useState(true)
  const [lastSeenId, setLastSeenId] = useState<string | undefined>()
  const lastId = chat.messages.at(-1)?.id
  const unseen = !atBottom && lastId !== lastSeenId

  // Uhr für „schreibt …“; läuft nur, solange eine Frage an eine KI offen ist
  const [now, setNow] = useState(() => Date.now())
  const thinking = openQuestions(chat.messages, chat.assistants, now)
  const waiting = thinking.length > 0
  useEffect(() => {
    if (!waiting) return
    const timer = window.setInterval(() => setNow(Date.now()), 5_000)
    return () => window.clearInterval(timer)
  }, [waiting])

  useLayoutEffect(() => {
    const list = listRef.current
    if (list && atBottom) list.scrollTop = list.scrollHeight
  }, [chat.messages, chat.pending, waiting, atBottom])

  const onScroll = () => {
    const list = listRef.current
    if (!list) return
    const bottom = list.scrollHeight - list.scrollTop - list.clientHeight < 24
    if (bottom === atBottom) return
    setAtBottom(bottom)
    if (!bottom) setLastSeenId(lastId)
  }

  const scrollToEnd = () => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
    setAtBottom(true)
  }

  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-lg border bg-card" data-testid="chat-panel">
      <header className="flex items-center justify-between border-b px-3 py-2">
        <span className="text-sm font-medium">Chat</span>
        <ConnectionState connection={chat.connection} />
      </header>

      <div className="relative min-h-0 flex-1">
        <div
          ref={listRef}
          onScroll={onScroll}
          className="h-full overflow-y-auto px-3 py-2 text-sm"
          data-testid="chat-messages"
        >
          {chat.messages.length === 0 && chat.pending.length === 0 && (
            <p className="py-6 text-center text-muted-foreground" data-testid="chat-empty">
              {chat.connection === 'connecting' ? 'Verbinde …' : 'Noch keine Nachrichten.'}
            </p>
          )}
          {chat.messages.map((message) => (
            <ChatLine
              key={message.id}
              message={message}
              assistants={chat.assistants}
              canModerate={chat.permissions?.canModerate ?? false}
              own={message.userId === userId}
              onHide={() => void chat.hide(message.id)}
              onMute={(minutes) => void chat.mute(message.userId, minutes)}
            />
          ))}
          {thinking.map((t) => (
            <p key={t.messageId} className="flex items-center gap-1.5 px-1 py-0.5 text-muted-foreground" data-testid="chat-ai-thinking">
              <span className="size-1.5 animate-pulse rounded-full bg-foreground/60" />
              {t.assistant.displayName} schreibt eine Antwort an {t.userName} …
            </p>
          ))}
          {chat.pending.map((p) => (
            <p key={p.clientNonce} className="py-0.5 text-muted-foreground" data-testid="chat-pending">
              <span className="font-semibold">{auth.user?.profile.name}</span>: {p.text}
              <span className="ml-1 text-xs">(wird gesendet)</span>
            </p>
          ))}
        </div>
        {unseen && (
          <Button
            size="sm"
            variant="secondary"
            className="absolute bottom-2 left-1/2 -translate-x-1/2 shadow"
            onClick={scrollToEnd}
            data-testid="chat-new-messages"
          >
            <ArrowDownIcon />
            Neue Nachrichten
          </Button>
        )}
      </div>

      {chat.error && (
        <p className="border-t px-3 py-1.5 text-xs text-destructive" data-testid="chat-error">
          {chat.error}
        </p>
      )}
      <footer className="border-t p-2">
        <Composer
          permissions={chat.permissions}
          assistant={chat.assistants.find((a) => a.name === 'grok') ?? chat.assistants[0]}
          onSend={chat.send}
          onSignIn={() => void signIn(auth)}
        />
      </footer>
    </section>
  )
}

function ConnectionState({ connection }: { connection: Connection }) {
  const label = { connecting: 'Verbinde …', live: 'Live', offline: 'Getrennt, verbinde neu …' }[connection]
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground" data-testid="chat-connection">
      <span
        className={cn(
          'size-2 rounded-full',
          connection === 'live' ? 'bg-emerald-500' : connection === 'offline' ? 'bg-amber-500' : 'bg-muted-foreground',
        )}
      />
      {label}
    </span>
  )
}

function ChatLine({
  message,
  assistants,
  canModerate,
  own,
  onHide,
  onMute,
}: {
  message: ChatMessage
  assistants: ChatAssistant[]
  canModerate: boolean
  own: boolean
  onHide: () => void
  onMute: (minutes: number) => void
}) {
  const badge = message.badge && badgeStyle[message.badge]
  const ai = message.badge === 'AI'
  return (
    <div
      className={cn(
        'group relative rounded px-1 py-0.5 leading-snug hover:bg-muted/60',
        ai && 'my-1 border-l-2 border-foreground/70 bg-muted/50 py-1 pl-2',
        message.hidden && 'opacity-50',
      )}
      title={time.format(new Date(message.sentAt))}
      data-testid={ai ? 'chat-ai-message' : 'chat-message'}
    >
      {message.replyTo && (
        <p className="mb-0.5 truncate text-xs text-muted-foreground" data-testid="chat-reply-to">
          Antwort an {message.replyTo.userName}: „{message.replyTo.excerpt}“
        </p>
      )}
      {badge && (
        <span className={cn('mr-1 rounded px-1 py-px align-[1px] text-[10px] font-semibold', badge.className)}>
          {badge.label}
        </span>
      )}
      <span className={cn('font-semibold', own && 'text-[var(--side-a)]')}>{message.userName}</span>
      <span className="text-muted-foreground">: </span>
      <span className={cn('break-words', message.hidden && 'line-through')}>
        {splitMentions(message.text, assistants).map((part, i) =>
          part.assistant ? (
            <span key={i} className="font-semibold">
              {part.text}
            </span>
          ) : (
            part.text
          ),
        )}
      </span>
      {message.hidden && <span className="ml-1 text-xs text-muted-foreground">(ausgeblendet)</span>}
      {message.sources.length > 0 && (
        <ol className="mt-1 flex flex-col gap-0.5 text-xs" data-testid="chat-ai-sources">
          {message.sources.map((source, i) => (
            <li key={source.url} className="truncate">
              <span className="text-muted-foreground">[{i + 1}] </span>
              <a href={source.url} target="_blank" rel="noopener noreferrer nofollow" className="underline underline-offset-2 hover:text-foreground/80">
                {source.title}
              </a>
            </li>
          ))}
        </ol>
      )}

      {canModerate && !message.hidden && (
        <DropdownMenu>
          <DropdownMenuTrigger
            className="absolute top-0.5 right-0.5 hidden rounded bg-background p-0.5 text-muted-foreground shadow-sm group-hover:block data-[state=open]:block"
            aria-label="Moderieren"
            data-testid="chat-moderate-trigger"
          >
            <MoreHorizontalIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onHide} data-testid="chat-hide">
              <EyeOffIcon />
              Ausblenden
            </DropdownMenuItem>
            {!own && !message.badge && (
              <>
                <DropdownMenuItem onSelect={() => onMute(10)} data-testid="chat-mute-10">
                  <VolumeXIcon />
                  10 Minuten stummschalten
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => onMute(60)} data-testid="chat-mute-60">
                  <VolumeXIcon />1 Stunde stummschalten
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

function Composer({
  permissions,
  assistant,
  onSend,
  onSignIn,
}: {
  permissions: ChatPermissions | null
  /** Für den Hinweis im Eingabefeld */
  assistant: ChatAssistant | undefined
  onSend: (text: string) => Promise<string | null>
  onSignIn: () => void
}) {
  const [text, setText] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!permissions) return <p className="px-1 py-1.5 text-sm text-muted-foreground">…</p>

  if (!permissions.canWrite) {
    const reason = {
      SIGN_IN: 'Zum Mitschreiben anmelden.',
      JUROR: 'Juroren sehen den Chat nicht.',
      NOT_OPEN_YET: `Der Chat öffnet mit dem Wettschluss, ${formatStart(new Date(permissions.opensAt))}.`,
      CLOSED: 'Der Chat ist geschlossen und nur noch lesbar.',
      MUTED: permissions.mutedUntil
        ? `Du bist stummgeschaltet bis ${time.format(new Date(permissions.mutedUntil))}.`
        : 'Du bist stummgeschaltet.',
    }[permissions.writeBlock ?? 'CLOSED']
    return (
      <div className="flex items-center justify-between gap-2 px-1 py-1" data-testid="chat-write-blocked">
        <p className="text-sm text-muted-foreground">{reason}</p>
        {permissions.writeBlock === 'SIGN_IN' && (
          <Button size="sm" onClick={onSignIn} data-testid="chat-sign-in">
            Anmelden
          </Button>
        )}
      </div>
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    const message = text.trim()
    if (!message) return
    setText('')
    setError(null)
    const failure = await onSend(message)
    if (failure) {
      setError(failure)
      // Den Text nicht verlieren, wenn noch nichts Neues getippt wurde
      setText((current) => current || message)
    }
  }

  const left = permissions.maxLength - text.length
  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-1" data-testid="chat-composer">
      <div className="flex gap-2">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          maxLength={permissions.maxLength}
          placeholder={assistant ? `Nachricht senden oder @${assistant.name} fragen` : 'Nachricht senden'}
          aria-label="Nachricht"
          data-testid="chat-input"
        />
        <Button type="submit" size="icon" disabled={!text.trim()} aria-label="Senden" data-testid="chat-send">
          <SendIcon />
        </Button>
      </div>
      {(error || left < 50) && (
        <div className="flex justify-between px-1 text-xs">
          <span className="text-destructive" data-testid="chat-send-error">
            {error}
          </span>
          {left < 50 && <span className="text-muted-foreground tabular-nums">{left}</span>}
        </div>
      )}
    </form>
  )
}
