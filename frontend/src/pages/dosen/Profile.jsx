import { useState, useEffect } from 'react'
import { User, Mail, Hash, Users, GraduationCap } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-green-600" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-semibold mt-0.5">{value || '—'}</p>
      </div>
    </div>
  )
}

export default function DosenProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    api.get('/dosen/profile')
      .then(({ data }) => setProfile(data.data))
      .catch(() => addToast('Gagal memuat profil', 'error'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-primary-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Profil Dosen</h2>
        <p className="text-sm text-gray-500 mt-0.5">Informasi akun dan status bimbingan</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {profile?.nama?.[0]?.toUpperCase() ?? 'D'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{profile?.nama}</h3>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
              Dosen Aktif
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-8">
          <div>
            <InfoRow icon={Hash} label="NIDN" value={profile?.nidn} />
            <InfoRow icon={Mail} label="Email" value={profile?.email} />
          </div>
          <div>
            <InfoRow
              icon={Users}
              label="Total Mahasiswa Bimbingan"
              value={`${profile?.total_bimbingan ?? 0} mahasiswa`}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
