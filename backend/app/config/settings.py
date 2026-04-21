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
SUPABASE_ACCESS_KEY = os.getenv("SUPABASE_ACCESS_KEY", "")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY", "")
SUPABASE_BUCKET_NAME = os.getenv("SUPABASE_BUCKET_NAME", "claimEase")
SUPABASE_STORAGE_ENDPOINT = os.getenv("SUPABASE_STORAGE_ENDPOINT", "https://dexmfhbbttjdvkqlhoos.storage.supabase.co/storage/v1/s3")