import type { StoreApi } from '../store/store'

/** Returns an ISO date (YYYY-MM-DD) offset by `days` from today. */
function dayOffset(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Populate the store with a small illustrative project tree so a first-time
 * user sees the nesting and the views working immediately.
 */
export function seedSampleData(store: StoreApi) {
  const proj = store.addProject('Launch personal website', '#6366f1')

  const design = store.addTask({
    projectId: proj.id,
    parentId: null,
    title: 'Design',
    status: 'in_progress',
    priority: 'high',
    dueDate: dayOffset(2),
    tags: ['design'],
  })
  store.addTask({
    projectId: proj.id,
    parentId: design.id,
    title: 'Pick a color palette',
    status: 'done',
    priority: 'med',
    dueDate: dayOffset(-1),
  })
  const layout = store.addTask({
    projectId: proj.id,
    parentId: design.id,
    title: 'Wireframe the home page',
    status: 'todo',
    priority: 'high',
    dueDate: dayOffset(1),
  })
  store.addTask({
    projectId: proj.id,
    parentId: layout.id,
    title: 'Hero section',
    status: 'todo',
    priority: 'med',
    dueDate: dayOffset(1),
  })
  store.addTask({
    projectId: proj.id,
    parentId: layout.id,
    title: 'Footer with links',
    status: 'todo',
    priority: 'low',
    dueDate: dayOffset(3),
  })

  const build = store.addTask({
    projectId: proj.id,
    parentId: null,
    title: 'Build',
    status: 'todo',
    priority: 'med',
    dueDate: dayOffset(7),
    tags: ['dev'],
  })
  store.addTask({
    projectId: proj.id,
    parentId: build.id,
    title: 'Set up the project repo',
    status: 'done',
    priority: 'med',
    dueDate: dayOffset(-2),
  })
  store.addTask({
    projectId: proj.id,
    parentId: build.id,
    title: 'Implement responsive layout',
    status: 'todo',
    priority: 'high',
    dueDate: dayOffset(5),
  })

  store.addTask({
    projectId: proj.id,
    parentId: null,
    title: 'Write launch announcement',
    status: 'todo',
    priority: 'low',
    dueDate: dayOffset(9),
    tags: ['writing'],
  })
}
