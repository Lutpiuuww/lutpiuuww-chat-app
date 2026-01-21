# backend/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Ini akan membuat file 'chat.db' otomatis nanti
SQLALCHEMY_DATABASE_URL = "sqlite:///./chat.db"

# connect_args={"check_same_thread": False} wajib untuk SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Fungsi helper untuk mengambil koneksi database
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()