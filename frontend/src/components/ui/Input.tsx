import { forwardRef, type InputHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, Props>(
  ({ label, error, className, id, ...rest }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-encre">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'rounded-lg border px-3 py-2 text-sm text-encre outline-none transition',
            error
              ? 'border-cta bg-cta-light focus:ring-2 focus:ring-cta'
              : 'border-gray-200 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20',
            className
          )}
          {...rest}
        />
        {error && <p className="text-xs text-cta">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'
