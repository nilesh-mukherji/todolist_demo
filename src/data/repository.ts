import type { AppData } from '../types'

// The whole app talks to persistence through this interface. The current
// implementation (LocalStorageRepository) keeps everything in the browser, but
// swapping in a real backend later means writing one new class against this
// same contract — no view or store code needs to change.
//
// It is intentionally async so a network-backed implementation drops in
// without rippling sync->async changes through the app.
export interface Repository {
  load(): Promise<AppData>
  save(data: AppData): Promise<void>
}
