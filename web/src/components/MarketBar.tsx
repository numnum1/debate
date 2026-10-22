import { cn } from '@/lib/utils'

type Props = {
  /** Preis der A-Anteile, 0–100 */
  a: number
  sideA?: string
  sideB?: string
  /** Jury-Urteil auf demselben Balken, 0–100 Richtung A */
  verdict?: number
  size?: 'sm' | 'md'
  className?: string
}

/** Marktbalken A ↔ B; nach dem Urteil zusätzlich die Jury-Position auf demselben Balken. */
export function MarketBar({ a, sideA, sideB, verdict, size = 'md', className }: Props) {
  const b = 100 - a
  return (
    <div className={cn('w-full', className)}>
      {size === 'md' && (
        <div className="mb-1 flex justify-between text-xs text-muted-foreground">
          <span className="truncate">
            <span className="font-medium text-side-a">A {a}</span>
            {sideA && <span> · {sideA}</span>}
          </span>
          <span className="truncate text-right">
            {sideB && <span>{sideB} · </span>}
            <span className="font-medium text-side-b">{b} B</span>
          </span>
        </div>
      )}
      <div className={cn('relative flex overflow-visible rounded-full', size === 'md' ? 'h-2' : 'h-1.5')}>
        <div className="rounded-l-full bg-side-a" style={{ width: `${a}%` }} />
        <div className="rounded-r-full bg-side-b" style={{ width: `${b}%` }} />
        {verdict !== undefined && (
          <div
            className="absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 bg-foreground"
            style={{ left: `${verdict}%` }}
            title={`Jury: ${verdict}`}
          />
        )}
      </div>
      {verdict !== undefined && size === 'md' && (
        <div className="relative mt-1 h-4 text-xs">
          <span
            className="absolute -translate-x-1/2 font-medium whitespace-nowrap"
            style={{ left: `${verdict}%` }}
          >
            Jury {verdict}
          </span>
        </div>
      )}
    </div>
  )
}
