import { useState, useEffect, useCallback } from 'react'
import { GraduationCap, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import api from '../../services/api'
import { useToast } from '../../components/Toast'
import Table from '../../components/Table'
import Modal from '../../components/Modal'

export default function DosenBimbingan() {
  const { addToast } = useToast()
  const [data, setData]         = useState([])
  const [loading, setLoading]   = useState(true)
  const [selected, setSelected] = useState(null)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const { data: res } = await api.get('/dosen/mahasiswa-bimbingan')
      setData(res.data)
    } catch {
      addToast('Gagal memuat data bimbingan', 'error')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const columns = [
    { key: 'nim', label: 'NIM' },
    { key: 'nama', label: 'Nama' },
    { key: 'jurusan', label: 'Jurusan' },
    { key: 'semester', label: 'Semester', render: v => `Semester ${v}` },
    {
      key: 'mata_kuliah',
      label: 'SKS',
      render: (_, row) => {
        const sks = (row.mata_kuliah || []).reduce((s, mk) => s + (mk.sks || 0), 0)
        const count = (row.mata_kuliah || []).length
        return (
          <div className="text-center">
            <span className={`font-bold ${sks > 0 ? 'text-primary-700' : 'text-gray-400'}`}>{sks}</span>
            <span className="text-xs text-gray-400 ml-1">({count} MK)</span>
          </div>
        )
      }
    },
  ]

  const totalSKS = (selected?.mata_kuliah || []).reduce((s, mk) => s + (mk.sks || 0), 0)

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-800">Mahasiswa Bimbingan</h2>
          <p className="text-sm text-gray-500">Daftar mahasiswa yang Anda bimbing sebagai Dosen PA</p>
        </div>
      </div>

      {/* Summary */}
      <div className="card p-4 flex items-center gap-4">
        <div className="w-12 h-12 bg-green-600 rounded-xl flex items-center justify-center text-white text-lg font-bold">
          {data.length}
        </div>
        <div>
          <p className="font-semibold text-gray-800">Total Mahasiswa Bimbingan</p>
          <p className="text-sm text-gray-500">
            {data.filter(m => (m.mata_kuliah || []).length > 0).length} sudah isi KRS
            &middot; {data.filter(m => (m.mata_kuliah || []).length === 0).length} belum isi KRS
          </p>
        </div>
      </div>

      <Table
        columns={columns}
        data={data}
        loading={loading}
        emptyMessage="Belum ada mahasiswa bimbingan"
        actions={(row) => (
          <button
            onClick={() => setSelected(row)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Lihat KRS
          </button>
        )}
      />

      {/* KRS Detail Modal */}
      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title={`KRS — ${selected?.nama}`}
        size="md"
        footer={
          <button onClick={() => setSelected(null)} className="btn-secondary w-full">
            Tutup
          </button>
        }
      >
        {selected && (
          <div className="space-y-4">
            {/* Info mahasiswa */}
            <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500 text-xs">NIM</p>
                <p className="font-semibold text-gray-800">{selected.nim}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Semester</p>
                <p className="font-semibold text-gray-800">Semester {selected.semester}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Jurusan</p>
                <p className="font-semibold text-gray-800">{selected.jurusan}</p>
              </div>
              <div>
                <p className="text-gray-500 text-xs">Email</p>
                <p className="font-semibold text-gray-800 truncate">{selected.email}</p>
              </div>
            </div>

            {/* KRS */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-green-600" />
                Mata Kuliah Diambil
              </h4>
              {(selected.mata_kuliah || []).length === 0 ? (
                <div className="text-center py-8 text-sm text-gray-400 bg-gray-50 rounded-xl">
                  Mahasiswa belum mengisi KRS semester ini.
                </div>
              ) : (
                <div className="space-y-2">
                  {selected.mata_kuliah.map(mk => (
                    <div key={mk.kode} className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3">
                      <div>
                        <span className="text-xs font-mono text-gray-400">{mk.kode}</span>
                        <p className="text-sm font-semibold text-gray-800">{mk.nama}</p>
                      </div>
                      <span className="text-sm font-bold text-primary-700 bg-primary-50 px-3 py-1 rounded-lg">
                        {mk.sks} SKS
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-200">
                    <span className="text-sm text-gray-500 font-medium">Total SKS</span>
                    <span className="text-base font-bold text-primary-700">{totalSKS} SKS</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
