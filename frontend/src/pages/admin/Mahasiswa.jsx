import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import Table from '../../components/Table'
import Modal from '../../components/Modal'

const JURUSAN = ['Teknik Informatika', 'Sistem Informasi', 'Teknik Komputer', 'Teknik Elektro']
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8]

const EMPTY_FORM = {
  nama: '', nim: '', email: '', password: '',
  semester: 1, jurusan: JURUSAN[0], dosen_pa_id: '',
}

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function AdminMahasiswa() {
  const { addToast } = useToast()
  const [data, setData]         = useState([])
  const [dosen, setDosen]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)  // null | 'add' | 'edit' | 'delete'
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [formErr, setFormErr]   = useState({})

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [mhsRes, dosenRes] = await Promise.all([
        api.get('/admin/mahasiswa'),
        api.get('/admin/dosen'),
      ])
      setData(mhsRes.data.data)
      setDosen(dosenRes.data.data)
    } catch {
      addToast('Gagal memuat data', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openAdd = () => { setForm(EMPTY_FORM); setFormErr({}); setModal('add') }
  const openEdit = (row) => {
    setSelected(row)
    setForm({ ...EMPTY_FORM, ...row, password: '', dosen_pa_id: row.dosen_pa_id || '' })
    setFormErr({})
    setModal('edit')
  }
  const openDelete = (row) => { setSelected(row); setModal('delete') }
  const closeModal = () => { setModal(null); setSelected(null) }

  const validate = () => {
    const errs = {}
    if (!form.nama.trim()) errs.nama = 'Nama wajib diisi'
    if (!form.nim.trim()) errs.nim = 'NIM wajib diisi'
    if (!form.email.trim()) errs.email = 'Email wajib diisi'
    if (modal === 'add' && !form.password) errs.password = 'Password wajib diisi'
    if (form.password && form.password.length < 6) errs.password = 'Password minimal 6 karakter'
    setFormErr(errs)
    return Object.keys(errs).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    try {
      const payload = { ...form, dosen_pa_id: form.dosen_pa_id || null }
      if (modal === 'add') {
        await api.post('/admin/mahasiswa', payload)
        addToast('Mahasiswa berhasil ditambahkan', 'success')
      } else {
        if (!payload.password) delete payload.password
        await api.put(`/admin/mahasiswa/${selected.id}`, payload)
        addToast('Data mahasiswa diperbarui', 'success')
      }
      closeModal()
      fetchAll()
    } catch (err) {
      addToast(err.response?.data?.error || 'Gagal menyimpan data', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await api.delete(`/admin/mahasiswa/${selected.id}`)
      addToast('Mahasiswa berhasil dihapus', 'success')
      closeModal()
      fetchAll()
    } catch {
      addToast('Gagal menghapus mahasiswa', 'error')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'nim', label: 'NIM' },
    { key: 'nama', label: 'Nama' },
    { key: 'jurusan', label: 'Jurusan' },
    { key: 'semester', label: 'Semester', render: v => `Semester ${v}` },
    { key: 'dosen_pa', label: 'Dosen PA', render: (_, row) => row.dosen_pa?.nama || <span className="text-amber-600 text-xs font-medium">Belum di-assign</span> },
    { key: 'mata_kuliah', label: 'SKS', render: (_, row) => {
        const sks = (row.mata_kuliah || []).reduce((s, mk) => s + (mk.sks || 0), 0)
        return <span className={`font-semibold ${sks > 0 ? 'text-green-600' : 'text-gray-400'}`}>{sks}</span>
    }},
  ]

  const field = (key, value) => setForm(f => ({ ...f, [key]: value }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Data Mahasiswa</h2>
          <p className="text-sm text-gray-500 mt-0.5">Kelola data mahasiswa terdaftar</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Mahasiswa
        </button>
      </div>

      <Table
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="Belum ada mahasiswa terdaftar"
        actions={(row) => (
          <>
            <button onClick={() => openEdit(row)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors" title="Edit">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={() => openDelete(row)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors" title="Hapus">
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      />

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modal === 'add' || modal === 'edit'}
        onClose={closeModal}
        title={modal === 'add' ? 'Tambah Mahasiswa' : 'Edit Mahasiswa'}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeModal} className="btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <FormField label="Nama Lengkap" required>
            <input value={form.nama} onChange={e => field('nama', e.target.value)} className="input-field" placeholder="Nama lengkap mahasiswa" />
            {formErr.nama && <p className="text-xs text-red-500 mt-1">{formErr.nama}</p>}
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="NIM" required>
              <input value={form.nim} onChange={e => field('nim', e.target.value)} className="input-field" placeholder="NIM" />
              {formErr.nim && <p className="text-xs text-red-500 mt-1">{formErr.nim}</p>}
            </FormField>
            <FormField label="Semester" required>
              <select value={form.semester} onChange={e => field('semester', Number(e.target.value))} className="input-field">
                {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
              </select>
            </FormField>
          </div>

          <FormField label="Email" required>
            <input type="email" value={form.email} onChange={e => field('email', e.target.value)} className="input-field" placeholder="email@mahasiswa.ac.id" />
            {formErr.email && <p className="text-xs text-red-500 mt-1">{formErr.email}</p>}
          </FormField>

          <FormField label={modal === 'add' ? 'Password' : 'Password (kosongkan jika tidak diubah)'} required={modal === 'add'}>
            <input type="password" value={form.password} onChange={e => field('password', e.target.value)} className="input-field" placeholder={modal === 'add' ? 'Min. 6 karakter' : 'Kosongkan jika tidak diubah'} />
            {formErr.password && <p className="text-xs text-red-500 mt-1">{formErr.password}</p>}
          </FormField>

          <FormField label="Jurusan" required>
            <select value={form.jurusan} onChange={e => field('jurusan', e.target.value)} className="input-field">
              {JURUSAN.map(j => <option key={j} value={j}>{j}</option>)}
            </select>
          </FormField>

          <FormField label="Dosen Pembimbing Akademik">
            <select value={form.dosen_pa_id} onChange={e => field('dosen_pa_id', e.target.value)} className="input-field">
              <option value="">— Belum di-assign —</option>
              {dosen.map(d => <option key={d.id} value={d.id}>{d.nama} ({d.nidn})</option>)}
            </select>
          </FormField>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        isOpen={modal === 'delete'}
        onClose={closeModal}
        title="Hapus Mahasiswa"
        size="sm"
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeModal} className="btn-secondary">Batal</button>
            <button onClick={handleDelete} disabled={saving} className="btn-danger">
              {saving ? 'Menghapus...' : 'Hapus'}
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          Yakin ingin menghapus mahasiswa <strong>{selected?.nama}</strong> ({selected?.nim})?
          Tindakan ini tidak dapat dibatalkan.
        </p>
      </Modal>
    </div>
  )
}
