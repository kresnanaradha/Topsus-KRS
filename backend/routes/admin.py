import uuid
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash
from sqlalchemy import func
from models import db, Dosen, Mahasiswa
from utils.auth_helpers import admin_required
from utils.cache import cache_get, cache_set, cache_delete, cache_delete_pattern

admin_bp = Blueprint('admin', __name__)

# ── Helpers ──────────────────────────────────────────────────────────────────

def _paginate_or_all(query):
    return query.order_by(query.column_descriptions[0]['entity'].created_at.desc()).all()


# ── Mahasiswa ─────────────────────────────────────────────────────────────────

@admin_bp.route('/mahasiswa', methods=['GET'])
@admin_required
def list_mahasiswa():
    key = 'krs:mahasiswa:all'
    cached = cache_get(key)
    if cached is not None:
        return jsonify({'data': cached, 'message': 'OK (cache)'}), 200

    rows = Mahasiswa.query.order_by(Mahasiswa.created_at.desc()).all()
    data = [m.to_dict(include_dosen=True) for m in rows]
    cache_set(key, data, ttl=300)
    return jsonify({'data': data, 'message': 'OK'}), 200


@admin_bp.route('/mahasiswa', methods=['POST'])
@admin_required
def create_mahasiswa():
    body = request.get_json() or {}
    for f in ('nama', 'nim', 'email', 'password', 'semester', 'jurusan'):
        if not body.get(f):
            return jsonify({'error': f'Field {f} wajib diisi', 'code': 400}), 400

    if Mahasiswa.query.filter_by(nim=body['nim']).first():
        return jsonify({'error': 'NIM sudah terdaftar', 'code': 409}), 409
    if Mahasiswa.query.filter_by(email=body['email'].lower()).first():
        return jsonify({'error': 'Email sudah terdaftar', 'code': 409}), 409

    dosen_pa_id = body.get('dosen_pa_id') or None
    if dosen_pa_id and not Dosen.query.get(dosen_pa_id):
        return jsonify({'error': 'Dosen PA tidak ditemukan', 'code': 404}), 404

    m = Mahasiswa(
        id=uuid.uuid4(),
        nama=body['nama'].strip(),
        nim=body['nim'].strip(),
        email=body['email'].strip().lower(),
        password_hash=generate_password_hash(body['password']),
        semester=int(body['semester']),
        jurusan=body['jurusan'].strip(),
        dosen_pa_id=dosen_pa_id,
        mata_kuliah=[],
    )
    db.session.add(m)
    db.session.commit()

    cache_delete_pattern('krs:mahasiswa:*')
    cache_delete('krs:dashboard:stats')
    return jsonify({'data': m.to_dict(include_dosen=True), 'message': 'Mahasiswa berhasil ditambahkan'}), 201


@admin_bp.route('/mahasiswa/<mahasiswa_id>', methods=['GET'])
@admin_required
def get_mahasiswa(mahasiswa_id):
    m = Mahasiswa.query.get(mahasiswa_id)
    if not m:
        return jsonify({'error': 'Mahasiswa tidak ditemukan', 'code': 404}), 404
    return jsonify({'data': m.to_dict(include_dosen=True), 'message': 'OK'}), 200


