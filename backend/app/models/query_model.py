from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.config.database import Base


class Query(Base):
    __tablename__ = "queries"

    query_id        = Column(Integer, primary_key=True, autoincrement=True)
    claim_id        = Column(Integer, ForeignKey("claims.claim_id"), nullable=False)
    raised_by       = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    raised_stage    = Column(String(50), nullable=False)  # which level raised it
    query_message   = Column(Text, nullable=False)
    sent_to_stage   = Column(String(50), nullable=False)  # always 'EMPLOYEE'
    status          = Column(String(50), nullable=False, default="PENDING")
    created_at      = Column(DateTime, nullable=False, server_default=func.now())
    resolved_at     = Column(DateTime)

    # Employee's reply — added
    response_text   = Column(Text)
    responded_at    = Column(DateTime)

    # Relationships
    claim      = relationship("Claim", back_populates="queries")
    raised_by_user = relationship("User", foreign_keys=[raised_by])