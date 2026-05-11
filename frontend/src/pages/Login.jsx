import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { GraduationCap, Eye, EyeOff, Lock, Mail, Shield, User, BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/Toast'

const ROLES = [
  { id: 'mahasiswa', label: 'Mahasiswa', icon: User,          color: 'text-blue-600'  },
  { id: 'dosen',     label: 'Dosen',     icon: BookOpen,      color: 'text-green-600' },
  { id: 'admin',     label: 'Admin',     icon: Shield,        color: 'text-purple-600'},
]

export default function Login() {
  const { role: paramRole } = useParams()
  const navigate = useNavigate()
  const { login, user } = useAuth()
  const { addToast } = useToast()

  const [selectedRole, setSelectedRole] = useState(paramRole || 'mahasiswa')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  const REDIRECT = { admin: '/admin/dashboard', mahasiswa: '/mahasiswa/profile', dosen: '/dosen/profile' }

  useEffect(() => {
    if (user) navigate(REDIRECT[user.role] ?? '/login', { replace: true })
  }, [user])

  useEffect(() => {
    if (paramRole && ROLES.find(r => r.id === paramRole)) {
      setSelectedRole(paramRole)
    }
  }, [paramRole])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Email dan password wajib diisi.'); return }
    setLoading(true)
    try {
      const userData = await login(selectedRole, email, password)
      addToast(`Selamat datang, ${userData.nama || userData.email}!`, 'success')
      navigate(REDIRECT[userData.role])
    } catch (err) {
      const msg = err.response?.data?.error || 'Login gagal, periksa kembali data Anda.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white/5 rounded-full" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
            <GraduationCap className="w-9 h-9 text-primary-700" />
          </div>
          <h1 className="text-2xl font-bold text-white">SIAKAD</h1>
          <p className="text-primary-200 text-sm mt-1">Sistem Informasi Akademik</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Role Tabs */}
          <div className="flex border-b border-gray-200">
            {ROLES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => { setSelectedRole(id); setError('') }}
                className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors border-b-2 ${
                  selectedRole === id
                    ? 'border-primary-700 text-primary-700 bg-primary-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  className="input-field pl-10"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Masuk...
                </span>
              ) : (
                'Masuk'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-primary-300 text-xs mt-6">
          &copy; {new Date().getFullYear()} SIAKAD – Sistem KRS Akademik
        </p>
      </div>
    </div>
  )
}
