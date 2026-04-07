import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { SettingsProvider } from './contexts/SettingsContext.jsx' // ★これを追加

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* ★AppをSettingsProviderで包む */}
    <SettingsProvider>
      <App />
    </SettingsProvider>
  </StrictMode>,
)