import os
import psycopg2

conn = psycopg2.connect(
    host="aws-0-ap-northeast-1.pooler.supabase.com",
    database="postgres",
    user="postgres.tpqvmupdvxqloykqkpwj",
    password="Owaies@2026",
    port=6543
)

cur = conn.cursor()

# Query columns for admin
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'admin';")
print("admin columns:", cur.fetchall())

# Query columns for quiz
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'quiz';")
print("quiz columns:", cur.fetchall())

# Query columns for questions
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'questions';")
print("questions columns:", cur.fetchall())

cur.close()
conn.close()
