import uuid
from typing import Any, Dict

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, JSON, String, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .base import Base
from ..utils import utcnow_naive


class RagScan(Base):
    """Persistent RAG scan history for server-side audit and downloads."""

    __tablename__ = "rag_scans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    scan_id = Column(String(255), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=utcnow_naive, index=True, nullable=False)

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, index=True)
    api_key_id = Column(UUID(as_uuid=True), ForeignKey("api_keys.id"), nullable=True, index=True)

    user_query = Column(String, nullable=True)
    documents = Column(JSON, nullable=False, default=list)
    response = Column(JSON, nullable=False, default=dict)

    is_safe = Column(Boolean, default=True)
    total_threats_found = Column(Integer, default=0)
    processing_time_ms = Column(Float, default=0.0)

    user = relationship("User")
    api_key = relationship("APIKey")

    def _document_count(self) -> int:
        try:
            return len(self.documents or [])
        except Exception:
            return 0

    def to_summary_dict(self) -> Dict[str, Any]:
        return {
            "scan_id": self.scan_id,
            "timestamp": self.created_at.isoformat(),
            "user_query": self.user_query,
            "is_safe": self.is_safe,
            "total_threats_found": self.total_threats_found,
            "documents_scanned": self._document_count(),
        }

    def to_detail_dict(self) -> Dict[str, Any]:
        return {
            "scan_id": self.scan_id,
            "timestamp": self.created_at.isoformat(),
            "user_query": self.user_query,
            "documents": self.documents or [],
            "response": self.response or {},
            "is_safe": self.is_safe,
            "total_threats_found": self.total_threats_found,
            "documents_scanned": self._document_count(),
            "processing_time_ms": self.processing_time_ms,
        }
