import { CheckIcon } from 'lucide-react'
import { type ReactNode, useState } from 'react'
import { useAuth } from 'react-oidc-context'

import { createDebate } from '@/api/debates'
import { useDebates } from '@/api/debates-context'
import { ApiError } from '@/api/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { signIn } from '@/auth'
import { platformLabel } from '@/lib/format'
import type { Debate, Platform } from '@/mock/data'
import {
  type AssignableRole,
  type Errors,
  type Form,
  closeFor,
  emptyForm,
  stepOfField,
  steps,
  toRequest,
  validateStep,
} from './newDebate'
import { RolePicker } from './RolePicker'

const streamUrlExample: Record<Platform, string> = {
  youtube: 'https://www.youtube.com/watch?v=…',
  twitch: 'https://www.twitch.tv/kanal',
  x: 'https://x.com/i/broadcasts/…',
}

const evidenceLabel = { CLOSED: 'Geschlossen', OPEN: 'Offen' } as const
const pointBetsLabel = { OFF: 'Aus', PRESET: 'Vorgegeben' } as const

function Field({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && (
        <p className="text-xs text-destructive" data-testid={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  )
}

/** Einfachauswahl aus wenigen Werten; ein Klick auf den gewählten Wert lässt ihn gewählt. */
function Choice<T extends string | number>({
  value,
  onChange,
  options,
  testId,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string }[]
  testId: string
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      spacing={0}
      value={String(value)}
      onValueChange={(next) => {
        const option = options.find((o) => String(o.value) === next)
        if (option) onChange(option.value)
      }}
      className="w-fit"
      data-testid={testId}
    >
      {options.map((option) => (
        <ToggleGroupItem
          key={option.value}
          value={String(option.value)}
          className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          data-testid={`${testId}-${option.value}`}
        >
          {option.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

function Progress({ step }: { step: number }) {
  return (
    <ol className="flex items-center gap-2 text-sm" data-testid="wizard-progress">
      {steps.map((s, index) => (
        <li key={s.key} className="flex items-center gap-2" data-testid={`wizard-progress-${s.key}`}>
          <span
            className={`flex size-6 items-center justify-center rounded-full text-xs font-medium ${
              index < step
                ? 'bg-primary text-primary-foreground'
                : index === step
                  ? 'bg-primary/15 text-primary ring-1 ring-primary'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {index < step ? <CheckIcon className="size-3.5" /> : index + 1}
          </span>
          <span className={index === step ? 'font-medium' : 'text-muted-foreground'}>{s.label}</span>
          {index < steps.length - 1 && <span className="mx-1 h-px w-6 bg-border" />}
        </li>
      ))}
    </ol>
  )
}

function Summary({ form }: { form: Form }) {
  const when = (value: string) => new Date(value).toLocaleString('de', { dateStyle: 'full', timeStyle: 'short' })
  const names = (role: AssignableRole) =>
    form.roles[role].map((user) => user.displayName || user.username).join(', ') || 'niemand'
  const rows: [string, string][] = [
    ['Thema', form.topic.trim()],
    ['Seiten', `${form.sideA.trim()} gegen ${form.sideB.trim()}`],
    ['Kategorie', form.category.trim()],
    ['Plattform', platformLabel[form.platform]],
    ['Stream', form.streamUrl.trim()],
    ['Start', when(form.startsAt)],
    ['Wettschluss', when(form.bettingClosesAt)],
    ['Regelwerk', `Standard, ${form.jurors} Juroren, Evidenz ${evidenceLabel[form.evidence].toLowerCase()}, Point Bets ${pointBetsLabel[form.pointBets].toLowerCase()}`],
    ['Juroren', `${names('JUROR')} (${form.roles.JUROR.length} von ${form.jurors})`],
    ['Moderatoren', names('MODERATOR')],
    ['Resolver', names('RESOLVER')],
  ]
  return (
    <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm" data-testid="wizard-summary">
      {rows.map(([term, value]) => (
        <div key={term} className="col-span-2 grid grid-cols-subgrid">
          <dt className="text-muted-foreground">{term}</dt>
          <dd className="break-words">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Debatte anlegen in fünf Schritten; wer sie anlegt, wird ihr Host. */
export function NewDebateWizard({ onCreated }: { onCreated: (debate: Debate) => Promise<void> }) {
  const auth = useAuth()
  const { debates } = useDebates()
  const [form, setForm] = useState(() => emptyForm(new Date()))
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<Errors>({})
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!auth.isAuthenticated) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center" data-testid="wizard-sign-in">
        <p className="text-lg font-medium">Zum Anlegen einer Debatte anmelden</p>
        <p className="text-sm text-muted-foreground">Wer eine Debatte anlegt, ist ihr Host und vergibt die übrigen Rollen.</p>
        <Button onClick={() => void signIn(auth)} disabled={auth.isLoading} data-testid="wizard-sign-in-button">
          Anmelden
        </Button>
      </div>
    )
  }

  const hostId = auth.user?.profile.sub
  const categories = [...new Set(debates.map((d) => d.category))].sort()

  const update = (patch: Partial<Form>) => {
    setForm((current) => {
      const next = { ...current, ...patch }
      if ('startsAt' in patch && !next.closesTouched) next.bettingClosesAt = closeFor(next.startsAt)
      if ('bettingClosesAt' in patch) next.closesTouched = true
      return next
    })
    setErrors((current) => {
      const rest = { ...current }
      for (const key of Object.keys(patch)) delete rest[key]
      if ('jurors' in patch) delete rest.roles
      return rest
    })
    setServerError(null)
  }

  const next = () => {
    const found = validateStep(step, form, new Date())
    setErrors(found)
    if (Object.keys(found).length === 0) setStep(step + 1)
  }

  const submit = async () => {
    const token = auth.user?.access_token
    if (!token) return
    setSubmitting(true)
    setServerError(null)
    try {
      await onCreated(await createDebate(toRequest(form), token))
    } catch (e) {
      if (e instanceof ApiError) {
        const field = typeof e.body.field === 'string' ? e.body.field : undefined
        setErrors(field ? { [field]: e.message } : {})
        setServerError(e.message)
        setStep(stepOfField(field))
      } else {
        setServerError('Das Anlegen hat nicht geklappt. Läuft das Backend?')
      }
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 py-4" data-testid="new-debate-wizard">
      <div>
        <h2 className="mb-3 text-xl font-semibold">Neue Debatte</h2>
        <Progress step={step} />
      </div>

      {serverError && (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" data-testid="wizard-error">
          {serverError}
        </p>
      )}

      <section className="flex flex-col gap-4" data-testid={`wizard-step-${steps[step].key}`}>
        {step === 0 && (
          <>
            <Field id="wizard-topic" label="Thema" error={errors.topic} hint="Als Frage oder Behauptung, wie sie die Debatte entscheiden soll.">
              <Input
                id="wizard-topic"
                value={form.topic}
                onChange={(e) => update({ topic: e.target.value })}
                placeholder="Tempolimit 130 auf Autobahnen"
                data-testid="wizard-topic"
                aria-invalid={!!errors.topic}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field id="wizard-side-a" label="Seite A" error={errors.sideA} hint="Name der Person oder Gruppe">
                <Input
                  id="wizard-side-a"
                  value={form.sideA}
                  onChange={(e) => update({ sideA: e.target.value })}
                  data-testid="wizard-side-a"
                  aria-invalid={!!errors.sideA}
                />
              </Field>
              <Field id="wizard-side-b" label="Seite B" error={errors.sideB} hint="Name der Person oder Gruppe">
                <Input
                  id="wizard-side-b"
                  value={form.sideB}
                  onChange={(e) => update({ sideB: e.target.value })}
                  data-testid="wizard-side-b"
                  aria-invalid={!!errors.sideB}
                />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground">
              Die Debattierer sind keine Nutzer der App. Die Debatte findet auf der Plattform statt, hier stehen nur ihre Namen.
            </p>
            <Field id="wizard-category" label="Kategorie" error={errors.category}>
              <Input
                id="wizard-category"
                list="wizard-categories"
                value={form.category}
                onChange={(e) => update({ category: e.target.value })}
                placeholder="Politik"
                data-testid="wizard-category"
                aria-invalid={!!errors.category}
              />
              <datalist id="wizard-categories">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
          </>
        )}

        {step === 1 && (
          <>
            <Field id="wizard-platform" label="Plattform">
              <Choice
                value={form.platform}
                onChange={(platform) => update({ platform })}
                options={(Object.keys(platformLabel) as Platform[]).map((value) => ({ value, label: platformLabel[value] }))}
                testId="wizard-platform"
              />
            </Field>
            <Field
              id="wizard-stream-url"
              label="Stream-Adresse"
              error={errors.streamUrl}
              hint="Der Link zur Übertragung, auf der die Debatte stattfindet."
            >
              <Input
                id="wizard-stream-url"
                value={form.streamUrl}
                onChange={(e) => update({ streamUrl: e.target.value })}
                placeholder={streamUrlExample[form.platform]}
                data-testid="wizard-stream-url"
                aria-invalid={!!errors.streamUrl}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field id="wizard-starts-at" label="Start" error={errors.startsAt}>
                <Input
                  id="wizard-starts-at"
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => update({ startsAt: e.target.value })}
                  data-testid="wizard-starts-at"
                  aria-invalid={!!errors.startsAt}
                />
              </Field>
              <Field
                id="wizard-betting-closes-at"
                label="Wettschluss"
                error={errors.bettingClosesAt}
                hint="Vorschlag: 30 Minuten vor dem Start. Danach lässt er sich nicht mehr ändern."
              >
                <Input
                  id="wizard-betting-closes-at"
                  type="datetime-local"
                  value={form.bettingClosesAt}
                  onChange={(e) => update({ bettingClosesAt: e.target.value })}
                  data-testid="wizard-betting-closes-at"
                  aria-invalid={!!errors.bettingClosesAt}
                />
              </Field>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <div className="rounded-lg border bg-muted/40 p-4 text-sm" data-testid="wizard-ruleset-template">
              <p className="font-medium">Template „Standard“</p>
              <p className="mt-1 text-muted-foreground">
                Das Ergebnis ist ein Slider, das Urteil der Median der Juroren. Juroren sehen weder Quoten noch Chat. Das Regelwerk wird
                gesperrt, sobald die Wetten öffnen.
              </p>
            </div>
            <Field id="wizard-jurors" label="Größe der Jury" hint="Ungerade, damit der Median ein Urteil eines Jurors ist.">
              <Choice
                value={form.jurors}
                onChange={(jurors) => update({ jurors })}
                options={([3, 5, 7] as const).map((value) => ({ value, label: `${value} Juroren` }))}
                testId="wizard-jurors"
              />
            </Field>
            <Field
              id="wizard-evidence"
              label="Evidenz"
              hint={
                form.evidence === 'CLOSED'
                  ? 'Juroren berücksichtigen nur, was in der Debatte gesagt wird.'
                  : 'Auch Faktenchecks und Notizen dürfen die Juroren berücksichtigen.'
              }
            >
              <Choice
                value={form.evidence}
                onChange={(evidence) => update({ evidence })}
                options={(Object.keys(evidenceLabel) as (keyof typeof evidenceLabel)[]).map((value) => ({
                  value,
                  label: evidenceLabel[value],
                }))}
                testId="wizard-evidence"
              />
            </Field>
            <Field
              id="wizard-point-bets"
              label="Point Bets"
              hint={
                form.pointBets === 'OFF'
                  ? 'Es gibt nur den Hauptmarkt.'
                  : 'Zusätzlich zum Hauptmarkt gibt es vorgegebene Wetten auf einzelne Aussagen.'
              }
            >
              <Choice
                value={form.pointBets}
                onChange={(pointBets) => update({ pointBets })}
                options={(Object.keys(pointBetsLabel) as (keyof typeof pointBetsLabel)[]).map((value) => ({
                  value,
                  label: pointBetsLabel[value],
                }))}
                testId="wizard-point-bets"
              />
            </Field>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-sm text-muted-foreground">
              Du bist als Host dabei und kannst in derselben Debatte keine weitere Rolle haben. Vor dem Öffnen der Wetten muss die Jury
              vollständig sein.
            </p>
            {errors.roles && (
              <p className="text-sm text-destructive" data-testid="wizard-roles-error">
                {errors.roles}
              </p>
            )}
            <RolePicker
              role="JUROR"
              label="Juroren"
              hint="Anonym für die Öffentlichkeit. Juroren dürfen weder wetten noch chatten."
              selected={form.roles.JUROR}
              max={form.jurors}
              excludeId={hostId}
              onChange={(users) => update({ roles: { ...form.roles, JUROR: users } })}
            />
            <RolePicker
              role="MODERATOR"
              label="Moderatoren"
              hint="Blenden Chat-Nachrichten aus und schalten Nutzer stumm."
              selected={form.roles.MODERATOR}
              excludeId={hostId}
              onChange={(users) => update({ roles: { ...form.roles, MODERATOR: users } })}
            />
            <RolePicker
              role="RESOLVER"
              label="Resolver"
              hint="Lösen Point Bets auf."
              selected={form.roles.RESOLVER}
              excludeId={hostId}
              onChange={(users) => update({ roles: { ...form.roles, RESOLVER: users } })}
            />
          </>
        )}

        {step === 4 && <Summary form={form} />}
      </section>

      <div className="flex items-center justify-between border-t pt-4">
        <Button
          variant="ghost"
          disabled={step === 0 || submitting}
          onClick={() => {
            setErrors({})
            setServerError(null)
            setStep(step - 1)
          }}
          data-testid="wizard-back-button"
        >
          Zurück
        </Button>
        {step < steps.length - 1 ? (
          <Button onClick={next} data-testid="wizard-next-button">
            Weiter
          </Button>
        ) : (
          <Button onClick={() => void submit()} disabled={submitting} data-testid="wizard-submit-button">
            {submitting ? 'Lege an …' : 'Debatte anlegen'}
          </Button>
        )}
      </div>
    </div>
  )
}
