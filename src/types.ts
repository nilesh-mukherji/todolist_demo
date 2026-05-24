// Domain model for the todo app.
//
// The hierarchy is: Project -> TaskNode -> TaskNode -> ... (unconstrained depth).
// A TaskNode is a single node in the tree; nesting is expressed purely through
// `parentId`, so there is no separate "subtask" type. State is kept normalized
// (a flat map keyed by id) which keeps arbitrary-depth tree operations simple.

export type Status = 'todo' | 'in_progress' | 'done'
export type Priority = 'low' | 'med' | 'high'

export const STATUSES: Status[] = ['todo', 'in_progress', 'done']
export const PRIORITIES: Priority[] = ['low', 'med', 'high']

export const STATUS_LABEL: Record<Status, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  done: 'Done',
}

export const PRIORITY_LABEL: Record<Priority, string> = {
  low: 'Low',
  med: 'Medium',
  high: 'High',
}

export interface Project {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface TaskNode {
  id: string
  projectId: string
  /** null = a top-level task directly under the project. */
  parentId: string | null
  title: string
  notes: string
  /** ISO date string (YYYY-MM-DD) or null if unscheduled. */
  dueDate: string | null
  status: Status
  priority: Priority
  tags: string[]
  /** Sort order among siblings (ascending). */
  order: number
  createdAt: string
  updatedAt: string
}

/** The full persisted state shape. */
export interface AppData {
  projects: Record<string, Project>
  tasks: Record<string, TaskNode>
}

/** A task plus computed tree context, produced by the selectors in lib/tree. */
export interface TaskWithContext {
  task: TaskNode
  project: Project
  /** Ancestors from the immediate parent up to the top-level task. */
  ancestors: TaskNode[]
  /** Depth in the tree: 0 = top-level task under the project. */
  depth: number
  /** Whether this node has any children. */
  hasChildren: boolean
}
