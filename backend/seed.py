"""
Seed script — run once after migration:
  python seed.py
"""
import uuid
from app import create_app
from models import db, Admin, Dosen, Mahasiswa
from werkzeug.security import generate_password_hash

JURUSAN = ['Teknik Informatika', 'Sistem Informasi', 'Teknik Komputer']

DOSEN_DATA = [
    {'nama': 'Dr. Budi Santoso, M.Kom', 'nidn': '0101017001', 'email': 'budi.santoso@kampus.ac.id'},
    {'nama': 'Dr. Siti Rahayu, M.T', 'nidn': '0202018002', 'email': 'siti.rahayu@kampus.ac.id'},
    {'nama': 'Prof. Ahmad Fauzi, Ph.D', 'nidn': '0303019003', 'email': 'ahmad.fauzi@kampus.ac.id'},
]

MAHASISWA_DATA = [
    {'nama': 'Andi Prasetyo',    'nim': '2021001001', 'email': 'andi.prasetyo@mahasiswa.ac.id',    'semester': 5, 'jurusan': 'Teknik Informatika',  'dosen_idx': 0},
    {'nama': 'Budi Wijaya',      'nim': '2021001002', 'email': 'budi.wijaya@mahasiswa.ac.id',      'semester': 3, 'jurusan': 'Sistem Informasi',     'dosen_idx': 0},
    {'nama': 'Citra Dewi',       'nim': '2021001003', 'email': 'citra.dewi@mahasiswa.ac.id',       'semester': 7, 'jurusan': 'Teknik Informatika',  'dosen_idx': 1},
    {'nama': 'Deni Kurniawan',   'nim': '2021001004', 'email': 'deni.kurniawan@mahasiswa.ac.id',   'semester': 1, 'jurusan': 'Teknik Komputer',      'dosen_idx': 1},
    {'nama': 'Eka Putri',        'nim': '2021001005', 'email': 'eka.putri@mahasiswa.ac.id',        'semester': 4, 'jurusan': 'Sistem Informasi',     'dosen_idx': 2},
    {'nama': 'Fajar Nugroho',    'nim': '2021001006', 'email': 'fajar.nugroho@mahasiswa.ac.id',    'semester': 6, 'jurusan': 'Teknik Informatika',  'dosen_idx': 2},
    {'nama': 'Gita Purnama',     'nim': '2021001007', 'email': 'gita.purnama@mahasiswa.ac.id',     'semester': 2, 'jurusan': 'Teknik Komputer',      'dosen_idx': 0},
    {'nama': 'Hendra Saputra',   'nim': '2021001008', 'email': 'hendra.saputra@mahasiswa.ac.id',   'semester': 8, 'jurusan': 'Teknik Informatika',  'dosen_idx': None},
    {'nama': 'Indah Lestari',    'nim': '2021001009', 'email': 'indah.lestari@mahasiswa.ac.id',    'semester': 3, 'jurusan': 'Sistem Informasi',     'dosen_idx': None},
    {'nama': 'Joko Susilo',      'nim': '2021001010', 'email': 'joko.susilo@mahasiswa.ac.id',      'semester': 5, 'jurusan': 'Teknik Komputer',      'dosen_idx': 1},
]

# Sample KRS for a few students
SAMPLE_MK = {
    5: [
        {"kode": "CS501", "nama": "Kecerdasan Buatan", "sks": 3},
        {"kode": "CS502", "nama": "Keamanan Sistem Informasi", "sks": 3},
        {"kode": "CS503", "nama": "Pemrograman Mobile", "sks": 3},
    ],
    3: [
        {"kode": "CS301", "nama": "Struktur Data", "sks": 3},
        {"kode": "CS303", "nama": "Basis Data", "sks": 3},
    ],
}


def seed():
    app = create_app()
    with app.app_context():
        # Admin
        if not Admin.query.filter_by(email='admin@krs.ac.id').first():
            db.session.add(Admin(
                id=uuid.uuid4(),
                email='admin@krs.ac.id',
                password_hash=generate_password_hash('admin123'),
            ))
            print('✓ Admin created: admin@krs.ac.id / admin123')

        # Dosen
        dosen_ids = []
        for dd in DOSEN_DATA:
            existing = Dosen.query.filter_by(nidn=dd['nidn']).first()
            if not existing:
                d = Dosen(
                    id=uuid.uuid4(),
                    nama=dd['nama'],
                    nidn=dd['nidn'],
                    email=dd['email'],
                    password_hash=generate_password_hash('dosen123'),
                )
                db.session.add(d)
                db.session.flush()
                dosen_ids.append(d.id)
                print(f'✓ Dosen created: {dd["email"]} / dosen123')
            else:
                dosen_ids.append(existing.id)

        # Mahasiswa
        for md in MAHASISWA_DATA:
            if not Mahasiswa.query.filter_by(nim=md['nim']).first():
                dpa_id = dosen_ids[md['dosen_idx']] if md['dosen_idx'] is not None else None
                mk = SAMPLE_MK.get(md['semester'], [])
                m = Mahasiswa(
                    id=uuid.uuid4(),
                    nama=md['nama'],
                    nim=md['nim'],
                    email=md['email'],
                    password_hash=generate_password_hash('mhs123'),
                    semester=md['semester'],
                    jurusan=md['jurusan'],
                    dosen_pa_id=dpa_id,
                    mata_kuliah=mk,
                )
                db.session.add(m)
                print(f'✓ Mahasiswa created: {md["email"]} / mhs123')

        db.session.commit()
        print('\n✅ Seed selesai!')
        print('\nAkun untuk testing:')
        print('  Admin     : admin@krs.ac.id          | admin123')
        print('  Dosen     : budi.santoso@kampus.ac.id | dosen123')
        print('  Mahasiswa : andi.prasetyo@mahasiswa.ac.id | mhs123')


if __name__ == '__main__':
    seed()
