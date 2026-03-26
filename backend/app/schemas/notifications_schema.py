from pydantic import BaseModel

class NotificationResponse(BaseModel):
    notification_id: int
    message: str
    user_id: int

    class Config:
        from_attributes = True