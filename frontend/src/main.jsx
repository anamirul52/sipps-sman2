import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './main.css'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Toaster 
        position="top-center" 
        toastOptions={{
          style: {
            fontSize: '13px', // Lebih kecil dan proporsional untuk mobile
            maxWidth: '90vw', // Maksimal 90% lebar layar HP
            padding: '10px 14px',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            color: '#27272a', // zinc-800
            background: '#ffffff',
            lineHeight: '1.4',
            textAlign: 'left'
          },
          success: {
            iconTheme: {
              primary: '#10b981', // emerald-500
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444', // red-500
              secondary: '#ffffff',
            },
          }
        }} 
      />
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
