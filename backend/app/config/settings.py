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