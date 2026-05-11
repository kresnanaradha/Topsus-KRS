from flask import Blueprint, request, jsonify
from flask_jwt_extended import get_jwt_identity
from models import db, Mahasiswa
from utils.auth_helpers import mahasiswa_required
from utils.cache import cache_delete_pattern, cache_delete

mahasiswa_bp = Blueprint('mahasiswa', __name__)

MATA_KULIAH_CATALOG = {
    1: [
        {"kode": "CS101", "nama": "Matematika Dasar", "sks": 3},
        {"kode": "CS102", "nama": "Fisika Dasar", "sks": 3},
        {"kode": "CS103", "nama": "Pengantar Teknologi Informasi", "sks": 2},
        {"kode": "CS104", "nama": "Bahasa Indonesia", "sks": 2},
        {"kode": "CS105", "nama": "Bahasa Inggris", "sks": 2},
        {"kode": "CS106", "nama": "Pendidikan Agama", "sks": 2},
        {"kode": "CS107", "nama": "Kewarganegaraan", "sks": 2},
    ],
    2: [
        {"kode": "CS201", "nama": "Kalkulus", "sks": 3},
        {"kode": "CS202", "nama": "Aljabar Linear", "sks": 3},
        {"kode": "CS203", "nama": "Pemrograman Dasar", "sks": 3},
        {"kode": "CS204", "nama": "Sistem Digital", "sks": 3},
        {"kode": "CS205", "nama": "Statistika Dasar", "sks": 3},
    ],
    3: [
        {"kode": "CS301", "nama": "Struktur Data", "sks": 3},
        {"kode": "CS302", "nama": "Pemrograman Berorientasi Objek", "sks": 3},
        {"kode": "CS303", "nama": "Basis Data", "sks": 3},
        {"kode": "CS304", "nama": "Jaringan Komputer", "sks": 3},
        {"kode": "CS305", "nama": "Matematika Diskrit", "sks": 3},
    ],
    4: [
        {"kode": "CS401", "nama": "Algoritma dan Pemrograman Lanjut", "sks": 3},
        {"kode": "CS402", "nama": "Sistem Operasi", "sks": 3},
        {"kode": "CS403", "nama": "Rekayasa Perangkat Lunak", "sks": 3},
        {"kode": "CS404", "nama": "Pemrograman Web", "sks": 3},
        {"kode": "CS405", "nama": "Teori Bahasa dan Otomata", "sks": 3},
    ],
    5: [
        {"kode": "CS501", "nama": "Kecerdasan Buatan", "sks": 3},
        {"kode": "CS502", "nama": "Keamanan Sistem Informasi", "sks": 3},
        {"kode": "CS503", "nama": "Pemrograman Mobile", "sks": 3},
        {"kode": "CS504", "nama": "Pengolahan Citra Digital", "sks": 3},
        {"kode": "CS505", "nama": "Sistem Terdistribusi", "sks": 3},
    ],
    6: [
        {"kode": "CS601", "nama": "Machine Learning", "sks": 3},
        {"kode": "CS602", "nama": "Data Mining dan Analitika", "sks": 3},
        {"kode": "CS603", "nama": "Cloud Computing", "sks": 3},
        {"kode": "CS604", "nama": "Etika Profesi IT", "sks": 2},
        {"kode": "CS605", "nama": "Kerja Praktik", "sks": 3},
    ],
    7: [
        {"kode": "CS701", "nama": "Skripsi I", "sks": 3},
        {"kode": "CS702", "nama": "Seminar Penelitian", "sks": 2},
        {"kode": "CS703", "nama": "Topik Khusus Informatika", "sks": 3},
    ],
    8: [
        {"kode": "CS801", "nama": "Skripsi II", "sks": 4},
        {"kode": "CS802", "nama": "Ujian Komprehensif", "sks": 2},
    ],
}


@mahasiswa_bp.route('/profile', methods=['GET'])
@mahasiswa_required
def get_profile():
    m = Mahasiswa.query.get(get_jwt_identity())
    if not m:
        return jsonify({'error': 'Mahasiswa tidak ditemukan', 'code': 404}), 404
    return jsonify({'data': m.to_dict(include_dosen=True), 'message': 'OK'}), 200


@mahasiswa_bp.route('/krs', methods=['GET'])
@mahasiswa_required
def get_krs():
    m = Mahasiswa.query.get(get_jwt_identity())
    if not m:
        return jsonify({'error': 'Mahasiswa tidak ditemukan', 'code': 404}), 404

    available = MATA_KULIAH_CATALOG.get(m.semester, [])
    taken = m.mata_kuliah or []
    return jsonify({
        'data': {
            'mata_kuliah_diambil': taken,
            'mata_kuliah_tersedia': available,
            'semester': m.semester,
            'total_sks': sum(mk.get('sks', 0) for mk in taken),
        },
        'message': 'OK',
    }), 200


@mahasiswa_bp.route('/krs', methods=['PUT'])
@mahasiswa_required
def update_krs():
    m = Mahasiswa.query.get(get_jwt_identity())
    if not m:
        return jsonify({'error': 'Mahasiswa tidak ditemukan', 'code': 404}), 404

    body = request.get_json() or {}
    new_mk = body.get('mata_kuliah', [])

    valid_kodes = {mk['kode'] for mk in MATA_KULIAH_CATALOG.get(m.semester, [])}
    for mk in new_mk:
        if mk.get('kode') not in valid_kodes:
            return jsonify({
                'error': f'Mata kuliah {mk.get("kode")} tidak tersedia untuk semester {m.semester}',
                'code': 400,
            }), 400

    m.mata_kuliah = new_mk
    db.session.commit()

    cache_delete_pattern('krs:mahasiswa:*')
    cache_delete('krs:dashboard:stats')

    return jsonify({
        'data': {
            'mata_kuliah': new_mk,
            'total_sks': sum(mk.get('sks', 0) for mk in new_mk),
        },
        'message': 'KRS berhasil diperbarui',
    }), 200


@mahasiswa_bp.route('/katalog', methods=['GET'])
@mahasiswa_required
def get_katalog():
    """Return full catalog (for all semesters) - used by frontend dropdown."""
    return jsonify({'data': MATA_KULIAH_CATALOG, 'message': 'OK'}), 200
