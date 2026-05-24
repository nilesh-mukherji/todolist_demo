import { useState } from 'react'
import type { Project, TaskNode } from '../types'
import { useStore } from '../store/store'
import { childrenOf } from '../lib/tree'
import { DueBadge, PriorityDot, Tags } from '../components/Badges'

export function OutlineView({
  project,
  onOpenTask,
}: {
  project: Project
  onOpenTask: (id: string) => void
}) {
  const { data, addTask } = useStore()
  const topLevel = childrenOf(data, project.id, null)
  const [addingTop, setAddingTop] = useState('')

  const submitTop = () => {
    const title = addingTop.trim()
    if (!title) return
    addTask({ projectId: project.id, parentId: null, title })
    setAddingTop('')
  }

  return (
    <div>
      <div className="view-header">
        <h2>{project.name}</h2>
        <span className="subtle">
          {topLevel.length} top-level {topLevel.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {topLevel.length === 0 && (
        <p className="subtle" style={{ marginBottom: 12 }}>
          No tasks yet — add one below. Hover a task to add subtasks at any depth.
        </p>
      )}

      <div>
        {topLevel.map((t) => (
          <OutlineNode key={t.id} task={t} depth={0} onOpenTask={onOpenTask} />
        ))}
      </div>

      <div className="add-child-input" style={{ paddingLeft: 26 }}>
        <input
          className="inline-input"
          placeholder="Add a task and press Enter…"
          value={addingTop}
          onChange={(e) => setAddingTop(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submitTop()}
        />
      </div>
    </div>
  )
}

function OutlineNode({
  task,
  depth,
  onOpenTask,
}: {
  task: TaskNode
  depth: number
  onOpenTask: (id: string) => void
}) {
  const { data, updateTask, addTask } = useStore()
  const kids = childrenOf(data, task.projectId, task.id)
  const hasKids = kids.length > 0

  const [expanded, setExpanded] = useState(true)
  const [adding, setAdding] = useState(false)
  const [childTitle, setChildTitle] = useState('')
  const [title, setTitle] = useState(task.title)

  const done = task.status === 'done'

  const submitChild = () => {
    const t = childTitle.trim()
    if (!t) {
      setAdding(false)
      return
    }
    addTask({ projectId: task.projectId, parentId: task.id, title: t })
    setChildTitle('')
    setExpanded(true)
    // keep the input open for rapid entry
  }

  return (
    <div>
      <div className={`outline-row ${done ? 'done' : ''}`} style={{ marginLeft: depth * 22 }}>
        <button
          className={`twisty ${hasKids ? '' : 'placeholder'}`}
          onClick={() => setExpanded((v) => !v)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '▾' : '▸'}
        </button>

        <button
          className={`check ${done ? 'checked' : ''}`}
          onClick={() =>
            updateTask(task.id, { status: done ? 'todo' : 'done' })
          }
          aria-label={done ? 'Mark as not done' : 'Mark as done'}
        >
          {done ? '✓' : ''}
        </button>

        <PriorityDot priority={task.priority} />

        <input
          className="outline-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => updateTask(task.id, { title: title.trim() || 'Untitled task' })}
          onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        />

        <Tags tags={task.tags} />
        <DueBadge dueDate={task.dueDate} done={done} />

        <div className="row-actions">
          <button
            className="btn-icon"
            title="Add subtask"
            onClick={() => {
              setExpanded(true)
              setAdding(true)
            }}
          >
            ＋
          </button>
          <button className="btn-icon" title="Details" onClick={() => onOpenTask(task.id)}>
            ⋯
          </button>
        </div>
      </div>

      {expanded && (
        <div>
          {kids.map((k) => (
            <OutlineNode key={k.id} task={k} depth={depth + 1} onOpenTask={onOpenTask} />
          ))}
          {adding && (
            <div className="add-child-input" style={{ marginLeft: (depth + 1) * 22 + 26 }}>
              <input
                className="inline-input"
                autoFocus
                placeholder="New subtask…"
                value={childTitle}
                onChange={(e) => setChildTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') submitChild()
                  if (e.key === 'Escape') {
                    setChildTitle('')
                    setAdding(false)
                  }
                }}
                onBlur={() => {
                  if (!childTitle.trim()) setAdding(false)
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
