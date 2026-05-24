import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { StoreProvider } from './store/store'
import { LocalStorageRepository } from './data/localStorageRepository'

const repository = new LocalStorageRepository()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider repository={repository}>
      <App />
    </StoreProvider>
  </StrictMode>,
)
