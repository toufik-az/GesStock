import { Card } from './Card'

interface Props {
  label: string
  value: string
  sub?: string
  accent?: 'default' | 'warn' | 'danger'
}

const accents = {
  default: 'text-primary',
  warn:    'text-warn',
  danger:  'text-cta',
}

export function StatCard({ label, value, sub, accent = 'default' }: Props) {
  return (
    <Card>
      <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className={`mt-1 font-mono text-2xl font-semibold tabular-nums ${accents[accent]}`}>
        {value}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted">{sub}</p>}
    </Card>
  )
}
