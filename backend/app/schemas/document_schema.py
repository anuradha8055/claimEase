from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class DocumentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    document_id:      int
    claim_id:         int
    document_type_id: int
    file_name:        str
    file_type:        str
    file_size:        int
    file_hash:        str
    file_path:        str
    uploaded_by:      int
    upload_time:      datetime
    verified_by:      Optional[int]
    verified_at:      Optional[datetime]
    is_tampered:      bool


class DocumentVerifyResponse(BaseModel):
    document_id:  int
    hash_matched: bool
    is_tampered:  bool
    message:      str
