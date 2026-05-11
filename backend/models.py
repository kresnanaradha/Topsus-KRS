from flask_sqlalchemy import SQLAlchemy
import uuid
from datetime import datetime

db = SQLAlchemy()


class Admin(db.Model):
    __tablename__ = 'admin'

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    def to_dict(self):
        return {'id': str(self.id), 'email': self.email, 'role': 'admin'}


class Dosen(db.Model):
    __tablename__ = 'dosen'

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nama = db.Column(db.String(255), nullable=False)
    nidn = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    mahasiswa_bimbingan = db.relationship(
        'Mahasiswa',
        backref='pembimbing',
        lazy='dynamic',
        foreign_keys='Mahasiswa.dosen_pa_id'
    )

    def to_dict(self):
        return {
            'id': str(self.id),
            'nama': self.nama,
            'nidn': self.nidn,
            'email': self.email,
            'role': 'dosen',
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class Mahasiswa(db.Model):
    __tablename__ = 'mahasiswa'

    id = db.Column(db.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nama = db.Column(db.String(255), nullable=False)
    nim = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    semester = db.Column(db.Integer, nullable=False)
    jurusan = db.Column(db.String(255), nullable=False)
    dosen_pa_id = db.Column(
        db.UUID(as_uuid=True),
        db.ForeignKey('dosen.id', ondelete='SET NULL'),
        nullable=True
    )
    mata_kuliah = db.Column(db.JSON, default=list, nullable=False, server_default='[]')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, include_dosen=False):
        data = {
            'id': str(self.id),
            'nama': self.nama,
            'nim': self.nim,
            'email': self.email,
            'semester': self.semester,
            'jurusan': self.jurusan,
            'role': 'mahasiswa',
            'dosen_pa_id': str(self.dosen_pa_id) if self.dosen_pa_id else None,
            'mata_kuliah': self.mata_kuliah or [],
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
        if include_dosen and self.pembimbing:
            data['dosen_pa'] = self.pembimbing.to_dict()
        else:
            data['dosen_pa'] = None
        return data
