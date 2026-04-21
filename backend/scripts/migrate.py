"""
Database Migration Script
Adds the 'filename' column to upload_documents table
"""

import os
import sys
import psycopg2
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(env_path)

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("ERROR: DATABASE_URL not set in .env file")
    sys.exit(1)

# SQL migration
MIGRATION_SQL = """
BEGIN TRANSACTION;

ALTER TABLE upload_documents
ADD COLUMN IF NOT EXISTS filename VARCHAR(255);

UPDATE upload_documents
SET filename = SUBSTRING(filepath FROM POSITION('_' IN filepath) + 1)
WHERE filename IS NULL OR filename = '';

ALTER TABLE upload_documents
ALTER COLUMN filename SET NOT NULL;

COMMIT;
"""

def run_migration():
    """Execute the database migration"""
    try:
        print("[Migration] Connecting to database...")
        print(f"[Migration] Database URL: {DATABASE_URL[:50]}...")
        
        # Connect to database
        conn = psycopg2.connect(DATABASE_URL)
        cursor = conn.cursor()
        
        print("[Migration] ✓ Connected successfully")
        print("[Migration] Executing migration...")
        
        # Execute migration
        cursor.execute(MIGRATION_SQL)
        conn.commit()
        
        print("[Migration] ✓ Migration completed successfully!")
        print("[Migration] Added 'filename' column to upload_documents table")
        
        cursor.close()
        conn.close()
        
        return True
    
    except psycopg2.errors.DuplicateColumn as e:
        print("[Migration] ⚠️  Column already exists - this is OK")
        print(f"[Migration] Details: {str(e)}")
        return True
    
    except Exception as e:
        print(f"[Migration] ✗ Error: {str(e)}")
        return False
    
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()

if __name__ == "__main__":
    print("=" * 70)
    print("Database Migration: Add filename column to upload_documents")
    print("=" * 70)
    
    success = run_migration()
    
    if success:
        print("\n✅ Migration successful! You can now upload documents.")
        sys.exit(0)
    else:
        print("\n❌ Migration failed. Please check the error above.")
        sys.exit(1)
