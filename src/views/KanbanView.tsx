import { useMemo, useState } from 'react'
import type { Status, TaskWithContext } from '../types'
import { STATUS_LABEL, STATUSES } from '../types'
import { useStore } from '../store/store'
import { tasksInScope } from '../lib/tree'
import { DueBadge, Lineage, PriorityDot, Tags } from '../components/Badges'

// DECISION: Board columns map 1:1 onto the task `status` attribute
// (To do / In progress / Done). Defended: "status" is the natural stage of a
// piece of work and is already a first-class field on every node, so dragging a
// card between columns is a real, persisted state change rather than a
// board-only concept. To regroup the board by a *different* attribute later
// (e.g. priority, or a custom "column" field), change `COLUMNS`, `columnOf` and
// `applyColumn` below — the rendering/drag code underneath is generic and
// won't need edits.
const COLUMNS: { key: Status; label: string }[] = STATUSES.map((s) => ({
  key: s,
  label: STATUS_LABEL[s],
}))

const columnOf = (ctx: TaskWithContext): Status => ctx.task.status
const applyColumn = (key: Status) => ({ status: key })

// DECISION: the board shows EVERY node (top-level tasks and nested subtasks
// alike), not just leaves. The user explicitly wants tasks *and* subtasks
// viewable as a board; each card carries its lineage so a flat board never
// loses the "where does this live" context. To show only leaf tasks instead,
// filter on `!ctx.hasChildren` in the memo below.
export function KanbanView({
  projectId,
  hideDone,
  onOpenTask,
}: {
  projectId: string | null
  hideDone: boolean
  onOpenTask: (id: string) => void
}) {
  const { data, updateTask } = useStore()
  const [dragId, setDragId] = useState<string | null>(null)
  const [overCol, setOverCol] = useState<Status | null>(null)

  const byColumn = useMemo(() => {
    const groups: Record<Status, TaskWithContext[]> = {
      todo: [], in_progress: [], done: [],
    }
    for (const c of tasksInScope(data, projectId)) {
      if (hideDone && c.task.status === 'done') continue
      groups[columnOf(c)].push(c)
    }
    // Within a column, surface higher priority and sooner due dates first.
    const rank = { high: 0, med: 1, low: 2 }
    for (const k of STATUSES) {
      groups[k].sort(
        (a, b) =>
          rank[a.task.priority] - rank[b.task.priority] ||
          (a.task.dueDate ?? '9999').localeCompare(b.task.dueDate ?? '9999'),
      )
    }
    return groups
  }, [data, projectId, hideDone])

  const drop = (key: Status) => {
    if (dragId) updateTask(dragId, applyColumn(key))
    setDragId(null)
    setOverCol(null)
  }

  return (
    <div>
      <div className="view-header">
        <h2>Kanban</h2>
        <span className="subtle">Drag cards between columns to change status</span>
      </div>

      <div className="kanban">
        {COLUMNS.map((col) => (
          <div
            key={col.key}
            className={`kanban-col ${overCol === col.key ? 'drag-over' : ''}`}
            onDragOver={(e) => {
              e.preventDefault()
              setOverCol(col.key)
            }}
            onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
            onDrop={() => drop(col.key)}
          >
            <div className="kanban-col-header">
              {col.label}
              <span className="count">{byColumn[col.key].length}</span>
            </div>
            <div className="kanban-col-body">
              {byColumn[col.key].map((c) => (
                <div
                  key={c.task.id}
                  className="kanban-card"
                  draggable
                  onDragStart={() => setDragId(c.task.id)}
                  onDragEnd={() => {
                    setDragId(null)
                    setOverCol(null)
                  }}
                  onClick={() => onOpenTask(c.task.id)}
                >
                  <div className="kanban-card-top">
                    <PriorityDot priority={c.task.priority} />
                    <span className="kanban-card-title">{c.task.title}</span>
                  </div>
                  <div className="kanban-card-meta">
                    <Lineage ctx={c} />
                  </div>
                  <div className="kanban-card-meta">
                    <Tags tags={c.task.tags} />
                    <DueBadge dueDate={c.task.dueDate} done={c.task.status === 'done'} />
                  </div>
                </div>
              ))}
              {byColumn[col.key].length === 0 && (
                <div className="kanban-empty">Drop here</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
