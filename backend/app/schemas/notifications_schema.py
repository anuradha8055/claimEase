from pydantic import BaseModel, ConfigDict
from datetime import datetime
from uuid import UUID

class NotificationResponse(BaseModel):
    notification_id: UUID
    user_id: UUID
    message: str
    notificationStatus: str  # e.g., 'Unread', 'Read'
    created_at: datetime
    
    model_config = ConfigDict(from_attributes=True)