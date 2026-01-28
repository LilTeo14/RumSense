import socket
import threading
import json
import logging
import asyncio
from app.core.database import record_position

logger = logging.getLogger(__name__)

class UDPServer(threading.Thread):
    def __init__(self, host: str, port: int, broadcast_callback, loop: asyncio.AbstractEventLoop):
        super().__init__()
        self.host = host
        self.port = port
        self.broadcast_callback = broadcast_callback
        self.loop = loop
        self.running = True
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.daemon = True # Daemon thread exits when main program exits

    def run(self):
        try:
            # Important: Bind to 0.0.0.0 inside Docker to receive traffic from mapped ports
            self.sock.bind((self.host, self.port))
            logger.info(f"👀 UDP Server (Threaded) listening on {self.host}:{self.port}")
            
            while self.running:
                try:
                    # Blocking receive, exactly like visor_api.py
                    data, addr = self.sock.recvfrom(4096)
                    
                    if not data:
                        continue

                    try:
                        message = data.decode('utf-8')
                        
                        # Validate JSON
                        json_data = json.loads(message)

                        # Save to Database
                        try:
                            if "data" in json_data and "pos" in json_data["data"]:
                                pos = json_data["data"]["pos"]
                                record_position(
                                    uid=json_data.get("uid"),
                                    device_name=json_data.get("deviceName"),
                                    x=pos[0] if len(pos) > 0 else 0.0,
                                    y=pos[1] if len(pos) > 1 else 0.0,
                                    z=pos[2] if len(pos) > 2 else 0.0,
                                    timestamp=json_data["data"].get("time")
                                )
                        except Exception as e:
                            logger.error(f"❌ DB Logic Error: {e}")

                        # Bridge to Async Loop for Websocket Broadcast
                        if self.broadcast_callback and self.loop:
                            future = asyncio.run_coroutine_threadsafe(
                                self.broadcast_callback(message), 
                                self.loop
                            )
                            
                    except UnicodeDecodeError:
                        logger.warning(f"⚠️ Received non-utf8 data from {addr}")
                    except json.JSONDecodeError:
                        logger.warning(f"⚠️ Received invalid JSON from {addr}")
                    except Exception as e:
                        logger.error(f"❌ Error processing message: {e}")

                except OSError as e:
                    if self.running:
                        logger.error(f"Error receiving data: {e}")
                        
        except Exception as e:
            logger.error(f"❌ CRITICAL: Failed to bind UDP socket on {self.host}:{self.port}. Error: {e}")
        finally:
            self.sock.close()
            logger.info("👋 UDP Server thread stopped")

    def stop(self):
        self.running = False
        try:
            self.sock.close()
        except:
            pass
