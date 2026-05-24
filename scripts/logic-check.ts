import type { AppData, TaskNode } from '../src/types.ts'
import {
  ancestorsOf,
  childrenOf,
  descendantIds,
  flattenProject,
  lineageLabels,
  contextFor,
} from '../src/lib/tree.ts'
import { daysFromToday, dueLabel, todayISO } from '../src/lib/dates.ts'

let failures = 0
function assert(cond: boolean, msg: string) {
  if (!cond) {
    failures++
    console.error('FAIL:', msg)
  } else {
    console.log('ok  :', msg)
  }
}

function task(id: string, parentId: string | null, order: number): TaskNode {
  return {
    id, projectId: 'p1', parentId, title: id, notes: '', dueDate: null,
    status: 'todo', priority: 'med', tags: [], order,
    createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
  }
}

// Tree:  p1 -> a -> a1 -> a1x ;  a -> a2 ;  b
const data: AppData = {
  projects: { p1: { id: 'p1', name: 'Proj', color: '#000', createdAt: '2026-01-01', updatedAt: '2026-01-01' } },
  tasks: {
    a: task('a', null, 0),
    b: task('b', null, 1),
    a1: task('a1', 'a', 0),
    a2: task('a2', 'a', 1),
    a1x: task('a1x', 'a1', 0),
  },
}

assert(childrenOf(data, 'p1', null).map((t) => t.id).join(',') === 'a,b', 'top-level children ordered')
assert(childrenOf(data, 'p1', 'a').map((t) => t.id).join(',') === 'a1,a2', 'children of a')
assert(ancestorsOf(data, data.tasks.a1x).map((t) => t.id).join(',') === 'a,a1', 'ancestors deep-to-shallow root-first')
assert(descendantIds(data, 'a').sort().join(',') === 'a1,a1x,a2', 'all descendants of a')
assert(descendantIds(data, 'b').length === 0, 'leaf has no descendants')

const ctx = contextFor(data, data.tasks.a1x)!
assert(ctx.depth === 2, 'depth of a1x is 2')
assert(lineageLabels(ctx).join('/') === 'Proj/a/a1', 'lineage labels include project + ancestors')

const flat = flattenProject(data, 'p1').map((c) => `${'  '.repeat(c.depth)}${c.task.id}`)
assert(flat.join('|') === 'a|  a1|    a1x|  a2|b', 'depth-first flatten in render order')

// cycle guard
const cyclic: AppData = { projects: data.projects, tasks: { x: task('x', 'y', 0), y: task('y', 'x', 0) } }
assert(ancestorsOf(cyclic, cyclic.tasks.x).length <= 2, 'cycle does not infinite-loop')

// dates
assert(daysFromToday(todayISO()) === 0, 'today is 0 days away')
assert(dueLabel(todayISO()) === 'Today', 'today label')

console.log(failures === 0 ? '\nALL PASSED' : `\n${failures} FAILED`)
process.exit(failures === 0 ? 0 : 1)
