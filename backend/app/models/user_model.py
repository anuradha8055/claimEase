import enum
from sqlalchemy import Column, Integer, String, Enum as SAEnum, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from app.config.database import Base

class AccountStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"

class User(Base):
    __tablename__ = "users"

    user_id        = Column(Integer, primary_key=True, autoincrement=True)
    email          = Column(String(100), unique=True, nullable=False, index=True)
    password_hash  = Column(String(255), nullable=False)
    
    # Identification for the 5 roles
    full_name      = Column(String(150), nullable=False) # Added: Needed for UI "Assigned to: Name"
    role_id        = Column(Integer, ForeignKey("roles.role_id"), nullable=False)
    phone          = Column(String(15))
    
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