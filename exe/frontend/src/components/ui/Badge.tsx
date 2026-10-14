import { clsx } from 'clsx'

type Variant = 'default' | 'success' | 'warn' | 'danger' | 'info'

interface Props {
  children: React.ReactNode
  variant?: Variant
  className?: string
}

const styles: Record<Variant, string> = {
  default: 'bg-gray-100 text-muted',
  success: 'bg-green-100 text-success',
  warn:    'bg-amber-100 text-amber-700',
  danger:  'bg-cta-light text-cta',
  info:    'bg-primary-light text-primary',
}

export function Badge({ children, variant = 'default', className }: Props) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium', styles[variant], className)}>
      {children}
    </span>
  )
}
