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
    SUPABASE_URL,
    SUPABASE_KEY,
    SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_ACCESS_KEY,
    SUPABASE_SECRET_KEY,
    SUPABASE_STORAGE_ENDPOINT,
    SUPABASE_BUCKET_NAME,
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
            signature_version='s3v4',
            s3={
                'addressing_style': 'path',  # Critical for Supabase S3
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
            
            print(f"[S3 Upload] [OK] File uploaded successfully: {s3_key}")
            return s3_key
        
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_msg = e.response.get('Error', {}).get('Message', str(e))
            print(f"[S3 Upload] [FAIL] AWS ClientError [{error_code}]: {error_msg}")
            raise
        
        except Exception as e:
            print(f"[S3 Upload] [FAIL] Unexpected error: {str(e)}")
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
            print(f"[S3 Download] [OK] Successfully read {len(file_content)} bytes")
            return file_content
        
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_msg = e.response.get('Error', {}).get('Message', str(e))
            print(f"[S3 Download] [FAIL] AWS ClientError [{error_code}]: {error_msg}")
            return None
        
        except Exception as e:
            print(f"[S3 Download] [FAIL] Unexpected error: {str(e)}")
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
            
            print(f"[S3 Delete] [OK] File deleted successfully")
            return True
        
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            error_msg = e.response.get('Error', {}).get('Message', str(e))
            print(f"[S3 Delete] [FAIL] AWS ClientError [{error_code}]: {error_msg}")
            return False
        
        except Exception as e:
            print(f"[S3 Delete] [FAIL] Unexpected error: {str(e)}")
            return False


# Singleton instance
_storage_service: S3StorageService | None = None


def get_storage_service() -> S3StorageService:
    """Get or create S3 storage service singleton"""
    global _storage_service
    if _storage_service is None:
        _storage_service = S3StorageService()
    return _storage_service


def generate_view_url(file_path: str, expires_in: int = 3600) -> str | None:
    """
    Generate a temporary signed URL for viewing a private document in Supabase Storage.
    
    Args:
        file_path: Relative path to the file (e.g., 'claim-uuid/filename.pdf')
        expires_in: URL expiration time in seconds (default 3600 = 1 hour)
    
    Returns:
        Signed URL string, or None if generation fails
    """
    if not file_path or not file_path.strip():
        print("[Signed URL] Empty file path provided")
        return None
    
    try:
        storage = get_storage_service()

        if not SUPABASE_URL or not SUPABASE_URL.strip():
            print("[Signed URL] [FAIL] SUPABASE_URL not configured")
        else:
            supabase_api_key = (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY).strip()
            if not supabase_api_key:
                print("[Signed URL] [FAIL] Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_KEY is configured")
            else:
                try:
                    print(f"[Signed URL] Generating Supabase signed URL for: {file_path}")
                    print(f"[Signed URL] Bucket: {SUPABASE_BUCKET_NAME}, Expiration: {expires_in}s")

                    supabase = create_client(SUPABASE_URL, supabase_api_key)
                    response = supabase.storage.from_(SUPABASE_BUCKET_NAME).create_signed_url(file_path, expires_in)
                    signed_url = response.get("signedURL") or response.get("signedUrl")

                    if signed_url:
                        print("[Signed URL] [OK] Supabase signed URL generated successfully")
                        return signed_url

                    print(f"[Signed URL] [FAIL] Supabase returned no signed URL. Response: {response}")
                except Exception as e:
                    print(f"[Signed URL] [FAIL] Supabase SDK signing failed: {str(e)}")

        # Fallback: use S3-compatible presigned URL if Supabase SDK signing fails.
        # This keeps document view functional even when REST key is invalid/rotated.
        print("[Signed URL] Falling back to S3 presigned URL")
        signed_url = storage.s3_client.generate_presigned_url(
            "get_object",
            Params={
                "Bucket": storage.bucket,
                "Key": file_path,
            },
            ExpiresIn=expires_in,
        )
        if signed_url:
            print("[Signed URL] [OK] S3 presigned URL generated successfully")
            return signed_url

        print("[Signed URL] [FAIL] S3 presigned URL generation returned empty result")
        return None
    
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        error_msg = e.response.get('Error', {}).get('Message', str(e))
        print(f"[Signed URL] [FAIL] S3 ClientError [{error_code}]: {error_msg}")
        return None
    
    except Exception as e:
        print(f"[Signed URL] [FAIL] Failed to generate signed URL: {str(e)}")
        return None

