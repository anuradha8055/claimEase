from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship
from app.config.database import Base

class ClaimWorkflow(Base):
    __tablename__ = "claim_workflow"

    workflow_id = Column(Integer, primary_key=True)
    claim_id = Column(Integer, ForeignKey("claims.claim_id"))

    current_stage = Column(String)
    assigned_to = Column(Integer)

    claim = relationship("Claim", back_populates="workflows")