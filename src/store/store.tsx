import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import type { AppData, Priority, Project, Status, TaskNode } from '../types'
import type { Repository } from '../data/repository'
import { descendantIds, nextOrder } from '../lib/tree'
import { newId } from '../lib/id'

export interface NewTaskInput {
  projectId: string
  parentId: string | null
  title: string
  notes?: string
  dueDate?: string | null
  status?: Status
  priority?: Priority
  tags?: string[]
}

export interface StoreApi {
  data: AppData
  loading: boolean
  addProject: (name: string, color?: string) => Project
  updateProject: (id: string, patch: Partial<Omit<Project, 'id' | 'createdAt'>>) => void
  deleteProject: (id: string) => void
  addTask: (input: NewTaskInput) => TaskNode
  updateTask: (id: string, patch: Partial<Omit<TaskNode, 'id' | 'createdAt' | 'projectId'>>) => void
  deleteTask: (id: string) => void
}

const StoreContext = createContext<StoreApi | null>(null)

const PROJECT_COLORS = [
  '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#8b5cf6',
]

export function StoreProvider({
  repository,
  children,
}: {
  repository: Repository
  children: ReactNode
}) {
  const [data, setData] = useState<AppData>({ projects: {}, tasks: {} })
  const [loading, setLoading] = useState(true)

  // Load once on mount.
  useEffect(() => {
    let cancelled = false
    repository.load().then((loaded) => {
      if (!cancelled) {
        setData(loaded)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [repository])

  // Persist on every change after the initial load.
  const skipFirstSave = useRef(true)
  useEffect(() => {
    if (loading) return
    if (skipFirstSave.current) {
      skipFirstSave.current = false
      return
    }
    void repository.save(data)
  }, [data, loading, repository])

  const addProject = useCallback((name: string, color?: string): Project => {
    const now = new Date().toISOString()
    const project: Project = {
      id: newId(),
      name: name.trim() || 'Untitled project',
      color: color ?? PROJECT_COLORS[Math.floor(Math.random() * PROJECT_COLORS.length)],
      createdAt: now,
      updatedAt: now,
    }
    setData((d) => ({ ...d, projects: { ...d.projects, [project.id]: project } }))
    return project
  }, [])

  const updateProject = useCallback<StoreApi['updateProject']>((id, patch) => {
    setData((d) => {
      const existing = d.projects[id]
      if (!existing) return d
      return {
        ...d,
        projects: {
          ...d.projects,
          [id]: { ...existing, ...patch, updatedAt: new Date().toISOString() },
        },
      }
    })
  }, [])

  const deleteProject = useCallback<StoreApi['deleteProject']>((id) => {
    setData((d) => {
      const projects = { ...d.projects }
      delete projects[id]
      const tasks = Object.fromEntries(
        Object.entries(d.tasks).filter(([, t]) => t.projectId !== id),
      )
      return { projects, tasks }
    })
  }, [])

  const addTask = useCallback<StoreApi['addTask']>((input) => {
    const now = new Date().toISOString()
    let created!: TaskNode
    setData((d) => {
      const task: TaskNode = {
        id: newId(),
        projectId: input.projectId,
        parentId: input.parentId,
        title: input.title.trim() || 'Untitled task',
        notes: input.notes ?? '',
        dueDate: input.dueDate ?? null,
        status: input.status ?? 'todo',
        priority: input.priority ?? 'med',
        tags: input.tags ?? [],
        order: nextOrder(d, input.projectId, input.parentId),
        createdAt: now,
        updatedAt: now,
      }
      created = task
      return { ...d, tasks: { ...d.tasks, [task.id]: task } }
    })
    return created
  }, [])

  const updateTask = useCallback<StoreApi['updateTask']>((id, patch) => {
    setData((d) => {
      const existing = d.tasks[id]
      if (!existing) return d
      return {
        ...d,
        tasks: {
          ...d.tasks,
          [id]: { ...existing, ...patch, updatedAt: new Date().toISOString() },
        },
      }
    })
  }, [])

  const deleteTask = useCallback<StoreApi['deleteTask']>((id) => {
    setData((d) => {
      const toRemove = new Set([id, ...descendantIds(d, id)])
      const tasks = Object.fromEntries(
        Object.entries(d.tasks).filter(([tid]) => !toRemove.has(tid)),
      )
      return { ...d, tasks }
    })
  }, [])

  const api = useMemo<StoreApi>(
    () => ({
      data,
      loading,
      addProject,
      updateProject,
      deleteProject,
      addTask,
      updateTask,
      deleteTask,
    }),
    [data, loading, addProject, updateProject, deleteProject, addTask, updateTask, deleteTask],
  )

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used within a StoreProvider')
  return ctx
}
