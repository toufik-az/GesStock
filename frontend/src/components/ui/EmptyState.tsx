import type { ReactNode } from 'react'

interface Props { icon?: ReactNode; message: string; action?: ReactNode }

export function EmptyState({ icon, message, action }: Props) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      {icon && <div className="text-gray-300">{icon}</div>}
      <p className="text-sm text-muted">{message}</p>
      {action}
    </div>
  )
}
