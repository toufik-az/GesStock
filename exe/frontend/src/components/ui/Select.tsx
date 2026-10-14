import { forwardRef, type SelectHTMLAttributes } from 'react'
import { clsx } from 'clsx'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, Props>(
  ({ label, error, className, id, children, ...rest }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-encre">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'rounded-lg border px-3 py-2 text-sm text-encre outline-none transition bg-white',
            error
              ? 'border-cta focus:ring-2 focus:ring-cta'
              : 'border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20',
            className
          )}
          {...rest}
        >
          {children}
        </select>
        {error && <p className="text-xs text-cta">{error}</p>}
      </div>
    )
  }
)
Select.displayName = 'Select'
