import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'
import { Spinner } from './Spinner'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'cta' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, Props>(
  ({ variant = 'primary', size = 'md', loading, disabled, className, children, ...rest }, ref) => (
    <button
      ref={ref}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
        {
          // variants
          'bg-primary text-white hover:bg-primary-hover focus-visible:ring-primary':
            variant === 'primary',
          'bg-cta text-white hover:bg-cta-hover focus-visible:ring-cta':
            variant === 'cta',
          'bg-transparent text-muted hover:bg-gray-100 hover:text-encre':
            variant === 'ghost',
          'bg-cta-light text-cta hover:bg-red-100 focus-visible:ring-cta':
            variant === 'danger',
          // sizes
          'px-3 py-1.5 text-xs': size === 'sm',
          'px-4 py-2 text-sm':   size === 'md',
          'px-5 py-2.5 text-sm': size === 'lg',
          // disabled
          'opacity-50 cursor-not-allowed': disabled || loading,
        },
        className
      )}
      {...rest}
    >
      {loading && <Spinner size="sm" />}
      {children}
    </button>
  )
)
Button.displayName = 'Button'
