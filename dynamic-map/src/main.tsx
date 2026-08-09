import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { WatchApp } from './WatchApp.tsx'

const isWatch = new URLSearchParams(window.location.search).get('view') === 'watch'

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isWatch ? <WatchApp /> : <App />}</StrictMode>,
)
