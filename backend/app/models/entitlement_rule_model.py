from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Numeric, Date, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from app.config.database import Base


class EntitlementRule(Base):
    __tablename__ = "entitlement_rules"

    rule_id        = Column(Integer, primary_key=True, autoincrement=True)
    rule_name      = Column(String(150), nullable=False)
    category       = Column(String(50),  nullable=False, index=True)
    # JSONB: flexible conditions without schema changes
    # e.g. {"ward_type": "GENERAL"} or {"surgery_type": "MAJOR", "grade_pay_min": 5400}
    conditions     = Column(JSONB, nullable=False, default={})
    max_amount     = Column(Numeric(12, 2), nullable=False)
    formula        = Column(String(255))   # interpreted by rules_engine.py
    effective_from = Column(Date, nullable=False)
    effective_to   = Column(Date)          # NULL = currently active
    created_at     = Column(DateTime, nullable=False, server_default=func.now())
    updated_at     = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())