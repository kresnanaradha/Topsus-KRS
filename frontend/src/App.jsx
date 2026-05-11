import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }      from './context/AuthContext'
import { ToastProvider }     from './components/Toast'
import ProtectedRoute        from './components/ProtectedRoute'
import Login                 from './pages/Login'
import AdminDashboard        from './pages/admin/Dashboard'
import AdminMahasiswa        from './pages/admin/Mahasiswa'
import AdminDosen            from './pages/admin/Dosen'
import AdminPemetaan         from './pages/admin/Pemetaan'
import MahasiswaProfile      from './pages/mahasiswa/Profile'
import MahasiswaKRS          from './pages/mahasiswa/KRS'
import DosenProfile          from './pages/dosen/Profile'
import DosenBimbingan        from './pages/dosen/MahasiswaBimbingan'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/"            element={<Navigate to="/login" replace />} />
            <Route path="/login"       element={<Login />} />
            <Route path="/login/:role" element={<Login />} />

            <Route element={<ProtectedRoute role="admin" />}>
              <Route path="/admin/dashboard"  element={<AdminDashboard />} />
              <Route path="/admin/mahasiswa"  element={<AdminMahasiswa />} />
              <Route path="/admin/dosen"      element={<AdminDosen />} />
              <Route path="/admin/pemetaan"   element={<AdminPemetaan />} />
            </Route>

            <Route element={<ProtectedRoute role="mahasiswa" />}>
              <Route path="/mahasiswa/profile" element={<MahasiswaProfile />} />
              <Route path="/mahasiswa/krs"     element={<MahasiswaKRS />} />
            </Route>

            <Route element={<ProtectedRoute role="dosen" />}>
              <Route path="/dosen/profile"              element={<DosenProfile />} />
              <Route path="/dosen/mahasiswa-bimbingan"  element={<DosenBimbingan />} />
            </Route>

            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
