import enum
from sqlalchemy import Column, Integer, String, Enum as SAEnum, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.config.database import Base

class AccountStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"

class userRole(str, enum.Enum):
    EMPLOYEE = "EMPLOYEE"
    SCRUTINY_OFFICER = "SCRUTINY_OFFICER"
    MEDICAL_OFFICER = "MEDICAL_OFFICER"
    FINANCE_OFFICER = "FINANCE_OFFICER"
    DDO="DDO"
  

class User(Base):
    __tablename__ = "users"

    user_id        = Column(Integer, primary_key=True, autoincrement=True)
    name           = Column(String(150), nullable=False) # Added: Needed for UI "Assigned to: Name"
    department     = Column(String(100))
    profession     = Column(String(100))
    employeeId    = Column(String(50), unique=True)  # Only for Employees, null for others
    contact        = Column(String(15))
    email          = Column(String(100), unique=True, nullable=False, index=True)
    role_id        = Column(Integer, ForeignKey("roles.role_id"), nullable=False)
    password_hash  = Column(String(255), nullable=False)


    account_status = Column(
        SAEnum(AccountStatus, name="account_status_enum"),
        nullable=False,
        default=AccountStatus.ACTIVE
    )
    
    created_at     = Column(DateTime, nullable=False, server_default=func.now())
    last_login     = Column(DateTime)
    
    # JWT Refresh Logic
    refresh_token             = Column(String, nullable=True)
    refresh_token_expires_at  = Column(DateTime, nullable=True)

    # Relationships
    role     = relationship("Role", back_populates="users")
    # One-to-one: Only users with the 'Employee' role will have this profile populated
    employee = relationship("Employee", back_populates="user", uselist=False)