from pydantic import BaseModel, EmailStr, ConfigDict, field_serializer
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    emailAddress: EmailStr
    fullName: str
    role_id: int
    contactNo: Optional[str] = None

class UserCreate(UserBase):
    password: str # Plain text from frontend, hashed in service

class UserRead(UserBase):
    user_id: UUID
    createdAt: datetime
    lastLogin: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class UserRegister(BaseModel):
    """Schema for user registration"""
    fullName: str
    department: str
    profession: str
    employeeId: Optional[str] = None
    contact: str
    emailAddress: EmailStr
    role: str
    password: str

class UserLogin(BaseModel):
    """Schema for user login"""
    emailAddress: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: UUID
    fullName: str
    emailAddress: str
    department: Optional[str] = None
    designation: Optional[str] = None
    employeeId: str
    contactNo: Optional[str] = None
    accountStatus: str
    role_id: Optional[int] = None
    createdAt: datetime
    lastLogin: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
    
    @field_serializer('accountStatus')
    def serialize_account_status(self, value, _info):
        """Convert enum to string value"""
        if hasattr(value, 'value'):
            return value.value
        return str(value)

class TokenResponse(BaseModel):
    """Schema for token response"""
    accessToken: str
    refreshToken: str
    token_type: str = "bearer"