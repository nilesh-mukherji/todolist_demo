import { useEffect, useState } from 'react'
import { PRIORITIES, PRIORITY_LABEL, STATUSES, STATUS_LABEL } from '../types'
import type { TaskNode } from '../types'
import { useStore } from '../store/store'
import { contextFor, lineageLabels } from '../lib/tree'

export function TaskDrawer({ taskId, onClose }: { taskId: string; onClose: () => void }) {
  const { data, updateTask, deleteTask } = useStore()
  const task = data.tasks[taskId]

  // Local draft for free-text fields so typing is smooth; committed on change/blur.
  const [title, setTitle] = useState(task?.title ?? '')
  const [notes, setNotes] = useState(task?.notes ?? '')
  const [tagsText, setTagsText] = useState(task?.tags.join(', ') ?? '')

  useEffect(() => {
    if (!task) return
    setTitle(task.title)
    setNotes(task.notes)
    setTagsText(task.tags.join(', '))
  }, [taskId]) // reset drafts when switching tasks

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!task) return null

  const ctx = contextFor(data, task)
  const lineage = ctx ? lineageLabels(ctx) : []

  const commitTags = () => {
    const tags = tagsText
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean)
    updateTask(task.id, { tags })
  }

  const patch = (p: Partial<TaskNode>) => updateTask(task.id, p)

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="Task details">
        <div className="drawer-header">
          <div className="drawer-lineage">{lineage.join('  /  ')}</div>
          <button className="btn-icon" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>
        <div className="drawer-body">
          <div className="field">
            <label>Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => patch({ title: title.trim() || 'Untitled task' })}
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Status</label>
              <select
                value={task.status}
                onChange={(e) => patch({ status: e.target.value as TaskNode['status'] })}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Priority</label>
              <select
                value={task.priority}
                onChange={(e) => patch({ priority: e.target.value as TaskNode['priority'] })}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="field">
            <label>Due date</label>
            <input
              type="date"
              value={task.dueDate ?? ''}
              onChange={(e) => patch({ dueDate: e.target.value || null })}
            />
          </div>

          <div className="field">
            <label>Tags (comma separated)</label>
            <input
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              onBlur={commitTags}
              placeholder="design, urgent"
            />
          </div>

          <div className="field">
            <label>Notes</label>
            <textarea
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => patch({ notes })}
              placeholder="Add details…"
            />
          </div>

          <button
            className="btn"
            style={{ color: 'var(--danger)', alignSelf: 'flex-start' }}
            onClick={() => {
              deleteTask(task.id)
              onClose()
            }}
          >
            Delete task & subtasks
          </button>
        </div>
      </aside>
    </>
  )
}
