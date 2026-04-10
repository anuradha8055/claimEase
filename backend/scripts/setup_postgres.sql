CREATE USER postgres WITH PASSWORD 'mrs_pass';
CREATE DATABASE medical_reimburse_db OWNER postgres;
GRANT ALL PRIVILEGES ON DATABASE medical_reimburse_db TO postgres;

