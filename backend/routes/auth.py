from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token,
    create_refresh_token,
    jwt_required,
    get_jwt_identity,
    get_jwt,
)
from werkzeug.security import check_password_hash
from models import Admin, Dosen, Mahasiswa

auth_bp = Blueprint('auth', __name__)


def _find_user(role, email):
    if role == 'admin':
        return Admin.query.filter_by(email=email).first()
    if role == 'dosen':
        return Dosen.query.filter_by(email=email).first()
    if role == 'mahasiswa':
        return Mahasiswa.query.filter_by(email=email).first()
    return None


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    role = data.get('role', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not role or not email or not password:
        return jsonify({'error': 'Role, email, dan password wajib diisi', 'code': 400}), 400

    if role not in ('admin', 'dosen', 'mahasiswa'):
        return jsonify({'error': 'Role tidak valid', 'code': 400}), 400

    user = _find_user(role, email)
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({'error': 'Email atau password salah', 'code': 401}), 401

    claims = {'role': role}
    access_token = create_access_token(identity=str(user.id), additional_claims=claims)
    refresh_token = create_refresh_token(identity=str(user.id), additional_claims=claims)

    user_data = user.to_dict()
    if role == 'mahasiswa':
        user_data = user.to_dict(include_dosen=True)

    return jsonify({
        'data': {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': user_data,
        },
        'message': 'Login berhasil',
    }), 200


@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    identity = get_jwt_identity()
    claims = get_jwt()
    new_token = create_access_token(
        identity=identity,
        additional_claims={'role': claims.get('role')}
    )
    return jsonify({'data': {'access_token': new_token}, 'message': 'Token diperbarui'}), 200


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    identity = get_jwt_identity()
    role = get_jwt().get('role')

    user = _find_user(role, None)
    if role == 'admin':
        user = Admin.query.get(identity)
    elif role == 'dosen':
        user = Dosen.query.get(identity)
    elif role == 'mahasiswa':
        user = Mahasiswa.query.get(identity)

    if not user:
        return jsonify({'error': 'User tidak ditemukan', 'code': 404}), 404

    user_data = user.to_dict(include_dosen=True) if role == 'mahasiswa' else user.to_dict()
    return jsonify({'data': user_data, 'message': 'OK'}), 200
