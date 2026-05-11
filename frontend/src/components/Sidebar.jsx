import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, UserCheck, GitMerge,
  User, BookOpen, GraduationCap,
} from 'lucide-react'

const NAV = {
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard',       icon: LayoutDashboard },
    { to: '/admin/mahasiswa', label: 'Data Mahasiswa',  icon: Users },
    { to: '/admin/dosen',     label: 'Data Dosen',      icon: UserCheck },
    { to: '/admin/pemetaan',  label: 'Pemetaan PA',     icon: GitMerge },
  ],
  mahasiswa: [
    { to: '/mahasiswa/profile', label: 'Profil Saya', icon: User },
    { to: '/mahasiswa/krs',     label: 'KRS',         icon: BookOpen },
  ],
  dosen: [
    { to: '/dosen/profile',             label: 'Profil Saya',        icon: User },
    { to: '/dosen/mahasiswa-bimbingan', label: 'Mahasiswa Bimbingan', icon: GraduationCap },
  ],
}

export default function Sidebar({ role }) {
  const links = NAV[role] ?? []

  return (
    <aside className="w-60 bg-primary-800 min-h-screen flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-primary-700">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-tight">SIAKAD</p>
            <p className="text-primary-300 text-xs capitalize">{role}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-primary-200 hover:bg-white/10 hover:text-white'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
