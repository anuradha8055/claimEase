import os
from dotenv import load_dotenv

# Load .env variables
load_dotenv()

# Get database url
DATABASE_URL = os.getenv("DATABASE_URL")
SECRET_KEY: str   = os.getenv("SECRET_KEY", "change-this-in-production-to-a-long-random-string")
ALGORITHM: str    = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES: int  = 30
REFRESH_TOKEN_EXPIRE_DAYS: int    = 7

# Supabase Configuration for S3 Storage
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://dexmfhbbttjdvkqlhoos.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_ACCESS_KEY = os.getenv("SUPABASE_ACCESS_KEY", "")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY", "")
SUPABASE_BUCKET_NAME = os.getenv("SUPABASE_BUCKET_NAME", "claimEase")
SUPABASE_STORAGE_ENDPOINT = os.getenv("SUPABASE_STORAGE_ENDPOINT", "https://dexmfhbbttjdvkqlhoos.storage.supabase.co/storage/v1/s3")

# SMTP Configuration (for employee email notifications)
SMTP_HOST = os.getenv("SMTP_HOST", "")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", "")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"