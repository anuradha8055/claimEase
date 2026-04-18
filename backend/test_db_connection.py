import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

try:
    # Use your Supabase connection details
    connection = psycopg2.connect(
        host="db.dexmfhbbttjdvkqlhoos.supabase.co",
        database="postgres",
        user="postgres",
        password="claimEase@21", # Use your actual Supabase password
        port="6543", # Port 6543 is recommended for FastAPI/Supabase
        sslmode="require" # Supabase strictly requires SSL
    )

    print("✅ Supabase Database connected successfully!")

    # Perform a simple test query
    cursor = connection.cursor()
    cursor.execute("SELECT 1;")
    result = cursor.fetchone()
    print(f"Query Test (SELECT 1): {result}")

    cursor.close()
    connection.close()

except Exception as e:
    print("❌ Connection failed")
    print(e)