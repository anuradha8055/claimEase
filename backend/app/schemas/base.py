from pydantic import BaseModel, ConfigDict
from uuid import UUID
from datetime import datetime, date
from typing import Optional, List

class BaseSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True) # Allows SQLAlchemy -> Pydantic conversion