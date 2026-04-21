"""
Supabase S3 Storage Service
Handles all file uploads, downloads, and signed URL generation
"""

import uuid
from datetime import datetime
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from supabase import create_client
from app.config.settings import (
    SUPABASE_ACCESS_KEY,
    SUPABASE_SECRET_KEY,
    SUPABASE_STORAGE_ENDPOINT,
    SUPABASE_BUCKET_NAME,
    SUPABASE_URL,
    SUPABASE_KEY,
)


class S3StorageService:
    """S3 Storage operations for Supabase"""
    
    def __init__(self):
        """Initialize S3 client with Supabase configuration"""
        self._validate_config()
        self.s3_client = self._create_client()
        self.bucket = SUPABASE_BUCKET_NAME
    
    @staticmethod
    def _validate_config() -> None:
        """Validate all required Supabase S3 configuration"""
        if not SUPABASE_ACCESS_KEY or not SUPABASE_ACCESS_KEY.strip():
            raise ValueError("SUPABASE_ACCESS_KEY not configured in .env")
        
        if not SUPABASE_SECRET_KEY or not SUPABASE_SECRET_KEY.strip():
            raise ValueError("SUPABASE_SECRET_KEY not configured in .env")
        
        if not SUPABASE_STORAGE_ENDPOINT or not SUPABASE_STORAGE_ENDPOINT.strip():
            raise ValueError("SUPABASE_STORAGE_ENDPOINT not configured in .env")
        
        if not SUPABASE_BUCKET_NAME or not SUPABASE_BUCKET_NAME.strip():
            raise ValueError("SUPABASE_BUCKET_NAME not configured in .env")
    
    @staticmethod
    def _create_client():
        """Create and return S3 client with Supabase compatibility settings"""
        config = Config(
            s3={
                'addressing_style': 'path',  # Critical for Supabase S3
                'signature_version': 's3v4',
            },
            region_name='us-east-1',
            retries={'max_attempts': 3, 'mode': 'standard'},
        )
        
        return boto3.client(
            's3',
            endpoint_url=SUPABASE_STORAGE_ENDPOINT,
            aws_access_key_id=SUPABASE_ACCESS_KEY,
            aws_secret_access_key=SUPABASE_SECRET_KEY,
            config=config,
        )
    
    def upload_file(
        self,
        file_bytes: bytes,
        claim_id: str,
        original_filename: str,
        content_type: str = 'application/octet-stream',
        document_type: str = None,
        doc_id: int = 1,
    ) -> str:
        """
        Upload file to Supabase S3 storage.
        
        Args:
            file_bytes: File content as bytes
            claim_id: Claim ID for organizing files
            original_filename: Original filename with extension
            content_type: MIME type of the file
            document_type: Type of document (e.g., "identity_doc", "hospital_bill")
            doc_id: Sequential document ID for this document type and claim
        
        Returns:
            Relative S3 key/path where file is stored (e.g., "claim-uuid/identity_doc-001.pdf")
        
        Raises:
            ClientError: If S3 upload fails
            Exception: For other upload failures
        """
        try:
            # Extract file extension
            ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else ""
            
            # Generate S3 key with document type and sequential ID format
            if document_type:
                # Format: {claim_id}/{documenttype}-{doc_id:03d}.{ext}
                # Example: claim-uuid/identity_doc-001.pdf
                filename = f"{document_type}-{doc_id:03d}.{ext}" if ext else f"{document_type}-{doc_id:03d}"
            else:
                # Fallback to UUID format if document_type not provided
                unique_id = str(uuid.uuid4())
                filename = f"{unique_id}_{original_filename}"
            
            s3_key = f"{claim_id}/{filename}"
            
            print(f"[S3 Upload] Uploading to bucket '{self.bucket}' with key '{s3_key}'")
            print(f"[S3 Upload] File size: {len(file_bytes)} bytes, Content-Type: {content_type}")
            
            # Upload to Supabase S3
            self.s3_client.put_object(
                Bucket=self.bucket,
                Key=s3_key,
                Body=file_bytes,
                ContentType=content_type,
                Metadata={
                    'uploaded-by': 'claimease-api',
                    'upload-time': datetime.utcnow().isoformat(),
                    'document_type': document_type or 'unknown',
                },
            )
            
            print(f"[S3 Upload] ✓ File uploaded successfully: {s3_key}")
            return s3_key
        
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_msg = e.response.get('Error', {}).get('Message', str(e))
            print(f"[S3 Upload] ✗ AWS ClientError [{error_code}]: {error_msg}")
            raise
        
        except Exception as e:
            print(f"[S3 Upload] ✗ Unexpected error: {str(e)}")
            raise
    
    def download_file(self, s3_key: str) -> bytes | None:
        """
        Download file from Supabase S3 storage.
        
        Args:
            s3_key: S3 key/path where file is stored
        
        Returns:
            File content as bytes, or None if not found
        """
        try:
            if not s3_key or not s3_key.strip():
                print("[S3 Download] Empty S3 key provided")
                return None
            
            print(f"[S3 Download] Reading from bucket '{self.bucket}' with key '{s3_key}'")
            
            response = self.s3_client.get_object(
                Bucket=self.bucket,
                Key=s3_key,
            )
            
            file_content = response['Body'].read()
            print(f"[S3 Download] ✓ Successfully read {len(file_content)} bytes")
            return file_content
        
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_msg = e.response.get('Error', {}).get('Message', str(e))
            print(f"[S3 Download] ✗ AWS ClientError [{error_code}]: {error_msg}")
            return None
        
        except Exception as e:
            print(f"[S3 Download] ✗ Unexpected error: {str(e)}")
            return None
    
    def delete_file(self, s3_key: str) -> bool:
        """
        Delete file from Supabase S3 storage.
        
        Args:
            s3_key: S3 key/path of file to delete
        
        Returns:
            True if deleted successfully, False otherwise
        """
        try:
            if not s3_key or not s3_key.strip():
                print("[S3 Delete] Empty S3 key provided")
                return False
            
            print(f"[S3 Delete] Deleting from bucket '{self.bucket}' with key '{s3_key}'")
            
            self.s3_client.delete_object(
                Bucket=self.bucket,
                Key=s3_key,
            )
            
            print(f"[S3 Delete] ✓ File deleted successfully")
            return True
        
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_msg = e.response.get('Error', {}).get('Message', str(e))
            print(f"[S3 Delete] ✗ AWS ClientError [{error_code}]: {error_msg}")
            return False
        
        except Exception as e:
            print(f"[S3 Delete] ✗ Unexpected error: {str(e)}")
            return False


