from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from config import Config
from models import db
from routes.auth import auth_bp
from routes.admin import admin_bp
from routes.mahasiswa import mahasiswa_bp
from routes.dosen import dosen_bp


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    JWTManager(app)
    CORS(app,
         origins=app.config['CORS_ORIGINS'],
         supports_credentials=True,
         allow_headers=['Content-Type', 'Authorization'],
         methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'])

    @app.before_request
    def handle_options():
        from flask import request, make_response
        if request.method == 'OPTIONS':
            origin = request.headers.get('Origin', '')
            if origin in app.config['CORS_ORIGINS']:
                res = make_response()
                res.headers['Access-Control-Allow-Origin'] = origin
                res.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS, PATCH'
                res.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
                res.headers['Access-Control-Allow-Credentials'] = 'true'
                res.headers['Access-Control-Max-Age'] = '86400'
                return res

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(mahasiswa_bp, url_prefix='/api/mahasiswa')
    app.register_blueprint(dosen_bp, url_prefix='/api/dosen')

    @app.route('/health')
    def health():
        return jsonify({'status': 'ok', 'message': 'KRS API is running'})

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({'error': 'Endpoint tidak ditemukan', 'code': 404}), 404

    @app.errorhandler(405)
    def method_not_allowed(e):
        return jsonify({'error': 'Method tidak diizinkan', 'code': 405}), 405

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({'error': 'Terjadi kesalahan server', 'code': 500}), 500

    return app


app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
