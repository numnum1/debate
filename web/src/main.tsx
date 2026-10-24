import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { AuthProvider } from 'react-oidc-context'
import { BrowserRouter } from 'react-router'
import './index.css'
import { DebatesProvider } from './api/DebatesProvider.tsx'
import App from './App.tsx'
import { oidcConfig } from './auth.ts'
import { TooltipProvider } from './components/ui/tooltip.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider {...oidcConfig}>
      <BrowserRouter>
        <TooltipProvider>
          <DebatesProvider>
            <App />
          </DebatesProvider>
        </TooltipProvider>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>,
)
