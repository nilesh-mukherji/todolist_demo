import type { AppData } from '../types'
import type { Repository } from './repository'

const STORAGE_KEY = 'todolist-demo:data:v1'

function emptyData(): AppData {
  return { projects: {}, tasks: {} }
}

export class LocalStorageRepository implements Repository {
  async load(): Promise<AppData> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return emptyData()
      const parsed = JSON.parse(raw) as Partial<AppData>
      return {
        projects: parsed.projects ?? {},
        tasks: parsed.tasks ?? {},
      }
    } catch {
      // Corrupt/unreadable storage shouldn't brick the app.
      return emptyData()
    }
  }

  async save(data: AppData): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }
}
