from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from typing import List, Dict
import json
import os
import shutil
from datetime import datetime

from . import models, database

# 1. Inisialisasi Database (Membuat tabel otomatis jika chat.db dihapus)
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI()

# 2. Setup Folder Upload
os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# 3. Setup CORS (Agar React bisa akses)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- MANAGER KONEKSI (MULTI-ROOM) ---
class ConnectionManager:
    def __init__(self):
        # Struktur Data: {"NamaRoom": [SocketUser1, SocketUser2]}
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, room_id: str):
        await websocket.accept()
        if room_id not in self.active_connections:
            self.active_connections[room_id] = []
        self.active_connections[room_id].append(websocket)

    def disconnect(self, websocket: WebSocket, room_id: str):
        if room_id in self.active_connections:
            if websocket in self.active_connections[room_id]:
                self.active_connections[room_id].remove(websocket)
            # Hapus key room jika kosong untuk hemat memori
            if not self.active_connections[room_id]:
                del self.active_connections[room_id]

    async def broadcast(self, message: str, room_id: str):
        # Hanya kirim pesan ke user yang ada di room_id tersebut
        if room_id in self.active_connections:
            for connection in self.active_connections[room_id]:
                await connection.send_text(message)

manager = ConnectionManager()

# --- API ENDPOINTS ---

@app.get("/")
def read_root():
    return {"status": "Lutpiuuww Chat System Online"}

# API Upload Gambar
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{file.filename}"
    file_location = f"uploads/{filename}"
    
    with open(file_location, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    return {"url": f"https://charier-patsy-cirrhotic.ngrok-free.dev/uploads/{filename}"}

# API Ambil History Chat (Per Room)
@app.get("/messages/{room_id}")
def get_messages(room_id: str, db: Session = Depends(database.get_db)):
    # Filter pesan berdasarkan room_id
    return db.query(models.Message).filter(models.Message.room_id == room_id).all()

# --- WEBSOCKET UTAMA ---
@app.websocket("/ws/{room_id}/{client_id}")
async def websocket_endpoint(websocket: WebSocket, room_id: str, client_id: str, db: Session = Depends(database.get_db)):
    await manager.connect(websocket, room_id)
    try:
        # Kirim history chat lama saat user baru masuk room
        # (Opsional: Bisa juga diambil lewat fetch API di frontend)
        history = db.query(models.Message).filter(models.Message.room_id == room_id).all()
        for msg in history:
            # Format data untuk dikirim ke frontend
            old_msg = {
                "sender": msg.sender,
                "content": msg.content,
                "type": msg.msg_type,
                "file_url": msg.file_url,
                "timestamp": str(msg.timestamp),
                "room": msg.room_id
            }
            # Kirim hanya ke user yang baru connect
            await websocket.send_text(json.dumps(old_msg))

        # Loop utama menunggu pesan baru
        while True:
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # 1. Simpan ke Database
            new_msg = models.Message(
                room_id=room_id,
                sender=message_data['sender'],
                content=message_data.get('content', ''),
                msg_type=message_data.get('type', 'text'),
                file_url=message_data.get('file_url', None)
            )
            db.add(new_msg)
            db.commit()
            
            # 2. Broadcast ke semua orang DI ROOM YANG SAMA
            response = {
                "sender": new_msg.sender,
                "content": new_msg.content,
                "type": new_msg.msg_type,
                "file_url": new_msg.file_url,
                "timestamp": str(new_msg.timestamp),
                "room": room_id
            }
            await manager.broadcast(json.dumps(response), room_id)
            
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_id)