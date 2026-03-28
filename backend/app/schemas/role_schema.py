from pydantic import BaseModel

class RoleResponse(BaseModel):
    role_id: int
    role_name: str

    class Config:
        from_attributes = True