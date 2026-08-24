import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const savedTheme = localStorage.getItem('sz_theme')
if (savedTheme === 'dark') {
  document.documentElement.setAttribute('data-theme', 'dark')
  document.documentElement.classList.add('dark')
} else if (savedTheme === 'light') {
  document.documentElement.removeAttribute('data-theme')
  document.documentElement.classList.remove('dark')
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
