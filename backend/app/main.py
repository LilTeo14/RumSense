from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
import logging
import json
from typing import List, Optional
from app.core.udp_server import UDPServer
from app.core.database import init_db, get_all_tags, check_hibernation, get_history_range

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

UDP_PORT = 5000
UDP_HOST = "0.0.0.0"

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)
        logger.info(f"WebSocket client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to client: {e}")

manager = ConnectionManager()

async def hibernation_monitor():
    while True:
        try:
            # Check every 2 seconds, timeout tags older than 5 seconds
            # Using async wrapper if needed, but the function is sync. 
            # Since sqlite is fast for small updates, calling directly is OK or use to_thread
            await asyncio.to_thread(check_hibernation, 5.0)
        except Exception as e:
            logger.error(f"Hibernation monitor error: {e}")
        await asyncio.sleep(2)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize DB and Start UDP Server Thread
    init_db()
    
    loop = asyncio.get_running_loop()
    
    # Initialize implementation strictly matching visor_api.py approach but threaded
    udp_server = UDPServer(
        host=UDP_HOST, 
        port=UDP_PORT, 
        broadcast_callback=manager.broadcast,
        loop=loop
    )
    
    udp_server.start()
    
    # Start monitor task
    monitor_task = asyncio.create_task(hibernation_monitor())
    
    yield
    
    # Shutdown
    monitor_task.cancel()
    udp_server.stop()
    udp_server.join(timeout=2.0)
    logger.info("UDP Server stopped")

app = FastAPI(title="RumSense API", lifespan=lifespan)

# Add CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "RumSense API is running", "udp_in_port": UDP_PORT, "mode": "threaded_socket"}

@app.get("/tags")
async def get_tags_endpoint():
    return {"tags": await asyncio.to_thread(get_all_tags)}

@app.get("/history")
async def get_history(start: int, end: int):
    # Expects timestamps in MS
    return await asyncio.to_thread(get_history_range, start, end)

@app.get("/stats")
async def get_stats(start: int, end: int):
    # Expects timestamps in MS
    from app.core.database import calculate_stats
    return await asyncio.to_thread(calculate_stats, start, end)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
