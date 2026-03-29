from sqlalchemy import Column, Integer, ForeignKey, Text, DateTime, func, Enum as SAEnum
from sqlalchemy.orm import relationship
from app.config.database import Base
# Import the Enum from claim_model to keep them in sync
from app.models.claim_model import ClaimStatus 

class ClaimWorkflowLog(Base):
    __tablename__ = "claim_workflow_logs"

    log_id      = Column(Integer, primary_key=True, autoincrement=True)
    claim_id    = Column(Integer, ForeignKey("claims.claim_id"), nullable=False)
    
    # Who performed the action (Scrutiny Officer, DDO, etc.)
    action_by_user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    
    from_status = Column(SAEnum(ClaimStatus, name="claim_status_enum"))
    to_status   = Column(SAEnum(ClaimStatus, name="claim_status_enum"), nullable=False)
    
    # Remarks are critical for Finance/Medical/DDO approvals or rejections
    remarks     = Column(Text, nullable=True) 
    
    created_at  = Column(DateTime, nullable=False, server_default=func.now())

    # Relationships
    claim = relationship("Claim", back_populates="workflow_logs")
    user  = relationship("User")