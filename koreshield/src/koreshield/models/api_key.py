"""
API Key database models for authentication.
"""
import uuid
import secrets
import hashlib
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from .base import Base
from ..utils import utcnow_naive


class APIKey(Base):
    __tablename__ = 'api_keys'
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    key_hash = Column(String(255), nullable=False, unique=True, index=True)
    key_prefix = Column(String(20), nullable=False, index=True)  # For display (e.g., "ks_live_abc123...")
    name = Column(String(255), nullable=False)  # User-friendly name
    description = Column(String(500))
    last_used_at = Column(DateTime)
    expires_at = Column(DateTime)
    is_revoked = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=utcnow_naive)
    updated_at = Column(DateTime, nullable=False, default=utcnow_naive, onupdate=utcnow_naive)
    
    @staticmethod
    def generate_key() -> tuple[str, str, str]:
        """
        Generate a new API key.
        
        Returns:
            tuple: (full_key, key_hash, key_prefix)
                - full_key: The complete API key to show user (only once)
                - key_hash: SHA256 hash to store in database
                - key_prefix: First 12 chars for display (e.g., "ks_live_abc1")
        """
        # Generate random secure token
        random_part = secrets.token_urlsafe(32)  # 43 chars base64url
        
        # Create full key with prefix
        full_key = f"ks_live_{random_part}"
        
        # Hash for storage
        key_hash = hashlib.sha256(full_key.encode()).hexdigest()
        
        # Prefix for display
        key_prefix = full_key[:16]  # "ks_live_" + first 8 chars
        
        return full_key, key_hash, key_prefix
    
    @staticmethod
    def hash_key(key: str) -> str:
        """Hash an API key for comparison."""
        return hashlib.sha256(key.encode()).hexdigest()
    
    def to_dict(self, include_full_key: bool = False) -> dict:
        """
        Convert API key to dictionary.
        
        Args:
            include_full_key: If True, includes the full key (only for newly created keys)
        """
        data = {
            'id': str(self.id),
            'user_id': str(self.user_id),
            'name': self.name,
            'description': self.description,
            'key_prefix': self.key_prefix,  # Show prefix like "ks_live_abc1..."
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_revoked': self.is_revoked,
            'created_at': self.created_at.isoformat() if self.created_at else None,
        }
        return data
    
    def is_valid(self) -> bool:
        """Check if API key is valid (not revoked and not expired)."""
        if self.is_revoked:
            return False
        if self.expires_at and self.expires_at < utcnow_naive():
            return False
        return True
    
    def mark_used(self):
        """Update last_used_at timestamp."""
        self.last_used_at = utcnow_naive()
