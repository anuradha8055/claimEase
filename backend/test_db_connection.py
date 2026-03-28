import psycopg2

try:
    connection = psycopg2.connect(
        host="localhost",
        database="medical_reimburse_db",
        user="postgres",
        password="Shreya@21",
        port="5432"
    )

    print("Database connected successfully!")

    connection.close()

except Exception as e:
    print("Connection failed")
    print(e)