import os
import sqlite3
from database import engine, Base
import models # Ensure all models are registered with Base metadata

# 1. Create tables based on our SQLAlchemy models
print("[*] Creating SQLite tables...")
Base.metadata.drop_all(bind=engine) # start fresh
Base.metadata.create_all(bind=engine)

# 2. Parse SQL dump and execute INSERT statements
sql_path = "../globalMobilityDatabase(1).sql"
print(f"[*] Reading {sql_path}...")

conn = sqlite3.connect("./globalmobility.db")
cursor = conn.cursor()

count = 0
with open(sql_path, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()
        if line.startswith("INSERT INTO "):
            # SQLite doesn't have the 'public' schema that PostgreSQL uses
            line = line.replace("INSERT INTO public.", "INSERT INTO ")
            
            try:
                cursor.execute(line)
                count += 1
            except Exception as e:
                print(f"Error executing: {line[:50]}...\n{e}")

conn.commit()
conn.close()
print(f"[*] Done. Inserted {count} records into SQLite.")
