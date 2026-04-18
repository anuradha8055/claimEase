from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Boolean, DateTime,
    ForeignKey, func, Text
)
from sqlalchemy.orm import relationship
from app.config.database import Base


class Document(Base):
    __tablename__ = "upload_documents"
    document_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.claim_id"), nullable=False)
    documentType = Column(String(50))
    fileSize = Column(BigInteger)
    fileHash = Column(String(256), nullable=False)
    filePath = Column(String(500), nullable=False)
    is_tampered = Column(Boolean, default=False)
    uploadTime = Column(DateTime, server_default=func.now())

    claim = relationship("Claim", back_populates="documents")