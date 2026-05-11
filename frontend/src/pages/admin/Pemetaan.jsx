import { useState, useEffect, useCallback } from 'react'
import { GitMerge, UserCheck } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import Table from '../../components/Table'
import Modal from '../../components/Modal'

export default function AdminPemetaan() {
  const { addToast } = useToast()
  const [mahasiswa, setMahasiswa] = useState([])
  const [dosen, setDosen]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [modal, setModal]         = useState(false)
  const [selected, setSelected]   = useState(null)
  const [dosenId, setDosenId]     = useState('')
  const [saving, setSaving]       = useState(false)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [mhsRes, dosenRes] = await Promise.all([
        api.get('/admin/mahasiswa'),
        api.get('/admin/dosen'),
      ])
      setMahasiswa(mhsRes.data.data)
      setDosen(dosenRes.data.data)
    } catch {
      addToast('Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openAssign = (row) => {
    setSelected(row)
    setDosenId(row.dosen_pa_id || '')
    setModal(true)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put(`/admin/mahasiswa/${selected.id}/dosen-pa`, { dosen_id: dosenId || null })
      addToast('Dosen PA berhasil diperbarui', 'success')
      setModal(false)
      fetchAll()
    } catch (err) {
      addToast(err.response?.data?.error || 'Gagal memperbarui Dosen PA', 'error')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'nim',    label: 'NIM' },
    { key: 'nama',   label: 'Mahasiswa' },
    { key: 'jurusan', label: 'Jurusan' },
    { key: 'semester', label: 'Sem', render: v => `${v}` },
    {
      key: 'dosen_pa',
      label: 'Dosen PA',
      render: (_, row) => row.dosen_pa
        ? (
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-green-500 shrink-0" />
            <span className="text-green-700 font-medium text-xs">{row.dosen_pa.nama}</span>
          </div>
        )
        : <span className="text-xs text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full">Belum di-assign</span>,
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <GitMerge className="w-5 h-5 text-primary-700" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Pemetaan Dosen PA</h2>
          <p className="text-sm text-gray-500">Assign Dosen Pembimbing Akademik ke mahasiswa</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-800">{mahasiswa.length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Total Mahasiswa</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{mahasiswa.filter(m => m.dosen_pa_id).length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Sudah di-assign</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{mahasiswa.filter(m => !m.dosen_pa_id).length}</p>
          <p className="text-xs text-gray-500 mt-0.5">Belum di-assign</p>
        </div>
      </div>

      <Table
        columns={columns}
        data={mahasiswa}
        loading={loading}
        emptyMessage="Belum ada mahasiswa"
        actions={(row) => (
          <button
            onClick={() => openAssign(row)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 transition-colors flex items-center gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5" />
            {row.dosen_pa_id ? 'Ganti' : 'Assign'}
          </button>
        )}
      />

      <Modal
        isOpen={modal}
        onClose={() => setModal(false)}
        title={`Assign Dosen PA — ${selected?.nama}`}
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={() => setModal(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            Pilih Dosen Pembimbing Akademik untuk <strong className="text-gray-800">{selected?.nama}</strong> ({selected?.nim}).
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dosen PA</label>
            <select value={dosenId} onChange={e => setDosenId(e.target.value)} className="input-field">
              <option value="">— Hapus penugasan —</option>
              {dosen.map(d => (
                <option key={d.id} value={d.id}>
                  {d.nama} — {d.total_bimbingan} bimbingan
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>
    </div>
  )
}
