from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    ForeignKey, func, Text
)
from sqlalchemy.orm import relationship
from app.config.database import Base


class Document(Base):
    __tablename__ = "documents"

    document_id      = Column(Integer, primary_key=True, autoincrement=True)
    claim_id         = Column(Integer, ForeignKey("claims.claim_id"), nullable=False)
    document_type_id = Column(Integer, ForeignKey("document_types.document_type_id"), nullable=False)

    file_name   = Column(String(255), nullable=False)  # original filename for display only
    file_type   = Column(String(20),  nullable=False)  # 'pdf', 'jpg', 'png'
    file_size   = Column(Integer,     nullable=False)  # bytes

    # Security fields
    file_hash   = Column(String(256), nullable=False)
    # file_data BYTEA removed — files live in MinIO, not the DB
    file_path   = Column(String(500), nullable=False)  # MinIO object key

    # Verification fields — set by scrutiny officer
    uploaded_by  = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    upload_time  = Column(DateTime, nullable=False, server_default=func.now())
    verified_by  = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    verified_at  = Column(DateTime, nullable=True)
    is_tampered  = Column(Boolean, nullable=False, default=False)

    # Relationships
    claim         = relationship("Claim", back_populates="documents")
    uploader      = relationship("User", foreign_keys=[uploaded_by])
    verifier      = relationship("User", foreign_keys=[verified_by])