@admin_bp.route('/mahasiswa/<mahasiswa_id>', methods=['PUT'])
@admin_required
def update_mahasiswa(mahasiswa_id):
    m = Mahasiswa.query.get(mahasiswa_id)
    if not m:
        return jsonify({'error': 'Mahasiswa tidak ditemukan', 'code': 404}), 404

    body = request.get_json() or {}

    if 'nama' in body:
        m.nama = body['nama'].strip()
    if 'nim' in body:
        dup = Mahasiswa.query.filter_by(nim=body['nim']).first()
        if dup and str(dup.id) != mahasiswa_id:
            return jsonify({'error': 'NIM sudah digunakan', 'code': 409}), 409
        m.nim = body['nim'].strip()
    if 'email' in body:
        dup = Mahasiswa.query.filter_by(email=body['email'].lower()).first()
        if dup and str(dup.id) != mahasiswa_id:
            return jsonify({'error': 'Email sudah digunakan', 'code': 409}), 409
        m.email = body['email'].strip().lower()
    if body.get('password'):
        m.password_hash = generate_password_hash(body['password'])
    if 'semester' in body:
        m.semester = int(body['semester'])
    if 'jurusan' in body:
        m.jurusan = body['jurusan'].strip()
    if 'dosen_pa_id' in body:
        dpa = body['dosen_pa_id'] or None
        if dpa and not Dosen.query.get(dpa):
            return jsonify({'error': 'Dosen PA tidak ditemukan', 'code': 404}), 404
        m.dosen_pa_id = dpa

    db.session.commit()
    cache_delete_pattern('krs:mahasiswa:*')
    cache_delete('krs:dashboard:stats')
    return jsonify({'data': m.to_dict(include_dosen=True), 'message': 'Data mahasiswa diperbarui'}), 200


@admin_bp.route('/mahasiswa/<mahasiswa_id>', methods=['DELETE'])
@admin_required
def delete_mahasiswa(mahasiswa_id):
    m = Mahasiswa.query.get(mahasiswa_id)
    if not m:
        return jsonify({'error': 'Mahasiswa tidak ditemukan', 'code': 404}), 404

    db.session.delete(m)
    db.session.commit()
    cache_delete_pattern('krs:mahasiswa:*')
    cache_delete('krs:dashboard:stats')
    return jsonify({'message': 'Mahasiswa berhasil dihapus'}), 200


@admin_bp.route('/mahasiswa/<mahasiswa_id>/dosen-pa', methods=['PUT'])
@admin_required
def assign_dosen_pa(mahasiswa_id):
    m = Mahasiswa.query.get(mahasiswa_id)
    if not m:
        return jsonify({'error': 'Mahasiswa tidak ditemukan', 'code': 404}), 404

    body = request.get_json() or {}
    dosen_id = body.get('dosen_id') or None

    if dosen_id:
        if not Dosen.query.get(dosen_id):
            return jsonify({'error': 'Dosen tidak ditemukan', 'code': 404}), 404
        m.dosen_pa_id = dosen_id
    else:
        m.dosen_pa_id = None

    db.session.commit()
    cache_delete_pattern('krs:mahasiswa:*')
    cache_delete_pattern('krs:dosen:*')
    return jsonify({'data': m.to_dict(include_dosen=True), 'message': 'Dosen PA diperbarui'}), 200


# ── Dosen ─────────────────────────────────────────────────────────────────────

@admin_bp.route('/dosen', methods=['GET'])
@admin_required
def list_dosen():
    key = 'krs:dosen:all'
    cached = cache_get(key)
    if cached is not None:
        return jsonify({'data': cached, 'message': 'OK (cache)'}), 200

    rows = Dosen.query.order_by(Dosen.created_at.desc()).all()
    data = []
    for d in rows:
        dd = d.to_dict()
        dd['total_bimbingan'] = d.mahasiswa_bimbingan.count()
        data.append(dd)

    cache_set(key, data, ttl=300)
    return jsonify({'data': data, 'message': 'OK'}), 200


@admin_bp.route('/dosen', methods=['POST'])
@admin_required
def create_dosen():
    body = request.get_json() or {}
    for f in ('nama', 'nidn', 'email', 'password'):
        if not body.get(f):
            return jsonify({'error': f'Field {f} wajib diisi', 'code': 400}), 400

    if Dosen.query.filter_by(nidn=body['nidn']).first():
        return jsonify({'error': 'NIDN sudah terdaftar', 'code': 409}), 409
    if Dosen.query.filter_by(email=body['email'].lower()).first():
        return jsonify({'error': 'Email sudah terdaftar', 'code': 409}), 409

    d = Dosen(
        id=uuid.uuid4(),
        nama=body['nama'].strip(),
        nidn=body['nidn'].strip(),
        email=body['email'].strip().lower(),
        password_hash=generate_password_hash(body['password']),
    )
    db.session.add(d)
    db.session.commit()

    cache_delete_pattern('krs:dosen:*')
    cache_delete('krs:dashboard:stats')
    return jsonify({'data': d.to_dict(), 'message': 'Dosen berhasil ditambahkan'}), 201


