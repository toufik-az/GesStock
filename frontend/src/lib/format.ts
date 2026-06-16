/** Format a number as Dinars Algériens with tabular mono display. */
export function versDa(value: number): string {
  return (
    new Intl.NumberFormat('fr-DZ', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value) + '\u00a0DA'
  )
}

/** Compact format — used in narrow stat cards. */
export function versDaCompact(value: number): string {
  if (value >= 1_000_000) {
    return (
      new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 1 }).format(value / 1_000_000) +
      'M\u00a0DA'
    )
  }
  if (value >= 1_000) {
    return (
      new Intl.NumberFormat('fr-DZ', { maximumFractionDigits: 0 }).format(value / 1_000) +
      'k\u00a0DA'
    )
  }
  return versDa(value)
}

/** Format a quantity — omit decimals if it's a whole number. */
export function versQte(value: number): string {
  return Number.isInteger(value) ? value.toString() : value.toFixed(2)
}

/** Full French date + time. */
export function versDateFr(iso: string): string {
  return new Date(iso).toLocaleString('fr-DZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Short date only. */
export function versDateCourte(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-DZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/** Start-of-day timestamp for a date N days ago. */
export function debutJour(daysAgo = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

/** Current timestamp. */
export function maintenant(): string {
  return new Date().toISOString()
}
