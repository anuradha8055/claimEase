"""
Document Management Routes
Handles document uploads, retrieval, and verification
"""

from datetime import datetime, timezone
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from botocore.exceptions import ClientError

from app.config.database import get_db
from app.core.dependencies import get_current_employee, get_current_user
from app.models.user_model import User
from app.models.document_model import Document
from app.schemas.document_schema import DocumentResponse, DocumentVerifyResponse
from app.services.storage_service import get_storage_service, generate_view_url
from app.services.hashing_service import hash_file, read_file_from_supabase

router = APIRouter(tags=["Document Management"])


@router.post("/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(
    claim_id: UUID = Form(...),
    documentType: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_employee),
) -> Document:
    """
    Upload a document for a claim to Supabase S3 storage.
    
    Features:
    - Validates file type (pdf, jpg, jpeg, png)
    - Computes SHA-256 hash for tamper detection
    - Uploads to Supabase S3 with unique S3 key
    - Saves metadata to PostgreSQL database
    
    Args:
        claim_id: UUID of the claim
        documentType: Type of document (e.g., "Hospital Bill", "Discharge Summary")
        file: The file to upload
        db: Database session
        current_user: Currently authenticated employee
    
    Returns:
        Document: Created document record with metadata
    
    Raises:
        HTTPException: For validation errors or upload failures
    """
    # Validate file type
    allowed_types = {"pdf", "jpg", "jpeg", "png"}
    ext = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    
    if ext not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"File type '.{ext}' not allowed. Allowed: {', '.join(allowed_types)}",
        )
    
    # Read file bytes
    file_bytes = await file.read()
    
    # Validate file size (10 MB limit)
    max_size = 10 * 1024 * 1024
    if len(file_bytes) > max_size:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is {max_size / (1024*1024):.0f}MB",
        )
    
    # Compute SHA-256 hash for tamper detection
    try:
        file_hash = hash_file(file_bytes)
        print(f"[Document Upload] File hash computed: {file_hash[:16]}...")
    except Exception as e:
        print(f"[Document Upload] Hash computation failed: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to compute file hash")
    
    # Get next document ID for this document type and claim
    try:
        existing_docs = db.query(Document).filter(
            Document.claim_id == claim_id,
            Document.documentType == documentType,
        ).all()
        
        next_doc_id = len(existing_docs) + 1
        print(f"[Document Upload] Document type '{documentType}' for claim {claim_id}: next doc_id = {next_doc_id}")
    except Exception as e:
        print(f"[Document Upload] Failed to query existing documents: {str(e)}")
        next_doc_id = 1
    
    # Upload to Supabase S3
    storage_service = get_storage_service()
    
    try:
        s3_key = storage_service.upload_file(
            file_bytes=file_bytes,
            claim_id=str(claim_id),
            original_filename=file.filename,
            content_type=file.content_type or "application/octet-stream",
            document_type=documentType,
            doc_id=next_doc_id,
        )
        print(f"[Document Upload] S3 upload successful: {s3_key}")
    
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code", "Unknown")
        error_msg = e.response.get("Error", {}).get("Message", str(e))
        print(f"[Document Upload] S3 ClientError [{error_code}]: {error_msg}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload file to storage: {error_msg}",
        )
    
    except Exception as e:
        print(f"[Document Upload] Unexpected upload error: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to upload file to storage",
        )
    
    # Create Document record in database
    try:
        # Extract standardized filename from s3_key (format: {documenttype}-{doc_id:03d}.{ext})
        standardized_filename = s3_key.split("/")[-1] if "/" in s3_key else s3_key
        
        doc = Document(
            claim_id=claim_id,
            documentType=documentType,
            fileName=standardized_filename,
            fileSize=len(file_bytes),
            fileHash=file_hash,
            filePath=s3_key,
            is_tampered=False,
            uploadTime=datetime.now(timezone.utc),
        )
        
        db.add(doc)
        db.commit()
        db.refresh(doc)
        
        print(f"[Document Upload] [OK] Document saved to database: {doc.document_id}")
        return doc
    
    except Exception as e:
        db.rollback()
        print(f"[Document Upload] Database save failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to save document metadata to database",
        )


