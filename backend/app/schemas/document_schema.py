from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from uuid import UUID

class DocumentResponse(BaseModel):
    document_id: UUID
    claim_id: UUID
    documentType: str
    fileSize: int
    fileHash: str
    filePath: str
    is_tampered: bool
    uploadTime: datetime
    
    model_config = ConfigDict(from_attributes=True)


class DocumentVerifyResponse(BaseModel):
    document_id:  int
    hash_matched: bool
    is_tampered:  bool
    message:      str
