"""
User database models for authentication.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, JSON
from sqlalchemy.dialects.postgresql import UUID
from .base import Base

class User(Base):
    __tablename__ = 'users'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), nullable=False, unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    name = Column(String(255))
    role = Column(String(50), nullable=False, default='user')
    status = Column(String(50), nullable=False, default='active')
    email_verified = Column(Boolean, nullable=False, default=False)
    email_verification_token = Column(String(255), index=True)
    email_verification_expires_at = Column(DateTime)
    reset_password_token = Column(String(255), index=True)
    reset_password_expires_at = Column(DateTime)
    last_login_at = Column(DateTime)
    created_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    updated_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_metadata = Column(JSON, default={})

    # Relationships
    # Note: `owned_teams` and `team_memberships` are defined in Team and TeamMember using backref/back_populates
    
    def to_dict(self):
        """Convert user to dictionary (excluding password)."""
        return {
            'id': str(self.id),
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'status': self.status,
            'email_verified': self.email_verified,
            'last_login_at': self.last_login_at.isoformat() if self.last_login_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
