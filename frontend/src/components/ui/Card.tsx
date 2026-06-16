import { clsx } from 'clsx'
import type { HTMLAttributes } from 'react'

interface Props extends HTMLAttributes<HTMLDivElement> {
  padding?: boolean
}

export function Card({ padding = true, className, children, ...rest }: Props) {
  return (
    <div
      className={clsx(
        'rounded-xl bg-white shadow-card',
        padding && 'p-5',
        className
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
