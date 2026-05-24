import { useMemo } from 'react'
import type { TaskWithContext } from '../types'
import { useStore } from '../store/store'
import { allTasksWithContext } from '../lib/tree'
import { daysFromToday } from '../lib/dates'
import { DueBadge, Lineage, PriorityDot, Tags } from '../components/Badges'

type BucketKey = 'overdue' | 'today' | 'tomorrow' | 'week' | 'later' | 'none'

const BUCKET_ORDER: BucketKey[] = ['overdue', 'today', 'tomorrow', 'week', 'later', 'none']
const BUCKET_LABEL: Record<BucketKey, string> = {
  overdue: 'Overdue',
  today: 'Today',
  tomorrow: 'Tomorrow',
  week: 'This week',
  later: 'Later',
  none: 'No due date',
}

function bucketFor(dueDate: string | null): BucketKey {
  if (!dueDate) return 'none'
  const diff = daysFromToday(dueDate)
  if (diff < 0) return 'overdue'
  if (diff === 0) return 'today'
  if (diff === 1) return 'tomorrow'
  if (diff <= 7) return 'week'
  return 'later'
}

export function AgendaView({
  projectId,
  hideDone,
  onOpenTask,
}: {
  projectId: string | null
  hideDone: boolean
  onOpenTask: (id: string) => void
}) {
  const { data } = useStore()

  const buckets = useMemo(() => {
    const all = allTasksWithContext(data)
      .filter((c) => (projectId ? c.task.projectId === projectId : true))
      .filter((c) => (hideDone ? c.task.status !== 'done' : true))

    const grouped: Record<BucketKey, TaskWithContext[]> = {
      overdue: [], today: [], tomorrow: [], week: [], later: [], none: [],
    }
    for (const c of all) grouped[bucketFor(c.task.dueDate)].push(c)

    const byDate = (a: TaskWithContext, b: TaskWithContext) =>
      (a.task.dueDate ?? '9999').localeCompare(b.task.dueDate ?? '9999')
    for (const k of BUCKET_ORDER) grouped[k].sort(byDate)
    return grouped
  }, [data, projectId, hideDone])

  const total = BUCKET_ORDER.reduce((n, k) => n + buckets[k].length, 0)

  return (
    <div>
      <div className="view-header">
        <h2>Agenda</h2>
        <span className="subtle">
          {total} {total === 1 ? 'task' : 'tasks'}
          {projectId ? ' in this project' : ' across all projects'}
        </span>
      </div>

      {total === 0 && <p className="subtle">Nothing scheduled here yet.</p>}

      {BUCKET_ORDER.map((key) => {
        const items = buckets[key]
        if (!items.length) return null
        return (
          <div className="agenda-group" key={key}>
            <h3 className={`agenda-group-title ${key === 'overdue' ? 'overdue' : ''}`}>
              {BUCKET_LABEL[key]}
              <span className="count">{items.length}</span>
            </h3>
            {items.map((c) => (
              <AgendaCard key={c.task.id} ctx={c} onOpenTask={onOpenTask} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

function AgendaCard({
  ctx,
  onOpenTask,
}: {
  ctx: TaskWithContext
  onOpenTask: (id: string) => void
}) {
  const { updateTask } = useStore()
  const { task } = ctx
  const done = task.status === 'done'

  return (
    <div className={`agenda-card ${done ? 'done' : ''}`} onClick={() => onOpenTask(task.id)}>
      <button
        className={`check ${done ? 'checked' : ''}`}
        onClick={(e) => {
          e.stopPropagation()
          updateTask(task.id, { status: done ? 'todo' : 'done' })
        }}
        aria-label={done ? 'Mark as not done' : 'Mark as done'}
      >
        {done ? '✓' : ''}
      </button>
      <PriorityDot priority={task.priority} />
      <div className="agenda-main">
        <div className="agenda-title">{task.title}</div>
        <div className="agenda-meta">
          <Lineage ctx={ctx} />
          <Tags tags={task.tags} />
        </div>
      </div>
      <DueBadge dueDate={task.dueDate} done={done} />
    </div>
  )
}
