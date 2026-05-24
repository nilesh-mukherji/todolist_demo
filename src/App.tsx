import { useEffect, useState } from 'react'
import { useStore } from './store/store'
import { projectsSorted, childrenOf } from './lib/tree'
import { seedSampleData } from './lib/seed'
import { OutlineView } from './views/OutlineView'
import { AgendaView } from './views/AgendaView'
import { TaskDrawer } from './components/TaskDrawer'

type ViewKey = 'outline' | 'agenda' | 'calendar' | 'kanban'

const TABS: { key: ViewKey; label: string; ready: boolean }[] = [
  { key: 'outline', label: 'Outline', ready: true },
  { key: 'agenda', label: 'Agenda', ready: true },
  { key: 'calendar', label: 'Calendar', ready: false },
  { key: 'kanban', label: 'Kanban', ready: false },
]

export default function App() {
  const store = useStore()
  const { data, loading, addProject } = store
  const projects = projectsSorted(data)

  const [view, setView] = useState<ViewKey>('outline')
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [hideDone, setHideDone] = useState(false)

  // Keep an active project selected once data exists.
  useEffect(() => {
    if (!loading && projects.length && !projects.some((p) => p.id === activeProjectId)) {
      setActiveProjectId(projects[0].id)
    }
  }, [loading, projects, activeProjectId])

  if (loading) {
    return <div className="empty">Loading…</div>
  }

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null

  const handleAddProject = () => {
    const name = window.prompt('Project name')
    if (name && name.trim()) {
      const p = addProject(name)
      setActiveProjectId(p.id)
      setView('outline')
    }
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span>Projects</span>
          <button className="btn-icon" onClick={handleAddProject} title="New project">
            ＋
          </button>
        </div>
        <div className="sidebar-list">
          {projects.length === 0 && (
            <p className="subtle" style={{ padding: '8px 10px', color: 'var(--text-faint)' }}>
              No projects yet.
            </p>
          )}
          {projects.map((p) => {
            const count = childrenOf(data, p.id, null).length
            return (
              <button
                key={p.id}
                className={`project-item ${p.id === activeProjectId ? 'active' : ''}`}
                onClick={() => {
                  setActiveProjectId(p.id)
                  if (view === 'calendar' || view === 'kanban') setView('outline')
                }}
              >
                <span className="project-dot" style={{ background: p.color }} />
                <span className="project-name">{p.name}</span>
                <span className="count">{count}</span>
              </button>
            )
          })}
        </div>
      </aside>

      <header className="topbar">
        <h1>Todo</h1>
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab ${view === t.key ? 'active' : ''} ${t.ready ? '' : 'disabled'}`}
              onClick={() => t.ready && setView(t.key)}
              disabled={!t.ready}
            >
              {t.label}
              {!t.ready && <span className="soon">soon</span>}
            </button>
          ))}
        </nav>
        <div className="topbar-spacer" />
        <label className="subtle" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input
            type="checkbox"
            checked={hideDone}
            onChange={(e) => setHideDone(e.target.checked)}
          />
          Hide done
        </label>
      </header>

      <main className="main">
        {projects.length === 0 ? (
          <div className="empty">
            <h3>Start your first project</h3>
            <p>
              Create a project, then nest tasks and subtasks to any depth. View them as an
              outline or a chronological agenda — calendar and kanban are coming next.
            </p>
            <button className="btn btn-primary" onClick={handleAddProject}>
              New project
            </button>
            <button className="btn" onClick={() => seedSampleData(store)}>
              Load sample data
            </button>
          </div>
        ) : view === 'agenda' ? (
          <AgendaView
            projectId={activeProjectId}
            hideDone={hideDone}
            onOpenTask={setOpenTaskId}
          />
        ) : view === 'outline' && activeProject ? (
          <OutlineView project={activeProject} onOpenTask={setOpenTaskId} />
        ) : null}
      </main>

      {openTaskId && <TaskDrawer taskId={openTaskId} onClose={() => setOpenTaskId(null)} />}
    </div>
  )
}
