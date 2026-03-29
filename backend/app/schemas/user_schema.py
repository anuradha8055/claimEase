from pydantic import BaseModel, EmailStr, ConfigDict
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role_id: int
    phone: Optional[str] = None

class UserCreate(UserBase):
    password: str # Plain text from frontend, hashed in service

class UserRead(UserBase):
    user_id: int
    created_at: datetime
    last_login: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)