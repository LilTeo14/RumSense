import asyncio
import json
import logging

logger = logging.getLogger(__name__)

class UDPTelemetryProtocol(asyncio.DatagramProtocol):
    def __init__(self):
        super().__init__()
        self.transport = None

    def connection_made(self, transport):
        self.transport = transport
        logger.info("UDP Server started and listening.")

    def datagram_received(self, data, addr):
        try:
            message = data.decode()
            data_json = json.loads(message)
            # Expected format from Nooploop:
            # {
            #   "uid": "...", "deviceName": "...",
            #   "data": { "pos": [x,y,z], "vel": [vx,vy,vz], "time": ..., "rxRssi": ... }
            # }
            
            self.process_telemetry(data_json)
            
        except json.JSONDecodeError:
            logger.warning(f"Received invalid JSON from {addr}")
        except Exception as e:
            logger.error(f"Error processing UDP packet: {e}")

    def process_telemetry(self, data: dict):
        # TODO: Integrate with storage/processing logic
        # For now, just log a sample to verify ingestion
        uid = data.get("uid")
        telemetry = data.get("data", {})
        pos = telemetry.get("pos")
        
        if uid and pos:
            logger.debug(f"Telemetry received - UID: {uid}, Pos: {pos}")
