import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, LogIn, UserPlus } from 'lucide-react'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const navigate = useNavigate()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    else navigate('/')
    setLoading(false)
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) setError(error.message)
    else {
      alert('¡Cuenta creada exitosamente! Ya puedes iniciar sesión.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-500/20 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="z-10 w-full max-w-md flex flex-col items-center gap-8">
        
        {/* Splash Logo */}
        <div className="w-full flex justify-center mb-8">
          <img 
            src="/siamofuori_logo.png" 
            alt="Siamo Fuori Logo" 
            className="w-4/5 object-contain filter drop-shadow-[0_0_15px_rgba(0,255,0,0.5)]"
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

          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Correo Electrónico</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="tu@email.com"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            <div className="pt-4 space-y-3">
              <button 
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <LogIn size={20} />
                Ingresar
              </button>
              
              <button 
                onClick={handleSignUp}
                disabled={loading}
                className="w-full bg-transparent border border-gray-600 hover:border-gray-400 text-gray-300 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                <UserPlus size={20} />
                Registrarse
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
