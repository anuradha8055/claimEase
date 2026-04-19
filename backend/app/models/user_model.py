import enum
from pydantic import UUID4
from sqlalchemy import Column, String, DateTime, ForeignKey,Integer, func, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.config.database import Base

class AccountStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    SUSPENDED = "SUSPENDED"


class User(Base):
    __tablename__ = "users"
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fullName = Column("fullname",String(150), nullable=False)
    department = Column(String(100))
    designation = Column("designation",String(100))
    employeeId = Column("employeeid",String(50), unique=True, nullable=False)
    contactNo = Column("contactno",String(15))
    emailAddress = Column("emailaddress",String(100), unique=True, nullable=False, index=True)
    password = Column("password",String(255), nullable=False)
    role_id = Column("role_id",Integer, ForeignKey("roles.role_id"))
    
    accountStatus = Column("accountstatus",SAEnum(AccountStatus), default=AccountStatus.ACTIVE)
    refreshToken = Column("refreshtoken",String, nullable=True)
    refreshTokenExpiresAt = Column("refreshtokenexpiresat",DateTime, nullable=True)
    lastLogin = Column("lastlogin",DateTime)
    createdAt = Column("createdat",DateTime, server_default=func.now())
    
    role = relationship("Role", back_populates="user")
    employee = relationship("EmployeeDetails", back_populates="user", uselist=False)
    claim = relationship("Claim", back_populates="user")
    notifications = relationship("Notification", back_populates="user")