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

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

/**
 * A month laid out as weeks of 7 days for a calendar grid. The grid is padded
 * with leading/trailing days so every row is full; `weekStartsOn` defaults to
 * Sunday (0) but is a parameter so a future "week starts Monday" setting is a
 * one-line change at the call site.
 */
export function monthMatrix(year: number, month: number, weekStartsOn = 0): Date[][] {
  const first = new Date(year, month, 1)
  const start = new Date(first)
  const lead = (first.getDay() - weekStartsOn + 7) % 7
  start.setDate(first.getDate() - lead)

  const weeks: Date[][] = []
  const cursor = new Date(start)
  // Six rows always renders a stable-height grid regardless of month length.
  for (let w = 0; w < 6; w++) {
    const week: Date[] = []
    for (let d = 0; d < 7; d++) {
      week.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(week)
  }
  return weeks
}

export function weekdayLabels(weekStartsOn = 0): string[] {
  const base = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return [...base.slice(weekStartsOn), ...base.slice(0, weekStartsOn)]
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
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
