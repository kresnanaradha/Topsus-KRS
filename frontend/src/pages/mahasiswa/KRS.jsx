import { useState, useEffect } from 'react'
import { BookOpen, CheckSquare, Save, Info } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'

const MAX_SKS = 24

export default function MahasiswaKRS() {
  const { addToast } = useToast()
  const [krsData, setKrsData]       = useState(null)
  const [selected, setSelected]     = useState({}) // { kode: mk object }
  const [loading, setLoading]       = useState(true)
  const [saving, setSaving]         = useState(false)

  useEffect(() => {
    api.get('/mahasiswa/krs')
      .then(({ data }) => {
        const d = data.data
        setKrsData(d)
        const sel = {}
        ;(d.mata_kuliah_diambil || []).forEach(mk => { sel[mk.kode] = mk })
        setSelected(sel)
      })
      .catch(() => addToast('Gagal memuat KRS', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const toggle = (mk) => {
    setSelected(prev => {
      const next = { ...prev }
      if (next[mk.kode]) {
        delete next[mk.kode]
      } else {
        const totalSKS = Object.values(next).reduce((s, m) => s + m.sks, 0)
        if (totalSKS + mk.sks > MAX_SKS) {
          addToast(`Batas maksimal ${MAX_SKS} SKS terlampaui`, 'warning')
          return prev
        }
        next[mk.kode] = mk
      }
      return next
    })
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = Object.values(selected)
      await api.put('/mahasiswa/krs', { mata_kuliah: payload })
      addToast('KRS berhasil disimpan', 'success')
    } catch (err) {
      addToast(err.response?.data?.error || 'Gagal menyimpan KRS', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-8 h-8 border-2 border-primary-700 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const available = krsData?.mata_kuliah_tersedia || []
  const totalSKS  = Object.values(selected).reduce((s, m) => s + m.sks, 0)
  const pctSKS    = Math.min((totalSKS / MAX_SKS) * 100, 100)

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-800">Kartu Rencana Studi (KRS)</h2>
        <p className="text-sm text-gray-500 mt-0.5">Semester {krsData?.semester} — Pilih mata kuliah yang akan diambil</p>
      </div>

      {/* SKS meter */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-600" />
            <span className="text-sm font-semibold text-gray-700">Total SKS Dipilih</span>
          </div>
          <span className={`text-lg font-bold ${totalSKS > MAX_SKS * 0.9 ? 'text-red-600' : 'text-primary-700'}`}>
            {totalSKS} / {MAX_SKS} SKS
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${pctSKS >= 100 ? 'bg-red-500' : pctSKS >= 80 ? 'bg-amber-500' : 'bg-primary-600'}`}
            style={{ width: `${pctSKS}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-gray-400">
          <span>{Object.keys(selected).length} mata kuliah dipilih</span>
          <span>Maks. {MAX_SKS} SKS</span>
        </div>
      </div>

      {/* Info */}
      {!krsData?.dosen_pa_id && (
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-700">
            Anda belum memiliki Dosen Pembimbing Akademik. Hubungi admin untuk melakukan pemetaan.
          </p>
        </div>
      )}

      {/* Daftar MK */}
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-800 text-sm">
            Mata Kuliah Tersedia — Semester {krsData?.semester}
          </h3>
        </div>
        {available.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-gray-400">Tidak ada mata kuliah untuk semester ini.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {available.map(mk => {
              const isSelected = !!selected[mk.kode]
              return (
                <label
                  key={mk.kode}
                  className={`flex items-center gap-4 px-5 py-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-primary-50' : 'hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggle(mk)}
                    className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-400">{mk.kode}</span>
                      {isSelected && (
                        <span className="text-xs font-medium text-primary-600 bg-primary-100 px-1.5 py-0.5 rounded">
                          Dipilih
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mt-0.5">{mk.nama}</p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 px-3 py-1.5 rounded-lg ${
                    isSelected ? 'bg-primary-700 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {mk.sks} SKS
                  </span>
                </label>
              )
            })}
          </div>
        )}
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2 px-6"
        >
          {saving ? (
            <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Menyimpan...' : 'Simpan KRS'}
        </button>
      </div>
    </div>
  )
}
