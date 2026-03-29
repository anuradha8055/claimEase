from pydantic import BaseModel, ConfigDict
from typing import Optional

class HospitalResponse(BaseModel):
    hospital_id: int
    hospital_name: str
    hospital_type: str
    city: str
    state: str
    is_empanelled: bool
    empanelment_tier: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)