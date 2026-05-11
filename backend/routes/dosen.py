from flask import jsonify
from flask_jwt_extended import get_jwt_identity
from models import Dosen, Mahasiswa
from utils.auth_helpers import dosen_required
from utils.cache import cache_get, cache_set
from flask import Blueprint

dosen_bp = Blueprint('dosen', __name__)


@dosen_bp.route('/profile', methods=['GET'])
@dosen_required
def get_profile():
    d = Dosen.query.get(get_jwt_identity())
    if not d:
        return jsonify({'error': 'Dosen tidak ditemukan', 'code': 404}), 404
    dd = d.to_dict()
    dd['total_bimbingan'] = d.mahasiswa_bimbingan.count()
    return jsonify({'data': dd, 'message': 'OK'}), 200


@dosen_bp.route('/mahasiswa-bimbingan', methods=['GET'])
@dosen_required
def get_mahasiswa_bimbingan():
    dosen_id = get_jwt_identity()
    key = f'krs:dosen:{dosen_id}:bimbingan'

    cached = cache_get(key)
    if cached is not None:
        return jsonify({'data': cached, 'message': 'OK (cache)'}), 200

    d = Dosen.query.get(dosen_id)
    if not d:
        return jsonify({'error': 'Dosen tidak ditemukan', 'code': 404}), 404

    rows = d.mahasiswa_bimbingan.order_by(Mahasiswa.nama).all()
    data = [m.to_dict() for m in rows]
    cache_set(key, data, ttl=300)

    return jsonify({'data': data, 'message': 'OK'}), 200
