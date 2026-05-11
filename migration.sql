-- ============================================================
-- KRS System - Database Migration
-- Jalankan di Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (sudah aktif di Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Tabel admin ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

-- ── Tabel dosen ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dosen (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama          VARCHAR(255) NOT NULL,
    nidn          VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Tabel mahasiswa ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS mahasiswa (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama          VARCHAR(255) NOT NULL,
    nim           VARCHAR(50)  UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    semester      INTEGER      NOT NULL CHECK (semester BETWEEN 1 AND 8),
    jurusan       VARCHAR(255) NOT NULL,
    dosen_pa_id   UUID         REFERENCES dosen(id) ON DELETE SET NULL,
    mata_kuliah   JSONB        NOT NULL DEFAULT '[]'::jsonb,
    created_at    TIMESTAMPTZ  DEFAULT NOW(),
    updated_at    TIMESTAMPTZ  DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_mahasiswa_dosen_pa_id ON mahasiswa(dosen_pa_id);
CREATE INDEX IF NOT EXISTS idx_mahasiswa_jurusan     ON mahasiswa(jurusan);
CREATE INDEX IF NOT EXISTS idx_mahasiswa_nim         ON mahasiswa(nim);

-- ── Auto-update updated_at ────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_dosen_updated_at ON dosen;
CREATE TRIGGER set_dosen_updated_at
  BEFORE UPDATE ON dosen
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

DROP TRIGGER IF EXISTS set_mahasiswa_updated_at ON mahasiswa;
CREATE TRIGGER set_mahasiswa_updated_at
  BEFORE UPDATE ON mahasiswa
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();
