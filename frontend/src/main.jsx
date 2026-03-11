import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { registerSW } from 'virtual:pwa-register'

// Initialize PWA Service Worker for Offline-First Capability
registerSW({ immediate: true })

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '855427183041-example-client-id.apps.googleusercontent.com'

ReactDOM.createRoot(document.getElementById('root')).render(
    <GoogleOAuthProvider clientId={clientId}>
        <App />
    </GoogleOAuthProvider>
)
