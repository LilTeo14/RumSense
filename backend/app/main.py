from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from contextlib import asynccontextmanager
import asyncio
import logging
from typing import List
from app.core.udp_server import UDPServer

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

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start UDP Server Thread
    loop = asyncio.get_running_loop()
    
    # Initialize implementation strictly matching visor_api.py approach but threaded
    udp_server = UDPServer(
        host=UDP_HOST, 
        port=UDP_PORT, 
        broadcast_callback=manager.broadcast,
        loop=loop
    )
    
    udp_server.start()
    
    yield
    
    # Shutdown: Stop UDP Server
    udp_server.stop()
    udp_server.join(timeout=2.0)
    logger.info("UDP Server stopped")

app = FastAPI(title="RumSense API", lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "RumSense API is running", "udp_in_port": UDP_PORT, "mode": "threaded_socket"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive; we only send data from server to client
            # but we need to await something to keep the loop running.
            # Receiving text prevents the handler from exiting.
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

@app.get("/health")
async def health_check():
    return {"status": "ok"}
