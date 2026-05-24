import type { AppData, Project, TaskNode, TaskWithContext } from '../types'

/** Children of a node (parentId === parentId), sorted by order then createdAt. */
export function childrenOf(
  data: AppData,
  projectId: string,
  parentId: string | null,
): TaskNode[] {
  return Object.values(data.tasks)
    .filter((t) => t.projectId === projectId && t.parentId === parentId)
    .sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt))
}

/** Ancestors from immediate parent up to the top-level task (project not included). */
export function ancestorsOf(data: AppData, task: TaskNode): TaskNode[] {
  const chain: TaskNode[] = []
  let current = task.parentId ? data.tasks[task.parentId] : undefined
  // Guard against cycles in case of corrupt data.
  const seen = new Set<string>([task.id])
  while (current && !seen.has(current.id)) {
    chain.push(current)
    seen.add(current.id)
    current = current.parentId ? data.tasks[current.parentId] : undefined
  }
  return chain.reverse()
}

/** Every descendant id of a node (excludes the node itself). */
export function descendantIds(data: AppData, taskId: string): string[] {
  const out: string[] = []
  const stack = [taskId]
  while (stack.length) {
    const id = stack.pop()!
    for (const t of Object.values(data.tasks)) {
      if (t.parentId === id) {
        out.push(t.id)
        stack.push(t.id)
      }
    }
  }
  return out
}

/** Build the per-task context (project, ancestors, depth, hasChildren). */
export function contextFor(data: AppData, task: TaskNode): TaskWithContext | null {
  const project = data.projects[task.projectId]
  if (!project) return null
  const ancestors = ancestorsOf(data, task)
  const hasChildren = Object.values(data.tasks).some((t) => t.parentId === task.id)
  return { task, project, ancestors, depth: ancestors.length, hasChildren }
}

/**
 * Depth-first flatten of a project's task tree into render order, each row
 * carrying its depth. Used by tree-style listings.
 */
export function flattenProject(data: AppData, projectId: string): TaskWithContext[] {
  const out: TaskWithContext[] = []
  const project = data.projects[projectId]
  if (!project) return out

  const walk = (parentId: string | null, ancestors: TaskNode[]) => {
    for (const task of childrenOf(data, projectId, parentId)) {
      const hasChildren = childrenOf(data, projectId, task.id).length > 0
      out.push({ task, project, ancestors, depth: ancestors.length, hasChildren })
      walk(task.id, [...ancestors, task])
    }
  }
  walk(null, [])
  return out
}

/** All tasks across all projects, each with context. */
export function allTasksWithContext(data: AppData): TaskWithContext[] {
  return Object.values(data.tasks)
    .map((t) => contextFor(data, t))
    .filter((c): c is TaskWithContext => c !== null)
}

/** Lineage as display strings: [project.name, ...ancestor titles]. */
export function lineageLabels(ctx: TaskWithContext): string[] {
  return [ctx.project.name, ...ctx.ancestors.map((a) => a.title)]
}

export function projectsSorted(data: AppData): Project[] {
  return Object.values(data.projects).sort(
    (a, b) => a.createdAt.localeCompare(b.createdAt),
  )
}

/** Next order value for a new child appended under a parent. */
export function nextOrder(data: AppData, projectId: string, parentId: string | null): number {
  const siblings = childrenOf(data, projectId, parentId)
  return siblings.length ? Math.max(...siblings.map((s) => s.order)) + 1 : 0
}