# Singleton instance
_storage_service: S3StorageService | None = None


def get_storage_service() -> S3StorageService:
    """Get or create S3 storage service singleton"""
    global _storage_service
    if _storage_service is None:
        _storage_service = S3StorageService()
    return _storage_service


# Supabase client for signed URL generation
_supabase_client = None


def _get_supabase_client():
    """Initialize and return Supabase client for signed URL operations"""
    global _supabase_client
    if _supabase_client is None:
        if not SUPABASE_URL or not SUPABASE_KEY:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be configured in .env")
        _supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
    return _supabase_client


def generate_view_url(file_path: str, expires_in: int = 3600) -> str | None:
    """
    Generate a temporary signed URL for viewing a document in Supabase storage.
    
    Args:
        file_path: Relative path to the file (e.g., 'claim-uuid/filename.pdf')
        expires_in: URL expiration time in seconds (default 3600 = 1 hour)
    
    Returns:
        Signed URL string, or None if generation fails
    
    Raises:
        ValueError: If file_path is empty or configuration is missing
    """
    if not file_path or not file_path.strip():
        print("[Signed URL] Empty file path provided")
        return None
    
    try:
        supabase = _get_supabase_client()
        
        print(f"[Signed URL] Generating signed URL for: {file_path}")
        print(f"[Signed URL] Expiration: {expires_in} seconds")
        
        # Create signed URL using Supabase storage API
        response = supabase.storage.from_(SUPABASE_BUCKET_NAME).create_signed_url(
            path=file_path,
            expires_in=expires_in,
        )
        
        # response is typically {"signedURL": "https://..."}
        signed_url = response.get("signedURL") if isinstance(response, dict) else str(response)
        
        if not signed_url:
            print("[Signed URL] ✗ No URL returned from Supabase")
            return None
        
        print(f"[Signed URL] ✓ Signed URL generated successfully")
        return signed_url
    
    except ValueError as e:
        print(f"[Signed URL] ✗ Configuration error: {str(e)}")
        return None
    
    except Exception as e:
        error_msg = str(e)
        print(f"[Signed URL] ✗ Failed to generate signed URL: {error_msg}")
        
        # Check for common Supabase errors
        if "not found" in error_msg.lower() or "404" in error_msg:
            print(f"[Signed URL] → File does not exist in storage: {file_path}")
        
        return None

