import type { Priority, TaskWithContext } from '../types'
import { daysFromToday, dueLabel } from '../lib/dates'
import { lineageLabels } from '../lib/tree'

export function DueBadge({ dueDate, done }: { dueDate: string | null; done?: boolean }) {
  if (!dueDate) return null
  const diff = daysFromToday(dueDate)
  const cls = done ? '' : diff < 0 ? 'overdue' : diff === 0 ? 'today' : ''
  return <span className={`badge badge-due ${cls}`}>{dueLabel(dueDate)}</span>
}

export function PriorityDot({ priority }: { priority: Priority }) {
  return <span className={`pri-dot pri-${priority}`} title={`Priority: ${priority}`} />
}

export function Lineage({ ctx }: { ctx: TaskWithContext }) {
  const labels = lineageLabels(ctx)
  return (
    <span className="lineage">
      {labels.map((l, i) => (
        <span key={i}>
          {i > 0 && <span className="sep">/</span>}
          {l}
        </span>
      ))}
    </span>
  )
}

export function Tags({ tags }: { tags: string[] }) {
  if (!tags.length) return null
  return (
    <>
      {tags.map((t) => (
        <span key={t} className="tag">
          #{t}
        </span>
      ))}
    </>
  )
}
