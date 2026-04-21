from datetime import datetime
from sqlalchemy import (
    Column, BigInteger, String, Boolean, DateTime,
    ForeignKey, func, Text
)
from sqlalchemy.orm import relationship
from app.config.database import Base
from uuid import UUID
import uuid
from sqlalchemy.dialects.postgresql import UUID

class Document(Base):
    __tablename__ = "upload_documents"
    document_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.claim_id"), nullable=False)
    documentType = Column("documenttype", String(50))
    fileName = Column("filename", String(255), nullable=False)
    fileSize = Column("filesize", BigInteger)
    fileHash = Column("filehash", String(256), nullable=False)
    filePath = Column("filepath", String(500), nullable=False)
    uploadTime = Column("uploadtime", DateTime, server_default=func.now())
    is_tampered = Column("is_tampered", Boolean, default=False)
    

    claim = relationship("Claim", back_populates="document")