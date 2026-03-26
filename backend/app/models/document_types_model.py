from sqlalchemy import Column, Integer, String
from app.config.database import Base


class DocumentType(Base):
    __tablename__ = "document_types"

    document_type_id = Column(Integer, primary_key=True, autoincrement=True)
    type_name        = Column(String(100), nullable=False, unique=True)
    description      = Column(String(255))
