# SIAKAD — Sistem Informasi Akademik (KRS)

Sistem KRS full-stack untuk 3 role: **Admin**, **Mahasiswa**, dan **Dosen**.

## Tech Stack

| Layer      | Teknologi                                              |
|------------|--------------------------------------------------------|
| Frontend   | React 18 + Vite + React Router + Axios + TailwindCSS  |
| Backend    | Python Flask + Flask-JWT-Extended + SQLAlchemy         |
| Database   | PostgreSQL via **Supabase**                            |
| Cache      | Redis via **Upstash**                                  |
| Hosting FE | **Netlify**                                            |
| Hosting BE | **Railway**                                            |

---

## Akun Default (setelah seed)

| Role      | Email                               | Password  |
|-----------|-------------------------------------|-----------|
| Admin     | admin@krs.ac.id                     | admin123  |
| Dosen     | budi.santoso@kampus.ac.id           | dosen123  |
| Mahasiswa | andi.prasetyo@mahasiswa.ac.id       | mhs123    |

---

## Panduan Deployment

### 1. Setup Database di Supabase

1. Buka [supabase.com](https://supabase.com) → **New Project**
2. Isi nama project, password, dan region
3. Tunggu project selesai dibuat (~2 menit)
4. Buka **SQL Editor** → klik **New query**
5. Paste seluruh isi file `migration.sql` → klik **Run**
6. Salin **Connection String** dari:
   - `Settings` → `Database` → `Connection string` → pilih tab **URI**
   - Ganti `[YOUR-PASSWORD]` dengan password project kamu
   - Simpan string ini untuk Railway

### 2. Setup Cache di Upstash

1. Buka [upstash.com](https://upstash.com) → **Create Database**
2. Pilih region terdekat → klik **Create**
3. Salin **UPSTASH_REDIS_REST_URL** dan **UPSTASH_REDIS_REST_TOKEN**
4. Simpan keduanya untuk Railway

### 3. Deploy Backend ke Railway

1. Push folder `backend/` ke GitHub repo
2. Buka [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub**
3. Pilih repo → Railway auto-detect Python
4. Buka tab **Variables** → tambahkan semua env vars berikut:

   ```
   DATABASE_URL        = postgresql://postgres:[PASS]@db.[REF].supabase.co:5432/postgres
   JWT_SECRET_KEY      = (generate random: python -c "import secrets; print(secrets.token_hex(32))")
   UPSTASH_REDIS_REST_URL   = https://....upstash.io
   UPSTASH_REDIS_REST_TOKEN = ....
   CORS_ORIGINS        = http://localhost:5173,https://your-app.netlify.app
   ```

5. Railway akan build otomatis via `Procfile`
6. Setelah deploy, catat URL Railway (contoh: `https://krs-api.railway.app`)

### 4. Jalankan Seed Data

Setelah backend berhasil deploy, jalankan seed data:

**Cara 1 — Lokal** (perlu Python & koneksi ke Supabase):
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Edit .env dengan DATABASE_URL dari Supabase
python seed.py
```

**Cara 2 — Via Railway Shell**:
- Buka Railway → project → tab **Settings** → **Railway Shell**
- Jalankan: `python seed.py`

### 5. Deploy Frontend ke Netlify

1. Push folder `frontend/` ke GitHub repo
2. Buka [netlify.com](https://netlify.com) → **Add new site** → **Import from Git**
3. Pilih repo dan konfigurasikan:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/dist`
4. Buka **Site settings** → **Environment variables** → tambahkan:
   ```
   VITE_API_URL = https://your-backend.railway.app
   ```
5. Klik **Deploy site** — Netlify otomatis build dan deploy

### 6. Update CORS di Railway

Setelah dapat URL Netlify, perbarui env var di Railway:
```
CORS_ORIGINS = http://localhost:5173,https://your-app.netlify.app
```

---

## Pengembangan Lokal

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

pip install -r requirements.txt
cp .env.example .env
# Edit .env dengan variabel yang sesuai

python app.py
# API berjalan di http://localhost:5000
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
# Edit VITE_API_URL=http://localhost:5000

npm run dev
# App berjalan di http://localhost:5173
```

---

## Struktur Folder

```
Topsus-KRS/
├── backend/
│   ├── app.py              ← Entry point Flask
│   ├── config.py           ← Konfigurasi env vars
│   ├── models.py           ← SQLAlchemy models
│   ├── seed.py             ← Data awal untuk testing
│   ├── requirements.txt
│   ├── Procfile            ← Railway deployment
│   ├── .env.example
│   ├── routes/
│   │   ├── auth.py         ← POST /api/auth/login, refresh, me
│   │   ├── admin.py        ← CRUD mahasiswa, dosen, dashboard
│   │   ├── mahasiswa.py    ← Profile, KRS
│   │   └── dosen.py        ← Profile, mahasiswa bimbingan
│   └── utils/
│       ├── cache.py        ← Upstash Redis helper
│       └── auth_helpers.py ← Decorator role-based JWT
│
├── frontend/
│   ├── index.html
│   ├── netlify.toml        ← SPA redirect
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── src/
│       ├── App.jsx          ← Router setup
│       ├── main.jsx
│       ├── index.css        ← Tailwind + custom styles
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── services/
│       │   └── api.js       ← Axios + JWT interceptor
│       ├── components/
│       │   ├── Layout.jsx
│       │   ├── Sidebar.jsx
│       │   ├── Navbar.jsx
│       │   ├── Table.jsx    ← Reusable: search + pagination
│       │   ├── Modal.jsx    ← Reusable modal
│       │   ├── Toast.jsx    ← Toast notification
│       │   └── ProtectedRoute.jsx
│       └── pages/
│           ├── Login.jsx
│           ├── admin/       ← Dashboard, Mahasiswa, Dosen, Pemetaan
│           ├── mahasiswa/   ← Profile, KRS
│           └── dosen/       ← Profile, MahasiswaBimbingan
│
└── migration.sql            ← Jalankan di Supabase SQL Editor
```

---

## API Endpoints

### Auth
| Method | Endpoint           | Body                          |
|--------|--------------------|-------------------------------|
| POST   | /api/auth/login    | `{role, email, password}`     |
| POST   | /api/auth/refresh  | _(refresh token di header)_   |
| GET    | /api/auth/me       |                               |

### Admin
| Method | Endpoint                              | Keterangan              |
|--------|---------------------------------------|-------------------------|
| GET    | /api/admin/mahasiswa                  | List (cached 5 menit)   |
| POST   | /api/admin/mahasiswa                  | Tambah mahasiswa        |
| GET    | /api/admin/mahasiswa/:id              | Detail                  |
| PUT    | /api/admin/mahasiswa/:id              | Update                  |
| DELETE | /api/admin/mahasiswa/:id              | Hapus                   |
| PUT    | /api/admin/mahasiswa/:id/dosen-pa     | Assign Dosen PA         |
| GET    | /api/admin/dosen                      | List (cached 5 menit)   |
| POST   | /api/admin/dosen                      | Tambah dosen            |
| PUT    | /api/admin/dosen/:id                  | Update                  |
| DELETE | /api/admin/dosen/:id                  | Hapus                   |
| GET    | /api/admin/dashboard                  | Stats (cached 10 menit) |

### Mahasiswa
| Method | Endpoint              | Keterangan     |
|--------|-----------------------|----------------|
| GET    | /api/mahasiswa/profile |               |
| GET    | /api/mahasiswa/krs    | KRS + katalog  |
| PUT    | /api/mahasiswa/krs    | Simpan KRS     |

### Dosen
| Method | Endpoint                        | Keterangan              |
|--------|---------------------------------|-------------------------|
| GET    | /api/dosen/profile              |                         |
| GET    | /api/dosen/mahasiswa-bimbingan  | List (cached 5 menit)   |
