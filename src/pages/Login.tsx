import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { AlertTriangle } from 'lucide-react'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleGoogleLogin() {
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Esto le dice a Supabase que te devuelva a la URL exacta en la que estás ahora
        // (ya sea localhost, la rama principal de vercel, o una rama paralela)
        redirectTo: `${window.location.origin}/`
      }
    })
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/20 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="z-10 w-full max-w-md flex flex-col items-center gap-6">
        
        {/* Splash Logo */}
        <div className="w-full flex justify-center mb-2">
          <img 
            src="/siamofuori_logo.png" 
            alt="Siamo Fuori Logo" 
            className="w-full object-contain filter drop-shadow-[0_0_15px_rgba(0,255,0,0.5)]"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              // Fallback if image not found
              const parent = (e.target as HTMLImageElement).parentElement;
              if (parent && !parent.querySelector('h1')) {
                const fallback = document.createElement('h1');
                fallback.className = 'text-5xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600';
                fallback.innerText = 'SIAMOFUORI';
                parent.appendChild(fallback);
              }
            }}
          />
        </div>

        {/* Login Form */}
        <div className="w-full bg-gray-900/80 backdrop-blur-md p-6 rounded-3xl border border-gray-800 shadow-2xl">
          <h2 className="text-xl font-bold text-center mb-6">Iniciar Sesión</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-500 rounded-xl text-red-200 text-sm flex gap-2 items-center">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-4">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm text-base"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              Continuar con Google
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
