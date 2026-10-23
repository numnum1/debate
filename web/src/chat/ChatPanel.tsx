import { ArrowDownIcon, EyeOffIcon, MoreHorizontalIcon, SendIcon, VolumeXIcon } from 'lucide-react'
import { useLayoutEffect, useRef, useState, type FormEvent } from 'react'
import { useAuth } from 'react-oidc-context'

import type { ChatBadge, ChatMessage, ChatPermissions } from '@/api/chat'
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
import { useChat, type Connection } from './useChat'

const badgeStyle: Record<ChatBadge, { label: string; className: string }> = {
  HOST: { label: 'Host', className: 'bg-violet-600 text-white' },
  MODERATOR: { label: 'Mod', className: 'bg-emerald-600 text-white' },
  RESOLVER: { label: 'Resolver', className: 'bg-sky-700 text-white' },
  ADMIN: { label: 'Admin', className: 'bg-red-600 text-white' },
}

const time = new Intl.DateTimeFormat('de', { hour: '2-digit', minute: '2-digit', second: '2-digit' })

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

  useLayoutEffect(() => {
    const list = listRef.current
    if (list && atBottom) list.scrollTop = list.scrollHeight
  }, [chat.messages, chat.pending, atBottom])

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
              canModerate={chat.permissions?.canModerate ?? false}
              own={message.userId === userId}
              onHide={() => void chat.hide(message.id)}
              onMute={(minutes) => void chat.mute(message.userId, minutes)}
            />
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
  canModerate,
  own,
  onHide,
  onMute,
}: {
  message: ChatMessage
  canModerate: boolean
  own: boolean
  onHide: () => void
  onMute: (minutes: number) => void
}) {
  const badge = message.badge && badgeStyle[message.badge]
  return (
    <div
      className={cn('group relative rounded px-1 py-0.5 leading-snug hover:bg-muted/60', message.hidden && 'opacity-50')}
      title={time.format(new Date(message.sentAt))}
      data-testid="chat-message"
    >
      {badge && (
        <span className={cn('mr-1 rounded px-1 py-px align-[1px] text-[10px] font-semibold', badge.className)}>
          {badge.label}
        </span>
      )}
      <span className={cn('font-semibold', own && 'text-[var(--side-a)]')}>{message.userName}</span>
      <span className="text-muted-foreground">: </span>
      <span className={cn('break-words', message.hidden && 'line-through')}>{message.text}</span>
      {message.hidden && <span className="ml-1 text-xs text-muted-foreground">(ausgeblendet)</span>}

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
  onSend,
  onSignIn,
}: {
  permissions: ChatPermissions | null
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
          placeholder="Nachricht senden"
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
