import os
import psycopg2

required = ("DB_HOST", "DB_NAME", "DB_USER", "DB_PASS", "DB_PORT")
missing = [key for key in required if not os.environ.get(key)]
if missing:
    raise SystemExit(
        "Missing database settings: "
        + ", ".join(missing)
        + ". Configure them in the environment before running this script."
    )

try:
    port = int(os.environ["DB_PORT"])
except ValueError as exc:
    raise SystemExit("DB_PORT must be an integer.") from exc

conn = psycopg2.connect(
    host=os.environ["DB_HOST"],
    database=os.environ["DB_NAME"],
    user=os.environ["DB_USER"],
    password=os.environ["DB_PASS"],
    port=port,
    sslmode=os.getenv("DB_SSLMODE", "require"),
)

try:
    with conn.cursor() as cur:
        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'admin';")
        print("admin columns:", cur.fetchall())

        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'quiz';")
        print("quiz columns:", cur.fetchall())

        cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'questions';")
        print("questions columns:", cur.fetchall())
finally:
    conn.close()
