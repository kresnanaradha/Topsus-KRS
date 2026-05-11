from functools import wraps
from flask import jsonify
from flask_jwt_extended import verify_jwt_in_request, get_jwt


def role_required(role):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            verify_jwt_in_request()
            claims = get_jwt()
            if claims.get('role') != role:
                return jsonify({
                    'error': f'Akses ditolak. Hanya {role} yang dapat mengakses endpoint ini.',
                    'code': 403
                }), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def admin_required(fn):
    return role_required('admin')(fn)


def mahasiswa_required(fn):
    return role_required('mahasiswa')(fn)


def dosen_required(fn):
    return role_required('dosen')(fn)
