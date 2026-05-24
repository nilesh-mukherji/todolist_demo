import { useState } from 'react'
import type { Project } from '../types'
import { useStore } from '../store/store'

/** Inline "new project" input used in both the desktop sidebar and mobile sheet. */
export function AddProjectInline({ onCreated }: { onCreated?: (p: Project) => void }) {
  const { addProject } = useStore()
  const [name, setName] = useState('')

  const submit = () => {
    const trimmed = name.trim()
    if (!trimmed) return
    const p = addProject(trimmed)
    setName('')
    onCreated?.(p)
  }

  return (
    <div className="add-project">
      <input
        className="inline-input"
        placeholder="New project…"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
      />
      <button className="btn btn-sm btn-primary" onClick={submit} disabled={!name.trim()}>
        Add
      </button>
    </div>
  )
}
