import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'
import { registerServiceWorker } from '@/lib/serviceWorkerRegistration'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

window.addEventListener('load', () => {
  registerServiceWorker();
});