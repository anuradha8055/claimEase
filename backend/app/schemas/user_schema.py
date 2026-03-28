from pydantic import BaseModel, EmailStr, ConfigDict, Field


class UserRegister(BaseModel):
    email:    EmailStr
    password: str       = Field(min_length=6)
    role_id:  int
    phone:    str | None = None


class UserLogin(BaseModel):
    email:    EmailStr
    password: str


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id:        int
    email:          str
    role_id:        int
    phone:          str | None
    account_status: str


class TokenResponse(BaseModel):
    access_token:  str
    refresh_token: str
    token_type:    str = "bearer"