@router.get("/view/{document_id}", tags=["Document Management"])
def get_document_view_url(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Generate a temporary signed URL for viewing a document.
    The URL is valid for 1 hour and can be used to directly access the file in a browser.
    
    Args:
        document_id: UUID of the document to view
        db: Database session
        current_user: Currently authenticated user
    
    Returns:
        JSON response with signed URL: {"url": "https://...", "expires_in": 3600}
    
    Raises:
        HTTPException: If document not found or URL generation fails
    """
    # Fetch document from database
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    
    if not doc:
        print(f"[View Document] Document not found: {document_id}")
        raise HTTPException(status_code=404, detail="Document not found")
    
    print(f"[View Document] Generating view URL for document: {document_id}")
    print(f"[View Document] File path: {doc.filePath}")
    
    # Generate signed URL
    signed_url = generate_view_url(doc.filePath, expires_in=3600)
    
    if not signed_url:
        print(f"[View Document] Failed to generate signed URL for: {doc.filePath}")
        raise HTTPException(
            status_code=500,
            detail="Failed to generate view URL. File may not exist in storage.",
        )
    
    print(f"[View Document] [OK] View URL generated successfully")
    
    return {
        "url": signed_url,
        "expires_in": 3600,
        "document_id": str(document_id),
        "file_name": doc.fileName,
    }


@router.get("/claim/{claim_id}", response_model=list[DocumentResponse])
def get_claim_documents(
    claim_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[Document]:
    """
    Retrieve all documents for a specific claim.
    
    Args:
        claim_id: UUID of the claim
        db: Database session
        current_user: Currently authenticated user
    
    Returns:
        List of Document records for the claim
    """
    documents = db.query(Document).filter(Document.claim_id == claim_id).all()
    print(f"[Get Claim Documents] Found {len(documents)} documents for claim {claim_id}")
    return documents


@router.post("/{document_id}/verify", response_model=DocumentVerifyResponse)
def verify_document(
    document_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """
    Verify document integrity by comparing stored hash with recomputed hash.
    Used by scrutiny officers to detect tampering.
    
    Args:
        document_id: UUID of the document to verify
        db: Database session
        current_user: Currently authenticated user
    
    Returns:
        DocumentVerifyResponse with verification result
    
    Raises:
        HTTPException: If document not found or verification fails
    """
    # Fetch document from database
    doc = db.query(Document).filter(Document.document_id == document_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    
    print(f"[Document Verify] Verifying document {document_id}")
    
    # Retrieve file from S3 storage
    storage_service = get_storage_service()
    file_bytes = storage_service.download_file(doc.filePath)
    
    if file_bytes is None:
        print(f"[Document Verify] File not found in storage: {doc.filePath}")
        raise HTTPException(
            status_code=404,
            detail="Document file not found in storage",
        )
    
    # Recompute hash and compare
    try:
        recomputed_hash = hash_file(file_bytes)
        hash_matched = recomputed_hash == doc.fileHash
        
        doc.is_tampered = not hash_matched
        db.commit()
        
        status = "[OK] Intact" if hash_matched else "[FAIL] TAMPERED"
        print(f"[Document Verify] Verification complete [{status}]")
        
        return DocumentVerifyResponse(
            document_id=doc.document_id,
            hash_matched=hash_matched,
            is_tampered=doc.is_tampered,
            message=(
                "Hash verified — document is intact"
                if hash_matched
                else "WARNING: TAMPER DETECTED -- hash mismatch. File may have been modified after upload."
            ),
        )
    
    except Exception as e:
        print(f"[Document Verify] Verification failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to verify document integrity",
        )

