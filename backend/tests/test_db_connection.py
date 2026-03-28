import psycopg2

connection = psycopg2.connect(
    host="localhost",
    database="medical_reimbursement_db",
    user="postgres",
    password="admin123",
    port="5432"
)

print("Database connected successfully")

connection.close()