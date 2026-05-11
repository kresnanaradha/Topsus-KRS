import { useState, useEffect } from 'react'
import { User, Mail, Hash, BookOpen, UserCheck, GraduationCap, Calendar } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
        <Icon className="w-4 h-4 text-primary-600" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-sm text-gray-800 font-semibold mt-0.5">{value || '—'}</p>
      </div>
    </div>
  )
}

export default function MahasiswaProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  useEffect(() => {
    api.get('/mahasiswa/profile')
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

  const totalSKS = (profile?.mata_kuliah || []).reduce((s, mk) => s + (mk.sks || 0), 0)

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Profil Mahasiswa</h2>
        <p className="text-sm text-gray-500 mt-0.5">Informasi akun dan studi Anda</p>
      </div>

      {/* Avatar + nama */}
      <div className="card p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary-700 rounded-2xl flex items-center justify-center text-white text-2xl font-bold">
            {profile?.nama?.[0]?.toUpperCase() ?? 'M'}
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800">{profile?.nama}</h3>
            <p className="text-sm text-gray-500">{profile?.email}</p>
            <span className="inline-flex items-center mt-1 px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
              Mahasiswa Aktif
            </span>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-8">
          <div>
            <InfoRow icon={Hash} label="NIM" value={profile?.nim} />
            <InfoRow icon={GraduationCap} label="Jurusan" value={profile?.jurusan} />
            <InfoRow icon={Calendar} label="Semester" value={`Semester ${profile?.semester}`} />
            <InfoRow icon={BookOpen} label="Total SKS Diambil" value={`${totalSKS} SKS (${(profile?.mata_kuliah || []).length} mata kuliah)`} />
          </div>
          <div>
            <InfoRow icon={Mail} label="Email" value={profile?.email} />
            <InfoRow
              icon={UserCheck}
              label="Dosen Pembimbing Akademik"
              value={profile?.dosen_pa ? `${profile.dosen_pa.nama}` : 'Belum di-assign'}
            />
            {profile?.dosen_pa && (
              <InfoRow icon={Mail} label="Email Dosen PA" value={profile.dosen_pa.email} />
            )}
          </div>
        </div>
      </div>

      {/* KRS ringkas */}
      {profile?.mata_kuliah?.length > 0 && (
        <div className="card p-5">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-600" />
            KRS Semester {profile.semester}
          </h4>
          <div className="space-y-2">
            {profile.mata_kuliah.map(mk => (
              <div key={mk.kode} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <span className="text-xs text-gray-400 font-mono">{mk.kode}</span>
                  <p className="text-sm text-gray-700 font-medium">{mk.nama}</p>
                </div>
                <span className="text-sm font-semibold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-lg">
                  {mk.sks} SKS
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
            <span className="text-sm text-gray-500 font-medium">Total SKS</span>
            <span className="text-sm font-bold text-primary-700">{totalSKS} SKS</span>
          </div>
        </div>
      )}
    </div>
  )
}
