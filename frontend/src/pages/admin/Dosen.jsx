import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import Table from '../../components/Table'
import Modal from '../../components/Modal'

const EMPTY_FORM = { nama: '', nidn: '', email: '', password: '' }

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

export default function AdminDosen() {
  const { addToast } = useToast()
  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(null)
  const [selected, setSelected] = useState(null)
  const [form, setForm]         = useState(EMPTY_FORM)
  const [saving, setSaving]     = useState(false)
  const [formErr, setFormErr]   = useState({})

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const { data: res } = await api.get('/admin/dosen')
      setData(res.data)
    } catch {
      addToast('Gagal memuat data dosen', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const openAdd = () => { setForm(EMPTY_FORM); setFormErr({}); setModal('add') }
  const openEdit = (row) => {
    setSelected(row)
    setForm({ ...EMPTY_FORM, nama: row.nama, nidn: row.nidn, email: row.email })
    setFormErr({})
    setModal('edit')
  }
  const openDelete = (row) => { setSelected(row); setModal('delete') }
  const closeModal = () => { setModal(null); setSelected(null) }

  const validate = () => {
    const errs = {}
    if (!form.nama.trim()) errs.nama = 'Nama wajib diisi'
    if (!form.nidn.trim()) errs.nidn = 'NIDN wajib diisi'
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
      const payload = { ...form }
      if (modal === 'add') {
        await api.post('/admin/dosen', payload)
        addToast('Dosen berhasil ditambahkan', 'success')
      } else {
        if (!payload.password) delete payload.password
        await api.put(`/admin/dosen/${selected.id}`, payload)
        addToast('Data dosen diperbarui', 'success')
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
      await api.delete(`/admin/dosen/${selected.id}`)
      addToast('Dosen berhasil dihapus', 'success')
      closeModal()
      fetchAll()
    } catch {
      addToast('Gagal menghapus dosen', 'error')
    } finally {
      setSaving(false)
    }
  }

  const columns = [
    { key: 'nidn', label: 'NIDN' },
    { key: 'nama', label: 'Nama' },
    { key: 'email', label: 'Email' },
    {
      key: 'total_bimbingan', label: 'Bimbingan',
      render: v => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
          v > 0 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}>{v} mahasiswa</span>
      )
    },
  ]

  const field = (key, value) => setForm(f => ({ ...f, [key]: value }))

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Data Dosen</h2>
          <p className="text-sm text-gray-500 mt-0.5">Kelola data dosen pengajar</p>
        </div>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Dosen
        </button>
      </div>

      <Table
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="Belum ada dosen terdaftar"
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

      <Modal
        isOpen={modal === 'add' || modal === 'edit'}
        onClose={closeModal}
        title={modal === 'add' ? 'Tambah Dosen' : 'Edit Dosen'}
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
            <input value={form.nama} onChange={e => field('nama', e.target.value)} className="input-field" placeholder="Dr. Nama Dosen, M.Kom" />
            {formErr.nama && <p className="text-xs text-red-500 mt-1">{formErr.nama}</p>}
          </FormField>
          <FormField label="NIDN" required>
            <input value={form.nidn} onChange={e => field('nidn', e.target.value)} className="input-field" placeholder="0101011234" />
            {formErr.nidn && <p className="text-xs text-red-500 mt-1">{formErr.nidn}</p>}
          </FormField>
          <FormField label="Email" required>
            <input type="email" value={form.email} onChange={e => field('email', e.target.value)} className="input-field" placeholder="nama@kampus.ac.id" />
            {formErr.email && <p className="text-xs text-red-500 mt-1">{formErr.email}</p>}
          </FormField>
          <FormField label={modal === 'add' ? 'Password' : 'Password (kosongkan jika tidak diubah)'} required={modal === 'add'}>
            <input type="password" value={form.password} onChange={e => field('password', e.target.value)} className="input-field" placeholder={modal === 'add' ? 'Min. 6 karakter' : 'Kosongkan jika tidak diubah'} />
            {formErr.password && <p className="text-xs text-red-500 mt-1">{formErr.password}</p>}
          </FormField>
        </div>
      </Modal>

      <Modal
        isOpen={modal === 'delete'}
        onClose={closeModal}
        title="Hapus Dosen"
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
          Yakin ingin menghapus dosen <strong>{selected?.nama}</strong>? Seluruh mahasiswa bimbingannya akan kehilangan penugasan Dosen PA.
        </p>
      </Modal>
    </div>
  )
}
