import { useRef, useState } from 'react'

interface Props {
  onScan: (code: string) => void
  placeholder?: string
  autoFocus?: boolean
  className?: string
}

export function BarcodeInput({
  onScan,
  placeholder = 'Code-barres…',
  autoFocus = true,
  className,
}: Props) {
  const [value, setValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const code = value.trim()
      if (code) {
        onScan(code)
        setValue('')
        inputRef.current?.focus()
      }
    }
  }

  return (
    <input
      ref={inputRef}
      // eslint-disable-next-line jsx-a11y/no-autofocus
      autoFocus={autoFocus}
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-encre outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 ${className ?? ''}`}
    />
  )
}

