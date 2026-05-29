import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { UtensilsCrossed, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const { signInWithEmail } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const err = await signInWithEmail(email, password)
    if (err) setError('Correo o contraseña incorrectos')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#141414]">
      <div className="w-full max-w-sm mx-4">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[#c9a84c]/15 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <UtensilsCrossed size={30} className="text-[#c9a84c]" />
          </div>
          <h1 className="text-3xl font-bold text-[#c9a84c]">Casa Mamá</h1>
          <p className="text-gray-400 mt-2 text-sm tracking-widest uppercase">Control de Almuerzos</p>
        </div>

        <div className="bg-[#1e1e1e] border border-[#2e2e2e] rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Correo electrónico</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tucorreo@gmail.com"
                required
                className="w-full bg-[#252525] border border-[#333] text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#c9a84c] placeholder-gray-600 transition-colors"
              />
            </div>

            <div>
              <label className="text-xs text-gray-400 mb-1.5 block">Contraseña</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-[#252525] border border-[#333] text-white rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:border-[#c9a84c] placeholder-gray-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#c9a84c] hover:bg-[#a07830] disabled:opacity-50 text-black font-semibold py-3 px-4 rounded-xl transition-all duration-200 mt-2"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