@admin_bp.route('/dosen/<dosen_id>', methods=['GET'])
@admin_required
def get_dosen(dosen_id):
    d = Dosen.query.get(dosen_id)
    if not d:
        return jsonify({'error': 'Dosen tidak ditemukan', 'code': 404}), 404
    dd = d.to_dict()
    dd['total_bimbingan'] = d.mahasiswa_bimbingan.count()
    return jsonify({'data': dd, 'message': 'OK'}), 200


@admin_bp.route('/dosen/<dosen_id>', methods=['PUT'])
@admin_required
def update_dosen(dosen_id):
    d = Dosen.query.get(dosen_id)
    if not d:
        return jsonify({'error': 'Dosen tidak ditemukan', 'code': 404}), 404

    body = request.get_json() or {}

    if 'nama' in body:
        d.nama = body['nama'].strip()
    if 'nidn' in body:
        dup = Dosen.query.filter_by(nidn=body['nidn']).first()
        if dup and str(dup.id) != dosen_id:
            return jsonify({'error': 'NIDN sudah digunakan', 'code': 409}), 409
        d.nidn = body['nidn'].strip()
    if 'email' in body:
        dup = Dosen.query.filter_by(email=body['email'].lower()).first()
        if dup and str(dup.id) != dosen_id:
            return jsonify({'error': 'Email sudah digunakan', 'code': 409}), 409
        d.email = body['email'].strip().lower()
    if body.get('password'):
        d.password_hash = generate_password_hash(body['password'])

    db.session.commit()
    cache_delete_pattern('krs:dosen:*')
    return jsonify({'data': d.to_dict(), 'message': 'Data dosen diperbarui'}), 200


@admin_bp.route('/dosen/<dosen_id>', methods=['DELETE'])
@admin_required
def delete_dosen(dosen_id):
    d = Dosen.query.get(dosen_id)
    if not d:
        return jsonify({'error': 'Dosen tidak ditemukan', 'code': 404}), 404

    Mahasiswa.query.filter_by(dosen_pa_id=dosen_id).update({'dosen_pa_id': None})
    db.session.delete(d)
    db.session.commit()

    cache_delete_pattern('krs:dosen:*')
    cache_delete_pattern('krs:mahasiswa:*')
    cache_delete('krs:dashboard:stats')
    return jsonify({'message': 'Dosen berhasil dihapus'}), 200


# ── Dashboard ─────────────────────────────────────────────────────────────────

@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def dashboard():
    key = 'krs:dashboard:stats'
    cached = cache_get(key)
    if cached is not None:
        return jsonify({'data': cached, 'message': 'OK (cache)'}), 200

    total_mahasiswa = Mahasiswa.query.count()
    total_dosen = Dosen.query.count()
    no_dosen_pa = Mahasiswa.query.filter_by(dosen_pa_id=None).count()

    jurusan_dist = (
        db.session.query(Mahasiswa.jurusan, func.count(Mahasiswa.id).label('count'))
        .group_by(Mahasiswa.jurusan)
        .all()
    )

    all_mhs = Mahasiswa.query.all()
    total_sks = sum(
        sum(mk.get('sks', 0) for mk in (m.mata_kuliah or []))
        for m in all_mhs
    )
    avg_sks = round(total_sks / total_mahasiswa, 2) if total_mahasiswa else 0

    data = {
        'total_mahasiswa': total_mahasiswa,
        'total_dosen': total_dosen,
        'no_dosen_pa': no_dosen_pa,
        'avg_sks': avg_sks,
        'jurusan_distribution': [
            {'jurusan': row.jurusan, 'count': row.count} for row in jurusan_dist
        ],
    }

    cache_set(key, data, ttl=600)
    return jsonify({'data': data, 'message': 'OK'}), 200
