import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// StrictMode intentionally runs effects twice in dev — removed to prevent
// duplicate API calls (double "Note not found", "Failed to load notes" toasts)
ReactDOM.createRoot(document.getElementById('root')).render(<App />)
