from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship
from app.config.database import Base

class ClaimStatusHistory(Base):
    __tablename__ = "claim_status_history"

    id = Column(Integer, primary_key=True)
    claim_id = Column(Integer, ForeignKey("claims.claim_id"))

    status = Column(String)

    claim = relationship("Claim", back_populates="status_history")