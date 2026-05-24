import { useMemo, useState } from 'react'
import type { TaskWithContext } from '../types'
import { useStore } from '../store/store'
import { tasksInScope } from '../lib/tree'
import {
  isSameDay,
  monthLabel,
  monthMatrix,
  parseISODate,
  toISODate,
  todayISO,
  weekdayLabels,
} from '../lib/dates'
import { PriorityDot } from '../components/Badges'

// DECISION: a hand-rolled month grid rather than a calendar library. Defended:
// the layout is a fixed 6x7 grid and the only date math we need lives in
// lib/dates; pulling in a full calendar dependency would add weight and styling
// friction for no real gain at this stage. If we later want week/day views or
// recurring events, swapping in a library is contained entirely to this file.
//
// DECISION: only nodes that HAVE a dueDate appear on the calendar; unscheduled
// work lives in the Agenda's "No due date" bucket and in the Outline. Dragging
// a card onto another day reschedules it (sets dueDate to that day). The
// week-start day is centralised in lib/dates (`weekStartsOn`) for an easy
// future setting.
export function CalendarView({
  projectId,
  hideDone,
  onOpenTask,
}: {
  projectId: string | null
  hideDone: boolean
  onOpenTask: (id: string) => void
}) {
  const { data, updateTask } = useStore()
  const today = parseISODate(todayISO())
  const [cursor, setCursor] = useState(() => ({ y: today.getFullYear(), m: today.getMonth() }))
  const [dragId, setDragId] = useState<string | null>(null)
  const [overDay, setOverDay] = useState<string | null>(null)

  const weeks = useMemo(() => monthMatrix(cursor.y, cursor.m), [cursor])

  // Index scheduled tasks by their due ISO date for O(1) per-cell lookup.
  const byDate = useMemo(() => {
    const map = new Map<string, TaskWithContext[]>()
    for (const c of tasksInScope(data, projectId)) {
      if (!c.task.dueDate) continue
      if (hideDone && c.task.status === 'done') continue
      const list = map.get(c.task.dueDate) ?? []
      list.push(c)
      map.set(c.task.dueDate, list)
    }
    return map
  }, [data, projectId, hideDone])

  const goToday = () => setCursor({ y: today.getFullYear(), m: today.getMonth() })
  const shift = (delta: number) => {
    setCursor((c) => {
      const d = new Date(c.y, c.m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }

  const drop = (dayISO: string) => {
    if (dragId) updateTask(dragId, { dueDate: dayISO })
    setDragId(null)
    setOverDay(null)
  }

  return (
    <div>
      <div className="view-header">
        <h2>Calendar</h2>
        <span className="subtle">{monthLabel(cursor.y, cursor.m)}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <button className="btn btn-sm" onClick={() => shift(-1)} aria-label="Previous month">
            ‹
          </button>
          <button className="btn btn-sm" onClick={goToday}>
            Today
          </button>
          <button className="btn btn-sm" onClick={() => shift(1)} aria-label="Next month">
            ›
          </button>
        </div>
      </div>

      <div className="calendar">
        <div className="calendar-weekdays">
          {weekdayLabels().map((d) => (
            <div key={d} className="calendar-weekday">
              {d}
            </div>
          ))}
        </div>
        <div className="calendar-grid">
          {weeks.flat().map((day) => {
            const iso = toISODate(day)
            const items = byDate.get(iso) ?? []
            const inMonth = day.getMonth() === cursor.m
            const isToday = isSameDay(day, today)
            return (
              <div
                key={iso}
                className={`calendar-cell ${inMonth ? '' : 'outside'} ${
                  isToday ? 'today' : ''
                } ${overDay === iso ? 'drag-over' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault()
                  setOverDay(iso)
                }}
                onDragLeave={() => setOverDay((d) => (d === iso ? null : d))}
                onDrop={() => drop(iso)}
              >
                <div className="calendar-daynum">{day.getDate()}</div>
                <div className="calendar-cell-items">
                  {items.map((c) => (
                    <div
                      key={c.task.id}
                      className={`calendar-chip ${c.task.status === 'done' ? 'done' : ''}`}
                      draggable
                      onDragStart={() => setDragId(c.task.id)}
                      onDragEnd={() => {
                        setDragId(null)
                        setOverDay(null)
                      }}
                      onClick={() => onOpenTask(c.task.id)}
                      title={c.task.title}
                    >
                      <PriorityDot priority={c.task.priority} />
                      <span className="calendar-chip-title">{c.task.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
