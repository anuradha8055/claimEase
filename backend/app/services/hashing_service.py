import hashlib
import os


def hash_file(file_bytes: bytes) -> str:
    """
    Computes SHA-256 hex digest of file bytes.
    Called on upload — stored in documents.file_hash.
    Called again on verification — compared against stored hash.
    Mismatch → is_tampered = True.
    """
    return hashlib.sha256(file_bytes).hexdigest()


def save_file_locally(file_bytes: bytes, claim_id: int, original_filename: str) -> str:
    """
    Saves file to local uploads folder (MinIO replacement for dev).
    Returns the file_path (relative key) stored in DB.
    In production: replace with MinIO put_object call.
    """
    ext         = original_filename.rsplit(".", 1)[-1].lower() if "." in original_filename else "bin"
    unique_name = f"{hashlib.sha256(file_bytes).hexdigest()[:16]}.{ext}"
    folder      = os.path.join("uploads", str(claim_id))
    os.makedirs(folder, exist_ok=True)
    path        = os.path.join(folder, unique_name)
    with open(path, "wb") as f:
        f.write(file_bytes)
    return path


def read_file(file_path: str) -> bytes | None:
    """Reads file from local storage. Returns None if file missing."""
    try:
        with open(file_path, "rb") as f:
            return f.read()
    except FileNotFoundError:
        return None
