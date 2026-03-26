from pydantic import BaseModel

class DocumentTypeResponse(BaseModel):
    document_type_id: int
    type_name: str

    class Config:
        from_attributes = True