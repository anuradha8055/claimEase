import enum
from sqlalchemy import Column, String, DateTime, ForeignKey, func, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.config.database import Base

class AccountStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"

class Role(Base):
    __tablename__ = "roles"
    role_id = Column(Integer, primary_key=True)
    role_name = Column(String, nullable=False)
    users = relationship("User", back_populates="role")

class User(Base):
    __tablename__ = "users"
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fullName = Column(String(150), nullable=False)
    department = Column(String(100))
    designation = Column(String(100))
    employeeId = Column(String(50), unique=True, nullable=False)
    contactNo = Column(String(15))
    emailAddress = Column(String(100), unique=True, nullable=False, index=True)
    password = Column(String(255), nullable=False)
    role_id = Column(Integer, ForeignKey("roles.role_id"))
    
    accountStatus = Column(SAEnum(AccountStatus), default=AccountStatus.ACTIVE)
    refreshToken = Column(String, nullable=True)
    refreshTokenExpiresAt = Column(DateTime, nullable=True)
    lastLogin = Column(DateTime)
    createdAt = Column(DateTime, server_default=func.now())
    
    role = relationship("Role", back_populates="users")
    employee_details = relationship("EmployeeDetails", back_populates="user", uselist=False)