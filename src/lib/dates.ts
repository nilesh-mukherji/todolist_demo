/** Today's date as YYYY-MM-DD in local time. */
export function todayISO(): string {
  const d = new Date()
  return toISODate(d)
}

export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse a YYYY-MM-DD string into a local Date at midnight. */
export function parseISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** Whole-day difference (target - today). Negative = in the past. */
export function daysFromToday(iso: string): number {
  const today = parseISODate(todayISO())
  const target = parseISODate(iso)
  return Math.round((target.getTime() - today.getTime()) / 86_400_000)
}

/** Human label for a due date relative to today. */
export function dueLabel(iso: string): string {
  const diff = daysFromToday(iso)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  const d = parseISODate(iso)
  const opts: Intl.DateTimeFormatOptions =
    d.getFullYear() === new Date().getFullYear()
      ? { month: 'short', day: 'numeric' }
      : { month: 'short', day: 'numeric', year: 'numeric' }
  return d.toLocaleDateString(undefined, opts)
}
