from fastapi import FastAPI
from contextlib import asynccontextmanager
import asyncio
import logging
from app.core.udp_server import UDPTelemetryProtocol

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

UDP_PORT = 7000
UDP_HOST = "0.0.0.0"

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start UDP Server
    loop = asyncio.get_running_loop()
    transport, protocol = await loop.create_datagram_endpoint(
        lambda: UDPTelemetryProtocol(),
        local_addr=(UDP_HOST, UDP_PORT)
    )
    logger.info(f"UDP Server listening on {UDP_HOST}:{UDP_PORT}")
    
    yield
    
    # Shutdown: Close UDP Server
    transport.close()
    logger.info("UDP Server stopped")

app = FastAPI(title="RumSense API", lifespan=lifespan)

@app.get("/")
async def root():
    return {"message": "RumSense API is running", "udp_port": UDP_PORT}

@app.get("/health")
async def health_check():
    return {"status": "ok"}
