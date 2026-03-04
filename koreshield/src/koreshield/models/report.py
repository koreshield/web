import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Boolean, JSON, Enum, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from .base import Base


def utcnow_naive() -> datetime:
    """UTC now as naive datetime for existing DB schema compatibility."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

class ReportSchedule(str, Enum):
    MANUAL = "manual"
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"

class ReportFormat(str, Enum):
    PDF = "pdf"
    CSV = "csv"
    JSON = "json"

class ReportStatus(str, Enum):
    READY = "ready"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"

class ReportTemplate(Base):
    """Template for generating reports."""
    __tablename__ = 'report_templates'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    description = Column(String(500))
    category = Column(String(50)) # Security, Financial, etc.
    available_metrics = Column(JSON, default=[]) # List of metric names
    
    created_at = Column(DateTime, default=utcnow_naive)

class Report(Base):
    """Generated or scheduled report."""
    __tablename__ = 'reports'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(500))
    template_id = Column(UUID(as_uuid=True), ForeignKey('report_templates.id'), nullable=False)
    
    schedule = Column(String(50), default=ReportSchedule.MANUAL)
    format = Column(String(50), default=ReportFormat.PDF)
    status = Column(String(50), default=ReportStatus.READY)
    
    filters = Column(JSON, default={}) # ReportFilters
    file_url = Column(String(500))
    
    created_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    created_at = Column(DateTime, default=utcnow_naive)
    last_run_at = Column(DateTime)
    
    # Relationships
    template = relationship("ReportTemplate")
    user = relationship("User")
