import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { useStore } from './store/store'
import { projectsSorted, childrenOf } from './lib/tree'
import { seedSampleData } from './lib/seed'
import { useIsMobile } from './lib/useMediaQuery'
import { OutlineView } from './views/OutlineView'
import { AgendaView } from './views/AgendaView'
import { KanbanView } from './views/KanbanView'
import { CalendarView } from './views/CalendarView'
import { TaskDrawer } from './components/TaskDrawer'
import { AddProjectInline } from './components/AddProjectInline'
import { BottomNav } from './components/BottomNav'
import { ProjectSheet } from './components/ProjectSheet'

type ViewKey = 'outline' | 'agenda' | 'calendar' | 'kanban'

const TABS: { key: ViewKey; label: string; icon: ReactNode }[] = [
  { key: 'outline', label: 'Outline', icon: <IconOutline /> },
  { key: 'agenda', label: 'Agenda', icon: <IconAgenda /> },
  { key: 'calendar', label: 'Calendar', icon: <IconCalendar /> },
  { key: 'kanban', label: 'Kanban', icon: <IconKanban /> },
]

export default function App() {
  const store = useStore()
  const { data, loading } = store
  const projects = projectsSorted(data)
  const isMobile = useIsMobile()

  const [view, setView] = useState<ViewKey>('outline')
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [hideDone, setHideDone] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)

  // Select the first project once on initial load (null thereafter means
  // "All projects", an intentional scope rather than an unset state).
  const didInit = useRef(false)
  useEffect(() => {
    if (loading || didInit.current) return
    if (projects.length) {
      setActiveProjectId(projects[0].id)
      didInit.current = true
    }
  }, [loading, projects])

  // If the selected project is deleted, fall back to the "All projects" scope.
  useEffect(() => {
    if (activeProjectId && !projects.some((p) => p.id === activeProjectId)) {
      setActiveProjectId(null)
    }
  }, [projects, activeProjectId])

  if (loading) {
    return <div className="splash">Flow</div>
  }

  const activeProject = projects.find((p) => p.id === activeProjectId) ?? null
  const scopeLabel = activeProject ? activeProject.name : 'All projects'

  function pickProject(id: string | null) {
    setActiveProjectId(id)
    // Outline edits a single project, so steer the "All" scope to a cross-cutting view.
    if (id === null && view === 'outline') setView('agenda')
  }

  function renderView() {
    if (projects.length === 0) {
      return (
        <div className="empty">
          <h3>Start your first project</h3>
          <p>
            Create a project, then nest tasks and subtasks to any depth. View them as an
            outline, agenda, calendar or kanban board.
          </p>
          <AddProjectInline onCreated={(p) => setActiveProjectId(p.id)} />
          <button
            className="btn"
            style={{ marginTop: 14 }}
            onClick={() => seedSampleData(store)}
          >
            Load sample data
          </button>
        </div>
      )
    }
    if (view === 'agenda') {
      return <AgendaView projectId={activeProjectId} hideDone={hideDone} onOpenTask={setOpenTaskId} />
    }
    if (view === 'kanban') {
      return <KanbanView projectId={activeProjectId} hideDone={hideDone} onOpenTask={setOpenTaskId} />
    }
    if (view === 'calendar') {
      return <CalendarView projectId={activeProjectId} hideDone={hideDone} onOpenTask={setOpenTaskId} />
    }
    if (view === 'outline' && activeProject) {
      return <OutlineView project={activeProject} onOpenTask={setOpenTaskId} />
    }
    return (
      <div className="empty">
        <h3>Pick a project</h3>
        <p>
          The Outline edits one project&apos;s task tree. Choose a project, or switch to
          Agenda, Calendar or Kanban to see everything at once.
        </p>
      </div>
    )
  }

  const drawer = openTaskId ? (
    <TaskDrawer taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
  ) : null

  // ---- Mobile: native-style shell with a bottom tab bar ----
  if (isMobile) {
    return (
      <div className="app-mobile">
        <header className="m-topbar">
          <div className="wordmark">Flow</div>
          <button className="scope-pill" onClick={() => setSheetOpen(true)}>
            <span
              className="project-dot"
              style={{ background: activeProject?.color ?? 'var(--text-faint)' }}
            />
            <span className="project-name">{scopeLabel}</span>
            <span className="chevron">▾</span>
          </button>
        </header>

        <main className="m-main">{renderView()}</main>

        <BottomNav items={TABS} active={view} onSelect={(k) => setView(k as ViewKey)} />

        {sheetOpen && (
          <ProjectSheet
            activeProjectId={activeProjectId}
            hideDone={hideDone}
            onPick={pickProject}
            onToggleHideDone={setHideDone}
            onClose={() => setSheetOpen(false)}
          />
        )}
        {drawer}
      </div>
    )
  }

  // ---- Desktop: sidebar + top tabs ----
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="wordmark">Flow</span>
        </div>
        <div className="sidebar-list">
          {projects.length > 0 && (
            <button
              className={`project-item ${activeProjectId === null ? 'active' : ''}`}
              onClick={() => pickProject(null)}
            >
              <span className="project-dot" style={{ background: 'var(--text-faint)' }} />
              <span className="project-name">All projects</span>
              <span className="count">{Object.keys(data.tasks).length}</span>
            </button>
          )}
          {projects.map((p) => (
            <button
              key={p.id}
              className={`project-item ${p.id === activeProjectId ? 'active' : ''}`}
              onClick={() => setActiveProjectId(p.id)}
            >
              <span className="project-dot" style={{ background: p.color }} />
              <span className="project-name">{p.name}</span>
              <span className="count">{childrenOf(data, p.id, null).length}</span>
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <AddProjectInline onCreated={(p) => setActiveProjectId(p.id)} />
        </div>
      </aside>

      <header className="topbar">
        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`tab ${view === t.key ? 'active' : ''}`}
              onClick={() => setView(t.key)}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <div className="topbar-spacer" />
        <label className="hide-done">
          <input
            type="checkbox"
            checked={hideDone}
            onChange={(e) => setHideDone(e.target.checked)}
          />
          Hide done
        </label>
      </header>

      <main className="main">{renderView()}</main>

      {drawer}
    </div>
  )
}

/* ---- Minimal line icons for the bottom nav ---- */
function IconOutline() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  )
}
function IconAgenda() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 7h10M4 12h16M4 17h7" />
    </svg>
  )
}
function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <path d="M3 9h18M8 2v4M16 2v4" />
    </svg>
  )
}
function IconKanban() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="5" height="16" rx="1" />
      <rect x="10" y="4" width="5" height="10" rx="1" />
      <rect x="17" y="4" width="4" height="13" rx="1" />
    </svg>
  )
}
