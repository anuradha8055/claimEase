from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app.config.database import get_db
from app.core.dependencies import get_current_employee, get_current_user
from app.models.user_model import User
from app.models.document_model import Document
from app.schemas.document_schema import DocumentResponse, DocumentVerifyResponse
from app.services.hashing_service import hash_file, save_file_locally, read_file

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    claim_id:         UUID       = Form(...),
    documentType:     str       = Form(...),
    file:             UploadFile = File(...),
    db:               Session    = Depends(get_db),
    current_user:     User       = Depends(get_current_employee),
):
    """
    Upload a document for a claim.
    Computes SHA-256 hash server-side. Stores file path (not raw bytes).
    This hash is the tamper-evidence fingerprint.
    """
    # Validate file type
    allowed_types = {"pdf", "jpg", "jpeg", "png"}
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext not in allowed_types:
        raise HTTPException(status_code=400, detail=f"File type '.{ext}' not allowed. Use: pdf, jpg, png")

    file_bytes = await file.read()

    if len(file_bytes) > 10 * 1024 * 1024:  # 10 MB limit
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 10MB")

    # Core security step: compute hash BEFORE saving
    file_hash = hash_file(file_bytes)
    file_path = save_file_locally(file_bytes, str(claim_id), file.filename)

    doc = Document(
        claim_id         = claim_id,
        documentType     = documentType,
        fileSize        = len(file_bytes),
        fileHash        = file_hash,
        filePath        = file_path,
        is_tampered      = False,
        uploadedTime     = None
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return doc


@router.get("/claim/{claim_id}", response_model=list[DocumentResponse])
def get_claim_documents(
    claim_id:     UUID,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """Get all documents for a claim."""
    return db.query(Document).filter(Document.claim_id == claim_id).all()


@router.post("/{document_id}/verify", response_model=DocumentVerifyResponse)
def verify_document(
    document_id:  UUID,
    db:           Session = Depends(get_db),
    current_user: User    = Depends(get_current_user),
):
    """
    Scrutiny officer physically checks original docs and clicks verify.
    System re-computes SHA-256 from stored file and compares with DB hash.
    Mismatch → is_tampered = True.
    """
    from datetime import datetime, timezone

    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    file_bytes = read_file(doc.filePath)
    if file_bytes is None:
        raise HTTPException(status_code=404, detail="Physical file not found on server")

    recomputed   = hash_file(file_bytes)
    hash_matched = recomputed == doc.fileHash

    #doc.verified_by = current_user.user_id
    #doc.verified_at = datetime.now(timezone.utc)
    doc.is_tampered = not hash_matched
    db.commit()

    return DocumentVerifyResponse(
        document_id  = doc.document_id,
        hash_matched = hash_matched,
        is_tampered  = doc.is_tampered,
        message      = "Hash verified — document is intact" if hash_matched
                       else "TAMPER DETECTED — hash mismatch. File may have been modified after upload.",
    )
