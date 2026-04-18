from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Integer, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.config.database import Base

class Query(Base):
    __tablename__ = "queries"

    query_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    claim_id = Column(UUID(as_uuid=True), ForeignKey("claims.claim_id"), nullable=False)
    raised_by = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    
    # Workflow Context
    raised_stage = Column(Integer)  # Stage index (1-5)
    sent_to_stage = Column(Integer, default=1) # Usually sent back to Stage 1 (Employee)
    
    # Content
    query_text = Column(Text, nullable=False)
    response_text = Column(Text)
    status = Column(String(50), default="Open") # Open, Responded, Resolved
    
    # Separate Timestamps
    created_at = Column(DateTime, server_default=func.now())
    responded_at = Column(DateTime)
    resolved_at = Column(DateTime)

    # Relationships
    claim = relationship("Claim", back_populates="queries")