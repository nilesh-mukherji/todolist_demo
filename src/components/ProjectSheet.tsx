import { useStore } from '../store/store'
import { projectsSorted, childrenOf } from '../lib/tree'
import { AddProjectInline } from './AddProjectInline'

/**
 * Slide-up sheet for switching project scope, creating projects, and toggling
 * "hide done" on mobile — mirrors what the desktop sidebar/topbar offer.
 */
export function ProjectSheet({
  activeProjectId,
  hideDone,
  onPick,
  onToggleHideDone,
  onClose,
}: {
  activeProjectId: string | null
  hideDone: boolean
  onPick: (id: string | null) => void
  onToggleHideDone: (v: boolean) => void
  onClose: () => void
}) {
  const { data } = useStore()
  const projects = projectsSorted(data)

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} />
      <div className="sheet" role="dialog" aria-label="Projects">
        <div className="sheet-grip" />
        <div className="sheet-title">Projects</div>

        <button
          className={`sheet-row ${activeProjectId === null ? 'active' : ''}`}
          onClick={() => {
            onPick(null)
            onClose()
          }}
        >
          <span className="project-dot" style={{ background: 'var(--text-faint)' }} />
          <span className="project-name">All projects</span>
          <span className="count">{Object.keys(data.tasks).length}</span>
        </button>

        {projects.map((p) => (
          <button
            key={p.id}
            className={`sheet-row ${p.id === activeProjectId ? 'active' : ''}`}
            onClick={() => {
              onPick(p.id)
              onClose()
            }}
          >
            <span className="project-dot" style={{ background: p.color }} />
            <span className="project-name">{p.name}</span>
            <span className="count">{childrenOf(data, p.id, null).length}</span>
          </button>
        ))}

        <div className="sheet-divider" />

        <AddProjectInline onCreated={(p) => onPick(p.id)} />

        <label className="sheet-toggle">
          <span>Hide completed tasks</span>
          <input
            type="checkbox"
            checked={hideDone}
            onChange={(e) => onToggleHideDone(e.target.checked)}
          />
        </label>
      </div>
    </>
  )
}
