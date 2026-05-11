import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from './Layout'

const DEFAULT_PATHS = {
  admin:     '/admin/dashboard',
  mahasiswa: '/mahasiswa/profile',
  dosen:     '/dosen/profile',
}

export default function ProtectedRoute({ role }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-primary-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />

  if (user.role !== role) {
    return <Navigate to={DEFAULT_PATHS[user.role] ?? '/login'} replace />
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}
