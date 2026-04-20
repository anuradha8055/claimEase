import hashlib
import os
import boto3
from botocore.exceptions import ClientError
from app.config.settings import SUPABASE_STORAGE_ENDPOINT, SUPABASE_ACCESS_KEY, SUPABASE_SECRET_KEY, SUPABASE_BUCKET_NAME


def hash_file(file_bytes: bytes) -> str:
    """
    Computes SHA-256 hex digest of file bytes.
    Called on upload — stored in documents.file_hash.
    Called again on verification — compared against stored hash.
    Mismatch → is_tampered = True.
    """
    return hashlib.sha256(file_bytes).hexdigest()


def get_s3_client():
    """Initialize and return S3 client for Supabase storage."""
    # Validate Supabase configuration
    if not SUPABASE_ACCESS_KEY or not SUPABASE_ACCESS_KEY.strip():
        raise ValueError("SUPABASE_ACCESS_KEY is not configured. Please set it in .env file")
    
    if not SUPABASE_SECRET_KEY or not SUPABASE_SECRET_KEY.strip():
        raise ValueError("SUPABASE_SECRET_KEY is not configured. Please set it in .env file")
    
    if not SUPABASE_STORAGE_ENDPOINT:
        raise ValueError("SUPABASE_STORAGE_ENDPOINT is not configured")
    
    if not SUPABASE_BUCKET_NAME:
        raise ValueError("SUPABASE_BUCKET_NAME is not configured")
    
    print(f"Connecting to Supabase S3: {SUPABASE_STORAGE_ENDPOINT}")
    print(f"Using bucket: {SUPABASE_BUCKET_NAME}")
    print(f"Access Key ID: {SUPABASE_ACCESS_KEY[:10]}..." if SUPABASE_ACCESS_KEY else "Access Key: NOT SET")
    
    s3_client = boto3.client(
        's3',
        endpoint_url=SUPABASE_STORAGE_ENDPOINT,
        aws_access_key_id=SUPABASE_ACCESS_KEY,
        aws_secret_access_key=SUPABASE_SECRET_KEY,
        region_name='us-east-1'
    )
    return s3_client


def save_file_to_supabase(file_bytes: bytes, claim_id: str, original_filename: str) -> str:
    """
    Saves file to Supabase storage bucket.
    Returns the file path key stored in DB.
    
    Args:
        file_bytes: The file content as bytes
        claim_id: The claim ID (used for organizing files)
        original_filename: Original filename with extension
    
    Returns:
        The S3 key/path where file is stored
    """
    try:
        s3_client = get_s3_client()
        
        # Generate unique filename using file hash
        ext = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "bin"
        file_hash = hashlib.sha256(file_bytes).hexdigest()[:16]
        unique_name = f"{file_hash}.{ext}"
        
        # Create the S3 key path: claim_id/document_hash.ext
        s3_key = f"{claim_id}/{unique_name}"
        
        print(f"Uploading to bucket '{SUPABASE_BUCKET_NAME}' with key '{s3_key}'")
        
        # Upload to Supabase S3
        s3_client.put_object(
            Bucket=SUPABASE_BUCKET_NAME,
            Key=s3_key,
            Body=file_bytes,
            ContentType='application/octet-stream'
        )
        
        print(f"File uploaded successfully to Supabase: {s3_key}")
        return s3_key
        
    except ClientError as e:
        error_code = e.response['Error']['Code'] if e.response else 'Unknown'
        error_msg = e.response['Error']['Message'] if e.response else str(e)
        print(f"AWS ClientError uploading to Supabase [{error_code}]: {error_msg}")
        raise Exception(f"Failed to upload document to storage: {error_msg}")
    except Exception as e:
        print(f"Error uploading to Supabase: {str(e)}")
        raise Exception(f"Failed to upload document to storage: {str(e)}")


def read_file_from_supabase(s3_key: str) -> bytes | None:
    """
    Reads file from Supabase storage.
    
    Args:
        s3_key: The S3 key/path where file is stored (format: "claim_id/filename")
    
    Returns:
        File content as bytes, or None if file not found
    """
    try:
        if not s3_key or not s3_key.strip():
            print("Empty S3 key provided")
            return None
        
        s3_client = get_s3_client()
        
        print(f"Reading from Supabase bucket '{SUPABASE_BUCKET_NAME}' with key '{s3_key}'")
        
        # Get object from Supabase using the full key
        response = s3_client.get_object(
            Bucket=SUPABASE_BUCKET_NAME,
            Key=s3_key
        )
        
        file_content = response['Body'].read()
        print(f"Successfully read {len(file_content)} bytes from Supabase")
        return file_content
        
    except ClientError as e:
        error_code = e.response['Error']['Code'] if e.response else 'Unknown'
        error_msg = e.response['Error']['Message'] if e.response else str(e)
        print(f"AWS ClientError reading from Supabase [{error_code}]: {error_msg}")
        return None
    except Exception as e:
        print(f"Error reading from Supabase: {str(e)}")
        return None


# Keep local fallback functions for backward compatibility
def save_file_locally(file_bytes: bytes, claim_id: int, original_filename: str) -> str:
    """
    Deprecated: Local storage fallback.
    Now uses Supabase storage by default.
    """
    return save_file_to_supabase(file_bytes, str(claim_id), original_filename)


def read_file(file_path: str) -> bytes | None:
    """
    Deprecated: Local storage fallback.
    Now uses Supabase storage by default.
    """
    return read_file_from_supabase(file_path)
