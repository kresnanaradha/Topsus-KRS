import { useState, useEffect } from 'react'
import { Users, UserCheck, BookOpen, AlertCircle, TrendingUp } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'

function StatCard({ label, value, icon: Icon, color, sub }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-gray-800 mt-1">{value ?? '—'}</p>
          {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats]   = useState(null)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(({ data }) => setStats(data.data))
      .catch(() => addToast('Gagal memuat data dashboard', 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Ringkasan data sistem KRS</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          label="Total Mahasiswa"
          value={stats?.total_mahasiswa}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          label="Total Dosen"
          value={stats?.total_dosen}
          icon={UserCheck}
          color="bg-green-500"
        />
        <StatCard
          label="Rata-rata SKS"
          value={stats?.avg_sks}
          icon={BookOpen}
          color="bg-purple-500"
          sub="per mahasiswa"
        />
        <StatCard
          label="Tanpa Dosen PA"
          value={stats?.no_dosen_pa}
          icon={AlertCircle}
          color="bg-amber-500"
          sub="mahasiswa belum di-assign"
        />
      </div>

      {/* Jurusan Distribution */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-primary-700" />
          <h3 className="font-semibold text-gray-800">Distribusi Mahasiswa per Jurusan</h3>
        </div>
        {stats?.jurusan_distribution?.length ? (
          <div className="space-y-3">
            {stats.jurusan_distribution
              .sort((a, b) => b.count - a.count)
              .map(({ jurusan, count }) => {
                const max = Math.max(...stats.jurusan_distribution.map(j => j.count))
                const pct = max > 0 ? Math.round((count / max) * 100) : 0
                return (
                  <div key={jurusan}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-700 font-medium">{jurusan}</span>
                      <span className="text-gray-500">{count} mahasiswa</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                      <div
                        className="bg-primary-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
          </div>
        ) : (
          <p className="text-sm text-gray-400">Belum ada data jurusan.</p>
        )}
      </div>
    </div>
  )
}
