from sqlalchemy import Column, Integer, String, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from app.config.database import Base
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from uuid import UUID
import uuid

class EmployeeDetails(Base):
    __tablename__ = "employee_details"
    id   = Column("id", Integer, primary_key=True, autoincrement=True)  # Auto-increment ID
    user_id       = Column("user_id", PG_UUID(as_uuid=True), ForeignKey("users.user_id"), unique=True, nullable=False) # Unique for 1:1 mapping

    pan_number    = Column("pannumber", String(20), unique=True, nullable=False)
    bank_account  = Column("bankaccount", String(30), unique=True, nullable=False)
    ifsc_code     = Column("ifsccode", String(20), nullable=False)
    # Added: Pay Level/Grade Pay often dictates room category eligibility (General/Semi-Private/Private)
 
    grade_pay     = Column("gradepay", Numeric(10, 2)) 
    basic_pay     = Column("basicpay", Numeric(10, 2))
    date_of_joining = Column("dateofjoining", String(20)) # Could be Date, but keeping String for simplicity
    office_location = Column("officelocation", String(100)) # Could be used for routing claims to specific offices
    # Relationships
    user   = relationship("User", back_populates="employee")
    claim = relationship("Claim", primaryjoin="EmployeeDetails.user_id == Claim.user_id", 
        foreign_keys="Claim.user_id",back_populates="employee",overlaps="claim,user")