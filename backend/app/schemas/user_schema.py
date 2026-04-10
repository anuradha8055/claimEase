from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    name: str
    role_id: int
    contact: Optional[str] = None

class UserCreate(UserBase):
    password: str # Plain text from frontend, hashed in service

class UserRead(UserBase):
    user_id: int
    created_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class UserRegister(BaseModel):
    """Schema for user registration"""
    name: str
    department: str
    profession: str
    employeeId: Optional[str] = None
    contact: str
    email: EmailStr
    role: str
    password: str
    
    

class UserLogin(BaseModel):
    """Schema for user login"""
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    """Schema for user response"""
    user_id: int
    email: EmailStr
    name: str
    department: str
    profession: str
    employeeId: Optional[str] = None
    contact: Optional[str] = None
    role_id: int
    
    created_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)

class TokenResponse(BaseModel):
    """Schema for token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"