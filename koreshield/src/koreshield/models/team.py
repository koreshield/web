import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, ForeignKey, DateTime, UniqueConstraint, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base


def utcnow_naive() -> datetime:
    """UTC now as naive datetime for existing DB schema compatibility."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

class Team(Base):
    """Team/Tenant model for multi-tenancy."""
    __tablename__ = 'teams'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(255), nullable=False, unique=True, index=True)
    
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=utcnow_naive)
    updated_at = Column(DateTime, default=utcnow_naive, onupdate=utcnow_naive)

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id], backref="owned_teams")
    members = relationship("TeamMember", back_populates="team", cascade="all, delete-orphan")

class TeamMember(Base):
    """Association between User and Team with Role."""
    __tablename__ = 'team_members'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey('teams.id'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    role = Column(String(50), nullable=False, default='member') # owner, admin, member, viewer

    joined_at = Column(DateTime, default=utcnow_naive)

    # Relationships
    team = relationship("Team", back_populates="members")
    user = relationship("User", backref="team_memberships")

    # Constraints
    __table_args__ = (
        UniqueConstraint('team_id', 'user_id', name='uq_team_member'),
    )

class TeamInvite(Base):
    """Pending invitation to join a team."""
    __tablename__ = 'team_invites'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey('teams.id', ondelete='CASCADE'), nullable=False)
    email = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default='member')
    token = Column(String(255), nullable=False, unique=True, default=lambda: str(uuid.uuid4()))
    status = Column(String(50), nullable=False, default='pending')  # pending, accepted, cancelled
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=utcnow_naive)
    expires_at = Column(DateTime, nullable=True)

    # Relationships
    team = relationship("Team", backref="invites")

class SharedDashboard(Base):
    """Shared dashboard configuration for a team."""
    __tablename__ = 'shared_dashboards'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    team_id = Column(UUID(as_uuid=True), ForeignKey('teams.id', ondelete='CASCADE'), nullable=False)
    name = Column(String(255), nullable=False)
    dashboard_type = Column(String(50), nullable=False, default='security')  # security, analytics, compliance
    config = Column(JSON, nullable=False, default={})
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=utcnow_naive)
    updated_at = Column(DateTime, default=utcnow_naive, onupdate=utcnow_naive)

    # Relationships
    team = relationship("Team", backref="dashboards")
