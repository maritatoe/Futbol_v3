import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <App />
        <Toaster 
          position="top-center" 
          containerStyle={{
            top: '50%',
            bottom: 'auto',
            transform: 'translateY(-50%)'
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
)
